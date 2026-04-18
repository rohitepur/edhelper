let state = {
    sessionStatus: 'init',
    testType: 'pssa',
    grade: null,
    subject: null,
    queue: [],
    currentIndex: 0,
    initialScore: 0,
    baseItemCount: 20,
    redemptionsAdded: 0,
    selectedOption: null,
    warnings: 0,
    isPaused: false,
    currentUser: null,
    currentGrade: null,
    currentClass: null,
    currentClasses: [],
    wasAssigned: false,
    assignmentVisibleToParent: false,
    redemptionEnabled: true,
    wrongAnswers: [],
    allAnswers: [],
    maxWarnings: 2,
    answers: [],
    flagged: new Set(),
    timerSeconds: 0,
    timerInterval: null,
    timerEnabled: false,
    timerMinutes: 0
};

// ========== APP MODAL SYSTEM ==========
function showAppModal(title, message, type, buttons) {
    return new Promise(resolve => {
        const overlay = document.getElementById('app-modal');
        const box = document.getElementById('app-modal-box');
        const titleEl = document.getElementById('app-modal-title');
        const msgEl = document.getElementById('app-modal-message');
        const actionsEl = document.getElementById('app-modal-actions');

        box.className = 'modal-box modal-' + (type || 'info');
        titleEl.textContent = title || '';
        msgEl.textContent = message || '';
        actionsEl.innerHTML = '';

        (buttons || [{ label: 'OK', className: 'btn', value: true }]).forEach(btn => {
            const b = document.createElement('button');
            b.textContent = btn.label;
            b.className = btn.className || 'btn';
            b.onclick = () => { overlay.classList.add('hidden'); resolve(btn.value); };
            actionsEl.appendChild(b);
        });

        overlay.classList.remove('hidden');
    });
}

function showAlert(message, type) {
    const titles = { error: 'Error', success: 'Success', info: 'Notice', warning: 'Warning' };
    return showAppModal(titles[type] || 'Notice', message, type || 'info');
}

function showConfirm(message, title) {
    return showAppModal(title || 'Confirm', message, 'confirm', [
        { label: 'Cancel', className: 'btn-cancel', value: false },
        { label: 'Confirm', className: 'btn', value: true }
    ]);
}

// ======= ADMIN LOGIN CONFIG =======
// Change ADMIN_PASSWORD before deploying to production. Storing client-side is insecure.
const ADMIN_PASSWORD = 'ADMIN123!';

// Toggle admin login fields in the UI
function toggleAdminLogin(checked) {
    const gradeRow = document.getElementById('login-grade-row');
    const classRow = document.getElementById('login-class-row');
    const pwdRow = document.getElementById('admin-password-row');
    if (gradeRow) gradeRow.style.display = checked ? 'none' : '';
    if (classRow) classRow.style.display = checked ? 'none' : '';
    if (pwdRow) pwdRow.style.display = checked ? 'block' : 'none';
}


// ========== COOKIE SESSION PERSISTENCE ==========

function isAdminPage() {
    return !!document.getElementById('admin-hamburger-wrap');
}

function getSessionKey() {
    return isAdminPage() ? 'mathsite_admin_session' : 'mathsite_session';
}

function setSessionCookie(name, grade, cls) {
    const classes = Array.isArray(cls) ? cls : (cls ? [cls] : []);
    const data = JSON.stringify({ name: name, grade: grade, class: classes[0] || null, classes: classes });
    const key = getSessionKey();
    // Store in both cookie and localStorage for reliability
    try {
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = key + '=' + encodeURIComponent(data) + '; expires=' + expires + '; path=/; SameSite=Lax';
    } catch (e) {}
    localStorage.setItem(key, data);
}

function formatDueDate(dueDateStr) {
    if (!dueDateStr) return { text: '', cssClass: '' };
    const due = new Date(dueDateStr + 'T23:59:59');
    const now = new Date();
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Overdue', cssClass: 'due-overdue' };
    if (diffDays === 0) return { text: 'Due today', cssClass: 'due-today' };
    if (diffDays === 1) return { text: 'Due tomorrow', cssClass: 'due-tomorrow' };
    return { text: `Due in ${diffDays} days`, cssClass: diffDays <= 2 ? 'due-soon' : 'due-ok' };
}

function formatName(name) {
    return name.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
}

const CLASS_DISPLAY_NAMES = {
    '3': 'Class 3', '4/5': 'Class 4/5', '5/6': 'Class 5/6', '6': 'Class 6', '6/7': 'Class 6/7', '7/8': 'Class 7/8',
    'alg1': 'Alg 1', 'adv-alg1': 'Adv Alg 1', 'alg2': 'Alg 2',
    'alg2-geo': 'Alg 2/Geo', 'precalc': 'Precalc', 'math-analysis': 'Math Analysis'
};

function getClassDisplayName(cls) {
    return CLASS_DISPLAY_NAMES[cls] || cls;
}

function getSessionCookie() {
    const key = getSessionKey();
    // Try localStorage first, then fall back to cookie
    try {
        const ls = localStorage.getItem(key);
        if (ls) return JSON.parse(ls);
    } catch (e) {}
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + key + '=([^;]*)'));
    if (!match) return null;
    try {
        return JSON.parse(decodeURIComponent(match[1]));
    } catch (e) {
        return null;
    }
}

function clearSessionCookie() {
    const key = getSessionKey();
    document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    localStorage.removeItem(key);
}

function restoreSession() {
    let session;
    try {
        session = getSessionCookie();
    } catch (e) {
        clearSessionCookie();
        return;
    }
    if (!session || !session.name) return;

    const name = session.name;
    const isAdmin = name === 'ADMIN123!';

    state.currentUser = name;

    if (isAdmin) {
        document.getElementById('view-login').classList.add('hidden');
        document.getElementById('session-id').innerText = 'ADMIN PANEL';
        document.getElementById('view-admin').classList.remove('hidden');
        document.getElementById('admin-hamburger-wrap').style.display = '';
        state.sessionStatus = 'dashboard';
        try { renderAdminAssignments(); } catch(e) {}
        try { renderAdminScores(); } catch(e) {}
        try { renderClassCodes(); } catch(e) {}
        try { renderPendingApprovals(); } catch(e) {}
        try { renderRoster(); } catch(e) {}
        try { renderMisconceptions(); } catch(e) {}
        startAdminPolling();
    } else if (session.grade && (session.class || session.classes)) {
        loginStudent(name, session.grade, session.classes || session.class);
    } else {
        clearSessionCookie();
    }
}

// ========== THEME TOGGLE ==========
function initTheme() {
    const saved = localStorage.getItem('mathsite_theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
    }
    updateThemeIcon();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const isDark = current === 'dark' || (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('mathsite_theme', newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const theme = document.documentElement.getAttribute('data-theme');
    const isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    btn.innerHTML = isDark ? '&#9788; Light Mode' : '&#9790; Dark Mode';
}

// ========== TEST SETTINGS ==========
function getTestSettings() {
    try {
        return JSON.parse(localStorage.getItem('mathsite_test_settings')) || {};
    } catch(e) { return {}; }
}

function saveTestSettings() {
    const settings = {
        questionMap: document.getElementById('setting-question-map')?.checked || false,
        progressBar: document.getElementById('setting-progress-bar')?.checked || false,
        navButtons: document.getElementById('setting-nav-buttons')?.checked ?? true,
        flagButton: document.getElementById('setting-flag-button')?.checked ?? true
    };
    localStorage.setItem('mathsite_test_settings', JSON.stringify(settings));
    applyTestSettings();
}

function loadTestSettings() {
    const s = getTestSettings();
    const qm = document.getElementById('setting-question-map');
    const pb = document.getElementById('setting-progress-bar');
    const nb = document.getElementById('setting-nav-buttons');
    const fb = document.getElementById('setting-flag-button');
    if (qm) qm.checked = s.questionMap || false;
    if (pb) pb.checked = s.progressBar || false;
    if (nb) nb.checked = s.navButtons !== false;
    if (fb) fb.checked = s.flagButton !== false;
}

function applyTestSettings() {
    const s = getTestSettings();

    // Question map
    const qmap = document.getElementById('question-map');
    if (qmap) qmap.classList.toggle('hidden', !s.questionMap);

    // Progress bar
    const pbar = document.getElementById('test-progress-bar');
    if (pbar) pbar.classList.toggle('hidden', !s.progressBar);

    // Nav buttons (prev, skip, next)
    const navPrev = document.querySelector('.nav-left .btn-nav[onclick*="navigatePrev"]');
    const navSkip = document.querySelector('.nav-left .btn-nav[onclick*="skipQuestion"]');
    const navNext = document.querySelector('.nav-right .btn-nav[onclick*="navigateNext"]');
    const showNav = s.navButtons !== false;
    if (navPrev) navPrev.style.display = showNav ? '' : 'none';
    if (navSkip) navSkip.style.display = showNav ? '' : 'none';
    if (navNext) navNext.style.display = showNav ? '' : 'none';

    // Flag button
    const flagBtn = document.getElementById('btn-flag');
    if (flagBtn) flagBtn.style.display = (s.flagButton !== false) ? '' : 'none';

    // Sync quick-settings checkboxes
    const qqm = document.getElementById('quick-setting-qmap');
    const qpb = document.getElementById('quick-setting-pbar');
    const qnb = document.getElementById('quick-setting-nav');
    const qfb = document.getElementById('quick-setting-flag');
    if (qqm) qqm.checked = s.questionMap || false;
    if (qpb) qpb.checked = s.progressBar || false;
    if (qnb) qnb.checked = s.navButtons !== false;
    if (qfb) qfb.checked = s.flagButton !== false;
}

function updateTestProgress() {
    const s = getTestSettings();
    if (!s.progressBar) return;
    const answered = state.answers.filter(a => a.answered).length;
    const total = state.queue.length;
    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
    const fill = document.getElementById('test-progress-fill');
    const pctEl = document.getElementById('test-progress-pct');
    if (fill) fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
}

function toggleTestSettingsPopup() {
    const popup = document.getElementById('test-settings-popup');
    if (popup) popup.classList.toggle('hidden');
}

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadTestSettings();
    restoreSession();

    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Offline/online detection
    const offlineBanner = document.getElementById('offline-banner');
    function updateOnlineStatus() {
        if (offlineBanner) {
            offlineBanner.style.display = navigator.onLine ? 'none' : 'block';
        }
        // When back online, flush any pending scores
        if (navigator.onLine) {
            flushPendingSync();
        }
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
});

window.addEventListener('beforeunload', function (e) {
    if (state.sessionStatus === 'testing') {
        e.preventDefault();
        e.returnValue = '';
    }
});

function safelyCloseSession() {
    stopTimer();
    state.sessionStatus = 'dashboard';
    state.queue = [];
    state.currentIndex = 0;
    state.selectedOption = null;

    // Hide results/assessment views, show assigned tests
    document.getElementById('view-results').classList.add('hidden');
    document.getElementById('view-assessment').classList.add('hidden');
    const terminated = document.getElementById('view-terminated');
    if (terminated) terminated.classList.add('hidden');

    document.getElementById('view-assigned').classList.remove('hidden');
    document.getElementById('test-tabs').style.display = 'block'; showSidebar();
    renderAssignedTests();
}

function logout() {
    clearSessionCookie();
    location.reload();
}

function startSession() {
    document.getElementById('session-id').innerText = generateSessionId();
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('test-tabs').style.display = 'block'; showSidebar();
    document.getElementById('view-dashboard').classList.remove('hidden');
    state.sessionStatus = 'dashboard';
    state.testType = 'pssa';
}

// ========== PASSWORD HASHING ==========

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function formatPhone(input) {
    let val = input.value.replace(/\D/g, '');
    if (val.length > 3 && val.length <= 6) val = val.slice(0,3) + '-' + val.slice(3);
    else if (val.length > 6) val = val.slice(0,3) + '-' + val.slice(3,6) + '-' + val.slice(6,10);
    input.value = val;
}

function showRegister() {
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-register').classList.remove('hidden');
}

function showLogin() {
    document.querySelectorAll('#view-register, #view-forgot').forEach(el => el.classList.add('hidden'));
    document.getElementById('view-login').classList.remove('hidden');
}

function showForgotPassword() {
    document.getElementById('view-login').classList.add('hidden');
    const forgotView = document.getElementById('view-forgot');
    if (forgotView) forgotView.classList.remove('hidden');
}

async function requestPasswordReset() {
    const first = document.getElementById('forgot-first').value.trim();
    const last = document.getElementById('forgot-last').value.trim();
    const statusEl = document.getElementById('forgot-status');

    if (!first || !last) {
        statusEl.textContent = 'Please enter your first and last name.';
        statusEl.style.display = 'block'; statusEl.style.background = 'var(--incorrect-bg)'; statusEl.style.color = 'var(--incorrect)';
        return;
    }

    try {
        statusEl.textContent = 'Checking...'; statusEl.style.display = 'block';
        statusEl.style.background = 'var(--border-color)'; statusEl.style.color = 'var(--text-main)';

        const match = await fbFindInRoster(first, last);
        if (!match) {
            statusEl.textContent = 'Account not found. Please check your name.';
            statusEl.style.background = 'var(--incorrect-bg)'; statusEl.style.color = 'var(--incorrect)';
            return;
        }

        // Add a password reset request to helpRequests
        await fbAddHelpRequest({
            student: first + ' ' + last,
            grade: match.grade || '',
            class: match.class || '',
            skill: 'PASSWORD RESET REQUEST',
            details: 'Student requested a password reset.',
            status: 'pending',
            isPasswordReset: true,
            rosterId: match.id,
            submittedAt: new Date().toLocaleDateString()
        });

        statusEl.textContent = 'Reset request submitted. Your teacher will set a new password for you.';
        statusEl.style.background = 'var(--correct-bg)'; statusEl.style.color = 'var(--correct)';
    } catch (e) {
        statusEl.textContent = 'Something went wrong. Try again.';
        statusEl.style.background = 'var(--incorrect-bg)'; statusEl.style.color = 'var(--incorrect)';
    }
}

function showLoginStatus(msg, type) {
    const el = document.getElementById('login-status');
    el.textContent = msg;
    el.style.display = 'block';
    el.style.background = type === 'error' ? 'var(--incorrect-bg)' : type === 'success' ? 'var(--correct-bg)' : 'var(--border-color)';
    el.style.color = type === 'error' ? 'var(--incorrect)' : type === 'success' ? 'var(--correct)' : '#000';
}

function showRegStatus(msg, type) {
    const el = document.getElementById('reg-status');
    el.textContent = msg;
    el.style.display = 'block';
    el.style.background = type === 'error' ? 'var(--incorrect-bg)' : type === 'success' ? 'var(--correct-bg)' : 'var(--border-color)';
    el.style.color = type === 'error' ? 'var(--incorrect)' : type === 'success' ? 'var(--correct)' : '#000';
}

// ========== LOGIN ==========

async function login() {
    const firstInput = document.getElementById('login-first');
    const lastInput = document.getElementById('login-last');
    const passInput = document.getElementById('login-password');
    const first = firstInput ? firstInput.value.trim() : '';
    const last = lastInput ? lastInput.value.trim() : '';
    const password = passInput ? passInput.value : '';

    // Admin check
    if (first === 'ADMIN123!' || (first.toLowerCase() === 'admin' && password === 'ADMIN123!')) {
        state.currentUser = 'ADMIN123!';
        setSessionCookie('ADMIN123!', null, null);
        document.getElementById('view-login').classList.add('hidden');
        document.getElementById('view-admin').classList.remove('hidden');
        state.sessionStatus = 'dashboard';
        try { renderAdminAssignments(); } catch(e) {}
        try { renderAdminScores(); } catch(e) {}
        try { renderClassCodes(); } catch(e) {}
        try { renderPendingApprovals(); } catch(e) {}
        try { renderRoster(); } catch(e) {}
        return;
    }

    if (!first || !last) {
        showLoginStatus('Please enter your first and last name.', 'error');
        return;
    }
    if (!password) {
        showLoginStatus('Please enter your password.', 'error');
        return;
    }

    if (typeof fbFindInRoster !== 'function') {
        showLoginStatus('System not ready. Please refresh and try again.', 'error');
        return;
    }

    try {
        showLoginStatus('Signing in...', 'info');

        const match = await fbFindInRoster(first, last);
        if (!match) {
            // Check if pending
            const pending = await fbFindPending(first, last);
            if (pending) {
                showPendingView(first, last);
                return;
            }
            showLoginStatus('Account not found. Please register first.', 'error');
            return;
        }

        // Verify password (check plain first, fall back to hash for old accounts)
        const passwordMatch = match.passwordPlain
            ? (match.passwordPlain === password)
            : (match.passwordHash === await hashPassword(password));
        if (!passwordMatch) {
            showLoginStatus('Incorrect password.', 'error');
            return;
        }

        // Success — record last active time
        if (match.id && typeof fbUpdateRoster === 'function') {
            fbUpdateRoster(match.id, { lastActive: new Date().toISOString() }).catch(() => {});
        }
        const fullName = (typeof formatName === 'function' ? formatName(first) : first) + ' ' + (typeof formatName === 'function' ? formatName(last) : last);
        loginStudent(fullName, match.grade, match.classes || match.class);
    } catch (e) {
        console.error('Login failed:', e);
        showLoginStatus('Connection error. Please try again.', 'error');
    }
}

// ========== REGISTRATION ==========

async function register() {
    const first = document.getElementById('reg-first').value.trim();
    const last = document.getElementById('reg-last').value.trim();
    const grade = document.getElementById('reg-grade').value;
    const cls = document.getElementById('reg-class').value;
    const code = document.getElementById('reg-code').value.trim();
    const parentEmail = document.getElementById('reg-parent-email').value.trim();
    const parentPhone = document.getElementById('reg-parent-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-password-confirm').value;

    // Validate all fields
    if (!first || !last) { showRegStatus('Please enter your first and last name.', 'error'); return; }
    if (!grade) { showRegStatus('Please select your grade.', 'error'); return; }
    if (!cls) { showRegStatus('Please select your class.', 'error'); return; }
    if (!code) { showRegStatus('Please enter the class code from your teacher.', 'error'); return; }
    if (!parentEmail) { showRegStatus('Please enter a parent/guardian email.', 'error'); return; }
    if (!validateEmail(parentEmail)) { showRegStatus('Please enter a valid email address.', 'error'); return; }
    if (!parentPhone) { showRegStatus('Please enter a parent/guardian phone number.', 'error'); return; }
    if (!password) { showRegStatus('Please create a password.', 'error'); return; }
    if (password.length < 4) { showRegStatus('Password must be at least 4 characters.', 'error'); return; }
    if (password !== confirmPassword) { showRegStatus('Passwords do not match.', 'error'); return; }

    try {
        showRegStatus('Registering...', 'info');

        // Check if already registered
        const existing = await fbFindInRoster(first, last);
        if (existing) {
            showRegStatus('An account with this name already exists. Please sign in instead.', 'error');
            return;
        }

        // Check if already pending
        const pending = await fbFindPending(first, last);
        if (pending) {
            showRegStatus('You have already registered. Please wait for teacher approval.', 'error');
            return;
        }

        // Validate class code
        const codes = await fbGetClassCodes();
        if (codes[cls] !== code) {
            showRegStatus('Invalid class code. Please check with your teacher.', 'error');
            return;
        }

        // Hash password and save (store plain password too for admin viewing)
        const passwordHash = await hashPassword(password);
        await fbAddPending({
            firstName: first,
            lastName: last,
            grade: grade,
            class: cls,
            passwordHash: passwordHash,
            passwordPlain: password,
            parentEmail: parentEmail,
            parentPhone: parentPhone,
            requestedAt: new Date().toLocaleDateString()
        });

        // Show pending view
        document.getElementById('view-register').classList.add('hidden');
        document.getElementById('view-pending').classList.remove('hidden');
    } catch (e) {
        console.error('Registration failed:', e);
        showRegStatus('Something went wrong. Please try again.', 'error');
    }
}

function loginStudent(fullName, grade, cls) {
    state.currentUser = fullName;
    state.currentGrade = grade;
    // Support single class or array of classes
    if (Array.isArray(cls)) {
        state.currentClasses = cls;
        state.currentClass = cls[0] || null;
    } else {
        state.currentClass = cls;
        state.currentClasses = cls ? [cls] : [];
    }
    setSessionCookie(fullName, grade, state.currentClasses);
    document.getElementById('view-login').classList.add('hidden');
    if (document.getElementById('view-register')) document.getElementById('view-register').classList.add('hidden');
    if (document.getElementById('view-pending')) document.getElementById('view-pending').classList.add('hidden');

    // Populate profile in sidebar (just name)
    const profileName = document.getElementById('profile-name');
    if (profileName) profileName.textContent = fullName;

    // Populate profile in settings page
    const spName = document.getElementById('settings-profile-name');
    const spGrade = document.getElementById('settings-profile-grade');
    const spClass = document.getElementById('settings-profile-class');
    const spEmail = document.getElementById('settings-profile-email');
    const spPhone = document.getElementById('settings-profile-phone');
    if (spName) spName.textContent = fullName;
    if (spGrade) spGrade.textContent = `Grade ${grade}`;
    if (spClass) spClass.textContent = state.currentClasses.map(c => getClassDisplayName(c)).join(', ') || '—';

    // Populate join class dropdown with classes not yet enrolled
    populateJoinClassDropdown();

    // Load parent info from roster
    if (typeof fbFindInRoster === 'function') {
        const parts = fullName.split(' ');
        fbFindInRoster(parts[0], parts.slice(1).join(' ')).then(match => {
            if (match) {
                if (spEmail) spEmail.textContent = match.parentEmail || '—';
                if (spPhone) {
                    let ph = (match.parentPhone || '').replace(/\D/g, '');
                    if (ph.length === 10) ph = ph.slice(0,3) + '-' + ph.slice(3,6) + '-' + ph.slice(6);
                    spPhone.textContent = ph || '—';
                }
                const spParentCode = document.getElementById('settings-profile-parent-code');
                if (spParentCode) spParentCode.textContent = match.parentCode || '—';
            }
        }).catch(() => {});
    }

    // Show sidebar
    showSidebar();

    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-keystone-dashboard').classList.add('hidden');
    document.getElementById('view-assigned').classList.remove('hidden');

    // Set active sidebar item to "Assigned"
    document.querySelectorAll('.sidebar-item').forEach(btn => btn.classList.remove('active'));
    const assignedBtn = document.querySelector('.sidebar-item[data-section="assigned"]');
    if (assignedBtn) assignedBtn.classList.add('active');

    state.sessionStatus = 'dashboard';
    state.testType = 'assigned';
    renderAssignedTests();
    updateStudentBadges();
    startStudentPolling();
}

let _studentPollFast = null;
let _studentPollSlow = null;

function startStudentPolling() {
    if (_studentPollFast) clearInterval(_studentPollFast);
    if (_studentPollSlow) clearInterval(_studentPollSlow);

    // Fast poll (10s) — assigned tests & help responses (student cares about these)
    _studentPollFast = setInterval(() => {
        try { renderAssignedTests(); } catch(e) {}
        try { renderMyHelpRequests(); } catch(e) {}
    }, 10000);

    // Slow poll (30s) — Firebase sync & badges (less urgent)
    _studentPollSlow = setInterval(() => {
        try { syncFromFirebase(); } catch(e) {}
        try { updateStudentBadges(); } catch(e) {}
    }, 30000);
}

function stopStudentPolling() {
    if (_studentPollFast) { clearInterval(_studentPollFast); _studentPollFast = null; }
    if (_studentPollSlow) { clearInterval(_studentPollSlow); _studentPollSlow = null; }
}

async function updateStudentBadges() {
    try {
        // Badge for assigned tests
        const assignments = getAssignments();
        const completed = getCompletedTestKeys(state.currentUser);
        let assignedCount = 0;
        const gradeKey = 'grade:' + state.currentGrade;
        const classKey = state.currentClass ? 'class:' + state.currentClass : null;
        const studentKey = 'student:' + (state.currentUser || '').toLowerCase();
        const now = new Date();

        [gradeKey, classKey, studentKey, state.currentGrade].forEach(key => {
            if (key && assignments[key]) {
                assignments[key].forEach(t => {
                    if (!completed.has(testKey(t)) && !(t.dueDate && new Date(t.dueDate + 'T23:59:59') < now)) {
                        assignedCount++;
                    }
                });
            }
        });
        updateBadge('badge-assigned', assignedCount);

        // Badge for help request responses
        if (typeof fbGetHelpRequests === 'function') {
            const requests = await fbGetHelpRequests();
            const mine = requests.filter(r =>
                (r.student || '').toLowerCase() === (state.currentUser || '').toLowerCase() &&
                r.adminResponse && r.status === 'addressed'
            );
            updateBadge('badge-help', mine.length);
        }
    } catch (e) {}
}

// requestAccess replaced by register() above

// ========== ADMIN AUTO-REFRESH ==========
let _adminPollFast = null;
let _adminPollSlow = null;

function startAdminPolling() {
    if (_adminPollFast) clearInterval(_adminPollFast);
    if (_adminPollSlow) clearInterval(_adminPollSlow);

    // Fast poll (5s) — pending approvals & help requests (time-sensitive)
    _adminPollFast = setInterval(() => {
        try { renderPendingApprovals(); } catch(e) {}
        try { renderAdminHelpRequests(); } catch(e) {}
    }, 5000);

    // Slow poll (15s) — misconceptions only. Scores and roster load on tab switch to avoid disrupting open panels.
    _adminPollSlow = setInterval(() => {
        try { renderMisconceptions(); } catch(e) {}
    }, 15000);
}

// ========== PENDING APPROVAL POLLING ==========
let _pendingFirst = '';
let _pendingLast = '';
let _pendingPollInterval = null;

function showPendingView(first, last) {
    _pendingFirst = first;
    _pendingLast = last;
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-pending').classList.remove('hidden');
    const statusEl = document.getElementById('pending-status');
    if (statusEl) statusEl.textContent = '';
    // Start auto-polling
    if (_pendingPollInterval) clearInterval(_pendingPollInterval);
    _pendingPollInterval = setInterval(checkPendingApproval, 5000);
}

async function checkPendingApproval() {
    if (!_pendingFirst || !_pendingLast) return;
    const statusEl = document.getElementById('pending-status');
    if (statusEl) statusEl.innerHTML = '<span class="spinner-inline"></span>Checking...';
    try {
        const match = await fbFindInRoster(_pendingFirst, _pendingLast);
        if (match) {
            // Approved! Log them in
            if (_pendingPollInterval) clearInterval(_pendingPollInterval);
            _pendingPollInterval = null;
            document.getElementById('view-pending').classList.add('hidden');
            loginStudent(formatName(_pendingFirst) + ' ' + formatName(_pendingLast), match.grade, match.class);
            return;
        }
        if (statusEl) statusEl.textContent = 'Still waiting for approval.';
    } catch (e) {
        if (statusEl) statusEl.textContent = 'Could not check. Will try again shortly.';
    }
}

// ========== ADMIN: CLASS CODES ==========

async function renderClassCodes() {
    const container = document.getElementById('admin-class-codes');
    if (!container) return;

    let codes = {};
    try { codes = await fbGetClassCodes(); } catch (e) {}

    const classes = ['3', '4/5', '5/6', '6', '6/7', '7/8', 'alg1', 'adv-alg1', 'alg2', 'alg2-geo', 'precalc', 'math-analysis'];
    let html = '';
    classes.forEach(cls => {
        const label = getClassDisplayName(cls);
        const val = codes[cls] || '';
        html += `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
            <span style="font-size:0.85rem;font-weight:600;color:var(--text-main);min-width:60px;">${label}</span>
            <input type="text" class="text-input" id="code-${cls}" value="${val}" style="max-width:120px;margin-bottom:0;padding:0.4rem 0.6rem;font-size:0.85rem;" placeholder="Set code...">
            <button class="btn" style="padding:0.3rem 0.7rem;font-size:0.75rem;" onclick="saveClassCode('${cls}')">Save</button>
        </div>`;
    });
    container.innerHTML = html;
}

async function saveClassCode(cls) {
    const input = document.getElementById('code-' + cls);
    if (!input) return;
    const code = input.value.trim();
    try {
        await fbSetClassCode(cls, code);
        input.style.borderColor = 'var(--correct)';
        setTimeout(() => { input.style.borderColor = ''; }, 1500);
    } catch (e) {
        showAlert('Failed to save code: ' + e.message, 'error');
    }
}

// ========== ADMIN: CLASS MANAGER ==========

// Dynamic class list — starts with defaults, new ones added via admin
const DEFAULT_CLASSES = ['3', '4/5', '5/6', '6', '6/7', '7/8', 'alg1', 'adv-alg1', 'alg2', 'alg2-geo', 'precalc', 'math-analysis'];

// Built-in PSSA sub-classes for each grade — auto-created under the parent class
const PSSA_SUB_CLASSES = {
    '3':   { id: 'pssa-3',   label: 'Gr-3 PSSA',   grade: 3 },
    '4/5': { id: 'pssa-4',   label: 'Gr-4 PSSA',   grade: 4 },
    '5/6': { id: 'pssa-5',   label: 'Gr-5 PSSA',   grade: 5 },
    '6':   { id: 'pssa-6',   label: 'Gr-6 PSSA',   grade: 6 },
    '6/7': { id: 'pssa-7',   label: 'Gr-7 PSSA',   grade: 7 },
    '7/8': { id: 'pssa-8',   label: 'Gr-8 PSSA',   grade: 8 },
    'alg1':     { id: 'keystone-alg1',     label: 'Keystone Algebra',   grade: 'algebra1' },
    'adv-alg1': { id: 'keystone-adv-alg1', label: 'Keystone Algebra',   grade: 'algebra1' },
};

async function getAllClasses() {
    let classData = {};
    try { classData = typeof fbGetClassData === 'function' ? await fbGetClassData() : {}; } catch (e) {}
    // Load custom display names from Firebase
    for (const [cls, data] of Object.entries(classData)) {
        if (data.displayName && !CLASS_DISPLAY_NAMES[cls]) {
            CLASS_DISPLAY_NAMES[cls] = data.displayName;
        }
    }
    const allKeys = new Set([...DEFAULT_CLASSES, ...Object.keys(classData)]);
    return [...allKeys];
}

async function renderClassManager() {
    const container = document.getElementById('admin-classes-list');
    if (!container) return;

    let codes = {};
    let classData = {};
    try { codes = await fbGetClassCodes(); } catch (e) {}
    try { classData = typeof fbGetClassData === 'function' ? await fbGetClassData() : {}; } catch (e) {}

    const classes = await getAllClasses();

    // Summary table — Class, Join Code, Schedule
    let html = `<table class="data-table"><thead><tr><th>Class</th><th>Join Code</th><th>Schedule</th><th></th></tr></thead><tbody>`;

    classes.forEach(cls => {
        const label = getClassDisplayName(cls);
        const code = codes[cls] || '—';
        const data = classData[cls] || {};

        let scheduleStr = '—';
        const sched = data.schedule || [];
        if (sched.length > 0) {
            scheduleStr = sched.filter(s => s.day).map(s => s.day + ' ' + formatTime12(s.start) + (s.end ? '–' + formatTime12(s.end) : '')).join('<br>');
        } else if (data.day1 && data.time1) {
            scheduleStr = data.day1 + ' ' + formatTime12(data.time1) + (data.time1end ? '–' + formatTime12(data.time1end) : '');
            if (data.day2 && data.time2) scheduleStr += '<br>' + data.day2 + ' ' + formatTime12(data.time2) + (data.time2end ? '–' + formatTime12(data.time2end) : '');
        }

        html += `<tr style="cursor:pointer;" onclick="openClassEditor('${cls}')">
            <td style="font-weight:600;color:var(--primary-color);">${label}</td>
            <td style="font-family:monospace;font-size:0.85rem;">${code}</td>
            <td style="font-size:0.85rem;">${scheduleStr}</td>
            <td><button class="btn" style="padding:0.25rem 0.6rem;font-size:0.75rem;" onclick="event.stopPropagation();quickAssignTest('${cls}')">Assign Test</button></td>
        </tr>`;

        // Show PSSA sub-class row if this grade has one
        const sub = PSSA_SUB_CLASSES[cls];
        if (sub) {
            const subData = classData[sub.id] || {};
            const chapters = subData.chapters || [];
            const chapterStr = chapters.length > 0
                ? chapters.map(c => '<span style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:4px;padding:0.1rem 0.4rem;font-size:0.78rem;white-space:nowrap;">Ch ' + (c.number || '?') + ': ' + (c.name || '—') + '</span>').join(' ')
                : '<span style="color:var(--text-secondary);font-size:0.8rem;">No chapters yet — click to add</span>';

            html += `<tr style="cursor:pointer;background:var(--bg-surface);" onclick="openPssaSubEditor('${cls}','${sub.id}')">
                <td style="padding-left:2rem;font-size:0.9rem;" colspan="2">
                    <span style="color:var(--primary-color);font-weight:600;">${sub.label}</span>
                    <div style="margin-top:0.3rem;display:flex;flex-wrap:wrap;gap:0.3rem;">${chapterStr}</div>
                </td>
                <td style="font-size:0.85rem;color:var(--text-secondary);">${chapters.length} chapter${chapters.length !== 1 ? 's' : ''}</td>
                <td><button class="btn" style="padding:0.2rem 0.5rem;font-size:0.75rem;" onclick="event.stopPropagation();openPssaSubEditor('${cls}','${sub.id}')">Edit Chapters</button></td>
            </tr>`;
        }
    });

    html += '</tbody></table>';

    // Add new class
    html += `<div style="margin-top:1rem;padding:0.75rem;border:1px dashed var(--border-color);border-radius:10px;">
        <div style="display:flex;align-items:center;gap:0.5rem;">
            <input type="text" id="new-class-name" class="text-input" placeholder="New class name (e.g. Geometry, Trig, Class 9)..." style="width:250px;margin-bottom:0;font-size:0.85rem;">
            <button class="btn" style="padding:0.3rem 0.8rem;font-size:0.85rem;" onclick="addNewClass()">Add Class</button>
        </div>
    </div>`;

    container.innerHTML = html;

    // Editor panel at the bottom (hidden until a class is clicked)
    html += `<div id="class-editor-panel" style="display:none;margin-top:1.5rem;border:1px solid var(--border-color);border-radius:10px;padding:1.25rem;">
        <h4 id="class-editor-title" style="margin:0 0 1rem;color:var(--primary-color);"></h4>
        <div id="class-editor-content"></div>
    </div>`;

    container.innerHTML = html;
}

function openClassEditor(cls) {
    const panel = document.getElementById('class-editor-panel');
    const title = document.getElementById('class-editor-title');
    const content = document.getElementById('class-editor-content');
    if (!panel || !content) return;

    // Load data
    Promise.all([
        typeof fbGetClassCodes === 'function' ? fbGetClassCodes() : {},
        typeof fbGetClassData === 'function' ? fbGetClassData() : {}
    ]).then(([codes, classData]) => {
        const data = classData[cls] || {};
        const code = codes[cls] || '';
        const label = getClassDisplayName(cls);
        const safeId = cls.replace(/[^a-z0-9]/gi, '');

        title.textContent = 'Editing: ' + label;

        // Build schedule days array (migrate from old format)
        const scheduleDays = data.schedule || [];
        if (scheduleDays.length === 0 && data.day1) {
            scheduleDays.push({ day: data.day1, start: data.time1 || '', end: data.time1end || '' });
            if (data.day2) scheduleDays.push({ day: data.day2, start: data.time2 || '', end: data.time2end || '' });
        }

        // Build breaks array
        const breaks = data.breaks || [];

        // Store current class being edited
        window._editingClass = cls;
        window._editingSchedule = [...scheduleDays];
        window._editingBreaks = [...breaks];

        function renderScheduleRows() {
            let h = '';
            window._editingSchedule.forEach((s, i) => {
                h += `<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.4rem;">
                    <select class="text-input" id="sched-day-${i}" style="width:auto;margin-bottom:0;font-size:0.85rem;" onchange="window._editingSchedule[${i}].day=this.value">
                        <option value="">—</option>
                        ${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => `<option value="${d}" ${s.day===d?'selected':''}>${d}</option>`).join('')}
                    </select>
                    <input type="time" class="text-input" value="${s.start||''}" style="width:auto;margin-bottom:0;" onchange="window._editingSchedule[${i}].start=this.value">
                    <span style="font-size:0.8rem;">to</span>
                    <input type="time" class="text-input" value="${s.end||''}" style="width:auto;margin-bottom:0;" onchange="window._editingSchedule[${i}].end=this.value">
                    <button class="btn" style="padding:0.2rem 0.4rem;font-size:0.7rem;background:var(--incorrect);" onclick="window._editingSchedule.splice(${i},1);document.getElementById('sched-rows').innerHTML='';renderScheduleRows();">×</button>
                </div>`;
            });
            document.getElementById('sched-rows').innerHTML = h;
        }

        function renderBreakRows() {
            let h = '';
            window._editingBreaks.forEach((b, i) => {
                h += `<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.4rem;">
                    <input type="text" class="text-input" value="${b.name||''}" placeholder="Break name..." style="width:120px;margin-bottom:0;font-size:0.85rem;" onchange="window._editingBreaks[${i}].name=this.value">
                    <input type="date" class="text-input" value="${b.start||''}" style="width:auto;margin-bottom:0;font-size:0.85rem;" onchange="window._editingBreaks[${i}].start=this.value">
                    <span style="font-size:0.8rem;">to</span>
                    <input type="date" class="text-input" value="${b.end||''}" style="width:auto;margin-bottom:0;font-size:0.85rem;" onchange="window._editingBreaks[${i}].end=this.value">
                    <button class="btn" style="padding:0.2rem 0.4rem;font-size:0.7rem;background:var(--incorrect);" onclick="window._editingBreaks.splice(${i},1);document.getElementById('break-rows').innerHTML='';renderBreakRows();">×</button>
                </div>`;
            });
            document.getElementById('break-rows').innerHTML = h;
        }

        // Make render functions global so inline onclick can call them
        window._renderScheduleRows = renderScheduleRows;
        window._renderBreakRows = renderBreakRows;

        content.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
                <div>
                    <label class="admin-label">Class Name</label>
                    <input type="text" class="text-input" id="classdata-desc-${safeId}" value="${data.displayName || label}" style="margin-bottom:0;">
                </div>
                <div>
                    <label class="admin-label">Join Code</label>
                    <input type="text" class="text-input" id="classdata-code-${safeId}" value="${code}" placeholder="Join code..." style="margin-bottom:0;">
                </div>
                <div>
                    <label class="admin-label">Start Date</label>
                    <input type="date" class="text-input" id="classdata-start-${safeId}" value="${data.startDate || ''}" style="margin-bottom:0;">
                </div>
                <div>
                    <label class="admin-label">End Date</label>
                    <input type="date" class="text-input" id="classdata-end-${safeId}" value="${data.endDate || ''}" style="margin-bottom:0;">
                </div>
            </div>

            <div style="margin-top:0.75rem;">
                <label class="admin-label">Schedule</label>
                <div id="sched-rows"></div>
                <button class="btn" style="padding:0.25rem 0.6rem;font-size:0.8rem;margin-top:0.3rem;" onclick="window._editingSchedule.push({day:'',start:'',end:''});window._renderScheduleRows();">+ Add Day</button>
            </div>

            <div style="margin-top:0.75rem;">
                <label class="admin-label">Breaks</label>
                <div id="break-rows"></div>
                <button class="btn" style="padding:0.25rem 0.6rem;font-size:0.8rem;margin-top:0.3rem;" onclick="window._editingBreaks.push({name:'',start:'',end:''});window._renderBreakRows();">+ Add Break</button>
            </div>

            <div style="margin-top:0.75rem;border-top:1px solid var(--border-color);padding-top:0.75rem;">
                <label class="admin-label">Test Plan</label>
                <div id="classdata-tests-${safeId}"></div>
                <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem;align-items:flex-end;">
                    <select id="classdata-addtest-type-${safeId}" class="text-input" style="width:auto;margin-bottom:0;font-size:0.85rem;">
                        <option value="">Type...</option>
                        <option value="pssa">PSSA</option><option value="keystone">Keystone</option>
                        <option value="starr">STARR</option><option value="regents">Regents</option>
                        <option value="mathcounts">MathCounts</option>
                    </select>
                    <input type="text" id="classdata-addtest-name-${safeId}" class="text-input" placeholder="Name..." style="width:130px;margin-bottom:0;font-size:0.85rem;">
                    <select id="classdata-addtest-year-${safeId}" class="text-input" style="width:auto;margin-bottom:0;font-size:0.85rem;">
                        <option value="">Year</option>
                        ${Array.from({length:17},(_,i)=>2010+i).map(y=>`<option value="${y}">${y}</option>`).join('')}
                    </select>
                    <button class="btn" style="padding:0.3rem 0.6rem;font-size:0.8rem;" onclick="addTestToPlan('${cls}')">Add</button>
                </div>
            </div>
            <div style="margin-top:1rem;display:flex;gap:0.5rem;">
                <button class="btn" onclick="saveClassDataFull('${cls}')">Save</button>
                ${!DEFAULT_CLASSES.includes(cls) ? `<button class="btn" style="background:var(--incorrect);" onclick="deleteClass('${cls}')">Delete Class</button>` : ''}
                <button class="btn" style="background:var(--text-secondary);" onclick="document.getElementById('class-editor-panel').style.display='none'">Close</button>
            </div>`;

        panel.style.display = 'block';
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Render dynamic rows
        renderScheduleRows();
        renderBreakRows();
        renderClassTestPlan(cls, data.testPlan || []);
    });
}

// ── PSSA Sub-Class Chapter Editor ──

function openPssaSubEditor(parentCls, subId) {
    const sub = PSSA_SUB_CLASSES[parentCls];
    if (!sub) return;

    const panel = document.getElementById('class-editor-panel');
    const title = document.getElementById('class-editor-title');
    const content = document.getElementById('class-editor-content');
    if (!panel || !content) return;

    Promise.resolve(typeof fbGetClassData === 'function' ? fbGetClassData() : {}).then(classData => {
        const data = classData[subId] || {};
        window._editingPssaSub = subId;
        window._editingPssaChapters = (data.chapters || []).map(c => ({...c}));

        title.textContent = sub.label + ' — Chapters';

        function renderPssaChapters() {
            let h = '';
            window._editingPssaChapters.forEach((c, i) => {
                h += `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;flex-wrap:wrap;padding:0.5rem 0;border-bottom:1px solid var(--border-color);">
                    <input type="text" class="text-input" value="${c.number||''}" placeholder="#" style="width:50px;margin-bottom:0;font-size:1rem;text-align:center;font-weight:700;" onchange="window._editingPssaChapters[${i}].number=this.value">
                    <input type="text" class="text-input" value="${c.name||''}" placeholder="Chapter name (e.g. Fractions & Decimals)..." style="flex:2;min-width:200px;margin-bottom:0;font-size:0.9rem;" onchange="window._editingPssaChapters[${i}].name=this.value">
                    <input type="text" class="text-input" value="${c.skills||''}" placeholder="Skills (e.g. add fractions, compare decimals)..." style="flex:1;min-width:150px;margin-bottom:0;font-size:0.85rem;color:var(--text-secondary);" onchange="window._editingPssaChapters[${i}].skills=this.value">
                    <button class="btn" style="padding:0.2rem 0.5rem;font-size:0.75rem;background:var(--incorrect);" onclick="window._editingPssaChapters.splice(${i},1);window._renderPssaChapters();">Remove</button>
                </div>`;
            });
            if (!h) h = '<p style="color:var(--text-secondary);font-size:0.9rem;">No chapters yet. Click "+ Add Chapter" below.</p>';
            document.getElementById('pssa-chapter-rows').innerHTML = h;
        }
        window._renderPssaChapters = renderPssaChapters;

        content.innerHTML = `
            <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:1rem;">Add the chapters/units for ${sub.label}. Each chapter can have a number, name, and list of skills covered.</p>
            <div id="pssa-chapter-rows"></div>
            <button class="btn" style="padding:0.3rem 0.8rem;font-size:0.85rem;margin-top:0.5rem;" onclick="window._editingPssaChapters.push({number:'${(window._editingPssaChapters.length+1)}',name:'',skills:''});window._renderPssaChapters();">+ Add Chapter</button>
            <div style="margin-top:1rem;display:flex;gap:0.5rem;">
                <button class="btn" onclick="savePssaSubChapters()">Save Chapters</button>
                <button class="btn" style="background:var(--text-secondary);" onclick="document.getElementById('class-editor-panel').style.display='none'">Close</button>
            </div>`;

        panel.style.display = 'block';
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        renderPssaChapters();
    });
}

async function savePssaSubChapters() {
    const subId = window._editingPssaSub;
    if (!subId) return;

    const chapters = (window._editingPssaChapters || []).filter(c => c.number || c.name);

    try {
        let classData = {};
        try { classData = await fbGetClassData(); } catch(e) {}
        if (!classData[subId]) classData[subId] = {};
        classData[subId].chapters = chapters;
        await fbSaveClassData(subId, classData[subId]);
        alert('Chapters saved!');
        renderClassManager();
        document.getElementById('class-editor-panel').style.display = 'none';
    } catch(e) {
        alert('Error saving: ' + e.message);
    }
}

function renderClassTestPlan(cls, testPlan) {
    const safeId = cls.replace(/[^a-z0-9]/gi, '');
    const container = document.getElementById('classdata-tests-' + safeId);
    if (!container) return;

    if (testPlan.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.8rem;">No tests in plan yet.</p>';
        return;
    }

    let html = '';
    testPlan.forEach((t, i) => {
        const typeLabel = t.type ? t.type.toUpperCase() : '';
        const yearLabel = t.year ? ` (${t.year})` : '';
        const displayName = t.name + (typeLabel ? ` — ${typeLabel}` : '') + yearLabel;
        html += `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0;border-bottom:1px solid var(--border-color);font-size:0.85rem;">
            <span style="flex:1;">${displayName}</span>
            ${t.type === 'pssa' || t.type === 'keystone' ? `<button class="btn" style="padding:0.2rem 0.5rem;font-size:0.7rem;" onclick="assignSingleTest('${cls}', ${i})">Assign</button>` : ''}
            <button class="btn" style="padding:0.2rem 0.5rem;font-size:0.7rem;background:var(--incorrect);" onclick="removeTestFromPlan('${cls}', ${i})">Remove</button>
        </div>`;
    });
    container.innerHTML = html;
}

async function addTestToPlan(cls) {
    const safeId = cls.replace(/[^a-z0-9]/gi, '');
    const type = document.getElementById('classdata-addtest-type-' + safeId).value;
    const name = document.getElementById('classdata-addtest-name-' + safeId).value.trim();
    const year = document.getElementById('classdata-addtest-year-' + safeId).value;

    if (!name && !type) { alert('Select a test type or enter a name.'); return; }

    let classData = {};
    try { classData = await fbGetClassData(); } catch (e) {}
    if (!classData[cls]) classData[cls] = {};
    if (!classData[cls].testPlan) classData[cls].testPlan = [];

    const entry = { name: name || (type ? type.toUpperCase() : 'Test') };
    if (type) entry.type = type;
    if (year) entry.year = year;

    classData[cls].testPlan.push(entry);

    await fbSaveClassData(cls, classData[cls]);
    renderClassTestPlan(cls, classData[cls].testPlan);
    document.getElementById('classdata-addtest-name-' + safeId).value = '';
    document.getElementById('classdata-addtest-year-' + safeId).value = '';
}

async function removeTestFromPlan(cls, index) {
    let classData = {};
    try { classData = await fbGetClassData(); } catch (e) {}
    if (!classData[cls] || !classData[cls].testPlan) return;

    classData[cls].testPlan.splice(index, 1);
    await fbSaveClassData(cls, classData[cls]);
    renderClassTestPlan(cls, classData[cls].testPlan);
}

async function assignSingleTest(cls, index) {
    let classData = {};
    try { classData = await fbGetClassData(); } catch (e) {}
    if (!classData[cls] || !classData[cls].testPlan || !classData[cls].testPlan[index]) return;

    const test = classData[cls].testPlan[index];
    const assignments = getAssignments();
    const targetKey = 'class:' + cls;
    if (!assignments[targetKey]) assignments[targetKey] = [];

    assignments[targetKey].push({
        type: test.type,
        grade: test.grade,
        name: test.name,
        questionCount: test.questionCount || 20,
        redemption: true,
        assignedAt: new Date().toLocaleDateString()
    });

    saveAssignments(assignments);
    alert(`"${test.name}" assigned to class ${getClassDisplayName(cls)}.`);
}

async function saveClassDataFull(cls) {
    const safeId = cls.replace(/[^a-z0-9]/gi, '');
    const code = (document.getElementById('classdata-code-' + safeId) || {}).value || '';
    const startDate = (document.getElementById('classdata-start-' + safeId) || {}).value || '';
    const endDate = (document.getElementById('classdata-end-' + safeId) || {}).value || '';
    const displayName = (document.getElementById('classdata-desc-' + safeId) || {}).value || '';

    try {
        if (code) await fbSetClassCode(cls, code);

        let classData = {};
        try { classData = await fbGetClassData(); } catch (e) {}
        if (!classData[cls]) classData[cls] = {};
        classData[cls].startDate = startDate;
        classData[cls].endDate = endDate;
        classData[cls].displayName = displayName;
        if (displayName) CLASS_DISPLAY_NAMES[cls] = displayName;
        classData[cls].schedule = (window._editingSchedule || []).filter(s => s.day);
        classData[cls].breaks = (window._editingBreaks || []).filter(b => b.start || b.name);
        // Keep old fields for backward compat
        const sched = classData[cls].schedule;
        if (sched[0]) { classData[cls].day1 = sched[0].day; classData[cls].time1 = sched[0].start; classData[cls].time1end = sched[0].end; }
        if (sched[1]) { classData[cls].day2 = sched[1].day; classData[cls].time2 = sched[1].start; classData[cls].time2end = sched[1].end; }
        await fbSaveClassData(cls, classData[cls]);

        alert('Class saved!');
        renderClassManager();
    } catch (e) {
        alert('Failed to save: ' + e.message);
    }
}

async function addNewClass() {
    const name = document.getElementById('new-class-name').value.trim();
    if (!name) { alert('Enter a class name.'); return; }

    // Auto-generate ID from name
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!id) { alert('Invalid class name.'); return; }

    CLASS_DISPLAY_NAMES[id] = name;
    await fbSaveClassData(id, { displayName: name });
    document.getElementById('new-class-name').value = '';
    await renderClassManager();
    openClassEditor(id);
}

async function deleteClass(cls) {
    if (!(await showConfirm(`Delete class "${getClassDisplayName(cls)}"? This cannot be undone.`, 'Delete Class'))) return;
    try {
        await fbDeleteClassData(cls);
        delete CLASS_DISPLAY_NAMES[cls];
        document.getElementById('class-editor-panel').style.display = 'none';
        await renderClassManager();
        alert('Class deleted.');
    } catch (e) {
        alert('Failed to delete: ' + e.message);
    }
}

// ========== ADMIN: PENDING APPROVALS ==========

let adminPendingSearch = '';
let adminPendingSearchTimer = null;

function setPendingSearch(value) {
    clearTimeout(adminPendingSearchTimer);
    adminPendingSearchTimer = setTimeout(() => {
        adminPendingSearch = value;
        renderPendingApprovals();
        const el = document.getElementById('pending-search-input');
        if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; }
    }, 300);
}

function updateBadge(id, count) {
    const badge = document.getElementById(id);
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = '';
    } else {
        badge.style.display = 'none';
    }
}

async function renderPendingApprovals() {
    const container = document.getElementById('admin-pending-list');
    if (!container) return;

    let pending = [];
    try { pending = await fbGetPending(); } catch (e) {}

    updateBadge('pending-badge', pending.length);
    updateBadge('sidebar-pending-badge', pending.length);

    if (pending.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No pending requests.</p>';
        return;
    }

    // Apply search filter
    if (adminPendingSearch) {
        const q = adminPendingSearch.toLowerCase();
        pending = pending.filter(p => (p.firstName + ' ' + p.lastName).toLowerCase().includes(q));
    }

    let html = `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">
        <input type="text" id="pending-search-input" class="text-input" placeholder="Search requests..." value="${adminPendingSearch}" oninput="setPendingSearch(this.value)" style="width:100%;max-width:200px;margin-bottom:0;padding:0.5rem 0.75rem;font-size:0.85rem;">
        <button class="btn" style="padding:0.3rem 0.7rem;font-size:0.8rem;" onclick="bulkApprove()">Approve Selected</button>
        <button class="btn" style="padding:0.3rem 0.7rem;font-size:0.8rem;background:var(--incorrect);" onclick="bulkReject()">Reject Selected</button>
    </div>`;
    html += '<table class="data-table"><thead><tr><th><input type="checkbox" onchange="toggleAllPending(this.checked)"></th><th>Name</th><th>Grade</th><th>Class</th><th>Parent Email</th><th>Parent Phone</th><th>Requested</th><th>Action</th></tr></thead><tbody>';
    pending.forEach(p => {
        html += `<tr>
            <td><input type="checkbox" class="pending-check" value="${p.id}"></td>
            <td>${formatName(p.firstName)} ${formatName(p.lastName)}</td>
            <td>Grade ${p.grade}</td>
            <td>${getClassDisplayName(p.class)}</td>
            <td style="font-size:0.8rem;">${p.parentEmail || '—'}</td>
            <td style="font-size:0.8rem;">${p.parentPhone || '—'}</td>
            <td>${p.requestedAt}</td>
            <td>
                <button class="btn" style="padding:0.3rem 0.7rem;font-size:0.8rem;" onclick="approveStudent('${p.id}')">Approve</button>
                <button class="btn" style="padding:0.3rem 0.7rem;font-size:0.8rem;background:var(--incorrect);" onclick="rejectStudent('${p.id}')">Reject</button>
            </td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function generateParentCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'PAR-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

async function backfillParentCodes() {
    if (typeof fbGetRoster !== 'function' || typeof fbUpdateRoster !== 'function') return;
    try {
        const roster = await fbGetRoster();
        for (const student of roster) {
            if (!student.parentCode) {
                await fbUpdateRoster(student.id, { parentCode: generateParentCode() });
            }
        }
    } catch (e) { console.error('Backfill parent codes:', e); }
}

async function approveStudent(docId) {
    try {
        const pending = await fbGetPending();
        const student = pending.find(p => p.id === docId);
        if (!student) return;

        await fbAddToRoster({
            firstName: student.firstName,
            lastName: student.lastName,
            grade: student.grade,
            class: student.class,
            classes: [student.class],
            classHistory: [{ class: student.class, action: 'joined', date: new Date().toLocaleDateString() }],
            passwordHash: student.passwordHash || '',
            passwordPlain: student.passwordPlain || '',
            parentEmail: student.parentEmail || '',
            parentPhone: student.parentPhone || '',
            parentCode: generateParentCode(),
            approvedAt: new Date().toLocaleDateString()
        });

        await fbRemovePending(docId);
        renderPendingApprovals();
        renderRoster();
    } catch (e) {
        showAlert('Failed to approve: ' + e.message, 'error');
    }
}

async function rejectStudent(docId) {
    if (!(await showConfirm('Reject this student registration?', 'Reject Student'))) return;
    try {
        await fbRemovePending(docId);
        renderPendingApprovals();
    } catch (e) {
        showAlert('Failed to reject: ' + e.message, 'error');
    }
}

function toggleAllPending(checked) {
    document.querySelectorAll('.pending-check').forEach(cb => cb.checked = checked);
}

async function bulkApprove() {
    const ids = [...document.querySelectorAll('.pending-check:checked')].map(cb => cb.value);
    if (ids.length === 0) { showAlert('No students selected.', 'info'); return; }
    if (!(await showConfirm(`Approve ${ids.length} student(s)?`))) return;
    for (const id of ids) {
        try { await approveStudent(id); } catch(e) {}
    }
    renderPendingApprovals();
    renderRoster();
}

async function bulkReject() {
    const ids = [...document.querySelectorAll('.pending-check:checked')].map(cb => cb.value);
    if (ids.length === 0) { showAlert('No students selected.', 'info'); return; }
    if (!(await showConfirm(`Reject ${ids.length} student(s)?`))) return;
    for (const id of ids) {
        try { await rejectStudent(id); } catch(e) {}
    }
    renderPendingApprovals();
}

// ========== ADMIN: STUDENT ROSTER ==========

let adminRosterSearch = '';
let adminRosterSearchTimer = null;

function setRosterSearch(value) {
    clearTimeout(adminRosterSearchTimer);
    adminRosterSearchTimer = setTimeout(() => {
        adminRosterSearch = value;
        renderRoster();
        const el = document.getElementById('roster-search-input');
        if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; }
    }, 300);
}

// ========== ALL STUDENTS TABLE ==========

let _allStudentsData = [];
let _allStudentsPage = 0;
let _allStudentsSearch = '';
let _allStudentsSort = 'name'; // name, grade, class, phone
let _allStudentsSortDir = 1; // 1 = asc, -1 = desc
let _selectedStudentIds = new Set();
const STUDENTS_PER_PAGE = 15;

async function renderAllStudents() {
    const container = document.getElementById('admin-students-list');
    if (!container) return;

    try { _allStudentsData = await fbGetRoster(); } catch (e) { _allStudentsData = []; }

    if (_allStudentsData.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);">No students yet.</p>';
        return;
    }

    _allStudentsPage = 0;
    _allStudentsSearch = '';
    _allStudentsSort = 'name';
    _allStudentsSortDir = 1;
    renderStudentsPage();
}

function sortStudents(field) {
    if (_allStudentsSort === field) {
        _allStudentsSortDir *= -1;
    } else {
        _allStudentsSort = field;
        _allStudentsSortDir = 1;
    }
    _allStudentsPage = 0;
    renderStudentsPage();
}

function renderStudentsPage() {
    const container = document.getElementById('admin-students-list');
    if (!container) return;

    // Filter
    let filtered = _allStudentsData;
    if (_allStudentsSearch) {
        const q = _allStudentsSearch.toLowerCase();
        filtered = _allStudentsData.filter(r => (r.firstName + ' ' + r.lastName).toLowerCase().includes(q) || (r.parentPhone || '').includes(q) || (r.class || '').toLowerCase().includes(q));
    }

    // Sort
    const gradeOrder = ['3','4','5','6','7','8'];
    const classOrder = ['3','4/5','5/6','6','6/7','7/8','alg1','adv-alg1','alg2','alg2-geo','precalc','math-analysis'];
    filtered.sort((a, b) => {
        let cmp = 0;
        if (_allStudentsSort === 'name') {
            cmp = ((a.lastName || '') + (a.firstName || '')).toLowerCase().localeCompare(((b.lastName || '') + (b.firstName || '')).toLowerCase());
        } else if (_allStudentsSort === 'grade') {
            const ga = gradeOrder.indexOf(a.grade || ''), gb = gradeOrder.indexOf(b.grade || '');
            cmp = (ga === -1 ? 999 : ga) - (gb === -1 ? 999 : gb);
        } else if (_allStudentsSort === 'class') {
            const ca = classOrder.indexOf(a.class || ''), cb = classOrder.indexOf(b.class || '');
            cmp = (ca === -1 ? 999 : ca) - (cb === -1 ? 999 : cb);
        } else if (_allStudentsSort === 'phone') {
            cmp = (a.parentPhone || '').localeCompare(b.parentPhone || '');
        }
        return cmp * _allStudentsSortDir;
    });

    const totalPages = Math.ceil(filtered.length / STUDENTS_PER_PAGE);
    if (_allStudentsPage >= totalPages) _allStudentsPage = Math.max(0, totalPages - 1);
    const start = _allStudentsPage * STUDENTS_PER_PAGE;
    const pageStudents = filtered.slice(start, start + STUDENTS_PER_PAGE);

    function sortArrow(field) {
        if (_allStudentsSort !== field) return '';
        return _allStudentsSortDir === 1 ? ' ▲' : ' ▼';
    }

    const selCount = _selectedStudentIds.size;

    let html = `<div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;align-items:center;">
        <input type="text" id="all-students-search" class="text-input" placeholder="Search..." style="width:200px;padding:0.5rem 0.75rem;font-size:0.85rem;">
        <span style="color:var(--text-secondary);font-size:0.85rem;margin-left:auto;">${filtered.length} student${filtered.length !== 1 ? 's' : ''}</span>
    </div>`;

    // Bulk action bar
    html += `<div id="bulk-action-bar" style="display:${selCount > 0 ? 'flex' : 'none'};align-items:center;gap:0.75rem;padding:0.6rem 1rem;margin-bottom:0.75rem;background:var(--primary-color);border-radius:10px;color:#fff;flex-wrap:wrap;">
        <span style="font-weight:600;font-size:0.9rem;">${selCount} selected</span>
        <button class="btn" style="padding:0.3rem 0.8rem;font-size:0.8rem;background:var(--incorrect);border:none;" onclick="bulkDeleteStudents()">Delete Selected</button>
        <button class="btn" style="padding:0.3rem 0.8rem;font-size:0.8rem;background:#fff;color:var(--primary-color);border:none;" onclick="bulkAssignStudents()">Assign Test</button>
        <button class="btn" style="padding:0.3rem 0.8rem;font-size:0.8rem;background:transparent;border:1px solid #fff;color:#fff;" onclick="_selectedStudentIds.clear();renderStudentsPage();">Clear Selection</button>
    </div>`;

    const allPageIds = pageStudents.map(r => r.id);
    const allPageSelected = allPageIds.length > 0 && allPageIds.every(id => _selectedStudentIds.has(id));

    html += `<table class="data-table"><thead><tr>
        <th style="width:36px;text-align:center;"><input type="checkbox" ${allPageSelected ? 'checked' : ''} onchange="toggleAllStudentsOnPage(this.checked)" title="Select all on this page"></th>
        <th style="cursor:pointer;" onclick="sortStudents('name')">Name${sortArrow('name')}</th>
        <th style="cursor:pointer;" onclick="sortStudents('grade')">Grade${sortArrow('grade')}</th>
        <th style="cursor:pointer;" onclick="sortStudents('class')">Classes${sortArrow('class')}</th>
        <th style="cursor:pointer;" onclick="sortStudents('phone')">Parent Phone${sortArrow('phone')}</th>
    </tr></thead><tbody>`;

    pageStudents.forEach(r => {
        const name = formatName(r.firstName) + ' ' + formatName(r.lastName);
        const allClasses = (r.classes || (r.class ? [r.class] : [])).map(c => getClassDisplayName(c)).join(', ');
        let ph = (r.parentPhone || '').replace(/\D/g, '');
        if (ph.length === 10) ph = ph.slice(0,3) + '-' + ph.slice(3,6) + '-' + ph.slice(6);
        const checked = _selectedStudentIds.has(r.id) ? 'checked' : '';
        html += `<tr style="cursor:pointer;">
            <td style="text-align:center;" onclick="event.stopPropagation();"><input type="checkbox" ${checked} onchange="toggleStudentSelect('${r.id}', this.checked)"></td>
            <td style="font-weight:500;color:var(--primary-color);" onclick="openStudentDetail('${r.id}')">${name}</td>
            <td onclick="openStudentDetail('${r.id}')">Grade ${r.grade}</td>
            <td style="font-size:0.85rem;" onclick="openStudentDetail('${r.id}')">${allClasses || '—'}</td>
            <td style="font-size:0.85rem;" onclick="openStudentDetail('${r.id}')">${ph || '—'}</td>
        </tr>`;
    });

    html += '</tbody></table>';

    // Pagination
    if (totalPages > 1) {
        html += `<div style="display:flex;justify-content:center;align-items:center;gap:0.75rem;margin-top:1rem;">
            <button class="btn" style="padding:0.3rem 0.8rem;font-size:0.85rem;" onclick="_allStudentsPage--;renderStudentsPage()" ${_allStudentsPage === 0 ? 'disabled' : ''}>&larr; Prev</button>
            <span style="font-size:0.85rem;color:var(--text-secondary);">Page ${_allStudentsPage + 1} of ${totalPages}</span>
            <button class="btn" style="padding:0.3rem 0.8rem;font-size:0.85rem;" onclick="_allStudentsPage++;renderStudentsPage()" ${_allStudentsPage >= totalPages - 1 ? 'disabled' : ''}>Next &rarr;</button>
        </div>`;
    }

    container.innerHTML = html;

    // Attach search handler without re-rendering on every keystroke
    const searchInput = document.getElementById('all-students-search');
    if (searchInput) {
        searchInput.value = _allStudentsSearch;
        let searchTimer = null;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                _allStudentsSearch = this.value;
                _allStudentsPage = 0;
                renderStudentsPage();
                const el = document.getElementById('all-students-search');
                if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; }
            }, 300);
        });
    }
}

// ========== STUDENT BULK ACTIONS ==========

function toggleStudentSelect(id, checked) {
    if (checked) _selectedStudentIds.add(id);
    else _selectedStudentIds.delete(id);
    renderStudentsPage();
}

function toggleAllStudentsOnPage(checked) {
    const filtered = _allStudentsSearch ? _allStudentsData.filter(r => (r.firstName + ' ' + r.lastName).toLowerCase().includes(_allStudentsSearch.toLowerCase()) || (r.parentPhone || '').includes(_allStudentsSearch) || (r.class || '').toLowerCase().includes(_allStudentsSearch.toLowerCase())) : _allStudentsData;
    const start = _allStudentsPage * STUDENTS_PER_PAGE;
    const pageStudents = filtered.slice(start, start + STUDENTS_PER_PAGE);
    pageStudents.forEach(r => {
        if (checked) _selectedStudentIds.add(r.id);
        else _selectedStudentIds.delete(r.id);
    });
    renderStudentsPage();
}

async function bulkDeleteStudents() {
    const count = _selectedStudentIds.size;
    if (count === 0) return;
    if (!(await showConfirm(`Delete ${count} student${count !== 1 ? 's' : ''} from the roster? This cannot be undone.`, 'Delete Students'))) return;
    try {
        for (const id of _selectedStudentIds) {
            await fbRemoveFromRoster(id);
        }
        _selectedStudentIds.clear();
        renderAllStudents();
    } catch (e) {
        showAlert('Failed to delete some students: ' + e.message, 'error');
    }
}

function bulkAssignStudents() {
    const ids = [..._selectedStudentIds];
    if (ids.length === 0) return;

    // Get names from IDs
    const selected = _allStudentsData.filter(r => ids.includes(r.id));
    const names = selected.map(r => formatName(r.firstName) + ' ' + formatName(r.lastName));

    // Hide all admin pages and show quick-assign page
    document.querySelectorAll('.admin-page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('#admin-sidebar .sidebar-item').forEach(btn => btn.classList.remove('active'));

    let page = document.getElementById('admin-page-quick-assign');
    if (!page) {
        page = document.createElement('div');
        page.id = 'admin-page-quick-assign';
        page.className = 'admin-page';
        document.querySelector('.admin-dashboard-grid').appendChild(page);
    }
    page.classList.remove('hidden');

    const nameList = names.length <= 5 ? names.join(', ') : names.slice(0, 5).join(', ') + ` + ${names.length - 5} more`;

    page.innerHTML = `
    <div class="admin-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <h3 class="admin-section-title" style="margin:0;border:none;padding:0;">Assign Test to ${names.length} Student${names.length !== 1 ? 's' : ''}</h3>
            <button class="btn" style="padding:0.3rem 0.7rem;font-size:0.8rem;background:var(--text-secondary);" onclick="switchAdminPage('students',null);document.querySelectorAll('#admin-sidebar .sidebar-item').forEach(b=>{b.classList.remove('active');if(b.textContent.trim().startsWith('Students'))b.classList.add('active')})">Back to Students</button>
        </div>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem;">${nameList}</p>

        <div style="display:flex;gap:0.4rem;margin-bottom:1rem;border-bottom:2px solid var(--border-color);padding-bottom:0.4rem;">
            <button class="btn ba-tab active" id="ba-tab-standard" onclick="document.getElementById('ba-standard').classList.remove('hidden');document.getElementById('ba-custom').classList.add('hidden');document.querySelectorAll('.ba-tab').forEach(b=>{b.style.background='var(--bg-surface)';b.style.color='var(--text-main)';b.style.border='1px solid var(--border-color)'});this.style.background='var(--primary-color)';this.style.color='#fff';this.style.border='1px solid var(--primary-color)'" style="padding:0.4rem 1rem;font-size:0.85rem;">PSSA / Keystone</button>
            <button class="btn ba-tab" id="ba-tab-custom" onclick="document.getElementById('ba-custom').classList.remove('hidden');document.getElementById('ba-standard').classList.add('hidden');document.querySelectorAll('.ba-tab').forEach(b=>{b.style.background='var(--bg-surface)';b.style.color='var(--text-main)';b.style.border='1px solid var(--border-color)'});this.style.background='var(--primary-color)';this.style.color='#fff';this.style.border='1px solid var(--primary-color)'" style="padding:0.4rem 1rem;font-size:0.85rem;background:var(--bg-surface);color:var(--text-main);border:1px solid var(--border-color);">Custom Test</button>
        </div>

        <div id="ba-standard">
            <div class="admin-form">
                <div class="admin-form-row">
                    <label class="admin-label">Test Type</label>
                    <select id="ba-test-type" class="text-input" onchange="document.getElementById('ba-pssa-opts').classList.toggle('hidden',this.value!=='pssa');document.getElementById('ba-keystone-opts').classList.toggle('hidden',this.value!=='keystone')">
                        <option value="pssa">PSSA</option><option value="keystone">Keystone</option>
                    </select>
                </div>
                <div id="ba-pssa-opts" class="admin-form-row">
                    <label class="admin-label">PSSA Grade</label>
                    <select id="ba-grade" class="text-input"><option value="3">Grade 3</option><option value="4">Grade 4</option><option value="5">Grade 5</option><option value="6">Grade 6</option><option value="7">Grade 7</option><option value="8">Grade 8</option></select>
                </div>
                <div id="ba-keystone-opts" class="admin-form-row hidden">
                    <label class="admin-label">Subject</label>
                    <select id="ba-subject" class="text-input"><option value="algebra">Algebra I</option></select>
                </div>
                <div class="admin-form-row"><label class="admin-label">Number of Questions</label><input type="number" id="ba-count" class="text-input" value="20" min="5" max="50"></div>
                <div class="admin-form-row"><label class="admin-label">Test Name (optional)</label><input type="text" id="ba-name" class="text-input" placeholder="e.g. Week 5 Quiz"></div>
                <div class="admin-form-row"><label class="admin-label">Due Date</label><input type="date" id="ba-due" class="text-input"></div>
                <div class="admin-form-row"><label class="admin-label">Time Limit (optional)</label><div style="display:flex;align-items:center;gap:0.5rem;"><input type="number" id="ba-timer" class="text-input" placeholder="Minutes" min="1" max="180" style="max-width:100px;"><span style="color:var(--text-secondary);font-size:0.85rem;">minutes</span></div></div>
                <div class="admin-form-row"><label class="checkbox-label"><input type="checkbox" id="ba-redemption" checked> Include redemption questions</label></div>
                <button class="btn" onclick="submitBulkAssign()">Assign Test</button>
                <div id="ba-status" style="margin-top:0.5rem;font-size:0.85rem;"></div>
            </div>
        </div>

        <div id="ba-custom" class="hidden">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:0.75rem;">Paste problems, process them, then assign to all selected students.</p>
            <div class="admin-form-row"><label class="admin-label">Paste Your Problems</label><textarea id="ba-custom-input" class="custom-textarea" placeholder="Paste problems here..."></textarea></div>
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.75rem;margin-bottom:1rem;">
                <label class="checkbox-label"><input type="checkbox" id="ba-custom-dynamic" checked> Make Dynamic</label>
                <button class="btn" onclick="processBulkAssignCustom()">Process Questions</button>
                <span id="ba-custom-status" class="process-status"></span>
            </div>
            <div id="ba-custom-preview"></div>
            <div id="ba-custom-save" class="hidden" style="border-top:1px solid var(--border-color);padding-top:1rem;margin-top:0.5rem;">
                <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:flex-end;">
                    <div><label class="admin-label">Test Name</label><input type="text" id="ba-custom-name" class="text-input" placeholder="e.g. Chapter Review" style="margin-bottom:0;"></div>
                    <div><label class="admin-label">Due Date</label><input type="date" id="ba-custom-due" class="text-input" style="margin-bottom:0;"></div>
                    <div><label class="admin-label">Time Limit (min)</label><input type="number" id="ba-custom-timer" class="text-input" placeholder="—" min="1" max="180" style="width:80px;margin-bottom:0;"></div>
                    <button class="btn" onclick="saveBulkAssignCustom()">Save & Assign</button>
                </div>
            </div>
        </div>
    </div>`;

    // Store selected student keys for assignment
    window._bulkAssignStudents = selected;
    window.scrollTo(0, 0);
}

function submitBulkAssign() {
    const students = window._bulkAssignStudents || [];
    if (students.length === 0) return;
    const testType = document.getElementById('ba-test-type').value;
    const redemption = document.getElementById('ba-redemption').checked;
    const questionCount = parseInt(document.getElementById('ba-count').value) || 20;
    const name = (document.getElementById('ba-name').value || '').trim();
    const dueDate = document.getElementById('ba-due').value;
    const timer = parseInt(document.getElementById('ba-timer').value) || 0;

    const assignments = getAssignments();

    students.forEach(r => {
        const fullName = (formatName(r.firstName) + ' ' + formatName(r.lastName)).toLowerCase();
        const targetKey = 'student:' + fullName;
        if (!assignments[targetKey]) assignments[targetKey] = [];
        let testItem;
        if (testType === 'pssa') {
            testItem = { type: 'pssa', grade: parseInt(document.getElementById('ba-grade').value), redemption, questionCount, assignedAt: new Date().toLocaleDateString() };
        } else {
            testItem = { type: 'keystone', subject: document.getElementById('ba-subject').value, redemption, questionCount, assignedAt: new Date().toLocaleDateString() };
        }
        if (name) testItem.name = name;
        if (dueDate) testItem.dueDate = dueDate;
        if (timer > 0) testItem.timerMinutes = timer;
        assignments[targetKey].push(testItem);
    });

    saveAssignments(assignments);
    const statusEl = document.getElementById('ba-status');
    statusEl.innerHTML = `<span style="color:var(--correct);">Test assigned to ${students.length} student${students.length !== 1 ? 's' : ''}!</span>`;
}

window._baCustomQuestions = [];

function processBulkAssignCustom() {
    const raw = document.getElementById('ba-custom-input').value.trim();
    if (!raw) return;
    const statusEl = document.getElementById('ba-custom-status');
    statusEl.textContent = 'Processing...';
    window._baCustomQuestions = fallbackParse(raw);

    if (document.getElementById('ba-custom-dynamic').checked && window._baCustomQuestions.length > 0 && typeof extractNumbers === 'function') {
        window._baCustomQuestions.forEach(q => {
            const nums = extractNumbers(q.text);
            const ansNum = parseFloat((q.correct || '').replace(/[,$%]/g, ''));
            if (nums.length >= 2 && !isNaN(ansNum)) {
                const op = detectOperation(nums, ansNum);
                if (op) { q._descriptor = buildDescriptor(q.text, nums, op, ansNum); return; }
            }
            if (typeof buildCosmeticDescriptor === 'function') {
                const cosmetic = buildCosmeticDescriptor(q.text, q.correct, q.options || []);
                if (cosmetic) q._descriptor = cosmetic;
            }
        });
    }

    if (window._baCustomQuestions.length > 0) {
        statusEl.textContent = window._baCustomQuestions.length + ' questions parsed';
        statusEl.className = 'process-status done';
        document.getElementById('ba-custom-save').classList.remove('hidden');
        const rm = typeof renderMathInHTML === 'function' ? renderMathInHTML : (x => x);
        let preview = '';
        window._baCustomQuestions.forEach((q, i) => { preview += `<div style="padding:0.4rem 0;border-bottom:1px solid var(--border-color);font-size:0.85rem;"><strong>Q${i+1}:</strong> ${rm(q.text.substring(0, 80))}${q.text.length > 80 ? '...' : ''}</div>`; });
        document.getElementById('ba-custom-preview').innerHTML = preview;
    } else {
        statusEl.textContent = 'No questions found.';
        statusEl.className = 'process-status error';
    }
}

function saveBulkAssignCustom() {
    const students = window._bulkAssignStudents || [];
    if (window._baCustomQuestions.length === 0 || students.length === 0) return;
    const name = (document.getElementById('ba-custom-name').value || '').trim() || 'Custom Test';
    const due = document.getElementById('ba-custom-due').value;
    const timer = parseInt(document.getElementById('ba-custom-timer').value) || 0;

    const testId = 'custom_' + Date.now();
    const testData = { id: testId, name, createdAt: new Date().toLocaleDateString(), questions: window._baCustomQuestions };
    saveCustomTestData(testId, testData);

    const assignments = getAssignments();
    students.forEach(r => {
        const fullName = (formatName(r.firstName) + ' ' + formatName(r.lastName)).toLowerCase();
        const targetKey = 'student:' + fullName;
        if (!assignments[targetKey]) assignments[targetKey] = [];
        const item = { type: 'custom', testId, name, redemption: true, assignedAt: new Date().toLocaleDateString() };
        if (due) item.dueDate = due;
        if (timer > 0) item.timerMinutes = timer;
        assignments[targetKey].push(item);
    });

    saveAssignments(assignments);
    window._baCustomQuestions = [];
    document.getElementById('ba-custom-input').value = '';
    document.getElementById('ba-custom-preview').innerHTML = '';
    document.getElementById('ba-custom-save').classList.add('hidden');
    document.getElementById('ba-custom-status').textContent = '';
    showAlert(`"${name}" assigned to ${students.length} student${students.length !== 1 ? 's' : ''}!`, 'success');
}

// ========== ACTIVITY TRACKER ==========

async function renderActivityTracker() {
    const container = document.getElementById('admin-activity-list');
    if (!container) return;

    let roster = [];
    try { roster = await fbGetRoster(); } catch (e) {}

    if (roster.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);">No students in roster.</p>';
        return;
    }

    const now = new Date();
    const classOrder = ['3', '4/5', '5/6', '6', '6/7', '7/8', 'alg1', 'adv-alg1', 'alg2', 'alg2-geo', 'precalc', 'math-analysis'];

    // Add computed fields
    roster.forEach(r => {
        if (r.lastActive) {
            const last = new Date(r.lastActive);
            r._daysAgo = Math.floor((now - last) / 86400000);
            r._lastStr = last.toLocaleDateString() + ' ' + last.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            r._daysAgo = 999;
            r._lastStr = 'Never';
        }
    });

    // Group by class
    const byClass = {};
    roster.forEach(r => {
        const cls = r.class || 'Other';
        if (!byClass[cls]) byClass[cls] = [];
        byClass[cls].push(r);
    });

    const sorted = Object.keys(byClass).sort((a, b) => {
        const ai = classOrder.indexOf(a), bi = classOrder.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    // Summary stats
    const activeToday = roster.filter(r => r._daysAgo === 0).length;
    const activeWeek = roster.filter(r => r._daysAgo <= 7).length;
    const inactive = roster.filter(r => r._daysAgo > 7).length;

    let html = `<div style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1rem;">
        <div style="padding:0.75rem 1rem;background:var(--correct-bg);border-radius:10px;flex:1;min-width:120px;text-align:center;">
            <div style="font-size:1.5rem;font-weight:700;color:var(--correct);">${activeToday}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);">Active Today</div>
        </div>
        <div style="padding:0.75rem 1rem;background:var(--bg-surface, #f8f9fa);border-radius:10px;flex:1;min-width:120px;text-align:center;">
            <div style="font-size:1.5rem;font-weight:700;color:var(--primary-color);">${activeWeek}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);">Active This Week</div>
        </div>
        <div style="padding:0.75rem 1rem;background:var(--incorrect-bg);border-radius:10px;flex:1;min-width:120px;text-align:center;">
            <div style="font-size:1.5rem;font-weight:700;color:var(--incorrect);">${inactive}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);">Inactive (7+ days)</div>
        </div>
    </div>`;

    sorted.forEach(cls => {
        const students = byClass[cls].sort((a, b) => a._daysAgo - b._daysAgo);
        const label = getClassDisplayName(cls);
        const classInactive = students.filter(s => s._daysAgo > 7).length;

        html += `<div style="margin-bottom:0.75rem;border:1px solid var(--border-color);border-radius:10px;overflow:hidden;">
            <div style="padding:0.75rem 1rem;cursor:pointer;font-weight:600;background:var(--bg-surface, #f8f9fa);display:flex;justify-content:space-between;align-items:center;" onclick="document.getElementById('activity-class-${cls.replace(/[^a-z0-9]/gi,'')}').classList.toggle('hidden')">
                <span>${label}</span>
                <span style="font-weight:400;font-size:0.85rem;">${students.length} students${classInactive > 0 ? ` · <span style="color:var(--incorrect);">${classInactive} inactive</span>` : ''}</span>
            </div>
            <div id="activity-class-${cls.replace(/[^a-z0-9]/gi,'')}" class="hidden" style="padding:0;">
                <table class="data-table" style="margin:0;border:none;"><thead><tr><th>Student</th><th>Last Active</th><th>Status</th></tr></thead><tbody>`;

        students.forEach(r => {
            const name = formatName(r.firstName) + ' ' + formatName(r.lastName);
            let statusBadge;
            if (r._daysAgo === 0) {
                statusBadge = '<span style="color:var(--correct);font-weight:600;">Active today</span>';
            } else if (r._daysAgo <= 3) {
                statusBadge = `<span style="color:var(--primary-color);">${r._daysAgo} day${r._daysAgo !== 1 ? 's' : ''} ago</span>`;
            } else if (r._daysAgo <= 7) {
                statusBadge = `<span style="color:var(--warning);">${r._daysAgo} days ago</span>`;
            } else if (r._daysAgo < 999) {
                statusBadge = `<span style="color:var(--incorrect);font-weight:600;">${r._daysAgo} days ago</span>`;
            } else {
                statusBadge = '<span style="color:var(--incorrect);font-weight:600;">Never logged in</span>';
            }

            const rowBg = r._daysAgo > 7 ? 'background:var(--incorrect-bg);' : '';
            html += `<tr style="${rowBg}">
                <td>${name}</td>
                <td style="font-size:0.85rem;">${r._lastStr}</td>
                <td>${statusBadge}</td>
            </tr>`;
        });

        html += '</tbody></table></div></div>';
    });

    container.innerHTML = html;
}

async function renderRoster() {
    const container = document.getElementById('admin-roster-list');
    if (!container) return;

    let roster = [];
    try { roster = await fbGetRoster(); } catch (e) {}

    if (roster.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No approved students yet.</p>';
        return;
    }

    // Group by class
    const byClass = {};
    roster.forEach(r => {
        const cls = r.class || 'Unassigned';
        if (!byClass[cls]) byClass[cls] = [];
        byClass[cls].push(r);
    });

    // Sort classes
    const classOrder = ['3', '4/5', '5/6', '6', '6/7', '7/8', 'alg1', 'adv-alg1', 'alg2', 'alg2-geo', 'precalc', 'math-analysis'];
    const sortedClasses = Object.keys(byClass).sort((a, b) => {
        const ai = classOrder.indexOf(a), bi = classOrder.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    let html = `<div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem;">
        <input type="text" id="roster-search-input" class="text-input" placeholder="Search students..." value="${adminRosterSearch || ''}" oninput="setRosterSearch(this.value)" style="width:100%;max-width:200px;padding:0.5rem 0.75rem;font-size:0.85rem;">
        <button class="btn" style="padding:0.4rem 0.8rem;font-size:0.8rem;" onclick="exportRosterCSV()">Export CSV</button>
    </div>`;
    html += `<p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:0.75rem;">${roster.length} student${roster.length !== 1 ? 's' : ''} total</p>`;

    sortedClasses.forEach(cls => {
        const students = byClass[cls];
        const label = getClassDisplayName(cls);

        let filtered = students;
        if (adminRosterSearch) {
            const q = adminRosterSearch.toLowerCase();
            filtered = students.filter(r => (r.firstName + ' ' + r.lastName).toLowerCase().includes(q));
        }
        if (filtered.length === 0) return;

        const safeId = cls.replace(/[^a-z0-9]/gi, '');
        html += `<div style="margin-bottom:0.75rem;border:1px solid var(--border-color);border-radius:10px;overflow:hidden;">
            <div style="padding:0.75rem 1rem;cursor:pointer;font-weight:600;background:var(--bg-surface, #f8f9fa);display:flex;justify-content:space-between;align-items:center;" onclick="document.getElementById('roster-class-${safeId}').classList.toggle('hidden')">
                <span>${label}</span>
                <span style="font-weight:400;font-size:0.85rem;color:var(--text-secondary);">${filtered.length} student${filtered.length !== 1 ? 's' : ''}</span>
            </div>
            <div id="roster-class-${safeId}" class="hidden" style="padding:0;">
                <table class="data-table" style="margin:0;border:none;"><thead><tr><th>Name</th><th>Grade</th><th>Class</th><th>Parent Phone</th></tr></thead><tbody>`;

        filtered.forEach(r => {
            const fullName = formatName(r.firstName) + ' ' + formatName(r.lastName);
            const allClasses = (r.classes || [r.class]).map(c => getClassDisplayName(c)).join(', ');
            let ph = (r.parentPhone || '').replace(/\D/g, '');
            if (ph.length === 10) ph = ph.slice(0,3) + '-' + ph.slice(3,6) + '-' + ph.slice(6);
            html += `<tr style="cursor:pointer;" onclick="openStudentDetail('${r.id}')">
                <td style="font-weight:500;color:var(--primary-color);">${fullName}</td>
                <td>Grade ${r.grade}</td>
                <td style="font-size:0.85rem;">${allClasses}</td>
                <td style="font-size:0.85rem;">${ph || '—'}</td>
            </tr>`;
        });

        html += '</tbody></table></div></div>';
    });

    // Student detail panel at the bottom
    html += `<div id="roster-student-panel" style="display:none;margin-top:1.5rem;border:1px solid var(--border-color);border-radius:10px;padding:1.25rem;">
        <h4 id="roster-student-title" style="margin:0 0 1rem;color:var(--primary-color);"></h4>
        <div id="roster-student-content"></div>
    </div>`;

    container.innerHTML = html;
}

function exportRosterCSV() {
    fbGetRoster().then(roster => {
        if (roster.length === 0) { alert('No students to export.'); return; }
        if (typeof XLSX === 'undefined') {
            // Fallback to basic CSV
            let csv = 'First Name,Last Name,Grade,Class,Parent Email,Parent Phone\n';
            roster.forEach(r => { csv += `"${r.firstName || ''}","${r.lastName || ''}","${r.grade || ''}","${getClassDisplayName(r.class) || ''}","${r.parentEmail || ''}","${r.parentPhone || ''}"\n`; });
            const blob = new Blob([csv], { type: 'text/csv' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
            a.download = 'roster_' + new Date().toISOString().split('T')[0] + '.csv'; a.click();
            return;
        }

        const wb = XLSX.utils.book_new();
        const classOrder = ['3', '4/5', '5/6', '6', '6/7', '7/8', 'alg1', 'adv-alg1', 'alg2', 'alg2-geo', 'precalc', 'math-analysis'];

        // Group by class
        const byClass = {};
        roster.forEach(r => {
            const cls = r.class || 'Other';
            if (!byClass[cls]) byClass[cls] = [];
            byClass[cls].push(r);
        });

        // "All Students" sheet first
        const allData = roster.map(r => ({
            'First Name': r.firstName || '',
            'Last Name': r.lastName || '',
            'Grade': r.grade || '',
            'Class': getClassDisplayName(r.class) || '',
            'Parent Email': r.parentEmail || '',
            'Parent Phone': r.parentPhone || ''
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allData), 'All Students');

        // One sheet per class
        const sorted = Object.keys(byClass).sort((a, b) => {
            const ai = classOrder.indexOf(a), bi = classOrder.indexOf(b);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });
        sorted.forEach(cls => {
            const data = byClass[cls].map(r => ({
                'First Name': r.firstName || '',
                'Last Name': r.lastName || '',
                'Grade': r.grade || '',
                'Parent Email': r.parentEmail || '',
                'Parent Phone': r.parentPhone || ''
            }));
            const sheetName = getClassDisplayName(cls).substring(0, 31); // Excel max 31 chars
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), sheetName);
        });

        XLSX.writeFile(wb, 'student_roster_' + new Date().toISOString().split('T')[0] + '.xlsx');
    }).catch(e => alert('Export failed: ' + e.message));
}

async function openStudentDetail(docId) {
    try {
        const roster = await fbGetRoster();
        const r = roster.find(s => s.id === docId);
        if (!r) return;

        const fullName = formatName(r.firstName) + ' ' + formatName(r.lastName);
        const studentKey = fullName.toLowerCase();
        const allClasses = (r.classes || [r.class]).map(c => getClassDisplayName(c)).join(', ');
        const pw = r.passwordPlain || '(not stored)';
        let ph = (r.parentPhone || '').replace(/\D/g, '');
        if (ph.length === 10) ph = ph.slice(0,3) + '-' + ph.slice(3,6) + '-' + ph.slice(6);

        // Get scores for this student
        const allScores = getScores().filter(s => (s.student || '').toLowerCase() === studentKey);

        // Get help requests for this student
        let helpRequests = [];
        try { if (typeof fbGetHelpRequests === 'function') helpRequests = (await fbGetHelpRequests()).filter(h => (h.student || '').toLowerCase() === studentKey); } catch(e) {}

        // Get class schedule data
        let classData = {};
        try { classData = typeof fbGetClassData === 'function' ? await fbGetClassData() : {}; } catch(e) {}

        const studentClasses = r.classes || (r.class ? [r.class] : []);
        let scheduleHtml = '';
        studentClasses.forEach(cls => {
            const data = classData[cls] || {};
            const clsLabel = data.displayName || getClassDisplayName(cls);
            const sched = data.schedule || [];
            let times = '';
            if (sched.length > 0) {
                times = sched.filter(s => s.day).map(s => s.day + 's ' + formatTime12(s.start) + (s.end ? ' – ' + formatTime12(s.end) : '')).join(', ');
            } else if (data.day1) {
                times = data.day1 + 's ' + formatTime12(data.time1) + (data.time1end ? ' – ' + formatTime12(data.time1end) : '');
                if (data.day2) times += ', ' + data.day2 + 's ' + formatTime12(data.time2) + (data.time2end ? ' – ' + formatTime12(data.time2end) : '');
            }
            if (times) {
                scheduleHtml += `<div style="margin-bottom:0.3rem;"><strong>${clsLabel}:</strong> ${times}</div>`;
            }
        });

        // Last active
        let lastActiveStr = '—';
        if (r.lastActive) {
            const d = new Date(r.lastActive);
            lastActiveStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        }

        let html = '';

        // Class history
        const classHistory = r.classHistory || [];
        let historyHtml = '';
        if (classHistory.length > 0) {
            classHistory.forEach(h => {
                historyHtml += `<div style="margin-bottom:0.2rem;">${getClassDisplayName(h.class)} — ${h.action} ${h.date}</div>`;
            });
        }

        // Profile tab
        html += `<div id="student-tab-info" class="tab-content active">
            <div style="display:grid;grid-template-columns:180px 1fr;gap:0.75rem 2rem;font-size:1rem;max-width:700px;">
                <span style="font-weight:600;color:var(--text-secondary);">Name</span><span>${fullName}</span>
                <span style="font-weight:600;color:var(--text-secondary);">Grade</span><span>${r.grade}</span>
                <span style="font-weight:600;color:var(--text-secondary);">Current Classes</span><span>${allClasses}</span>
                ${scheduleHtml ? `<span style="font-weight:600;color:var(--text-secondary);">Schedule</span><div>${scheduleHtml}</div>` : ''}
                <span style="font-weight:600;color:var(--text-secondary);">Parent Email</span><span>${r.parentEmail || '—'}</span>
                <span style="font-weight:600;color:var(--text-secondary);">Parent Phone</span><span>${ph || '—'}</span>
                <span style="font-weight:600;color:var(--text-secondary);">Last Active</span><span>${lastActiveStr}</span>
                <span style="font-weight:600;color:var(--text-secondary);">Parent Code</span><span style="font-family:monospace;font-size:1.1rem;letter-spacing:1px;background:var(--bg-highlight);padding:0.15rem 0.5rem;border-radius:6px;">${r.parentCode || '—'}</span>
                ${historyHtml ? `<span style="font-weight:600;color:var(--text-secondary);">Class History</span><div>${historyHtml}</div>` : ''}
            </div>
        </div>`;

        // Scores tab — show assigned tests (taken & not taken) + completed scores
        html += `<div id="student-tab-scores" class="tab-content">`;

        // Get all assignments for this student's classes
        const assignments = getAssignments();
        const studentAssignments = [];
        const completedKeys = new Set(allScores.map(s => s.testLevel || ''));

        studentClasses.forEach(cls => {
            const classKey = 'class:' + cls;
            (assignments[classKey] || []).forEach(t => {
                const label = t.name || (t.type === 'pssa' ? 'PSSA Grade ' + t.grade : t.type === 'custom' ? t.name : 'Keystone');
                const taken = completedKeys.has(label);
                const score = taken ? allScores.find(s => s.testLevel === label) : null;
                studentAssignments.push({ ...t, label, taken, score, cls });
            });
        });
        // Also check student-specific assignments
        const studentSpecificKey = 'student:' + studentKey;
        (assignments[studentSpecificKey] || []).forEach(t => {
            const label = t.name || (t.type === 'pssa' ? 'PSSA Grade ' + t.grade : t.type === 'custom' ? t.name : 'Keystone');
            const taken = completedKeys.has(label);
            const score = taken ? allScores.find(s => s.testLevel === label) : null;
            studentAssignments.push({ ...t, label, taken, score });
        });

        if (allScores.length > 0) {
            const avg = (allScores.filter(s => !s.terminated).reduce((sum, s) => sum + parseFloat(s.accuracy || 0), 0) / allScores.filter(s => !s.terminated).length).toFixed(1);
            html += `<p style="font-size:0.9rem;margin-bottom:0.75rem;">${allScores.length} test${allScores.length !== 1 ? 's' : ''} completed · Average: <strong>${avg}%</strong></p>`;
        }

        // Assigned tests table
        if (studentAssignments.length > 0) {
            html += '<h4 style="font-size:0.9rem;color:var(--primary-color);margin-bottom:0.4rem;">Assigned Tests</h4>';
            html += '<table class="data-table"><thead><tr><th>Test</th><th>Assigned</th><th>Due</th><th>Status</th><th>Score</th><th>Taken</th></tr></thead><tbody>';
            studentAssignments.forEach(t => {
                const statusColor = t.taken ? 'var(--correct)' : 'var(--warning)';
                const statusLabel = t.taken ? 'Completed' : 'Not taken';
                let scoreStr = '—';
                let takenDate = '—';
                if (t.score) {
                    const pct = parseFloat(t.score.accuracy || 0);
                    const color = t.score.terminated ? 'var(--incorrect)' : pct >= 80 ? 'var(--correct)' : pct >= 60 ? 'var(--warning)' : 'var(--incorrect)';
                    scoreStr = t.score.terminated ? '<span style="color:var(--incorrect);">TERMINATED</span>' : `<span style="font-weight:700;color:${color};">${t.score.accuracy}%</span>`;
                    takenDate = t.score.completedAt || '—';
                }
                html += `<tr>
                    <td>${t.label}</td>
                    <td style="font-size:0.85rem;">${t.assignedAt || '—'}</td>
                    <td style="font-size:0.85rem;">${t.dueDate || '—'}</td>
                    <td style="color:${statusColor};font-weight:600;font-size:0.85rem;">${statusLabel}</td>
                    <td>${scoreStr}</td>
                    <td style="font-size:0.85rem;">${takenDate}</td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        // Practice tests (not assigned)
        const practiceScores = allScores.filter(s => s.source !== 'assigned');
        if (practiceScores.length > 0) {
            html += '<h4 style="font-size:0.9rem;color:var(--primary-color);margin:1rem 0 0.4rem;">Practice Tests</h4>';
            html += '<table class="data-table"><thead><tr><th>Test</th><th>Score</th><th>Date</th></tr></thead><tbody>';
            practiceScores.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || '')).forEach(s => {
                const pct = parseFloat(s.accuracy || 0);
                const color = s.terminated ? 'var(--incorrect)' : pct >= 80 ? 'var(--correct)' : pct >= 60 ? 'var(--warning)' : 'var(--incorrect)';
                html += `<tr>
                    <td>${s.testLevel || '—'}</td>
                    <td style="font-weight:700;color:${color};">${s.terminated ? 'TERMINATED' : s.accuracy + '%'}</td>
                    <td style="font-size:0.85rem;">${s.completedAt || '—'}</td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        // Skills summary
        const skillCounts = {};
        allScores.flatMap(s => s.wrongAnswers || []).forEach(w => {
            const skill = w.skill || w.type || extractSkillFromQuestion(w.question);
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
        const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (topSkills.length > 0) {
            html += '<h4 style="font-size:0.9rem;color:var(--primary-color);margin:1rem 0 0.4rem;">Top Struggling Skills</h4>';
            topSkills.forEach(([skill, count]) => {
                html += `<div style="padding:0.3rem 0.75rem;border-left:3px solid var(--incorrect);margin-bottom:0.25rem;background:var(--bg-surface, #f8f9fa);border-radius:0 8px 8px 0;font-size:0.85rem;"><strong>${skill}</strong> — ${count}x missed</div>`;
            });
        }

        if (allScores.length === 0 && studentAssignments.length === 0) {
            html += '<p style="color:var(--text-secondary);font-size:0.85rem;">No tests assigned or completed yet.</p>';
        }
        html += '</div>';

        // Requests tab
        html += `<div id="student-tab-requests" class="tab-content">`;
        if (helpRequests.length === 0) {
            html += '<p style="color:var(--text-secondary);font-size:0.85rem;">No help requests.</p>';
        } else {
            helpRequests.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || '')).forEach(h => {
                const statusColor = h.status === 'pending' ? 'var(--warning)' : 'var(--correct)';
                html += `<div style="padding:0.5rem 0.75rem;border-left:3px solid ${statusColor};margin-bottom:0.4rem;background:var(--bg-surface, #f8f9fa);border-radius:0 8px 8px 0;font-size:0.85rem;">
                    <div style="display:flex;justify-content:space-between;"><strong>${h.skill}</strong><span style="color:${statusColor};font-size:0.75rem;">${h.status === 'pending' ? 'Pending' : 'Addressed'}</span></div>
                    ${h.details ? `<div style="color:var(--text-secondary);margin-top:0.2rem;">${h.details}</div>` : ''}
                    ${h.adminResponse ? `<div style="color:var(--correct);margin-top:0.3rem;padding:0.3rem 0.5rem;background:var(--correct-bg);border-radius:3px;">Response: ${h.adminResponse}</div>` : ''}
                    <div style="color:var(--text-secondary);font-size:0.75rem;margin-top:0.2rem;">${h.submittedAt}</div>
                </div>`;
            });
        }
        html += '</div>';

        // No action buttons needed — this opens in a separate browser tab

        // Open in new browser tab
        const newTab = window.open('', '_blank');
        newTab.document.write(`<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fullName} — Student Profile</title>
    <link rel="stylesheet" href="${window.location.origin}/css/styles.css">
    <style>
        body { background: var(--bg-page); margin: 0; padding: 0; min-height: 100vh; }
        .profile-wrap { max-width: 100%; margin: 0; padding: 0; display: flex; flex-direction: column; min-height: 100vh; }
        .profile-header { background: var(--primary-color); color: #fff; padding: 1.25rem 2rem; }
        .profile-header h1 { margin: 0; font-size: 1.4rem; }
        .profile-body { background: var(--bg-panel); border-top: none; padding: 1.5rem 2rem; flex: 1; }
        .tab-bar { display: flex; gap: 0.4rem; margin-bottom: 1.25rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; }
        .tab-btn { padding: 0.5rem 1.25rem; font-size: 0.9rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-surface, #f8f9fa); cursor: pointer; font-family: inherit; }
        .tab-btn.active { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .data-table { width: 100%; }
        .profile-body h4 { font-size: 1rem; }
        .profile-body .tab-content { font-size: 0.95rem; }
    </style>
</head>
<body>
    <div class="profile-wrap">
        <div class="profile-header">
            <h1>${fullName}</h1>
            <div style="font-size:0.85rem;opacity:0.85;margin-top:0.25rem;">Grade ${r.grade} · ${allClasses}</div>
        </div>
        <div class="profile-body">
            <div class="tab-bar">
                <button class="tab-btn active" onclick="switchTab('info')">Profile</button>
                <button class="tab-btn" onclick="switchTab('scores')">Scores (${allScores.length})</button>
                <button class="tab-btn" onclick="switchTab('requests')">Requests (${helpRequests.length})</button>
                <button class="tab-btn" onclick="switchTab('assign')">Assign Test</button>
            </div>
            ${html}
            <div id="student-tab-assign" class="tab-content">
                <div style="display:flex;gap:0.4rem;margin-bottom:1rem;border-bottom:1px solid var(--border-color);padding-bottom:0.4rem;">
                    <button class="tab-btn active" id="sa-tab-standard" onclick="switchAssignMode('standard')">PSSA / Keystone</button>
                    <button class="tab-btn" id="sa-tab-custom" onclick="switchAssignMode('custom')">Custom Test</button>
                </div>
                <div id="sa-standard">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;max-width:700px;">
                        <div>
                            <label style="font-size:0.8rem;font-weight:600;">Test Type</label>
                            <select id="sa-type" style="width:100%;padding:0.4rem;border:1px solid var(--border-color);border-radius:8px;" onchange="document.getElementById('sa-pssa').style.display=this.value==='pssa'?'':'none';document.getElementById('sa-keystone').style.display=this.value==='keystone'?'':'none'">
                                <option value="pssa">PSSA</option>
                                <option value="keystone">Keystone</option>
                            </select>
                        </div>
                        <div id="sa-pssa">
                            <label style="font-size:0.8rem;font-weight:600;">Grade</label>
                            <select id="sa-grade" style="width:100%;padding:0.4rem;border:1px solid var(--border-color);border-radius:8px;">
                                <option value="3">Grade 3</option><option value="4">Grade 4</option><option value="5">Grade 5</option>
                                <option value="6">Grade 6</option><option value="7">Grade 7</option><option value="8">Grade 8</option>
                            </select>
                        </div>
                        <div id="sa-keystone" style="display:none;">
                            <label style="font-size:0.8rem;font-weight:600;">Subject</label>
                            <select id="sa-subject" style="width:100%;padding:0.4rem;border:1px solid var(--border-color);border-radius:8px;">
                                <option value="algebra">Algebra I</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size:0.8rem;font-weight:600;">Questions</label>
                            <input type="number" id="sa-count" value="20" min="5" max="50" style="width:100%;padding:0.4rem;border:1px solid var(--border-color);border-radius:8px;">
                        </div>
                        <div>
                            <label style="font-size:0.8rem;font-weight:600;">Test Name</label>
                            <input type="text" id="sa-name" placeholder="Optional..." style="width:100%;padding:0.4rem;border:1px solid var(--border-color);border-radius:8px;">
                        </div>
                        <div>
                            <label style="font-size:0.8rem;font-weight:600;">Due Date</label>
                            <input type="date" id="sa-due" style="width:100%;padding:0.4rem;border:1px solid var(--border-color);border-radius:8px;">
                        </div>
                        <div>
                            <label style="font-size:0.8rem;font-weight:600;">Time Limit (min)</label>
                            <input type="number" id="sa-timer" placeholder="—" min="1" max="180" style="width:100%;padding:0.4rem;border:1px solid var(--border-color);border-radius:8px;">
                        </div>
                    </div>
                    <button onclick="assignToStudent()" style="margin-top:1rem;padding:0.5rem 1.5rem;background:var(--primary-color);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;">Assign Test</button>
                    <div id="sa-status" style="margin-top:0.5rem;font-size:0.85rem;"></div>
                </div>
                <div id="sa-custom" style="display:none;">
                    <textarea id="sa-custom-input" placeholder="Paste problems here with A) B) C) D) options and ANSWERS section..." style="width:100%;min-height:120px;padding:0.5rem;border:1px solid var(--border-color);border-radius:8px;font-family:inherit;margin-bottom:0.5rem;"></textarea>
                    <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.75rem;">
                        <label><input type="checkbox" id="sa-custom-dynamic" checked> Dynamic</label>
                        <button onclick="processStudentCustom()" style="padding:0.4rem 0.8rem;background:var(--primary-color);color:#fff;border:none;border-radius:8px;cursor:pointer;">Process</button>
                        <span id="sa-custom-status" style="font-size:0.85rem;"></span>
                    </div>
                    <div id="sa-custom-preview"></div>
                    <div id="sa-custom-save" style="display:none;border-top:1px solid var(--border-color);padding-top:0.75rem;margin-top:0.5rem;">
                        <div style="display:flex;gap:0.5rem;align-items:flex-end;">
                            <div><label style="font-size:0.8rem;font-weight:600;">Name</label><input type="text" id="sa-custom-name" placeholder="Test name..." style="padding:0.4rem;border:1px solid var(--border-color);border-radius:8px;"></div>
                            <div><label style="font-size:0.8rem;font-weight:600;">Due</label><input type="date" id="sa-custom-due" style="padding:0.4rem;border:1px solid var(--border-color);border-radius:8px;"></div>
                            <button onclick="saveStudentCustom()" style="padding:0.4rem 1rem;background:var(--primary-color);color:#fff;border:none;border-radius:8px;cursor:pointer;">Save & Assign</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script src="${window.location.origin}/js/firebase-config.js" type="module"><\/script>
    <script src="${window.location.origin}/js/utils.js"><\/script>
    <script src="${window.location.origin}/js/dynamic-gen.js"><\/script>
    <script>
        const STUDENT_KEY = '${studentKey}';
        const STUDENT_NAME = '${fullName}';

        function switchTab(tab) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-bar > .tab-btn').forEach(btn => { btn.classList.remove('active'); btn.style.background='var(--bg-surface)'; btn.style.color='var(--text-main)'; btn.style.borderColor='var(--border-color)'; });
            const el = document.getElementById('student-tab-' + tab);
            if (el) el.classList.add('active');
            event.target.classList.add('active');
            event.target.style.background='var(--primary-color)';
            event.target.style.color='#fff';
            event.target.style.borderColor='var(--primary-color)';
        }

        function switchAssignMode(mode) {
            document.getElementById('sa-standard').style.display = mode === 'standard' ? '' : 'none';
            document.getElementById('sa-custom').style.display = mode === 'custom' ? '' : 'none';
            document.getElementById('sa-tab-standard').classList.toggle('active', mode === 'standard');
            document.getElementById('sa-tab-custom').classList.toggle('active', mode === 'custom');
            document.getElementById('sa-tab-standard').style.background = mode === 'standard' ? 'var(--primary-color)' : 'var(--bg-surface)';
            document.getElementById('sa-tab-standard').style.color = mode === 'standard' ? '#fff' : 'var(--text-main)';
            document.getElementById('sa-tab-custom').style.background = mode === 'custom' ? 'var(--primary-color)' : 'var(--bg-surface)';
            document.getElementById('sa-tab-custom').style.color = mode === 'custom' ? '#fff' : 'var(--text-main)';
        }

        function assignToStudent() {
            const statusEl = document.getElementById('sa-status');
            // Use opener window's functions
            if (!window.opener || !window.opener.getAssignments) { statusEl.textContent = 'Error: parent window closed.'; return; }
            const type = document.getElementById('sa-type').value;
            const assignments = window.opener.getAssignments();
            const targetKey = 'student:' + STUDENT_KEY;
            if (!assignments[targetKey]) assignments[targetKey] = [];
            let item;
            if (type === 'pssa') {
                item = { type: 'pssa', grade: parseInt(document.getElementById('sa-grade').value), redemption: true, questionCount: parseInt(document.getElementById('sa-count').value) || 20, assignedAt: new Date().toLocaleDateString() };
            } else {
                item = { type: 'keystone', subject: document.getElementById('sa-subject').value, redemption: true, questionCount: parseInt(document.getElementById('sa-count').value) || 20, assignedAt: new Date().toLocaleDateString() };
            }
            const name = document.getElementById('sa-name').value.trim();
            const due = document.getElementById('sa-due').value;
            const timer = parseInt(document.getElementById('sa-timer').value) || 0;
            if (name) item.name = name;
            if (due) item.dueDate = due;
            if (timer > 0) item.timerMinutes = timer;
            assignments[targetKey].push(item);
            window.opener.saveAssignments(assignments);
            statusEl.innerHTML = '<span style="color:var(--correct);">Test assigned to ' + STUDENT_NAME + '!</span>';
        }

        let _saCustomQs = [];
        function processStudentCustom() {
            const raw = document.getElementById('sa-custom-input').value.trim();
            if (!raw || !window.opener || !window.opener.fallbackParse) return;
            _saCustomQs = window.opener.fallbackParse(raw);
            const statusEl = document.getElementById('sa-custom-status');
            if (_saCustomQs.length > 0) {
                statusEl.textContent = _saCustomQs.length + ' questions parsed';
                statusEl.style.color = 'green';
                document.getElementById('sa-custom-save').style.display = '';
                document.getElementById('sa-custom-preview').innerHTML = _saCustomQs.map((q,i) => '<div style="padding:0.3rem 0;border-bottom:1px solid #eee;font-size:0.85rem;"><strong>Q'+(i+1)+':</strong> '+q.text.substring(0,80)+'</div>').join('');
            } else {
                statusEl.textContent = 'No questions found.';
                statusEl.style.color = 'red';
            }
        }

        function saveStudentCustom() {
            if (!_saCustomQs.length || !window.opener) return;
            const name = document.getElementById('sa-custom-name').value.trim() || 'Custom Test';
            const due = document.getElementById('sa-custom-due').value;
            const testId = 'custom_' + Date.now();
            const testData = { id: testId, name, createdAt: new Date().toLocaleDateString(), questions: _saCustomQs };
            window.opener.saveCustomTestData(testId, testData);
            const assignments = window.opener.getAssignments();
            const targetKey = 'student:' + STUDENT_KEY;
            if (!assignments[targetKey]) assignments[targetKey] = [];
            const item = { type: 'custom', testId, name, redemption: true, assignedAt: new Date().toLocaleDateString() };
            if (due) item.dueDate = due;
            assignments[targetKey].push(item);
            window.opener.saveAssignments(assignments);
            _saCustomQs = [];
            document.getElementById('sa-custom-input').value = '';
            document.getElementById('sa-custom-preview').innerHTML = '';
            document.getElementById('sa-custom-save').style.display = 'none';
            document.getElementById('sa-custom-status').textContent = '';
            alert('"' + name + '" assigned to ' + STUDENT_NAME + '!');
        }
    <\/script>
</body>
</html>`);
        newTab.document.close();
    } catch (e) {
        console.error(e);
    }
}

async function removeFromRoster(docId) {
    if (!(await showConfirm('Remove this student from the roster? This cannot be undone.', 'Remove Student'))) return;
    try {
        await fbRemoveFromRoster(docId);
        renderRoster();
    } catch (e) {
        alert('Failed to remove: ' + e.message);
    }
}

// ========== DATA HELPERS (Firebase + localStorage fallback) ==========

// Local caches — populated from Firebase on load, used for sync reads
let _assignmentsCache = null;
let _scoresCache = null;
let _customTestsCache = null;

function getAssignments() {
    if (_assignmentsCache) return _assignmentsCache;
    const data = localStorage.getItem('mathsite_assignments');
    return data ? JSON.parse(data) : {};
}

function saveAssignments(assignments) {
    _assignmentsCache = assignments;
    localStorage.setItem('mathsite_assignments', JSON.stringify(assignments));
    // Sync to Firebase in background
    if (typeof fbSaveAssignments === 'function') {
        fbSaveAssignments(assignments).catch(e => console.error('Firebase save assignments failed:', e));
    }
}

function getScores() {
    if (_scoresCache) return _scoresCache;
    const data = localStorage.getItem('mathsite_scores');
    return data ? JSON.parse(data) : [];
}

function saveScore(record) {
    const scores = getScores();
    scores.push(record);
    _scoresCache = scores;
    localStorage.setItem('mathsite_scores', JSON.stringify(scores));
    // Sync to Firebase — queue if offline
    if (typeof fbSaveScore === 'function') {
        fbSaveScore(record).catch(() => {
            // Firebase write failed (likely offline) — queue for later
            const pending = JSON.parse(localStorage.getItem('mathsite_pending_sync') || '[]');
            pending.push({ type: 'score', data: record, timestamp: Date.now() });
            localStorage.setItem('mathsite_pending_sync', JSON.stringify(pending));
        });
    }
}

function flushPendingSync() {
    const pending = JSON.parse(localStorage.getItem('mathsite_pending_sync') || '[]');
    if (pending.length === 0) return;

    const remaining = [];
    pending.forEach(item => {
        if (item.type === 'score' && typeof fbSaveScore === 'function') {
            fbSaveScore(item.data).catch(() => remaining.push(item));
        } else {
            remaining.push(item);
        }
    });

    // Wait a bit then save whatever failed again
    setTimeout(() => {
        localStorage.setItem('mathsite_pending_sync', JSON.stringify(remaining));
        if (remaining.length === 0) {
            console.log('All pending syncs flushed');
        }
    }, 3000);
}

async function clearAllScores() {
    if (!(await showConfirm('Clear all student scores? This cannot be undone.'))) return;
    _scoresCache = [];
    localStorage.removeItem('mathsite_scores');
    if (typeof fbClearScores === 'function') {
        try { await fbClearScores(); } catch(e) { console.error(e); }
    }
    renderAdminScores();
}

async function deleteScore(index) {
    if (!(await showConfirm('Delete this score?'))) return;
    const scores = getScores();
    const removed = scores[index];
    scores.splice(index, 1);
    _scoresCache = scores;
    localStorage.setItem('mathsite_scores', JSON.stringify(scores));
    // Delete from Firebase if it has an id
    if (removed && removed.id && typeof fbDeleteScore === 'function') {
        try { await fbDeleteScore(removed.id); } catch(e) { console.error(e); }
    }
    renderAdminScores();
}

function exportScoresCSV() {
    const scores = getScores();
    if (scores.length === 0) { alert('No scores to export.'); return; }
    if (typeof XLSX === 'undefined') {
        // Fallback to basic CSV
        let csv = 'Student,Grade,Class,Test,Type,Score,Date,Struggling Skills\n';
        scores.forEach(s => {
            const skills = (s.wrongAnswers || []).map(w => w.skill || w.type || '').filter(Boolean).join('; ');
            csv += `"${s.studentDisplayName || ''}","${s.studentGrade || ''}","${getClassDisplayName(s.studentClass) || ''}","${s.testLevel || ''}","${s.source === 'assigned' ? 'Assigned' : 'Practice'}","${s.terminated ? 'TERMINATED' : (s.accuracy || 0) + '%'}","${s.completedAt || ''}","${skills}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'scores_' + new Date().toISOString().split('T')[0] + '.csv'; a.click();
        return;
    }

    const wb = XLSX.utils.book_new();
    const classOrder = ['3', '4/5', '5/6', '6', '6/7', '7/8', 'alg1', 'adv-alg1', 'alg2', 'alg2-geo', 'precalc', 'math-analysis'];

    function scoreToRow(s) {
        const wrongSkills = (s.wrongAnswers || []).map(w => w.skill || w.type || 'Unknown').filter(Boolean);
        const skillCounts = {};
        wrongSkills.forEach(sk => { skillCounts[sk] = (skillCounts[sk] || 0) + 1; });
        const topStruggles = Object.entries(skillCounts).sort((a,b) => b[1]-a[1]).slice(0,3).map(([sk,n]) => `${sk} (${n}x)`).join(', ');

        return {
            'Student': s.studentDisplayName || s.student || '',
            'Grade': s.studentGrade || '',
            'Class': s.studentClass ? getClassDisplayName(s.studentClass) : '',
            'Test': s.testLevel || '',
            'Type': s.source === 'assigned' ? 'Assigned' : 'Practice',
            'Score': s.terminated ? 'TERMINATED' : (s.accuracy || 0) + '%',
            'Questions': s.totalQuestions || s.baseItemCount || '',
            'Correct': s.initialScore || '',
            'Wrong': (s.wrongAnswers || []).length,
            'Struggling Skills': topStruggles,
            'Date': s.completedAt || ''
        };
    }

    // "All Scores" sheet
    const allData = scores.map(scoreToRow);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allData), 'All Scores');

    // Group by class
    const byClass = {};
    scores.forEach(s => {
        const cls = s.studentClass || 'Other';
        if (!byClass[cls]) byClass[cls] = [];
        byClass[cls].push(s);
    });

    const sorted = Object.keys(byClass).sort((a, b) => {
        const ai = classOrder.indexOf(a), bi = classOrder.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    sorted.forEach(cls => {
        const data = byClass[cls].map(scoreToRow);
        const sheetName = getClassDisplayName(cls).substring(0, 31);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), sheetName);
    });

    // Summary sheet
    const summaryData = sorted.map(cls => {
        const classScores = byClass[cls].filter(s => !s.terminated);
        const avg = classScores.length > 0 ? (classScores.reduce((sum, s) => sum + parseFloat(s.accuracy || 0), 0) / classScores.length).toFixed(1) : 'N/A';
        const allWrong = classScores.flatMap(s => s.wrongAnswers || []);
        const skillCounts = {};
        allWrong.forEach(w => { const sk = w.skill || w.type || 'Unknown'; skillCounts[sk] = (skillCounts[sk] || 0) + 1; });
        const topSkill = Object.entries(skillCounts).sort((a,b) => b[1]-a[1])[0];

        return {
            'Class': getClassDisplayName(cls),
            'Students Tested': classScores.length,
            'Average Score': avg + '%',
            'Highest': classScores.length > 0 ? Math.max(...classScores.map(s => parseFloat(s.accuracy || 0))).toFixed(1) + '%' : 'N/A',
            'Lowest': classScores.length > 0 ? Math.min(...classScores.map(s => parseFloat(s.accuracy || 0))).toFixed(1) + '%' : 'N/A',
            'Top Struggling Skill': topSkill ? `${topSkill[0]} (${topSkill[1]}x)` : 'None'
        };
    });
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    XLSX.writeFile(wb, 'scores_' + new Date().toISOString().split('T')[0] + '.xlsx');
}

function getCustomTests() {
    if (_customTestsCache) return _customTestsCache;
    const data = localStorage.getItem('mathsite_custom_tests');
    return data ? JSON.parse(data) : {};
}

function saveCustomTestData(testId, testData) {
    const tests = getCustomTests();
    tests[testId] = testData;
    _customTestsCache = tests;
    localStorage.setItem('mathsite_custom_tests', JSON.stringify(tests));
    // Sync to Firebase in background
    if (typeof fbSaveCustomTest === 'function') {
        fbSaveCustomTest(testId, testData).catch(e => console.error('Firebase save custom test failed:', e));
    }
}

// Pull data from Firebase into local cache on page load
async function syncFromFirebase() {
    if (typeof fbGetAssignments !== 'function') return;
    try {
        const [assignments, scores, customTests] = await Promise.all([
            fbGetAssignments(),
            fbGetScores(),
            fbGetCustomTests()
        ]);
        if (assignments && Object.keys(assignments).length > 0) {
            _assignmentsCache = assignments;
            localStorage.setItem('mathsite_assignments', JSON.stringify(assignments));
        }
        if (scores && scores.length > 0) {
            _scoresCache = scores;
            localStorage.setItem('mathsite_scores', JSON.stringify(scores));
        }
        if (customTests && Object.keys(customTests).length > 0) {
            _customTestsCache = customTests;
            localStorage.setItem('mathsite_custom_tests', JSON.stringify(customTests));
        }
        console.log('Firebase sync complete');
    } catch(e) {
        console.error('Firebase sync failed, using localStorage:', e);
    }
}

// Start sync after a short delay to let Firebase module load
setTimeout(syncFromFirebase, 1000);

// ========== ADMIN PANEL ==========

function updateAdminTestOptions() {
    const testType = document.getElementById('admin-test-type').value;
    document.getElementById('admin-pssa-options').classList.toggle('hidden', testType !== 'pssa');
    document.getElementById('admin-keystone-options').classList.toggle('hidden', testType !== 'keystone');
    const customOpts = document.getElementById('admin-custom-options');
    if (customOpts) customOpts.classList.toggle('hidden', testType !== 'custom');
    // Hide question count, grade fields for custom tests
    const qcRow = document.getElementById('admin-question-count');
    if (qcRow) qcRow.closest('.admin-form-row').style.display = testType === 'custom' ? 'none' : '';
}

function goToCustomTestCreator() {
    // Remember which class we were assigning to
    const assignBy = document.getElementById('admin-assign-by');
    const cls = document.getElementById('admin-target-class');
    if (assignBy && assignBy.value === 'class' && cls && cls.value) {
        window._customTestTargetClass = cls.value;
    }
    // Switch to custom subtab within assignments page
    if (typeof switchAssignSubtab === 'function') {
        switchAssignSubtab('custom');
    }
}

async function searchStudentForAssign(query, resultsId) {
    const container = document.getElementById(resultsId);
    if (!container) return;
    if (!query || query.length < 2) { container.style.display = 'none'; return; }

    try {
        const roster = await fbGetRoster();
        const q = query.toLowerCase();
        const matches = roster.filter(r => (r.firstName + ' ' + r.lastName).toLowerCase().includes(q)).slice(0, 8);

        if (matches.length === 0) {
            container.innerHTML = '<div style="padding:0.5rem;color:var(--text-secondary);font-size:0.85rem;">No students found</div>';
            container.style.display = 'block';
            return;
        }

        container.innerHTML = matches.map(r => {
            const name = formatName(r.firstName) + ' ' + formatName(r.lastName);
            return `<div style="padding:0.5rem 0.75rem;cursor:pointer;font-size:0.85rem;border-bottom:1px solid var(--border-color);" onmouseover="this.style.background='var(--bg-highlight, #e6f2ff)'" onmouseout="this.style.background=''" onclick="selectStudentForAssign('${name}','${resultsId}')">${name} <span style="color:var(--text-secondary);font-size:0.8rem;">— ${getClassDisplayName(r.class)}</span></div>`;
        }).join('');
        container.style.display = 'block';
    } catch (e) {
        container.style.display = 'none';
    }
}

function selectStudentForAssign(name, resultsId) {
    // Find the input that corresponds to this results container
    const container = document.getElementById(resultsId);
    if (container) container.style.display = 'none';

    if (resultsId === 'admin-student-results') {
        document.getElementById('admin-target-student').value = name;
    } else if (resultsId === 'custom-student-results') {
        document.getElementById('custom-target-student').value = name;
    }
}

function quickAssignTest(cls) {
    const label = getClassDisplayName(cls);

    // Hide all admin pages
    document.querySelectorAll('.admin-page').forEach(p => p.classList.add('hidden'));

    // Show or create the quick-assign page
    let page = document.getElementById('admin-page-quick-assign');
    if (!page) {
        page = document.createElement('div');
        page.id = 'admin-page-quick-assign';
        page.className = 'admin-page';
        document.querySelector('.admin-dashboard-grid').appendChild(page);
    }
    page.classList.remove('hidden');

    // Update sidebar
    document.querySelectorAll('#admin-sidebar .sidebar-item').forEach(btn => btn.classList.remove('active'));

    // Build fresh form
    page.innerHTML = `
    <div class="admin-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <h3 class="admin-section-title" style="margin:0;border:none;padding:0;">Assign Test to ${label}</h3>
            <button class="btn" style="padding:0.3rem 0.7rem;font-size:0.8rem;background:var(--text-secondary);" onclick="switchAdminPage('classes',null);document.querySelectorAll('#admin-sidebar .sidebar-item').forEach(b=>{b.classList.remove('active');if(b.textContent.trim().startsWith('Classes'))b.classList.add('active')})">Back to Classes</button>
        </div>

        <div style="display:flex;gap:0.4rem;margin-bottom:1rem;border-bottom:2px solid var(--border-color);padding-bottom:0.4rem;">
            <button class="btn qa-tab active" id="qa-tab-standard" onclick="document.getElementById('qa-standard').classList.remove('hidden');document.getElementById('qa-custom').classList.add('hidden');document.querySelectorAll('.qa-tab').forEach(b=>{b.style.background='var(--bg-surface)';b.style.color='var(--text-main)';b.style.border='1px solid var(--border-color)'});this.style.background='var(--primary-color)';this.style.color='#fff';this.style.border='1px solid var(--primary-color)'" style="padding:0.4rem 1rem;font-size:0.85rem;">PSSA / Keystone</button>
            <button class="btn qa-tab" id="qa-tab-custom" onclick="document.getElementById('qa-custom').classList.remove('hidden');document.getElementById('qa-standard').classList.add('hidden');document.querySelectorAll('.qa-tab').forEach(b=>{b.style.background='var(--bg-surface)';b.style.color='var(--text-main)';b.style.border='1px solid var(--border-color)'});this.style.background='var(--primary-color)';this.style.color='#fff';this.style.border='1px solid var(--primary-color)'" style="padding:0.4rem 1rem;font-size:0.85rem;background:var(--bg-surface);color:var(--text-main);border:1px solid var(--border-color);">Custom Test</button>
        </div>

        <div id="qa-standard">
            <div class="admin-form">
                <div class="admin-form-row">
                    <label class="admin-label">Test Type</label>
                    <select id="qa-test-type" class="text-input" onchange="document.getElementById('qa-pssa-opts').classList.toggle('hidden',this.value!=='pssa');document.getElementById('qa-keystone-opts').classList.toggle('hidden',this.value!=='keystone')">
                        <option value="pssa">PSSA</option>
                        <option value="keystone">Keystone</option>
                    </select>
                </div>
                <div id="qa-pssa-opts" class="admin-form-row">
                    <label class="admin-label">PSSA Grade</label>
                    <select id="qa-grade" class="text-input">
                        <option value="3">Grade 3</option><option value="4">Grade 4</option><option value="5">Grade 5</option>
                        <option value="6">Grade 6</option><option value="7">Grade 7</option><option value="8">Grade 8</option>
                    </select>
                </div>
                <div id="qa-keystone-opts" class="admin-form-row hidden">
                    <label class="admin-label">Subject</label>
                    <select id="qa-subject" class="text-input"><option value="algebra">Algebra I</option></select>
                </div>
                <div class="admin-form-row">
                    <label class="admin-label">Number of Questions</label>
                    <input type="number" id="qa-count" class="text-input" value="20" min="5" max="50">
                </div>
                <div class="admin-form-row">
                    <label class="admin-label">Test Name (optional)</label>
                    <input type="text" id="qa-name" class="text-input" placeholder="e.g. Week 5 Quiz">
                </div>
                <div class="admin-form-row">
                    <label class="admin-label">Due Date</label>
                    <input type="date" id="qa-due" class="text-input">
                </div>
                <div class="admin-form-row">
                    <label class="admin-label">Available At (optional)</label>
                    <input type="datetime-local" id="qa-available" class="text-input">
                </div>
                <div class="admin-form-row">
                    <label class="admin-label">Time Limit (optional)</label>
                    <div style="display:flex;align-items:center;gap:0.5rem;">
                        <input type="number" id="qa-timer" class="text-input" placeholder="Minutes" min="1" max="180" style="max-width:100px;">
                        <span style="color:var(--text-secondary);font-size:0.85rem;">minutes</span>
                    </div>
                </div>
                <div class="admin-form-row">
                    <label class="checkbox-label"><input type="checkbox" id="qa-redemption" checked> Include redemption questions</label>
                </div>
                <button class="btn" onclick="submitQuickAssign('${cls}')">Assign Test</button>
            </div>
        </div>

        <div id="qa-custom" class="hidden">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:0.75rem;">Paste problems, process them, then assign.</p>
            <div class="admin-form-row">
                <label class="admin-label">Paste Your Problems</label>
                <textarea id="qa-custom-input" class="custom-textarea" placeholder="Paste problems here..."></textarea>
            </div>
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.75rem;margin-bottom:1rem;">
                <label class="checkbox-label"><input type="checkbox" id="qa-custom-dynamic" checked> Make Dynamic</label>
                <button class="btn" onclick="processQuickAssignCustom('${cls}')">Process Questions</button>
                <span id="qa-custom-status" class="process-status"></span>
            </div>
            <div id="qa-custom-preview"></div>
            <div id="qa-custom-save" class="hidden" style="border-top:1px solid var(--border-color);padding-top:1rem;margin-top:0.5rem;">
                <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:flex-end;">
                    <div><label class="admin-label">Test Name</label><input type="text" id="qa-custom-name" class="text-input" placeholder="e.g. Chapter Review" style="margin-bottom:0;"></div>
                    <div><label class="admin-label">Due Date</label><input type="date" id="qa-custom-due" class="text-input" style="margin-bottom:0;"></div>
                    <div><label class="admin-label">Time Limit (min)</label><input type="number" id="qa-custom-timer" class="text-input" placeholder="—" min="1" max="180" style="width:80px;margin-bottom:0;"></div>
                    <button class="btn" onclick="saveQuickAssignCustom('${cls}')">Save & Assign</button>
                </div>
            </div>
        </div>
    </div>`;

    window.scrollTo(0, 0);
}

window._qaCustomQuestions = [];

function submitQuickAssign(cls) {
    const testType = document.getElementById('qa-test-type').value;
    const redemption = document.getElementById('qa-redemption').checked;
    const questionCount = parseInt(document.getElementById('qa-count').value) || 20;
    const name = (document.getElementById('qa-name').value || '').trim();
    const dueDate = document.getElementById('qa-due').value;
    const available = document.getElementById('qa-available').value;
    const timer = parseInt(document.getElementById('qa-timer').value) || 0;

    const targetKey = 'class:' + cls;
    const assignments = getAssignments();
    if (!assignments[targetKey]) assignments[targetKey] = [];

    let testItem;
    if (testType === 'pssa') {
        testItem = { type: 'pssa', grade: parseInt(document.getElementById('qa-grade').value), redemption, questionCount, assignedAt: new Date().toLocaleDateString() };
    } else {
        testItem = { type: 'keystone', subject: document.getElementById('qa-subject').value, redemption, questionCount, assignedAt: new Date().toLocaleDateString() };
    }
    if (name) testItem.name = name;
    if (dueDate) testItem.dueDate = dueDate;
    if (available) testItem.availableAt = available;
    if (timer > 0) testItem.timerMinutes = timer;

    assignments[targetKey].push(testItem);
    saveAssignments(assignments);
    alert(`Test assigned to ${getClassDisplayName(cls)}!`);
}

function processQuickAssignCustom(cls) {
    const raw = document.getElementById('qa-custom-input').value.trim();
    if (!raw) return;
    const statusEl = document.getElementById('qa-custom-status');
    statusEl.textContent = 'Processing...';
    window._qaCustomQuestions = fallbackParse(raw);

    if (document.getElementById('qa-custom-dynamic').checked && window._qaCustomQuestions.length > 0 && typeof extractNumbers === 'function') {
        window._qaCustomQuestions.forEach(q => {
            const nums = extractNumbers(q.text);
            const ansNum = parseFloat((q.correct || '').replace(/[,$%]/g, ''));
            if (nums.length >= 2 && !isNaN(ansNum)) {
                const op = detectOperation(nums, ansNum);
                if (op) { q._descriptor = buildDescriptor(q.text, nums, op, ansNum); return; }
            }
            if (typeof buildCosmeticDescriptor === 'function') {
                const cosmetic = buildCosmeticDescriptor(q.text, q.correct, q.options || []);
                if (cosmetic) q._descriptor = cosmetic;
            }
        });
    }

    if (window._qaCustomQuestions.length > 0) {
        statusEl.textContent = window._qaCustomQuestions.length + ' questions parsed';
        statusEl.className = 'process-status done';
        document.getElementById('qa-custom-save').classList.remove('hidden');
        const rm = typeof renderMathInHTML === 'function' ? renderMathInHTML : (x => x);
        let preview = '';
        window._qaCustomQuestions.forEach((q, i) => { preview += `<div style="padding:0.4rem 0;border-bottom:1px solid var(--border-color);font-size:0.85rem;"><strong>Q${i+1}:</strong> ${rm(q.text.substring(0, 80))}${q.text.length > 80 ? '...' : ''}</div>`; });
        document.getElementById('qa-custom-preview').innerHTML = preview;
    } else {
        statusEl.textContent = 'No questions found.';
        statusEl.className = 'process-status error';
    }
}

function saveQuickAssignCustom(cls) {
    if (window._qaCustomQuestions.length === 0) return;
    const name = (document.getElementById('qa-custom-name').value || '').trim() || 'Custom Test';
    const dueDate = document.getElementById('qa-custom-due').value;
    const timer = parseInt(document.getElementById('qa-custom-timer').value) || 0;
    const testId = 'custom_' + Date.now();

    const hasDynamic = window._qaCustomQuestions.some(q => q._descriptor);
    let testData;
    if (hasDynamic) {
        testData = { id: testId, name, dynamic: true, descriptors: window._qaCustomQuestions.filter(q => q._descriptor).map(q => q._descriptor), staticQuestions: window._qaCustomQuestions.filter(q => !q._descriptor), createdAt: new Date().toLocaleDateString() };
    } else {
        testData = { id: testId, name, createdAt: new Date().toLocaleDateString(), questions: window._qaCustomQuestions };
    }
    saveCustomTestData(testId, testData);

    const targetKey = 'class:' + cls;
    const assignments = getAssignments();
    if (!assignments[targetKey]) assignments[targetKey] = [];
    const assignItem = { type: 'custom', testId, name, redemption: true, assignedAt: new Date().toLocaleDateString() };
    if (dueDate) assignItem.dueDate = dueDate;
    if (timer > 0) assignItem.timerMinutes = timer;
    assignments[targetKey].push(assignItem);
    saveAssignments(assignments);

    window._qaCustomQuestions = [];
    alert(`"${name}" assigned to ${getClassDisplayName(cls)}!`);
}

function updateAssignByOptions() {
    const assignBy = document.getElementById('admin-assign-by').value;
    document.getElementById('admin-assign-grade-row').classList.toggle('hidden', assignBy !== 'grade');
    document.getElementById('admin-assign-class-row').classList.toggle('hidden', assignBy !== 'class');
    const studentRow = document.getElementById('admin-assign-student-row');
    if (studentRow) studentRow.classList.toggle('hidden', assignBy !== 'student');
    renderContextualAssignments();
}

function getSelectedTargetKey() {
    const assignBy = (document.getElementById('admin-assign-by') || {}).value;
    if (assignBy === 'class') return 'class:' + (document.getElementById('admin-target-class') || {}).value;
    if (assignBy === 'student') return 'student:' + ((document.getElementById('admin-target-student') || {}).value || '').toLowerCase();
    return 'grade:' + (document.getElementById('admin-target-grade') || {}).value;
}

function renderContextualAssignments() {
    const container = document.getElementById('admin-assignments-context');
    if (!container) return;

    const targetKey = getSelectedTargetKey();
    const assignments = getAssignments();
    const tests = assignments[targetKey] || [];
    const targetLabel = formatAssignmentTarget(targetKey);

    if (tests.length === 0) {
        container.innerHTML = `<p style="color:var(--text-secondary);font-size:0.85rem;">No tests currently assigned to <strong>${targetLabel}</strong>.</p>`;
        return;
    }

    let html = `<h4 style="font-size:0.9rem;color:var(--primary-color);margin-bottom:0.5rem;">Current tests for ${targetLabel}</h4>`;
    tests.forEach((test, index) => {
        const testLabel = test.name || (test.type === 'pssa' ? `PSSA Grade ${test.grade}` : test.type === 'custom' ? test.name : `Keystone ${(test.subject || '').charAt(0).toUpperCase() + (test.subject || '').slice(1)}`);
        const dueLabel = test.dueDate || '';
        const isExpired = test.dueDate && new Date(test.dueDate + 'T23:59:59') < new Date();
        const dueStyle = isExpired ? 'color:var(--incorrect);' : 'color:var(--text-secondary);';

        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0.75rem;border-left:3px solid var(--primary-color);margin-bottom:0.4rem;background:var(--bg-surface, #f8f9fa);border-radius:0 8px 8px 0;">
            <div>
                <span style="font-weight:500;font-size:0.9rem;">${testLabel}</span>
                ${dueLabel ? `<span style="font-size:0.75rem;margin-left:0.5rem;${dueStyle}">Due: ${dueLabel}${isExpired ? ' (expired)' : ''}</span>` : ''}
                <span style="font-size:0.75rem;color:var(--text-secondary);margin-left:0.5rem;">Assigned: ${test.assignedAt}</span>
            </div>
            <button class="btn" style="padding:0.2rem 0.5rem;font-size:0.7rem;background:var(--incorrect);" onclick="removeAssignment('${targetKey}',${index});renderContextualAssignments()">Remove</button>
        </div>`;
    });

    container.innerHTML = html;
}

function assignTest() {
    const assignBy = document.getElementById('admin-assign-by').value;
    const testType = document.getElementById('admin-test-type').value;
    const redemption = document.getElementById('admin-redemption').checked;
    const dueDateVal = document.getElementById('admin-due-date').value;
    const timerMinutes = parseInt(document.getElementById('admin-timer-minutes').value) || 0;
    const testNameEl = document.getElementById('admin-test-name');
    const testName = testNameEl ? testNameEl.value.trim() : '';
    const questionCount = parseInt(document.getElementById('admin-question-count').value) || 20;
    const assignments = getAssignments();

    let targetKey;
    if (assignBy === 'class') {
        targetKey = 'class:' + document.getElementById('admin-target-class').value;
    } else if (assignBy === 'student') {
        const studentInput = document.getElementById('admin-target-student');
        const studentName = studentInput ? studentInput.value.trim() : '';
        if (!studentName) { alert('Please select a student.'); return; }
        targetKey = 'student:' + studentName.toLowerCase();
    } else {
        targetKey = 'grade:' + document.getElementById('admin-target-grade').value;
    }

    if (!assignments[targetKey]) {
        assignments[targetKey] = [];
    }

    let testItem;
    if (testType === 'pssa') {
        const grade = parseInt(document.getElementById('admin-grade').value);
        testItem = { type: 'pssa', grade, redemption, questionCount, assignedAt: new Date().toLocaleDateString() };
    } else if (testType === 'custom') {
        goToCustomTestCreator();
        return;
    } else {
        const subject = document.getElementById('admin-subject').value;
        testItem = { type: 'keystone', subject, redemption, questionCount, assignedAt: new Date().toLocaleDateString() };
    }

    if (dueDateVal) testItem.dueDate = dueDateVal;
    if (timerMinutes > 0) testItem.timerMinutes = timerMinutes;
    if (testName) testItem.name = testName;
    const availableAtEl = document.getElementById('admin-available-at');
    if (availableAtEl && availableAtEl.value) testItem.availableAt = availableAtEl.value;
    const vpEl = document.getElementById('admin-visible-parent');
    if (vpEl && vpEl.checked) testItem.visibleToParent = true;

    assignments[targetKey].push(testItem);
    saveAssignments(assignments);
    renderAdminAssignments();

    // Clear fields after assigning
    document.getElementById('admin-due-date').value = '';
    document.getElementById('admin-timer-minutes').value = '';
    if (availableAtEl) availableAtEl.value = '';
    if (testNameEl) testNameEl.value = '';
}

function previewTest() {
    const testType = document.getElementById('admin-test-type').value;
    const qcEl = document.getElementById('admin-question-count');
    const questionCount = qcEl ? (parseInt(qcEl.value) || 5) : 5;
    let questions = [];
    let title = '';

    if (testType === 'pssa') {
        const grade = parseInt(document.getElementById('admin-grade').value);
        title = `PSSA Grade ${grade} Preview (${questionCount} questions)`;
        const pool = getExtraTemplatePool('pssa', String(grade));
        const source = pool.length > 0 ? pool : (Templates[grade] || Templates[8]);
        for (let i = 0; i < questionCount; i++) {
            try { questions.push(constructItem(source[i % source.length])); } catch(e) {}
        }
    } else {
        const subject = document.getElementById('admin-subject').value;
        const subjectLabel = subject.charAt(0).toUpperCase() + subject.slice(1);
        title = `Keystone ${subjectLabel} Preview (${questionCount} questions)`;
        const pool = getExtraTemplatePool('keystone', subject + '1').length > 0
            ? getExtraTemplatePool('keystone', subject + '1')
            : getExtraTemplatePool('keystone', subject);
        const source = pool.length > 0 ? pool : (Templates[subject] || Templates.algebra || []);
        for (let i = 0; i < questionCount; i++) {
            try { questions.push(constructItem(source[i % source.length])); } catch(e) {}
        }
    }

    questions = questions.filter(q => q && q.text && q.correct);
    if (questions.length === 0) {
        showAlert('Could not generate preview questions.', 'error');
        return;
    }

    let html = '';
    questions.forEach((q, i) => {
        html += `<div style="margin-bottom:1.25rem;padding:0.75rem;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-surface);">`;
        html += `<div style="font-weight:700;font-size:0.8rem;color:var(--primary-color);margin-bottom:0.35rem;">Question ${i + 1}</div>`;
        html += `<div style="margin-bottom:0.5rem;">${renderMathInHTML(q.text)}</div>`;
        if (q.options) {
            q.options.forEach(opt => {
                const isCorrect = String(opt) === String(q.correct);
                html += `<div style="padding:0.3rem 0.5rem;margin-bottom:0.2rem;border-radius:3px;font-size:0.9rem;${isCorrect ? 'background:var(--correct-bg);color:var(--correct);font-weight:700;' : ''}">${isCorrect ? '✓ ' : ''}${renderMathInHTML(opt)}</div>`;
            });
        } else {
            html += `<div style="color:var(--correct);font-weight:700;font-size:0.9rem;">Answer: ${renderMathInHTML(q.correct)}</div>`;
        }
        html += `</div>`;
    });

    document.getElementById('preview-title').textContent = title;
    document.getElementById('preview-content').innerHTML = html;
    document.getElementById('preview-modal').classList.remove('hidden');
}

async function removeAssignment(studentName, index) {
    if (!(await showConfirm('Remove this assignment?', 'Remove Assignment'))) return;
    const assignments = getAssignments();
    if (assignments[studentName]) {
        assignments[studentName].splice(index, 1);
        if (assignments[studentName].length === 0) {
            delete assignments[studentName];
        }
        saveAssignments(assignments);
        renderAdminAssignments();
    }
}

function formatAssignmentTarget(key) {
    if (key.startsWith('class:')) {
        return getClassDisplayName(key.substring(6));
    } else if (key.startsWith('grade:')) {
        return 'Grade ' + key.substring(6);
    } else if (key.startsWith('student:')) {
        return key.substring(8);
    }
    return key === 'HS' ? 'High School' : `Grade ${key}`;
}

function renderAdminAssignments() {
    const assignments = getAssignments();
    const container = document.getElementById('admin-assignments-list');

    const allKeys = Object.keys(assignments).filter(k => assignments[k].length > 0);
    if (allKeys.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No tests assigned yet.</p>';
        return;
    }

    // Sort: classes first, then grades, then students
    const classOrder = ['3', '4/5', '5/6', '6', '6/7', '7/8', 'alg1', 'adv-alg1', 'alg2', 'alg2-geo', 'precalc', 'math-analysis'];
    allKeys.sort((a, b) => {
        const aVal = a.startsWith('class:') ? classOrder.indexOf(a.substring(6)) : a.startsWith('grade:') ? 100 + parseInt(a.substring(6)) : 200;
        const bVal = b.startsWith('class:') ? classOrder.indexOf(b.substring(6)) : b.startsWith('grade:') ? 100 + parseInt(b.substring(6)) : 200;
        return aVal - bVal;
    });

    let totalTests = allKeys.reduce((sum, k) => sum + assignments[k].length, 0);
    let html = `<p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:0.75rem;">${totalTests} test${totalTests !== 1 ? 's' : ''} assigned across ${allKeys.length} group${allKeys.length !== 1 ? 's' : ''}</p>`;

    allKeys.forEach(targetKey => {
        const tests = assignments[targetKey];
        const targetLabel = formatAssignmentTarget(targetKey);
        const safeId = targetKey.replace(/[^a-z0-9]/gi, '');

        html += `<div style="margin-bottom:0.75rem;border:1px solid var(--border-color);border-radius:10px;overflow:hidden;">
            <div style="padding:0.75rem 1rem;cursor:pointer;font-weight:600;background:var(--bg-surface, #f8f9fa);display:flex;justify-content:space-between;align-items:center;" onclick="document.getElementById('assign-group-${safeId}').classList.toggle('hidden')">
                <span>${targetLabel}</span>
                <span style="font-weight:400;font-size:0.85rem;color:var(--text-secondary);">${tests.length} test${tests.length !== 1 ? 's' : ''}</span>
            </div>
            <div id="assign-group-${safeId}" class="hidden" style="padding:0;">
                <table class="data-table" style="margin:0;border:none;"><thead><tr><th>Test</th><th>Assigned</th><th>Due</th><th></th></tr></thead><tbody>`;

        tests.forEach((test, index) => {
            const testLabel = test.name || (test.type === 'pssa' ? `PSSA Grade ${test.grade}` : test.type === 'custom' ? test.name : `Keystone ${(test.subject || '').charAt(0).toUpperCase() + (test.subject || '').slice(1)}`);
            const dueLabel = test.dueDate || '—';
            const isExpired = test.dueDate && new Date(test.dueDate + 'T23:59:59') < new Date();
            const dueStyle = isExpired ? 'color:var(--incorrect);font-weight:bold;' : '';

            html += `<tr>
                <td>${testLabel}</td>
                <td style="font-size:0.85rem;">${test.assignedAt}</td>
                <td style="font-size:0.85rem;${dueStyle}">${dueLabel}${isExpired ? ' (expired)' : ''}</td>
                <td style="white-space:nowrap;"><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;" onclick="editAssignment('${targetKey}',${index})">Edit</button> <button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:var(--incorrect);" onclick="removeAssignment('${targetKey}',${index})">Remove</button></td>
            </tr>`;
        });

        html += '</tbody></table></div></div>';
    });

    container.innerHTML = html;
}

let adminScoreFilter = 'all';
let adminScoreSearch = '';
let adminScoreClassFilter = '';
let adminScoreSearchTimer = null;

function setScoreFilter(filter) {
    adminScoreFilter = filter;
    renderAdminScores();
}

function setScoreSearch(value) {
    clearTimeout(adminScoreSearchTimer);
    adminScoreSearchTimer = setTimeout(() => {
        adminScoreSearch = value;
        renderAdminScores();
        const el = document.getElementById('score-search-input');
        if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; }
    }, 300);
}

function setScoreClassFilter(value) {
    adminScoreClassFilter = value;
    renderAdminScores();
}

function renderAdminScores() {
    const allScores = getScores();
    const container = document.getElementById('admin-scores-list');

    if (allScores.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No scores recorded yet.</p>';
        return;
    }

    // Filter scores based on dropdown
    let scores;
    if (adminScoreFilter === 'assigned') {
        scores = allScores.filter(s => s.source === 'assigned');
    } else if (adminScoreFilter === 'practice') {
        scores = allScores.filter(s => !s.source || s.source === 'practice');
    } else {
        scores = allScores;
    }

    // Apply search filter
    if (adminScoreSearch) {
        const q = adminScoreSearch.toLowerCase();
        scores = scores.filter(s => (s.studentDisplayName || s.student || '').toLowerCase().includes(q));
    }
    // Apply class filter
    if (adminScoreClassFilter) {
        scores = scores.filter(s => s.studentClass === adminScoreClassFilter);
    }

    const assignedCount = allScores.filter(s => s.source === 'assigned').length;
    const practiceCount = allScores.filter(s => !s.source || s.source === 'practice').length;

    // Collect unique classes for filter dropdown
    const uniqueClasses = [...new Set(allScores.map(s => s.studentClass).filter(Boolean))].sort();

    let html = '';

    // ── Filter toolbar ──
    html += `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.75rem;margin-bottom:1rem;">
        <label class="admin-label" style="margin:0;">View:</label>
        <select class="text-input" style="width:auto;margin-bottom:0;padding:0.5rem 0.75rem;font-size:0.85rem;" onchange="setScoreFilter(this.value)">
            <option value="all" ${adminScoreFilter === 'all' ? 'selected' : ''}>All Scores (${allScores.length})</option>
            <option value="assigned" ${adminScoreFilter === 'assigned' ? 'selected' : ''}>Assigned Tests (${assignedCount})</option>
            <option value="practice" ${adminScoreFilter === 'practice' ? 'selected' : ''}>Practice / Free PSSA (${practiceCount})</option>
        </select>
        <input type="text" id="score-search-input" class="text-input" placeholder="Search student..." value="${adminScoreSearch}" oninput="setScoreSearch(this.value)" style="width:100%;max-width:180px;margin-bottom:0;padding:0.5rem 0.75rem;font-size:0.85rem;">
        <select class="text-input" style="width:auto;margin-bottom:0;padding:0.5rem 0.75rem;font-size:0.85rem;" onchange="setScoreClassFilter(this.value)">
            <option value="">All Classes</option>
            ${uniqueClasses.map(c => `<option value="${c}" ${adminScoreClassFilter === c ? 'selected' : ''}>${getClassDisplayName(c)}</option>`).join('')}
        </select>
    </div>`;

    if (scores.length === 0) {
        html += `<p style="color: var(--text-secondary);">No ${adminScoreFilter === 'assigned' ? 'assigned' : 'practice'} scores recorded yet.</p>`;
        container.innerHTML = html;
        return;
    }

    // Group completed (non-terminated) scores by CLASS for summaries
    const byClass = {};
    scores.filter(s => !s.terminated).forEach(s => {
        const c = s.studentClass || '—';
        if (!byClass[c]) byClass[c] = [];
        byClass[c].push(s);
    });

    // ── Class-level summaries (sorted) ──
    const summaryClassOrder = ['3', '4/5', '5/6', '6', '6/7', '7/8', 'alg1', 'adv-alg1', 'alg2', 'alg2-geo', 'precalc', 'math-analysis'];
    const sortedSummaryClasses = Object.keys(byClass).sort((a, b) => {
        const ai = summaryClassOrder.indexOf(a), bi = summaryClassOrder.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    // ── Render class summaries into separate container ──
    const summariesContainer = document.getElementById('admin-scores-summaries');
    if (summariesContainer && sortedSummaryClasses.length > 0) {
        let summaryHtml = '';
        for (const cls of sortedSummaryClasses) {
            const classScores = byClass[cls];
            const classLabel = cls !== '—' ? getClassDisplayName(cls) : 'Unknown Class';
            const avg = (classScores.reduce((s, r) => s + parseFloat(r.accuracy), 0) / classScores.length).toFixed(1);
            summaryHtml += `<div class="grade-summary-card">
                <div class="grade-summary-header">
                    <span class="grade-summary-title">${classLabel}</span>
                    <span class="grade-summary-stats">${classScores.length} student${classScores.length !== 1 ? 's' : ''} &nbsp;·&nbsp; Avg ${avg}%</span>
                </div>
                <div class="grade-summary-body" id="class-summary-${cls}">${buildDataSummary(classScores)}</div>
            </div>`;
        }
        summariesContainer.innerHTML = summaryHtml;
    } else if (summariesContainer) {
        summariesContainer.innerHTML = '<p style="color:var(--text-secondary);">No scores recorded yet.</p>';
    }

    // ── Individual scores grouped by class ──
    html += '<h4 class="scores-section-label" style="margin-top:1.5rem;">Individual Scores</h4>';

    // Group scores by class
    const scoresByClass = {};
    const displayed = scores.map((s, i) => ({ ...s, _origIdx: allScores.indexOf(s) }));
    displayed.forEach(score => {
        const cls = score.studentClass || '—';
        if (!scoresByClass[cls]) scoresByClass[cls] = [];
        scoresByClass[cls].push(score);
    });

    // Sort classes
    const classOrder = ['3', '4/5', '5/6', '6', '6/7', '7/8', 'alg1', 'adv-alg1', 'alg2', 'alg2-geo', 'precalc', 'math-analysis'];
    const sortedScoreClasses = Object.keys(scoresByClass).sort((a, b) => {
        const ai = classOrder.indexOf(a), bi = classOrder.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    sortedScoreClasses.forEach(cls => {
        const classScores = scoresByClass[cls].sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
        const classLabel = cls !== '—' ? getClassDisplayName(cls) : 'Unknown Class';
        const classAvg = (classScores.filter(s => !s.terminated).reduce((sum, s) => sum + parseFloat(s.accuracy || 0), 0) / classScores.filter(s => !s.terminated).length).toFixed(1);

        html += `<div style="margin-bottom:0.75rem;border:1px solid var(--border-color);border-radius:10px;overflow:hidden;">
            <div style="padding:0.75rem 1rem;cursor:pointer;font-weight:600;background:var(--bg-surface, #f8f9fa);display:flex;justify-content:space-between;align-items:center;" onclick="document.getElementById('scores-class-${cls.replace(/[^a-z0-9]/gi,'')}').classList.toggle('hidden')">
                <span>${classLabel}</span>
                <span style="font-weight:400;font-size:0.85rem;color:var(--text-secondary);">${classScores.length} score${classScores.length !== 1 ? 's' : ''} · Avg ${classAvg}%</span>
            </div>
            <div id="scores-class-${cls.replace(/[^a-z0-9]/gi,'')}" class="hidden" style="padding:0;">
                <table class="data-table" style="margin:0;border:none;"><thead><tr><th>Student</th><th>Test</th><th>Type</th><th>Result</th><th>Date</th><th></th></tr></thead><tbody>`;

        classScores.forEach(score => {
            const sourceLabel = score.source === 'assigned'
                ? '<span style="color:var(--correct);font-weight:600;">Assigned</span>'
                : '<span style="color:var(--text-secondary);">Practice</span>';

            let resultCell;
            if (score.terminated) {
                resultCell = `<span class="terminated-badge">TERMINATED</span>`;
            } else {
                const pct = parseFloat(score.accuracy);
                const color = pct >= 80 ? 'var(--correct)' : pct >= 60 ? 'var(--warning)' : 'var(--incorrect)';
                resultCell = `<span style="font-weight:700;color:${color}">${score.accuracy}%</span>`;
            }

            html += `<tr style="cursor:pointer;" onclick="openScoreDetail(${score._origIdx})">
                <td style="font-weight:500;color:var(--primary-color);">${formatName(score.studentDisplayName || '')}</td>
                <td>${score.testLevel}</td>
                <td>${sourceLabel}</td>
                <td>${resultCell}</td>
                <td>${score.completedAt}</td>
                <td style="white-space:nowrap;"><button class="btn" style="padding:0.2rem 0.5rem;font-size:0.7rem;background:${score.visibleToParent ? 'var(--correct)' : 'var(--text-secondary)'};" onclick="event.stopPropagation();toggleScoreVisibility(${score._origIdx})">${score.visibleToParent ? 'Visible' : 'Hidden'}</button> <button class="btn" style="padding:0.2rem 0.5rem;font-size:0.7rem;background:var(--incorrect);" onclick="event.stopPropagation();deleteScore(${score._origIdx})">Delete</button></td>
            </tr>`;
        });

        html += '</tbody></table></div></div>';
    });

    // Score detail panel at the bottom
    html += `<div id="score-detail-panel" style="display:none;margin-top:1.5rem;border:1px solid var(--border-color);border-radius:10px;padding:1.25rem;">
        <h4 id="score-detail-title" style="margin:0 0 1rem;color:var(--primary-color);"></h4>
        <div id="score-detail-content"></div>
    </div>`;

    container.innerHTML = html;
}

async function openProfileFromScore(name) {
    try {
        const roster = await fbGetRoster();
        const match = roster.find(r => (r.firstName + ' ' + r.lastName).toLowerCase() === name.toLowerCase());
        if (match) {
            openStudentDetail(match.id);
        } else {
            alert('Student not found in roster.');
        }
    } catch (e) {
        alert('Could not load profile.');
    }
}

function openScoreDetail(idx) {
    const panel = document.getElementById('score-detail-panel');
    const title = document.getElementById('score-detail-title');
    const content = document.getElementById('score-detail-content');
    if (!panel || !content) return;

    const scores = getScores();
    const score = scores[idx];
    if (!score) return;

    const studentName = formatName(score.studentDisplayName || score.student || '');
    title.innerHTML = `<span style="cursor:pointer;color:var(--primary-color);text-decoration:underline;" onclick="openProfileFromScore('${(score.studentDisplayName || score.student || '').replace(/'/g, "\\'")}')">${studentName}</span> <span style="font-size:0.8rem;font-weight:400;color:var(--text-secondary);cursor:default;">click to open profile</span>`;

    const wrong = score.wrongAnswers || [];
    const pct = parseFloat(score.accuracy || 0);
    const color = score.terminated ? 'var(--incorrect)' : pct >= 80 ? 'var(--correct)' : pct >= 60 ? 'var(--warning)' : 'var(--incorrect)';

    // Skills breakdown
    const skillCounts = {};
    wrong.forEach(w => {
        const skill = w.skill || w.type || extractSkillFromQuestion(w.question);
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
    const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);

    let html = `<div style="display:grid;grid-template-columns:auto 1fr;gap:0.4rem 1.25rem;font-size:0.9rem;margin-bottom:1rem;">
        <span style="font-weight:600;color:var(--text-secondary);">Test</span><span>${score.testLevel || '—'}</span>
        <span style="font-weight:600;color:var(--text-secondary);">Score</span><span style="font-weight:700;color:${color};">${score.terminated ? 'TERMINATED' : score.accuracy + '%'}</span>
        <span style="font-weight:600;color:var(--text-secondary);">Questions</span><span>${score.totalQuestions || score.baseItemCount || '—'}</span>
        <span style="font-weight:600;color:var(--text-secondary);">Wrong</span><span>${wrong.length}</span>
        <span style="font-weight:600;color:var(--text-secondary);">Type</span><span>${score.source === 'assigned' ? 'Assigned' : 'Practice'}</span>
        <span style="font-weight:600;color:var(--text-secondary);">Date</span><span>${score.completedAt || '—'}</span>
    </div>`;

    if (sortedSkills.length > 0) {
        html += '<div style="margin-bottom:0.75rem;"><strong style="font-size:0.85rem;color:var(--primary-color);">Skills to Work On</strong></div>';
        sortedSkills.forEach(([skill, count]) => {
            html += `<div style="padding:0.4rem 0.75rem;border-left:3px solid var(--incorrect);margin-bottom:0.3rem;background:var(--bg-surface, #f8f9fa);border-radius:0 8px 8px 0;font-size:0.85rem;">
                <strong>${skill}</strong> — ${count} question${count !== 1 ? 's' : ''} missed
            </div>`;
        });
    }

    html += `<div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
        <button class="btn" style="background:${score.visibleToParent ? 'var(--correct)' : 'var(--text-secondary)'};" onclick="toggleScoreVisibility(${idx});document.getElementById('score-detail-panel').style.display='none'">${score.visibleToParent ? 'Visible to Parents' : 'Hidden from Parents'}</button>
        <button class="btn" style="background:var(--incorrect);" onclick="deleteScore(${idx});document.getElementById('score-detail-panel').style.display='none'">Delete Score</button>
        <button class="btn" style="background:var(--text-secondary);" onclick="document.getElementById('score-detail-panel').style.display='none'">Close</button>
    </div>`;

    content.innerHTML = html;
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ========== COMMON MISCONCEPTIONS ==========

function extractSkillFromQuestion(text) {
    if (!text) return 'General';
    // Try to identify skill from question keywords
    const t = text.toLowerCase();
    if (/fraction|numerator|denominator/i.test(t)) return 'Fractions';
    if (/decimal|place value/i.test(t)) return 'Decimals & Place Value';
    if (/percent|%/i.test(t)) return 'Percentages';
    if (/area|perimeter|volume/i.test(t)) return 'Measurement & Geometry';
    if (/ratio|proportion|rate/i.test(t)) return 'Ratios & Proportions';
    if (/equation|variable|expression|solve/i.test(t)) return 'Equations & Expressions';
    if (/multiply|product|times/i.test(t)) return 'Multiplication';
    if (/divide|quotient|÷/i.test(t)) return 'Division';
    if (/add|sum|total/i.test(t)) return 'Addition';
    if (/subtract|difference|minus/i.test(t)) return 'Subtraction';
    if (/angle|triangle|circle|polygon/i.test(t)) return 'Geometry';
    if (/graph|plot|data|median|mean/i.test(t)) return 'Data & Statistics';
    if (/probability|chance|likely/i.test(t)) return 'Probability';
    if (/exponent|power|scientific/i.test(t)) return 'Exponents';
    if (/slope|linear|function/i.test(t)) return 'Linear Functions';
    if (/negative|integer|absolute/i.test(t)) return 'Integers & Number Line';
    return 'General Math';
}

function buildMisconceptionsPanel(classScores) {
    const totalStudents = classScores.length;
    if (totalStudents < 2) return '';

    const skillData = {};
    classScores.forEach(score => {
        (score.wrongAnswers || []).forEach(w => {
            const skill = w.skill || w.type || extractSkillFromQuestion(w.question);
            if (!skill) return;
            if (!skillData[skill]) skillData[skill] = { wrongStudents: new Set(), commonWrongAnswers: {} };
            skillData[skill].wrongStudents.add(score.student || score.studentDisplayName);
            const wa = w.studentAnswer || '(no answer)';
            skillData[skill].commonWrongAnswers[wa] = (skillData[skill].commonWrongAnswers[wa] || 0) + 1;
        });
    });

    const misconceptions = [];
    for (const [skill, data] of Object.entries(skillData)) {
        const wrongCount = data.wrongStudents.size;
        const pct = (wrongCount / totalStudents) * 100;
        if (pct >= 50 || wrongCount >= 3) {
            const topWrong = Object.entries(data.commonWrongAnswers).sort((a, b) => b[1] - a[1])[0];
            misconceptions.push({ skill, wrongCount, totalStudents, pct, commonWrongAnswer: topWrong ? topWrong[0] : '', commonWrongCount: topWrong ? topWrong[1] : 0 });
        }
    }
    misconceptions.sort((a, b) => b.pct - a.pct);
    if (misconceptions.length === 0) return '';

    let html = '<div class="misconceptions-panel">';
    html += '<h4 style="color:var(--incorrect);margin-bottom:0.5rem;font-size:0.85rem;">Common Misconceptions</h4>';
    html += '<table class="data-table"><thead><tr><th>Skill</th><th>Students Missed</th><th>Common Wrong Answer</th></tr></thead><tbody>';
    misconceptions.forEach(m => {
        const pctColor = m.pct >= 75 ? 'var(--incorrect)' : 'var(--warning)';
        html += `<tr><td><strong>${m.skill}</strong></td><td><span style="color:${pctColor};font-weight:700;">${m.wrongCount}/${m.totalStudents}</span> (${m.pct.toFixed(0)}%)</td><td>"${m.commonWrongAnswer}" (${m.commonWrongCount}x)</td></tr>`;
    });
    html += '</tbody></table></div>';
    return html;
}

function renderMisconceptions() {
    const container = document.getElementById('admin-misconceptions-list');
    if (!container) return;
    const allScores = getScores().filter(s => !s.terminated);
    if (allScores.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);">No scores recorded yet.</p>';
        return;
    }
    const byClass = {};
    allScores.forEach(s => {
        const c = s.studentClass || 'Unknown';
        if (!byClass[c]) byClass[c] = [];
        byClass[c].push(s);
    });
    // Sort by grade order
    const classOrder = ['3', '4/5', '5/6', '6', '6/7', '7/8', 'alg1', 'adv-alg1', 'alg2', 'alg2-geo', 'precalc', 'math-analysis'];
    const sortedClasses = Object.keys(byClass).sort((a, b) => {
        const ai = classOrder.indexOf(a), bi = classOrder.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    let html = '';
    let misconceptionCount = 0;
    for (const cls of sortedClasses) {
        const classScores = byClass[cls];
        const panel = buildMisconceptionsPanel(classScores);
        if (panel) {
            misconceptionCount++;
            const classLabel = cls !== 'Unknown' ? getClassDisplayName(cls) : 'Unknown Class';
            html += `<h4 style="margin-top:1rem;color:var(--primary-color);font-size:0.9rem;">${classLabel}</h4>${panel}`;
        }
    }
    updateBadge('misconceptions-badge', misconceptionCount);
    container.innerHTML = html || '<p style="color:var(--text-secondary);">No common misconceptions detected yet.</p>';
}

function buildDataSummary(scores) {
    const allWrong = scores.flatMap(s => s.wrongAnswers || []);
    if (allWrong.length === 0) {
        return `<em style="color:var(--text-secondary)">No error details recorded yet.</em>`;
    }
    // Count skills that students struggled with
    const skills = {};
    allWrong.forEach(w => {
        const skill = w.skill || w.type || extractSkillFromQuestion(w.question);
        skills[skill] = (skills[skill] || 0) + 1;
    });
    const topSkills = Object.entries(skills).sort((a, b) => b[1] - a[1]).slice(0, 5);
    let html = `<strong>${allWrong.length}</strong> total errors across <strong>${scores.length}</strong> student${scores.length !== 1 ? 's' : ''}.`;
    if (topSkills.length > 0) {
        html += `<div style="margin-top:0.5rem;font-size:0.85rem;"><strong>Top struggling skills:</strong></div>`;
        html += '<ul style="margin:0.25rem 0 0 1.25rem;padding:0;font-size:0.85rem;">';
        topSkills.forEach(([skill, count]) => {
            html += `<li>${skill} <span style="color:var(--incorrect);font-weight:600;">(${count}×)</span></li>`;
        });
        html += '</ul>';
    }
    return html;
}

async function generateAISummary(gradeKey) {
    const scores = getScores().filter(s => !s.terminated && (s.studentGrade || '—') === gradeKey);
    const allWrong = scores.flatMap(s => s.wrongAnswers || []);
    const el = document.getElementById(`grade-summary-${gradeKey}`);
    if (!el) return;

    if (allWrong.length === 0) {
        el.innerHTML = '<em>No wrong-answer details to analyze.</em>';
        return;
    }

    el.innerHTML = '<span class="spinner-inline"></span><em style="color:var(--warning)">Generating AI summary…</em>';

    try {
        const ollamaAvailable = await AIGenerator.isOllamaAvailable();
        if (!ollamaAvailable) {
            el.innerHTML = buildDataSummary(scores) + ' <em style="color:var(--text-secondary)">(AI unavailable)</em>';
            return;
        }
        const gradeLabel = gradeKey === 'HS' ? 'High School' : `Grade ${gradeKey}`;
        const lines = allWrong.slice(0, 20).map(w =>
            `- Q: "${w.question}" | Correct: "${w.correct}" | Student said: "${w.studentAnswer}"`).join('\n');
        const prompt = `You are a teacher's assistant. Below are wrong answers from ${gradeLabel} students. Write a concise 2-3 sentence summary of the specific math skills that need re-teaching. Be precise and actionable — name the exact skills, not just "fractions" but "dividing fractions using the reciprocal". Do NOT list questions.

Wrong answers:
${lines}

Summary:`;
        const res = await fetch('http://localhost:11434/api/generate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'mistral', prompt, stream: false, temperature: 0.3 }),
            signal: AbortSignal.timeout(30000)
        });
        const data = await res.json();
        el.innerHTML = data.response?.trim() || buildDataSummary(scores);
    } catch (e) {
        el.innerHTML = buildDataSummary(scores) + ' <em style="color:var(--text-secondary)">(AI failed)</em>';
    }
}

function toggleStudentSummary(idx, btn) {
    const row = document.getElementById(`student-detail-${idx}`);
    if (!row) return;
    const hidden = row.classList.contains('hidden');
    row.classList.toggle('hidden', !hidden);
    btn.textContent = hidden ? 'Details ▲' : 'Details ▼';
    if (hidden) loadStudentDetail(idx);
}

async function loadStudentDetail(idx) {
    const scores = getScores();
    const score = scores[idx];
    const container = document.getElementById(`student-detail-content-${idx}`);
    if (!score || !container) return;

    const wrong = score.wrongAnswers || [];

    if (score.terminated) {
        container.innerHTML = `<div style="padding:1rem;"><span class="terminated-badge">SESSION TERMINATED</span> <span style="font-size:0.85rem;color:var(--text-secondary);margin-left:0.5rem;">Student was removed after 2 focus violations on ${score.completedAt}. ${wrong.length} question${wrong.length !== 1 ? 's' : ''} answered before termination.</span></div>`;
        return;
    }

    const allAnswers = score.allAnswers || [];

    if (wrong.length === 0 && allAnswers.length === 0) {
        container.innerHTML = '<p style="padding:1rem;color:var(--text-secondary);">No answer details for this session.</p>';
        return;
    }

    // Build skills summary from wrong answers
    const skillCounts = {};
    wrong.forEach(w => {
        const skill = w.skill || w.type || extractSkillFromQuestion(w.question);
        const label = skill;
        skillCounts[label] = (skillCounts[label] || 0) + 1;
    });
    const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);

    let html = '<div style="padding:1rem;">';
    html += `<div id="student-ai-summary-${idx}" class="student-ai-summary"><span class="spinner-inline"></span>Generating summary…</div>`;

    // Skills to work on
    if (sortedSkills.length > 0) {
        html += '<div style="margin-bottom:0.75rem;"><strong style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.3px;color:var(--primary-color);">Skills to Work On</strong></div>';
        html += '<div class="wrong-answers-list">';
        sortedSkills.forEach(([skill, count]) => {
            html += `<div class="wrong-answer-item" style="border-left:3px solid var(--incorrect);"><div class="wrong-q" style="font-weight:600;">${skill}</div><div class="wrong-meta">${count} question${count !== 1 ? 's' : ''} missed</div></div>`;
        });
        html += '</div>';
    }

    // Full test review (if allAnswers available)
    if (allAnswers.length > 0) {
        html += `<details style="margin-top:0.75rem;"><summary style="cursor:pointer;font-size:0.85rem;font-weight:600;color:var(--text-secondary);padding:0.4rem 0;">View Full Test (${allAnswers.length} questions)</summary>`;
        html += '<div class="wrong-answers-list" style="margin-top:0.5rem;">';
        allAnswers.forEach((a, i) => {
            const borderColor = a.isCorrect ? 'var(--correct)' : 'var(--incorrect)';
            const icon = a.isCorrect ? '✓' : '✗';
            const iconColor = a.isCorrect ? 'var(--correct)' : 'var(--incorrect)';
            html += `<div class="wrong-answer-item" style="border-left:3px solid ${borderColor};">
                <div class="wrong-q"><span style="color:${iconColor};font-weight:700;">${icon}</span> <strong>Q${i + 1}:</strong> ${a.question}</div>
                <div class="wrong-meta">Student: <span style="font-weight:700;color:${iconColor};">${a.studentAnswer}</span> &nbsp;·&nbsp; Correct: <span class="wrong-good">${a.correctAnswer}</span></div>
            </div>`;
        });
        html += '</div></details>';
    } else if (wrong.length > 0) {
        // Fallback for old scores without allAnswers
        html += `<details style="margin-top:0.75rem;"><summary style="cursor:pointer;font-size:0.85rem;font-weight:600;color:var(--text-secondary);padding:0.4rem 0;">Wrong Answers (${wrong.length})</summary>`;
        html += '<div class="wrong-answers-list" style="margin-top:0.5rem;">';
        wrong.forEach(w => {
            html += `<div class="wrong-answer-item">
                <div class="wrong-q">${w.question}</div>
                <div class="wrong-meta">Student answered: <span class="wrong-bad">${w.studentAnswer}</span> &nbsp;·&nbsp; Correct: <span class="wrong-good">${w.correct}</span></div>
            </div>`;
        });
        html += '</div></details>';
    }
    html += '</div>';
    container.innerHTML = html;

    // Generate AI summary asynchronously
    const summaryEl = document.getElementById(`student-ai-summary-${idx}`);
    try {
        const ollamaAvailable = await AIGenerator.isOllamaAvailable();
        if (!ollamaAvailable) {
            const topics = wrong.slice(0, 3).map(w => w.question.split(' ').slice(0, 5).join(' ') + '…').join('; ');
            summaryEl.textContent = `Needs work on: ${topics}`;
            return;
        }
        const lines = wrong.slice(0, 10).map(w =>
            `- "${w.question}" → said "${w.studentAnswer}", correct is "${w.correct}"`).join('\n');
        const prompt = `A student named ${score.studentDisplayName} got these questions wrong on a math test. Write exactly 1-2 sentences for their teacher describing the specific skill(s) this student needs to practice. Be precise.

Wrong answers:
${lines}

Summary:`;
        const res = await fetch('http://localhost:11434/api/generate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'mistral', prompt, stream: false, temperature: 0.3 }),
            signal: AbortSignal.timeout(20000)
        });
        const data = await res.json();
        if (summaryEl) {
            summaryEl.textContent = data.response?.trim() || `Made ${wrong.length} errors.`;
        }
    } catch (e) {
        if (summaryEl) summaryEl.textContent = `Made ${wrong.length} error${wrong.length !== 1 ? 's' : ''} on this test.`;
    }
}

// ========== CUSTOM TEST CREATOR ==========

let parsedCustomQuestions = [];

function processCustomProblems() {
    if (!document.getElementById('custom-problems-input')) return;
    const rawText = document.getElementById('custom-problems-input').value.trim();
    if (!rawText) return;

    const statusEl = document.getElementById('custom-process-status');
    const previewEl = document.getElementById('custom-preview');

    statusEl.textContent = 'Processing…';
    statusEl.className = 'process-status processing';
    previewEl.innerHTML = '';
    document.getElementById('custom-save-section').classList.add('hidden');
    parsedCustomQuestions = [];

    let questions = fallbackParse(rawText);

    // Dynamic mode: try to convert each question into a dynamic template
    const dynamicEl = document.getElementById('custom-dynamic-mode');
    const dynamicMode = dynamicEl && dynamicEl.checked;
    let dynamicCount = 0;

    if (dynamicMode && questions.length > 0 && typeof extractNumbers === 'function') {
        questions.forEach(q => {
            // Only try arithmetic if the answer is a plain number and question is short/simple
            const ansClean = q.correct.replace(/[,$%]/g, '').trim();
            const ansNum = parseFloat(ansClean);
            const isNumericAnswer = !isNaN(ansNum) && /^[\d,.$%-]+$/.test(ansClean);
            const isShortQuestion = q.text.length < 80;
            const hasConceptWords = /which|true|step|reciprocal|equivalent|compare|statement/i.test(q.text);

            if (isNumericAnswer && isShortQuestion && !hasConceptWords) {
                const nums = extractNumbers(q.text);
                if (nums.length >= 2) {
                    const op = detectOperation(nums, ansNum);
                    if (op) {
                        q._descriptor = buildDescriptor(q.text, nums, op, ansNum);
                        dynamicCount++;
                        return;
                    }
                }
            }

            // Cosmetic swap for everything else
            if (typeof buildCosmeticDescriptor === 'function') {
                const allOptions = q.options || [];
                const cosmetic = buildCosmeticDescriptor(q.text, q.correct, allOptions);
                if (cosmetic) {
                    q._descriptor = cosmetic;
                    dynamicCount++;
                }
            }
        });
    }

    parsedCustomQuestions = questions;
    state._customDynamic = dynamicMode && dynamicCount > 0;
    renderCustomPreview(questions);

    if (questions.length > 0) {
        if (dynamicMode) {
            statusEl.textContent = `${questions.length} questions parsed — ${dynamicCount} made dynamic, ${questions.length - dynamicCount} static`;
            statusEl.className = 'process-status done';
        } else {
            statusEl.textContent = `${questions.length} question${questions.length !== 1 ? 's' : ''} parsed ✓`;
            statusEl.className = 'process-status done';
        }
    } else {
        statusEl.textContent = 'No questions found. Check format: A) B) C) D) choices + ANSWERS section.';
        statusEl.className = 'process-status error';
    }
}

// ========== ANSWER VALIDATION ==========

async function validateAnswers(questions) {
    const ollamaAvailable = await AIGenerator.isOllamaAvailable();
    if (ollamaAvailable) {
        try {
            return await validateWithOllama(questions);
        } catch (e) {
            // Fall through to basic validation
        }
    }
    return questions.map(tryBasicMathValidation);
}

async function validateWithOllama(questions) {
    const list = questions.map((q, i) => {
        const opts = q.options && q.options.length > 0
            ? `\n   OPTIONS: ${q.options.join(' | ')}`
            : '';
        return `#${i} Q: ${q.text}${opts}\n   STATED ANSWER: ${q.correct}`;
    }).join('\n\n');

    const prompt = `You are a math answer validator for a multiple-choice test. Check whether the STATED ANSWER is the correct choice.

STRICT RULES — read every one before answering:
1. Read the FULL question text before judging anything.
2. The correct answer MUST be one of the OPTIONS listed. Never suggest an answer that is not in the options.
3. If the question asks "which expression is equivalent" or "which expression represents" — verify that the expression is algebraically equivalent. Do NOT compute it to a number. The answer should be an expression, not a value.
4. If the question asks "which expression shows how to find [a statistic]" — check that the formula/procedure matches the definition. The answer should be an expression, not a numeric result.
5. If the question text contains a diagram, number line, or visual description (arrows, dashes, coordinates) — output CORRECT for that question. You cannot validate visuals from text.
6. Only mark WRONG if you are 100% mathematically certain the stated answer is wrong AND you can identify which option from the list IS correct.

Output EXACTLY one line per question — no explanations, no extra text:
#0: CORRECT
#0: WRONG → correct answer is [exact text copied from the OPTIONS list]

Questions:
${list}`;

    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'mistral', prompt, stream: false, temperature: 0 }),
        signal: AbortSignal.timeout(40000)
    });

    if (!response.ok) throw new Error('Ollama validation failed');
    const data = await response.json();
    return applyValidationResults(data.response || '', questions);
}

function applyValidationResults(responseText, questions) {
    const result = questions.map(q => ({ ...q }));
    const lines = responseText.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
        // Match: #2: WRONG → correct answer is 1 1/5
        const wrongMatch = line.match(/^#(\d+):\s*WRONG\s*[→\->]+\s*correct answer is\s*(.+)/i);
        if (wrongMatch) {
            const idx = parseInt(wrongMatch[1]);
            const corrected = wrongMatch[2].trim().replace(/['"]/g, '');
            if (idx < result.length && corrected && corrected !== result[idx].correct) {
                result[idx].validationError = true;
                result[idx].suggestedAnswer = corrected;
            }
        }
        // Also handle loose formats: #2: WRONG (1 1/5)  or  #2: WRONG - should be 1 1/5
        const looseWrong = !wrongMatch && line.match(/^#(\d+):\s*WRONG/i);
        if (looseWrong) {
            const idx = parseInt(looseWrong[1]);
            const afterWrong = line.replace(/^#\d+:\s*WRONG/i, '').trim();
            const corrected = afterWrong.replace(/^[→\->:–\s]+/,'').replace(/^(should be|is|answer is)\s*/i,'').replace(/['"]/g,'').trim();
            if (idx < result.length && corrected) {
                result[idx].validationError = true;
                result[idx].suggestedAnswer = corrected;
            }
        }
    }

    return result;
}

function tryBasicMathValidation(question) {
    const q = question.text;
    const stated = question.correct.trim();

    // Simple multiplication: "15 × 8" or "15 x 8" or "15 * 8"
    const multMatch = q.match(/(\d+)\s*[×x\*]\s*(\d+)/);
    if (multMatch) {
        const expected = String(parseInt(multMatch[1]) * parseInt(multMatch[2]));
        if (stated !== expected) {
            return { ...question, validationError: true, suggestedAnswer: expected };
        }
        return question;
    }
    // Simple addition
    const addMatch = q.match(/\b(\d+)\s*\+\s*(\d+)\b/);
    if (addMatch) {
        const expected = String(parseInt(addMatch[1]) + parseInt(addMatch[2]));
        if (stated !== expected) {
            return { ...question, validationError: true, suggestedAnswer: expected };
        }
        return question;
    }
    // Simple subtraction
    const subMatch = q.match(/\b(\d+)\s*-\s*(\d+)\b/);
    if (subMatch) {
        const expected = String(parseInt(subMatch[1]) - parseInt(subMatch[2]));
        if (stated !== expected) {
            return { ...question, validationError: true, suggestedAnswer: expected };
        }
        return question;
    }
    return question;
}

function applyAnswerCorrections() {
    parsedCustomQuestions = parsedCustomQuestions.map(q => {
        if (q.validationError && q.suggestedAnswer) {
            const newOpts = [q.suggestedAnswer, ...q.options.filter(o => o !== q.correct && o !== q.suggestedAnswer)].slice(0, 4);
            return { ...q, correct: q.suggestedAnswer, options: shuffle(newOpts), validationError: false, suggestedAnswer: null };
        }
        return q;
    });
    renderCustomPreview(parsedCustomQuestions);
    document.getElementById('custom-process-status').textContent = 'All corrections applied ✓';
    document.getElementById('custom-process-status').className = 'process-status done';
}

async function parseWithOllama(rawText) {
    const prompt = `You are a test formatter. Parse ALL problems from the raw input below and output each one in the EXACT format shown. Do not output anything else.

---PROBLEM---
QUESTION: [full question text]
ANSWER: [correct answer only]
DISTRACTOR1: [plausible wrong answer]
DISTRACTOR2: [plausible wrong answer]
DISTRACTOR3: [plausible wrong answer]
EXPLANATION: [brief step-by-step solution]
HINT: [a guiding hint that does NOT reveal the answer]

Rules:
- Output every problem you find, even if formatting is messy
- If no distractors are given, generate 3 mathematically reasonable wrong answers
- If no explanation is given, write a brief one
- Write a short HINT that guides the student without giving the answer
- Keep the question text as written (fix spelling/grammar only)
- Start immediately with ---PROBLEM--- for the first question

RAW INPUT:
${rawText}`;

    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'mistral', prompt, stream: false, temperature: 0.2 }),
        signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) throw new Error('Ollama request failed');
    const data = await response.json();
    return parseOllamaResponse(data.response || '');
}

function parseOllamaResponse(text) {
    const blocks = text.split('---PROBLEM---').slice(1);
    const questions = [];

    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        const p = {};
        const distractors = [];

        for (const line of lines) {
            if (line.startsWith('QUESTION:')) p.q = line.replace('QUESTION:', '').trim();
            else if (line.startsWith('ANSWER:')) p.ans = line.replace('ANSWER:', '').trim();
            else if (/^DISTRACTOR\d:/.test(line)) {
                const val = line.split(':').slice(1).join(':').trim();
                if (val) distractors.push(val);
            } else if (line.startsWith('EXPLANATION:')) p.guide = line.replace('EXPLANATION:', '').trim();
            else if (line.startsWith('HINT:')) p.hint = line.replace('HINT:', '').trim();
        }

        if (p.q && p.ans) {
            const uniqueDist = distractors.filter(d => d !== p.ans).slice(0, 3);
            // Pad distractors if AI didn't generate enough
            let n = parseFloat(p.ans);
            while (uniqueDist.length < 3) {
                const fake = isNaN(n) ? `Option ${uniqueDist.length + 2}` : String(n + uniqueDist.length + 1);
                if (fake !== p.ans && !uniqueDist.includes(fake)) uniqueDist.push(fake);
            }
            questions.push({
                text: p.q,
                correct: p.ans,
                options: shuffle([p.ans, ...uniqueDist]),
                openEnded: false,
                guide: p.guide || 'Review the solution carefully.',
                hint: p.hint || '',
                isCustom: true,
                templateRef: null
            });
        }
    }

    return questions;
}

/**
 * Format question lines — detect tables, number lines, and convert to HTML.
 */
function formatQuestionLines(qLines) {
    const cleaned = qLines.filter(l => l.trim());
    if (cleaned.length === 0) return '';

    // Detect table: lines containing "|" pipe separators
    const tableLines = [];
    const textLines = [];
    let inTable = false;

    cleaned.forEach(line => {
        const t = line.trim();
        if (t.includes('|') && (t.match(/\|/g) || []).length >= 1) {
            inTable = true;
            tableLines.push(t);
        } else if (inTable && /^\d/.test(t)) {
            // Continuation of table data (numbers after a table header)
            // Check if previous table line had same number of columns
            tableLines.push(t);
        } else {
            if (inTable && tableLines.length > 0) {
                // End of table, convert to HTML
                textLines.push(buildHTMLTable(tableLines));
                tableLines.length = 0;
                inTable = false;
            }
            textLines.push(t);
        }
    });

    // Flush remaining table
    if (tableLines.length > 0) {
        textLines.push(buildHTMLTable(tableLines));
    }

    // Join with spaces, strip question number
    return textLines.join(' ').replace(/\s+/g, ' ').trim().replace(/^\d+\)\s*/, '');
}

/**
 * Convert pipe-separated table lines to an HTML table.
 */
function buildHTMLTable(lines) {
    let html = '<table style="border-collapse:collapse;margin:0.5rem 0;font-size:0.9rem;">';
    lines.forEach((line, i) => {
        const cells = line.split('|').map(c => c.trim());
        const tag = i === 0 ? 'th' : 'td';
        const style = i === 0
            ? 'style="border:1px solid #adb5bd;padding:0.4rem 0.75rem;background:#e9ecef;font-weight:600;"'
            : 'style="border:1px solid #adb5bd;padding:0.4rem 0.75rem;text-align:center;"';
        html += '<tr>' + cells.map(c => `<${tag} ${style}>${c}</${tag}>`).join('') + '</tr>';
    });
    html += '</table>';
    return html;
}

/**
 * Fix PSSA PDF number formatting issues.
 * "0 31" → "0.31", "- 0 651" → "-0.651", "2 3/4" stays, "109 50" → "109.50"
 */
function fixPSSANumbers(text) {
    if (!text) return text;
    let s = text;

    // Fix "- 0 651" → "-0.651" (negative decimals: dash space zero space digits)
    s = s.replace(/-\s*(\d)\s+(\d+)/g, function(match, d1, d2) {
        // Only treat as decimal if first digit is 0 (like -0.651)
        if (d1 === '0') return '-' + d1 + '.' + d2;
        return match;
    });

    // Fix "0 31" → "0.31", "0 15x" → "0.15x" (zero space digits = decimal)
    s = s.replace(/\b0\s+(\d+)/g, '0.$1');

    // Fix single-digit decimals: "4 2" → "4.2" when followed by non-digit context
    // Pattern: single digit, space, single digit, then non-digit or end
    s = s.replace(/\b(\d)\s+(\d)(?=\s+[a-zA-Z÷×•]|\s*[÷×•,)}\]]|\s*$)/g, '$1.$2');

    // Fix dollar amounts: "$109 50" → "$109.50"
    s = s.replace(/\$(\d+)\s+(\d{2})\b/g, '$$$1.$2');

    // Fix multi-digit decimals: "122 64x" → "122.64x", "109 50x" → "109.50x"
    s = s.replace(/\b(\d{2,})\s+(\d{2})(?=[x\sy+\-×÷*$]|$)/g, '$1.$2');

    // Fix multiplication dot: " • " between numbers → " × "
    s = s.replace(/(\d)\s*•\s*(\d)/g, '$1 × $2');

    return s;
}

/**
 * Dedicated parser for PSSA sampler PDF format.
 * Handles questions with "A " "B " "C " "D " options (no parentheses),
 * item codes, Gr-7 P23 metadata, and summary answer key tables.
 */
function parsePSSAFormat(lines, rawText) {
    // ── Step 1: Extract answer key from summary table ──
    // Formats: "1 A-N 1 1 3 A 1 47%" or "1 B-E.1.1.3 A 1 42%*"
    const answerKey = [];
    for (let i = 0; i < lines.length; i++) {
        if (/Multiple.Choice|SUMMARY DATA|Answer\s+Key/i.test(lines[i])) {
            for (let j = i + 1; j < lines.length; j++) {
                const row = lines[j].trim();
                // Match: starts with number, has alignment code, then single letter A-D
                const m = row.match(/^\d+\s+[\w.-]+[\s.]+.*?\b([A-D])\s+\d/);
                if (m) {
                    answerKey.push(m[1]);
                }
                if (/Open.Ended/i.test(row)) break;
            }
            break;
        }
    }

    // ── Step 2: Find content boundary (stop at summary/open-ended sections) ──
    let contentEndIdx = lines.length;
    for (let i = 0; i < lines.length; i++) {
        const t = lines[i].trim();
        if (/SUMMARY DATA/i.test(t) || /^OPEN.ENDED/i.test(t)) {
            contentEndIdx = i;
            break;
        }
    }

    // ── Step 3: Further clean lines for PSSA — strip remaining junk ──
    const pssaContent = [];
    for (let i = 0; i < contentEndIdx; i++) {
        const t = lines[i].trim();
        if (!t) continue;
        // Skip standalone page numbers (1-3 digits alone on a line)
        if (/^\d{1,3}$/.test(t)) continue;
        // Skip item codes (5+ digit numbers)
        if (/^\d{5,}$/.test(t)) continue;
        // Skip Gr-7 P23 style metadata
        if (/^Gr-\d+\s*P\d+/i.test(t)) continue;
        // Skip MULTIPLE-CHOICE ITEMS header
        if (/^MULTIPLE.CHOICE/i.test(t)) continue;
        // Skip OPEN-ENDED header
        if (/^OPEN.ENDED/i.test(t)) continue;
        // Skip scoring/rubric junk
        if (/^Sample\s+Number|^Alignment|^Depth of|^p-value/i.test(t)) continue;
        if (/^\d+\s+point/i.test(t)) continue;
        // Skip answer key rows that slipped through (both formats)
        if (/^\d+\s+[A-D]-[A-Z]/.test(t)) continue;
        if (/^\d+\s+[A-Z]-[A-Z]\.\d/.test(t)) continue;
        // Skip asterisk note
        if (/asterisk|indicates the key/i.test(t)) continue;
        // Skip "No Data" table headers
        if (/^No Data/i.test(t)) continue;
        // Skip "Continued" references
        if (/Continued.*previous page/i.test(t)) continue;
        // Skip PSSA page/title lines
        if (/^PSSA\s/i.test(t)) continue;
        // Skip scoring rubric lines
        if (/^Top.Scoring|^Part [A-D]|^Sample|^What\?|^Why\?|^OR\s/i.test(t)) continue;
        if (/^\d+\s+point/i.test(t)) continue;
        if (/^Answers may vary/i.test(t)) continue;
        pssaContent.push(t);
    }

    // ── Step 4: Parse questions ──
    // Questions start with: number + space + text (e.g., "7 Michael enrolls...")
    // Options are: A/B/C/D at start of line followed by space and text
    const questions = [];
    let qi = 0;

    while (qi < pssaContent.length) {
        const line = pssaContent[qi];

        // Look for question start: digit(s) followed by space then text starting with uppercase
        const qStart = line.match(/^(\d{1,2})\s+([A-Z].{2,})/);
        if (!qStart) {
            qi++;
            continue;
        }

        // Collect question text lines until we hit "A " option line
        const qNum = parseInt(qStart[1], 10);
        const qTextLines = [qStart[2]];
        qi++;

        while (qi < pssaContent.length) {
            const cur = pssaContent[qi].trim();
            // Check if this line starts option A (format: "A text" or "A.text")
            if (/^A[\s.]/.test(cur)) break;
            // Check if this is a new question start
            if (/^\d{1,2}\s+[A-Z].{2,}/.test(cur)) break;
            qTextLines.push(cur);
            qi++;
        }

        // Now collect options A, B, C, D
        const opts = {};
        const optionLetters = ['A', 'B', 'C', 'D'];
        let optIdx = 0;

        while (qi < pssaContent.length && optIdx < 4) {
            const cur = pssaContent[qi].trim();
            const expectedLetter = optionLetters[optIdx];

            // Check if this line starts with the expected option letter ("A text" or "A.text")
            const optMatch = cur.match(new RegExp('^' + expectedLetter + '[.\\s]\\s*(.*)'));
            if (optMatch) {
                const optTextLines = [optMatch[1].trim()];
                qi++;

                // Collect continuation lines for this option
                while (qi < pssaContent.length) {
                    const next = pssaContent[qi].trim();
                    // Stop if next option letter
                    if (optIdx < 3) {
                        const nextLetter = optionLetters[optIdx + 1];
                        if (new RegExp('^' + nextLetter + '[.\\s]').test(next)) break;
                    }
                    // Stop if it looks like a new question
                    if (/^\d{1,2}\s+[A-Z].{2,}/.test(next)) break;
                    // Stop if it matches ANY option letter start
                    if (/^[A-D][.\s]/.test(next)) break;
                    optTextLines.push(next);
                    qi++;
                }

                opts[expectedLetter] = optTextLines.join(' ').trim();
                optIdx++;
            } else {
                // Didn't find expected option — abort this question
                break;
            }
        }

        // Only save if we got all 4 options with actual text content
        if (opts.A && opts.B && opts.C && opts.D && opts.A.length > 0 && opts.B.length > 0) {
            let qText = qTextLines.join(' ').replace(/\s+/g, ' ').trim();

            // Apply fixPSSANumbers to question text and all options
            qText = fixPSSANumbers(qText);
            ['A', 'B', 'C', 'D'].forEach(k => {
                opts[k] = fixPSSANumbers(opts[k]);
            });

            // Skip graph/diagram/visual questions
            const graphPatterns = /write an inequality|sketch a net|find the area.*polygon|find the volume.*prism|number line.*shown|number line.*below|number line.*represents|number line models|line plot.*below|line plot.*represents|box plot|bar graph|histogram|scatter plot|coordinate (plane|grid)|graph.*shown below|graph.*below|on the graph below|on a coordinate grid|use the (graph|plot|diagram|box plot|number line)|make a box plot|identify the polyhedron|assembled from.*net|figure shown|diagram below|drawing below|grid.*shown below|graphed on|relation.*shown on the graph/i;
            if (graphPatterns.test(qText)) {
                continue;
            }

            const ansIdx = questions.length;
            const letter = answerKey[ansIdx] || 'A';
            const correct = opts[letter] || opts.A;

            questions.push({
                text: qText,
                correct,
                options: shuffle([opts.A, opts.B, opts.C, opts.D]),
                openEnded: false,
                guide: `The correct answer is ${letter}: ${correct}`,
                hint: '',
                isCustom: true,
                templateRef: null
            });
        }
    }

    // ── Final cleanup: filter out garbage questions ──
    return questions.filter(q => {
        if (q.text.length < 10) return false;
        const hasLetters = (q.text.match(/[a-zA-Z]/g) || []).length >= 5;
        const hasMathOps = /[×÷+\-=<>≤≥]/.test(q.text);
        if (!hasLetters && !hasMathOps) return false;
        if (q.correct.length > 200) return false;
        if (!q.openEnded && q.options.indexOf(q.correct) === -1) return false;
        if (q.options.some(o => o.length > 250)) return false;
        return true;
    });
}

function fallbackParse(rawText) {
    // ── Pre-clean: strip Kuta Software junk lines and copyright noise ──
    const rawLines = rawText.split('\n');
    const cleanedLines = rawLines.filter(line => {
        const t = line.trim();
        if (!t) return false;
        // Skip copyright lines, "Worksheet by Kuta", garbled chars
        if (/^©/.test(t) || /^[©\u00a9]/.test(t)) return false;
        if (/^Worksheet by/i.test(t)) return false;
        if (/^-\d+-$/.test(t)) return false;
        // Skip assignment titles/headers
        if (/^Gr-?\d|^Grade\s*\d|PSSA\s*Test|Name_+|^Name\s*$/i.test(t)) return false;
        // Skip PSSA sampler metadata
        if (/^MULTIPLE.CHOICE|^OPEN.ENDED|^MATHEMATICS|^SUMMARY DATA/i.test(t)) return false;
        if (/^Gr-\d+\s*P\d+/i.test(t)) return false;
        if (/^\d{5,}$/.test(t)) return false; // item codes like 735243
        if (/^Sample\s+Number|^Alignment|^Depth of|^p-value/i.test(t)) return false;
        if (/^Top.Scoring|^Part [A-D]|^Sample (Response|Work|Explanation)/i.test(t)) return false;
        if (/^PSSA\s+(Grade|Mathematics)/i.test(t)) return false;
        if (/^(What\?|Why\?|OR\s*$|OR\s+equivalent)/i.test(t)) return false;
        if (/^\d+\s+point/i.test(t)) return false;
        // NOTE: standalone 1-2 digit numbers are NOT filtered here — they may be
        // fraction numerators/denominators that the multi-line merger (step 2) needs.
        // Standalone page numbers are filtered AFTER the merger instead.
        // Skip scoring/answer key table rows
        if (/^\d+\s+[A-D]-[A-Z]/.test(t)) return false;
        // Skip "Answers may vary" and scoring rubric lines
        if (/^Answers may vary|^Accept any/i.test(t)) return false;
        // Skip lines that are mostly non-alphanumeric garbage
        const alphaCount = (t.match(/[a-zA-Z0-9]/g) || []).length;
        if (t.length > 10 && alphaCount / t.length < 0.3) return false;
        return true;
    });

    // ── Pre-clean step 1b: fix Kuta symbol encoding and formatting ──
    for (let i = 0; i < cleanedLines.length; i++) {
        cleanedLines[i] = cleanedLines[i]
            .replace(/\t/g, ' ')          // tabs to spaces
            .replace(/£/g, '≤')
            .replace(/³/g, '≥')
            .replace(/´/g, "'")
            .replace(/×/g, '×')
            .replace(/÷/g, '÷')
            // Strip LaTeX-style $var$ notation — "$d$" → "d", "$x$" → "x"
            .replace(/\$([a-zA-Z0-9+\-×÷=<>≤≥\s]+)\$/g, '$1')
            // Fix PSSA en-dash to minus
            .replace(/–/g, '-')
            // Fix PSSA underscored fractions: "1__2" or "_1_4" → remove underscores
            .replace(/_+/g, ' ').replace(/\s{2,}/g, ' ');
    }

    // ── Pre-clean step 2: merge Kuta multi-line fractions ──
    // In Kuta PDFs, fractions appear as two consecutive lines of just numbers:
    //   3        →  becomes  3/8 on the previous text line
    //   8
    // Also handle mixed numbers: text line ending with a number, then num/denom lines
    const merged = [];
    for (let i = 0; i < cleanedLines.length; i++) {
        const cur = cleanedLines[i].trim();
        const next = (i + 1 < cleanedLines.length) ? cleanedLines[i + 1].trim() : '';

        // If current line is just a small number and next line is also just a small number,
        // this is a fraction — merge as "cur/next" onto the previous line
        if (/^\d{1,3}$/.test(cur) && /^\d{1,3}$/.test(next) && merged.length > 0) {
            // Append fraction to previous line
            merged[merged.length - 1] = merged[merged.length - 1] + ' ' + cur + '/' + next;
            i++; // skip next line
            continue;
        }

        // Handle fraction with bar character between numerator and denominator:
        //   3
        //   ─  (or ── or — or -)
        //   8
        const next2 = (i + 2 < cleanedLines.length) ? cleanedLines[i + 2].trim() : '';
        if (/^\d{1,3}$/.test(cur) && /^[─━—–\-_]{1,}$/.test(next) && /^\d{1,3}$/.test(next2) && merged.length > 0) {
            merged[merged.length - 1] = merged[merged.length - 1] + ' ' + cur + '/' + next2;
            i += 2; // skip bar line and denominator
            continue;
        }

        merged.push(cleanedLines[i]);
    }

    // ── Post-merge: strip standalone page numbers that survived the merger ──
    // (Moved here from pre-clean so fraction numerators/denominators aren't lost)
    const lines = merged.filter(l => !/^\d{1,2}$/.test(l.trim()));

    // ── PSSA Format Detection ──
    // If the text contains PSSA-specific markers, use a dedicated PSSA parser
    const isPSSA = /Gr-\d+\s*P\d+/i.test(rawText) ||
                   /MULTIPLE.CHOICE/i.test(rawText) ||
                   /Answer\s+Key/i.test(rawText) ||
                   /PSSA\s+(Grade|Mathematics)/i.test(rawText) ||
                   /^\d+\s+[A-D][\s.-][A-Z]/m.test(rawText);

    if (isPSSA) {
        return parsePSSAFormat(lines, rawText);
    }

    // ── Step 1: Find and extract ANSWERS and HINTS sections ──
    let answerKey = [];
    let hintKey = [];
    let contentEndIdx = lines.length;

    // Find HINTS section first (it comes after ANSWERS typically)
    let hintsStartIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (/^\s*HINTS?\s*$/i.test(lines[i])) {
            hintsStartIdx = i;
            hintKey = lines.slice(i + 1)
                .map(l => l.trim())
                .filter(l => l.length > 0);
            break;
        }
    }

    // Find ANSWERS section — handle "ANSWERS", "Answers to ...", etc.
    for (let i = 0; i < lines.length; i++) {
        if (/^\s*Answers?\b/i.test(lines[i])) {
            contentEndIdx = i;
            const endOfAnswers = hintsStartIdx > i ? hintsStartIdx : lines.length;
            const keyLines = lines.slice(i + 1, endOfAnswers);

            // Try format: one letter per line
            answerKey = keyLines
                .map(l => l.trim())
                .filter(l => /^[A-Da-d]$/i.test(l))
                .map(l => l.toUpperCase());

            // Fallback: Kuta format like "1) B  2) A  3) C  4) A"
            if (answerKey.length === 0) {
                const joined = lines.slice(i, endOfAnswers).join(' ');
                const kutaMatches = joined.match(/\d+\)\s*([A-Da-d])\b/g);
                if (kutaMatches) {
                    answerKey = kutaMatches.map(m => {
                        const letter = m.match(/([A-Da-d])\s*$/);
                        return letter ? letter[1].toUpperCase() : 'A';
                    });
                }
            }

            // Final fallback: any standalone A-D letters
            if (answerKey.length === 0) {
                const joined = keyLines.join(' ');
                answerKey = (joined.match(/\b[A-Da-d]\b/g) || []).map(l => l.toUpperCase());
            }
            break;
        }
    }

    // PSSA sampler format: answer key in summary table like "1 A-N 1 1 3 A 1 47%"
    // The answer letter follows the alignment code
    if (answerKey.length === 0) {
        for (let i = 0; i < lines.length; i++) {
            if (/Multiple.Choice|SUMMARY DATA/i.test(lines[i])) {
                // Scan lines after this for answer key rows
                for (let j = i + 1; j < lines.length; j++) {
                    const row = lines[j].trim();
                    // Match: number, then alignment codes, then single letter A-D, then depth/p-values
                    const m = row.match(/^\d+\s+.*?\b([A-D])\s+\d/);
                    if (m) {
                        answerKey.push(m[1]);
                    }
                    // Stop at open-ended section
                    if (/Open.Ended/i.test(row)) break;
                }
                if (answerKey.length > 0) {
                    contentEndIdx = i;
                }
                break;
            }
        }
    }

    // Also look for "OPEN-ENDED" and cut content there
    if (contentEndIdx === lines.length) {
        for (let i = 0; i < lines.length; i++) {
            if (/OPEN.ENDED/i.test(lines[i])) {
                contentEndIdx = i;
                break;
            }
        }
    }

    // If HINTS came before ANSWERS in the text, adjust contentEndIdx
    if (hintsStartIdx >= 0 && hintsStartIdx < contentEndIdx) {
        contentEndIdx = hintsStartIdx;
    }

    // ── Pre-clean step 3: fix option markers and split mid-line content ──
    const splitContent = [];
    lines.slice(0, contentEndIdx).forEach(line => {
        // Fix "?A)" or "?a)" at start of line
        let fixed = line.replace(/^\s*\?\s*([A-Da-d][).])/i, '$1');

        // Split at mid-line PSSA question numbers: "...text 8 A rectangular prism..."
        // Match: number, space, then sentence-like text (capital word followed by more words)
        const qNumSplit = fixed.match(/^(.+?)\s(\d{1,2}\s+[A-Z]\w*\s+\w{2,}\s+\w{2,}.{5,})$/);
        if (qNumSplit && qNumSplit[1].length > 5) {
            splitContent.push(qNumSplit[1]);
            splitContent.push(qNumSplit[2]);
            return;
        }

        // Split lines that have options mid-line: "text here A) option text"
        const midMatch = fixed.match(/^(.{6,}?)\s+([A-Da-d][).]\s*.+)$/);
        if (midMatch && !/^[A-Da-d][).]\s/.test(fixed.trim())) {
            splitContent.push(midMatch[1]);
            splitContent.push(midMatch[2]);
        } else {
            splitContent.push(fixed);
        }
    });
    const content = splitContent;

    // ── Step 2: Walk lines, collect question text until A)/a) triggers a block ──
    const questions = [];
    let qLines = [];

    for (let i = 0; i < content.length; i++) {
        const t = content[i].trim();

        // Does this line start an A)/a) option? Case-insensitive
        let aMatch = t.match(/^[Aa][).]\s*(.+)/);
        // Also try PSSA format: "A " without parenthesis — but only if B, C, D follow nearby
        if (!aMatch && /^A\s+/.test(t)) {
            let hasBCD = 0;
            for (let peek = i + 1; peek < Math.min(i + 12, content.length); peek++) {
                const p = content[peek].trim();
                if (/^B\s+/.test(p)) hasBCD++;
                if (/^C\s+/.test(p)) hasBCD++;
                if (/^D\s+/.test(p)) hasBCD++;
            }
            if (hasBCD >= 2) {
                aMatch = t.match(/^A\s+(.+)/);
            }
        }
        if (aMatch) {
            let opts = { A: aMatch[1].trim() };
            let lastIdx = i;

            // Collect multi-line option A text (max 5 continuation lines, merge fractions)
            for (let j = i + 1; j < Math.min(i + 6, content.length); j++) {
                const t2 = content[j].trim();
                if (/^[A-Da-d][).]\s/.test(t2) || /^[B-D]\s+/.test(t2)) break;
                if (/^\d+[).]\s/.test(t2) || /^\d+\s+[A-Z]/.test(t2)) break;
                if (!t2) break;
                if (!opts.B) {
                    // Merge fraction: if this line is just a number and next is too
                    const t3 = (j + 1 < content.length) ? content[j + 1].trim() : '';
                    if (/^\d{1,3}$/.test(t2) && /^\d{1,3}$/.test(t3)) {
                        opts.A += ' ' + t2 + '/' + t3;
                        lastIdx = j + 1;
                        j++; // skip next
                        continue;
                    }
                    opts.A += ' ' + t2;
                    lastIdx = j;
                }
            }

            // Look ahead for B, C, D (case-insensitive) — match both "B)" and "B " formats
            for (let j = lastIdx + 1; j < Math.min(i + 30, content.length); j++) {
                const t2 = content[j].trim();
                const m = t2.match(/^([B-Db-d])[).]\s*(.*)/) || t2.match(/^([B-D])\s+(.*)/);
                if (m) {
                    const letter = m[1].toUpperCase();
                    let optText = m[2].trim();

                    // Collect multi-line option text — max 5 continuation lines, merge inline fractions
                    for (let k = j + 1; k < Math.min(j + 6, content.length); k++) {
                        const t3 = content[k].trim();
                        if (!t3) break;
                        if (/^[A-Da-d][).]\s/.test(t3) || /^[A-D]\s+/.test(t3)) break;
                        if (/^\d+[).]\s/.test(t3) || /^\d+\s+[A-Z][a-z]/.test(t3)) break;
                        // Stop if line looks like start of new content
                        if (t3.length > 5 && /^[A-Z]/.test(t3) && letter === 'D') break;
                        // If this line is just a small number and next is too, merge as fraction
                        const t4 = (k + 1 < content.length) ? content[k + 1].trim() : '';
                        if (/^\d{1,3}$/.test(t3) && /^\d{1,3}$/.test(t4)) {
                            optText += ' ' + t3 + '/' + t4;
                            k++; // skip next line
                            continue;
                        }
                        optText += ' ' + t3;
                    }

                    if (!opts[letter]) {
                        opts[letter] = optText.trim();
                        lastIdx = j;
                        if (letter === 'D') break;
                    }
                }
            }

            // Only save the question if we got all 4 options
            if (opts.A && opts.B && opts.C && opts.D) {
                let qText = formatQuestionLines(qLines);

                // If no question text before options, check if the line with A) had text before it
                // like "28.2 × 1.7 × 0.3" on the previous accumulated lines
                // Or the question IS a pure expression — use the question number context
                if (!qText && qLines.length === 0) {
                    // Check the line before A) for a question number with content: "1) 28.2 × 1.7 × 0.3"
                    // That content would be empty since it was on the same line as A)
                    // Use placeholder
                    qText = '(Solve)';
                }

                if (qText) {
                    // Clean each option — truncate at any embedded question number
                    ['A','B','C','D'].forEach(k => {
                        if (opts[k]) {
                            // Remove trailing content that starts with a question number like "8) Two divers..."
                            opts[k] = opts[k].replace(/\s+\d+\)\s+[A-Z].{20,}$/, '').trim();
                            // Remove trailing content after "from sea level" type bleed
                            opts[k] = opts[k].replace(/\s+(from sea level|because\s+\|).{10,}$/i, '').trim();
                        }
                    });

                    const letter = answerKey[questions.length] || 'A';
                    const correct = opts[letter] || opts.A;
                    const hint = hintKey[questions.length] || '';

                    questions.push({
                        text: qText,
                        correct,
                        options: shuffle([opts.A, opts.B, opts.C, opts.D]),
                        openEnded: false,
                        guide: `The correct answer is ${letter}: ${correct}`,
                        hint,
                        isCustom: true,
                        templateRef: null
                    });
                }

                qLines = [];
                i = lastIdx;
                continue;
            }
        }

        // Not an A) trigger — accumulate as question text.
        // Skip stray B)/C)/D) and "B "/"C "/"D " option lines
        if (t && !/^[B-Db-d][).]\s/.test(t) && !/^[B-D]\s+/.test(t)) {
            // If this line starts with a question number like "8)" or "5 A restaurant", start fresh
            if (/^\d+\)\s/.test(t) || /^\d+\s+[A-Z][a-z]/.test(t)) {
                qLines = [];
            }
            qLines.push(t);
        }
    }

    // ── Fallback: handle "Answer: X" inline format (original behavior) ──
    if (questions.length === 0) {
        const blocks = rawText.split(/\n(?=\d+[.)]\s|\bQ\b[\s:]|\bQuestion\b[\s:])/i).filter(b => b.trim());
        for (const block of blocks) {
            const blines = block.split('\n').map(l => l.trim()).filter(Boolean);
            let question = '', answer = '', guide = '', hint = '';
            const distractors = [];
            for (const line of blines) {
                if (/^answer[\s:]/i.test(line) && !answer) {
                    answer = line.replace(/^answer[\s:]*/i, '').trim();
                } else if (/^(distractor|wrong)[\s:]/i.test(line)) {
                    distractors.push(line.split(':').slice(1).join(':').trim());
                } else if (/^(explanation|solution)[\s:]/i.test(line)) {
                    guide = line.split(':').slice(1).join(':').trim();
                } else if (/^hint[\s:]/i.test(line)) {
                    hint = line.replace(/^hint[\s:]*/i, '').trim();
                } else if (!answer) {
                    const cleaned = line.replace(/^\d+[.)]\s*/, '').replace(/^Q(uestion)?[\s:]*/i, '').trim();
                    if (cleaned) question += (question ? ' ' : '') + cleaned;
                }
            }
            if (question && answer) {
                const openEnded = distractors.length === 0;
                questions.push({
                    text: question,
                    correct: answer,
                    options: openEnded ? [] : shuffle([answer, ...distractors.slice(0, 3)]),
                    openEnded,
                    guide: guide || 'Review the solution carefully.',
                    hint,
                    isCustom: true,
                    templateRef: null
                });
            }
        }
    }

    // ── Clean up each question before filtering ──
    questions.forEach(q => {
        // Strip leading question number prefix
        q.text = q.text.replace(/^\d+\s+(?=[A-Z])/, '').trim();
        // Remove redundant labels
        q.text = q.text.replace(/\b(Rectangle|Frame|Table)\s+Dimensions\b/gi, '').replace(/\s{2,}/g, ' ').trim();
        // Fix PSSA number formatting in text and all options
        q.text = fixPSSANumbers(q.text);
        q.correct = fixPSSANumbers(q.correct);
        q.options = q.options.map(o => fixPSSANumbers(o));
        q.guide = fixPSSANumbers(q.guide || '');
    });

    // ── Final cleanup: filter out garbage questions ──
    return questions.filter(q => {
        // Skip questions with very short text
        if (q.text.length < 10) return false;
        // Skip if question text has no meaningful content
        const hasLetters = (q.text.match(/[a-zA-Z]/g) || []).length >= 5;
        const hasMathOps = /[×÷+\-=<>≤≥]/.test(q.text);
        if (!hasLetters && !hasMathOps) return false;
        // Skip if answer is way too long (merged questions)
        if (q.correct.length > 200) return false;
        // Skip if options contain other question numbers like "31)" or content from other questions
        const optsJoined = q.options.join(' ');
        if (/\b\d{2}\)\s/.test(optsJoined) && optsJoined.length > 300) return false;
        // Skip graph/diagram/visual questions that can't be represented as text
        const graphPatterns = /write an inequality for each graph|sketch a net|find the area.*polygon|find the volume.*prism|number line.*shown|number line.*below|number line.*represents|number line models|line plot.*below|line plot.*represents|box plot|bar graph|histogram|scatter plot|coordinate (plane|grid)|graph shown below|use the (graph|plot|diagram|box plot|number line)|make a box plot|identify the polyhedron|assembled from.*net|segments from.*lines form|rectangular prism shown below|parallel lines are intersected.*as shown|figure shown below/i;
        if (graphPatterns.test(q.text)) return false;
        if (graphPatterns.test(q.correct)) return false;
        // Skip if answer doesn't match any option (sign of bad parse)
        if (!q.openEnded && q.options.indexOf(q.correct) === -1) return false;
        // Skip if any option contains sub-question markers (open-ended merged in)
        if (q.options.some(o => /^(What does|How many|Explain|What is the .* cost)/i.test(o))) return false;
        // Skip if question text contains chart/plot data patterns
        if (/Change in Attendance|Change in Membership|Minutes to Run|Men.?s Heights/i.test(q.text)) return false;
        // Skip if options contain long gibberish from merged content
        if (q.options.some(o => o.length > 250)) return false;
        return true;
    }).map(q => {
        // Clean up question text — remove redundant labels like "Rectangle Dimensions", "Frame Dimensions"
        q.text = q.text
            .replace(/\b(Rectangle|Frame|Table)\s+Dimensions\b/gi, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
        return q;
    });
}

function renderCustomPreview(questions) {
    const container = document.getElementById('custom-preview');

    if (questions.length === 0) {
        container.innerHTML = '<p style="color:var(--incorrect);margin-bottom:1rem;">No questions could be parsed. Try adding clear Answer: lines to each problem.</p>';
        document.getElementById('custom-save-section').classList.add('hidden');
        return;
    }

    const invalid = questions.filter(q => q.validationError).length;

    let html = `<div class="preview-header">
        <span>${questions.length} Question${questions.length !== 1 ? 's' : ''} Parsed</span>
        ${invalid > 0 ? `<span class="preview-invalid-count">⚠ ${invalid} wrong answer${invalid !== 1 ? 's' : ''} detected</span>` : '<span class="preview-valid-count">✓ All answers verified</span>'}
    </div>`;

    if (invalid > 0) {
        html += `<button class="apply-corrections-btn" onclick="applyAnswerCorrections()">Apply All ${invalid} Correction${invalid !== 1 ? 's' : ''}</button>`;
    }

    questions.forEach((q, i) => {
        const rm = typeof renderMathInHTML === 'function' ? renderMathInHTML : (x => x);
        const correctIdx = q.options ? q.options.indexOf(q.correct) : -1;

        html += `<div class="custom-question-card" id="custom-q-${i}" style="padding:1rem;margin-bottom:0.75rem;border:1px solid var(--border-color);border-radius:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                <strong>Q${i + 1}</strong>
                <div style="display:flex;gap:0.4rem;">
                    <button class="btn" style="padding:0.2rem 0.5rem;font-size:0.7rem;" onclick="toggleEditQuestion(${i})">Edit</button>
                    <button class="btn" style="padding:0.2rem 0.5rem;font-size:0.7rem;background:var(--incorrect);" onclick="removeCustomQuestion(${i})">Remove</button>
                </div>
            </div>
            <div id="custom-q-display-${i}">
                <div style="margin-bottom:0.4rem;">${rm(q.text)}</div>
                ${!q.openEnded && q.options ? q.options.map((o, j) => {
                    const isCorrect = o === q.correct;
                    return `<div style="padding:0.2rem 0.5rem;${isCorrect ? 'color:var(--correct);font-weight:600;' : ''}">${String.fromCharCode(65+j)}) ${rm(o)} ${isCorrect ? '✓' : ''}</div>`;
                }).join('') : ''}
            </div>
            <div id="custom-q-edit-${i}" class="hidden" style="margin-top:0.5rem;">
                <textarea class="text-input" style="font-size:0.85rem;min-height:50px;margin-bottom:0.4rem;" onchange="updateCustomText(${i},this.value)">${(q.text || '').replace(/</g,'&lt;')}</textarea>
                ${!q.openEnded && q.options ? q.options.map((o, j) => {
                    const isCorrect = o === q.correct;
                    return `<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.3rem;">
                        <input type="radio" name="correct-${i}" ${isCorrect ? 'checked' : ''} onchange="updateCustomCorrect(${i},${j})">
                        <input type="text" class="text-input" style="font-size:0.85rem;padding:0.3rem 0.5rem;flex:1;" value="${(o || '').replace(/"/g,'&quot;')}" onchange="updateCustomOption(${i},${j},this.value)">
                    </div>`;
                }).join('') : ''}
                <button class="btn" style="padding:0.25rem 0.6rem;font-size:0.75rem;margin-top:0.3rem;" onclick="toggleEditQuestion(${i})">Done</button>
            </div>
        </div>`;
    });

    container.innerHTML = html;
    document.getElementById('custom-save-section').classList.remove('hidden');
}

function updateCustomText(index, value) {
    if (parsedCustomQuestions[index]) {
        parsedCustomQuestions[index].text = value;
    }
}

function updateCustomOption(index, optIdx, value) {
    if (parsedCustomQuestions[index] && parsedCustomQuestions[index].options[optIdx] !== undefined) {
        const wasCorrect = parsedCustomQuestions[index].options[optIdx] === parsedCustomQuestions[index].correct;
        parsedCustomQuestions[index].options[optIdx] = value;
        if (wasCorrect) {
            parsedCustomQuestions[index].correct = value;
        }
    }
}

function updateCustomCorrect(index, optIdx) {
    if (parsedCustomQuestions[index]) {
        parsedCustomQuestions[index].correct = parsedCustomQuestions[index].options[parseInt(optIdx)];
    }
}

function toggleEditQuestion(index) {
    const display = document.getElementById(`custom-q-display-${index}`);
    const edit = document.getElementById(`custom-q-edit-${index}`);
    if (display && edit) {
        display.classList.toggle('hidden');
        edit.classList.toggle('hidden');
    }
}

function previewCustomTest() {
    if (parsedCustomQuestions.length === 0) { alert('No questions to preview.'); return; }

    const rm = typeof renderMathInHTML === 'function' ? renderMathInHTML : (x => x);
    let previewHTML = `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;" onclick="if(event.target===this)this.remove()">
        <div style="background:var(--bg-panel);width:90%;max-width:700px;max-height:85vh;overflow-y:auto;border-radius:8px;padding:2rem;position:relative;">
            <button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:0.75rem;right:1rem;background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-secondary);">&times;</button>
            <h2 style="margin-bottom:1rem;">Test Preview</h2>
            <p style="color:var(--text-secondary);margin-bottom:1.5rem;">${parsedCustomQuestions.length} questions</p>`;

    parsedCustomQuestions.forEach((q, i) => {
        previewHTML += `<div style="margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid var(--border-color);">
            <div style="font-weight:600;margin-bottom:0.5rem;">Question ${i + 1}</div>
            <div style="margin-bottom:0.75rem;">${rm(q.text)}</div>`;
        if (!q.openEnded && q.options) {
            previewHTML += '<div style="display:flex;flex-direction:column;gap:0.5rem;">';
            q.options.forEach((o, j) => {
                previewHTML += `<div style="padding:0.6rem 1rem;border:1px solid var(--border-color);border-radius:8px;cursor:default;">${String.fromCharCode(65+j)}) ${rm(o)}</div>`;
            });
            previewHTML += '</div>';
        }
        previewHTML += '</div>';
    });

    previewHTML += '</div></div>';
    document.body.insertAdjacentHTML('beforeend', previewHTML);
}

function removeCustomQuestion(index) {
    parsedCustomQuestions.splice(index, 1);
    renderCustomPreview(parsedCustomQuestions);
    const statusEl = document.getElementById('custom-process-status');
    if (parsedCustomQuestions.length === 0) {
        statusEl.textContent = 'All questions removed.';
        statusEl.className = 'process-status error';
        document.getElementById('custom-save-section').classList.add('hidden');
    } else {
        statusEl.textContent = `${parsedCustomQuestions.length} question${parsedCustomQuestions.length !== 1 ? 's' : ''} remaining`;
        statusEl.className = 'process-status done';
    }
}


function updateCustomAssignOptions() {
    if (!document.getElementById('custom-assign-by')) return;
    const assignBy = document.getElementById('custom-assign-by').value;
    document.getElementById('custom-assign-grade-row').classList.toggle('hidden', assignBy !== 'grade');
    document.getElementById('custom-assign-class-row').classList.toggle('hidden', assignBy !== 'class');
    const studentRow = document.getElementById('custom-assign-student-row');
    if (studentRow) studentRow.classList.toggle('hidden', assignBy !== 'student');
}

function saveCustomTest() {
    if (parsedCustomQuestions.length === 0) return;
    if (!document.getElementById('custom-test-name')) return;

    const name = document.getElementById('custom-test-name').value.trim() || 'Custom Test';
    const assignBy = document.getElementById('custom-assign-by').value;
    const redemption = document.getElementById('custom-redemption').checked;
    const testId = 'custom_' + Date.now();

    let targetKey;
    if (assignBy === 'class') {
        targetKey = 'class:' + document.getElementById('custom-target-class').value;
    } else if (assignBy === 'student') {
        const studentInput = document.getElementById('custom-target-student');
        const studentName = studentInput ? studentInput.value.trim() : '';
        if (!studentName) { alert('Please select a student.'); return; }
        targetKey = 'student:' + studentName.toLowerCase();
    } else {
        targetKey = 'grade:' + document.getElementById('custom-target-grade').value;
    }

    let testData;
    if (state._customDynamic) {
        testData = {
            id: testId,
            name,
            dynamic: true,
            descriptors: parsedCustomQuestions.filter(q => q._descriptor).map(q => q._descriptor),
            staticQuestions: parsedCustomQuestions.filter(q => !q._descriptor),
            createdAt: new Date().toLocaleDateString()
        };
    } else {
        testData = {
            id: testId,
            name,
            createdAt: new Date().toLocaleDateString(),
            questions: parsedCustomQuestions
        };
    }
    saveCustomTestData(testId, testData);

    const assignments = getAssignments();
    if (!assignments[targetKey]) assignments[targetKey] = [];
    const assignItem = { type: 'custom', testId, name, redemption, assignedAt: new Date().toLocaleDateString() };

    // Add due date if set
    const dueDateEl = document.getElementById('custom-due-date');
    if (dueDateEl && dueDateEl.value) assignItem.dueDate = dueDateEl.value;

    // Add timer if set
    const timerEl = document.getElementById('custom-timer-minutes');
    if (timerEl && timerEl.value) assignItem.timerMinutes = parseInt(timerEl.value);

    // Add available at if set
    const customAvailEl = document.getElementById('custom-available-at');
    if (customAvailEl && customAvailEl.value) assignItem.availableAt = customAvailEl.value;

    assignments[targetKey].push(assignItem);
    saveAssignments(assignments);

    // Reset form
    document.getElementById('custom-problems-input').value = '';
    document.getElementById('custom-test-name').value = '';
    document.getElementById('custom-preview').innerHTML = '';
    document.getElementById('custom-save-section').classList.add('hidden');
    document.getElementById('custom-process-status').textContent = '';
    document.getElementById('custom-process-status').className = 'process-status';
    const cdd = document.getElementById('custom-due-date'); if (cdd) cdd.value = '';
    const ctm = document.getElementById('custom-timer-minutes'); if (ctm) ctm.value = '';
    if (customAvailEl) customAvailEl.value = '';
    parsedCustomQuestions = [];

    renderAdminAssignments();

    const targetLabel = formatAssignmentTarget(targetKey);
    showAlert(`"${name}" saved and assigned to ${targetLabel}.`, 'success');
}

function startCustomTest(testId, redemptionEnabled = true) {
    const customTests = getCustomTests();
    const test = customTests[testId];
    if (!test) { showAlert('Test not found.', 'error'); return; }

    state.queue = [];

    if (test.dynamic) {
        // Rehydrate dynamic descriptors into live templates
        for (const desc of (test.descriptors || [])) {
            state.queue.push(constructItem(rehydrate(desc)));
        }
        // Add static fallback questions directly
        for (const sq of (test.staticQuestions || [])) {
            state.queue.push({ ...sq });
        }
    } else {
        state.queue = test.questions.map(q => ({ ...q }));
    }

    state.currentIndex = 0;
    state.initialScore = 0;
    state.redemptionsAdded = 0;
    state.baseItemCount = state.queue.length;
    state.sessionStatus = 'testing'; stopStudentPolling();
    state.isPaused = false;
    state.testType = 'custom';
    state.grade = test.name;
    state.redemptionEnabled = redemptionEnabled;
    state.wrongAnswers = [];
    state.allAnswers = [];

    document.getElementById('view-assigned').classList.add('hidden');
    document.getElementById('test-tabs').style.display = 'none'; hideSidebar();
    document.getElementById('view-assessment').classList.remove('hidden');
    state.answers = state.queue.map(() => ({ selected: null, answered: false, correct: null }));
    state.flagged = new Set();
    loadItem();
    startTimer();
}

// ========== ASSIGNED TESTS VIEW ==========

function getCompletedTestKeys(studentName) {
    const scores = getScores();
    const keys = new Set();
    scores.forEach(s => {
        if (s.student === studentName.toLowerCase()) {
            keys.add(s.testLevel);
        }
    });
    return keys;
}

function testKey(test) {
    if (test.type === 'pssa') return `PSSA Grade ${test.grade}`;
    if (test.type === 'keystone') return `Keystone ${test.subject.charAt(0).toUpperCase() + test.subject.slice(1)}`;
    if (test.type === 'custom') return test.name;
    return '';
}

function renderAssignedTests() {
    const assignments = getAssignments();
    const container = document.getElementById('assigned-tests-list');
    const completed = getCompletedTestKeys(state.currentUser);

    // Collect assignments matching this user's grade and ALL classes
    let userAssignments = [];
    const gradeKey = 'grade:' + state.currentGrade;

    // Grade-based assignments
    if (assignments[gradeKey]) userAssignments = userAssignments.concat(assignments[gradeKey]);

    // All enrolled classes
    (state.currentClasses || []).forEach(cls => {
        const classKey = 'class:' + cls;
        if (assignments[classKey]) userAssignments = userAssignments.concat(assignments[classKey]);
    });
    // Backward compat: single class
    const classKey = state.currentClass ? 'class:' + state.currentClass : null;
    if (classKey && assignments[classKey] && !(state.currentClasses || []).includes(state.currentClass)) {
        userAssignments = userAssignments.concat(assignments[classKey]);
    }
    // Student-specific assignments
    const studentKey = 'student:' + (state.currentUser || '').toLowerCase();
    if (assignments[studentKey]) userAssignments = userAssignments.concat(assignments[studentKey]);
    // Legacy format (bare grade key)
    if (assignments[state.currentGrade]) userAssignments = userAssignments.concat(assignments[state.currentGrade]);

    // Filter out expired and completed tests
    const now = new Date();
    const available = userAssignments.filter(test => {
        if (completed.has(testKey(test))) return false;
        // Allow 3-day grace period after due date
        if (test.dueDate) {
            const overdueCutoff = new Date(now);
            overdueCutoff.setDate(overdueCutoff.getDate() - 3);
            if (new Date(test.dueDate + 'T23:59:59') < overdueCutoff) return false;
        }
        return true;
    });

    if (available.length === 0) {
        const msg = userAssignments.length > 0
            ? 'You have completed all assigned tests (or they have expired).'
            : 'No tests have been assigned to you yet. Please check with your administrator.';
        container.innerHTML = `<p style="color: var(--text-secondary);">${msg}</p>`;
        return;
    }

    let html = '<div class="grid-select">';
    available.forEach((test) => {
        const r = test.redemption !== false;
        const redemptionNote = r ? '' : '<small style="color:var(--warning);font-size:0.75rem;display:block;margin-top:0.2rem;">No redemption</small>';
        let dueNote = '';
        if (test.dueDate) {
            const dueInfo = formatDueDate(test.dueDate);
            dueNote = `<small class="due-badge ${dueInfo.cssClass}" style="font-size:0.75rem;display:block;margin-top:0.2rem;">${dueInfo.text}</small>`;
        }
        const timerNote = test.timerMinutes ? `<small style="font-weight:normal;font-size:0.75rem;display:block;margin-top:0.2rem;color:var(--text-secondary);">Time: ${test.timerMinutes} min</small>` : '';
        const tm = test.timerMinutes || 0;
        const qc = test.questionCount || 20;

        // Check if test is scheduled for the future
        const isScheduled = test.availableAt && new Date(test.availableAt) > now;
        let scheduleNote = '';
        if (isScheduled) {
            const availDate = new Date(test.availableAt);
            const diffMs = availDate - now;
            const diffHrs = Math.floor(diffMs / 3600000);
            const diffMins = Math.floor((diffMs % 3600000) / 60000);
            if (diffHrs >= 24) {
                const diffDays = Math.floor(diffHrs / 24);
                scheduleNote = `<small style="font-weight:600;font-size:0.75rem;display:block;margin-top:0.3rem;color:var(--primary-color);">Unlocks in ${diffDays} day${diffDays !== 1 ? 's' : ''}</small>`;
            } else if (diffHrs > 0) {
                scheduleNote = `<small style="font-weight:600;font-size:0.75rem;display:block;margin-top:0.3rem;color:var(--primary-color);">Unlocks in ${diffHrs}h ${diffMins}m</small>`;
            } else {
                scheduleNote = `<small style="font-weight:600;font-size:0.75rem;display:block;margin-top:0.3rem;color:var(--primary-color);">Unlocks in ${diffMins} min</small>`;
            }
        }

        const disabledStyle = isScheduled ? 'opacity:0.5;pointer-events:none;' : '';

        if (test.type === 'pssa') {
            const label = test.name || `PSSA Grade ${test.grade}`;
            html += `<button class="btn-outline" style="${disabledStyle}" ${isScheduled ? 'disabled' : `onclick="state.wasAssigned=true;state.assignmentVisibleToParent=${!!test.visibleToParent};state.timerMinutes=${tm};generateBank(${test.grade}, ${r}, ${qc})"`}>
                <strong>${label}</strong> <small style="font-weight:normal;color:var(--text-secondary);">(${qc}Q)</small><br>
                <small style="font-weight:normal;font-size:0.8rem;color:var(--text-secondary);">Assigned: ${test.assignedAt}</small>${scheduleNote}${dueNote}${timerNote}${redemptionNote}
            </button>`;
        } else if (test.type === 'keystone') {
            const subjectLabel = test.subject.charAt(0).toUpperCase() + test.subject.slice(1);
            const label = test.name || `Keystone ${subjectLabel}`;
            html += `<button class="btn-outline" style="${disabledStyle}" ${isScheduled ? 'disabled' : `onclick="state.wasAssigned=true;state.assignmentVisibleToParent=${!!test.visibleToParent};state.timerMinutes=${tm};generateKeystoneBank('${test.subject}', ${r}, ${qc})"`}>
                <strong>${label}</strong> <small style="font-weight:normal;color:var(--text-secondary);">(${qc}Q)</small><br>
                <small style="font-weight:normal;font-size:0.8rem;color:var(--text-secondary);">Assigned: ${test.assignedAt}</small>${scheduleNote}${dueNote}${timerNote}${redemptionNote}
            </button>`;
        } else if (test.type === 'custom') {
            html += `<button class="btn-outline" style="${disabledStyle}" ${isScheduled ? 'disabled' : `onclick="state.wasAssigned=true;state.assignmentVisibleToParent=${!!test.visibleToParent};state.timerMinutes=${tm};startCustomTest('${test.testId}', ${r})"`}>
                <strong>${test.name}</strong><br>
                <small style="font-weight:normal;font-size:0.8rem;color:var(--text-secondary);">Assigned: ${test.assignedAt}</small>${scheduleNote}${dueNote}${timerNote}${redemptionNote}
            </button>`;
        }
    });
    html += '</div>';
    container.innerHTML = html;
}

function toggleHamburger() {
    const menu = document.getElementById('hamburger-menu');
    menu.classList.toggle('hidden');
}

// Close hamburger when clicking outside
document.addEventListener('click', (e) => {
    const wrap = document.getElementById('test-tabs');
    const menu = document.getElementById('hamburger-menu');
    if (wrap && menu && !wrap.contains(e.target)) {
        menu.classList.add('hidden');
    }
    // Close math grid dropdown when clicking outside
    const mathGrid = document.getElementById('math-grid-dropdown');
    const mathToggle = document.getElementById('math-grid-toggle');
    if (mathGrid && mathToggle && !mathGrid.contains(e.target) && !mathToggle.contains(e.target)) {
        mathGrid.classList.add('hidden');
    }
    // Close test settings popup when clicking outside
    const settingsPopup = document.getElementById('test-settings-popup');
    const settingsWrap = e.target.closest('.test-settings-wrap');
    if (settingsPopup && !settingsWrap) {
        settingsPopup.classList.add('hidden');
    }
});

function toggleMathGrid() {
    const grid = document.getElementById('math-grid-dropdown');
    if (grid) grid.classList.toggle('hidden');
}

function switchTestType(type, clickedBtn) {
    // Close sidebar on mobile after selecting
    if (isMobile()) closeMobileSidebar();

    state.testType = type;
    state.grade = null;
    state.subject = null;
    state.queue = [];
    state.currentIndex = 0;

    // Update active state on sidebar items and hamburger items
    document.querySelectorAll('.sidebar-item, .hamburger-item').forEach(btn => btn.classList.remove('active'));
    if (clickedBtn) clickedBtn.classList.add('active');

    // Close hamburger dropdown if it exists
    const hMenu = document.getElementById('hamburger-menu');
    if (hMenu) hMenu.classList.add('hidden');

    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-keystone-dashboard').classList.add('hidden');
    document.getElementById('view-assigned').classList.add('hidden');
    const progressView = document.getElementById('view-progress');
    if (progressView) progressView.classList.add('hidden');
    const settingsView = document.getElementById('view-settings');
    if (settingsView) settingsView.classList.add('hidden');
    const helpView = document.getElementById('view-help');
    if (helpView) helpView.classList.add('hidden');
    const courseInfoView = document.getElementById('view-courseInfo');
    if (courseInfoView) courseInfoView.classList.add('hidden');

    if (type === 'pssa') {
        document.getElementById('view-dashboard').classList.remove('hidden');
    } else if (type === 'keystone') {
        document.getElementById('view-keystone-dashboard').classList.remove('hidden');
    } else if (type === 'assigned') {
        document.getElementById('view-assigned').classList.remove('hidden');
        renderAssignedTests();
    } else if (type === 'progress') {
        if (progressView) progressView.classList.remove('hidden');
        renderStudentProgress();
    } else if (type === 'courseInfo') {
        if (courseInfoView) courseInfoView.classList.remove('hidden');
        renderCourseInfo();
    } else if (type === 'help') {
        if (helpView) helpView.classList.remove('hidden');
        renderMyHelpRequests();
    } else if (type === 'settings') {
        if (settingsView) settingsView.classList.remove('hidden');
        loadTestSettings();
    }
}

function showSidebar() {
    const sidebar = document.getElementById('sidebar') || document.getElementById('admin-sidebar');
    if (sidebar) {
        sidebar.classList.remove('hidden');
        document.body.classList.add('has-sidebar');
    }
}

function hideSidebar() {
    const sidebar = document.getElementById('sidebar') || document.getElementById('admin-sidebar');
    if (sidebar) {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('mobile-open');
        document.body.classList.remove('has-sidebar');
    }
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) backdrop.classList.remove('visible');
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar') || document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;

    const isOpen = sidebar.classList.contains('mobile-open');
    if (isOpen) {
        sidebar.classList.remove('mobile-open');
        if (backdrop) backdrop.classList.remove('visible');
    } else {
        sidebar.classList.add('mobile-open');
        if (backdrop) backdrop.classList.add('visible');
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar') || document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('visible');
}

function isMobile() {
    return window.innerWidth <= 768;
}

// Debounced focus violation detection to prevent false triggers
let _focusViolationTimeout = null;

function checkFocusViolation() {
    if (state.sessionStatus !== 'testing' || state.isPaused) return;

    // Only trigger on actual tab/window switches (visibilitychange),
    // ignore momentary blur from dropdowns, modals, devtools focus, etc.
    if (document.hidden) {
        // Tab is actually hidden — real violation
        if (!_focusViolationTimeout) {
            _focusViolationTimeout = setTimeout(() => {
                _focusViolationTimeout = null;
                if (state.sessionStatus === 'testing' && !state.isPaused && document.hidden) {
                    handleFocusViolation();
                }
            }, 300);
        }
    }
}

function clearFocusTimeout() {
    if (_focusViolationTimeout) {
        clearTimeout(_focusViolationTimeout);
        _focusViolationTimeout = null;
    }
}

// Only listen to visibilitychange — this is the reliable cross-browser event
// for detecting actual tab switches. blur/pagehide cause false positives.
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        checkFocusViolation();
    } else {
        clearFocusTimeout();
    }
});

function handleFocusViolation() {
    if (state.sessionStatus !== 'testing' || state.isPaused) return;
    state.isPaused = true;
    pauseTimer();
    state.warnings++;
    let warningsLeft = state.maxWarnings - state.warnings;

    if (warningsLeft < 0) {
        terminateSession();
    } else {
        document.getElementById('warnings-left').innerText = warningsLeft;
        document.getElementById('warning-modal').classList.remove('hidden');
    }
}

function resumeTest() {
    document.getElementById('warning-modal').classList.add('hidden');
    state.isPaused = false;
    resumeTimer();
}

function terminateSession() {
    stopTimer();
    startStudentPolling();
    state.sessionStatus = 'terminated';
    state.isPaused = true;
    document.getElementById('warning-modal').classList.add('hidden');
    document.getElementById('view-assessment').classList.add('hidden');
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-keystone-dashboard').classList.add('hidden');
    document.getElementById('view-assigned').classList.add('hidden');
    document.getElementById('view-terminated').classList.remove('hidden');
    document.getElementById('test-tabs').style.display = 'block'; showSidebar();

    if (state.currentUser) {
        let testLevel = '(in progress)';
        if (state.testType === 'pssa' && state.grade) testLevel = `PSSA Grade ${state.grade}`;
        else if (state.testType === 'keystone' && state.subject) testLevel = `Keystone ${state.subject.charAt(0).toUpperCase() + state.subject.slice(1)}`;
        else if (state.testType === 'custom' && state.grade) testLevel = state.grade;

        saveScore({
            student: state.currentUser.toLowerCase(),
            studentDisplayName: state.currentUser,
            studentGrade: state.currentGrade || '—',
            studentClass: state.currentClass || '—',
            source: state.wasAssigned ? 'assigned' : 'practice',
            testLevel,
            accuracy: 'TERMINATED',
            initialScore: state.initialScore,
            baseItemCount: state.baseItemCount,
            redemptions: state.redemptionsAdded,
            totalQuestions: state.queue.length,
            wrongAnswers: state.wrongAnswers || [],
            allAnswers: state.allAnswers || [],
            terminated: true,
            completedAt: new Date().toLocaleDateString()
        });
        state.wasAssigned = false;
    }
}

function generateBank(grade, redemptionEnabled = true, questionCount = 20) {
    state.testType = 'pssa';
    state.grade = grade;
    state.queue = [];
    state.currentIndex = 0;
    state.initialScore = 0;
    state.baseItemCount = questionCount;
    state.redemptionsAdded = 0;
    state.redemptionEnabled = redemptionEnabled;
    state.wrongAnswers = [];
    state.allAnswers = [];

    // Build queue from extra dynamic templates only
    const templatePool = getExtraTemplatePool('pssa', String(grade));
    const source = templatePool.length > 0 ? templatePool : (Templates[grade] || Templates[8]);
    const customCount = source.filter(t => t._isCustom).length;
    console.log('[TEST] Grade', grade, '| Pool size:', source.length, '| Custom skills in pool:', customCount);
    for (let i = 0; i < state.baseItemCount; i++) {
        try {
            state.queue.push(constructItem(source[i % source.length]));
        } catch (e) {
            console.error('Template generation error at index ' + i + ':', e);
        }
    }
    state.queue = shuffle(state.queue);

    state.sessionStatus = 'testing'; stopStudentPolling();
    state.isPaused = false;
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-assigned').classList.add('hidden');
    document.getElementById('test-tabs').style.display = 'none'; hideSidebar();
    document.getElementById('view-assessment').classList.remove('hidden');

    // Filter out any failed items and proceed
    state.queue = state.queue.filter(q => q && q.text && q.correct);
    if (state.queue.length === 0) {
        document.getElementById('view-assessment').classList.add('hidden');
        document.getElementById('view-dashboard').classList.remove('hidden');
        document.getElementById('test-tabs').style.display = 'block'; showSidebar();
        showAlert('Failed to generate questions. Please try again.', 'error');
        return;
    }
    state.answers = state.queue.map(() => ({ selected: null, answered: false, correct: null }));
    state.flagged = new Set();
    loadItem();
    startTimer();
}

function generateKeystoneBank(subject, redemptionEnabled = true, questionCount = 20) {
    state.testType = 'keystone';
    state.subject = subject;
    state.queue = [];
    state.currentIndex = 0;
    state.initialScore = 0;
    state.baseItemCount = questionCount;
    state.redemptionsAdded = 0;
    state.redemptionEnabled = redemptionEnabled;
    state.wrongAnswers = [];
    state.allAnswers = [];

    // Build question pool from templates
    {
        // Map subject name to extra-templates key (e.g. 'algebra' -> 'algebra1')
        const extraKey = subject + '1';
        const extraPool = getExtraTemplatePool('keystone', extraKey).length > 0
            ? getExtraTemplatePool('keystone', extraKey)
            : getExtraTemplatePool('keystone', subject);

        const templatePool = Templates[subject] || Templates.algebra || [];
        let balancedTemplates = [];

        for (let i = 0; i < state.baseItemCount; i++) {
            balancedTemplates.push(templatePool[i % templatePool.length]);
        }
        balancedTemplates = shuffle(balancedTemplates);

        for (let i = 0; i < state.baseItemCount; i++) {
            try { state.queue.push(constructItem(balancedTemplates[i])); } catch(e) {}
        }

        // Mix in extra templates
        try {
            state.queue = state.queue.concat(extraPool.map(t => constructItem(t)));
        } catch(e) {}
        state.queue = state.queue.filter(q => q && q.text && q.correct);
        state.queue = shuffle(state.queue);

        // Trim to requested count
        if (state.queue.length > questionCount) {
            state.queue = state.queue.slice(0, questionCount);
        }

        state.sessionStatus = 'testing'; stopStudentPolling();
        state.isPaused = false;
        document.getElementById('view-keystone-dashboard').classList.add('hidden');
        document.getElementById('view-assigned').classList.add('hidden');
        document.getElementById('test-tabs').style.display = 'none'; hideSidebar();
        document.getElementById('view-assessment').classList.remove('hidden');

        if (state.queue.length > 0) {
            state.answers = state.queue.map(() => ({ selected: null, answered: false, correct: null }));
            state.flagged = new Set();
            loadItem();
            startTimer();
        }
    }
}

// ========== EXTRA TEMPLATE HELPERS ==========

function getExtraTemplatePool(category, key) {
    if (typeof extraTemplates === 'undefined') return [];
    return (extraTemplates[category] || {})[key] || [];
}

function constructItem(template) {
    let rawData = template.gen();

    if (template._isCustom) {
        console.log('[CONSTRUCT] Custom skill "' + template.type + '" | Q:', (rawData.q || '').substring(0, 60) + '... | A:', rawData.ans);
    }

    let itemData = {
        templateRef: template,
        text: rawData.q,
        correct: String(rawData.ans),
        guide: rawData.guide,
        render: rawData.render || null,
        openEnded: template.openEnded,
        visualHTML: rawData.visualHTML || null,
        optionVisualsByText: rawData.optionVisualsByText || null,
        answerVisual: rawData.answerVisual || null
    };

    if (!template.openEnded) {
        const uniqueChoices = getUniqueChoices(rawData.ans, rawData.distractors);
        itemData.options = shuffle(uniqueChoices);
    }

    return itemData;
}

function loadItem() {
    const prevAnswer = state.answers[state.currentIndex];
    state.selectedOption = (prevAnswer && prevAnswer.selected) ? prevAnswer.selected : null;
    let index = state.currentIndex;
    const q = state.queue[index];
    const total = state.queue.length;

    if (state.testType === 'pssa') {
        document.getElementById('label-grade').innerText = `Grade ${state.grade}`;
    } else if (state.testType === 'custom') {
        document.getElementById('label-grade').innerText = state.grade;
    } else {
        const subjectLabel = state.subject.charAt(0).toUpperCase() + state.subject.slice(1);
        document.getElementById('label-grade').innerText = `Keystone ${subjectLabel}`;
    }
    document.getElementById('label-progress').innerText = `Item ${index + 1} of ${total}`;
    document.getElementById('container-question').innerHTML = renderMathInHTML(q.text);

    const graphContainer = document.getElementById('container-graph');
    graphContainer.innerHTML = '';
    let hasVisual = false;

    if (q.render) {
        const canvas = document.createElement('canvas');
        canvas.width = (state.grade === 3) ? 400 : 300;
        canvas.height = (state.grade === 3) ? 230 : 300;
        const ctx = canvas.getContext('2d');
        q.render(canvas, ctx);
        graphContainer.appendChild(canvas);
        hasVisual = true;
    }
    if (q._equation && typeof renderEquationGraph === 'function') {
        const canvas = document.createElement('canvas');
        canvas.width = 300; canvas.height = 300;
        const ctx = canvas.getContext('2d');
        renderEquationGraph(canvas, ctx, q._equation);
        graphContainer.appendChild(canvas);
        hasVisual = true;
    }
    if (q._drawingDataUrl) {
        const img = document.createElement('img');
        img.src = q._drawingDataUrl;
        img.style.cssText = 'max-width:100%;border-radius:8px;border:1px solid var(--border-color);';
        graphContainer.appendChild(img);
        hasVisual = true;
    }
    if (q.visualHTML) {
        const svgWrap = document.createElement('div');
        svgWrap.style.cssText = 'max-width:100%;overflow:hidden;margin:0 auto;text-align:center;';
        svgWrap.innerHTML = q.visualHTML;
        graphContainer.appendChild(svgWrap);
        hasVisual = true;
    }
    graphContainer.classList.toggle('hidden', !hasVisual);

    const optionsContainer = document.getElementById('container-options');
    optionsContainer.innerHTML = '';
    const actionBtn = document.getElementById('btn-action');
    actionBtn.innerText = "Submit Response";
    actionBtn.disabled = true;
    actionBtn.onclick = processResponse;

    if (q.openEnded) {
        optionsContainer.innerHTML = `<div id="answer-visual-reveal" class="hidden" style="max-width:100%;overflow:hidden;margin-bottom:0.6rem;text-align:center;"></div><div class="math-input-wrap">
            <input type="text" id="response-input" class="text-input" placeholder="Enter your response here..." autocomplete="off">
            <button type="button" class="math-grid-toggle" id="math-grid-toggle" onclick="toggleMathGrid()" title="Insert math symbol">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="10" y1="2" x2="10" y2="18"/>
                    <line x1="2" y1="10" x2="18" y2="10"/>
                    <line x1="2" y1="5" x2="8" y2="5"/>
                    <line x1="14" y1="3" x2="18" y2="7"/>
                    <line x1="18" y1="3" x2="14" y2="7"/>
                    <line x1="3" y1="14" x2="7" y2="14"/>
                    <line x1="13" y1="16" x2="17" y2="16"/>
                    <circle cx="15" cy="14" r="0.8" fill="currentColor" stroke="none"/>
                    <circle cx="15" cy="18" r="0.8" fill="currentColor" stroke="none"/>
                </svg>
            </button>
            <div class="math-grid-dropdown hidden" id="math-grid-dropdown">
                <button type="button" class="math-btn" data-insert="+" title="Plus">+</button>
                <button type="button" class="math-btn" data-insert="-" title="Minus">&minus;</button>
                <button type="button" class="math-btn" data-insert="×" title="Multiply">&times;</button>
                <button type="button" class="math-btn" data-insert="÷" title="Divide">&divide;</button>
                <button type="button" class="math-btn" data-insert="=" title="Equals">=</button>
                <button type="button" class="math-btn" data-insert="√" title="Square Root">&radic;</button>
                <button type="button" class="math-btn" data-insert="^" title="Exponent">x<sup>n</sup></button>
                <button type="button" class="math-btn" data-insert="/" title="Fraction">&frasl;</button>
                <button type="button" class="math-btn" data-insert="π" title="Pi">&pi;</button>
                <button type="button" class="math-btn" data-insert="°" title="Degrees">&deg;</button>
                <button type="button" class="math-btn" data-insert="±" title="Plus-Minus">&plusmn;</button>
                <button type="button" class="math-btn" data-insert="≠" title="Not Equal">&ne;</button>
                <button type="button" class="math-btn" data-insert="≤" title="Less or Equal">&le;</button>
                <button type="button" class="math-btn" data-insert="≥" title="Greater or Equal">&ge;</button>
                <button type="button" class="math-btn" data-insert="∞" title="Infinity">&infin;</button>
                <button type="button" class="math-btn" data-insert="%" title="Percent">%</button>
            </div>
        </div>`;
        
        const inputEl = document.getElementById('response-input');

        // Setup math symbol buttons
        document.querySelectorAll('.math-grid-dropdown .math-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const symbol = btn.getAttribute('data-insert');
                const cursorPos = inputEl.selectionStart;
                const textBefore = inputEl.value.substring(0, cursorPos);
                const textAfter = inputEl.value.substring(cursorPos);
                inputEl.value = textBefore + symbol + textAfter;
                inputEl.selectionStart = inputEl.selectionEnd = cursorPos + symbol.length;
                inputEl.focus();

                // Trigger input event to update state
                state.selectedOption = inputEl.value.trim();
                document.getElementById('btn-action').disabled = state.selectedOption.length === 0;

                // Close the grid after inserting
                document.getElementById('math-grid-dropdown').classList.add('hidden');
            });
        });
        
        inputEl.addEventListener('input', (e) => {
            state.selectedOption = e.target.value.trim();
            document.getElementById('btn-action').disabled = state.selectedOption.length === 0;
        });
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !document.getElementById('btn-action').disabled) processResponse();
        });
        inputEl.focus();
    } else {
        // Build text-keyed visual map: prefer optionVisualsByText (from constructItem),
        // fall back to optionVisuals (letter-keyed, from custom saved tests)
        let _optVisByText = q.optionVisualsByText || null;
        if (!_optVisByText && q.optionVisuals && q.options) {
            _optVisByText = {};
            q.options.forEach(opt => {
                const m = opt.match(/^([A-D])\)\s*([\s\S]+)/);
                if (m && q.optionVisuals[m[1]]) _optVisByText[m[2].trim()] = q.optionVisuals[m[1]];
            });
            if (!Object.keys(_optVisByText).length) _optVisByText = null;
        }
        q.options.forEach(opt => {
            let btn = document.createElement('button');
            btn.className = 'option-item';
            btn.innerHTML = renderMathInHTML(opt);
            // Strip letter prefix for lookup (options may be "A) text" or just "text")
            const optPlain = opt.replace(/^[A-D]\)\s*/, '');
            const optVis = _optVisByText && (_optVisByText[opt] || _optVisByText[optPlain]);
            if (optVis && optVis.visualHTML) {
                const vDiv = document.createElement('div');
                vDiv.style.cssText = 'margin-top:0.35rem;max-width:100%;overflow:hidden;pointer-events:none;';
                vDiv.innerHTML = optVis.visualHTML;
                btn.appendChild(vDiv);
                btn.style.height = 'auto';
                btn.style.alignItems = 'flex-start';
                btn.style.flexDirection = 'column';
            }
            btn.dataset.value = opt;
            btn.onclick = () => selectOption(btn, opt);
            optionsContainer.appendChild(btn);
        });
    }

    document.getElementById('container-feedback').className = 'hidden';

    // Reset hint
    document.getElementById('hint-content').classList.add('hidden');
    document.getElementById('hint-btn').textContent = 'Show Hint';

    // Restore previous selection for unanswered questions
    if (prevAnswer && prevAnswer.selected && !prevAnswer.answered) {
        if (q.openEnded) {
            const inputEl = document.getElementById('response-input');
            if (inputEl) { inputEl.value = prevAnswer.selected; }
            actionBtn.disabled = false;
        } else {
            document.querySelectorAll('.option-item').forEach(btn => {
                if (btn.dataset.value === prevAnswer.selected) {
                    btn.classList.add('selected');
                    actionBtn.disabled = false;
                }
            });
        }
    }

    // If already answered, show read-only state
    if (prevAnswer && prevAnswer.answered) {
        actionBtn.style.display = 'none';
        if (q.openEnded) {
            const inputEl = document.getElementById('response-input');
            if (inputEl) { inputEl.value = prevAnswer.selected || ''; inputEl.disabled = true; }
            if (q.answerVisual && q.answerVisual.visualHTML) {
                const reveal = document.getElementById('answer-visual-reveal');
                if (reveal) { reveal.innerHTML = q.answerVisual.visualHTML; reveal.classList.remove('hidden'); }
            }
        } else {
            document.querySelectorAll('.option-item').forEach(btn => {
                btn.disabled = true;
                if (btn.dataset.value === q.correct) btn.classList.add('state-correct');
                else if (btn.dataset.value === prevAnswer.selected) btn.classList.add('state-incorrect');
            });
        }
    } else {
        actionBtn.style.display = '';
    }

    // Update flag button
    const flagBtn = document.getElementById('btn-flag');
    if (flagBtn) {
        flagBtn.classList.toggle('flagged', state.flagged.has(index));
        flagBtn.innerHTML = state.flagged.has(index) ? '&#9873; Flagged' : '&#9873; Flag';
    }

    // Render question map and apply settings
    renderQuestionMap();
    applyTestSettings();
    updateTestProgress();
}

async function toggleHint() {
    const q = state.queue[state.currentIndex];
    const hintContent = document.getElementById('hint-content');
    const hintBtn = document.getElementById('hint-btn');

    if (!hintContent.classList.contains('hidden')) {
        hintContent.classList.add('hidden');
        hintBtn.textContent = 'Show Hint';
        return;
    }

    hintContent.classList.remove('hidden');
    hintBtn.textContent = 'Hide Hint';

    // If the question has a custom hint uploaded by admin, use it directly
    if (q.hint) {
        hintContent.innerHTML = renderMathInHTML(q.hint);
        return;
    }

    // No custom hint — try AI
    hintContent.innerHTML = '<span class="spinner-inline"></span><em>Generating hint...</em>';

    const optionsText = q.options ? q.options.join(', ') : '(open-ended)';
    const questionText = q.text.replace(/<[^>]+>/g, '');

    const ollamaAvailable = await AIGenerator.isOllamaAvailable();
    if (ollamaAvailable) {
        try {
            const prompt = `You are a math tutor helping a student who is stuck on a problem. Give a SHORT hint (1-2 sentences max) that guides them toward the right approach WITHOUT revealing the answer.

RULES:
- Do NOT state or reveal the correct answer
- Do NOT say which option is correct
- DO mention the concept, formula, or first step they should think about
- Keep it encouraging and concise

Question: ${questionText}
Answer choices: ${optionsText}

Hint:`;

            const res = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'mistral', prompt, stream: false, options: { temperature: 0.3 } }),
                signal: AbortSignal.timeout(15000)
            });
            const data = await res.json();
            const hint = (data.response || '').trim();
            if (hint) {
                hintContent.innerHTML = renderMathInHTML(hint);
                return;
            }
        } catch (e) {
            // Fall through to built-in hint
        }
    }

    // Fallback: built-in concept hint
    const fallbackHint = buildGuidingHint(q, q.guide || '');
    hintContent.innerHTML = renderMathInHTML(fallbackHint);
}

function buildGuidingHint(q, guide) {
    // Extract the concept/method from the guide without revealing the answer
    const text = q.text.replace(/<[^>]+>/g, '').toLowerCase();

    if (text.includes('area')) return 'Think about the formula for area. Multiply length by width for rectangles, or use A = πr² for circles.';
    if (text.includes('perimeter')) return 'Perimeter means adding up all the sides. For a rectangle, use P = 2(length + width).';
    if (text.includes('volume')) return 'Think about the volume formula for this shape. Length × width × height for boxes, or πr²h for cylinders.';
    if (text.includes('fraction') || text.includes('numerator') || text.includes('denominator')) return 'Remember: fractions represent parts of a whole. Think about what the numerator and denominator each represent.';
    if (text.includes('divide') || text.includes('÷') || text.includes('division')) return 'Think about splitting into equal groups. How many times does the divisor fit into the dividend?';
    if (text.includes('multiply') || text.includes('×') || text.includes('product')) return 'Think about repeated addition. Break the numbers apart if that helps.';
    if (text.includes('percent') || text.includes('%')) return 'Remember: percent means "per hundred." Try converting to a decimal first.';
    if (text.includes('probability')) return 'Probability = favorable outcomes ÷ total outcomes. Count carefully!';
    if (text.includes('slope')) return 'Slope = rise over run, or (y₂ - y₁) / (x₂ - x₁).';
    if (text.includes('equation') || text.includes('solve for')) return 'Try isolating the variable. Do the same operation to both sides.';
    if (text.includes('round')) return 'Look at the digit to the right of the place you are rounding to. 5 or more rounds up.';
    if (text.includes('mean') || text.includes('average')) return 'Mean = sum of all values ÷ number of values.';
    if (text.includes('median')) return 'Put the numbers in order first, then find the middle value.';
    if (text.includes('mode')) return 'Mode is the number that appears most often in the set.';
    if (text.includes('range')) return 'Range = largest value - smallest value.';
    if (text.includes('exponent') || text.includes('^')) return 'An exponent tells you how many times to multiply the base by itself.';
    if (text.includes('factor')) return 'Think about which numbers divide evenly into the given number.';
    if (text.includes('equivalent')) return 'Two expressions are equivalent if they simplify to the same thing. Try simplifying step by step.';
    if (text.includes('convert')) return 'Remember the conversion factor between the two units, then multiply or divide.';
    if (text.includes('pattern') || text.includes('sequence')) return 'Look at the difference between consecutive terms. Is it adding, multiplying, or something else?';
    if (text.includes('coordinate') || text.includes('graph')) return 'Remember: coordinates are (x, y) — horizontal first, then vertical.';
    if (text.includes('triangle')) return 'Think about triangle properties. Do you need the Pythagorean theorem, angle sums, or area formula?';

    // Generic fallback
    return 'Read the question carefully. Identify what operation or concept is being asked about, then work through it step by step.';
}

function selectOption(btnElement, value) {
    if (document.getElementById('btn-action').innerText !== "Submit Response") return;
    document.querySelectorAll('.option-item').forEach(btn => btn.classList.remove('selected'));
    btnElement.classList.add('selected');
    state.selectedOption = value;
    document.getElementById('btn-action').disabled = false;
}

function processResponse() {
    // Guard: don't re-score already answered questions
    if (state.answers[state.currentIndex] && state.answers[state.currentIndex].answered) return;

    const q = state.queue[state.currentIndex];
    const feedbackContainer = document.getElementById('container-feedback');
    let isCorrect = false;

    if (q.openEnded) {
        // Normalize both strings for comparison: remove spaces, convert to lowercase
        const normalizedUserAnswer = normalizeAnswer(state.selectedOption);
        const normalizedCorrectAnswer = normalizeAnswer(q.correct);
        isCorrect = (normalizedUserAnswer === normalizedCorrectAnswer);
        
        const inputEl = document.getElementById('response-input');
        inputEl.disabled = true;
        if (isCorrect) inputEl.classList.add('state-correct');
        else inputEl.classList.add('state-incorrect');

        if (q.answerVisual && q.answerVisual.visualHTML) {
            const reveal = document.getElementById('answer-visual-reveal');
            if (reveal) { reveal.innerHTML = q.answerVisual.visualHTML; reveal.classList.remove('hidden'); }
        }
    } else {
        isCorrect = (state.selectedOption === q.correct);
        document.querySelectorAll('.option-item').forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.value === q.correct) btn.classList.add('state-correct');
            else if (btn.dataset.value === state.selectedOption && !isCorrect) btn.classList.add('state-incorrect');
        });
    }

    // Store answer
    state.answers[state.currentIndex] = { selected: state.selectedOption, answered: true, correct: isCorrect };

    // Store full answer for admin review
    state.allAnswers.push({
        question: q.text,
        correctAnswer: q.correct,
        studentAnswer: state.selectedOption || '(no answer)',
        isCorrect: isCorrect,
        guide: q.guide,
        skill: (q.templateRef && q.templateRef.anchor) || extractSkillFromQuestion(q.text || ''),
        type: (q.templateRef && q.templateRef.type) || '',
        options: q.options || null
    });

    if (isCorrect) {
        if (state.currentIndex < state.baseItemCount) state.initialScore++;

        feedbackContainer.innerHTML = `
            <div class="rationale-panel success">
                <div class="rationale-header" style="color:var(--correct)">Response Correct</div>
            </div>`;
    } else {
        // Track wrong answer for admin reporting
        state.wrongAnswers.push({
            question: q.text,
            correct: q.correct,
            studentAnswer: state.selectedOption || '(no answer)',
            guide: q.guide,
            skill: (q.templateRef && q.templateRef.anchor) || '',
            type: (q.templateRef && q.templateRef.type) || ''
        });

        if (state.redemptionEnabled) {
            state.redemptionsAdded++;
            if (q.isCustom) {
                state.queue.push({ ...q });
            } else {
                let redemptionItem = constructItem(q.templateRef);
                state.queue.push(redemptionItem);
            }
            state.answers.push({ selected: null, answered: false, correct: null });
        }

        const oeNotice = q.openEnded ? `The precise value is <strong>${q.correct}</strong>.<br><br>` : '';
        const redemptionNotice = state.redemptionEnabled
            ? '<div class="queue-notice">↳ Notice: A redemption item covering this concept has been appended to the queue.</div>'
            : '';

        feedbackContainer.innerHTML = `
            <div class="rationale-panel error">
                <div class="rationale-header" style="color:var(--incorrect)">Response Incorrect</div>
                <div class="rationale-text">${oeNotice}<strong>Solution Rationale:</strong><br>${renderMathInHTML(q.guide)}</div>
                ${redemptionNotice}
            </div>`;
    }

    feedbackContainer.classList.remove('hidden');

    let actionBtn = document.getElementById('btn-action');
    actionBtn.innerText = "Proceed to Next Item";
    actionBtn.onclick = advanceQueue;
    updateTestProgress();
    renderQuestionMap();
    renderQuestionMap();
}

function advanceQueue() {
    // Find next unanswered question
    let next = state.currentIndex + 1;
    while (next < state.queue.length && state.answers[next] && state.answers[next].answered) {
        next++;
    }
    if (next < state.queue.length) {
        state.currentIndex = next;
        loadItem();
    } else {
        attemptConclude();
    }
}

// ========== QUESTION NAVIGATION ==========

function navigateTo(index) {
    if (index < 0 || index >= state.queue.length) return;
    state.currentIndex = index;
    loadItem();
}

function navigatePrev() {
    if (state.currentIndex > 0) navigateTo(state.currentIndex - 1);
}

function navigateNext() {
    if (state.currentIndex < state.queue.length - 1) navigateTo(state.currentIndex + 1);
}

function skipQuestion() {
    // Save current selection without submitting
    if (state.selectedOption && state.answers[state.currentIndex] && !state.answers[state.currentIndex].answered) {
        state.answers[state.currentIndex].selected = state.selectedOption;
    }
    navigateNext();
}

function toggleFlag() {
    const idx = state.currentIndex;
    if (state.flagged.has(idx)) state.flagged.delete(idx);
    else state.flagged.add(idx);
    const flagBtn = document.getElementById('btn-flag');
    if (flagBtn) {
        flagBtn.classList.toggle('flagged', state.flagged.has(idx));
        flagBtn.innerHTML = state.flagged.has(idx) ? '&#9873; Flagged' : '&#9873; Flag';
    }
    renderQuestionMap();
}

function renderQuestionMap() {
    const container = document.getElementById('question-map');
    if (!container) return;
    let html = '';
    for (let i = 0; i < state.queue.length; i++) {
        const a = state.answers[i];
        let cls = 'qmap-item';
        if (i === state.currentIndex) cls += ' qmap-current';
        if (a && a.answered) cls += a.correct ? ' qmap-correct' : ' qmap-incorrect';
        if (state.flagged.has(i)) cls += ' qmap-flagged';
        html += `<button class="${cls}" onclick="navigateTo(${i})">${i + 1}</button>`;
    }
    container.innerHTML = html;
}

async function attemptConclude() {
    const unanswered = state.answers.filter(a => !a.answered).length;
    const flaggedCount = state.flagged.size;
    if (unanswered > 0 || flaggedCount > 0) {
        let msg = '';
        if (unanswered > 0) msg += unanswered + ' question(s) unanswered. ';
        if (flaggedCount > 0) msg += flaggedCount + ' question(s) flagged for review. ';
        msg += 'Submit anyway?';
        const confirmed = await showConfirm(msg, 'Review Incomplete');
        if (!confirmed) {
            const firstUnanswered = state.answers.findIndex(a => !a.answered);
            const firstFlagged = [...state.flagged][0];
            navigateTo(firstUnanswered >= 0 ? firstUnanswered : (firstFlagged !== undefined ? firstFlagged : 0));
            return;
        }
    }
    concludeAssessment();
}

// ========== TEST TIMER ==========
function startTimer() {
    if (!state.timerMinutes) return;
    state.timerSeconds = state.timerMinutes * 60;
    state.timerEnabled = true;
    const display = document.getElementById('timer-display');
    if (display) display.style.display = '';
    updateTimerDisplay();
    state.timerInterval = setInterval(() => {
        state.timerSeconds--;
        updateTimerDisplay();
        if (state.timerSeconds <= 0) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
            timerExpired();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    if (!display) return;
    const m = Math.floor(state.timerSeconds / 60);
    const s = state.timerSeconds % 60;
    display.textContent = m + ':' + String(s).padStart(2, '0');
    if (state.timerSeconds <= 60) {
        display.style.color = 'var(--incorrect)';
        display.classList.add('timer-warning');
    } else {
        display.style.color = 'var(--text-secondary)';
        display.classList.remove('timer-warning');
    }
}

function timerExpired() {
    state.timerEnabled = false;
    const display = document.getElementById('timer-display');
    if (display) display.textContent = '0:00 — TIME UP';
    concludeAssessment();
}

function stopTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = null;
    state.timerEnabled = false;
    state.timerMinutes = 0;
    const display = document.getElementById('timer-display');
    if (display) display.style.display = 'none';
}

function pauseTimer() {
    if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
}

function resumeTimer() {
    if (!state.timerEnabled || state.timerInterval) return;
    state.timerInterval = setInterval(() => {
        state.timerSeconds--;
        updateTimerDisplay();
        if (state.timerSeconds <= 0) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
            timerExpired();
        }
    }, 1000);
}

function concludeAssessment() {
    stopTimer();
    startStudentPolling();
    state.sessionStatus = 'results';

    // Update last active on test completion
    if (typeof fbFindInRoster === 'function' && state.currentUser) {
        const parts = state.currentUser.split(' ');
        fbFindInRoster(parts[0], parts.slice(1).join(' ')).then(match => {
            if (match && match.id) fbUpdateRoster(match.id, { lastActive: new Date().toISOString() }).catch(() => {});
        }).catch(() => {});
    }
    document.getElementById('view-assessment').classList.add('hidden');
    document.getElementById('view-results').classList.remove('hidden');
    document.getElementById('test-tabs').style.display = 'block'; showSidebar();

    const accuracy = ((state.initialScore / state.baseItemCount) * 100).toFixed(1);

    document.getElementById('res-base').innerText = state.baseItemCount;
    document.getElementById('res-accuracy').innerText = `${accuracy}%`;
    document.getElementById('res-redemptions').innerText = state.redemptionsAdded;
    document.getElementById('res-total').innerText = state.queue.length;

    // Populate enhanced results
    const pct = parseFloat(accuracy);
    const scoreColor = pct >= 80 ? 'var(--correct)' : pct >= 60 ? 'var(--warning)' : 'var(--incorrect)';
    const scoreBg = pct >= 80 ? 'var(--correct-bg)' : pct >= 60 ? '#fff3cd' : 'var(--incorrect-bg)';

    const nameEl = document.getElementById('res-student-name');
    if (nameEl) nameEl.textContent = state.currentUser || '';
    const dateEl = document.getElementById('res-date');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString();
    const scoreDisplay = document.getElementById('res-score-display');
    if (scoreDisplay) { scoreDisplay.style.background = scoreBg; }
    const scoreBig = document.getElementById('res-score-big');
    if (scoreBig) { scoreBig.textContent = accuracy + '%'; scoreBig.style.color = scoreColor; }

    // Hide redemption row if redemption was not enabled
    const redemptionRow = document.getElementById('res-redemptions-row');
    if (redemptionRow) {
        redemptionRow.style.display = state.redemptionEnabled ? '' : 'none';
    }

    let testLevel;
    if (state.testType === 'pssa') {
        testLevel = `PSSA Grade ${state.grade}`;
    } else if (state.testType === 'custom') {
        testLevel = state.grade;
    } else {
        testLevel = `Keystone ${state.subject.charAt(0).toUpperCase() + state.subject.slice(1)}`;
    }

    const testNameEl = document.getElementById('res-test-name');
    if (testNameEl) testNameEl.textContent = testLevel;

    // Skills breakdown
    const skillsListEl = document.getElementById('res-skills-list');
    if (skillsListEl) {
        const skillResults = {};
        (state.allAnswers || []).forEach(a => {
            const skill = (a.skill || a.type || extractSkillFromQuestion(a.question || ''));
            if (!skillResults[skill]) skillResults[skill] = { correct: 0, wrong: 0 };
            if (a.isCorrect) skillResults[skill].correct++;
            else skillResults[skill].wrong++;
        });
        // Also count from wrongAnswers if allAnswers is empty
        if (Object.keys(skillResults).length === 0) {
            (state.wrongAnswers || []).forEach(w => {
                const skill = w.skill || w.type || extractSkillFromQuestion(w.question || '');
                if (!skillResults[skill]) skillResults[skill] = { correct: 0, wrong: 0 };
                skillResults[skill].wrong++;
            });
        }

        const sortedSkills = Object.entries(skillResults).sort((a, b) => b[1].wrong - a[1].wrong);
        if (sortedSkills.length > 0) {
            let skillsHtml = '';
            sortedSkills.forEach(([skill, counts]) => {
                const total = counts.correct + counts.wrong;
                const pctCorrect = total > 0 ? Math.round(counts.correct / total * 100) : 0;
                const barColor = pctCorrect >= 80 ? 'var(--correct)' : pctCorrect >= 60 ? 'var(--warning)' : 'var(--incorrect)';
                skillsHtml += `<div style="margin-bottom:0.5rem;">
                    <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:0.2rem;">
                        <span>${skill}</span>
                        <span style="font-weight:600;color:${barColor};">${pctCorrect}% (${counts.correct}/${total})</span>
                    </div>
                    <div style="height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;">
                        <div style="height:100%;width:${pctCorrect}%;background:${barColor};border-radius:3px;"></div>
                    </div>
                </div>`;
            });
            skillsListEl.innerHTML = skillsHtml;
        } else {
            skillsListEl.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">No skill breakdown available.</p>';
        }
    }

    saveScore({
        student: state.currentUser.toLowerCase(),
        studentDisplayName: state.currentUser,
        studentGrade: state.currentGrade || '—',
        studentClass: state.currentClass || '—',
        source: state.wasAssigned ? 'assigned' : 'practice',
        testLevel,
        accuracy,
        initialScore: state.initialScore,
        baseItemCount: state.baseItemCount,
        redemptions: state.redemptionsAdded,
        totalQuestions: state.queue.length,
        wrongAnswers: state.wrongAnswers || [],
        terminated: false,
        visibleToParent: state.assignmentVisibleToParent || false,
        completedAt: new Date().toLocaleDateString()
    });
    state.wasAssigned = false;
    state.assignmentVisibleToParent = false;
}

// ========== VALIDATION & LOADING SCREEN ==========

// ========== PARENT MANAGEMENT (ADMIN) ==========

function switchParentSubtab(tab) {
    document.getElementById('parent-subtab-accounts').classList.toggle('hidden', tab !== 'accounts');
    document.getElementById('parent-subtab-codes').classList.toggle('hidden', tab !== 'codes');
    document.querySelectorAll('.parent-subtab').forEach(b => {
        b.style.background = 'var(--bg-surface)'; b.style.color = 'var(--text-main)'; b.style.border = '1px solid var(--border-color)';
        b.classList.remove('active');
    });
    const btn = document.getElementById('parent-tab-' + tab);
    if (btn) { btn.style.background = 'var(--primary-color)'; btn.style.color = '#fff'; btn.style.border = '1px solid var(--primary-color)'; btn.classList.add('active'); }
    if (tab === 'accounts') renderParentAccounts();
    if (tab === 'codes') renderParentCodes();
}

async function renderParentAccounts() {
    const container = document.getElementById('parent-accounts-list');
    if (!container || typeof fbGetParents !== 'function') return;
    try {
        const parents = await fbGetParents();
        const roster = await fbGetRoster();
        if (parents.length === 0) { container.innerHTML = '<p style="color:var(--text-secondary);">No parent accounts registered yet.</p>'; return; }
        let html = '<table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Linked Students</th><th>Created</th><th></th></tr></thead><tbody>';
        parents.forEach(p => {
            const linked = (p.linkedStudents || []).map(code => {
                const s = roster.find(r => r.parentCode === code);
                return s ? formatName(s.firstName) + ' ' + formatName(s.lastName) : code;
            }).join(', ') || '—';
            html += `<tr><td>${formatName(p.firstName)} ${formatName(p.lastName)}</td><td style="font-size:0.85rem;">${p.email}</td><td style="font-size:0.85rem;">${linked}</td><td style="font-size:0.85rem;">${p.createdAt || '—'}</td><td><button class="btn" style="padding:0.2rem 0.5rem;font-size:0.7rem;background:var(--incorrect);" onclick="removeParentAccount('${p.id}')">Remove</button></td></tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (e) { container.innerHTML = '<p style="color:var(--incorrect);">Failed to load parents.</p>'; }
}

async function renderParentCodes() {
    const container = document.getElementById('parent-codes-list');
    if (!container) return;
    try {
        const roster = await fbGetRoster();
        const parents = typeof fbGetParents === 'function' ? await fbGetParents() : [];
        if (roster.length === 0) { container.innerHTML = '<p style="color:var(--text-secondary);">No students in roster.</p>'; return; }
        let html = '<table class="data-table"><thead><tr><th>Student</th><th>Grade</th><th>Class</th><th>Parent Code</th><th>Linked Parent</th><th></th></tr></thead><tbody>';
        roster.forEach(r => {
            const name = formatName(r.firstName) + ' ' + formatName(r.lastName);
            const cls = (r.classes || [r.class]).map(c => getClassDisplayName(c)).join(', ');
            const code = r.parentCode || '—';
            const linkedParent = parents.find(p => (p.linkedStudents || []).includes(r.parentCode));
            const parentName = linkedParent ? formatName(linkedParent.firstName) + ' ' + formatName(linkedParent.lastName) : '—';
            html += `<tr><td>${name}</td><td>Grade ${r.grade}</td><td style="font-size:0.85rem;">${cls}</td><td style="font-family:monospace;font-weight:600;letter-spacing:1px;">${code}</td><td style="font-size:0.85rem;">${parentName}</td><td><button class="btn" style="padding:0.2rem 0.5rem;font-size:0.7rem;" onclick="regenerateCode('${r.id}')">Regenerate</button> <button class="btn" style="padding:0.2rem 0.5rem;font-size:0.7rem;background:var(--text-secondary);" onclick="navigator.clipboard.writeText('${code}')">Copy</button></td></tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (e) { container.innerHTML = '<p style="color:var(--incorrect);">Failed to load.</p>'; }
}

async function removeParentAccount(docId) {
    if (!(await showConfirm('Remove this parent account?', 'Remove Parent'))) return;
    try { await fbRemoveParent(docId); renderParentAccounts(); } catch (e) { showAlert('Failed: ' + e.message, 'error'); }
}

async function regenerateCode(studentDocId) {
    if (!(await showConfirm('Regenerate parent code? The old code will stop working.', 'Regenerate Code'))) return;
    try { await fbUpdateRoster(studentDocId, { parentCode: generateParentCode() }); renderParentCodes(); } catch (e) { showAlert('Failed: ' + e.message, 'error'); }
}

// ========== SCORE VISIBILITY TOGGLE ==========

async function toggleScoreVisibility(index) {
    const scores = getScores();
    const score = scores[index];
    score.visibleToParent = !score.visibleToParent;
    _scoresCache = scores;
    localStorage.setItem('mathsite_scores', JSON.stringify(scores));
    if (score.id && typeof fbUpdateScore === 'function') {
        try { await fbUpdateScore(score.id, { visibleToParent: score.visibleToParent }); } catch (e) { console.error(e); }
    }
    renderAdminScores();
}

// ========== ASSIGNMENT EDITING ==========

function editAssignment(targetKey, index) {
    const assignments = getAssignments();
    const item = assignments[targetKey] ? assignments[targetKey][index] : null;
    if (!item) return;

    const overlay = document.getElementById('app-modal');
    const box = document.getElementById('app-modal-box');
    const titleEl = document.getElementById('app-modal-title');
    const msgEl = document.getElementById('app-modal-message');
    const actionsEl = document.getElementById('app-modal-actions');

    box.className = 'modal-box modal-info';
    titleEl.textContent = 'Edit Assignment';
    msgEl.innerHTML = `
        <div style="text-align:left;">
            <label class="admin-label">Test Name</label>
            <input type="text" id="edit-assign-name" class="text-input" value="${(item.name || '').replace(/"/g, '&quot;')}" style="margin-bottom:0.5rem;">
            <label class="admin-label">Due Date</label>
            <input type="date" id="edit-assign-due" class="text-input" value="${item.dueDate || ''}" style="margin-bottom:0.5rem;">
            <label class="admin-label">Time Limit (min)</label>
            <input type="number" id="edit-assign-timer" class="text-input" value="${item.timerMinutes || ''}" min="1" max="180" placeholder="—" style="margin-bottom:0.5rem;">
            <label class="checkbox-label" style="margin-top:0.25rem;">
                <input type="checkbox" id="edit-assign-visible" ${item.visibleToParent ? 'checked' : ''}> Show results to parents
            </label>
        </div>`;
    actionsEl.innerHTML = '';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'btn';
    saveBtn.onclick = () => {
        const a = getAssignments();
        if (!a[targetKey] || !a[targetKey][index]) return;
        const name = document.getElementById('edit-assign-name').value.trim();
        const due = document.getElementById('edit-assign-due').value;
        const timer = parseInt(document.getElementById('edit-assign-timer').value);
        const visible = document.getElementById('edit-assign-visible').checked;
        if (name) a[targetKey][index].name = name; else delete a[targetKey][index].name;
        if (due) a[targetKey][index].dueDate = due; else delete a[targetKey][index].dueDate;
        if (timer > 0) a[targetKey][index].timerMinutes = timer; else delete a[targetKey][index].timerMinutes;
        a[targetKey][index].visibleToParent = visible;
        saveAssignments(a);
        overlay.classList.add('hidden');
        renderAdminAssignments();
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn-cancel';
    cancelBtn.onclick = () => overlay.classList.add('hidden');

    actionsEl.appendChild(cancelBtn);
    actionsEl.appendChild(saveBtn);
    overlay.classList.remove('hidden');
}

// ========== MANUAL SCORE UPLOAD ==========

function uploadManualScore() {
    const studentName = (document.getElementById('manual-student').value || '').trim();
    const testName = (document.getElementById('manual-test-name').value || '').trim();
    const scorePct = parseFloat(document.getElementById('manual-score-pct').value);
    const totalQ = parseInt(document.getElementById('manual-total-q').value) || 20;
    const dateVal = document.getElementById('manual-date').value || new Date().toLocaleDateString();
    const skills = (document.getElementById('manual-skills').value || '').trim();
    const visibleToParent = document.getElementById('manual-visible-parent').checked;
    const statusEl = document.getElementById('manual-score-status');

    if (!studentName) { statusEl.innerHTML = '<span style="color:var(--incorrect);">Please enter a student name.</span>'; return; }
    if (!testName) { statusEl.innerHTML = '<span style="color:var(--incorrect);">Please enter a test name.</span>'; return; }
    if (isNaN(scorePct) || scorePct < 0 || scorePct > 100) { statusEl.innerHTML = '<span style="color:var(--incorrect);">Score must be 0-100.</span>'; return; }

    // Try to find student in roster for grade/class
    let grade = '—', cls = '—';
    if (_allStudentsData && _allStudentsData.length > 0) {
        const match = _allStudentsData.find(r => (formatName(r.firstName) + ' ' + formatName(r.lastName)).toLowerCase() === studentName.toLowerCase());
        if (match) { grade = match.grade || '—'; cls = match.class || '—'; }
    }

    const wrongAnswers = skills ? skills.split(',').map(s => ({ skill: s.trim(), question: '', studentAnswer: '' })).filter(w => w.skill) : [];

    saveScore({
        student: studentName.toLowerCase(),
        studentDisplayName: studentName,
        studentGrade: grade,
        studentClass: cls,
        source: 'manual',
        testLevel: testName,
        accuracy: scorePct.toFixed(1),
        initialScore: Math.round(scorePct * totalQ / 100),
        baseItemCount: totalQ,
        redemptions: 0,
        totalQuestions: totalQ,
        wrongAnswers,
        terminated: false,
        visibleToParent,
        manualEntry: true,
        completedAt: dateVal
    });

    statusEl.innerHTML = '<span style="color:var(--correct);font-weight:600;">Score saved for ' + studentName + '!</span>';
    document.getElementById('manual-test-name').value = '';
    document.getElementById('manual-score-pct').value = '';
    document.getElementById('manual-total-q').value = '';
    document.getElementById('manual-skills').value = '';
}

// ========== STUDENT PROGRESS DASHBOARD ==========

// ========== HELP REQUESTS ==========

async function submitHelpRequest() {
    const skill = document.getElementById('help-skill').value.trim();
    const details = document.getElementById('help-details').value.trim();
    const statusEl = document.getElementById('help-status');

    if (!skill) {
        statusEl.textContent = 'Please type in the skill you need help with.';
        statusEl.style.display = 'block';
        statusEl.style.background = 'var(--incorrect-bg)';
        statusEl.style.color = 'var(--incorrect)';
        return;
    }

    try {
        statusEl.textContent = 'Submitting...';
        statusEl.style.display = 'block';
        statusEl.style.background = 'var(--border-color)';
        statusEl.style.color = 'var(--text-main)';

        await fbAddHelpRequest({
            student: state.currentUser,
            grade: state.currentGrade,
            class: state.currentClass,
            skill: skill,
            details: details,
            status: 'pending',
            submittedAt: new Date().toLocaleDateString()
        });

        statusEl.textContent = 'Request submitted! Your teacher will review it.';
        statusEl.style.background = 'var(--correct-bg)';
        statusEl.style.color = 'var(--correct)';
        document.getElementById('help-skill').value = '';
        document.getElementById('help-details').value = '';
        renderMyHelpRequests();
    } catch (e) {
        statusEl.textContent = 'Failed to submit. Try again.';
        statusEl.style.background = 'var(--incorrect-bg)';
        statusEl.style.color = 'var(--incorrect)';
    }
}

async function renderMyHelpRequests() {
    const container = document.getElementById('my-help-requests');
    if (!container || typeof fbGetHelpRequests !== 'function') return;

    try {
        const all = await fbGetHelpRequests();
        const mine = all.filter(r => (r.student || '').toLowerCase() === (state.currentUser || '').toLowerCase());

        if (mine.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">No requests submitted yet.</p>';
            return;
        }

        let html = '';
        mine.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
        mine.forEach(r => {
            const statusColor = r.status === 'pending' ? 'var(--warning)' : r.status === 'addressed' ? 'var(--correct)' : 'var(--text-secondary)';
            const statusLabel = r.status === 'pending' ? 'Pending' : r.status === 'addressed' ? 'Responded' : r.status;
            html += `<div style="padding:0.6rem 0.75rem;border-left:3px solid ${statusColor};margin-bottom:0.5rem;background:var(--bg-surface, #f8f9fa);border-radius:0 8px 8px 0;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong style="font-size:0.9rem;">${r.skill}</strong>
                    <div style="display:flex;align-items:center;gap:0.4rem;">
                        <span style="font-size:0.75rem;color:${statusColor};font-weight:600;">${statusLabel}</span>
                        <button class="btn" style="padding:0.15rem 0.4rem;font-size:0.7rem;background:var(--incorrect);" onclick="deleteMyHelpRequest('${r.id}')">Delete</button>
                    </div>
                </div>
                ${r.details ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.2rem;">${r.details}</div>` : ''}
                ${r.adminResponse ? `<div style="font-size:0.85rem;color:var(--correct);margin-top:0.4rem;padding:0.4rem 0.6rem;background:var(--correct-bg);border-radius:8px;"><strong>Teacher response:</strong> ${r.adminResponse}</div>` : ''}
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.2rem;">${r.submittedAt}</div>
            </div>`;
        });
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">Could not load requests.</p>';
    }
}

async function deleteMyHelpRequest(docId) {
    if (!(await showConfirm('Delete this help request?', 'Delete Request'))) return;
    try {
        await fbRemoveHelpRequest(docId);
        renderMyHelpRequests();
    } catch (e) {
        alert('Failed to delete: ' + e.message);
    }
}

// ========== ADMIN: HELP REQUESTS ==========

async function renderAdminHelpRequests() {
    const container = document.getElementById('admin-help-requests');
    if (!container || typeof fbGetHelpRequests !== 'function') return;

    try {
        const requests = await fbGetHelpRequests();
        const pending = requests.filter(r => r.status === 'pending');

        if (typeof updateBadge === 'function') updateBadge('help-badge', pending.length);

        if (requests.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No help requests yet.</p>';
            return;
        }

        // Group by class
        const byClass = {};
        requests.forEach(r => {
            const cls = r.class || 'Unknown';
            if (!byClass[cls]) byClass[cls] = [];
            byClass[cls].push(r);
        });

        let html = '';
        for (const [cls, reqs] of Object.entries(byClass)) {
            const label = typeof getClassDisplayName === 'function' ? getClassDisplayName(cls) : cls;
            html += `<div style="margin-bottom:1rem;">
                <h4 style="font-size:0.9rem;color:var(--primary-color);margin-bottom:0.5rem;">${label}</h4>`;

            reqs.forEach(r => {
                const isPending = r.status === 'pending';
                const isReset = r.isPasswordReset;
                const borderColor = isPending ? 'var(--warning)' : 'var(--correct)';
                html += `<div style="padding:0.75rem;border-left:3px solid ${borderColor};margin-bottom:0.5rem;background:var(--bg-surface, #f8f9fa);border-radius:0 8px 8px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div style="flex:1;">
                            <strong>${r.student || 'Unknown'}</strong> — Grade ${r.grade || '?'}
                            <div style="font-size:0.9rem;margin-top:0.25rem;">${isReset ? '<span style="color:var(--incorrect);font-weight:600;">PASSWORD RESET</span>' : `Skill: <strong style="color:var(--primary-color);">${r.skill}</strong>`}</div>
                            ${r.details ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.2rem;">"${r.details}"</div>` : ''}
                            ${r.adminResponse ? `<div style="font-size:0.8rem;color:var(--correct);margin-top:0.3rem;padding:0.3rem 0.5rem;background:var(--correct-bg);border-radius:3px;">Response: ${r.adminResponse}</div>` : ''}
                            <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.2rem;">${r.submittedAt}</div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:0.3rem;flex-shrink:0;">
                            ${isPending && isReset ? `<button class="btn" style="padding:0.3rem 0.6rem;font-size:0.75rem;" onclick="resetStudentPassword('${r.rosterId}','${r.id}')">Reset Password</button>` : ''}
                            ${isPending && !isReset ? `<button class="btn" style="padding:0.3rem 0.6rem;font-size:0.75rem;" onclick="respondToHelpRequest('${r.id}')">Respond</button>` : ''}
                            ${isPending ? `<button class="btn" style="padding:0.3rem 0.6rem;font-size:0.75rem;" onclick="markHelpAddressed('${r.id}')">Mark Done</button>` : ''}
                            <button class="btn" style="padding:0.3rem 0.6rem;font-size:0.75rem;background:var(--incorrect);" onclick="dismissHelpRequest('${r.id}')">Dismiss</button>
                        </div>
                    </div>
                </div>`;
            });
            html += '</div>';
        }
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<p style="color:var(--text-secondary);">Failed to load requests.</p>';
    }
}

async function markHelpAddressed(docId) {
    try {
        // Update status in Firebase
        if (typeof fbRemoveHelpRequest === 'function') {
            const requests = await fbGetHelpRequests();
            const req = requests.find(r => r.id === docId);
            if (req) {
                await fbRemoveHelpRequest(docId);
                await fbAddHelpRequest({ ...req, id: undefined, status: 'addressed' });
            }
        }
        renderAdminHelpRequests();
    } catch (e) {
        alert('Failed: ' + e.message);
    }
}

async function respondToHelpRequest(docId) {
    const response = prompt('Type your response to the student:');
    if (!response) return;
    try {
        const requests = await fbGetHelpRequests();
        const req = requests.find(r => r.id === docId);
        if (req) {
            await fbRemoveHelpRequest(docId);
            await fbAddHelpRequest({ ...req, id: undefined, status: 'addressed', adminResponse: response });
        }
        renderAdminHelpRequests();
    } catch (e) {
        alert('Failed: ' + e.message);
    }
}

async function resetStudentPassword(rosterId, requestId) {
    const newPassword = prompt('Enter the new password for this student:');
    if (!newPassword || newPassword.length < 4) {
        if (newPassword !== null) alert('Password must be at least 4 characters.');
        return;
    }
    try {
        const newHash = await hashPassword(newPassword);
        await fbUpdateRoster(rosterId, { passwordPlain: newPassword, passwordHash: newHash });
        // Mark request as done
        await fbRemoveHelpRequest(requestId);
        alert('Password has been reset.');
        renderAdminHelpRequests();
    } catch (e) {
        alert('Failed to reset password: ' + e.message);
    }
}

async function dismissHelpRequest(docId) {
    if (!(await showConfirm('Dismiss this help request?', 'Dismiss Request'))) return;
    try {
        await fbRemoveHelpRequest(docId);
        renderAdminHelpRequests();
    } catch (e) {
        alert('Failed: ' + e.message);
    }
}

// ========== STUDENT PROGRESS ==========

async function populateJoinClassDropdown() {
    const select = document.getElementById('join-class-select');
    if (!select) return;
    const allClasses = typeof getAllClasses === 'function' ? await getAllClasses() : Object.keys(CLASS_DISPLAY_NAMES);
    const enrolled = state.currentClasses || [];
    select.innerHTML = '<option value="">Select class...</option>';
    allClasses.filter(c => !enrolled.includes(c)).forEach(c => {
        select.innerHTML += `<option value="${c}">${getClassDisplayName(c)}</option>`;
    });
}

async function joinAdditionalClass() {
    const cls = document.getElementById('join-class-select').value;
    const code = document.getElementById('join-class-code').value.trim();
    const statusEl = document.getElementById('join-class-status');

    if (!cls) { statusEl.textContent = 'Select a class.'; statusEl.style.display = 'block'; statusEl.style.color = 'var(--incorrect)'; return; }
    if (!code) { statusEl.textContent = 'Enter the class code.'; statusEl.style.display = 'block'; statusEl.style.color = 'var(--incorrect)'; return; }

    try {
        const codes = await fbGetClassCodes();
        if (codes[cls] !== code) {
            statusEl.textContent = 'Invalid class code.'; statusEl.style.display = 'block'; statusEl.style.color = 'var(--incorrect)';
            return;
        }

        // Add class to student's roster entry
        const parts = state.currentUser.split(' ');
        const match = await fbFindInRoster(parts[0], parts.slice(1).join(' '));
        if (match && match.id) {
            const currentClasses = match.classes || (match.class ? [match.class] : []);
            if (!currentClasses.includes(cls)) {
                currentClasses.push(cls);
                const history = match.classHistory || [];
                history.push({ class: cls, action: 'joined', date: new Date().toLocaleDateString() });
                await fbUpdateRoster(match.id, { classes: currentClasses, class: currentClasses[0], classHistory: history });
            }

            // Update local state
            state.currentClasses = currentClasses;
            state.currentClass = currentClasses[0];
            setSessionCookie(state.currentUser, state.currentGrade, currentClasses);

            // Update display
            const spClass = document.getElementById('settings-profile-class');
            if (spClass) spClass.textContent = currentClasses.map(c => getClassDisplayName(c)).join(', ');
            populateJoinClassDropdown();

            statusEl.textContent = `Joined ${getClassDisplayName(cls)}!`;
            statusEl.style.display = 'block'; statusEl.style.color = 'var(--correct)';
            document.getElementById('join-class-code').value = '';
        }
    } catch (e) {
        statusEl.textContent = 'Failed: ' + e.message; statusEl.style.display = 'block'; statusEl.style.color = 'var(--incorrect)';
    }
}

function formatTime12(time24) {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ========== STUDENT: COURSE INFO ==========

async function renderCourseInfo() {
    const container = document.getElementById('course-info-content');
    if (!container) return;

    const classes = state.currentClasses || (state.currentClass ? [state.currentClass] : []);
    if (classes.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);">No class assigned. Join a class in Settings.</p>';
        return;
    }

    let classData = {};
    try { classData = typeof fbGetClassData === 'function' ? await fbGetClassData() : {}; } catch (e) {}

    let fullHtml = '';
    for (const cls of classes) {
        const data = classData[cls] || {};
        const label = data.displayName || getClassDisplayName(cls);

        let html = `<div style="background:var(--bg-surface, #f8f9fa);border-radius:8px;padding:1.25rem;border:1px solid var(--border-color);margin-bottom:1rem;">
            <h3 style="margin:0 0 0.75rem;font-size:1.1rem;color:var(--primary-color);">${label}</h3>
            <div style="display:grid;grid-template-columns:auto 1fr;gap:0.4rem 1.25rem;font-size:0.9rem;">`;

        const sched = data.schedule || [];
        const hasSchedule = sched.length > 0 || data.day1 || data.day2;
        if (hasSchedule) {
            html += `<span style="font-weight:600;color:var(--text-secondary);">Schedule</span><div>`;
            if (sched.length > 0) {
                sched.filter(s => s.day).forEach(s => {
                    html += `<div style="margin-bottom:0.2rem;">${s.day}s ${formatTime12(s.start)}${s.end ? ' – ' + formatTime12(s.end) : ''}</div>`;
                });
            } else {
                if (data.day1 && data.time1) html += `<div style="margin-bottom:0.2rem;">${data.day1}s ${formatTime12(data.time1)}${data.time1end ? ' – ' + formatTime12(data.time1end) : ''}</div>`;
                if (data.day2 && data.time2) html += `<div>${data.day2}s ${formatTime12(data.time2)}${data.time2end ? ' – ' + formatTime12(data.time2end) : ''}</div>`;
            }
            html += '</div>';
        }

        if (data.startDate && data.endDate) {
            html += `<span style="font-weight:600;color:var(--text-secondary);">Dates</span><span>${new Date(data.startDate + 'T00:00').toLocaleDateString()} – ${new Date(data.endDate + 'T00:00').toLocaleDateString()}</span>`;
        }

        const breaks = data.breaks || [];
        if (breaks.length > 0) {
            html += `<span style="font-weight:600;color:var(--text-secondary);">Breaks</span><div>`;
            breaks.forEach(b => {
                const bStart = b.start ? new Date(b.start + 'T00:00').toLocaleDateString() : '';
                const bEnd = b.end ? new Date(b.end + 'T00:00').toLocaleDateString() : '';
                html += `<div style="margin-bottom:0.2rem;">${b.name || 'Break'}${bStart ? ': ' + bStart : ''}${bEnd ? ' – ' + bEnd : ''}</div>`;
            });
            html += '</div>';
        }

        html += '</div></div>';

        if (!hasSchedule && !data.startDate && !data.endDate) {
            html = `<div style="background:var(--bg-surface, #f8f9fa);border-radius:8px;padding:1.25rem;border:1px solid var(--border-color);margin-bottom:1rem;">
                <h3 style="margin:0 0 0.5rem;font-size:1.1rem;color:var(--primary-color);">${label}</h3>
                <p style="color:var(--text-secondary);font-size:0.9rem;">Class details have not been set up yet.</p>
            </div>`;
        }

        fullHtml += html;
    }

    container.innerHTML = fullHtml;
}

// ========== STUDENT PROGRESS ==========

function renderStudentProgress() {
    const allScores = getScores();
    const userName = (state.currentUser || '').toLowerCase();
    const myScores = allScores.filter(s => (s.student || '').toLowerCase() === userName && !s.terminated);

    // Summary cards
    const cardsEl = document.getElementById('progress-summary-cards');
    const historyEl = document.getElementById('progress-history');
    const trendEl = document.getElementById('progress-trend');
    const weakEl = document.getElementById('progress-weak-topics');

    if (myScores.length === 0) {
        cardsEl.innerHTML = '';
        historyEl.innerHTML = '<p style="color:var(--text-secondary);">No completed tests yet. Take a test to see your progress!</p>';
        trendEl.innerHTML = '';
        weakEl.innerHTML = '';
        return;
    }

    const totalTests = myScores.length;
    const avgAccuracy = Math.round(myScores.reduce((sum, s) => sum + (s.accuracy || 0), 0) / totalTests);
    const bestScore = Math.max(...myScores.map(s => s.accuracy || 0));

    cardsEl.innerHTML = `
        <div class="progress-stat-card">
            <div class="progress-stat-value">${totalTests}</div>
            <div class="progress-stat-label">Tests Taken</div>
        </div>
        <div class="progress-stat-card">
            <div class="progress-stat-value">${avgAccuracy}%</div>
            <div class="progress-stat-label">Average Score</div>
        </div>
        <div class="progress-stat-card">
            <div class="progress-stat-value">${bestScore}%</div>
            <div class="progress-stat-label">Best Score</div>
        </div>`;

    // Trend (last 10 scores as bar chart)
    const recent = myScores.slice(-10);
    let trendHtml = '<h3 style="font-size:0.95rem;font-weight:700;color:var(--primary-color);margin:1.5rem 0 0.75rem;">Recent Trend</h3>';
    recent.forEach(s => {
        const pct = s.accuracy || 0;
        const color = pct >= 80 ? 'var(--correct)' : pct >= 60 ? 'var(--warning)' : 'var(--incorrect)';
        trendHtml += `<div class="progress-bar-row">
            <span class="progress-bar-label">${s.testLevel || s.source || 'Test'}</span>
            <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%;background:${color};"></div></div>
            <span class="progress-bar-pct">${pct}%</span>
        </div>`;
    });
    trendEl.innerHTML = trendHtml;

    // Score history table
    const sorted = [...myScores].reverse();
    let histHtml = '<h3 style="font-size:0.95rem;font-weight:700;color:var(--primary-color);margin:1.5rem 0 0.75rem;">Score History</h3>';
    histHtml += '<table class="data-table"><thead><tr><th>Test</th><th>Score</th><th>Date</th></tr></thead><tbody>';
    sorted.forEach(s => {
        const pct = s.accuracy || 0;
        const color = pct >= 80 ? 'var(--correct)' : pct >= 60 ? 'var(--warning)' : 'var(--incorrect)';
        histHtml += `<tr><td>${s.testLevel || 'Test'}</td><td style="color:${color};font-weight:700;">${pct}%</td><td>${s.completedAt || ''}</td></tr>`;
    });
    histHtml += '</tbody></table>';
    historyEl.innerHTML = histHtml;

    // Weak topics — prefer skill/type, fall back to guide/question
    const wrongCounts = {};
    myScores.forEach(s => {
        (s.wrongAnswers || []).forEach(w => {
            const topic = w.skill || w.type || extractSkillFromQuestion(w.question);
            wrongCounts[topic] = (wrongCounts[topic] || 0) + 1;
        });
    });
    const topWeak = Object.entries(wrongCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (topWeak.length > 0) {
        let weakHtml = '<h3 style="font-size:0.95rem;font-weight:700;color:var(--primary-color);margin:1.5rem 0 0.75rem;">Areas to Improve</h3>';
        weakHtml += '<ul style="list-style:none;padding:0;">';
        topWeak.forEach(([topic, count]) => {
            weakHtml += `<li style="padding:0.5rem 0.75rem;border-left:3px solid var(--incorrect);margin-bottom:0.4rem;background:var(--bg-surface);border-radius:0 8px 8px 0;font-size:0.9rem;">
                <strong style="color:var(--incorrect);">${count}x</strong> — ${topic}
            </li>`;
        });
        weakHtml += '</ul>';
        weakEl.innerHTML = weakHtml;
    } else {
        weakEl.innerHTML = '';
    }
}

// ========== SKILL MANAGER ==========

let _customSkillsCache = null;
let _editingSkillId = null;

async function getCustomSkills() {
    if (!_customSkillsCache) {
        try { _customSkillsCache = await fbGetCustomSkills(); } catch(e) { _customSkillsCache = {}; }
    }
    return _customSkillsCache;
}

// ── UI helpers ──

function updateSkillGradeOptions() {
    const cat = document.getElementById('skill-category').value;
    const sel = document.getElementById('skill-grade');
    sel.querySelectorAll('option').forEach(opt => {
        if (cat === 'keystone') {
            opt.style.display = opt.value === 'algebra1' ? '' : 'none';
            opt.disabled = opt.value !== 'algebra1';
        } else {
            opt.style.display = opt.value === 'algebra1' ? 'none' : '';
            opt.disabled = opt.value === 'algebra1';
        }
    });
    if (cat === 'keystone') sel.value = 'algebra1';
    else if (sel.value === 'algebra1') sel.value = '3';
}

function toggleSkillAnswerType() {
    const isOpen = document.querySelector('input[name="skill-answer-type"]:checked')?.value === 'open';
    document.getElementById('skill-mc-hint').style.display = isOpen ? 'none' : 'block';
    document.getElementById('skill-open-hint').style.display = isOpen ? 'block' : 'none';
    const ta = document.getElementById('skill-example');
    if (isOpen) {
        ta.placeholder = "Type the question. Student will type their answer.\n\nExample:\nWhat is 24 × 15?\nAnswer: 360";
    } else {
        ta.placeholder = "Type the problem with A) B) C) D) choices.\n\nExample:\nWhat is 3/8 + 1/4?\nA) 5/8\nB) 4/12\nC) 3/12\nD) 1/2\nAnswer: A";
    }
}

function toggleEditOpenEnded() {
    const isOpen = document.getElementById('skill-edit-openended').checked;
    document.getElementById('skill-edit-distractors-row').style.display = isOpen ? 'none' : 'block';
}

function toggleDynamicHint() {
    const isDynamic = document.getElementById('skill-dynamic')?.checked;
    const hint = document.getElementById('skill-dynamic-hint');
    if (hint) hint.style.display = isDynamic ? 'block' : 'none';
}

// ── Render list of custom skills ──

async function renderSkillManager() {
    const container = document.getElementById('skill-manager-list');
    if (!container) return;

    const search = (document.getElementById('skill-search')?.value || '').toLowerCase();
    const filterGrade = document.getElementById('skill-filter-grade')?.value || 'all';
    // Always refresh from Firebase when rendering the list
    _customSkillsCache = null;
    const skills = await getCustomSkills();
    const entries = Object.entries(skills).filter(([id, s]) => {
        if (filterGrade !== 'all' && String(s.grade) !== filterGrade) return false;
        if (search && !(s.type || '').toLowerCase().includes(search) && !(s.anchor || '').toLowerCase().includes(search)) return false;
        return true;
    });

    if (entries.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.9rem;">No custom problems yet. Add one above!</p>';
        return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
        <thead><tr style="border-bottom:2px solid var(--border-color);text-align:left;">
            <th style="padding:0.5rem;">Skill</th>
            <th style="padding:0.5rem;">Grade</th>
            <th style="padding:0.5rem;">Type</th>
            <th style="padding:0.5rem;">Standard</th>
            <th style="padding:0.5rem;"></th>
        </tr></thead><tbody>`;

    entries.sort((a, b) => {
        const gA = a[1].grade || '3'; const gB = b[1].grade || '3';
        if (gA !== gB) return gA.localeCompare(gB);
        return (a[1].type || '').localeCompare(b[1].type || '');
    });

    entries.forEach(([id, s]) => {
        const gradeLabel = s.category === 'keystone' ? 'Algebra 1' : 'Grade ' + s.grade;
        const catLabel = (s.category || 'pssa').toUpperCase();
        const typeLabel = s.openEnded
            ? '<span style="color:var(--primary-color);font-size:0.8rem;">Open-Ended</span>'
            : '<span style="color:var(--text-secondary);font-size:0.8rem;">Multiple Choice</span>';
        const dynLabel = s.dynamic
            ? ' <span style="background:linear-gradient(135deg,#e3f2fd,#f3e5f5);color:#6a1b9a;font-size:0.7rem;padding:0.1rem 0.4rem;border-radius:4px;font-weight:600;">Dynamic</span>'
            : ' <span style="color:var(--text-secondary);font-size:0.7rem;">Static</span>';
        html += `<tr style="border-bottom:1px solid var(--border-color);" onmouseenter="this.style.background='var(--bg-surface)'" onmouseleave="this.style.background=''">
            <td style="padding:0.6rem 0.5rem;font-weight:600;color:var(--primary-color);cursor:pointer;" onclick="openEditSkill('${id}')">${s.type || 'Untitled'}${dynLabel}</td>
            <td style="padding:0.6rem 0.5rem;font-size:0.85rem;">${catLabel} — ${gradeLabel}</td>
            <td style="padding:0.6rem 0.5rem;">${typeLabel}</td>
            <td style="padding:0.6rem 0.5rem;color:var(--text-secondary);font-size:0.85rem;">${s.anchor || '—'}</td>
            <td style="padding:0.6rem 0.5rem;text-align:right;">
                <button class="btn" style="padding:0.2rem 0.5rem;font-size:0.75rem;" onclick="openEditSkill('${id}')">Edit</button>
            </td>
        </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// ── Parse example problem (very flexible) ──

function parseExampleProblem(text) {
    // Work with raw lines (preserve blank lines and spacing)
    const rawLines = text.split('\n');
    // Also make a trimmed version for matching
    const lines = rawLines.map(l => l.trim());

    let options = [], correctLetter = '', correctAnswer = '', distractors = [];
    const optRegex = /^\(?([A-Da-d])[).:\]]\s*(.+)/;

    // Find answer line index
    let answerIdx = -1;
    for (let j = 0; j < lines.length; j++) {
        const ansMatch = lines[j].match(/^(?:answer|correct|ans|key)\s*(?:[:=]|is)\s*(.+)/i);
        if (ansMatch) {
            const val = ansMatch[1].trim();
            if (/^[A-Da-d]$/.test(val)) correctLetter = val.toUpperCase();
            else if (/^[A-Da-d][).\s]/.test(val)) correctLetter = val[0].toUpperCase();
            else correctAnswer = val;
            answerIdx = j;
            break;
        }
    }

    // Find first option line index
    let firstOptIdx = -1;
    for (let j = 0; j < lines.length; j++) {
        if (j === answerIdx) continue;
        if (lines[j].match(optRegex)) { firstOptIdx = j; break; }
    }

    // Question = everything before the first option or answer line, taken from RAW lines
    let questionEndIdx = lines.length;
    if (firstOptIdx >= 0) questionEndIdx = firstOptIdx;
    if (answerIdx >= 0 && answerIdx < questionEndIdx && firstOptIdx < 0) questionEndIdx = answerIdx;

    // Take raw lines for the question to preserve exact formatting
    let question = rawLines.slice(0, questionEndIdx).join('\n').trim();

    // Collect options
    for (let j = 0; j < lines.length; j++) {
        if (j === answerIdx) continue;
        const m = lines[j].match(optRegex);
        if (m) options.push({ letter: m[1].toUpperCase(), text: m[2].trim() });
    }

    // Resolve correct answer from options
    if (options.length > 0 && correctLetter) {
        options.forEach(o => {
            if (o.letter === correctLetter) correctAnswer = o.text;
            else distractors.push(o.text);
        });
    } else if (options.length > 0 && correctAnswer) {
        // correctAnswer might match one of the option texts
        const match = options.find(o => o.text.toLowerCase() === correctAnswer.toLowerCase());
        if (match) {
            options.forEach(o => {
                if (o.letter !== match.letter) distractors.push(o.text);
            });
            correctAnswer = match.text;
        } else {
            // No match — treat first option as correct
            correctAnswer = correctAnswer || options[0].text;
            distractors = options.map(o => o.text).filter(t => t !== correctAnswer);
        }
    } else if (options.length > 0 && !correctAnswer) {
        // No answer line at all — default first option
        correctAnswer = options[0].text;
        distractors = options.slice(1).map(o => o.text);
    }

    // If there's still no question but there IS text, use the whole raw input
    if (!question && !options.length) {
        question = text.trim();
    }

    return { question, correctAnswer, distractors };
}

// ── Create skill from example ──

async function createSkillFromExample() {
    const status = document.getElementById('skill-create-status');
    const name = document.getElementById('skill-name').value.trim();
    const category = document.getElementById('skill-category').value;
    const grade = document.getElementById('skill-grade').value;
    const anchor = document.getElementById('skill-anchor').value.trim();
    const exampleEl = document.getElementById('skill-example');
    const example = (exampleEl.value !== undefined && exampleEl.tagName === 'TEXTAREA') ? exampleEl.value.trim() : exampleEl.innerText.trim();
    const exampleHTML = (exampleEl.value !== undefined && exampleEl.tagName === 'TEXTAREA') ? exampleEl.value.trim() : exampleEl.innerHTML.trim();
    const guide = document.getElementById('skill-guide').value.trim();
    const isOpenEnded = document.querySelector('input[name="skill-answer-type"]:checked')?.value === 'open';
    const el_dyn = document.getElementById('skill-dynamic');
    const isDynamic = el_dyn ? el_dyn.checked : true;

    if (!name) { status.textContent = 'Enter a skill name.'; status.style.color = 'var(--incorrect)'; return; }
    if (!example) { status.textContent = 'Enter a problem.'; status.style.color = 'var(--incorrect)'; return; }

    status.textContent = 'Creating...';
    status.style.color = 'var(--text-secondary)';

    const parsed = parseExampleProblem(example);

    // If nothing was parsed at all, treat the whole input as the question
    if (!parsed.question) parsed.question = example;

    // For multiple choice, we need an answer. For open-ended, answer is optional.
    if (!isOpenEnded && !parsed.correctAnswer && parsed.distractors.length === 0) {
        // No choices found and no answer — maybe they just typed a plain question
        // Treat it as open-ended instead of failing
    }

    // If user picked open-ended, clear distractors even if they were parsed
    const distractors = isOpenEnded ? [] : parsed.distractors;

    const type = name.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');

    const answerText = parsed.correctAnswer || '';
    const isActuallyOpenEnded = isOpenEnded || distractors.length === 0;

    // Use the HTML from the editor directly if it contains rich formatting, otherwise use parsed
    const hasRichContent = exampleHTML && (exampleHTML.includes('<table') || exampleHTML.includes('<h3') || exampleHTML.includes('<div') || exampleHTML.includes('<b>'));
    // Clean editor-only UI (table +Row/+Col buttons) before saving
    let cleanedHTML = exampleHTML;
    if (hasRichContent) {
        cleanedHTML = cleanedHTML.replace(/<div style="display:flex;gap:0\.4rem[^"]*">[\s\S]*?<\/div>(?=\s*<\/div>)/g, '');
        cleanedHTML = cleanedHTML.replace(/\s*contenteditable="(true|false)"/g, '');
    }
    const questionForSave = hasRichContent ? cleanedHTML : parsed.question;

    const skillData = {
        type,
        anchor: anchor || '',
        category,
        grade,
        openEnded: isActuallyOpenEnded,
        dynamic: isDynamic,
        questionText: questionForSave,
        questionHTML: exampleHTML,
        answerText: answerText,
        distractorTexts: distractors,
        guideText: guide || (answerText ? `The correct answer is: ${answerText}.` : ''),
        exampleRaw: example,
        updatedAt: new Date().toISOString()
    };

    const id = 'skill_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    try {
        await fbSaveCustomSkill(id, skillData);
        _customSkillsCache = null;
        await injectCustomSkillsIntoPool();

        const gradeLabel = category === 'keystone' ? 'Keystone Algebra 1' : 'PSSA Grade ' + grade;
        const typeLabel = skillData.openEnded ? 'open-ended' : 'multiple choice';
        status.textContent = `Added "${name}" as ${typeLabel} to ${gradeLabel}!`;
        status.style.color = 'var(--correct)';

        // Clear form
        document.getElementById('skill-name').value = '';
        document.getElementById('skill-anchor').value = '';
        const _clearEl = document.getElementById('skill-example');
        if (_clearEl.tagName === 'TEXTAREA') _clearEl.value = '';
        else _clearEl.innerHTML = '';
        document.getElementById('skill-guide').value = '';
        if (document.getElementById('skill-dynamic')) document.getElementById('skill-dynamic').checked = true;
        toggleDynamicHint();

        renderSkillManager();
    } catch(e) {
        status.textContent = 'Error saving: ' + e.message;
        status.style.color = 'var(--incorrect)';
    }
}

// ── Edit existing custom skill ──

async function openEditSkill(id) {
    _editingSkillId = id;
    const skills = await getCustomSkills();
    const s = skills[id];
    if (!s) return;

    document.getElementById('skill-edit-panel').style.display = 'block';
    document.getElementById('skill-edit-title').textContent = 'Edit: ' + (s.type || 'Untitled');
    document.getElementById('skill-edit-name').value = s.type || '';
    document.getElementById('skill-edit-anchor').value = s.anchor || '';
    document.getElementById('skill-edit-openended').checked = !!s.openEnded;
    document.getElementById('skill-edit-dynamic').checked = !!s.dynamic;
    document.getElementById('skill-edit-question').value = s.questionHTML || s.questionText || '';
    document.getElementById('skill-edit-answer').value = s.answerText || '';
    document.getElementById('skill-edit-distractors').value = (s.distractorTexts || []).join('\n');
    document.getElementById('skill-edit-guide').value = s.guideText || '';
    document.getElementById('skill-edit-status').textContent = '';

    toggleEditOpenEnded();
    previewEditedSkill();

    document.getElementById('skill-edit-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function previewEditedSkill() {
    const q = document.getElementById('skill-edit-question').value;
    const a = document.getElementById('skill-edit-answer').value;
    const isOpen = document.getElementById('skill-edit-openended').checked;
    const d = isOpen ? [] : document.getElementById('skill-edit-distractors').value.split('\n').filter(l => l.trim());
    const g = document.getElementById('skill-edit-guide').value;

    let html = '<div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.5rem;">Formatted Preview</div>';
    html += `<div style="font-size:1rem;line-height:1.7;margin-bottom:0.75rem;">${renderMathInHTML(q.replace(/\n/g, '<br>'))}</div>`;

    if (isOpen) {
        html += '<div style="border:2px dashed var(--border-color);border-radius:10px;padding:0.6rem 1rem;color:var(--text-secondary);font-size:0.9rem;margin-bottom:0.5rem;">Student types their answer here</div>';
    } else if (d.length) {
        // Show correct answer + wrong choices as styled options
        const allOpts = [{ text: a, correct: true }, ...d.map(t => ({ text: t, correct: false }))];
        allOpts.forEach(o => {
            const borderColor = o.correct ? 'var(--correct)' : 'var(--border-color)';
            const bg = o.correct ? 'rgba(76,175,80,0.08)' : 'var(--bg-surface)';
            const badge = o.correct ? ' <span style="color:var(--correct);font-weight:700;font-size:0.8rem;">✓ correct</span>' : '';
            html += `<div style="border:2px solid ${borderColor};border-radius:10px;padding:0.5rem 1rem;margin-bottom:0.4rem;background:${bg};font-size:0.95rem;">${renderMathInHTML(o.text)}${badge}</div>`;
        });
    }

    if (a) html += `<div style="margin-top:0.5rem;color:var(--correct);font-weight:600;font-size:0.9rem;">Answer: ${renderMathInHTML(a)}</div>`;
    if (g) html += `<div style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.5rem;padding:0.5rem;background:var(--bg-surface);border-radius:6px;"><strong>Guide:</strong> ${renderMathInHTML(g)}</div>`;

    document.getElementById('skill-edit-preview').innerHTML = html;
}

async function updateEditedSkill() {
    if (!_editingSkillId) return;
    const status = document.getElementById('skill-edit-status');
    const skills = await getCustomSkills();
    const existing = skills[_editingSkillId] || {};

    const type = document.getElementById('skill-edit-name').value.trim();
    if (!type) { status.textContent = 'Name is required.'; status.style.color = 'var(--incorrect)'; return; }

    const isOpen = document.getElementById('skill-edit-openended').checked;
    const updated = {
        ...existing,
        type,
        anchor: document.getElementById('skill-edit-anchor').value.trim(),
        openEnded: isOpen,
        dynamic: document.getElementById('skill-edit-dynamic')?.checked || false,
        questionText: document.getElementById('skill-edit-question').value,
        answerText: document.getElementById('skill-edit-answer').value,
        distractorTexts: isOpen ? [] : document.getElementById('skill-edit-distractors').value.split('\n').filter(l => l.trim()),
        guideText: document.getElementById('skill-edit-guide').value,
        updatedAt: new Date().toISOString()
    };

    try {
        await fbSaveCustomSkill(_editingSkillId, updated);
        _customSkillsCache = null;
        await injectCustomSkillsIntoPool();
        status.textContent = 'Saved!';
        status.style.color = 'var(--correct)';
        renderSkillManager();
    } catch(e) {
        status.textContent = 'Error: ' + e.message;
        status.style.color = 'var(--incorrect)';
    }
}

async function deleteEditedSkill() {
    if (!_editingSkillId) return;
    if (!confirm('Delete this custom problem? This cannot be undone.')) return;

    try {
        await fbDeleteCustomSkill(_editingSkillId);
        _customSkillsCache = null;
        await injectCustomSkillsIntoPool();
        document.getElementById('skill-edit-panel').style.display = 'none';
        _editingSkillId = null;
        renderSkillManager();
    } catch(e) {
        document.getElementById('skill-edit-status').textContent = 'Error: ' + e.message;
    }
}

// ── Build live template and inject into pool ──

function formatQuestionHTML(text) {
    if (!text) return '';
    // Clean up: trim lines, collapse 3+ blank lines into one, remove leading/trailing blanks
    var lines = text.split('\n').map(function(l) { return l.trimEnd(); });
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    // Collapse consecutive empty lines into one <br>
    var html = '';
    var lastWasEmpty = false;
    for (var i = 0; i < lines.length; i++) {
        if (!lines[i].trim()) {
            if (!lastWasEmpty) html += '<br>';
            lastWasEmpty = true;
        } else {
            html += lines[i] + '<br>';
            lastWasEmpty = false;
        }
    }
    return html.replace(/(<br>)+$/, '');
}

// ── Dynamic question generation from example ──

const _dynamicNames = [
    'Emma','Liam','Sophia','Noah','Olivia','James','Ava','Lucas','Mia','Ethan',
    'Isabella','Mason','Charlotte','Logan','Amelia','Aiden','Harper','Elijah','Ella','Jackson',
    'Sarah','Tom','Maria','David','Lin','Carlos','Priya','Jake','Zoe','Marcus',
    'Maya','Alex','Riley','Jordan','Taylor','Morgan','Kayla','Tyler','Dylan','Aaliyah',
    'Omar','Fatima','Kenji','Rosa','Anika','Wei','Sasha','Dante','Nadia','Kai',
    'Hector','Grace','Layla','Jayden','Chloe','Brandon','Nicole','Andre','Lily','Rohan'
];

const _dynamicScenarios = {
    // containers
    glasses:    ['cups','mugs','bottles','bowls','jars','pitchers','cartons'],
    boxes:      ['bags','crates','bins','baskets','trays','packs','buckets'],
    // food
    apples:     ['oranges','bananas','grapes','peaches','pears','lemons','mangoes','plums','kiwis'],
    cookies:    ['brownies','muffins','cupcakes','donuts','bagels','pancakes','waffles','pies','cakes'],
    pizzas:     ['sandwiches','burgers','tacos','wraps','salads'],
    candies:    ['chocolates','gummies','lollipops','treats','snacks'],
    // school
    books:      ['magazines','notebooks','folders','comics','novels','textbooks','journals','workbooks'],
    pencils:    ['pens','markers','crayons','erasers','rulers','highlighters'],
    students:   ['children','kids','campers','players','members','participants','scouts','swimmers'],
    // activities
    tickets:    ['passes','tokens','stamps','stickers','badges','coupons','wristbands','cards'],
    games:      ['matches','rounds','races','contests','events','activities'],
    laps:       ['trips','runs','walks','hikes','sprints','jogs'],
    // things
    rocks:      ['shells','marbles','beads','buttons','coins','stickers','pebbles','gems'],
    shirts:     ['hats','scarves','jackets','shoes','socks','gloves','sweaters','vests'],
    paintings:  ['drawings','photos','posters','prints','murals','sketches','portraits'],
    flowers:    ['plants','trees','bushes','seeds','seedlings','roses','tulips'],
    toys:       ['dolls','cars','blocks','puzzles','trains','figurines','kites'],
    // measurement
    miles:      ['kilometers','blocks','yards','meters'],
    hours:      ['minutes','days','weeks','months'],
    gallons:    ['liters','quarts','pints','cups'],
    pounds:     ['kilograms','ounces','grams'],
    feet:       ['inches','meters','centimeters','yards'],
    // places
    store:      ['shop','market','bakery','mall','center'],
    school:     ['library','gym','park','center','camp','club'],
    farm:       ['garden','ranch','orchard','field','yard'],
    // people roles
    teacher:    ['coach','instructor','tutor','counselor','leader'],
    friend:     ['classmate','neighbor','partner','teammate','buddy'],
    // vehicles
    cars:       ['buses','trucks','vans','bikes','trains','wagons'],
    // animals
    dogs:       ['cats','birds','fish','rabbits','hamsters','turtles','frogs']
};

// Common English words that should NOT be treated as names
const _notNames = new Set([
    'The','This','That','These','Those','Which','What','How','Find','Each','One','Two','Three',
    'Four','Five','Six','Seven','Eight','Nine','Ten','Monday','Tuesday','Wednesday','Thursday',
    'Friday','Saturday','Sunday','January','February','March','April','May','June','July',
    'August','September','October','November','December','Total','Area','Volume','Perimeter',
    'Answer','Round','Solve','Write','Read','Show','Draw','Graph','Plot','Table','Number',
    'Day','Week','Month','Year','Price','Cost','Sale','Store','School','Class','Grade',
    'Math','Test','Quiz','Part','Step','Side','Line','Point','Set','Group','Pair',
    'Movie','Music','Book','Game','Food','Water','Park','Farm','Home','Room','Door'
]);

function _findSimilarWord(word) {
    const lw = word.toLowerCase();
    for (const [key, alts] of Object.entries(_dynamicScenarios)) {
        if (lw === key || alts.includes(lw)) {
            const pool = [key, ...alts].filter(w => w !== lw);
            return pool[Math.floor(Math.random() * pool.length)];
        }
    }
    return word;
}

function _randomizeNumber(n) {
    // Keep same order of magnitude / similar size
    if (n <= 0) return n;
    if (n <= 5) return rand(Math.max(1, n - 2), n + 2);
    if (n <= 10) return rand(Math.max(2, n - 3), n + 3);
    if (n <= 20) return rand(Math.max(5, n - 5), n + 5);
    if (n <= 100) return rand(Math.max(10, Math.round(n * 0.6)), Math.round(n * 1.4));
    if (n <= 1000) return Math.round(rand(Math.round(n * 0.7), Math.round(n * 1.3)) / 5) * 5;
    return Math.round(rand(Math.round(n * 0.7), Math.round(n * 1.3)) / 10) * 10;
}

function _dynamicReplace(text, numberMap, nameMap) {
    if (!text) return text;
    let result = text;
    // Replace names first (longer strings first to avoid partial matches)
    Object.entries(nameMap).sort((a, b) => b[0].length - a[0].length).forEach(([orig, rep]) => {
        result = result.replace(new RegExp(orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), rep);
    });
    // Replace numbers (whole word only, largest first)
    Object.entries(numberMap).sort((a, b) => b[0].length - a[0].length).forEach(([orig, rep]) => {
        result = result.replace(new RegExp('\\b' + orig + '\\b', 'g'), String(rep));
    });
    return result;
}

function buildGeneratorFromSkill(skill) {
    // Static mode: return exact same question every time
    if (skill.dynamic === false) {
        const qs = (skill.questions && skill.questions.length) ? skill.questions : null;
        return {
            type: skill.type, anchor: skill.anchor || '', openEnded: !!skill.openEnded, _isCustom: true,
            gen: function() {
                if (qs) {
                    // Pick random question from the saved array
                    var q = qs[Math.floor(Math.random() * qs.length)];
                    var correctPlain = (q.correct || '').replace(/^[A-D]\)\s*/, '');
                    var distractors = q.openEnded ? [] : (q.options || [])
                        .map(function(o) { return o.replace(/^[A-D]\)\s*/, ''); })
                        .filter(function(o) { return o !== correctPlain; });
                    // Build option-text → visual map so visuals survive option shuffling
                    var optionVisualsByText = {};
                    if (q.optionVisuals) {
                        (q.options || []).forEach(function(opt) {
                            var m = opt.match(/^([A-D])\)\s*([\s\S]+)/);
                            if (m && q.optionVisuals[m[1]]) optionVisualsByText[m[2].trim()] = q.optionVisuals[m[1]];
                        });
                    }
                    return {
                        q: q.questionHTML || q.text || '',
                        ans: correctPlain,
                        distractors: distractors,
                        guide: q.guide || '',
                        visualHTML: q.visualHTML || '',
                        optionVisualsByText: Object.keys(optionVisualsByText).length ? optionVisualsByText : null,
                        answerVisual: q.answerVisual || null
                    };
                }
                // Legacy single-question fallback
                return { q: skill.questionHTML || skill.questionText || '', ans: skill.answerText || '',
                    distractors: skill.openEnded ? [] : (skill.distractorTexts || []), guide: skill.guideText || '' };
            }
        };
    }

    // ── DYNAMIC: Simple and direct ──
    // Get the text to work with (strip HTML for analysis, keep HTML for display)
    var qDisplay = skill.questionHTML || skill.questionText || '';
    var qPlain = qDisplay.replace(/<[^>]+>/g, ' ');
    var origAns = skill.answerText || '';
    var origGuide = skill.guideText || '';
    var origDist = skill.distractorTexts || [];

    // Find all numbers in the question
    var nums = [];
    qPlain.replace(/\b(\d+)\b/g, function(m, n) { var v = parseInt(n); if (v > 0 && nums.indexOf(n) < 0) nums.push(n); });

    // Find names (capitalized words 3+ letters that aren't common words)
    var names = [];
    qPlain.replace(/\b([A-Z][a-z]{2,})\b/g, function(m, w) { if (!_notNames.has(w) && names.indexOf(w) < 0) names.push(w); });

    // Find scenario words
    var scenarios = [];
    var qLow = qPlain.toLowerCase();
    Object.keys(_dynamicScenarios).forEach(function(k) {
        if (qLow.indexOf(k) >= 0 && scenarios.indexOf(k) < 0) scenarios.push(k);
        _dynamicScenarios[k].forEach(function(alt) { if (qLow.indexOf(alt) >= 0 && scenarios.indexOf(alt) < 0) scenarios.push(alt); });
    });

    // Detect math operation
    var ansNum = parseFloat(origAns);
    var op = null;
    if (nums.length >= 2 && !isNaN(ansNum)) {
        var a = parseInt(nums[0]), b = parseInt(nums[1]);
        if (a + b === ansNum) op = 'add';
        else if (a - b === ansNum || b - a === ansNum) op = 'sub';
        else if (a * b === ansNum) op = 'mul';
        else if (b > 0 && a / b === ansNum) op = 'div';
    }

    return {
        type: skill.type, anchor: skill.anchor || '', openEnded: !!skill.openEnded, _isCustom: true,
        gen: function() {
            // Pick new random numbers (same size range)
            var numMap = {};
            nums.forEach(function(n) { numMap[n] = _randomizeNumber(parseInt(n)); });

            // Pick new random names
            var nameMap = {};
            var used = {};
            names.forEach(function(n) {
                var pick;
                do { pick = _dynamicNames[Math.floor(Math.random() * _dynamicNames.length)]; } while (used[pick]);
                used[pick] = true;
                nameMap[n] = pick;
            });

            // Pick new scenario words
            scenarios.forEach(function(w) {
                var r = _findSimilarWord(w);
                if (r !== w) nameMap[w] = r;
            });

            // Do all replacements on the display text
            var newQ = qDisplay;
            var newGuide = origGuide;
            var newAns = origAns;

            // Replace names + scenarios (longer first)
            var allReplacements = Object.keys(nameMap).sort(function(a, b) { return b.length - a.length; });
            allReplacements.forEach(function(orig) {
                var rep = nameMap[orig];
                newQ = newQ.split(orig).join(rep);
                newGuide = newGuide.split(orig).join(rep);
                newAns = newAns.split(orig).join(rep);
            });

            // Replace numbers (longer first, only standalone)
            var numKeys = Object.keys(numMap).sort(function(a, b) { return b.length - a.length; });
            numKeys.forEach(function(orig) {
                var rep = String(numMap[orig]);
                // Use split/join with word boundary check
                newQ = newQ.replace(new RegExp('(?<![0-9])' + orig + '(?![0-9])', 'g'), rep);
                newGuide = newGuide.replace(new RegExp('(?<![0-9])' + orig + '(?![0-9])', 'g'), rep);
            });

            // Recalculate answer
            if (op && nums.length >= 2) {
                var na = numMap[nums[0]], nb = numMap[nums[1]];
                if (op === 'add') newAns = String(na + nb);
                else if (op === 'sub') newAns = String(Math.abs(na - nb));
                else if (op === 'mul') newAns = String(na * nb);
                else if (op === 'div' && nb > 0) newAns = String(Math.round(na / nb * 100) / 100);
            } else {
                numKeys.forEach(function(orig) {
                    newAns = newAns.replace(new RegExp('(?<![0-9])' + orig + '(?![0-9])', 'g'), String(numMap[orig]));
                });
            }

            // Recalculate distractors
            var newDist;
            if (op && nums.length >= 2) {
                var na = numMap[nums[0]], nb = numMap[nums[1]], an = parseFloat(newAns);
                newDist = [
                    String(an + rand(1, 5)),
                    String(Math.max(0, an - rand(1, 5))),
                    String(op === 'mul' ? na + nb : na * nb)
                ];
            } else {
                newDist = origDist.map(function(d) {
                    var nd = d;
                    allReplacements.forEach(function(orig) { nd = nd.split(orig).join(nameMap[orig]); });
                    numKeys.forEach(function(orig) { nd = nd.replace(new RegExp('(?<![0-9])' + orig + '(?![0-9])', 'g'), String(numMap[orig])); });
                    return nd;
                });
            }

            return { q: newQ, ans: newAns, distractors: skill.openEnded ? [] : newDist, guide: newGuide };
        }
    };
}

async function injectCustomSkillsIntoPool() {
    if (typeof extraTemplates === 'undefined') { console.log('[SKILLS] extraTemplates not defined'); return; }
    const skills = await getCustomSkills();
    console.log('[SKILLS] Loaded', Object.keys(skills).length, 'custom skills from Firebase');

    // Remove previously injected custom skills
    ['pssa', 'keystone'].forEach(cat => {
        if (!extraTemplates[cat]) return;
        Object.keys(extraTemplates[cat]).forEach(key => {
            extraTemplates[cat][key] = extraTemplates[cat][key].filter(t => !t._isCustom);
        });
    });

    // Inject fresh
    Object.entries(skills).forEach(([id, skill]) => {
        const cat = skill.category || 'pssa';
        const grade = skill.grade || '3';
        if (!extraTemplates[cat]) extraTemplates[cat] = {};
        if (!extraTemplates[cat][grade]) extraTemplates[cat][grade] = [];
        const template = buildGeneratorFromSkill(skill);
        extraTemplates[cat][grade].push(template);
        console.log('[SKILLS] Injected "' + skill.type + '" into', cat, grade, '| dynamic:', skill.dynamic !== false);
    });
}

// Load custom skills on page load (wait for Firebase module to init)
(function waitAndInject() {
    if (typeof fbGetCustomSkills === 'function') {
        injectCustomSkillsIntoPool().catch(function(){});
    } else {
        setTimeout(waitAndInject, 200);
    }
})();

