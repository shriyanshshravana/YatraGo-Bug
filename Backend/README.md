# 🧳 YatraGo Backend API

Complete, secure, beginner-friendly REST API for **YATRAGO** — an India-only trip planner website.

Built with **Node.js**, **Express.js**, **MongoDB Atlas**, **Mongoose**, **CommonJS** (`require` / `module.exports`), **JWT**, **bcryptjs**, and **Nodemailer**.

---

## 📋 Table of Contents
1. [Technology Stack](#-technology-stack)
2. [Project Architecture](#-project-architecture)
3. [Prerequisites](#-prerequisites)
4. [Installation & Setup](#-installation--setup)
5. [Environment Variables Guide](#-environment-variables-guide)
6. [Running the Server](#-running-the-server)
7. [Database Seeding](#-database-seeding)
8. [Automated Testing](#-automated-testing)
9. [API Endpoints Reference](#-api-endpoints-reference)
   - [Health & General](#1-health--general)
   - [Authentication & OTP](#2-authentication--otp)
   - [Destinations](#3-destinations)
   - [Trips & Workspace](#4-trips--trip-workspace)
10. [Configuration Status & Dependencies](#-configuration-status--dependencies)
11. [Security & Design Principles](#-security--design-principles)

---

## 🛠 Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (v4.21+)
- **Database**: MongoDB Atlas via Mongoose ODM
- **Module System**: CommonJS (`require` and `module.exports`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` for password hashing
- **Security**: `helmet` (HTTP headers) & `express-rate-limit` (DDoS/brute-force defense)
- **Validation**: `express-validator`
- **Email Delivery**: `nodemailer` for 6-digit OTP verification & password resets
- **Cross-Origin**: `cors` configurable via `FRONTEND_URL`

---

## 📂 Project Architecture

```
Backend/
├── config/
│   └── db.js                      # MongoDB connection manager & event listeners
├── controllers/
│   ├── authController.js          # Registration, login, OTP, profile, logout logic
│   ├── destinationController.js   # Destination catalog, search, and filtering
│   └── tripController.js          # Trip CRUD, to-dos, expenses, and itinerary workspace
├── middleware/
│   ├── authMiddleware.js          # JWT verification & server-side token invalidation
│   ├── errorHandler.js            # Centralised error handling (safe JSON responses)
│   └── notFound.js                # 404 Route handler
├── models/
│   ├── Destination.js             # Mongoose schema for Indian destinations
│   ├── Trip.js                    # Mongoose schema for trips, tasks, expenses & itinerary
│   └── User.js                    # Mongoose schema with bcrypt hashing & OTP hashes
├── routes/
│   ├── authRoutes.js              # /api/auth endpoints
│   ├── destinationRoutes.js       # /api/destinations endpoints
│   └── tripRoutes.js              # /api/trips endpoints (protected)
├── seed/
│   └── destinations.js            # Seed script with 12 starter Indian destinations
├── tests/
│   └── api.test.js                # Self-contained automated endpoint & unit test suite
├── utils/
│   ├── mailer.js                  # Nodemailer transport & HTML email templates
│   ├── otp.js                     # Crypto-secure OTP generation, bcrypt hash & cooldowns
│   └── validators.js              # express-validator chains & error formatting
├── .env.example                   # Template environment variables (no secrets)
├── .gitignore                     # Ignores .env and node_modules
├── package.json                   # Dependencies and npm scripts
├── README.md                      # Complete setup & API documentation
└── server.js                      # Main Express application entry point
```

---

## 📦 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB Atlas account** (Free M0 cluster is sufficient)
- **Email Provider (Optional for live OTPs)**: Gmail with App Password or custom SMTP

---

## 🚀 Installation & Setup

### 1. Navigate to the Backend folder
Open a terminal inside the project root:
```bash
cd Backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create your `.env` file
Copy the sample configuration:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Mac/Linux:
cp .env.example .env
```

Open `.env` in your editor and configure your environment variables.

---

## ⚙️ Environment Variables Guide

| Variable | Description | Example / Default | Required For |
| :--- | :--- | :--- | :--- |
| `PORT` | Port the Express server listens on | `5000` | Server startup |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` | Error verbosity |
| `FRONTEND_URL` | Frontend origin permitted by CORS | `http://localhost:5173` | Browser AJAX calls |
| `MONGODB_URI` | MongoDB Atlas cluster connection string | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/yatrago?retryWrites=true&w=majority` | **All database operations** |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | *A long, 32+ character random string* | User authentication |
| `JWT_EXPIRES_IN` | Token expiration period | `7d` | Token validity |
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` | Email delivery |
| `EMAIL_PORT` | SMTP port (`587` for TLS, `465` for SSL) | `587` | Email delivery |
| `EMAIL_SECURE` | Set to `true` for port 465, `false` for 587 | `false` | Email delivery |
| `EMAIL_USER` | Email username or Gmail address | `your_email@gmail.com` | **Sending OTPs** |
| `EMAIL_PASS` | Email password or 16-character Gmail App Password | `xxxx xxxx xxxx xxxx` | **Sending OTPs** |
| `EMAIL_FROM` | Sender display name and email | `"YatraGo Support <noreply@yatrago.com>"` | Email appearance |
| `OTP_EXPIRY_MINUTES` | Validity window of 6-digit OTP | `10` | Security policy |
| `OTP_RESEND_COOLDOWN_SECONDS` | Cooldown period before resending OTP | `60` | Rate limiting |

---

## 🏃 Running the Server

### Production Mode
```bash
npm start
```

### Development Mode (with auto-restart on file change)
```bash
npm run dev
```

The server binds to `0.0.0.0` (all network interfaces) and default port `5000`:
- **API URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

---

## 🌱 Database Seeding

Populate your MongoDB database with 12 starter Indian destinations (Jaipur, Udaipur, Goa, Manali, Varanasi, Kerala, Srinagar, Rishikesh, Darjeeling, Hampi, Shimla, and Puducherry):

```bash
npm run seed
```
> **Note**: Requires `MONGODB_URI` to be set in `Backend/.env`. The seed script is idempotent (it updates existing items by slug without creating duplicate entries).

---

## 🧪 Automated Testing

Run the included automated test suite to verify endpoints, validation rules, security headers, and OTP hashing:

```bash
npm test
```

All tests execute on an in-memory HTTP server without affecting external production resources.

---

## 📡 API Endpoints Reference

### 1. Health & General

#### `GET /api/health`
Returns server status, uptime, database connection state, and email configuration status.
- **Access**: Public
- **Response (200 OK)**:
```json
{
  "status": "ok",
  "service": "YatraGo API",
  "tagline": "Discover the wonder of India",
  "version": "1.0.0",
  "timestamp": "2026-10-18T15:35:00.000Z",
  "uptime": "12.4s",
  "environment": "development",
  "database": "connected",
  "emailConfigured": false
}
```

---

### 2. Authentication & OTP

#### `POST /api/auth/register`
Creates user account with hashed password and sends a 6-digit verification OTP.
- **Access**: Public
- **Body**:
```json
{
  "name": "Aarav Sharma",
  "email": "aarav@example.com",
  "password": "Password123"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Account registered successfully. A 6-digit verification code has been sent to your email.",
  "emailSent": true,
  "emailConfigured": true,
  "user": {
    "_id": "67128...",
    "name": "Aarav Sharma",
    "email": "aarav@example.com",
    "isVerified": false
  }
}
```

#### `POST /api/auth/verify-otp`
Verifies user email with the 6-digit OTP and returns a JWT token.
- **Access**: Public
- **Body**:
```json
{
  "email": "aarav@example.com",
  "otp": "839201"
}
```
- **Response (200 OK)**: Returns JWT `token` and verified `user` profile.

#### `POST /api/auth/resend-otp`
Requests a fresh 6-digit OTP (subject to 60-second cooldown rate limiting).
- **Access**: Public
- **Body**: `{ "email": "aarav@example.com" }`

#### `POST /api/auth/login`
Authenticates with email and password, returning a JWT token.
- **Access**: Public
- **Body**:
```json
{
  "email": "aarav@example.com",
  "password": "Password123"
}
```

#### `POST /api/auth/forgot-password`
Generates and emails a 6-digit password reset OTP.
- **Access**: Public
- **Body**: `{ "email": "aarav@example.com" }`

#### `POST /api/auth/reset-password`
Verifies reset OTP and sets a new password. Invalidates old sessions.
- **Access**: Public
- **Body**:
```json
{
  "email": "aarav@example.com",
  "otp": "839201",
  "newPassword": "NewSecurePassword456"
}
```

#### `GET /api/auth/profile`
Retrieves authenticated user profile.
- **Access**: Private (Header: `Authorization: Bearer <token>`)

#### `PUT /api/auth/profile`
Updates profile details (`name`, `bio`, `phone`, `avatar`).
- **Access**: Private (Header: `Authorization: Bearer <token>`)

#### `POST /api/auth/logout`
Invalidates token on the server side via token version rotation.
- **Access**: Private (Header: `Authorization: Bearer <token>`)

---

### 3. Destinations

#### `GET /api/destinations`
List destinations with optional search, filtering, and pagination.
- **Access**: Public
- **Query Parameters**:
  - `search`: Keyword search matching name, state, description, tag, or food
  - `state`: Filter by Indian state (e.g., `Rajasthan`, `Goa`, `Kerala`)
  - `region`: Filter by region (`North India`, `South India`, `West India`, `East India`)
  - `type`: Filter by style (`Heritage`, `Mountains`, `Beach`, `Nature`, `Adventure`)
  - `minBudget` / `maxBudget`: Filter by price per person
  - `sort`: `budget_asc`, `budget_desc`, `days_asc`, `days_desc`, `newest`
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 12)
- **Example**: `GET /api/destinations?region=North+India&type=Mountains`

#### `GET /api/destinations/:id`
Retrieves a single destination by MongoDB `_id` or slug (e.g. `jaipur`, `manali`, `goa`).
- **Access**: Public

---

### 4. Trips & Trip Workspace

All trip endpoints require authentication: `Authorization: Bearer <token>`.

#### `POST /api/trips`
Create a new trip plan.
```json
{
  "destinationName": "Jaipur",
  "state": "Rajasthan",
  "emoji": "🏰",
  "title": "Royal Rajasthan Weekend",
  "startDate": "2026-11-10",
  "endDate": "2026-11-14",
  "travellers": 2,
  "budget": 20000,
  "notes": "Must try pyaaz kachori at Rawat Mishtan Bhandar."
}
```

#### `GET /api/trips`
Lists all trips created by the logged-in user with live summary metrics (`totalExpenses`, `remainingBudget`, `taskStats`).

#### `GET /api/trips/:id`
Gets a single trip by ID. Confirms ownership (returns 403 if accessed by another user).

#### `PUT /api/trips/:id`
Updates trip metadata (title, dates, budget, travellers, notes).

#### `DELETE /api/trips/:id`
Deletes a trip owned by the user.

---

### Trip Workspace Sub-routes

#### **To-Do Items (Tasks)**
- `POST /api/trips/:id/tasks`: Add a task `{ "text": "Book train tickets" }`
- `PUT /api/trips/:id/tasks/:taskId`: Update or complete `{ "done": true }`
- `DELETE /api/trips/:id/tasks/:taskId`: Delete task

#### **Expenses & Budget Tracker**
- `POST /api/trips/:id/expenses`: Add expense `{ "title": "Hotel advance", "amount": 4500, "category": "Stay" }`
  - Automatically recalculates `totalExpenses` and `remainingBudget`.
- `DELETE /api/trips/:id/expenses/:expenseId`: Delete expense
  - Automatically recalculates remaining budget.

#### **Itinerary Planning**
- `POST /api/trips/:id/itinerary`: Add an activity `{ "day": 1, "activity": "Amber Fort Visit", "time": "09:30 AM" }`
- `PUT /api/trips/:id/itinerary/activities/:activityId`: Update or mark completed `{ "completed": true }`
- `DELETE /api/trips/:id/itinerary/activities/:activityId`: Remove activity

---

## ⚠️ Configuration Status & Dependencies

The backend starts up smoothly out of the box and responds to health checks. However, certain features require external credentials to function:

### 1. Features requiring MongoDB Atlas (`MONGODB_URI` in `.env`)
Until `MONGODB_URI` is provided:
- ❌ Account registration and login
- ❌ Loading destinations via API
- ❌ Running the seed script (`npm run seed`)
- ❌ Creating, editing, or viewing trips and workspace tasks/expenses
- ✅ `/api/health` works and reports `"database": "disconnected"`
- ✅ All input validation and security middlewares function normally

### 2. Features requiring an Email Provider (`EMAIL_USER` and `EMAIL_PASS` in `.env`)
Until email credentials are provided:
- ❌ Real delivery of 6-digit OTP codes to the user's inbox
- ✅ The server **honestly reports** that email delivery is not configured (`emailSent: false`)
- ✅ Registration records the user safely in the database with a hashed OTP
- ✅ If you enter the valid OTP via database or configure SMTP, verification completes smoothly

> **Tip for Gmail Users**: If using Gmail, you must generate an **App Password** from your Google Account security settings (2-Step Verification must be enabled). Do not use your regular account login password.

---

## 🛡️ Security & Design Principles

1. **Zero Hardcoded Secrets**: All keys, connection URIs, and credentials reside exclusively in `.env`, which is untracked by `.gitignore`.
2. **Never Log Sensitive Information**: Passwords, OTP codes, authorization tokens, and connection strings are strictly omitted from logs and responses.
3. **Crypto-Secure OTPs**: OTPs are generated with `crypto.randomInt` and stored using one-way `bcrypt` hashes.
4. **Token Invalidation on Logout**: User model features `tokenVersion`, invalidating tokens server-side upon logout or password reset.
5. **Rate Limiting & Helmet**: Protects against brute-force attacks and cross-site scripting attacks.
6. **Isolated Seed Data**: Seed scripts operate independently without contaminating route controllers.

---

## 🚀 Deployment Guide (Render & Vercel)

### A. Deploying Backend to Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Set the following build and start parameters:
   - **Root Directory**: `Backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
4. Add Environment Variables in the Render dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI
   - `JWT_SECRET`: A long 32+ character random string
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g. `https://yatrago.vercel.app`)
   - `NODE_ENV`: `production`
   - `EMAIL_HOST`: `smtp.gmail.com`
   - `EMAIL_PORT`: `587`
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASS`: Your Gmail App Password
5. In **MongoDB Atlas**, navigate to **Network Access** and add `0.0.0.0/0` (or Render's outbound IP addresses) so Render can connect to your database.

### B. Deploying Frontend to Vercel
1. Create a new Project on [Vercel](https://vercel.com).
2. Connect your Git repository.
3. Configure project settings:
   - **Root Directory**: `Frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-render-service.onrender.com/api`
5. The included `Frontend/vercel.json` ensures client-side routing works on refresh without 404s.
