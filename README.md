# PharmaLink

Platform connecting EPS, patients and pharmacies: medical orders, appointment
slots, reservations, inventory and deliveries. Express + PostgreSQL API with a
vanilla-JS + Vite + Tailwind front end.

## Local setup

1. Start PostgreSQL from the project root:

   ```bash
   docker compose up -d
   ```

2. In `backend`, copy `.env.example` to `.env` and set the local values.
3. Install dependencies, apply migrations and start the API:

   ```bash
   cd backend
   npm install
   npm run db:migrate
   npm run dev
   ```

4. In another terminal, start the front end:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The API listens on `http://localhost:4000` and the web app on
`http://localhost:5173`. `GET /health` verifies the API and the database
connection.

The front end reads `VITE_API_BASE_URL` and falls back to
`http://localhost:4000/api`. If you serve the API from another origin, set that
variable *and* add the front end's origin to `CORS_ORIGINS` in `backend/.env`.

### Demo data

Registration only ever creates patients, and there is no UI to create operators
or link them to an organisation, so testing the other roles needs a seed:

```bash
cd backend
npm run db:seed:demo
```

It is idempotent and never deletes anything. Password for all four accounts is
`Admin1234`:

| Role | Email | Sees |
| --- | --- | --- |
| Admin | `admin@pharmalink.local` | Everything |
| Patient | `paciente@pharmalink.local` | 3 orders (one already expired) |
| Pharmacy | `farmacia@pharmalink.local` | Farmacia Central Demo only |
| EPS | `eps@pharmalink.local` | EPS Demo |

It also adds a second pharmacy (Farmacia Norte Demo) that the operator is *not*
assigned to, so the 403 isolation is visible, and leaves MED-003 at 5 units in
Farmacia Central to trigger the low-stock alert.

`scripts/seed-demo.sql` lives outside `db/`, so neither the Docker entrypoint nor
`npm run db:migrate` will ever load these accounts into a real database.

### Test flow

1. As **EPS**, issue an order for document `1020304050` (the demo patient).
2. As **Patient**, open *Reservar*: pick the order, a pharmacy (only the ones
   that can serve it in full are selectable), a date and a slot.
3. As **Pharmacy**, confirm the delivery in *Entregas*. The stock drops and the
   order closes as `DELIVERED`.

To do this from scratch instead: an admin must register the EPS, the pharmacies
and the medicines, associate each EPS with its pharmacies (**Farmacias →
Asociar EPS y farmacia** — without that link a patient cannot reserve anywhere),
and the pharmacy must set its working hours (**Perfil**), which define the
appointment grid.

> On a brand-new Docker volume, `db/01_ddl.sql` and the additive migrations run
> automatically. `npm run db:migrate` is what brings an **existing** database up
> to date; it is idempotent, so running it twice is safe.

## Documentation

Interactive API docs (OpenAPI 3.0) at **`http://localhost:4000/api/docs`**; the
raw spec is at `/api/docs.json`. Use the *Authorize* button to paste a JWT.

## Architecture

```
backend/
  app.js                  Express wiring: security, logging, routes, error handling
  scripts/                migrate.js, seed-roles.js
  src/
    config/               env, db, cors, roles, logger, swagger
    routes/               HTTP routing + validation + authorization + @openapi docs
    controllers/          HTTP <-> service translation only
    services/             business rules and transactions
    repositories/         SQL
    middleware/           auth, roles, validation, pharmacy/EPS scoping, audit, errors, rate limit
    validators/           express-validator rules per endpoint
    utils/                ApiError, response envelope, asyncHandler, transactions, dates
db/
  01_ddl.sql              from-scratch schema (Docker entrypoint, fresh volume only)
  02_migrations.sql       additive, idempotent migrations (02..14 merged)

frontend/
  src/
    app.js                entry point
    router.js             role-guarded client-side routing
    services/
      api.js              fetch client: bearer token, envelope, 401 handling
      session.js          user + token + cached /me context
      auth.js             login, register, loadContext
      roles.js            role names, home route and access rules
      patient.js | pharmacy.js | eps.js | admin.js | notifications.js
    views/
      components.js       design system (roleShell, statCard, tables, states...)
      shell.js            shared panel chrome (user card, logout, quick links)
      patientRoutesView.js | pharmacyRoutesView.js
      epsRoutesView.js     | adminRoutesView.js
      loginView.js | registerView.js | ladingpage.js | welcomePage.js
```

Views build HTML with template literals, so any value coming from the API must
go through `escapeHtml` from `components.js`.

## Response format

Successful responses:

```json
{ "success": true, "message": "...", "data": {} }
```

Errors:

```json
{ "success": false, "message": "...", "errors": [] }
```

`POST /api/auth/login` and `/register` additionally repeat `token` / `user` at the
top level, and `/health` repeats `status` / `database`, for backwards
compatibility with existing clients. Prefer reading `data`.

## Authentication and roles

- `POST /api/auth/register` creates a patient user. Body: `fullName`, `email`,
  `password` (minimum 8 characters).
- `POST /api/auth/login` returns a JWT. Body: `email`, `password`.

