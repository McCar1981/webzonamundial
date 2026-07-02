// src/lib/tu-mundial/share.ts
//
// Parte PURA (sin imports de Node/Supabase) de "Tu Mundial 2026": el tipo y la
// (de)serialización de las cifras a query params. Va aparte de stats.ts a
// propósito: la imagen OG y la página pública compartible corren en EDGE, y no
// pueden importar el agregador (que toca Supabase/Node). Aquí solo hay funciones
// puras seguras en cualquier runtime.

export interface TuMundialStats {
  name: string;
  points: number; // puntos de predicciones
  predictions: number; // predicciones resueltas
  correct: number; // aciertos
  accuracy: number; // % de acierto (0..100)
  perfect: number; // partidos perfectos (8/8)
  rank: number | null; // puesto global (null = staff/sin saldo)
  coins: number; // Fútcoins
  level: number; // nivel
  albumPct: number; // % de álbum completado (0..100)
  fantasyPoints: number; // puntos de fantasy
}

// Serializa las cifras a query params para la URL pública compartible y la imagen
// OG (edge, sin acceso a BD). Como /api/og/founder: la imagen es una "tarjeta
// para presumir", no una fuente de verdad, así que viajar por query es aceptable.
export function statsToQuery(s: TuMundialStats): string {
  const q = new URLSearchParams({
    name: s.name,
    pts: String(s.points),
    ok: String(s.correct),
    acc: String(s.accuracy),
    rank: s.rank == null ? "" : String(s.rank),
    coins: String(s.coins),
    lvl: String(s.level),
    alb: String(s.albumPct),
    fan: String(s.fantasyPoints),
    perf: String(s.perfect),
  });
  return q.toString();
}

// Lee de vuelta las cifras desde los searchParams. Acota y sanea todo (números no
// negativos, nombre corto, % ≤ 100) porque la query es pública y manipulable: se
// trata como tarjeta decorativa, no como dato verificado.
export function statsFromParams(sp: URLSearchParams): TuMundialStats {
  const num = (k: string) => {
    const n = Math.floor(Number(sp.get(k)));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const rankRaw = sp.get("rank");
  const rankN = rankRaw ? Math.floor(Number(rankRaw)) : NaN;
  return {
    name: (sp.get("name") || "Aficionado").slice(0, 28),
    points: num("pts"),
    predictions: 0,
    correct: num("ok"),
    accuracy: Math.min(100, num("acc")),
    perfect: num("perf"),
    rank: Number.isFinite(rankN) && rankN > 0 ? rankN : null,
    coins: num("coins"),
    level: Math.max(1, num("lvl")),
    albumPct: Math.min(100, num("alb")),
    fantasyPoints: num("fan"),
  };
}
