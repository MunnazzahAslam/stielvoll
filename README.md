# Stielvoll

**Fruit on a stick. Nothing else.**

Stielvoll is a concept website for an organic popsicle shop in Hamburg-Ottensen, available in
German and English. Its centrepiece is a soft-body 3D popsicle in the hero: drag it and it
wobbles like jelly before settling back; tap it and you take a bite out of it.

> Stielvoll is a concept brand created for a portfolio project. There is no real
> certification, and no real orders are taken.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [How the jelly works](#how-the-jelly-works)
- [Internationalisation](#internationalisation)
- [Shop data and the cart](#shop-data-and-the-cart)
- [Accessibility](#accessibility)
- [Customising](#customising)
- [Roadmap](#roadmap)

## Features

- **Jelly hero.** A rounded ice-lolly bar, simulated as a spring lattice, that you can grab and
  fling with a mouse or finger. It wobbles three to four times before coming to rest.
- **Take a bite.** Tapping the popsicle bites a chunk out of it, tooth marks included, up to
  eight bites. A "Fresh one" button brings back a whole popsicle.
- **Six flavours.** Each card lists the ingredients in order of quantity, highlights allergens
  as EU labelling expects, and marks vegan flavours. Choosing a flavour recolours the hero.
- **Box builder.** Mix a box of 6 or 12 popsicles in any combination and see what you save
  compared with buying them one by one.
- **Cart drawer.** Singles and boxes, with quantity controls, allergen notes and a subtotal.
  The cart is kept in the browser, so it survives a reload. Items fly into the cart icon when
  you add them.
- **Content sections.** How ordering works, what goes into the popsicles, opening hours,
  pickup and same-day delivery districts, and an FAQ.
- **Two languages.** German at `/`, English at `/en`, with every piece of copy translated.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) with React 19 |
| Language | TypeScript |
| 3D | [three.js](https://threejs.org), [@react-three/fiber](https://r3f.docs.pmnd.rs) and [@react-three/drei](https://drei.docs.pmnd.rs) |
| Physics | A small hand-written soft-body solver (`src/lib/jelly.ts`) |
| Animation | [Motion](https://motion.dev) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| i18n | [next-intl](https://next-intl.dev) |
| Linting | ESLint 9 with `eslint-config-next` |

## Getting started

You need Node.js 20 or newer.

```bash
npm install
npm run dev       # German at http://localhost:3000, English at http://localhost:3000/en
```

Other scripts:

```bash
npm run build     # production build
npm run start     # serve the production build
npm run lint      # run ESLint
```

## Project structure

```
messages/
  de.json, en.json          All copy, in German and English
src/
  app/
    [locale]/layout.tsx     Root layout per language: fonts, metadata, providers
    [locale]/page.tsx       The shop page, assembled from the sections below
    globals.css             Tailwind setup and the colour palette
    icon.svg                Favicon
  components/
    Hero.tsx                Hero, flavour chips, and the still fallback when 3D is off
    JellyPopsicle.tsx       The 3D popsicle: geometry, material, dragging and biting
    PopsicleStill.tsx       Flat SVG popsicle, used as fallback and in the cart animation
    Flavours.tsx            Flavour cards with ingredients and allergens
    BoxBuilder.tsx          Pick a box size and fill it
    CartDrawer.tsx          The cart panel
    FlyLayer.tsx            Mini popsicles that fly into the cart icon
    Sections.tsx            How it works, About, Visit, FAQ
    Header.tsx, Footer.tsx, Logo.tsx, Tags.tsx
    FlavourProvider.tsx     The currently selected flavour, shared across the page
    hooks.ts                useCart, useMoney, useLocalised
  data/shop.ts              Flavours, box prices and delivery districts
  lib/
    jelly.ts                The soft-body simulation (pure maths, no three.js)
    cart.ts                 Cart contents, sums and persistence
