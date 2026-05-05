// app/page.tsx
"use client";
import { ProductCard } from "@/app/components/ProductCard";
import { ProductGridSkeleton } from "@/app/components/ProductGridSkeleton";
import { Suspense } from "react"; //
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchProducts,
  type Product,
} from "@/lib/features/products/productSlice";
import { useSearchParams } from "next/navigation";

// ── Debounce hook ──────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((s) => s.products);
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [ragResults, setRagResults] = useState<Product[] | null>(null);
  const [ragLoading, setRagLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 350); // Debounce user input for better UX and fewer API calls
  //const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeCategory, setActiveCategory] = useState<string>(
    searchParams.get("category") ?? "All"
  );
  const [searchMode, setSearchMode] = useState<"simple" | "rag">("simple");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simple search — filtr locally name + description (без API)
  const simpleResults = items.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.supplier?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q)
    );
  });

  const isSearching = query.trim().length > 0;

  const filteredItems = (() => {
    const base = isSearching
      ? searchMode === "rag"
        ? ragResults ?? []
        : simpleResults
      : items;

    // Apply category filter on top of search results
    if (activeCategory === "All") return base;
    return base.filter((p) => p.category?.name === activeCategory);
  })();
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

        {/* Search bar 2 types */}
        <div className="max-w-xl mx-auto">
          {/* Mode toggle */}
          {mounted && (
            <div className="flex rounded-full border border-[#D4C9BC] dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1 mb-3 w-fit mx-auto">
              <button
                onClick={() => {
                  setSearchMode("simple");
                  setQuery("");
                  setActiveCategory("All");
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  searchMode === "simple"
                    ? "bg-[#2C2416] text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-[#8C7E6E] hover:text-[#2C2416]"
                }`}
              >
                Simple Search
              </button>
              <button
                onClick={() => {
                  setSearchMode("rag");
                  setQuery("");
                  setActiveCategory("All");
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  searchMode === "rag"
                    ? "bg-[#2C2416] text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-[#8C7E6E] hover:text-[#2C2416]"
                }`}
              >
                ✦ RAG Search
              </button>
            </div>
          )}
          {/* Mode description */}
          {mounted && (
            <p className="text-center text-[11px] text-[#B0A090] mb-4 h-4">
              {searchMode === "simple"
                ? "Exact keyword match - finds products containing your words"
                : "Semantic search - understands meaning, not just keywords"}
            </p>
          )}
          {/* Input */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchMode === "simple"
                  ? "e.g. lamp, candle, mirror..."
                  : 'Try "cozy bedroom" or "gift idea" or "natural materials"'
              }
              className="w-full bg-white dark:bg-zinc-800 border border-[#D4C9BC] dark:border-zinc-700 rounded-full px-5 py-3 pr-12 text-sm text-[#2C2416] dark:text-zinc-100 placeholder:text-[#B0A090] focus:outline-none focus:border-[#8C7E6E] shadow-sm transition"
            />
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
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-[#B0A090] hover:text-[#8C7E6E] transition"
              >
                ✕
              </button>
            )}
          </div>

          {/* Result hint */}
          {isSearching && !ragLoading && (
            <p className="mt-3 text-xs text-[#8C7E6E] text-center">
              {searchMode === "rag" ? (
                ragResults?.length ? (
                  <>
                    Found <strong>{ragResults.length} </strong> semantically
                    related results for &quot;<em>{query}</em>&quot;
                  </>
                ) : (
                  `No semantic matches for "${query}"`
                )
              ) : simpleResults.length ? (
                <>
                  Found <strong>{simpleResults.length} </strong> products
                  matching &quot;<em>{query}</em>&quot;
                </>
              ) : (
                `No products containing "${query}"`
              )}
            </p>
          )}
        </div>

        {/* RAG hint */}
        {isSearching && !ragLoading && (
          <p className="mt-3 text-xs text-[#8C7E6E]">
            {ragResults?.length ? (
              <>
                Showing <strong> {ragResults.length} </strong> results for
                &quot;
                <em>{query}</em>&quot; - powered by RAG
              </>
            ) : (
              `No matches found for "${query}"`
            )}
          </p>
        )}
      </section>

      {/* ── Product grid ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {/* Category pills */}
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
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs border transition
          ${
            activeCategory === cat
              ? "bg-[#2C2416] text-white border-[#2C2416] dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
              : "border-[#D4C9BC] dark:border-zinc-700 text-[#8C7E6E] hover:bg-[#EDE8E0] dark:hover:bg-zinc-800"
          }`}
              >
                {cat}
                {/* Count badge */}
                {cat !== "All" && status === "succeeded" && (
                  <span className="ml-1.5 opacity-60">
                    {items.filter((p) => p.category?.name === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Count line */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-[#8C7E6E] uppercase tracking-widest">
            {isSearching
              ? ragLoading
                ? "Searching…"
                : `${filteredItems.length} results`
              : `${filteredItems.length} of ${items.length} products`}
          </p>
          {/* show active filtr */}
          <div className="flex items-center gap-2">
            {activeCategory !== "All" && (
              <button
                onClick={() => setActiveCategory("All")}
                className="text-xs text-[#8C7E6E] bg-[#EDE8E0] dark:bg-zinc-800 px-3 py-1 rounded-full flex items-center gap-1"
              >
                {activeCategory} ✕
              </button>
            )}
            {isSearching && (
              <div className="flex items-center gap-1.5 text-xs text-[#8C7E6E] bg-[#EDE8E0] dark:bg-zinc-800 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {searchMode === "rag" ? "RAG semantic" : "Simple match"}
              </div>
            )}
          </div>
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
              No products matched &quot;<em>{query}</em>&quot;
            </p>
            <button
              onClick={() => setQuery("")}
              className="mt-4 text-xs text-[#8C7E6E] underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Grid — using filteredItems  */}
        {!ragLoading && filteredItems.length > 0 && (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => router.push(`/products/${product.id}`)}
                highlight={isSearching}
              />
            ))}
          </ul>
        )}
        {/* Empty state for filter */}
        {!ragLoading &&
          filteredItems.length === 0 &&
          status === "succeeded" &&
          !isSearching && (
            <div className="text-center py-20">
              <p className="text-3xl mb-3">🌿</p>
              <p className="text-[#8C7E6E] text-sm">
                No products in {activeCategory} yet
              </p>
            </div>
          )}
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  );
}
