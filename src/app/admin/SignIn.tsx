"use client";

import { useActionState } from "react";
import Logo from "@/components/Logo";
import { signIn } from "./actions";

export default function SignIn() {
  const [error, action, pending] = useActionState(signIn, null);
  return (
    <main className="grid min-h-svh place-items-center px-5">
      <form action={action} className="w-full max-w-sm rounded-[28px] bg-white p-7">
        <Logo className="text-[30px]" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">Orders</h1>
        <label htmlFor="password" className="mt-5 mb-1.5 block text-sm font-bold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={!!error || undefined}
          aria-describedby={error ? "password-error" : undefined}
          className="h-12 w-full rounded-2xl border-2 border-currant/15 px-4 text-base outline-none focus:border-currant aria-invalid:border-[#B3202C]"
        />
        {error && (
          <p id="password-error" role="alert" className="mt-2 text-sm font-bold text-[#B3202C]">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className="mt-5 h-12 w-full rounded-full bg-currant font-bold text-frost disabled:opacity-60">
          {pending ? "Signing in …" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
