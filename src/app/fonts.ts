import { Bricolage_Grotesque, Figtree } from "next/font/google";

// Both are variable fonts: one file each covers the weights we use.
export const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
export const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
