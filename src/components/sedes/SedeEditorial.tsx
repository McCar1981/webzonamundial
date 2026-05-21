// src/components/sedes/SedeEditorial.tsx
//
// Editorial al pie de cada /sedes/[slug]. Lee los campos ricos del JSON
// (historia, clima, transporte, guiaViaje, partidosDestacados...) y los
// expande con prosa contextual. Sube cada página de sede de ~900 → ~1.700
// palabras.

import Link from "next/link";
import type { Sede } from "@/data/sedes";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const GOLD3 = "#FDE68A";
const TEXT = "#cbd5e1";
const MUTED = "#94a3b8";
const BORDER = "rgba(201,168,76,0.18)";

export default function SedeEditorial({ sede }: { sede: Sede }) {
  const ciudad = sede.nombre;
  const estadio = sede.estadio;
  const cap = sede.capacidad.toLocaleString("es-ES");
  const partidos = sede.totalPartidos;
  const fases = sede.fasesQueAlberga.join(", ");

  return (
    <section
      aria-labelledby={`sede-${sede.slug}-editorial`}
      style={{
        background: "#060B14",
        padding: "60px 20px 50px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <article
        style={{
          maxWidth: 820,
          margin: "0 auto",
          color: TEXT,
          fontSize: 16,
          lineHeight: 1.75,
        }}
      >
        <div
          style={{
            color: GOLD,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          // Guía editorial · {ciudad}
        </div>

        <h2
          id={`sede-${sede.slug}-editorial`}
          style={{
            color: GOLD2,
            fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            margin: "0 0 12px",
          }}
        >
          {ciudad}, sede del Mundial 2026: todo lo que necesitas saber
        </h2>

        <p style={{ color: MUTED, fontSize: 14, marginBottom: 26 }}>
          Redacción de ZonaMundial · Actualizado el 21 de mayo de 2026 ·
          Lectura ~5 min
        </p>

        <p style={{ fontSize: 18, color: "#e2e8f0", marginBottom: 22 }}>
          {ciudad} es una de las 16 sedes del Mundial de Fútbol 2026 y
          albergará {partidos} partidos durante el torneo. La sede oficial
          es el {estadio}, con capacidad para {cap} aficionados. Aquí
          repasamos toda la información práctica que necesitas si vas a viajar
          a esta ciudad durante el Mundial o si simplemente quieres
          contextualizar los partidos que se disputen en este estadio.
        </p>

        <h3 style={h3}>El estadio {estadio}</h3>
        <p>{sede.historia}</p>

        {sede.datosClave && (
          <p style={{ marginTop: 12 }}>
            <strong style={{ color: GOLD3 }}>Dato clave: </strong>
            {sede.datosClave}
          </p>
        )}

        <h3 style={h3}>Fases del Mundial que se juegan aquí</h3>
        <p>
          {estadio} albergará un total de {partidos} partidos durante el
          torneo, distribuidos en las siguientes fases:{" "}
          <strong>{fases}</strong>.{" "}
          {sede.partidosDestacados.length > 0 && (
            <>
              Entre los partidos más destacados que se disputarán aquí
              figuran: {sede.partidosDestacados.join("; ")}.
            </>
          )}
        </p>

        <h3 style={h3}>Clima esperado en {ciudad}</h3>
        <p>
          {ciudad} tiene un clima descrito como{" "}
          <strong>{sede.clima.descripcion}</strong> con temperatura media de{" "}
          {sede.clima.tempMedia}. En junio se esperan condiciones{" "}
          {sede.clima.junio.toLowerCase()}, mientras que en julio el
          tiempo sube a {sede.clima.julio.toLowerCase()}. La previsión de
          lluvia para los meses del Mundial es {sede.clima.lluvia.toLowerCase()}.
          {sede.altitudMetros > 1000 && (
            <>
              {" "}Importante: la ciudad está a{" "}
              <strong>{sede.altitudMetros} metros de altitud</strong>, lo
              que puede afectar el rendimiento de equipos no aclimatados a
              ese contexto.
            </>
          )}
          {sede.techoCerrado && (
            <>
              {" "}El estadio cuenta con <strong>techo retráctil/cerrado</strong>,
              lo que neutraliza el factor meteorológico en caso de lluvia o
              calor extremo.
            </>
          )}
        </p>

        <h3 style={h3}>Cómo llegar al estadio</h3>
        <p>
          El aeropuerto principal es <strong>{sede.transporte.aeropuerto}</strong>
          {sede.transporte.codigoIATA && (
            <>
              {" "}(código IATA <strong>{sede.transporte.codigoIATA}</strong>)
            </>
          )}
          , situado a {sede.transporte.distanciaEstadio} del estadio.{" "}
          {sede.transporte.metroTren && (
            <>Para el transporte público: {sede.transporte.metroTren}.</>
          )}{" "}
          La zona horaria de {ciudad} es {sede.zonaHoraria} ({sede.utcOffset}),
          que conviene tener en cuenta para conversiones de horarios de
          partido si sigues el torneo desde Europa.
        </p>

        <h3 style={h3}>Guía para el aficionado que viaja</h3>
        <p>
          <strong>Visa:</strong> {sede.guiaViaje.visa}.{" "}
          <strong>Idioma local:</strong> {sede.guiaViaje.idioma}.{" "}
          <strong>Moneda:</strong> {sede.guiaViaje.moneda}.{" "}
          <strong>Coste medio de alojamiento durante el torneo:</strong>{" "}
          {sede.guiaViaje.costoAlojamiento}.
        </p>

        {sede.guiaViaje.zonasRecomendadas.length > 0 && (
          <p>
            <strong>Zonas recomendadas para alojarse:</strong>{" "}
            {sede.guiaViaje.zonasRecomendadas.join(", ")}. Son las áreas con
            mejor conexión al estadio, ambiente futbolístico y oferta
            gastronómica.
          </p>
        )}

        {sede.guiaViaje.gastronomia && (
          <p>
            <strong>Gastronomía local imprescindible:</strong>{" "}
            {sede.guiaViaje.gastronomia}.
          </p>
        )}

        {sede.guiaViaje.seguridadNota && (
          <p>
            <strong>Seguridad:</strong> {sede.guiaViaje.seguridadNota}.
          </p>
        )}

        {sede.guiaViaje.fanZone && (
          <p>
            <strong>Fan Zone oficial:</strong> {sede.guiaViaje.fanZone}.
          </p>
        )}

        <h3 style={h3}>El contexto de {ciudad} en el Mundial 2026</h3>
        <p>
          {ciudad} forma parte del bloque de {sede.pais} dentro de la
          organización tripartita del Mundial 2026. La región se enmarca en
          la zona {sede.region}, con presencia de aficionados que pueden
          viajar entre sedes próximas con relativa facilidad. Para conocer
          el calendario exacto de partidos que se disputarán en este
          estadio durante el torneo, consulta la{" "}
          <Link href="/calendario" style={linkGold}>
            página del calendario completo del Mundial 2026
          </Link>{" "}
          o explora los{" "}
          <Link href="/grupos" style={linkGold}>12 grupos</Link>{" "}
          para descubrir qué selecciones jugarán aquí.
        </p>

        <div
          style={{
            marginTop: 26,
            padding: "18px 22px",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            background:
              "linear-gradient(180deg, rgba(201,168,76,0.04), rgba(11,24,37,0.4))",
          }}
        >
          <p
            style={{
              color: GOLD3,
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 6,
              margin: 0,
            }}
          >
            // Ficha rápida
          </p>
          <p style={{ margin: 0, fontSize: 15, color: TEXT }}>
            <strong>Estadio:</strong> {estadio} · <strong>Capacidad:</strong>{" "}
            {cap} · <strong>Partidos Mundial 2026:</strong> {partidos} ·{" "}
            <strong>País:</strong> {sede.pais} · <strong>Ciudad:</strong>{" "}
            {sede.ciudad} · <strong>Zona horaria:</strong> {sede.utcOffset}.
          </p>
        </div>
      </article>
    </section>
  );
}

const h3 = {
  color: GOLD3,
  fontSize: "clamp(19px, 3vw, 24px)",
  fontWeight: 800,
  letterSpacing: "-0.01em",
  marginTop: 26,
  marginBottom: 10,
  lineHeight: 1.25,
};

const linkGold = {
  color: GOLD2,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  textDecorationThickness: 1,
};
