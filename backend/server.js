require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swagger");
const connectDB = require("./config/db");
const ensureDemoAccounts = require("./utils/ensureDemoAccounts");
const { init: initSocket } = require("./utils/socket");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const siteRoutes = require("./routes/siteRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const tyreRoutes = require("./routes/tyreRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const auditRoutes = require("./routes/auditRoutes");

const app = express();
const server = http.createServer(app);

// Initialise Socket.IO on the HTTP server (must be before routes use getIO())
initSocket(server);

connectDB().then(() => {
  ensureDemoAccounts();
});

// Security headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Allows Swagger UI and local development
  })
);

// CORS: allow frontend origin (set CLIENT_URL in production env, falls back to open for local dev)
const corsOptions = {
  origin: process.env.CLIENT_URL
    ? [process.env.CLIENT_URL, "http://localhost:3000"]
    : true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
};
app.use(cors(corsOptions));
app.use(express.json());

// Rate limiter for authentication routes (prevents brute-force credential stuffing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes window
  message: { message: "Too many authentication attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

// Swagger Interactive API Documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.json({
    message: "Mining Equipment & Tyre Maintenance Management API is running",
    documentation: "/api/docs"
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/tyres", tyreRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit", auditRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  let status = err.status || 500;
  let message = err.message || "Server error";

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(", ")}`;
  }

  res.status(status).json({ message });
});

process.on("unhandledRejection", (reason) => console.error("Unhandled rejection:", reason));
process.on("uncaughtException", (error) => console.error("Uncaught exception:", error));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));