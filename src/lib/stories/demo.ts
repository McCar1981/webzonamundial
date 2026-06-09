// src/lib/stories/demo.ts
//
// MODO DEMO LOCAL del módulo Stories.
//
// En local NO existe SUPABASE_SERVICE_ROLE_KEY (solo corre en Vercel), así que
// el store no puede leer/escribir las tablas con service role. Para poder VER el
// módulo funcionando en `npm run dev` (regla de Carlos: validar en local antes
// de producción), el store cae a estos datos en memoria cuando falta la key.
//
// Esto SOLO afecta a Stories y SOLO cuando no hay service role (entorno local).
// En producción (Vercel con la key) jamás se usa: manda Supabase.

import type { StoryDTO, StoryReelDTO, StoryType, StoryWidget, StoryMediaType } from "./types";
import type { LiveSnapshot } from "@/lib/match-center/types";

// Comunidad del "espectador" demo: el creador con el que se habría registrado.
// Las Stories de usuario solo se ven entre miembros de la misma comunidad.
const DEMO_COMMUNITY = "creador-demo";

/** TRUE si estamos en entorno con service role (producción). */
export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function expiresIso(hours = 24): string {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

function dto(
  id: string,
  type: StoryType,
  overlay: string,
  widgets: StoryDTO["widgets"] = [],
  relatedMatchId: string | null = null
): StoryDTO {
  return {
    id,
    type,
    authorType: type === "creator" ? "creator" : type === "user" ? "user" : "system",
    mediaType: "template",
    mediaUrl: null,
    overlayText: overlay,
    widgets,
    templateId: null,
    templateData: { demo: true },
    relatedMatchId,
    viewCount: Math.floor(Math.random() * 9000) + 500,
    createdAt: new Date().toISOString(),
    expiresAt: expiresIso(),
    seen: false,
  };
}

// Stories de ejemplo (mismo contenido que el seed SQL, en memoria).
const DEMO: StoryDTO[] = [
  dto("demo-sys-1", "system", "⚽ España 🇪🇸 vs Brasil 🇧🇷 — hoy 21:00", [
    {
      kind: "poll",
      id: "w-pre-1",
      question: "¿Quién gana?",
      options: [
        { key: "esp", label: "🇪🇸 España" },
        { key: "draw", label: "Empate" },
        { key: "bra", label: "🇧🇷 Brasil" },
      ],
    },
  ], "demo-esp-bra"),
  dto("demo-sys-2", "system", "📊 La comunidad predice: 67% España, 33% Brasil", [
    { kind: "quick_prediction", id: "w-pre-2", label: "Haz tu predicción ahora", matchId: "demo-esp-bra" },
  ], "demo-esp-bra"),
  dto("demo-sys-3", "system", "⚽ GOOOL de Yamal (min 34) — España 1-0", [
    { kind: "micro_challenge", id: "w-goal-1", question: "¿Habrá más goles?" },
  ], "demo-esp-bra"),
  dto("demo-sys-4", "system", "☀️ Buenos días, DT. Hoy hay 3 partidos, 1 es 💎 Diamante ×2.0", [
    { kind: "cta", id: "w-daily-1", label: "Ver partidos del día", href: "/app/matchcenter" },
  ]),
  dto("demo-nar-1", "narrative", "📖 ¿Sabías que...? Brasil tiene 28% de probabilidad de ganar el Mundial según el modelo."),
  dto("demo-nar-2", "narrative", "💡 El dato del día: 14 de los últimos 20 partidos de España terminaron con +2.5 goles."),
  dto("demo-cre-1", "creator", "🎬 Mi predicción del España vs Brasil 🔒 — mañana la revelo", [
    { kind: "cta", id: "w-creator-1", label: "Únete a mi liga", href: "/app/ligas" },
  ]),
  dto("demo-cre-2", "creator", "🔥 Este es mi once para la jornada. ¿Mejor que el tuyo?", [
    {
      kind: "poll",
      id: "w-creator-2",
      question: "¿Mi equipo o el tuyo?",
      options: [
        { key: "yours", label: "El tuyo es mejor" },
        { key: "mine", label: "El mío gana" },
      ],
    },
  ]),
];

function reelLabel(type: StoryType): string {
  switch (type) {
    case "system":
      return "Sistema";
    case "narrative":
      return "Revista";
    case "league":
      return "Mi liga";
    case "creator":
      return "Creador";
    case "user":
    default:
      return "Tú";
  }
}

/** Reels demo: tipos públicos por tipo + Stories de usuario por autor (con
 *  scope de comunidad, igual que producción). */
export function demoFeed(): StoryReelDTO[] {
  // 1) Tipos públicos (creator/system/narrative/league) agrupados por tipo.
  const byType = new Map<StoryType, StoryDTO[]>();
  for (const s of [...GENERATED, ...DEMO]) {
    if (s.type === "user") continue;
    const arr = byType.get(s.type) ?? [];
    arr.push(s);
    byType.set(s.type, arr);
  }
  const order: StoryType[] = ["creator", "system", "narrative", "league"];
  const reels: StoryReelDTO[] = [];
  for (const type of order) {
    const stories = byType.get(type);
    if (!stories?.length) continue;
    reels.push({ key: `demo:${type}`, label: reelLabel(type), type, avatarUrl: null, stories, allSeen: false });
  }

  // 2) Stories de USUARIO con scope de comunidad: el espectador demo pertenece a
  // DEMO_COMMUNITY y solo ve a los miembros de su comunidad (Ana/Luis) + las
  // suyas. La de "otra-comunidad" (Pedro) queda fuera.
  const visibleUser = [...DEMO_USER_STORIES, ...DEMO_OTHER_USER_STORIES].filter(
    (s) => s.communitySlug === DEMO_COMMUNITY
  );
  // Agrupar por autor (templateData.authorName) → una burbuja por persona.
  const byAuthor = new Map<string, StoryDTO[]>();
  for (const s of visibleUser) {
    const name = String((s.templateData as { authorName?: unknown })?.authorName ?? "Usuario");
    const arr = byAuthor.get(name) ?? [];
    arr.push(s);
    byAuthor.set(name, arr);
  }
  // "Tú" primero, luego el resto de la comunidad.
  const authors = [...byAuthor.keys()].sort((a, b) => (a === "Tú" ? -1 : b === "Tú" ? 1 : 0));
  for (const name of authors) {
    reels.push({
      key: `demo:user:${name}`,
      label: name,
      type: "user",
      avatarUrl: null,
      stories: byAuthor.get(name)!,
      allSeen: false,
    });
  }

  return reels;
}

// Stories creadas por el usuario en modo demo (en memoria, se pierden al reiniciar).
const DEMO_USER_STORIES: StoryDTO[] = [];

// Stories emitidas por el MOTOR AUTOMÁTICO en modo demo (en memoria).
const GENERATED: StoryDTO[] = [];

// Helper para construir una Story de usuario demo de OTRO miembro.
function otherUserDto(
  id: string,
  authorName: string,
  community: string,
  overlay: string
): StoryDTO {
  return {
    id,
    type: "user",
    authorType: "user",
    mediaType: "template",
    mediaUrl: null,
    overlayText: overlay,
    widgets: [],
    templateId: "mi_momento",
    templateData: { demo: true, authorName },
    relatedMatchId: null,
    communitySlug: community,
    viewCount: Math.floor(Math.random() * 400) + 20,
    createdAt: new Date().toISOString(),
    expiresAt: expiresIso(),
    seen: false,
  };
}

// Stories de OTROS usuarios para demostrar la lógica de comunidad:
//   - Ana y Luis pertenecen a la MISMA comunidad → el espectador SÍ las ve.
//   - "Pedro (otra)" pertenece a otra comunidad → el espectador NO la ve.
const DEMO_OTHER_USER_STORIES: StoryDTO[] = [
  otherUserDto("demo-other-ana", "Ana 🇪🇸", DEMO_COMMUNITY, "¡Vamos España! 🔥🏆"),
  otherUserDto("demo-other-luis", "Luis 🇲🇽", DEMO_COMMUNITY, "Mi 11 ideal para hoy ⚽"),
  otherUserDto("demo-other-pedro", "Pedro (otra comunidad)", "otra-comunidad", "No deberías verme 🙈"),
];

export function demoStory(id: string): StoryDTO | null {
  return (
    GENERATED.find((s) => s.id === id) ??
    DEMO.find((s) => s.id === id) ??
    DEMO_USER_STORIES.find((s) => s.id === id) ??
    DEMO_OTHER_USER_STORIES.find((s) => s.id === id) ??
    null
  );
}

/** Claves gen_key ya emitidas por el motor en esta sesión demo (dedup). */
export function demoGenKeys(): Set<string> {
  const keys = GENERATED.map((s) => String((s.templateData as { gen_key?: unknown })?.gen_key ?? "")).filter(Boolean);
  return new Set(keys);
}

/** Emite una Story del sistema en memoria (equivalente demo de createSystemStory). */
export function demoCreateSystemStory(
  overlayText: string | null,
  widgets: StoryWidget[],
  relatedMatchId: string | null,
  templateData: Record<string, unknown>
): StoryDTO {
  const s: StoryDTO = {
    id: `demo-gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "system",
    authorType: "system",
    mediaType: "template",
    mediaUrl: null,
    overlayText,
    widgets,
    templateId: null,
    templateData: { demo: true, ...templateData },
    relatedMatchId,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    expiresAt: expiresIso(),
    seen: false,
  };
  GENERATED.unshift(s);
  return s;
}

/** Crea una Story de usuario en memoria (demo local). */
export function demoCreateUserStory(
  overlay: string,
  templateId: string | null,
  templateData: Record<string, unknown>,
  mediaType: StoryMediaType = "template",
  mediaUrl: string | null = null
): StoryDTO {
  const s: StoryDTO = {
    id: `demo-user-${Date.now()}`,
    type: "user",
    authorType: "user",
    mediaType,
    mediaUrl,
    overlayText: overlay,
    widgets: [],
    templateId,
    // El autor (espectador demo) pertenece a DEMO_COMMUNITY: así sus Stories
    // conviven con las de Ana/Luis (misma comunidad).
    templateData: { demo: true, authorName: "Tú", ...templateData },
    relatedMatchId: null,
    communitySlug: DEMO_COMMUNITY,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    expiresAt: expiresIso(),
    seen: false,
  };
  DEMO_USER_STORIES.unshift(s);
  return s;
}

export function demoMyStories(): StoryDTO[] {
  return [...DEMO_USER_STORIES];
}

// Snapshots de ejemplo del Match Center para DEMOSTRAR el motor en local
// (sin KV ni api-football no hay datos reales). El generador solo lee estos
// campos: status, matchId, meta(home/away/time), score, events. El resto se
// rellena con valores mínimos y se castea a LiveSnapshot (solo modo demo).
export function demoSampleSnapshots(): LiveSnapshot[] {
  const base = {
    mode: "live" as const,
    elapsed: 0,
    referee: "",
    narration: {},
    stats: {} as LiveSnapshot["stats"],
    homeLineup: null,
    awayLineup: null,
    updatedAt: Date.now(),
  };
  const meta = (id: number, home: string, away: string, time: string) =>
    ({
      id,
      home: { name: home, flag: "", color: "#1d4ed8", id: "" },
      away: { name: away, flag: "", color: "#dc2626", id: "" },
      venue: "",
      city: "",
      date: new Date().toISOString().slice(0, 10),
      time,
      phase: "Fase de grupos",
      group: "A",
    }) as LiveSnapshot["meta"];

  // 1) Partido por empezar → debe generar la PREVIA (encuesta).
  const preMatch = {
    ...base,
    matchId: 9101,
    status: "NS",
    score: [0, 0] as [number, number],
    events: [],
    meta: meta(9101, "España", "Brasil", "21:00"),
  } as LiveSnapshot;

  // 2) Partido en vivo con un gol → debe generar la Story de GOL (micro-reto).
  const liveGoal = {
    ...base,
    matchId: 9102,
    status: "2H",
    elapsed: 34,
    score: [1, 0] as [number, number],
    events: [
      {
        id: "ev-gol-1",
        t: 2040,
        minute: 34,
        type: "goal",
        side: "home" as const,
        player: "Lamine Yamal",
      },
    ] as LiveSnapshot["events"],
    meta: meta(9102, "España", "Brasil", "21:00"),
  } as LiveSnapshot;

  return [preMatch, liveGoal];
}

export function demoDeleteStory(id: string): boolean {
  const i = DEMO_USER_STORIES.findIndex((s) => s.id === id);
  if (i < 0) return false;
  DEMO_USER_STORIES.splice(i, 1);
  return true;
}
