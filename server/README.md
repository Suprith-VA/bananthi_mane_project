# Server Backend Setup

## Tech Stack

- **Runtime:** Node.js + Express
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (jsonwebtoken) + bcryptjs

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally (or a hosted instance)

## Setup

1. Copy `.env.example` to `.env` and fill in your `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/bananthi_mane
JWT_SECRET=change_this_to_a_long_random_secret
```

2. Install dependencies (also generates the Prisma client):

```bash
cd server
npm install
```

3. Run database migrations to create all tables:

```bash
npx prisma migrate dev --name init
```

4. Seed test users:

```bash
npm run db:seed
```

5. Start the server:

```bash
npm run dev
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with auto-reload |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio (visual DB editor) |
| `npm run db:seed` | Seed test user accounts |
| `npm run db:push` | Push schema changes (skip migration files) |

## Test Users

| Email | Password | Role |
|-------|----------|------|
| admin.test@bananthi.local | Admin@1234 | admin |
| customer.test@bananthi.local | Test@1234 | user |
| ops.test@bananthi.local | Ops@12345 | user |

## API Modules

- **Auth:** register, login, forgot/reset password (`/api/auth/*`)
- **User profile:** get/update (`/api/users/profile`)
- **Products:** public list/read + admin CRUD (`/api/products`)
- **Blogs:** public list/read + admin CRUD (`/api/blogs`)
- **Orders:** guest + user checkout, my orders, admin management (`/api/orders`)
- **Order tracking:** public tracking with email/phone verification (`/api/orders/track/:orderId`)
- **Admin:** user management, dashboard stats, broadcast (`/api/admin/*`)
- **Marketing:** newsletter subscribe (`/api/subscribe`)

## Database Schema

Schema is defined in `prisma/schema.prisma`. Tables:

- `users` — registered users with role-based access
- `products` — product catalog with inventory tracking
- `orders` — orders supporting guest and registered checkout
- `order_items` — line items for each order
- `blogs` — journal/blog posts
- `subscribers` — newsletter subscribers
