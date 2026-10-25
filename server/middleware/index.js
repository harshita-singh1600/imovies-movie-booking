const jwt = require('jsonwebtoken');
const read = (req) => jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET);
exports.wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.auth = (req, res, next) => {
  try { req.user = read(req); next(); } catch { res.status(401).json({ message: 'Please log in to continue.' }); }
};
exports.optAuth = (req, res, next) => { try { req.user = read(req); } catch { req.user = null; } next(); };
exports.admin = (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admins only.' }));
