// src/components/historia/CampeonesEditorial.tsx
//
// Editorial extenso al pie de /historia/campeones. ~900 palabras.
// Sube la página de ~1.000 a ~1.900 palabras.

import Link from "next/link";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const GOLD3 = "#FDE68A";
const TEXT = "#cbd5e1";
const MUTED = "#94a3b8";
const BORDER = "rgba(201,168,76,0.18)";

export default function CampeonesEditorial() {
  return (
    <section
      aria-labelledby="campeones-editorial"
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
          {/* Análisis · 96 años de historia */}
        </div>

        <h2
          id="campeones-editorial"
          style={{
            color: GOLD2,
            fontSize: "clamp(26px, 4vw, 36px)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            margin: "0 0 14px",
          }}
        >
          Los ocho clubes selectos: lo que dicen 22 Mundiales de la historia del fútbol
        </h2>

        <p style={{ color: MUTED, fontSize: 14, marginBottom: 28 }}>
          Redacción de ZonaMundial · Actualizado el 21 de mayo de 2026 ·
          Lectura ~7 min
        </p>

        <p style={{ fontSize: 18, color: "#e2e8f0", marginBottom: 22 }}>
          Desde Uruguay 1930 hasta Argentina 2022, sólo ocho selecciones han
          conseguido levantar la Copa del Mundo. En casi un siglo de
          competición, ningún equipo africano, asiático ni de Oceanía ha sido
          campeón, y el club de los ganadores está dominado por dos
          confederaciones: UEFA y CONMEBOL. Es uno de los datos más sólidos
          del fútbol internacional, y conviene tenerlo a mano antes de
          ilusionarse con sorpresas en el Mundial 2026.
        </p>

        <h3 style={h3}>El club de los ocho campeones</h3>
        <p>
          Brasil lidera el palmarés con <strong>5 títulos</strong> (1958,
          1962, 1970, 1994 y 2002) y ha sido el único equipo presente en los
          22 Mundiales disputados. Le sigue Alemania con <strong>4</strong>{" "}
          (1954, 1974, 1990, 2014) e Italia, también con{" "}
          <strong>4</strong> (1934, 1938, 1982, 2006). En el tercer escalón
          aparecen Argentina con <strong>3</strong> (1978, 1986 y 2022),
          Uruguay con <strong>2</strong> (1930 y 1950) y Francia con{" "}
          <strong>2</strong> (1998 y 2018). España conquistó su único título
          en Sudáfrica 2010, e Inglaterra hizo lo propio en su Mundial de
          casa en 1966. Esa es la lista completa: ningún otro país ha tenido
          jamás el trofeo.
        </p>

        <p>
          El dato resulta más impactante si se mira por continentes: 12
          títulos para Europa, 10 para Sudamérica. Cero para África, Asia,
          Norteamérica y Oceanía. Esa simetría se ha mantenido inalterada
          desde 1930 y se reforzó con las dos últimas finales: 2018
          (Francia-Croacia) y 2022 (Argentina-Francia). El Mundial 2026 podría
          romperla, pero la lista de candidatos reales sigue siendo bastante
          corta.
        </p>

        <h3 style={h3}>Los grandes patrones que se repiten</h3>
        <p>
          Cuando un Mundial se juega en Sudamérica, suele ganarlo una
          selección sudamericana: Brasil 1950 (lo perdió, pero fue local),
          Chile 1962 (ganó Brasil), Argentina 1978 (ganó Argentina) y Brasil
          2014 (ganó Alemania, única excepción). Cuando se juega en Europa,
          gana un europeo: 9 de cada 10 ediciones europeas tuvieron campeón
          europeo (la excepción es Suecia 1958, ganada por Brasil con un
          Pelé de 17 años). Y cuando se juega en formato neutral (Asia,
          África o Norteamérica) la balanza se vuelve más impredecible:
          Argentina ganó Qatar 2022 — primer Mundial en Oriente Medio —
          igual que España hizo en Sudáfrica 2010 o Italia en EE.UU. 1994.
        </p>

        <p>
          El Mundial 2026 cae en la categoría &quot;neutral compartido&quot;: tres
          países anfitriones, tres confederaciones distintas (CONCACAF como
          anfitrión principal, aunque ni México ni Estados Unidos ni Canadá
          son favoritos). Históricamente, ese tipo de Mundiales benefician a
          las selecciones más experimentadas en eliminación directa. Argentina
          y Francia parten como favoritas precisamente por eso: ganaron las
          dos últimas finales, ambas en penaltis, y tienen un núcleo de
          jugadores que sabe cómo gestionar un partido único a vida o muerte.
        </p>

        <h3 style={h3}>Los récords individuales que perdurarán mucho tiempo</h3>
        <p>
          Algunas marcas históricas son tan extremas que difícilmente se
          superarán pronto. <strong>Pelé</strong> es el único futbolista que
          ha ganado tres Mundiales (1958, 1962 y 1970), una hazaña que ni
          Maradona ni Messi pudieron igualar. <strong>Miroslav Klose</strong>{" "}
          (Alemania) es el máximo goleador histórico con{" "}
          <strong>16 goles</strong> repartidos en cuatro Mundiales — Cristiano
          Ronaldo y Messi no llegan a la mitad. <strong>Just Fontaine</strong>{" "}
          marcó <strong>13 goles en un solo Mundial</strong> (Suecia 1958),
          récord que sigue intacto 68 años después.
        </p>

        <p>
          En el plano colectivo, la final de 1950 entre Brasil y Uruguay
          tuvo <strong>173.850 espectadores</strong> en el Maracaná, un
          récord absoluto que ningún estadio moderno puede igualar (los
          aforos máximos del Mundial 2026 rondan los 82.500 en MetLife). El
          partido más goleado fue Hungría 10 - El Salvador 1 en España 1982,
          y el gol más rápido se anotó en 10,8 segundos por Hakan Şükür
          (Turquía vs Corea del Sur, 2002). Todos estos datos están en las{" "}
          <Link href="/selecciones" style={linkGold}>
            fichas individuales de cada selección
          </Link>{" "}
          y en la curiosidades del cron que rota durante el análisis del IA
          Coach.
        </p>

        <h3 style={h3}>¿Por qué hay tan pocos campeones?</h3>
        <p>
          La respuesta corta es: el Mundial es un torneo corto donde la
          experiencia, la profundidad de plantilla y la solidez defensiva
          pesan mucho más que el talento individual. En 7 partidos no da
          tiempo a que aflore el genio: si una estrella tiene un mal día en
          octavos, su equipo queda eliminado. Por eso ganan los equipos que
          combinan jugadores top con un sistema robusto, un DT con
          experiencia mundialista y una mentalidad acostumbrada a la presión
          (Argentina con Scaloni, Francia con Deschamps, Italia con Lippi en
          2006, España con Del Bosque en 2010).
        </p>

        <p>
          Otra razón es geográfica: las academias europeas y sudamericanas
          producen más futbolistas de élite y los integran antes a sus
          selecciones absolutas. Cuando un africano o asiático debuta con su
          selección con la calidad necesaria, suele tener 26-28 años; un
          europeo de la misma calidad ya lleva 50 partidos internacionales a
          esa edad. El experiencia acumulada en partidos grandes marca la
          diferencia en eliminación directa. Pero el Mundial 2026 introduce
          cambios que pueden alterar ese patrón: el formato de 48 selecciones
          da más rodaje, los dieciseisavos abren la puerta a equipos
          revelación y la nueva generación africana (Marruecos, Senegal,
          Costa de Marfil con base en Europa) ya viene con el rodaje
          necesario.
        </p>

        <h3 style={h3}>Qué dice este historial sobre el Mundial 2026</h3>
        <p>
          Estadísticamente, hay un 85% de probabilidad de que el campeón de
          2026 salga de UEFA o CONMEBOL. Dentro de ese 85%, los favoritos
          son Argentina (defensor del título y campeón Copa América 2024),
          Francia (subcampeón 2022, plantilla joven), España (campeón
          Eurocopa 2024) y Brasil (renovado bajo Ancelotti). Portugal,
          Inglaterra, Alemania y Países Bajos pelearán por colarse en
          semifinales. Marruecos sigue siendo la mayor candidata fuera del
          binomio Europa-Sudamérica tras su 4º puesto en Qatar 2022.
        </p>

        <p>
          Para revisar todos los Mundiales año por año, con plantillas
          campeonas, finales, goleadores y subcampeones, navega por la{" "}
          <Link href="/historia" style={linkGold}>línea de tiempo del fútbol mundialista</Link>{" "}
          o lanza tu pronóstico para el Mundial 2026 en el{" "}
          <Link href="/bracket" style={linkGold}>Bracket Challenge</Link>.
          Aprender del pasado es la mejor manera de calibrar las expectativas
          del presente.
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
            {/* Dato curioso */}
          </p>
          <p style={{ margin: 0, fontSize: 15, color: TEXT }}>
            Si Argentina gana el Mundial 2026 igualaría a Italia y Alemania
            con 4 títulos cada uno, y Lionel Messi se convertiría en el primer
            jugador en ganar DOS Mundiales con más de 35 años (después de
            Pelé, único en ganar tres). Brasil seguiría siendo el único país
            con cinco copas hasta nuevo aviso.
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
