# Sistema de notificaciones — Integración Web ↔ App móvil

> **Para el equipo de desarrollo de la app móvil de ZonaMundial.**
> Documenta cómo la app reutiliza la infraestructura ya desplegada en web sin duplicar tablas ni endpoints.

## Resumen

ZonaMundial tiene **3 fases del sistema de notificaciones** ya desplegadas en producción:

- **FASE 1** — Email digest diario (web) vía Resend
- **FASE 2** — Web Push (Service Worker + VAPID, navegadores)
- **FASE 3** — Preferencias granulares por categoría/canal

La FASE 3 es **universal**: la app móvil consume las mismas filas que la web.

---

## Tabla unificada: `notification_preferences`

Esta tabla es el **único source of truth** para "qué quiere recibir el user". Funciona igual para web y app.

```sql
CREATE TABLE public.notification_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,   -- 'news', 'fav-team', 'fantasy', etc.
  channel     TEXT NOT NULL,   -- 'push', 'email', 'in-app'
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UNIQUE (user_id, category, channel)
```

### Categorías acordadas

| Categoría | Significado | Disparador | Plataforma |
|---|---|---|---|
| `news` | Cada noticia publicada en /noticias | Cron `/api/cron/ingest-news` (web) | ✅ Web |
| `tournament-key-events` | Sorteo, octavos, cuartos, semis, final | Admin manual (web) | ✅ Web |
| `blog-posts` | Nuevos posts del blog | Cron blog (web) | ✅ Web |
| `fav-team` | Su selección favorita juega/marca/convoca | Backend móvil (vigila partidos) | 📱 App |
| `predictions-reminder` | Antes de cada partido — "recuerda predecir" | Scheduler antes de cada partido | 📱 App |
| `fantasy` | Movimientos de su equipo, mercado | Backend Fantasy | 📱 App |
| `creators` | Su creador favorito publica contenido | Webhook IG/TikTok | 📱 App o Web |

### Canales

- `push` — Web Push (web) + FCM/APNs (app)
- `email` — Resend (web)
- `in-app` — campana dentro de la app (futuro)

### RLS activo

El user solo puede leer/escribir sus propias filas. El backend bypassa RLS con `SUPABASE_SERVICE_ROLE_KEY` para los crons/triggers.

---

## ¿Qué necesita crear la app móvil?

### 1. Tabla `mobile_devices` (nueva, propia de la app)

Equivalente a `push_subscriptions` pero para tokens nativos FCM/APNs:

```sql
CREATE TABLE public.mobile_devices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  fcm_token    TEXT,        -- Firebase Cloud Messaging (Android + iOS si usa Firebase)
  apns_token   TEXT,        -- Apple Push Notification (iOS nativo)
  device_id    TEXT,        -- IDFV (iOS) o ANDROID_ID
  app_version  TEXT,
  locale       TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX mobile_devices_fcm_unique ON mobile_devices(fcm_token) WHERE fcm_token IS NOT NULL;
CREATE UNIQUE INDEX mobile_devices_apns_unique ON mobile_devices(apns_token) WHERE apns_token IS NOT NULL;
CREATE INDEX mobile_devices_user_idx ON mobile_devices(user_id);
```

### 2. Endpoint `/api/mobile/register-device`

```http
POST /api/mobile/register-device
Authorization: Bearer <supabase_access_token>
Content-Type: application/json

{
  "platform": "ios",
  "fcm_token": "...",
  "apns_token": "...",
  "device_id": "...",
  "app_version": "1.2.3"
}
```

Hace UPSERT por `(user_id, platform, device_id)` para que un mismo dispositivo no acumule filas si reinstala.

### 3. Disparadores específicos de la app

Cuando algo ocurre que dispara una categoría móvil:

