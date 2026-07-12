# TransitOps Backend API

REST API for the TransitOps fleet management platform.  
Built with **Node.js + Express + MySQL (mysql2)** and **JWT-based auth**.

---

## Quick Start

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Copy environment file and configure your MySQL connection
copy .env.example .env
# Edit .env → set DATABASE_URL to your MySQL connection string

# 3. Create the database in MySQL
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS transitops;"

# 4. Run schema + seed (creates tables and inserts mock data)
npm run setup

# 5. Start the development server
npm run dev
```

The API will be running at `http://localhost:4000`.

---

## Environment Variables

| Variable       | Description                | Default                                         |
| -------------- | -------------------------- | ----------------------------------------------- |
| `DATABASE_URL` | MySQL connection string    | —                                               |
| `JWT_SECRET`   | Secret key for JWT signing | `transitops-jwt-secret-change-me-in-production` |
| `PORT`         | Server port                | `4000`                                          |

---

## Project Structure (MVC)

```
backend/
├── scripts/
│   ├── schema.sql              # Raw DDL (CREATE TABLE)
│   └── seed.js                 # Runs schema + inserts mock data
├── src/
│   ├── config/
│   │   └── database.js         # mysql2 connection pool
│   ├── controllers/            # Business logic
│   │   ├── auth.controller.js
│   │   ├── vehicle.controller.js
│   │   ├── driver.controller.js
│   │   ├── trip.controller.js
│   │   ├── maintenance.controller.js
│   │   ├── fuel.controller.js
│   │   ├── expense.controller.js
│   │   ├── dashboard.controller.js
│   │   └── analytics.controller.js
│   ├── middlewares/
│   │   └── auth.middleware.js   # requireAuth + requireRole
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── vehicle.routes.js
│   │   ├── driver.routes.js
│   │   ├── trip.routes.js
│   │   ├── maintenance.routes.js
│   │   ├── fuel.routes.js
│   │   ├── expense.routes.js
│   │   ├── dashboard.routes.js
│   │   └── analytics.routes.js
│   └── server.js               # Express app entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Seeded Users

| Email                      | Password   | Role              |
| -------------------------- | ---------- | ----------------- |
| `alex@transitops.co`       | `demo1234` | Fleet Manager     |
| `dispatcher@transitops.co` | `demo1234` | Dispatcher        |
| `safety@transitops.co`     | `demo1234` | Safety Officer    |
| `finance@transitops.co`    | `demo1234` | Financial Analyst |

---

## RBAC Matrix

| Resource    | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
| ----------- | ------------- | ---------- | -------------- | ----------------- |
| Vehicles    | Full          | Read       | Read           | Read              |
| Drivers     | Full          | Read       | Read           | Read              |
| Trips       | Full          | Full       | Read           | Read              |
| Maintenance | Full          | Read       | Read           | Read              |
| Fuel Logs   | Full          | Read       | Read           | Full              |
| Expenses    | Full          | Read       | Read           | Full              |
| Dashboard   | Read          | Read       | Read           | Read              |
| Analytics   | Read          | Read       | Read           | Read              |
