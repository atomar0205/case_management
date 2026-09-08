// ═══════════════════════════════════════════════════════════
// app.js  —  lawconnect Frontend Application
// All API calls go to the Express backend at BASE_URL
// ═══════════════════════════════════════════════════════════

const BASE_URL = 'http://localhost:5000/api';

// ─── Auth token helpers ───────────────────────────────────
function getToken()        { return localStorage.getItem('lawconnect_token'); }
function setToken(t)       { localStorage.setItem('lawconnect_token', t); }
function clearToken()      { localStorage.removeItem('lawconnect_token'); localStorage.removeItem('lawconnect_user'); }
function getUser()         { try { return JSON.parse(localStorage.getItem('lawconnect_user')); } catch { return null; } }
function setUser(u)        { localStorage.setItem('lawconnect_user', JSON.stringify(u)); }

let currentUser = getUser();

// ─── Generic fetch wrapper ────────────────────────────────
async function api(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = 'Bearer ' + getToken();

  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── Modal helpers ────────────────────────────────────────
function openModal(id)  { document.getElementById('modal-' + id).classList.add('active'); }
function closeModal(id) { document.getElementById('modal-' + id).classList.remove('active'); }
function switchModal(from, to) { closeModal(from); setTimeout(() => openModal(to), 100); }

function showErr(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

// ─── Toast ────────────────────────────────────────────────
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3100);
}

// ═══════════════════════════════════════════════════════════
// AUTH  — calls backend, stores JWT in localStorage
// ═══════════════════════════════════════════════════════════

async function loginClient() {
  const email    = document.getElementById('cl-email').value.trim();
  const password = document.getElementById('cl-pass').value;
  try {
    const data = await api('POST', '/auth/login/client', { email, password }, false);
    setToken(data.token);
    setUser(data.user);
    currentUser = data.user;
    closeModal('client-login');
    loadApp();
  } catch (e) { showErr('client-login-err', e.message); }
}

async function registerClient() {
  const name     = document.getElementById('cr-name').value.trim();
  const email    = document.getElementById('cr-email').value.trim();
  const phone    = document.getElementById('cr-phone').value.trim();
  const password = document.getElementById('cr-pass').value;
  try {
    const data = await api('POST', '/auth/register/client', { name, email, phone, password }, false);
    setToken(data.token);
    setUser(data.user);
    currentUser = data.user;
    closeModal('client-register');
    loadApp();
  } catch (e) { showErr('client-reg-err', e.message); }
}

async function loginLawyer() {
  const email    = document.getElementById('ll-email').value.trim();
  const password = document.getElementById('ll-pass').value;
  try {
    const data = await api('POST', '/auth/login/lawyer', { email, password }, false);
    setToken(data.token);
    setUser(data.user);
    currentUser = data.user;
    closeModal('lawyer-login');
    loadApp();
  } catch (e) { showErr('lawyer-login-err', e.message); }
}

async function registerLawyer() {
  const name     = document.getElementById('lr-name').value.trim();
  const email    = document.getElementById('lr-email').value.trim();
  const bar      = document.getElementById('lr-bar').value.trim();
  const spec     = document.getElementById('lr-spec').value;
  const password = document.getElementById('lr-pass').value;
  try {
    const data = await api('POST', '/auth/register/lawyer', { name, email, bar, spec, password }, false);
    setToken(data.token);
    setUser(data.user);
    currentUser = data.user;
    closeModal('lawyer-register');
    loadApp();
  } catch (e) { showErr('lawyer-reg-err', e.message); }
}

async function loginAdmin() {
  const username = document.getElementById('al-user').value.trim();
  const password = document.getElementById('al-pass').value;
  try {
    const data = await api('POST', '/auth/login/admin', { username, password }, false);
    setToken(data.token);
    setUser(data.user);
    currentUser = data.user;
    closeModal('admin-login');
    loadApp();
  } catch (e) { showErr('admin-login-err', e.message); }
}

function logout() {
  clearToken();
  currentUser = null;
  document.getElementById('app').classList.remove('active');
  document.getElementById('landing').style.display = 'flex';
  loadStats();
}

// ═══════════════════════════════════════════════════════════
// LANDING STATS
// ═══════════════════════════════════════════════════════════
async function loadStats() {
  try {
    const data = await api('GET', '/stats', null, false);
    document.getElementById('stat-lawyers').textContent  = data.stats.lawyers;
    document.getElementById('stat-cases').textContent    = data.stats.cases;
    document.getElementById('stat-resolved').textContent = data.stats.resolved;
  } catch (_) {}
}

