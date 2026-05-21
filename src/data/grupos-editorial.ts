// src/data/grupos-editorial.ts
//
// Bloque editorial por grupo del Mundial 2026. Cada entrada añade ~500-700
// palabras de análisis: contexto, favoritos, debutantes, datos curiosos,
// jugadores clave, sede de partidos principales.
//
// Usado en src/app/grupos/[slug]/GrupoSlugClient.tsx renderizando
// EditorialBlock con estos datos. Sube las páginas /grupos/grupo-* de
// ~1.260 → ~1.900 palabras.

export interface GrupoEditorial {
  intro: string;
  contexto: string;
  favoritos: string;
  debutante_o_sorpresa: string;
  partido_estrella: string;
  pronostico: string;
  curiosidad?: string;
}

export const GRUPOS_EDITORIAL: Record<string, GrupoEditorial> = {
  A: {
    intro:
      "El Grupo A reúne a México (anfitriona y favorita por contexto), Sudáfrica (debut tras 16 años), Corea del Sur (referente asiático desde 2018) y Rep. Checa (segunda potencia de UEFA D). Es el grupo que abre el Mundial el 11 de junio en el Estadio Azteca, así que cualquier resultado en la primera jornada marca el tono mediático del torneo.",
    contexto:
      "México llega como tercera anfitriona en su historia (1970, 1986 y 2026) bajo Javier Aguirre en su tercer ciclo. Sudáfrica regresa al Mundial tras Sudáfrica 2010 (cuando fue anfitriona) y firma una clasificación complicada con tres puntos descontados por alineación indebida. Corea del Sur, capitaneada por Son Heung-min, viene de octavos en Qatar 2022 y aspira a repetir. Chequia regresa al Mundial 19 años después de Alemania 2006 y depende del gol de Patrik Schick.",
    favoritos:
      "Por nombre, ranking y factor local, México parte como primera del grupo. Corea del Sur es candidata clara al segundo puesto, pero Rep. Checa puede sorprender si Schick está enchufado. Sudáfrica tiene la papeleta más difícil: dos partidos en Estados Unidos lejos de su afición y un calendario sin descansos.",
    debutante_o_sorpresa:
      "El factor sorpresa es Chequia: nadie la espera en octavos pero su bloque defensivo (Souček, Pavlenka) puede frustrar a México. Sudáfrica también puede dar la sorpresa si Hugo Broos repite la versión que ganó la Copa Africana con Camerún.",
    partido_estrella:
      "México vs Corea del Sur, miércoles 24 de junio en el Estadio BBVA de Monterrey, decidirá probablemente el primer puesto del grupo. Será el examen real para Aguirre con casa llena.",
    pronostico:
      "Clasificación esperada: 1º México, 2º Corea del Sur. Chequia y Sudáfrica pelearán el tercer puesto, que vale para colarse en dieciseisavos si suma 3-4 puntos.",
    curiosidad:
      "Es la cuarta vez consecutiva que México arranca un Mundial en casa o en partido inaugural (1970, 1986, 1994 y 2026). Sigue sin pasar de cuartos: el techo lleva 84 años intacto.",
  },
  B: {
    intro:
      "El Grupo B junta a Canadá (anfitriona menor, cabeza de serie por ello), Bosnia (debutante absoluta tras eliminar a Italia en repechaje), Qatar (campeona asiática 2019, busca redimirse de 2022) y Suiza (la potencia europea silenciosa). Es el grupo más impredecible del torneo.",
    contexto:
      "Canadá vuelve a un Mundial 28 años después de Francia 1998 con Alphonso Davies (Bayern), Jonathan David (Lille) y Stephen Eustáquio como columna vertebral. Bosnia, dirigida por Sergej Barbarez, llega con la generación de Pjanić y Edin Džeko (37 años, despedida). Qatar entra como anfitrión asiático con plantilla casi calcada a la de su Mundial 2022 (Almoez Ali, Akram Afif). Suiza, bajo Murat Yakin, tiene fondo de armario europeo: Sommer, Akanji, Xhaka, Embolo.",
    favoritos:
      "Suiza parte como favorita por jerarquía y experiencia mundialista (cuartos en 2006 y 2014). Canadá se beneficia del factor local en BMO Field y BC Place. Bosnia y Qatar pelearán por la tercera plaza con opciones de mejor tercero.",
    debutante_o_sorpresa:
      "Bosnia es el gran debutante. Su clasificación tras vencer a Italia en repechaje fue una de las grandes historias de la temporada. Si Pjanić mantiene la forma y Džeko se reserva para los partidos clave, pueden colarse en dieciseisavos.",
    partido_estrella:
      "Canadá vs Suiza, viernes 19 de junio en BC Place Vancouver, será el examen real para los locales contra una potencia consolidada de UEFA.",
    pronostico:
      "1º Suiza, 2º Canadá por el plus de afición. Bosnia y Qatar luchan por el tercer puesto, con Bosnia ligero favorito por experiencia europea.",
    curiosidad:
      "Es el primer grupo de la historia con dos anfitriones (Canadá y, eventualmente, Qatar como anfitrión de 2022 desde la otra orilla). También es uno de los pocos donde tres equipos vienen de Europa.",
  },
  C: {
    intro:
      "El Grupo C es uno de los más desequilibrados sobre el papel: Brasil (5 veces campeón, nueva era bajo Ancelotti), Marruecos (semifinalista 2022, fenómeno africano), Haití (debutante caribeño tras 52 años) y Escocia (primer Mundial desde Francia 1998). Pinta a paseo brasileño con una segunda plaza muy disputada.",
    contexto:
      "Brasil llega con Vinicius Jr., Rodrygo, Endrick, Raphinha y Casemiro como esqueleto. Carlo Ancelotti asumió en febrero de 2024 y promete una Canarinha menos individualista. Marruecos, dirigida por Walid Regragui, mantiene a Hakimi, Ziyech y Amrabat de la generación que llegó a semifinales en Qatar. Haití clasifica por primera vez desde Alemania 1974 con un proyecto financiado por la federación canadiense de fútbol. Escocia regresa al Mundial liderada por Andy Robertson (Liverpool) y Scott McTominay.",
    favoritos:
      "Brasil, sin discusión. La segunda plaza la pelearán Marruecos y Escocia, con los africanos como favoritos por experiencia mundialista reciente.",
    debutante_o_sorpresa:
      "Haití es la gran historia del grupo. Sin haber jugado un Mundial en 52 años, llega con una generación criada en clubes franceses y belgas. No esperamos clasificación pero pueden incomodar a Escocia o Marruecos.",
    partido_estrella:
      "Brasil vs Marruecos, sábado 13 de junio en NRG Stadium Houston, repetirá el amistoso de marzo 2023 (victoria marroquí 2-1) que sacudió al fútbol brasileño.",
    pronostico:
      "1º Brasil, 2º Marruecos. Escocia entre 1-3 puntos peleando tercer puesto. Haití con foco en disfrutar la cita histórica.",
    curiosidad:
      "Es el grupo con más Balones de Oro previstos en alineaciones: Vinicius (top 3 actual), Rodrygo, Raphinha, Hakimi (lateral del año 2024) y Brahim Díaz están todos aquí.",
  },
  D: {
    intro:
      "El Grupo D mezcla a Estados Unidos (anfitriona, presión máxima), Paraguay (Sudamérica con corazón albirrojo), Australia (especialista en ventanas FIFA) y Turquía (regreso tras Corea-Japón 2002). Grupo equilibrado donde el factor sede pesará mucho.",
    contexto:
      "Estados Unidos juega su 12º Mundial con Mauricio Pochettino al mando desde 2024. Christian Pulisic (Milan), Weston McKennie (Juventus) y Tyler Adams (Bournemouth) son la columna. Paraguay regresa 16 años después de Sudáfrica 2010, con Gustavo Alfaro como DT y Antonio Sanabria como referencia ofensiva. Australia, dirigida por Tony Popovic, sigue siendo el equipo más físico de Oceanía-Asia. Turquía, ya sin Modric, llega con Hakan Çalhanoğlu, Mert Müldür y Kenan Yildiz.",
    favoritos:
      "Estados Unidos por casa y mejor plantilla individual. Turquía es candidato sólido al segundo puesto por calidad ofensiva. Paraguay y Australia pelearán por el tercero.",
    debutante_o_sorpresa:
      "Turquía vuelve al Mundial 24 años después. Si Çalhanoğlu y Müldür están en buena forma, pueden romper pronósticos. Paraguay es el comodín sudamericano: si Sanabria está enchufado, complican al rival más débil del rival.",
    partido_estrella:
      "Estados Unidos vs Turquía, domingo 21 de junio en Lincoln Financial Field Filadelfia, decidirá la primera plaza con Pulisic vs Çalhanoğlu como duelo de capitanes.",
    pronostico:
      "1º Estados Unidos, 2º Turquía. Paraguay y Australia pelean tercer puesto: Paraguay por experiencia, Australia por físico.",
    curiosidad:
      "Pochettino se convierte en el primer entrenador argentino que dirige a una selección anfitriona en su propio territorio. Antes lo hizo Carlos Bilardo, pero como visitante a otra anfitriona.",
  },
  E: {
    intro:
      "El Grupo E es el más extremo del Mundial: Alemania (4 veces campeona, en plena reconstrucción), Curazao (debutante absoluto, país de 150 mil habitantes), Costa de Marfil (campeona africana 2024) y Ecuador (la sorpresa eterna de CONMEBOL). Choque generacional y de niveles.",
    contexto:
      "Alemania, bajo Julian Nagelsmann, llega con Florian Wirtz, Jamal Musiala, Kai Havertz y Joshua Kimmich. Curazao, dirigido por el seleccionador holandés Dick Advocaat, hace historia: es el país más pequeño jamás clasificado a un Mundial. Costa de Marfil es la campeona reciente de la CAN 2024 (en casa) y tiene a Sebastien Haller (Dortmund) y Ibrahim Sangaré (Nottingham Forest). Ecuador, dirigido por Sebastián Beccacece, mantiene el bloque que clasificó a octavos en Qatar 2022.",
    favoritos:
      "Alemania, primera plaza. Ecuador segundo por calidad técnica. Costa de Marfil es candidata al mejor tercero. Curazao mirará el sorteo para disfrutar.",
    debutante_o_sorpresa:
      "Curazao. Con 150 mil habitantes, es estadísticamente la mayor sorpresa de clasificación de la historia. No esperamos puntos pero ya es leyenda solo por estar.",
    partido_estrella:
      "Alemania vs Costa de Marfil, miércoles 24 de junio en MetLife Stadium NY/NJ, repite el cruce que ya hubo en Brasil 2014 (victoria alemana 0-2).",
    pronostico:
      "1º Alemania, 2º Ecuador. Costa de Marfil entre 3-4 puntos peleando mejor tercero. Curazao con la satisfacción de competir.",
    curiosidad:
      "Curazao es la primera nación caribeña en jugar un Mundial sin pasar por playoffs intercontinentales: clasificó directamente como tercera de la fase final CONCACAF.",
  },
  F: {
    intro:
      "El Grupo F es el grupo de los discretos europeos y asiáticos en plenitud: Países Bajos (siempre candidatos), Japón (la potencia asiática actual), Suecia (regreso tras 8 años) y Túnez (cuarta participación). Grupo con cuatro selecciones competitivas y ningún favorito claro.",
    contexto:
      "Países Bajos llega con Ronald Koeman repitiendo ciclo. Memphis Depay y Frenkie de Jong lideran, con Cody Gakpo (Liverpool) y Xavi Simons (RB Leipzig) como nuevos referentes. Japón, dirigido por Hajime Moriyasu, tiene a Takefusa Kubo (Sociedad), Takumi Minamino y Wataru Endo (Liverpool). Suecia, ya sin Ibrahimović, regresa con Alexander Isak (Liverpool) y Viktor Gyökeres (Arsenal) en racha goleadora. Túnez vuelve por cuarta vez consecutiva, con Wahbi Khazri y Aïssa Laïdouni como referencias.",
    favoritos:
      "Países Bajos parte como primera por jerarquía. Japón es el segundo natural por la solidez de su generación europea. Suecia y Túnez pelearán por el tercer puesto.",
    debutante_o_sorpresa:
      "Japón puede dar la sorpresa de quedar primero. En Qatar 2022 ya venció a Alemania y España en fase de grupos. Tiene base europea y ritmo intenso.",
    partido_estrella:
      "Países Bajos vs Japón, jueves 18 de junio en Estadio BBVA Monterrey (altitud 540m), es el partido que decidirá el primer puesto.",
    pronostico:
      "1º Países Bajos, 2º Japón. Suecia por calidad técnica reciente, Túnez por experiencia: tercer puesto disputado al detalle.",
    curiosidad:
      "Es el primer grupo del Mundial donde NO hay ninguna selección campeona del Mundo. Los Países Bajos llegaron tres veces a la final (1974, 1978, 2010) sin ganarla nunca.",
  },
  G: {
    intro:
      "El Grupo G mezcla a Bélgica (la generación dorada en su último Mundial), Egipto (Salah y compañía), Irán (potencia asiática silenciosa) y N. Zelanda (única selección de Oceanía clasificada). Grupo donde solo cabe una sorpresa.",
    contexto:
      "Bélgica entra con Domenico Tedesco. Kevin De Bruyne (33), Romelu Lukaku (32) y Thibaut Courtois forman la base de una generación que se despide. Egipto regresa con Mohamed Salah (Liverpool) y Trezeguet. Irán, bajo Amir Ghalenoei, mantiene a Sardar Azmoun y Mehdi Taremi (Inter) como pareja de ataque. Nueva Zelanda clasifica como ganador de Oceanía: Chris Wood (Nottingham Forest) es la única referencia de élite.",
    favoritos:
      "Bélgica, primera plaza. Egipto segundo por la figura de Salah. Irán pelea con mucha experiencia mundialista. Nueva Zelanda con un partido para soñar.",
    debutante_o_sorpresa:
      "Egipto puede ser la sorpresa: en 5 Mundiales nunca ha pasado de fase de grupos. Si Salah aparece, este grupo es la oportunidad histórica.",
    partido_estrella:
      "Bélgica vs Egipto, viernes 19 de junio en Levi's Stadium Bay Area, será el duelo entre De Bruyne y Salah, dos compañeros de Liverpool durante 5 años.",
    pronostico:
      "1º Bélgica, 2º Egipto. Irán por experiencia 3º (mejor tercero posible). Nueva Zelanda con foco en disfrutar.",
    curiosidad:
      "Es uno de los pocos grupos donde tres selecciones tienen colores oficiales muy similares (Bélgica rojo, Egipto rojo, Irán blanco): los uniformes alternativos cobran protagonismo.",
  },
  H: {
    intro:
      "El Grupo H es el del campeón continental europeo (España, Eurocopa 2024), el último Mundial de Bielsa con Uruguay, la sorpresa Cabo Verde (debutante absoluto) y Arabia Saudí (la histórica giant-killer). Grupo de máximo interés mediático.",
    contexto:
      "España llega como campeona de Eurocopa 2024 con Luis de la Fuente. Lamine Yamal (18), Pedri, Rodri, Nico Williams, Unai Simón forman el bloque. Uruguay regresa con Marcelo Bielsa en su último ciclo. Federico Valverde, Darwin Núñez, Ronald Araújo, Mathías Olivera. Cabo Verde, dirigido por Bubista, hace historia como tercer país más pequeño en clasificar. Arabia Saudí, con Roberto Mancini, mantiene la base del equipo que venció a Argentina en Qatar 2022.",
    favoritos:
      "España, primera. Uruguay segundo por jerarquía sudamericana. Cabo Verde y Arabia Saudí pelearán por el tercer puesto.",
    debutante_o_sorpresa:
      "Cabo Verde, sin duda. Los 'Tubarões Azuis' eliminaron a Camerún en clasificación africana. Cuentan con base de jugadores en Portugal y Holanda.",
    partido_estrella:
      "Uruguay vs España, viernes 26 de junio en Estadio Akron Guadalajara (20:00 ET / 02:00 hora España del 27), será el último Mundial de Bielsa contra los campeones de Europa. Probablemente el partido más visto de la fase de grupos en España y Sudamérica.",
    pronostico:
      "1º España, 2º Uruguay. Cabo Verde podría dar 1-2 sorpresas y Arabia Saudí mira a su victoria 2022 como mantra.",
    curiosidad:
      "España y Uruguay nunca se han enfrentado en un Mundial. Es la primera vez en 96 años de historia. El partido en Guadalajara abre una nueva línea de tradición.",
  },
  I: {
    intro:
      "El Grupo I junta a Francia (subcampeona 2022 con Mbappé), Senegal (potencia africana), Irak (debut tras 40 años) y Noruega (Haaland y Ødegaard al Mundial). Grupo desequilibrado pero con dos estrellas individuales del top mundial.",
    contexto:
      "Francia, con Didier Deschamps en su tercer Mundial al mando, llega con Kylian Mbappé (27), Aurélien Tchouaméni, William Saliba, Jules Koundé y Ousmane Dembélé. Senegal, dirigido por Pape Thiaw, mantiene a Sadio Mané, Krepin Diatta e Idrissa Gueye como columna. Irak regresa al Mundial 40 años después de México 1986 con Aymen Hussein como referencia. Noruega vuelve al Mundial 28 años después de Francia 1998 con Haaland y Martin Ødegaard como núcleo: una generación que merece la cita.",
    favoritos:
      "Francia primera, sin debate. Senegal y Noruega pelearán por la segunda plaza. Irak con el reto de sumar puntos por primera vez en su historia.",
    debutante_o_sorpresa:
      "Noruega es la gran historia. 28 años sin Mundial y llega con Haaland (Manchester City) y Ødegaard (Arsenal) en su mejor edad. Pueden quedar segundos del grupo.",
    partido_estrella:
      "Francia vs Noruega, martes 23 de junio en MetLife Stadium NY/NJ, enfrenta a Mbappé contra Haaland: el duelo de delanteros del Mundial.",
    pronostico:
      "1º Francia, 2º Noruega por margen estrecho con Senegal. Irak con foco en hacer historia con un punto.",
    curiosidad:
      "Es la primera vez que Haaland disputa un Mundial. Hasta ahora, su única participación en torneo internacional con Noruega fue la Eurocopa Sub-21 de 2019. A sus 25 años, llega con 110 goles internacionales en menos de 110 partidos.",
  },
  J: {
    intro:
      "El Grupo J es el de Argentina (defensora del título con Messi en su despedida), Argelia (regreso africano competitivo), Austria (Europa con sello Ralf Rangnick) y Jordania (debut). Grupo dominado por Argentina pero con segunda plaza muy disputada.",
    contexto:
      "Argentina llega con Lionel Scaloni renovado tras Copa América 2024. Lionel Messi (38), Lautaro Martínez, Julián Álvarez, Enzo Fernández, Alexis Mac Allister y Emiliano Martínez (Dibu) defienden el título. Argelia, con Vladimir Petković, lidera Riyad Mahrez (40 internacional, casi retiro). Austria, dirigida por Ralf Rangnick, tiene a Marcel Sabitzer, David Alaba y Christoph Baumgartner. Jordania, bajo Hussein Ammouta, debuta en Mundial: Musa Al-Tamari (Montpellier) es la referencia.",
    favoritos:
      "Argentina, sin discusión. Austria es la candidata principal a segunda plaza por jerarquía y experiencia mundialista. Argelia y Jordania pelearán por el tercer puesto.",
    debutante_o_sorpresa:
      "Jordania es la sorpresa absoluta. Llegó al Mundial tras vencer a Corea del Sur en semifinal de la Copa Asiática 2024 (resultado 2-0). Pueden incomodar a Argelia o Austria.",
    partido_estrella:
      "Argentina vs Austria, miércoles 24 de junio en NRG Stadium Houston, es el partido bisagra. Si Argentina gana cómodo, certifica primera plaza; si Austria saca el empate, todo abierto.",
    pronostico:
      "1º Argentina, 2º Austria. Argelia tercera con opciones de pasar como mejor tercero. Jordania con la ilusión.",
    curiosidad:
      "Será probablemente el último Mundial de Lionel Messi. Si gana, igualaría a Pelé como único jugador con dos Mundiales después de los 30 años. Pelé los ganó con 24 y 30; Messi llegaría con 35 y 39.",
  },
  K: {
    intro:
      "El Grupo K agrupa a Portugal (Cristiano en su último Mundial), Uzbekistán (debutante absoluto), Colombia (la sorpresa eterna sudamericana) y RD Congo (debutante africano). Grupo abierto donde solo Portugal parte con favoritismo claro.",
    contexto:
      "Portugal, con Roberto Martínez, lleva a Cristiano Ronaldo (41 años) en su sexto Mundial. Bernardo Silva, Bruno Fernandes, Bernardo Silva, Diogo Jota y Rúben Dias forman el bloque. Uzbekistán, dirigido por Timur Kapadze, debuta en Mundial: Eldor Shomurodov (Roma) y Khusayn Norchaev son las referencias. Colombia, con Néstor Lorenzo, mantiene a James Rodríguez, Luis Díaz, Daniel Muñoz y Davinson Sánchez. RD Congo, bajo Sébastien Desabre, lleva a Cédric Bakambu y Yoane Wissa como armas ofensivas.",
    favoritos:
      "Portugal primera, plaza segura. Colombia segundo por jerarquía sudamericana. Uzbekistán y RD Congo pelean tercero.",
    debutante_o_sorpresa:
      "Uzbekistán es el gran debutante. País sin tradición futbolística mundial llega con una generación criada en Rusia y Turquía. Si Shomurodov está fino, pueden lograr un punto histórico.",
    partido_estrella:
      "Portugal vs Colombia, sábado 27 de junio en Hard Rock Stadium Miami, será el último partido de fase de grupos de Cristiano Ronaldo en un Mundial.",
    pronostico:
      "1º Portugal, 2º Colombia. Uzbekistán y RD Congo se reparten 1-3 puntos cada uno.",
    curiosidad:
      "El partido Portugal vs Colombia es el único del Mundial donde se enfrentarán dos jugadores nacidos en abril del mismo año: Cristiano Ronaldo (5/2/1985) y James Rodríguez (12/7/1991), ambos con 6+ años en clubes ibéricos.",
  },
  L: {
    intro:
      "El Grupo L cierra el Mundial con Inglaterra (Bellingham y Kane buscan la primera estrella desde 1966), Croacia (subcampeona 2018 y bronce 2022), Ghana (regreso tras 12 años) y Panamá (segunda participación). Grupo con dos finalistas potenciales mezclados con dos americanos en desarrollo.",
    contexto:
      "Inglaterra, con Thomas Tuchel desde 2024, tiene a Jude Bellingham (Real Madrid), Harry Kane (Bayern), Phil Foden, Cole Palmer y Bukayo Saka. Croacia, dirigida por Zlatko Dalić, mantiene a Luka Modrić (40 años, despedida), Mateo Kovačić y Joško Gvardiol. Ghana regresa con Otto Addo: Mohammed Kudus (Tottenham), André Ayew y Inaki Williams son las referencias. Panamá vuelve al Mundial 8 años después de Rusia 2018 con José Fajardo y Adalberto Carrasquilla.",
    favoritos:
      "Inglaterra primera por mejor plantilla. Croacia segunda por jerarquía. Ghana tercera por experiencia. Panamá pelea sumar puntos.",
    debutante_o_sorpresa:
      "Ghana puede dar la sorpresa de pasar segunda si Kudus mantiene la racha goleadora con Tottenham. Croacia ya no es la potencia de 2018.",
    partido_estrella:
      "Inglaterra vs Croacia, viernes 19 de junio en AT&T Stadium Dallas, repite el cruce de semifinal 2018 (victoria croata 2-1 en prórroga) y de fase de grupos de Euro 2024 (victoria inglesa 2-0).",
    pronostico:
      "1º Inglaterra, 2º Croacia. Ghana tercera con opciones de mejor tercero si suma 4 puntos. Panamá con foco en sumar el primer punto.",
    curiosidad:
      "Es el grupo con el promedio de edad más alto: Modrić (40), Kane (33), Cristiano (41) -no juega aquí- y Otto Addo (DT, 50). El Mundial 2026 será probablemente el último de Modrić, ya que en 2030 tendría 45 años.",
  },
};
