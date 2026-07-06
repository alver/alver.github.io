/** One row of the compact market file: [ts, itemIdx, level, ask, bid].
 *  ask/bid can be -1 ("no order"); market.py never emits both as -1. */
export type CompactRow = [ts: number, itemIdx: number, level: number, ask: number, bid: number];

export interface TrendEntry {
  item: string; // "/items/foo_bar"
  first: number;
  last: number;
  change: number;
  percent: number;
  ups: number;
  downs: number;
  slope_per_day: number;
  r2: number;
  volatility_cv: number;
  trend: string; // "Flat" | "Uptrend" | "Strong Uptrend" | "Downtrend" | ...
}

/** tools/config.json: category name -> item paths, plus the special
 *  ItemTokenPrices map (item path -> token shop cost). */
export type MarketConfig = Record<string, string[] | Record<string, number>>;

export function categoryNames(cfg: MarketConfig): string[] {
  return Object.keys(cfg).filter((k) => Array.isArray(cfg[k]) && k !== "ItemTokenPrices");
}

export function tokenPrices(cfg: MarketConfig): Record<string, number> {
  return (cfg["ItemTokenPrices"] as Record<string, number> | undefined) ?? {};
}

export interface CompactData {
  items: string[];
  rows: CompactRow[];
  config: MarketConfig;
  trends_3d: TrendEntry[];
  trends_7d: TrendEntry[];
  trends_30d: TrendEntry[];
}

export interface PricePoint {
  t: Date;
  ask: number;
  bid: number;
}

/** itemPath -> enhancement level -> points sorted by time. */
export type ByItem = Record<string, Record<number, PricePoint[]>>;

export type TrendPeriod = "3d" | "7d" | "30d";
export type Theme = "dark" | "light";
