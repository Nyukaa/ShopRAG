// lib/validate-product.ts
type RawBody = Record<string, unknown>;

export type CleanProduct = {
  name: string;
  sku: string;
  price: number;
  description: string;
  category_id: string | null;
  image_url: string | null;
  supplier: string;
  stock_quantity: number;
};

type ValidationResult =
  | { ok: true; data: CleanProduct }
  | { ok: false; error: string };

export function validateProduct(body: unknown): ValidationResult {
  if (!body || typeof body !== "object")
    return { ok: false, error: "Invalid JSON body" };

  const b = body as RawBody;

  if (!b.name || String(b.name).trim() === "")
    return { ok: false, error: "name is required" };
  if (!b.sku || String(b.sku).trim() === "")
    return { ok: false, error: "sku is required" };
  if (b.price === undefined || b.price === null)
    return { ok: false, error: "price is required" };

  const price = parseFloat(String(b.price));
  if (isNaN(price) || price < 0)
    return { ok: false, error: "price must be a positive number" };

  return {
    ok: true,
    data: {
      name: String(b.name).trim(),
      sku: String(b.sku).trim(),
      price,
      description: b.description ? String(b.description).trim() : "",
      category_id: b.category_id ? String(b.category_id) : null,
      image_url: b.image_url ? String(b.image_url).trim() : null,
      supplier: b.supplier ? String(b.supplier).trim() : "",
      stock_quantity: b.stock_quantity ? Number(b.stock_quantity) : 0,
    },
  };
}
