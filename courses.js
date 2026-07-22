/* courses.js - Load CSV, render premium course cards, filtering & Load More
   Vanilla JS, lightweight, accessible, no frameworks
*/

// Configuration
const COURSES_PER_PAGE = 12;

// Elements
const coursesGrid = document.getElementById('coursesGrid');
const filterCategory = document.getElementById('filterCategory');
const filterLevel = document.getElementById('filterLevel');
const siteSearch = document.getElementById('siteSearch');
const loadMoreBtn = document.getElementById('loadMore');

let allCourses = [];
let visibleCount = 0;

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
  card.innerHTML = `
    <div class="course-top">
      <div class="course-meta">
        <span class="badge"><i class="fas fa-folder-open"></i> ${escape(course.category)}</span>
      </div>
      <div class="course-duration"><i class="fas fa-clock"></i> ${escape(course.duration)} day${course.duration==='1'?'':'s'}</div>
    </div>
    <h3 class="course-title">${escape(course.name)}</h3>
    <p class="course-desc">${escape(course.desc)}</p>
    <div class="course-info"><span><i class="fas fa-signal"></i> ${capitalize(course.level)}</span></div>
    <div class="card-actions">
      <button class="btn-secondary" aria-label="Learn more about ${escape(course.name)}">Learn More</button>
      <button class="btn-primary" aria-label="Enroll in ${escape(course.name)}">Enroll Now</button>
    </div>
  `;
  return card;
}

function escape(str){ return String(str||'').replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;', '"':'&quot;',"'":'&#39;' })[s]); }
function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

function applyFiltersAndRender(reset=true){
  const q = (siteSearch.value||'').toLowerCase();
  const cat = filterCategory.value;
  const level = filterLevel.value;
  const filtered = allCourses.filter(c=>{
    if(cat && c.category !== cat) return false;
    if(level && c.level !== level) return false;
    if(q){
      return c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q);
    }
    return true;
  });
  if(reset){ visibleCount=0; coursesGrid.innerHTML=''; }
  renderSlice(filtered);
  loadMoreBtn.style.display = (visibleCount < filtered.length) ? '' : 'none';
}

function renderSlice(list){
  const slice = list.slice(visibleCount, visibleCount+COURSES_PER_PAGE);
  slice.forEach(c=>coursesGrid.appendChild(createCard(c)));
  visibleCount += slice.length;
}

// wire events
loadMoreBtn && loadMoreBtn.addEventListener('click', ()=> applyFiltersAndRender(false));
siteSearch && siteSearch.addEventListener('input', debounce(()=>applyFiltersAndRender(true),250));
filterCategory && filterCategory.addEventListener('change', ()=>applyFiltersAndRender(true));
filterLevel && filterLevel.addEventListener('change', ()=>applyFiltersAndRender(true));

function debounce(fn, wait){let t; return (...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),wait);};}

// init
async function init(){
  try{
    const raw = await loadCSV('c_c.csv');
    allCourses = raw.map(mapCourse);
    renderFilters();
    applyFiltersAndRender(true);
  }catch(err){
    coursesGrid.innerHTML = '<p style="padding:24px;background:#fff;border-radius:12px">Unable to load course data.</p>';
    console.error(err);
  }
}

init();
