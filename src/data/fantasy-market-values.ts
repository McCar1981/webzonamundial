// src/data/fantasy-market-values.ts
//
// Valores de mercado REALES (fuente: Transfermarkt, transfermarkt.es) por
// jugador y selección, en MILLONES de euros. El precio "fantasy" NO es el valor
// de mercado: el presupuesto del juego es €100M para 15 jugadores, así que el
// valor real se comprime a un coste 3.8–13.5M mediante priceFromMarketValue().
//
// Estructura: MARKET_VALUES[teamSlug][nombreNormalizado] = valorEnMillones.
// El emparejamiento se hace por nombre normalizado (minúsculas, sin acentos),
// por lo que da igual cómo esté escrito en la convocatoria.
//
// Cobertura: se va completando selección a selección desde Transfermarkt. Los
// jugadores sin dato caen al precio SIMULADO (determinista) como respaldo.

/** minúsculas, sin acentos ni signos, espacios colapsados. */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// valorEnMillones de € (Transfermarkt). Ej: 0.3 = 300 mil €.
// Las claves usan los nombres de la convocatoria (data/fantasy-rosters.ts); el
// emparejamiento es por nombre normalizado, así que los acentos dan igual.
export const MARKET_VALUES: Record<string, Record<string, number>> = {
  haiti: {
    "Ricardo Adé": 0.3, // 300 mil €
  },
  // Transfermarkt — convocatoria Argentina (rev. nov. 2025).
  argentina: {
    "Gerónimo Rulli": 5,
    "Emiliano Martínez": 25,
    "Leonardo Balerdi": 20,
    "Nicolás Tagliafico": 7,
    "Gonzalo Montiel": 5,
    "Cristian Romero": 65,
    "Nicolás Otamendi": 1,
    "Facundo Medina": 25,
    "Nahuel Molina": 25,
    "Leandro Paredes": 5,
    "Rodrigo De Paul": 25,
    "Valentín Barco": 6,
    "Giovani Lo Celso": 20,
    "Exequiel Palacios": 40,
    "Alexis Mac Allister": 80,
    "Enzo Fernández": 75,
    "Julián Álvarez": 80,
    "Lionel Messi": 20,
    "Nicolás González": 35,
    "Thiago Almada": 27,
    "Giuliano Simeone": 12,
    "Nico Paz": 20,
    "José Manuel López": 9,
    "Lautaro Martínez": 100,
  },
  // Transfermarkt — España (verein 3375).
  espana: {
    "David Raya": 40, "Unai Simón": 28, "Álex Remiro": 25, "Pau Cubarsí": 70,
    "Robin Le Normand": 40, "Dani Vivian": 40, "Aymeric Laporte": 18, "Dean Huijsen": 18,
    "Raúl Asencio": 7.5, "Alejandro Grimaldo": 40, "Marc Cucurella": 30, "Pedro Porro": 45,
    "Marcos Llorente": 28, "Óscar Mingueza": 20, "Dani Carvajal": 10, "Daniel Carvajal": 10,
    "Rodri": 130, "Martín Zubimendi": 60, "Pedri": 100, "Gavi": 80, "Pablo Barrios": 50,
    "Mikel Merino": 45, "Fabián Ruiz": 35, "Aleix García": 20, "Pablo Fornals": 9,
    "Dani Olmo": 60, "Fermín López": 50, "Isco": 6, "Nico Williams": 70, "Álex Baena": 50,
    "Jesús Rodríguez": 1, "Lamine Yamal": 180, "Yéremy Pino": 30, "Jorge de Frutos": 4,
    "Samu Aghehowa": 50, "Samu Omorodion": 50, "Mikel Oyarzabal": 35, "Ferran Torres": 28,
    "Álvaro Morata": 13, "Ayoze Pérez": 10, "Borja Iglesias": 4,
  },
  // Transfermarkt — Brasil (verein 3439).
  brasil: {
    "Ederson": 30, "Alisson": 25, "Bento": 12, "Lucas Perri": 8, "Hugo Souza": 8,
    "John Victor": 7, "Weverton": 1.8, "Gabriel": 75, "Gabriel Magalhães": 75, "Murillo": 50,
    "Éder Militão": 40, "Marquinhos": 40, "Lucas Beraldo": 30, "Alexsandro": 12, "Léo Ortiz": 11,
    "Fabrício Bruno": 7, "Danilo": 4, "Carlos Augusto": 22, "Caio Henrique": 18,
    "Guilherme Arana": 13, "Douglas Santos": 10, "Luciano Juba": 3, "Alex Sandro": 1.8,
    "Vanderson": 20, "Wesley": 9, "Vitinho": 6, "André": 25, "Fabinho": 18, "Casemiro": 12,
    "Bruno Guimarães": 80, "Joelinton": 40, "João Gomes": 40, "Andrey Santos": 25,
    "Andreas Pereira": 20, "Gerson": 20, "Jean Lucas": 8, "Lucas Paquetá": 40,
    "Vinicius Junior": 200, "Vinícius Júnior": 200, "Raphinha": 80, "Savinho": 55,
    "Gabriel Martinelli": 55, "Samuel Lino": 25, "Rodrygo": 100, "Estêvão": 50,
    "Luiz Henrique": 22, "Antony": 20, "João Pedro": 50, "Matheus Cunha": 50, "Endrick": 40,
    "Richarlison": 30, "Vitor Roque": 20, "Igor Jesus": 15, "Kaio Jorge": 4.5,
  },
  // Transfermarkt — Francia (verein 3377).
  francia: {
    "Mike Maignan": 35, "Lucas Chevalier": 30, "Brice Samba": 15, "William Saliba": 80,
    "Dayot Upamecano": 50, "Ibrahima Konaté": 50, "Benjamin Pavard": 40, "Pierre Kalulu": 26,
    "Loïc Badé": 25, "Clément Lenglet": 7.5, "Theo Hernández": 50, "Lucas Hernández": 32,
    "Lucas Digne": 12, "Jules Koundé": 60, "Malo Gusto": 35, "Jonathan Clauss": 6,
    "Aurélien Tchouaméni": 80, "N'Golo Kanté": 7, "Eduardo Camavinga": 80,
    "Warren Zaïre-Emery": 60, "Khéphren Thuram": 35, "Mattéo Guendouzi": 32, "Manu Koné": 26,
    "Adrien Rabiot": 25, "Rayan Cherki": 30, "Bradley Barcola": 65, "Kingsley Coman": 35,
    "Michael Olise": 65, "Désiré Doué": 40, "Maghnes Akliouche": 40, "Florian Thauvin": 5,
    "Kylian Mbappé": 160, "Marcus Thuram": 75, "Ousmane Dembélé": 55, "Christopher Nkunku": 50,
    "Hugo Ekitiké": 40, "Randal Kolo Muani": 30, "Jean-Philippe Mateta": 20,
  },
  // Transfermarkt — Inglaterra (verein 3299).
  inglaterra: {
    "Jordan Pickford": 20, "James Trafford": 18, "Dean Henderson": 15, "Levi Colwill": 55,
    "Marc Guéhi": 45, "Ezri Konsa": 35, "John Stones": 32, "Jarell Quansah": 22,
    "Trevoh Chalobah": 13, "Dan Burn": 7, "Myles Lewis-Skelly": 10, "Djed Spence": 8,
    "Trent Alexander-Arnold": 75, "Tino Livramento": 35, "Reece James": 30, "Kyle Walker": 10,
    "Adam Wharton": 32, "Jordan Henderson": 3.5, "Declan Rice": 110, "Curtis Jones": 45,
    "Conor Gallagher": 40, "Elliot Anderson": 24, "Ruben Loftus-Cheek": 20, "Alex Scott": 20,
    "Jude Bellingham": 180, "Phil Foden": 140, "Cole Palmer": 130, "Eberechi Eze": 55,
    "Morgan Gibbs-White": 40, "Morgan Rogers": 40, "Anthony Gordon": 60, "Marcus Rashford": 55,
    "Bukayo Saka": 150, "Jarrod Bowen": 45, "Noni Madueke": 40, "Harry Kane": 90,
    "Ollie Watkins": 55, "Dominic Solanke": 45, "Ivan Toney": 28,
  },
  // Transfermarkt — Portugal (verein 3300).
  portugal: {
    "Diogo Costa": 40, "José Sá": 8, "Rui Silva": 5, "Rúben Dias": 75, "Gonçalo Inácio": 45,
    "António Silva": 38, "Renato Veiga": 10, "Nuno Mendes": 55, "Nuno Tavares": 25,
    "Diogo Dalot": 40, "Matheus Nunes": 40, "João Cancelo": 18, "Nélson Semedo": 10,
    "Vitinha": 55, "João Palhinha": 40, "Rúben Neves": 28, "João Neves": 60,
    "Bernardo Silva": 60, "Bruno Fernandes": 55, "Francisco Trincão": 27, "Rodrigo Mora": 10,
    "Rafael Leão": 75, "Diogo Jota": 50, "Pedro Gonçalves": 32, "Pedro Neto": 55,
    "Francisco Conceição": 36, "Geovany Quenda": 30, "Carlos Forbs": 8, "João Félix": 30,
    "Gonçalo Ramos": 50, "Cristiano Ronaldo": 12,
  },
  // Transfermarkt — Alemania (verein 3262).
  alemania: {
    "Marc-André ter Stegen": 15, "Alexander Nübel": 12, "Stefan Ortega": 9, "Oliver Baumann": 3,
    "Finn Dahmen": 2.5, "Nico Schlotterbeck": 40, "Yann Bisseck": 30, "Jonathan Tah": 30,
    "Antonio Rüdiger": 24, "Waldemar Anton": 24, "Malick Thiaw": 20, "Robin Koch": 18,
    "Thilo Kehrer": 15, "Nnamdi Collins": 4, "David Raum": 25, "Maximilian Mittelstädt": 20,
    "Robin Gosens": 8, "Nathaniel Brown": 8, "Ridle Baku": 7, "Aleksandar Pavlovic": 50,
    "Joshua Kimmich": 50, "Angelo Stiller": 32, "Robert Andrich": 15, "Felix Nmecha": 28,
    "Leon Goretzka": 22, "Tom Bischof": 12, "Nadiem Amiri": 11, "Assan Ouédraogo": 10,
    "Pascal Groß": 7, "Jamal Musiala": 140, "Florian Wirtz": 140, "Paul Nebel": 7,
    "Kevin Schade": 22, "Said El Mala": 1, "Leroy Sané": 45, "Karim Adeyemi": 35,
    "Jamie Leweling": 20, "Serge Gnabry": 35, "Maximilian Beier": 30, "Deniz Undav": 28,
    "Jonathan Burkardt": 25, "Niclas Füllkrug": 15, "Tim Kleindienst": 12, "Nick Woltemade": 7.5,
  },
  // Transfermarkt — Países Bajos (verein 3379).
  "paises-bajos": {
    "Bart Verbruggen": 25, "Mark Flekken": 10, "Kjell Scherpen": 4, "Nick Olij": 3.5,
    "Robin Roefs": 1.5, "Micky van de Ven": 55, "Matthijs de Ligt": 45, "Nathan Aké": 35,
    "Jan Paul van Hecke": 32, "Virgil van Dijk": 28, "Stefan de Vrij": 7, "Youri Baas": 6,
    "Ian Maatsen": 32, "Jorrel Hato": 30, "Quilindschy Hartman": 23, "Jeremie Frimpong": 50,
    "Jurriën Timber": 45, "Lutsharel Geertruida": 32, "Mats Wieffer": 30, "Denzel Dumfries": 20,
    "Ryan Gravenberch": 55, "Teun Koopmeiners": 50, "Jerdy Schouten": 32, "Tijjani Reijnders": 50,
    "Frenkie de Jong": 45, "Quinten Timber": 32, "Kenneth Taylor": 16, "Luciano Valente": 1.5,
    "Xavi Simons": 80, "Justin Kluivert": 22, "Sem Steijn": 10, "Cody Gakpo": 60, "Noa Lang": 20,
    "Memphis Depay": 10, "Brian Brobbey": 30, "Donyell Malen": 28, "Emmanuel Emegha": 15,
    "Wout Weghorst": 5,
  },
};

const _index = new Map<string, number>();
for (const [slug, players] of Object.entries(MARKET_VALUES)) {
  for (const [name, value] of Object.entries(players)) {
    _index.set(`${slug}|${normalizeName(name)}`, value);
  }
}

/** Valor de mercado real (millones €) de un jugador, o undefined si no hay dato. */
export function getMarketValue(teamSlug: string, name: string): number | undefined {
  return _index.get(`${teamSlug}|${normalizeName(name)}`);
}

/**
 * Convierte el valor de mercado real (millones €) en el precio fantasy (3.8–13.5M)
 * mediante una curva logarítmica: un crack de ~180M € roza 13.5M y un jugador de
 * ~0.3M € cae al mínimo de 3.8M, manteniendo todo dentro del presupuesto de €100M.
 */
export function priceFromMarketValue(mvMillions: number): number {
  const v = Math.max(0.01, mvMillions);
  const price = 5.0 + 3.5 * Math.log10(v);
  return Math.round(Math.max(3.8, Math.min(13.5, price)) * 10) / 10;
}
