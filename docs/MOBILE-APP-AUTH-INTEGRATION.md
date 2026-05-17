# Integración Auth para la App Móvil — ZonaMundial

**Para:** Equipo de desarrollo de la app móvil iOS/Android
**Desde:** Equipo web ZonaMundial · Sprintmarkt
**Fecha:** mayo 2026
**Versión:** 1.0

---

## TL;DR — Qué hay que hacer

1. La **app móvil delega el login a Supabase Auth** (ya configurado en producción).
2. Supabase devuelve un **JWT firmado** que la app guarda en secure storage.
3. **Vuestro backend (Postgres propio) verifica el JWT** con la JWKS pública de Supabase y extrae `user.id` (UUID).
4. **Usad ese UUID** como PK/FK en vuestra tabla `users` → mismo identificador que la web → un user que se registró en la web encuentra su data al entrar en la app.
5. En el **primer login móvil**, la app llama a `GET /api/users/me/profile` (endpoint web) para replicar el perfil (username, país, equipo favorito) a vuestro Postgres.

Toda la complejidad de OAuth con Apple y Google **ya está hecha** del lado web — vosotros consumís un SDK, no configuráis providers.

---

## 1. Por qué este diseño

La web `zonamundial.app` ya tiene en producción:

- Sign In with Google (web)
- Sign In with Apple (web)
- Magic Link por email
- Endpoint Server-to-Server Notifications de Apple (`/api/auth/apple/notifications`) — obligatorio para App Store.
- Usuarios pre-registrándose desde el Mundial.

Si la app monta **otro sistema de auth aparte**, tendríamos:
- Dos cuentas para el mismo usuario (web + app).
- Sincronización de usuarios entre dos BD (race conditions, conflictos de email).
- Coste de infra duplicado (otro proveedor de OAuth, secrets, certificados Apple).
- Doble mantenimiento del client_secret JWT de Apple (caduca cada 6 meses).

**Delegando el auth a Supabase** (lo que llamamos "BYO Auth" desde vuestro lado) conseguimos:

- Identidad única entre web y app — un user es **el mismo UUID en cualquier plataforma**.
- Sin sincronización ni duplicados.
- La app móvil no toca certificados Apple ni client secrets — solo usa el SDK.
- Vuestro Postgres se queda con la data de negocio de la app; Supabase solo se ocupa de **quién es quién**.

---

## 2. Datos del proyecto Supabase de ZonaMundial

| Dato | Valor |
|---|---|
| **Project URL** | `https://okpcqywuyharinzntaxy.supabase.co` |
| **JWKS endpoint (para verificar JWTs)** | `https://okpcqywuyharinzntaxy.supabase.co/auth/v1/keys` |
| **Anon Key (pública, segura para el cliente)** | Os la pasamos por canal seguro |
| **Service Role Key (solo backend)** | Os la pasamos por canal seguro |
| **Algoritmo de firma de los JWT** | ES256 (clave pública en JWKS) |
| **Issuer (`iss` claim)** | `https://okpcqywuyharinzntaxy.supabase.co/auth/v1` |
| **Audience (`aud` claim)** | `authenticated` |
| **Tiempo de vida del JWT** | 1 hora (refresh automático con SDK) |

---

## 3. Apple Sign In — Configuración existente

Apple Developer Portal ya tiene creado:

| Item | Valor |
|---|---|
| **Team ID** | `K9SP9SUWV3` |
| **App ID (iOS)** | `app.zonamundial.ios` con Sign In with Apple habilitado |
| **Services ID (Web)** | `app.zonamundial.web` con Sign In with Apple habilitado |
| **Key ID (.p8)** | `648779U73X` |
| **Server-to-Server Notification Endpoint** | `https://zonamundial.app/api/auth/apple/notifications` |

### Lo que tenéis que añadir vosotros en Apple Developer (cuando empecéis la app)

Nada. El App ID `app.zonamundial.ios` ya existe y tiene Sign In with Apple. Usadlo directamente como **Bundle Identifier** en Xcode.

### Cambio que necesitamos en Supabase

Ahora mismo, Supabase tiene como Client ID solo `app.zonamundial.web` (para la web). Cuando empecéis la app iOS, **decidme y añado `app.zonamundial.ios`** al campo Client IDs de Supabase Auth → Providers → Apple. Tarda 30 segundos.

