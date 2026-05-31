# Wholesale Inventory & Billing Bot

A lightweight ERP for small wholesalers to manage stock and invoices. StockPilot is a production-style, full-stack MERN application designed for wholesale businesses to manage product catalogs, monitor inventory levels, compile customer spent metrics, and process sales checkouts using a fast Point-of-Sale (POS) dashboard.

---

## Key Features

1. **Role-Based Auth System**: Uses JWT tokens with distinct permissions (Admin vs Staff).
2. **Dashboard Analytics**: Shows core performance indicators and **sales analytics charts using Chart.js**.
3. **Inventory Management & Low-Stock Alerts**: Features search, category/brand filters, and **low-stock alerts** warning badges when stock counts fall below 5.
4. **Point-of-Sale (POS) & Barcode Simulation**: Includes **barcode scanning simulation**, dynamic customer logs creation, and stock-reduction checkout locks.
5. **GST-Compliant Invoice Generation**: Real-time **GST-compliant invoice generation** and integrated PDF receipt downloading using `jspdf`.
6. **Customer Tracking**: Aggregates total invoices issued and total volume spent. Includes searchable histories.
7. **Sleek Light/Dark Themes**: Modern dark/light business mode built with Tailwind CSS.

---

## Tech Stack

* **Frontend**: React.js (Vite compiler), Tailwind CSS, Axios, React Router DOM, React Icons, **Chart.js**, jsPDF.
* **Backend**: Node.js, Express.js, Mongoose/MongoDB, JSON Web Tokens (JWT), bcryptjs (password security), Morgan (logging), Cors.
* **Architecture**: MVC model folders organization on backend, unified API service interfaces on React.

---

## Project Folder Structure

```text
Individual Project/
├── backend/
│   ├── config/          # Mongoose DB connector
│   ├── controllers/     # API request handlers
│   ├── middleware/      # Auth security guard and global error handler
│   ├── models/          # MongoDB/Mongoose models
│   ├── routes/          # REST routes
│   ├── .env             # Active environment variables
│   ├── .env.example     # Environment variable template
│   └── server.js        # Backend server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Spinner, ConfirmModal, ProtectedRoute, ToastContainer
│   │   ├── context/     # AuthContext (JWT/Theme) and ToastContext (Floating alerts)
│   │   ├── layouts/     # Dashboard Sidebar & Header Layout wrapper
│   │   ├── pages/       # Dashboard, Billing, Inventory, Customers, Sales, Login, Signup
│   │   ├── services/    # Axios instance with request/response interceptors
│   │   ├── utils/       # Calculation and PDF generators
│   │   ├── App.jsx      # Root routing paths
│   │   ├── index.css    # CSS base layer with scrollbars and print formats
│   │   └── main.jsx     # DOM anchor mount
│   ├── .env             # Active environment variables
│   ├── .env.example     # Environment variable template
│   ├── tailwind.config.js
│   └── vite.config.js   # Vite server settings (Port 3000)
└── README.md            # Setup guide
```

---

## Getting Started

### 1. Prerequisites
Ensure you have the following installed on your system:
* **Node.js** (v18.0.0 or higher recommended)
* **MongoDB Community Server** (running locally on port `27017`) or a MongoDB Atlas URI string.

---

### 2. Backend Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. The dependencies are already declared. Verify or install if necessary:
   ```bash
   npm install
   ```
3. Configure the environment variables. Open the `.env` file and set the properties:
   ```text
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/stockpilot
   JWT_SECRET=stockpilot_secret_key_2026_antigravity
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```
4. Start the backend development server (runs via nodemon):
   ```bash
   npm run dev
   ```
   *The server should print:* `Server running in development mode on port 5000` & `MongoDB Connected: localhost`.

---

### 3. Frontend Installation

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. The dependencies are already declared. Verify or install if necessary:
   ```bash
   npm install
   ```
3. Configure the environment variables. Open the `.env` file:
   ```text
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend React development server (runs on Port 3000):
   ```bash
   npm run dev
   ```
   *Vite should automatically open a browser page at:* `http://localhost:3000`.

---

## API Endpoints

### 1. Authentication (`/api/auth`)
* `POST /signup` - Register a new Admin or Staff user. Returns JWT and user payload.
* `POST /login` - Log in with registered credentials. Returns JWT.
* `GET /me` - Fetches authenticated user info using JWT bearer header.

### 2. Wholesale Products (`/api/products`)
* `GET /` - Fetches products list (supports `?search=xyz`, `?category=abc`, `?brand=pqr`, `?lowStock=true`).
* `GET /:id` - Fetches detailed single product parameters.
* `POST /` - Registers new products catalog items (Admin only).
* `PUT /:id` - Updates pricing, descriptions, or stock levels (Admin & Staff).
* `DELETE /:id` - Deletes product registration permanently (Admin only).

### 3. Sales POS Invoices (`/api/invoices`)
* `POST /` - Performs transaction checkout. Deducts inventory stock, registers customer spent metrics, and compiles GST values.
* `GET /` - Fetches invoice lists (supports date filters: `?startDate=2026-05-01&endDate=2026-05-31` and customer searches).
* `GET /:id` - Fetches receipt metadata.

### 4. Customers Directory (`/api/customers`)
* `GET /` - Lists buyer profiles sorted by volume spent.
* `GET /:id` - Fetches customer profile along with their transaction history.

### 5. Statistics Overview (`/api/dashboard`)
* `GET /stats` - Aggregates KPIs (sales sum, product counts, stock alerts, total orders) and formats monthly graphs data.

---

## Verification & Testing Credentials

We support registering custom accounts using the `/signup` screen. Here is a recommended configuration to seed and test roles behavior:

1. Open `http://localhost:3000/signup`.
2. Create an **Administrator** profile (Role: `Administrator`).
3. Create a **Staff Member** profile (Role: `Staff Member`).
4. Log in to the Admin account:
   * Populate products in the **Inventory** panel (e.g., Name: `Cement Bag 50kg`, SKU: `CM-50KG`, Price: `400`, Qty: `20`, Supplier: `Ultratech`).
5. Open the **New Bill (POS)** terminal:
   * Build an invoice for a customer.
   * Decrement stock, compile invoices history, and download a PDF receipt.
   * Observe low-stock alerts triggering when product stock decreases below 5 units.
6. Log in to the Staff account:
   * Try deleting a product from the inventory page. Notice that the delete buttons are hidden from the UI, and any direct API calls are blocked by backend role-middleware.
