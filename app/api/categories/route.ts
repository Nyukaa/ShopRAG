// app/api/categories/route.ts
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
