# PharmaLink

Plataforma que conecta sistemas de prescripciones médicas (EPS), pacientes y farmacias para gestionar órdenes, citas, reservas, inventario y entregas.

**[English Version →](README_EN.md)**

## Descripción

PharmaLink es una solución integral diseñada para optimizar el proceso de gestión de prescripciones en el ecosistema de salud colombiano. Integra:

- **EPS (Entidades Promotoras de Salud)** — Proveedores de prescripciones electrónicas que envían órdenes médicas
- **Pacientes** — Usuarios finales que necesitan medicinas y desean agendar entregas
- **Farmacias** — Proveedores de servicio que almacenan y entregan medicinas

### Características Principales

- ✅ Gestión de órdenes médicas con API para EPS
- ✅ Reservas inteligentes con horarios disponibles
- ✅ Seguimiento de inventario en tiempo real
- ✅ Arquitectura multi-tenant (aislamiento de datos por organización)
- ✅ Integración con APIs externas de farmacias
- ✅ Sistema de notificaciones automáticas
- ✅ Auditoría completa de todas las acciones
- ✅ Control de acceso basado en roles

## Autores

Este proyecto fue desarrollado por:

| Nombre | Rol |
|--------|-----|
| **Santiago Andres Rodriguez Manzano** | Arquitecto Principal & Desarrollo |
| **Joseph David Herreño Theran** | Backend & Diseño de API |
| **Mateo Andrés Múnera Opina** | Frontend & UI/UX |
| **Daniel Alexander Arciniegas Púa** | Base de Datos |
| **Felipe Beltrán** | Integración & Testing |

## Stack Técnico

- **Backend**: Node.js + Express.js
- **Base de Datos**: PostgreSQL
- **Frontend**: Vanilla JS + Vite + Tailwind CSS
- **Contenedores**: Docker & Docker Compose
- **Autenticación**: JWT + bcrypt
- **Documentación**: OpenAPI 3.0 (Swagger)
- **Seguridad**: Helmet.js, CORS, rate limiting, auditoría

## Instalación Rápida

### 1. Inicia la base de datos (auto-ejecuta migraciones y seeds)

```bash
docker compose up -d
```

### 2. Inicia el backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API en `http://localhost:4000` | Documentación en `http://localhost:4000/api/docs`

### 3. Inicia el frontend (otra terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend en `http://localhost:5173`

## Cuentas de Demo

Todas tienen contraseña `Admin1234`:

| Rol | Email | Acceso |
| --- | --- | --- |
| Admin | `admin@pharmalink.local` | Sistema completo |
| Paciente | `paciente@pharmalink.local` | 3 órdenes, reservas |
| Farmacia | `farmacia@pharmalink.local` | Farmacia Central Demo |
| EPS | `eps@pharmalink.local` | EPS Demo |

## Flujo de Prueba

1. Como **EPS**, emite una orden para el documento `1020304050` (paciente demo)
2. Como **Paciente**, ve *Reservar*: selecciona la orden, una farmacia, fecha y horario
3. Como **Farmacia**, confirma la entrega en *Entregas* → stock se reduce, orden cierra

## Documentación

- **[README en Inglés →](README_EN.md)** — Documentación técnica completa en inglés (B1)
- **[API Integration Examples](docs/API_INTEGRATION_EXAMPLES.md)** — Patrones EPS y APIs externas
- **[Integration Testing Guide](docs/INTEGRATION_TESTING.md)** — Testing demo y producción
- **[Swagger / OpenAPI](http://localhost:4000/api/docs)** — Documentación interactiva

## Arquitectura

```
backend/                        Node.js + Express API
├── src/config                  Configuración: base de datos, logger, swagger
├── src/middleware              Autenticación, validación, rate limiting
├── src/routes                  Endpoints HTTP
├── src/controllers             Traducción request/response
├── src/services                Lógica de negocio
├── src/repositories            Consultas SQL
└── src/utils                   Utilidades: errores, respuestas

frontend/                       Vanilla JS + Vite + Tailwind
├── src/services/               API client, autenticación, sesión
└── src/views/                  Templates HTML, componentes

db/
├── 01_ddl.sql                 Schema inicial (tablas, índices, constraints)
├── 02_migrations.sql          Migraciones aditivas (idempotentes)
└── 03_seed_demo.sql           Datos demo (auto-cargados en primer run)
```

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
