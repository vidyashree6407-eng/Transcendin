Starter template — courses page

Files created in `starter/`:

- `courses.html` — minimal HTML with navbar, search, sample `.course-card` entries and JS hooks (`navigateToCourse`, `enrollCourse`).
- `styles.css` — trimmed CSS with variables, grid, course card styles and responsive breakpoints (1200, 992, 640px).

Key notes to reproduce original behavior:

- CSS load/order: include `styles.css` first in `<head>`, then Font Awesome, then small head `<style>` overrides, and finally any large inline styles near the end of the body if you need to override earlier rules.
- Preserve these attributes/IDs: `id="exactCourseSearch"`, `id="exactSearchInput"`, `data-category` on `.course-card`, and `id="backToTop"`.
- Assets required: copy `images/Logo with full name.png` and `favicon.jpg` into the same folder or update paths.
- JS hooks: `enrollCourse(courseName)` redirects to `enrollment_with_fees.html?course=...` and `navigateToCourse()` performs an exact-title match then scroll/highlight.

How to test locally:

1. Start a simple static server in the `starter/` folder (Python 3):

```bash
cd "c:/Users/MANJUNATH B G/Transcendin/starter"
python -m http.server 8000
```

2. Open `http://localhost:8000/courses.html` in a browser.
3. Try searching for the exact course title (e.g., "Intro to JavaScript") in the search box — it should scroll and highlight the card.
4. Click "Enroll" to confirm redirect URL includes `?course=`.

Next steps I can do for you:

- Extract a concise CSS rule list (colors, variables, breakpoints) into a single summary file.
- Replace the sample cards with the real course data from your repo (I can import from `courses_286.json`).
- Integrate the trimmed CSS into your main `styles.css` preserving DOM order.

Which would you like next?
