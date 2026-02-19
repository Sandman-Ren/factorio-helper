# Factorio Production Calculator

A web-based production chain calculator for Factorio 2.0. Input a target item and desired production rate, and get the complete production chain with all required machines and raw materials.

**[Live Demo](https://sandman-ren.github.io/factorio-helper/)**

## Features

- **Full production chain solver** — recursively calculates every intermediate step from raw resources to final product
- **1,000+ items** — covers all items, fluids, and recipes from the Factorio 2.0 base game
- **Factorio-style item picker** — browse items by category tabs or search by name, with in-game icons
- **Flexible rate input** — specify production rate per second, minute, or hour
- **Machine summary** — aggregated count of every machine type needed
- **Raw resource totals** — total input rates for ores, oil, water, and other raw materials
- **Expandable tree view** — drill into any branch of the production chain

## Tech Stack

- React 19, TypeScript, Vite 6
- Tailwind CSS 4, shadcn/ui, Radix UI
- Vitest for testing
- GitHub Actions for CI/CD

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173/factorio-helper/](http://localhost:5173/factorio-helper/) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |
| `npm run fetch-data` | Download Factorio game data |
| `npm run extract-data` | Parse Lua data into JSON |
| `npm run dump-icons` | Extract item icons from Factorio sprites |

## Project Structure

```
src/
  calculator/       # Production chain solver and recipe graph
  data/generated/   # Extracted Factorio 2.0 game data (JSON)
  parser/           # Lua table parser and data extractors
  web/
    components/     # App components (ItemSelector, ProductionChain, Summary)
    hooks/          # React hooks (useCalculator)
    ui/             # shadcn/ui component library (Factorio-themed)
    App.tsx          # Root component
scripts/            # Data fetching and extraction scripts
public/icons/       # Factorio item icons
```

## License

[MIT](LICENSE)
