"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { onFlight, type Flight } from "@/lib/cart";
import PopsicleStill from "./PopsicleStill";

/** Mini popsicles that drop from the button just pressed into the cart icon. */
export default function FlyLayer() {
  const reduced = useReducedMotion();
  const [flights, setFlights] = useState<(Flight & { to: { x: number; y: number } })[]>([]);

  useEffect(
    () =>
      onFlight((flight) => {
        const cart = document.getElementById("cart-button")?.getBoundingClientRect();
        if (!cart) return;
        setFlights((f) => [...f, { ...flight, to: { x: cart.left + cart.width / 2, y: cart.top + cart.height / 2 } }]);
      }),
    [],
  );

  if (reduced) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
      <AnimatePresence>
        {flights.map((f) => (
          <motion.div
            key={f.id}
            className="absolute top-0 left-0 -mt-6 -ml-2.5"
            initial={{ x: f.from.x, y: f.from.y, scale: 1.2, rotate: -20 }}
            animate={{ x: f.to.x, y: f.to.y, scale: 0.5, rotate: 25 }}
            // Moving up fast and across slowly at first bends the path into an arc that stays on screen.
            transition={{ duration: 0.7, x: { ease: "easeIn", duration: 0.7 }, y: { ease: "easeOut", duration: 0.7 }, ease: "easeInOut" }}
            onAnimationComplete={() => setFlights((all) => all.filter((x) => x.id !== f.id))}
          >
            <PopsicleStill color={f.color} className="h-12 w-auto" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
