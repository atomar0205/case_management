// ═══════════════════════════════════════════════════════════
// db.js  —  In-Memory Database with Seed Data
// In a real deployment replace this with MySQL via mysql2 package
// ═══════════════════════════════════════════════════════════

const bcrypt = require('bcryptjs');

// ── helpers ──────────────────────────────────────────────
function today() {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ── seed data ────────────────────────────────────────────
const db = {
  lawyers: [
    {
      id: 'l1',
      name: 'Adv. Neha Sharma',
      email: 'neha@case-management.local',
      // plain: pass123
      password: bcrypt.hashSync('pass123', 10),
      bar: 'BCI/UK/2020/001',
      spec: 'Criminal Law',
      phone: '9876543210',
      role: 'lawyer',
      status: 'active'
    },
    {
      id: 'l2',
      name: 'Adv. Ravi Gupta',
      email: 'ravi@case-management.local',
      password: bcrypt.hashSync('pass123', 10),
      bar: 'BCI/UK/2019/002',
      spec: 'Family Law',
      phone: '9876543211',
      role: 'lawyer',
      status: 'active'
    },
    {
      id: 'l3',
      name: 'Adv. Sunita Rawat',
      email: 'sunita@case-management.local',
      password: bcrypt.hashSync('pass123', 10),
      bar: 'BCI/UK/2021/003',
      spec: 'Cyber Law',
      phone: '9876543212',
      role: 'lawyer',
      status: 'active'
    }
  ],

  clients: [
    {
      id: 'c1',
      name: 'Amit Verma',
      email: 'amit@client.com',
      password: bcrypt.hashSync('pass123', 10),
      phone: '9000000001',
      role: 'client',
      joinDate: today()
    }
  ],

  cases: [
    {
      id: 'CASE-100001',
      clientId: 'c1',
      clientName: 'Amit Verma',
      lawyerId: 'l1',
      lawyerName: 'Adv. Neha Sharma',
      type: 'Criminal Law',
      subject: 'FIR Filing Assistance',
      description: 'Need help filing an FIR against fraud.',
      mode: 'online',
      status: 'accepted',
      filed: today(),
      jansabha: false
    },
    {
      id: 'CASE-100002',
      clientId: 'c1',
      clientName: 'Amit Verma',
      lawyerId: 'l2',
      lawyerName: 'Adv. Ravi Gupta',
      type: 'Family Law',
      subject: 'Divorce Proceedings',
      description: 'Mutual consent divorce guidance needed.',
      mode: 'offline',
      status: 'pending',
      filed: today(),
      jansabha: false
    }
  ],

  jansabha: []
};

// ── CRUD helpers ─────────────────────────────────────────

// Lawyers
db.getLawyers     = ()       => db.lawyers;
db.getLawyerById  = (id)     => db.lawyers.find(l => l.id === id);
db.getLawyerByEmail = (email)=> db.lawyers.find(l => l.email === email);
db.addLawyer      = (lawyer) => { db.lawyers.push(lawyer); return lawyer; };
db.updateLawyer   = (id, patch) => {
  const idx = db.lawyers.findIndex(l => l.id === id);
  if (idx === -1) return null;
  db.lawyers[idx] = { ...db.lawyers[idx], ...patch };
  return db.lawyers[idx];
};

// Clients
db.getClients     = ()       => db.clients;
db.getClientById  = (id)     => db.clients.find(c => c.id === id);
db.getClientByEmail = (email)=> db.clients.find(c => c.email === email);
db.addClient      = (client) => { db.clients.push(client); return client; };
db.updateClient   = (id, patch) => {
  const idx = db.clients.findIndex(c => c.id === id);
  if (idx === -1) return null;
  db.clients[idx] = { ...db.clients[idx], ...patch };
  return db.clients[idx];
};

// Cases
db.getCases       = ()       => db.cases;
db.getCaseById    = (id)     => db.cases.find(c => c.id === id);
db.getCasesByClient = (cid)  => db.cases.filter(c => c.clientId === cid);
db.getCasesByLawyer = (lid)  => db.cases.filter(c => c.lawyerId === lid);
db.addCase        = (c)      => { db.cases.push(c); return c; };
db.updateCase     = (id, patch) => {
  const idx = db.cases.findIndex(c => c.id === id);
  if (idx === -1) return null;
  db.cases[idx] = { ...db.cases[idx], ...patch };
  return db.cases[idx];
};
db.deleteCase     = (id)     => {
  const idx = db.cases.findIndex(c => c.id === id);
  if (idx === -1) return false;
  db.cases.splice(idx, 1);
  return true;
};

// Jansabha
db.getJansabha      = ()      => db.jansabha;
db.getJansabhaById  = (id)    => db.jansabha.find(j => j.id === id);
db.getJansabhaByClient = (cid)=> db.jansabha.filter(j => j.clientId === cid);
db.addJansabha      = (j)     => { db.jansabha.push(j); return j; };
db.updateJansabha   = (id, patch) => {
  const idx = db.jansabha.findIndex(j => j.id === id);
  if (idx === -1) return null;
  db.jansabha[idx] = { ...db.jansabha[idx], ...patch };
  return db.jansabha[idx];
};

module.exports = db;
