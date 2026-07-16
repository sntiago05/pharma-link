# Guía de ejecución y funcionamiento del backend PharmaLink

Este documento resume cómo levantar el backend, cómo consumir las rutas principales y cómo está organizado el proyecto para entenderlo rápidamente.

## 1. Requisitos locales

Antes de correr el backend necesitas:

- Docker Desktop o Docker Engine
- Node.js 18+ (preferiblemente 20+)
- npm
- PostgreSQL (se levanta con Docker desde este repositorio)

## 2. Ejecutar el backend

### 2.1 Levantar la base de datos

Desde la raíz del proyecto:

```bash
docker compose up -d
```

Esto levanta PostgreSQL usando el archivo docker-compose.yml del repositorio.

### 2.2 Preparar variables de entorno

Ve a la carpeta backend y copia el ejemplo de entorno:

```bash
cd backend
copy .env.example .env
```

En Windows PowerShell puede usarse `Copy-Item` o `copy`; si prefieres, puedes crear el archivo manualmente con el contenido de `.env.example`.

El archivo `.env` debe tener al menos:

```env
DB_HOST=localhost
DB_PORT=5434
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pharmalink
PORT=4000
NODE_ENV=development
JWT_SECRET=change-me-with-a-long-random-secret
```

### 2.3 Instalar dependencias

```bash
cd backend
npm install
```

### 2.4 Aplicar migraciones

```bash
npm run db:migrate
```

Este comando aplica las migraciones acumulativas desde la carpeta db/ y es seguro volver a correrlo.

### 2.5 Sembrar roles (opcional pero recomendado en entorno nuevo)

```bash
npm run db:seed
```

Esto inserta los roles base en la tabla roles: ADMIN, PATIENT, EPS_OPERATOR y PHARMACY_OPERATOR.

### 2.6 Iniciar el servidor

Modo desarrollo:

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

El backend queda disponible en:

- API: http://localhost:4000
- Health check: http://localhost:4000/health
- Swagger UI: http://localhost:4000/api/docs
- Especificación Swagger JSON: http://localhost:4000/api/docs.json

### 2.7 Verificar que todo esté vivo

```bash
curl http://localhost:4000/health
```

Respuesta esperada: un objeto JSON con estado ok y base de datos conectada.

## 3. Cómo usar las rutas del backend

Todas las rutas principales están bajo el prefijo `/api`.

### 3.1 Autenticación

#### Registrar usuario

```bash
POST /api/auth/register
Content-Type: application/json
```

Body ejemplo:

```json
{
  "fullName": "Juan Pérez",
  "email": "juan@example.com",
  "password": "12345678"
}
```

#### Iniciar sesión

```bash
POST /api/auth/login
Content-Type: application/json
```

Body ejemplo:

```json
{
  "email": "juan@example.com",
  "password": "12345678"
}
```

Respuesta: un JWT que debes enviar en el encabezado:

```http
Authorization: Bearer <token>
```

### 3.2 Rutas protegidas por JWT

Para las rutas que requieren autenticación, el backend espera el header `Authorization: Bearer <token>`.

#### Perfil del paciente

```bash
GET /api/patients/me
```

```bash
POST /api/patients/me
```

Estas rutas se usan para crear o consultar el perfil del paciente asociado al usuario autenticado.

#### Órdenes médicas

```bash
GET /api/orders/me
```

```bash
POST /api/orders
Content-Type: application/json
```

Ejemplo de body:

```json
{
  "medicineId": 1,
  "quantity": 2,
  "notes": "Entrega en farmacia"
}
```

#### Disponibilidad de farmacia

```bash
GET /api/pharmacies/:id/available-slots?date=YYYY-MM-DD
```

Ejemplo:

```bash
GET /api/pharmacies/10/available-slots?date=2026-07-16
```

Esta ruta devuelve los turnos disponibles para una farmacia en una fecha concreta.

#### Reservas

Crear una reserva:

```bash
POST /api/reservations
Content-Type: application/json
```

Ejemplo:

```json
{
  "orderId": 5,
  "pharmacyId": 10,
  "date": "2026-07-16",
  "startTime": "09:00"
}
```

Cancelar una reserva:

```bash
DELETE /api/reservations/:id
```

Reprogramar una reserva:

```bash
PUT /api/reservations/:id/reschedule
Content-Type: application/json
```

Ejemplo:

```json
{
  "date": "2026-07-17",
  "startTime": "10:00"
}
```

Marcar no-show:

```bash
POST /api/reservations/:id/no-show
```

#### Entregas

```bash
POST /api/deliveries/:reservationId
```

Se usa para confirmar que el pedido fue entregado a la persona correspondiente.

#### Inventario

Listar inventario de una farmacia:

```bash
GET /api/inventory/:pharmacyId
```

Ajustar inventario:

```bash
POST /api/inventory/:pharmacyId/adjustments
Content-Type: application/json
```

Ejemplo:

```json
{
  "medicineId": 1,
  "quantity": 5,
  "movementType": "ADJUSTMENT"
}
```

#### Notificaciones

