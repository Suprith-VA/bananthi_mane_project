# Bananthi Mane

**Postpartum Wellness E-Commerce Platform**

A full-stack web application for [Bananthi Mane](https://bananthimane.com) — a brand dedicated to traditional Indian postpartum care. The platform offers a curated catalog of healing products, a wellness blog, order tracking, and a complete admin portal for managing the business.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router DOM |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT, bcrypt |
| Payments | Razorpay (integration-ready) |
| Logistics | Shiprocket (integration-ready) |

## Features

- **Product Catalog** — 46+ traditional postpartum care products with search, filtering, and out-of-stock handling
- **Blog / Journal** — Content management with featured articles on the home page
- **Order System** — Cart, checkout, order tracking with progress visualization
- **User Accounts** — Registration, login, profile management, order history
- **Subscriber Management** — Newsletter sign-up via footer and services waitlist
- **Admin Dashboard** — Role-based access control with two tiers:
  - **Super Admin** — Full CRUD on products, blogs, orders, and users
  - **Admin** — Blog management + order status updates (read-only on products)
- **Static Pages** — About Us, FAQ, Return Policy with rich, responsive layouts

## Architecture

```
bananthi_mane_project/
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── components/  # Reusable UI (Header, Footer, ProductCard, etc.)
│   │   ├── context/     # Auth + Cart React Context providers
│   │   ├── pages/       # Route-level page components
│   │   └── styles/      # Global CSS + variables
│   └── public/          # Static assets (images, logos)
├── server/              # Express.js backend
│   ├── controllers/     # Route handlers (product, order, blog, admin)
│   ├── middleware/       # JWT auth, role guards
│   ├── prisma/          # Schema + migrations
│   ├── routes/          # Express routers
│   ├── scripts/         # DB seed scripts
│   └── utils/           # Helpers, serializers
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### Setup

```bash
# 1. Clone
git clone https://github.com/Suprith-VA/bananthi_mane_project.git
cd bananthi_mane_project

# 2. Install dependencies
cd server && npm install
cd ../client && npm install

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your DATABASE_URL, JWT_SECRET, etc.

# 4. Database setup
cd server
npx prisma migrate dev
node scripts/seedTestUsers.js
node scripts/seedProductsAndBlogs.js

# 5. Run
# Terminal 1 — Server
cd server && npm run dev

# Terminal 2 — Client
cd client && npm run dev
```

The client runs on `http://localhost:5173` and the API on `http://localhost:5001`.

## Deployment

- **Frontend**: Vercel / Netlify (static build via `npm run build`)
- **Backend**: Railway / Render / Fly.io
- **Database**: Neon / Supabase / Railway PostgreSQL

---

> This is a freelance client project shared for portfolio purposes.
> The codebase is under exclusive copyright. Viewing is permitted; reuse, modification, or distribution is not.

Built by [Suprith V A](https://github.com/Suprith-VA)
