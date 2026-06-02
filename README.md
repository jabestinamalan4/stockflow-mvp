# StockFlow MVP (6-hour technical assessment)

Minimal SaaS inventory management app built to match the provided MVP PRD.

## What is implemented

- Authentication
  - Signup with organization name, email, password
  - Login with email/password
  - JWT auth for protected APIs
- Multi-tenant data scope
  - User belongs to one organization
  - Products/settings/dashboard are scoped by organization ID
- Product management
  - Create, list, search, update, delete products
  - Fields: name, sku, description, quantity, cost price, selling price, low stock threshold
  - SKU unique per organization
- Dashboard
  - Total products
  - Total quantity on hand
  - Low stock list
- Settings
  - Default low stock threshold per organization
- Frontend
  - Single-page UI served by backend
  - Auth, Dashboard, Products, Settings views

## Tech stack

- Backend: Node.js, Express, Prisma, PostgreSQL
- Auth: JWT + bcrypt
- Frontend: React + Vite

## Project structure

- backend: API server + Prisma schema/migrations
- frontend: static app served by backend

## Prerequisites

- Node.js 20+
- PostgreSQL database

## Environment variables

Create a local file at backend/.env:

- DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
- JWT_SECRET=replace_with_random_secret
- PORT=5000

You can copy from backend/.env.example.

## Run locally

1. Install dependencies

```bash
cd frontend
npm install

cd backend
npm install
```

2. Generate Prisma client and run migration

```bash
npx prisma generate
npx prisma migrate dev
```

3. Build frontend

```bash
cd frontend
npm run build
```

4. Start backend app

```bash
cd backend
npm start
```

5. Open app

- http://localhost:5000

## Optional developer mode (two terminals)

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Then open Vite URL shown in terminal (typically http://localhost:5173).

## API endpoints (MVP)

### Auth

- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me

### Products (JWT required)

- GET /api/products?search=
- GET /api/products/:id
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id

### Dashboard (JWT required)

- GET /api/dashboard

### Settings (JWT required)

- GET /api/settings
- PUT /api/settings

## Suggested demo flow

1. Sign up with org name, email, password
2. Open dashboard (verify totals start at 0)
3. Create products with different quantities/thresholds
4. Verify low-stock items appear on dashboard
5. Edit quantity/threshold and show dashboard updates
6. Change default threshold in settings and verify product list/dashboard behavior

## Scope notes

Kept intentionally minimal to match the assessment constraints:

- No RBAC/multi-user invites
- No warehouse variants/integrations/reports
- No stock movement history beyond product updates
- No billing/subscriptions

## Deployment

See docs/DEPLOY_RENDER.md for a quick Render deployment path.
