export interface IconicMoment {
  id: string;
  year: number;
  flag: string;
  country: string;
  color: string;
  title: string;
  subtitle: string;
  description: string;
  details: string[];
  protagonists: string[];
  score?: string;
  venue?: string;
  date?: string;
}

export const MOMENTS_ES: IconicMoment[] = [
  {
    id: "uruguay-1930",
    year: 1930,
    flag: "uy",
    country: "Uruguay",
    color: "#C9A84C",
    title: "Uruguay 1930 — El inicio de todo",
    subtitle: "La primera Copa del Mundo de la historia",
    description: "En julio de 1930, trece selecciones se reunieron en Montevideo para disputar el primer Campeonato Mundial de Fútbol. Uruguay, país anfitrión y bicampeón olímpico, venció a Argentina 4-2 en la final del Estadio Centenario, inaugurado expresamente para el torneo.",
    details: [
      "Solo 13 equipos participaron — muchos europeos no viajaron por la distancia",
      "El Estadio Centenario se construyó en solo 8 meses para el evento",
      "Argentina iba ganando 2-1 al descanso, pero Uruguay remontó con 3 goles en el segundo tiempo",
      "Guillermo Stábile fue el máximo goleador con 8 goles",
      "No existía la clasificación: los equipos fueron invitados por la FIFA"
    ],
    protagonists: ["José Nasazzi (capitán)", "Héctor Castro", "Pedro Cea", "Guillermo Stábile"],
    score: "Uruguay 4 - 2 Argentina",
    venue: "Estadio Centenario, Montevideo",
    date: "30 de julio de 1930"
  },
  {
    id: "maracanazo",
    year: 1950,
    flag: "uy",
    country: "Uruguay",
    color: "#22C55E",
    title: "El Maracanazo",
    subtitle: "La mayor sorpresa de la historia del fútbol",
    description: "Brasil necesitaba solo un empate en el último partido de la fase final para ser campeón. Ante casi 200.000 personas en el Maracaná, Uruguay logró una remontada épica ganando 2-1 y silenciando al estadio más grande del mundo en lo que se conoce como 'El Maracanazo'.",
    details: [
      "Brasil había goleado a Suecia 7-1 y a España 6-1 en la fase final",
      "Friaça abrió el marcador para Brasil en el minuto 47",
      "Juan Alberto Schiaffino empató en el minuto 66",
      "Alcides Ghiggia anotó el gol de la victoria en el minuto 79",
      "El portero brasileño Moacyr Barbosa fue culpado injustamente de por vida",
      "Jules Rimet dijo: 'Fue el silencio más ensordecedor que jamás escuché'"
    ],
    protagonists: ["Alcides Ghiggia", "Juan Alberto Schiaffino", "Obdulio Varela", "Moacyr Barbosa"],
    score: "Uruguay 2 - 1 Brasil",
    venue: "Maracaná, Río de Janeiro",
    date: "16 de julio de 1950"
  },
  {
    id: "pickles-1966",
    year: 1966,
    flag: "gb-eng",
    country: "Inglaterra",
    color: "#ef4444",
    title: "La tumba de Pickles",
    subtitle: "El trofeo robado y encontrado por un perro",
    description: "Cuatro meses antes del Mundial de Inglaterra 1966, el trofeo Jules Rimet fue robado de una exposición pública en Londres. Mientras Scotland Yard lo buscaba desesperadamente, un perro llamado Pickles lo encontró envuelto en periódico bajo un seto en un jardín.",
    details: [
      "El trofeo estaba en exhibición en el Westminster Central Hall cuando fue robado",
      "Pickles, un collie, encontró el trofeo el 27 de marzo de 1966 durante un paseo",
      "Su dueño, David Corbett, recibió una recompensa de £6.000",
      "Pickles se convirtió en una celebridad nacional y participó en películas",
      "Inglaterra ganó ese Mundial con el famoso 'gol fantasma' de Geoff Hurst en la final",
      "Hurst sigue siendo el único jugador en anotar un hat-trick en una final mundialista"
    ],
    protagonists: ["Pickles (el perro)", "Geoff Hurst", "Bobby Moore", "Bobby Charlton"],
    score: "Inglaterra 4 - 2 Alemania (prórroga)",
    venue: "Wembley, Londres",
    date: "30 de julio de 1966"
  },
  {
    id: "brasil-1970",
    year: 1970,
    flag: "br",
    country: "Brasil",
    color: "#FACC15",
    title: "Brasil de Pelé — El equipo perfecto",
    subtitle: "Considerado el mejor equipo de la historia del fútbol",
    description: "El Brasil de 1970 es considerado por unanimidad como el mejor equipo de todos los tiempos. Con Pelé, Jairzinho, Tostão, Gérson y Rivelino, el equipo ganó todos sus partidos y aplastó a Italia 4-1 en la final de México, llevándose el trofeo Jules Rimet de forma definitiva.",
    details: [
      "Ganaron los 6 partidos del torneo, anotando 19 goles y recibiendo solo 7",
      "Jairzinho anotó en todos y cada uno de los partidos del torneo — récord único",
      "El gol de Carlos Alberto Torres en la final es considerado el gol más bello en historia de Mundiales",
      "Fue el primer Mundial transmitido a color por televisión",
      "Al ganar su tercer título, Brasil se quedó con el trofeo Jules Rimet original para siempre",
      "El 'jogo bonito' alcanzó su máxima expresión en este equipo"
    ],
    protagonists: ["Pelé", "Jairzinho", "Carlos Alberto Torres", "Gérson", "Tostão", "Rivelino"],
    score: "Brasil 4 - 1 Italia",
    venue: "Estadio Azteca, Ciudad de México",
    date: "21 de junio de 1970"
  },
  {
    id: "mano-de-dios",
    year: 1986,
    flag: "ar",
    country: "Argentina",
    color: "#38BDF8",
    title: "La mano de Dios",
    subtitle: "El gol más polémico y el más bello en un mismo partido",
    description: "En los cuartos de final de México 1986, Diego Maradona anotó dos goles que quedarían grabados para siempre. El primero con la mano ('La Mano de Dios') y el segundo tras una carrera de 60 metros driblando a medio equipo inglés, considerado el 'Gol del Siglo'.",
    details: [
      "El primer gol fue con la mano izquierda, pero el árbitro tunecino Ali Bin Nasser no lo vio",
      "Maradona dijo: 'Fue un poco con la cabeza de Maradona y un poco con la mano de Dios'",
      "El segundo gol recorrió 60 metros en 10 segundos, driblando a 6 jugadores ingleses",
      "Fue votado como el 'Gol del Siglo' por la FIFA en 2002",
      "El partido se jugó con la tensión de la Guerra de las Malvinas (1982) de fondo",
      "Argentina ganó el Mundial derrotando a Alemania 3-2 en la final"
    ],
    protagonists: ["Diego Maradona", "Jorge Valdano", "Jorge Burruchaga", "Peter Shilton"],
    score: "Argentina 2 - 1 Inglaterra (cuartos de final)",
    venue: "Estadio Azteca, Ciudad de México",
    date: "22 de junio de 1986"
  },
  {
    id: "zidane-1998",
    year: 1998,
    flag: "fr",
    country: "Francia",
    color: "#3b82f6",
    title: "Zidane y los dos cabezazos",
    subtitle: "Francia conquista su primera Copa del Mundo",
    description: "En la final del Mundial de Francia 1998, Zinédine Zidane marcó dos goles de cabeza ante Brasil, llevando a la selección anfitriona a su primer título mundial. El Stade de France explotó de alegría y más de un millón de personas celebraron en los Campos Elíseos.",
    details: [
      "Zidane anotó los dos goles de cabeza en la primera mitad (minutos 27 y 45+1)",
      "Emmanuel Petit cerró el marcador con el 3-0 en el minuto 90+3",
      "Ronaldo, estrella de Brasil, sufrió un misterioso episodio convulsivo horas antes del partido",
      "Francia ganó con una selección multicultural que simbolizó la unión del país",
      "Fue el primer Mundial con 32 equipos participantes",
      "Los Campos Elíseos reunieron a más de 1 millón de personas en la celebración"
    ],
    protagonists: ["Zinédine Zidane", "Emmanuel Petit", "Fabien Barthez", "Ronaldo"],
    score: "Francia 3 - 0 Brasil",
    venue: "Stade de France, Saint-Denis",
    date: "12 de julio de 1998"
  },
  {
    id: "ronaldo-2002",
    year: 2002,
    flag: "br",
    country: "Brasil",
    color: "#22C55E",
    title: "Ronaldo renace",
    subtitle: "El Fenómeno lidera a Brasil a su quinta estrella",
    description: "Después de una lesión devastadora que casi acaba con su carrera, Ronaldo Nazário regresó en el Mundial de Corea-Japón 2002 para ser el máximo goleador con 8 goles, incluyendo los 2 de la final contra Alemania. La redención del Fenómeno.",
    details: [
      "Ronaldo no había jugado un partido completo en meses antes del torneo",
      "Anotó 8 goles en el torneo, incluyendo un doblete en la final",
      "Su icónico corte de pelo con flequillo frontal se volvió un fenómeno cultural",
      "Brasil ganó todos sus 7 partidos en el torneo",
      "Fue el primer Mundial organizado en dos países simultáneamente (Corea y Japón)",
      "Rivaldo, Ronaldinho y Ronaldo formaron el tridente más letal del torneo"
    ],
    protagonists: ["Ronaldo Nazário", "Rivaldo", "Ronaldinho", "Cafu", "Oliver Kahn"],
    score: "Brasil 2 - 0 Alemania",
    venue: "International Stadium, Yokohama",
    date: "30 de junio de 2002"
  },
  {
    id: "espana-2010",
    year: 2010,
    flag: "es",
    country: "España",
    color: "#C9A84C",
    title: "España campeona — La Roja conquista el mundo",
    subtitle: "El gol de Iniesta en la prórroga da la primera Copa a España",
    description: "Tras décadas de frustraciones, España ganó su primera Copa del Mundo en Sudáfrica 2010 con el gol de Andrés Iniesta en la prórroga de la final contra Países Bajos. El tiki-taka español revolucionó el fútbol mundial y demostró que el juego bonito puede ganar títulos.",
    details: [
      "España perdió su primer partido del torneo 0-1 ante Suiza",
      "Ganaron los siguientes 6 partidos seguidos, 4 de ellos por 1-0",
      "Iniesta marcó el gol de la victoria en el minuto 116 de la final",
      "Iniesta dedicó el gol a Dani Jarque, fallecido un año antes, revelando una camiseta homenaje",
      "La final fue una de las más duras de la historia, con 14 tarjetas amarillas y 1 roja",
      "El tiki-taka de España cambió la forma de entender el fútbol en todo el mundo"
    ],
    protagonists: ["Andrés Iniesta", "Xavi Hernández", "David Villa", "Iker Casillas", "Carles Puyol"],
    score: "España 1 - 0 Países Bajos (prórroga)",
    venue: "Soccer City, Johannesburgo",
    date: "11 de julio de 2010"
  },
  {
    id: "mineirazo",
    year: 2014,
    flag: "de",
    country: "Alemania",
    color: "#a855f7",
    title: "El Mineirazo — 7-1",
    subtitle: "Alemania aplasta a Brasil en semifinales en su propia casa",
    description: "El 8 de julio de 2014, en el Estadio Mineirao de Belo Horizonte, Alemania humilló a Brasil con un devastador 7-1 en semifinales. Cinco goles en los primeros 29 minutos dejaron al mundo en shock y a todo un país llorando. Es considerado el resultado más impactante de la historia.",
    details: [
      "Alemania marcó 4 goles en solo 6 minutos (entre el minuto 23 y el 29)",
      "Toni Kroos anotó 2 goles en menos de 2 minutos",
      "Brasil jugaba sin Neymar (lesionado) ni Thiago Silva (suspendido)",
      "Al medio tiempo el marcador ya era 5-0",
      "Oscar marcó el gol del honor para Brasil en el minuto 90",
      "Las imágenes de aficionados brasileños llorando dieron la vuelta al mundo",
      "Alemania continuó para ganar la final 1-0 contra Argentina con gol de Götze"
    ],
    protagonists: ["Toni Kroos", "Thomas Müller", "Miroslav Klose", "André Schürrle", "David Luiz"],
    score: "Brasil 1 - 7 Alemania",
    venue: "Estadio Mineirao, Belo Horizonte",
    date: "8 de julio de 2014"
  },
  {
    id: "messi-2022",
    year: 2022,
    flag: "ar",
    country: "Argentina",
    color: "#60A5FA",
    title: "Messi se consagra",
    subtitle: "La mejor final de la historia corona al mejor jugador",
    description: "La final de Qatar 2022 entre Argentina y Francia es considerada la mejor final de la historia de los Mundiales. Messi abrió el marcador de penal, Di María amplió, pero Mbappé anotó dos goles en 97 segundos para forzar la prórroga. Messi volvió a marcar, Mbappé empató de nuevo con un hat-trick, y Argentina ganó en penales. Messi, a los 35 años, levantó la Copa del Mundo.",
    details: [
      "Argentina dominó la primera parte con un 2-0 (goles de Messi y Di María)",
      "Mbappé marcó 2 goles en 97 segundos (minutos 80 y 81) para empatar 2-2",
      "En la prórroga, Messi marcó el 3-2 pero Mbappé empató de penal (3-3)",
      "Mbappé logró un hat-trick en una final mundialista — solo Hurst lo había logrado antes",
      "Emiliano 'Dibu' Martínez fue clave en la tanda de penales, atajando un disparo",
      "Argentina ganó 4-2 en penales — Gonzalo Montiel anotó el definitivo",
      "Messi levantó la bisht (capa árabe) antes de alzar el trofeo en una imagen icónica"
    ],
    protagonists: ["Lionel Messi", "Kylian Mbappé", "Ángel Di María", "Emiliano Martínez", "Gonzalo Montiel"],
    score: "Argentina 3 - 3 Francia (penales 4-2)",
    venue: "Estadio Lusail, Lusail",
    date: "18 de diciembre de 2022"
  },
];

