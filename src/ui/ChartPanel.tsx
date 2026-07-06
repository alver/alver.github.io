import { currentLevel, itemTitle, levelsForItem, selectLevel, showPoints, timeRangeDays } from "../state/store";
import { PriceChart } from "./PriceChart";

const RANGES = [30, 15, 7, 3];

export function ChartPanel() {
  const levels = levelsForItem.value;
  return (
    <div id="chart-container">
      <h3 id="currentItemName">{itemTitle.value}</h3>
      <div id="canvas-wrapper">
        <PriceChart />
      </div>
      <div id="timeRangeButtons">
        {RANGES.map((days) => (
          <button
            key={days}
            class={days === timeRangeDays.value ? "active" : ""}
            onClick={() => (timeRangeDays.value = days)}
          >
            {days}D
          </button>
        ))}
        <label>
          <input
            type="checkbox"
            checked={showPoints.value}
            onChange={(e) => (showPoints.value = e.currentTarget.checked)}
          />
          <span>POINTS</span>
        </label>
      </div>
      <div id="levelButtons">
        {levels.length > 1 &&
          levels.map((lvl) => (
            <button
              key={lvl}
              class={lvl === currentLevel.value ? "active" : ""}
              onClick={() => selectLevel(lvl)}
            >
              +{lvl}
            </button>
          ))}
      </div>
    </div>
  );
}
