# Sign In with Apple — Server-to-Server Notifications

Endpoint público que recibe los webhooks que Apple manda cuando un
usuario:

- Revoca el acceso a la app (`consent-revoked`)
- Borra su Apple ID (`account-delete`)
- Desactiva o reactiva el reenvío de email del Relay (`email-disabled`,
  `email-enabled`)

Implementar este endpoint y manejar correctamente `account-delete` es
**obligatorio para pasar la revisión de App Store** desde 2022 si la
app ofrece Sign In with Apple.

## URL

```
POST https://zonamundial.app/api/auth/apple/notifications
```

Content-Type: `application/json`

Body que Apple envía:

```json
{ "payload": "<JWT firmado por Apple>" }
```

## Configuración en Apple Developer Portal

1. Abre [developer.apple.com](https://developer.apple.com/account) →
   Certificates, IDs & Profiles → **Identifiers**.
2. Selecciona tu **Services ID** (web) o **App ID** (iOS).
3. Pulsa el botón _Configure_ junto a "Sign In with Apple".
4. En el campo **Server-to-Server Notification Endpoint** pega:
   ```
   https://zonamundial.app/api/auth/apple/notifications
   ```
5. Pulsa **Save**.

Apple empezará a enviar notificaciones inmediatamente. Hay un endpoint
de pruebas en sandbox (`appleid.apple.com/.well-known`) pero los
webhooks llegan al endpoint configurado en producción una vez aprobado.

## Variables de entorno (Vercel)

| Var | Valor | Descripción |
|---|---|---|
| `APPLE_CLIENT_ID` | `app.zonamundial.web` | El Services ID o Bundle ID. **Debe coincidir con el `aud` del JWT** que envía Apple. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Para escribir en el audit log. |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (secret) | Para escribir saltándose RLS. |

Si tu app iOS y la web usan IDs diferentes (ej.
`com.zonamundial.app` para iOS y `app.zonamundial.web` para web), Apple
manda dos webhooks distintos y debes configurar el mismo endpoint en
ambos. Cambia `APPLE_CLIENT_ID` por una lista separada por comas y
ajusta `verifyAppleNotificationJwt` para aceptar varias audiencias si
hace falta.

## Migración SQL

Antes del primer deploy, aplica:

```
scripts/sql/2026-05-apple-signin-notifications.sql
```

en Supabase Studio (SQL Editor → Run). Crea:

- Tabla `apple_signin_events` (audit log idempotente por `jti`).
- Columnas en `users`: `apple_sub`, `apple_consent_revoked_at`,
  `email_disabled`, `email_disabled_at`, `deleted_at`,
  `deleted_reason`, `is_active`.

Si tu tabla `public.users` no existe (usas solo `auth.users`),
edita el SQL para añadir las columnas como metadatos de usuario o
crea una tabla espejo.

## Cómo se persiste `apple_sub`

Cuando el usuario hace login con Apple por primera vez en la web o en
la app, hay que guardar el `sub` del token de Apple en
`public.users.apple_sub`. Sin esto, el webhook no sabrá a qué user
local aplicar las acciones.

Si usas Supabase Auth con el provider Apple, el `sub` queda en
`auth.users.raw_user_meta_data.sub` automáticamente — basta con copiarlo
a `public.users` con un trigger:

```sql
-- Ejemplo de trigger para auto-poblar apple_sub al insertar en
-- public.users desde auth.users.
CREATE OR REPLACE FUNCTION public.sync_apple_sub() RETURNS trigger AS $$
BEGIN
  IF NEW.apple_sub IS NULL THEN
    SELECT raw_user_meta_data->>'sub'
      INTO NEW.apple_sub
      FROM auth.users
      WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_apple_sub
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_apple_sub();
```

## Cómo probar localmente

Apple no expone una herramienta oficial de testing. Las opciones son:

1. **Generar un JWT de prueba firmado por una clave que el handler
   pueda verificar.** Útil para tests unitarios pero requiere mockear
   `createRemoteJWKSet` de `jose`. Hay ejemplos en
   [appleid.apple.com docs](https://developer.apple.com/documentation/sign_in_with_apple/processing_changes_for_sign_in_with_apple_accounts).
2. **Forzar un evento real**: borra tu propia Apple ID de prueba
   (Apple genera una en Sandbox) y observa la entrada en
   `apple_signin_events`.
3. **curl al endpoint con un payload inválido** para verificar que
   responde 400 a firmas falsas:
   ```bash
   curl -X POST https://zonamundial.app/api/auth/apple/notifications \
     -H "Content-Type: application/json" \
     -d '{"payload":"xxx.yyy.zzz"}'
   # → {"error":"invalid_signature"}, status 400
   ```

## Códigos de respuesta

| Status | Cuándo |
|---|---|
| 200 | JWT verificado y procesado (o duplicado por `jti`). |
| 400 | Body sin `payload`, JSON inválido o firma inválida. |
| 405 | GET (Apple solo usa POST). |

Apple deja de reintentar tras un 200 o tras 24 h de 4xx/5xx
consecutivos. Por eso el handler devuelve 200 incluso si la acción
downstream (Supabase) falla — el evento queda en logs de Vercel y se
puede reprocesar manualmente con el `jti`.

## Auditoría y RGPD

Cada evento queda registrado en `apple_signin_events` con:

- `jti` (PK, idempotente)
- `event_type`, `apple_sub`, `apple_email`, `is_private_email`,
  `event_time`, `raw_event` completo
- `received_at` (cuándo procesamos nosotros)

Esto sirve como prueba legal de que cumplimos con el derecho de
supresión (art. 17 RGPD) cuando el usuario borra su Apple ID. La
acción `account-delete` hace:

1. `users.deleted_at = now()`, `deleted_reason = 'apple_account_delete'`,
   `is_active = false`
2. `supabase.auth.admin.deleteUser()` (revoca sesiones Auth)

Mantiene FK consistencia (predicciones, ligas, etc. siguen referenciando
al user "borrado" para evitar romper rankings históricos, pero el user
no puede volver a iniciar sesión y su PII se redacta vía cron job
diferenciado).
