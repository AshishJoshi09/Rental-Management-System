# 🏠 RentEase – Property Rental Management System

Full-stack property rental platform built with **React + Node.js/Express + MySQL + Razorpay**.

---

## 📁 Project Structure

```
rental-system/
├── backend/          → Express REST API
├── frontend/         → React application
└── database/         → SQL schema
```

---

## ⚙️ Setup Instructions

### 1. Database

```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend

```bash
cd backend
npm install

# Create your .env file
cp .env.example .env
# Edit .env with your DB credentials, JWT secret, and Stripe key

npm run dev        # Development (nodemon)
# or
npm start          # Production
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

App runs at **http://localhost:3000** | API at **http://localhost:5000**

---

## 👤 User Roles

| Role   | Capabilities |
|--------|-------------|
| Tenant | Browse properties, book, pay, raise maintenance requests, leave reviews |
| Owner  | List properties, manage bookings, track revenue, resolve maintenance |
| Admin  | Full platform access, manage users, view all data |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login |
| GET  | `/auth/me` | Get profile |
| PUT  | `/auth/me` | Update profile |
| PUT  | `/auth/change-password` | Change password |

### Properties
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/properties` | List with filters |
| GET    | `/properties/:id` | Property details |
| POST   | `/properties` | Create (owner) |
| PUT    | `/properties/:id` | Update (owner) |
| DELETE | `/properties/:id` | Delete (owner) |
| GET    | `/properties/owner/my` | Owner's listings |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Create booking |
| GET  | `/bookings/my` | Tenant bookings |
| GET  | `/bookings/owner` | Owner's bookings |
| PUT  | `/bookings/:id/status` | Update status |
| GET  | `/bookings/calendar/:property_id` | Booked dates |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/create-intent` | Stripe payment intent |
| POST | `/payments/confirm` | Confirm payment |
| GET  | `/payments/my` | Tenant history |
| GET  | `/payments/owner` | Owner revenue |

### Maintenance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/maintenance` | Raise request (tenant) |
| GET  | `/maintenance/my` | Tenant requests |
| GET  | `/maintenance/owner` | Owner requests |
| PUT  | `/maintenance/:id/status` | Update status |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/reviews/:property_id` | Get reviews |
| POST   | `/reviews` | Add review |
| DELETE | `/reviews/:id` | Delete review |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/admin/stats` | Platform stats |
| GET    | `/admin/users` | All users |
| PUT    | `/admin/users/:id/role` | Change role |
| DELETE | `/admin/users/:id` | Delete user |
| GET    | `/admin/bookings` | All bookings |
| GET    | `/admin/payments` | All payments |

---

## 🛠 Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, React Router v6, Axios, React Toastify |
| Backend   | Node.js, Express, JWT Auth, Joi Validation, Helmet |
| Database  | MySQL 8 (mysql2 pooled connections) |
| Payments  | Razorpay (Payment Intents API) |
| Security  | bcrypt passwords, role-based middleware, rate limiting |

---

## 🔒 Security Features

- Passwords hashed with **bcrypt** (10 rounds)
- **JWT** tokens with 7-day expiry
- Role-based route guards (`tenant`, `owner`, `admin`)
- **Joi** validation on all POST/PUT endpoints
- **Helmet** HTTP security headers
- Express **rate limiting** (100 req/15 min)
- Parameterized SQL queries (no injection risk)

---

## 💳 RazorpayTest Cards

Use these in development:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`
