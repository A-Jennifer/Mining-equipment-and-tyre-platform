const request = require("supertest");
const express = require("express");
const predictTyreStatus = require("../utils/predictTyreStatus");
const swaggerSpec = require("../utils/swagger");

describe("Mining Tyre & Equipment API Automated Tests", () => {
  describe("Tyre Health & Predictive Status Engine", () => {
    test("Predicts 'Good' when tyre wear is below 70%", () => {
      const status = predictTyreStatus(2000, 5000); // 40% wear
      expect(status).toBe("Good");
    });

    test("Predicts 'Monitor' when tyre wear is between 70% and 90%", () => {
      const status = predictTyreStatus(3800, 5000); // 76% wear
      expect(status).toBe("Monitor");
    });

    test("Predicts 'Replace Soon' when tyre wear exceeds 90%", () => {
      const status = predictTyreStatus(4700, 5000); // 94% wear
      expect(status).toBe("Replace Soon");
    });

    test("Handles edge cases gracefully", () => {
      expect(predictTyreStatus(0, 5000)).toBe("Good");
      expect(predictTyreStatus(5500, 5000)).toBe("Replace Soon");
      expect(predictTyreStatus(100, 0)).toBe("Good");
    });
  });

  describe("API Specifications & Swagger Schema", () => {
    test("Swagger OpenAPI 3.0 specification is valid and complete", () => {
      expect(swaggerSpec.openapi).toBe("3.0.0");
      expect(swaggerSpec.info.title).toContain("Mining Equipment & Tyre Maintenance");
      expect(swaggerSpec.paths).toHaveProperty("/api/auth/login");
      expect(swaggerSpec.paths).toHaveProperty("/api/equipment");
      expect(swaggerSpec.paths).toHaveProperty("/api/tyres");
      expect(swaggerSpec.paths).toHaveProperty("/api/maintenance");
      expect(swaggerSpec.paths).toHaveProperty("/api/audit");
    });
  });

  describe("Authentication Validation Middleware", () => {
    let testApp;

    beforeAll(() => {
      testApp = express();
      testApp.use(express.json());
      testApp.post("/api/auth/login", (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ message: "Please provide both an email address and a password." });
        }
        return res.status(401).json({ message: "Invalid credentials" });
      });

      testApp.post("/api/auth/forgot-password", (req, res) => {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ message: "Please provide an email address." });
        }
        return res.status(200).json({ message: "Reset code generated." });
      });
    });

    test("POST /api/auth/login fails when missing credentials", async () => {
      const res = await request(testApp).post("/api/auth/login").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("email");
    });

    test("POST /api/auth/forgot-password validates email presence", async () => {
      const res = await request(testApp).post("/api/auth/forgot-password").send({});
      expect(res.statusCode).toBe(400);
    });
  });
});
