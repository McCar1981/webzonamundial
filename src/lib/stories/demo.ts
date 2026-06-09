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
import { CREADORES } from "@/data/creadores";

// Comunidad del "espectador" demo: el creador con el que se habría registrado.
// Las Stories de usuario y de CREADOR solo se ven entre miembros de la misma
// comunidad. Usamos un creador REAL (José Cobo) para ver su nombre+foto.
const DEMO_COMMUNITY = "josecobo";

// Nombre + foto reales por slug de creador (fuente: src/data/creadores.ts).
const CREADOR_BY_SLUG = new Map(CREADORES.map((c) => [c.slug, c]));

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
  relatedMatchId: string | null = null,
  communitySlug: string | null = null
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
    communitySlug,
    viewCount: Math.floor(Math.random() * 9000) + 500,
    createdAt: new Date().toISOString(),
    expiresAt: expiresIso(),
    seen: false,
  };
}

// Stories de ejemplo (mismo contenido que el seed SQL, en memoria). SIN datos
// inventados de partido: el sistema solo lleva una bienvenida; los goles/previas
// reales los emite el motor. Las de creador van atadas a creadores REALES.
const DEMO: StoryDTO[] = [
  dto("demo-sys-1", "system", "⚽ Bienvenido a ZonaMundial. Sigue el Mundial en directo.", [
    { kind: "cta", id: "w-welcome-1", label: "Ver el Match Center", href: "/app/matchcenter" },
  ]),
  dto("demo-cre-1", "creator", "🎬 Hoy analizo las claves del Mundial en mi directo. ¿Te lo pierdes?", [
    { kind: "cta", id: "w-creator-1", label: "Únete a mi liga", href: "/app/ligas" },
  ], null, "josecobo"),
  dto("demo-cre-2", "creator", "🔥 ¿Con qué selección vas en este Mundial?", [
    {
      kind: "poll",
      id: "w-creator-2",
      question: "¿Tu favorita?",
      options: [
        { key: "esp", label: "España" },
        { key: "arg", label: "Argentina" },
        { key: "otra", label: "Otra" },
      ],
    },
  ], null, "svgiago"),
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
  const reels: StoryReelDTO[] = [];

  // 1a) CREADOR: con scope de comunidad (igual que producción). El espectador
  // demo pertenece a DEMO_COMMUNITY → solo ve a ESE creador, con su nombre+foto
  // reales. Un creador de otra comunidad queda fuera.
  const byCreator = new Map<string, StoryDTO[]>();
  for (const s of [...GENERATED, ...DEMO]) {
    if (s.type !== "creator") continue;
    if (s.communitySlug !== DEMO_COMMUNITY) continue; // no estás con ese creador → no sale
    const slug = s.communitySlug;
    const arr = byCreator.get(slug) ?? [];
    arr.push(s);
    byCreator.set(slug, arr);
  }
  for (const [slug, stories] of byCreator) {
    const c = CREADOR_BY_SLUG.get(slug);
    reels.push({
      key: `creator:${slug}`,
      label: c?.nombre ?? reelLabel("creator"),
      type: "creator",
      avatarUrl: c?.imagen ?? null,
      stories,
      allSeen: false,
    });
  }

  // 1b) Tipos públicos restantes (system/narrative/league) agrupados por tipo.
  const byType = new Map<StoryType, StoryDTO[]>();
  for (const s of [...GENERATED, ...DEMO]) {
    if (s.type === "user" || s.type === "creator") continue;
    const arr = byType.get(s.type) ?? [];
    arr.push(s);
    byType.set(s.type, arr);
  }
  const order: StoryType[] = ["system", "narrative", "league"];
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
