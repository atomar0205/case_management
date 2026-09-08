// ═══════════════════════════════════════════════════════════
// server.js  —  lawconnect Backend Entry Point
//
// Usage:
//   npm install
//   npm start          (production)
//   npm run dev        (development with nodemon)
//
// API Base: http://localhost:5000/api
// ═══════════════════════════════════════════════════════════

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes     = require('./routes/auth');
const casesRoutes    = require('./routes/cases');
const jansabhaRoutes = require('./routes/jansabha');
const lawyersRoutes  = require('./routes/lawyers');
const clientsRoutes  = require('./routes/clients');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request Logger (simple) ───────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/cases',    casesRoutes);
app.use('/api/jansabha', jansabhaRoutes);
app.use('/api/lawyers',  lawyersRoutes);
app.use('/api/clients',  clientsRoutes);

// ── Stats endpoint (used by landing page) ─────────────────
const db = require('./db');
app.get('/api/stats', (_req, res) => {
  const cases = db.getCases();
  res.json({
    success: true,
    stats: {
      lawyers:  db.getLawyers().filter(l => l.status === 'active').length,
      cases:    cases.length,
      resolved: cases.filter(c => c.status === 'resolved').length
    }
  });
});

// ── Health Check ──────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'lawconnect API is running.', timestamp: new Date().toISOString() });
});

// ── 404 Handler ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// ── Global Error Handler ──────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ⚖️  lawconnect Backend API');
  console.log(`  🚀  Running on http://localhost:${PORT}`);
  console.log(`  📡  Health: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('  Demo credentials:');
  console.log('  Client  → amit@client.com  / pass123');
  console.log('  Lawyer  → neha@case-management.local  / pass123');
  console.log('  Admin   → admin            / admin123');
  console.log('');
});
