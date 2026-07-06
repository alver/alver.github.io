import { signal, computed } from "@preact/signals";
import {
  type ByItem,
  type MarketConfig,
  type PricePoint,
  type Theme,
  type TrendEntry,
  type TrendPeriod,
  categoryNames,
  tokenPrices,
} from "../data/types";

// ─── Data signals ────────────────────────────────────────────────
export const byItem = signal<ByItem>({});
export const marketConfig = signal<MarketConfig | null>(null);
export const trends = signal<Record<TrendPeriod, TrendEntry[]>>({ "3d": [], "7d": [], "30d": [] });
export const latestDataTs = signal<number | null>(null); // epoch seconds
export const spriteSvg = signal("");

// ─── UI signals ──────────────────────────────────────────────────
export const currentCategory = signal<string | null>(null);
export const currentItem = signal<string | null>(null);
export const currentLevel = signal<number | null>(null);
export const timeRangeDays = signal(30);
export const showPoints = signal(true);
export const theme = signal<Theme>(localStorage.getItem("theme") === "light" ? "light" : "dark");
export const sidePanelOpen = signal(false);

// ─── Computeds ───────────────────────────────────────────────────
export const categories = computed(() =>
  marketConfig.value ? categoryNames(marketConfig.value) : [],
);

export const itemsInCategory = computed(() => {
  const cfg = marketConfig.value;
  const cat = currentCategory.value;
  if (!cfg || !cat) return [];
  const list = cfg[cat];
  if (!Array.isArray(list)) return [];
  return list.filter((itm) => byItem.value[itm]);
});

export function levelsFor(item: string): number[] {
  return Object.keys(byItem.value[item] ?? {})
    .map(Number)
    .sort((a, b) => a - b);
}

export const levelsForItem = computed(() =>
  currentItem.value ? levelsFor(currentItem.value) : [],
);

/** Full (unfiltered) series for the current item+level, sorted by time. */
export const currentSeries = computed<PricePoint[] | null>(() => {
  const item = currentItem.value;
  const lvl = currentLevel.value;
  if (!item || lvl === null) return null;
  return byItem.value[item]?.[lvl] ?? null;
});

export const itemTitle = computed(() => {
  const item = currentItem.value;
  if (!item) return "";
  let name = item.replace("/items/", "").replace(/_/g, " ");
  const cfg = marketConfig.value;
  const tokenPrice = cfg ? tokenPrices(cfg)[item] : undefined;
  if (tokenPrice) {
    const series = currentSeries.value;
    const lastBid = series && series.length > 0 ? series[series.length - 1].bid : 0;
    if (lastBid && tokenPrice > 0) {
      name += ` (${tokenPrice} — ${(lastBid / tokenPrice).toFixed(2)}/token)`;
    } else {
      name += ` (${tokenPrice} tokens)`;
    }
  }
  return name;
});

// ─── Actions ─────────────────────────────────────────────────────
export function selectCategory(cat: string) {
  currentCategory.value = cat;
  const available = itemsInCategory.value;
  if (available.length > 0) {
    selectItem(available[0]);
  } else {
    currentItem.value = null;
    currentLevel.value = null;
  }
}

export function selectItem(item: string) {
  currentItem.value = item;
  const levels = levelsFor(item);
  currentLevel.value = levels.length > 0 ? levels[0] : null;
}

export function selectLevel(lvl: number) {
  currentLevel.value = lvl;
}

export function setTheme(t: Theme) {
  // DOM attribute must flip BEFORE the signal write: the chart effect runs
  // synchronously on the write and reads colors via getComputedStyle(body).
  document.body.dataset.theme = t;
  localStorage.setItem("theme", t);
  theme.value = t;
}
