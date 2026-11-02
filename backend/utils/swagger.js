/**
 * Swagger / OpenAPI 3.0 specification for Mining Equipment & Tyre Maintenance API.
 */
const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Mining Equipment & Tyre Maintenance Management API (STRATA)",
    version: "1.0.0",
    description:
      "Enterprise REST API for heavy mining equipment health tracking, tyre life forecasting, maintenance work orders, technician workflows, and live audit logging."
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local Development Server"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/": {
      get: {
        summary: "API Health Check",
        responses: {
          200: {
            description: "API server status is healthy."
          }
        }
      }
    },
    "/api/auth/login": {
      post: {
        summary: "User Login",
        description: "Authenticates an Administrator, Site Manager, or Technician.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", example: "admin@minetrack.demo" },
                  password: { type: "string", example: "Mine@1234" }
                },
                required: ["email", "password"]
              }
            }
          }
        },
        responses: {
          200: { description: "Login successful with JWT token and user profile." },
          401: { description: "Invalid credentials." }
        }
      }
    },
    "/api/auth/register": {
      post: {
        summary: "User Registration",
        description: "Allows technicians and site managers to sign up.",
        responses: {
          201: { description: "User registered successfully." }
        }
      }
    },
    "/api/equipment": {
      get: {
        summary: "List Equipment",
        description: "Returns heavy machinery (Haul Trucks, Loaders, Excavators) with usage hours.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "List of fleet equipment." }
        }
      }
    },
    "/api/tyres": {
      get: {
        summary: "List Tyres",
        description: "Returns all fitted tyres with operating hours, wear percentage, and status.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "List of tyres." }
        }
      }
    },
    "/api/maintenance": {
      get: {
        summary: "List Maintenance Tasks",
        description: "Returns upcoming and overdue work orders with assigned technician.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "List of maintenance tasks." }
        }
      }
    },
    "/api/audit": {
      get: {
        summary: "Audit Trail",
        description: "Admin endpoint showing chronological user actions, approvals, and completions.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Audit trail log records." }
        }
      }
    }
  }
};

module.exports = swaggerSpec;
