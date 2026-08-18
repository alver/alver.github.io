# alver.github.io

The personal site at **https://alver.cc** — a single page listing the small web
projects I've built.

## What's here

```
public/
  index.html   the whole page
  styles.css   the whole stylesheet
  CNAME        alver.cc
  favicon.ico
```

No build step, no dependencies, no framework. Open `public/index.html` in a
browser to work on it, or serve the folder:

```bash
python -m http.server -d public 8000
```

## Adding a project

Copy one `<li class="row-item">` block in `public/index.html`, change the link,
glyph, title and description. If you add an eighth row or beyond, add a matching
`.row-item:nth-child(n)` animation delay in `public/styles.css`.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which uploads
`public/` to GitHub Pages. The deploy step retries up to 3 times because the
Pages backend occasionally fails transiently.

One-time repo setting: Settings → Pages → Source must be **"GitHub Actions"**.

## History

This repo used to host the Milky Way Idle market tracker as well. That project
was retired in August 2026 and now lives at
[alver/milkywayidle_market](https://github.com/alver/milkywayidle_market).
