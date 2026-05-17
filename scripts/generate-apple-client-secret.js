// scripts/generate-apple-client-secret.js
//
// Genera el `client_secret` JWT que Supabase necesita para Sign In with Apple.
// Apple obliga a refrescarlo cada 6 meses (caducidad máxima del JWT). Sin un
// JWT vigente en Supabase → todos los logins de Apple en producción fallan.
//
// Cómo usar (cuando se acerque la fecha de expiración):
//
//   1. Asegúrate de tener el archivo .p8 a mano. Se descargó UNA SOLA VEZ
//      al crear la Key en Apple Developer; está guardado en:
//         C:/Users/Neo-PC/Downloads/AuthKey_<KEY_ID>.p8
//      (o donde lo hayas movido — Bitwarden, 1Password, etc.)
//
//   2. Edita las CONSTANTES de abajo si cambia algún ID. Por defecto usan
//      los valores actuales del proyecto ZonaMundial:
//         TEAM_ID      = K9SP9SUWV3
//         KEY_ID       = 648779U73X
//         SERVICES_ID  = app.zonamundial.web
//
//   3. Ejecuta:
//         node scripts/generate-apple-client-secret.js <ruta-al-.p8>
//
//      Ejemplo:
//         node scripts/generate-apple-client-secret.js \
//           "C:/Users/Neo-PC/Downloads/AuthKey_648779U73X.p8"
//
//   4. El script imprime:
//         - El JWT firmado (una sola línea)
//         - Fecha de expiración aproximada (+180 días)
//
//   5. Copia ese JWT y pégalo en:
//         Supabase Dashboard → Authentication → Providers → Apple →
//         Secret Key (for OAuth) → Save
//
//   6. Verifica abriendo /auth/debug que Apple sigue verde.
//
// Si pierdes el .p8: hay que generar una Key nueva en Apple Developer →
// Keys → + → Sign in with Apple → Configure → Save → Download. Anota el
// nuevo Key ID y actualiza la constante de abajo.
//
// Recordatorios automáticos: añade un evento al calendario 7 días antes
// de la fecha de expiración que imprime este script. Si no lo haces,
// Apple Sign In dejará de funcionar de un día para otro.

const fs = require("fs");
const path = require("path");
const { SignJWT, importPKCS8 } = require("jose");

// ============================================================
// CONSTANTES — Cambiar si rotamos Key o renombramos Services ID
// ============================================================
const TEAM_ID     = "K9SP9SUWV3";          // Apple Developer Team ID
const KEY_ID      = "648779U73X";          // ID de la Key (10 chars). Lo da Apple al crear la Key.
const SERVICES_ID = "app.zonamundial.web"; // Services ID = Client ID en Supabase

// JWT lifetime. Apple permite máximo 6 meses. Usamos 180 días para tener
// margen de seguridad (un poco menos de 6 meses estrictos).
const LIFETIME_DAYS = 180;

// ============================================================
// CLI
// ============================================================
async function main() {
  const p8Path = process.argv[2];
  if (!p8Path) {
    console.error("Uso: node scripts/generate-apple-client-secret.js <ruta-al-.p8>");
    console.error("Ejemplo: node scripts/generate-apple-client-secret.js C:/Users/Neo-PC/Downloads/AuthKey_648779U73X.p8");
    process.exit(1);
  }

  const absPath = path.resolve(p8Path);
  if (!fs.existsSync(absPath)) {
    console.error(`No existe el archivo: ${absPath}`);
    process.exit(1);
  }

  const pkcs8 = fs.readFileSync(absPath, "utf8").trim();
  if (!pkcs8.includes("BEGIN PRIVATE KEY")) {
    console.error("El archivo no parece un .p8 válido (falta cabecera BEGIN PRIVATE KEY).");
    process.exit(1);
  }

  // ES256 = ECDSA con curva P-256. Es el único algoritmo que Apple acepta
  // para Sign In with Apple. Si pones otro algoritmo, Apple rechaza el JWT
  // con "invalid_client".
  const privateKey = await importPKCS8(pkcs8, "ES256");

  const now = Math.floor(Date.now() / 1000);
  const exp = now + LIFETIME_DAYS * 24 * 60 * 60;

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: KEY_ID })
    .setIssuer(TEAM_ID)                       // iss
    .setSubject(SERVICES_ID)                  // sub
    .setAudience("https://appleid.apple.com") // aud — siempre este, fijo
    .setIssuedAt(now)                         // iat
    .setExpirationTime(exp)                   // exp
    .sign(privateKey);

  const expDate = new Date(exp * 1000);

  // Salida: stderr para el log humano, stdout para el JWT crudo. Esto
  // permite hacer `node generate-apple-client-secret.js .p8 | clip` en
  // Windows o `| pbcopy` en macOS para copiarlo al portapapeles directo.
  console.error("");
  console.error("=== Apple client_secret JWT generado ===");
  console.error(`Team ID    : ${TEAM_ID}`);
  console.error(`Key ID     : ${KEY_ID}`);
  console.error(`Services ID: ${SERVICES_ID}`);
  console.error(`Issued at  : ${new Date(now * 1000).toISOString()}`);
  console.error(`Expires at : ${expDate.toISOString()}  (${LIFETIME_DAYS} días)`);
  console.error("");
  console.error("⚠️  Anota la fecha de expiración y crea un recordatorio");
  console.error("    de calendario 7 días antes para regenerar el JWT.");
  console.error("");
  console.error("Para usar:");
  console.error("  1. Copia la línea de abajo (todo lo de stdout)");
  console.error("  2. Supabase Dashboard → Auth → Providers → Apple");
  console.error("  3. Pega en Secret Key (for OAuth) → Save");
  console.error("");
  console.error("--- JWT ---");

  console.log(jwt);
}

main().catch((err) => {
  console.error("Error generando el JWT:", err);
  process.exit(1);
});
