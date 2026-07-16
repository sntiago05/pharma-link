# Explicación de los endpoints y de las entidades

Este documento describe para qué sirve cada endpoint principal del sistema, agrupado por entidad.  
En este caso se explican las entidades más importantes del proyecto: Catalog y Audit. Si en tu backend existen otras entidades, puedes repetir esta misma estructura para cada una de ellas.

---

## 1. Entidad: Catalog

La entidad Catalog se encarga de gestionar los datos maestros o de referencia del sistema.  
Se usa para guardar información que luego será consultada por otros módulos, como productos, categorías, presentaciones, tipos de registros o datos base del negocio.

### Endpoints típicos

- GET /catalog
  - Sirve para listar todos los registros del catálogo.
  - Se usa cuando se quiere mostrar una tabla o una lista de elementos disponibles.

- GET /catalog/{id}
  - Sirve para consultar un registro específico por su identificador.
  - Se usa para ver el detalle de un elemento del catálogo.

- POST /catalog
  - Sirve para crear un nuevo registro en el catálogo.
  - Se usa cuando se agrega una nueva entrada de referencia o maestro.

- PUT /catalog/{id}
  - Sirve para actualizar un registro existente.
  - Se usa cuando se modifican datos como nombre, descripción, estado o configuración.

- DELETE /catalog/{id}
  - Sirve para eliminar un registro del catálogo.
  - Se usa cuando un elemento ya no debe estar disponible.

### Propósito general
- Mantener la información base del sistema.
- Centralizar datos de referencia.
- Permitir consultar, crear, editar y eliminar elementos del catálogo.

---

## 2. Entidad: Audit

La entidad Audit se encarga de registrar y consultar la trazabilidad de las acciones realizadas dentro del sistema.  
Sirve para saber qué usuario hizo qué cambio, en qué momento y sobre qué registro.

### Endpoints típicos

- GET /audit
  - Sirve para listar los eventos o registros de auditoría.
  - Se usa para revisar cambios o acciones registradas.

- GET /audit/{id}
  - Sirve para ver el detalle de un evento específico de auditoría.
  - Se usa para inspeccionar un cambio concreto.

- POST /audit
  - Sirve para registrar un nuevo evento de auditoría.
  - Se usa normalmente desde el backend cuando ocurre una acción importante.

### Propósito general
- Mantener trazabilidad de operaciones.
- Registrar cambios críticos.
- Ayudar a revisar acciones de usuarios, altas, bajas o modificaciones sensibles.

---

## 3. Estructura general de una entidad

En la mayoría de los proyectos, cada entidad sigue este patrón de endpoints:

- GET /{entidad}
  - Lista todos los registros.

- GET /{entidad}/{id}
  - Muestra un registro en detalle.

- POST /{entidad}
  - Crea un nuevo registro.

- PUT /{entidad}/{id}
  - Actualiza un registro existente.

- DELETE /{entidad}/{id}
  - Elimina un registro.

Este patrón se aplica a cualquier entidad del sistema, como usuarios, productos, proveedores, pedidos, inventario o roles, si esas entidades existen en tu backend.

---

## 4. Resumen rápido

- Catalog: administra los datos maestros o de referencia del sistema.
- Audit: administra la trazabilidad y el registro de cambios.

Si quieres, puedo convertir este contenido en una versión más formal con tablas, o agregar la documentación de cada entidad real que exista en tu proyecto.