const router = require("express").Router();
const db     = require("../db");
const { auth, requireRole } = require("../middleware/auth");

// All routes require admin role
router.use(auth, requireRole("admin"));

// GET /admin/stats  — platform overview
router.get("/stats", async (req, res) => {
  try {
    const [[users]]      = await db.query("SELECT COUNT(*) AS total FROM users");
    const [[properties]] = await db.query("SELECT COUNT(*) AS total FROM properties");
    const [[bookings]]   = await db.query("SELECT COUNT(*) AS total FROM bookings");
    const [[revenue]]    = await db.query("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='completed'");

    res.json({
      total_users:       users.total,
      total_properties:  properties.total,
      total_bookings:    bookings.total,
      total_revenue:     revenue.total,
    });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch stats." });
  }
});

// GET /admin/users  — list all users
router.get("/users", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch users." });
  }
});

// PUT /admin/users/:id/role  — change user role
router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["tenant","owner","admin"].includes(role)) return res.status(400).json({ msg: "Invalid role." });
    await db.query("UPDATE users SET role=? WHERE id=?", [role, req.params.id]);
    res.json({ msg: "Role updated." });
  } catch (err) {
    res.status(500).json({ msg: "Failed to update role." });
  }
});

// DELETE /admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id=?", [req.params.id]);
    res.json({ msg: "User deleted." });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete user." });
  }
});

// GET /admin/bookings  — all bookings
router.get("/bookings", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*, p.title AS property_title, u.name AS tenant_name
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      JOIN users u ON b.tenant_id = u.id
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch bookings." });
  }
});

// GET /admin/payments  — all payments
router.get("/payments", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pay.*, u.name AS user_name, p.title AS property_title
      FROM payments pay
      JOIN users u ON pay.user_id = u.id
      JOIN bookings b ON pay.booking_id = b.id
      JOIN properties p ON b.property_id = p.id
      ORDER BY pay.payment_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch payments." });
  }
});

module.exports = router;
