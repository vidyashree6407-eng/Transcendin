import csv

src = 'c_c.csv'
out = 'c_c.csv.tmp'

with open(src, 'r', encoding='utf-8') as f:
    raw_lines = [ln.rstrip('\n') for ln in f]

rows = []
current_category = ''
for ln in raw_lines:
    if not ln.strip():
        # blank line separates blocks
        continue
    parts = [p.strip() for p in ln.split(',')]
    # category header with "Duration" column name
    if len(parts) >= 2 and parts[1].lower().startswith('duration'):
        current_category = parts[0]
        continue
    # some category lines may appear as single field with trailing comma removed; if second empty
    if len(parts) == 1:
        # treat as a category name if no comma duration present
        # but many categories were written as 'Category,' leading to len==2, so skip
        continue
    # if first column is empty, skip
    if not parts[0]:
        continue
    name = parts[0]
    duration = parts[1] if len(parts) > 1 else ''
    # normalize duration to integer-like string
    duration = duration.strip()
    rows.append([name, duration, '', current_category])

# write normalized CSV
with open(out, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Course Name','Duration','Short Description','Category'])
    for r in rows:
        writer.writerow(r)

# replace original file
import os
os.replace(out, src)
print('Normalized', src, '->', len(rows), 'rows')
