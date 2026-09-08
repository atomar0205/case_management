// ═══════════════════════════════════════════════════════════
// routes/jansabha.js  —  Jansabha Panel Routes
//
// GET  /api/jansabha             admin/lawyer: all | client: own
// GET  /api/jansabha/:id         get single dispute
// POST /api/jansabha             client: submit dispute
// PATCH /api/jansabha/:id/status lawyer/admin: update status
// ═══════════════════════════════════════════════════════════

const express = require('express');
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

function today() {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ── GET JANSABHA DISPUTES (role-filtered) ─────────────────
router.get('/', verifyToken, (req, res) => {
  const { role, id } = req.user;
  let items;

  if (role === 'admin' || role === 'lawyer') {
    items = db.getJansabha().filter(j => j.status !== 'removed');
  } else if (role === 'client') {
    items = db.getJansabhaByClient(id);
  } else {
    return res.status(403).json({ success: false, message: 'Forbidden.' });
  }

  return res.json({ success: true, disputes: items });
});

// ── GET SINGLE JANSABHA ───────────────────────────────────
router.get('/:id', verifyToken, (req, res) => {
  const j = db.getJansabhaById(req.params.id);
  if (!j) return res.status(404).json({ success: false, message: 'Dispute not found.' });

  const { role, id } = req.user;
  if (role === 'client' && j.clientId !== id)
    return res.status(403).json({ success: false, message: 'Access denied.' });

  return res.json({ success: true, dispute: j });
});

// ── SUBMIT DISPUTE (client only) ──────────────────────────
router.post('/', verifyToken, requireRole('client'), (req, res) => {
  const { type, party, subject, description, location } = req.body;

  if (!type || !subject || !description)
    return res.status(400).json({ success: false, message: 'Type, subject and description are required.' });

  const client = db.getClientById(req.user.id);
  const newDispute = {
    id: 'JAN-' + Date.now().toString().slice(-5),
    clientId:   req.user.id,
    clientName: client.name,
    type,
    party:       party || '',
    subject,
    description,
    location:    location || '',
    status:      'pending',
    filed:       today()
  };

  db.addJansabha(newDispute);
  return res.status(201).json({ success: true, dispute: newDispute, message: 'Dispute submitted to Jansabha Panel.' });
});

// ── UPDATE STATUS (lawyer or admin) ──────────────────────
router.patch('/:id/status', verifyToken, requireRole('lawyer', 'admin'), (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'resolved', 'removed'];

  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}.` });

  const j = db.getJansabhaById(req.params.id);
  if (!j) return res.status(404).json({ success: false, message: 'Dispute not found.' });

  const updated = db.updateJansabha(req.params.id, { status });
  return res.json({ success: true, dispute: updated, message: `Dispute marked as ${status}.` });
});

module.exports = router;
