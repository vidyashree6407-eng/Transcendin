// ==========================================
// TranscendIN - JavaScript Interactions
// ==========================================

// ==========================================
// Mobile Menu Toggle
// ==========================================

// HTML-escape helper to prevent XSS when inserting untrusted text
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
// expose for inline page scripts
window.escapeHtml = escapeHtml;


const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close menu when a link is clicked
const navLinks = navMenu.querySelectorAll('a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ==========================================
// Smooth Scroll for Navigation Links
// ==========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const element = document.querySelector(href);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ==========================================
// Discover Button
// ==========================================

const discoverBtn = document.getElementById('discoverBtn');
if (discoverBtn) {
    discoverBtn.addEventListener('click', () => {
        window.location.href = 'courses.html';
    });
}

// ==========================================
// Intersection Observer for Animations
// ==========================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all animated elements
document.querySelectorAll('.course-card, .reason-card, .testimonial-card, .instructor-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

// ==========================================
// Navbar Background on Scroll
// ==========================================

const navbar = document.querySelector('.navbar');
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 50) {
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.12)';
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.backdropFilter = 'blur(10px)';
    } else {
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.08)';
        navbar.style.background = '#ffffff';
        navbar.style.backdropFilter = 'none';
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// ==========================================
// Counter Animation
// ==========================================

function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);
    
    const counter = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(counter);
        }
        element.textContent = Math.floor(current).toLocaleString() + (element.textContent.includes('+') ? '+' : '');
    }, 16);
}

