// app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchProducts,
  type Product,
} from "@/lib/features/products/productSlice";

// ── Debounce hook ──────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((s) => s.products);

  const [query, setQuery] = useState("");
  const [ragResults, setRagResults] = useState<Product[] | null>(null);
  const [ragLoading, setRagLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 350);

  // Load all products on mount
  useEffect(() => {
    if (status === "idle") dispatch(fetchProducts());
  }, [status, dispatch]);

  // RAG search whenever debounced query changes
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setRagResults(null);
      return;
    }
    setRagLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setRagResults(data);
    } catch {
      setRagResults([]);
    } finally {
      setRagLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch(debouncedQuery);
  }, [debouncedQuery, runSearch]);

  const isSearching = query.trim().length > 0;
  const displayItems = isSearching ? ragResults ?? [] : items;

  return (
    <main className="flex-1 bg-[#F7F4F0] dark:bg-zinc-950 min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-[#EDE8E0] dark:bg-zinc-900 px-6 py-16 text-center">
        <p className="text-xs tracking-[0.25em] uppercase text-[#8C7E6E] mb-3">
          Scandinavian Living
        </p>
        <h1 className="text-4xl md:text-5xl font-light text-[#2C2416] dark:text-zinc-100 mb-4 tracking-tight">
          Nordic Home Decor
        </h1>
        <p className="text-sm text-[#8C7E6E] max-w-md mx-auto mb-10">
          Thoughtfully crafted objects for the modern home — lamps, candles, art
          and more.
        </p>

        {/* Search bar */}
        <div className="relative max-w-lg mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "cozy bedroom" or "gift idea" or "natural materials"'
            className="w-full bg-white dark:bg-zinc-800 border border-[#D4C9BC] dark:border-zinc-700 rounded-full px-5 py-3 pr-12 text-sm text-[#2C2416] dark:text-zinc-100 placeholder:text-[#B0A090] focus:outline-none focus:border-[#8C7E6E] shadow-sm transition"
          />
          {/* Icon */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B0A090]">
            {ragLoading ? (
              <svg
                className="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
                <path d="M21 12a9 9 0 00-9-9" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            )}
          </div>

          {/* Clear button */}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-[#B0A090] hover:text-[#8C7E6E] transition"
            >
              ✕
            </button>
          )}
        </div>

        {/* RAG hint */}
        {isSearching && !ragLoading && (
          <p className="mt-3 text-xs text-[#8C7E6E]">
            {ragResults?.length ? (
              <>
                Showing <strong>{ragResults.length}</strong> results for "
                <em>{query}</em>" — powered by RAG
              </>
            ) : (
              `No matches found for "${query}"`
            )}
          </p>
        )}
      </section>

      {/* ── Product grid ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {/* Category pills — only show when not searching */}
        {!isSearching && status === "succeeded" && (
          <div className="flex gap-2 flex-wrap mb-8">
            {[
              "All",
              "Lamps",
              "Posters",
              "Candles",
              "Wall Art",
              "Mirrors",
              "Vases",
            ].map((cat) => (
              <button
                key={cat}
                className="px-4 py-1.5 rounded-full text-xs border border-[#D4C9BC] dark:border-zinc-700 text-[#8C7E6E] hover:bg-[#EDE8E0] dark:hover:bg-zinc-800 transition"
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Count / status line */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-[#8C7E6E] uppercase tracking-widest">
            {isSearching
              ? ragLoading
                ? "Searching…"
                : `${ragResults?.length ?? 0} results`
              : status === "succeeded"
              ? `${items.length} products`
              : ""}
          </p>
          {isSearching && (
            <div className="flex items-center gap-1.5 text-xs text-[#8C7E6E] bg-[#EDE8E0] dark:bg-zinc-800 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              RAG semantic search
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {(status === "loading" || (ragLoading && !ragResults)) && (
          <ProductGridSkeleton />
        )}

        {status === "failed" && <p className="text-red-400 text-sm">{error}</p>}

        {/* Empty RAG result */}
        {isSearching && !ragLoading && ragResults?.length === 0 && (
          <div className="text-center py-20">
            <p className="text-3xl mb-3">🌿</p>
            <p className="text-[#8C7E6E] text-sm">
              No products matched "<em>{query}</em>"
            </p>
            <button
              onClick={() => setQuery("")}
              className="mt-4 text-xs text-[#8C7E6E] underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Grid */}
        {!ragLoading && displayItems.length > 0 && (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => router.push(`/products/${product.id}`)}
                highlight={isSearching}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// ── Product Card ───────────────────────────────────────────────
function ProductCard({
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
      {/* Image */}
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

      {/* Content */}
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
              ? `⚠ Low stock`
              : `In stock`}
          </span>
        </div>
      </div>
    </li>
  );
}

// ── Skeleton ───────────────────────────────────────────────────
function ProductGridSkeleton() {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="rounded-2xl border border-[#E8E0D8] overflow-hidden bg-white dark:bg-zinc-900"
        >
          <div className="h-52 bg-[#F0EBE3] dark:bg-zinc-800 animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-2.5 w-16 bg-[#E8E0D8] dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-[#E8E0D8] dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-3 w-full bg-[#E8E0D8] dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-[#E8E0D8] dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-5 w-16 bg-[#E8E0D8] dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}
