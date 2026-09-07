/* ============================================================================
   ENROLLMENT.JS - COMPLETE ENROLLMENT FLOW
   
   Handles:
   - Form validation (step 1)
   - Review display (step 2)
    - PayPal payment initialization (step 3)
   - Success confirmation (step 4)
   - Payment verification
   - Error handling & recovery
   ============================================================================ */

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = window.ENROLLMENT_API_BASE || 'http://localhost:3000';
let currentStep = 1;
let enrollmentData = {
    student_name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    state: '',
    pincode: '',
    course_name: '',
    course_id: '',
    amount: 0,
    message: ''
};
let enrollmentId = null;
let paymentConfig = {
    currencies: { 'United States': 'USD', Canada: 'CAD', Australia: 'AUD' },
};

function getPaymentQuote() {
    const currency = paymentConfig.currencies[enrollmentData.country];
    return { currency, amount: enrollmentData.amount };
}

function formatPaymentAmount(amount, currency) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

// City data by country
const cityData = {
    'United States': [
        'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
        'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
        'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis',
        'Austin', 'Seattle', 'Denver', 'Boston', 'Miami', 'Portland'
    ],
    'Canada': [
        'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton',
        'Winnipeg', 'Quebec', 'Hamilton', 'Kitchener', 'London', 'Halifax',
        'Windsor', 'Saskatoon', 'Victoria', 'Laval', 'Barrie', 'Markham'
    ],
    'Australia': [
        'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Hobart',
        'Canberra', 'Newcastle', 'Gold Coast', 'Sunshine Coast', 'Wollongong',
        'Logan City', 'Geelong', 'Townsville', 'Cairns', 'Toowoomba'
    ]
};

// Get course info from URL or session
function parseCourseCatalog(text) {
    const rows = text.split(/\r?\n/).filter(row => row.trim()).map(row => {
        const values = [];
        let value = '';
        let quoted = false;
        for (const character of row) {
            if (character === '"') quoted = !quoted;
            else if (character === ',' && !quoted) {
                values.push(value.trim());
                value = '';
            } else value += character;
        }
        values.push(value.trim());
        return values;
    });
    const headers = rows.shift() || [];
    return rows.map(row => headers.reduce((course, header, index) => {
        course[header] = row[index] || '';
        return course;
    }, {}));
}

async function initializeCourse() {
    const params = new URLSearchParams(window.location.search);
    const courseSlug = params.get('course');
    
    if (!courseSlug) {
        window.location.href = 'courses.html';
        return;
    }

    // Get course details from session storage or localStorage
    const courseInfo = sessionStorage.getItem('selectedCourse');
    if (courseInfo) {
        const course = JSON.parse(courseInfo);
        enrollmentData.course_name = course.name;
        enrollmentData.course_id = course.id || course.name;
        enrollmentData.amount = course.price || 5000;
        try {
            const response = await fetch(`${API_BASE}/api/paypal/config`);
            const config = await response.json();
            if (response.ok && config.ok) paymentConfig = config;
        } catch (error) {
            console.warn('Using default currency conversion rates:', error.message);
        }
    } else {
        try {
            const response = await fetch('c_c.csv');
            const courses = parseCourseCatalog(await response.text());
            const course = courses.find(item => item['Course Name']
                && item['Course Name'].toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '') === courseSlug.toLowerCase());
            if (!course) throw new Error('Course not found');
            enrollmentData.course_name = course['Course Name'];
            enrollmentData.course_id = courseSlug;
            enrollmentData.amount = Number(course.Price) || 5000;
        } catch (error) {
            alert('Please select a course first');
            window.location.href = 'courses.html';
            return;
        }
    }

    try {
        const response = await fetch(`${API_BASE}/api/paypal/config`);
        const config = await response.json();
        if (response.ok && config.ok) paymentConfig = config;
    } catch (error) {
        console.warn('Payment API unavailable until checkout:', error.message);
    }
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

