/* courses.js - Load CSV, render course cards, and filter the catalogue. */

// Elements
const coursesGrid = document.getElementById('coursesGrid');
const filterCategory = document.getElementById('filterCategory');
const siteSearch = document.getElementById('siteSearch');

let allCourses = [];

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

function renderFilters(){
  const cats = Array.from(new Set(allCourses.map(c=>c.category).filter(Boolean))).sort();
  cats.forEach(cat=>{
    const opt = document.createElement('option'); opt.value=cat; opt.textContent=cat; filterCategory.appendChild(opt);
  });
}

function createCard(course){
  const card = document.createElement('article');
  card.className = 'course-card fade-in';
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
  }
}

// wire events
siteSearch && siteSearch.addEventListener('input', debounce(()=>applyFiltersAndRender(),250));
filterCategory && filterCategory.addEventListener('change', ()=>applyFiltersAndRender());

function debounce(fn, wait){let t; return (...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),wait);};}

// init
async function init(){
  try{
    const raw = await loadCSV('c_c.csv');
    allCourses = raw.map(mapCourse);
    renderFilters();
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
