"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";

export default function CartRedirectPage() {
  const router = useRouter();
  const { openCart } = useCart();

  useEffect(() => {
    openCart();
    router.replace("/menu");
  }, [openCart, router]);

  return null;
}
