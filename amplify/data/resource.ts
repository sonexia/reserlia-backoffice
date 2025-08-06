import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Reservation: a
    .model({
      datetime: a.datetime().required(), // Fecha y hora de la reserva (requerido)
      customerName: a.string().required(), // Nombre del cliente (requerido)
      partySize: a.integer().required(), // Número de personas (requerido)
      tableNumber: a.string(), // Mesa asignada (opcional por defecto)
      notes: a.string(),   // Observaciones adicionales (opcional por defecto)
    })
    .authorization((allow) => [allow.owner()]),
  
  RestaurantConfig: a
    .model({
      salonTables: a.integer().required(), // Número de mesas de salón
      salonCapacity: a.integer().required(), // Capacidad total de mesas de salón
      highTables: a.integer().default(0), // Mesas altas (opcional)
      highTablesCapacity: a.integer().default(0), // Capacidad de mesas altas
      terraceTables: a.integer().default(0), // Mesas de terraza (opcional)
      terraceCapacity: a.integer().default(0), // Capacidad de terraza
      barSeats: a.integer().default(0), // Plazas en la barra (opcional)
    })
    .authorization((allow) => [allow.owner()]),
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
