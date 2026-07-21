# PharmaLink

**A platform to connect medical prescription systems (EPS), patients, and pharmacies through a centralized management system for prescriptions, appointments, reservations, inventory and deliveries.**

---

## Project Overview

PharmaLink is a comprehensive platform designed to streamline the entire process of prescription management across Colombia's healthcare ecosystem. It bridges the gap between:

- **EPS (Entidades Promotoras de Salud)** — Electronic prescription providers that send medical orders
- **Patients** — End-users who need medicines and want to schedule pickups
- **Pharmacies** — Service providers who store and deliver medicines

The platform handles prescription orders, appointment scheduling, medicine reservations, inventory management, and delivery confirmations through an integrated backend API and user-friendly web interface.

### Key Features

- **Prescription Management** — EPS systems can submit medical prescriptions directly via API with `X-API-Key` authentication
- **Smart Reservations** — Patients reserve medicines at pharmacies with available time slots based on working hours
- **Inventory Tracking** — Real-time stock monitoring, reservation holds, and delivery confirmations
- **Multi-tenant Architecture** — Complete data isolation between EPS and pharmacy organizations
- **API Integration** — Support for both demo (internal) and external pharmacy inventory APIs
- **Notifications** — Automatic alerts for orders, reservations, cancellations, and deliveries
- **Audit Trail** — Complete logging of all system actions for compliance and troubleshooting
- **Role-based Access** — Admin, Patient, Pharmacy Operator, and EPS Operator roles with scoped permissions

---

## Authors

This project was developed by a collaborative team:

| Name                                  | Role                                       |
| ------------------------------------- | ------------------------------------------ |
| **Santiago Andres Rodriguez Manzano** | Lead Developer, Architecture & Database    |
| **Joseph David Herreño Theran**       | Frontend Development                       |
| **Mateo Andrés Múnera Opina**         | Frontend Development, UI/UX & Testing      |
| **Daniel Alexander Arciniegas Púa**   | Backend Development & Database             |
| **Felipe Beltrán**                    | Backend Development, API Design & Database |
| **Andrés Felipe Benavides**           | UI/UX Designer                             |


---

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens) + bcrypt password hashing
- **Documentation**: OpenAPI 3.0 (Swagger)
- **Security**: Helmet.js, CORS, rate limiting
- **Logging**: Winston + Morgan

### Frontend
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **JavaScript**: Vanilla ES6+ (no framework)
- **HTTP Client**: Fetch API

### Infrastructure
- **Container**: Docker & Docker Compose
- **Package Manager**: npm

