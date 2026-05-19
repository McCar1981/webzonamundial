#!/usr/bin/env node
// scripts/update-squads-2026-05.mjs
//
// Actualiza data/teams/*.json con las convocatorias DEFINITIVAS publicadas
// hasta el 19 mayo 2026 (Mundial 2026, fecha límite FIFA: 2 junio 2026).
//
// Cruza la "likely_squad" del JSON con la lista oficial:
//   - elimina jugadores del JSON que NO están en la lista oficial
//   - mantiene los que SÍ están (preserva photo_url, shirt_number_expected, etc.)
//   - añade los nuevos con photo_url:null, shirt_number_expected:null, status:"fixed"
//   - cambia status de TODOS a "fixed" (ya no son proyección, son convocatoria oficial)
//   - actualiza coach.name si el .md lo indica
//
// Uso: node scripts/update-squads-2026-05.mjs

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "data", "teams");

/* -------------------------------------------------------------------------- */
/* Normalizadores                                                              */
/* -------------------------------------------------------------------------- */

const stripAccents = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "")
    .replace(/-/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const slugify = (s) =>
  stripAccents(s)
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-");

/** Comparación tolerante de nombres: ignora tildes, mayúsculas, sufijos
 *  comunes ("Jr.", "Júnior"), y matchea por apellido completo si nombre
 *  completo no matchea. */
function nameMatches(jsonName, mdName) {
  if (!jsonName || !mdName) return false;
  const a = stripAccents(jsonName);
  const b = stripAccents(mdName);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  // last token (apellido) shared y al menos 1 inicial nombre coincidente
  const tokensA = a.split(" ").filter(Boolean);
  const tokensB = b.split(" ").filter(Boolean);
  if (tokensA.length && tokensB.length) {
    const lastA = tokensA[tokensA.length - 1];
    const lastB = tokensB[tokensB.length - 1];
    if (lastA === lastB) {
      // si los apellidos coinciden y la primera letra del nombre coincide
      const firstA = tokensA[0]?.[0];
      const firstB = tokensB[0]?.[0];
      if (firstA && firstB && firstA === firstB) return true;
    }
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/* Mapeo position .md → JSON                                                   */
/* -------------------------------------------------------------------------- */

const POS_MAP = {
  PO: "GK",
  DF: "DEF",
  MC: "MID",
  DL: "FWD",
};

/* -------------------------------------------------------------------------- */
/* Datos del .md (convocatorias definitivas 19 mayo 2026)                      */
/* -------------------------------------------------------------------------- */

const SQUADS = {
  bosnia: {
    coach: "Sergej Barbarez",
    players: [
      { name: "Nikola Vasilj", pos: "PO", club: "FC St. Pauli" },
      { name: "Martin Zlomislić", pos: "PO", club: "HNK Rijeka" },
      { name: "Osman Hadžikić", pos: "PO", club: "NK Slaven Belupo" },
      { name: "Sead Kolašinac", pos: "DF", club: "Atalanta" },
      { name: "Amar Dedić", pos: "DF", club: "Benfica" },
      { name: "Nihad Mujakić", pos: "DF", club: "Gaziantep" },
      { name: "Nikola Katić", pos: "DF", club: "Schalke 04" },
      { name: "Tarik Muharemović", pos: "DF", club: "Sassuolo" },
      { name: "Stjepan Radeljić", pos: "DF", club: "HNK Rijeka" },
      { name: "Dennis Hadžikadunić", pos: "DF", club: "Sampdoria" },
      { name: "Nidal Čelik", pos: "DF", club: "Lens" },
      { name: "Amir Hadžiahmetović", pos: "DF", club: "Hull City" },
      { name: "Ivan Šunjić", pos: "MC", club: "Pafos" },
      { name: "Ivan Bašić", pos: "MC", club: "Astana" },
      { name: "Dženis Burnić", pos: "MC", club: "Karlsruher" },
      { name: "Ermin Mahmić", pos: "MC", club: "Slovan Liberec" },
      { name: "Benjamin Tahirović", pos: "MC", club: "Brøndby IF" },
      { name: "Amar Memić", pos: "MC", club: "Viktoria Plzeň" },
      { name: "Armin Gigović", pos: "MC", club: "Young Boys" },
      { name: "Kerim Alajbegović", pos: "MC", club: "Red Bull Salzburg" },
      { name: "Esmir Bajraktarević", pos: "MC", club: "PSV" },
      { name: "Ermedin Demirović", pos: "DL", club: "" },
      { name: "Jovo Lukić", pos: "DL", club: "" },
      { name: "Samed Baždar", pos: "DL", club: "" },
      { name: "Haris Tabaković", pos: "DL", club: "" },
      { name: "Edin Džeko", pos: "DL", club: "" },
    ],
  },
  brasil: {
    coach: "Carlo Ancelotti",
    players: [
      { name: "Alisson Becker", pos: "PO", club: "Liverpool" },
      { name: "Ederson", pos: "PO", club: "Fenerbahçe" },
      { name: "Weverton", pos: "PO", club: "Grêmio" },
      { name: "Marquinhos", pos: "DF", club: "PSG" },
      { name: "Gabriel Magalhães", pos: "DF", club: "Arsenal" },
      { name: "Gleison Bremer", pos: "DF", club: "Juventus" },
      { name: "Danilo", pos: "DF", club: "Flamengo" },
      { name: "Alex Sandro", pos: "DF", club: "Flamengo" },
      { name: "Douglas Santos", pos: "DF", club: "Zenit" },
      { name: "Roger Ibáñez", pos: "DF", club: "Al-Ahli" },
      { name: "Léo Pereira", pos: "DF", club: "Flamengo" },
      { name: "Wesley", pos: "DF", club: "Roma" },
      { name: "Bruno Guimarães", pos: "MC", club: "Newcastle" },
      { name: "Casemiro", pos: "MC", club: "Manchester United" },
      { name: "Danilo S.", pos: "MC", club: "Botafogo" },
      { name: "Fabinho", pos: "MC", club: "Al-Ittihad" },
      { name: "Lucas Paquetá", pos: "MC", club: "Flamengo" },
      { name: "Vinícius Júnior", pos: "DL", club: "Real Madrid" },
      { name: "Raphinha", pos: "DL", club: "Barcelona" },
      { name: "Neymar Jr.", pos: "DL", club: "Santos" },
      { name: "Endrick", pos: "DL", club: "Olympique de Lyon" },
      { name: "Gabriel Martinelli", pos: "DL", club: "Arsenal" },
      { name: "Matheus Cunha", pos: "DL", club: "Manchester United" },
      { name: "Rayan", pos: "DL", club: "Bournemouth" },
      { name: "Igor Thiago", pos: "DL", club: "Brentford" },
      { name: "Luiz Henrique", pos: "DL", club: "Zenit" },
    ],
  },
  haiti: {
    coach: null,
    players: [
      { name: "Johnny Placide", pos: "PO", club: "" },
      { name: "Alexandre Pierre", pos: "PO", club: "" },
      { name: "Josué Duverger", pos: "PO", club: "" },
      { name: "Carlens Arcus", pos: "DF", club: "" },
      { name: "Wilguens Paugain", pos: "DF", club: "" },
      { name: "Duke Lacroix", pos: "DF", club: "" },
      { name: "Martin Experience", pos: "DF", club: "" },
      { name: "JK Duverne", pos: "DF", club: "" },
      { name: "Ricardo Adé", pos: "DF", club: "" },
      { name: "Hannes Delcroix", pos: "DF", club: "" },
      { name: "Keeto Thermoncy", pos: "DF", club: "" },
      { name: "Leverton Pierre", pos: "MC", club: "" },
      { name: "Carl-Fred Sainthe", pos: "MC", club: "" },
      { name: "Jean-Jacques Danley", pos: "MC", club: "" },
      { name: "Jeanricner Bellegarde", pos: "MC", club: "" },
      { name: "Pierre Woodenski", pos: "MC", club: "" },
      { name: "Dominique Simon", pos: "MC", club: "" },
      { name: "Louicius Deedson", pos: "DL", club: "" },
      { name: "Ruben Providence", pos: "DL", club: "" },
      { name: "Josué Casimir", pos: "DL", club: "" },
      { name: "Derrick Etienne", pos: "DL", club: "" },
      { name: "Wilson Isidor", pos: "DL", club: "" },
      { name: "Duckens Nazon", pos: "DL", club: "" },
      { name: "Frantzdy Pierrot", pos: "DL", club: "" },
      { name: "Yassin Fortune", pos: "DL", club: "" },
      { name: "Lenny Joseph", pos: "DL", club: "" },
    ],
  },
  "costa-de-marfil": {
    coach: "Emerse Faé",
    players: [
      { name: "Emmanuel Agbadou", pos: "DF", club: "" },
      { name: "Clément Akpa", pos: "DF", club: "" },
      { name: "Ousmane Diomandé", pos: "DF", club: "" },
      { name: "Guéla Doué", pos: "DF", club: "" },
      { name: "Ghislan Konan", pos: "DF", club: "" },
      { name: "Odilon Kossounou", pos: "DF", club: "" },
      { name: "Evan N'Dicka", pos: "DF", club: "Roma" },
      { name: "Wilfried Singo", pos: "DF", club: "" },
      { name: "Seko Fofana", pos: "MC", club: "" },
      { name: "Parfait Guiagon", pos: "MC", club: "" },
      { name: "Christiano Oulaï", pos: "MC", club: "" },
      { name: "Franck Kessié", pos: "MC", club: "" },
      { name: "Ibrahim Sangaré", pos: "MC", club: "" },
      { name: "Jean-Michaël Seri", pos: "MC", club: "" },
      { name: "Simon Adingra", pos: "DL", club: "" },
      { name: "Ange-Yoan Bonny", pos: "DL", club: "" },
      { name: "Amad Diallo", pos: "DL", club: "Manchester United" },
      { name: "Oumar Diakité", pos: "DL", club: "" },
      { name: "Yan Diomandé", pos: "DL", club: "" },
      { name: "Evann Guessand", pos: "DL", club: "" },
      { name: "Nicolas Pépé", pos: "DL", club: "" },
      { name: "Bazoumana Touré", pos: "DL", club: "" },
      { name: "Elye Wahi", pos: "DL", club: "" },
    ],
  },
  japon: {
    coach: "Hajime Moriyasu",
    players: [
      { name: "Zion Suzuki", pos: "PO", club: "Parma" },
      { name: "Keisuke Osako", pos: "PO", club: "Sanfrecce Hiroshima" },
      { name: "Tomoki Hayakawa", pos: "PO", club: "Kashima Antlers" },
      { name: "Yuto Nagatomo", pos: "DF", club: "" },
      { name: "Shogo Taniguchi", pos: "DF", club: "" },
      { name: "Ko Itakura", pos: "DF", club: "Ajax" },
      { name: "Tsuyoshi Watanabe", pos: "DF", club: "" },
      { name: "Takehiro Tomiyasu", pos: "DF", club: "Arsenal" },
      { name: "Hiroki Ito", pos: "DF", club: "Bayern Múnich" },
      { name: "Ayumu Seko", pos: "DF", club: "" },
      { name: "Yukinari Sugawara", pos: "DF", club: "" },
      { name: "Junnosuke Suzuki", pos: "MC", club: "FC Copenhagen" },
      { name: "Wataru Endo", pos: "MC", club: "Liverpool" },
      { name: "Junya Ito", pos: "MC", club: "Genk" },
      { name: "Daichi Kamada", pos: "MC", club: "Crystal Palace" },
      { name: "Ritsu Doan", pos: "MC", club: "Eintracht Frankfurt" },
      { name: "Ao Tanaka", pos: "MC", club: "Leeds United" },
      { name: "Keito Nakamura", pos: "MC", club: "Stade de Reims" },
      { name: "Kaishu Sano", pos: "MC", club: "Mainz 05" },
      { name: "Takefusa Kubo", pos: "MC", club: "Real Sociedad" },
      { name: "Yuito Suzuki", pos: "MC", club: "Friburgo" },
      { name: "Koki Ogawa", pos: "DL", club: "NEC Nijmegen" },
      { name: "Daizen Maeda", pos: "DL", club: "Celtic" },
      { name: "Ayase Ueda", pos: "DL", club: "Feyenoord" },
      { name: "Kento Shiogai", pos: "DL", club: "Wolfsburgo" },
      { name: "Keisuke Goto", pos: "DL", club: "Sint-Truiden" },
    ],
  },
  suecia: {
    coach: "Graham Potter",
    players: [
      { name: "Viktor Johansson", pos: "PO", club: "" },
      { name: "Kristoffer Nordfeldt", pos: "PO", club: "" },
      { name: "Jacob Widell Zetterström", pos: "PO", club: "" },
      { name: "Hjalmar Ekdal", pos: "DF", club: "" },
      { name: "Gabriel Gudmundsson", pos: "DF", club: "" },
      { name: "Isak Hien", pos: "DF", club: "" },
      { name: "Emil Holm", pos: "DF", club: "" },
      { name: "Gustaf Lagerbielke", pos: "DF", club: "" },
      { name: "Victor Nilsson Lindelöf", pos: "DF", club: "" },
      { name: "Erick Smith", pos: "DF", club: "" },
      { name: "Carl Starfelt", pos: "DF", club: "" },
      { name: "Elliot Stroud", pos: "DF", club: "" },
      { name: "Daniel Svensson", pos: "DF", club: "" },
      { name: "Taha Ali", pos: "MC", club: "" },
      { name: "Yasin Ayari", pos: "MC", club: "" },
      { name: "Lucas Bergvall", pos: "MC", club: "" },
      { name: "Jesper Karlström", pos: "MC", club: "" },
      { name: "Gustaf Nilsson", pos: "MC", club: "" },
      { name: "Benjamin Nygren", pos: "MC", club: "" },
      { name: "Ken Sema", pos: "MC", club: "" },
      { name: "Mattias Svanberg", pos: "MC", club: "" },
      { name: "Besfort Zeneli", pos: "MC", club: "" },
      { name: "Viktor Gyökeres", pos: "DL", club: "Arsenal" },
      { name: "Alexander Isak", pos: "DL", club: "Newcastle" },
      { name: "Anthony Elanga", pos: "DL", club: "" },
      { name: "Alexander Bernhardsson", pos: "DL", club: "" },
    ],
  },
  belgica: {
    coach: "Rudi García",
    players: [
      { name: "Thibaut Courtois", pos: "PO", club: "Real Madrid" },
      { name: "Senne Lammens", pos: "PO", club: "Manchester United" },
      { name: "Mike Penders", pos: "PO", club: "Racing Estrasburgo" },
      { name: "Timothy Castagne", pos: "DF", club: "Fulham" },
      { name: "Zeno Debast", pos: "DF", club: "Sporting CP" },
      { name: "Maxim De Cuyper", pos: "DF", club: "Brighton" },
      { name: "Koni De Winter", pos: "DF", club: "AC Milán" },
      { name: "Brandon Mechele", pos: "DF", club: "Club Brujas" },
      { name: "Thomas Meunier", pos: "DF", club: "Lille" },
      { name: "Nathan Ngoy", pos: "DF", club: "Lille" },
      { name: "Joaquin Seys", pos: "DF", club: "Club Brujas" },
      { name: "Arthur Theate", pos: "DF", club: "Eintracht Frankfurt" },
      { name: "Kevin De Bruyne", pos: "MC", club: "Nápoles" },
      { name: "Amadou Onana", pos: "MC", club: "Aston Villa" },
      { name: "Nicolas Raskin", pos: "MC", club: "Rangers" },
      { name: "Youri Tielemans", pos: "MC", club: "Aston Villa" },
      { name: "Hans Vanaken", pos: "MC", club: "Club Brujas" },
      { name: "Axel Witsel", pos: "MC", club: "Girona" },
      { name: "Romelu Lukaku", pos: "DL", club: "Nápoles" },
      { name: "Jérémy Doku", pos: "DL", club: "Manchester City" },
      { name: "Leandro Trossard", pos: "DL", club: "Arsenal" },
      { name: "Charles De Ketelaere", pos: "DL", club: "Atalanta" },
      { name: "Diego Moreira", pos: "DL", club: "Racing Estrasburgo" },
      { name: "Matías Fernández-Pardo", pos: "DL", club: "Lille" },
      { name: "Dodi Lukebakio", pos: "DL", club: "Benfica" },
      { name: "Alexis Saelemaekers", pos: "DL", club: "AC Milán" },
    ],
  },
  "nueva-zelanda": {
    coach: null,
    players: [
      { name: "Tyler Bindon", pos: "DF", club: "" },
      { name: "Michael Boxall", pos: "DF", club: "" },
      { name: "Liberato Cacace", pos: "DF", club: "" },
      { name: "Francis De Vries", pos: "DF", club: "" },
      { name: "Callan Elliot", pos: "DF", club: "" },
      { name: "Tim Payne", pos: "DF", club: "" },
      { name: "Nando Pijnaker", pos: "DF", club: "" },
      { name: "Tommy Smith", pos: "DF", club: "" },
      { name: "Finn Surman", pos: "DF", club: "" },
      { name: "Lachlan Bayliss", pos: "MC", club: "" },
      { name: "Joe Bell", pos: "MC", club: "" },
      { name: "Alex Rufer", pos: "MC", club: "" },
      { name: "Marko Stamenić", pos: "MC", club: "" },
      { name: "Ryan Thomas", pos: "MC", club: "" },
      { name: "Kosta Barbarouses", pos: "DL", club: "" },
      { name: "Matt Garbett", pos: "DL", club: "" },
      { name: "Eli Just", pos: "DL", club: "" },
      { name: "Callum McCowatt", pos: "DL", club: "" },
      { name: "Ben Old", pos: "DL", club: "" },
      { name: "Jesse Randall", pos: "DL", club: "" },
      { name: "Sarpreet Singh", pos: "DL", club: "" },
      { name: "Ben Waine", pos: "DL", club: "" },
      { name: "Chris Wood", pos: "DL", club: "" },
    ],
  },
  francia: {
    coach: "Didier Deschamps",
    players: [
      { name: "Mike Maignan", pos: "PO", club: "AC Milán" },
      { name: "Brice Samba", pos: "PO", club: "Stade Rennes" },
      { name: "Robin Risser", pos: "PO", club: "Lens" },
      { name: "William Saliba", pos: "DF", club: "Arsenal" },
      { name: "Dayot Upamecano", pos: "DF", club: "Bayern Múnich" },
      { name: "Ibrahima Konaté", pos: "DF", club: "Liverpool" },
      { name: "Maxence Lacroix", pos: "DF", club: "Crystal Palace" },
      { name: "Jules Koundé", pos: "DF", club: "Barcelona" },
      { name: "Malo Gusto", pos: "DF", club: "Chelsea" },
      { name: "Lucas Digne", pos: "DF", club: "Aston Villa" },
      { name: "Lucas Hernández", pos: "DF", club: "PSG" },
      { name: "Theo Hernández", pos: "DF", club: "Al-Hilal" },
      { name: "Aurélien Tchouaméni", pos: "MC", club: "Real Madrid" },
      { name: "Warren Zaïre-Emery", pos: "MC", club: "PSG" },
      { name: "Manu Koné", pos: "MC", club: "Roma" },
      { name: "N'Golo Kanté", pos: "MC", club: "Fenerbahçe" },
      { name: "Adrien Rabiot", pos: "MC", club: "AC Milán" },
      { name: "Kylian Mbappé", pos: "DL", club: "Real Madrid" },
      { name: "Ousmane Dembélé", pos: "DL", club: "PSG" },
      { name: "Michael Olise", pos: "DL", club: "Bayern Múnich" },
      { name: "Rayan Cherki", pos: "DL", club: "Manchester City" },
      { name: "Désiré Doué", pos: "DL", club: "PSG" },
      { name: "Bradley Barcola", pos: "DL", club: "PSG" },
      { name: "Marcus Thuram", pos: "DL", club: "Inter" },
      { name: "Jean-Philippe Mateta", pos: "DL", club: "" },
      { name: "Maghnes Akliouche", pos: "DL", club: "" },
    ],
  },
  austria: {
    coach: "Ralf Rangnick",
    players: [
      { name: "Patrick Pentz", pos: "PO", club: "Brøndby IF" },
      { name: "Alexander Schlager", pos: "PO", club: "Red Bull Salzburg" },
      { name: "Florian Wiegele", pos: "PO", club: "Viktoria Plzeň" },
      { name: "David Alaba", pos: "DF", club: "Real Madrid" },
      { name: "Kevin Danso", pos: "DF", club: "Tottenham" },
      { name: "Marco Friedl", pos: "DF", club: "Werder Bremen" },
      { name: "Philipp Lienhart", pos: "DF", club: "Friburgo" },
      { name: "Phillipp Mwene", pos: "DF", club: "Mainz 05" },
      { name: "Stefan Posch", pos: "DF", club: "Mainz 05" },
      { name: "Alexander Prass", pos: "DF", club: "Hoffenheim" },
      { name: "Michael Svoboda", pos: "DF", club: "Venezia" },
      { name: "David Affengruber", pos: "DF", club: "Elche" },
      { name: "Christoph Baumgartner", pos: "MC", club: "RB Leipzig" },
      { name: "Carney Chukwuemeka", pos: "MC", club: "Borussia Dortmund" },
      { name: "Florian Grillitsch", pos: "MC", club: "SC Braga" },
      { name: "Konrad Laimer", pos: "MC", club: "Bayern Múnich" },
      { name: "Marcel Sabitzer", pos: "MC", club: "Borussia Dortmund" },
      { name: "Xaver Schlager", pos: "MC", club: "RB Leipzig" },
      { name: "Romano Schmid", pos: "MC", club: "Werder Bremen" },
      { name: "Alessandro Schöpf", pos: "MC", club: "Wolfsberger AC" },
      { name: "Nicolas Seiwald", pos: "MC", club: "RB Leipzig" },
      { name: "Paul Wanner", pos: "MC", club: "PSV Eindhoven" },
      { name: "Marko Arnautović", pos: "DL", club: "" },
    ],
  },
  "corea-del-sur": {
    coach: "Hong Myung-bo",
    players: [
      { name: "Jo Hyeon-Woo", pos: "PO", club: "" },
      { name: "Song Bum-Keun", pos: "PO", club: "" },
      { name: "Kim Seung-Gyu", pos: "PO", club: "" },
      { name: "Kim Moon-Hwan", pos: "DF", club: "Daejeon Hana" },
      { name: "Kim Min-Jae", pos: "DF", club: "Bayern Múnich" },
      { name: "Kim Tae-Hwan", pos: "DF", club: "Kashima Antlers" },
      { name: "Park Jin-Seob", pos: "DF", club: "Jeonbuk Hyundai" },
      { name: "Seol Young-Woo", pos: "DF", club: "Estrella Roja" },
      { name: "Jens Castrop", pos: "DF", club: "Borussia M'gladbach" },
      { name: "Lee Ki-Hyuk", pos: "DF", club: "Gangwon FC" },
      { name: "Lee Tae-Seok", pos: "DF", club: "Austria Viena" },
      { name: "Lee Han-Beom", pos: "DF", club: "Midtjylland" },
      { name: "Cho Yu-Min", pos: "DF", club: "Sharjah FC" },
      { name: "Kim Jin-Gyu", pos: "MC", club: "Jeonbuk Hyundai" },
      { name: "Bae Jun-Ho", pos: "MC", club: "Stoke City" },
      { name: "Paik Seung-Ho", pos: "MC", club: "Birmingham City" },
      { name: "Yang Hyun-Jun", pos: "MC", club: "Celtic" },
      { name: "Eom Ji-Sung", pos: "MC", club: "Swansea City" },
      { name: "Lee Kang-In", pos: "MC", club: "PSG" },
      { name: "Lee Dong-Gyeong", pos: "MC", club: "Ulsan HD" },
      { name: "Lee Jae-Sung", pos: "MC", club: "Mainz 05" },
      { name: "Hwang In-Beom", pos: "MC", club: "Feyenoord" },
      { name: "Hwang Hee-Chan", pos: "MC", club: "Wolverhampton" },
      { name: "Son Heung-Min", pos: "DL", club: "LA FC" },
      { name: "Oh Hyeon-Gyu", pos: "DL", club: "Beşiktaş" },
      { name: "Cho Gue-Sung", pos: "DL", club: "Midtjylland" },
    ],
  },
  portugal: {
    coach: "Roberto Martínez",
    players: [
      { name: "Diogo Costa", pos: "PO", club: "Porto" },
      { name: "José Sá", pos: "PO", club: "Wolverhampton" },
      { name: "Ricardo Velho", pos: "PO", club: "" },
      { name: "Rui Silva", pos: "PO", club: "" },
      { name: "Rúben Dias", pos: "DF", club: "Manchester City" },
      { name: "Gonçalo Inácio", pos: "DF", club: "Sporting CP" },
      { name: "João Cancelo", pos: "DF", club: "" },
      { name: "Diogo Dalot", pos: "DF", club: "Manchester United" },
      { name: "Nuno Mendes", pos: "DF", club: "PSG" },
      { name: "Nélson Semedo", pos: "DF", club: "" },
      { name: "Renato Veiga", pos: "DF", club: "" },
      { name: "Tomás Araújo", pos: "DF", club: "" },
      { name: "Matheus Nunes", pos: "DF", club: "Manchester City" },
      { name: "Bruno Fernandes", pos: "MC", club: "Manchester United" },
      { name: "Bernardo Silva", pos: "MC", club: "Manchester City" },
      { name: "Vitinha", pos: "MC", club: "PSG" },
      { name: "João Neves", pos: "MC", club: "PSG" },
      { name: "Rúben Neves", pos: "MC", club: "" },
      { name: "João Félix", pos: "MC", club: "" },
      { name: "Cristiano Ronaldo", pos: "DL", club: "Al-Nassr" },
      { name: "Rafael Leão", pos: "DL", club: "AC Milán" },
      { name: "Francisco Conceição", pos: "DL", club: "Juventus" },
    ],
  },
};

/* -------------------------------------------------------------------------- */
/* Cross + update                                                              */
/* -------------------------------------------------------------------------- */

function crossUpdate(slug, mdEntry) {
  const filepath = path.join(ROOT, `${slug}.json`);
  if (!fs.existsSync(filepath)) {
    console.warn(`  ✗ JSON no encontrado: ${slug}.json`);
    return { slug, status: "missing", removed: 0, kept: 0, added: 0 };
  }

  const json = JSON.parse(fs.readFileSync(filepath, "utf8"));

  // Update coach name if .md provides one. coach está en wc_2026.coach
  if (mdEntry.coach) {
    if (!json.wc_2026) json.wc_2026 = {};
    if (!json.wc_2026.coach) json.wc_2026.coach = {};
    if (json.wc_2026.coach.name !== mdEntry.coach) {
      json.wc_2026.coach.name = mdEntry.coach;
    }
  }

  if (!json.wc_2026) json.wc_2026 = {};
  const existing = json.wc_2026.likely_squad || [];

  // Bucket existentes por nombre (full_name + display_name) para lookup
  const buckets = existing.map((p) => ({
    player: p,
    keys: [
      p.full_name || "",
      p.display_name || "",
      p.id?.replace(/-/g, " ") || "",
    ].filter(Boolean),
    matched: false,
  }));

  const newSquad = [];
  let added = 0;
  let kept = 0;

  for (const mdPlayer of mdEntry.players) {
    const found = buckets.find(
      (b) =>
        !b.matched &&
        b.keys.some((k) => nameMatches(k, mdPlayer.name)),
    );

    if (found) {
      found.matched = true;
      kept += 1;
      // Conserva photo_url, shirt_number_expected, id, club rico, etc.
      // Solo cambia status a "fixed" porque ya es convocatoria oficial.
      const updated = { ...found.player, status: "fixed" };
      // Si .md trae club concreto y JSON no lo tenía o era distinto, actualiza
      if (
        mdPlayer.club &&
        (!found.player.club?.name ||
          stripAccents(found.player.club.name) !== stripAccents(mdPlayer.club))
      ) {
        updated.club = {
          ...(found.player.club || {}),
          name: mdPlayer.club,
        };
      }
      newSquad.push(updated);
    } else {
      added += 1;
      newSquad.push({
        id: slugify(mdPlayer.name),
        full_name: mdPlayer.name,
        display_name: mdPlayer.name,
        position: POS_MAP[mdPlayer.pos] || "MID",
        detailed_position: POS_MAP[mdPlayer.pos] || "MID",
        club: mdPlayer.club
          ? { name: mdPlayer.club, country_iso: null, league: null }
          : null,
        shirt_number_expected: null,
        status: "fixed",
        photo_url: null,
      });
    }
  }

  const removed = buckets.filter((b) => !b.matched).length;

  json.wc_2026.likely_squad = newSquad;

  // Marca como convocatoria oficial confirmada
  json.wc_2026.squad_announced = true;
  json.wc_2026.squad_announced_date = "2026-05-19";
  json.wc_2026.squad_source = "Convocatoria oficial federación";

  fs.writeFileSync(filepath, JSON.stringify(json, null, 2) + "\n", "utf8");

  return { slug, status: "updated", removed, kept, added };
}

/* -------------------------------------------------------------------------- */
/* Run                                                                         */
/* -------------------------------------------------------------------------- */

console.log("Cruzando convocatorias definitivas Mundial 2026...\n");

const results = [];
for (const [slug, entry] of Object.entries(SQUADS)) {
  results.push(crossUpdate(slug, entry));
}

console.log("\nResumen:");
console.log(
  "país".padEnd(20) +
    "removed".padStart(10) +
    "kept".padStart(8) +
    "added".padStart(8) +
    "total".padStart(8),
);
for (const r of results) {
  console.log(
    r.slug.padEnd(20) +
      String(r.removed).padStart(10) +
      String(r.kept).padStart(8) +
      String(r.added).padStart(8) +
      String(r.kept + r.added).padStart(8),
  );
}
console.log(`\n✓ ${results.filter((r) => r.status === "updated").length}/${results.length} JSON actualizados`);