const validationRules = {
    studentName: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-Z\s'-]+$/,
        message: 'Please enter a valid name (letters, spaces, hyphens, apostrophes only)'
    },
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
    },
    phone: {
        required: true,
        pattern: /^[+]?[0-9\s\-()]{7,}$/,
        message: 'Please enter a valid phone number (at least 7 digits)'
    },
    country: {
        required: true,
        message: 'Please select a country'
    },
    city: {
        required: true,
        message: 'Please select a city'
    },
    state: {
        required: true,
        minLength: 2,
        maxLength: 100,
        message: 'Please enter a valid state/province name'
    },
    pincode: {
        required: true,
        minLength: 3,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9\s\-]+$/,
        message: 'Please enter a valid postal/ZIP code'
    },
    message: {
        required: false,
        maxLength: 5000
    }
};

function validateField(fieldName, value) {
    const rules = validationRules[fieldName];
    if (!rules) return { valid: true };

    // Check required
    if (rules.required && (!value || value.trim() === '')) {
        return { valid: false, error: 'This field is required' };
    }

    // If not required and empty, it's valid
    if (!rules.required && (!value || value.trim() === '')) {
        return { valid: true };
    }

    // Check min length
    if (rules.minLength && value.length < rules.minLength) {
        return { valid: false, error: `Minimum ${rules.minLength} characters required` };
    }

    // Check max length
    if (rules.maxLength && value.length > rules.maxLength) {
        return { valid: false, error: `Maximum ${rules.maxLength} characters allowed` };
    }

    // Check pattern
    if (rules.pattern && !rules.pattern.test(value)) {
        return { valid: false, error: rules.message };
    }

    return { valid: true };
}

function showError(fieldName, message) {
    const errorEl = document.getElementById(`error-${fieldName}`);
    const inputEl = document.getElementById(fieldName) || document.getElementById(fieldName);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
    if (inputEl) {
        inputEl.classList.add('error');
    }
}

function clearError(fieldName) {
    const errorEl = document.getElementById(`error-${fieldName}`);
    const inputEl = document.getElementById(fieldName);
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('show');
    }
    if (inputEl) {
        inputEl.classList.remove('error');
    }
}

function validateDetailsForm() {
    const fields = ['studentName', 'email', 'phone', 'country', 'city', 'state', 'pincode'];
    let isValid = true;

    fields.forEach(field => {
        const inputId = field.charAt(0).toLowerCase() + field.slice(1);
        const value = document.getElementById(inputId)?.value || '';
        const validation = validateField(field, value);

        if (!validation.valid) {
            showError(inputId, validation.error);
            isValid = false;
        } else {
            clearError(inputId);
        }
    });

    return isValid;
}

// ============================================================================
// STEP 2: DISPLAY REVIEW DETAILS
// ============================================================================

function displayReview() {
    // Display customer details
    document.getElementById('review-name').textContent = enrollmentData.student_name;
    document.getElementById('review-email').textContent = enrollmentData.email;
    document.getElementById('review-phone').textContent = enrollmentData.phone;
    document.getElementById('review-country').textContent = enrollmentData.country;
    document.getElementById('review-city').textContent = enrollmentData.city;
    document.getElementById('review-state').textContent = enrollmentData.state;
    document.getElementById('review-pincode').textContent = enrollmentData.pincode;
    
    // Display course details
    document.getElementById('review-course').textContent = enrollmentData.course_name;
    const quote = getPaymentQuote();
    document.getElementById('review-fee').textContent = formatPaymentAmount(quote.amount, quote.currency);

    // Show message only if it exists
    if (enrollmentData.message) {
        document.getElementById('review-message-field').style.display = 'block';
        document.getElementById('review-message').textContent = enrollmentData.message;
    } else {
        document.getElementById('review-message-field').style.display = 'none';
    }
}

// ============================================================================
// STEP NAVIGATION
// ============================================================================

