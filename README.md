# 🛒 Nordic Shop — RAG-Powered E-Commerce

A full-stack e-commerce app for a Nordic home decor store with a custom-built RAG (Retrieval-Augmented Generation) recommendation engine — no external AI libraries, just pure TypeScript math.

[DEMO](nordic-shop-git-main-annashitikova-9718s-projects.vercel.app)

## 🛠 Tech Stack

<p>
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white" />
</p>

<p>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Google%20OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

<p>
  <img src="https://img.shields.io/badge/RAG-TF--IDF%20%2B%20Cosine%20Similarity-7B61FF?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Auth-Role--Based%20Access%20Control-0A66C2?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Storage-Supabase%20Buckets-3ECF8E?style=for-the-badge" />
</p>

- **Frontend**: Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript
- **State**: Redux Toolkit with `createAsyncThunk` for all API interactions
- **Backend**: Next.js API Routes (serverless), Supabase JS SDK
- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **Auth**: Google OAuth via Supabase — role-based (`admin`, `manager`, `staff`)
- **Storage**: Supabase Storage buckets for product images
- **RAG Engine**: Custom TF-IDF vectorizer + cosine similarity — zero dependencies

---

## ✨ Key Features

- 🔍 **Dual search mode** — Simple keyword match vs. RAG semantic search, switchable in UI
- 🧠 **Custom RAG engine** — `tokenize → vectorize → cosineSimilarity → search` built from scratch
- 🪞 **"You may also like"** — `getSimilar()` finds related products per product page
- 🗂 **Category filtering** — works alongside both search modes simultaneously
- 🛡 **Role-based admin panel** — `admin` and `manager` can create/edit products; only `admin` can delete
- 🖼 **Image upload** — drag-and-drop to Supabase Storage, public URL auto-filled in form
- 📊 **RAG Inspector** — live visualization of vocabulary, vector heatmap, similarity matrix
- 🌙 **Dark mode** — full dark/light support with Nordic warm palette

---

## 🧠 RAG Architecture

The recommendation engine runs entirely in Node.js — no OpenAI, no external ML libraries.

```
Products (Supabase)
    │
    ▼
tokenize(name + description)     → ["minimalist", "nordic", "lamp", ...]
    │
    ▼
buildVocab(all products)         → shared vocabulary across all products
    │
    ▼
vectorize(text, vocab)           → [0, 1, 0, 2, 0, 1, ...]  (word count vector)
    │
    ▼
cosineSimilarity(vecA, vecB)     → 0.0 – 1.0 similarity score
    │
    ▼
search(query) / getSimilar(id)   → ranked Product[]
```

### RAG in action

| Query                 | Why it works                                    |
| --------------------- | ----------------------------------------------- |
| `"cozy bedroom"`      | matches lamp + candle + poster descriptions     |
| `"gift idea"`         | matches candle + vase + wall art suppliers      |
| `"natural materials"` | matches driftwood + beeswax + stoneware tokens  |
| `"dining table"`      | matches taper candles + glass vase descriptions |

> ⚠ **Known limitation**: TF-IDF scores word overlap, not semantic meaning. "tall matte" matches both lamps and vases because they share those words. This is intentionally demonstrated in the RAG Inspector — showing understanding of algorithm trade-offs.

---

## 🗂 Project Structure

```
app/
  page.tsx                  ← Shop home — product grid + dual search
  admin/
    layout.tsx              ← Auth guard (Google session + role check)
    page.tsx                ← Product table with Edit →
    rag/page.tsx            ← RAG Inspector (vocab · vectors · matrix)
    products/
      new/page.tsx          ← Create product (POST)
      [id]/edit/page.tsx    ← Edit / Delete product (PUT · DELETE)
    _components/
      ProductForm.tsx       ← Shared form with Supabase image upload
  products/
    [id]/page.tsx           ← Product detail + "You may also like"
    redux/page.tsx          ← Redux demo (portfolio)
    basic/page.tsx          ← Basic fetch demo (portfolio)
  api/
    products/route.ts       ← GET (with category JOIN) · POST
    products/[id]/route.ts  ← GET · PUT · DELETE (auth protected)
    search/route.ts         ← RAG semantic search
    similar/[id]/route.ts   ← "You may also like" endpoint
    categories/route.ts     ← Category list

lib/
  rag-engine.ts             ← tokenize · vectorize · cosineSimilarity · search · getSimilar
  rag-cache.ts              ← In-memory singleton index (rebuilt on deploy)
  supabase.ts               ← createClient with SERVICE_ROLE_KEY
  auth.ts                   ← getAuthUser · requireRole
  validate-product.ts       ← validateProduct · sanitize
  features/products/
    productSlice.ts         ← fetchProducts · fetchProductById · fetchSimilar
  hooks.ts                  ← useAppDispatch · useAppSelector
```

---

## 🔐 Security Architecture

Three layers of protection:

```
Browser                Next.js API Route           Supabase DB
  │                          │                         │
  │  + Bearer JWT token       │                         │
  ├─────────────────────────► │                         │
  │                    getAuthUser()                    │
  │                    supabase.auth.getUser(token) ──► │
  │                    requireRole(["admin","manager"])  │
  │                          │                         │
  │                    supabase.from("products")        │
  │                    .insert() [SERVICE_ROLE_KEY] ──► │
  │                                              RLS policies
  │ ◄──────────────────────── │ ◄────────────────────── │
```

| Layer              | What it protects                        | Where          |
| ------------------ | --------------------------------------- | -------------- |
| `lib/auth.ts`      | API routes from unauthorized requests   | Next.js server |
| RLS policies       | Direct Supabase access via anon key     | PostgreSQL     |
| `admin/layout.tsx` | UI redirect if no session or wrong role | Browser        |

---

## 🗄 Database Schema

```sql
categories        id · name
products          id · name · sku · description · price · category_id →
                  image_url · status · stock_quantity · reorder_threshold · supplier
orders            id · customer_name · status · total_amount · created_by →
order_items       id · order_id → · product_id → · quantity · unit_price · line_total
user_roles        id · user_id → · role (admin | manager | staff)
stock_movements   id · product_id → · quantity · movement_type (in | out | adjustment)
```

---

<!-- ## 🚀 Getting Started

```bash
git clone https://github.com/yourusername/ShopRAG
cd ShopRAG
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

```bash
npm run dev
# → http://localhost:3000
``` -->

---

## 📊 What This Project Demonstrates

- **RAG from scratch** — full pipeline without any AI API or library
- **Next.js App Router** — server components, route handlers, async params
- **Redux Toolkit** — `createAsyncThunk`, typed selectors, normalized state
- **Supabase full-stack** — Auth, Storage, RLS, JS SDK, REST API
- **Role-based access control** — three-tier permission system
- **Algorithm transparency** — RAG Inspector shows exactly why results rank as they do
- **Modular architecture** — `rag-engine.ts` is replaceable with OpenAI embeddings in one function swap

---

## 🔭 Future Enhancements

- Stripe checkout integration
- OpenAI `text-embedding-3-small` to replace TF-IDF vectors
- Cart with Redux persist
- Order management in admin panel
- Mobile-first design pass
