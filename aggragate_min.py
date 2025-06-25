# aggregate_min.py
import json, glob, os, csv, gzip

# Load the config to get the list of allowed items
with open("config", encoding="utf-8") as f:
    config_data = json.load(f)
allowed_items = set(item for category in config_data.values() for item in category)

items, rows, index = [], [], {}

for path in sorted(glob.glob("*.json")):
    ts = int(os.path.splitext(path)[0])
    data = json.load(open(path, encoding="utf-8"))["marketData"]

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
            rows.append([ts, idx, int(lvl), a, b])

out = {"items": items, "rows": rows, "config": config_data}
with gzip.open("market.compact.json.gz", "wt") as f:
    json.dump(out, f, separators=(",", ":"))

print(f"items={len(items)}, rows={len(rows)} → {os.path.getsize('market.compact.json.gz')/1024:.1f} KB")
