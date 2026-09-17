# Cartera — Plataforma de gestión de préstamos

Aplicación full stack para que una financiera administre **usuarios internos**,
**clientes**, **préstamos**, **depósitos/pagos** y visualice el estado de su
cartera (pendientes y atrasos) mediante un **dashboard con gráficas**.

- **Backend:** NestJS + Prisma + PostgreSQL, documentado con Swagger.
- **Frontend:** React + TypeScript + Vite + Tailwind CSS, interfaz en español.
- **Autenticación:** JWT (access + refresh token con rotación), control de acceso por roles.
- **Listo para:** ejecutarse en local en Windows y para desplegarse en la nube (Docker incluido).

---

## Índice

1. [Arquitectura y stack técnico](#1-arquitectura-y-stack-técnico)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Funcionalidades principales](#3-funcionalidades-principales)
4. [Ejecutar en Windows (paso a paso)](#4-ejecutar-en-windows-paso-a-paso)
5. [Ejecutar con Docker (alternativa más simple)](#5-ejecutar-con-docker-alternativa-más-simple)
6. [Cuentas de prueba](#6-cuentas-de-prueba)
7. [Documentación de la API (Swagger)](#7-documentación-de-la-api-swagger)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Desplegar en la nube](#9-desplegar-en-la-nube)
10. [Seguridad implementada](#10-seguridad-implementada)
11. [Scripts disponibles](#11-scripts-disponibles)
12. [Solución de problemas comunes](#12-solución-de-problemas-comunes)

---

## 1. Arquitectura y stack técnico

```
┌───────────────────┐        HTTPS/JSON        ┌─────────────────────┐        SQL        ┌──────────────┐
│  React + Vite      │ ───────────────────────▶ │   NestJS API         │ ────────────────▶ │  PostgreSQL   │
│  (Tailwind, React   │ ◀─────────────────────── │   (Prisma ORM,       │ ◀──────────────── │               │
│   Query, Recharts)  │      JWT Bearer          │    Swagger, JWT)     │                    │               │
└───────────────────┘                           └─────────────────────┘                    └──────────────┘
```

| Capa       | Tecnología                                                                 |
|------------|-----------------------------------------------------------------------------|
| Backend    | NestJS 10, Prisma 5, PostgreSQL, Passport-JWT, Helmet, class-validator      |
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts, Axios   |
| Auth       | JWT access token (15 min) + refresh token con rotación (7 días)             |
| Docs API   | Swagger / OpenAPI en `/docs`                                                |
| Contenedor | Docker multi-stage para backend y frontend, `docker-compose.yml` incluido  |

---

## 2. Estructura del proyecto

```
cartera/
├── backend/                  # API NestJS
│   ├── src/
│   │   ├── auth/              # Login, refresh, guards, roles
│   │   ├── users/              # Usuarios del sistema (personal interno)
│   │   ├── clients/            # Clientes de la financiera
│   │   ├── loans/               # Préstamos y tabla de amortización
│   │   ├── payments/            # Depósitos / pagos
│   │   ├── dashboard/            # KPIs y datos para gráficas
│   │   ├── prisma/                # Servicio de conexión a la base de datos
│   │   └── common/                 # DTOs, filtros y utilidades compartidas
│   ├── prisma/
│   │   ├── schema.prisma       # Modelo de datos
│   │   └── seed.ts              # Datos de demostración
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                  # SPA React
│   ├── src/
│   │   ├── pages/               # Login, Dashboard, Clientes, Préstamos, Depósitos, Usuarios
│   │   ├── components/           # Layout, gráficas, formularios reutilizables
│   │   ├── api/                   # Clientes Axios por recurso
│   │   └── context/                # Sesión de autenticación
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml        # Orquesta Postgres + backend + frontend
├── .env.example                # Variables usadas por docker-compose
└── README.md                    # Este archivo
```

---

## 3. Funcionalidades principales

- **Usuarios del sistema:** solo el rol `ADMIN` puede crear/editar/desactivar
  cuentas del personal (`ADMIN`, `MANAGER`, `CASHIER`).
- **Clientes:** alta, edición, búsqueda (barra de búsqueda global en la parte
  superior con resultados instantáneos, y búsqueda con paginación en el listado).
- **Préstamos:** al crear un préstamo se genera automáticamente la **tabla de
  amortización** (sistema de saldo decreciente / francés) según monto, tasa,
  número de cuotas y frecuencia (semanal, quincenal, mensual).
- **Depósitos / pagos:** un depósito se aplica en cascada a las cuotas
  pendientes más antiguas, permitiendo que un solo pago cubra varias cuotas
  atrasadas. El excedente queda registrado como pago anticipado.
- **Vista por cliente:** cada cliente tiene una pantalla con sus préstamos,
  cuotas **pendientes** y **atrasadas**, y totales en mora.
- **Dashboard con gráficas:** cartera desembolsada, cobrada, pendiente y en
  mora; cobros por mes; distribución de la cartera por estado; comparación
  desembolsos vs. cobros; ranking de clientes con mayor atraso.
- **Sincronización automática de atrasos:** un job programado (cada hora)
  marca cuotas vencidas como atrasadas y actualiza el estado del préstamo.

---

## 4. Ejecutar en Windows (paso a paso)

Estas instrucciones asumen una instalación **sin Docker**, usando PostgreSQL
instalado directamente en Windows. Si prefieres algo más simple, salta a la
sección [5. Ejecutar con Docker](#5-ejecutar-con-docker-alternativa-más-simple).

### 4.1 Requisitos previos

1. **Node.js 20 LTS** — descarga el instalador `.msi` desde
   https://nodejs.org/ y ejecútalo (deja marcada la opción de instalar npm).
   Verifica en una terminal (PowerShell o CMD):
   ```powershell
   node -v
   npm -v
   ```
2. **PostgreSQL 16** — descarga el instalador desde
   https://www.postgresql.org/download/windows/. Durante la instalación:
   - Define una contraseña para el usuario `postgres` (anótala).
   - Deja el puerto por defecto `5432`.
   - Al finalizar, puedes abrir **pgAdmin 4** (se instala junto con Postgres)
     para crear una base de datos llamada `cartera_db`, o simplemente usar la
     base `postgres` por defecto y ajustar el nombre en el `.env`.
3. **Git** (opcional, para clonar el repositorio) — https://git-scm.com/download/win

### 4.2 Backend (API)

Abre PowerShell en la carpeta `backend/` del proyecto:

```powershell
cd cartera\backend

# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
copy .env.example .env
```

Edita el archivo `.env` recién creado con el Bloc de notas y ajusta:

```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/cartera_db?schema=public"
JWT_ACCESS_SECRET=una_cadena_larga_y_aleatoria
JWT_REFRESH_SECRET=otra_cadena_larga_y_aleatoria_diferente
CORS_ORIGIN=http://localhost:5173
```

> Si la base de datos `cartera_db` no existe todavía, créala desde pgAdmin 4
> (clic derecho en "Databases" → "Create" → "Database…") o con:
> `createdb -U postgres cartera_db` desde la terminal.

Continúa en la misma terminal:

```powershell
# 3. Generar el cliente de Prisma
npx prisma generate

# 4. Crear las tablas en la base de datos a partir del esquema
npx prisma db push

# 5. Cargar datos de demostración (usuarios, clientes y préstamos de ejemplo)
npm run prisma:seed

# 6. Iniciar el servidor en modo desarrollo
npm run start:dev
```

El backend quedará disponible en **http://localhost:3000/api/v1**, y la
documentación Swagger en **http://localhost:3000/docs**.

### 4.3 Frontend (interfaz web)

Abre **otra** ventana de PowerShell (deja el backend corriendo) en la carpeta
`frontend/`:

```powershell
cd cartera\frontend

# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
copy .env.example .env
```

El archivo `.env` por defecto ya apunta al backend local
(`VITE_API_URL=http://localhost:3000/api/v1`), no necesitas cambiar nada si
seguiste los puertos por defecto.

```powershell
# 3. Iniciar la aplicación
npm run dev
```

Abre tu navegador en **http://localhost:5173** e inicia sesión con una de las
[cuentas de prueba](#6-cuentas-de-prueba).

---

## 5. Ejecutar con Docker (alternativa más simple)

Si tienes **Docker Desktop** instalado en Windows
(https://www.docker.com/products/docker-desktop/), puedes levantar todo el
proyecto (base de datos incluida) con un solo comando, sin instalar Node.js
ni PostgreSQL manualmente.

```powershell
cd cartera

# 1. Configurar variables de entorno para docker-compose
copy .env.example .env

# 2. Construir e iniciar los tres servicios (postgres, backend, frontend)
docker compose up --build
```

Espera a que los tres contenedores estén "healthy" / corriendo, luego:

```powershell
# 3. Generar el esquema de la base de datos y cargar datos de demostración
docker compose exec backend npx prisma db push
docker compose exec backend npm run prisma:seed
```

Accede a la aplicación en **http://localhost:8080** (frontend) y a la
documentación de la API en **http://localhost:3000/docs**.

Para detener todo: `docker compose down` (agrega `-v` si además quieres
borrar los datos de la base: `docker compose down -v`).

---

## 6. Cuentas de prueba

El script de siembra (`prisma/seed.ts`) crea estas cuentas:

| Rol         | Correo                  | Contraseña   | Permisos                                              |
|-------------|--------------------------|--------------|--------------------------------------------------------|
| Administrador | admin@cartera.com      | Admin123!    | Acceso total, incluida la gestión de usuarios          |
| Gerente       | gerente@cartera.com    | Gerente123!  | Clientes, préstamos, depósitos y reportes               |
| Cajero        | cajero@cartera.com     | Cajero123!   | Registrar clientes, préstamos y depósitos               |

También se crean 6 clientes de ejemplo con préstamos en distintos estados
(al día, con pagos parciales, totalmente pagado y con atrasos) para que el
dashboard y las pantallas de detalle tengan datos representativos desde el
primer momento.

> **Importante:** cambia estas contraseñas (o elimina las cuentas de prueba)
> antes de usar la aplicación con datos reales.

---

## 7. Documentación de la API (Swagger)

Con el backend corriendo, visita:

```
http://localhost:3000/docs
```

Ahí encontrarás todos los endpoints agrupados por módulo (`auth`, `users`,
`clients`, `loans`, `payments`, `dashboard`), con sus parámetros, cuerpos de
petición/respuesta y códigos de estado. Para probar endpoints protegidos:

1. Ejecuta `POST /auth/login` con un correo y contraseña válidos.
2. Copia el valor de `accessToken` de la respuesta.
3. Haz clic en **Authorize** (arriba a la derecha) y pega el token.
4. Ya puedes probar el resto de los endpoints protegidos.

---

## 8. Variables de entorno

### Backend (`backend/.env`)

| Variable                 | Descripción                                             | Ejemplo                                    |
|---------------------------|-----------------------------------------------------------|---------------------------------------------|
| `NODE_ENV`                 | Entorno de ejecución                                       | `development` / `production`                |
| `PORT`                      | Puerto del servidor NestJS                                  | `3000`                                        |
| `API_PREFIX`                 | Prefijo de todas las rutas                                    | `api`                                          |
| `CORS_ORIGIN`                  | Origen(es) permitido(s) para CORS (separados por coma)          | `http://localhost:5173`                          |
| `DATABASE_URL`                    | Cadena de conexión de PostgreSQL                                  | `postgresql://user:pass@host:5432/db`              |
| `JWT_ACCESS_SECRET`                  | Secreto para firmar el access token                                  | cadena aleatoria larga                               |
| `JWT_ACCESS_EXPIRES_IN`                | Vigencia del access token                                              | `15m`                                                  |
| `JWT_REFRESH_SECRET`                     | Secreto para firmar el refresh token                                     | cadena aleatoria larga, distinta a la de access          |
| `JWT_REFRESH_EXPIRES_IN`                   | Vigencia del refresh token                                                 | `7d`                                                      |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`    | Credenciales del admin creado por el seed                                   | ver sección 6                                               |

### Frontend (`frontend/.env`)

| Variable         | Descripción                                  | Ejemplo                              |
|-------------------|-------------------------------------------------|-----------------------------------------|
| `VITE_API_URL`      | URL base de la API que consumirá la interfaz        | `http://localhost:3000/api/v1`             |

---

## 9. Desplegar en la nube

A continuación se describen dos rutas de despliegue. Elige la que mejor se
ajuste a tu proveedor preferido; ambas usan las mismas imágenes Docker ya
incluidas en el proyecto.

### Opción A — Un solo servidor (VPS) con Docker Compose

Aplica a proveedores como **DigitalOcean, AWS Lightsail, Linode, Hetzner,
Azure VM o cualquier VPS con Docker**.

1. Crea una máquina virtual (mínimo 2 GB de RAM recomendado) con Ubuntu 22.04.
2. Instala Docker y el plugin de Compose:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo apt-get install -y docker-compose-plugin
   ```
3. Copia el proyecto al servidor (`git clone` o `scp`).
4. Copia y edita el archivo de entorno:
   ```bash
   cp .env.example .env
   nano .env   # define JWT_ACCESS_SECRET, JWT_REFRESH_SECRET y CORS_ORIGIN con tu dominio
   ```
5. Ajusta `CORS_ORIGIN` al dominio público de tu frontend (por ejemplo
   `https://cartera.tu-dominio.com`) y, en `docker-compose.yml`, el
   `VITE_API_URL` de build-args del frontend a `/api/v1` (se mantiene, ya que
   Nginx hace de proxy interno hacia el backend).
6. Levanta los servicios:
   ```bash
   docker compose up -d --build
   docker compose exec backend npx prisma db push
   docker compose exec backend npm run prisma:seed   # opcional, solo para datos de demo
   ```
7. Coloca un proxy inverso con HTTPS delante (recomendado: **Caddy** o
   **Nginx + Certbot**) apuntando el puerto 443 hacia el puerto `8080`
   (frontend) del servidor, y expón el backend solo si lo necesitas
   públicamente por separado.

### Opción B — Servicios administrados (backend + base de datos + frontend por separado)

Aplica a combinaciones como **Render / Railway / Fly.io** para el backend y
la base de datos, junto con **Vercel / Netlify / Render Static Site** para el
frontend. Los pasos son equivalentes en la mayoría de estos proveedores:

**Base de datos (PostgreSQL administrado):**
1. Crea una instancia de PostgreSQL gestionada (Render, Railway, Neon,
   Supabase, RDS, etc.).
2. Copia la cadena de conexión (`DATABASE_URL`) que te entregue el proveedor.

**Backend (NestJS):**
1. Crea un nuevo servicio "Web Service" apuntando al subdirectorio
   `backend/` de tu repositorio, usando el `Dockerfile` incluido (la mayoría
   de estos proveedores detectan y construyen el Dockerfile automáticamente).
2. Configura las variables de entorno del servicio con los mismos valores de
   la tabla de la [sección 8](#8-variables-de-entorno), usando la
   `DATABASE_URL` de tu base de datos administrada y un `CORS_ORIGIN` igual a
   la URL pública que tendrá tu frontend.
3. Expón el puerto `3000` (o el que defina la plataforma vía `PORT`).
4. Tras el primer despliegue, ejecuta una vez (desde la consola/"shell" que
   ofrezca la plataforma, o como "one-off job"):
   ```bash
   npx prisma db push
   npm run prisma:seed   # opcional
   ```

**Frontend (React):**
1. Crea un nuevo sitio estático apuntando al subdirectorio `frontend/`.
2. Comando de build: `npm run build` — carpeta de salida: `dist`.
3. Variable de entorno de build: `VITE_API_URL` con la URL pública de tu
   backend (por ejemplo `https://cartera-api.onrender.com/api/v1`).
4. Una vez desplegado, vuelve al servicio de backend y actualiza
   `CORS_ORIGIN` con la URL definitiva del frontend, y vuelve a desplegar el
   backend para que tome el cambio.

> Ambas opciones usan exactamente las mismas imágenes Docker del repositorio,
> por lo que el comportamiento en la nube es idéntico al de tu entorno local.

---

## 10. Seguridad implementada

- **Autenticación JWT** con access token de corta duración y refresh token
  con rotación (se invalida el token anterior al usar uno nuevo) y
  revocación al cerrar sesión.
- **Autorización basada en roles** (`ADMIN`, `MANAGER`, `CASHIER`) aplicada a
  nivel de endpoint mediante guards globales.
- **Hash de contraseñas** con bcrypt (10 rondas de sal).
- **Cabeceras de seguridad HTTP** mediante Helmet.
- **CORS restringido** al origen configurado explícitamente.
- **Rate limiting** global (120 solicitudes/minuto) y más estricto en el
  endpoint de login (5 intentos/minuto) para mitigar fuerza bruta.
- **Validación estricta de entrada** en todos los endpoints
  (`class-validator` + `whitelist`/`forbidNonWhitelisted`), rechazando
  cualquier campo no esperado.
- **Manejo centralizado de errores** sin exponer detalles internos del
  servidor en producción.

---

## 11. Scripts disponibles

### Backend

| Comando                     | Descripción                                             |
|-------------------------------|------------------------------------------------------------|
| `npm run start:dev`              | Inicia la API en modo desarrollo con recarga automática        |
| `npm run build`                    | Compila TypeScript a JavaScript (`dist/`)                         |
| `npm run start:prod`                 | Ejecuta la API ya compilada                                          |
| `npm run prisma:generate`               | Genera el cliente de Prisma a partir del esquema                        |
| `npm run prisma:push`                     | Sincroniza el esquema con la base de datos                                 |
| `npm run prisma:seed`                        | Carga usuarios, clientes y préstamos de demostración                          |
| `npm run prisma:studio`                        | Abre una interfaz visual para explorar la base de datos                         |
| `npm run lint`                                   | Analiza el código con ESLint                                                       |

### Frontend

| Comando            | Descripción                                  |
|----------------------|--------------------------------------------------|
| `npm run dev`          | Inicia el servidor de desarrollo (Vite)             |
| `npm run build`          | Genera el build de producción en `dist/`              |
| `npm run preview`          | Sirve localmente el build de producción                  |
| `npm run lint`               | Analiza el código con ESLint                                |

---

## 12. Solución de problemas comunes

**"No se puede conectar a la base de datos" al iniciar el backend**
Verifica que PostgreSQL esté corriendo (`services.msc` en Windows, busca
"postgresql-x64-16") y que el usuario, contraseña, host y puerto en
`DATABASE_URL` sean correctos.

**La pantalla de login da "Network Error"**
Confirma que el backend esté corriendo en el puerto indicado por
`VITE_API_URL` y que `CORS_ORIGIN` en el backend incluya la URL exacta desde
la que abres el frontend (incluyendo el puerto).

**`npx prisma db push` falla por permisos**
Asegúrate de que el usuario de `DATABASE_URL` tenga permisos para crear
tablas en el esquema `public` de la base de datos indicada.

**Los contenedores de Docker no ven cambios de código**
`docker compose up --build` reconstruye las imágenes; usarlo tras cada
cambio si no estás usando un flujo de desarrollo con recarga en caliente
dentro de contenedores.
