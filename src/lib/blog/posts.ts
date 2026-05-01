// src/lib/blog/posts.ts
// Registro central de todos los artículos del blog editorial.
//
// Para añadir un post nuevo:
//   1. Crear src/content/blog/<slug>.ts exportando default un BlogPost.
//   2. Importar y añadir al array POSTS de abajo.
//   3. publishedAt determina cuándo se hace público.

import type { BlogPost } from "./types";

import calendarioMundial from "@/content/blog/calendario-mundial-2026-completo";
import quienGanaMundial from "@/content/blog/quien-ganara-el-mundial-2026";
import mejoresJugadores from "@/content/blog/mejores-jugadores-mundial-2026";
import sedesPaises from "@/content/blog/sedes-mundial-2026-usa-mexico-canada";
import argentinaMundial from "@/content/blog/argentina-mundial-2026-puede-repetir";
import estadiosRanking from "@/content/blog/estadios-mundial-2026-ranking";
import cuandoEmpieza from "@/content/blog/cuando-empieza-el-mundial-2026";
import seleccionesClasificadas from "@/content/blog/selecciones-clasificadas-mundial-2026";

export const POSTS: BlogPost[] = [
  calendarioMundial,
  quienGanaMundial,
  mejoresJugadores,
  sedesPaises,
  argentinaMundial,
  estadiosRanking,
  cuandoEmpieza,
  seleccionesClasificadas,
];
