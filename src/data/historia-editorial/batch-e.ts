import type { EditorialMap } from "./types";

export const BATCH_E: EditorialMap = {
  comparar: {
    lead: "Comparar ediciones del Mundial y selecciones entre sí permite entender la historia del torneo más allá de los títulos. ¿Fue más dominante Brasil en 1970 o España en 2010? ¿Qué edición tuvo más goles por partido? Esta herramienta cruza palmarés, rendimiento, goles y participaciones desde Uruguay 1930 hasta la actualidad para responder esas preguntas con datos verificables.",
    sections: [
      {
        h: "Qué se puede comparar entre selecciones",
        body: [
          "El primer eje de comparación es el palmarés. Brasil encabeza con cinco títulos (1958, 1962, 1970, 1994 y 2002), seguido por Alemania e Italia con cuatro cada una, Argentina con tres (1978, 1986 y 2022), y Uruguay y Francia con dos. Pero el palmarés no lo dice todo: conviene mirar también finales jugadas, semifinales alcanzadas y partidos ganados en fases finales.",
          "Un segundo eje es el rendimiento sostenido. Alemania es la selección con más semifinales disputadas en la historia, lo que refleja una regularidad que ningún campeón improvisado iguala. Comparar a un campeón puntual con una potencia constante ayuda a distinguir entre la gloria de una edición y el dominio histórico real.",
        ],
      },
      {
        h: "Comparar ediciones del torneo",
        body: [
          "Las ediciones cambian de formato y eso afecta cualquier comparación. El Mundial de 1930 tuvo 13 selecciones; el de 1982 pasó a 24; desde 1998 hasta 2022 fueron 32, y la edición de 2026 estrenará 48. Por eso conviene comparar promedios, no totales absolutos: por ejemplo, Francia 1938 promedió casi cuatro goles por partido, mientras ediciones recientes rondan los 2,6 o 2,7.",
        ],
      },
      {
        h: "Indicadores útiles para una comparación justa",
        body: [
          "Goles a favor y en contra, diferencia de gol, porcentaje de victorias y goleadores máximos por edición son métricas que normalizan mejor las diferencias de formato. El récord de Just Fontaine, 13 goles en Suecia 1958, sigue siendo imbatido pese a que hoy se juegan más partidos por torneo, lo que demuestra el valor de mirar el contexto y no solo la cifra bruta.",
        ],
      },
    ],
    faq: [
      {
        q: "¿Qué selección ha ganado más Mundiales?",
        a: "Brasil, con cinco títulos: 1958, 1962, 1970, 1994 y 2002. Es además la única selección que ha disputado todas las ediciones del torneo.",
      },
      {
        q: "¿Sirve comparar el número total de goles entre ediciones antiguas y modernas?",
        a: "No directamente, porque el número de partidos cambió mucho. Es preferible comparar el promedio de goles por partido para que la comparación sea justa.",
      },
      {
        q: "¿Qué jugador marcó más goles en una sola edición?",
        a: "Just Fontaine, con 13 goles para Francia en Suecia 1958, un récord que aún no ha sido superado.",
      },
    ],
  },

  buscar: {
    lead: "El buscador recorre la base de datos histórica del Mundial: ediciones desde 1930, selecciones participantes, jugadores, goleadores y récords. Permite encontrar en segundos quién ganó la Bota de Oro en un año concreto, cuántas veces llegó una selección a la final o qué resultado tuvo un partido específico. Detrás de cada búsqueda hay datos contrastados de más de noventa años de historia.",
    sections: [
      {
        h: "Qué información cubre la base de datos",
        body: [
          "El núcleo son las 22 ediciones disputadas entre Uruguay 1930 y Catar 2022, con sus sedes, campeones, finalistas y resultados de fase final. A ello se suman los registros de jugadores históricos como Pelé, único futbolista con tres títulos mundiales (1958, 1962 y 1970), Miroslav Klose, máximo goleador histórico del torneo con 16 tantos, y Lionel Messi, campeón en 2022 tras varias participaciones.",
          "Cada selección cuenta con su ficha de participaciones, victorias y mejores resultados, lo que facilita rastrear trayectorias completas, desde debutantes hasta multicampeonas.",
        ],
      },
      {
        h: "Cómo aprovechar las búsquedas por récord",
        body: [
          "Buscar por récords ayuda a descubrir datos poco conocidos. Por ejemplo, la final más goleada fue la de Suiza 1954, con Alemania Federal venciendo 3-2 a Hungría en el llamado Milagro de Berna; la mayor goleada en fase final la firmó Hungría con un 10-1 a El Salvador en 1982; y Lothar Matthäus ostentó durante años el récord de partidos disputados antes de ser superado por Messi.",
        ],
      },
      {
        h: "Búsquedas por edición, país y jugador",
        body: [
          "Se puede filtrar por año para revisar una edición completa, por país para seguir a una selección a lo largo del tiempo, o por nombre para encontrar a un futbolista concreto. Esta estructura permite responder preguntas como qué selección anfitriona ganó su propio Mundial: ocurrió con Uruguay 1930, Italia 1934, Inglaterra 1966, Alemania 1974, Argentina 1978 y Francia 1998.",
        ],
      },
    ],
    faq: [
      {
        q: "¿Quién es el máximo goleador en la historia de los Mundiales?",
        a: "Miroslav Klose, de Alemania, con 16 goles repartidos entre las ediciones de 2002, 2006, 2010 y 2014.",
      },
      {
        q: "¿Cuántas ediciones del Mundial se han disputado?",
        a: "Hasta 2022 se han disputado 22 ediciones, desde Uruguay 1930. La primera tras la pausa por la Segunda Guerra Mundial fue Brasil 1950.",
      },
      {
        q: "¿Qué selecciones anfitrionas han ganado el Mundial?",
        a: "Uruguay (1930), Italia (1934), Inglaterra (1966), Alemania (1974), Argentina (1978) y Francia (1998).",
      },
    ],
  },

  quiz: {
    lead: "El quiz de historia del Mundial pone a prueba tus conocimientos con preguntas sobre campeones, goleadores, sedes y momentos legendarios. Desde el primer gol de la historia del torneo hasta la tanda de penales de 2022, cada pregunta se apoya en datos reales. Es una forma de aprender jugando: muchas respuestas sorprenden incluso a los aficionados más veteranos.",
    sections: [
      {
        h: "Datos que suelen aparecer en el quiz",
        body: [
          "El primer gol de la historia de los Mundiales lo marcó el francés Lucien Laurent ante México en 1930. El primer campeón fue Uruguay, que venció a Argentina 4-2 en aquella final inaugural. Preguntas como estas, junto a quién levantó el primer trofeo o qué país organizó la primera Copa del Mundo, son habituales en cualquier trivia bien construida.",
          "También aparecen récords: la final con más goles, el goleador de una edición concreta o el portero menos batido de un torneo, como Walter Zenga en Italia 1990.",
        ],
      },
      {
        h: "Preguntas sobre finales y definiciones",
        body: [
          "Las definiciones por penales dan mucho juego. La primera final resuelta desde el punto de penal fue Brasil-Italia en Estados Unidos 1994, con el fallo de Roberto Baggio. En 2006, Italia volvió a ganar por penales a Francia, en la final marcada por el cabezazo de Zinedine Zidane a Marco Materazzi. Y en 2022, Argentina superó a Francia tras un 3-3 que terminó en los penales.",
        ],
      },
      {
        h: "Cómo el quiz refuerza el aprendizaje",
        body: [
          "Alternar preguntas fáciles con otras de detalle ayuda a fijar fechas y nombres. Saber que Pelé debutó con apenas 17 años en 1958, o que Diego Maradona marcó dos goles inolvidables a Inglaterra en 1986, se memoriza mejor cuando se responde activamente que cuando solo se lee. El formato de trivia convierte la historia del fútbol en un repaso entretenido y memorable.",
        ],
      },
    ],
    faq: [
      {
        q: "¿Quién marcó el primer gol en la historia de los Mundiales?",
        a: "El francés Lucien Laurent, en el partido entre Francia y México disputado en Uruguay 1930.",
      },
      {
        q: "¿Cuál fue la primera final del Mundial decidida por penales?",
        a: "La de Estados Unidos 1994, entre Brasil e Italia, con el penal fallado por Roberto Baggio que dio el título a Brasil.",
      },
      {
        q: "¿A qué edad debutó Pelé en un Mundial?",
        a: "Con 17 años, en Suecia 1958, torneo en el que Brasil se proclamó campeón por primera vez.",
      },
    ],
  },

  visualizaciones: {
    lead: "Las visualizaciones traducen casi un siglo de datos del Mundial en gráficos claros: evolución de los goles por partido, reparto de títulos entre selecciones, asistencias por sede y rendimiento por confederación. Ver la historia del torneo en una línea de tiempo o en un mapa ayuda a entender tendencias que las tablas de números, por sí solas, no dejan apreciar a primera vista.",
    sections: [
      {
        h: "La evolución de los goles por partido",
        body: [
          "Uno de los gráficos más reveladores es la curva de goles por partido. En Suiza 1954 se alcanzó el promedio más alto de la historia, con 5,38 goles por encuentro, mientras que las ediciones modernas se estabilizan entre 2,5 y 2,7. Esta caída refleja cambios tácticos, mayor preparación física y defensas más organizadas a lo largo de las décadas.",
          "Visualizar esta tendencia permite situar cada edición en su contexto y entender por qué comparar cifras absolutas entre épocas distintas induce a error.",
        ],
      },
      {
        h: "Campeones y dominio por décadas",
        body: [
          "Un gráfico de barras o un mapa de títulos muestra cómo se reparte la gloria: Brasil con cinco, Alemania e Italia con cuatro, Argentina con tres, Uruguay y Francia con dos, e Inglaterra y España con uno cada una. Distribuido por décadas se aprecia el dominio sudamericano y europeo alternándose, y el hecho de que ningún Mundial disputado en Europa lo había ganado una selección sudamericana hasta Brasil en 2002, jugado en Asia.",
        ],
      },
      {
        h: "Asistencias y crecimiento del torneo",
        body: [
          "La serie de asistencias totales ilustra el crecimiento del evento: de las 590.000 personas de Uruguay 1930 a los varios millones de las ediciones recientes, con Estados Unidos 1994 marcando el récord de público promedio por partido gracias a sus grandes estadios. Acompañar este dato con la ampliación del número de selecciones, de 13 a 48 en 2026, da una imagen completa de la expansión del Mundial.",
        ],
      },
    ],
    faq: [
      {
        q: "¿En qué edición hubo más goles por partido?",
        a: "En Suiza 1954, con un promedio de 5,38 goles por encuentro, el más alto registrado en la historia del torneo.",
      },
      {
        q: "¿Por qué han bajado los goles por partido con el tiempo?",
        a: "Por la evolución táctica, la mejor preparación física y defensas más organizadas. Las ediciones recientes promedian entre 2,5 y 2,7 goles.",
      },
      {
        q: "¿Cuántas selecciones jugarán el Mundial de 2026?",
        a: "Serán 48 selecciones, frente a las 32 de las ediciones entre 1998 y 2022 y las 13 de la primera edición en 1930.",
      },
    ],
  },

  "momentos-iconicos": {
    lead: "La historia del Mundial está hecha de instantes que trascienden el resultado. El silencio del Maracaná en 1950, la doble cara de Maradona en 1986, el gol de Iniesta que coronó a España en 2010. Estos momentos icónicos definieron épocas, marcaron a generaciones de aficionados y siguen siendo referencia obligada cuando se habla del torneo más importante del fútbol.",
    sections: [
      {
        h: "El Maracanazo de 1950",
        body: [
          "El 16 de julio de 1950, Uruguay venció 2-1 a Brasil en el Maracaná ante cerca de 200.000 espectadores que daban por hecho el título local. Los goles de Juan Alberto Schiaffino y Alcides Ghiggia silenciaron el estadio más grande del mundo y dieron a Uruguay su segunda Copa. El capitán Obdulio Varela lideró aquella remontada que pasó a la historia como el Maracanazo, sinónimo de tragedia deportiva en Brasil.",
        ],
      },
      {
        h: "Maradona en 1986: la Mano de Dios y el Gol del Siglo",
        body: [
          "En el partido de cuartos ante Inglaterra, en México 1986, Diego Maradona firmó en apenas cuatro minutos las dos jugadas más comentadas del fútbol. Primero, un gol con la mano que el árbitro convalidó y que él bautizó como la Mano de Dios. Luego, una carrera de más de sesenta metros sorteando a media defensa inglesa, elegida más tarde como el Gol del Siglo. Argentina ganó 2-1 y acabaría levantando el título.",
        ],
      },
      {
        h: "España campeona en 2010",
        body: [
          "En Sudáfrica 2010, España conquistó su primer Mundial con un gol de Andrés Iniesta en el minuto 116 de la final ante Países Bajos, que terminó 1-0 en la prórroga. Aquella selección, dirigida por Vicente del Bosque y apoyada en el tiqui-taca de Xavi e Iniesta, encadenó el triunfo con sus títulos europeos de 2008 y 2012, conformando una de las dinastías más recordadas del fútbol moderno.",
        ],
      },
    ],
    faq: [
      {
        q: "¿Qué fue el Maracanazo?",
        a: "La victoria de Uruguay por 2-1 sobre Brasil en la definición del Mundial de 1950, disputada en el estadio Maracaná de Río de Janeiro ante unos 200.000 espectadores.",
      },
      {
        q: "¿Qué dos goles marcó Maradona contra Inglaterra en 1986?",
        a: "La Mano de Dios, anotado con la mano, y el Gol del Siglo, una jugada individual de más de sesenta metros. Ambos en el mismo partido de cuartos de final.",
      },
      {
        q: "¿Quién marcó el gol que dio el Mundial a España en 2010?",
        a: "Andrés Iniesta, en el minuto 116 de la final ante Países Bajos, para un triunfo de 1-0 en la prórroga.",
      },
    ],
  },

  selecciones: {
    lead: "Pocas selecciones han alcanzado la categoría de leyenda. El Brasil de 1970 con Pelé, la Alemania de la regularidad eterna, la Italia ganadora con orden y oficio, la Argentina de Maradona y Messi. Perfilar a estas campeonas permite entender no solo cómo ganaron, sino qué estilo aportaron al fútbol mundial y por qué siguen siendo modelo de referencia décadas después.",
    sections: [
      {
        h: "Brasil 1970, la cumbre del fútbol ofensivo",
        body: [
          "El Brasil que ganó México 1970 es considerado por muchos el mejor equipo de la historia. Con Pelé, Tostão, Jairzinho, Gérson, Rivelino y el capitán Carlos Alberto, ganó los seis partidos del torneo y selló el título con un 4-1 a Italia en la final, coronado por un gol colectivo de Carlos Alberto. Aquel tercer título permitió a Brasil quedarse en propiedad con la Copa Jules Rimet.",
        ],
      },
      {
        h: "Alemania e Italia, dos modelos de constancia",
        body: [
          "Alemania, con cuatro títulos (1954, 1974, 1990 y 2014), es la selección más regular del torneo, finalista en numerosas ocasiones y siempre competitiva. Italia, también con cuatro coronas (1934, 1938, 1982 y 2006), construyó su prestigio sobre la solidez defensiva y la jerarquía táctica, con figuras como Paolo Rossi en 1982 o Fabio Cannavaro en 2006. Ambas representan la idea de que la continuidad pesa tanto como el talento puntual.",
        ],
      },
      {
        h: "Argentina, de Maradona a Messi",
        body: [
          "Argentina obtuvo su primer título en casa en 1978 y el segundo en 1986, de la mano de un Diego Maradona en estado de gracia. La tercera estrella llegó en Catar 2022, cuando Lionel Messi guió al equipo a vencer a Francia en una final que terminó 3-3 y se definió por penales. Esa victoria cerró un círculo que unió a las dos máximas figuras de la historia argentina.",
        ],
      },
    ],
    faq: [
      {
        q: "¿Por qué se considera al Brasil de 1970 el mejor equipo de la historia?",
        a: "Por su fútbol ofensivo, su plantilla de estrellas como Pelé y Carlos Alberto, y por haber ganado los seis partidos del Mundial de México 1970, sellándolo con un 4-1 a Italia.",
      },
      {
        q: "¿Cuántos Mundiales han ganado Alemania e Italia?",
        a: "Ambas tienen cuatro títulos. Alemania los ganó en 1954, 1974, 1990 y 2014; Italia en 1934, 1938, 1982 y 2006.",
      },
      {
        q: "¿Cuándo ganó Argentina sus Mundiales?",
        a: "En 1978 como anfitriona, en 1986 con Maradona y en 2022 con Messi, esta última al vencer a Francia por penales tras un 3-3.",
      },
    ],
  },
};
