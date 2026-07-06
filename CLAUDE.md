# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static GitHub Pages site (the `alver/alver.github.io` user site, served at https://alver.cc) for visualizing market data from the "Milky Way Idle" game. The site tracks item prices over time with interactive Chart.js charts. The README notes this is a "vibe-coded" personal project.

## Local Development

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run typecheck  # tsc --noEmit
npm run build      # production build into dist/
npm run preview    # serve dist/ locally
```

## Python Scripts (in `tools/`)

All scripts must be run from the `tools/` directory:

```bash
cd tools

# Fetch latest market data, generate public/market.compact.json.gz, and push to GitHub
python market.py

# Filter SVG sprite to only tracked items; writes public/items_sprite_filtered.svg.gz
# (gzips automatically, no manual compression step)
python filter_svg_icons.py
```

## Architecture

### Data Flow

1. **`tools/market.py`** fetches `marketplace.json` from game servers hourly (Windows Task Scheduler task `CheckMWIMarket`), saves timestamped snapshots to `tools/downloads/`, then calls `prepare_new_data()` to:
   - Read snapshots from the last 30 days
   - Filter to only items in `tools/config.json`
   - Deduplicate rows (only emit a row when ask/bid prices change)
   - Run trend analysis (3d/7d/30d) via `analyze_trends()`
   - Write `public/market.compact.json.gz`
   - Git commit only that file and push via hardcoded `C:\Program Files\Git\bin\git.exe` (Windows-specific — needs fixing for other OSes)

2. **`public/market.compact.json.gz`** is the sole dynamic data file the frontend consumes. Structure:
   ```json
   { "items": [...], "rows": [[ts, itemIdx, level, ask, bid], ...], "config": {...}, "trends_3d": [...], "trends_7d": [...], "trends_30d": [...] }
   ```

3. **`public/items_sprite_filtered.svg.gz`** — gzipped SVG spritesheet containing only icons for tracked items. Source sprites live in `svg/` (tracked but not deployed).

### Deployment

`.github/workflows/deploy.yml` runs on every push to `main` (including the hourly data commits): `npm ci` → typecheck → `vite build` → `actions/deploy-pages`. The deploy step retries up to 3 times because GitHub's Pages backend intermittently fails with "Deployment failed, try again later". Repo Setting: Pages Source = "GitHub Actions". `public/CNAME` (alver.cc) ships inside the build artifact.

### Frontend (`src/`, Vite + Preact + TypeScript)

- `src/main.tsx` — entry: sets Chart.js default font, applies saved theme to `<body data-theme>`, kicks off data/sprite loading, renders `<App/>`.
- `src/state/store.ts` — all state as module-level `@preact/signals` signals + computeds + actions. Key signals: `byItem` (itemPath → level → sorted `PricePoint[]`), `marketConfig` (parsed `config` incl. `ItemTokenPrices`), `trends`, `currentItem`/`currentLevel`/`currentCategory`, `timeRangeDays`, `showPoints`, `theme`. `setTheme()` must flip `document.body.dataset.theme` BEFORE writing the signal — the chart effect reads colors synchronously via `getComputedStyle`.
- `src/data/load.ts` — fetches the two `.gz` files, decompresses with pako, builds `byItem`, auto-selects the first category/item/level.
- `src/data/projects.ts` — config array for the side-panel project links (add a project = add one entry).
- `src/ui/PriceChart.tsx` — Chart.js lifecycle: destroys/recreates the chart in one `useSignalEffect`. Imports from `chart.js/auto` (selective registration silently breaks the time scale). `chartjs-adapter-date-fns@3` requires `date-fns@^2` — do not bump date-fns to v3.
- `src/ui/SidePanel.tsx` — left-edge sliding "MORE PROJECTS BY ALVER" drawer (hover on desktop, tap on touch, Escape closes).
- `src/styles.css` — single global stylesheet; CRT theme, dark/light via CSS custom properties on `body[data-theme]`.

The item name display shows `tokenPrice — moneyPerToken/token` for dungeon items that have an `ItemTokenPrices` entry, letting users compare gold-per-token efficiency.

### Configuration (`tools/config.json`)

Organized by category (Resources, Dungeons, Consumables, Books, Keys, Equipment, Accessories, Tools). Item paths use the format `/items/item_name`. The special `ItemTokenPrices` section maps dungeon drop item paths to their token shop cost — do not reorganize this section.
