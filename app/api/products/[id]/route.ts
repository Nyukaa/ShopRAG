// app/api/products/[id]/route.ts
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase_url = process.env.SUPABASE_URL;
  const supabase_anon_key = process.env.SUPABASE_ANON_KEY;

  if (!supabase_url || !supabase_anon_key) {
    return new Response("Missing Supabase env variables", { status: 500 });
  }

  const response = await fetch(`${supabase_url}/rest/v1/products?id=eq.${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: supabase_anon_key,
      Authorization: `Bearer ${supabase_anon_key}`,
      // tells Supabase to return a single object, not an array
      Accept: "application/vnd.pgrst.object+json",
    },
  });

  if (!response.ok) {
    return new Response("Product not found", { status: 404 });
  }

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
