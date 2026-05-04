// app/admin/rag/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  tokenize,
  buildVocab,
  vectorize,
  cosineSimilarity,
  type Product,
} from "@/lib/rag-engine";

type IndexedProduct = Product & { vector: number[] };

export default function RagAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [maxItems, setMaxItems] = useState(8); // матрица 8x8 читаема

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Берём только активные продукты до maxItems
  const subset = useMemo(
    () => products.filter((p) => p.status === "active").slice(0, maxItems),
    [products, maxItems]
  );

  const vocab = useMemo(() => buildVocab(subset), [subset]);

  const indexed: IndexedProduct[] = useMemo(
    () =>
      subset.map((p) => ({
        ...p,
        vector: vectorize(`${p.name} ${p.description ?? ""}`, vocab),
      })),
    [subset, vocab]
  );

  // Query vector для live search
  const queryTokens = tokenize(query);
  const queryVector = query.trim() ? vectorize(query, vocab) : null;

  const queryScores = queryVector
    ? indexed
        .map((p) => ({
          product: p,
          score: cosineSimilarity(queryVector, p.vector),
        }))
        .sort((a, b) => b.score - a.score)
    : null;

  if (loading)
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-zinc-800" />
        ))}
      </div>
    );

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">RAG Engine Inspector</h1>
        <p className="text-sm text-zinc-400">
          Live view of TF-IDF vectorization and cosine similarity on your
          products.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="text-xs text-zinc-400 block mb-1">
            Matrix size
          </label>
          <select
            value={maxItems}
            onChange={(e) => setMaxItems(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-sky-500"
          >
            {[5, 8, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n} products
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-48">
          <label className="text-xs text-zinc-400 block mb-1">Live query</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "cozy bedroom" or "gift idea"'
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-sky-500"
          />
        </div>
        <div className="text-xs text-zinc-500 mt-4">
          <span className="text-sky-400 font-mono">{vocab.length}</span> unique
          tokens ·{" "}
          <span className="text-sky-400 font-mono">{indexed.length}</span>{" "}
          products indexed
        </div>
      </div>

      {/* Step 1 — Vocab sample */}
      <Section
        title="Step 1 — Vocabulary"
        subtitle={`${vocab.length} unique tokens from ${indexed.length} products`}
      >
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {vocab.map((word) => {
            const inQuery = queryTokens.includes(word);
            return (
              <span
                key={word}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                  inQuery
                    ? "bg-sky-500/20 border-sky-500 text-sky-300"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400"
                }`}
              >
                {word}
              </span>
            );
          })}
        </div>
        {query && (
          <p className="mt-2 text-xs text-zinc-500">
            <span className="text-sky-400">Highlighted</span> — tokens from your
            query that exist in vocab
          </p>
        )}
      </Section>

      {/* Step 2 — Vector heatmap */}
      <Section
        title="Step 2 — Product Vectors"
        subtitle="each cell = word count in product description"
      >
        <div className="overflow-x-auto">
          <div className="space-y-2 min-w-max">
            {indexed.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <span
                  className="text-[10px] text-zinc-400 w-32 truncate shrink-0"
                  title={p.name}
                >
                  {p.name}
                </span>
                <div className="flex gap-px">
                  {p.vector.map((v, vi) => {
                    const inQuery = queryVector ? queryVector[vi] > 0 : false;
                    return (
                      <div
                        key={vi}
                        title={`${vocab[vi]}: ${v}`}
                        className="w-3 h-5 rounded-sm"
                        style={{
                          background:
                            v > 0
                              ? inQuery
                                ? `rgba(251,191,36,${0.4 + v * 0.4})` // amber = query match
                                : `rgba(56,189,248,${0.3 + v * 0.3})` // sky = has word
                              : "rgba(255,255,255,0.04)",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Query row */}
            {queryVector && (
              <div className="flex items-center gap-2 border-t border-zinc-700 pt-2 mt-1">
                <span className="text-[10px] text-amber-400 w-32 shrink-0 font-bold">
                  ← Query
                </span>
                <div className="flex gap-px">
                  {queryVector.map((v, vi) => (
                    <div
                      key={vi}
                      title={`${vocab[vi]}: ${v}`}
                      className="w-3 h-5 rounded-sm"
                      style={{
                        background:
                          v > 0
                            ? `rgba(251,191,36,${0.5 + v * 0.3})`
                            : "rgba(255,255,255,0.04)",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="mt-2 text-[10px] text-zinc-500">
          <span style={{ color: "rgba(56,189,248,0.8)" }}>■</span> word present
          · <span style={{ color: "rgba(251,191,36,0.8)" }}>■</span> matches
          query · hover cell for token name
        </p>
      </Section>

      {/* Step 3 — Similarity matrix */}
      <Section
        title="Step 3 — Cosine Similarity Matrix"
        subtitle="1.0 = identical · 0.0 = no overlap"
      >
        <div className="overflow-x-auto">
          <table className="text-[0.6rem] border-collapse">
            <thead>
              <tr>
                <th className="p-1.5 border border-zinc-800 bg-zinc-950 min-w-20" />
                {indexed.map((p) => (
                  <th
                    key={p.id}
                    className="p-1.5 border border-zinc-800 bg-zinc-950 text-sky-400 font-normal"
                    title={p.name}
                  >
                    {p.name.split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {indexed.map((p1, i) => (
                <tr key={p1.id}>
                  <th
                    className="p-1.5 border border-zinc-800 bg-zinc-950 text-sky-400 font-normal text-left whitespace-nowrap"
                    title={p1.name}
                  >
                    {p1.name.split(" ")[0]}
                  </th>
                  {indexed.map((p2, j) => {
                    const sim = cosineSimilarity(p1.vector, p2.vector);
                    const isDiag = i === j;
                    return (
                      <td
                        key={j}
                        className="p-1.5 border border-zinc-800 text-center font-mono"
                        style={{
                          background: isDiag
                            ? "rgba(255,255,255,0.05)"
                            : `rgba(56,189,248,${sim * 0.6})`,
                          color: sim > 0.5 ? "#fff" : "#888",
                        }}
                        title={`${p1.name} × ${p2.name} = ${sim.toFixed(3)}`}
                      >
                        {isDiag ? "—" : sim.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-zinc-500">
          Darker blue = more similar · hover cell for full product names
        </p>
      </Section>

      {/* Step 4 — Live query results */}
      {queryScores && (
        <Section
          title="Step 4 — Query Results"
          subtitle={`ranked by cosine similarity to "${query}"`}
        >
          <div className="space-y-2">
            {queryScores.map(({ product, score }, rank) => {
              const pct = Math.round(score * 100);
              return (
                <div key={product.id} className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-500 w-4">
                    {rank + 1}
                  </span>
                  <span
                    className="text-xs text-zinc-300 w-40 truncate"
                    title={product.name}
                  >
                    {product.name}
                  </span>
                  <div className="flex-1 bg-zinc-900 rounded h-3 overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background:
                          pct > 0
                            ? `rgba(56,189,248,${0.4 + pct / 150})`
                            : "transparent",
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 w-10 text-right">
                    {score.toFixed(3)}
                  </span>
                  {pct === 0 && (
                    <span className="text-[10px] text-zinc-600">no match</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-zinc-500">
            ⚠ TF-IDF limitation: scores based on word overlap, not semantic
            meaning. tall matte - matches both lamps and vases because they
            share those words.
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="text-sm font-bold text-sky-400">{title}</h2>
        {subtitle && (
          <span className="text-[10px] text-zinc-500">{subtitle}</span>
        )}
      </div>
      {children}
    </div>
  );
}
