const router = require("express").Router();
const db     = require("../db");
const { auth, requireRole } = require("../middleware/auth");
const { schemas, validate }  = require("../schemas/validation");

// POST /maintenance  — raise request (tenant)
router.post("/", auth, requireRole("tenant"), validate(schemas.maintenance), async (req, res) => {
  try {
    const { property_id, title, description, priority, images } = req.body;

    // Confirm tenant has an active booking for this property
    const [active] = await db.query(
      "SELECT id FROM bookings WHERE tenant_id=? AND property_id=? AND status IN ('confirmed','pending')",
      [req.user.id, property_id]
    );
    if (active.length === 0) {
      return res.status(403).json({ msg: "You must have an active booking for this property." });
    }

    const [result] = await db.query(
      "INSERT INTO maintenance_requests (tenant_id, property_id, title, description, priority, images) VALUES (?,?,?,?,?,?)",
      [req.user.id, property_id, title, description || null, priority || "medium", JSON.stringify(images || [])]
    );

    // Notify owner
    const [prop] = await db.query("SELECT owner_id, title AS ptitle FROM properties WHERE id=?", [property_id]);
    await db.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)",
      [prop[0].owner_id, "Maintenance Request",
       `New ${priority || "medium"} priority maintenance request for "${prop[0].ptitle}": ${title}`, "maintenance"]
    );

    res.status(201).json({ msg: "Maintenance request submitted.", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to submit request." });
  }
});

// GET /maintenance/my  — tenant's own requests
router.get("/my", auth, requireRole("tenant"), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, p.title AS property_title FROM maintenance_requests m
      JOIN properties p ON m.property_id = p.id
      WHERE m.tenant_id = ?
      ORDER BY m.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch requests." });
  }
});

// GET /maintenance/owner  — all requests for owner's properties
router.get("/owner", auth, requireRole("owner", "admin"), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, p.title AS property_title, u.name AS tenant_name, u.email AS tenant_email
      FROM maintenance_requests m
      JOIN properties p ON m.property_id = p.id
      JOIN users u ON m.tenant_id = u.id
      WHERE p.owner_id = ?
      ORDER BY FIELD(m.priority,'urgent','high','medium','low'), m.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch requests." });
  }
});

// PUT /maintenance/:id/status  — update status (owner)
router.put("/:id/status", auth, requireRole("owner", "admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["open", "in_progress", "resolved", "closed"];
    if (!valid.includes(status)) return res.status(400).json({ msg: "Invalid status." });

    const [rows] = await db.query(`
      SELECT m.*, p.owner_id FROM maintenance_requests m
      JOIN properties p ON m.property_id = p.id
      WHERE m.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ msg: "Request not found." });
    if (rows[0].owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied." });
    }

    await db.query("UPDATE maintenance_requests SET status=? WHERE id=?", [status, req.params.id]);

    // Notify tenant
    await db.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)",
      [rows[0].tenant_id, "Maintenance Update",
       `Your maintenance request "${rows[0].title}" is now ${status}.`, "maintenance"]
    );

    res.json({ msg: "Status updated." });
  } catch (err) {
    res.status(500).json({ msg: "Failed to update status." });
  }
});

module.exports = router;
