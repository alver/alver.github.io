# Milky Way Idle Market Visualizer

A lightweight, static website for visualizing market data and tracking item prices from the "Milky Way Idle" game. This project provides an optimized solution for monitoring market trends while minimizing bandwidth usage through configurable item filtering and traffic-conscious asset optimization.

Mostly everything in this repository is "vibe-coded", so keep in mind before critisize the code or so - project was done in several hours just for fun and learning purpose.

Project running on Windows, but must be ok to use on any other OSs, just fix the git usage in `market.py` script.

## Overview

This is a visual website combined with a set of Python scripts designed to automatically update market data. Since the website is hosted on GitHub Pages (free tier with traffic limitations), the system is specifically optimized to minimize bandwidth usage by tracking only the items you actually need.

**Live Site:** https://alver.cc — built with Vite and deployed to GitHub Pages by the GitHub Actions workflow in `.github/workflows/deploy.yml` on every push to `main`.

The "dynamic" part implemented in two archives in `public/` - the icons `items_sprite_filtered.svg.gz` and market data `market.compact.json.gz`. The webpage downloads these two files and uses them to show all the information. Below you can find instructions how to create these two files.

## Key Features

- 📊 **Interactive Market Charts** - Visualize price trends using Chart.js
- 🎯 **Configurable Item Tracking** - Monitor only the items you need via `config.json`
- 🗜️ **Optimized Assets** - Gzipped data files and filtered SVG sprites for minimal traffic
- 🤖 **Automated Updates** - Hourly market data collection and GitHub Pages deployment
- 📈 **Trend Analysis (exrepimental)** - Automatic trend detection for 3-day, 7-day, and 30-day periods

## Configuration and Setup

### 1. Configure Items to Track

Edit `tools/config.json` to specify which items you want to monitor. The configuration is organized by categories:

```json
{
  "Resources": [
    "/items/star_fruit",
    "/items/holy_milk",
    "/items/chrono_sphere"
  ],
  "Dungeons": [
    "/items/griffin_leather",
    "/items/manticore_sting"
  ],
  "Equipment": [
    "/items/acrobatic_hood",
    "/items/sundering_crossbow"
  ]
}
```

Don't touch the `ItemTokenPrices` section in the end of `config.json` - this is special one to calculate money profit per token for items from dungeons.

### 2. Prepare Icons file

After updating your item configuration, regenerate the filtered SVG sprite (run from `tools/`):

```bash
python filter_svg_icons.py
```

This script:
- Reads your `config.json` item list
- Filters the original SVG spritesheet to include only needed icons
- Writes the gzipped result straight to `public/items_sprite_filtered.svg.gz` (no manual compression step needed)

### 3. Set Up Automated Market Data Collection

The `market.py` script handles automatic market data updates and generates the `public/market.compact.json.gz` file with latest information, and automatically pushes it to GitHub (which triggers a site rebuild and deploy).

**What it does in more details:**
- Fetches the latest `marketplace.json` from the game servers
- Compares with the last saved version to avoid redundant updates
- Filters data to include only items from your `config.json`
- Generates a compact JSON file containing market data for the last 30 days (configurable)
- Performs trend analysis for 3, 7, and 30-day periods (very experimental, very vibecoded)
- Compresses the data using gzip (`public/market.compact.json.gz`)
- Automatically commits and pushes updates to GitHub

**Manual execution:**
```bash
python market.py
```

**Automated execution (recommended):**

Add the script to your system's task scheduler to run hourly.

## Local Development

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run typecheck  # type-check without emitting
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

The frontend is a Vite + Preact + TypeScript app in `src/`:

- `src/main.tsx` — entry point (Chart.js defaults, theme bootstrap, data loading kick-off)
- `src/app.tsx` — page layout
- `src/state/store.ts` — application state as `@preact/signals` signals/computeds/actions
- `src/data/` — types, gzip data loading (`load.ts`), and the side-panel project list (`projects.ts`)
- `src/ui/` — Preact components (chart, item browser, trend tables, header, sliding side panel)
- `src/styles.css` — single global stylesheet (CRT theme, dark/light via CSS custom properties)

Static files in `public/` (data archives, favicon, CNAME) are served at the site root.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`: typecheck → Vite build → upload to GitHub Pages via `actions/deploy-pages`. The deploy step retries up to 3 times because the GitHub Pages backend occasionally fails transiently ("Deployment failed, try again later").

One-time repo setting: Settings → Pages → Source must be **"GitHub Actions"**.

## Technology Stack

- **Frontend**: TypeScript, Preact + @preact/signals, Chart.js, Vite
- **Data Processing**: Python 3 with standard libraries
- **Compression**: Gzip for data and assets (Pako for client-side decompression)
- **Hosting**: GitHub Pages (static hosting) via GitHub Actions
- **Version Control**: Git for automated deployments

## Contributing

This project is designed for personal use, feel free to fork and do whatever you like. Author will not manage the pull requests or any other activity for this project.

## Credits

- **Charts**: Chart.js and chartjs-adapter-date-fns
- **Compression**: Pako for client-side gzip decompression
- **Game**: Milky Way Idle market data
- **Icons**: SVG sprites from Milky Way Idle
