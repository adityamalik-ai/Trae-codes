// --- Configuration & Constants ---
const CHANNEL_NAME = 'pw_live_channel';
const STORAGE_KEY = 'pw_live_employees';
const broadcast = new BroadcastChannel(CHANNEL_NAME);

// --- State Management ---
let currentRole = localStorage.getItem('pw_role') || null;
let isTracking = false;
let empActiveSeconds = 0;
let empTotalSeconds = 15600; // 4h 20m base
let trackingInterval = null;
let lastActivityTime = Date.now();

let employees = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
    { id: 1, name: 'John Doe', email: 'john@pw.live', tracked: '3h 45m', productivity: 88, status: 'online', lastSeen: 'Just now', avatar: 'JD' },
    { id: 2, name: 'Jane Smith', email: 'jane@pw.live', tracked: '5h 10m', productivity: 92, status: 'online', lastSeen: 'Just now', avatar: 'JS' },
    { id: 3, name: 'Mark Wilson', email: 'mark@pw.live', tracked: '2h 15m', productivity: 75, status: 'idle', lastSeen: '5m ago', avatar: 'MW' }
];

// --- Initialization ---
function init() {
    updateLiveClocks();
    setInterval(updateLiveClocks, 1000);
    
    if (currentRole) {
        showApp();
    } else {
        document.getElementById('roleSelector').style.display = 'flex';
    }

    // Broadcast Listeners
    broadcast.onmessage = (event) => {
        if (event.data.type === 'TRACKING_UPDATE') {
            updateEmployeeInList(event.data.data);
            renderEmployees();
        }
    };

    setupEventListeners();
}

function setupEventListeners() {
    // Manager Refresh
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshData();
        });
    }

    // Employee Tracker
    const empTrackBtn = document.getElementById('empTrackBtn');
    if (empTrackBtn) {
        empTrackBtn.addEventListener('click', toggleEmployeeTracking);
    }
}

// --- Role Management ---
function selectRole(role) {
    currentRole = role;
    localStorage.setItem('pw_role', role);
    document.getElementById('roleSelector').style.display = 'none';
    showApp();
}

function showApp() {
    document.querySelector('.app-layout').style.display = 'flex';
    const isManager = currentRole === 'manager';
    
    document.getElementById('managerNav').style.display = isManager ? 'block' : 'none';
    document.getElementById('employeeNav').style.display = isManager ? 'none' : 'block';
    document.getElementById('managerDashboard').style.display = isManager ? 'flex' : 'none';
    document.getElementById('employeeDashboard').style.display = isManager ? 'none' : 'block';
    
    document.getElementById('headerTitle').textContent = isManager ? 'Team overview' : 'My Tracker';
    
    // Update Profile UI
    if (isManager) {
        document.getElementById('userAvatar').textContent = 'AM';
        document.getElementById('userName').textContent = 'Aditya Malik';
        document.getElementById('userRoleLabel').textContent = 'Manager · @pw.live';
        renderEmployees();
    } else {
        document.getElementById('userAvatar').textContent = 'ME';
        document.getElementById('userName').textContent = 'Employee User';
        document.getElementById('userRoleLabel').textContent = 'Designer · @pw.live';
        updateGreeting();
    }
}

function logout() {
    localStorage.removeItem('pw_role');
    location.reload();
}

// --- Employee Tracking Logic ---
function toggleEmployeeTracking() {
    isTracking = !isTracking;
    const btn = document.getElementById('empTrackBtn');
    const status = document.getElementById('trackStatus');
    
    if (isTracking) {
        btn.innerHTML = '<i class="ph ph-stop"></i> Stop Tracking';
        btn.className = 'btn btn-danger btn-xl';
        status.textContent = 'Active';
        status.className = 'status-pill active';
        addActivity('Started tracking');
        
        trackingInterval = setInterval(updateEmployeeTimer, 1000);
    } else {
        btn.innerHTML = '<i class="ph ph-play"></i> Start Tracking';
        btn.className = 'btn btn-primary btn-xl';
        status.textContent = 'Idle';
        status.className = 'status-pill idle';
        addActivity('Stopped tracking');
        
        clearInterval(trackingInterval);
    }
}

