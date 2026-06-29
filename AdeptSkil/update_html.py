import re

# Read the enrollment-interactive.html file
with open('enrollment-interactive.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Read the new coursesDatabase from the generated file
with open('coursesDatabase_complete.js', 'r', encoding='utf-8') as f:
    new_db = f.read()

# Extract just the array part (remove the surrounding const coursesDatabase = [ and ];)
new_db = new_db.replace('const coursesDatabase = [\n', '').replace('\n];', '')

# Find and replace the old coursesDatabase
pattern = r'const coursesDatabase = \[.*?\];'
replacement = f'const coursesDatabase = [\n{new_db}\n        ];'

# Use DOTALL flag to match across multiple lines
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Write the updated content back
with open('enrollment-interactive.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Successfully updated enrollment-interactive.html with 285 courses!")
print(f"File size: {len(new_content)} bytes")
