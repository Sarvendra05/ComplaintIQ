// ============================================
// Shared Application JavaScript
// ============================================

const API_BASE = '/api';

// ============================================
// AUTH HELPERS
// ============================================
function getToken() {
    return sessionStorage.getItem('token');
}

function getUser() {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function setAuth(token, user) {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function clearAuth() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
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

    if (options.body instanceof FormData || (options.body && typeof options.body.append === 'function')) {
        delete config.headers['Content-Type'];
        config.body = options.body;
    } else if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        
        let data = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            // If it's HTML or some other format, package it in an error object
            data = { error: text || `Request failed with status ${response.status}` };
        }

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
// SIDEBAR & TOPBAR RENDERING
// ============================================
function renderSidebar() {
    const user = getUser();
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    let links = '';
    
    if (user && user.role === 'citizen') {
        links = `
            <a href="/" class="nav-item"><i class="ph ph-house"></i> <span>Home</span></a>
            <a href="/complaint-form.html" class="nav-item"><i class="ph ph-plus-circle"></i> <span>File Complaint</span></a>
            <a href="/my-complaints.html" class="nav-item"><i class="ph ph-list-dashes"></i> <span>My Complaints</span></a>
        `;
    } else if (user && user.role === 'admin') {
        links = `
            <a href="/admin-dashboard.html" class="nav-item"><i class="ph ph-squares-four"></i> <span>Dashboard</span></a>
            <a href="/hotspots.html" class="nav-item"><i class="ph ph-map-trifold"></i> <span>Hotspot Map</span></a>
            <a href="/performance.html" class="nav-item"><i class="ph ph-trend-up"></i> <span>Performance</span></a>
        `;
    } else if (user && user.role === 'department') {
        links = `
            <a href="/dept-dashboard.html" class="nav-item"><i class="ph ph-squares-four"></i> <span>Dashboard</span></a>
        `;
    }

    sidebar.innerHTML = `
        <div class="sidebar-header">
            <a href="/" class="sidebar-brand">
                <div class="brand-icon"><i class="ph-fill ph-shield-check"></i></div>
                <span class="brand-text">ComplaintIQ</span>
            </a>
        </div>
        <div class="sidebar-nav" id="navLinks">
            ${links}
        </div>
        <div class="sidebar-footer">
            <div class="help-card">
                <p>Need help with the platform?</p>
                <a href="#" class="btn btn-primary btn-sm" style="width:100%">Get Support</a>
            </div>
            ${user ? `<a href="#" onclick="logout()" class="nav-item" style="color:var(--danger); padding:0; justify-content:center;"><i class="ph ph-sign-out"></i> <span>Sign Out</span></a>` : ''}
        </div>
    `;

    // Highlight active link
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-item').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

function renderTopbar(title = 'Dashboard') {
    const user = getUser();
    const topbar = document.getElementById('topbar');
    if (!topbar) return;

    const isPublicAuthPage = window.location.pathname.includes('login') || window.location.pathname.includes('register') || window.location.pathname === '/' || window.location.pathname.includes('index');

    let userInfo = '';
    if (user && !isPublicAuthPage) {
        userInfo = `
            <div class="user-profile">
                <div class="user-info" style="text-align: right;">
                    <span class="user-name">${user.name}</span>
                    <span class="user-role">${user.role === 'admin' ? 'Administrator' : user.role === 'department' ? user.dept_name || 'Department' : 'Citizen'}</span>
                </div>
                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
            </div>
        `;
    } else {
        userInfo = `
            <div class="user-profile auth-buttons" style="border:none;">
                <a href="/login.html" class="btn btn-outline btn-sm auth-btn-login">Sign In</a>
                <a href="/register.html" class="btn btn-primary btn-sm auth-btn-register">Register</a>
            </div>
        `;
    }

    topbar.innerHTML = `
        <div class="topbar-left" style="flex:1;">
            ${!isPublicAuthPage ? `
            <button class="mobile-menu-btn" onclick="toggleMobileNav()">
                <i class="ph ph-list"></i>
            </button>
            ` : ''}
            <a href="/" class="brand-logo">
                <div class="brand-icon-box">
                    <i class="ph-fill ph-shield-check"></i>
                </div>
                <span class="brand-text-bold">Complaint<span>IQ</span></span>
            </a>
        </div>
        ${title === 'Dashboard' ? `
        <div class="topbar-center" style="flex:1; display:flex; justify-content:center;">
            <div class="topbar-search">
                <i class="ph ph-magnifying-glass"></i>
                <input type="text" placeholder="Search complaints, categories...">
            </div>
        </div>
        ` : ''}
        <div class="topbar-right" style="flex:1; justify-content:flex-end;">
            ${user ? `<button class="notification-bell"><i class="ph ph-bell"></i></button>` : ''}
            ${userInfo}
        </div>
    `;
}

function toggleMobileNav() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active', sidebar.classList.contains('open'));
}

// Theme handling
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateThemeIcon();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('theme', newTheme);
    
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.style.transform = 'rotate(360deg) scale(0)';
        icon.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            updateThemeIcon();
            icon.style.transform = 'rotate(0deg) scale(1)';
        }, 200);
    } else {
        updateThemeIcon();
    }
    
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }));
}

function updateThemeIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const btns = document.querySelectorAll('.theme-toggle i');
    btns.forEach(btn => {
        btn.className = isDark ? 'ph ph-sun' : 'ph ph-moon';
    });
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

// Scroll topbar effect
window.addEventListener('scroll', () => {
    const topbar = document.getElementById('topbar');
    if (topbar) {
        if (window.scrollY > 20) {
            topbar.style.boxShadow = 'var(--shadow-sm)';
        } else {
            topbar.style.boxShadow = 'none';
        }
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

// Premium Skeleton Loader Engine
function showSkeleton(containerId, type = 'table', count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '';
    if (type === 'table') {
        html = `
            <div class="table-container" style="border:none; border-radius:0;">
                <table style="width:100%;">
                    <thead>
                        <tr>
                            <th style="padding-left:24px; width:40%;"><div class="skeleton" style="width:80px; height:12px;"></div></th>
                            <th><div class="skeleton" style="width:60px; height:12px;"></div></th>
                            <th><div class="skeleton" style="width:60px; height:12px;"></div></th>
                            <th><div class="skeleton" style="width:80px; height:12px;"></div></th>
                            <th style="padding-right:24px; text-align:right;"><div class="skeleton" style="width:50px; height:12px; display:inline-block;"></div></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Array(count).fill(0).map(() => `
                            <tr>
                                <td style="padding-left:24px;">
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <div class="skeleton" style="width:32px; height:32px; border-radius:50%;"></div>
                                        <div style="flex:1;">
                                            <div class="skeleton skeleton-text" style="width:60%; height:12px;"></div>
                                            <div class="skeleton skeleton-text" style="width:40%; height:10px;"></div>
                                        </div>
                                    </div>
                                </td>
                                <td><div class="skeleton skeleton-text" style="width:70px; height:12px;"></div></td>
                                <td><div class="skeleton skeleton-text" style="width:80px; height:12px;"></div></td>
                                <td><div class="skeleton" style="width:70px; height:20px; border-radius:10px;"></div></td>
                                <td style="padding-right:24px; text-align:right;"><div class="skeleton" style="width:80px; height:28px; border-radius:6px; display:inline-block;"></div></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (type === 'cards') {
        html = `
            <div class="grid-4" style="margin-bottom:24px;">
                ${Array(count).fill(0).map(() => `
                    <div class="card skeleton-card">
                        <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                            <div class="skeleton" style="width:30%; height:12px;"></div>
                            <div class="skeleton" style="width:36px; height:36px; border-radius:50%;"></div>
                        </div>
                        <div class="skeleton" style="width:50%; height:32px; margin-bottom:12px;"></div>
                        <div class="skeleton" style="width:40%; height:12px;"></div>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (type === 'chart') {
        html = `
            <div class="card" style="padding:24px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                    <div class="skeleton" style="width:140px; height:16px;"></div>
                    <div class="skeleton" style="width:60px; height:16px;"></div>
                </div>
                <div class="skeleton skeleton-chart"></div>
            </div>
        `;
    }
    container.innerHTML = html;
}

// Numeric Value Animator for Premium SaaS stat cards
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Intersection Observer for Scroll-triggered Entry Animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });
    
    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });
}

// Initialize on all pages
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    // Auto redirect if already logged in on auth/public pages
    if (path.includes('login') || path.includes('register') || path === '/' || path.includes('index')) {
        const user = getUser();
        if (user) {
            if (user.role === 'citizen') window.location.href = '/my-complaints.html';
            else if (user.role === 'admin') window.location.href = '/admin-dashboard.html';
            else if (user.role === 'department') window.location.href = '/dept-dashboard.html';
            return;
        }
    }

    initTheme();
    renderSidebar();
    
    let title = 'Dashboard';
    if (path.includes('hotspots')) title = 'Hotspot Detection';
    else if (path.includes('performance')) title = 'Performance Report';
    else if (path.includes('my-complaints')) title = 'My Complaints';
    else if (path.includes('complaint-form')) title = 'File a Complaint';
    else if (path === '/' || path.includes('index')) title = 'Civic Intelligence';
    
    renderTopbar(title);
    
    // Stagger slide-in animations for nav links
    document.querySelectorAll('.sidebar-nav .nav-item').forEach((item, idx) => {
        item.style.animation = `fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards`;
        item.style.animationDelay = `${idx * 0.06}s`;
        item.style.opacity = '0';
    });

    // Content area fade in transition
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.add('fade-in-up');
    }
    
    initScrollAnimations();
});
