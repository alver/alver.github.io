import requests
import json
import time
import os
import glob
import gzip
import subprocess
import sys

# Configuration
URL = "https://www.milkywayidle.com/game_data/marketplace.json"
SAVE_DIR = "./downloads"  # You can change this to another path

# Ensure the directory exists
os.makedirs(SAVE_DIR, exist_ok=True)

def analyze_trends(download_dir, allowed_items=None, days=7, min_points=5, min_abs_change=50):
    import os, time, json, math
    now = int(time.time())
    cutoff_time = now - days * 24 * 60 * 60

    # Collect files safely (skip non-epoch names)
    files = []
    for f in os.listdir(download_dir):
        if not f.endswith('.json'):
            continue
        name = os.path.splitext(f)[0]
        try:
            ts = int(name)
        except ValueError:
            continue
        if ts >= cutoff_time:
            files.append((ts, f))
    files.sort()  # by timestamp

    # Build time series: item -> list[(ts, price)]
    series = {}
    for ts, fname in files:
        with open(os.path.join(download_dir, fname), 'r', encoding='utf-8') as fp:
            data = json.load(fp)
        market = data.get("marketData", {})
        for item, levels in market.items():
            if allowed_items is not None and item not in allowed_items:
                continue
            lv0 = levels.get("0", {})
            a = lv0.get("a", -1)
            b = lv0.get("b", -1)
            a = None if (a is None or a <= 0) else a
            b = None if (b is None or b <= 0) else b
            price = None
            if a is not None and b is not None:
                price = (a + b) / 2.0
            elif a is not None:
                price = float(a)
            elif b is not None:
                price = float(b)
            # Append even if price None to preserve time step awareness? We’ll skip None later.
            if item not in series:
                series[item] = []
            series[item].append((ts, price))

    def regress(x, y):
        # simple linear regression y = m*x + c; returns m, r2
        n = len(x)
        if n < 2:
            return 0.0, 0.0
        mean_x = sum(x) / n
        mean_y = sum(y) / n
        sxx = sum((xi - mean_x) ** 2 for xi in x)
        syy = sum((yi - mean_y) ** 2 for yi in y)
        sxy = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
        if sxx == 0 or syy == 0:
            return 0.0, 0.0
        m = sxy / sxx
        r2 = (sxy * sxy) / (sxx * syy)
        return m, r2

    def stdev(vals):
        n = len(vals)
        if n < 2:
            return 0.0
        mu = sum(vals) / n
        var = sum((v - mu) ** 2 for v in vals) / (n - 1)
        return math.sqrt(var)

    trending = []
    for item, pts in series.items():
        # Clean and sort by time; keep only valid prices
        clean = [(ts, p) for ts, p in sorted(pts) if p is not None]
        if len(clean) < min_points:
            continue

        t0 = clean[0][0]
        xs = [(ts - t0) / 86400.0 for ts, _ in clean]  # days since start
        ys = [p for _, p in clean]

        first, last = ys[0], ys[-1]
        delta = last - first
        pct = (delta / first) * 100.0 if first else 0.0

        # Up/down counts on consecutive valid points
        ups = sum(1 for i in range(1, len(ys)) if ys[i] > ys[i-1])
        downs = sum(1 for i in range(1, len(ys)) if ys[i] < ys[i-1])

        # Robustness: basic winsorization to reduce spikes
        sorted_y = sorted(ys)
        lo = sorted_y[max(0, int(0.05 * len(sorted_y)))]
        hi = sorted_y[min(len(sorted_y) - 1, int(0.95 * len(sorted_y)))]
        ys_w = [min(max(y, lo), hi) for y in ys]

        slope, r2 = regress(xs, ys_w)
        vol = stdev(ys) / (sum(ys) / len(ys)) if ys and sum(ys) else 0.0

        # Classification
        trend = "Uncertain"
        if abs(pct) < 5 and r2 < 0.2:
            trend = "Flat"
        else:
            if r2 >= 0.7 and slope > 0:
                trend = "Strong Uptrend" if pct >= 20 else "Uptrend"
            elif r2 >= 0.7 and slope < 0:
                trend = "Strong Downtrend" if pct <= -20 else "Downtrend"
            elif vol > 0.2 and ups > 0 and downs > 0:
                trend = "Volatile"

        # Optional: filter tiny absolute moves
        if abs(delta) < min_abs_change:
            continue

        trending.append({
            "item": item,
            "first": first,
            "last": last,
            "change": delta,
            "percent": pct,
            "ups": ups,
            "downs": downs,
            "slope_per_day": slope,
            "r2": r2,
            "volatility_cv": vol,
            "trend": trend,
        })

    # Consider sorting by absolute percent; adjust to taste
    trending.sort(key=lambda x: abs(x["percent"]), reverse=True)
    return trending

