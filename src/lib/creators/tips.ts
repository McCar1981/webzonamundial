// Consejos de monetización para el panel del creador.
//
// Motor de reglas puro (sin LLM): cada consejo se activa según los datos
// reales del creador y se ordena por impacto económico inmediato. Devolvemos
// los 3 más relevantes. Deliberadamente sin dependencia de la key de
// Anthropic: si el saldo del IA Coach cae, esto sigue funcionando.

import type { CreatorProgramRow, CreatorStats, DailyPoint, MonthBonus } from "./program";
import { formatEur } from "./program";

export interface Tip {
  emoji: string;
  titulo: string;
  cuerpo: string;
}

interface TipContext {
  creator: CreatorProgramRow;
  stats: CreatorStats;
  bonusMes: MonthBonus;
  daily: DailyPoint[];
  sponsorsAbiertos: number;
  premiumSharePctLabel: string; // p.ej. "50%"
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function bestWeekday(daily: DailyPoint[]): string | null {
  const byDay = new Map<number, number>();
  let total = 0;
  for (const p of daily) {
    // 'YYYY-MM-DD' → día de la semana en UTC (la fecha ya viene en día Madrid).
    const d = new Date(`${p.dia}T12:00:00Z`).getUTCDay();
    byDay.set(d, (byDay.get(d) ?? 0) + p.registros);
    total += p.registros;
  }
  if (total < 20) return null; // sin datos suficientes no inventamos patrones
  let best = -1;
  let bestCount = -1;
  for (const [d, n] of byDay) {
    if (n > bestCount) {
      best = d;
      bestCount = n;
    }
  }
  return best >= 0 ? DIAS[best] : null;
}

export function buildTips(ctx: TipContext): Tip[] {
  const { creator, stats, bonusMes, daily, sponsorsAbiertos } = ctx;
  const tips: Tip[] = [];
  const unit = formatEur(creator.bonus_unit_eur);

  // 1) Cerca del siguiente bloque de bono — el empujón más rentable.
  if (
    !bonusMes.techoAlcanzado &&
    bonusMes.faltanParaSiguiente > 0 &&
    bonusMes.faltanParaSiguiente <= Math.max(10, Math.round(creator.bonus_threshold * 0.2))
  ) {
    tips.push({
      emoji: "🎯",
      titulo: `Estás a ${bonusMes.faltanParaSiguiente} registros de otros ${unit}`,
      cuerpo:
        "Un story con tu enlace antes del próximo partido puede cerrarlos hoy. Recuerda: el bono se liquida por mes natural — no lo dejes para el día 1.",
    });
  }

  // 2) Techo mensual alcanzado — redirigir el esfuerzo al revenue share.
  if (bonusMes.techoAlcanzado && bonusMes.bloquesMax > 0) {
    tips.push({
      emoji: "🔥",
      titulo: `Techo del bono alcanzado: ${formatEur(creator.bonus_cap_eur)} este mes`,
      cuerpo: `Brutal. Cada registro extra sigue alimentando tu revenue share del ${creator.rev_share_pct}%: empuja ahora el Plan Pro y los retos de tu comunidad, que es donde no hay techo.`,
    });
  }

  // 3) Día sin registros — gancho del partido del día.
  if (stats.registros_hoy === 0) {
    tips.push({
      emoji: "📅",
      titulo: "Hoy todavía no has sumado registros",
      cuerpo:
        "El gancho que mejor convierte es el partido del día: publica tu predicción y reta a tu comunidad a superarte en ZonaMundial con tu enlace.",
    });
  }

  // 4) Tendencia semanal a la baja.
  if (stats.registros_7d_prev >= 10 && stats.registros_7d < stats.registros_7d_prev) {
    const drop = Math.round(
      ((stats.registros_7d_prev - stats.registros_7d) / stats.registros_7d_prev) * 100
    );
    if (drop >= 15) {
      tips.push({
        emoji: "📉",
        titulo: `Tu ritmo cayó un ${drop}% esta semana`,
        cuerpo:
          "Lo que mejor remonta: directo en partido + enlace fijado en el chat, y un clip del resultado al acabar. Dos toques el mismo día valen más que cinco repartidos.",
      });
    }
  }

  // 5) Conversión premium baja/alta — el multiplicador del revenue share.
  if (stats.registros_total >= 50) {
    const conv = (stats.premium_total / stats.registros_total) * 100;
    if (conv < 5) {
      tips.push({
        emoji: "💎",
        titulo: `Solo el ${conv.toFixed(1)}% de tu comunidad es premium`,
        cuerpo: `Cada suscripción Pro reparte contigo (${ctx.premiumSharePctLabel} del premium de tu comunidad). Menciona lo que desbloquea: predicciones ilimitadas, fantasy en vivo y el IA Coach.`,
      });
    } else if (conv >= 8) {
      tips.push({
        emoji: "🚀",
        titulo: `Tu conversión premium (${conv.toFixed(1)}%) está por encima de la media`,
        cuerpo:
          "Tu comunidad responde: sube el volumen de registros y el revenue share escala solo. Es tu mejor momento para un push fuerte.",
      });
    }
  }

  // 6) Patrocinadores — la palanca grande (70/30 para quien trae la marca).
  if (sponsorsAbiertos === 0) {
    tips.push({
      emoji: "🤝",
      titulo: "Trae una marca y llévate el 70% del deal",
      cuerpo:
        "Un patrocinio que cierres tú se reparte 70/30 a tu favor. ¿Una marca con la que ya trabajas? Propónla abajo y nosotros la cerramos contigo.",
    });
  }

  // 7) Mejor día de la semana detectado en sus datos.
  const best = bestWeekday(daily);
  if (best) {
    tips.push({
      emoji: "📊",
      titulo: `Tus ${best} son tu mejor día`,
      cuerpo: `En las últimas dos semanas, el ${best} es cuando más registros traes. Programa tu contenido de ZonaMundial ese día y repite la jugada.`,
    });
  }

  // 8) Genérico siempre útil (relleno si faltan contextuales).
  tips.push({
    emoji: "🔗",
    titulo: "Tu enlace, siempre a un toque",
    cuerpo:
      "Enlace en la bio, comentario fijado y mención en cada directo. La mayoría de registros llegan en los 30 minutos después de publicar — repite el enlace sin miedo.",
  });

  return tips.slice(0, 3);
}