El JWT `client_secret` que Supabase usa para firmar peticiones a Apple **vale para ambos** (web + iOS) porque se basa en el Team ID y la Key, no en el Services ID específico. No hay que regenerar nada.

---

## 4. Google Sign In — Configuración existente

Google Cloud Console ya tiene creado:

| Item | Valor |
|---|---|
| **OAuth Client ID (Web)** | configurado en Supabase, separado por canal seguro |
| **Project name** | (os pasamos credenciales por privado) |
| **Authorized JS origins** | `https://zonamundial.app` |
| **Authorized redirect URIs** | `https://okpcqywuyharinzntaxy.supabase.co/auth/v1/callback` |

### Lo que tenéis que crear vosotros en Google Cloud Console

**Un OAuth Client ID adicional por cada plataforma móvil**, en el mismo proyecto Google Cloud:

**Para iOS:**
1. Console → APIs & Services → Credentials → Create Credentials → OAuth client ID
2. Application type: **iOS**
3. Bundle ID: `app.zonamundial.ios`
4. Anotad el Client ID que devuelva.

**Para Android:**
1. Console → APIs & Services → Credentials → Create Credentials → OAuth client ID
2. Application type: **Android**
3. Package name: `app.zonamundial.android` (o el que uséis)
4. SHA-1 fingerprint del certificado de firma del APK/AAB (`gradlew signingReport` o el equivalente).
5. Anotad el Client ID que devuelva.

Mandadme ambos Client IDs y los añado a Supabase Auth → Providers → Google → Client IDs (separados por coma del actual de web).

---

## 5. Flujo de login en la app

```
┌───────────────────────────────────────────────────────────────┐
│  USUARIO TOCA EL BOTÓN "Continuar con Apple" EN LA APP iOS    │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  AuthenticationServices.framework abre el modal nativo Apple  │
│  (no es WebView, es la UI propia de iOS).                     │
│  Usuario autentica con Face ID / Touch ID / contraseña.       │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  Apple devuelve un identityToken a la app (JWT firmado por    │
│  Apple, contiene el sub del usuario).                          │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  La app llama:                                                 │
│    supabase.auth.signInWithIdToken({                           │
│      provider: "apple",                                        │
│      token: identityToken                                      │
│    })                                                          │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  Supabase verifica el identityToken contra Apple, busca al     │
│  user por su apple_sub. Si ya existe (porque hizo login en la  │
│  web antes), devuelve el MISMO user.id (UUID).                 │
│  Si no existe, lo crea con un user.id nuevo.                   │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  Supabase devuelve a la app:                                   │
│    {                                                           │
│      user: { id, email, app_metadata, user_metadata },         │
│      session: {                                                │
│        access_token: "<JWT firmado por Supabase>",             │
│        refresh_token: "...",                                   │
│        expires_at: ...                                         │
│      }                                                         │
│    }                                                           │
│  El SDK guarda la sesión en secure storage automáticamente.   │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  La app llama a vuestro backend (Postgres B) para cualquier    │
│  operación, pasando el access_token en el header:              │
│    Authorization: Bearer <access_token>                        │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  Vuestro backend:                                              │
│    1. Lee el JWT del header                                    │
│    2. Verifica firma con JWKS de Supabase                      │
│    3. Extrae user.id del claim `sub`                           │
│    4. Busca al user en su tabla users (Postgres B)             │
│    5. Si no existe en Postgres B (primer login móvil):         │
│        - Llama a GET /api/users/me/profile pasando el JWT      │
│        - Replica el perfil al Postgres B con el mismo UUID     │
│    6. Procesa la request                                       │
└───────────────────────────────────────────────────────────────┘
```

---

## 6. Implementación en iOS (Swift / SwiftUI)

### Instalación

`Package.swift` (Swift Package Manager):

```swift
dependencies: [
    .package(url: "https://github.com/supabase/supabase-swift.git", from: "2.0.0")
]
```

### Cliente Supabase

`SupabaseClient.swift`:

```swift
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "https://okpcqywuyharinzntaxy.supabase.co")!,
    supabaseKey: "<ANON_KEY>" // pública, va en la app
)
```

### Sign In with Apple

