import openpyxl
import json

# Load the Excel file
wb = openpyxl.load_workbook('Courses_Categories_Final.xlsx')
ws = wb.active

# Extract all courses
courses = []
course_id = 1

# Skip header row (row 1)
for row in ws.iter_rows(min_row=2, values_only=True):
    if not row[0]:  # Stop if first column is empty
        break
    
    course_name = str(row[0]).strip()
    duration = float(row[1]) if len(row) > 1 and row[1] else 1
    category = str(row[2]).lower().strip() if len(row) > 2 and row[2] else "professional"
    standard_price = int(row[3]) if len(row) > 3 and row[3] else 695
    early_bird_price = int(row[4]) if len(row) > 4 and row[4] else int(standard_price * 0.85)
    live_virtual_std = int(row[5]) if len(row) > 5 and row[5] else int(standard_price * 0.75)
    live_virtual_eb = int(row[6]) if len(row) > 6 and row[6] else int(standard_price * 0.6)
    
    course = {
        "id": course_id,
        "name": course_name,
        "category": category,
        "duration": duration,
        "standardPrice": standard_price,
        "earlyBirdPrice": early_bird_price,
        "liveVirtualStd": live_virtual_std,
        "liveVirtualEB": live_virtual_eb,
        "rating": 4.4 + (course_id % 6) * 0.1,
        "reviews": 100 + (course_id % 300),
        "featured": course_id <= 25,
        "description": f"Professional training in {course_name}",
        "icon": "fa-book"
    }
    
    courses.append(course)
    course_id += 1

# Save to JSON
with open('courses_data.json', 'w') as f:
    json.dump(courses, f, indent=2)

print(f"Extracted {len(courses)} courses from Excel")
print(f"File saved: courses_data.json")
