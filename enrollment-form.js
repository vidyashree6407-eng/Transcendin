// Use shared courseSlug if loaded, else simple slug
function toSlug(str) {
  if (typeof window.courseSlug === 'function') return window.courseSlug(str);
  return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Convert slug back to a human-readable title for display
function slugToTitle(slug) {
  return (slug || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function initEnrollmentForm() {
  const form = document.getElementById('enrollForm');
  const paymentPanel = document.getElementById('paymentPanel');
  const successPanel = document.getElementById('successPanel');
  if (!form) return;

  // ── Read course from URL and display it ──────────────────────────────────
  const courseParam = new URLSearchParams(window.location.search).get('course') || '';
  const notice = document.getElementById('courseNotice');
  let courseName = '';

  if (!courseParam) {
    if (notice) notice.style.display = '';
  } else {
    // Load CSV to get exact course name; fall back to slug-to-title conversion
    fetch('c_c.csv')
      .then(r => r.ok ? r.text() : null)
      .then(text => {
        if (text) {
          const lines = text.split(/\r?\n/).slice(1);
          for (const line of lines) {
            const name = line.split(',')[0].trim();
            if (name && toSlug(name) === courseParam) { courseName = name; break; }
          }
        }
        if (!courseName) courseName = slugToTitle(courseParam);
        applyCourseName(courseName);
      })
      .catch(() => {
        courseName = slugToTitle(courseParam);
        applyCourseName(courseName);
      });
  }

  function applyCourseName(name) {
    const banner = document.getElementById('courseBanner');
    const bannerName = document.getElementById('bannerCourseName');
    const summaryName = document.getElementById('summaryCourseName');
    if (banner && name) { banner.style.display = 'flex'; }
    if (bannerName) bannerName.textContent = name;
    if (summaryName) summaryName.textContent = name || '—';
  }

  // ── Step 1 → Step 2 ──────────────────────────────────────────────────────
  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('fullName')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';

    document.getElementById('payCourseName').textContent = courseName || slugToTitle(courseParam) || '—';
    document.getElementById('payStudentName').textContent = name;

    // Update PayPal link with course info in the memo field
    const paypalBtn = document.getElementById('paypalBtn');
    if (paypalBtn && courseParam) {
      const memo = encodeURIComponent((courseName || courseParam) + ' — ' + name);
      paypalBtn.href = 'https://paypal.me/TranscendIN?note=' + memo;
    }

    form.style.display = 'none';
    paymentPanel.style.display = 'block';
    paymentPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Store for success panel
    paymentPanel.dataset.studentName = name;
    paymentPanel.dataset.studentEmail = email;
    paymentPanel.dataset.courseName = courseName || slugToTitle(courseParam);
  });

  // ── Step 2 → Step 3 ──────────────────────────────────────────────────────
  const paymentDoneBtn = document.getElementById('paymentDoneBtn');
  if (paymentDoneBtn) {
    paymentDoneBtn.addEventListener('click', () => {
      document.getElementById('successCourseName').textContent = paymentPanel.dataset.courseName || '—';
      document.getElementById('successStudentName').textContent = paymentPanel.dataset.studentName || '—';
      document.getElementById('successEmail').textContent = paymentPanel.dataset.studentEmail || '—';

      paymentPanel.style.display = 'none';
      successPanel.style.display = 'block';
      successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ── Back button ───────────────────────────────────────────────────────────
  const backToFormBtn = document.getElementById('backToFormBtn');
  if (backToFormBtn) {
    backToFormBtn.addEventListener('click', () => {
      paymentPanel.style.display = 'none';
      form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEnrollmentForm);
} else {
  initEnrollmentForm();
}


// Full CSV parser (handles quoted fields, same logic as courses.js)
function parseCSVForEnrollment(text) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"' && quoted && next === '"') { value += '"'; i++; }
    else if (ch === '"') { quoted = !quoted; }
    else if (ch === ',' && !quoted) { row.push(value.trim()); value = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i++;
      row.push(value.trim());
      if (row.some(c => c !== '')) rows.push(row);
      row = []; value = '';
    } else { value += ch; }
  }
  if (value || row.length) { row.push(value.trim()); if (row.some(c => c !== '')) rows.push(row); }
  const headers = rows.shift().map(h => h.trim());
  return rows.map(cols => headers.reduce((obj, h, i) => { obj[h] = cols[i] || ''; return obj; }, {}));
}

async function populateCourseSelect(courseSelect) {
  try {
    const res = await fetch('c_c.csv');
    if (!res.ok) return;
    const rows = parseCSVForEnrollment(await res.text());
    // Replace all static options with dynamic ones from CSV
    while (courseSelect.options.length > 1) courseSelect.remove(1);
    rows.forEach(row => {
      const name = (row['Course Name'] || '').trim();
      if (!name) return;
      const opt = document.createElement('option');
      opt.value = name;        // value = clean course name, no price suffix
      opt.textContent = name;
      courseSelect.appendChild(opt);
    });
  } catch (e) { /* CSV unavailable; static fallback options remain */ }
}

function preselectCourseFromUrl(courseSelect, updateSummary) {
  const param = new URLSearchParams(window.location.search).get('course');
  const notice = document.getElementById('courseNotice');

  if (!param) {
    if (notice) {
      notice.textContent = 'No course selected — please browse our courses and click Enroll, or select a course below.';
      notice.style.display = '';
    }
    return;
  }

  let matched = false;
  for (const opt of courseSelect.options) {
    if (!opt.value) continue;
    if (toSlug(opt.value) === param) {
      courseSelect.value = opt.value;
      matched = true;
      break;
    }
  }

  if (!matched) {
    if (notice) {
      notice.textContent = 'Course not found. Please select a course below or browse our catalogue.';
      notice.className = 'course-notice course-notice--error';
      notice.style.display = '';
    }
  } else {
    if (notice) notice.style.display = 'none';
  }

  updateSummary();
}

async function initializeEnrollmentForm() {
  const form = document.getElementById('enrollForm');
  const courseSelect = document.getElementById('course');
  const formatSelect = document.getElementById('courseFormat');
  const dateSelect = document.getElementById('startDate');
  const paymentMethods = document.querySelectorAll('.payment-method');
  if (!form || !courseSelect || !formatSelect || !dateSelect) return;

  // Populate select with all CSV courses before preselecting
  await populateCourseSelect(courseSelect);

  function updateSummary() {
    document.getElementById('summaryCourseName').textContent = courseSelect.value || 'Select a course';
    document.getElementById('summaryFormat').textContent = formatSelect.value ? formatSelect.options[formatSelect.selectedIndex].text : 'Select format';
    document.getElementById('summaryDate').textContent = dateSelect.value || 'Not selected';
    const priceMap = { standard: 695, 'early-bird': 545, 'live-virtual': 545, 'live-virtual-eb': 445 };
    const price = priceMap[formatSelect.value] || 0;
    const tax = Math.round(price * 0.1);
    document.getElementById('priceCourse').textContent = '$' + price.toFixed(2);
    document.getElementById('priceTax').textContent = '$' + tax.toFixed(2);
    document.getElementById('priceTotal').textContent = '$' + (price + tax).toFixed(2);
  }

  [courseSelect, formatSelect, dateSelect].forEach(el => el.addEventListener('change', updateSummary));
  paymentMethods.forEach(method => method.addEventListener('click', () => {
    paymentMethods.forEach(item => item.classList.remove('active'));
    method.classList.add('active');
  }));

  form.addEventListener('submit', event => {
    event.preventDefault();
    // Copy live summary values into the payment review panel
    document.getElementById('payCourseName').textContent = document.getElementById('summaryCourseName').textContent;
    document.getElementById('payFormat').textContent = document.getElementById('summaryFormat').textContent;
    document.getElementById('payDate').textContent = document.getElementById('summaryDate').textContent;
    document.getElementById('payTotal').textContent = document.getElementById('priceTotal').textContent;
    form.style.display = 'none';
    document.getElementById('paymentPanel').style.display = 'block';
    document.getElementById('paymentPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const completePaymentBtn = document.getElementById('completePaymentBtn');
  const backToFormBtn = document.getElementById('backToFormBtn');

  if (completePaymentBtn) {
    completePaymentBtn.addEventListener('click', () => {
      const cardName = document.getElementById('cardName');
      const cardNumber = document.getElementById('cardNumber');
      const cardExpiry = document.getElementById('cardExpiry');
      const cardCvv = document.getElementById('cardCvv');
      if (!cardName?.value.trim() || !cardNumber?.value.trim() || !cardExpiry?.value.trim() || !cardCvv?.value.trim()) {
        cardName.style.borderColor = cardName.value.trim() ? '' : '#e53935';
        cardNumber.style.borderColor = cardNumber.value.trim() ? '' : '#e53935';
        cardExpiry.style.borderColor = cardExpiry.value.trim() ? '' : '#e53935';
        cardCvv.style.borderColor = cardCvv.value.trim() ? '' : '#e53935';
        return;
      }
      document.getElementById('paymentPanel').style.display = 'none';
      const successMessage = document.getElementById('successMessage');
      if (successMessage) successMessage.classList.add('show');
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (backToFormBtn) {
    backToFormBtn.addEventListener('click', () => {
      document.getElementById('paymentPanel').style.display = 'none';
      form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  preselectCourseFromUrl(courseSelect, updateSummary);
  updateSummary();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEnrollmentForm);
} else {
  initializeEnrollmentForm();
}
