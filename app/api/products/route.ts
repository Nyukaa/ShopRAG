// app/api/products/route.ts
import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser, requireRole } from "@/lib/auth";
import { validateProduct } from "@/lib/validate-product";

// ── GET /api/products ─────────────────────────────────────────
export async function GET() {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(id, name)
    `
    )
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}

// ── POST /api/products ────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Auth — только admin и manager
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

  // 3. Validate + sanitize
  const validated = validateProduct(body);
  if (!validated.ok)
    return Response.json({ error: validated.error }, { status: 400 });

  // 4. Insert — Supabase SDK как в старом проекте
  const { data, error } = await supabase
    .from("products")
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    // SKU уже существует (UNIQUE constraint)
    if (error.code === "23505")
      return Response.json({ error: "SKU already exists" }, { status: 409 });
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
