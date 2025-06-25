import requests
import json
import time
import os
import glob
import gzip
import subprocess

# Configuration
URL = "https://www.milkywayidle.com/game_data/marketplace.json"
SAVE_DIR = "./downloads"  # You can change this to another path

# Ensure the directory exists
os.makedirs(SAVE_DIR, exist_ok=True)

def prepare_new_data():
    # Load the config to get the list of allowed items
    with open("config.json", encoding="utf-8") as f:
        config_data = json.load(f)
    allowed_items = set(item for category in config_data.values() for item in category)

    items, rows, index = [], [], {}

    for path in sorted(glob.glob("downloads/*.json")):
        ts = int(os.path.splitext(os.path.basename(path))[0])
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
    with gzip.open("web/market.compact.json.gz", "wt") as f:
        json.dump(out, f, separators=(",", ":"))

    print(f"items={len(items)}, rows={len(rows)} → {os.path.getsize('web/market.compact.json.gz')/1024:.1f} KB")


def upload_to_github():
    web_dir = os.path.join(os.path.dirname(__file__), "web")
    try:
        # Stage the file
        result_add = subprocess.run([
            "git", "add", "market.compact.json.gz"
        ], cwd=web_dir, capture_output=True, text=True)
        print("[git add]", result_add.stdout or result_add.stderr)

        result_add = subprocess.run([
            "git", "commit", "-m", '"Market price updates"'
        ], cwd=web_dir, capture_output=True, text=True)
        print("[git commit]", result_add.stdout or result_add.stderr)

        # Push to main
        result_push = subprocess.run([
            "git", "push", "origin", "main"
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
    fetch_and_save()
