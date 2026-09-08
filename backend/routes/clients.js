// ═══════════════════════════════════════════════════════════
// routes/clients.js  —  Client Management Routes
//
// GET  /api/clients         admin: all clients
// GET  /api/clients/:id     admin or self: get profile
// PATCH /api/clients/:id    client: update own profile
// ═══════════════════════════════════════════════════════════

const express = require('express');
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

function safeUser(u) {
  const { password, ...safe } = u;
  return safe;
}

// ── GET ALL CLIENTS (admin only) ──────────────────────────
router.get('/', verifyToken, requireRole('admin'), (req, res) => {
  const clients = db.getClients().map(safeUser);
  return res.json({ success: true, clients });
});

// ── GET SINGLE CLIENT (admin or self) ────────────────────
router.get('/:id', verifyToken, (req, res) => {
  const { role, id: userId } = req.user;
  if (role !== 'admin' && userId !== req.params.id)
    return res.status(403).json({ success: false, message: 'Access denied.' });

  const client = db.getClientById(req.params.id);
  if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });

  return res.json({ success: true, client: safeUser(client) });
});

// ── UPDATE OWN PROFILE (client only) ─────────────────────
router.patch('/:id', verifyToken, requireRole('client'), (req, res) => {
  if (req.user.id !== req.params.id)
    return res.status(403).json({ success: false, message: 'You can only update your own profile.' });

  const allowed = ['name', 'phone'];
  const patch = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) patch[f] = req.body[f]; });

  const updated = db.updateClient(req.params.id, patch);
  if (!updated) return res.status(404).json({ success: false, message: 'Client not found.' });

  return res.json({ success: true, client: safeUser(updated), message: 'Profile updated.' });
});

module.exports = router;
