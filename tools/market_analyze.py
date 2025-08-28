import json
import os
import time
import sys

# Configuration - can be modified here or passed as command line argument
DAYS_TO_ANALYZE = 5

# Parse command line argument if provided
if len(sys.argv) > 1:
    try:
        DAYS_TO_ANALYZE = int(sys.argv[1])
        if DAYS_TO_ANALYZE <= 0:
            print("Error: Days must be a positive integer")
            sys.exit(1)
    except ValueError:
        print("Error: Days must be a valid integer")
        sys.exit(1)

SNAPSHOT_DIR = './downloads'
now = int(time.time())
cutoff_time = now - DAYS_TO_ANALYZE * 24 * 60 * 60

# Load and sort snapshot files by timestamp
files = sorted([
    f for f in os.listdir(SNAPSHOT_DIR)
    if f.endswith('.json') and int(os.path.splitext(f)[0]) >= cutoff_time
], key=lambda f: int(os.path.splitext(f)[0]))

print(f"Using {len(files)} snapshots from last {DAYS_TO_ANALYZE} days.")

# Track bid history for level 0
price_history = {}

for filename in files:
    with open(os.path.join(SNAPSHOT_DIR, filename), 'r') as f:
        data = json.load(f)
        market = data.get("marketData", {})
        for item, levels in market.items():
            bid = levels.get("0", {}).get("b")
            if bid and bid > 0:
                price_history.setdefault(item, []).append(bid)
            else:
                price_history.setdefault(item, []).append(None)

# Analyze price trends
trending_items = []

for item, bids in price_history.items():
    clean_bids = [b for b in bids if b is not None]
    if len(clean_bids) < 3:
        continue

    first, last = clean_bids[0], clean_bids[-1]
    delta = last - first
    pct = (delta / first) * 100 if first else 0

    # Count number of increases
    up_count = sum(1 for i in range(1, len(clean_bids)) if clean_bids[i] > clean_bids[i-1])
    down_count = sum(1 for i in range(1, len(clean_bids)) if clean_bids[i] < clean_bids[i-1])

    # Categorize trend
    if up_count >= 3:
        trend_type = "Strong Trend"
    elif abs(pct) > 20 and up_count > 0 and down_count > 0:
        trend_type = "Volatile"
    elif abs(pct) < 5:
        trend_type = "Flat"
    else:
        trend_type = "Uncertain"

    trending_items.append({
        'item': item,
        'first': first,
        'last': last,
        'change': delta,
        'percent': pct,
        'ups': up_count,
        'downs': down_count,
        'trend': trend_type
    })

# Sort by percent change (desc)
trending_items.sort(key=lambda x: x['percent'], reverse=True)

# Output results
print(f"\n{'Item':<50} {'Δ%':>8} {'Ups':>4} {'Downs':>6} {'Type':>15}")
print("-" * 85)
for entry in trending_items[:15]:
    print(f"{entry['item']:<50} {entry['percent']:>8.2f} {entry['ups']:>4} {entry['downs']:>6} {entry['trend']:>15}")