```swift
import AuthenticationServices

func handleAppleSignIn(_ authorization: ASAuthorization) async throws {
    guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
          let identityToken = credential.identityToken,
          let idTokenString = String(data: identityToken, encoding: .utf8)
    else {
        throw AuthError.invalidToken
    }

    let session = try await supabase.auth.signInWithIdToken(
        credentials: .init(provider: .apple, idToken: idTokenString)
    )

    // session.user.id es el UUID que vuestro backend usará como FK
    print("User ID: \(session.user.id)")
}
```

Usar `ASAuthorizationAppleIDProvider` para mostrar el botón nativo de Apple.

### Sign In with Google

Añadir `GoogleSignIn-iOS` (SDK oficial):

```swift
import GoogleSignIn

func handleGoogleSignIn() async throws {
    guard let presentingVC = UIApplication.shared.windows.first?.rootViewController else {
        return
    }

    let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presentingVC)
    guard let idToken = result.user.idToken?.tokenString else {
        throw AuthError.invalidToken
    }

    let session = try await supabase.auth.signInWithIdToken(
        credentials: .init(provider: .google, idToken: idToken)
    )
    print("User ID: \(session.user.id)")
}
```

### Llamar al backend con el JWT

```swift
let token = try await supabase.auth.session.accessToken

var request = URLRequest(url: URL(string: "https://api.vuestrobackend.com/predicciones")!)
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
// ... fetch
```

---

## 7. Implementación en Android (Kotlin)

### Instalación

`build.gradle.kts`:

```kotlin
dependencies {
    implementation("io.github.jan-tennert.supabase:gotrue-kt:2.7.0")
    implementation("io.github.jan-tennert.supabase:postgrest-kt:2.7.0")
    implementation("io.ktor:ktor-client-android:2.3.12")
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
}
```

### Cliente Supabase

```kotlin
val supabase = createSupabaseClient(
    supabaseUrl = "https://okpcqywuyharinzntaxy.supabase.co",
    supabaseKey = "<ANON_KEY>"
) {
    install(Auth)
    install(Postgrest)
}
```

### Sign In with Google (Credential Manager moderno)

```kotlin
suspend fun signInWithGoogle(context: Context) {
    val credentialManager = CredentialManager.create(context)
    val googleIdOption = GetGoogleIdOption.Builder()
        .setServerClientId("<GOOGLE_WEB_CLIENT_ID>") // el de web, no el de Android
        .setFilterByAuthorizedAccounts(false)
        .build()

    val request = GetCredentialRequest(listOf(googleIdOption))
    val result = credentialManager.getCredential(context, request)
    val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(result.credential.data)
    val idToken = googleIdTokenCredential.idToken

    supabase.auth.signInWith(IDToken) {
        provider = Google
        this.idToken = idToken
    }
}
```

### Sign In with Apple en Android (vía WebView/Custom Tabs)

Android no tiene SDK nativo de Apple. Se hace por OAuth web:

```kotlin
suspend fun signInWithApple(context: Context) {
    supabase.auth.signInWith(Apple) {
        // El SDK abrirá un Custom Tab apuntando a appleid.apple.com
        // Cuando vuelva, capturará el code y lo intercambiará por sesión.
        scopes.add("email")
        scopes.add("name")
    }
}
```

El SDK se encarga del Custom Tab + redirect a `app.zonamundial.android://callback`. Configurad el deep link en `AndroidManifest.xml`:

```xml
<activity android:name="...">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="app.zonamundial.android" android:host="callback" />
    </intent-filter>
</activity>
```

### Llamar al backend con el JWT

```kotlin
val token = supabase.auth.currentSessionOrNull()?.accessToken

val response = httpClient.get("https://api.vuestrobackend.com/predicciones") {
    header("Authorization", "Bearer $token")
}
```

---

## 8. Verificación del JWT en vuestro backend (Postgres B)

Independientemente del lenguaje del backend (Node, Python, Go, Java…), el flujo es siempre el mismo:

### Lo que hay que hacer

1. Recibir el header `Authorization: Bearer <JWT>` en cada request autenticada.
2. Descargar la JWKS de Supabase (cachear la respuesta 1 h):
   ```
   GET https://okpcqywuyharinzntaxy.supabase.co/auth/v1/keys
   ```
3. Verificar:
   - Firma del JWT con la public key del JWKS que coincida con el `kid` del header.
   - Algoritmo: ES256.
   - Issuer: `https://okpcqywuyharinzntaxy.supabase.co/auth/v1`
   - Audience: `authenticated`
   - `exp` no caducado.
