# PharmaLink API Documentation

Este documento describe los endpoints expuestos por el backend de PharmaLink y cómo consumirlos.

## 1. Información general

- Base URL: http://localhost:4000
- Formato de respuesta: JSON
- Contenido por defecto: `application/json`
- Health check: GET /health

## 2. Autenticación

La mayoría de los endpoints protegidos requieren un token JWT en el header:

```http
Authorization: Bearer <token>
```

El token se obtiene en los endpoints de login.

Roles soportados por el sistema:
- `PATIENT`
- `ADMIN`
- `EPS_OPERATOR`
- `PHARMACY_OPERATOR`

## 3. Autenticación y registro

### 3.1 Registrar paciente
- Método: `POST`
- Ruta: `/api/auth/register`
- Acceso: público
- Body:

```json
{
  "fullName": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123"
}
```

- Validaciones:
  - `fullName` mínimo 3 caracteres
  - `email` debe ser un correo válido
  - `password` mínimo 8 caracteres

- Respuesta esperada: `201 Created` con el usuario creado.

### 3.2 Iniciar sesión
- Método: `POST`
- Ruta: `/api/auth/login`
- Acceso: público
- Body:

```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

- Respuesta esperada: `200 OK` con el JWT y los datos del usuario.

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "fullName": "Juan Pérez",
    "email": "juan@example.com",
    "role": "PATIENT"
  }
}
```

## 4. Catálogo

Todos estos endpoints requieren autenticación y se montan bajo `/api/catalog`.

### 4.1 Listar EPS
- Método: `GET`
- Ruta: `/api/catalog/eps`
- Roles permitidos: `ADMIN`, `EPS_OPERATOR`, `PHARMACY_OPERATOR`

### 4.2 Crear EPS
- Método: `POST`
- Ruta: `/api/catalog/eps`
- Roles permitidos: `ADMIN`
- Body:

```json
{
  "name": "EPS Salud Total",
  "nit": "900123456-1",
  "apiKey": "mi-api-key"
}
```

- Nota: la API key se almacena como hash interno.

### 4.3 Obtener una EPS por ID
- Método: `GET`
- Ruta: `/api/catalog/eps/:id`
- Roles permitidos: `ADMIN`, `EPS_OPERATOR`, `PHARMACY_OPERATOR`

### 4.4 Actualizar una EPS
- Método: `PUT`
- Ruta: `/api/catalog/eps/:id`
- Roles permitidos: `ADMIN`
- Body con los campos a actualizar, por ejemplo:

```json
{
  "name": "Nueva EPS",
  "active": true
}
```

### 4.5 Eliminar una EPS
- Método: `DELETE`
- Ruta: `/api/catalog/eps/:id`
- Roles permitidos: `ADMIN`

### 4.6 Listar farmacias
- Método: `GET`
- Ruta: `/api/catalog/pharmacies`
- Roles permitidos: `ADMIN`, `EPS_OPERATOR`, `PHARMACY_OPERATOR`

### 4.7 Crear farmacia
- Método: `POST`
- Ruta: `/api/catalog/pharmacies`
- Roles permitidos: `ADMIN`
- Body:

```json
{
  "name": "Farmacia Central",
  "nit": "800987654-9",
  "address": "Calle 10 # 20-30",
  "city": "Bogotá",
  "inventoryApiUrl": "https://inventory.example.com",
  "apiKey": "secret-key"
}
```

### 4.8 Obtener farmacia por ID
- Método: `GET`
- Ruta: `/api/catalog/pharmacies/:id`
- Roles permitidos: `ADMIN`, `EPS_OPERATOR`, `PHARMACY_OPERATOR`

### 4.9 Actualizar farmacia
- Método: `PUT`
- Ruta: `/api/catalog/pharmacies/:id`
- Roles permitidos: `ADMIN`

### 4.10 Eliminar farmacia
- Método: `DELETE`
- Ruta: `/api/catalog/pharmacies/:id`
- Roles permitidos: `ADMIN`

