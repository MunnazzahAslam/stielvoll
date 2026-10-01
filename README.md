# Stielvoll

A concept website for an organic popsicle shop in Hamburg-Ottensen, in German and English.
The hero popsicle is a soft 3D body: drag it and it wobbles like jelly before settling back.
Tap it and you take a bite.

> Stielvoll is a concept brand created for a portfolio project. No real certification or orders.

## Status

Checkpoint 2 of 4: the shop page is complete (jelly hero, flavour cards with ingredients
and allergens, box builder, cart, and the content sections) in German and English.
Checkout with Stripe test mode and the orders page come next.

## Run it locally

```bash
npm install
npm run dev     # German at http://localhost:3000, English at /en
```

## Where things live

| Path | What |
| --- | --- |
| `src/lib/jelly.ts` | The soft body: a spring lattice, Verlet integration and free-form deformation |
| `src/components/JellyPopsicle.tsx` | The 3D popsicle, its material, and mouse and touch dragging |
| `src/components/Hero.tsx` | The hero, flavour chips and the still fallback |
| `src/components/Flavours.tsx`, `BoxBuilder.tsx`, `CartDrawer.tsx` | The shop: cards, box builder and cart |
| `src/lib/cart.ts` | Cart contents and sums, saved in the browser |
| `src/data/shop.ts` | Flavours, box prices and delivery districts |
| `messages/de.json`, `messages/en.json` | All copy, in both languages |
| `src/i18n/`, `src/proxy.ts` | Language routing: German at `/`, English at `/en` |

To change how the jelly feels, edit `FIRMNESS` and `DAMPING` at the top of
`src/components/JellyPopsicle.tsx`. The size and number of bites are in `BITE`
in the same file.
