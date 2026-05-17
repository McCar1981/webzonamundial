# Email Templates · ZonaMundial

Estos son los HTML que se pegan en **Supabase Dashboard → Authentication → Templates**.

## Por qué están aquí en el repo

Supabase no versiona los templates: solo los guarda en su DB y los muestra en el dashboard.
Tener una copia en el repo:

- Permite ver el diff cuando alguien los cambia.
- Garantiza que se pueden restaurar si alguien rompe la versión en Supabase.
- Sirve de documentación viva para el equipo.

## Cómo aplicar un template

1. Copiar el contenido del archivo HTML correspondiente.
2. Ir a Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/okpcqywuyharinzntaxy/auth/templates
   ```
3. Seleccionar el template a editar (Magic Link, Confirm signup, Reset password, Change email address).
4. En la pestaña "Subject" pegar el asunto correspondiente (ver tabla abajo).
5. En la pestaña "Message (HTML)" borrar el contenido default y pegar el HTML del archivo.
6. Click **Save changes**.

## Asuntos por template

| Template | Subject |
|---|---|
| Confirm signup | `Confirma tu cuenta en ZonaMundial ⚽` |
| Magic Link | `Tu enlace de acceso a ZonaMundial 🔗` |
| Reset password | `Restablece tu contraseña — ZonaMundial 🔐` |
| Change email address | `Confirma tu nuevo email — ZonaMundial ✉️` |
| Invite user | `Te invitaron a ZonaMundial 🎉` |
| Reauthentication | `Código de verificación — ZonaMundial` |

## Variables de Supabase usadas

Supabase reemplaza estas variables automáticamente al enviar:

- `{{ .ConfirmationURL }}` — URL completa de acción (magic link, confirmación, etc.).
- `{{ .Email }}` — email del destinatario.
- `{{ .NewEmail }}` — nuevo email (solo en change email).
- `{{ .SiteURL }}` — `https://zonamundial.app`.
- `{{ .Token }}` — código OTP (no lo usamos, preferimos el link).

Si añades una variable que Supabase no reconoce, se renderiza como texto vacío.

## Sobre la deliverability

Los templates usan:

- HTML table-based layout (compatible con Outlook 2007+ y Gmail).
- Inline CSS (Gmail strip los `<style>` del head).
- `List-Unsubscribe` header lo añade Supabase automáticamente.
- Texto plano alternativo automático (Supabase lo genera).

Si un email va a spam después de tener todos estos templates, la causa
suele ser:

1. Dominio nuevo (warmup). Solucionado en 100-300 envíos legítimos.
2. Falta de tráfico bidireccional (nadie responde a tus emails).
3. Reportes de spam (raro al inicio).