### 4.11 Listar medicamentos
- Método: `GET`
- Ruta: `/api/catalog/medicines`
- Roles permitidos: `ADMIN`, `EPS_OPERATOR`, `PHARMACY_OPERATOR`

### 4.12 Crear medicamento
- Método: `POST`
- Ruta: `/api/catalog/medicines`
- Roles permitidos: `ADMIN`
- Body:

```json
{
  "code": "PARA-001",
  "name": "Paracetamol",
  "presentation": "Tabletas",
  "description": "Analgésico de uso oral"
}
```

### 4.13 Obtener medicamento por ID
- Método: `GET`
- Ruta: `/api/catalog/medicines/:id`
- Roles permitidos: `ADMIN`, `EPS_OPERATOR`, `PHARMACY_OPERATOR`

### 4.14 Actualizar medicamento
- Método: `PUT`
- Ruta: `/api/catalog/medicines/:id`
- Roles permitidos: `ADMIN`

### 4.15 Eliminar medicamento
- Método: `DELETE`
- Ruta: `/api/catalog/medicines/:id`
- Roles permitidos: `ADMIN`

### 4.16 Vincular EPS con farmacia
- Método: `POST`
- Ruta: `/api/catalog/eps-pharmacies`
- Roles permitidos: `ADMIN`
- Body:

```json
{
  "epsId": 1,
  "pharmacyId": 2
}
```

### 4.17 Configurar horarios de farmacia
- Método: `POST`
- Ruta: `/api/catalog/working-hours`
- Roles permitidos: `ADMIN`, `PHARMACY_OPERATOR`
- Body:

```json
{
  "pharmacyId": 2,
  "openingTime": "08:00:00",
  "closingTime": "18:00:00",
  "slotDuration": 30,
  "capacityPerSlot": 3
}
```

## 5. Pacientes

Estos endpoints se montan bajo `/api/patients` y requieren autenticación.

### 5.1 Obtener mi perfil de paciente
- Método: `GET`
- Ruta: `/api/patients/me`
- Roles permitidos: `PATIENT`

### 5.2 Crear mi perfil de paciente
- Método: `POST`
- Ruta: `/api/patients/me`
- Roles permitidos: `PATIENT`
- Body:

```json
{
  "epsId": 1,
  "document": "123456789",
  "phone": "3001234567"
}
```

- Nota: `epsId` y `document` son obligatorios.

## 6. Órdenes médicas

Estos endpoints se montan bajo `/api/orders` y requieren autenticación.

### 6.1 Listar mis órdenes
- Método: `GET`
- Ruta: `/api/orders/me`
- Roles permitidos: `PATIENT`

### 6.2 Crear una orden médica
- Método: `POST`
- Ruta: `/api/orders`
- Roles permitidos: `PATIENT`
- Body:

```json
{
  "orderNumber": "ORD-1001",
  "issueDate": "2026-07-15",
  "expirationDate": "2026-12-31",
  "details": [
    {
      "medicineId": 1,
      "quantity": 2
    },
    {
      "medicineId": 3,
      "quantity": 1
    }
  ]
}
```

- Validaciones:
  - `orderNumber`, `issueDate`, `expirationDate` obligatorios
  - `details` debe ser un arreglo no vacío
  - cada detalle debe tener `medicineId` y `quantity` positivo

## 7. Reservas

Estos endpoints se montan bajo `/api/reservations` y requieren autenticación.

### 7.1 Crear reserva
- Método: `POST`
- Ruta: `/api/reservations`
- Roles permitidos: `PATIENT`
- Body:

```json
{
  "orderId": 10,
  "pharmacyId": 2,
  "reservationDate": "2026-07-20",
  "startTime": "10:00:00",
  "endTime": "10:30:00"
}
```

- Requiere que la orden exista, pertenezca al paciente, sea aún elegible para reserva y que la farmacia esté asociada con la EPS de la orden.

### 7.2 Cancelar reserva
- Método: `DELETE`
- Ruta: `/api/reservations/:id`
- Roles permitidos: `PATIENT`

