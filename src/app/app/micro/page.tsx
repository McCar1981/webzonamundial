// /app/micro — redirección a la superficie VIVA.
//
// Era una landing de marketing del Mundial ("104 partidos") cuyo único CTA
// mandaba a /registro, aunque se entra ya logueado desde el lobby. Las
// micro-predicciones VIVAS ocurren dentro del Match Center de cada partido de
// liga, así que la landing genérica no lleva a ninguna parte útil: se manda al
// hub /ligas, desde donde se entra al partido y a sus micros.
import { redirect } from "next/navigation";

export default function MicroLandingRedirect() {
  redirect("/ligas");
}
