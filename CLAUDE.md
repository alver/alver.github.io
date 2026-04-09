# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static GitHub Pages site for visualizing market data from the "Milky Way Idle" game. The site tracks item prices over time with interactive Chart.js charts. The README notes this is a "vibe-coded" personal project.

## Local Development

Since `index.html` fetches data dynamically (gzipped files), you cannot open it directly in a browser:

```bash
python -m http.server 8080
# Visit http://localhost:8080
```

## Python Scripts (in `tools/`)

All scripts must be run from the `tools/` directory:

```bash
cd tools

# Fetch latest market data, generate market.compact.json.gz, and push to GitHub
python market.py

# Filter SVG sprite to only tracked items (outputs ../items_sprite_filtered.svg)
python filter_svg_icons.py

# After filter_svg_icons.py, compress on Linux/Mac:
gzip -c ../items_sprite_filtered.svg > ../items_sprite_filtered.svg.gz
```

## Architecture

### Data Flow

1. **`tools/market.py`** fetches `marketplace.json` from game servers hourly, saves timestamped snapshots to `tools/downloads/`, then calls `prepare_new_data()` to:
   - Read snapshots from the last 30 days
   - Filter to only items in `tools/config.json`
   - Deduplicate rows (only emit a row when ask/bid prices change)
   - Run trend analysis (3d/7d/30d) via `analyze_trends()`
   - Write `market.compact.json.gz` to the repo root
   - Git commit and push via hardcoded `C:\Program Files\Git\bin\git.exe` (Windows-specific — needs fixing for other OSes)

2. **`market.compact.json.gz`** is the sole dynamic data file the frontend consumes. Structure:
   ```json
   { "items": [...], "rows": [[ts, itemIdx, level, ask, bid], ...], "config": {...}, "trends_3d": [...], "trends_7d": [...], "trends_30d": [...] }
   ```

3. **`items_sprite_filtered.svg.gz`** — gzipped SVG spritesheet containing only icons for tracked items.

### Frontend (`index.html`)

Single-file vanilla JS app. On load it fetches both `.gz` files, decompresses with Pako, and builds the UI. Key globals:
- `byItem` — nested map: `itemPath → level → [{t, ask, bid}]`
- `itemConfig` — parsed `config` section from the data file (categories + `ItemTokenPrices`)
- `currentItem`, `currentLvl`, `currentTimeRangeDays` — UI state

The item name display shows `tokenPrice - moneyPerToken` for dungeon items that have an `ItemTokenPrices` entry, letting users compare gold-per-token efficiency.

### Configuration (`tools/config.json`)

Organized by category (Resources, Dungeons, Consumables, Books, Keys, Equipment, Accessories, Tools). Item paths use the format `/items/item_name`. The special `ItemTokenPrices` section maps dungeon drop item paths to their token shop cost — do not reorganize this section.

### Third-party libraries (vendored)

- `chart.js` — charting
- `chartjs-adapter-date-fns.js` — date axis adapter
- `pako.min.js` — client-side gzip decompression
