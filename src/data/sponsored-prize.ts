// src/data/sponsored-prize.ts
//
// PREMIO PATROCINADO del ranking "Campeón de la semana".
//
// Edita ESTE objeto para activar/cambiar el patrocinador y los premios. NO hay
// migración ni base de datos: es un simple objeto. Mientras `active` sea false,
// el ranking muestra solo el ESTATUS (la corona), sin premios — el estado por
// defecto, gratis y sin riesgo. En cuanto cierres un patrocinador que financie
// el premio, pon active: true y rellena sus datos.
//
// El premio lo financia el PATROCINADOR, no ZonaMundial. La participación en el
// ranking premiado es gratuita. Las bases las define el abogado; enlázalas en
// termsUrl.

export interface SponsoredPrize {
  /** true = se muestran los premios + el patrocinador en el Campeón. false = solo estatus (la corona). */
  active: boolean;
  /** Nombre del patrocinador que pone el premio. Ej: "Coolligan". */
  sponsorName: string;
  /** Logo horizontal del patrocinador (URL https). Opcional. */
  sponsorLogoUrl?: string;
  /** Enlace del patrocinador (su web/promo). Opcional. */
  sponsorUrl?: string;
  /** Premios por puesto, de 1º a Nº. Ej: ["Tarjeta regalo 300 €", "200 €", "100 €"]. */
  prizes: string[];
  /** Nota corta de condiciones (el abogado define el detalle). Opcional. */
  termsNote?: string;
  /** Enlace a las bases legales. Opcional. */
  termsUrl?: string;
}

// Por defecto INACTIVO: el Campeón muestra solo la corona (estatus), sin premios.
// Para activar cuando cierres patrocinador, copia el bloque de ejemplo de abajo.
export const SPONSORED_PRIZE: SponsoredPrize = {
  active: false,
  sponsorName: "",
  prizes: [],
};

// ─── EJEMPLO (copia esto sobre SPONSORED_PRIZE cuando tengas patrocinador) ────
// export const SPONSORED_PRIZE: SponsoredPrize = {
//   active: true,
//   sponsorName: "Coolligan",
//   sponsorLogoUrl: "https://zonamundial.app/patrocinadores/coolligan.png",
//   sponsorUrl: "https://coolligan.com",
//   prizes: ["Tarjeta regalo 300 €", "Tarjeta regalo 200 €", "Tarjeta regalo 100 €"],
//   termsNote: "Concurso gratuito de habilidad. Premio cortesía del patrocinador.",
//   termsUrl: "https://zonamundial.app/bases-campeon",
// };
