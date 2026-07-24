/* courses.js - Load CSV, render premium course cards, filtering & Load More
   Vanilla JS, lightweight, accessible, no frameworks
*/

// Elements
const coursesGrid = document.getElementById('coursesGrid');
const filterCategory = document.getElementById('filterCategory');
const filterLevel = document.getElementById('filterLevel');
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
  const lines = text.trim().split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const headers = lines.shift().split(',').map(h=>h.trim());
  return lines.map(line=>{
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h,i)=>obj[h]=cols[i] ? cols[i].trim() : '');
    return obj;
  });
}

function mapCourse(raw){
  const name = raw['Course Name'] || raw['name'] || 'Untitled';
  const duration = raw['Duration'] || '1';
  const price = raw['Standard Fee'] || '';
  const level = duration <= 1 ? 'beginner' : duration <=2 ? 'intermediate' : 'advanced';
  const desc = raw['Short Description'] || raw['Course Name'] || 'High-impact training to level up fast.';
  const category = raw['Category'] || 'General';
  return {name, duration, price, level, desc, category};
}

function renderFilters(){
  const cats = Array.from(new Set(allCourses.map(c=>c.category))).sort();
  cats.forEach(cat=>{
    const opt = document.createElement('option'); opt.value=cat; opt.textContent=cat; filterCategory.appendChild(opt);
  });
}

function createCard(course){
  const card = document.createElement('article');
  card.className = 'course-card fade-in';
  card.tabIndex = 0;

  const top = document.createElement('div'); top.className = 'course-top';
  const meta = document.createElement('div'); meta.className = 'course-meta';
  const badge = document.createElement('span'); badge.className = 'badge';
  const badgeIcon = document.createElement('i'); badgeIcon.className = 'fas fa-folder-open';
  badge.appendChild(badgeIcon);
  badge.appendChild(document.createTextNode(' ' + escape(course.category)));
  meta.appendChild(badge);
  const duration = document.createElement('div'); duration.className = 'course-duration';
  const durationIcon = document.createElement('i'); durationIcon.className = 'fas fa-clock';
  duration.appendChild(durationIcon);
  duration.appendChild(document.createTextNode(' ' + escape(course.duration) + ' day' + (course.duration==='1'?'':'s')));
  top.appendChild(meta);
  top.appendChild(duration);
  card.appendChild(top);

  const h3 = document.createElement('h3'); h3.className = 'course-title'; h3.textContent = escape(course.name);
  const p = document.createElement('p'); p.className = 'course-desc'; p.textContent = escape(course.desc);
  const info = document.createElement('div'); info.className = 'course-info';
  const span = document.createElement('span');
  const infoIcon = document.createElement('i'); infoIcon.className = 'fas fa-signal';
  span.appendChild(infoIcon);
  span.appendChild(document.createTextNode(' ' + capitalize(course.level)));
  info.appendChild(span);

  const actions = document.createElement('div'); actions.className = 'card-actions';
  const btn1 = document.createElement('button'); btn1.className='btn-secondary'; btn1.setAttribute('aria-label', 'Learn more about ' + escape(course.name)); btn1.textContent='Learn More';
  const btn2 = document.createElement('button'); btn2.className='btn-primary'; btn2.setAttribute('aria-label', 'Enroll in ' + escape(course.name)); btn2.textContent='Enroll Now';
  actions.appendChild(btn1); actions.appendChild(btn2);

  card.appendChild(h3);
  card.appendChild(p);
  card.appendChild(info);
  card.appendChild(actions);
  return card;
}

function escape(str){ return String(str||'').replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;', '"':'&quot;',"'":'&#39;' })[s]); }
function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

function applyFiltersAndRender(){
  const q = (siteSearch && siteSearch.value||'').toLowerCase();
  const cat = filterCategory ? filterCategory.value : '';
  const level = filterLevel ? filterLevel.value : '';
  const filtered = allCourses.filter(c=>{
    if(cat && c.category !== cat) return false;
    if(level && c.level !== level) return false;
    if(q){
      return c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q);
    }
    return true;
  });
  while (coursesGrid.firstChild) coursesGrid.removeChild(coursesGrid.firstChild);
  // render all matching courses (user requested all 160 visible)
  filtered.forEach(c=>coursesGrid.appendChild(createCard(c)));
}

// wire events
siteSearch && siteSearch.addEventListener('input', debounce(()=>applyFiltersAndRender(),250));
filterCategory && filterCategory.addEventListener('change', ()=>applyFiltersAndRender());
filterLevel && filterLevel.addEventListener('change', ()=>applyFiltersAndRender());

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
