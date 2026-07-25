// src/lib/ligas/fantasy-config.ts
//
// Constantes del Fantasy de Zona de Ligas. Vive fuera de la route porque una
// route del App Router solo puede exportar handlers y config de Next
// (`runtime`, `dynamic`, `GET`, `POST`…): cualquier otro export rompe el
// typecheck de `.next/types` (TS2344).

/** Jugadores que forman el once de la jornada en el Fantasy de Ligas. */
export const SQUAD_SIZE = 5;
