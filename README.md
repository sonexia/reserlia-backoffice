## AWS Amplify React+Vite Starter Template

This repository provides a starter template for creating applications using React+Vite and AWS Amplify, emphasizing easy setup for authentication, API, and database capabilities.

## Overview

This template equips you with a foundational React application integrated with AWS Amplify, streamlined for scalability and performance. It is ideal for developers looking to jumpstart their project with pre-configured AWS services like Cognito, AppSync, and DynamoDB.

## Features

- **Authentication**: Setup with Amazon Cognito for secure user authentication.
- **API**: Ready-to-use GraphQL endpoint with AWS AppSync.
- **Database**: Real-time database powered by Amazon DynamoDB.

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/react/start/quickstart/#deploy-a-fullstack-app-to-aws) of our documentation.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.


---

# Reserlia Backoffice — Documentación técnica

Este documento describe en detalle la arquitectura y el funcionamiento técnico del proyecto: frontend, backend (Amplify Gen2), funciones Lambda (Stripe), autenticación, base de datos (DynamoDB), despliegue y entorno local con emulación de servicios AWS.

## Requisitos y versiones

- Node.js 20 (estandarizado para local y CI). Archivo `.nvmrc` y `package.json.engines` lo exigen.
- Gestor de paquetes: npm (lockfile incluido).

## Arquitectura general

- Frontend: React 18 + Vite 5 + MUI, con Amplify para Auth y Data.
- Backend: AWS Amplify Gen2 (TypeScript) que define:
  - Autenticación con Amazon Cognito.
  - API de datos (AppSync GraphQL/Data) sobre DynamoDB.
  - Función Lambda personalizada para pagos (Stripe): `amplify/functions/createCheckout/handler.ts`.
- Infra local: Docker Compose con DynamoDB Local, LocalStack (Cognito/AppSync/etc.), y UI admin para DynamoDB. Scripts de inicialización y datos de ejemplo.

## Frontend

- Entrypoint: `src/main.tsx` y app en `src/App.tsx`.
- UI: MUI (`@mui/material`, `@mui/icons-material`), tablas y formularios.
- Enrutado: `react-router-dom` 7.
- Amplify (cliente): autenticación y acceso a modelos definidos en `amplify/data/resource.ts`.
- Configuración Amplify sensible al entorno (local vs prod):
  - Configuración autodetectada por hostname/puerto o variable `VITE_AWS_ENV`.
  - Archivos `amplify_outputs.local.json` (local) y `amplify_outputs.json` (producción).
  - Función utilitaria `getAmplifyConfig()` (ubicada en `src/config/amplify-config.ts`) usada desde `main.tsx` para resolver la configuración correcta sin cambiar código entre entornos.

Scripts útiles (package.json):

- `npm run dev`: arranca Vite en desarrollo.
- `npm run dev:lambda`: arranca la Lambda de desarrollo local (Stripe) en Express sobre Node (ver sección Lambdas).

## Autenticación (Cognito)

Definición en `amplify/auth/resource.ts`:

- Login por email (`defineAuth({ loginWith: { email: true } })`).
- En frontend se usan los componentes de `@aws-amplify/ui-react` y/o APIs de `aws-amplify` para registrar, iniciar sesión y obtener el JWT.
- El token del usuario se propaga en llamadas al backend (AppSync y Lambda) para enlazar recursos al owner.

## Datos y API (AppSync + DynamoDB)

Definición de esquema en `amplify/data/resource.ts` con Amplify Gen2:

- Modelos principales:
  - `Reservation`:
    - Campos: `owner`, `datetime` (required), `customerName` (required), `partySize` (required), `tableNumber`, `location`, `notes`.
    - Autorización: `allow.owner()` — cada usuario accede solo a sus reservas.
    - Índice secundario: GSI `ByOwnerAndDatetime` (partition: owner, sort: datetime) para listar por usuario/fecha.
  - `RestaurantConfig`:
    - Capacidad por zonas (salón, mesas altas, terraza, barra), configuración de paga y señal y atributos de suscripción Stripe (`subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId`).
    - Autorización: `allow.owner()`.
    - Índice GSI `ByOwner` para obtener la configuración del restaurante del usuario.
- Modo de autorización por defecto: `userPool` (Cognito). Esto significa que las operaciones CRUD requieren JWT válido.

Acceso desde el frontend:

- Se genera un cliente con `generateClient<Schema>()` y se realizan operaciones sobre `client.models.Reservation` y `client.models.RestaurantConfig`.
- El control de acceso por owner es aplicado automáticamente por Amplify/AppSync gracias al JWT del usuario.

## Lambdas (Stripe)

Archivo principal: `amplify/functions/createCheckout/handler.ts`.

Endpoints (mapeados a API Gateway v2 al desplegar, y emulados localmente):

