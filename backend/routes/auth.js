// ═══════════════════════════════════════════════════════════
// routes/auth.js  —  Authentication Routes
//
// POST /api/auth/register/client
// POST /api/auth/register/lawyer
// POST /api/auth/login/client
// POST /api/auth/login/lawyer
// POST /api/auth/login/admin
// GET  /api/auth/me        (protected)
// ═══════════════════════════════════════════════════════════

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db       = require('../db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function today() {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

function safeUser(u) {
  const { password, ...safe } = u;
  return safe;
}

// ── CLIENT REGISTER ───────────────────────────────────────
router.post('/register/client', (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });

  if (password.length < 6)
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

  if (db.getClientByEmail(email))
    return res.status(409).json({ success: false, message: 'Email already registered.' });

  const newClient = {
    id: 'c_' + uuidv4().slice(0, 8),
    name,
    email,
    phone: phone || '',
    password: bcrypt.hashSync(password, 10),
    role: 'client',
    joinDate: today()
  };

  db.addClient(newClient);
  const token = signToken({ id: newClient.id, name: newClient.name, email: newClient.email, role: 'client' });
  return res.status(201).json({ success: true, token, user: safeUser(newClient) });
});

// ── LAWYER REGISTER ───────────────────────────────────────
router.post('/register/lawyer', (req, res) => {
  const { name, email, bar, spec, phone, password } = req.body;

  if (!name || !email || !bar || !spec || !password)
    return res.status(400).json({ success: false, message: 'All fields are required.' });

  if (password.length < 6)
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

  if (db.getLawyerByEmail(email))
    return res.status(409).json({ success: false, message: 'Email already registered.' });

  const newLawyer = {
    id: 'l_' + uuidv4().slice(0, 8),
    name,
    email,
    bar,
    spec,
    phone: phone || '',
    password: bcrypt.hashSync(password, 10),
    role: 'lawyer',
    status: 'active'
  };

  db.addLawyer(newLawyer);
  const token = signToken({ id: newLawyer.id, name: newLawyer.name, email: newLawyer.email, role: 'lawyer' });
  return res.status(201).json({ success: true, token, user: safeUser(newLawyer) });
});

// ── CLIENT LOGIN ──────────────────────────────────────────
router.post('/login/client', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required.' });

  const client = db.getClientByEmail(email);
  if (!client || !bcrypt.compareSync(password, client.password))
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });

  const token = signToken({ id: client.id, name: client.name, email: client.email, role: 'client' });
  return res.json({ success: true, token, user: safeUser(client) });
});

// ── LAWYER LOGIN ──────────────────────────────────────────
router.post('/login/lawyer', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required.' });

  const lawyer = db.getLawyerByEmail(email);
  if (!lawyer || !bcrypt.compareSync(password, lawyer.password))
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });

  if (lawyer.status === 'suspended')
    return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact admin.' });

  const token = signToken({ id: lawyer.id, name: lawyer.name, email: lawyer.email, role: 'lawyer' });
  return res.json({ success: true, token, user: safeUser(lawyer) });
});

// ── ADMIN LOGIN ───────────────────────────────────────────
router.post('/login/admin', (req, res) => {
  const { username, password } = req.body;
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

  if (username !== ADMIN_USER || password !== ADMIN_PASS)
    return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

  const token = signToken({ id: 'admin', name: 'System Admin', email: 'admin@case-management.local', role: 'admin' });
  return res.json({
    success: true,
    token,
    user: { id: 'admin', name: 'System Admin', email: 'admin@case-management.local', role: 'admin' }
  });
});

// ── GET ME (verify session) ───────────────────────────────
router.get('/me', verifyToken, (req, res) => {
  const { role, id } = req.user;
  let user = null;

  if (role === 'client')  user = db.getClientById(id);
  if (role === 'lawyer')  user = db.getLawyerById(id);
  if (role === 'admin')   user = req.user;

  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  return res.json({ success: true, user: role === 'admin' ? user : safeUser(user) });
});

module.exports = router;
