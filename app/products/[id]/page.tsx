"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchProductById,
  fetchSimilar,
} from "@/lib/features/products/productSlice";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const current = useAppSelector((s) => s.products.current);
  const similar = useAppSelector((s) => s.products.similar);
  const status = useAppSelector((s) => s.products.currentStatus);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
      dispatch(fetchSimilar(id));
    }
  }, [id, dispatch]);

  if (status === "loading") return <LoadingSkeleton />;
  if (status === "failed" || !current)
    return <div className="p-8 text-red-500">Product not found.</div>;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-sm text-zinc-500 hover:text-zinc-300 mb-6 flex items-center gap-1"
      >
        ← Back
      </button>

      {/* Main product */}
      <div className="grid md:grid-cols-2 gap-10 mb-16">
        {/* Image */}
        <div className="rounded-xl overflow-hidden bg-zinc-900 aspect-square">
          {current.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.image_url}
              alt={current.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">
              No image
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-xs text-[#B0A090]  uppercase tracking-widest mb-2">
              {current.supplier}
            </p>
            <h1 className="text-3xl font-light text-[#2C2416] dark:text-zinc-100 mb-3">
              {current.name}
            </h1>

            <div className="flex flex-wrap gap-2 mb-6">
              {/* Category badge */}
              {current.category && (
                <span className="inline-block text-xs px-3 py-1 rounded-full bg-[#EDE8E0] text-[#8C7E6E] mb-4">
                  {current.category.name}
                </span>
              )}

              <p className="text-[#8C7E6E] text-sm leading-relaxed mb-6">
                {current.description || "No description available."}
              </p>
              {/* Stock as in the main page */}
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs font-mono text-[#B0A090]">
                  {current.sku}
                </span>
                <span className="text-[#B0A090]">·</span>
                <span
                  className={`text-xs ${
                    current.stock_quantity <= current.reorder_threshold
                      ? "text-red-400"
                      : "text-emerald-500"
                  }`}
                >
                  {current.stock_quantity <= current.reorder_threshold
                    ? `⚠ Low stock (${current.stock_quantity})`
                    : "In stock"}
                </span>
              </div>
            </div>
          </div>

          {/* Price + CTA */}
          <div>
            <p className="text-4xl font-light text-[#2C2416] dark:text-zinc-100 mb-6">
              €{Number(current.price).toFixed(2)}
            </p>
            <button className="w-full bg-[#2C2416] hover:bg-[#3d3020] text-white font-medium py-3 rounded-xl transition text-sm">
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* You may also like */}
      {similar.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-1">You may also like</h2>
          <p className="text-xs text-zinc-500 mb-5">
            Powered by TF-IDF cosine similarity
          </p>
          <div className="grid text-white sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {similar.map((p) => (
              <SimilarCard
                key={p.id}
                product={p}
                onClick={() => router.push(`/products/${p.id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

// ─── Similar product card ──────────────────────────────────────
function SimilarCard({
  product,
  onClick,
}: {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    image_url: string | null;
  };
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 hover:border-sky-500 transition overflow-hidden"
    >
      <div className="h-32 bg-zinc-900">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
        <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
          {product.description}
        </p>
        <p className="font-bold text-sky-400">
          €{Number(product.price).toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
      {children}
    </span>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-xl bg-zinc-900 animate-pulse" />
        <div className="space-y-4">
          <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
          <div className="h-8 w-3/4 bg-zinc-800 rounded animate-pulse" />
          <div className="h-20 bg-zinc-800 rounded animate-pulse" />
          <div className="h-12 w-32 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    </main>
  );
}
