import { useSignal } from "@preact/signals";
import type { TrendEntry, TrendPeriod } from "../data/types";
import { trends } from "../state/store";

const TABS: Array<[TrendPeriod, string]> = [
  ["3d", "3 DAYS"],
  ["7d", "7 DAYS"],
  ["30d", "30 DAYS"],
];

export function TrendTables() {
  const tab = useSignal<TrendPeriod>("3d");
  const all = trends.value;
  if (!all["3d"].length && !all["7d"].length && !all["30d"].length) return null;

  const entries = all[tab.value];
  const positive = entries.filter((e) => e.percent > 0).sort((a, b) => b.percent - a.percent).slice(0, 10);
  const negative = entries.filter((e) => e.percent < 0).sort((a, b) => a.percent - b.percent).slice(0, 10);

  return (
    <div id="trendTableContainer">
      <h4>MARKET TRENDS</h4>
      <div id="trendTabs">
        {TABS.map(([period, label]) => (
          <button
            key={period}
            class={`trend-tab${tab.value === period ? " active" : ""}`}
            onClick={() => (tab.value = period)}
          >
            {label}
          </button>
        ))}
      </div>
      <div class="trend-panel active">
        <HalfTable entries={positive} label="GAINERS" side="pos" />
        <HalfTable entries={negative} label="LOSERS" side="neg" />
      </div>
      <p class="trend-note">
        Price is <strong>midpoint</strong> of ask & bid — or whichever is available.{" "}
        <strong>Δ%</strong> = change from first to last price in the window.{" "}
        <strong>Ups/Downs</strong> = consecutive price increases/decreases.{" "}
        <strong>Type</strong> = trend shape (requires R²≥0.7 to be called Up/Downtrend; otherwise
        Flat, Volatile, or Uncertain). Items with {"<"}5 data points or tiny absolute moves are
        excluded.
      </p>
    </div>
  );
}

function HalfTable({ entries, label, side }: { entries: TrendEntry[]; label: string; side: "pos" | "neg" }) {
  return (
    <div class="trend-half">
      <div class={`trend-sublabel trend-sublabel-${side}`}>{label}</div>
      <table class="trend-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Δ%</th>
            <th>Ups</th>
            <th>Downs</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.item}>
              <td>{entry.item.replace("/items/", "").replace(/_/g, " ")}</td>
              <td class={entry.percent > 0 ? "pct-pos" : entry.percent < 0 ? "pct-neg" : ""}>
                {entry.percent > 0 ? "+" : ""}
                {entry.percent.toFixed(2)}%
              </td>
              <td>{entry.ups}</td>
              <td>{entry.downs}</td>
              <td>{entry.trend}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
