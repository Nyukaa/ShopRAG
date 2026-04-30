// Pure functions — no dependencies, works in Node.js and browser

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string; // Supabase returns numeric as string
  category_id: string;
  image_url: string | null;
  status: "active" | "archived";
  stock_quantity: number;
  supplier: string;
};

export type RagEntry = {
  product: Product;
  vector: number[];
};

export type ScoredProduct = Product & { score: number };

// ─── same stop words as before ────────────────────────────────
const STOP_WORDS = new Set([
  "i",
  "is",
  "my",
  "the",
  "a",
  "for",
  "and",
  "to",
  "was",
  "are",
  "we",
  "with",
  "in",
  "on",
  "it",
  "got",
  "of",
  "so",
  "now",
  "an",
  "at",
  "be",
  "has",
  "had",
  "its",
  "no",
  "not",
  "but",
  "or",
  "if",
  "this",
  "that",
  "by",
  "from",
  "as",
  "are",
  "its",
]);

// ─── Step 1: tokenize ─────────────────────────────────────────
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

// ─── Step 2: build vocab from all products ────────────────────
// Key change: we use name + description as the "text"
function productText(p: Product): string {
  return `${p.name} ${p.description ?? ""}`;
}

export function buildVocab(products: Product[]): string[] {
  return [...new Set(products.flatMap((p) => tokenize(productText(p))))].sort();
}

// ─── Step 3: vectorize a single text ──────────────────────────
export function vectorize(text: string, vocab: string[]): number[] {
  const tokens = tokenize(text);
  return vocab.map((word) => tokens.filter((t) => t === word).length);
}

// ─── Step 4: cosine similarity ────────────────────────────────
export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

// ─── Step 5: build index (call once after fetching products) ──
export function buildIndex(products: Product[]): RagEntry[] {
  const vocab = buildVocab(products);
  return products.map((p) => ({
    product: p,
    vector: vectorize(productText(p), vocab),
  }));
}

// ─── Step 6: search ───────────────────────────────────────────
export function search(
  query: string,
  index: RagEntry[],
  vocab: string[],
  topK = 4
): ScoredProduct[] {
  const qVec = vectorize(query, vocab);
  return index
    .map(({ product, vector }) => ({
      ...product,
      score: cosineSimilarity(qVec, vector),
    }))
    .filter((p) => p.score > 0) // skip zero-match products
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ─── Step 7: "you may also like" ──────────────────────────────
export function getSimilar(
  productId: string,
  index: RagEntry[],
  vocab: string[],
  topK = 3
): ScoredProduct[] {
  const entry = index.find((e) => e.product.id === productId);
  if (!entry) return [];

  return index
    .filter((e) => e.product.id !== productId)
    .map(({ product, vector }) => ({
      ...product,
      score: cosineSimilarity(entry.vector, vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
