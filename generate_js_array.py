import json

# Read courses from JSON
with open('courses_286.json', 'r', encoding='utf-8') as f:
    courses = json.load(f)

print(f'Total courses: {len(courses)}')
print(f'First: {courses[0]["name"]}')
print(f'Last: {courses[-1]["name"]}')

# Create the JavaScript array format with proper escaping
js_code = "const coursesDatabase = [\n"
for i, course in enumerate(courses):
    # Escape quotes in course name
    name = course['name'].replace('"', '\\"')
    desc = course['description'].replace('"', '\\"')
    
    js_code += f'            {{id: {course["id"]}, name: "{name}", category: "{course["category"]}", duration: {course["duration"]}, standardPrice: {course["standardPrice"]}, earlyBirdPrice: {course["earlyBirdPrice"]}, liveVirtualStd: {course["liveVirtualStd"]}, liveVirtualEB: {course["liveVirtualEB"]}, rating: {course["rating"]:.1f}, reviews: {course["reviews"]}, featured: {str(course["featured"]).lower()}, description: "{desc}", icon: "{course["icon"]}"}}'
    
    if i < len(courses) - 1:
        js_code += ",\n"
    else:
        js_code += "\n"

js_code += "];"

# Write to file
with open('coursesDatabase_complete.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print(f"\nGenerated coursesDatabase_complete.js ({len(js_code)} bytes)")

# Also print first 100 chars for verification
print(f"Start: {js_code[:150]}...")
