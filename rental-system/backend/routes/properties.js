const router  = require("express").Router();
const db      = require("../db");
const { auth, requireRole } = require("../middleware/auth");
const { schemas, validate }  = require("../schemas/validation");

// GET /properties  — list with filters
router.get("/", async (req, res) => {
  try {
    const { city, min_price, max_price, bedrooms, property_type, search } = req.query;

    let query = `
      SELECT p.*, u.name AS owner_name, u.phone AS owner_phone,
             COALESCE(AVG(r.rating), 0) AS avg_rating,
             COUNT(r.id) AS review_count
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN reviews r ON p.id = r.property_id
      WHERE p.is_available = 1
    `;
    const params = [];

    if (city)          { query += " AND p.city LIKE ?";           params.push(`%${city}%`); }
    if (min_price)     { query += " AND p.price_per_month >= ?";  params.push(min_price); }
    if (max_price)     { query += " AND p.price_per_month <= ?";  params.push(max_price); }
    if (bedrooms)      { query += " AND p.bedrooms = ?";          params.push(bedrooms); }
    if (property_type) { query += " AND p.property_type = ?";     params.push(property_type); }
    if (search)        { query += " AND (p.title LIKE ? OR p.address LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }

    query += " GROUP BY p.id ORDER BY p.created_at DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch properties." });
  }
});

// GET /properties/:id  — single property details
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, u.name AS owner_name, u.phone AS owner_phone, u.email AS owner_email,
             COALESCE(AVG(r.rating), 0) AS avg_rating,
             COUNT(r.id) AS review_count
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN reviews r ON p.id = r.property_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ msg: "Property not found." });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch property." });
  }
});

// POST /properties  — create (owner only)
router.post("/", auth, requireRole("owner", "admin"), validate(schemas.property), async (req, res) => {
  try {
    const { title, description, address, city, state, zip, price_per_month,
            bedrooms, bathrooms, area_sqft, property_type, amenities, images, is_available } = req.body;

    const [result] = await db.query(
      `INSERT INTO properties (owner_id, title, description, address, city, state, zip,
       price_per_month, bedrooms, bathrooms, area_sqft, property_type, amenities, images, is_available)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.id, title, description, address, city, state, zip,
       price_per_month, bedrooms, bathrooms, area_sqft, property_type,
       JSON.stringify(amenities || []), JSON.stringify(images || []), is_available !== false]
    );
    res.status(201).json({ msg: "Property created.", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to create property." });
  }
});

// PUT /properties/:id  — update (owner of property or admin)
router.put("/:id", auth, requireRole("owner", "admin"), async (req, res) => {
  try {
    const [rows] = await db.query("SELECT owner_id FROM properties WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ msg: "Property not found." });
    if (rows[0].owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not your property." });
    }

    const fields = ["title","description","address","city","state","zip","price_per_month",
                    "bedrooms","bathrooms","area_sqft","property_type","is_available"];
    const updates = [], params = [];

    fields.forEach(f => {
      if (req.body[f] !== undefined) { updates.push(`${f}=?`); params.push(req.body[f]); }
    });
    if (req.body.amenities) { updates.push("amenities=?"); params.push(JSON.stringify(req.body.amenities)); }
    if (req.body.images)    { updates.push("images=?");    params.push(JSON.stringify(req.body.images)); }

    if (updates.length === 0) return res.status(400).json({ msg: "No fields to update." });

    params.push(req.params.id);
    await db.query(`UPDATE properties SET ${updates.join(",")} WHERE id=?`, params);
    res.json({ msg: "Property updated." });
  } catch (err) {
    res.status(500).json({ msg: "Failed to update property." });
  }
});

// DELETE /properties/:id  — delete (owner or admin)
router.delete("/:id", auth, requireRole("owner", "admin"), async (req, res) => {
  try {
    const [rows] = await db.query("SELECT owner_id FROM properties WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ msg: "Property not found." });
    if (rows[0].owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not your property." });
    }
    await db.query("DELETE FROM properties WHERE id = ?", [req.params.id]);
    res.json({ msg: "Property deleted." });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete property." });
  }
});

// GET /properties/owner/my  — owner's own listings
router.get("/owner/my", auth, requireRole("owner", "admin"), async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM properties WHERE owner_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch your properties." });
  }
});

module.exports = router;
