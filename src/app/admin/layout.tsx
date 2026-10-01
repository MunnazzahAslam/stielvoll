import type { Metadata } from "next";
import { bricolage, figtree } from "../fonts";
import "../globals.css";

export const metadata: Metadata = { title: "Orders · Stielvoll", robots: { index: false, follow: false } };

/** /admin has its own root layout: no shop header, no languages, just the orders. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