```typescript
// Pseudocódigo del backend de la app móvil
async function notifyFavTeamGoal(userId: string, payload: {
  teamSlug: string;
  matchUrl: string;
  scorer: string;
}) {
  // 1) Comprobar preferencia (tabla compartida)
  const { data: pref } = await supabase
    .from("notification_preferences")
    .select("enabled")
    .eq("user_id", userId)
    .eq("category", "fav-team")
    .eq("channel", "push")
    .maybeSingle();

  if (pref && !pref.enabled) return;
  // Si no hay fila → respetar defaults definidos en el panel /cuenta/notificaciones

  // 2) Obtener tokens del user
  const { data: devices } = await supabase
    .from("mobile_devices")
    .select("fcm_token, apns_token, platform")
    .eq("user_id", userId);

  // 3) Enviar via FCM/APNs
  for (const d of devices ?? []) {
    if (d.platform === "android" && d.fcm_token) {
      await fcm.send(d.fcm_token, payload);
    } else if (d.platform === "ios" && d.apns_token) {
      await apns.send(d.apns_token, payload);
    }
  }
}
```

### 4. Pantalla de notificaciones en la app

Debe **leer y escribir** la misma tabla `notification_preferences`:

```typescript
// React Native / Swift / Kotlin — pseudocódigo
async function loadUserPreferences(userId: string) {
  return supabase
    .from("notification_preferences")
    .select("category, channel, enabled")
    .eq("user_id", userId);
}

async function togglePreference(opts: {
  userId: string;
  category: string;
  channel: "push" | "email" | "in-app";
  enabled: boolean;
}) {
  return supabase
    .from("notification_preferences")
    .upsert(opts, { onConflict: "user_id,category,channel" });
}
```

Así, si el user cambia "Fantasy push" en la app, la preferencia se persiste y vale para cualquier futuro device (móvil u otro).

---

## Endpoints API actuales (web) que la app puede reutilizar

Si por alguna razón la app móvil no quiere hablar directo a Supabase y prefiere pasar por nuestro backend Next.js, los endpoints REST son:

### `GET /api/notifications/preferences`
Devuelve las preferencias del user autenticado.

### `POST /api/notifications/preferences`
Body: `{ category, channel, enabled }`. Upsert.

Ambos requieren cookie de sesión Supabase o `Authorization: Bearer <token>`.

---

## Defaults para usuarios nuevos

Cuando un usuario se registra en web o app, **conviene crear las filas de defaults** para que vea los toggles ya configurados:

```sql
INSERT INTO notification_preferences (user_id, category, channel, enabled)
VALUES
  -- Activas por defecto (alta señal, baja frecuencia)
  ($1, 'news', 'email', true),
  ($1, 'tournament-key-events', 'email', true),
  ($1, 'tournament-key-events', 'push', true),
  ($1, 'fav-team', 'push', true),
  -- Inactivas por defecto (alta frecuencia, opt-in explícito)
  ($1, 'predictions-reminder', 'push', false),
  ($1, 'fantasy', 'push', false)
ON CONFLICT (user_id, category, channel) DO NOTHING;
```

La función helper `ensureDefaultPreferences(userId)` en `src/lib/notification-preferences.ts` ya hace algo parecido para web — la app puede invocarla a través de la API o replicarla en su backend.

---

## Política RGPD

El user debe poder:
1. **Activar/desactivar cualquier categoría/canal** en cualquier momento (toggle).
2. **Darse de baja total** con 1 click (toggle global o "Borrar todas mis preferencias").
3. **Tener acceso a la política de privacidad** desde la pantalla de preferencias.
4. **Eliminar su cuenta** → cascadea borrado de `notification_preferences`, `push_subscriptions`, `mobile_devices`, `email_subscriptions`.

Ya está implementado para web. La app debe replicar el mismo nivel.

---

## Resumen para tu equipo

1. ✅ **No dupliquéis preferencias** — usad `notification_preferences` (ya existe).
2. ✅ **Cread `mobile_devices`** para tokens FCM/APNs (es vuestra responsabilidad).
3. ✅ **Cread los disparadores móviles** (fav-team, fantasy, predictions-reminder) en vuestro backend, consultando antes la tabla de prefs.
4. ✅ **Replicad la pantalla** de notificaciones leyendo/escribiendo la misma tabla.
5. ✅ Sincronizad las **categorías y nombres exactos** con esta documentación para que web y app vean lo mismo.

---

## Contacto

- Backend web: `gol@zonamundial.app`
- Repo web: github.com/McCar1981/webzonamundial
- Schema actual: `scripts/sql/2026-05-notification-preferences.sql`
- Helper TypeScript: `src/lib/notification-preferences.ts`

Última actualización: 2026-05-18.
