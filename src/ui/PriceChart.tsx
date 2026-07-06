import { Chart } from "chart.js/auto";
import "chartjs-adapter-date-fns";
import { useSignalEffect } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { currentSeries, showPoints, theme, timeRangeDays } from "../state/store";

/** 8%-alpha fill derived from a theme color (hex or rgb()). */
function withAlpha(color: string, fallback: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (m) {
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, 0.08)`;
  }
  if (color.startsWith("rgb(")) return color.replace("rgb(", "rgba(").replace(")", ", 0.08)");
  return fallback;
}

export function PriceChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useSignalEffect(() => {
    const series = currentSeries.value;
    const days = timeRangeDays.value;
    const points = showPoints.value;
    theme.value; // read so a theme flip re-runs the effect (colors live in CSS vars)

    chartRef.current?.destroy();
    chartRef.current = null;
    const canvas = canvasRef.current;
    if (!series || series.length === 0 || !canvas) return;

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const filtered = series.filter((p) => p.t.getTime() >= cutoff);
    const askData = filtered.map((p) => ({ x: p.t.getTime(), y: p.ask }));
    const bidData = filtered.map((p) => ({ x: p.t.getTime(), y: p.bid }));

    const style = getComputedStyle(document.body);
    const textColor = style.getPropertyValue("--text-color").trim();
    const borderClr = style.getPropertyValue("--border-color").trim();
    const askColor = style.getPropertyValue("--ask-color").trim() || "#00e5ff";
    const bidColor = style.getPropertyValue("--bid-color").trim() || "#ffa040";

    chartRef.current = new Chart(canvas, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Ask",
            data: askData,
            borderWidth: 1.5,
            tension: 0.1,
            stepped: "before",
            borderColor: askColor,
            backgroundColor: withAlpha(askColor, "rgba(0,229,255,0.08)"),
            pointBackgroundColor: askColor,
            pointBorderColor: askColor,
          },
          {
            label: "Bid",
            data: bidData,
            borderWidth: 1.5,
            tension: 0.1,
            stepped: "before",
            borderColor: bidColor,
            backgroundColor: withAlpha(bidColor, "rgba(255,160,64,0.08)"),
            pointBackgroundColor: bidColor,
            pointBorderColor: bidColor,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time",
            time: { unit: "day", displayFormats: { day: "MMM dd" } },
            ticks: { color: textColor, font: { family: "'Roboto', sans-serif", size: 11 } },
            grid: { color: borderClr },
          },
          y: {
            position: "right",
            beginAtZero: false,
            ticks: { color: textColor, font: { family: "'Roboto', sans-serif", size: 11 } },
            grid: { color: borderClr },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: textColor,
              font: { family: "'Roboto', sans-serif", size: 11 },
              boxWidth: 14,
              padding: 16,
            },
          },
        },
        elements: {
          point: {
            radius: points ? 3 : 0,
            hoverRadius: points ? 5 : 0,
            hitRadius: points ? 5 : 0,
          },
        },
      },
    });
  });

  useEffect(
    () => () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    },
    [],
  );

  return <canvas id="chart" ref={canvasRef} />;
}
