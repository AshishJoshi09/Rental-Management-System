const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Routes
app.use("/auth",        require("./routes/auth"));
app.use("/properties",  require("./routes/properties"));
app.use("/bookings",    require("./routes/bookings"));
app.use("/payments",    require("./routes/payments"));
app.use("/reviews",     require("./routes/reviews"));
app.use("/maintenance", require("./routes/maintenance"));
app.use("/notifications", require("./routes/notifications"));
app.use("/admin",       require("./routes/admin"));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