### 7.3 Reprogramar reserva
- Método: `PUT`
- Ruta: `/api/reservations/:id/reschedule`
- Roles permitidos: `PATIENT`
- Body:

```json
{
  "reservationDate": "2026-07-21",
  "startTime": "11:00:00",
  "endTime": "11:30:00"
}
```

### 7.4 Marcar reserva como no-show
- Método: `POST`
- Ruta: `/api/reservations/:id/no-show`
- Roles permitidos: `ADMIN`, `PHARMACY_OPERATOR`

### 7.5 Consultar disponibilidad de una farmacia
- Método: `GET`
- Ruta: `/api/reservations/pharmacy/:pharmacyId/availability?date=YYYY-MM-DD`
- Acceso: público con autenticación requerida en el middleware general
- Ejemplo:

```http
GET /api/reservations/pharmacy/2/availability?date=2026-07-20
```

### 7.6 Listar reservas de una farmacia
- Método: `GET`
- Ruta: `/api/reservations/pharmacy/:pharmacyId`
- Roles permitidos: `ADMIN`, `PHARMACY_OPERATOR`

## 8. Entregas

Estos endpoints se montan bajo `/api/deliveries` y requieren autenticación.

### 8.1 Confirmar entrega
- Método: `POST`
- Ruta: `/api/deliveries/:reservationId`
- Roles permitidos: `ADMIN`, `PHARMACY_OPERATOR`

## 9. Inventario

Estos endpoints se montan bajo `/api/inventory` y requieren autenticación.

### 9.1 Listar inventario de una farmacia
- Método: `GET`
- Ruta: `/api/inventory/:pharmacyId`
- Roles permitidos: `ADMIN`, `PHARMACY_OPERATOR`

### 9.2 Ajustar inventario
- Método: `POST`
- Ruta: `/api/inventory/:pharmacyId/adjustments`
- Roles permitidos: `ADMIN`, `PHARMACY_OPERATOR`
- Body:

```json
{
  "medicineId": 1,
  "quantity": 10,
  "movementType": "ADJUSTMENT"
}
```

- `movementType` es opcional; si se omite, el valor por defecto es `ADJUSTMENT`.

## 10. Integración con EPS

Estos endpoints se montan bajo `/api/integrations/eps`.

### 10.1 Recibir orden desde una EPS
- Método: `POST`
- Ruta: `/api/integrations/eps/orders`
- Acceso: autenticación por header `X-API-Key`
- Header requerido:

```http
X-API-Key: <api-key>
```

- Body:

```json
{
  "orderNumber": "EPS-ORDER-001",
  "patientDocument": "123456789",
  "patientFullName": "Ana Gómez",
  "patientEmail": "ana@example.com",
  "patientPhone": "3009990000",
  "issueDate": "2026-07-15",
  "expirationDate": "2026-12-31",
  "details": [
    {
      "medicineCode": "PARA-001",
      "quantity": 2
    }
  ]
}
```

- Nota: si el paciente no existe, el endpoint puede crear el usuario y perfil de paciente automáticamente.

## 11. Health check

### 11.1 Verificar estado del servicio
- Método: `GET`
- Ruta: `/health`
- Acceso: público

## 12. Códigos de estado comunes

- `200 OK`: operación exitosa de lectura o actualización
- `201 Created`: recurso creado exitosamente
- `204 No Content`: recurso eliminado
- `400 Bad Request`: datos inválidos o faltantes
- `401 Unauthorized`: falta token o credenciales incorrectas
- `403 Forbidden`: no tiene el rol o permiso adecuado para la ruta
- `404 Not Found`: recurso inexistente
- `409 Conflict`: conflicto de capacidad o registro duplicado
- `422 Unprocessable Entity`: datos incompletos para crear un paciente desde integración EPS
- `500 Internal Server Error`: error inesperado del servidor

## 13. Ejemplo de consumo con cURL

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@example.com","password":"password123"}'

# Crear orden médica (requiere bearer token)
curl -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"orderNumber":"ORD-1001","issueDate":"2026-07-15","expirationDate":"2026-12-31","details":[{"medicineId":1,"quantity":2}]}'
```
