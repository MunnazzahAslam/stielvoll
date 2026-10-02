"use client";

import { useTransition } from "react";
import type { Fulfilment, OrderStatus } from "@/lib/order";
import { changeStatus } from "./actions";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "preparing", label: "Preparing" },
  { status: "ready", label: "Ready" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "done", label: "Done" },
];

export default function StatusButtons({ id, status, fulfilment }: { id: string; status: OrderStatus; fulfilment: Fulfilment }) {
  const [pending, start] = useTransition();
  // Pickups never go out for delivery.
  const steps = STEPS.filter((s) => fulfilment === "delivery" || s.status !== "out_for_delivery");

  return (
    <div role="group" aria-label="Status" className="flex flex-wrap gap-1.5" aria-busy={pending}>
      {steps.map((s) => (
        <button
          key={s.status}
          type="button"
          disabled={pending}
          aria-pressed={status === s.status}
          onClick={() => start(() => changeStatus(id, status === s.status ? "new" : s.status))}
          className="h-9 rounded-full border-2 border-currant/20 px-3 text-sm font-bold disabled:opacity-60 aria-pressed:border-currant aria-pressed:bg-currant aria-pressed:text-frost"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
