// app/api/products/[id]/route.ts
import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser, requireRole } from "@/lib/auth";
import { validateProduct } from "@/lib/validate-product";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/products/[id] ────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id, name)")
    .eq("id", id)
    .single();

  if (error || !data)
    return Response.json({ error: "Product not found" }, { status: 404 });

  return Response.json(data);
}

// ── PUT /api/products/[id] ────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;

  // 1. Auth
  const auth = await getAuthUser(req);
  const denied = requireRole(auth, ["admin", "manager"]);
  if (denied) return denied;

  // 2. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 3. Validate — reuse same sanitizer as POST
  const validated = validateProduct(body);
  if (!validated.ok)
    return Response.json({ error: validated.error }, { status: 400 });

  // 4. Update
  const { data, error } = await supabase
    .from("products")
    .update({ ...validated.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      return Response.json({ error: "SKU already exists" }, { status: 409 });
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!data)
    return Response.json({ error: "Product not found" }, { status: 404 });

  return Response.json(data);
}

// ── DELETE /api/products/[id] ─────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;

  // 1. Auth — только admin
  const auth = await getAuthUser(req);
  const denied = requireRole(auth, ["admin"]); // manager не может удалять
  if (denied) return denied;

  // 2. Delete
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return new Response(null, { status: 204 }); // No Content
}
