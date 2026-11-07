# Jarusa

Jarusa es una tienda en línea de cosméticos pensada para que cualquier persona pueda comprar con comodidad, incluidas quienes usan lectores de pantalla, tienen baja visión, daltonismo o discapacidad auditiva. Además del catálogo y el proceso de compra, incluye un área personal para cada cliente y un panel de administración para gestionar productos, pedidos, anuncios y descuentos.

El proyecto es un prototipo funcional: el frontend está construido con React y Vite, y un backend con Express y SQLite guarda los anuncios, los precios, las listas de deseos y las notificaciones.

## Características principales

**Tienda**
- Página de inicio pública, catálogo con categorías, búsqueda y ficha de producto.
- Carrito, pago simulado (tarjeta, Yape, Plin o contra entrega) y confirmación del pedido.
- Página de novedades con los anuncios y promociones vigentes.

**Accesibilidad**
- Panel de accesibilidad disponible en todas las páginas: temas para protanopía, deuteranopía y tritanopía, modo oscuro, temperatura de color y texto más grande.
- Modo lector de pantalla, con foco reforzado y sin animaciones ni carruseles.
- Alertas visuales para personas sordas o con hipoacusia: avisos grandes con texto, icono y destello de pantalla. Opcionalmente, sonido y vibración.
- **CompraFácil** (`/compra-facil`): un recorrido de compra en una sola página, con encabezados jerárquicos y una región `aria-live` que comunica al lector de pantalla el resultado de cada acción. Se abre desde cualquier página con <kbd>Alt</kbd> + <kbd>Mayús</kbd> + <kbd>E</kbd>.
- Tutorial interactivo y ayuda escrita para visitantes, clientes y administradores.

**Cuenta de cliente**
- Resumen, historial y detalle de pedidos, direcciones, perfil y analítica de compras.
- Lista de deseos propia de cada cuenta.
- Centro de notificaciones con estado leído / no leído. Quien tiene un producto en su lista de deseos recibe un aviso cuando baja su precio.

**Administración**
- Panel con indicadores, gestión de productos (precio, stock, foto y descripción), pedidos, clientes y reportes.
- Publicación de novedades, anuncios y promociones con borrador, programación y fecha de vencimiento. Una promoción puede fijar un precio rebajado mientras está vigente.

## Tecnologías

| Capa | Herramientas |
|---|---|
| Frontend | React 18, React Router 6, Vite 5, Tailwind CSS 3, lucide-react |
| Backend | Node.js, Express 4 |
| Base de datos | SQLite mediante better-sqlite3 |
| Pruebas | Ejecutor de pruebas integrado de Node.js (`node:test`) |
| Desarrollo | concurrently (inicia frontend y backend con un solo comando) |

## Arquitectura

```
Navegador ──► Vite (http://localhost:5173)
                 │  sirve la aplicación React
                 │  reenvía /api/* ──► Express (http://localhost:3001)
                                          │
                                          └──► SQLite (server/data/jarusa.db)
```

- En desarrollo, Vite sirve la interfaz y redirige todas las peticiones a `/api` hacia Express. El navegador solo habla con un origen, así que no hace falta configurar CORS.
- Express expone una API REST y es el único que accede a la base de datos.
- Las reglas de negocio de anuncios, promociones y avisos de bajada de precio están en `src/services/promotions.js`. Las comparten el frontend y el servidor.
- En producción (`npm start`), Express sirve también la versión compilada de la web desde `dist/`.

## Estructura del proyecto

```
├── public/                 Imágenes de productos, banners e iconos
├── server/
│   ├── index.js            Arranque del servidor
│   ├── app.js              Rutas de la API REST
│   ├── db.js               Conexión SQLite, datos iniciales y cálculo de avisos
│   ├── errors.js           Carga del entorno y mensajes de error de arranque
│   ├── init-db.js          Creación y reinicio de la base de datos
│   ├── schema.sql          Esquema de la base de datos
│   └── data/               Archivo SQLite (se crea automáticamente)
├── src/
│   ├── admin/              Panel de administración
│   ├── auth/               Inicio de sesión, registro y recuperación de contraseña
│   ├── components/         Cabecera, pie, accesibilidad, tutorial y componentes comunes
│   ├── context/            Estado global de la aplicación
│   ├── data/               Datos de ejemplo (catálogo, pedidos, cuentas de demostración)
│   ├── services/           Cliente de la API y reglas de promociones
│   ├── user/               Tienda, CompraFácil, carrito, pago y cuenta del cliente
│   └── utils/              Sonidos y vibración de las alertas
├── tests/                  Pruebas automatizadas
├── .env.example            Variables de entorno opcionales
├── index.html
├── package.json
└── vite.config.js
```

