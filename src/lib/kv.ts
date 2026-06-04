// src/lib/kv.ts
//
// Cliente de Vercel KV con lectura SIN caché.
//
// El cliente por defecto de @vercel/kv fuerza `cache: "default"` en sus fetch.
// En el App Router de Next.js eso hace que las LECTURAS (GET a la REST de
// Upstash: get, hgetall, hkeys, smembers...) se guarden en el Data Cache y se
// reutilicen indefinidamente. Resultado: tras la primera lectura, las
// siguientes devuelven un valor obsoleto aunque haya habido escrituras (las
// escrituras van por POST y sí llegan a Redis, pero nunca se ven al leer).
//
// Esto rompía el banco "infinito" de la trivia: el banco parecía estancarse
// porque addToBank escribía bien pero getQuestionBank devolvía siempre el valor
// cacheado. Forzando `cache: "no-store"` (el valor por defecto de upstash/redis)
// cada lectura va a Redis y refleja las escrituras al instante.

import { createClient, type VercelKV } from "@vercel/kv";

let client: VercelKV | null = null;

function getClient(): VercelKV {
  if (!client) {
    client = createClient({
      url: process.env.KV_REST_API_URL as string,
      token: process.env.KV_REST_API_TOKEN as string,
      cache: "no-store",
    });
  }
  return client;
}

// Proxy perezoso: solo crea el cliente cuando se usa de verdad (así no falla en
// local sin variables de KV, donde el store usa el fallback de fichero).
export const kv = new Proxy({} as VercelKV, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop);
  },
});
