"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { cartCleared } from "@/lib/features/cart/cartSlice";

export default function SuccessClient() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(cartCleared());
  }, [dispatch]);
  return null;
}
