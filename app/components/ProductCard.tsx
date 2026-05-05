// app/components/ProductCard.tsx
"use client";

import { type Product } from "@/lib/features/products/productSlice";

export function ProductCard({
  product,
  onClick,
  highlight,
}: {
  product: Product;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <li
      onClick={onClick}
      className={`cursor-pointer group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 transition-all duration-300
        ${
          highlight
            ? "shadow-md border border-[#C8B9A8]"
            : "border border-[#E8E0D8] dark:border-zinc-800 hover:shadow-lg hover:border-[#C8B9A8]"
        }`}
    >
      <div className="h-52 w-full bg-[#F0EBE3] dark:bg-zinc-800 overflow-hidden">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[#C8B9A8] text-xs">
            No image
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-[10px] uppercase tracking-widest text-[#B0A090] mb-1">
          {product.supplier}
        </p>
        <h3 className="font-medium text-[#2C2416] dark:text-zinc-100 text-sm mb-2 leading-snug">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-[#8C7E6E] line-clamp-2 mb-4 leading-relaxed">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-[#2C2416] dark:text-zinc-100">
            €{Number(product.price).toFixed(2)}
          </span>
          <span
            className={`text-[10px] ${
              product.stock_quantity <= product.reorder_threshold
                ? "text-red-400"
                : "text-[#B0A090]"
            }`}
          >
            {product.stock_quantity <= product.reorder_threshold
              ? "⚠ Low stock"
              : "In stock"}
          </span>
        </div>
      </div>
    </li>
  );
}
