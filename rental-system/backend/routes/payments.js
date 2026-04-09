const router   = require("express").Router();
const db       = require("../db");
const Razorpay = require("razorpay");
const crypto   = require("crypto");
const { auth } = require("../middleware/auth");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /payments/create-order
router.post("/create-order", auth, async (req, res) => {
  try {
    const { booking_id } = req.body;
    if (!booking_id) return res.status(400).json({ msg: "booking_id is required." });

    const [rows] = await db.query(
      `SELECT b.*, p.title FROM bookings b
       JOIN properties p ON b.property_id = p.id
       WHERE b.id = ? AND b.tenant_id = ?`,
      [booking_id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ msg: "Booking not found." });

    const booking = rows[0];
    if (booking.status === "cancelled") {
      return res.status(400).json({ msg: "Cannot pay for a cancelled booking." });
    }

    const amountPaise = Math.round(parseFloat(booking.total_amount) * 100);

    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: "INR",
      receipt:  `booking_${booking_id}`,
      notes:    { booking_id, user_id: req.user.id },
    });

    // ✅ Fixed: use payment_gateway_order_id
    await db.query(
      "INSERT INTO payments (booking_id, user_id, amount, payment_gateway_order_id, status) VALUES (?,?,?,?,?)",
      [booking_id, req.user.id, booking.total_amount, order.id, "pending"]
    );

    res.json({
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
      key_id:   process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to create order." });
  }
});

// POST /payments/verify
router.post("/verify", auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
      return res.status(400).json({ msg: "Missing required payment fields." });
    }

    // Verify Razorpay signature
    const body     = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ msg: "Payment verification failed. Invalid signature." });
    }

    // ✅ Fixed: correct column names + save razorpay_payment_id
    await db.query(
      "UPDATE payments SET status='completed', razorpay_payment_id=? WHERE payment_gateway_order_id=?",
      [razorpay_payment_id, razorpay_order_id]
    );

    // Confirm booking
    await db.query("UPDATE bookings SET status='confirmed' WHERE id=?", [booking_id]);

    // Notify tenant
    await db.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)",
      [req.user.id, "Payment Successful", "Your payment was successful and booking is confirmed!", "payment"]
    );

    res.json({ msg: "Payment verified and booking confirmed!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Verification failed." });
  }
});

// GET /payments/my
router.get("/my", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pay.*, b.start_date, b.end_date, p.title AS property_title
       FROM payments pay
       JOIN bookings b ON pay.booking_id = b.id
       JOIN properties p ON b.property_id = p.id
       WHERE pay.user_id = ?
       ORDER BY pay.payment_date DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch payments." });
  }
});

// GET /payments/owner
router.get("/owner", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pay.*, b.start_date, b.end_date, p.title AS property_title, u.name AS tenant_name
       FROM payments pay
       JOIN bookings b ON pay.booking_id = b.id
       JOIN properties p ON b.property_id = p.id
       JOIN users u ON pay.user_id = u.id
       WHERE p.owner_id = ? AND pay.status = 'completed'
       ORDER BY pay.payment_date DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch revenue." });
  }
});

module.exports = router;