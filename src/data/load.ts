import { ungzip } from "pako";
import {
  byItem,
  latestDataTs,
  marketConfig,
  selectCategory,
  spriteSvg,
  trends,
} from "../state/store";
import { type ByItem, type CompactData, categoryNames } from "./types";

function ungzipToText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Some servers (e.g. vite dev/preview) send .gz files with
  // Content-Encoding: gzip, so the browser already decompressed them.
  // GitHub Pages sends them as opaque binaries. Check the gzip magic bytes.
  const isGzip = bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
  return new TextDecoder().decode(isGzip ? ungzip(bytes) : bytes);
}

export async function loadMarketData(): Promise<void> {
  try {
    const res = await fetch("market.compact.json.gz");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const buffer = await res.arrayBuffer();
    const data = JSON.parse(ungzipToText(buffer)) as CompactData;

    const newByItem: ByItem = {};
    let latest: number | null = null;
    for (const [ts, idx, lvl, ask, bid] of data.rows) {
      const item = data.items[idx];
      ((newByItem[item] ??= {})[lvl] ??= []).push({ t: new Date(ts * 1000), ask, bid });
      if (latest === null || ts > latest) latest = ts;
    }
    // Sort once at build time so consumers never re-sort.
    for (const levels of Object.values(newByItem)) {
      for (const series of Object.values(levels)) {
        series.sort((a, b) => a.t.getTime() - b.t.getTime());
      }
    }

    byItem.value = newByItem;
    latestDataTs.value = latest;
    trends.value = {
      "3d": data.trends_3d ?? [],
      "7d": data.trends_7d ?? [],
      "30d": data.trends_30d ?? [],
    };
    marketConfig.value = data.config;

    const cats = categoryNames(data.config);
    if (cats.length > 0) selectCategory(cats[0]);
  } catch (e) {
    console.log("Could not load initial data.", e);
  }
}

export async function loadSprite(): Promise<void> {
  try {
    const res = await fetch("items_sprite_filtered.svg.gz");
    if (!res.ok) throw new Error(`Failed to fetch sprite: ${res.status}`);
    const buffer = await res.arrayBuffer();
    spriteSvg.value = ungzipToText(buffer);
  } catch (e) {
    console.error("Failed to load SVG sprite:", e);
  }
}
