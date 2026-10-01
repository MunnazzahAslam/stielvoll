"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order";
import { ADMIN_COOKIE, isAdmin, passwordMatches, sessionToken } from "@/lib/server/admin";
import { setStatus } from "@/lib/server/orders";

export async function signIn(_: string | null, form: FormData): Promise<string | null> {
  const password = String(form.get("password") ?? "");
  // A small pause makes guessing slow without bothering the shop owner.
  await new Promise((r) => setTimeout(r, 400));
  if (!sessionToken()) return "ADMIN_PASSWORD is not set on the server.";
  if (!passwordMatches(password)) return "That password isn’t right.";

  (await cookies()).set(ADMIN_COOKIE, sessionToken()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 14,
  });
  revalidatePath("/admin");
  return null;
}

export async function signOut() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  revalidatePath("/admin");
}

export async function changeStatus(id: string, status: OrderStatus) {
  if (!(await isAdmin())) throw new Error("Not signed in");
  if (!ORDER_STATUSES.includes(status)) throw new Error("Unknown status");
  await setStatus(id, status);
  revalidatePath("/admin");
}
