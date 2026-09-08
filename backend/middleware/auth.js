// ═══════════════════════════════════════════════════════════
// middleware/auth.js  —  JWT Authentication Middleware
// ═══════════════════════════════════════════════════════════

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'lawconnect_secret_key_2024';

/**
 * verifyToken — protects any route that requires login.
 * Reads Bearer token from Authorization header, verifies it,
 * and attaches decoded payload to req.user.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;   // { id, name, role, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

/**
 * requireRole — role-based access guard (use after verifyToken).
 * Usage: router.get('/admin-only', verifyToken, requireRole('admin'), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Required role: ${roles.join(' or ')}.`
      });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole, JWT_SECRET };
