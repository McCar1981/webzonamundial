// src/components/CreadoresEditorial.tsx
//
// Intro editorial larga al pie de /creadores. ~700 palabras. Sube la página
// de ~850 a ~1.500 palabras de contenido editorial.

import Link from "next/link";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const GOLD3 = "#FDE68A";
const TEXT = "#cbd5e1";
const MUTED = "#94a3b8";
const BORDER = "rgba(201,168,76,0.18)";

export default function CreadoresEditorial() {
  return (
    <section
      aria-labelledby="creadores-editorial"
      style={{
        background: "#060B14",
        padding: "70px 20px 60px",
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
            marginBottom: 14,
          }}
        >
          {/* Editorial · Comunidad de creadores */}
        </div>

        <h2
          id="creadores-editorial"
          style={{
            color: GOLD2,
            fontSize: "clamp(26px, 4vw, 36px)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            margin: "0 0 14px",
          }}
        >
          Por qué los creadores hispanos de fútbol marcan la diferencia en el Mundial 2026
        </h2>

        <p style={{ color: MUTED, fontSize: 14, marginBottom: 28 }}>
          Redacción de ZonaMundial · Actualizado el 21 de mayo de 2026 ·
          Lectura ~5 min
        </p>

        <p style={{ fontSize: 18, color: "#e2e8f0", marginBottom: 22 }}>
          Los Mundiales se viven en dos pantallas: la grande, donde rueda el
          balón, y la del móvil, donde la gente reacciona, comenta y comparte
          en tiempo real. En esa segunda pantalla, los creadores
          hispanohablantes se han convertido en una voz central. ZonaMundial
          nace precisamente de esa idea: que el Mundial 2026 sea una
          experiencia colectiva, narrada con la mirada de quienes ya
          construyen comunidad cada día sobre fútbol en YouTube, TikTok,
          Twitch e Instagram.
        </p>

        <h3 style={h3}>Qué hacen los creadores en ZonaMundial</h3>
        <p>
          Cada creador del roster ha aceptado conducir su propia comunidad
          dentro de la plataforma durante los 39 días del torneo. Eso se
          traduce en cuatro funciones concretas:
        </p>

        <p>
          <strong>1. Liga privada con sus seguidores.</strong> Cualquier
          aficionado puede unirse a la liga del creador que sigue, competir
          contra el resto de su comunidad y ver en directo cómo va el ranking
          tras cada jornada. Es la forma más sencilla de convertir el Mundial
          en un evento social entre fans de un mismo canal.
        </p>

        <p>
          <strong>2. Streaming sincronizado durante los partidos.</strong>{" "}
          Algunos creadores hacen directos comentando los partidos en
          paralelo a la retransmisión oficial. ZonaMundial integra esos
          streams en la sección &quot;Zona Streaming&quot; para que puedas reaccionar y
          chatear con la comunidad sin abandonar la app.
        </p>

        <p>
          <strong>3. Predicciones públicas.</strong> Cada creador publica sus
          propios pronósticos por partido y tipo de mercado (resultado,
          goleador, corners, tarjetas). El usuario decide si &quot;sigue&quot; al
          creador y replica sus picks o si compite contra él. Es un formato
          honesto: si el creador acierta, gana ranking; si falla, pierde
          puntos como cualquier jugador.
        </p>

        <p>
          <strong>4. Contenido editorial entre partidos.</strong> Vídeos
          cortos, análisis de jornada y resúmenes humorísticos publicados en
          la sección de{" "}
          <Link href="/noticias" style={linkGold}>noticias</Link>{" "}
          o enlazados desde redes sociales. Material producido por
          aficionados auténticos, no por medios corporativos.
        </p>

        <h3 style={h3}>Cómo seleccionamos a los creadores</h3>
        <p>
          ZonaMundial no firma con cualquier perfil que tenga audiencia. Los
          tres criterios que aplica nuestro equipo editorial son:
        </p>

        <ul style={{ paddingLeft: 22, margin: "0 0 18px" }}>
          <li style={liStyle}>
            <strong>Comunidad real, no inflada.</strong> Verificamos
            engagement medio, no solo número de seguidores. Un creador con
            120k seguidores y 8k comentarios por vídeo pesa más que uno con 1M
            de seguidores y 50 likes por publicación.
          </li>
          <li style={liStyle}>
            <strong>Especialización futbolística.</strong> Buscamos creadores
            cuyo contenido principal sea fútbol. No celebridades genéricas
            que aprovechan el Mundial como tendencia puntual.
          </li>
          <li style={liStyle}>
            <strong>Respeto por el público.</strong> Comprobamos historial de
            controversias, spam de afiliación y patrocinios poco
            transparentes. Los creadores que asociamos al proyecto declaran
            cualquier acuerdo comercial visible en su contenido.
          </li>
        </ul>

        <h3 style={h3}>Mundial 2026: un torneo perfecto para creadores</h3>
        <p>
          El cambio de formato a 48 selecciones favorece a quien hace
          contenido independiente. Antes había 32 equipos y los grandes
          medios dominaban la cobertura de los favoritos. Ahora hay 16 más,
          muchos de ellos selecciones africanas, asiáticas y americanas con
          historias menos cubiertas: Cabo Verde, Curazao, Uzbekistán,
          Jordania. Para un creador hispano con audiencia en Latinoamérica,
          contar la historia de Cabo Verde o de Curazao es una oportunidad de
          ofrecer algo único que ningún canal corporativo va a hacer en
          español. ZonaMundial agrega ese contenido y lo enlaza desde las{" "}
          <Link href="/selecciones" style={linkGold}>
            fichas de selecciones
          </Link>
          .
        </p>

        <p>
          Además, los 12 grupos del nuevo formato significan más partidos
          paralelos, más conflictos de horarios y, en consecuencia, más
          espacio para distintas voces simultáneas. Si el Mundial 2022 fue el
          torneo de Argentina y la voz hispanoamericana global, el 2026 puede
          ser el de la diversificación: muchas comunidades vibrantes
          conviviendo, cada una con su creador de referencia.
        </p>

        <h3 style={h3}>Cómo formar parte como creador</h3>
        <p>
          ZonaMundial mantiene abierta la candidatura para creadores que
          quieran sumarse al roster oficial. Los requisitos mínimos son: al
          menos 25k seguidores en una plataforma de vídeo (YouTube, TikTok o
          Twitch), foco principal en contenido futbolístico de los últimos
          12 meses y disponibilidad para dedicar al menos 4 horas semanales a
          la plataforma durante el torneo. Puedes escribir a{" "}
          <Link href="/contacto" style={linkGold}>contacto</Link>{" "}
          con tu pitch y un equipo de la redacción te responderá en menos de
          72 horas. La participación es libre: sin exclusividad, sin
          cláusulas a largo plazo. Una vez termine el Mundial, cada creador
          decide si continuar en la plataforma o no.
        </p>

        <p>
          El objetivo de fondo de toda esta estructura es uno: que el Mundial
          se viva mejor en español, con voces auténticas, sin que el
          aficionado tenga que elegir entre seguir a su creador favorito o
          jugar contra sus amigos. Aquí puede hacer las dos cosas, a la vez,
          gratis.
        </p>

        <div
          style={{
            marginTop: 30,
            padding: "20px 22px",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            background:
              "linear-gradient(180deg, rgba(201,168,76,0.04), rgba(11,24,37,0.4))",
          }}
        >
          <p
            style={{
              color: GOLD3,
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 8,
              margin: 0,
            }}
          >
            {/* Próximos pasos */}
          </p>
          <p style={{ margin: 0, fontSize: 15, color: TEXT }}>
            Sigue a tu creador favorito en{" "}
            <Link href="/registro" style={linkGold}>la pantalla de registro</Link>,
            participa en su liga privada durante el Mundial 2026 y compite
            por puntos contra el resto de su comunidad. También puedes
            explorar el resto de la plataforma:{" "}
            <Link href="/bracket" style={linkGold}>el Bracket Challenge</Link>,{" "}
            <Link href="/noticias" style={linkGold}>las noticias del torneo</Link>{" "}
            o las{" "}
            <Link href="/selecciones" style={linkGold}>fichas de las 48 selecciones</Link>.
          </p>
        </div>
      </article>
    </section>
  );
}

const h3 = {
  color: GOLD3,
  fontSize: "clamp(20px, 3vw, 25px)",
  fontWeight: 800,
  letterSpacing: "-0.01em",
  marginTop: 30,
  marginBottom: 12,
  lineHeight: 1.25,
};

const linkGold = {
  color: GOLD2,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  textDecorationThickness: 1,
};

const liStyle = {
  marginBottom: 10,
};
