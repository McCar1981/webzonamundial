# OAuth Setup — Google + Apple Sign In

Guía paso a paso para activar el login social en `zonamundial.app`.

Antes de empezar:

1. Abre **`https://zonamundial.app/auth/debug`** desde un navegador.
   Esa página comprueba en vivo qué variables faltan en Vercel y qué
   providers están deshabilitados en Supabase. Úsala como checklist.
2. Ten a mano credenciales de admin de:
   - Vercel (proyecto `zonamundial`)
   - Supabase Dashboard del proyecto
   - Google Cloud Console
   - Apple Developer Portal (`developer.apple.com/account`)

---

## 1. Variables de entorno en Vercel

Settings → Environment Variables (Production + Preview):

| Variable | Valor | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[PROJECT_REF].supabase.co` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Settings → API → service_role (NO exponer al cliente) |
| `NEXT_PUBLIC_SITE_URL` | `https://zonamundial.app` | Sin barra final |
| `APPLE_CLIENT_ID` | `app.zonamundial.web` | El **Services ID** que crearás en Apple Developer (paso 4) |

Después de añadir/cambiar variables: **Redeploy** el proyecto en Vercel
(las env vars solo se aplican en builds nuevos).

---

## 2. Supabase — Auth URL Configuration

Dashboard → Authentication → URL Configuration:

- **Site URL**:
  ```
  https://zonamundial.app
  ```
- **Redirect URLs** (uno por línea, pegar los DOS):
  ```
  https://zonamundial.app/auth/callback
  https://zonamundial.app/auth/callback?next=*
  ```

Guarda. Si tienes preview deploys de Vercel, añade también la URL del
preview con `?next=*` para que funcione en branches.

---

## 3. Google Cloud — OAuth 2.0 Client ID

### Paso 1: crear proyecto y consent screen

1. https://console.cloud.google.com → New Project → nombre
   `zonamundial-auth` (o el que prefieras).
2. APIs & Services → OAuth consent screen → External → Create.
3. Rellena:
   - App name: `ZonaMundial`
   - User support email: `gol@zonamundial.app`
   - App logo (opcional, mejora confianza)
   - Authorized domains: `zonamundial.app`
   - Developer contact: `gol@zonamundial.app`
4. Scopes: deja los por defecto (`email`, `profile`, `openid`).
5. Test users: añade tu email mientras esté en modo Testing.
6. Guarda.

### Paso 2: crear OAuth 2.0 Client ID

1. APIs & Services → Credentials → **+ CREATE CREDENTIALS** → OAuth client ID.
2. Application type: **Web application**.
3. Name: `ZonaMundial Web`.
4. **Authorized JavaScript origins**:
   ```
   https://zonamundial.app
   ```
5. **Authorized redirect URIs** — copia la URL exacta de la página
   `/auth/debug` (sección "Authorized redirect URI en Google Cloud"):
   ```
   https://[PROJECT_REF].supabase.co/auth/v1/callback
   ```
   *Importante*: no es la URL de zonamundial.app. Es la de Supabase,
   porque Supabase intercepta primero el code y luego nos lo pasa.
6. Create. Copia **Client ID** y **Client Secret**.

### Paso 3: pegar credenciales en Supabase

Supabase Dashboard → Authentication → Providers → **Google**:

- Toggle: **Enable**.
- Client ID (for OAuth): pega.
- Client Secret (for OAuth): pega.
- Skip nonce checks: dejar **off**.
- Save.

### Paso 4: publicar la app de Google

Si dejas el consent screen en "Testing", solo los test users pueden
loguearse. Para abrirlo a todo el mundo:

1. APIs & Services → OAuth consent screen → **Publish App**.
2. Google pide verificación si pides scopes sensibles. Como solo usamos
   `email + profile + openid` (no sensibles), la publicación es
   inmediata. Sin verificación extra.

---

## 4. Apple Developer — Sign In with Apple (web)

⚠️ Requiere Apple Developer Program activo ($99/año). Si no lo tienes,
salta este apartado y desactiva el botón "Apple" en `/login` temporalmente.

### Paso 1: Apple App ID