// Trigger counter animation when stats section is visible
const statsElements = document.querySelectorAll('.stat-number');
let countersStarted = false;

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !countersStarted) {
            countersStarted = true;
            
            // Animate 5000, 200, 50
            animateCounter(statsElements[0], 5000);
            animateCounter(statsElements[1], 200);
            animateCounter(statsElements[2], 50);
            
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroSection = document.querySelector('.hero');
if (heroSection) {
    statsObserver.observe(heroSection);
}

// ==========================================
// Enroll Button Interactions
// ==========================================

const enrollButtons = document.querySelectorAll('.btn-small, .cta-buttons .btn');

enrollButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'rippleAnimation 0.6s ease-out';
        ripple.style.pointerEvents = 'none';
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add ripple animation to stylesheet dynamically
if (!document.querySelector('style[data-ripple]')) {
    const style = document.createElement('style');
    style.setAttribute('data-ripple', 'true');
    style.textContent = `
        @keyframes rippleAnimation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// Course Card Hover Effect
// ==========================================

const courseCards = document.querySelectorAll('.course-card');

courseCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// ==========================================
// Reason Card Stagger Animation
// ==========================================

const reasonCards = document.querySelectorAll('.reason-card');

reasonCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
});

// ==========================================
// Parallax Effect on Hero Section
// ==========================================

const hero = document.querySelector('.hero');
const blobs = document.querySelectorAll('.gradient-blob');

window.addEventListener('mousemove', (e) => {
    if (window.innerWidth > 1024) {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        blobs.forEach((blob, index) => {
            const offset = (index + 1) * 30;
            blob.style.transform = `translate(${x * offset}px, ${y * offset}px)`;
        });
    }
});

// ==========================================
// Form Validation Example (for future contact form)
// ==========================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ==========================================
// Loading Animation
// ==========================================

window.addEventListener('load', () => {
    // Remove any loading state
    document.body.style.opacity = '1';
});

// ==========================================
// Scroll-to-top Button (for future implementation)
// ==========================================

function createScrollToTopButton() {
    const button = document.createElement('button');
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.className = 'scroll-to-top';
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #0052CC 0%, #FF6B35 100%);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        box-shadow: 0 4px 15px rgba(0, 82, 204, 0.3);
        z-index: 999;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    document.body.appendChild(button);
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            button.style.display = 'flex';
        } else {
            button.style.display = 'none';
        }
    });
    
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1) translateY(-3px)';
        button.style.boxShadow = '0 6px 25px rgba(0, 82, 204, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 15px rgba(0, 82, 204, 0.3)';
    });
}

// Initialize scroll-to-top button
createScrollToTopButton();

// ==========================================
// Keyboard Accessibility
// ==========================================

document.addEventListener('keydown', (e) => {
    // Close mobile menu on Escape key
    if (e.key === 'Escape') {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    }
    
    // Skip to content on Alt+S
    if (e.altKey && e.key === 's') {
        e.preventDefault();
        const mainContent = document.querySelector('.courses');
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
    }
});

// ==========================================
// Touch and Swipe Support for Mobile
// ==========================================

let touchStartX = 0;
let touchEndX = 0;

function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
        // Swiped left
        if (navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }
    if (touchEndX > touchStartX + 50) {
        // Swiped right
        navToggle.classList.add('active');
        navMenu.classList.add('active');
    }
}

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

// ==========================================
// Performance Optimization
// ==========================================

// Lazy load images (for future implementation)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ==========================================
// Dark Mode Toggle (Optional)
// ==========================================

function initDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedMode = localStorage.getItem('darkMode');
    
    if (savedMode !== null) {
        if (savedMode === 'true') {
            enableDarkMode();
        }
    } else if (prefersDark) {
        enableDarkMode();
    }
}

function enableDarkMode() {
    document.documentElement.style.setProperty('--primary-white', '#1a1a1a');
    document.documentElement.style.setProperty('--dark-text', '#ffffff');
    document.documentElement.style.setProperty('--light-text', '#b0b0b0');
    document.documentElement.style.setProperty('--light-bg', '#2a2a2a');
    document.documentElement.style.setProperty('--border-color', '#444');
    localStorage.setItem('darkMode', 'true');
}

function disableDarkMode() {
    document.documentElement.style.setProperty('--primary-white', '#ffffff');
    document.documentElement.style.setProperty('--dark-text', '#1a1a1a');
    document.documentElement.style.setProperty('--light-text', '#666666');
    document.documentElement.style.setProperty('--light-bg', '#f8f9fa');
    document.documentElement.style.setProperty('--border-color', '#e8e8e8');
    localStorage.setItem('darkMode', 'false');
}

// Optional: uncomment to enable dark mode
// initDarkMode();

// ==========================================
// Analytics Event Tracking (for future implementation)
// ==========================================

function trackEvent(category, action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
    }
}

// Track button clicks
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
        trackEvent('engagement', 'button_click', btn.textContent);
    });
});

// ==========================================
// Console Easter Egg
// ==========================================

console.log('%cWelcome to TranscendIN! 🚀', 'font-size: 20px; color: #FF6B35; font-weight: bold;');
console.log('%cLearning from the best instructors, one-on-one. 📚', 'font-size: 14px; color: #0052CC;');

// ==========================================
// Document Ready Completion
// ==========================================

console.log('TranscendIN JavaScript loaded successfully!');

// ==========================================
// Interactive Courses Panel (Categories -> Courses)
// Loads `courses_286.js` dynamically and builds a two-column panel.
// ==========================================

function loadScript(src, cb) {
    const s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = cb;
    document.head.appendChild(s);
}

function buildCoursesPanel() {
    // Ensure DOM elements exist
    const coursesBtn = document.getElementById('coursesBtn');
    const panel = document.getElementById('coursesPanel');
    const closeBtn = document.getElementById('closeCoursesPanel');
    const categoriesList = document.getElementById('coursesCategories');
    const coursesList = document.getElementById('coursesList');

    if (!coursesBtn || !panel || !categoriesList || !coursesList) return;

    // Group courses by category using the global coursesDatabase if available
    const db = window.coursesDatabase || [];
    const groups = {};
    db.forEach(c => {
        const cat = (c.category || 'other').toString().trim();
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(c);
    });

    // Create a sorted list of categories (human friendly)
    const categoryKeys = Object.keys(groups).sort();

    // Render categories
    categoriesList.innerHTML = '';
    categoryKeys.forEach((key, idx) => {
        const li = document.createElement('li');
        li.textContent = key.replace(/[-_]/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
        li.dataset.cat = key;
        if (idx === 0) li.classList.add('active');
        li.addEventListener('click', () => {
            categoriesList.querySelectorAll('li').forEach(x => x.classList.remove('active'));
            li.classList.add('active');
            renderCoursesForCategory(key);
        });
        categoriesList.appendChild(li);
    });

    function renderCoursesForCategory(catKey) {
        const items = groups[catKey] || [];
        coursesList.innerHTML = '';
        if (!items.length) {
            coursesList.innerHTML = '<p>No courses available in this category.</p>';
            return;
        }
        items.forEach(course => {
            const card = document.createElement('div');
            card.className = 'course-panel-card';
            const title = document.createElement('h5');
            title.textContent = course.name;
            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.textContent = (course.duration ? course.duration + ' day(s)' : '') + (course.rating ? ' • ' + course.rating + '⭐' : '');
            const desc = document.createElement('div');
            desc.className = 'desc';
            desc.textContent = course.description || '';
            const enroll = document.createElement('a');
            enroll.className = 'btn-enroll';
            enroll.href = 'courses.html';
            enroll.textContent = 'View / Enroll';

            card.appendChild(title);
            card.appendChild(meta);
            if (course.description) card.appendChild(desc);
            card.appendChild(enroll);
            coursesList.appendChild(card);
        });
    }

    // initial render: render all categories and their courses in the right pane
    function renderAllCategories() {
        coursesList.innerHTML = '';
        categoryKeys.forEach(cat => {
            const section = document.createElement('section');
            section.className = 'category-section';
            section.id = 'cat-' + cat;
            const heading = document.createElement('h5');
            heading.className = 'category-heading';
            heading.textContent = cat.replace(/[-_]/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
            section.appendChild(heading);
            const grid = document.createElement('div');
            grid.className = 'category-grid';
            (groups[cat] || []).forEach(course => {
                const card = document.createElement('div');
                card.className = 'course-panel-card';
                const title = document.createElement('h5');
                title.textContent = course.name;
                const meta = document.createElement('div');
                meta.className = 'meta';
                meta.textContent = (course.duration ? course.duration + ' day(s)' : '') + (course.rating ? ' • ' + course.rating + '⭐' : '');
                const enroll = document.createElement('a');
                enroll.className = 'btn-enroll';
                enroll.href = 'courses.html';
                enroll.textContent = 'View / Enroll';
                card.appendChild(title);
                card.appendChild(meta);
                card.appendChild(enroll);
                grid.appendChild(card);
            });
            section.appendChild(grid);
            coursesList.appendChild(section);
        });
    }

    if (categoryKeys.length) renderAllCategories();

    // open & close handlers
    function openPanel(e) {
        if (e && e.preventDefault) e.preventDefault();
        panel.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        trackEvent('ui', 'open_courses_panel', 'homepage');
    }
    function closePanel() {
        panel.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        trackEvent('ui', 'close_courses_panel', 'homepage');
    }

    // open on click (fallback)
    coursesBtn.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', closePanel);

    // Hover behavior: open panel when user hovers over the nav item, close when leaving both nav and panel
    let hoverTimeout = null;
    let isOverPanel = false;

    coursesBtn.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        openPanel();
    });

    coursesBtn.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
            if (!isOverPanel) closePanel();
        }, 220);
    });

    panel.addEventListener('mouseenter', () => {
        isOverPanel = true;
        clearTimeout(hoverTimeout);
    });

    panel.addEventListener('mouseleave', () => {
        isOverPanel = false;
        hoverTimeout = setTimeout(() => {
            if (!coursesBtn.matches(':hover')) closePanel();
        }, 220);
    });

    panel.addEventListener('click', (e) => {
        if (e.target === panel) closePanel();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePanel();
    });
}

// Load data and init panel (if courses_286.js exists)
function fetchAndInitCourses(path) {
    return fetch(path).then(r => {
        if (!r.ok) throw new Error('Failed to fetch courses file');
        return r.text();
    }).then(code => {
        try {
            // Transform the fetched file so it assigns to window.coursesDatabase
            // Replace common declarations: const/let/var coursesDatabase =
            const transformed = code.replace(/(?:const|let|var)\s+coursesDatabase\s*=\s*/m, 'window.coursesDatabase = ');
            const s = document.createElement('script');
            s.type = 'text/javascript';
            s.textContent = transformed + '\n//# sourceURL=courses_286.injected.js';
            document.head.appendChild(s);
            // ensure the global exists
            window.coursesDatabase = window.coursesDatabase || [];
        } catch (err) {
            console.error('Error injecting courses file', err);
            window.coursesDatabase = window.coursesDatabase || [];
        }
        // build panel after a short delay to ensure script executed
        setTimeout(buildCoursesPanel, 40);
    }).catch(err => {
        console.warn('Could not load courses data via fetch:', err);
        // fallback: try loading the file via script tag directly
        loadScript(path, () => setTimeout(buildCoursesPanel, 80));
    });
}

if (typeof window.coursesDatabase === 'undefined' || !window.coursesDatabase.length) {
    // attempt to fetch and evaluate the local file
    fetchAndInitCourses('courses_286.js');
} else {
    buildCoursesPanel();
}
