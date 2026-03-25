// --- Configuration & Constants ---
const CHANNEL_NAME = 'pw_live_channel';
const STORAGE_KEY = 'pw_live_employees';
const IDLE_THRESHOLD = 60000; // 1 minute
const broadcast = new BroadcastChannel(CHANNEL_NAME);

// --- State Management ---
let employees = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
    { id: 1, name: 'John Doe', email: 'john@pw.live', tracked: '3h 45m', productivity: 88, status: 'online', lastSeen: 'Just now', avatar: 'JD' },
    { id: 2, name: 'Jane Smith', email: 'jane@pw.live', tracked: '5h 10m', productivity: 92, status: 'online', lastSeen: 'Just now', avatar: 'JS' },
    { id: 3, name: 'Mark Wilson', email: 'mark@pw.live', tracked: '2h 15m', productivity: 75, status: 'idle', lastSeen: '5m ago', avatar: 'MW' }
];

// --- Initialization ---
function init() {
    updateLiveClocks();
    setInterval(updateLiveClocks, 1000);
    
    updateGreeting();
    renderEmployees();
    
    // Listen for live updates from other tabs
    broadcast.onmessage = (event) => {
        if (event.data.type === 'REFRESH') {
            console.log('Live refresh received via BroadcastChannel');
            refreshData();
        }
    };

    // Event Listeners
    document.getElementById('refreshBtn').addEventListener('click', () => {
        refreshData();
        // Notify other tabs
        broadcast.postMessage({ type: 'REFRESH' });
    });
}

// --- UI Updates ---
function updateLiveClocks() {
    const now = new Date();
    
    // Header Clock
    const timeStr = now.toLocaleTimeString('en-GB', { hour12: false }) + ' IST';
    document.getElementById('liveClock').textContent = timeStr;
    
    // Header Date
    const dateOptions = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
    document.getElementById('liveDate').textContent = now.toLocaleDateString('en-GB', dateOptions).replace(/\//g, ' ');

    // Greeting Date
    const fullDateOptions = { weekday: 'long', day: '2-digit', month: 'long' };
    document.getElementById('fullDate').textContent = now.toLocaleDateString('en-GB', fullDateOptions);
    
    // Session Clock
    const sessionSeconds = Math.floor(performance.now() / 1000) + 9294;
    document.getElementById('sessionClock').textContent = formatSessionTime(sessionSeconds);
}

function updateGreeting() {
    const hour = new Date().getHours();
    const greetingEl = document.getElementById('greetingText');
    
    if (hour < 12) greetingEl.textContent = 'Good morning ☀️';
    else if (hour < 18) greetingEl.textContent = 'Good afternoon 🌤️';
    else greetingEl.textContent = 'Good evening 🌙';
}

function formatSessionTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const ampm = h >= 12 ? 'pm' : 'am';
    const displayH = h % 12 || 12;
    return `${pad(displayH)}:${pad(m)}:${pad(s)} ${ampm}`;
}

function pad(n) { return n.toString().padStart(2, '0'); }

function renderEmployees() {
    const grid = document.getElementById('employeeGrid');
    const liveCountEl = document.getElementById('liveCount');
    const totalCountEl = document.getElementById('employeeCount');
    
    const liveCount = employees.filter(e => e.status === 'online').length;
    liveCountEl.textContent = liveCount;
    totalCountEl.textContent = employees.length;

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
                <span class="last-seen">Last seen: ${e.lastSeen}</span>
                <a href="#" class="view-btn">View logs</a>
            </div>
        </div>
    `).join('');
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

function getAvatarColor(initials) {
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];
    const charCode = initials.charCodeAt(0) + initials.charCodeAt(1);
    return colors[charCode % colors.length];
}

// Inject additional styles for dynamic elements
const style = document.createElement('style');
style.textContent = `
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .employee-card { padding: 20px; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #edf2f7; border-radius: 12px; background: #fff; }
    .employee-card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px -10px rgba(0,0,0,0.1); }
    .card-header-mini { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .avatar-box { position: relative; }
    .status-indicator { position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; }
    .status-indicator.online { background: #10b981; }
    .status-indicator.idle { background: #f59e0b; }
    .emp-info { flex: 1; }
    .emp-name { display: block; font-size: 14px; font-weight: 700; color: #1a202c; }
    .emp-email { font-size: 12px; color: #718096; }
    .card-stats { display: flex; justify-content: space-between; background: #f8fafc; padding: 12px; border-radius: 12px; margin-bottom: 16px; }
    .stat { display: flex; flex-direction: column; gap: 4px; }
    .stat-label { font-size: 10px; font-weight: 700; color: #a0aec0; text-transform: uppercase; }
    .stat-val { font-size: 14px; font-weight: 700; color: #2d3748; }
    .stat-val.high { color: #059669; }
    .stat-val.med { color: #d97706; }
    .card-footer-mini { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
    .last-seen { color: #718096; }
    .view-btn { color: #6366f1; text-decoration: none; font-weight: 600; }
    .view-btn:hover { text-decoration: underline; }
    .more-btn { background: none; border: none; color: #a0aec0; cursor: pointer; }
`;
document.head.appendChild(style);

init();