function goToStep(step) {
    // Display review details when navigating to step 2
    if (step === 2) {
        displayReview();
    }

    // Display payment summary when navigating to step 3
    if (step === 3) {
        const quote = getPaymentQuote();
        document.getElementById('payment-course').textContent = enrollmentData.course_name;
        document.getElementById('payment-amount').textContent = formatPaymentAmount(quote.amount, quote.currency);
        document.getElementById('payment-total').textContent = formatPaymentAmount(quote.amount, quote.currency);
    }

    // Hide all steps
    document.querySelectorAll('.enrollment-step').forEach(el => {
        el.classList.remove('active');
    });

    // Show target step
    const stepEl = document.getElementById(`step-${step}`);
    if (stepEl) {
        stepEl.classList.add('active');
    }

    // Update progress indicator
    document.querySelectorAll('.progress-step').forEach((el, idx) => {
        if (idx + 1 <= step) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (step === 3) {
        initiatePayment();
    }
}

function previousStep() {
    if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
}

function goBack() {
    if (confirm('Are you sure you want to cancel enrollment?')) {
        window.location.href = 'courses.html';
    }
}

// ============================================================================
// STEP 1: COLLECT DETAILS
// ============================================================================

function collectDetailsFromForm() {
    enrollmentData.student_name = document.getElementById('studentName').value.trim();
    enrollmentData.email = document.getElementById('email').value.trim();
    enrollmentData.phone = document.getElementById('phone').value.trim();
    enrollmentData.country = document.getElementById('country').value.trim();
    enrollmentData.city = document.getElementById('city').value.trim();
    enrollmentData.state = document.getElementById('state').value.trim();
    enrollmentData.pincode = document.getElementById('pincode').value.trim();
    enrollmentData.message = document.getElementById('message').value.trim();
}

// Populate city dropdown based on selected country
function populateCities() {
    const countrySelect = document.getElementById('country');
    const citySelect = document.getElementById('city');
    const selectedCountry = countrySelect.value;

    // Clear previous options
    citySelect.innerHTML = '<option value="">Select a city...</option>';
    citySelect.value = '';
    clearError('city');

    // Populate new options if country is selected
    if (selectedCountry && cityData[selectedCountry]) {
        cityData[selectedCountry].forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    } else {
        citySelect.innerHTML = '<option value="">Select a country first...</option>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeCourse();

    // Form submission
    const detailsForm = document.getElementById('detailsForm');
    if (detailsForm) {
        // Add country change listener to populate cities
        const countrySelect = document.getElementById('country');
        if (countrySelect) {
            countrySelect.addEventListener('change', function() {
                populateCities();
                clearError('country');
            });
        }

        detailsForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!validateDetailsForm()) {
                return;
            }

            collectDetailsFromForm();
            goToStep(2);
        });

        // Real-time validation
        const inputs = detailsForm.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                const fieldName = this.name;
                const validation = validateField(fieldName, this.value);
                if (!validation.valid) {
                    showError(this.id, validation.error);
                } else {
                    clearError(this.id);
                }
            });

            input.addEventListener('input', function() {
                clearError(this.id);
            });

            input.addEventListener('change', function() {
                clearError(this.id);
            });
        });
    }
});

// ============================================================================
// STEP 2: REVIEW DETAILS
// ============================================================================

function proceedToPayment() {
    goToStep(3);
}

// ============================================================================
// STEP 3: PAYMENT PROCESSING
// ============================================================================

async function initiatePayment() {
    const loading = document.getElementById('loadingOverlay');

    try {
        // Step 1: Create enrollment record with PENDING_PAYMENT status
        console.log('Creating enrollment record...');
        const createResponse = await fetch(`${API_BASE}/api/enrollment/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_name: enrollmentData.student_name,
                email: enrollmentData.email,
                phone: enrollmentData.phone,
                country: enrollmentData.country,
                city: enrollmentData.city,
                state: enrollmentData.state,
                pincode: enrollmentData.pincode,
                course_name: enrollmentData.course_name,
                course_id: enrollmentData.course_id,
                amount: enrollmentData.amount,
                message: enrollmentData.message
            })
        });

        if (!createResponse.ok) {
            const error = await createResponse.json();
            throw new Error(error.error || 'Failed to create enrollment');
        }

        const createData = await createResponse.json();
        if (!createData.ok) {
            throw new Error(createData.error || 'Failed to create enrollment');
        }

        enrollmentId = createData.enrollment_id;
        console.log('✓ Enrollment created:', enrollmentId);

        // Load the PayPal SDK only after the server has supplied the public client ID.
        await loadPayPalSdk();

        // Step 2: Initialize PayPal button
        console.log('Initializing PayPal payment...');
        initializePayPalButton();

    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message + '\n\nPlease try again.');
        loading.classList.remove('active');
    }
}

async function loadPayPalSdk() {
    if (window.paypal) return;
    const configResponse = await fetch(`${API_BASE}/api/paypal/config`);
    const config = await configResponse.json();
    if (!configResponse.ok || !config.ok) throw new Error(config.error || 'PayPal is not configured');

    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.client_id)}&currency=${encodeURIComponent(getPaymentQuote().currency)}&intent=capture`;
        script.onload = resolve;
        script.onerror = () => reject(new Error('PayPal SDK failed to load'));
        document.head.appendChild(script);
    });
}