// ═══════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════
function loadApp() {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('app').classList.add('active');

  document.getElementById('sidebar-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('sidebar-name').textContent   = currentUser.name;
  document.getElementById('sidebar-role').textContent   = currentUser.role.toUpperCase();

  const d = new Date();
  document.getElementById('topbar-date').textContent = d.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  if (currentUser.role === 'client') loadClientNav();
  if (currentUser.role === 'lawyer') loadLawyerNav();
  if (currentUser.role === 'admin')  loadAdminNav();
}

// ─── Nav builder ──────────────────────────────────────────
function buildNav(items) {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = '';
  items.forEach(item => {
    if (item.section) {
      nav.innerHTML += `<div class="nav-section-title">${item.section}</div>`;
      return;
    }
    const badge = item.badge ? `<span class="nav-badge" id="badge-${item.badge}" style="display:none">0</span>` : '';
    nav.innerHTML += `<div class="nav-item" id="nav-${item.id}" onclick="navigate('${item.id}')">
      <span class="icon">${item.icon}</span>${item.label}${badge}
    </div>`;
  });
}

function navigate(pageId) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('nav-' + pageId);
  if (navEl) navEl.classList.add('active');
  document.getElementById('topbar-title').textContent =
    pageId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  renderPage(pageId);
}

async function renderPage(id) {
  const ca = document.getElementById('content-area');
  ca.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-title">Loading...</div></div>';
  try {
    let html = '';
    switch (id) {
      case 'client-dashboard':  html = await renderClientDashboard();  break;
      case 'submit-case':       html = await renderSubmitCase();        break;
      case 'my-cases':          html = await renderMyCases();           break;
      case 'jansabha-submit':   html = renderJansabhaSubmit();          break;
      case 'client-profile':    html = renderClientProfile();           break;
      case 'lawyer-dashboard':  html = await renderLawyerDashboard();   break;
      case 'case-requests':     html = await renderCaseRequests();      break;
      case 'active-cases':      html = await renderActiveCases();       break;
      case 'jansabha-lawyer':   html = await renderJansabhaLawyer();    break;
      case 'lawyer-profile':    html = renderLawyerProfile();           break;
      case 'admin-dashboard':   html = await renderAdminDashboard();    break;
      case 'manage-lawyers':    html = await renderManageLawyers();     break;
      case 'manage-clients':    html = await renderManageClients();     break;
      case 'all-cases':         html = await renderAllCases();          break;
      case 'jansabha-admin':    html = await renderJansabhaAdmin();     break;
    }
    ca.innerHTML = html;
    updateBadges();
  } catch (e) {
    ca.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Error loading page</div><div class="empty-desc">${e.message}</div></div>`;
  }
}

// ═══════════════════════════════════════════════════════════
// CLIENT NAV + PAGES
// ═══════════════════════════════════════════════════════════
function loadClientNav() {
  buildNav([
    { section: 'MAIN' },
    { id: 'client-dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'submit-case',      icon: '📋', label: 'Submit New Case' },
    { id: 'my-cases',         icon: '📁', label: 'My Cases' },
    { section: 'JANSABHA' },
    { id: 'jansabha-submit',  icon: '🏛️', label: 'Jansabha Panel' },
    { section: 'ACCOUNT' },
    { id: 'client-profile',   icon: '👤', label: 'My Profile' },
  ]);
  navigate('client-dashboard');
}

async function renderClientDashboard() {
  const { cases }    = await api('GET', '/cases');
  const { disputes } = await api('GET', '/jansabha');
  const pending  = cases.filter(c => c.status === 'pending').length;
  const accepted = cases.filter(c => c.status === 'accepted').length;
  const rejected = cases.filter(c => c.status === 'rejected').length;

  const rows = cases.slice().reverse().slice(0, 5).map(c => `
    <tr>
      <td><span class="font-mono">${c.id}</span></td>
      <td><strong>${c.subject}</strong></td>
      <td>${c.type}</td>
      <td>${c.lawyerName}</td>
      <td><span class="badge badge-${c.status}">${c.status}</span></td>
      <td>${c.filed}</td>
    </tr>
  `).join('') || emptyRow('📭', 'No cases filed yet', 6);

  return `
    <div class="page-header">
      <h1>Welcome back, ${currentUser.name.split(' ')[0]} 👋</h1>
      <p>Here's an overview of your legal cases and activities.</p>
    </div>
    <div class="stats-grid">
      <div class="stat-card accent-navy"><div class="stat-card-accent"></div><div class="stat-card-icon">📁</div><div class="stat-card-value">${cases.length}</div><div class="stat-card-label">Total Cases</div></div>
      <div class="stat-card accent-gold"><div class="stat-card-accent"></div><div class="stat-card-icon">⏳</div><div class="stat-card-value">${pending}</div><div class="stat-card-label">Pending Review</div></div>
      <div class="stat-card accent-green"><div class="stat-card-accent"></div><div class="stat-card-icon">✅</div><div class="stat-card-value">${accepted}</div><div class="stat-card-label">Accepted</div></div>
      <div class="stat-card accent-red"><div class="stat-card-accent"></div><div class="stat-card-icon">❌</div><div class="stat-card-value">${rejected}</div><div class="stat-card-label">Rejected</div></div>
      <div class="stat-card accent-blue"><div class="stat-card-accent"></div><div class="stat-card-icon">🏛️</div><div class="stat-card-value">${disputes.length}</div><div class="stat-card-label">Jansabha Disputes</div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">Recent Cases</div>
        <button class="btn btn-navy btn-sm" onclick="navigate('submit-case')">+ New Case</button>
      </div>
      <div class="card-body">
        <table><thead><tr><th>Case ID</th><th>Subject</th><th>Type</th><th>Lawyer</th><th>Status</th><th>Filed On</th></tr></thead>
        <tbody>${rows}</tbody></table>
      </div>
    </div>`;
}

async function renderSubmitCase() {
  const { lawyers } = await api('GET', '/lawyers', null, false);
  const opts = lawyers.map(l => `<option value="${l.id}">${l.name} — ${l.spec}</option>`).join('');
  return `
    <div class="page-header"><h1>Submit New Case</h1><p>Fill in the details below to send a case request to a lawyer.</p></div>
    <div class="form-section">
      <div class="form-section-title">Case Details</div>
      <div class="form-section-desc">Provide accurate information to help the lawyer assess your case.</div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Case Type</label>
          <select class="form-select" id="sc-type">
            <option value="">Select category</option>
            <option>Criminal Law</option><option>Family Law</option><option>Civil Law</option>
            <option>Cyber Law</option><option>Consumer Law</option><option>Property Law</option>
            <option>Labour Law</option><option>Constitutional Law</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Preferred Lawyer</label>
          <select class="form-select" id="sc-lawyer"><option value="">Select a lawyer</option>${opts}</select>
        </div>
        <div class="form-group full">
          <label class="form-label">Case Subject / Title</label>
          <input class="form-input" id="sc-subject" placeholder="Brief title of your legal issue"/>
        </div>
        <div class="form-group full">
          <label class="form-label">Case Description</label>
          <textarea class="form-textarea" id="sc-desc" rows="5" placeholder="Describe your legal problem in detail..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Mode of Consultation</label>
          <select class="form-select" id="sc-mode">
            <option value="online">Online (Video Call / Chat)</option>
            <option value="offline">Offline (In-person Meeting)</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="navigate('client-dashboard')">Cancel</button>
        <button class="btn btn-gold-solid" onclick="submitCase()">📤 &nbsp;Submit Case Request</button>
      </div>
    </div>`;
}

async function submitCase() {
  const type      = document.getElementById('sc-type').value;
  const lawyerId  = document.getElementById('sc-lawyer').value;
  const subject   = document.getElementById('sc-subject').value.trim();
  const description = document.getElementById('sc-desc').value.trim();
  const mode      = document.getElementById('sc-mode').value;
  if (!type || !lawyerId || !subject || !description) { toast('⚠️ Please fill all required fields.'); return; }
  try {
    await api('POST', '/cases', { type, lawyerId, subject, description, mode });
    toast('✅ Case submitted successfully!');
    navigate('my-cases');
  } catch (e) { toast('⚠️ ' + e.message); }
}

async function renderMyCases() {
  const { cases } = await api('GET', '/cases');
  const rows = cases.slice().reverse().map(c => `
    <tr>
      <td><span class="font-mono">${c.id}</span></td>
      <td><strong>${c.subject}</strong><br/><span style="font-size:12px;color:var(--text-light)">${c.type}</span></td>
      <td>${c.lawyerName}</td>
      <td><span class="badge badge-${c.mode}">${c.mode}</span></td>
      <td><span class="badge badge-${c.status}">${c.status.toUpperCase()}</span></td>
      <td>${c.filed}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="viewCase('${c.id}')">View</button></td>
    </tr>
  `).join('') || emptyRow('📭', 'No cases filed yet', 7);

  return `
    <div class="page-header" style="display:flex;align-items:center;justify-content:space-between">
      <div><h1>My Cases</h1><p>Track the status of all your filed cases.</p></div>
      <button class="btn btn-gold-solid" onclick="navigate('submit-case')">+ New Case</button>
    </div>
    <div class="card"><div class="card-body">
      <table><thead><tr><th>Case ID</th><th>Subject</th><th>Lawyer</th><th>Mode</th><th>Status</th><th>Filed</th><th>Action</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div></div>`;
}

function renderJansabhaSubmit() {
  return `
    <div class="jansabha-banner">
      <div class="jansabha-banner-icon">🏛️</div>
      <div>
        <div class="jansabha-banner-title">Jansabha Panel — Quick Dispute Resolution</div>
        <div class="jansabha-banner-desc">For minor disputes and small grievances. Our panel ensures quick resolution without formal proceedings.</div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Submit Small Dispute</div>
      <div class="form-section-desc">Use this for minor neighbourhood, consumer, or civil disputes.</div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Dispute Type</label>
          <select class="form-select" id="jc-type">
            <option value="">Select type</option>
            <option>Neighbour Dispute</option><option>Consumer Complaint</option><option>Rent Dispute</option>
            <option>Workplace Grievance</option><option>Family Dispute (Minor)</option><option>Other Small Dispute</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Other Party Name</label><input class="form-input" id="jc-party" placeholder="Name of the other party"/></div>
        <div class="form-group full"><label class="form-label">Dispute Title</label><input class="form-input" id="jc-subject" placeholder="One-line summary of the dispute"/></div>
        <div class="form-group full"><label class="form-label">Detailed Description</label><textarea class="form-textarea" id="jc-desc" placeholder="Explain the dispute clearly..."></textarea></div>
        <div class="form-group"><label class="form-label">Location of Dispute</label><input class="form-input" id="jc-location" placeholder="City / Area"/></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="navigate('client-dashboard')">Cancel</button>
        <button class="btn btn-gold-solid" onclick="submitJansabha()">🏛️ &nbsp;Submit to Jansabha Panel</button>
      </div>
    </div>`;
}

async function submitJansabha() {
  const type     = document.getElementById('jc-type').value;
  const party    = document.getElementById('jc-party').value.trim();
  const subject  = document.getElementById('jc-subject').value.trim();
  const description = document.getElementById('jc-desc').value.trim();
  const location = document.getElementById('jc-location').value.trim();
  if (!type || !subject || !description) { toast('⚠️ Please fill all required fields.'); return; }
  try {
    await api('POST', '/jansabha', { type, party, subject, description, location });
    toast('🏛️ Dispute submitted to Jansabha Panel!');
    navigate('client-dashboard');
  } catch (e) { toast('⚠️ ' + e.message); }
}

function renderClientProfile() {
  const u = currentUser;
  return `
    <div class="page-header"><h1>My Profile</h1></div>
    <div class="profile-header">
      <div class="profile-avatar-big">${u.name.charAt(0)}</div>
      <div class="profile-info">
        <h2>${u.name}</h2>
        <p>${u.email} &nbsp;|&nbsp; ${u.phone || 'Phone not set'}</p>
        <p style="margin-top:8px"><span class="badge badge-accepted">Active Client</span></p>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Profile Information</div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="cp-name" value="${u.name}"/></div>
        <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="cp-phone" value="${u.phone || ''}"/></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" value="${u.email}" disabled/></div>
        <div class="form-group"><label class="form-label">Member Since</label><input class="form-input" value="${u.joinDate || '—'}" disabled/></div>
      </div>
      <div class="form-actions"><button class="btn btn-navy" onclick="updateClientProfile()">Save Changes</button></div>
    </div>`;
}

async function updateClientProfile() {
  const name  = document.getElementById('cp-name').value.trim();
  const phone = document.getElementById('cp-phone').value.trim();
  try {
    const data = await api('PATCH', '/clients/' + currentUser.id, { name, phone });
    currentUser = data.client;
    setUser(currentUser);
    document.getElementById('sidebar-name').textContent   = currentUser.name;
    document.getElementById('sidebar-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
    toast('✅ Profile updated!');
  } catch (e) { toast('⚠️ ' + e.message); }
}

// ═══════════════════════════════════════════════════════════
// LAWYER NAV + PAGES
// ═══════════════════════════════════════════════════════════
function loadLawyerNav() {
  buildNav([
    { section: 'MAIN' },
    { id: 'lawyer-dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'case-requests',    icon: '📩', label: 'Case Requests', badge: 'requests' },
    { id: 'active-cases',     icon: '⚖️', label: 'Active Cases' },
    { section: 'JANSABHA' },
    { id: 'jansabha-lawyer',  icon: '🏛️', label: 'Jansabha Cases', badge: 'jreq' },
    { section: 'ACCOUNT' },
    { id: 'lawyer-profile',   icon: '👨‍⚖️', label: 'My Profile' },
  ]);
  navigate('lawyer-dashboard');
}

async function renderLawyerDashboard() {
  const { cases } = await api('GET', '/cases');
  const pending  = cases.filter(c => c.status === 'pending').length;
  const accepted = cases.filter(c => c.status === 'accepted').length;
  const resolved = cases.filter(c => c.status === 'resolved').length;
  const rejected = cases.filter(c => c.status === 'rejected').length;

  const rows = cases.filter(c => c.status === 'pending').slice(0, 5).map(c => `
    <tr>
      <td><span class="font-mono">${c.id}</span></td>
      <td><strong>${c.clientName}</strong></td>
      <td>${c.subject}</td>
      <td>${c.type}</td>
      <td><span class="badge badge-${c.mode}">${c.mode}</span></td>
      <td>
        <button class="btn btn-green btn-sm" onclick="updateCaseStatus('${c.id}','accepted')">Accept</button>
        <button class="btn btn-red btn-sm" style="margin-left:6px" onclick="updateCaseStatus('${c.id}','rejected')">Reject</button>
      </td>
    </tr>
  `).join('') || emptyRow('📭', 'No pending requests', 6);

  return `
    <div class="page-header"><h1>Lawyer Dashboard</h1><p>Manage your cases, ${currentUser.name}.</p></div>
    <div class="stats-grid">
      <div class="stat-card accent-gold"><div class="stat-card-accent"></div><div class="stat-card-icon">⏳</div><div class="stat-card-value">${pending}</div><div class="stat-card-label">Pending Requests</div></div>
      <div class="stat-card accent-green"><div class="stat-card-accent"></div><div class="stat-card-icon">✅</div><div class="stat-card-value">${accepted}</div><div class="stat-card-label">Active Cases</div></div>
      <div class="stat-card accent-navy"><div class="stat-card-accent"></div><div class="stat-card-icon">🏁</div><div class="stat-card-value">${resolved}</div><div class="stat-card-label">Resolved</div></div>
      <div class="stat-card accent-red"><div class="stat-card-accent"></div><div class="stat-card-icon">❌</div><div class="stat-card-value">${rejected}</div><div class="stat-card-label">Rejected</div></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Pending Requests</div><button class="btn btn-outline btn-sm" onclick="navigate('case-requests')">View All</button></div>
      <div class="card-body">
        <table><thead><tr><th>Case ID</th><th>Client</th><th>Subject</th><th>Type</th><th>Mode</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody></table>
      </div>
    </div>`;
}

async function renderCaseRequests() {
  const { cases } = await api('GET', '/cases');
  const pending = cases.filter(c => c.status === 'pending');
  const rows = pending.map(c => `
    <tr>
      <td><span class="font-mono">${c.id}</span></td>
      <td><strong>${c.clientName}</strong></td>
      <td>${c.subject}</td>
      <td>${c.type}</td>
      <td><span class="badge badge-${c.mode}">${c.mode}</span></td>
      <td>${c.filed}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="viewCase('${c.id}')">View</button>
        <button class="btn btn-green btn-sm" onclick="updateCaseStatus('${c.id}','accepted')">Accept</button>
        <button class="btn btn-red btn-sm" onclick="updateCaseStatus('${c.id}','rejected')">Reject</button>
      </td>
    </tr>
  `).join('') || emptyRow('📭', 'No pending requests', 7);

  return `
    <div class="page-header"><h1>Case Requests</h1><p>Review and respond to incoming case requests.</p></div>
    <div class="card"><div class="card-body">
      <table><thead><tr><th>Case ID</th><th>Client</th><th>Subject</th><th>Type</th><th>Mode</th><th>Filed</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div></div>`;
}

async function renderActiveCases() {
  const { cases } = await api('GET', '/cases');
  const active = cases.filter(c => c.status === 'accepted' || c.status === 'resolved');
  const rows = active.map(c => `
    <tr>
      <td><span class="font-mono">${c.id}</span></td>
      <td>${c.clientName}</td>
      <td><strong>${c.subject}</strong></td>
      <td>${c.type}</td>
      <td><span class="badge badge-${c.mode}">${c.mode}</span></td>
      <td><span class="badge badge-${c.status}">${c.status}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="viewCase('${c.id}')">View</button>
        ${c.status === 'accepted' ? `<button class="btn btn-navy btn-sm" onclick="updateCaseStatus('${c.id}','resolved')">Mark Resolved</button>` : ''}
      </td>
    </tr>
  `).join('') || emptyRow('📂', 'No active cases', 7);

  return `
    <div class="page-header"><h1>Active Cases</h1><p>Your accepted and resolved cases.</p></div>
    <div class="card"><div class="card-body">
      <table><thead><tr><th>Case ID</th><th>Client</th><th>Subject</th><th>Type</th><th>Mode</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div></div>`;
}

async function renderJansabhaLawyer() {
  const { disputes } = await api('GET', '/jansabha');
  const rows = disputes.map(j => `
    <tr>
      <td><span class="font-mono">${j.id}</span></td>
      <td>${j.clientName}</td>
      <td><strong>${j.subject}</strong></td>
      <td>${j.type}</td>
      <td><span class="badge badge-${j.status}">${j.status}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="viewJansabha('${j.id}')">View</button>
        ${j.status === 'pending' ? `<button class="btn btn-green btn-sm" onclick="updateJansabha('${j.id}','resolved')">Resolve</button>` : ''}
      </td>
    </tr>
  `).join('') || emptyRow('🏛️', 'No Jansabha disputes', 6);

  return `
    <div class="jansabha-banner"><div class="jansabha-banner-icon">🏛️</div><div><div class="jansabha-banner-title">Jansabha Panel</div><div class="jansabha-banner-desc">Review and resolve minor disputes for quick settlement.</div></div></div>
    <div class="card"><div class="card-header"><div class="card-title">Submitted Disputes</div></div>
    <div class="card-body"><table><thead><tr><th>ID</th><th>Client</th><th>Subject</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>`;
}

function renderLawyerProfile() {
  const u = currentUser;
  return `
    <div class="page-header"><h1>My Profile</h1></div>
    <div class="profile-header">
      <div class="profile-avatar-big">${u.name.charAt(0)}</div>
      <div class="profile-info">
        <h2>${u.name}</h2>
        <p>${u.email} &nbsp;|&nbsp; ${u.spec}</p>
        <p style="margin-top:8px"><span class="badge badge-accepted">Verified Advocate</span> &nbsp; <span class="font-mono">${u.bar}</span></p>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Professional Details</div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="lp-name" value="${u.name}"/></div>
        <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="lp-phone" value="${u.phone || ''}"/></div>
        <div class="form-group"><label class="form-label">Specialization</label><input class="form-input" value="${u.spec}" disabled/></div>
        <div class="form-group"><label class="form-label">Bar Registration</label><input class="form-input" value="${u.bar}" disabled/></div>
      </div>
      <div class="form-actions"><button class="btn btn-navy" onclick="updateLawyerProfile()">Save Changes</button></div>
    </div>`;
}

async function updateLawyerProfile() {
  const name  = document.getElementById('lp-name').value.trim();
  const phone = document.getElementById('lp-phone').value.trim();
  try {
    const data = await api('PATCH', '/lawyers/' + currentUser.id, { name, phone });
    currentUser = data.lawyer;
    setUser(currentUser);
    document.getElementById('sidebar-name').textContent   = currentUser.name;
    document.getElementById('sidebar-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
    toast('✅ Profile updated!');
  } catch (e) { toast('⚠️ ' + e.message); }
}

// ═══════════════════════════════════════════════════════════
// ADMIN NAV + PAGES
// ═══════════════════════════════════════════════════════════
function loadAdminNav() {
  buildNav([
    { section: 'OVERVIEW' },
    { id: 'admin-dashboard', icon: '🏠', label: 'Dashboard' },
    { section: 'MANAGEMENT' },
    { id: 'manage-lawyers',  icon: '👨‍⚖️', label: 'Lawyers' },
    { id: 'manage-clients',  icon: '👤', label: 'Clients' },
    { id: 'all-cases',       icon: '📁', label: 'All Cases' },
    { section: 'JANSABHA' },
    { id: 'jansabha-admin',  icon: '🏛️', label: 'Jansabha Panel' },
  ]);
  navigate('admin-dashboard');
}

async function renderAdminDashboard() {
  const [{ lawyers }, { clients }, { cases }, { disputes }] = await Promise.all([
    api('GET', '/lawyers', null, false),
    api('GET', '/clients'),
    api('GET', '/cases'),
    api('GET', '/jansabha'),
  ]);
  const pending  = cases.filter(c => c.status === 'pending').length;
  const accepted = cases.filter(c => c.status === 'accepted').length;
  const resolved = cases.filter(c => c.status === 'resolved').length;

  const rows = cases.slice().reverse().slice(0, 6).map(c => `
    <tr>
      <td><span class="font-mono">${c.id}</span></td>
      <td>${c.clientName}</td>
      <td>${c.lawyerName}</td>
      <td>${c.subject}</td>
      <td><span class="badge badge-${c.status}">${c.status}</span></td>
      <td>${c.filed}</td>
    </tr>
  `).join('') || emptyRow('📭', 'No cases yet', 6);

  return `
    <div class="page-header"><h1>Admin Dashboard</h1><p>System overview — lawconnect.</p></div>
    <div class="stats-grid">
      <div class="stat-card accent-navy"><div class="stat-card-accent"></div><div class="stat-card-icon">👨‍⚖️</div><div class="stat-card-value">${lawyers.length}</div><div class="stat-card-label">Registered Lawyers</div></div>
      <div class="stat-card accent-gold"><div class="stat-card-accent"></div><div class="stat-card-icon">👤</div><div class="stat-card-value">${clients.length}</div><div class="stat-card-label">Registered Clients</div></div>
      <div class="stat-card accent-blue"><div class="stat-card-accent"></div><div class="stat-card-icon">📁</div><div class="stat-card-value">${cases.length}</div><div class="stat-card-label">Total Cases</div></div>
      <div class="stat-card accent-gold"><div class="stat-card-accent"></div><div class="stat-card-icon">⏳</div><div class="stat-card-value">${pending}</div><div class="stat-card-label">Pending</div></div>
      <div class="stat-card accent-green"><div class="stat-card-accent"></div><div class="stat-card-icon">✅</div><div class="stat-card-value">${accepted}</div><div class="stat-card-label">Active</div></div>
      <div class="stat-card accent-blue"><div class="stat-card-accent"></div><div class="stat-card-icon">🏁</div><div class="stat-card-value">${resolved}</div><div class="stat-card-label">Resolved</div></div>
      <div class="stat-card" style="border-left:3px solid #7b40b8"><div class="stat-card-accent" style="background:linear-gradient(90deg,#7b40b8,#a855f7)"></div><div class="stat-card-icon">🏛️</div><div class="stat-card-value">${disputes.length}</div><div class="stat-card-label">Jansabha Disputes</div></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Recent Cases</div><button class="btn btn-outline btn-sm" onclick="navigate('all-cases')">View All</button></div>
      <div class="card-body"><table><thead><tr><th>Case ID</th><th>Client</th><th>Lawyer</th><th>Subject</th><th>Status</th><th>Filed</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>`;
}

async function renderManageLawyers() {
  const { lawyers } = await api('GET', '/lawyers', null, false);
  const rows = lawyers.map(l => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:10px"><div class="avatar" style="width:34px;height:34px;font-size:14px">${l.name.charAt(0)}</div><div><strong>${l.name}</strong><br/><span class="font-mono">${l.bar}</span></div></div></td>
      <td>${l.email}</td>
      <td>${l.spec}</td>
      <td>${l.phone || '—'}</td>
      <td><span class="badge badge-${l.status === 'active' ? 'accepted' : 'rejected'}">${l.status || 'active'}</span></td>
      <td>
        ${l.status !== 'suspended'
          ? `<button class="btn btn-red btn-sm" onclick="suspendLawyer('${l.id}')">Suspend</button>`
          : `<button class="btn btn-green btn-sm" onclick="activateLawyer('${l.id}')">Activate</button>`
        }
      </td>
    </tr>
  `).join('') || emptyRow('👨‍⚖️', 'No lawyers registered', 6);

  return `
    <div class="page-header"><h1>Manage Lawyers</h1><p>View and manage all registered advocates.</p></div>
    <div class="card"><div class="card-body">
      <table><thead><tr><th>Lawyer</th><th>Email</th><th>Specialization</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div></div>`;
}

