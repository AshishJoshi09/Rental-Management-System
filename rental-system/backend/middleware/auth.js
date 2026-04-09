const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";

// Verify JWT token
const auth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token) return res.status(401).json({ msg: "Access denied. No token provided." });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ msg: "Invalid or expired token." });
  }
};

// Require a specific role
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ msg: "Forbidden: insufficient permissions." });
  }
  next();
};

module.exports = { auth, requireRole };