4. Extraer el claim `sub` → ese es el `user.id` (UUID).
5. Buscar al user en vuestra tabla `users` por ese UUID.
6. Si no existe → primer login móvil → llamar a `GET /api/users/me/profile` (ver sección 9).

### Ejemplos por lenguaje

#### Node.js (jose)

```javascript
import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL("https://okpcqywuyharinzntaxy.supabase.co/auth/v1/keys")
);

async function verifySupabaseJWT(token) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: "https://okpcqywuyharinzntaxy.supabase.co/auth/v1",
    audience: "authenticated",
  });
  return payload.sub; // → "1c8e9b3a-..." (UUID del user)
}

// Middleware Express
app.use(async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.sendStatus(401);
  try {
    req.userId = await verifySupabaseJWT(auth.slice(7));
    next();
  } catch (err) {
    res.status(401).json({ error: "invalid_token" });
  }
});
```

#### Python (PyJWT + cryptography)

```python
import jwt
import requests
from functools import lru_cache

JWKS_URL = "https://okpcqywuyharinzntaxy.supabase.co/auth/v1/keys"
ISSUER = "https://okpcqywuyharinzntaxy.supabase.co/auth/v1"

@lru_cache(maxsize=1)
def get_jwks():
    return requests.get(JWKS_URL, timeout=5).json()

def verify_supabase_jwt(token: str) -> str:
    unverified = jwt.get_unverified_header(token)
    kid = unverified["kid"]
    jwks = get_jwks()
    key = next(k for k in jwks["keys"] if k["kid"] == kid)
    public_key = jwt.algorithms.ECAlgorithm.from_jwk(key)
    payload = jwt.decode(
        token,
        public_key,
        algorithms=["ES256"],
        issuer=ISSUER,
        audience="authenticated",
    )
    return payload["sub"]
```

#### Go (github.com/lestrrat-go/jwx)

```go
import (
    "context"
    "github.com/lestrrat-go/jwx/v2/jwk"
    "github.com/lestrrat-go/jwx/v2/jwt"
)

var jwksCache = jwk.NewCache(context.Background())

func init() {
    jwksCache.Register("https://okpcqywuyharinzntaxy.supabase.co/auth/v1/keys")
}

func VerifySupabaseJWT(tokenStr string) (string, error) {
    keyset, err := jwksCache.Get(context.Background(),
        "https://okpcqywuyharinzntaxy.supabase.co/auth/v1/keys")
    if err != nil {
        return "", err
    }
    token, err := jwt.Parse([]byte(tokenStr),
        jwt.WithKeySet(keyset),
        jwt.WithIssuer("https://okpcqywuyharinzntaxy.supabase.co/auth/v1"),
        jwt.WithAudience("authenticated"),
    )
    if err != nil {
        return "", err
    }
    return token.Subject(), nil
}
```

#### Java (Spring Boot — auth0/java-jwt + nimbus-jose-jwt)

```java
@Bean
public JwtDecoder jwtDecoder() {
    NimbusJwtDecoder decoder = NimbusJwtDecoder
        .withJwkSetUri("https://okpcqywuyharinzntaxy.supabase.co/auth/v1/keys")
        .jwsAlgorithm(SignatureAlgorithm.ES256)
        .build();
    decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
        new JwtIssuerValidator("https://okpcqywuyharinzntaxy.supabase.co/auth/v1"),
        new JwtClaimValidator<String>("aud", aud -> aud.equals("authenticated"))
    ));
    return decoder;
}
```

---

## 9. Endpoint para replicar el perfil de la web al primer login móvil

En el primer login de un user en la app, vuestro backend necesita el perfil ya creado en web (username, país, equipo favorito, etc.). La web expone este endpoint:

```
GET https://zonamundial.app/api/users/me/profile
Authorization: Bearer <supabase_jwt>
```

**Respuesta 200**:

```json
{
  "id": "1c8e9b3a-...",
  "username": "carlos91",
  "email": "carlos@example.com",
  "country": "ES",
  "locale": "es",
  "birth_date": "1991-04-15",
  "fav_team": "argentina",
  "fav_creator": "elopi23",
  "avatar_url": "https://...",
  "onboarded_at": "2026-05-10T14:32:00Z",
  "created_at": "2026-05-08T19:21:00Z"
}
```

**Respuesta 404** si el user nunca completó onboarding en web:

```json
{ "error": "profile_not_found" }
```

