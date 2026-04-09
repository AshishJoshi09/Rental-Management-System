const router = require("express").Router();
const db     = require("../db");
const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const { schemas, validate } = require("../schemas/validation");
const { auth } = require("../middleware/auth");
require("dotenv").config();

const JWT_SECRET  = process.env.JWT_SECRET  || "change_this_secret_in_production";
const SALT_ROUNDS = 10;

// POST /auth/register
router.post("/register", validate(schemas.register), async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(409).json({ msg: "Email already registered." });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role, phone) VALUES (?,?,?,?,?)",
      [name, email, hashed, role || "tenant", phone || null]
    );

    const token = jwt.sign(
      { id: result.insertId, role: role || "tenant", name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token, user: { id: result.insertId, name, email, role: role || "tenant" } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Registration failed." });
  }
});

// POST /auth/login
router.post("/login", validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ msg: "Invalid credentials." });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ msg: "Invalid credentials." });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Login failed." });
  }
});

// GET /auth/me  — get current user profile
router.get("/me", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, role, phone, avatar, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ msg: "User not found." });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch profile." });
  }
});

// PUT /auth/me  — update profile
router.put("/me", auth, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    await db.query(
      "UPDATE users SET name=?, phone=?, avatar=? WHERE id=?",
      [name, phone, avatar, req.user.id]
    );
    res.json({ msg: "Profile updated." });
  } catch (err) {
    res.status(500).json({ msg: "Failed to update profile." });
  }
});

// PUT /auth/change-password
router.put("/change-password", auth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ msg: "Both current and new password are required." });
    }

    const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [req.user.id]);
    const match = await bcrypt.compare(current_password, rows[0].password);
    if (!match) return res.status(401).json({ msg: "Current password is incorrect." });

    const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
    await db.query("UPDATE users SET password=? WHERE id=?", [hashed, req.user.id]);
    res.json({ msg: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ msg: "Failed to change password." });
  }
});

module.exports = router;
