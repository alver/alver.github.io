import json
import xml.etree.ElementTree as ET
from pathlib import Path

# Paths
CONFIG_PATH = Path('config.json')
SVG_PATH = Path('../svg/items_sprite.d4d08849.svg')
OUTPUT_PATH = Path('../items_sprite_filtered.svg')

# Load allowed item names from config.json
def get_allowed_icons(config_path):
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    allowed = set()
    for category in config.values():
        for item in category:
            if item.startswith('/items/'):
                allowed.add(item[len('/items/'):])
    return allowed

def filter_svg(svg_path, allowed_ids, output_path):
    ET.register_namespace('', "http://www.w3.org/2000/svg")
    tree = ET.parse(svg_path)
    root = tree.getroot()

    # Find all <symbol> elements and filter them
    symbols = [el for el in root.findall('.//{http://www.w3.org/2000/svg}symbol')]
    for symbol in symbols:
        symbol_id = symbol.attrib.get('id')
        if symbol_id not in allowed_ids:
            root.remove(symbol)

    # Write filtered SVG
    tree.write(output_path, encoding='utf-8', xml_declaration=True)

if __name__ == '__main__':
    allowed_ids = get_allowed_icons(CONFIG_PATH)
    filter_svg(SVG_PATH, allowed_ids, OUTPUT_PATH)