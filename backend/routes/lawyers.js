// ═══════════════════════════════════════════════════════════
// routes/lawyers.js  —  Lawyer Management Routes
//
// GET  /api/lawyers              public: list all active lawyers
// GET  /api/lawyers/:id          get single lawyer (public)
// PATCH /api/lawyers/:id/status  admin: suspend/activate
// PATCH /api/lawyers/:id         lawyer: update own profile
// ═══════════════════════════════════════════════════════════

const express = require('express');
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

function safePublic(l) {
  const { password, ...safe } = l;
  return safe;
}

// ── GET ALL LAWYERS (public — used for case submission dropdown) ──
router.get('/', (req, res) => {
  const lawyers = db.getLawyers()
    .filter(l => l.status === 'active')
    .map(safePublic);
  return res.json({ success: true, lawyers });
});

// ── GET SINGLE LAWYER ─────────────────────────────────────
router.get('/:id', (req, res) => {
  const lawyer = db.getLawyerById(req.params.id);
  if (!lawyer) return res.status(404).json({ success: false, message: 'Lawyer not found.' });
  return res.json({ success: true, lawyer: safePublic(lawyer) });
});

// ── UPDATE OWN PROFILE (lawyer only) ─────────────────────
router.patch('/:id', verifyToken, requireRole('lawyer'), (req, res) => {
  if (req.user.id !== req.params.id)
    return res.status(403).json({ success: false, message: 'You can only update your own profile.' });

  const allowed = ['name', 'phone'];          // fields the lawyer is allowed to change
  const patch = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) patch[f] = req.body[f]; });

  const updated = db.updateLawyer(req.params.id, patch);
  if (!updated) return res.status(404).json({ success: false, message: 'Lawyer not found.' });

  const { password, ...safe } = updated;
  return res.json({ success: true, lawyer: safe, message: 'Profile updated.' });
});

// ── SUSPEND / ACTIVATE (admin only) ──────────────────────
router.patch('/:id/status', verifyToken, requireRole('admin'), (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status))
    return res.status(400).json({ success: false, message: 'Status must be active or suspended.' });

  const updated = db.updateLawyer(req.params.id, { status });
  if (!updated) return res.status(404).json({ success: false, message: 'Lawyer not found.' });

  const { password, ...safe } = updated;
  return res.json({ success: true, lawyer: safe, message: `Lawyer ${status}.` });
});

module.exports = router;
