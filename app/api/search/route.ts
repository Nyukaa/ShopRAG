import { NextRequest } from "next/server";
import { getRagIndex } from "@/lib/rag-cache";
import { search } from "@/lib/rag-engine";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") ?? "";
  if (!query) return Response.json([]);

  const { index, vocab } = await getRagIndex();
  const ragResults = search(query, index, vocab, 8);

  if (!ragResults.length) return Response.json([]);

  // product+category join for results with IN
  const ids = ragResults.map((p) => p.id);
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id, name)")
    .in("id", ids);

  // keep the order of results same as in RAG output
  const sorted = ids
    .map((id) => data?.find((p) => p.id === id))
    .filter(Boolean);

  return Response.json(sorted);
}
