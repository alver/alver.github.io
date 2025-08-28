# Milky Way Idle Market Visualizer

A lightweight, static website for visualizing market data and tracking item prices from the "Milky Way Idle" game. This project provides an optimized solution for monitoring market trends while minimizing bandwidth usage through configurable item filtering and traffic-conscious asset optimization.

Mostly everything in this repository is "vibe-coded", so keep in mind before critisize the code or so - project was done in several hours just for fun and learning purpose.

## Overview

This is a visual website combined with a set of Python scripts designed to automatically update market data. Since the website is hosted on GitHub Pages (free tier with traffic limitations), the system is specifically optimized to minimize bandwidth usage by tracking only the items you actually need.

**Live Site:** The repository is automatically deployed via GitHub Pages, with `index.html` serving as the main entry point.

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

After updating your item configuration, create an "filtered" SVG sprite file:

```bash
python filter_svg_icons.py
```

This script:
- Reads your `config.json` item list
- Filters the original SVG spritesheet to include only needed icons
- Outputs `../items_sprite_filtered.svg`

To save bandwidth, manually compress the filtered SVG:

**Windows:**
```bash
# Using 7-Zip or similar
7z a -tgzip items_sprite_filtered.svg.gz items_sprite_filtered.svg
```

**Linux/Mac:**
```bash
gzip -c items_sprite_filtered.svg > items_sprite_filtered.svg.gz
```

### 3. Set Up Automated Market Data Collection

The `market.py` script handles automatic market data updates:

**What it does:**
- Fetches the latest `marketplace.json` from the game servers
- Compares with the last saved version to avoid redundant updates
- Filters data to include only items from your `config.json`
- Generates a compact JSON file containing market data for the last 30 days (configurable)
- Performs trend analysis for 3, 7, and 30-day periods (very experimental, very vibecoded)
- Compresses the data using gzip
- Automatically commits and pushes updates to GitHub

**Manual execution:**
```bash
python market.py
```

**Automated execution (recommended):**

Add the script to your system's task scheduler to run hourly.

## Local Development

Since the website loads data dynamically, you cannot simply open `index.html` in your browser. Use a local web server, I suggesting to use solution integrated into the Python:

```bash
python -m http.server 8080
# Visit http://localhost:8080
```

## Technology Stack

- **Frontend**: Vanilla JavaScript, Chart.js for visualizations
- **Data Processing**: Python 3 with standard libraries
- **Compression**: Gzip for data and assets
- **Hosting**: GitHub Pages (static hosting)
- **Version Control**: Git for automated deployments

## Contributing

This project is designed for personal use, feel free to fork and do whatever you like. Author will not manage the pull requests or any other activity for this project.

## Credits

- **Charts**: Chart.js and chartjs-adapter-date-fns
- **Compression**: Pako for client-side gzip decompression
- **Game**: Milky Way Idle market data
- **Icons**: SVG sprites from Milky Way Idle
