// src/data/sponsored-prize.ts
//
// PREMIO PATROCINADO: Gran Premio del Mundial al Top 3 del ranking GLOBAL.
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
  /** Premios por puesto, de 1º a Nº. Ej: ["Gift Card 300 €", "200 €", "100 €"]. */
  prizes: string[];
  /** Nota corta de condiciones (el abogado define el detalle). Opcional. */
  termsNote?: string;
  /** Enlace a las bases legales. Opcional. */
  termsUrl?: string;
}

// Por defecto INACTIVO: el Campeón muestra solo la corona (estatus), sin premios.
// Para activar cuando cierres patrocinador, copia el bloque de ejemplo de abajo.
export const SPONSORED_PRIZE: SponsoredPrize = {
  active: true,                             // marca de la casa (Sprintmarkt) mientras se cierra un patrocinador externo
  sponsorName: "Sprintmarkt",
  // sponsorLogoUrl: "https://...",         // ← AÑADIR el logo (del patrocinador real) antes de la final
  // sponsorUrl: "https://...",
  prizes: ["Gift Card 300 €", "Gift Card 200 €", "Gift Card 100 €"], // 1º / 2º / 3º por tasa de acierto
  termsNote: "Premio para el Top 3 por tasa de acierto (mín. 20 predicciones) al finalizar el Mundial. Participación gratuita.",
  // termsUrl: "https://zonamundial.app/bases-campeon", // bases legales (las define el abogado)
};

// ─── EJEMPLO (copia esto sobre SPONSORED_PRIZE cuando tengas patrocinador) ────
// export const SPONSORED_PRIZE: SponsoredPrize = {
//   active: true,
//   sponsorName: "Coolligan",
//   sponsorLogoUrl: "https://zonamundial.app/patrocinadores/coolligan.png",
//   sponsorUrl: "https://coolligan.com",
//   prizes: ["Gift Card 300 €", "Gift Card 200 €", "Gift Card 100 €"],
//   termsNote: "Concurso gratuito de habilidad. Premio cortesía del patrocinador.",
//   termsUrl: "https://zonamundial.app/bases-campeon",
// };
