export interface WorldCupDetail {
  year: number;
  host: string;
  champion: string;
  runnerUp: string;
  teams: number;
  hostFlag: string;
  champFlag: string;
  ruFlag: string;
  finalScore: string;
  topScorer: string;
  anecdoteES: string;
  anecdoteEN: string;
}

export const WORLD_CUP_DETAILS: WorldCupDetail[] = [
  {
    year: 1930, host: "Uruguay", champion: "Uruguay", runnerUp: "Argentina", teams: 13,
    hostFlag: "uy", champFlag: "uy", ruFlag: "ar",
    finalScore: "4-2",
    topScorer: "Guillermo Stábile (8)",
    anecdoteES: "La primera Copa del Mundo se jugó con solo 13 equipos. Uruguay, como anfitrión, no participó en las eliminatorias y ganó el título en el Estadio Centenario.",
    anecdoteEN: "The first World Cup had only 13 teams. Uruguay, as host, did not play qualifiers and won the title at the Estadio Centenario."
  },
  {
    year: 1934, host: "Italia", champion: "Italia", runnerUp: "Checoslovaquia", teams: 16,
    hostFlag: "it", champFlag: "it", ruFlag: "cz",
    finalScore: "2-1 (prórroga)",
    topScorer: "Oldřich Nejedlý (5)",
    anecdoteES: "Italia ganó en casa en la era de Mussolini, con Schiavio anotando el gol del título en tiempo extra.",
    anecdoteEN: "Italy won at home during the Mussolini era, with Schiavio scoring the title-winning goal in extra time."
  },
  {
    year: 1938, host: "Francia", champion: "Italia", runnerUp: "Hungría", teams: 15,
    hostFlag: "fr", champFlag: "it", ruFlag: "hu",
    finalScore: "4-2",
    topScorer: "Leônidas (7)",
    anecdoteES: "Italia se convirtió en el primer bicampeón, ganando en suelo francés poco antes del estallido de la Segunda Guerra Mundial.",
    anecdoteEN: "Italy became the first back-to-back champion, winning on French soil shortly before the outbreak of World War II."
  },
  {
    year: 1950, host: "Brasil", champion: "Uruguay", runnerUp: "Brasil", teams: 13,
    hostFlag: "br", champFlag: "uy", ruFlag: "br",
    finalScore: "2-1",
    topScorer: "Ademir (8)",
    anecdoteES: "El Maracanazo: Uruguay silenció a 200.000 brasileños en el Maracaná con un gol de Ghiggia. Brasil solo necesitaba el empate.",
    anecdoteEN: "The Maracanazo: Uruguay silenced 200,000 Brazilians at the Maracanã with a goal from Ghiggia. Brazil only needed a draw."
  },
  {
    year: 1954, host: "Suiza", champion: "Alemania", runnerUp: "Hungría", teams: 16,
    hostFlag: "ch", champFlag: "de", ruFlag: "hu",
    finalScore: "3-2",
    topScorer: "Sándor Kocsis (11)",
    anecdoteES: "El Milagro de Berna: Alemania remontó dos goles ante la imparable Hungría de Puskás para ganar su primer título.",
    anecdoteEN: "The Miracle of Bern: Germany came back from two goals down against Puskás' unstoppable Hungary to win their first title."
  },
  {
    year: 1958, host: "Suecia", champion: "Brasil", runnerUp: "Suecia", teams: 16,
    hostFlag: "se", champFlag: "br", ruFlag: "se",
    finalScore: "5-2",
    topScorer: "Just Fontaine (13)",
    anecdoteES: "Pelé, con apenas 17 años, anunció al mundo su grandeza y Brasil conquistó su primer Mundial en Europa.",
    anecdoteEN: "Pelé, just 17 years old, announced his greatness to the world and Brazil won their first World Cup in Europe."
  },
  {
    year: 1962, host: "Chile", champion: "Brasil", runnerUp: "Checoslovaquia", teams: 16,
    hostFlag: "cl", champFlag: "br", ruFlag: "cz",
    finalScore: "3-1",
    topScorer: "Garrincha, Vavá, etc. (4)",
    anecdoteES: "Brasil se consagró bicampeón sin Pelé lesionado, liderados por el genio de Garrincha en los campos chilenos.",
    anecdoteEN: "Brazil became back-to-back champions without the injured Pelé, led by Garrincha's genius on Chilean soil."
  },
  {
    year: 1966, host: "Inglaterra", champion: "Inglaterra", runnerUp: "Alemania", teams: 16,
    hostFlag: "gb-eng", champFlag: "gb-eng", ruFlag: "de",
    finalScore: "4-2 (prórroga)",
    topScorer: "Eusébio (9)",
    anecdoteES: "Inglaterra ganó en casa con el polémico 'gol fantasma' de Hurst en la final de Wembley, el único hat-trick en una final hasta 2022.",
    anecdoteEN: "England won at home with Hurst's controversial 'ghost goal' in the Wembley final, the only World Cup final hat-trick until 2022."
  },
  {
    year: 1970, host: "México", champion: "Brasil", runnerUp: "Italia", teams: 16,
    hostFlag: "mx", champFlag: "br", ruFlag: "it",
    finalScore: "4-1",
    topScorer: "Gerd Müller (10)",
    anecdoteES: "Considerado el mejor equipo de la historia: Brasil 1970 con Pelé, Jairzinho, Tostão, Rivelino y Carlos Alberto.",
    anecdoteEN: "Considered the greatest team ever: Brazil 1970 with Pelé, Jairzinho, Tostão, Rivelino, and Carlos Alberto."
  },
  {
    year: 1974, host: "Alemania", champion: "Alemania", runnerUp: "Países Bajos", teams: 16,
    hostFlag: "de", champFlag: "de", ruFlag: "nl",
    finalScore: "2-1",
    topScorer: "Grzegorz Lato (7)",
    anecdoteES: "Países Bajos enamoró al mundo con el 'fútbol total' de Cruyff, pero Alemania se llevó el título en casa.",
    anecdoteEN: "The Netherlands captured the world with Cruyff's 'Total Football', but Germany lifted the trophy at home."
  },
  {
    year: 1978, host: "Argentina", champion: "Argentina", runnerUp: "Países Bajos", teams: 16,
    hostFlag: "ar", champFlag: "ar", ruFlag: "nl",
    finalScore: "3-1 (prórroga)",
    topScorer: "Mario Kempes (6)",
    anecdoteES: "Argentina ganó su primer título en casa con dos goles de Kempes en la prórroga, en medio de un contexto político turbulento.",
    anecdoteEN: "Argentina won their first title at home with two extra-time goals from Kempes, amid a turbulent political context."
  },
  {
    year: 1982, host: "España", champion: "Italia", runnerUp: "Alemania", teams: 24,
    hostFlag: "es", champFlag: "it", ruFlag: "de",
    finalScore: "3-1",
    topScorer: "Paolo Rossi (6)",
    anecdoteES: "Italia de Bearzot, con el renacido Paolo Rossi, conquistó el título con el primer Mundial de 24 equipos.",
    anecdoteEN: "Bearzot's Italy, with the reborn Paolo Rossi, conquered the title in the first 24-team World Cup."
  },
  {
    year: 1986, host: "México", champion: "Argentina", runnerUp: "Alemania", teams: 24,
    hostFlag: "mx", champFlag: "ar", ruFlag: "de",
    finalScore: "3-2",
    topScorer: "Gary Lineker (6)",
    anecdoteES: "El Mundial de Maradona: la 'Mano de Dios' y el 'Gol del Siglo' contra Inglaterra en el Azteca.",
    anecdoteEN: "Maradona's World Cup: the 'Hand of God' and the 'Goal of the Century' against England at the Azteca."
  },
  {
    year: 1990, host: "Italia", champion: "Alemania", runnerUp: "Argentina", teams: 24,
    hostFlag: "it", champFlag: "de", ruFlag: "ar",
    finalScore: "1-0",
    topScorer: "Salvatore Schillaci (6)",
    anecdoteES: "Alemania se vengó de Argentina con un penal de Brehme en los últimos minutos de una final emotiva.",
    anecdoteEN: "Germany avenged their loss to Argentina with a Brehme penalty in the closing minutes of an emotional final."
  },
  {
    year: 1994, host: "Estados Unidos", champion: "Brasil", runnerUp: "Italia", teams: 24,
    hostFlag: "us", champFlag: "br", ruFlag: "it",
    finalScore: "0-0 (3-2 penaltis)",
    topScorer: "Oleg Salenko / Hristo Stoichkov (6)",
    anecdoteES: "Brasil ganó su cuarto título tras el erró de Baggio en los penaltis, en el Rose Bowl de Pasadena.",
    anecdoteEN: "Brazil won their fourth title after Baggio's missed penalty at the Rose Bowl in Pasadena."
  },
  {
    year: 1998, host: "Francia", champion: "Francia", runnerUp: "Brasil", teams: 32,
    hostFlag: "fr", champFlag: "fr", ruFlag: "br",
    finalScore: "3-0",
    topScorer: "Davor Šuker (6)",
    anecdoteES: "Francia, con dos cabezazos de Zidane, ganó su primer Mundial en casa ante un Brasil con Ronaldo enfermo.",
    anecdoteEN: "France, with two Zidane headers, won their first World Cup at home against a Brazil side with an ill Ronaldo."
  },
  {
    year: 2002, host: "Corea/Japón", champion: "Brasil", runnerUp: "Alemania", teams: 32,
    hostFlag: "kr", champFlag: "br", ruFlag: "de",
    finalScore: "2-0",
    topScorer: "Ronaldo (8)",
    anecdoteES: "Ronaldo se vengó de la final de 1998 con dos goles y Brasil se convirtió en pentacampeón en Asia.",
    anecdoteEN: "Ronaldo avenged the 1998 final with two goals and Brazil became five-time champions in Asia."
  },
  {
    year: 2006, host: "Alemania", champion: "Italia", runnerUp: "Francia", teams: 32,
    hostFlag: "de", champFlag: "it", ruFlag: "fr",
    finalScore: "1-1 (5-3 penaltis)",
    topScorer: "Miroslav Klose (5)",
    anecdoteES: "La final de la cabeza de Zidane: Italia ganó en penaltis tras el expulsado cabezazo de Zidane a Materazzi.",
    anecdoteEN: "The Zidane headbutt final: Italy won on penalties after Zidane's infamous headbutt on Materazzi."
  },
  {
    year: 2010, host: "Sudáfrica", champion: "España", runnerUp: "Países Bajos", teams: 32,
    hostFlag: "za", champFlag: "es", ruFlag: "nl",
    finalScore: "1-0 (prórroga)",
    topScorer: "Thomas Müller / Wesley Sneijder / David Villa / Diego Forlán (5)",
    anecdoteES: "El gol de Iniesta en la prórroga dio a España su primero y único título mundial, en el primer Mundial africano.",
    anecdoteEN: "Iniesta's extra-time goal gave Spain their first and only World Cup title, in the first African-hosted tournament."
  },
  {
    year: 2014, host: "Brasil", champion: "Alemania", runnerUp: "Argentina", teams: 32,
    hostFlag: "br", champFlag: "de", ruFlag: "ar",
    finalScore: "1-0 (prórroga)",
    topScorer: "James Rodríguez (6)",
    anecdoteES: "Alemania destrozó a Brasil 7-1 en casa y Mario Götze anotó el gol del título en el Maracaná.",
    anecdoteEN: "Germany destroyed Brazil 7-1 at home and Mario Götze scored the title-winning goal at the Maracanã."
  },
  {
    year: 2018, host: "Rusia", champion: "Francia", runnerUp: "Croacia", teams: 32,
    hostFlag: "ru", champFlag: "fr", ruFlag: "hr",
    finalScore: "4-2",
    topScorer: "Harry Kane (6)",
    anecdoteES: "Francia, liderada por Mbappé, ganó su segundo título en una final llena de goles contra Croacia.",
    anecdoteEN: "France, led by Mbappé, won their second title in a goal-filled final against Croatia."
  },
  {
    year: 2022, host: "Qatar", champion: "Argentina", runnerUp: "Francia", teams: 32,
    hostFlag: "qa", champFlag: "ar", ruFlag: "fr",
    finalScore: "3-3 (4-2 penaltis)",
    topScorer: "Kylian Mbappé (8)",
    anecdoteES: "La mejor final de la historia: Messi se coronó leyenda tras un drama de 3-3, hat-trick de Mbappé y penaltis.",
    anecdoteEN: "The greatest final ever: Messi was crowned a legend after a 3-3 drama, Mbappé hat-trick, and penalties."
  },
];