En ese caso, lanzad el flujo de onboarding propio de la app (pedid los mismos campos y guardadlos en Postgres B y devolvédnoslos en otro endpoint complementario que documentamos abajo).

### Test rápido con curl

Una vez tengáis un access_token de Supabase de pruebas (logueándoos en una
build local de la app, o desde la web abriendo DevTools → Application →
Cookies → `sb-okpcqywuyharinzntaxy-auth-token`):

```bash
curl -s https://zonamundial.app/api/users/me/profile \
  -H "Authorization: Bearer <TU_ACCESS_TOKEN>" | jq
```

Códigos de respuesta:

| Status | Significado |
|---|---|
| `200` | Perfil devuelto |
| `401` | JWT inválido, caducado o ausente |
| `404` | User existe en Auth pero no completó onboarding en web → flujo onboarding propio |
| `500` | Misconfigured backend (ping `gol@zonamundial.app`) |

### Endpoint de descubrimiento (no requiere auth)

Para que vuestro pipeline CI/scripts puedan leer la config Auth sin
preguntarnos por chat:

```
GET https://zonamundial.app/api/auth/jwks-info
```

Devuelve un JSON con:

- `issuer` y `jwks_uri` para configurar el middleware de verificación de JWT.
- `audience` (`authenticated`).
- `algorithm` (`ES256`).
- `endpoints.user_profile`, `endpoints.apple_s2s_notifications`.
- `apple.team_id`, `apple.app_id_ios`, `apple.services_id_web`.
- `providers` habilitados.

Cacheado 1 h en CDN. Si actualizamos la config, lo notificamos y vosotros
purgáis cache de vuestro lado.

```bash
curl -s https://zonamundial.app/api/auth/jwks-info | jq
```

Estos dos endpoints están **ya desplegados en producción**. Podéis empezar
a integrar contra ellos cuando queráis.

---

## 10. Manejo del refresh token

Los `access_token` de Supabase caducan en 1 hora. Los SDKs móviles los **refrescan solos** transparentemente — no tenéis que hacer nada manual si usáis los métodos del SDK (`supabase.auth.session.accessToken` siempre devuelve uno válido).

Si por alguna razón necesitáis refrescar manualmente:

```swift
// iOS
try await supabase.auth.refreshSession()
```

```kotlin
// Android
supabase.auth.refreshCurrentSession()
```

El `refresh_token` lo guarda el SDK en secure storage (Keychain iOS, EncryptedSharedPreferences Android). Vosotros no lo tocáis.

---

## 11. Logout

```swift
// iOS
try await supabase.auth.signOut()
```

```kotlin
// Android
supabase.auth.signOut()
```

Esto invalida la sesión en Supabase y borra el secure storage local. Recordad llamar a este método cuando el user toque "Cerrar sesión" en la app **antes** de redirigir a la pantalla de login.

---

## 12. Apple S2S Notifications — qué pasa cuando un user revoca acceso desde su iPhone

La web ya tiene desplegado el endpoint `https://zonamundial.app/api/auth/apple/notifications` que Apple llama automáticamente cuando:

| Evento de Apple | Acción que tomamos en web | Qué tenéis que hacer vosotros |
|---|---|---|
| `account-delete` | Soft-delete del user en `auth.users` + tabla `users` | Limpiar el user en Postgres B (lo notificamos por API o webhook que documentamos cuando llegue el momento) |
| `consent-revoked` | Invalidamos sesiones activas | Hacer signOut en la app si la sesión está activa |
| `email-disabled` | Marcamos `email_disabled = true` | Dejar de enviar push/email a ese user hasta que vuelva |
| `email-enabled` | Limpiamos el flag | Reanudar comunicaciones |

**Es obligatorio para pasar revisión de App Store** (App Store Review Guidelines 4.8). El endpoint ya está en producción y validado por Apple — no tenéis que crear nada vuestro.

---

## 13. Diferencias clave web ↔ app que afectan a vuestro código

| Aspecto | Web (existente) | App móvil (lo que haréis vosotros) |
|---|---|---|
| OAuth flow | Redirect (callback URL `/auth/callback`) | Native SDK (signInWithIdToken) |
| Storage de sesión | Cookies HttpOnly | Secure storage (Keychain / EncryptedSharedPreferences) |
| Backend principal | Supabase Postgres directo + Next.js Route Handlers | Vuestro backend + Postgres B |
| Source of truth de identidad | Supabase Auth | Supabase Auth (compartido) |
| Source of truth de data de negocio | Supabase Postgres A | Postgres B (vuestro) |
| Profile del user | `public.profiles` en Supabase | Replicado a `users` en Postgres B en primer login |

