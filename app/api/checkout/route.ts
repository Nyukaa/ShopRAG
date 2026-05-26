import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

type IncomingItem = { productId: string; quantity: number };

export async function POST(request: Request) {
  const { items } = (await request.json()) as { items: IncomingItem[] };

  // Данные о ценах берём с сервера — клиенту не доверяем
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price");

  if (error || !products) {
    return Response.json({ error: "Failed to fetch products" }, { status: 500 });
  }

  const line_items = items.map((i) => {
    const product = products.find((p) => p.id === i.productId);
    if (!product) throw new Error(`Unknown product ${i.productId}`);
    return {
      price_data: {
        currency: "eur",
        product_data: { name: product.name },
        unit_amount: Math.round(Number(product.price) * 100),
      },
      quantity: i.quantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
  });

  return Response.json({ url: session.url });
}
