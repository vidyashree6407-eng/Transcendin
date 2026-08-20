/* courses.js - Load CSV, render course cards, and filter the catalogue. */

// Elements
const coursesGrid = document.getElementById('coursesGrid');
const filterCategory = document.getElementById('filterCategory');
const siteSearch = document.getElementById('siteSearch');

let allCourses = [];
let selectedCourseSlug = '';

// CSV loader (small, robust parser)
async function loadCSV(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error('CSV not found');
  const txt = await res.text();
  return parseCSV(txt);
}

function parseCSV(text){
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for(let index = 0; index < text.length; index += 1){
    const character = text[index];
    const nextCharacter = text[index + 1];
    if(character === '"' && quoted && nextCharacter === '"'){
      value += '"';
      index += 1;
    }else if(character === '"'){
      quoted = !quoted;
    }else if(character === ',' && !quoted){
      row.push(value.trim());
      value = '';
    }else if((character === '\n' || character === '\r') && !quoted){
      if(character === '\r' && nextCharacter === '\n') index += 1;
      row.push(value.trim());
      if(row.some(cell => cell !== '')) rows.push(row);
      row = [];
      value = '';
    }else{
      value += character;
    }
  }

  if(value || row.length){
    row.push(value.trim());
    if(row.some(cell => cell !== '')) rows.push(row);
  }

  const headers = rows.shift().map(header => header.trim());
  return rows.map(columns => headers.reduce((course, header, index) => {
    course[header] = columns[index] || '';
    return course;
  }, {}));
}

function mapCourse(raw){
  const name = raw['Course Name'] || raw['name'] || 'Untitled';
  const duration = raw['Duration'] || '';
  const desc = raw['Short Description'] || '';
  const category = raw['Category'] || '';
  return {name, duration, desc, category};
}

function reconcileMenuCategories(courses, menuData){
  const categoryByCourse = new Map();
  (menuData.categories || []).forEach(category => {
    (category.courses || []).forEach(item => {
      const name = typeof item === 'string' ? item : item.name;
      if (name) categoryByCourse.set(courseSlug(name), category.title);
    });
  });
  return courses.map(course => ({
    ...course,
    category: categoryByCourse.get(courseSlug(course.name)) || course.category
  }));
}

function renderFilters(){
  const cats = Array.from(new Set(allCourses.map(c=>c.category).filter(Boolean))).sort();
  cats.forEach(cat=>{
    const opt = document.createElement('option'); opt.value=cat; opt.textContent=cat; filterCategory.appendChild(opt);
  });
}

function createCard(course){
  const card = document.createElement('article');
  card.className = 'course-card fade-in';
  card.dataset.courseSlug = courseSlug(course.name);
  card.dataset.accent = String(allCourses.indexOf(course) % 4);
  card.setAttribute('role', 'listitem');

  const top = document.createElement('div'); top.className = 'course-top';
  const duration = document.createElement('div'); duration.className = 'course-duration';
  const durationIcon = document.createElement('i'); durationIcon.className = 'fas fa-clock';
  duration.appendChild(durationIcon);
  if(course.duration){
    duration.appendChild(document.createTextNode(' ' + course.duration + ' day' + (course.duration === '1' ? '' : 's')));
  }
  top.appendChild(duration);
  card.appendChild(top);

  const h3 = document.createElement('h3'); h3.className = 'course-title'; h3.textContent = course.name;
  const p = document.createElement('p'); p.className = 'course-desc'; p.textContent = course.desc;

  const actions = document.createElement('div'); actions.className = 'card-actions';
  const enroll = document.createElement('a');
  enroll.className = 'btn-primary';
  enroll.href = 'enrollment-interactive.html';
  enroll.setAttribute('aria-label', 'Enroll in ' + course.name);
  enroll.textContent = 'Enroll Now';
  actions.appendChild(enroll);

  card.appendChild(h3);
  card.appendChild(p);
  card.appendChild(actions);
  return card;
}

function applyFiltersAndRender(){
  const q = (siteSearch && siteSearch.value || '').trim().toLowerCase();
  const cat = filterCategory ? filterCategory.value : '';
  const filtered = allCourses.filter(c=>{
    if(cat && c.category !== cat) return false;
    if(selectedCourseSlug && courseSlug(c.name) !== selectedCourseSlug) return false;
    if(q){
      return c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q);
    }
    return true;
  });
  while (coursesGrid.firstChild) coursesGrid.removeChild(coursesGrid.firstChild);
  if(!filtered.length){
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = '<i class="fas fa-compass" aria-hidden="true"></i><h3>No courses found</h3><p>Try another search term or select All categories.</p>';
    coursesGrid.appendChild(emptyState);
  }else{
    filtered.forEach(c=>coursesGrid.appendChild(createCard(c)));
    if(selectedCourseSlug){
      requestAnimationFrame(() => {
        const selectedCard = coursesGrid.querySelector('[data-course-slug="' + selectedCourseSlug + '"]');
        if(selectedCard) selectedCard.scrollIntoView({behavior: 'smooth', block: 'center'});
      });
    }
  }
}

// wire events
siteSearch && siteSearch.addEventListener('input', debounce(()=>{
  if(selectedCourseSlug){
    selectedCourseSlug = '';
    updateUrlState(filterCategory.value, '', 'replace');
  }
  applyFiltersAndRender();
},250));
filterCategory && filterCategory.addEventListener('change', ()=>{
  selectedCourseSlug = '';
  updateUrlState(filterCategory.value, '', 'push');
  applyFiltersAndRender();
});

function debounce(fn, wait){let t; return (...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),wait);};}

function updateUrlState(category, course, historyMode){
  const url = new URL(window.location.href);
  if(category) url.searchParams.set('category', courseSlug(category));
  else url.searchParams.delete('category');
  if(course) url.searchParams.set('course', courseSlug(course));
  else url.searchParams.delete('course');
  window.history[historyMode + 'State']({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
}

function initializeUrlState(){
  const params = new URLSearchParams(window.location.search);
  const requestedCategory = params.get('category') || '';
  const requestedCourse = params.get('course') || '';
  const category = requestedCategory
    ? allCourses.find(course => courseSlug(course.category) === requestedCategory)?.category
    : '';
  const course = requestedCourse
    ? allCourses.find(item => courseSlug(item.name) === requestedCourse && (!category || item.category === category))
    : null;

  if((requestedCategory && !category) || (requestedCourse && !course)){
    selectedCourseSlug = '';
    filterCategory.value = '';
    updateUrlState('', '', 'replace');
    return;
  }

  const resolvedCategory = category || (course && course.category) || '';
  filterCategory.value = resolvedCategory;
  selectedCourseSlug = course ? courseSlug(course.name) : '';
}

window.addEventListener('popstate', () => {
  initializeUrlState();
  applyFiltersAndRender();
});

// init
async function init(){
  try{
    const [raw, menuResponse] = await Promise.all([
      loadCSV('c_c.csv'),
      fetch('data/courses-menu.json').then(response => response.ok ? response.json() : {categories: []})
    ]);
    allCourses = reconcileMenuCategories(raw.map(mapCourse), menuResponse);
    renderFilters();
    initializeUrlState();
    applyFiltersAndRender();
  }catch(err){
    const p = document.createElement('p');
    p.style.padding = '24px'; p.style.background = '#fff'; p.style.borderRadius = '12px';
    p.textContent = 'Unable to load course data.';
    coursesGrid.appendChild(p);
    console.error(err);
  }
}

init();
