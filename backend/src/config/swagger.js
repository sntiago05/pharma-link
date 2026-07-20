import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

/**
 * OpenAPI 3.0 definition.
 *
 * Shared schemas, responses and parameters live here; per-endpoint documentation
 * is written as `@openapi` JSDoc blocks in the route files, so the docs sit next
 * to the routes they describe and are harder to leave behind.
 */

const errorResponse = (description, example) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: { success: false, message: example, errors: [] },
    },
  },
});

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'PharmaLink API',
    version: '1.1.0',
    description: [
      'API that connects EPS, patients and pharmacies: medical orders, appointment',
      'slots, reservations, inventory and deliveries.',
      '',
      '### Response envelope',
      'Successful responses are `{ success: true, message, data }`. Errors are',
      '`{ success: false, message, errors }`.',
      '',
      '`POST /auth/login` and `POST /auth/register` additionally repeat `token` /',
      '`user` at the top level for backwards compatibility with existing clients.',
      '',
      '### Authentication',
      'Most endpoints need `Authorization: Bearer <JWT>` from `POST /auth/login`.',
      'The EPS integration endpoint uses an `X-API-Key` header instead.',
    ].join('\n'),
  },
  servers: [{ url: `http://localhost:${env.port}/api`, description: 'Local development' }],
  tags: [
    { name: 'Auth', description: 'Registration and login' },
    { name: 'Session', description: 'Who am I and what am I attached to' },
    { name: 'Directory', description: 'Read-only catalog for end users' },
    { name: 'Patients', description: 'Patient profile' },
    { name: 'Orders', description: 'Medical orders' },
    { name: 'EPS', description: 'Order issuing by an EPS operator' },
    { name: 'Pharmacies', description: 'Pharmacy directory and availability' },
    { name: 'Reservations', description: 'Booking, cancelling and rescheduling' },
    { name: 'Deliveries', description: 'Delivery confirmation' },
    { name: 'Inventory', description: 'Pharmacy stock' },
    { name: 'Catalog', description: 'EPS, pharmacies, medicines (admin)' },
    { name: 'Dashboards', description: 'Pharmacy and EPS statistics' },
    { name: 'Notifications', description: 'User notifications' },
    { name: 'Audit', description: 'Audit trail (admin)' },
    { name: 'Integrations', description: 'Inbound EPS API' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT issued by `POST /auth/login`.',
      },
      epsApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key issued to a partner EPS.',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'OK' },
          data: { nullable: true },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed.' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'A valid email is required.' },
                location: { type: 'string', example: 'body' },
              },
            },
          },
        },
      },
      Role: {
        type: 'string',
        enum: ['ADMIN', 'PATIENT', 'PHARMACY_OPERATOR', 'EPS_OPERATOR'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          fullName: { type: 'string', example: 'Ana Gómez' },
          email: { type: 'string', format: 'email', example: 'ana@example.com' },
          role: { $ref: '#/components/schemas/Role' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password'],
        properties: {
          fullName: { type: 'string', minLength: 3, maxLength: 150, example: 'Ana Gómez' },
          email: { type: 'string', format: 'email', example: 'ana@example.com' },
          password: { type: 'string', minLength: 8, format: 'password', example: 'Secret1234' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@pharmalink.local' },
          password: { type: 'string', format: 'password', example: 'Admin1234' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful.' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: { $ref: '#/components/schemas/User' },
            },
          },
          token: { type: 'string', description: 'Legacy top-level copy of `data.token`.' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      PatientProfile: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          eps_id: { type: 'integer' },
          document: { type: 'string', example: '1020304050' },
          phone: { type: 'string', nullable: true, example: '3001234567' },
        },
      },
      OrderStatus: {
        type: 'string',
        enum: ['PENDING', 'RESERVED', 'DELIVERED', 'CANCELLED', 'EXPIRED'],
      },
      MedicalOrder: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          patient_id: { type: 'integer' },
          eps_id: { type: 'integer' },
          order_number: { type: 'string', example: 'ORD-2026-001' },
          issue_date: { type: 'string', format: 'date' },
          expiration_date: { type: 'string', format: 'date' },
          status: { $ref: '#/components/schemas/OrderStatus' },
          cancellation_count: { type: 'integer', example: 0 },
          reschedule_count: { type: 'integer', example: 0 },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['orderNumber', 'issueDate', 'expirationDate', 'details'],
        properties: {
          orderNumber: { type: 'string', example: 'ORD-2026-001' },
          issueDate: { type: 'string', format: 'date', example: '2026-07-15' },
          expirationDate: { type: 'string', format: 'date', example: '2026-08-15' },
          details: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['medicineId', 'quantity'],
              properties: {
                medicineId: { type: 'integer', example: 1 },
                quantity: { type: 'integer', minimum: 1, example: 2 },
              },
            },
          },
        },
      },
      Slot: {
        type: 'object',
        properties: {
          startTime: { type: 'string', example: '08:00' },
          endTime: { type: 'string', example: '08:30' },
          availableCapacity: { type: 'integer', example: 3 },
        },
      },
      ReservationStatus: {
        type: 'string',
        enum: ['RESERVED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'EXPIRED'],
      },
      Reservation: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          order_id: { type: 'integer' },
          pharmacy_id: { type: 'integer' },
          reservation_date: { type: 'string', format: 'date' },
          start_time: { type: 'string', example: '08:00:00' },
          end_time: { type: 'string', example: '08:30:00' },
          status: { $ref: '#/components/schemas/ReservationStatus' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateReservationRequest: {
        type: 'object',
        required: ['orderId', 'pharmacyId', 'reservationDate', 'startTime', 'endTime'],
        properties: {
          orderId: { type: 'integer', example: 1 },
          pharmacyId: { type: 'integer', example: 1 },
          reservationDate: { type: 'string', format: 'date', example: '2026-07-20' },
          startTime: {
            type: 'string',
            example: '08:00',
            description: 'Must match a slot returned by the availability endpoint.',
          },
          endTime: { type: 'string', example: '08:30' },
        },
      },
      RescheduleReservationRequest: {
        type: 'object',
        required: ['reservationDate', 'startTime', 'endTime'],
        properties: {
          reservationDate: { type: 'string', format: 'date', example: '2026-07-21' },
          startTime: { type: 'string', example: '09:00' },
          endTime: { type: 'string', example: '09:30' },
        },
      },
      Delivery: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          reservation_id: { type: 'integer' },
          delivered_at: { type: 'string', format: 'date-time' },
          delivered_by: { type: 'string' },
        },
      },
      InventoryItem: {
        type: 'object',
        properties: {
          pharmacy_id: { type: 'integer' },
          medicine_id: { type: 'integer' },
          code: { type: 'string', example: 'MED-001' },
          name: { type: 'string', example: 'Acetaminofén 500 mg' },
          stock_quantity: { type: 'integer', example: 200 },
          reserved_quantity: { type: 'integer', example: 5 },
          available_quantity: { type: 'integer', example: 195 },
        },
      },
      AdjustInventoryRequest: {
        type: 'object',
        required: ['medicineId', 'quantity'],
        properties: {
          medicineId: { type: 'integer', example: 1 },
          quantity: {
            type: 'integer',
            example: 50,
            description: 'Signed delta. Positive adds stock, negative removes it. Cannot be 0.',
          },
          movementType: { type: 'string', enum: ['IN', 'ADJUSTMENT'], default: 'ADJUSTMENT' },
        },
      },
      WorkingHoursRequest: {
        type: 'object',
        required: ['pharmacyId', 'openingTime', 'closingTime', 'slotDuration', 'capacityPerSlot'],
        properties: {
          pharmacyId: { type: 'integer', example: 1 },
          openingTime: { type: 'string', example: '08:00' },
          closingTime: { type: 'string', example: '17:00' },
          slotDuration: { type: 'integer', minimum: 5, maximum: 480, example: 30 },
          capacityPerSlot: { type: 'integer', minimum: 1, example: 3 },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          type: {
            type: 'string',
            enum: [
              'RESERVATION_CREATED', 'RESERVATION_CANCELLED', 'RESERVATION_RESCHEDULED',
              'RESERVATION_DELIVERED', 'RESERVATION_NO_SHOW', 'ORDER_EXPIRED',
            ],
          },
          title: { type: 'string', example: 'Reserva confirmada' },
          message: { type: 'string' },
          order_id: { type: 'integer', nullable: true },
          reservation_id: { type: 'integer', nullable: true },
          read_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      PharmacyDashboard: {
        type: 'object',
        properties: {
          pharmacyId: { type: 'integer' },
          date: { type: 'string', format: 'date' },
          lowStockThreshold: { type: 'integer', example: 10 },
          reservations: {
            type: 'object',
            properties: {
              pending: { type: 'integer' },
              today: { type: 'integer' },
              pendingToday: { type: 'integer' },
              cancellations: { type: 'integer' },
              cancellationsToday: { type: 'integer' },
              noShows: { type: 'integer' },
              completed: { type: 'integer' },
              total: { type: 'integer' },
            },
          },
          deliveries: {
            type: 'object',
            properties: { today: { type: 'integer' }, total: { type: 'integer' } },
          },
          inventory: {
            type: 'object',
            properties: {
              trackedMedicines: { type: 'integer' },
              lowStock: { type: 'integer' },
              outOfStock: { type: 'integer' },
              fullyReserved: { type: 'integer' },
              totalUnits: { type: 'integer' },
              reservedUnits: { type: 'integer' },
              availableUnits: { type: 'integer' },
            },
          },
          stockAlerts: { type: 'array', items: { type: 'object' } },
        },
      },
      EpsDashboard: {
        type: 'object',
        properties: {
          epsId: { type: 'integer' },
          date: { type: 'string', format: 'date' },
          orders: {
            type: 'object',
            properties: {
              created: { type: 'integer' },
              createdToday: { type: 'integer' },
              pending: { type: 'integer' },
              reserved: { type: 'integer' },
              delivered: { type: 'integer' },
              cancelled: { type: 'integer' },
              expired: { type: 'integer' },
            },
          },
          patients: {
            type: 'object',
            properties: { total: { type: 'integer' }, served: { type: 'integer' } },
          },
          pharmacies: { type: 'array', items: { type: 'object' } },
        },
      },
      EpsOrderRequest: {
        type: 'object',
        required: ['orderNumber', 'patientDocument', 'issueDate', 'expirationDate', 'details'],
        properties: {
          orderNumber: { type: 'string', example: 'EPS-2026-777' },
          patientDocument: { type: 'string', example: '1020304050' },
          patientFullName: {
            type: 'string',
            description: 'Required only when the patient is not yet enrolled.',
          },
          patientEmail: {
            type: 'string',
            format: 'email',
            description: 'Required only when the patient is not yet enrolled.',
          },
          patientPhone: { type: 'string', nullable: true },
          issueDate: { type: 'string', format: 'date' },
          expirationDate: { type: 'string', format: 'date' },
          details: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['medicineCode', 'quantity'],
              properties: {
                medicineCode: { type: 'string', example: 'MED-001' },
                quantity: { type: 'integer', minimum: 1, example: 2 },
              },
            },
          },
        },
      },
    },
    parameters: {
      LimitParam: {
        in: 'query', name: 'limit',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        description: 'Maximum rows to return.',
      },
      OffsetParam: {
        in: 'query', name: 'offset',
        schema: { type: 'integer', minimum: 0, default: 0 },
        description: 'Rows to skip.',
      },
      DateQueryParam: {
        in: 'query', name: 'date', required: true,
        schema: { type: 'string', format: 'date' },
        example: '2026-07-20',
        description: 'Target date (YYYY-MM-DD).',
      },
    },
    responses: {
      BadRequest: errorResponse('Invalid request or broken business rule.', 'Reservation is outside working hours.'),
      Unauthorized: errorResponse('Missing or invalid credentials.', 'Authentication token required.'),
      Forbidden: errorResponse('Authenticated but not allowed.', 'Insufficient permissions.'),
      NotFound: errorResponse('Resource does not exist.', 'Record not found.'),
      Conflict: errorResponse('Conflicts with the current state.', 'No remaining capacity for this time slot.'),
      ValidationError: {
        description: 'Request failed field validation.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Validation failed.',
              errors: [{ field: 'reservationDate', message: 'reservationDate must use the YYYY-MM-DD format.', location: 'body' }],
            },
          },
        },
      },
      TooManyRequests: errorResponse('Rate limit exceeded.', 'Too many requests. Please try again later.'),
      ServerError: errorResponse('Unexpected server error.', 'Internal server error'),
    },
  },
  // Applied to every operation unless overridden (e.g. login, EPS integration).
  security: [{ bearerAuth: [] }],
  externalDocs: {
    description: 'Additional usage notes: demo credentials, rate limits, and how seeds are applied on first docker init',
    url: 'https://github.com/sntiago05/pharma-link#local-setup',
  },
  // Extra human-readable notes exposed in the spec for quick reference
  'x-extra-info': {
    demoAccounts: {
      password: 'Admin1234',
      accounts: [
        { email: 'admin@pharmalink.local', role: 'ADMIN' },
        { email: 'paciente@pharmalink.local', role: 'PATIENT' },
        { email: 'farmacia@pharmalink.local', role: 'PHARMACY_OPERATOR' },
        { email: 'eps@pharmalink.local', role: 'EPS_OPERATOR' }
      ],
      epsApiKey: 'eps-demo-key'
    },
    notes: [
      'When starting with a brand-new Postgres volume, db/01_ddl.sql, db/02_migrations.sql and db/03_seed_demo.sql are executed automatically by the Postgres entrypoint.',
      'Auth endpoints are rate-limited. Failed auth attempts count against the quota and may return 429.',
      'Rate limit headers exposed: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset.'
    ]
  }
};

export const swaggerSpec = swaggerJsdoc({
  definition,
  // Route files carry the @openapi blocks for their own endpoints.
  apis: ['./src/routes/*.js'],
});
