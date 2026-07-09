// src/lib/ligas/notify.ts
//
// Push de PAYOFF de Zona de Ligas: "Acertaste: América 2-1 Chivas. +10 Fútcoins."
// El gancho de retorno de mayor dopamina (el momento "¿gané?"), calcado del
// notifyResolvedMatch del Mundial. Hasta ahora el cron abonaba Fútcoins y no
// avisaba a nadie: quien predecía el martes no tenía disparador para volver.
//
// BLINDAJE: aislado de la resolución y del pago. Se llama DESPUÉS del reparto
// (lee filas ya resueltas, no las modifica) y el call site lo envuelve en
// try/catch: un fallo aquí JAMÁS afecta a la resolución ni a las recompensas.
// Dedup por (user_id, "liga-resolved:<fixtureId>") en prediction_notifications:
// un solo aviso por usuario y partido aunque el cron pase varias veces.
//
// Reutiliza la infraestructura del Mundial (pushToUser, reserveDedup, opt-outs
// de la categoría predictions-reminder) exportada desde predictions/engagement.

import { adminClient } from "@/lib/predictions/admin";
import { pushToUser, reserveDedup, optedOutUserIds } from "@/lib/predictions/engagement";

const SITE = "https://zonamundial.app";

export interface ResolvedLigaFixtureMeta {
  /** "América 2-1 Chivas" (nombre local, marcador final, nombre visitante). */
  label: string;
}

export interface LigaNotifyResult {
  fixtures: number;
  notified: number;
  pushes: number;
  skipped_dedup: number;
}

/**
 * Notifica a los usuarios con predicciones resueltas en los fixtures de ESTA
 * pasada del cron. `paidCoins` trae lo realmente abonado (clave "uid:fixtureId"),
 * así el copy dice la cifra exacta (10, 30 con boost o 40 por marcador exacto).
 */
export async function notifyResolvedLigaFixtures(
  resolved: Map<number, ResolvedLigaFixtureMeta>,
  paidCoins: Map<string, number>,
): Promise<LigaNotifyResult> {
  const admin = adminClient();
  const kind = "liga-resolved";
  let notified = 0;
  let pushes = 0;
  let skippedDedup = 0;
  if (resolved.size === 0) return { fixtures: 0, notified, pushes, skipped_dedup: skippedDedup };

  const pushOut = await optedOutUserIds("push");

  for (const [fid, meta] of resolved) {
    const { data: rows } = await admin
      .from("liga_predictions")
      .select("user_id,status")
      .eq("fixture_id", fid)
      .in("status", ["won", "lost"]);

    // Agrega por usuario: con que UNA de sus predicciones del partido gane, el
    // aviso es de premio; si todas perdieron, el copy es cálido (vuelve mañana).
    const byUser = new Map<string, { won: boolean }>();
    for (const r of (rows ?? []) as { user_id: string; status: string }[]) {
      if (!r.user_id) continue;
      const agg = byUser.get(r.user_id) ?? { won: false };
      if (r.status === "won") agg.won = true;
      byUser.set(r.user_id, agg);
    }

    for (const [uid, agg] of byUser) {
      if (pushOut.has(uid)) continue;
      if (!(await reserveDedup(uid, kind, `${kind}:${fid}`))) { skippedDedup += 1; continue; }

      const coins = paidCoins.get(`${uid}:${fid}`);
      const title = agg.won ? `Acertaste: ${meta.label}` : `Final: ${meta.label}`;
      const body = agg.won
        ? coins != null
          ? `+${coins} Fútcoins en tu cartera. Sigue tu racha en Mis predicciones.`
          : `Tus Fútcoins están abonados. Sigue tu racha en Mis predicciones.`
        : `Esta vez no cayó. El próximo partido de la jornada te espera.`;

      const sent = await pushToUser(uid, {
        title,
        body,
        url: `${SITE}/ligas/mis-predicciones`,
        tag: `liga-resolved-${fid}`,
        pushId: `${kind}:${fid}`,
      });
      if (sent > 0) { pushes += sent; notified += 1; }
    }
  }

  return { fixtures: resolved.size, notified, pushes, skipped_dedup: skippedDedup };
}
