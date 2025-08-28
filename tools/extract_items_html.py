import re
import sys
import xml.etree.ElementTree as ET
from html import unescape

def extract_items_from_xml(file_path):
    """
    Extract aria-label values from XML file containing item data.

    Args:
        file_path (str): Path to the XML file

    Returns:
        list: List of item names extracted from aria-label attributes
    """
    try:
        # Read the file content
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        # Method 1: Using regex to extract aria-label values
        # This handles the HTML-like structure better than XML parsing
        aria_label_pattern = r'aria-label="([^"]*)"'
        matches = re.findall(aria_label_pattern, content)

        # Remove duplicates while preserving order
        items = []
        seen = set()
        for item in matches:
            if item not in seen:
                items.append(item)
                seen.add(item)

        return items

    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        return []
    except Exception as e:
        print(f"Error reading file: {e}")
        return []

def extract_items_alternative(file_path):
    """
    Alternative method using BeautifulSoup-like regex approach.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        # Find all svg elements with aria-label
        svg_pattern = r'<svg[^>]*aria-label="([^"]*)"[^>]*>'
        matches = re.findall(svg_pattern, content)

        # Remove duplicates while preserving order
        items = []
        seen = set()
        for item in matches:
            # Decode HTML entities if any
            decoded_item = unescape(item)
            if decoded_item not in seen:
                items.append(decoded_item)
                seen.add(decoded_item)

        return items

    except Exception as e:
        print(f"Error in alternative extraction: {e}")
        return []

def main():
    # Check if filename was provided as command line argument
    if len(sys.argv) != 2:
        print("Usage: python extract_items.py <xml_file>")
        print("Example: python extract_items.py books.xml")
        sys.exit(1)

    # Get filename from command line argument
    xml_file = sys.argv[1]

    print(f"Extracting items from '{xml_file}'...")
    print("=" * 50)

    # Extract items using primary method
    items = extract_items_from_xml(xml_file)

    if items:
        print(f"Found {len(items)} unique items:")
        print("-" * 30)

        # Print all items in the required format
        for item in items:
            # Convert to lowercase, remove apostrophes, and replace spaces with underscores
            formatted_item = item.lower().replace("'", "").replace(' ', '_')
            print(f'"/items/{formatted_item}",')

        print(f"\nTotal items extracted: {len(items)}")

        # Optional: Save to file
        save_to_file = input("\nSave items to text file? (y/n): ").lower().strip()
        if save_to_file == 'y':
            output_file = "extracted_items.txt"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write("Extracted Items (formatted):\n")
                f.write("=" * 30 + "\n")
                for item in items:
                    formatted_item = item.lower().replace("'", "").replace(' ', '_')
                    f.write(f'"/items/{formatted_item}",\n')
            print(f"Items saved to {output_file}")

    else:
        print("No items found or error occurred.")

        # Try alternative method
        print("\nTrying alternative extraction method...")
        alt_items = extract_items_alternative(xml_file)

        if alt_items:
            print(f"Found {len(alt_items)} items using alternative method:")
            for item in alt_items:
                formatted_item = item.lower().replace("'", "").replace(' ', '_')
                print(f'"/items/{formatted_item}",')


if __name__ == "__main__":
    main()