```bash
GET /api/notifications
GET /api/notifications/unread-count
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

#### Dashboards

```bash
GET /api/dashboards/pharmacy/:pharmacyId
GET /api/dashboards/eps/:epsId
```

#### Catálogo

```bash
GET /api/catalog/eps
GET /api/catalog/pharmacies
GET /api/catalog/medicines
GET /api/catalog/eps-pharmacies
GET /api/catalog/working-hours
```

#### Auditoría y administración

```bash
GET /api/audit-logs
```

Estas rutas suelen requerir permisos de administrador o scope de organización.

## 4. Formato de respuesta

El backend responde en un formato uniforme:

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {}
}
```

En caso de error:

```json
{
  "success": false,
  "message": "Ocurrió un error",
  "errors": []
}
```

En los endpoints de auth, además del envelope general, se devuelven `token` y `user` en la raíz para compatibilidad.

## 5. Roles y permisos

El backend distingue entre los siguientes roles:

- ADMIN: acceso total
- PATIENT: accede solo a sus propios datos y acciones
- PHARMACY_OPERATOR: solo a la farmacia a la que está vinculado
- EPS_OPERATOR: solo a la EPS a la que está vinculado

Esto se valida con middleware de autenticación y autorización. Un usuario operador no puede consultar datos de otra farmacia o EPS.

## 6. Cómo entender la arquitectura del proyecto

La aplicación sigue una estructura clásica por capas:

### 6.1 Punto de entrada

El archivo principal es:

- backend/app.js

Aquí se monta Express, se habilitan seguridad, CORS, logging, swagger y las rutas. También se inicia el job de expiración de órdenes.

### 6.2 Configuración

La carpeta backend/src/config contiene:

- env.js: carga y valida las variables de entorno
- db.js: conexión con PostgreSQL
- cors.js: configuración de orígenes permitidos
- roles.js: nombres de roles del sistema
- logger.js: configuración de logging
- swagger.js: definición de OpenAPI

### 6.3 Rutas

La carpeta backend/src/routes define los endpoints HTTP.

Cada archivo de rutas:

- declara la URL base
- aplica validaciones
- aplica middlewares de auth/roles/audit
- delega al controlador correspondiente

Por ejemplo, las rutas de reservas están en backend/src/routes/reservation.routes.js.

### 6.4 Controladores

La carpeta backend/src/controllers contiene la capa de entrada HTTP.

Aquí se:

- reciben los parámetros del request
- se llaman a los services
- se traducen los resultados a una respuesta HTTP

Los controladores no deberían tener toda la lógica de negocio; solo orquestan.

### 6.5 Servicios

La carpeta backend/src/services contiene la lógica de negocio real.

Aquí se implementan reglas como:

- validar si una orden se puede reservar
- controlar capacidad de slots
- liberar stock
- crear notificaciones
- aplicar reglas de negocio y transacciones

### 6.6 Repositorios

La carpeta backend/src/repositories encapsula las consultas SQL.

Sirven para separar la lógica de acceso a datos de la lógica de negocio.

### 6.7 Middleware

La carpeta backend/src/middleware contiene componentes transversales:

- auth.middleware.js: valida el JWT y permisos
- pharmacy-access.middleware.js: restringe acceso por farmacia
- eps-access.middleware.js: restringe acceso por EPS
- validate.middleware.js: valida body/query params
- audit.middleware.js: registra eventos en auditoría
- error.middleware.js: maneja errores globalmente

### 6.8 Validadores

En backend/src/validators se definen reglas con express-validator para asegurar que los payloads cumplan el formato esperado antes de llegar a los servicios.

## 7. Flujo típico de una petición

Un request típico sigue este camino:

1. Express recibe la petición en app.js.
2. Se aplican middlewares de seguridad, parsing de JSON y logging.
3. Se valida el JWT si la ruta está protegida.
4. Se comprueban permisos y scope por rol/tenant.
5. El route llama al controlador correspondiente.
6. El controlador invoca un service con la lógica de negocio.
7. El service usa repositorios y, si aplica, transacciones de base de datos.
8. Se generan notificaciones, auditoría o actualizaciones de inventario.
9. Se devuelve la respuesta JSON al cliente.

## 8. Qué pasa en el arranque

Al iniciar el backend, además de levantar Express, se ejecuta:

- una verificación de JWT_SECRET
- una prueba simple de conexión a la base de datos
- un job periódico para expirar órdenes vencidas

## 9. Recomendación práctica para empezar a explorar

Si quieres entender el sistema desde el inicio, sigue este orden:

1. Leer backend/app.js para ver cómo se montan todas las capas.
2. Revisar backend/src/routes para localizar la ruta que te interesa.
3. Abrir el controlador asociado para ver la entrada HTTP.
4. Entrar al service para ver la lógica de negocio.
5. Ver el repository o la query correspondiente para entender el acceso a datos.
6. Abrir Swagger en http://localhost:4000/api/docs para probar de forma interactiva.

## 10. Resumen rápido

- El backend está montado con Express y usa JWT para autenticación.
- Las rutas están bajo /api y se agrupan por dominio: auth, patients, orders, reservations, deliveries, inventory, dashboards, notifications, audit.
- La lógica de negocio vive en services.
- La base de datos se maneja con migraciones SQL bajo db/.
- El sistema incluye auditoría, notificaciones, control de stock y control de acceso por rol y farmacia/EPS.