- `POST /createCheckout/create`: crea una sesión de Stripe Checkout (suscripción) y opcionalmente añade una tasa de alta (`setup fee`).
- `POST /createCheckout/portal`: crea una sesión de Stripe Billing Portal para que el usuario gestione su suscripción.
- `GET /createCheckout/confirm?session_id=...`: recupera el estado de la sesión de Checkout y devuelve datos de suscripción/cliente.

Variables de entorno necesarias:

- `STRIPE_SECRET_KEY` (obligatoria)
- `STRIPE_SUBSCRIPTION_PRICE_ID` (precio recurrente)
- `STRIPE_SETUP_FEE_PRICE_ID` (precio único opcional)
- `STRIPE_SUCCESS_URL` (p. ej. `https://app.example.com/payment/success?session_id={CHECKOUT_SESSION_ID}`)
- `STRIPE_CANCEL_URL`
- `STRIPE_BILLING_PORTAL_RETURN_URL` (opcional)

Manejo de cliente/claims:

- El handler intenta asociar el cliente de Stripe por email (proveniente del body o de los `claims` del JWT Cognito).
- Añade `metadata.cognito_sub` cuando está disponible para trazar relación de usuario.

### Desarrollo local de la Lambda Stripe

Servidor Express de emulación: `scripts/dev-lambda.ts`.

- Carga `.env.local` (prioridad) y `.env` para inyectar variables (incluida `STRIPE_SECRET_KEY`).
- Expone por defecto en `http://localhost:8787` (configurable con `DEV_LAMBDA_PORT`).
- Rutas locales equivalentes a API Gateway:
  - `POST http://localhost:8787/createCheckout/create`
  - `POST http://localhost:8787/createCheckout/portal`
  - `GET  http://localhost:8787/createCheckout/confirm?session_id=...`
- Convierte la petición Express a un `APIGatewayProxyEventV2` para invocar el `handler` real de la función.
- CORS habilitado para `GET,POST,OPTIONS`.

Comando:

```bash
npm run dev:lambda
```

Recomendación: definir `.env.local` con al menos `STRIPE_SECRET_KEY` y URLs de éxito/cancelación apropiadas para el entorno local.

## Base de datos

- DynamoDB (gestionado por Amplify Data) con tablas respaldando los modelos `Reservation` y `RestaurantConfig`.
- Acceso controlado por Cognito (owner-based). Consultas eficientes gracias a los GSIs definidos.

## Entorno local basado en Docker (emulación AWS)

Servicios (Docker Compose):

- DynamoDB Local (puerto 8000)
- LocalStack (puerto 4566) — emula Cognito, AppSync y otros servicios.
- DynamoDB Admin UI (puerto 8001)

Características:

- Persistencia de datos entre reinicios vía volúmenes locales.
- Scripts de inicialización:
  - `01-init-dynamodb.sh`: crea la tabla de Reservas con datos de ejemplo.
  - `02-init-localstack.sh`: configura Cognito (user pools, usuarios de prueba) y AppSync.
  - `start-local-env.sh`: arranque completo automatizado.
  - `stop-local-env.sh`: apagado limpio.

Usuarios de prueba (Cognito):

- admin@reserlia.com / AdminPass123!
- manager@reserlia.com / ManagerPass123!

Conmutación de configuración Amplify:

- Automática según hostname/puerto o variable `VITE_AWS_ENV`.
- `amplify_outputs.local.json` se usa con la emulación local; `amplify_outputs.json` para producción.

## Flujos de ejecución locales

1) Frontend

```bash
nvm use 20
npm install
npm run dev
```

2) Backend (Lambda Stripe en local)

```bash
npm run dev:lambda
```

3) Entorno AWS emulado (opcional, con Docker)

```bash
./start-local-env.sh
# ... trabajar ...
./stop-local-env.sh
```

## Amplify Sandbox (local), amplify_outputs y variables de entorno

Esta sección resume cómo levantar el backend con Amplify Sandbox, cómo se generan/consumen los archivos `amplify_outputs*` y cómo gestionar variables de entorno (Stripe) en local.

### 1) Arrancar Amplify Sandbox

- Arranque en modo watch (recomendado durante desarrollo):

```bash
npx ampx sandbox
```

- Ejecución única (sin watch):

```bash
npx ampx sandbox --once
```

- Opcional: identificar un sandbox distinto (no necesario normalmente). Evita usar múltiples identifiers salvo que tengas un motivo concreto.

```bash
npx ampx sandbox --identifier <tu-identificador>
```

- Eliminar un sandbox (borra los recursos del entorno sandbox asociado al identifier actual):

```bash
npx ampx sandbox delete -y
# o, si usaste un identifier personalizado
npx ampx sandbox delete --identifier <tu-identificador> -y
```

