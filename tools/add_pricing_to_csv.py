#!/usr/bin/env python3
"""
Add pricing to courses based on duration
Pricing model:
- 1 day: ₹5,000
- 2 days: ₹8,000
- 3 days: ₹12,000
- 4 days: ₹15,000
- 5 days: ₹18,000
- 6+ days: ₹20,000
- No duration: ₹5,000 (default)
"""

import csv
import os

# Pricing based on duration
PRICING_MAP = {
    '1': 5000,
    '2': 8000,
    '3': 12000,
    '4': 15000,
    '5': 18000,
    '6': 20000,
}
DEFAULT_PRICE = 5000

def get_price_for_duration(duration):
    """Get price based on course duration"""
    if not duration or duration.strip() == '':
        return DEFAULT_PRICE
    
    try:
        days = int(duration.strip())
        if days in PRICING_MAP:
            return PRICING_MAP[str(days)]
        elif days > 6:
            return 20000
        else:
            return DEFAULT_PRICE
    except (ValueError, TypeError):
        return DEFAULT_PRICE

def main():
    input_file = 'c_c.csv'
    output_file = 'c_c.csv'
    
    rows = []
    
    # Read existing CSV
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    
    # Write updated CSV with Price column
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['Course Name', 'Duration', 'Short Description', 'Category', 'Price']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        for row in rows:
            price = get_price_for_duration(row.get('Duration', ''))
            row['Price'] = str(price)
            writer.writerow(row)
    
    print(f'✓ Added pricing to {len(rows)} courses')
    print(f'✓ Saved to {output_file}')

if __name__ == '__main__':
    main()
