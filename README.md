# Mining Equipment & Tyre Maintenance Management Platform

A MERN stack web application to digitize equipment and tyre tracking for
mining operations, with rule-based predictive tyre-wear alerts, role-based
dashboards, analytics charts, and QR-code lookup.

## Tech Stack
- MongoDB (Mongoose)
- Express.js
- React.js (Recharts for charts, qrcode.react for QR codes)
- Node.js
- JWT-based authentication, bcrypt password hashing

## Folder Structure
```
mining-tyre-platform/
  backend/
    config/db.js              MongoDB connection
    models/                   User, Site, Equipment, Tyre, MaintenanceRecord
    middleware/                auth.js (JWT), role.js (role-based access)
    controllers/               request handlers for each resource
    routes/                    Express routers
    utils/predictTyreStatus.js rule-based wear-prediction logic
    utils/seed.js               demo data seeder
    server.js                   app entry point
  frontend/
    src/api/axios.js           pre-configured axios instance (attaches JWT)
    src/context/AuthContext.js  global login state
    src/components/            Navbar, ProtectedRoute
    src/pages/                  Login, Register, Dashboard, Equipment, Tyres,
                                 Maintenance, QRLookup, Sites
    src/App.jsx                 routing
```

## Setup

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# edit .env if needed (MONGO_URI, JWT_SECRET)
npm run seed     # creates demo Site, Users, Equipment, Tyres, a Maintenance record
npm run dev       # starts server on http://localhost:5000
```

Demo login accounts created by the seed script:
| Email | Password | Role |
|---|---|---|
| admin@example.com | password123 | admin |
| manager@example.com | password123 | site_manager |
| tech@example.com | password123 | technician |

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm start          # starts React app on http://localhost:3000
```

Make sure MongoDB is running locally (or update `MONGO_URI` in
`backend/.env` to point to a MongoDB Atlas connection string) before
starting the backend.

## Core Features
- **Auth & Role-Based Access** — JWT login/register; Admin, Site Manager,
  Technician each see different permission levels.
- **Equipment Management** — CRUD for machines (trucks, excavators, etc.)
- **Tyre Management** — CRUD for tyres, linked to equipment.
- **Predictive Wear Logic** (`utils/predictTyreStatus.js`) — compares tyre
  usage hours against a wear threshold and auto-flags status as
  `Good` / `Monitor` / `Replace Soon`, recalculated on every save.
- **Maintenance Records** — log service history and due dates; overdue
  items are highlighted.
- **Analytics Dashboard** — Recharts pie/bar charts for tyre status
  distribution, equipment status, and replacement cost by brand.
- **QR Code Lookup** — every equipment/tyre gets a unique QR code
  (`qrcode.react` for display); the lookup page resolves a scanned/typed
  code to its live record via `/api/equipment/qr/:code` and
  `/api/tyres/qr/:code`.

## Notes
- Scanning is simulated via manual code entry on the QR Lookup page; a
  camera-based scanner (e.g. `html5-qrcode`) could be swapped in later.
- Usage hours are entered manually in this version; in a production
  deployment these could come from IoT/telematics sensors on the
  equipment.
