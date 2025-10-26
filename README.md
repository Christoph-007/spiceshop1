# SpiceShop2 – Run frontend + backend from one server

This project serves the frontend static files and the REST API from a single Express server.

## Prerequisites
- Node.js 18+ (tested on Node 20)
- npm
- (Optional) MongoDB connection string

## Configuration
Copy the example env file and set your secrets/ports as needed:

```
cp .env.example .env
```

Edit `.env`:
- `PORT` – server port (defaults to 5000 if unset)
- `MONGO_URI` – your MongoDB connection string (optional; server runs without DB if omitted)
- `JWT_SECRET` – any random string for signing tokens

## Install
```
npm install
```

## Start
- Standard (port 5000):
```
npm start
```
- Dev (nodemon, port 5050):
```
npm run dev
```

If port 5000 is already in use on your machine, prefer `npm run dev` which runs on 5050.

## Open in the browser
- Frontend root: http://localhost:5000/ (or http://localhost:5050/ in dev)
- Login page: /login.html
- Customer page: /customer.html
- Merchant page: /merchant.html
- Admin page: /admin.html

## API base URL (frontend)
The frontend now uses a relative base path and automatically calls the backend at the same origin:
- `API_BASE_URL = '/api'`

So you can deploy the server anywhere without changing hard‑coded hosts.

## Health check
```
curl http://localhost:5000/api/health
# or
curl http://localhost:5050/api/health
```

## Notes
- If `MONGO_URI` is not set, the server starts without a DB connection (only static and open APIs will work).
- To enable full functionality (auth, products, orders, etc.), you must provide a working MongoDB URI and JWT secret.
