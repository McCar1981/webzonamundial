// src/lib/ops/config.ts
//
// Configuración declarativa de QUÉ vigila el centro de control. Tocar este
// fichero (no el motor) para añadir endpoints o crons a la vigilancia.

export interface EndpointProbe {
  name: string;
  path: string; // relativo al dominio
  // Umbral de latencia (ms) por encima del cual marcamos "warning".
  warnLatencyMs: number;
  // Si true, esperamos JSON { ok: boolean, status?: string } y lo evaluamos.
  expectHealthJson?: boolean;
}

export interface CronWatch {
  job: string; // nombre del heartbeat (debe coincidir con recordHeartbeat)
  path: string; // ruta del cron, para re-disparar en remediación
  // Edad máxima del último latido antes de considerarlo "parado" (minutos).
  maxAgeMinutes: number;
  // Severidad si está parado. "info" = sólo informativo (no abre incidente ni
  // alerta): para crons diarios poco críticos cuya parada no requiere despertarte.
  severity: "info" | "warning" | "critical";
  // ¿Es seguro re-dispararlo automáticamente? Sólo crons idempotentes.
  safeRetrigger: boolean;
}

// Endpoints públicos y baratos. NO incluir rutas que escriban datos NI rutas
// que peguen a api-football en cada request (gastarían cuota cada 2 min).
export const ENDPOINT_PROBES: EndpointProbe[] = [
  { name: "health", path: "/api/health", warnLatencyMs: 1500, expectHealthJson: true },
  { name: "home", path: "/", warnLatencyMs: 2500 },
  { name: "app-lobby", path: "/app", warnLatencyMs: 2500 },
  // Páginas de contenido estáticas/ISR (Sanity/KV/datos): no gastan cuota.
  { name: "noticias", path: "/noticias", warnLatencyMs: 3000 },
  { name: "calendario", path: "/calendario", warnLatencyMs: 3000 },
  { name: "selecciones", path: "/selecciones", warnLatencyMs: 3000 },
  { name: "blog", path: "/blog", warnLatencyMs: 3000 },
];

// Crons cuya parada es un síntoma vigilado. Requiere que el cron llame a
// recordHeartbeat(job) al terminar (ver src/lib/ops/store.ts). TODOS los crons
// programados en vercel.json están aquí. safeRetrigger=false en los que envían
// emails/push (no auto-reenviar) o no son idempotentes — esos sólo alertan.
const DAY = 24 * 60;
export const CRON_WATCHES: CronWatch[] = [
  // ── Cada minuto: si dejan de latir >5 min, el feed EN VIVO está roto ──
  { job: "poll-friendlies", path: "/api/cron/poll-friendlies", maxAgeMinutes: 5, severity: "critical", safeRetrigger: true },
  { job: "match-center-poll", path: "/api/cron/match-center-poll", maxAgeMinutes: 5, severity: "critical", safeRetrigger: true },
  { job: "resolve-micro", path: "/api/cron/resolve-micro", maxAgeMinutes: 5, severity: "warning", safeRetrigger: true },
  // ── Alta frecuencia ──
  { job: "match-reminders", path: "/api/cron/match-reminders", maxAgeMinutes: 25, severity: "warning", safeRetrigger: true },
  { job: "resolve-predictions", path: "/api/cron/resolve-predictions", maxAgeMinutes: 75, severity: "warning", safeRetrigger: true },
  { job: "sync-fixtures", path: "/api/cron/sync-fixtures", maxAgeMinutes: 7 * 60, severity: "warning", safeRetrigger: true },
  // ── Ingesta de noticias 3x/día (7,13,19 UTC): >14h sin latido = problema ──
  { job: "ingest-news", path: "/api/cron/ingest-news", maxAgeMinutes: 14 * 60, severity: "warning", safeRetrigger: false },
  // ── Diarios: gracia de 2h sobre 24h. Email/push → safeRetrigger=false ──
  { job: "daily-stats", path: "/api/cron/daily-stats", maxAgeMinutes: DAY + 120, severity: "info", safeRetrigger: true },
  { job: "send-daily-digest", path: "/api/cron/send-daily-digest", maxAgeMinutes: DAY + 120, severity: "warning", safeRetrigger: false },
  { job: "update-team-form", path: "/api/cron/update-team-form", maxAgeMinutes: DAY + 120, severity: "info", safeRetrigger: true },
  { job: "update-team-injuries", path: "/api/cron/update-team-injuries", maxAgeMinutes: DAY + 120, severity: "info", safeRetrigger: true },
  { job: "generate-trivia", path: "/api/cron/generate-trivia", maxAgeMinutes: DAY + 120, severity: "info", safeRetrigger: true },
  { job: "predictions-engagement", path: "/api/cron/predictions-engagement", maxAgeMinutes: DAY + 120, severity: "warning", safeRetrigger: false },
];

export function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
