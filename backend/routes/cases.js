// ═══════════════════════════════════════════════════════════
// routes/cases.js  —  Case Management Routes
//
// GET  /api/cases           admin: all | client/lawyer: own
// GET  /api/cases/:id       get single case
// POST /api/cases           client: create new case
// PATCH /api/cases/:id/status  lawyer/admin: update status
// DELETE /api/cases/:id     admin: remove case
// ═══════════════════════════════════════════════════════════

const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const db       = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

function today() {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ── GET ALL CASES (role-filtered) ─────────────────────────
router.get('/', verifyToken, (req, res) => {
  const { role, id } = req.user;

  let cases;
  if (role === 'admin')   cases = db.getCases();
  else if (role === 'client')  cases = db.getCasesByClient(id);
  else if (role === 'lawyer')  cases = db.getCasesByLawyer(id);
  else return res.status(403).json({ success: false, message: 'Forbidden.' });

  return res.json({ success: true, cases });
});

// ── GET SINGLE CASE ───────────────────────────────────────
router.get('/:id', verifyToken, (req, res) => {
  const c = db.getCaseById(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Case not found.' });

  const { role, id } = req.user;
  if (role === 'client' && c.clientId !== id)
    return res.status(403).json({ success: false, message: 'Access denied.' });
  if (role === 'lawyer' && c.lawyerId !== id)
    return res.status(403).json({ success: false, message: 'Access denied.' });

  return res.json({ success: true, case: c });
});

// ── CREATE CASE (client only) ─────────────────────────────
router.post('/', verifyToken, requireRole('client'), (req, res) => {
  const { type, lawyerId, subject, description, mode } = req.body;

  if (!type || !lawyerId || !subject || !description || !mode)
    return res.status(400).json({ success: false, message: 'All fields are required.' });

  const lawyer = db.getLawyerById(lawyerId);
  if (!lawyer)
    return res.status(404).json({ success: false, message: 'Selected lawyer not found.' });

  if (lawyer.status === 'suspended')
    return res.status(400).json({ success: false, message: 'Selected lawyer is currently unavailable.' });

  const validModes = ['online', 'offline'];
  if (!validModes.includes(mode))
    return res.status(400).json({ success: false, message: 'Mode must be online or offline.' });

  const client = db.getClientById(req.user.id);
  const newCase = {
    id: 'CASE-' + Date.now().toString().slice(-6),
    clientId:   req.user.id,
    clientName: client.name,
    lawyerId,
    lawyerName: lawyer.name,
    type,
    subject,
    description,
    mode,
    status: 'pending',
    filed: today(),
    jansabha: false
  };

  db.addCase(newCase);
  return res.status(201).json({ success: true, case: newCase, message: 'Case submitted successfully.' });
});

// ── UPDATE CASE STATUS (lawyer or admin) ──────────────────
router.patch('/:id/status', verifyToken, (req, res) => {
  const { role, id: userId } = req.user;
  const { status } = req.body;

  const validStatuses = ['accepted', 'rejected', 'resolved', 'pending'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}.` });

  const c = db.getCaseById(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Case not found.' });

  if (role === 'lawyer' && c.lawyerId !== userId)
    return res.status(403).json({ success: false, message: 'You can only update your own cases.' });

  if (role === 'client')
    return res.status(403).json({ success: false, message: 'Clients cannot update case status.' });

  const updated = db.updateCase(req.params.id, { status });
  return res.json({ success: true, case: updated, message: `Case ${status}.` });
});

// ── DELETE CASE (admin only) ──────────────────────────────
router.delete('/:id', verifyToken, requireRole('admin'), (req, res) => {
  const deleted = db.deleteCase(req.params.id);
  if (!deleted)
    return res.status(404).json({ success: false, message: 'Case not found.' });

  return res.json({ success: true, message: 'Case removed successfully.' });
});

module.exports = router;
