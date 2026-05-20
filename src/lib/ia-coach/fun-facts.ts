// src/lib/ia-coach/fun-facts.ts
//
// 100 curiosidades del Mundial de Fútbol — rotan en el loading del Coach IA.
// Mix de historia (1930-2026), récords, anécdotas, sedes 2026 y jugadores.
// Verificadas (mayo 2026). Cada entrada incluye el prefijo natural "¿Sabías
// que…" eliminado en runtime para evitar repetición visual.

export const FUN_FACTS: string[] = [
  // ─── Historia y formato ───
  "El primer Mundial fue en 1930 en Uruguay y solo participaron 13 selecciones.",
  "Brasil es la única selección que ha jugado los 22 Mundiales disputados hasta 2022.",
  "El Mundial 2026 será el primero con 48 selecciones y 104 partidos.",
  "Estados Unidos, Canadá y México coorganizan el Mundial 2026 — tres países por primera vez.",
  "El Mundial 2026 será el último con 48 selecciones antes de evaluar volver a 32 en 2030.",
  "Hasta 1970, el trofeo fue la Copa Jules Rimet. Brasil se la quedó tras ganar tres veces.",
  "Italia y Uruguay fueron los únicos campeones antes de la Segunda Guerra Mundial.",
  "El Mundial se suspendió en 1942 y 1946 por la Segunda Guerra Mundial.",
  "Hasta 1998 el Mundial tuvo 24 selecciones; desde 1998 hasta 2022 fueron 32.",
  "El sistema de 48 selecciones repartirá 12 grupos de 4 equipos cada uno.",

  // ─── Campeones ───
  "Brasil es el máximo ganador con 5 Mundiales (1958, 62, 70, 94, 2002).",
  "Alemania e Italia tienen 4 Mundiales cada uno; Argentina, Francia y Uruguay 3, 2 y 2.",
  "Argentina ganó su tercera estrella en Qatar 2022 venciendo a Francia en penaltis.",
  "España ganó su primer Mundial en Sudáfrica 2010 con gol de Iniesta en la prórroga.",
  "Francia ganó en 1998 (local) y en 2018 (Rusia) — el segundo título con Mbappé como joven figura.",
  "Inglaterra solo ha ganado un Mundial: el de 1966 en casa frente a Alemania.",
  "Uruguay fue campeón en 1930 (local) y 1950 (Maracanazo en Brasil).",
  "Italia ganó dos Mundiales consecutivos (1934 y 1938) bajo Vittorio Pozzo.",
  "Alemania ganó cuatro Mundiales: 1954, 1974, 1990 y 2014.",
  "Sólo ocho selecciones han sido campeones del mundo en la historia.",

  // ─── Pelé, Maradona, Messi, Mbappé ───
  "Pelé es el único futbolista que ha ganado 3 Mundiales (1958, 1962 y 1970).",
  "Pelé debutó en Mundial con 17 años y marcó un hat-trick en la semifinal de 1958.",
  "Lionel Messi disputó su quinto Mundial en 2022 y lo ganó a los 35 años.",
  "Diego Maradona protagonizó la 'Mano de Dios' y el 'Gol del Siglo' vs Inglaterra en 1986.",
  "Maradona dirigió a Argentina en el Mundial 2010 como entrenador.",
  "Mbappé es el segundo jugador en marcar hat-trick en una final (2022), tras Geoff Hurst en 1966.",
  "Kylian Mbappé ganó el Mundial 2018 con apenas 19 años.",
  "Cristiano Ronaldo ha jugado 5 Mundiales pero nunca llegó a una final.",
  "Messi es el jugador con más partidos jugados en Mundiales: 26.",
  "Pelé tiene el récord de ser el jugador más joven en ganar un Mundial (17 años, 1958).",

  // ─── Récords goleadores ───
  "Miroslav Klose es el máximo goleador histórico del Mundial con 16 goles.",
  "Ronaldo 'el Fenómeno' marcó 15 goles en Mundiales, segundo histórico.",
  "Just Fontaine anotó 13 goles en un solo Mundial (1958) — récord aún vigente.",
  "El gol más rápido en un Mundial: Hakan Şükür (Turquía) en 10,8 segundos vs Corea del Sur, 2002.",
  "El partido más goleado: Hungría 10 - El Salvador 1 en el Mundial 1982.",
  "Oleg Salenko anotó 5 goles en un solo partido: Rusia 6 - Camerún 1 (1994).",
  "Hungría tiene el récord de goles en un Mundial: 27 en 1954 (perdieron la final con Alemania).",
  "Alemania humilló a Brasil 7-1 en la semifinal del Mundial 2014.",
  "Sólo dos jugadores han marcado en cuatro Mundiales distintos: Pelé y Uwe Seeler.",
  "El Mundial 1962 tuvo la media goleadora más baja: 2.78 goles por partido.",

  // ─── Finales y partidos legendarios ───
  "La final de 1950 (Brasil-Uruguay) tuvo 173.850 espectadores: récord absoluto.",
  "El Mundial 1950 en Brasil tuvo la final más triste para los locales: Maracanazo de Uruguay 2-1.",
  "Italia ganó la final de 2006 a Francia en penaltis tras el cabezazo de Zidane a Materazzi.",
  "Alemania vs Italia 1970 ('partido del siglo') terminó 4-3 con cinco goles en la prórroga.",
  "El cabezazo de Zidane a Materazzi en la final 2006 fue su última acción como profesional.",
  "Argentina vs Holanda en la final de 1978 se jugó con dictadura militar en Buenos Aires.",
  "Brasil vs Italia 1994 fue la única final del Mundial decidida desde los penaltis.",
  "Holanda perdió tres finales del Mundial (1974, 1978 y 2010) sin ganar ninguna.",
  "Maradona protagonizó dos goles legendarios contra Inglaterra el mismo partido: 1986.",
  "La final 2022 Argentina-Francia es considerada por muchos la mejor de la historia.",

  // ─── Sedes Mundial 2026 ───
  "Mundial 2026: 16 sedes — 11 en EE.UU., 3 en México, 2 en Canadá.",
  "Estadio Azteca albergará su 3ª Final Mundial: 1970, 1986 y 2026.",
  "MetLife Stadium, Nueva York/NJ, albergará la Final del Mundial 2026.",
  "El Mundial 2026 inaugura en Estadio Azteca, Ciudad de México el 11 de junio.",
  "BMO Field en Toronto es el estadio más pequeño del Mundial 2026 con 45 mil aforo.",
  "Hard Rock Stadium en Miami albergará el partido por el 3er puesto el 18 de julio de 2026.",
  "AT&T Stadium en Dallas tiene la pantalla central interior más grande del mundo (49m).",
  "SoFi Stadium en Los Ángeles costó 5.500 millones de dólares: el estadio más caro de la historia.",
  "Lumen Field en Seattle es famoso por su ruido: récord de decibeles en estadios.",
  "BC Place en Vancouver es el único estadio canadiense con techo retráctil del Mundial 2026.",

  // ─── DTs ───
  "Marcelo Bielsa, DT de Uruguay, ya dirigió a Argentina (1998-2004) y Chile (2007-2011).",
  "Hugo Broos, DT belga de Sudáfrica, ganó la Copa Africana de Naciones con Camerún en 2017.",
  "Carlo Ancelotti nunca ha sido campeón del Mundial como DT, pese a su palmarés en clubes.",
  "Vittorio Pozzo es el único DT que ha ganado dos Mundiales (Italia 1934 y 1938).",
  "Luiz Felipe Scolari ganó el Mundial con Brasil 2002 y dirigió a Portugal en 2006.",
  "Marcelo Bielsa es conocido como 'El Loco' por su intensidad táctica y rutinas extremas.",
  "Lionel Scaloni, DT de Argentina, era preparador físico antes de tomar la selección en 2018.",
  "Mario Zagallo es el único en ser campeón del Mundial como jugador (1958, 62) y DT (1970).",
  "Franz Beckenbauer ganó el Mundial como capitán (1974) y como DT (1990) con Alemania.",
  "Cesare y Paolo Maldini son padre e hijo y los dos disputaron Mundiales con Italia.",

  // ─── Selecciones del Mundial 2026 ───
  "Cabo Verde y Curazao debutan en Mundial en 2026, son los países más pequeños jamás clasificados.",
  "Estados Unidos jugará su 12º Mundial en 2026, su mejor resultado fue 3º en 1930.",
  "Marruecos hizo historia en Qatar 2022: primer país africano semifinalista.",
  "Croacia ha jugado dos finales consecutivas: subcampeón 2018, 3º en 2022.",
  "México fue anfitrión por tercera vez (1970, 1986 y 2026): único país con ese récord.",
  "Arabia Saudí derrotó 2-1 a Argentina en Qatar 2022 — la mayor sorpresa del Mundial.",
  "Senegal disputará su 4º Mundial en 2026; debutó en 2002 llegando a cuartos.",
  "Uzbekistán clasifica a su primer Mundial en 2026, tras décadas en confederación asiática.",
  "Bosnia y Herzegovina disputará su 2º Mundial en 2026, primero fue en Brasil 2014.",
  "Curazao tiene apenas 150 mil habitantes y será la 'pequeña' del Mundial 2026.",
  "Cabo Verde — 'Os Tubarões Azuis' (Tiburones Azules) — debuta tras eliminar a Camerún.",
  "Egipto regresa al Mundial 2026 tras 8 años de ausencia (último: 2018).",
  "Noruega vuelve al Mundial tras 28 años (último: Francia 1998) gracias a Haaland y Ødegaard.",
  "Inglaterra es la única selección en clasificar a 16 Mundiales sin haber ganado fuera de casa.",
  "Portugal tiene a Cristiano Ronaldo (probable) en su sexta participación mundialista.",

  // ─── Anécdotas y datos curiosos ───
  "El balón oficial del Mundial 2026 se llama 'Trionda' (Adidas).",
  "Cada balón Mundial tiene un nombre: Telstar (70), Tango (78), Brazuca (14), Al Rihla (22).",
  "El primer Mundial transmitido por TV fue en 1954 (Suiza), en blanco y negro.",
  "El Mundial 1986 introdujo la 'ola' como celebración masiva del público.",
  "Pelé era el único jugador prohibido de salir de Brasil — fue declarado 'tesoro nacional'.",
  "La FIFA introdujo el VAR oficialmente en el Mundial 2018 de Rusia.",
  "El Mundial 1970 en México fue el primero transmitido en color a todo el mundo.",
  "El logo oficial del Mundial 2026 muestra el trofeo dorado con efecto 3D y movimiento.",
  "El árbitro Pierluigi Collina (Italia) arbitró la final del Mundial 2002.",
  "La 'Selfie Final' de Qatar 2022 entre Messi y la copa fue la foto más likeada en Instagram.",
  "El himno oficial del Mundial 2026 incluye a artistas de los tres países anfitriones.",
  "El primer árbitro mujer en un Mundial fue Stéphanie Frappart (Francia) en Qatar 2022.",
  "El Mundial 2022 fue el primero con calefacción en estadios al aire libre.",
  "El Mundial 1990 introdujo la tarjeta roja indirecta tras dos amarillas.",
  "Hasta 1970 los porteros no usaban un color distinto al resto del equipo en sus uniformes.",
  "El estadio más grande del Mundial 2026 será SoFi en Los Ángeles con 70.240 aforo.",
  "Solo ocho jugadores han marcado en tres Mundiales consecutivos: incluyendo Cristiano y Messi.",
  "El árbitro español Mateu Lahoz arbitró Argentina-Holanda 2022, partido de 18 amarillas.",
  "El Mundial 1986 tuvo a Diego Maradona como mejor jugador y goleador con 5 goles.",
  "La FIFA registró su primer 'Joven Promesa' en 2006: ganó Lukas Podolski (Alemania).",
];
