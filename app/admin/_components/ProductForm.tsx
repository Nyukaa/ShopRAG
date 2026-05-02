// app/admin/_components/ProductForm.tsx
"use client";

import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type ProductFormData = {
  name: string;
  sku: string;
  price: string;
  description: string;
  supplier: string;
  stock_quantity: string;
  image_url: string;
  status: "active" | "archived";
};

type Props = {
  initial?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  saving: boolean;
};

const empty: ProductFormData = {
  name: "",
  sku: "",
  price: "",
  description: "",
  supplier: "",
  stock_quantity: "0",
  image_url: "",
  status: "active",
};

export default function ProductForm({ initial, onSubmit, saving }: Props) {
  const [form, setForm] = useState<ProductFormData>({ ...empty, ...initial });

  // ← всё это ВНУТРИ компонента
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    initial?.image_url || null
  );

  function set(field: keyof ProductFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ← тоже ВНУТРИ компонента — имеет доступ к set, setPreview, setUploading
  async function handleImageUpload(file: File) {
    setUploading(true);

    const ext = file.name.split(".").pop();
    const filename = `product-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(filename, file, { upsert: false });

    if (error) {
      alert("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filename);

    set("image_url", data.publicUrl);
    setPreview(data.publicUrl);
    setUploading(false);
  }

  return (
    <div className="space-y-5">
      {/* Name + SKU */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name *">
          <Input
            value={form.name}
            onChange={(v) => set("name", v)}
            placeholder="Wireless Earbuds Pro"
          />
        </Field>
        <Field label="SKU *">
          <Input
            value={form.sku}
            onChange={(v) => set("sku", v)}
            placeholder="SKU-1923"
            mono
          />
        </Field>
      </div>

      {/* Price + Stock */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Price (€) *">
          <Input
            value={form.price}
            onChange={(v) => set("price", v)}
            placeholder="129.99"
            type="number"
          />
        </Field>
        <Field label="Stock quantity">
          <Input
            value={form.stock_quantity}
            onChange={(v) => set("stock_quantity", v)}
            placeholder="0"
            type="number"
          />
        </Field>
      </div>

      {/* Description */}
      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Bluetooth 5.3 with ANC, 28h battery…"
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500 resize-none"
        />
      </Field>

      {/* Supplier + Image Upload */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Supplier">
          <Input
            value={form.supplier}
            onChange={(v) => set("supplier", v)}
            placeholder="SoundTech GmbH"
          />
        </Field>

        <Field label="Product Image">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full h-32 rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden cursor-pointer hover:border-sky-500 transition group"
          >
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="text-xs text-white">Change image</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
                {uploading ? (
                  <span className="text-xs animate-pulse">Uploading…</span>
                ) : (
                  <>
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span className="text-xs">Click to upload</span>
                  </>
                )}
              </div>
            )}
            {uploading && preview && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-xs text-white animate-pulse">
                  Uploading…
                </span>
              </div>
            )}
          </div>
          {form.image_url && (
            <p className="mt-1 text-[10px] text-zinc-600 truncate">
              {form.image_url}
            </p>
          )}
        </Field>
      </div>

      {/* Status */}
      <Field label="Status">
        <select
          value={form.status}
          onChange={(e) =>
            set("status", e.target.value as "active" | "archived")
          }
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </Field>

      {/* Submit */}
      <button
        onClick={() => onSubmit(form)}
        disabled={saving || uploading}
        className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition text-sm"
      >
        {saving ? "Saving…" : uploading ? "Uploading image…" : "Save Product"}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  mono = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500 ${
        mono ? "font-mono" : ""
      }`}
    />
  );
}
