# Pharma Link - Login de usuario

Login sencillo en JavaScript vanilla para explicar la HU-01 como una SPA.

## Archivos

- `index.html`: solo tiene el contenedor principal de la SPA.
- `app.js`: contiene el HTML como texto, validacion, sesion y mensajes de error.
- `style.css`: estilos basicos.

## Usuarios de prueba

| Email | Contrasena | Estado |
| --- | --- | --- |
| admin@pharmalink.com | 123456 | Activo |
| usuario@pharmalink.com | 123456 | Activo |
| bloqueado@pharmalink.com | 123456 | Deshabilitado |

## Que hace

- Valida email y contrasena.
- Muestra error si las credenciales son incorrectas.
- Muestra error si la cuenta esta deshabilitada.
- Guarda la sesion en `localStorage`.
- Muestra el perfil en la misma pagina cuando el login es exitoso.
- Permite cerrar sesion.

## Nota importante

Todavia no hay base de datos.  
Por ahora los usuarios estan en un arreglo dentro de `app.js`.

Cuando tengan base de datos, solo se reemplaza esta parte:

```js
const users = [...]
```

por una consulta real al backend.

## Como probar

Abre `index.html` en el navegador.

La aplicacion es SPA porque no cambia de archivo HTML para pasar del login al perfil. JavaScript reemplaza el contenido de `#app` con funciones que retornan HTML como texto.
