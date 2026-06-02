# Deploy StockFlow MVP on Render

This is the fastest way to get a live link for submission.

## 1. Push code to GitHub

- Create repo and push your project.
- Ensure backend and frontend folders are in the same repo.

## 2. Create PostgreSQL on Render

1. In Render dashboard, create a new PostgreSQL instance.
2. Copy its Internal Database URL.

## 3. Create a Web Service

1. New Web Service -> connect your GitHub repo.
2. Root directory: backend
3. Build command:

```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

4. Start command:

```bash
npm start
```

## 4. Add environment variables

In Render service settings:

- DATABASE_URL = <Render PostgreSQL Internal URL>
- JWT_SECRET = <long random string>
- PORT = 10000

Note: Render sets its own port at runtime. Keeping PORT configured is harmless.

## 5. Verify deployment

- Open service URL
- Sign up and run end-to-end demo flow:
  - create product
  - edit quantity
  - verify dashboard low stock list

## 6. Submit

Share:

- GitHub repository link
- Live Render URL
- Brief demo steps / test account details (if needed)
