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
  // Transfermarkt — Bélgica (verein 3382).
  belgica: {
    "Thibaut Courtois": 25, "Maarten Vandevoordt": 8, "Matz Sels": 7, "Mike Penders": 5,
    "Senne Lammens": 4.5, "Zeno Debast": 24, "Wout Faes": 20, "Arthur Theate": 20,
    "Koni De Winter": 12, "Ameen Al-Dakhil": 10, "Brandon Mechele": 3, "Maxim De Cuyper": 12,
    "Joaquin Seys": 7, "Timothy Castagne": 15, "Thomas Meunier": 2, "Amadou Onana": 55,
    "Nicolas Raskin": 6.5, "Charles Vanhoutte": 5, "Axel Witsel": 2.5, "Jorthy Mokio": 1.5,
    "Youri Tielemans": 30, "Bryan Heynen": 10, "Alexis Saelemaekers": 12, "Diego Moreira": 6,
    "Charles De Ketelaere": 38, "Kevin De Bruyne": 35, "Hans Vanaken": 6, "Jérémy Doku": 60,
    "Leandro Trossard": 30, "Malick Fofana": 25, "Dodi Lukébakio": 20, "Loïs Openda": 60,
    "Romelu Lukaku": 25, "Michy Batshuayi": 7, "Romeo Vermant": 4,
  },
  // Transfermarkt — Croacia (verein 3556).
  croacia: {
    "Dominik Livakovic": 11, "Dominik Kotarski": 8, "Ivica Ivusic": 2.3, "Ivor Pandur": 2,
    "Josko Gvardiol": 75, "Josip Sutalo": 18, "Marin Pongracic": 10, "Luka Vuskovic": 10,
    "Duje Caleta-Car": 8, "Martin Erlić": 5, "Borna Sosa": 6, "Domagoj Bradarić": 4,
    "Josip Stanisic": 28, "Josip Juranovic": 6, "Ivan Smolcic": 2, "Kristijan Jakic": 6.5,
    "Nikola Moro": 5, "Mateo Kovacic": 28, "Luka Sucic": 18, "Mario Pašalić": 13,
    "Petar Sučić": 12, "Luka Modrić": 5, "Lovro Majer": 20, "Martin Baturina": 20,
    "Nikola Vlašić": 7, "Toni Fruk": 5, "Andrej Kramaric": 4, "Mislav Orsic": 1.7,
    "Ivan Perišić": 1.5, "Marco Pašalić": 4, "Igor Matanovic": 8, "Petar Musa": 7,
    "Ante Budimir": 5, "Franjo Ivanović": 4,
  },
  // Transfermarkt — Colombia (verein 3816).
  colombia: {
    "Kevin Mier": 8, "Álvaro Montero": 1.5, "Camilo Vargas": 1, "David Ospina": 0.6,
    "Davinson Sánchez": 19, "Jhon Lucumí": 18, "Yerson Mosquera": 8, "Willer Ditta": 6,
    "Carlos Cuesta": 5, "Yerry Mina": 3, "Deiver Machado": 3.5, "Johan Mojica": 2.2,
    "Cristián Borja": 2, "Álvaro Angulo": 1.2, "Daniel Muñoz": 25, "Santiago Arias": 2.2,
    "Andrés Felipe Román": 1.4, "Jefferson Lerma": 14, "Richard Ríos": 14, "Kevin Castaño": 6,
    "Juan Portilla": 3.5, "Gustavo Puerta": 3.5, "Rafael Carrascal": 0.35, "Jorge Carrascal": 7,
    "James Rodríguez": 2.5, "Juan Fernando Quintero": 2.5, "Luis Díaz": 85, "Jáminton Campaz": 6,
    "Andrés Gómez": 5, "Johan Carbonero": 2, "Yáser Asprilla": 18, "Jhon Arias": 16,
    "Marino Hinestroza": 2.8, "Kevin Serna": 1.2, "Jhon Durán": 40, "Cucho Hernández": 18,
    "Jhon Córdoba": 14, "Rafael Borré": 8, "Luis Suárez": 5, "Dayro Moreno": 0.1,
  },
  // Transfermarkt — Suiza (verein 3384).
  suiza: {
    "Gregor Kobel": 40, "Pascal Loretz": 4, "Marvin Keller": 3.5, "Yvon Mvogo": 3,
    "Manuel Akanji": 40, "Aurèle Amenda": 9.5, "Nico Elvedi": 8, "Albian Hajdari": 7,
    "Becir Omeragic": 5, "Luca Jaquez": 4.5, "Cédric Zesiger": 4, "Eray Cömert": 3,
    "Adrian Bajrami": 1.5, "Stefan Gartenmann": 1.2, "Ulisses Garcia": 4, "Miro Muheim": 2.7,
    "Ricardo Rodríguez": 2.5, "Isaac Schmidt": 2.2, "Zachary Athekame": 3, "Lucas Blondel": 2.2,
    "Silvan Widmer": 1.5, "Denis Zakaria": 30, "Granit Xhaka": 17, "Ardon Jashari": 11,
    "Michel Aebischer": 10, "Djibril Sow": 7.5, "Remo Freuler": 6.5, "Vincent Sierro": 4,
    "Simon Sohm": 4, "Johan Manzambi": 0.75, "Joël Monteiro": 7, "Fabian Rieder": 10,
    "Alvyn Sanches": 9, "Christian Fassnacht": 2, "Rubén Vargas": 7, "Dan Ndoye": 25,
    "Zeki Amdouni": 15, "Breel Embolo": 12, "Andi Zeqiri": 4, "Cedric Itten": 2,
  },
  // Transfermarkt — Senegal (verein 3499).
  senegal: {
    "Yehvann Diouf": 9, "Edouard Mendy": 6, "Mory Diaw": 1, "Moussa Niakhaté": 15,
    "Kalidou Koulibaly": 8, "Mamadou Sarr": 8, "Abdou Diallo": 6, "Antoine Mendy": 3,
    "Moustapha Mbow": 1, "Abdoulaye Seck": 0.7, "El Hadji Malick Diouf": 16, "Ismail Jakobs": 8,
    "Moussa Ndiaye": 3, "Ilay Camara": 3, "Dion Lopy": 6, "Nampalys Mendy": 2,
    "Idrissa Gueye": 2, "Cheikh Niasse": 1.5, "Mamadou Lamine Camara": 0.75, "Pape Matar Sarr": 45,
    "Habib Diarra": 20, "Lamine Camara": 20, "Pape Gueye": 8, "Rassoul Ndiaye": 2.5,
    "Pathé Ciss": 2, "Krépin Diatta": 10, "Abdallah Sima": 10, "Sadio Mané": 9,
    "Assane Diao": 9, "Cheikh Sabaly": 3, "Ismaïla Sarr": 20, "Iliman Ndiaye": 18,
    "Ibrahim Mbaye": 2, "Nicolas Jackson": 55, "Boulaye Dia": 15, "Habib Diallo": 8,
    "Cherif Ndiaye": 4,
  },
  // Transfermarkt — Marruecos (verein 3575).
  marruecos: {
    "Yassine Bounou": 7, "El Mehdi Benabid": 1.6, "Salaheddine Chihab": 1, "Munir El Kajoui": 0.85,
    "Nayef Aguerd": 35, "Abdel Abqar": 7.5, "Romain Saïss": 3, "Soufiane Bouftini": 1.8,
    "Jawad El Yamiq": 1.5, "Adam Masina": 1.5, "Jamal Harkass": 1.4, "Souffian El Karouani": 5,
    "Anass Salah-Eddine": 5, "Adam Aznou": 3, "Youssef Belammari": 1.7, "Achraf Hakimi": 60,
    "Noussair Mazraoui": 32, "Zakaria El Ouahdi": 10, "Omar El Hilali": 3, "Mohamed Chibi": 1.2,
    "Sofyan Amrabat": 22, "Aschraf El Mahdioui": 3, "Oussama Targhalline": 3, "Oussama El Azzouzi": 2,
    "Azzedine Ounahi": 10, "Amir Richardson": 9, "Neil El Aynaoui": 8, "Walid El Karti": 1.5,
    "Bilal Nadir": 0.5, "Bilal El Khannouss": 30, "Ismael Saibari": 23, "Oussama Tannane": 1.6,
    "Eliesse Ben Seghir": 30, "Amine Adli": 22, "Abde Ezzalzouli": 15, "Sofiane Diop": 12,
    "Osame Sahraoui": 12, "Soufiane Rahimi": 7.5, "Mounir Chouiar": 3, "Brahim Díaz": 35,
    "Ilias Akhomach": 15, "Chemsdine Talbi": 3, "Youssef En-Nesyri": 22, "Tarik Tissoudali": 5,
    "Ayoub El Kaabi": 5, "Walid Azaro": 4.5, "Hamza Igamane": 2.5, "Abderrazak Hamdallah": 2,
    "Karim El Berkaoui": 1,
  },
  // Transfermarkt — Japón (verein 3435).
  japon: {
    "Zion Suzuki": 9, "Leo Kokubo": 2.5, "Keisuke Osako": 1.7, "Kosei Tani": 1,
    "Hiroki Ito": 30, "Ko Itakura": 15, "Koki Machida": 10, "Tsuyoshi Watanabe": 9,
    "Hayato Araki": 1.4, "Shogo Taniguchi": 1.2, "Naomichi Ueda": 1, "Yuta Nakayama": 1,
    "Taiyo Koga": 1, "Kota Takai": 0.55, "Yuto Nagatomo": 0.15, "Yukinari Sugawara": 12,
    "Daiki Hashioka": 2, "Wataru Endo": 12, "Kaishu Sano": 7, "Ayumu Seko": 1,
    "Satoshi Tanaka": 0.9, "Sho Inagaki": 0.75, "Hidemasa Morita": 15, "Reo Hatate": 11,
    "Hayao Kawabe": 4, "Kodai Sano": 4, "Ao Tanaka": 4, "Joel Chima Fujita": 1.8,
    "Daichi Kamada": 15, "Ryoya Morishita": 2, "Kaoru Mitoma": 45, "Takumi Minamino": 15,
    "Keito Nakamura": 12, "Daizen Maeda": 8, "Koki Saito": 4, "Takefusa Kubo": 40,
    "Ritsu Doan": 22, "Junya Ito": 8, "Yuki Soma": 1.3, "Yuito Suzuki": 7,
    "Kyogo Furuhashi": 14, "Ayase Ueda": 8, "Shuto Machino": 3, "Koki Ogawa": 3,
    "Mao Hosoya": 1.6, "Yuki Ohashi": 1.5,
  },
  // Transfermarkt — Estados Unidos (verein 3505).
  "estados-unidos": {
    "Matt Turner": 4, "Patrick Schulte": 3.5, "Roman Celentano": 2.5, "Chris Brady": 2.5,
    "Zack Steffen": 2, "Matt Freese": 0.6, "Cameron Carter-Vickers": 14, "Chris Richards": 12,
    "Auston Trusty": 8, "Mark McKenzie": 6, "Miles Robinson": 5, "Walker Zimmerman": 3.5,
    "Tristan Blackmon": 2, "George Campbell": 1.2, "Tim Ream": 0.4, "John Tolkin": 4,
    "DeJuan Jones": 3.5, "Sergiño Dest": 22, "Joe Scally": 10, "Marlon Fossey": 4,
    "Shaq Moore": 1.2, "Nathan Harriel": 1.2, "Tyler Adams": 15, "Tanner Tessmann": 6,
    "James Sands": 3, "Weston McKennie": 24, "Yunus Musah": 22, "Johnny Cardoso": 20,
    "Jack McGlynn": 4.5, "Quinn Sullivan": 4.5, "Benja Cremaschi": 4, "Cristian Roldán": 4,
    "Aidan Morris": 3.5, "Timothy Tillman": 2.5, "Luca de la Torre": 1.5, "Sebastian Berhalter": 1,
    "Timothy Weah": 17, "Diego Luna": 6, "Malik Tillman": 30, "Giovanni Reyna": 12,
    "Brenden Aaronson": 12, "Paxten Aaronson": 6, "Brian Gutiérrez": 4, "Max Arfsten": 1.2,
    "Christian Pulisic": 50, "Álex Zendejas": 5, "Indiana Vassilev": 2, "Folarin Balogun": 25,
    "Ricardo Pepi": 18, "Josh Sargent": 13, "Haji Wright": 8.5, "Brian White": 3.5,
    "Damion Downs": 3, "Patrick Agyemang": 2.5,
  },
  // Transfermarkt — Escocia (verein 3380).
  escocia: {
    "Angus Gunn": 2.5, "Liam Kelly": 0.8, "Zander Clark": 0.5, "Robby McCrorie": 0.5,
    "Cieran Slicker": 0.3, "Craig Gordon": 0.1, "Scott McKenna": 6, "John Souttar": 4.5,
    "Ryan Porteous": 3, "Jack Hendry": 2.5, "Grant Hanley": 0.7, "Andrew Robertson": 25,
    "Kieran Tierney": 10, "Josh Doig": 4.5, "Aaron Hickey": 22, "Nathan Patterson": 15,
    "Anthony Ralston": 2, "Max Johnston": 1.5, "Billy Gilmour": 16, "Connor Barron": 2.5,
    "Scott McTominay": 40, "John McGinn": 23, "Lewis Ferguson": 22, "Ryan Christie": 12,
    "Andrew Irving": 5, "Lennon Miller": 4, "Kenny McLean": 0.8, "Ben Gannon-Doak": 10,
    "Ché Adams": 15, "Tommy Conway": 6, "George Hirst": 5, "Lawrence Shankland": 3,
    "Kevin Nisbet": 2.5, "Lyndon Dykes": 1.5, "James Wilson": 0.8, "Kieron Bowie": 0.5,
  },
  // Transfermarkt — Austria (verein 3383).
  austria: {
    "Patrick Pentz": 3, "Tobias Lawal": 2.5, "Alexander Schlager": 2.5, "Nikolas Polster": 1,
    "Nicolas Schmid": 0.4, "Kevin Danso": 25, "Philipp Lienhart": 15, "Stefan Posch": 10,
    "David Alaba": 10, "Marco Friedl": 10, "Maximilian Wöber": 8, "Samson Baidoo": 6,
    "Leopold Querfeld": 5, "Gernot Trauner": 3, "Jonas Auer": 2, "Phillipp Mwene": 1.8,
    "Konrad Laimer": 25, "Stefan Lainer": 1.8, "Nicolas Seiwald": 16, "Florian Grillitsch": 3.5,
    "Xaver Schlager": 28, "Marcel Sabitzer": 15, "Alessandro Schöpf": 0.8, "Nikolas Veratschnig": 0.8,
    "Alexander Prass": 9, "Christoph Baumgartner": 18, "Romano Schmid": 15, "Muhammed Cham": 5.5,
    "Kevin Stöger": 4.5, "Marco Grüll": 4, "Thierno Ballo": 3, "Mathias Honsak": 1.5,
    "Patrick Wimmer": 12, "Nikolaus Wurmbrand": 1, "Michael Gregoritsch": 6, "Marko Arnautovic": 3.5,
    "Raul Florucz": 1.5, "Andreas Weimann": 0.8,
  },
  // Transfermarkt — Noruega (verein 3440).
  noruega: {
    "Sander Tangvik": 1.7, "Egil Selvik": 1.7, "Mathias Dyngeland": 1, "Ørjan Nyland": 1,
    "Kristoffer Ajer": 18, "Andreas Hanche-Olsen": 7, "Leo Østigård": 7, "Sondre Langås": 2.3,
    "Stian Gregersen": 2, "Tobias Guddal": 2, "Jostein Gundersen": 1.5, "Eivind Helland": 1,
    "Torbjørn Heggem": 1, "David Møller Wolfe": 4.5, "Fredrik Bjørkan": 2.5, "Julian Ryerson": 20,
    "Marcus Pedersen": 4.5, "Sebastian Sebulonsen": 1.5, "Sander Berge": 20, "Patrick Berg": 5,
    "Sverre Nypan": 12, "Kristian Thorstvedt": 9, "Felix Horn Myhre": 4, "Lasse Berg Johnsen": 4,
    "Morten Thorsby": 3, "Aron Dønnum": 4, "Martin Ødegaard": 110, "Thelo Aasgaard": 1,
    "Antonio Nusa": 28, "Andreas Schjelderup": 10, "Jens Petter Hauge": 4.5, "Kristian Arnstad": 2,
    "Oscar Bobb": 25, "Erling Haaland": 200, "Jørgen Strand Larsen": 27, "Alexander Sørloth": 25,
    "Erik Botheim": 4, "Aune Heggebø": 2.5,
  },
  // Transfermarkt — Suecia (verein 3557).
  suecia: {
    "Viktor Johansson": 5, "Oliver Dovin": 2.5, "Jacob Widell Zetterström": 2.5, "Robin Olsen": 1.5,
    "Noel Törnqvist": 1.2, "Kristoffer Nordfeldt": 0.2, "Isak Hien": 30, "Victor Lindelöf": 10,
    "Hjalmar Ekdal": 6.5, "Carl Starfelt": 6, "Victor Eriksson": 2, "Gustaf Lagerbielke": 2,
    "John Mellberg": 1.5, "Gabriel Gudmundsson": 7, "Daniel Svensson": 5.5, "Samuel Dahl": 4,
    "Ken Sema": 1.5, "Emil Holm": 7, "Emil Krafth": 2.5, "Jesper Karlström": 2.5,
    "Hugo Larsson": 35, "Lucas Bergvall": 12, "Mattias Svanberg": 12, "Yasin Ayari": 12,
    "Anton Salétros": 2.5, "Besfort Zeneli": 2.5, "Niclas Eliasson": 4.5, "Sebastian Nanasi": 15,
    "Benjamin Nygren": 3, "Hugo Bolin": 5, "Emil Forsberg": 4.5, "Momodou Sonko": 4,
    "Anthony Elanga": 25, "Roony Bardghji": 9, "Jordan Larsson": 2, "Alexander Bernhardsson": 1.5,
    "Alexander Isak": 75, "Viktor Gyökeres": 75, "Gustaf Nilsson": 7, "Isac Lidberg": 3,
  },
  // Transfermarkt — Túnez (verein 3670).
  tunez: {
    "Bechir Ben Said": 0.8, "Aymen Dahmen": 0.65, "Sabri Ben Hessen": 0.3, "Montassar Talbi": 5,
    "Yassine Meriah": 1.5, "Alaa Ghram": 1.5, "Dylan Bronn": 1.3, "Nader Ghandri": 0.9,
    "Oussama Haddadi": 0.4, "Ali Abdi": 3, "Mohamed Amine Ben Hamida": 0.65, "Ali Maâloul": 0.5,
    "Yan Valery": 1, "Ellyes Skhiri": 9, "Mohamed Belhadj Mahmoud": 3, "Aïssa Laïdouni": 5,
    "Anis Ben Slimane": 2.5, "Mohamed Ali Ben Romdhane": 2, "Ferjani Sassi": 1.4, "Sayfallah Ltaief": 2,
    "Hannibal": 9, "Firas Ben Larbi": 4.5, "Ismaël Gharbi": 7.5, "Elias Saad": 4,
    "Elias Achouri": 3.5, "Naïm Sliti": 2.5, "Mortadha Ben Ouanes": 1.5, "Sebastian Tounekti": 1,
    "Amor Layouni": 0.75, "Seifeddine Jaziri": 0.7, "Firas Chaouat": 0.5, "Issam Jebali": 0.3,
  },
  // Transfermarkt — Egipto (verein 3672).
  egipto: {
    "Mohamed El Shenawy": 1.8, "Ahmed El Shenawy": 0.7, "Mohamed Sobhi": 0.6, "Mohamed Abdelmonem": 4,
    "Ramy Rabia": 0.8, "Yasser Ibrahim": 0.6, "Mahmoud El Wensh": 0.5, "Mohamed Hamdi": 1.2,
    "Ahmed Fatouh": 0.6, "Karim Fouad": 0.6, "Mohamed Hany": 1.5, "Mohamed Elneny": 3.2,
    "Hamdy Fathy": 2.2, "Marwan Ateya": 2.2, "Mohanad Lasheen": 1.3, "Nabil Dunga": 1.2,
    "Emam Ashour": 3, "Akram Tawfik": 1, "Afsha": 1.2, "Trezeguet": 7.5, "Ibrahim Adel": 2,
    "Mohamed Salah": 55, "Zizo": 4, "Mostafa Fathi": 1.5, "Omar Marmoush": 60,
    "Mostafa Mohamed": 6, "Mohamed Sherif": 1,
  },
  // Transfermarkt — Corea del Sur (verein 3589). Claves en orden coreano (apellido primero) para casar con el roster.
  "corea-del-sur": {
    "Kim Seung-Gyu": 0.7, "Song Bum-Keun": 0.85, "Jo Hyeon-Woo": 0.85, "Kim Moon-Hwan": 0.85,
    "Kim Min-Jae": 45, "Park Jin-Seob": 0.65, "Seol Young-Woo": 2, "Jens Castrop": 3,
    "Lee Tae-Seok": 0.65, "Lee Han-Beom": 1, "Cho Yu-Min": 2, "Kim Jin-Gyu": 0.8,
    "Bae Jun-Ho": 1.5, "Paik Seung-Ho": 1.2, "Yang Hyun-Jun": 2, "Eom Ji-Sung": 1.2,
    "Lee Kang-In": 30, "Lee Dong-Gyeong": 1.2, "Lee Jae-Sung": 2.5, "Hwang In-Beom": 12,
    "Hwang Hee-Chan": 22, "Son Heung-Min": 38, "Oh Hyeon-Gyu": 3, "Cho Gue-Sung": 4.5,
  },
  // Transfermarkt — Sudáfrica (verein 3806).
  sudafrica: {
    "Ronwen Williams": 1, "Ricardo Goss": 0.7, "Sipho Chaine": 0.7, "Siyabonga Ngezana": 2.2,
    "Nkosinathi Sibisi": 1.4, "Thabo Moloisane": 0.65, "Grant Kekana": 0.6, "Aubrey Modiba": 1.6,
    "Fawaaz Basadien": 1.2, "Terrence Mashego": 0.55, "Khuliso Mudau": 1.4, "Thapelo Morena": 1.2,
    "Nyiko Mobbie": 1.2, "Deano Van Rooyen": 1.2, "Teboho Mokoena": 2.4, "Bathusi Aubaas": 0.5,
    "Jayden Adams": 1, "Sipho Mbule": 0.8, "Luke Le Roux": 0.7, "Neo Maema": 1.5,
    "Patrick Maswanganyi": 1.4, "Ndabayithethwa Ndlondlo": 0.85, "Relebohile Mofokeng": 0.8,
    "Shandre Campbell": 0.8, "Keagan Dolly": 0.6, "Oswin Appollis": 0.6, "Percy Tau": 1.5,
    "Elias Mokwana": 0.9, "Lyle Foster": 9, "Iqraam Rayners": 1.8, "Zakhele Lepasa": 0.65,
    "Evidence Makgopa": 0.65,
  },
  // Transfermarkt — Bosnia y Herzegovina (verein 3446).
  bosnia: {
    "Nikola Vasilj": 3, "Martin Zlomislic": 1, "Vedad Muftic": 0.5, "Sead Kolasinac": 10,
    "Adrian Leon Barisic": 4, "Tarik Muharemović": 3.5, "Stjepan Radeljic": 2, "Dennis Hadzikadunic": 1.7,
    "Nikola Katic": 1.5, "Nihad Mujakic": 1, "Ermin Bicakcic": 0.4, "Emir Karic": 0.7,
    "Amar Dedić": 15, "Jusuf Gazibegovic": 5, "Amir Hadziahmetovic": 5.5, "Ivan Šunjić": 1.3,
    "Dzenis Burnic": 1.2, "Denis Huseinbasic": 3.5, "Benjamin Tahirović": 3.5, "Armin Gigovic": 3,
    "Ivan Basic": 1.2, "Dario Saric": 0.75, "Amar Memić": 0.6, "Haris Hajradinovic": 2,
    "Nail Omerovic": 1.5, "Luka Menalo": 0.3, "Esmir Bajraktarevic": 3.5, "Enver Kulasin": 0.7,
    "Ermedin Demirovic": 28, "Samed Bazdar": 4, "Haris Tabakovic": 3, "Edin Dzeko": 2.2,
    "Luka Kulenovic": 1,
  },
  // Transfermarkt — Canadá (verein 3510).
  canada: {
    "Maxime Crépeau": 3.5, "Dayne St. Clair": 2, "Tom McGill": 0.6, "Owen Goodman": 0.5,
    "Moïse Bombito": 7, "Derek Cornelius": 4, "Alfie Jones": 4, "Kamal Miller": 2.8,
    "Joel Waterman": 2.5, "Alphonso Davies": 50, "Sam Adekugbe": 1, "Alistair Johnston": 9,
    "Jahkeele Marshall-Rutty": 1.5, "Richie Laryea": 1.2, "Niko Sigur": 4, "Ismaël Koné": 12,
    "Stephen Eustaquio": 11, "Jonathan Osorio": 2, "Mathieu Choinière": 2, "Nathan-Dylan Saliba": 2,
    "Ali Ahmed": 3, "Jacob Shaffelburg": 5, "Liam Millar": 3.5, "Jayden Nelson": 1.5,
    "Junior Hoilett": 0.1, "Tajon Buchanan": 8, "Jonathan David": 45, "Cyle Larin": 3.5,
    "Tani Oluwaseyi": 3, "Theo Bair": 1.8, "Promise David": 1.5, "Daniel Jebbison": 1.2,
  },
  // Transfermarkt — Costa de Marfil (verein 3591).
  "costa-de-marfil": {
    "Alban Lafont": 7, "Yahia Fofana": 4.5, "Mohamed Koné": 1.7, "Ousmane Diomande": 40,
    "Odilon Kossounou": 30, "Evan Ndicka": 25, "Wilfried Singo": 25, "Emmanuel Agbadou": 10,
    "Cédric Kipré": 3, "Willy Boly": 2, "Jean-Philippe Gbamin": 2, "Ghislain Konan": 5,
    "Christopher Operi": 4, "Hassane Kamara": 3.5, "Guéla Doué": 8, "Ibrahim Sangaré": 28,
    "Mory Gbane": 2.5, "Jean-Eudes Aholou": 1.5, "Kader Keita": 0.85, "Jean Michaël Seri": 0.75,
    "Franck Kessié": 15, "Seko Fofana": 12, "Mohamed Diomandé": 6, "Lazare Amani": 3.5,
    "Mario Dorgeles": 3.5, "Simon Adingra": 30, "Jérémie Boga": 15, "Bazoumana Touré": 9,
    "Wilfried Zaha": 8, "Parfait Guiagon": 2, "Amad Diallo": 25, "Evann Guessand": 20,
    "Nicolas Pépé": 7.5, "Emmanuel Latte Lath": 10, "Oumar Diakité": 9, "Vakoun Bayo": 4.5,
    "Jean-Philippe Krasso": 4, "Sébastien Haller": 3,
  },
  // Transfermarkt — Panamá (verein 3577).
  panama: {
    "Luis Mejía": 0.4, "Orlando Mosquera": 0.35, "César Samudio": 0.3, "José Córdoba": 4.8,
    "Andrés Andrade": 2, "Edgardo Fariña": 1, "Fidel Escobar": 0.35, "Jiovany Ramos": 0.3,
    "Jorge Gutiérrez": 0.325, "Éric Davis": 0.1, "Amir Murillo": 7, "César Blackman": 2,
    "Iván Anderson": 0.45, "Cristian Martínez": 0.7, "Carlos Harvey": 0.4, "Aníbal Godoy": 0.2,
    "Adalberto Carrasquilla": 4.5, "José Luis Rodríguez": 1.8, "Ismael Díaz": 1.2, "Janpol Morales": 0.6,
    "Kahiser Lenis": 0.45, "Yoel Bárcenas": 1, "Alberto Quintero": 0.1, "Eduardo Guerrero": 2.5,
    "José Fajardo": 1.2, "Tomás Rodríguez": 0.5, "Cecilio Waterman": 0.4,
  },
  // Transfermarkt — Curazao (verein 32364).
  curazao: {
    "Eloy Room": 0.25, "Trevor Doornbusch": 0.1, "Riechedly Bazoer": 3.5, "Armando Obispo": 3.5,
    "Roshon van Eijma": 0.5, "Juriën Gaari": 0.45, "Jurich Carolina": 0.4, "Cuco Martina": 0.2,
    "Sherel Floranus": 0.75, "Joshua Brenet": 3, "Shurandy Sambo": 2, "Livano Comenencia": 0.8,
    "Tyrique Mercera": 0.35, "Godfried Roemeratoe": 0.6, "Juninho Bacuna": 3.2, "Leandro Bacuna": 0.35,
    "Tahith Chong": 6, "Kenji Gorré": 0.85, "Jeremy Antonisse": 0.7, "Jearl Margaritha": 0.4,
    "Sontje Hansen": 3.5, "Ar'jany Martha": 0.9, "Brandley Kuwas": 0.35, "Jürgen Locadia": 0.3,
    "Jordi Paulina": 0.3, "Rangelo Janga": 0.25, "Gervane Kastaneer": 0.2,
  },
  // Transfermarkt — Cabo Verde (verein 4311).
  "cabo-verde": {
    "Bruno Varela": 4, "Vozinha": 0.05, "Logan Costa": 15, "Diney Borges": 1,
    "Ricardo Santos": 0.6, "Yuran Fernandes": 0.4, "Kelvin Pires": 0.3, "Roberto Lopes": 0.25,
    "Kristopher Da Graca": 0.2, "Stopira": 0.05, "Jordan Semedo": 0.6, "Wagner Pina": 3,
    "Steven Moreira": 1.8, "Sidny Lopes Cabral": 0.325, "Rivaldo": 0.3, "Kevin Lenini": 3.5,
    "Laros Duarte": 0.9, "João Paulo": 0.5, "Jamiro Monteiro": 1.5, "Deroy Duarte": 1,
    "Hélio Varela": 2, "Jovane Cabral": 1.5, "Willy Semedo": 1.2, "Duk": 1.2,
    "Ryan Mendes": 0.7, "Alessio Da Cruz": 0.6, "Garry Rodrigues": 0.9, "Telmo Arcanjo": 0.8,
    "Dailon Livramento": 0.8, "Benchimol": 0.7, "Nuno Da Costa": 0.65,
  },
  // Transfermarkt — RD Congo (verein 3854).
  "rd-congo": {
    "Matthieu Epolo": 3, "Timothy Fayulu": 1.4, "Dimitry Bertaud": 1.2, "Lionel Mpasi-Nzau": 0.6,
    "Chancel Mbemba": 5, "Axel Tuanzebe": 5, "Dylan Batubinsika": 2.5, "Steve Kapuadi": 2.5,
    "Henoc Inonga": 0.45, "Rocky Bushiri": 0.4, "Arthur Masuaku": 3.5, "Joris Kayembe": 2.5,
    "Aaron Wan-Bissaka": 22, "Gédéon Kalulu": 2.5, "Jeremy Ngakia": 1.5, "Brian Bayeye": 0.4,
    "Ngal'ayel Mukau": 10, "Charles Pickel": 2.4, "Noah Sadiki": 8, "Edo Kayembe": 3,
    "Samuel Moutoussamy": 2.2, "Aaron Tshibola": 0.4, "Mario Stroeykens": 14, "Meschack Elia": 5,
    "Gaël Kakuta": 1, "Michel-Ange Balikwisha": 7, "Nathanaël Mbuku": 2, "Brian Cipenga": 0.5,
    "Silas": 10, "Théo Bongonda": 6, "Grady Diangana": 3.8, "Yoane Wissa": 28,
    "Simon Banza": 15, "Samuel Essende": 4.5, "Jackson Muleka": 3.5, "Cédric Bakambu": 1.8,
    "Fiston Mayele": 1.2,
  },
  // Transfermarkt — Nueva Zelanda (verein 9171).
  "nueva-zelanda": {
    "Oliver Sail": 0.5, "Alex Paulsen": 0.45, "Max Crocombe": 0.225, "Tyler Bindon": 1,
    "Bill Tuiloma": 0.5, "Finn Surman": 0.5, "Michael Boxall": 0.2, "Nando Pijnaker": 0.15,
    "Tommy Smith": 0.1, "Liberato Cacace": 2, "Ben Old": 0.8, "Francis de Vries": 0.375,
    "James McGarry": 0.3, "Tim Payne": 0.45, "Storm Roux": 0.35, "Callan Elliot": 0.3,
    "Joe Bell": 1.7, "Alex Rufer": 0.6, "Ryan Thomas": 0.6, "Marko Stamenić": 4.5,
    "Matthew Garbett": 0.55, "Callum McCowatt": 0.8, "Andre de Jong": 0.65, "Sarpreet Singh": 0.3,
    "Elijah Just": 0.3, "Logan Rogerson": 0.2, "Chris Wood": 7, "Ben Waine": 0.6,
    "Kosta Barbarouses": 0.4,
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
