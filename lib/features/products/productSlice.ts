import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

export type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  // Supabase returns `numeric` as a string to preserve precision — coerce
  // with Number(price) at the render site.
  price: string;
  category_id: string;
  category: { id: string; name: string } | null;
  image_url: string | null;
  status: "active" | "archived";
  stock_quantity: number;
  reorder_threshold: number;
  supplier: string;
  created_at: string;
  updated_at: string;
};

type Status = "idle" | "loading" | "succeeded" | "failed";

type ProductsState = {
  items: Product[];
  current: Product | null;
  similar: Product[];
  status: Status;
  currentStatus: Status;
  error: string | null;
  selectedId: string | null;
};

const initialState: ProductsState = {
  items: [],
  current: null,
  similar: [],
  status: "idle",
  currentStatus: "idle",
  error: null,
  selectedId: null,
};

export const fetchProducts = createAsyncThunk<Product[]>(
  "products/fetch",
  async () => {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Failed to load products");
    return res.json();
  }
);
// 1. Fetch one product by id
export const fetchProductById = createAsyncThunk<Product, string>(
  "products/fetchById",
  async (id) => {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error("Product not found");
    return res.json();
  }
);

// 2. Fetch similar product by RAG
export const fetchSimilar = createAsyncThunk<Product[], string>(
  "products/fetchSimilar",
  async (id) => {
    const res = await fetch(`/api/similar/${id}`);
    if (!res.ok) throw new Error("Failed to load similar");
    return res.json();
  }
);
const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    productSelected(state, action: PayloadAction<string>) {
      state.selectedId = action.payload;
    },
    productDeselected(state) {
      state.selectedId = null;
    },
  },

  // Добавь эти case'ы в extraReducers сразу после последнего .addCase для fetchProducts

  extraReducers: (builder) => {
    builder
      // ── fetchProducts  ──────────────────────────
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchProducts.fulfilled,
        (state, action: PayloadAction<Product[]>) => {
          state.status = "succeeded";
          state.items = action.payload;
        }
      )
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Unknown error";
      })

      // ── fetchProductById  ───────────────────────────
      .addCase(fetchProductById.pending, (state) => {
        state.currentStatus = "loading";
        state.current = null;
        state.similar = [];
        state.error = null;
      })
      .addCase(
        fetchProductById.fulfilled,
        (state, action: PayloadAction<Product>) => {
          state.currentStatus = "succeeded";
          state.current = action.payload;
        }
      )
      .addCase(fetchProductById.rejected, (state, action) => {
        state.currentStatus = "failed";
        state.error = action.error.message ?? "Unknown error";
      })

      // ── fetchSimilar  ───────────────────────────────
      .addCase(
        fetchSimilar.fulfilled,
        (state, action: PayloadAction<Product[]>) => {
          state.similar = action.payload;
        }
      );
  },
});
export const { productSelected, productDeselected } = productsSlice.actions;
export default productsSlice.reducer;
