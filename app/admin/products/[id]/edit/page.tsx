// app/admin/products/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ProductForm, {
  type ProductFormData,
} from "@/app/admin/_components/ProductForm";
import { type Product } from "@/lib/features/products/productSlice";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [initial, setInitial] = useState<Partial<ProductFormData> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Load existing product ──────────────────────────────────
  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((p: Product) => {
        // Map Product → ProductFormData (все поля string для инпутов)
        setInitial({
          name: p.name,
          sku: p.sku,
          price: String(p.price),
          description: p.description ?? "",
          supplier: p.supplier,
          stock_quantity: String(p.stock_quantity),
          image_url: p.image_url ?? "",
          status: p.status,
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load product");
        setLoading(false);
      });
  }, [id]);

  // ── Submit → PUT /api/products/[id] ───────────────────────
  async function handleSubmit(formData: ProductFormData) {
    setSaving(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(formData),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      setSaving(false);
      return;
    }

    router.push("/admin");
  }

  // ── Delete → DELETE /api/products/[id] ────────────────────
  async function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      const json = await res.json();
      setError(json.error ?? "Delete failed");
    }
  }

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-zinc-800 rounded" />
        <div className="h-10 w-full bg-zinc-800 rounded" />
        <div className="h-10 w-full bg-zinc-800 rounded" />
        <div className="h-24 w-full bg-zinc-800 rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-zinc-500 hover:text-zinc-300 mb-4 block"
        >
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Product</h1>
          {/* Delete — только показываем кнопку, доступ контролирует API */}
          <button
            onClick={handleDelete}
            className="text-xs text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400 px-3 py-1.5 rounded-lg transition"
          >
            Delete product
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {initial && (
        <ProductForm
          onSubmit={handleSubmit}
          saving={saving}
          initial={initial}
        />
      )}
    </div>
  );
}
