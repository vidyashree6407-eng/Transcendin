import csv
import json

# Category mapping based on course keywords
def get_category(course_name):
    name_lower = course_name.lower()
    
    if any(word in name_lower for word in ['azure', 'aws', 'cloud', 'openstack']):
        return 'azure'
    elif any(word in name_lower for word in ['cyber', 'security', 'penetration', 'hacker']):
        return 'technical'
    elif any(word in name_lower for word in ['excel', 'sql', 'python', 'java', 'code', 'dev', 'devops', 'test', 'software']):
        return 'technical'
    elif any(word in name_lower for word in ['sales', 'selling', 'customer', 'retail', 'retail']):
        return 'sales'
    elif any(word in name_lower for word in ['finance', 'accounting', 'financial', 'modeling']):
        return 'business'
    elif any(word in name_lower for word in ['leadership', 'manager', 'team', 'management']):
        return 'leadership'
    elif any(word in name_lower for word in ['itil', 'prince2', 'agile', 'scrum', 'pmp', 'project']):
        return 'professional'
    else:
        return 'professional'

# Icons mapping
def get_icon(course_name):
    name_lower = course_name.lower()
    
    if any(word in name_lower for word in ['excel', 'data', 'analytics', 'finance']):
        return 'fa-chart-line'
    elif any(word in name_lower for word in ['security', 'cyber', 'hacker']):
        return 'fa-shield'
    elif any(word in name_lower for word in ['code', 'dev', 'software', 'java', 'python']):
        return 'fa-code'
    elif any(word in name_lower for word in ['cloud', 'azure', 'aws']):
        return 'fa-cloud'
    elif any(word in name_lower for word in ['sales', 'selling']):
        return 'fa-handshake'
    elif any(word in name_lower for word in ['team', 'leadership', 'management']):
        return 'fa-users'
    elif any(word in name_lower for word in ['project', 'agile']):
        return 'fa-tasks'
    elif any(word in name_lower for word in ['writing', 'communication', 'presentation']):
        return 'fa-comments'
    else:
        return 'fa-book'

# Read CSV and create courses
courses = []
course_id = 1

with open('c_c.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        course_name = row['Course Name'].strip()
        duration_str = row['Duration'].strip()
        
        # Convert duration
        if 'hrs' in duration_str.lower():
            duration = 0.5
        else:
            try:
                duration = float(duration_str)
            except:
                duration = 1
        
        # Parse prices
        try:
            standard_price = int(float(row['Standard Fee'].strip()))
            early_bird_price = int(float(row['Early Bird Fee'].strip()))
            live_virtual_std = int(float(row['Live Virtual Standard Fee'].strip()))
            live_virtual_eb = int(float(row['Live Virtual Early Bird Fee'].strip()))
        except:
            standard_price = 695
            early_bird_price = 545
            live_virtual_std = 545
            live_virtual_eb = 445
        
        # Get category
        category = get_category(course_name)
        
        # Get icon
        icon = get_icon(course_name)
        
        # Create course object
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
            "featured": course_id <= 30,
            "description": f"Professional training in {course_name}",
            "icon": icon
        }
        
        courses.append(course)
        course_id += 1

# Save to JSON file
with open('courses_286.json', 'w', encoding='utf-8') as f:
    json.dump(courses, f, indent=2, ensure_ascii=False)

print(f"✅ Extracted {len(courses)} courses from CSV")
print(f"📁 Saved to: courses_286.json")
print(f"First course: {courses[0]['name']}")
print(f"Last course: {courses[-1]['name']}")

# Also print the JS format for easy copy-paste
js_format = "const coursesDatabase = [\n"
for course in courses:
    js_format += f"    {{id: {course['id']}, name: \"{course['name'].replace(chr(34), chr(92)+chr(34))}\", category: \"{course['category']}\", duration: {course['duration']}, standardPrice: {course['standardPrice']}, earlyBirdPrice: {course['earlyBirdPrice']}, liveVirtualStd: {course['liveVirtualStd']}, liveVirtualEB: {course['liveVirtualEB']}, rating: {course['rating']:.1f}, reviews: {course['reviews']}, featured: {str(course['featured']).lower()}, description: \"{course['description']}\", icon: \"{course['icon']}\"}},\n"
js_format += "];"

with open('courses_286.js', 'w', encoding='utf-8') as f:
    f.write(js_format)

print(f"✅ Also saved JavaScript format to: courses_286.js")
