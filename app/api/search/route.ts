// app/api/search/route.ts
import { NextRequest } from "next/server";
import { getRagIndex } from "@/lib/rag-cache";
import { search } from "@/lib/rag-engine";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") ?? "";
  if (!query) return Response.json([]);

  const { index, vocab } = await getRagIndex();
  const results = search(query, index, vocab);

  return Response.json(results);
}
