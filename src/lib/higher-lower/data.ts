// src/lib/higher-lower/data.ts
// Agrega los datos de selecciones y jugadores para el juego Higher or Lower.
// En esta primera entrega se usan datos estáticos/deterministas del repo;
// más adelante se pueden enriquecer con datos reales de API.

import { SELECCIONES } from "@/data/selecciones";
import { getExtendedSeleccion } from "@/data/selecciones-extended";
import { getPlayerPool } from "@/lib/fantasy/players";

export interface HLSeleccionSource {
  slug: string;
  nombre: string;
  confederacion: string;
  flagCode: string;
  rankingFIFA?: number;
  mundiales: number;
  gfMundial: number;
  jugadoresClaveCount: number;
}

export interface HLPlayerSource {
  id: string;
  name: string;
  club: string;
  teamSlug: string;
  flag: string;
  marketValue?: number;
  form: number;
  price: number;
}

export function getSeleccionItems(): HLSeleccionSource[] {
  return SELECCIONES.map((s) => {
    const ext = getExtendedSeleccion(s.slug);
    return {
      slug: s.slug,
      nombre: s.nombre,
      confederacion: s.confederacion,
      flagCode: s.flagCode,
      rankingFIFA: s.rankingFIFA,
      mundiales: s.mundiales,
      gfMundial: ext?.estadisticasMundial?.gf ?? 0,
      jugadoresClaveCount: ext?.jugadoresClave?.length ?? 0,
    };
  });
}

export function getPlayerItems(): HLPlayerSource[] {
  return getPlayerPool().map((p) => ({
    id: p.id,
    name: p.name,
    club: p.club,
    teamSlug: p.teamSlug,
    flag: p.flag,
    marketValue: p.marketValue,
    form: p.form,
    price: p.price,
  }));
}
