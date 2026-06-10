// src/app/_home/sections/GuiaMundial2026Section.tsx
//
// Bloque editorial extenso para la home (1800+ palabras). Pieza pensada para:
//   1. Demostrar a Google AdSense que el sitio tiene contenido original y
//      sustancial (no thin content / no marketing puro).
//   2. Servir como guía rápida del Mundial 2026 para cualquier usuario que
//      llegue por primera vez al sitio.
//   3. Aportar E-E-A-T: autor identificable, fechas, fuentes implícitas
//      (FIFA Match Schedule v17), referencias concretas (estadios, sedes,
//      DTs, dorsales).
//
// Renderizado como artículo semántico con <h2>/<h3>/<p>. Estilos inline
// para evitar dependencias adicionales — sigue el sistema de colores del
// resto de la home.

import Link from "next/link";

const BG = "#060B14";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const GOLD3 = "#FDE68A";
const TEXT = "#cbd5e1";
const MUTED = "#94a3b8";
const BORDER = "rgba(201,168,76,0.18)";

export function GuiaMundial2026Section() {
  return (
    <section
      aria-labelledby="guia-mundial-2026"
      style={{
        background: BG,
        padding: "80px 20px 60px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        position: "relative",
        zIndex: 2,
      }}
    >
      <article
        style={{
          maxWidth: 860,
          margin: "0 auto",
          color: TEXT,
          fontSize: 16,
          lineHeight: 1.75,
        }}
      >
        {/* Eyebrow + dateline */}
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
          {/* Guía editorial · ZonaMundial */}
        </div>

        <h2
          id="guia-mundial-2026"
          style={{
            color: GOLD2,
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            margin: "0 0 18px",
          }}
        >
          Mundial 2026: la guía rápida que necesitas antes de que ruede el balón
        </h2>

        <p style={{ color: MUTED, fontSize: 14, marginBottom: 34 }}>
          Redacción de ZonaMundial · Actualizado el 21 de mayo de 2026 ·{" "}
          <span style={{ color: GOLD2 }}>Lectura ~10 min</span>
        </p>

        <p style={{ fontSize: 18, color: "#e2e8f0", marginBottom: 24 }}>
          La Copa del Mundo 2026 ya tiene fecha, sedes, balón oficial y 48
          selecciones clasificadas. Es el torneo más grande de la historia del
          fútbol: 104 partidos en 39 días, tres países anfitriones y un formato
          que nadie ha visto nunca. Esta guía resume todo lo que necesitas
          saber para llegar al pitido inicial sin perderte en titulares
          confusos.
        </p>

        {/*
          Guía completa plegada en <details>: la home queda ligera (solo
          titular + entradilla a la vista), pero las ~1.800 palabras siguen en
          el HTML servido para SEO/AdSense. Componente de servidor → funciona
          sin JS. No es cloaking: el usuario la despliega cuando quiere.
        */}
        <details className="zm-guia-more">
          <summary className="zm-guia-summary">Leer la guía completa del Mundial 2026</summary>

        {/* ─── Bloque 1: Fechas y sedes ─── */}
        <h3 style={h3}>Cuándo y dónde se juega el Mundial 2026</h3>

        <p>
          El Mundial 2026 arranca el <strong>jueves 11 de junio de 2026</strong>{" "}
          en el <strong>Estadio Azteca de Ciudad de México</strong>, que se
          convertirá en el primer estadio en albergar tres ceremonias de
          inauguración mundialista (después de 1970 y 1986). El partido
          inaugural enfrenta a la selección anfitriona, México, contra Sudáfrica
          a las 15:00 hora del Este de EE. UU. — 22:00 en España, 14:00 en CDMX.
        </p>

        <p>
          La fase de grupos se disputa del 11 al 27 de junio. Los dieciseisavos
          de final, ronda inédita por el nuevo formato de 48 selecciones,
          comienzan el 28 de junio. Octavos arrancan el 4 de julio, cuartos el
          9 de julio, semifinales el 14 y 15 de julio, partido por el tercer
          puesto el 18 de julio y la gran final el{" "}
          <strong>domingo 19 de julio de 2026</strong> en{" "}
          <strong>MetLife Stadium</strong> (Nueva York/Nueva Jersey), a las
          15:00 ET. En total son 39 días de competición, el torneo más largo
          desde 1966.
        </p>

        <p>
          Las 16 sedes están distribuidas en tres países: <strong>11 en
          Estados Unidos</strong> (Atlanta, Boston/Foxborough, Dallas, Houston,
          Kansas City, Los Ángeles, Miami, Nueva York/Nueva Jersey, Filadelfia,
          San Francisco Bay Area y Seattle), <strong>3 en México</strong>{" "}
          (Estadio Azteca en CDMX, Estadio Akron en Guadalajara/Zapopan y
          Estadio BBVA en Monterrey) y <strong>2 en Canadá</strong> (BMO Field
          en Toronto y BC Place en Vancouver). MetLife Stadium se reserva la
          final; SoFi Stadium y AT&T Stadium serán los otros estadios de los
          encuentros más mediáticos. Puedes ver la{" "}
          <Link href="/sedes" style={linkGold}>
            ficha completa de cada sede
          </Link>{" "}
          con capacidad, climatización y partidos confirmados.
        </p>

        {/* ─── Bloque 2: Formato ─── */}
        <h3 style={h3}>El nuevo formato de 48 selecciones explicado</h3>

        <p>
          Por primera vez en la historia, el Mundial pasa de 32 a 48
          selecciones. La FIFA decidió esta ampliación en 2017 y entra en vigor
          ahora. Las 48 se reparten en{" "}
          <strong>12 grupos de 4 equipos</strong> (en lugar de los 8 grupos de
          4 que conocíamos). Cada selección juega 3 partidos en la fase
          inicial, igual que antes.
        </p>

        <p>
          La novedad llega después: clasifican a la siguiente ronda los dos
          primeros de cada grupo (24 equipos) más los 8 mejores terceros (otros
          8 equipos), formando un cuadro de 32 selecciones que disputa la
          ronda llamada <strong>dieciseisavos de final</strong>. A partir de
          ahí, todo es eliminación directa: octavos (16 equipos), cuartos (8),
          semifinales (4), tercer puesto y final.
        </p>

        <p>
          En total: 72 partidos de grupos + 16 dieciseisavos + 8 octavos + 4
          cuartos + 2 semifinales + 1 tercer puesto + 1 final ={" "}
          <strong>104 partidos</strong>. El campeón disputará 8 partidos para
          levantar el trofeo, uno más que en 2022. Si todo sale bien para los
          favoritos, la final podría enfrentar a Argentina (que defiende título)
          contra España o Francia, las tres selecciones con mejor ranking FIFA
          al inicio del torneo.
        </p>

        {/* ─── Bloque 3: Las 48 selecciones ─── */}
        <h3 style={h3}>Las 48 selecciones clasificadas</h3>

        <p>
          De los 48 cupos, 6 se reservaron para los anfitriones (México,
          Estados Unidos, Canadá), y los otros 42 se distribuyeron por
          confederación: <strong>16 UEFA</strong> (Europa),{" "}
          <strong>9 CAF</strong> (África), <strong>8 AFC</strong> (Asia),{" "}
          <strong>6 CONMEBOL</strong> (Sudamérica),{" "}
          <strong>6 CONCACAF</strong> (Norte/Centroamérica y Caribe) y{" "}
          <strong>1 OFC</strong> (Oceanía), más 2 cupos del repechaje
          intercontinental disputado en marzo de 2026 en México.
        </p>

        <p>
          Aparecen debutantes históricos como{" "}
          <strong>Cabo Verde y Curazao</strong> — los dos países más pequeños
          que han clasificado a un Mundial — y vuelve <strong>Noruega</strong>{" "}
          tras 28 años de ausencia (último: Francia 1998), empujada por Erling
          Haaland y Martin Ødegaard. También regresan <strong>Uzbekistán</strong>{" "}
          (debut absoluto), <strong>Jordania</strong>, <strong>Curasao</strong>{" "}
          y un total de 9 selecciones que no estuvieron en Qatar 2022.
        </p>

        <p>
          Los grandes favoritos según las casas de apuestas, ranking FIFA y
          forma reciente son <strong>Argentina</strong> (vigente campeón con
          Messi y Scaloni todavía en activo), <strong>España</strong> (con
          Lamine Yamal y Pedri como columna vertebral), <strong>Francia</strong>{" "}
          (Mbappé en plenitud), <strong>Brasil</strong> (renovada bajo
          Ancelotti) y <strong>Portugal</strong> (CR7 en su sexto Mundial,
          probable retirada en el torneo). En un escalón ligeramente por
          debajo: Inglaterra, Países Bajos, Alemania y Croacia. Marruecos, tras
          su semifinal en Qatar, lidera la candidatura africana junto a
          Senegal. Encuentra tu selección y todos los datos en la sección de{" "}
          <Link href="/selecciones" style={linkGold}>
            las 48 selecciones del Mundial 2026
          </Link>
          .
        </p>

        {/* ─── Bloque 4: Jugadores clave ─── */}
        <h3 style={h3}>Los jugadores que marcarán el Mundial 2026</h3>

        <p>
          Este Mundial llega con una mezcla generacional difícil de repetir.
          Por un lado, los veteranos en su última gran cita: <strong>Lionel
          Messi</strong> (38 años, primera plaza de capitán histórico) liderará
          a Argentina con la voluntad declarada de dar la última batalla; junto
          a él vuelve <strong>Cristiano Ronaldo</strong> (41 años) en lo que
          será también su despedida con Portugal. Y un caso intermedio:{" "}
          <strong>Neymar</strong> (34 años), recuperándose de una nueva lesión
          muscular que le ha tenido en duda hasta últimos días, según la prensa
          brasileña.
        </p>

        <p>
          Por otro lado, la generación que toma el relevo:{" "}
          <strong>Lamine Yamal</strong> (18, Barcelona) llega como uno de los
          tres mejores jugadores del mundo, Balón de Oro previsible;{" "}
          <strong>Jude Bellingham</strong> (22, Real Madrid) es el referente de
          Inglaterra; <strong>Erling Haaland</strong> (25, Manchester City)
          jugará por primera vez un Mundial con Noruega tras quedarse fuera de
          Qatar; <strong>Kylian Mbappé</strong> (27) ya con peso de capitán
          francés busca el segundo título mundial; y{" "}
          <strong>Vinicius Junior</strong> (25) debe asumir el liderazgo del
          ataque brasileño, ahora bajo la dirección de Ancelotti.
        </p>

        <p>
          Tampoco hay que perder de vista a las sorpresas potenciales:{" "}
          <strong>Pedri</strong> (Barcelona) como cerebro español, <strong>Florian
          Wirtz</strong> (Alemania) renovando el centro del campo germano,{" "}
          <strong>Khvicha Kvaratskhelia</strong> (Georgia clasificó vía
          repechaje en una historia épica), <strong>Endrick</strong> (Brasil) y{" "}
          <strong>Désiré Doué</strong> (Francia). En la portería, el español{" "}
          <strong>Unai Simón</strong> y el argentino{" "}
          <strong>Emiliano &quot;Dibu&quot; Martínez</strong> defienden sus arcos como
          los más en forma del último ciclo.
        </p>

        {/* ─── Bloque 5: Los DTs ─── */}
        <h3 style={h3}>Los entrenadores que dirigen este Mundial</h3>

        <p>
          Hay continuidad en los proyectos: <strong>Lionel Scaloni</strong>{" "}
          mantiene Argentina tras ganarlo todo (Copa América 2021 y 2024,
          Mundial 2022, Finalissima 2022); <strong>Luis de la Fuente</strong>{" "}
          dirige a España tras conquistar la Nations League 2023 y la Eurocopa
          2024 con fútbol vertical y bloque alto; <strong>Didier Deschamps</strong>{" "}
          encara su tercer Mundial con Francia (ganó 2018, perdió la final
          2022). En cambio, hay renovación significativa: <strong>Carlo
          Ancelotti</strong> asumió Brasil en 2024 con el reto de reconectar al
          equipo con su identidad ofensiva; <strong>Marcelo Bielsa</strong>{" "}
          completa su segundo Mundial al mando de Uruguay y dejará el cargo tras
          el torneo; <strong>Javier Aguirre</strong> dirige México por tercera
          vez en su carrera y promete un Tri menos miedoso ante los grandes.
        </p>

        <p>
          También sorprende <strong>Hugo Broos</strong> (belga, dirige
          Sudáfrica) tras ganar la Copa Africana de Naciones con Camerún en
          2017, <strong>Mauricio Pochettino</strong> al frente de la USMNT y{" "}
          <strong>Bujar Bujari</strong>, primer técnico kosovar/albanés
          dirigiendo a selecciones grandes europeas.
        </p>

        {/* ─── Bloque 6: Cómo se juega en ZonaMundial ─── */}
        <h3 style={h3}>Cómo se vive el Mundial 2026 en ZonaMundial</h3>

        <p>
          ZonaMundial es una plataforma <strong>gratuita</strong> y en español
          construida específicamente para acompañar al aficionado durante los
          39 días del torneo. No vendemos apuestas: ofrecemos predicciones por
          puntos, fantasy con presupuesto virtual, trivia diaria, álbum
          coleccionable digital, ligas privadas para grupos de amigos y un IA
          Coach con modelo Claude Sonnet 4.5 que analiza cada partido con
          datos reales de api-football (lesiones, forma, H2H, cuotas
          implícitas) antes de sugerir un pronóstico razonado.
        </p>

        <p>
          El acceso a las fichas de selecciones, calendario completo, sedes,
          historia de campeones y noticias del torneo no requiere registro:
          puedes consultarlas como un periódico deportivo. La parte de juego
          (predicciones, fantasy, ligas) sí pide registro gratuito porque
          guarda tu progreso y te permite competir en rankings públicos y
          privados.
        </p>

        <p>
          Toda la base editorial — fichas de jugadores con foto, biografía y
          datos verificados; estadios con planos, capacidad y partidos
          asignados; campeones desde 1930 a 2022 con goleadores y subcampeones
          — se mantiene actualizada manualmente por la redacción y se
          complementa con un cron horario que ingiere noticias deportivas de
          múltiples fuentes (GNews) y las reescribe con IA para entregar
          versiones únicas, no copias literales. Cada nota indica fuente
          original.
        </p>

        {/* ─── Bloque 7: Próximos hitos ─── */}
        <h3 style={h3}>Calendario de hitos antes del pitido inicial</h3>

        <p>
          A pocas semanas del 11 de junio, hay fechas que cualquier aficionado
          debería tener marcadas. <strong>30 de mayo de 2026</strong>: los 48
          seleccionadores presentan la lista provisional de 35 nombres a la
          FIFA. <strong>5 de junio</strong>: anuncio oficial de los 26
          convocados definitivos por selección (han subido de 23 a 26 desde
          Qatar 2022). <strong>7-9 de junio</strong>: ventana FIFA con últimos
          amistosos de preparación.{" "}
          <strong>10 de junio</strong>: ceremonia de apertura en el Estadio
          Azteca, con artistas locales mexicanos y la presentación oficial del
          balón Trionda (Adidas).
        </p>

        <p>
          Si quieres seguir el detalle día a día —fixtures, alineaciones
          probables, lesiones de última hora y cobertura editorial— suscríbete
          al boletín diario en la sección de{" "}
          <Link href="/noticias" style={linkGold}>
            noticias
          </Link>{" "}
          o activa las notificaciones push para no perderte ninguna
          actualización. El Mundial 2026 va a ser el más mediático de la
          historia: más selecciones, más partidos, más jugadores conocidos y
          más maneras de seguirlo. Aquí encontrarás todo en un solo sitio, en
          español neutro y sin letra pequeña.
        </p>

        {/* Caja final */}
        <div
          style={{
            marginTop: 36,
            padding: "22px 24px",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            background:
              "linear-gradient(180deg, rgba(201,168,76,0.04), rgba(11,24,37,0.4))",
          }}
        >
          <p style={{ color: GOLD3, fontSize: 13, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", margin: 0, marginBottom: 8 }}>
            {/* Próximos pasos */}
          </p>
          <p style={{ margin: 0, fontSize: 15, color: TEXT }}>
            Explora{" "}
            <Link href="/grupos" style={linkGold}>los 12 grupos</Link>,{" "}
            <Link href="/calendario" style={linkGold}>el calendario completo</Link>,
            la{" "}
            <Link href="/historia/campeones" style={linkGold}>
              historia de todos los campeones del Mundial
            </Link>{" "}
            o lanza tu primera predicción en el{" "}
            <Link href="/bracket" style={linkGold}>Bracket Challenge</Link>{" "}
            sin registro previo. Todo es gratis, todo en español, todo
            verificado por la redacción.
          </p>
        </div>
        </details>
      </article>

      {/*
        dangerouslySetInnerHTML obligatorio: como texto JSX, el SSR escapa
        ">" y '"' (&gt;/&quot;), el HTML del servidor no coincide al hidratar
        y React re-renderiza toda la home en cliente.
      */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .zm-guia-more > summary {
          list-style: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: ${GOLD};
          font-size: 15px;
          font-weight: 700;
          padding: 12px 0;
          user-select: none;
        }
        .zm-guia-more > summary::-webkit-details-marker { display: none; }
        .zm-guia-more > summary::after {
          content: "+";
          font-size: 20px;
          line-height: 1;
          opacity: 0.8;
        }
        .zm-guia-more[open] > summary::after { content: "−"; }
      `,
        }}
      />
    </section>
  );
}

const h3 = {
  color: GOLD3,
  fontSize: "clamp(20px, 3vw, 26px)",
  fontWeight: 800,
  letterSpacing: "-0.01em",
  marginTop: 36,
  marginBottom: 14,
  lineHeight: 1.2,
};

const linkGold = {
  color: GOLD2,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  textDecorationThickness: 1,
};