## Requisitos previos

- **Node.js 22, 24 o 26.** Se recomienda la versión 24 LTS (indicada en `.nvmrc`).
- npm, incluido con Node.js.
- Conexión a Internet durante la instalación.

No es necesario instalar nada de forma global ni tener herramientas de compilación de C++. Durante `npm install`, better-sqlite3 descarga un binario precompilado para Windows, macOS o Linux que corresponde a la versión de Node.js instalada. Solo si no existe uno para tu plataforma intentará compilarlo, y entonces sí necesitará las herramientas de C++ (en Windows, la carga de trabajo «Desarrollo para el escritorio con C++» de Visual Studio Build Tools).

Durante la instalación puede aparecer el aviso `npm warn deprecated prebuild-install`. Procede de una dependencia interna de better-sqlite3 y no afecta al funcionamiento.

## Instalación

1. Descarga o clona el repositorio y entra en la carpeta del proyecto:

   ```bash
   git clone <url-del-repositorio> jarusa
   cd jarusa
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

   Si prefieres instalar exactamente las versiones registradas en `package-lock.json`, usa `npm ci`.

No hace falta crear la base de datos ni configurar variables de entorno: el servidor crea el archivo SQLite con los datos de demostración la primera vez que se inicia.

## Ejecución

```bash
npm run dev
```

Este comando inicia en la misma terminal el servidor Express y el servidor de desarrollo de Vite. La salida de cada uno aparece identificada como `[api]` y `[web]`. Para detener ambos, pulsa <kbd>Ctrl</kbd> + <kbd>C</kbd>.

| Servicio | Dirección |
|---|---|
| Aplicación web | http://localhost:5173 |
| API REST | http://localhost:3001/api |
| Comprobación del servidor | http://localhost:3001/api/health |

Abre la aplicación en **http://localhost:5173**. Si el puerto 5173 está ocupado, Vite elegirá el siguiente libre y lo mostrará en la terminal.

### Backend por separado

Para trabajar solo con la API, por ejemplo al probarla con otra herramienta:

```bash
npm run server
```

Si en otra terminal se necesita únicamente el frontend, está disponible `npm run client`. En el uso habitual basta con `npm run dev`.

### Versión de producción local

```bash
npm start
```

Compila la web en `dist/` y la sirve junto con la API desde http://localhost:3001.

### Configuración opcional

Todas las variables tienen un valor por defecto. Para cambiarlas, copia `.env.example` como `.env` en la raíz del proyecto:

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `3001` | Puerto de la API. El proxy de Vite usa el mismo valor. |
| `JARUSA_DB` | `server/data/jarusa.db` | Ruta del archivo SQLite. |

## Base de datos

La base de datos es un único archivo SQLite ubicado en `server/data/jarusa.db`. Al iniciarse, el servidor:

1. Crea la carpeta y el archivo si no existen.
2. Aplica `server/schema.sql`. Las sentencias son idempotentes y nunca borran datos.
3. Carga las cuentas, los productos y las listas de deseos de demostración solo si la base está vacía.

El archivo no forma parte del repositorio: cada instalación genera el suyo.

| Tabla | Contenido |
|---|---|
| `users` | Cuentas conocidas por el servidor: correo, nombre y rol (sin contraseñas) |
| `products` | Nombre, precio vigente y precio anterior |
| `product_price_state` | Último precio procesado, para detectar bajadas reales |
| `wishlist_items` | Productos de la lista de deseos de cada cuenta |
| `announcements` | Novedades, anuncios y promociones |
| `notifications` | Avisos por cuenta, con fecha de lectura |

### Qué se guarda en SQLite y qué en el navegador

La migración al backend es parcial. Estas funcionalidades usan SQLite y se comparten entre navegadores:

- Anuncios, novedades y promociones.
- Precio de los productos y descuentos.
- Listas de deseos.
- Notificaciones de anuncios y de bajadas de precio, con su estado leído / no leído.

Estas otras siguen guardándose en el `localStorage` del navegador, por lo que solo existen en el equipo donde se crearon:

- Cuentas, contraseñas y sesión.
- Stock, foto, descripción y alta de productos (el nombre y el precio sí se envían a SQLite).
- Carrito, pedidos, direcciones, perfil y puntos.
- Avisos relacionados con pedidos y con la cuenta.
- Preferencias de accesibilidad.

El botón «Restablecer datos de la demo» de la pantalla de inicio de sesión borra únicamente los datos del navegador. Para reiniciar la base de datos se usa `npm run db:reset`.

## Cuentas de demostración

Estas cuentas forman parte de los datos de ejemplo (`src/data/mock.js`) y solo sirven para probar la aplicación:

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | `user@hola.com` | `user12345` |
| Administrador | `admin@hola.com` | `admin12345` |

También es posible registrar cuentas nuevas desde la aplicación; siempre se crean con rol de cliente.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia frontend y backend en modo desarrollo |
| `npm run server` | Inicia solo el backend (API y SQLite) |
| `npm run client` | Inicia solo el servidor de desarrollo de Vite |
| `npm test` | Ejecuta las pruebas automatizadas |
| `npm run build` | Compila la web para producción en `dist/` |
| `npm start` | Compila la web y la sirve junto con la API |
| `npm run preview` | Sirve `dist/` con Vite (requiere el backend en marcha) |
| `npm run db:init` | Crea la base de datos si no existe, sin borrar datos |
| `npm run db:reset` | **Borra** la base de datos y la vuelve a crear con los datos de demostración |

Detén el servidor antes de ejecutar `npm run db:reset`; en Windows el archivo no se puede borrar mientras está abierto.

### Pruebas

`npm test` ejecuta dos conjuntos de pruebas:

- `tests/promotions.test.js`: reglas de anuncios, vigencia de promociones, detección de bajadas de precio y prevención de avisos duplicados.
- `tests/api.test.js`: pruebas de integración que levantan la API sobre un archivo SQLite temporal. Comprueban la persistencia de anuncios y precios, que solo se avise a las cuentas interesadas, la independencia de las listas de deseos, el estado leído / no leído, los permisos de administrador y que los datos se conservan tras reiniciar el servidor.

## API REST

| Método y ruta | Acceso |
|---|---|
| `GET /api/health` | Público |
| `GET /api/products` | Público |
| `GET /api/announcements` | Público (el administrador ve también borradores y programados) |
| `POST /api/session` | Registra la cuenta que inicia sesión |
| `PUT /api/products/:id`, `DELETE /api/products/:id` | Administrador |
| `POST /api/announcements`, `PUT /api/announcements/:id`, `DELETE /api/announcements/:id` | Administrador |
| `GET /api/wishlist`, `POST /api/wishlist/:productId`, `DELETE /api/wishlist/:productId` | Cuenta identificada |
| `GET /api/notifications`, `POST /api/notifications/:id/read`, `POST /api/notifications/read-all` | Cuenta identificada |

La cuenta que hace la petición se indica con la cabecera `X-User-Email`. El rol se consulta siempre en la tabla `users` del servidor.

## Seguridad y limitaciones conocidas

- **La autenticación es solo de demostración.** Las contraseñas se guardan en el `localStorage` del navegador y la API identifica a cada cuenta mediante la cabecera `X-User-Email`, que cualquiera puede falsificar. El servidor decide el rol según su base de datos y las cuentas nuevas nunca son administradoras, pero esto no protege frente a peticiones manuales. No debe usarse con datos reales.
- Los pedidos, el carrito, el stock y las cuentas no se comparten entre navegadores, porque siguen en `localStorage`.
- Los pagos son simulados. Una tarjeta terminada en `0000` reproduce un pago rechazado.
- La recuperación de contraseña muestra el código en pantalla, ya que no hay un servicio de correo conectado. Por el mismo motivo, la suscripción al boletín y el formulario de ayuda validan los datos pero no los envían.
- Las notificaciones no llegan en tiempo real: la web consulta al servidor cada 15 segundos y el servidor revisa cada 30 segundos las promociones que empiezan o vencen.
- SQLite en un archivo local está pensado para un único servidor y para uso de demostración.
