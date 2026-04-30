import { getRagIndex } from "@/lib/rag-cache";
import { getSimilar } from "@/lib/rag-engine";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { index, vocab } = await getRagIndex();
  const results = getSimilar(id, index, vocab, 3);
  return Response.json(results);
}