function updateEmployeeTimer() {
    empActiveSeconds++;
    empTotalSeconds++;
    
    document.getElementById('empTimer').textContent = formatTime(empActiveSeconds);
    document.getElementById('empTotalTracked').textContent = formatMinutes(empTotalSeconds);
    
    // Simulate activity fluctuations
    const kb = Math.floor(Math.random() * 30) + 50;
    const mouse = Math.floor(Math.random() * 40) + 30;
    
    document.getElementById('kbActivity').style.width = kb + '%';
    document.getElementById('kbVal').textContent = kb + '%';
    document.getElementById('mouseActivity').style.width = mouse + '%';
    document.getElementById('mouseVal').textContent = mouse + '%';

    // Broadcast update to Manager
    broadcast.postMessage({
        type: 'TRACKING_UPDATE',
        data: {
            name: 'Employee User',
            email: 'me@pw.live',
            tracked: formatMinutes(empTotalSeconds),
            productivity: Math.round((kb + mouse) / 2),
            status: 'online',
            avatar: 'ME'
        }
    });
}

function updateEmployeeInList(data) {
    const existing = employees.find(e => e.email === data.email);
    if (existing) {
        Object.assign(existing, data);
    } else {
        employees.push({ id: Date.now(), ...data });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

// --- UI Utilities ---
function updateLiveClocks() {
    const now = new Date();
    if (document.getElementById('liveClock')) {
        document.getElementById('liveClock').textContent = now.toLocaleTimeString('en-GB', { hour12: false }) + ' IST';
    }
    if (document.getElementById('liveDate')) {
        const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
        document.getElementById('liveDate').textContent = now.toLocaleDateString('en-GB', options).replace(/\//g, ' ');
    }
    
    const sessionSeconds = Math.floor(performance.now() / 1000);
    if (document.getElementById('sessionClock')) {
        document.getElementById('sessionClock').textContent = formatTime(sessionSeconds);
    }
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatMinutes(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
}

function pad(n) { return n.toString().padStart(2, '0'); }

function updateGreeting() {
    const hour = new Date().getHours();
    const greetText = document.getElementById('greetingText');
    if (!greetText) return;
    
    if (hour < 12) greetText.textContent = 'Good morning ☀️';
    else if (hour < 18) greetText.textContent = 'Good afternoon 🌤️';
    else greetText.textContent = 'Good evening 🌙';
    
    const fullDate = document.getElementById('fullDate');
    if (fullDate) {
        const options = { weekday: 'long', day: '2-digit', month: 'long' };
        fullDate.textContent = new Date().toLocaleDateString('en-GB', options);
    }
}

function addActivity(msg) {
    const log = document.getElementById('activityLog');
    if (!log) return;
    
    const empty = log.querySelector('.empty-msg');
    if (empty) empty.remove();
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `<strong>${time}</strong>: ${msg}`;
    log.prepend(item);
}

function renderEmployees() {
    const grid = document.getElementById('employeeGrid');
    if (!grid) return;
    
    const liveCount = employees.filter(e => e.status === 'online').length;
    document.getElementById('liveCount').textContent = liveCount;
    document.getElementById('employeeCount').textContent = employees.length;

    grid.innerHTML = employees.map(e => `
        <div class="employee-card card">
            <div class="card-header-mini">
                <div class="avatar-box">
                    <div class="avatar sm" style="background: ${getAvatarColor(e.avatar)}">${e.avatar}</div>
                    <div class="status-indicator ${e.status}"></div>
                </div>
                <div class="emp-info">
                    <span class="emp-name">${e.name}</span>
                    <span class="emp-email">${e.email}</span>
                </div>
                <button class="more-btn"><i class="ph ph-dots-three-vertical"></i></button>
            </div>
            <div class="card-stats">
                <div class="stat">
                    <span class="stat-label">Tracked</span>
                    <span class="stat-val">${e.tracked}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Productivity</span>
                    <span class="stat-val ${e.productivity > 80 ? 'high' : 'med'}">${e.productivity}%</span>
                </div>
            </div>
            <div class="card-footer-mini">
                <span class="last-seen">Last seen: Just now</span>
                <a href="#" class="view-btn">View logs</a>
            </div>
        </div>
    `).join('');
}

function getAvatarColor(initials) {
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];
    const charCode = initials.charCodeAt(0) + (initials.length > 1 ? initials.charCodeAt(1) : 0);
    return colors[charCode % colors.length];
}

function refreshData() {
    const btn = document.getElementById('refreshBtn');
    btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Refreshing...';
    btn.disabled = true;
    setTimeout(() => {
        employees = JSON.parse(localStorage.getItem(STORAGE_KEY)) || employees;
        renderEmployees();
        btn.innerHTML = '<i class="ph ph-arrows-counter-clockwise"></i> Refresh data';
        btn.disabled = false;
    }, 800);
}

// Inject additional styles for dynamic elements
const style = document.createElement('style');
style.textContent = `
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .activity-item { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #4a5568; }
    .activity-item strong { color: #2d3748; }
`;
document.head.appendChild(style);

init();