async function suspendLawyer(id) {
  try {
    await api('PATCH', '/lawyers/' + id + '/status', { status: 'suspended' });
    toast('⚠️ Lawyer suspended.'); navigate('manage-lawyers');
  } catch (e) { toast('⚠️ ' + e.message); }
}

async function activateLawyer(id) {
  try {
    await api('PATCH', '/lawyers/' + id + '/status', { status: 'active' });
    toast('✅ Lawyer activated.'); navigate('manage-lawyers');
  } catch (e) { toast('⚠️ ' + e.message); }
}

async function renderManageClients() {
  const { clients } = await api('GET', '/clients');
  const rows = clients.map(c => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:10px"><div class="avatar" style="width:34px;height:34px;font-size:14px">${c.name.charAt(0)}</div><strong>${c.name}</strong></div></td>
      <td>${c.email}</td>
      <td>${c.phone || '—'}</td>
      <td>${c.joinDate || '—'}</td>
    </tr>
  `).join('') || emptyRow('👤', 'No clients yet', 4);

  return `
    <div class="page-header"><h1>Manage Clients</h1><p>All registered clients on the platform.</p></div>
    <div class="card"><div class="card-body">
      <table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div></div>`;
}

async function renderAllCases() {
  const { cases } = await api('GET', '/cases');
  const rows = cases.slice().reverse().map(c => `
    <tr>
      <td><span class="font-mono">${c.id}</span></td>
      <td>${c.clientName}</td>
      <td>${c.lawyerName}</td>
      <td>${c.subject}</td>
      <td>${c.type}</td>
      <td><span class="badge badge-${c.mode}">${c.mode}</span></td>
      <td><span class="badge badge-${c.status}">${c.status}</span></td>
      <td>${c.filed}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="viewCase('${c.id}')">View</button>
        <button class="btn btn-red btn-sm" onclick="adminRemoveCase('${c.id}')">Remove</button>
      </td>
    </tr>
  `).join('') || emptyRow('📭', 'No cases', 9);

  return `
    <div class="page-header"><h1>All Cases</h1><p>Monitor every case on the platform.</p></div>
    <div class="card"><div class="card-body">
      <table><thead><tr><th>ID</th><th>Client</th><th>Lawyer</th><th>Subject</th><th>Type</th><th>Mode</th><th>Status</th><th>Filed</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div></div>`;
}

async function adminRemoveCase(id) {
  if (!confirm('Remove this case from the system?')) return;
  try {
    await api('DELETE', '/cases/' + id);
    toast('🗑️ Case removed.'); navigate('all-cases');
  } catch (e) { toast('⚠️ ' + e.message); }
}

async function renderJansabhaAdmin() {
  const { disputes } = await api('GET', '/jansabha');
  const rows = disputes.map(j => `
    <tr>
      <td><span class="font-mono">${j.id}</span></td>
      <td>${j.clientName}</td>
      <td><strong>${j.subject}</strong></td>
      <td>${j.type}</td>
      <td>${j.location || '—'}</td>
      <td><span class="badge badge-${j.status}">${j.status}</span></td>
      <td>${j.filed}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="viewJansabha('${j.id}')">View</button>
        ${j.status !== 'removed' ? `<button class="btn btn-red btn-sm" onclick="removeJansabha('${j.id}')">Remove</button>` : ''}
      </td>
    </tr>
  `).join('') || emptyRow('🏛️', 'No Jansabha disputes', 8);

  return `
    <div class="jansabha-banner"><div class="jansabha-banner-icon">🏛️</div><div><div class="jansabha-banner-title">Jansabha Panel Management</div><div class="jansabha-banner-desc">Monitor all small disputes. Remove invalid or spam entries.</div></div></div>
    <div class="card"><div class="card-body">
      <table><thead><tr><th>ID</th><th>Client</th><th>Subject</th><th>Type</th><th>Location</th><th>Status</th><th>Filed</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div></div>`;
}

async function removeJansabha(id) {
  if (!confirm('Remove this Jansabha dispute?')) return;
  try {
    await api('PATCH', '/jansabha/' + id + '/status', { status: 'removed' });
    toast('🗑️ Dispute removed.'); navigate('jansabha-admin');
  } catch (e) { toast('⚠️ ' + e.message); }
}

// ═══════════════════════════════════════════════════════════
// SHARED ACTIONS
// ═══════════════════════════════════════════════════════════
async function updateCaseStatus(caseId, status) {
  try {
    await api('PATCH', '/cases/' + caseId + '/status', { status });
    toast(status === 'accepted' ? '✅ Case accepted!' : status === 'rejected' ? '❌ Case rejected.' : '🏁 Case marked as resolved!');
    const cur = document.querySelector('.nav-item.active');
    if (cur) renderPage(cur.id.replace('nav-', ''));
  } catch (e) { toast('⚠️ ' + e.message); }
}

async function updateJansabha(id, status) {
  try {
    await api('PATCH', '/jansabha/' + id + '/status', { status });
    toast('✅ Dispute marked as resolved!');
    navigate('jansabha-lawyer');
  } catch (e) { toast('⚠️ ' + e.message); }
}

// ─── View case detail modal ───────────────────────────────
async function viewCase(id) {
  try {
    const { case: c } = await api('GET', '/cases/' + id);
    let actions = '';
    if (currentUser.role === 'lawyer' && c.status === 'pending') {
      actions = `<button class="btn btn-green" onclick="updateCaseStatus('${c.id}','accepted');closeDetailModal()">Accept Case</button>
                 <button class="btn btn-red" onclick="updateCaseStatus('${c.id}','rejected');closeDetailModal()">Reject Case</button>`;
    }
    if (currentUser.role === 'lawyer' && c.status === 'accepted') {
      actions = `<button class="btn btn-navy" onclick="updateCaseStatus('${c.id}','resolved');closeDetailModal()">Mark Resolved</button>`;
    }
    document.getElementById('detail-box').innerHTML = `
      <button class="modal-close" onclick="closeDetailModal()">✕</button>
      <div class="detail-header">
        <div>
          <div class="detail-title">${c.subject}</div>
          <div style="margin-top:8px;display:flex;gap:8px">
            <span class="badge badge-${c.status}">${c.status.toUpperCase()}</span>
            <span class="badge badge-${c.mode}">${c.mode}</span>
          </div>
        </div>
        <span class="font-mono">${c.id}</span>
      </div>
      <div class="detail-grid">
        <div class="detail-item"><label>Client Name</label><div class="value">${c.clientName}</div></div>
        <div class="detail-item"><label>Assigned Lawyer</label><div class="value">${c.lawyerName}</div></div>
        <div class="detail-item"><label>Case Type</label><div class="value">${c.type}</div></div>
        <div class="detail-item"><label>Mode</label><div class="value">${c.mode}</div></div>
        <div class="detail-item"><label>Filed On</label><div class="value">${c.filed}</div></div>
        <div class="detail-item"><label>Status</label><div class="value"><span class="badge badge-${c.status}">${c.status}</span></div></div>
      </div>
      <hr class="detail-divider"/>
      <div class="detail-item"><label>Case Description</label><div class="value" style="font-size:14px;line-height:1.7;margin-top:8px">${c.description}</div></div>
      ${actions ? `<div class="detail-actions">${actions}</div>` : ''}
    `;
    document.getElementById('detail-modal').classList.add('active');
  } catch (e) { toast('⚠️ ' + e.message); }
}

async function viewJansabha(id) {
  try {
    const { dispute: j } = await api('GET', '/jansabha/' + id);
    document.getElementById('detail-box').innerHTML = `
      <button class="modal-close" onclick="closeDetailModal()">✕</button>
      <div class="detail-header">
        <div>
          <div class="detail-title">${j.subject}</div>
          <div style="margin-top:8px"><span class="badge badge-jansabha">Jansabha Panel</span> &nbsp; <span class="badge badge-${j.status}">${j.status.toUpperCase()}</span></div>
        </div>
        <span class="font-mono">${j.id}</span>
      </div>
      <div class="detail-grid">
        <div class="detail-item"><label>Submitted By</label><div class="value">${j.clientName}</div></div>
        <div class="detail-item"><label>Other Party</label><div class="value">${j.party || '—'}</div></div>
        <div class="detail-item"><label>Dispute Type</label><div class="value">${j.type}</div></div>
        <div class="detail-item"><label>Location</label><div class="value">${j.location || '—'}</div></div>
        <div class="detail-item"><label>Filed On</label><div class="value">${j.filed}</div></div>
        <div class="detail-item"><label>Status</label><div class="value"><span class="badge badge-${j.status}">${j.status}</span></div></div>
      </div>
      <hr class="detail-divider"/>
      <div class="detail-item"><label>Description</label><div class="value" style="font-size:14px;line-height:1.7;margin-top:8px">${j.description}</div></div>
    `;
    document.getElementById('detail-modal').classList.add('active');
  } catch (e) { toast('⚠️ ' + e.message); }
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.remove('active');
}

// ─── Sidebar badges ───────────────────────────────────────
async function updateBadges() {
  if (!currentUser || currentUser.role !== 'lawyer') return;
  try {
    const { cases }    = await api('GET', '/cases');
    const { disputes } = await api('GET', '/jansabha');
    const pending = cases.filter(c => c.status === 'pending').length;
    const jreq    = disputes.filter(j => j.status === 'pending').length;
    const rb = document.getElementById('badge-requests');
    const jb = document.getElementById('badge-jreq');
    if (rb) { rb.textContent = pending; rb.style.display = pending ? 'inline' : 'none'; }
    if (jb) { jb.textContent = jreq;   jb.style.display = jreq   ? 'inline' : 'none'; }
  } catch (_) {}
}

// ─── Utility: empty state row ─────────────────────────────
function emptyRow(icon, title, cols) {
  return `<tr><td colspan="${cols}"><div class="empty-state"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div></div></td></tr>`;
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
document.getElementById('detail-modal').addEventListener('click', function(e) {
  if (e.target === this) closeDetailModal();
});

loadStats();

if (currentUser && getToken()) {
  loadApp();
}
