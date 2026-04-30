// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchProducts,
  type Product,
} from "@/lib/features/products/productSlice";

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((s) => s.products);

  useEffect(() => {
    if (status === "idle") dispatch(fetchProducts());
  }, [status, dispatch]);

  return (
    <main className="flex-1 p-8 bg-zinc-50 dark:bg-black">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Shop</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items.length > 0 && `${items.length} products`}
          </p>
        </header>

        {status === "loading" && <ProductGridSkeleton />}
        {status === "failed" && (
          <p className="text-red-500 text-sm">Error: {error}</p>
        )}
        {status === "succeeded" && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => router.push(`/products/${product.id}`)}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  return (
    <li
      onClick={onClick}
      className="cursor-pointer group overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-sky-500 hover:shadow-md transition-all"
    >
      {/* Image */}
      <div className="h-44 w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 text-xs">
            No image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm leading-snug">{product.name}</h3>
          {product.status === "archived" && (
            <span className="shrink-0 rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
              archived
            </span>
          )}
        </div>

        <p className="text-xs text-zinc-400 mb-3">{product.supplier}</p>

        {product.description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">
            €{Number(product.price).toFixed(2)}
          </span>
          <span
            className={`text-xs ${
              product.stock_quantity <= product.reorder_threshold
                ? "text-red-400"
                : "text-zinc-400"
            }`}
          >
            {product.stock_quantity <= product.reorder_threshold
              ? `⚠ Low stock (${product.stock_quantity})`
              : `In stock: ${product.stock_quantity}`}
          </span>
        </div>
      </div>
    </li>
  );
}

function ProductGridSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        >
          <div className="h-44 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-3 w-1/3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-6 w-1/4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}