Send `Authorization: Bearer <token>` on protected endpoints. Set a unique, long
`JWT_SECRET`; the API refuses to start without one. Passwords are bcrypt hashes.

| Role | Scope |
| --- | --- |
| `ADMIN` | Everything. Bypasses pharmacy/EPS scoping. |
| `PATIENT` | Own profile, orders, reservations and notifications. |
| `PHARMACY_OPERATOR` | Only the pharmacy they are linked to via `user_pharmacies`. |
| `EPS_OPERATOR` | Only the EPS they are linked to via `user_eps`. |

Operators are scoped to their own organisation: requesting another pharmacy's or
EPS's data returns 403.

## Endpoints

| Area | Endpoint |
| --- | --- |
| Session | `GET /api/me` — role plus the pharmacy / EPS / patient it is attached to |
| Directory | `GET /api/eps`, `GET /api/medicines`, `GET /api/pharmacies` (public fields; a patient only sees their EPS's pharmacies) |
| Patient profile | `GET/POST /api/patients/me` |
| Orders | `GET /api/orders/me`, `POST /api/orders`, `GET /api/orders/:orderId/pharmacies` |
| EPS orders | `GET/POST /api/eps/:epsId/orders` |
| Availability | `GET /api/pharmacies/:id/available-slots?date=YYYY-MM-DD` |
| Reservations | `POST /api/reservations`, `GET /api/reservations/me`, `DELETE /api/reservations/:id`, `PUT /api/reservations/:id/reschedule`, `POST /api/reservations/:id/no-show` |
| Deliveries | `POST /api/deliveries/:reservationId` |
| Inventory | `GET /api/inventory/:pharmacyId`, `POST /api/inventory/:pharmacyId/adjustments` |
| Dashboards | `GET /api/dashboards/pharmacy/:pharmacyId`, `GET /api/dashboards/eps/:epsId` |
| Notifications | `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` |
| Audit (ADMIN) | `GET /api/audit-logs` |
| Catalog (ADMIN) | `/api/catalog/{eps,pharmacies,medicines}`, `/api/catalog/eps-pharmacies`, `/api/catalog/working-hours` |
| EPS integration | `POST /api/integrations/eps/orders` (`X-API-Key`) |

`GET /api/reservations/pharmacy/:pharmacyId/availability` still works and returns
the same payload as the `available-slots` route above.

## Appointment slots

Each pharmacy has working hours (`POST /api/catalog/working-hours`): an opening
and closing time, a `slotDuration` in minutes and a `capacityPerSlot`. The day is
divided into fixed blocks from the opening time, and a block disappears from
availability once it holds `capacityPerSlot` reservations.

`startTime` on a reservation must match a slot returned by the availability
endpoint — arbitrary times are rejected, because slot capacity is counted per
start time.

## Business rules

| Rule | Behaviour |
| --- | --- |
| Expired order | Cannot be reserved (400). |
| Delivered order | Cannot be reserved again (409). |
| Order already reserved | Must be cancelled first (409). |
| Unknown or unstocked medicine | Rejected, naming the medicine (409). |
| Insufficient stock | Rejected with available vs required (409). |
| Cancellations | Maximum 3 per order. |
| Reschedules | Maximum 2 per order. |
| Past dates | Rejected (422). |
| Outside working hours | Rejected (400). |

Orders past their expiration date are swept hourly: their reservations are
expired, the held stock is released and the patient is notified.

## Inventory

`stock_quantity` is physical stock; `reserved_quantity` is what is promised to
patients; `available_quantity` is the difference and is what can still be
reserved. A reservation holds stock, cancelling or a no-show releases it, and
confirming delivery deducts it. Every change is appended to
`inventory_movements`. An adjustment that would push stock below what is already
reserved is rejected.

## Notifications

Created automatically when a reservation is made, cancelled, rescheduled,
delivered or marked no-show, and when an order expires. The patient is always
notified; operators of the pharmacy involved are notified too. Notifications are
written in the same transaction as the event that caused them.

## Auditing

Creates, updates, deletes, delivery confirmations, reservation cancellations and
inventory changes are recorded in `audit_logs` with the acting user, action,
table, record id, IP, endpoint, HTTP method, status code and timestamp. Only
successful requests are recorded; failures are captured by the error logs.

## Security

Helmet, configurable CORS (`CORS_ORIGINS`; `*` when unset), rate limiting
(stricter on `/api/auth`), request sanitisation, a 100 kB body cap, and
role-plus-tenant authorization on every route. Secrets live in `.env`, which is
git-ignored. API keys are stored as SHA-256 digests and are never returned by the
API.

## Logging

Winston + Morgan. Human-readable in development, JSON in production. Requests,
response times and errors go to the console, `logs/error.log` and
`logs/combined.log` (git-ignored). Unexpected errors are logged with a stack but
answered with a generic message, so internals never reach clients.

## Environment variables

See `backend/.env.example`. Required: `DB_*` and `JWT_SECRET`. Everything else has
a safe default, including `APP_TIMEZONE` (default `America/Bogota`), which
determines what "today" means for past-date checks and dashboards.
