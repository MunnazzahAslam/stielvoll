"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

/** Empties the cart once its order is confirmed. */
export default function ClearCart() {
  useEffect(() => {
    clearCart();
    try {
      sessionStorage.removeItem("stielvoll-checkout-v1");
    } catch {}
  }, []);
  return null;
}
