"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { FLAVOURS, type Flavour, type FlavourId } from "@/data/shop";

type FlavourState = { flavour: Flavour; setFlavour: (id: FlavourId) => void };

const Ctx = createContext<FlavourState | null>(null);

/** The flavour picked in the hero. It colours the hero, the popsicle and the logo. */
export function FlavourProvider({ children }: { children: ReactNode }) {
  const [id, setFlavour] = useState<FlavourId>(FLAVOURS[0].id);
  const flavour = FLAVOURS.find((f) => f.id === id)!;

  // Expose the colours to CSS so anything on the page can use them.
  useEffect(() => {
    document.body.style.setProperty("--flavour", flavour.color);
    document.body.style.setProperty("--flavour-ink", flavour.ink);
  }, [flavour]);

  return <Ctx value={{ flavour, setFlavour }}>{children}</Ctx>;
}

export function useFlavour() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFlavour must be used inside <FlavourProvider>");
  return ctx;
}
