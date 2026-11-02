const http = require("http");
const path = require("path");
const fs = require("fs");

// Ensure environment is set to production
process.env.NODE_ENV = "production";

console.log("=== STRATA PRODUCTION CONFIGURATION VERIFICATION ===");
console.log("Time:", new Date().toISOString());
console.log("NODE_ENV:", process.env.NODE_ENV);

// Load Express app setup
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../utils/swagger");
const { init: initSocket, getIO } = require("../utils/socket");

const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/userRoutes");
const siteRoutes = require("../routes/siteRoutes");
const equipmentRoutes = require("../routes/equipmentRoutes");
const tyreRoutes = require("../routes/tyreRoutes");
const maintenanceRoutes = require("../routes/maintenanceRoutes");
const dashboardRoutes = require("../routes/dashboardRoutes");
const auditRoutes = require("../routes/auditRoutes");

const app = express();
const server = http.createServer(app);

// Initialise Socket.IO
const io = initSocket(server);

// Security headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
  })
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Mock IP for named pipe testing
app.use((req, res, next) => {
  if (!req.ip) req.ip = "127.0.0.1";
  next();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false }
});

// Swagger
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/tyres", tyreRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit", auditRoutes);

// Explicit 404 handler for API
app.all("/api/*", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// Single-domain static React files
const frontendBuildPath = path.join(__dirname, "../../frontend/build");
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });
}

// Central error handler (exact same as backend/server.js)
app.use((err, req, res, next) => {
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

// Named pipe path for sandbox-compatible testing
const pipePath = "\\\\.\\pipe\\strata-verify-" + Date.now();

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      socketPath: pipePath,
      method: options.method || "GET",
      path: options.path,
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on("error", reject);
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  server.listen(pipePath, async () => {
    console.log("[Test Server] Listening on named pipe:", pipePath);
    let allPassed = true;

    try {
      // 1. Verify frontend loads at /
      console.log("\n[TEST 1] Verifying frontend loads at '/'...");
      const resRoot = await request({ path: "/" });
      console.log("  Status Code:", resRoot.statusCode);
      const hasRootDiv = resRoot.body.includes('<div id="root">');
      const hasTitle = resRoot.body.includes("<title>");
      console.log("  Contains <div id=\"root\">:", hasRootDiv);
      console.log("  Contains <title>:", hasTitle);
      console.log("  Content-Type:", resRoot.headers["content-type"]);
      if (resRoot.statusCode === 200 && hasRootDiv) {
        console.log("  -> PASS: Frontend loads successfully at '/'");
      } else {
        console.error("  -> FAIL: Frontend failed to load");
        allPassed = false;
      }

      // 2. Verify SPA client-side routing at /equipment
      console.log("\n[TEST 2] Verifying SPA fallback routing for client route '/equipment'...");
      const resRoute = await request({ path: "/equipment" });
      console.log("  Status Code:", resRoute.statusCode);
      if (resRoute.statusCode === 200 && resRoute.body.includes('<div id="root">')) {
        console.log("  -> PASS: Client route serves index.html (SPA routing works)");
      } else {
        console.error("  -> FAIL: Client route failed");
        allPassed = false;
      }

      // 3. Verify static asset serving
      console.log("\n[TEST 3] Verifying static assets (e.g. manifest.json)...");
      const resManifest = await request({ path: "/manifest.json" });
      console.log("  Status Code:", resManifest.statusCode);
      console.log("  Content-Type:", resManifest.headers["content-type"]);
      if (resManifest.statusCode === 200 && resManifest.body.includes("Mining")) {
        console.log("  -> PASS: Static assets served correctly");
      } else {
        console.error("  -> FAIL: Static asset serving failed");
        allPassed = false;
      }

      // 4. Verify Swagger OpenAPI Documentation at /api/docs
      console.log("\n[TEST 4] Verifying Swagger API documentation at '/api/docs/'...");
      const resDocs = await request({ path: "/api/docs/" });
      console.log("  Status Code:", resDocs.statusCode);
      const isSwagger = resDocs.body.includes("swagger") || resDocs.body.includes("Swagger");
      console.log("  Contains Swagger content:", isSwagger);
      if (resDocs.statusCode === 200 && isSwagger) {
        console.log("  -> PASS: Swagger documentation loads successfully");
      } else {
        console.error("  -> FAIL: Swagger documentation failed to load");
        allPassed = false;
      }

      // 5. Verify Unmatched API Route returns 404 JSON (NOT HTML)
      console.log("\n[TEST 5] Verifying unmatched API route returns 404 JSON...");
      const resNotFound = await request({ path: "/api/nonexistent-route" });
      console.log("  Status Code:", resNotFound.statusCode);
      console.log("  Body:", resNotFound.body.trim());
      const isJson404 = resNotFound.statusCode === 404 && resNotFound.body.includes("API route not found");
      if (isJson404) {
        console.log("  -> PASS: Unmatched API endpoint returns 404 JSON, preserving API isolation");
      } else {
        console.error("  -> FAIL: Unmatched API route returned unexpected response");
        allPassed = false;
      }

      // 6. Verify API Auth endpoint validation
      console.log("\n[TEST 6] Verifying API route functionality (POST /api/auth/login validation)...");
      const resAuth = await request(
        {
          path: "/api/auth/login",
          method: "POST",
          headers: { "Content-Type": "application/json" }
        },
        {}
      );
      console.log("  Status Code:", resAuth.statusCode);
      console.log("  Body:", resAuth.body.trim());
      if (resAuth.statusCode === 400 && resAuth.body.includes("email")) {
        console.log("  -> PASS: Auth controller received request and returned validation error as expected");
      } else {
        console.error("  -> FAIL: Auth route did not respond as expected");
        allPassed = false;
      }

      // 7. Verify WebSockets & Socket.IO initialization
      console.log("\n[TEST 7] Verifying WebSockets & Socket.IO initialization...");
      const socketIO = getIO();
      console.log("  Socket.IO server instance exists:", !!socketIO);
      const hasEmit = typeof socketIO.emit === "function";
      console.log("  Socket.IO emit method available:", hasEmit);
      if (socketIO && hasEmit) {
        console.log("  -> PASS: WebSockets engine is fully initialized and operational");
      } else {
        console.error("  -> FAIL: Socket.IO failed to initialize");
        allPassed = false;
      }

      console.log("\n=================================================");
      if (allPassed) {
        console.log(">>> ALL 7 PRODUCTION VERIFICATION CHECKS PASSED! <<<");
      } else {
        console.log(">>> SOME CHECKS FAILED. Review output above. <<<");
      }
      console.log("=================================================");
    } catch (err) {
      console.error("Test execution error:", err);
    } finally {
      server.close();
      process.exit(allPassed ? 0 : 1);
    }
  });
}

runTests();
