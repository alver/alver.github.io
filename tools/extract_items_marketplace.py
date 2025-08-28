import json

# Path to your snapshot file
SNAPSHOT_FILE = 'downloads/1750071453.json'
OUTPUT_FILE = 'all_items.json'

def extract_all_items(snapshot_file, output_file):
    with open(snapshot_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    market_data = data.get('marketData', {})
    item_names = list(market_data.keys())
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({"all_items": item_names}, f, indent=2, ensure_ascii=False)
    print(f"Extracted {len(item_names)} items to {output_file}")

if __name__ == "__main__":
    extract_all_items(SNAPSHOT_FILE, OUTPUT_FILE)