---

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development without Docker)
- PostgreSQL 13+ (or use Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sntiago05/pharma-link.git
   cd pharma-link
   ```

2. **Start the database with Docker**
   ```bash
   docker compose up -d
   ```
   This starts PostgreSQL and automatically:
   - Creates the database schema (01_ddl.sql)
   - Applies all migrations (02_migrations.sql)
   - Loads demo data (03_seed_demo.sql)

3. **Setup and start the backend**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```
   The API will listen on `http://localhost:4000`

4. **In a new terminal, start the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The web app will open on `http://localhost:5173`

### Verify Installation

- **API Health**: Visit `http://localhost:4000/health`
- **API Documentation**: Visit `http://localhost:4000/api/docs` (Swagger UI)
- **Web Application**: Visit `http://localhost:5173`

---

## Demo Accounts

After starting with Docker Compose, you can log in with these accounts. All passwords are `Admin1234`:

| Role | Email | Purpose |
|------|-------|---------|
| **Admin** | `admin@pharmalink.local` | Full system access, manage EPS, pharmacies, medicines |
| **Patient** | `paciente@pharmalink.local` | Create orders, make reservations, track deliveries |
| **Pharmacy** | `farmacia@pharmalink.local` | Manage pharmacy inventory, confirm deliveries |
| **EPS** | `eps@pharmalink.local` | Submit prescription orders, view patient data |

---

## Architecture

### Backend Structure
```
backend/
├── app.js                      Express application setup
├── scripts/                    Database migration and seeding scripts
└── src/
    ├── config/                 Configuration: database, environment, logging
    ├── middleware/             Request processing: auth, validation, rate limiting
    ├── routes/                 HTTP endpoints with validation and documentation
    ├── controllers/            Request/response translation
    ├── services/               Business logic and transactions
    ├── repositories/           Database queries (SQL)
    ├── validators/             Input validation rules
    └── utils/                  Helpers: error handling, response format
```

### Database Structure
```
db/
├── 01_ddl.sql                 Database schema (tables, constraints, indexes)
├── 02_migrations.sql          Schema changes and improvements (idempotent)
└── 03_seed_demo.sql           Demo data for testing (auto-loaded on first run)
```

### Frontend Structure
```
frontend/src/
├── app.js                      Entry point
├── router.js                   Client-side routing with role protection
├── services/                   API calls and data management
│   ├── api.js                 HTTP client wrapper
│   ├── auth.js                Login, register, token management
│   └── session.js             User context and cached data
└── views/                      Page templates
    ├── components.js          Reusable UI components (design system)
    ├── adminView.js           Admin dashboard
    ├── patientRoutesView.js   Patient features
    ├── pharmacyRoutesView.js  Pharmacy features
    └── epsRoutesView.js       EPS integration
```

---

## Core Concepts

### Roles and Permissions

PharmaLink uses role-based access control (RBAC):

- **ADMIN** — Complete system access; can manage all organizations and data
- **PATIENT** — Can create orders, make reservations, view personal data only
- **PHARMACY_OPERATOR** — Can manage only their assigned pharmacy (inventory, deliveries)
- **EPS_OPERATOR** — Can manage only their assigned EPS (submit orders)

All operators are **scoped** to their organization; requests for data outside their scope return 403 Forbidden.

### Authentication Flow

1. **Login** → `POST /api/auth/login` with email and password
2. **Response** → Returns a JWT token (valid for 24 hours)
3. **Protected Requests** → Include `Authorization: Bearer <token>` header
4. **Token Refresh** → Login again when token expires

Passwords are stored as bcrypt hashes (never in plain text).

### Prescription Orders

Orders flow through the system:

1. **Creation** → EPS creates order via API or patient creates via web UI
2. **Pending** → Patient receives notification and can make reservation
3. **Reserved** → Patient books appointment at a pharmacy
4. **Delivered** → Pharmacy confirms pickup/delivery (stock deducted)
5. **Expired** → Automatically closed if past expiration date

Each order can have **multiple reservations** (if cancelled, patient can rebook), but only one can be active at a time.

### Inventory Management

Each pharmacy maintains inventory for each medicine:

- **stock_quantity** — Total units in storage
- **reserved_quantity** — Units promised to patients (hold during reservation)
- **available_quantity** — Can be reserved = stock - reserved

When a patient reserves, stock is held. When they pick up, it is deducted. If they cancel, it is released.

### Appointment Slots

Pharmacies define working hours (open/close time, slot duration, capacity per slot):

- Time is divided into **fixed time blocks** (e.g., 30-minute slots)
- Each block can hold a maximum number of reservations (capacity)
- Patients must book an available slot; arbitrary times are rejected

---

## API Endpoints (Summary)

All endpoints require the `Authorization: Bearer <token>` header (except login/register and EPS integration).

### Authentication
- `POST /api/auth/register` — Create patient account
- `POST /api/auth/login` — Get JWT token

### User & Profile
- `GET /api/me` — Get current user info (role, organization)
- `GET/POST /api/patients/me` — View/update patient profile

### Directory (Public Info)
- `GET /api/eps` — List EPS organizations
- `GET /api/medicines` — List all medicines
- `GET /api/pharmacies` — List pharmacies (patient sees only their EPS's pharmacies)

### Orders
- `GET /api/orders/me` — Patient's orders
- `POST /api/orders` — Create new order
- `GET /api/orders/:orderId/pharmacies` — Pharmacies that can fulfill order
- `GET/POST /api/eps/:epsId/orders` — EPS's orders

### Reservations
- `POST /api/reservations` — Create reservation (book appointment)
- `GET /api/reservations/me` — Patient's reservations
- `DELETE /api/reservations/:id` — Cancel reservation
- `PUT /api/reservations/:id/reschedule` — Change appointment time
- `POST /api/reservations/:id/no-show` — Mark as not attended

### Deliveries
- `GET /api/pharmacies/:id/available-slots?date=YYYY-MM-DD` — Available time slots
- `POST /api/deliveries/:reservationId` — Confirm pickup/delivery

### Inventory
- `GET /api/inventory/:pharmacyId` — View pharmacy inventory
- `POST /api/inventory/:pharmacyId/adjustments` — Add/remove stock

### Dashboards
- `GET /api/dashboards/pharmacy/:pharmacyId` — Pharmacy statistics
- `GET /api/dashboards/eps/:epsId` — EPS statistics

### Notifications
- `GET /api/notifications` — User's notifications
- `GET /api/notifications/unread-count` — Unread count
- `PATCH /api/notifications/:id/read` — Mark as read

### Integration
- `POST /api/integrations/eps/orders` — EPS submits orders (uses `X-API-Key` header, not JWT)

### Admin Only
- `GET /api/audit-logs` — View system audit log
- `GET/POST /api/catalog/*` — Manage system catalogs (EPS, pharmacies, medicines, working hours)

For complete API documentation with request/response examples, visit `http://localhost:4000/api/docs` when the API is running.

---

## Integration with External Systems

### EPS Integration (Inbound)

External EPS systems can submit prescriptions to PharmaLink:

**Authentication**: `X-API-Key` header (not JWT)

**Example Request**:
```bash
curl -X POST http://localhost:4000/api/integrations/eps/orders \
  -H "Content-Type: application/json" \
  -H "X-API-Key: eps-demo-key" \
  -d '{
    "orderNumber": "EPS-2026-001",
    "patientDocument": "1020304050",
    "issueDate": "2026-07-20",
    "expirationDate": "2026-08-20",
    "details": [
      {"medicineCode": "MED-001", "quantity": 2}
    ]
  }'
```

For detailed examples, see [API_INTEGRATION_EXAMPLES.md](docs/API_INTEGRATION_EXAMPLES.md).

### Pharmacy API Integration (Outbound)

PharmaLink can consume external pharmacy inventory APIs. Each pharmacy can configure:
- `inventory_api_url` — The pharmacy's API endpoint
- `api_key` — Bearer token for authentication

PharmaLink calls the pharmacy API to:
1. Check medicine availability
2. Reserve medicines for time slots
3. Confirm deliveries

**Demo Mode**: Pharmacies use `internal://inventory` (no external API calls, all responses are simulated).

**Production Mode**: Pharmacies use real URLs (e.g., `https://pharmacy.com/api/inventory`) and real API keys.

For testing with a mock pharmacy server, see [INTEGRATION_TESTING.md](docs/INTEGRATION_TESTING.md).

---

## Configuration

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

**Required:**
- `DB_HOST` — PostgreSQL server hostname
- `DB_PORT` — PostgreSQL port (default 5432)
- `DB_USER` — Database user
- `DB_PASSWORD` — Database password
- `DB_NAME` — Database name
- `JWT_SECRET` — Long random string for signing tokens (e.g., `openssl rand -base64 32`)

**Optional (defaults provided):**
- `NODE_ENV` — `development` or `production`
- `PORT` — API port (default 4000)
- `APP_TIMEZONE` — Timezone for date calculations (default `America/Bogota`)
- `CORS_ORIGINS` — Allowed origins for CORS (default `*` for development)
- `AUTH_RATE_LIMIT_MAX` — Login attempts per 15 minutes (default 10)

---

## Common Tasks

### Start Services
```bash
# Start database (runs migrations and seed automatically)
docker compose up -d

# Start backend API
cd backend && npm install && npm run dev

# Start frontend (in another terminal)
cd frontend && npm install && npm run dev
```

### Seed Demo Data
Demo data is loaded automatically on first Docker run. To reload manually:
```bash
cd backend
npm run db:seed:demo
```

### Run Database Migrations
On an existing database, apply pending migrations:
```bash
cd backend
npm run db:migrate
```

### View API Documentation
Open `http://localhost:4000/api/docs` in your browser (requires API running).

### Check Logs
```bash
# Backend logs (combined.log and error.log in backend/logs/)
tail -f backend/logs/combined.log

# Docker Postgres logs
docker compose logs -f postgres
```

### Reset Everything
```bash
# Stop and remove all containers and volumes (CAUTION: Deletes all data)
docker compose down -v

# Restart fresh
docker compose up -d
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "id": 42,
    "name": "Example"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Something went wrong",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid"
    }
  ]
}
```

### HTTP Status Codes
- `200 OK` — Request successful
- `201 Created` — Resource created
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing or invalid token
- `403 Forbidden` — Permission denied (e.g., accessing another pharmacy's data)
- `404 Not Found` — Resource not found
- `409 Conflict` — Business rule violation (e.g., order already delivered)
- `422 Unprocessable Entity` — Validation failed (e.g., past date)
- `429 Too Many Requests` — Rate limit exceeded
- `500 Internal Server Error` — Server error

---

## Security

PharmaLink includes multiple security layers:

- **Helmet.js** — Sets HTTP security headers
- **CORS** — Configurable cross-origin requests
- **Rate Limiting** — Stricter limits on auth endpoints
- **Input Validation** — All inputs sanitized and validated
- **Password Hashing** — bcrypt with salt
- **API Keys** — Stored as SHA-256 hashes (never recoverable)
- **JWT Tokens** — Signed with secret, expire after 24 hours
- **Body Size Limit** — Maximum 100 KB to prevent abuse
- **Role-based Authorization** — Every endpoint checks user permissions
- **Audit Logging** — All actions recorded with user, timestamp, IP address

**Important**: Never commit `.env` files or credentials to version control.

---

## Development

### Project Structure

```
pharma-link/
├── backend/                    Node.js/Express API
│   ├── .env.example           Environment template
│   ├── src/                   Application code
│   └── scripts/               Utility scripts
├── frontend/                   Web UI (Vite + Vanilla JS)
│   └── src/                   Application code
├── db/                        Database schemas and seeds
│   ├── 01_ddl.sql            Initial schema
│   ├── 02_migrations.sql      Schema updates
│   └── 03_seed_demo.sql       Demo data
├── docs/                      Documentation
│   ├── API_INTEGRATION_EXAMPLES.md
│   ├── INTEGRATION_TESTING.md
│   └── examples/              Code examples
└── docker-compose.yml         Docker configuration
```

### Running Tests

Backend integration tests with mock pharmacy server:
```bash
# Terminal 1: Start PharmaLink
docker compose up
cd backend
npm run dev

# Terminal 2: Start mock pharmacy
node docs/examples/mock-pharmacy-server.js

# Terminal 3: Run demo tests
bash docs/examples/eps-api-client.sh
```

For detailed testing instructions, see [INTEGRATION_TESTING.md](docs/INTEGRATION_TESTING.md).

### Code Style

- **Backend**: Follow Express.js conventions; use async/await
- **Frontend**: Vanilla ES6+ with template literals; escape all user input with `escapeHtml()`
- **Database**: Use prepared statements (parameterized queries) to prevent SQL injection
- **Comments**: Only comment complex logic; code should be self-documenting

---

## Troubleshooting

### "Too many requests" Error

You are hitting rate limits. The API limits login attempts to 10 per 15 minutes per IP address. Wait 15 minutes or adjust `AUTH_RATE_LIMIT_MAX` in `.env`.

### "CORS error" When Calling API from Frontend

Add the frontend's origin to `CORS_ORIGINS` in `backend/.env`:
```
CORS_ORIGINS=http://localhost:5173
```

### Database Connection Failed

Ensure PostgreSQL is running:
```bash
docker compose ps

# If postgres is not running:
docker compose up -d
```

Check credentials in `backend/.env` match your database.

### Frontend Shows "Cannot reach API"

Verify:
1. Backend is running: `curl http://localhost:4000/health`
2. Frontend's `VITE_API_BASE_URL` env variable is correct (should be `http://localhost:4000/api` for local development)
3. CORS is configured correctly in backend `.env`

### Demo Data Not Loaded

Demo data loads automatically on first Docker run (fresh volume). For an existing database:
```bash
cd backend
npm run db:seed:demo
```

---

## Roadmap & Future Improvements

Potential enhancements:
- Mobile application (React Native or Flutter)
- Advanced reporting and analytics
- Machine learning for medicine demand prediction
- Blockchain-based audit trail
- Multi-language support
- SMS/Email notifications integration
- Third-party payment processing
- Real-time inventory sync with pharmacy systems

---

## License

This project is proprietary. All rights reserved.

---

## Support & Contact

For questions, issues, or contributions, please contact the development team or create an issue in the repository.

**Repository**: https://github.com/sntiago05/pharma-link

---

## Documentation Index

- [API Integration Examples](docs/API_INTEGRATION_EXAMPLES.md) — EPS and pharmacy API patterns with code examples
- [Integration Testing Guide](docs/INTEGRATION_TESTING.md) — Testing demo and production modes
- [Swagger API Docs](http://localhost:4000/api/docs) — Interactive endpoint documentation (when API is running)

---

**Version**: 1.0.0  
**Last Updated**: July 2026  
**Status**: Production Ready
