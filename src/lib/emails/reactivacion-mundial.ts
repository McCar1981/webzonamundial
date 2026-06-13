// src/lib/emails/reactivacion-mundial.ts
//
// Plantilla del email de REACTIVACIÓN "El Mundial ya rueda" (tema blanco).
// La usa el endpoint admin /api/admin/reactivacion para el envío a la base de
// registros. El marcador {{unsubscribe_url}} se sustituye por persona con un
// enlace de baja FIRMADO (buildUnsubscribeToken) antes de cada envío.

export const REACTIVACION_SUBJECT =
  "El Mundial ya rueda… y tú aún no has jugado 👀";

export const REACTIVACION_PREHEADER =
  "El balón ya rueda. Tu Draft, tu Modo Carrera y los goles de tu selección te esperan. No te quedes fuera.";

/** HTML completo. Contiene el marcador {{unsubscribe_url}} (puede aparecer 1+ veces). */
export const REACTIVACION_HTML = `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>El Mundial ya rueda</title>
  <style>
    body{margin:0;padding:0;width:100%!important;background:#FFFFFF;}
    table{border-collapse:collapse;}
    img{border:0;line-height:100%;outline:none;text-decoration:none;display:block;}
    a{text-decoration:none;}
    @media only screen and (max-width:600px){
      .container{width:100%!important;}
      .px{padding-left:20px!important;padding-right:20px!important;}
      .stack{display:block!important;width:100%!important;}
      .stack td{display:block!important;width:100%!important;box-sizing:border-box;}
      .card-gap{height:14px!important;}
      .h1{font-size:26px!important;line-height:32px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#FFFFFF;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#FFFFFF;">
    El balón ya rueda. Tu Draft, tu Modo Carrera y los goles de tu selección te esperan. No te quedes fuera.
    &#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E8EAED;">
          <tr>
            <td align="center" style="padding:28px 24px 18px 24px;background:#FFFFFF;border-bottom:1px solid #EEF0F3;">
              <a href="https://zonamundial.app?utm_source=email&utm_medium=reactivacion&utm_campaign=reactivacion_mundial_jun26&utm_content=logo">
                <img src="https://zonamundial.app/icons/icon-512.png" width="110" height="110" alt="ZonaMundial" style="display:block;margin:0 auto;width:110px;height:110px;border-radius:18px;">
              </a>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:3px;color:#94A3B8;margin-top:12px;text-transform:uppercase;">Mundial 2026 · En vivo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0;font-size:0;line-height:0;background:#FFFFFF;">
              <img src="https://zonamundial.app/img/heroes/ball-stadium-pitch.jpg" width="600" alt="El balón espera en el estadio — Mundial 2026" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:30px 40px 8px 40px;">
              <p style="margin:0 0 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;color:#C9A84C;text-transform:uppercase;">El balón ya rueda</p>
              <h1 class="h1" style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:32px;line-height:38px;font-weight:800;color:#0F172A;">
                El Mundial pasa una vez cada cuatro años.<br>Y está pasando <span style="color:#C9A84C;">ahora mismo</span>.
              </h1>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:18px 40px 6px 40px;">
              <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#374151;">
                Te apuntaste para vivirlo… pero llevas un tiempo sin aparecer. Y mientras tanto, los goles caen, el ranking se mueve y <strong style="color:#111827;">más de 2.000 jugadores</strong> ya están sumando Fútcoins.
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#374151;">
                Cada partido que no juegas es un partido que <strong style="color:#111827;">no vuelve</strong>. Y quedan pocos.
              </p>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:28px 40px 6px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #EEF0F3;border-radius:12px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#6B7280;">Una pregunta rápida, de fan a fan:</p>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:27px;font-weight:800;color:#111827;">
                      👉 ¿Ya jugaste el <span style="color:#B8902F;">Draft Mundial</span>? ¿Y el <span style="color:#B8902F;">Modo Carrera</span>?
                    </p>
                    <p style="margin:10px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#6B7280;">
                      Si tu respuesta es <em style="color:#374151;">"todavía no"</em>, te estás perdiendo lo mejor de la plataforma. Vamos a arreglarlo en 1 minuto.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:18px 40px 6px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr class="stack">
                  <td valign="top" width="50%" style="padding-right:8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF0;border:1px solid #F0E2BF;border-radius:12px;">
                      <tr><td style="padding:20px;">
                        <div style="font-size:26px;line-height:1;">🌍</div>
                        <p style="margin:12px 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:800;color:#111827;">Draft Mundial</p>
                        <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#4B5563;">Monta tu once ideal del torneo, compite y escala en el ranking. Una partida y ya no paras.</p>
                        <a href="https://zonamundial.app/app/draft-mundial?utm_source=email&utm_medium=reactivacion&utm_campaign=reactivacion_mundial_jun26&utm_content=card_draft" style="display:inline-block;background:#C9A84C;color:#1A1208;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;padding:11px 18px;border-radius:8px;">▶ Jugar el Draft</a>
                      </td></tr>
                    </table>
                  </td>
                  <td class="card-gap" width="16" style="font-size:0;line-height:0;">&nbsp;</td>
                  <td valign="top" width="50%" style="padding-left:8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF0;border:1px solid #F0E2BF;border-radius:12px;">
                      <tr><td style="padding:20px;">
                        <div style="font-size:26px;line-height:1;">🏆</div>
                        <p style="margin:12px 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:800;color:#111827;">Modo Carrera</p>
                        <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#4B5563;">Lleva a tu selección desde la fase de grupos hasta levantar la Copa. Tú decides cada jugada.</p>
                        <a href="https://zonamundial.app/app/modo-carrera?utm_source=email&utm_medium=reactivacion&utm_campaign=reactivacion_mundial_jun26&utm_content=card_carrera" style="display:inline-block;background:#C9A84C;color:#1A1208;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;padding:11px 18px;border-radius:8px;">▶ Entrar a Carrera</a>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:26px 40px 6px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF0;border:1px solid #C9A84C;border-radius:12px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:800;color:#92660C;">⚡ Activa las alertas y no te pierdas ni un gol</p>
                    <p style="margin:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#4B5563;">
                      Te avisamos al instante cuando <strong style="color:#111827;">marque tu selección</strong>, cuando arranque un partido clave y cuando puedas <strong style="color:#111827;">reclamar tus recompensas</strong>. Cero spam: solo lo que no te quieres perder.
                      <br><br>
                      Y por activarlas hoy, <strong style="color:#111827;">te regalamos 25 Fútcoins</strong> para tu próxima jugada.
                    </p>
                    <a href="https://zonamundial.app/cuenta/notificaciones?utm_source=email&utm_medium=reactivacion&utm_campaign=reactivacion_mundial_jun26&utm_content=cta_alertas" style="display:inline-block;background:#C9A84C;color:#1A1208;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:800;padding:13px 26px;border-radius:8px;">Activar alertas + 25 Fútcoins</a>
                    <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#8C7437;">📱 ¿iPhone? Añade ZonaMundial a tu pantalla de inicio (Compartir → "Añadir a inicio") y podrás recibir las alertas de gol.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:30px 40px 8px 40px;">
              <a href="https://zonamundial.app/app?utm_source=email&utm_medium=reactivacion&utm_campaign=reactivacion_mundial_jun26&utm_content=cta_principal" style="display:inline-block;background:#0F172A;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:800;padding:15px 40px;border-radius:10px;">Volver y jugar ahora ⚽</a>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:18px 40px 34px 40px;" align="center">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#374151;">
                El Mundial no espera. Tu próxima jugada, tampoco.<br>
                <strong style="color:#111827;">Nos vemos dentro.</strong>
              </p>
              <p style="margin:14px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B7280;">— El equipo de ZonaMundial</p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 40px 28px 40px;background:#FFFFFF;border-top:1px solid #EEF0F3;">
              <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#9CA3AF;">
                Recibes este correo porque te registraste en ZonaMundial. ¿No quieres recibir más? <a href="{{unsubscribe_url}}" style="color:#6B7280;text-decoration:underline;">Date de baja aquí</a> o responde <strong>BAJA</strong> a este correo.
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#9CA3AF;">
                ZonaMundial · <a href="mailto:gol@zonamundial.app" style="color:#6B7280;text-decoration:underline;">gol@zonamundial.app</a> · <a href="https://zonamundial.app" style="color:#6B7280;text-decoration:underline;">zonamundial.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
