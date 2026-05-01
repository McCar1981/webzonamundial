// Historia de los Mundiales: todos los campeones desde 1930.
// Keyword: "todos los campeones del mundial" (~22.000/mes), "historia mundiales".
// Publicación: miércoles 22 abril 2026.

import type { BlogPost } from "@/lib/blog/types";

const post: BlogPost = {
  slug: "historia-mundiales-todos-los-campeones",
  title:
    "Todos los campeones del Mundial de fútbol desde 1930: historia completa de la Copa del Mundo",
  description:
    "Lista completa de los 22 campeones del Mundial desde Uruguay 1930 hasta Argentina 2022. Sedes, finales, máximos goleadores y los datos que marcaron cada Copa del Mundo.",
  dek: "De Uruguay 1930 a Qatar 2022: 22 ediciones, 8 países campeones, miles de goles y millones de historias. Este es el repaso editorial al torneo más grande del deporte.",
  ogImage:
    "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1200&q=80&auto=format&fit=crop",
  category: "historia",
  keywords: [
    "todos los campeones del mundial",
    "historia mundiales fifa",
    "historia copa del mundo",
    "campeones mundial futbol",
    "ganadores mundial fifa",
    "lista mundiales futbol",
    "uruguay 1930",
    "brasil mundiales",
  ],
  tags: ["Historia", "Mundiales", "Campeones", "FIFA", "Brasil", "Argentina"],
  publishedAt: "2026-04-22T08:00:00+02:00",
  readingTime: 11,
  body: [
    {
      type: "p",
      text: "**Desde 1930 se han disputado 22 Copas del Mundo**. En 96 años de torneo, sólo **8 selecciones** han logrado levantar el trofeo. La FIFA cuenta los Mundiales desde la primera edición uruguaya y, aunque el torneo se interrumpió **dos veces por la Segunda Guerra Mundial** (1942 y 1946), su línea histórica es la más continua y mejor documentada del deporte.",
    },
    {
      type: "p",
      text: "Antes de que ruede el balón en USA-México-Canadá 2026, repasemos quiénes han escrito esta historia, qué países han dominado, qué jugadores han brillado y cuáles son los datos clave de cada edición. Si quieres entender el peso histórico que cargará cada selección rumbo al MetLife Stadium, este es tu artículo.",
    },
    {
      type: "callout",
      variant: "gold",
      title: "TL;DR · LO ESENCIAL",
      text: "**Brasil 5 títulos**, **Alemania e Italia 4 cada uno**, **Argentina 3**, **Uruguay y Francia 2 cada uno**, **Inglaterra y España 1 cada uno**. Solo **8 selecciones campeonas**. Ningún país asiático, africano ni norteamericano ha levantado nunca el trofeo.",
    },
    {
      type: "h2",
      text: "Tabla histórica: los 22 campeones del Mundial",
      id: "tabla-completa",
    },
    {
      type: "table",
      caption: "Todos los Mundiales disputados con campeón, sede, final y goles totales del torneo.",
      headers: ["Año", "Sede", "Campeón", "Subcampeón", "Final"],
      rows: [
        ["**1930**", "Uruguay", "**Uruguay**", "Argentina", "4-2"],
        ["**1934**", "Italia", "**Italia**", "Checoslovaquia", "2-1 (pr)"],
        ["**1938**", "Francia", "**Italia**", "Hungría", "4-2"],
        ["1942-1946", "—", "**No disputados (II Guerra Mundial)**", "—", "—"],
        ["**1950**", "Brasil", "**Uruguay**", "Brasil", "2-1 (Maracanazo)"],
        ["**1954**", "Suiza", "**Alemania Occidental**", "Hungría", "3-2"],
        ["**1958**", "Suecia", "**Brasil**", "Suecia", "5-2"],
        ["**1962**", "Chile", "**Brasil**", "Checoslovaquia", "3-1"],
        ["**1966**", "Inglaterra", "**Inglaterra**", "Alemania Occidental", "4-2 (pr)"],
        ["**1970**", "México", "**Brasil**", "Italia", "4-1"],
        ["**1974**", "Alemania Occ.", "**Alemania Occidental**", "Países Bajos", "2-1"],
        ["**1978**", "Argentina", "**Argentina**", "Países Bajos", "3-1 (pr)"],
        ["**1982**", "España", "**Italia**", "Alemania Occidental", "3-1"],
        ["**1986**", "México", "**Argentina**", "Alemania Occidental", "3-2"],
        ["**1990**", "Italia", "**Alemania Occidental**", "Argentina", "1-0"],
        ["**1994**", "EE.UU.", "**Brasil**", "Italia", "0-0 (3-2 pen)"],
        ["**1998**", "Francia", "**Francia**", "Brasil", "3-0"],
        ["**2002**", "Corea/Japón", "**Brasil**", "Alemania", "2-0"],
        ["**2006**", "Alemania", "**Italia**", "Francia", "1-1 (5-3 pen)"],
        ["**2010**", "Sudáfrica", "**España**", "Países Bajos", "1-0 (pr)"],
        ["**2014**", "Brasil", "**Alemania**", "Argentina", "1-0 (pr)"],
        ["**2018**", "Rusia", "**Francia**", "Croacia", "4-2"],
        ["**2022**", "Qatar", "**Argentina**", "Francia", "3-3 (4-2 pen)"],
      ],
    },
    {
      type: "h2",
      text: "Los 8 países campeones: clasificación histórica",
      id: "campeones-paises",
    },
    {
      type: "stat",
      items: [
        { value: "5", label: "Brasil", sub: "1958, 1962, 1970, 1994, 2002" },
        { value: "4", label: "Alemania", sub: "1954, 1974, 1990, 2014" },
        { value: "4", label: "Italia", sub: "1934, 1938, 1982, 2006" },
        { value: "3", label: "Argentina", sub: "1978, 1986, 2022" },
      ],
    },
    {
      type: "p",
      text: "Brasil es la única selección que **ha ganado en cuatro continentes distintos** (América, Europa, Asia y como anfitrión sudamericano). Italia es la única que **ganó dos consecutivos** (1934 y 1938). Alemania llegó a **8 finales** (récord) sin contar las que perdió siendo Alemania Occidental. Argentina se ha **quedado a 90 minutos del bicampeonato** dos veces (1990 y 2014).",
    },
    {
      type: "h2",
      text: "Los seis Mundiales más memorables (criterio editorial)",
      id: "memorables",
    },
    {
      type: "h3",
      text: "1. Brasil 1970 — el verdoamarelo perfecto",
      id: "mexico-1970",
    },
    {
      type: "p",
      text: "**Brasil ganó los seis partidos disputados**, incluida la final contra Italia (4-1). Pelé, Tostão, Jairzinho, Gerson, Rivelino, Carlos Alberto: el equipo más completo que se ha visto en una Copa del Mundo. El gol de Carlos Alberto en la final —tras una jugada colectiva de 9 toques— sigue siendo el mejor gol oficial del fútbol según múltiples rankings históricos. Brasil ganó la **Jules Rimet a perpetuidad** (la copa original que se entregaba al país que ganara tres Mundiales).",
    },
    {
      type: "h3",
      text: "2. España 2010 — la liberación tras décadas",
      id: "sudafrica-2010",
    },
    {
      type: "p",
      text: "España llegó como vigente campeona europea pero con la mochila histórica de **80 años sin levantar trofeos en Mundiales**. Tras perder el debut contra Suiza (0-1), el equipo de Del Bosque encadenó 6 victorias consecutivas y ganó la final contra Países Bajos con un gol de **Iniesta en el minuto 116**. La generación Xavi-Iniesta-Casillas-Puyol-Villa entró en el panteón histórico.",
    },
    {
      type: "h3",
      text: "3. Argentina 2022 — el último baile de Messi",
      id: "qatar-2022",
    },
    {
      type: "p",
      text: "**La final más emocionante de la historia.** Argentina-Francia: 3-3 tras 120 minutos de fútbol vertiginoso, con Messi marcando dos veces y Mbappé tres. **Penales: 4-2 para Argentina**. Messi ganó por fin **el único trofeo que le faltaba**, completando lo que muchos consideran la mejor carrera futbolística del siglo XXI. Lautaro Martínez, Julián Álvarez, Mac Allister, De Paul, Dibu Martínez: nombres que ya están en la historia.",
    },
    {
      type: "h3",
      text: "4. Italia 1990 — el Mundial de las lágrimas",
      id: "italia-1990",
    },
    {
      type: "p",
      text: "Recordado por la **emoción italiana de Schillaci**, los **45 minutos finales de Maradona** intentando todo contra Alemania, y el escándalo de **Camerún expulsando a Maradona en octavos** del torneo más sorpresivo de la era moderna. El campeón fue Alemania Occidental por última vez antes de la reunificación.",
    },
    {
      type: "h3",
      text: "5. Brasil 1958 — el debut de Pelé adolescente",
      id: "suecia-1958",
    },
    {
      type: "p",
      text: "Pelé tenía **17 años** cuando jugó su primer Mundial. Marcó **6 goles**, incluyendo dos en la final contra Suecia (5-2). Es el **jugador más joven en marcar en una final de Mundial** y el más joven en ganar el torneo. Brasil ganó su primer título y comenzó la dinastía verdeamarela.",
    },
    {
      type: "h3",
      text: "6. Uruguay 1950 — el Maracanazo",
      id: "brasil-1950",
    },
    {
      type: "p",
      text: "**El partido más doloroso del fútbol brasileño**. 200.000 personas en el Maracaná, Brasil necesitaba un empate para ser campeón en casa, perdió 2-1 contra Uruguay. **Obdulio Varela, capitán uruguayo**, calló al estadio entero. El periodista Mario Filho escribió: *'No hubo silencio: hubo un grito que se ahogó'*. Uruguay sumó su segundo Mundial.",
    },
    {
      type: "callout",
      variant: "blue",
      title: "DATO QUE IMPRESIONA",
      text: "**Pelé es el único jugador con 3 Mundiales ganados** (1958, 1962, 1970). En 1962 jugó solo dos partidos por lesión pero recibió la medalla. **Pelé es la única estrella que ganó tres Copas del Mundo en la historia**.",
    },
    {
      type: "h2",
      text: "Los máximos goleadores de la historia de los Mundiales",
      id: "maximos-goleadores",
    },
    {
      type: "table",
      caption: "Top 10 goleadores históricos de Mundiales (todas las ediciones).",
      headers: ["#", "Jugador", "País", "Goles", "Mundiales"],
      rows: [
        ["1", "**Miroslav Klose**", "Alemania", "16", "4 (2002-2014)"],
        ["2", "**Ronaldo Nazário**", "Brasil", "15", "3 (1994-2006)"],
        ["3", "**Gerd Müller**", "Alemania Occ.", "14", "2 (1970-1974)"],
        ["4", "**Just Fontaine**", "Francia", "13", "1 (1958)"],
        ["5", "**Lionel Messi**", "Argentina", "13", "5 (2006-2022)"],
        ["6", "**Pelé**", "Brasil", "12", "4 (1958-1970)"],
        ["7", "**Kylian Mbappé**", "Francia", "12", "2 (2018-2022)"],
        ["8", "**Sándor Kocsis**", "Hungría", "11", "1 (1954)"],
        ["9", "**Jürgen Klinsmann**", "Alemania", "11", "3 (1990-1998)"],
        ["10", "**Helmut Rahn**", "Alemania Occ.", "10", "2 (1954-1958)"],
      ],
    },
    {
      type: "p",
      text: "**Messi se quedó a 3 goles del récord absoluto** de Klose. **Mbappé llega al Mundial 2026 a 5 goles del récord** y con 27 años. Es muy probable que durante el torneo se rompa la marca histórica de 16 goles del alemán. La gran candidata: la final del 19 de julio.",
    },
    {
      type: "h2",
      text: "Curiosidades históricas que deberías saber",
      id: "curiosidades",
    },
    {
      type: "ul",
      items: [
        "**Solo dos países anfitriones han ganado su Mundial** desde 1990: Francia 1998 y nadie más. Es estadística que aplicará a México, USA y Canadá en 2026.",
        "**El Mundial 1950 no tuvo final**: el ganador (Uruguay) se decidió por un cuadrangular final, no por una final única.",
        "**Hungría ha jugado dos finales (1938 y 1954) sin ganar nunca** el torneo. Es el país con más finales perdidas sin ningún título.",
        "**El máximo goleador de un solo Mundial es Just Fontaine (Francia)**: marcó **13 goles en 6 partidos** en Suecia 1958. Récord que probablemente nunca se romperá.",
        "**El Mundial más rápido de gol** lo abrió Hakan Şükür en 2002: **10,8 segundos** Turquía vs Corea del Sur.",
        "**Brasil y Alemania son las únicas selecciones que han participado en TODOS los Mundiales** disputados desde 1930.",
      ],
    },
    {
      type: "cta",
      title: "Las 48 selecciones del Mundial 2026",
      text: "Conoce las plantillas, capitanes y once ideales de las 48 clasificadas a USA-México-Canadá.",
      href: "/selecciones",
      label: "Ver fichas BIBLIA",
    },
    {
      type: "h2",
      text: "El Mundial 2026: ¿escribirá una nueva página o repetirá historia?",
      id: "mundial-2026",
    },
    {
      type: "p",
      text: "USA-México-Canadá 2026 puede aportar varios récords nuevos: **primer Mundial de 48 selecciones**, **primer Mundial organizado por 3 países**, **primer estadio en abrir 3 Mundiales** (Azteca), y muy probablemente **el récord absoluto de goleo histórico** (Mbappé candidato a superar a Klose).",
    },
    {
      type: "p",
      text: "Si quieres ver quiénes parten como favoritos, no te pierdas nuestro [análisis selección por selección](/blog/quien-ganara-el-mundial-2026). El Mundial 2026 será histórico por su tamaño, pero sólo si nos regala una final inolvidable como la de Qatar 2022 entrará en el top de los recordados para siempre.",
    },
    {
      type: "divider",
    },
    {
      type: "p",
      text: "Esta historia continúa. Editorial Zona Mundial actualizará este artículo después del 19 de julio de 2026 con los datos finales del nuevo campeón. ¿Será Argentina la que se convierta en cuatricampeona y empate a Italia y Alemania? ¿Volverá Brasil a ganar después de 24 años? ¿O escribirá Francia su tercer Mundial? El balón empezará a rodar el 11 de junio.",
    },
    {
      type: "faq",
      items: [
        {
          q: "¿Cuántos Mundiales ha ganado Brasil?",
          a: "**Brasil ha ganado 5 Copas del Mundo**: 1958 (Suecia), 1962 (Chile), 1970 (México), 1994 (USA) y 2002 (Corea/Japón). Es el país con más títulos mundiales en la historia.",
        },
        {
          q: "¿Cuántos países han ganado el Mundial?",
          a: "**Solo 8 selecciones** han ganado el Mundial: Brasil (5), Alemania (4), Italia (4), Argentina (3), Uruguay (2), Francia (2), Inglaterra (1) y España (1).",
        },
        {
          q: "¿Quién es el máximo goleador histórico de Mundiales?",
          a: "**Miroslav Klose (Alemania) con 16 goles** repartidos en 4 Mundiales (2002-2014). Le siguen Ronaldo Nazário (15) y Gerd Müller (14).",
        },
        {
          q: "¿Quién es el único jugador con 3 Mundiales ganados?",
          a: "**Pelé**, con Brasil en 1958, 1962 y 1970. Es el único futbolista de la historia con tres campeonatos del mundo.",
        },
        {
          q: "¿Cuándo se disputó el primer Mundial?",
          a: "El **primer Mundial de la historia se jugó en 1930 en Uruguay**. Lo ganó la propia selección anfitriona contra Argentina (4-2) en la final.",
        },
        {
          q: "¿Por qué no se disputaron Mundiales en 1942 y 1946?",
          a: "Por la **Segunda Guerra Mundial**. Tras la edición de 1938 en Francia, el torneo se reanudó en 1950 en Brasil tras una pausa de 12 años.",
        },
      ],
    },
  ],
  faq: [
    {
      q: "¿Cuántos Mundiales ha ganado Brasil?",
      a: "Brasil ha ganado 5 Copas del Mundo: 1958, 1962, 1970, 1994 y 2002. Es el país con más títulos en la historia.",
    },
    {
      q: "¿Cuántos países han ganado el Mundial?",
      a: "Solo 8 selecciones: Brasil, Alemania, Italia, Argentina, Uruguay, Francia, Inglaterra y España.",
    },
    {
      q: "¿Quién es el máximo goleador histórico?",
      a: "Miroslav Klose (Alemania) con 16 goles en 4 Mundiales (2002-2014).",
    },
    {
      q: "¿Cuándo se disputó el primer Mundial?",
      a: "En 1930 en Uruguay. Lo ganó la propia selección anfitriona contra Argentina (4-2).",
    },
  ],
  related: [
    "selecciones-clasificadas-mundial-2026",
    "argentina-mundial-2026-puede-repetir",
    "mejores-jugadores-mundial-2026",
  ],
};

export default post;