export const MOMENTS_EN: IconicMoment[] = [
  {
    id: "uruguay-1930",
    year: 1930,
    flag: "uy",
    country: "Uruguay",
    color: "#C9A84C",
    title: "Uruguay 1930 — Where it all began",
    subtitle: "The very first World Cup in history",
    description: "In July 1930, thirteen national teams gathered in Montevideo to play the first FIFA World Cup. Uruguay, the host nation and two-time Olympic champion, defeated Argentina 4-2 in the final at the Estadio Centenario, a stadium built specifically for the tournament.",
    details: [
      "Only 13 teams participated — many European nations declined due to the long journey",
      "The Estadio Centenario was built in just 8 months for the event",
      "Argentina led 2-1 at halftime, but Uruguay scored 3 second-half goals to win",
      "Guillermo Stábile was the top scorer with 8 goals",
      "There was no qualification process — teams were invited by FIFA"
    ],
    protagonists: ["José Nasazzi (captain)", "Héctor Castro", "Pedro Cea", "Guillermo Stábile"],
    score: "Uruguay 4 - 2 Argentina",
    venue: "Estadio Centenario, Montevideo",
    date: "July 30, 1930"
  },
  {
    id: "maracanazo",
    year: 1950,
    flag: "uy",
    country: "Uruguay",
    color: "#22C55E",
    title: "The Maracanazo",
    subtitle: "The greatest upset in football history",
    description: "Brazil only needed a draw in the final round-robin match to become champions. In front of nearly 200,000 people at the Maracanã, Uruguay pulled off an epic comeback winning 2-1, silencing the world's largest stadium in what became known as 'The Maracanazo'.",
    details: [
      "Brazil had thrashed Sweden 7-1 and Spain 6-1 in the final round",
      "Friaça opened the scoring for Brazil in the 47th minute",
      "Juan Alberto Schiaffino equalized in the 66th minute",
      "Alcides Ghiggia scored the winner in the 79th minute",
      "Brazilian goalkeeper Moacyr Barbosa was unfairly blamed for the rest of his life",
      "Jules Rimet said: 'It was the most deafening silence I've ever heard'"
    ],
    protagonists: ["Alcides Ghiggia", "Juan Alberto Schiaffino", "Obdulio Varela", "Moacyr Barbosa"],
    score: "Uruguay 2 - 1 Brazil",
    venue: "Maracanã, Rio de Janeiro",
    date: "July 16, 1950"
  },
  {
    id: "pickles-1966",
    year: 1966,
    flag: "gb-eng",
    country: "England",
    color: "#ef4444",
    title: "Pickles saves the day",
    subtitle: "The stolen trophy found by a dog",
    description: "Four months before the 1966 World Cup in England, the Jules Rimet trophy was stolen from a public exhibition in London. While Scotland Yard searched desperately, a dog named Pickles found it wrapped in newspaper under a hedge in a garden.",
    details: [
      "The trophy was on display at the Westminster Central Hall when it was stolen",
      "Pickles, a collie, found the trophy on March 27, 1966, during a walk",
      "His owner, David Corbett, received a £6,000 reward",
      "Pickles became a national celebrity and appeared in films",
      "England won that World Cup with Geoff Hurst's famous 'ghost goal' in the final",
      "Hurst remains the only player to score a hat-trick in a World Cup final"
    ],
    protagonists: ["Pickles (the dog)", "Geoff Hurst", "Bobby Moore", "Bobby Charlton"],
    score: "England 4 - 2 West Germany (extra time)",
    venue: "Wembley, London",
    date: "July 30, 1966"
  },
  {
    id: "brasil-1970",
    year: 1970,
    flag: "br",
    country: "Brazil",
    color: "#FACC15",
    title: "Pelé's Brazil — The perfect team",
    subtitle: "Widely considered the greatest football team of all time",
    description: "The 1970 Brazil team is unanimously regarded as the greatest ever. With Pelé, Jairzinho, Tostão, Gérson, and Rivelino, the team won every match and crushed Italy 4-1 in the final in Mexico, winning the Jules Rimet trophy permanently.",
    details: [
      "They won all 6 matches, scoring 19 goals and conceding only 7",
      "Jairzinho scored in every single match of the tournament — a unique record",
      "Carlos Alberto Torres' final goal is considered the most beautiful World Cup goal ever",
      "It was the first World Cup broadcast in color television",
      "By winning their third title, Brazil kept the original Jules Rimet trophy forever",
      "The 'jogo bonito' (beautiful game) reached its ultimate expression"
    ],
    protagonists: ["Pelé", "Jairzinho", "Carlos Alberto Torres", "Gérson", "Tostão", "Rivelino"],
    score: "Brazil 4 - 1 Italy",
    venue: "Estadio Azteca, Mexico City",
    date: "June 21, 1970"
  },
  {
    id: "hand-of-god",
    year: 1986,
    flag: "ar",
    country: "Argentina",
    color: "#38BDF8",
    title: "The Hand of God",
    subtitle: "The most controversial and most beautiful goals in one match",
    description: "In the 1986 quarter-finals, Diego Maradona scored two goals that would be forever etched in history. The first with his hand ('The Hand of God') and the second after a 60-meter run dribbling past half the English team, known as the 'Goal of the Century'.",
    details: [
      "The first goal was scored with his left hand, but referee Ali Bin Nasser didn't see it",
      "Maradona said: 'It was partly the head of Maradona and partly the hand of God'",
      "The second goal covered 60 meters in 10 seconds, dribbling past 6 English players",
      "It was voted 'Goal of the Century' by FIFA in 2002",
      "The match was played with the tension of the Falklands War (1982) in the background",
      "Argentina went on to win the World Cup, defeating West Germany 3-2 in the final"
    ],
    protagonists: ["Diego Maradona", "Jorge Valdano", "Jorge Burruchaga", "Peter Shilton"],
    score: "Argentina 2 - 1 England (quarter-final)",
    venue: "Estadio Azteca, Mexico City",
    date: "June 22, 1986"
  },
  {
    id: "zidane-1998",
    year: 1998,
    flag: "fr",
    country: "France",
    color: "#3b82f6",
    title: "Zidane's two headers",
    subtitle: "France conquers their first World Cup",
    description: "In the 1998 World Cup final, Zinédine Zidane scored two headed goals against Brazil, leading the host nation to their first ever world title. The Stade de France erupted and over a million people celebrated on the Champs-Élysées.",
    details: [
      "Zidane scored both headers in the first half (minutes 27 and 45+1)",
      "Emmanuel Petit sealed the victory with the 3-0 in the 90+3 minute",
      "Ronaldo, Brazil's star, suffered a mysterious seizure hours before the match",
      "France won with a multicultural squad that symbolized the unity of the country",
      "It was the first World Cup with 32 participating teams",
      "The Champs-Élysées gathered over 1 million people in celebration"
    ],
    protagonists: ["Zinédine Zidane", "Emmanuel Petit", "Fabien Barthez", "Ronaldo"],
    score: "France 3 - 0 Brazil",
    venue: "Stade de France, Saint-Denis",
    date: "July 12, 1998"
  },
  {
    id: "ronaldo-2002",
    year: 2002,
    flag: "br",
    country: "Brazil",
    color: "#22C55E",
    title: "Ronaldo's Redemption",
    subtitle: "The Phenomenon leads Brazil to their fifth star",
    description: "After a devastating injury that nearly ended his career, Ronaldo Nazário returned at the 2002 World Cup in Korea-Japan to become the top scorer with 8 goals, including 2 in the final against Germany. The Phenomenon's ultimate redemption.",
    details: [
      "Ronaldo hadn't played a full match in months before the tournament",
      "He scored 8 goals in the tournament, including a brace in the final",
      "His iconic half-shaved haircut became a cultural phenomenon",
      "Brazil won all 7 of their matches in the tournament",
      "It was the first World Cup held in two countries simultaneously (Korea and Japan)",
      "Rivaldo, Ronaldinho, and Ronaldo formed the tournament's most lethal attack"
    ],
    protagonists: ["Ronaldo Nazário", "Rivaldo", "Ronaldinho", "Cafu", "Oliver Kahn"],
    score: "Brazil 2 - 0 Germany",
    venue: "International Stadium, Yokohama",
    date: "June 30, 2002"
  },
  {
    id: "spain-2010",
    year: 2010,
    flag: "es",
    country: "Spain",
    color: "#C9A84C",
    title: "Spain champions — La Roja conquers the world",
    subtitle: "Iniesta's extra-time goal gives Spain their first World Cup",
    description: "After decades of frustration, Spain won their first World Cup in South Africa 2010 with Andrés Iniesta's extra-time goal in the final against the Netherlands. Spain's tiki-taka revolutionized world football and proved the beautiful game can win titles.",
    details: [
      "Spain lost their opening match 0-1 to Switzerland",
      "They won the next 6 matches in a row, 4 of them by 1-0",
      "Iniesta scored the winning goal in the 116th minute of the final",
      "Iniesta dedicated the goal to Dani Jarque, who had died a year earlier, revealing a tribute shirt",
      "The final was one of the roughest ever, with 14 yellow cards and 1 red",
      "Spain's tiki-taka changed how football was understood worldwide"
    ],
    protagonists: ["Andrés Iniesta", "Xavi Hernández", "David Villa", "Iker Casillas", "Carles Puyol"],
    score: "Spain 1 - 0 Netherlands (extra time)",
    venue: "Soccer City, Johannesburg",
    date: "July 11, 2010"
  },
  {
    id: "mineirazo",
    year: 2014,
    flag: "de",
    country: "Germany",
    color: "#a855f7",
    title: "The Mineirazo — 7-1",
    subtitle: "Germany demolishes Brazil in their own backyard",
    description: "On July 8, 2014, at the Estádio Mineirão in Belo Horizonte, Germany humiliated Brazil with a devastating 7-1 in the semifinals. Five goals in the first 29 minutes left the world in shock and an entire country in tears. It is considered the most shocking result in football history.",
    details: [
      "Germany scored 4 goals in just 6 minutes (between minutes 23 and 29)",
      "Toni Kroos scored 2 goals in under 2 minutes",
      "Brazil were missing Neymar (injured) and Thiago Silva (suspended)",
      "The score was already 5-0 at halftime",
      "Oscar scored a consolation goal for Brazil in the 90th minute",
      "Images of crying Brazilian fans went viral worldwide",
      "Germany went on to win the final 1-0 against Argentina with Götze's goal"
    ],
    protagonists: ["Toni Kroos", "Thomas Müller", "Miroslav Klose", "André Schürrle", "David Luiz"],
    score: "Brazil 1 - 7 Germany",
    venue: "Estádio Mineirão, Belo Horizonte",
    date: "July 8, 2014"
  },
  {
    id: "messi-2022",
    year: 2022,
    flag: "ar",
    country: "Argentina",
    color: "#60A5FA",
    title: "Messi is crowned",
    subtitle: "The greatest final in history crowns the greatest player",
    description: "The 2022 Qatar final between Argentina and France is considered the greatest World Cup final ever. Messi opened the scoring from the spot, Di María extended, but Mbappé scored twice in 97 seconds to force extra time. Messi scored again, Mbappé equalized again for his hat-trick, and Argentina won on penalties. Messi, at 35, finally lifted the World Cup.",
    details: [
      "Argentina dominated the first half with a 2-0 lead (goals from Messi and Di María)",
      "Mbappé scored 2 goals in 97 seconds (minutes 80 and 81) to make it 2-2",
      "In extra time, Messi scored to make it 3-2 but Mbappé equalized from the spot (3-3)",
      "Mbappé scored a hat-trick in a World Cup final — only Hurst had done it before",
      "Emiliano 'Dibu' Martínez was key in the shootout, saving one penalty",
      "Argentina won 4-2 on penalties — Gonzalo Montiel scored the decisive kick",
      "Messi wore the bisht (Arab robe) before lifting the trophy in an iconic image"
    ],
    protagonists: ["Lionel Messi", "Kylian Mbappé", "Ángel Di María", "Emiliano Martínez", "Gonzalo Montiel"],
    score: "Argentina 3 - 3 France (penalties 4-2)",
    venue: "Lusail Stadium, Lusail",
    date: "December 18, 2022"
  },
];

export function getMomentBySlug(slug: string, isEN: boolean): IconicMoment | undefined {
  const moments = isEN ? MOMENTS_EN : MOMENTS_ES;
  return moments.find((m) => m.id === slug);
}

export function getAllMomentSlugs(): string[] {
  return MOMENTS_ES.map((m) => m.id);
}
