# 🚀 Online Deployment Guide (Render + Vercel + MongoDB Atlas)

This guide walks you through deploying the **STRATA Mining Equipment & Tyre Maintenance Platform** live on the web so reviewers can access and test it directly from any laptop or mobile phone.

---

## 1. Free Cloud Database (MongoDB Atlas)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign in / sign up (free forever).
2. Click **Create a Deployment** → Choose the **M0 Free Cluster**.
3. Under **Security Quickstart**:
   - Create a database user (e.g., username `admin`, password `MinePassword123`).
   - Under **IP Access List**, click **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Click **Connect** → **Drivers** (Node.js) → Copy the connection string:
   ```env
   mongodb+srv://admin:MinePassword123@cluster0.abcde.mongodb.net/mining-tyre?retryWrites=true&w=majority
   ```

---

## 2. Backend Deployment (Render.com)

1. Sign up / log in to [render.com](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Fill in the service configuration:
   - **Name:** `strata-mining-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Under **Environment Variables**, add:
   - `MONGO_URI` = *(Your MongoDB Atlas connection string from step 1)*
   - `JWT_SECRET` = `a_super_secret_jwt_key_strata_2026`
   - `PORT` = `5000`
   - `NODE_ENV` = `production`
6. Click **Deploy Web Service**.
7. Once deployed, note down your backend URL: e.g. `https://strata-mining-backend.onrender.com`.
8. Visit `https://strata-mining-backend.onrender.com/api/docs` to verify the **interactive Swagger documentation** is live!

> **Note on Initial Data:** The backend automatically runs `ensureDemoAccounts()` on startup. If you wish to populate the full 48 tyres, 12 machines, and work orders, open the Render **Shell** tab and run `npm run seed`.

---

## 3. Frontend Deployment (Vercel or Render)

### Option A: Vercel (Fastest & Free)
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - `REACT_APP_API_URL` = `https://strata-mining-backend.onrender.com/api`
   - `REACT_APP_SOCKET_URL` = `https://strata-mining-backend.onrender.com`
6. Click **Deploy**. Vercel will build the React application and provide a live URL like `https://strata-mining.vercel.app`.

### Option B: Render Static Site
1. On Render, click **New +** → **Static Site**.
2. Root Directory: `frontend`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `build`
5. Add Environment Variable:
   - `REACT_APP_API_URL` = `https://strata-mining-backend.onrender.com/api`

---

## 4. Testing Your Live Reviewer Link

1. Open your live frontend URL in your browser.
2. Click **One-Click Demo Accounts**:
   - **Meera Iyer** (Administrator) → Full access across all 3 mine sites, audit logs, thresholds.
   - **K. Senthil Nathan** (Site Manager) → Neyveli OCP approvals, work orders, procurement forecast.
   - **R. Karthik** (Technician) → Field work orders, QR scan, replacement requests.
3. Open two browser windows side-by-side to test real-time **Socket.IO live updates**:
   - Raise a replacement request in window 1 (Technician).
   - Watch window 2 (Manager) receive an instant notification sound/badge without page reload!
