"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-renders the server component around it every few seconds (new orders, a payment landing). */
export default function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
