# Deploy StockFlow MVP on Render

Use either option below.

## Option A: Blueprint deploy (recommended)

This repo now includes render.yaml, so Render auto-loads service config.

1. In Render dashboard: New + -> Blueprint.
2. Select your GitHub repo.
3. Render reads render.yaml and creates the web service.
4. Add required secrets when prompted:
  - DATABASE_URL
  - JWT_SECRET

## Option B: Manual web service deploy

1. Create PostgreSQL on Render and copy its Internal Database URL.
2. Create a New Web Service from your GitHub repo.
3. Set Root Directory to backend.
4. Set Build Command:

```bash
npm install && npm --prefix ../frontend install && npm --prefix ../frontend run build && npx prisma generate && npx prisma migrate deploy
```

5. Set Start Command:

```bash
npm start
```

6. Set env vars:
  - DATABASE_URL=<Render PostgreSQL Internal URL>
  - JWT_SECRET=<long random string>

## Verify deployment

1. Open your app URL and create an account.
2. Check health endpoint:

```bash
curl https://<your-app>.onrender.com/api/health
```

Expected response:

```json
{"status":"ok"}
```

3. Do full demo flow:
  - sign up / login
  - create products
  - verify dashboard totals and low stock items
  - update settings threshold and confirm behavior changes

## Final submission checklist

- Send GitHub repository link
- Send live Render URL
- Include short demo steps in your submission message
