const courseGrid = document.getElementById('courseGrid');
const courseFilter = document.getElementById('courseFilter');
const categoryFilter = document.getElementById('categoryFilter');
const durationFilter = document.getElementById('durationFilter');
const courseModal = document.getElementById('courseModal');
const closeModal = document.getElementById('closeModal');
let courses = [];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') index += 1;
      row.push(value.trim());
      if (row.some(cell => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }
  if (value || row.length) {
    row.push(value.trim());
    if (row.some(cell => cell !== '')) rows.push(row);
  }
  const headers = rows.shift();
  return rows.map(columns => headers.reduce((item, header, index) => {
    item[header] = columns[index] || '';
    return item;
  }, {}));
}

function mapCourse(raw) {
  return {
    name: raw['Course Name'] || '',
    duration: raw.Duration || '',
    description: raw['Short Description'] || '',
    category: raw.Category || ''
  };
}

function durationLabel(duration) {
  if (!duration) return '';
  return `${duration} ${duration === '1' ? 'Day' : 'Days'}`;
}

function populateFilters() {
  courses.forEach((course, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = course.name;
    courseFilter.appendChild(option);
  });
  [...new Set(courses.map(course => course.category).filter(Boolean))].sort().forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function openCourse(course) {
  document.getElementById('modalTitle').textContent = course.name;
  document.getElementById('modalDescription').textContent = course.description || 'Course description is not provided in the catalogue.';
  document.getElementById('modalDuration').textContent = durationLabel(course.duration);
  courseModal.classList.add('is-open');
  courseModal.setAttribute('aria-hidden', 'false');
  closeModal.focus();
}

function render() {
  const selectedCourse = courseFilter.value === '' ? null : courses[Number(courseFilter.value)];
  const selectedCategory = categoryFilter.value;
  const selectedDuration = durationFilter.value;
  const filtered = courses.filter(course => (!selectedCourse || course === selectedCourse) && (!selectedCategory || course.category === selectedCategory) && (!selectedDuration || course.duration === selectedDuration));
  courseGrid.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'catalog-empty';
    empty.textContent = 'No courses found. Try another filter.';
    courseGrid.appendChild(empty);
    return;
  }
  filtered.forEach((course, index) => {
    const card = document.createElement('article');
    card.className = 'catalog-card';
    card.dataset.accent = String(index % 4);
    card.setAttribute('role', 'listitem');
    const header = document.createElement('div');
    header.className = 'catalog-card-header';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = course.category;
    header.appendChild(eyebrow);
    const duration = document.createElement('span');
    duration.className = 'catalog-duration';
    duration.textContent = durationLabel(course.duration);
    header.appendChild(duration);
    const title = document.createElement('h3');
    title.textContent = course.name;
    const description = document.createElement('p');
    description.className = 'catalog-description';
    description.textContent = course.description;
    const details = document.createElement('button');
    details.className = 'btn btn-secondary';
    details.type = 'button';
    details.textContent = 'View course details';
    details.addEventListener('click', () => openCourse(course));
    card.append(header, title, description, details);
    courseGrid.appendChild(card);
  });
}

function closeCourseModal() {
  courseModal.classList.remove('is-open');
  courseModal.setAttribute('aria-hidden', 'true');
}

[courseFilter, categoryFilter, durationFilter].forEach(control => control.addEventListener('change', render));
closeModal.addEventListener('click', closeCourseModal);
courseModal.addEventListener('click', event => { if (event.target === courseModal) closeCourseModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeCourseModal(); });

fetch('c_c.csv')
  .then(response => { if (!response.ok) throw new Error('Course data unavailable'); return response.text(); })
  .then(text => { courses = parseCSV(text).map(mapCourse).filter(course => course.name); populateFilters(); render(); })
  .catch(() => { courseGrid.textContent = 'Course data is currently unavailable.'; });
