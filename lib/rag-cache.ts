// lib/rag-cache.ts
import {
  buildIndex,
  buildVocab,
  type Product,
  type RagEntry,
} from "./rag-engine";

let cachedIndex: RagEntry[] | null = null;
let cachedVocab: string[] | null = null;

export async function getRagIndex(): Promise<{
  index: RagEntry[];
  vocab: string[];
}> {
  if (cachedIndex && cachedVocab) {
    return { index: cachedIndex, vocab: cachedVocab };
  }

  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/products`, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY!}`,
    },
  });

  const products: Product[] = await res.json();
  const vocab = buildVocab(products);
  const index = buildIndex(products);

  cachedIndex = index;
  cachedVocab = vocab;

  return { index, vocab };
}
