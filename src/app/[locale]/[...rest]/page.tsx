import { notFound } from "next/navigation";

/** Any other path under a language shows the localised not-found page. */
export default function CatchAll() {
  notFound();
}
