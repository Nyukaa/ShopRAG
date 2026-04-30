"use client";

import { useState, useMemo, useEffect } from "react";
import {
  tokenize,
  buildVocab,
  vectorize,
  cosineSimilarity,
  type Product,
} from "@/lib/rag-engine";

export default function VectorizationDemo() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch real products from Supabase via your existing API
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.slice(0, 6)); // show first 6 like before
        setLoading(false);
      });
  }, []);

  const vocab = useMemo(() => buildVocab(products), [products]);

  const docVectors = useMemo(
    () =>
      products.map((p) => vectorize(`${p.name} ${p.description ?? ""}`, vocab)),
    [products, vocab]
  );

  const queryTokens = tokenize(query);
  const queryVector = query.trim() ? vectorize(query, vocab) : null;

  const similarities = queryVector
    ? products
        .map((p, i) => ({
          product: p,
          score: cosineSimilarity(queryVector, docVectors[i]),
        }))
        .sort((a, b) => b.score - a.score)
    : null;

  if (loading)
    return <p className="p-8 font-mono text-sm">Loading products…</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-mono">
      <h1 className="text-2xl font-bold mb-1">Product Vectorization</h1>
      <p className="text-sm text-gray-500 mb-8">
        From product descriptions to numbers — no libraries, just code.
      </p>

      {/* Step 1: Products */}
      <Section title="Step 1: The Products" subtitle="from your Supabase DB">
        <div className="grid gap-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-gray-950 rounded px-3 py-2 text-sm border-l-2 border-sky-500"
            >
              <span className="text-xs font-bold text-sky-400 mr-2">
                €{Number(p.price).toFixed(2)}
              </span>
              <span className="font-semibold">{p.name}</span>
              {p.description && (
                <span className="text-gray-400 ml-2">— {p.description}</span>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Step 2: Tokenize */}
      <Section title="Step 2: Tokenize" subtitle="name + description → words">
        <Code>{`function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\\s]/g, "")
    .split(/\\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));
}
// Input:  name + description combined`}</Code>
        <Output label="Example — first product">
          {`tokenize("${products[0]?.name} ${
            products[0]?.description ?? ""
          }")\n→ [${tokenize(
            `${products[0]?.name} ${products[0]?.description ?? ""}`
          )
            .map((w) => `"${w}"`)
            .join(", ")}]`}
        </Output>
      </Section>

      {/* Step 3: Vocabulary */}
      <Section
        title="Step 3: Build Vocabulary"
        subtitle={`${vocab.length} unique words`}
      >
        <Code>{`const vocab = [...new Set(
  products.flatMap(p => tokenize(p.name + " " + p.description))
)].sort();`}</Code>
        <Output label={`Vocabulary (${vocab.length} words)`}>
          {vocab.join(", ")}
        </Output>
      </Section>

      {/* Step 4: Vectors */}
      <Section
        title="Step 4: Vectorize"
        subtitle="count each vocab word per product"
      >
        <div className="mt-3 space-y-3">
          {products.map((p, pi) => (
            <div key={p.id}>
              <div className="text-xs text-sky-400 mb-1">{p.name}</div>
              <div className="flex gap-px flex-wrap">
                {docVectors[pi].map((v, vi) => (
                  <div
                    key={vi}
                    className="w-3.5 h-6 flex items-center justify-center text-[0.55rem] rounded-sm"
                    style={{
                      background:
                        v > 0
                          ? `rgba(56,189,248,${0.3 + v * 0.3})`
                          : "rgba(255,255,255,0.05)",
                      color: v > 0 ? "#fff" : "#333",
                    }}
                    title={`${vocab[vi]}: ${v}`}
                  >
                    {v}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Step 5: Similarity matrix */}
      <Section
        title="Step 5: Cosine Similarity Matrix"
        subtitle="which products are similar?"
      >
        <div className="overflow-x-auto mt-2">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr>
                <th className="p-1.5 border border-gray-800 bg-gray-950" />
                {products.map((p) => (
                  <th
                    key={p.id}
                    className="p-1.5 border border-gray-800 bg-gray-950 text-sky-400 max-w-16"
                  >
                    {p.name.split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p1, i) => (
                <tr key={p1.id}>
                  <th className="p-1.5 border border-gray-800 bg-gray-950 text-sky-400 text-left">
                    {p1.name.split(" ")[0]}
                  </th>
                  {products.map((_, j) => {
                    const sim = cosineSimilarity(docVectors[i], docVectors[j]);
                    return (
                      <td
                        key={j}
                        className="p-1.5 border border-gray-800 text-center"
                        style={{ background: `rgba(56,189,248,${sim * 0.6})` }}
                      >
                        {sim.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Step 6: Live search */}
      <Section
        title="Step 6: Try It"
        subtitle="type a query, see which products match"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='e.g. "cheap gaming laptop" or "best for travel"'
          className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
        />
        {queryVector && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-500">
              Tokens: [{queryTokens.map((w) => `"${w}"`).join(", ")}]
            </p>
            {similarities!.map((r) => {
              const pct = Math.round(r.score * 100);
              return (
                <div
                  key={r.product.id}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="w-32 text-xs text-sky-400 truncate">
                    {r.product.name}
                  </span>
                  <div className="flex-1 bg-gray-900 rounded h-4 overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-300 bg-sky-500"
                      style={{ width: `${pct}%`, opacity: 0.7 }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── Shared UI components ──────────────────────────────────────
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
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 mb-5">
      <h2 className="text-base font-bold text-sky-400 mb-3">
        {title}{" "}
        {subtitle && (
          <span className="text-gray-500 text-xs font-normal">
            ({subtitle})
          </span>
        )}
      </h2>
      {children}
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-gray-950 rounded p-3 text-xs overflow-x-auto leading-relaxed">
      {children}
    </pre>
  );
}

function Output({ label, children }: { label: string; children: string }) {
  return (
    <div className="mt-2">
      <div className="text-[0.65rem] text-gray-500 uppercase mb-1">{label}</div>
      <div className="bg-gray-950 border border-gray-800 rounded p-3 text-xs whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}
