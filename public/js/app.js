// ============================================
// Shared Application JavaScript
// ============================================

const API_BASE = '/api';

// ============================================
// AUTH HELPERS
// ============================================
function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function isLoggedIn() {
    return !!getToken();
}

function logout() {
    clearAuth();
    window.location.href = '/login.html';
}

function requireAuth(roles = []) {
    const user = getUser();
    if (!isLoggedIn() || !user) {
        window.location.href = '/login.html';
        return false;
    }
    if (roles.length > 0 && !roles.includes(user.role)) {
        window.location.href = '/';
        return false;
    }
    return true;
}

// ============================================
// API FETCH WRAPPER
// ============================================
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    };

    const token = getToken();
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            if ((response.status === 401 || response.status === 403) && endpoint !== '/auth/login') {
                clearAuth();
                window.location.href = '/login.html';
                return null;
            }
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    toast.innerHTML = `
        <span style="font-size:1.2rem">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// NAVBAR RENDERING
// ============================================
function renderNavbar() {
    const user = getUser();
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let links = '';
    let authSection = '';

    if (!user) {
        links = `
            <a href="/">Home</a>
        `;
        authSection = `
            <a href="/login.html" class="btn btn-outline btn-sm">Login</a>
            <a href="/register.html" class="btn btn-primary btn-sm">Register</a>
        `;
    } else if (user.role === 'citizen') {
        links = `
            <a href="/">Home</a>
            <a href="/complaint-form.html">File Complaint</a>
            <a href="/my-complaints.html">My Complaints</a>
        `;
        authSection = `
            <div class="nav-user-info">
                <span>👤 ${user.name}</span>
                <span class="user-badge">Citizen</span>
                <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
            </div>
        `;
    } else if (user.role === 'admin') {
        links = `
            <a href="/admin-dashboard.html">Dashboard</a>
            <a href="/hotspots.html">Hotspots</a>
            <a href="/performance.html">Performance</a>
        `;
        authSection = `
            <div class="nav-user-info">
                <span>🛡️ ${user.name}</span>
                <span class="user-badge">Admin</span>
                <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
            </div>
        `;
    } else if (user.role === 'department') {
        links = `
            <a href="/dept-dashboard.html">Dashboard</a>
        `;
        authSection = `
            <div class="nav-user-info">
                <span>🏢 ${user.name}</span>
                <span class="user-badge">${user.dept_name || 'Dept'}</span>
                <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
            </div>
        `;
    }

    navbar.innerHTML = `
        <a href="/" class="nav-brand">
            <div class="nav-brand-icon">🏛️</div>
            <div class="nav-brand-text">Complaint<span>IQ</span></div>
        </a>
        <div class="nav-links" id="navLinks">
            ${links}
        </div>
        <div class="nav-auth">
            ${authSection}
        </div>
        <div class="hamburger" onclick="toggleMobileNav()">
            <span></span><span></span><span></span>
        </div>
    `;

    // Highlight active link
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

function toggleMobileNav() {
    document.getElementById('navLinks')?.classList.toggle('open');
}

// ============================================
// UTILITY HELPERS
// ============================================
function getStatusBadge(status) {
    const map = {
        'Pending': 'badge-pending',
        'In Progress': 'badge-progress',
        'Resolved': 'badge-resolved',
        'Escalated': 'badge-escalated'
    };
    return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

function getPriorityBadge(priority) {
    const map = {
        'Low': 'badge-priority-low',
        'Medium': 'badge-priority-medium',
        'High': 'badge-priority-high',
        'Critical': 'badge-priority-critical'
    };
    return `<span class="badge ${map[priority] || ''}">${priority}</span>`;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Scroll navbar effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    }
});

// Load areas for dropdowns
async function loadAreas(selectId) {
    try {
        const areas = await apiRequest('/areas');
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">Select Area</option>';
        areas.forEach(a => {
            select.innerHTML += `<option value="${a.area_id}">${a.area_name}</option>`;
        });
    } catch (err) {
        console.error('Failed to load areas:', err);
    }
}

// Initialize navbar on all pages
document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
});
