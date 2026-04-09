const router = require("express").Router();
const db     = require("../db");
const { auth } = require("../middleware/auth");

// GET /notifications  — all notifications for current user
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch notifications." });
  }
});

// GET /notifications/unread-count
router.get("/unread-count", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM notifications WHERE user_id=? AND is_read=0",
      [req.user.id]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ msg: "Failed to get count." });
  }
});

// PUT /notifications/:id/read  — mark one as read
router.put("/:id/read", auth, async (req, res) => {
  try {
    await db.query(
      "UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?",
      [req.params.id, req.user.id]
    );
    res.json({ msg: "Marked as read." });
  } catch (err) {
    res.status(500).json({ msg: "Failed to update." });
  }
});

// PUT /notifications/read-all
router.put("/read-all", auth, async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read=1 WHERE user_id=?", [req.user.id]);
    res.json({ msg: "All marked as read." });
  } catch (err) {
    res.status(500).json({ msg: "Failed to update." });
  }
});

module.exports = router;
