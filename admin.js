const API_BASE = window.ENROLLMENT_API_BASE || `http://${window.location.hostname || 'localhost'}:3000`;
const tokenKey = 'transcendin_admin_token';
let enrollments = [];

const $ = id => document.getElementById(id);

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Admin API returned invalid data (HTTP ${response.status})`);
  }
}

function setAuthenticated(authenticated) {
  $('login-panel').classList.toggle('hidden', authenticated);
  $('dashboard-panel').classList.toggle('hidden', !authenticated);
}

function paymentClass(status) {
  if (status === 'PAID') return '';
  if (status === 'PAYMENT_FAILED') return 'failed';
  return 'pending';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[character]));
}

function renderEnrollments() {
  const rows = $('enrollment-rows');
  rows.innerHTML = enrollments.map(enrollment => `
    <tr>
      <td><span class="customer-name">${escapeHtml(enrollment.student_name)}</span><span class="customer-contact">${escapeHtml(enrollment.email)}</span><span class="customer-contact">${escapeHtml(enrollment.phone)}</span><span class="small">${escapeHtml(enrollment.city)}, ${escapeHtml(enrollment.country)}</span></td>
      <td>${escapeHtml(enrollment.course_name)}<span class="small">${escapeHtml(enrollment.course_id)}</span></td>
      <td><strong>${escapeHtml(enrollment.currency)} ${escapeHtml(enrollment.amount)}</strong><span class="small">${escapeHtml(enrollment.payment_method || '')}</span></td>
      <td><span class="status ${paymentClass(enrollment.enrollment_status)}">${escapeHtml(enrollment.enrollment_status)}</span><span class="small">${escapeHtml(enrollment.payment_id || 'Not paid')}</span></td>
      <td>${escapeHtml(new Date(enrollment.created_at).toLocaleString())}</td>
      <td><span class="small">${escapeHtml(enrollment.enrollment_id)}</span></td>
    </tr>`).join('');
  $('empty-state').classList.toggle('hidden', enrollments.length !== 0);
}

async function loadEnrollments() {
  const token = sessionStorage.getItem(tokenKey);
  if (!token) return setAuthenticated(false);
  const params = new URLSearchParams({ search: $('search').value, status: $('status').value });
  try {
    const response = await fetch(`${API_BASE}/api/admin/enrollments?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const result = await readJson(response);
    if (response.status === 401) {
      sessionStorage.removeItem(tokenKey);
      setAuthenticated(false);
      throw new Error('Your admin session has expired.');
    }
    if (!response.ok || !result.ok) throw new Error(result.error || 'Failed to load enrollments');
    enrollments = result.enrollments;
    $('dashboard-error').textContent = '';
    renderEnrollments();
  } catch (error) {
    $('dashboard-error').textContent = error.message;
  }
}

function exportCsv() {
  const headers = ['Enrollment ID', 'Name', 'Email', 'Phone', 'Country', 'City', 'State', 'Postal Code', 'Course', 'Currency', 'Amount', 'Payment Status', 'Payment ID', 'Created At'];
  const values = enrollments.map(item => [item.enrollment_id, item.student_name, item.email, item.phone, item.country, item.city, item.state, item.pincode, item.course_name, item.currency, item.amount, item.enrollment_status, item.payment_id || '', item.created_at]);
  const csv = [headers, ...values].map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = `transcendin-enrollments-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

$('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  $('login-error').textContent = '';
  try {
    const response = await fetch(`${API_BASE}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: $('username').value, password: $('password').value }) });
    const result = await readJson(response);
    if (!response.ok || !result.ok) throw new Error(result.error || 'Sign-in failed');
    sessionStorage.setItem(tokenKey, result.token);
    setAuthenticated(true);
    await loadEnrollments();
  } catch (error) {
    $('login-error').textContent = error instanceof TypeError
      ? 'Unable to connect to the admin API. Start node server.js and use http://localhost:8000/admin.html.'
      : error.message;
  }
});

$('search').addEventListener('input', loadEnrollments);
$('status').addEventListener('change', loadEnrollments);
$('refresh-button').addEventListener('click', loadEnrollments);
$('export-button').addEventListener('click', exportCsv);
$('logout-button').addEventListener('click', () => { sessionStorage.removeItem(tokenKey); setAuthenticated(false); });

setAuthenticated(Boolean(sessionStorage.getItem(tokenKey)));
if (sessionStorage.getItem(tokenKey)) loadEnrollments();
