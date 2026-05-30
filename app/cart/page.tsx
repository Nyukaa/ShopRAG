"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  fetchProducts,
  type Product,
} from "@/lib/features/products/productSlice";
import { selectCartItems, itemRemoved } from "@/lib/features/cart/cartSlice";

export default function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const products = useAppSelector((s) => s.products.items);
  const productStatus = useAppSelector((s) => s.products.status);

  useEffect(() => {
    if (productStatus === "idle") dispatch(fetchProducts());
  }, [productStatus, dispatch]);

  const lines = items
    .map((i) => {
      const product = products.find((p) => p.id === i.productId);
      return product ? { product, quantity: i.quantity } : null;
    })
    .filter((x): x is { product: Product; quantity: number } => x !== null);

  const total = lines.reduce(
    (sum, l) => sum + Number(l.product.price) * l.quantity,
    0
  );

  async function handleCheckout() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <main className="flex-1 p-8 flex justify-center">
      <div className="max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-light text-[#2C2416] mb-6 tracking-tight text-center">
          Your Cart
        </h1>

        {lines.length === 0 && (
          <p className="text-[#8C7E6E] text-sm">Your cart is empty.</p>
        )}

        <ul className="divide-y divide-[#E8E0D8]">
          {lines.map(({ product, quantity }) => (
            <li
              key={product.id}
              className="flex items-center justify-between py-4"
            >
              <div>
                <p className="font-medium text-[#2C2416] text-sm">
                  {product.name}
                </p>
                <p className="text-xs text-[#8C7E6E] mt-1">
                  €{Number(product.price).toFixed(2)} × {quantity}
                </p>
              </div>
              <button
                onClick={() => dispatch(itemRemoved(product.id))}
                className="text-xs text-red-400 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        {lines.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-lg font-semibold text-[#2C2416]">
              Total: €{total.toFixed(2)}
            </p>
            <button
              onClick={handleCheckout}
              className="rounded-xl bg-[#2C2416] px-6 py-3 text-white text-xs tracking-widest uppercase hover:bg-[#4a3e2e] transition"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
