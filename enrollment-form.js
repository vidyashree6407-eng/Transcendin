function initializeEnrollmentForm() {
  const form = document.getElementById('enrollForm');
  const courseSelect = document.getElementById('course');
  const formatSelect = document.getElementById('courseFormat');
  const dateSelect = document.getElementById('startDate');
  const paymentMethods = document.querySelectorAll('.payment-method');
  if (!form || !courseSelect || !formatSelect || !dateSelect) return;

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

  [courseSelect, formatSelect, dateSelect].forEach(control => control.addEventListener('change', updateSummary));
  paymentMethods.forEach(method => method.addEventListener('click', () => {
    paymentMethods.forEach(item => item.classList.remove('active'));
    method.classList.add('active');
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const enrollmentForm = document.getElementById('enrollmentForm');
    if (enrollmentForm) enrollmentForm.replaceChildren();
    document.getElementById('successMessage').classList.add('show');
  });
  updateSummary();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEnrollmentForm);
} else {
  initializeEnrollmentForm();
}
