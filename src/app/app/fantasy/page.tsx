// /app/fantasy — redirección a la superficie VIVA.
//
// Esta ruta era una landing de marketing ÍNTEGRA del Fantasy del Mundial (13
// selecciones, 15 jugadores, banderas) con CTA a /app/fantasy/jugar, el juego
// de selecciones que murió con el torneo el 19-jul. El Fantasy vivo es POR
// LIGA (/ligas/[slug]/fantasy), así que no hay un destino único: se manda al
// hub /ligas, que lista las ligas y ofrece la tarjeta de Fantasy de cada una.
//
// El juego y las ligas privadas siguen en /app/fantasy/jugar (no se toca);
// esto solo retira la landing de marketing caducada.
import { redirect } from "next/navigation";

export default function FantasyLandingRedirect() {
  redirect("/ligas");
}
