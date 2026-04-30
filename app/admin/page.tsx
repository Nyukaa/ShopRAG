// app/admin/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchProducts } from "@/lib/features/products/productSlice";

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((s) => s.products);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  return (
    <div>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-zinc-500 mt-1">{items.length} total</p>
        </div>
        <button
          onClick={() => router.push("/admin/products/new")}
          className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + New Product
        </button>
      </header>

      {status === "loading" && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-zinc-900 animate-pulse"
            />
          ))}
        </div>
      )}

      {status === "succeeded" && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-900/50 transition">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                    {p.sku}
                  </td>
                  <td className="px-4 py-3">€{Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.stock_quantity <= p.reorder_threshold
                          ? "text-red-400"
                          : "text-zinc-300"
                      }
                    >
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === "active"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-zinc-700 text-zinc-400"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        router.push(`/admin/products/${p.id}/edit`)
                      }
                      className="text-xs text-sky-400 hover:text-sky-300 transition"
                    >
                      Edit →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
