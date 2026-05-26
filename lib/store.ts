import { configureStore } from "@reduxjs/toolkit";
import productsReducer from "../lib/features/products/productSlice";
import cartReducer from "../lib/features/cart/cartSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      products: productsReducer,
      cart: cartReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
