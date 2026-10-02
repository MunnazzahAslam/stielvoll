import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { FLAVOURS } from "@/data/shop";
import { routing } from "@/i18n/routing";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";

// Read directly: this runs at build time, outside any request.
const messages = (locale: string) => (locale === "en" ? en : de);

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export function generateImageMetadata({ params }: { params: { locale: string } }) {
  return [{ id: "share", alt: messages(params.locale).meta.ogAlt, size, contentType }];
}

// The same outline as PopsicleStill, so the share image matches the site.
const BAR =
  "M10.5 27 C20 10 30 0 41.4 0 L108.6 0 C120 0 130 10 139.5 27 C146 45 150 65 150 83 L150 233 C150 248 138 260 123 260 L27 260 C12 260 0 248 0 233 L0 83 C0 65 4 45 10.5 27Z";

function Popsicle({ color, rotate, height }: { color: string; rotate: number; height: number }) {
  return (
    <svg viewBox="0 0 150 380" height={height} width={(height * 150) / 380} style={{ transform: `rotate(${rotate}deg)` }}>
      <rect x="60" y="240" width="30" height="140" rx="5" fill="#D8B98A" />
      <path d={BAR} fill={color} />
      <rect x="41.5" y="72" width="13" height="150" rx="6.5" fill="#000" opacity="0.1" />
      <rect x="95.5" y="72" width="13" height="150" rx="6.5" fill="#000" opacity="0.1" />
      <path d="M13 96c0-38 7-62 22-76" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { hero } = messages(locale);
  const [display, body] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/bricolage-800.ttf")),
    readFile(join(process.cwd(), "src/assets/figtree-600.ttf")),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#E8434F", color: "#1F0F24", padding: "64px 72px", fontFamily: "Figtree" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ fontFamily: "Bricolage", fontSize: 54, letterSpacing: -2 }}>stielvoll</div>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Bricolage", fontSize: 104, lineHeight: 0.98, letterSpacing: -4 }}>
            <span>{hero.headline1}</span>
            <span>{hero.headline2}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28 }}>
            {FLAVOURS.map((f) => (
              <div key={f.id} style={{ width: 30, height: 30, borderRadius: 15, background: f.color, border: "3px solid #1F0F24" }} />
            ))}
            <span style={{ marginLeft: 10 }}>Hamburg-Ottensen</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 300 }}>
          <Popsicle color="#FFFFFF" rotate={-8} height={470} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: display, weight: 800, style: "normal" },
        { name: "Figtree", data: body, weight: 600, style: "normal" },
      ],
    },
  );
}