def prepare_new_data():
    # Load the config to get the list of allowed items
    with open("config.json", encoding="utf-8") as f:
        config_data = json.load(f)
    allowed_items = set(item for category in config_data.values() for item in category)

    # Calculate timestamp for 1 month ago (30 days)
    now = int(time.time())
    one_month_ago = now - (30 * 24 * 60 * 60)  # 30 days in seconds

    items, rows, index = [], [], {}
    last_vals = {}  # (idx, level) -> (a, b)

    for path in sorted(glob.glob("downloads/*.json")):
        with open(path, encoding="utf-8") as f:
            file_json = json.load(f)
        ts = int(file_json["timestamp"])

        # Skip files older than 1 month
        if ts < one_month_ago:
            continue

        data = file_json["marketData"]

        for item, lvls in data.items():
            if item not in allowed_items:
                continue

            if item not in index:
                index[item] = len(items)
                items.append(item)
            idx = index[item]

            for lvl, p in lvls.items():
                a, b = p["a"], p["b"]
                if a == b == -1:           # обе цены -1 → нет сделки
                    continue
                level = int(lvl)
                key = (idx, level)
                prev = last_vals.get(key)

                # Append only if (a,b) changed from the last seen values for this item+level
                if prev is None or prev[0] != a or prev[1] != b:
                    rows.append([ts, idx, level, a, b])
                    last_vals[key] = (a, b)

    # Trend analysis (last 3 days, 7 days, and 30 days)
    trends_3d = analyze_trends("downloads", items, days=3)
    trends_7d = analyze_trends("downloads", items, days=7)
    trends_30d = analyze_trends("downloads", items, days=30)

    # Keep only the top 15 items with highest percentage change for all trends
    trends_3d = trends_3d[:15]
    trends_7d = trends_7d[:15]
    trends_30d = trends_30d[:15]

    out = {"items": items, "rows": rows, "config": config_data, "trends_3d": trends_3d, "trends_7d": trends_7d, "trends_30d": trends_30d}
    with gzip.open("../market.compact.json.gz", "wt") as f:
        json.dump(out, f, separators=(",", ":"))

    print(f"items={len(items)}, rows={len(rows)} → {os.path.getsize('../market.compact.json.gz')/1024:.1f} KB, trends_3d={len(trends_3d)}, trends_7d={len(trends_7d)}, trends_30d={len(trends_30d)}")


def upload_to_github():
    web_dir = os.path.join(os.path.dirname(__file__), "..")
    try:
        # Stage the file
        result_add = subprocess.run([
            r"C:\Program Files\Git\bin\git.exe", "add", "market.compact.json.gz"
        ], cwd=web_dir, capture_output=True, text=True)
        print("[git add]", result_add.stdout or result_add.stderr)

        result_add = subprocess.run([
            r"C:\Program Files\Git\bin\git.exe", "commit", "-m", '"Market price updates"'
        ], cwd=web_dir, capture_output=True, text=True)
        print("[git commit]", result_add.stdout or result_add.stderr)

        # Push to main
        result_push = subprocess.run([
            r"C:\Program Files\Git\bin\git.exe", "push", "origin", "main"
        ], cwd=web_dir, capture_output=True, text=True)
        print("[git push]", result_push.stdout or result_push.stderr)
    except Exception as e:
        print(f"Error during git upload: {e}")

def fetch_and_save():
    try:
        response = requests.get(URL)
        response.raise_for_status()  # Raise an error for bad status codes

        # Attempt to parse JSON
        data = response.json()

        # Find latest saved file to compare
        files = [f for f in os.listdir(SAVE_DIR) if f.endswith('.json')]
        if files:
            latest_file = max(files)
            latest_filepath = os.path.join(SAVE_DIR, latest_file)
            with open(latest_filepath, 'r', encoding='utf-8') as f:
                latest_data = json.load(f)

            if data == latest_data:
                print("Data is the same as the latest version, not saving.")
                return

        # Create timestamped filename
        timestamp = str(int(time.time()))
        filename = f"{timestamp}.json"
        filepath = os.path.join(SAVE_DIR, filename)

        # Save to file
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        prepare_new_data()
        upload_to_github()

        print(f"Saved new data to {filepath}")

    except Exception as e:
        print(f"Error during fetch/save: {e}")

# Run continuously every hour
if __name__ == "__main__":
    #prepare_new_data()
    fetch_and_save()