Mientras el sandbox está activo, queda “Watching for file changes…”. Cualquier cambio en `amplify/**` dispara la resincronización del backend.

### 2) amplify_outputs: selección automática local vs prod

- Al arrancar Sandbox, Amplify genera `amplify_outputs.json` en la raíz del repo con los endpoints/IDs del backend actual.
- Para la emulación local vía Docker/LocalStack usamos `amplify_outputs.local.json`.
- En el frontend, `src/config/amplify-config.ts` expone `getAmplifyConfig()` que decide qué archivo usar:
  - Por hostname/puerto (p. ej., localhost dev) o
  - Por variable `VITE_AWS_ENV`.

Forzar el modo local desde el frontend:

```bash
export VITE_AWS_ENV=local
npm run dev
```

Si trabajas contra el Sandbox real (no Docker), no establezcas `VITE_AWS_ENV=local` para que consuma `amplify_outputs.json` generado por `ampx sandbox`.

### 3) Variables de entorno (.env.local) y secretos del Sandbox

Variables requeridas por la función de Stripe (`amplify/functions/createCheckout/handler.ts`):

- `STRIPE_SECRET_KEY` (obligatoria)
- `STRIPE_SUBSCRIPTION_PRICE_ID` (recurrente)
- `STRIPE_SETUP_FEE_PRICE_ID` (opcional)
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `STRIPE_BILLING_PORTAL_RETURN_URL` (opcional)

En local, define un archivo `.env.local` en la raíz del proyecto (no se commitea). Ejemplo:

```bash
# .env.local (ejemplo)
STRIPE_SECRET_KEY=sk_test_123...
STRIPE_SUBSCRIPTION_PRICE_ID=price_123...
STRIPE_SUCCESS_URL=http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://localhost:5173/payment/cancel
STRIPE_BILLING_PORTAL_RETURN_URL=http://localhost:5173/
```

Uso de `.env.local`:

- La lambda de desarrollo (`npm run dev:lambda`) carga `.env.local` (prioridad) y `.env` automáticamente.
- Para el Sandbox, puedes inyectar variables como secretos gestionados por Amplify:

```bash
# definir/actualizar secretos
npx ampx sandbox secret set STRIPE_SECRET_KEY sk_test_123...
npx ampx sandbox secret set STRIPE_SUBSCRIPTION_PRICE_ID price_123...
npx ampx sandbox secret set STRIPE_SUCCESS_URL http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}
npx ampx sandbox secret set STRIPE_CANCEL_URL http://localhost:5173/payment/cancel

# listar secretos
npx ampx sandbox secret list
```

Recomendación: usa `.env.local` para desarrollo local y secretos del Sandbox cuando necesites que las funciones cloud del Sandbox tengan acceso a esas variables durante la síntesis/ejecución.

### 4) Troubleshooting rápido

- Error: “Missing/undefined STRIPE_SECRET_KEY” al arrancar Sandbox o invocar la Lambda
  - Solución: crear `.env.local` con la clave o establecer el secreto con `ampx sandbox secret set STRIPE_SECRET_KEY ...` y reiniciar `npx ampx sandbox`.

- El frontend apunta al archivo de outputs equivocado
  - Verifica `VITE_AWS_ENV` (o hostname) y la lógica de `getAmplifyConfig()`.

- Cambios de esquema no aparecen (por ejemplo, campo nuevo no reconocido)
  - Reinicia el Sandbox o toca el archivo de esquema (`amplify/data/resource.ts`) para forzar resincronización.
  - Asegúrate de refrescar el frontend tras regenerarse `amplify_outputs.json`.

- Quiero volver a un estado limpio de outputs
  - Borra `amplify_outputs.json` y vuelve a arrancar `npx ampx sandbox`.

## Despliegue

- Proyecto preparado para Amplify Gen2. El pipeline/hosting puede emplear `amplify.yml` y Node 20.
- No se requieren cambios de código para alternar entre local y producción gracias a la capa de configuración de Amplify.
- Asegurar variables de entorno de Stripe en el entorno de despliegue (función Lambda) y URLs correctas.

## Seguridad y CORS

- Autenticación mediante Cognito; acceso a datos restringido por owner.
- La Lambda local añade CORS para `GET,POST,OPTIONS`. En cloud, configure CORS en API Gateway/AppSync según dominios permitidos.

## Troubleshooting

- Si `STRIPE_SECRET_KEY` no está presente, `dev-lambda` mostrará un error y sugerirá crear `.env.local` y reiniciar el proceso.
- Verifique `VITE_AWS_ENV`/host para que `getAmplifyConfig()` resuelva la salida adecuada (`amplify_outputs.local.json` vs prod).
- Asegure Node 20 (`nvm use 20`).






npx dotenv -e .env.local -- npx ampx sandbox