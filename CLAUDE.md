# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The `alver/alver.github.io` user site, served at https://alver.cc. It is one
static page: an index of the author's personal projects. Nothing more.

There is **no build step and no dependencies** — no npm, no bundler, no
framework. Edit the HTML and CSS directly.

## Layout

```
public/          everything that ships (uploaded as the Pages artifact)
  index.html     markup + two small inline scripts (theme bootstrap, theme toggle)
  styles.css     all styling
  CNAME          alver.cc — must stay at the artifact root
  favicon.ico
.github/workflows/deploy.yml
```

Local preview: `python -m http.server -d public 8000`.

## Conventions

- **Theme** is a `data-theme` attribute on `<html>`, set by an inline script in
  `<head>` before first paint (avoids a flash of the wrong theme) and persisted
  to `localStorage`. All colors are CSS custom properties defined on
  `:root[data-theme="dark"]` / `:root[data-theme="light"]` — never hardcode a
  color anywhere else.
- **Projects** are `<li class="row-item">` rows in `index.html`. Every row is
  styled identically — a project is a project, whether it links to a live page
  or just to its source repo.
- The staggered row entrance uses explicit `.row-item:nth-child(n)` delays in
  `styles.css` — adding rows means adding delays.
- The CRT look (scanline overlay, cyan accent, mono labels) is inherited from
  the market tracker that used to live here. Keep it.

## Deployment

Push to `main` → `.github/workflows/deploy.yml` uploads `public/` via
`actions/upload-pages-artifact` and deploys with `actions/deploy-pages`, retrying
up to 3 times because the Pages backend fails transiently. Repo setting:
Pages Source = "GitHub Actions".

## History

The Milky Way Idle market tracker (Vite + Preact app, Python data scripts,
hourly data commits) lived in this repo until August 2026. It moved to
[alver/milkywayidle_market](https://github.com/alver/milkywayidle_market) and is
archived. Its history is still in this repo's git log.
