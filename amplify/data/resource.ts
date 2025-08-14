import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
// Touch: trigger sandbox re-synth after adding phoneNumber to Reservation
const schema = a.schema({
  Reservation: a
    .model({
      owner: a.string(), // Campo owner para identificar al usuario propietario (se llena automáticamente)
      datetime: a.datetime().required(), // Fecha y hora de la reserva (requerido)
      customerName: a.string().required(), // Nombre del cliente (requerido)
      phoneNumber: a.string(), // Teléfono desde el que ha llamado el cliente (opcional)
      partySize: a.integer().required(), // Número de personas (requerido)
      tableNumber: a.string(), // Mesa asignada (opcional por defecto)
      location: a.string(), // Ubicación de la reserva (salón, terraza, barra, etc.)
      notes: a.string(),   // Observaciones adicionales (opcional por defecto)
    })
    .authorization((allow) => [allow.owner()])
    .secondaryIndexes((index) => [
      index("owner").sortKeys(["datetime"]).name("ByOwnerAndDatetime"), // Índice GSI para consultas eficientes por owner
    ]),
  
  RestaurantConfig: a
    .model({
      owner: a.string(), // Campo owner para identificar al usuario propietario (se llena automáticamente)
      businessName: a.string(), // Nombre del negocio (opcional para backward compatibility)
      salonTables: a.integer().required(), // Número de mesas de salón
      salonCapacity: a.integer().required(), // Capacidad total de mesas de salón
      highTables: a.integer().default(0), // Mesas altas (opcional)
      highTablesCapacity: a.integer().default(0), // Capacidad de mesas altas
      terraceTables: a.integer().default(0), // Mesas de terraza (opcional)
      terraceCapacity: a.integer().default(0), // Capacidad de terraza
      barSeats: a.integer().default(0), // Plazas en la barra (opcional)
      
      // Configuración de paga y señal
      requiresDeposit: a.boolean().default(false), // ¿Requiere paga y señal?
      depositType: a.enum(['FIXED_PER_RESERVATION', 'PER_PERSON']), // Tipo de paga y señal
      depositAmount: a.float(), // Cantidad de la paga y señal
      
      // Configuración de preguntas adicionales
      askReservationReason: a.boolean().default(false), // ¿Preguntar motivo de reserva?
      askAllergies: a.boolean().default(false), // ¿Preguntar por alergias?
      askFoodType: a.boolean().default(false), // ¿Preguntar por tipo de comida?
      
      // Horarios y configuración del bot
      reservationSchedule: a.json(), // Horarios de reservas por día de la semana
      callRedirectionSchedule: a.json(), // Horarios de redirección de llamadas por día de la semana
      maxDinersPerBot: a.integer().default(6), // Número máximo de comensales que atenderá el bot
      reservationDuration: a.integer().default(120), // Tiempo de reserva en minutos (tiempo para comer)
      timezone: a.string().default('Europe/Madrid'), // Zona horaria del restaurante

      // Configuración de margen de reserva
      minTimeForReservations: a.integer(), // Tiempo mínimo de antelación para reservas (en minutos)
      actionDuringReservationGracePeriod: a.enum(['DISCARD', 'REDIRECT']), // Acción a tomar durante el período de gracia

      // Datos externos (establecidos por otros flujos)
      assignedPhoneNumber: a.string(), // Número de teléfono asignado a la centralita (opcional)

      // Suscripción Stripe
      subscriptionStatus: a.enum(['none', 'active', 'past_due', 'canceled']),
      stripeCustomerId: a.string(),
      stripeSubscriptionId: a.string(),
    })
    .authorization((allow) => [allow.owner()])
    .secondaryIndexes((index) => [
      index("owner").name("ByOwner"), // Índice GSI para consultas eficientes por owner
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
