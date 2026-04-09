const router = require("express").Router();
const db     = require("../db");
const { auth } = require("../middleware/auth");
const { schemas, validate } = require("../schemas/validation");

// GET /reviews/:property_id  — all reviews for a property
router.get("/:property_id", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, u.name AS reviewer_name, u.avatar AS reviewer_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.property_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.property_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch reviews." });
  }
});

// POST /reviews  — add review (must have completed booking)
router.post("/", auth, validate(schemas.review), async (req, res) => {
  try {
    const { property_id, booking_id, rating, comment } = req.body;

    // Ensure reviewer had a completed booking for this property
    const [bookings] = await db.query(
      "SELECT id FROM bookings WHERE tenant_id=? AND property_id=? AND status='completed'",
      [req.user.id, property_id]
    );
    if (bookings.length === 0) {
      return res.status(403).json({ msg: "You can only review properties you have stayed at." });
    }

    // Check if already reviewed this booking
    if (booking_id) {
      const [exists] = await db.query(
        "SELECT id FROM reviews WHERE reviewer_id=? AND booking_id=?",
        [req.user.id, booking_id]
      );
      if (exists.length > 0) return res.status(409).json({ msg: "You already reviewed this booking." });
    }

    await db.query(
      "INSERT INTO reviews (reviewer_id, property_id, booking_id, rating, comment) VALUES (?,?,?,?,?)",
      [req.user.id, property_id, booking_id || null, rating, comment || null]
    );

    res.status(201).json({ msg: "Review submitted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to submit review." });
  }
});

// DELETE /reviews/:id  — delete own review or admin
router.delete("/:id", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT reviewer_id FROM reviews WHERE id=?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ msg: "Review not found." });
    if (rows[0].reviewer_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied." });
    }
    await db.query("DELETE FROM reviews WHERE id=?", [req.params.id]);
    res.json({ msg: "Review deleted." });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete review." });
  }
});

module.exports = router;