1. https://developer.apple.com/account → Certificates, Identifiers & Profiles → Identifiers → **+**.
2. App IDs → App → Continue.
3. Description: `ZonaMundial App`. Bundle ID: `app.zonamundial.ios` (explicit).
4. En Capabilities, marca **Sign In with Apple**. Continue → Register.

### Paso 2: Services ID (el que usamos en la web)

1. Identifiers → **+** → Services IDs → Continue.
2. Description: `ZonaMundial Web`. Identifier: `app.zonamundial.web`.
   *Este string es el que va en `APPLE_CLIENT_ID` en Vercel.*
3. Continue → Register.
4. Selecciona el Services ID recién creado → **Configure** junto a
   "Sign In with Apple":
   - Primary App ID: el del paso 1 (`app.zonamundial.ios`).
   - Domains and Subdomains:
     ```
     zonamundial.app
     ```
   - Return URLs — copia la de `/auth/debug` (sección "Return URL en
     Apple Developer"):
     ```
     https://[PROJECT_REF].supabase.co/auth/v1/callback
     ```
   - Server-to-Server Notification Endpoint:
     ```
     https://zonamundial.app/api/auth/apple/notifications
     ```
   - Save → Continue → Save.

### Paso 3: clave privada (.p8) para firmar el client_secret

1. Identifiers → **Keys** → **+**.
2. Key Name: `ZonaMundial SIWA Key`.
3. Marca **Sign In with Apple** → Configure → Primary App ID = el App ID
   del paso 1 → Save.
4. Continue → Register → **Download** el archivo `.p8` (solo se puede
   descargar UNA VEZ; guárdalo en sitio seguro).
5. Anota el **Key ID** (10 caracteres alfanuméricos).
6. Anota tu **Team ID** (esquina superior derecha del portal Apple
   Developer, 10 caracteres).

### Paso 4: pegar credenciales en Supabase

Supabase Dashboard → Authentication → Providers → **Apple**:

- Toggle: **Enable**.
- **Services ID**: `app.zonamundial.web` (paso 2).
- **Team ID**: el 10-char del portal.
- **Key ID**: el 10-char del paso 3.
- **Secret Key (PKCS#8)**: pega el CONTENIDO del archivo `.p8`
  (incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`).
- Save.

Supabase usa esos cuatro datos para firmar el `client_secret` JWT que
Apple exige en cada login. Es válido 6 meses; Supabase lo renueva solo.

### Paso 5: probar el flujo Apple

Apple requiere que el dominio esté verificado. Si es la primera vez:

1. Tras configurar el Services ID, Apple muestra un botón **Download**
   junto a "Domain verification".
2. Descarga el archivo `apple-developer-domain-association.txt`.
3. Súbelo a `https://zonamundial.app/.well-known/apple-developer-domain-association.txt`.
4. En Apple Developer, pulsa **Verify**. Debe pasar a "Verified".

Si te da pereza configurar el archivo: usa `next.config` para servir el
contenido como ruta estática, o crea `public/.well-known/apple-developer-domain-association.txt`
con el contenido que Apple te dio.

---

## 5. Verificación end-to-end

1. Despliega los cambios en Vercel (push a `main`).
2. Abre `https://zonamundial.app/auth/debug` — todas las filas deben
   estar en verde.
3. Abre `https://zonamundial.app/login` en incógnito.
4. Click en **Google** → debes ver el selector de cuentas de Google →
   tras aceptar, vuelves a la app. La primera vez aterrizas en
   `/onboarding`; las siguientes, directo a `/`.
5. Click en **Apple** → debes ver el modal de Apple ID → si Apple te pide
   email, marca "Hide my email" para probar el Relay → vuelves a la app
   → onboarding.
6. En Supabase Dashboard → Authentication → Users, debes ver dos
   usuarios nuevos: uno con provider `google` y otro con `apple`.
7. (Opcional) Quita y vuelve a otorgar permisos en
   `https://account.apple.com` → Sign-in & Security → Sign in with Apple.
   Apple debería enviar un webhook `consent-revoked` a
   `/api/auth/apple/notifications`. Verifica en
   `apple_signin_events` (Supabase) que el evento aparece.

---

## 6. Troubleshooting

### `Unsupported provider: provider is not enabled`
El toggle de Google/Apple en Supabase Auth → Providers está apagado.

### `Error 400: redirect_uri_mismatch` (Google)
La Authorized redirect URI en Google Cloud no coincide. Debe ser
exactamente `https://[PROJECT_REF].supabase.co/auth/v1/callback` (con
HTTPS y sin barra final).

### `invalid_client` (Apple)
- El Services ID en Supabase no coincide con el creado en Apple.
- El Key ID o Team ID están mal.
- El contenido del `.p8` está pegado sin las líneas BEGIN/END.
- El dominio no está verificado.

### Apple Sign In funciona pero no llegan webhooks
- El endpoint Server-to-Server en Apple Developer está vacío o mal.
- `APPLE_CLIENT_ID` en Vercel no coincide con el Services ID — el
  webhook verifica `aud` contra esta variable.
- Apple envía webhooks solo cuando ocurre un evento real
  (consent revoked, email disabled, account delete). Para forzar:
  revoca permisos desde `account.apple.com`.

### Usuario logueado pero no le redirige a `/onboarding`
- Falta la tabla `profiles` en Supabase, o la fila no se crea automáticamente.
- Confirma que existe un trigger `on_auth_user_created` que inserta una
  fila en `public.profiles` cuando se crea un user en `auth.users`.
- Si la tabla está pero falta el trigger, los nuevos usuarios pueden
  llegar a `/` sin perfil. Ejecuta:
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
  BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```

### Tras login OAuth aparece la sesión, pero `/onboarding` redirige a `/`
- El callback comprueba `profiles.onboarded_at`. Si la fila no existe
  (trigger no creado, ver arriba) el código asume "no hace falta
  onboarding" y va a `/`. Crea el trigger.

---

## 7. Extender a la app móvil (iOS / Android) cuando llegue

El mismo usuario que se registra hoy en `zonamundial.app` desde la web va a
poder loguearse en la app iOS/Android cuando salga, **sin perder su data**.
Razón: Supabase guarda al usuario por su `sub` (identificador estable que
da Apple/Google), y ese `sub` es el mismo en cualquier plataforma para la
misma cuenta. La app no crea un user nuevo — encuentra el preexistente.

Lo que SÍ hay que añadir cuando se desarrolle la app:

### iOS — Apple Sign In nativo

iOS no usa el `app.zonamundial.web` (Services ID, para web), usa el
**Bundle ID** `app.zonamundial.ios` (App ID). En Supabase hay que añadir
ambos como Client IDs aceptados:

1. Supabase Dashboard → Authentication → Providers → Apple → Client IDs.
2. Cambiar valor actual:
   ```
   app.zonamundial.web
   ```
   a (separado por coma, sin espacios):
   ```
   app.zonamundial.web,app.zonamundial.ios
   ```
3. Save.

El JWT `client_secret` que generaste con `scripts/generate-apple-client-secret.js`
**vale para los dos**: la firma usa el Team ID y la Key, no depende del
Services ID concreto. No hay que regenerar.

En el código nativo iOS, usar `AuthenticationServices.framework` (SDK
oficial de Apple) en lugar de OAuth web. El SDK devuelve un `identityToken`
que se pasa a Supabase con `supabase.auth.signInWithIdToken({ provider:
"apple", token: identityToken })`.

### iOS — Google Sign In nativo

Google requiere un **OAuth Client ID separado para iOS** (distinto del de
web). Crearlo en:

- https://console.cloud.google.com → Credentials → Create Credentials → OAuth
  client ID → Application type: **iOS**
- Bundle ID: `app.zonamundial.ios`

Luego añadirlo a Supabase → Auth → Providers → Google → Client IDs como
segundo valor separado por coma. La librería oficial Google Sign In iOS
devuelve un `idToken` que se pasa con `signInWithIdToken({ provider:
"google", token: idToken })`.

### Android — Google Sign In nativo

Lo mismo que iOS pero con tipo **Android** en Google Cloud Console:

- Package name: `app.zonamundial.android`
- SHA-1 fingerprint del certificado de firma del APK/AAB.

Añadirlo a Supabase como tercer Client ID.

### Android — Apple Sign In

Android no tiene SDK nativo de Apple. Hay que abrir el flow OAuth web
desde la app Android usando un `WebView` o Custom Tabs apuntando a
`https://appleid.apple.com/auth/authorize?...` con el mismo `app.zonamundial.web`
como client_id. El return URL acaba en `app.zonamundial://callback` (deep
link de la app), y Supabase Auth Helpers para Android se encarga del
exchange.

### Cómo se ata todo

Cuando un user de la web abre la app por primera vez y hace login con
Apple/Google:

1. La app obtiene el `idToken` del SDK nativo.
2. Llama a `supabase.auth.signInWithIdToken()` con ese token.
3. Supabase compara el `sub` del token con la columna `apple_sub` /
   `google_sub` de `auth.users`.
4. Si coincide → carga la misma sesión que en web. **Todo el historial,
   predicciones y perfil del usuario están ahí**.
5. Si no coincide (es la primera vez en cualquier sitio) → crea user nuevo
   y dispara onboarding.

No hace falta sincronizar nada manualmente. La única condición es que
todos los Client IDs (web + iOS + Android) estén configurados bajo el
**mismo proyecto Supabase** y compartan provider.

### Server-to-Server Notifications de Apple

El endpoint `/api/auth/apple/notifications` que ya tenemos desplegado
acepta webhooks de Apple para cualquier plataforma. Cuando un user borre
su Apple ID o revoque permisos desde el menú de su iPhone, Apple manda el
webhook → nuestro endpoint borra la cuenta también de la web y la app.
**Es obligatorio para aprobar la app en App Store** (sin esto, Apple
rechaza la app en revisión).

Documentación de App Store sobre el requisito:
https://developer.apple.com/app-store/review/guidelines/#4.8

---

## 8. Regenerar el client_secret JWT cada 6 meses

Apple obliga a que el JWT que Supabase usa como `Secret Key (for OAuth)`
caduque cada 6 meses como máximo. Sin un JWT vigente, todos los logins de
Apple fallan en producción.

El JWT actual caduca el **13 de noviembre de 2026**. Pon una alerta en
tu calendario para el **6 de noviembre de 2026** (7 días antes).

Para regenerarlo:

```bash
node scripts/generate-apple-client-secret.js \
  "C:/Users/Neo-PC/Downloads/AuthKey_648779U73X.p8"
```

(o la ruta donde tengas el `.p8` guardado).

El script imprime el JWT nuevo. Pega el resultado en:

```
Supabase Dashboard → Auth → Providers → Apple → Secret Key (for OAuth)
```

Save. Verifica con `/auth/debug` que Apple sigue verde.

Si has perdido el `.p8` original: hay que generar una Key nueva en Apple
Developer (Keys → + → Sign in with Apple → Configure → Save → Download
`.p8`). Anota el nuevo Key ID y actualiza la constante `KEY_ID` en
`scripts/generate-apple-client-secret.js`.

---

## 9. Resumen de URLs

| Donde la pegas | URL |
|---|---|
| Supabase → Auth → URL Configuration → Site URL | `https://zonamundial.app` |
| Supabase → Auth → URL Configuration → Redirect URLs | `https://zonamundial.app/auth/callback`, `https://zonamundial.app/auth/callback?next=*` |
| Google Cloud → OAuth Client → Authorized JS origins | `https://zonamundial.app` |
| Google Cloud → OAuth Client → Authorized redirect URIs | `https://[PROJECT_REF].supabase.co/auth/v1/callback` |
| Apple Developer → Services ID → Domains | `zonamundial.app` |
| Apple Developer → Services ID → Return URLs | `https://[PROJECT_REF].supabase.co/auth/v1/callback` |
| Apple Developer → Services ID → S2S Notification | `https://zonamundial.app/api/auth/apple/notifications` |
| Apple Developer → Domain verification file | `https://zonamundial.app/.well-known/apple-developer-domain-association.txt` |

Reemplaza `[PROJECT_REF]` por tu ID real (los primeros chars de la URL
de Supabase, antes de `.supabase.co`). La página `/auth/debug` te lo
muestra ya rellenado.