---

## 14. Checklist de integración para vuestro equipo

Antes de la primera demo:

- [ ] Tener Project URL y Anon Key de Supabase (os los pasamos por canal seguro).
- [ ] Crear OAuth Client ID para Google iOS en Google Cloud Console.
- [ ] Crear OAuth Client ID para Google Android en Google Cloud Console.
- [ ] Compartirnos ambos Client IDs → los añadimos a Supabase.
- [ ] Confirmarnos qué Bundle ID iOS vais a usar (lo esperado: `app.zonamundial.ios`).
- [ ] Confirmarnos el Package name Android (lo esperado: `app.zonamundial.android`).
- [ ] Confirmarnos el SHA-1 fingerprint del cert de Android (debug + release).
- [ ] Implementar el middleware de verificación de JWT en vuestro backend.
- [ ] Decidir esquema de la tabla `users` en Postgres B (UUID PK + columnas mínimas).
- [ ] Decidir qué campos del perfil replicáis al primer login (mínimo: username, country, locale, fav_team).
- [x] ~~Pedirnos crear el endpoint `GET /api/users/me/profile`~~ **Ya desplegado en producción** (ver sección 9).
- [x] ~~Pedirnos el endpoint de descubrimiento~~ **Ya desplegado**: `GET /api/auth/jwks-info` (ver sección 9).
- [ ] Pedirnos el webhook para `account-delete` cuando esté lista vuestra API de limpieza en Postgres B.

---

## 15. Soporte y contacto

Para cualquier duda técnica sobre Auth, JWTs, configuración de providers o el endpoint S2S de Apple:

| Canal | Para qué |
|---|---|
| Email | `gol@zonamundial.app` con asunto "Integración App" |
| Slack (cuando lo abramos) | Canal `#app-mobile-integration` |

Documentación técnica complementaria:

- `docs/OAUTH-SETUP.md` — Setup completo de OAuth en la web (referencia para entender qué hay en producción).
- `src/app/api/auth/apple/notifications/README.md` — Documentación del endpoint S2S de Apple.
- `scripts/generate-apple-client-secret.js` — Script para regenerar el client_secret JWT cada 6 meses.

---

## Anexo A — Por qué NO crear sistema de auth propio en la app

Si la app montase su propio Google/Apple OAuth + tabla `users` separada:

- **Identidades duplicadas**: Carlos en web ≠ Carlos en app, aunque sea la misma persona con el mismo email.
- **Conflicto de cuentas**: si Carlos se registra primero en web con Apple y después en la app con Apple, hay que decidir si fusionar (UX confusa) o crear segunda cuenta (data fragmentada).
- **Doble mantenimiento del client_secret JWT de Apple**: caduca cada 6 meses, hay que rotar en dos sitios.
- **Doble proceso de revisión Apple**: cada uno tiene que pasar su propio Sign In with Apple compliance (incluyendo el endpoint S2S Notifications).
- **Coste de infra**: doble proveedor de OAuth, doble Supabase/Auth0/Cognito.
- **Logout en una plataforma no afecta a la otra**.

El esquema BYO Auth contra Supabase elimina todo lo anterior.

---

## Anexo B — Si vuestro backend NO puede usar Supabase JWTs (caso extremo)

Si por una restricción de empresa, regulatoria o de stack vuestro backend necesita su propio sistema de tokens (ej. session tokens internos), el flujo es:

1. App hace login con Supabase (Apple/Google) → obtiene Supabase JWT.
2. App llama a vuestro endpoint `POST /api/auth/exchange` enviando el Supabase JWT.
3. Vuestro endpoint:
   - Verifica el Supabase JWT contra la JWKS de Supabase.
   - Extrae `user.id` UUID.
   - Genera vuestro propio session token interno (otra clave, otro formato).
   - Devuelve el session token vuestro a la app.
4. App descarta el Supabase JWT, usa solo el vuestro de ahora en adelante.

Es más complejo pero permite mantener un sistema de tokens propietario. **Solo justificado si hay una restricción real**.

---

**Fin del documento.** Si algún punto no queda claro o falta cubrir un caso vuestro, decidnos y actualizamos.