function initializePayPalButton() {
    // Check if PayPal is loaded
    if (typeof paypal === 'undefined') {
        alert('PayPal payment gateway is not available. Please refresh the page and try again.');
        location.reload();
        return;
    }

    // Clear previous button if any
    const container = document.getElementById('paypal-button-container');
    container.innerHTML = '';

    // Render PayPal button
    paypal.Buttons({
        createOrder: (data, actions) => {
            return fetch(`${API_BASE}/api/enrollment/paypal/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enrollment_id: enrollmentId })
            }).then(async response => {
                const result = await response.json();
                if (!response.ok || !result.ok) throw new Error(result.error || 'Could not create PayPal order');
                return result.order_id;
            }).catch(error => {
                console.error('PayPal order creation failed:', error);
                throw new Error(`Unable to create PayPal order. ${error.message}`);
            });
        },
        onApprove: async (data, actions) => {
            const loading = document.getElementById('loadingOverlay');
            loading.classList.add('active');

            try {
                // Capture and verify the order on the server.
                const verifyResponse = await fetch(`${API_BASE}/api/enrollment/verify-payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        enrollment_id: enrollmentId,
                        order_id: data.orderID
                    })
                });

                const verifyData = await verifyResponse.json();

                if (!verifyData.ok) {
                    throw new Error(verifyData.error || 'Payment verification failed');
                }

                console.log('✓ Payment verified successfully');
                displaySuccessScreen(verifyData.enrollment);
                goToStep(4);

            } catch (error) {
                console.error('Payment verification failed:', error);
                alert('Payment verification failed: ' + error.message);

                // Mark payment as failed
                try {
                    await fetch(`${API_BASE}/api/enrollment/payment-failed`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            enrollment_id: enrollmentId,
                            reason: error.message
                        })
                    });
                } catch (e) {
                    console.error('Error marking payment as failed:', e);
                }

                loading.classList.remove('active');
                goToStep(3);
            }
        },
        onError: (err) => {
            console.error('PayPal error:', err);
            alert('Payment error: ' + (err.message || 'Something went wrong'));
            const loading = document.getElementById('loadingOverlay');
            loading.classList.remove('active');
        },
        onCancel: (data) => {
            console.log('Payment cancelled');
            if (confirm('Payment cancelled. Would you like to try again?')) {
                // Try again - button stays visible
            } else {
                previousStep();
            }
        }
    }).render('#paypal-button-container');
}

// ============================================================================
// STEP 4: SUCCESS SCREEN
// ============================================================================

function displaySuccessScreen(enrollment) {
    const loading = document.getElementById('loadingOverlay');
    loading.classList.remove('active');

    // Populate success screen
    document.getElementById('final-name').textContent = enrollment.student_name;
    document.getElementById('final-course').textContent = enrollment.course_name;
    document.getElementById('final-enrollment-id').textContent = enrollment.enrollment_id;
    document.getElementById('final-payment-id').textContent = enrollment.payment_id;
    document.getElementById('final-amount').textContent = formatPaymentAmount(enrollment.amount, enrollment.currency);
    
    const enrollDate = new Date(enrollment.created_at);
    document.getElementById('final-date').textContent = enrollDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ============================================================================
// INITIALIZE ON PAGE LOAD
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // PayPal script is loaded from HTML head
    // Payment will be initialized when user navigates to Step 3
    console.log('✓ DOMContentLoaded - Ready for PayPal payments');
});

// ============================================================================
// PREVENT DIRECT ACCESS TO SUCCESS PAGE
// ============================================================================

// Store enrollment state in sessionStorage
window.addEventListener('beforeunload', function() {
    if (currentStep < 4) {
        // User is leaving before completion - this is fine
        sessionStorage.setItem('enrollmentInProgress', 'true');
    }
});

// Check if user is trying to access success page directly
window.addEventListener('load', function() {
    if (currentStep === 4 && !enrollmentId) {
        // Trying to access success page without payment - redirect
        window.location.href = 'courses.html';
    }
});

console.log('✓ Enrollment.js loaded successfully');
