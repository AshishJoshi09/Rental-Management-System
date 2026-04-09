const router = require("express").Router();
const db     = require("../db");
const { auth, requireRole } = require("../middleware/auth");
const { schemas, validate }  = require("../schemas/validation");

// Helper: check for booking conflicts
async function hasConflict(property_id, start_date, end_date, exclude_id = null) {
  let query = `
    SELECT id FROM bookings
    WHERE property_id = ?
      AND status NOT IN ('cancelled')
      AND NOT (end_date < ? OR start_date > ?)
  `;
  const params = [property_id, start_date, end_date];
  if (exclude_id) { query += " AND id != ?"; params.push(exclude_id); }
  const [rows] = await db.query(query, params);
  return rows.length > 0;
}

// POST /bookings  — create booking (tenant)
router.post("/", auth, requireRole("tenant"), validate(schemas.booking), async (req, res) => {
  try {
    const { property_id, start_date, end_date, notes } = req.body;

    // Fetch property price
    const [prop] = await db.query("SELECT price_per_month, is_available FROM properties WHERE id=?", [property_id]);
    if (prop.length === 0) return res.status(404).json({ msg: "Property not found." });
    if (!prop[0].is_available) return res.status(400).json({ msg: "Property is not available." });

    // Conflict check
    if (await hasConflict(property_id, start_date, end_date)) {
      return res.status(409).json({ msg: "Property is already booked for these dates." });
    }

    // Calculate total
    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
    const total_amount = ((prop[0].price_per_month / 30) * days).toFixed(2);

    const [result] = await db.query(
      "INSERT INTO bookings (tenant_id, property_id, start_date, end_date, total_amount, notes) VALUES (?,?,?,?,?,?)",
      [req.user.id, property_id, start_date, end_date, total_amount, notes || null]
    );

    // Notify property owner
    const [owner] = await db.query("SELECT owner_id FROM properties WHERE id=?", [property_id]);
    await db.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)",
      [owner[0].owner_id, "New Booking Request",
       `A tenant has requested to book your property from ${start_date} to ${end_date}.`, "booking"]
    );

    res.status(201).json({ msg: "Booking created.", id: result.insertId, total_amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to create booking." });
  }
});

// GET /bookings/my  — tenant's own bookings
router.get("/my", auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*, p.title AS property_title, p.address, p.city, p.images
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE b.tenant_id = ?
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch bookings." });
  }
});

// GET /bookings/owner  — all bookings for owner's properties
router.get("/owner", auth, requireRole("owner", "admin"), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*, p.title AS property_title, u.name AS tenant_name, u.email AS tenant_email
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      JOIN users u ON b.tenant_id = u.id
      WHERE p.owner_id = ?
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch bookings." });
  }
});

// GET /bookings/:id  — single booking
router.get("/:id", auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*, p.title AS property_title, p.address, p.city,
             u.name AS tenant_name, u.email AS tenant_email
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      JOIN users u ON b.tenant_id = u.id
      WHERE b.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ msg: "Booking not found." });

    const booking = rows[0];
    // Only allow: the tenant, the owner of that property, or admin
    const [prop] = await db.query("SELECT owner_id FROM properties WHERE id=?", [booking.property_id]);
    if (booking.tenant_id !== req.user.id && prop[0].owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied." });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch booking." });
  }
});

// PUT /bookings/:id/status  — confirm/cancel (owner or admin)
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["confirmed", "cancelled", "completed"];
    if (!valid.includes(status)) return res.status(400).json({ msg: "Invalid status." });

    const [rows] = await db.query(`
      SELECT b.*, p.owner_id FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE b.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ msg: "Booking not found." });

    const booking = rows[0];
    // Tenant can only cancel their own, owner can confirm/cancel/complete
    if (req.user.role === "tenant" && booking.tenant_id !== req.user.id) {
      return res.status(403).json({ msg: "Access denied." });
    }
    if (req.user.role === "owner" && booking.owner_id !== req.user.id) {
      return res.status(403).json({ msg: "Access denied." });
    }

    await db.query("UPDATE bookings SET status=? WHERE id=?", [status, req.params.id]);

    // Notify tenant
    await db.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)",
      [booking.tenant_id, `Booking ${status}`,
       `Your booking has been ${status}.`, "booking"]
    );

    res.json({ msg: `Booking ${status}.` });
  } catch (err) {
    res.status(500).json({ msg: "Failed to update booking." });
  }
});

// GET /bookings/calendar/:property_id  — booked dates for calendar
router.get("/calendar/:property_id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT start_date, end_date FROM bookings WHERE property_id=? AND status NOT IN ('cancelled')",
      [req.params.property_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch calendar." });
  }
});

module.exports = router;
