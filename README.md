# PharmaLink

Backend API for medical orders, reservations and pharmacy deliveries.

## Local setup

1. Start PostgreSQL from the project root:

   ```bash
   docker compose up -d
   ```

2. In `backend`, copy `.env.example` to `.env` and set the local values.
3. Install dependencies, seed the roles and start the API:

   ```bash
   cd backend
   npm install
   npm run db:seed
   npm run dev
   ```

The API listens on `http://localhost:4000` by default. Use `GET /health` to verify the API and database connection.

## Authentication

- `POST /api/auth/register` creates a patient user. Body: `fullName`, `email`, `password` (minimum 8 characters).
- `POST /api/auth/login` returns a JWT. Body: `email`, `password`.

Set a unique, long `JWT_SECRET` in production. Passwords are stored with bcrypt hashes.

## Protected API

Send `Authorization: Bearer <token>` for protected endpoints. The API includes catalog endpoints (`/api/catalog`), patient profile (`/api/patients/me`), medical orders (`/api/orders`) and reservations (`/api/reservations`).

Administrative catalog endpoints include EPS, pharmacies, medicines, EPS-pharmacy associations and working hours. Delivery confirmation is available at `POST /api/deliveries/:reservationId`.

## Inventory

Pharmacy staff can list stock with `GET /api/inventory/:pharmacyId` and register an entry or adjustment with `POST /api/inventory/:pharmacyId/adjustments`. A reservation holds the required stock; cancelling releases it and confirming delivery deducts it.
