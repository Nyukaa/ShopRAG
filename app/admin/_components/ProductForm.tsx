// app/admin/_components/ProductForm.tsx
"use client";

import { useState } from "react";

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

  function set(field: keyof ProductFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
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

      {/* Supplier + Image URL */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Supplier">
          <Input
            value={form.supplier}
            onChange={(v) => set("supplier", v)}
            placeholder="SoundTech GmbH"
          />
        </Field>
        <Field label="Image URL">
          <Input
            value={form.image_url}
            onChange={(v) => set("image_url", v)}
            placeholder="https://…"
          />
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
        disabled={saving}
        className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition text-sm"
      >
        {saving ? "Saving…" : "Save Product"}
      </button>
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────────
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
