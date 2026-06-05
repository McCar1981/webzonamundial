#!/usr/bin/env node
// scripts/update-squads-2026-06.mjs
//
// Actualiza data/teams/*.json con las convocatorias OFICIALES publicadas por
// api-football el 4 junio 2026 (las 48 selecciones del Mundial 2026):
//   https://www.api-football.com/news/post/fifa-world-cup-2026-lineups-all-teams-coaches-and-players
//
// Cruza la "likely_squad" del JSON con la lista oficial:
//   - elimina jugadores del JSON que NO están en la lista oficial
//   - mantiene los que SÍ están (preserva photo_url, shirt_number_expected, club, id…)
//   - añade los nuevos con photo_url:null, shirt_number_expected:null, status:"fixed"
//   - pone status de TODOS a "fixed" (convocatoria oficial, no proyección)
//   - marca wc_2026.squad_announced=true, fecha y fuente
//
// El artículo lista SOLO nombre + posición (GK/DEF/MID/FWD). No trae clubes ni
// dorsales ni entrenadores; por eso se preserva todo lo ya curado en el JSON.
//
// Uso: node scripts/update-squads-2026-06.mjs

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

/** Comparación tolerante de nombres: ignora tildes, mayúsculas, sufijos,
 *  y orden de tokens (necesario para coreanos: "Seunggyu Kim" ↔ "Kim Seung-Gyu").
 */
function nameMatches(jsonName, officialName) {
  if (!jsonName || !officialName) return false;
  const a = stripAccents(jsonName);
  const b = stripAccents(officialName);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const tokensA = a.split(" ").filter(Boolean);
  const tokensB = b.split(" ").filter(Boolean);
  if (!tokensA.length || !tokensB.length) return false;

  // apellido compartido + inicial de nombre coincidente
  const lastA = tokensA[tokensA.length - 1];
  const lastB = tokensB[tokensB.length - 1];
  if (lastA === lastB) {
    const firstA = tokensA[0]?.[0];
    const firstB = tokensB[0]?.[0];
    if (firstA && firstB && firstA === firstB) return true;
  }

  // independiente del orden: todos los tokens de un nombre aparecen como
  // subcadena en la concatenación del otro (cubre orden invertido + subset).
  // Se exige que el token más largo (>=4) coincida, para evitar falsos
  // positivos por tokens cortos comunes (kim, al, de, ben…).
  const concatA = tokensA.join("");
  const concatB = tokensB.join("");
  const hasDistinctive = (tokens) => tokens.some((t) => t.length >= 4);
  if (hasDistinctive(tokensA) && tokensA.every((t) => concatB.includes(t))) return true;
  if (hasDistinctive(tokensB) && tokensB.every((t) => concatA.includes(t))) return true;
  return false;
}

/* -------------------------------------------------------------------------- */
/* Convocatorias oficiales (api-football, 4 jun 2026)                          */
/* pos: GK | DEF | MID | FWD                                                    */
/* -------------------------------------------------------------------------- */

const SQUADS = {
  alemania: { GK: ["Manuel Neuer","Oliver Baumann","Alexander Nübel"], DEF: ["Antonio Rüdiger","Waldemar Anton","Jonathan Tah","Joshua Kimmich","Nico Schlotterbeck","Nathaniel Brown","David Raum","Malick Thiaw"], MID: ["Aleksandar Pavlović","Leon Goretzka","Jamie Leweling","Jamal Musiala","Pascal Groß","Angelo Stiller","Florian Wirtz","Leroy Sané","Nadiem Amiri","Felix Nmecha","Lennart Karl"], FWD: ["Kai Havertz","Nick Woltemade","Maximilian Beier","Deniz Undav"] },
  inglaterra: { GK: ["Jordan Pickford","Dean Henderson","James Trafford"], DEF: ["Ezri Konsa","Nico O'Reilly","John Stones","Marc Guéhi","Valentino Livramento","Daniel Burn","Reece James","Djed Spence","Jarell Quansah"], MID: ["Declan Rice","Elliot Anderson","Jude Bellingham","Jordan Henderson","Kobbie Mainoo","Morgan Rogers","Eberechi Eze"], FWD: ["Bukayo Saka","Harry Kane","Marcus Rashford","Anthony Gordon","Oliver Watkins","Noni Madueke","Ivan Toney"] },
  austria: { GK: ["Alexander Schlager","Florian Wiegele","Patrick Pentz"], DEF: ["David Affengruber","Kevin Danso","Stefan Posch","David Alaba","Philipp Lienhart","Phillip Mwene","Marco Friedl","Michael Svoboda"], MID: ["Xaver Schlager","Nicolas Seiwald","Marcel Sabitzer","Florian Grillitsch","Carney Chukwuemeka","Romano Schmid","Christoph Baumgartner","Konrad Laimer","Alexander Prass","Paul Wanner","Alessandro Schöpf"], FWD: ["Marko Arnautović","Michael Gregoritsch","Saša Kalajdžić","Patrick Wimmer"] },
  belgica: { GK: ["Thibaut Courtois","Senne Lammens","Mike Penders"], DEF: ["Zeno Debast","Arthur Theate","Brandon Mechele","Maxim De Cuyper","Thomas Meunier","Koni De Winter","Joaquin Seys","Timothy Castagne","Nathan Ngoy"], MID: ["Axel Witsel","Kevin De Bruyne","Youri Tielemans","Diego Moreira","Hans Vanaken","Alexis Saelemaekers","Nicolas Raskin","Amadou Onana"], FWD: ["Romelu Lukaku","Leandro Trossard","Jérémy Doku","Dodi Lukebakio","Charles De Ketelaere","Matías Fernández-Pardo"] },
  bosnia: { GK: ["Nikola Vasilj","Mladen Jurkas","Martin Zlomislić"], DEF: ["Nihad Mujakić","Dennis Hadžikadunic","Tarik Muharemović","Sead Kolašinac","Amar Dedić","Nikola Katić","Stjepan Radeljić","Nidal Čelik"], MID: ["Benjamin Tahirović","Armin Gigović","Ivan Bašić","Ivan Šunjić","Amar Memić","Amir Hadžiahmetović","Dženis Burnić","Ermin Mahmić"], FWD: ["Samed Bazdar","Ermedin Demirović","Edin Džeko","Kerim Alajbegović","Esmir Bajraktarević","Haris Tabaković","Jovo Lukić"] },
  croacia: { GK: ["Dominik Livaković","Ivor Pandur","Dominik Kotarski"], DEF: ["Josip Stanišić","Marin Pongračić","Joško Gvardiol","Duje Čaleta-Car","Josip Šutalo","Kristijan Jakić","Luka Vušković","Martin Erlić"], MID: ["Nikola Moro","Mateo Kovačić","Luka Modrić","Nikola Vlašić","Mario Pašalić","Martin Baturina","Petar Sučić","Toni Fruk","Luka Sučić"], FWD: ["Andrej Kramarić","Ante Budimir","Ivan Perišić","Igor Matanović","Marco Pašalić","Petar Musa"] },
  escocia: { GK: ["Angus Gunn","Liam Kelly","Craig Gordon"], DEF: ["Aaron Hickey","Andy Robertson","Grant Hanley","Kieran Tierney","Jack Hendry","John Souttar","Dominic Hyam","Nathan Patterson","Anthony Ralston","Scott McKenna"], MID: ["Scott McTominay","John McGinn","Tyler Fletcher","Ryan Christie","Lewis Ferguson","Kenny McLean"], FWD: ["Lyndon Dykes","Che Adams","Ross Stewart","Ben Gannon-Doak","George Hirst","Lawrence Shankland","Findlay Curtis"] },
  espana: { GK: ["David Raya","Joan García","Unai Simón"], DEF: ["Marc Pubill","Álex Grimaldo","Eric García","Marcos Llorente","Pedro Porro","Aymeric Laporte","Pau Cubarsí","Marc Cucurella"], MID: ["Mikel Merino","Fabián Ruiz","Pablo Gavira","Álex Baena","Rodrigo Hernández","Martín Zubimendi","Pedro López"], FWD: ["Ferran Torres","Dani Olmo","Yeremy Pino","Nico Williams","Lamine Yamal","Mikel Oyarzabal","Víctor Muñoz","Borja Iglesias"] },
  francia: { GK: ["Brice Samba","Mike Maignan","Robin Risser"], DEF: ["Malo Gusto","Lucas Digne","Dayot Upamecano","Jules Koundé","Ibrahima Konaté","William Saliba","Théo Hernandez","Lucas Hernandez","Maxence Lacroix"], MID: ["Manu Koné","Aurélien Tchouaméni","N'Golo Kanté","Adrien Rabiot","Warren Zaïre-Emery","Rayan Cherki","Maghnes Akliouche"], FWD: ["Ousmane Dembélé","Marcus Thuram","Kylian Mbappé","Michaël Olise","Bradley Barcola","Désiré Doué","Jean-Philippe Mateta"] },
  noruega: { GK: ["Ørjan Nyland","Sander Tangvik","Egil Selvik"], DEF: ["Kristoffer Ajer","Leo Østigård","David Wolfe","Fredrik Bjørkan","Marcus Pedersen","Torbjørn Heggem","Sondre Langas","Henrik Falchener"], MID: ["Morten Thorsby","Patrick Berg","Sander Berge","Martin Ødegaard","Fredrik Aursnes","Kristian Thorstvedt","Thelo Aasgaard","Andreas Schjelderup","Oscar Bobb","Jens Hauge"], FWD: ["Alexander Sørloth","Erling Haaland","Jørgen Larsen","Antonio Nusa","Julian Ryerson"] },
  "paises-bajos": { GK: ["Bart Verbruggen","Robin Roefs","Mark Flekken"], DEF: ["Jurriën Timber","Virgil van Dijk","Nathan Aké","Jan-Paul van Hecke","Mats Wieffer","Micky van de Ven","Denzel Dumfries","Jorrel Hato"], MID: ["Marten de Roon","Justin Kluivert","Ryan Gravenberch","Tijjani Reijnders","Guus Til","Teun Koopmeiners","Frenkie de Jong","Quinten Timber"], FWD: ["Wout Weghorst","Memphis Depay","Cody Gakpo","Noa Lang","Donyell Malen","Brian Brobbey","Crysencio Summerville"] },
  portugal: { GK: ["Diogo Costa","José Sá","Rui Silva"], DEF: ["Nelson Semedo","Rúben Dias","Tomás Araújo","Diogo Dalot","Renato Veiga","Gonçalo Inácio","João Cancelo","Samu Costa","Nuno Mendes"], MID: ["Matheus Nunes","Bruno Fernandes","Bernardo Silva","João Neves","Rúben Neves","Vítor Ferreira"], FWD: ["Cristiano Ronaldo","Gonçalo Ramos","João Félix","Francisco Trincão","Rafael Leão","Pedro Neto","Gonçalo Guedes","Francisco Conceição"] },
  suecia: { GK: ["Jacob Zetterström","Viktor Johansson","Kristoffer Nordfeldt"], DEF: ["Gustaf Lagerbielke","Victor Lindelöf","Isak Hien","Gabriel Gudmundsson","Herman Johansson","Daniel Svensson","Hjalmar Ekdal","Carl Starfelt","Eric Smith","Alexander Bernhardsson","Elliot Stroud"], MID: ["Lucas Bergvall","Benjamin Nygren","Ken Sema","Jesper Karlström","Yasin Ayari","Mattias Svanberg","Besfort Zeneli"], FWD: ["Alexander Isak","Anthony Elanga","Viktor Gyökeres","Gustaf Nilsson","Taha Ali"] },
  suiza: { GK: ["Gregor Kobel","Yvon Mvogo","Marvin Keller"], DEF: ["Miro Muheim","Silvan Widmer","Nico Elvedi","Manuel Akanji","Ricardo Rodríguez","Eray Cömert","Aurèle Amenda","Luca Jaquez"], MID: ["Denis Zakaria","Remo Freuler","Johan Manzambi","Granit Xhaka","Ardon Jashari","Djibril Sow","Michel Aebischer","Fabian Rieder"], FWD: ["Breel Embolo","Dan Ndoye","Christian Fassnacht","Rubén Vargas","Noah Okafor","Zeki Amdouni","Cédric Itten"] },
  "republica-checa": { GK: ["Matěj Kovář","Jindřich Stánek","Lukáš Horníček"], DEF: ["David Zima","Tomáš Holeš","Robin Hranáč","Vladimír Coufal","Štěpán Chaloupek","Ladislav Krejčí","David Jurásek","Jaroslav Zelený","David Doudera"], MID: ["Vladimír Darida","Lukáš Červ","Lukáš Provod","Michal Sadílek","Tomáš Souček","Alexandr Sojka","Hugo Šochůrek"], FWD: ["Adam Hložek","Patrik Schick","Jan Kuchta","Mojmír Chytil","Pavel Šulc","Tomáš Chorý","Denis Višinský"] },
  turquia: { GK: ["Mert Günok","Altay Bayındır","Uğurcan Çakır"], DEF: ["Zeki Çelik","Merih Demiral","Çağlar Söyüncü","Eren Elmalı","Abdülkerim Bardakçı","Ozan Kabak","Mert Müldür","Ferdi Kadıoğlu","Samet Akaydın"], MID: ["Salih Özcan","Orkun Kökcü","Hakan Çalhanoğlu","İsmail Yüksek","Kaan Ayhan"], FWD: ["Kerem Aktürkoğlu","Arda Güler","Deniz Gül","Kenan Yıldız","İrfan Kahveci","Yunus Akgün","Barış Yılmaz","Oğuz Aydın","Can Uzun"] },
  argentina: { GK: ["Juan Musso","Gerónimo Rulli","Emiliano Martínez"], DEF: ["Leonardo Balerdi","Nicolás Tagliafico","Gonzalo Montiel","Lisandro Martínez","Cristian Romero","Nicolás Otamendi","Facundo Medina","Nahuel Molina"], MID: ["Leandro Paredes","Rodrigo de Paul","Valentín Barco","Giovani Lo Celso","Exequiel Palacios","Nicolás González","Alexis Mac Allister","Enzo Fernández"], FWD: ["Julián Álvarez","Lionel Messi","Thiago Almada","Giuliano Simeone","Nicolás Paz","José López","Lautaro Martínez"] },
  brasil: { GK: ["Alisson Becker","Weverton Caldeira","Ederson Moraes"], DEF: ["Wesley","Gabriel Magalhães","Marcos Corrêa","Alex Sandro","Danilo Luiz","Bremer","Léo Pereira","Douglas Santos","Roger Ibanez"], MID: ["Carlos Casimiro","Bruno Guimarães","Fábio Tavares","Danilo Santos","Lucas Paquetá"], FWD: ["Vinícius Júnior","Matheus Cunha","Neymar Santos","Raphael Belloli","Endrick Sousa","Luiz Henrique","Gabriel Martinelli","Igor Thiago","Rayan"] },
  colombia: { GK: ["David Ospina","Camilo Vargas","Álvaro Montero"], DEF: ["Daniel Muñoz","Jhon Lucumí","Santiago Arias","Yerry Mina","Gustavo Puerta","Johan Mojica","Willer Ditta","Deiver Machado","Dávinson Sánchez"], MID: ["Kevin Castaño","Richard Ríos","Jorge Carrascal","James Rodríguez","Jhon Arias","Juan Portilla","Jefferson Lerma","Juan Quintero"], FWD: ["Luis Díaz","Jhon Córdoba","Juan Hernández","Leandro Campaz","Luis Suárez","Andrés Gómez"] },
  ecuador: { GK: ["Hernán Galíndez","Moisés Ramírez","Gonzalo Valle"], DEF: ["Félix Torres","Piero Hincapié","Joel Ordóñez","Willian Pacho","Pervis Estupiñán","Ángelo Preciado","Jackson Porozo","Yaimar Medina"], MID: ["Jordy Alcívar","Anthony Valencia","Kendry Páez","Alan Minda","Pedro Vite","Denil Castillo","Alan Franco","Moisés Caicedo"], FWD: ["John Yeboah","Kevin Rodríguez","Enner Valencia","Jordy Caicedo","Gonzalo Plata","Nilson Angulo","Jeremy Arévalo"] },
  paraguay: { GK: ["Roberto Fernández","Orlando Gill","Gastón Olveira"], DEF: ["Gustavo Velázquez","Omar Alderete","Juan Cáceres","Fabián Balbuena","Junior Alonso","José Canale","Gustavo Gómez","Alexandro Maidana"], MID: ["Ramón Sosa","Diego Gómez","Miguel Almirón","Mauricio","Andrés Cubas","Damián Bobadilla","Braian Ojeda","Matías Galarza","Gustavo Caballero"], FWD: ["Antonio Sanabria","Alejandro Romero","Álex Arce","Julio Enciso","Gabriel Ávalos","Isidro Pitta"] },
  uruguay: { GK: ["Sergio Rochet","Santiago Mele","Fernando Muslera"], DEF: ["José Giménez","Sebastián Cáceres","Ronald Araújo","Guillermo Varela","Mathías Olivera","Matías Viña","Santiago Bueno"], MID: ["Manuel Ugarte","Rodrigo Bentancur","Nicolás de la Cruz","Federico Valverde","Giorgian de Arrascaeta","Agustín Canobbio","Emiliano Martínez","Maximiliano Araújo","Joaquín Piquerez","Juan Sanabria","Rodrigo Zalazar"], FWD: ["Darwin Núñez","Facundo Pellistri","Brian Rodríguez","Rodrigo Aguirre","Federico Viñas"] },
  canada: { GK: ["Dayne St. Clair","Maxime Crépeau","Owen Goodman"], DEF: ["Alistair Johnston","Alfie Jones","Luc de Fougerolles","Joel Waterman","Derek Cornelius","Moïse Bombito","Alphonso Davies","Richie Laryea","Niko Sigur"], MID: ["Mathieu Choinière","Stephen Eustaquio","Ismaël Koné","Liam Millar","Jacob Shaffelburg","Jonathan Osorio","Nathan Saliba","Marcelo Flores"], FWD: ["Cyle Larin","Jonathan David","Tani Oluwaseyi","Tajon Buchanan","Ali Ahmed","Promise David"] },
  "estados-unidos": { GK: ["Matt Turner","Matt Freese","Chris Brady"], DEF: ["Sergiño Dest","Chris Richards","Antonee Robinson","Auston Trusty","Miles Robinson","Tim Ream","Alex Freeman","Max Arfsten","Mark McKenzie","Joe Scally"], MID: ["Tyler Adams","Giovanni Reyna","Weston McKennie","Sebastian Berhalter","Cristian Roldán","Malik Tillman"], FWD: ["Ricardo Pepi","Christian Pulisic","Brenden Aaronson","Haji Wright","Folarin Balogun","Timothy Weah","Alex Zendejas"] },
  mexico: { GK: ["Raúl Rangel","Carlos Acevedo","Guillermo Ochoa"], DEF: ["Jorge Sánchez","César Montes","Edson Álvarez","Johan Vásquez","Israel Reyes","Mateo Chávez","Jesús Gallardo"], MID: ["Erik Lira","Luis Romo","Álvaro Fidalgo","Orbelín Piñeda","Obed Vargas","Gilberto Mora","Luis Chávez","Brian Gutiérrez"], FWD: ["Raúl Jiménez","Alexis Vega","Santiago Giménez","Armando González","Julián Quiñones","César Huerta","Guillermo Martínez","Roberto Alvarado"] },
  curazao: { GK: ["Eloy Room","Tyrick Bodak","Trevor Doornbusch"], DEF: ["Shurandy Sambo","Jurien Gaari","Roshon van Eijma","Sherel Floranus","Armando Obispo","Joshua Brenet","Riechedly Bazoer","Deveron Fonville"], MID: ["Godfried Roemeratoe","Juninho Bacuna","Livano Comenencia","Leandro Bacuna","Arjany Martha","Tahith Chong","Kevin Felida"], FWD: ["Jürgen Locadia","Jeremy Antonisse","Sontje Hansen","Tyrese Noslin","Kenji Gorre","Jearl Margaritha","Brandley Kuwas","Gervane Kastaneer"] },
  haiti: { GK: ["Johny Placide","Alexandre Pierre","Josué Duverger"], DEF: ["Carlens Arcus","Keeto Thermoncy","Ricardo Ade","Hannes Delcroix","Martin Expérience","Markhus Lacroix","Jean-Kevin Duverne","Wilguens Paugain"], MID: ["Carl Sainte","Jean-Ricner Bellegarde","Leverton Pierre","Danley Jean Jacques","Dominique Simon","Woodensky Pierre"], FWD: ["Derrick Etienne","Duckens Nazon","Louicius Deedson","Ruben Providence","Lenny Joseph","Wilson Isidor","Yassin Fortune","Frantzdy Pierrot"] },
  panama: { GK: ["Luis Mejía","César Samudio","Orlando Mosquera"], DEF: ["César Blackman","José Córdoba","Fidel Escobar","Edgardo Farina","Jiovany Ramos","Carlos Harvey","Eric Davis","Andrés Andrade","Amir Murillo","Roderick Miller","Jorge Gutiérrez"], MID: ["Cristian Martínez","José Rodríguez","Adalberto Carrasquilla","Ismael Díaz","Edgar Bárcenas","Alberto Quintero","Aníbal Godoy","César Yanis"], FWD: ["Tomás Rodríguez","José Fajardo","Cecilio Waterman","Azarías Londoño"] },
  sudafrica: { GK: ["Ronwen Williams","Sipho Chaine","Ricardo Goss"], DEF: ["Thabang Matuludi","Khulumani Ndamane","Aubrey Modiba","Mbekezeli Mbokazi","Samukelo Kabini","Nkosinathi Sibisi","Khuliso Mudau","Ime Okon","Olwethu Makhanya","Bradley Cross"], MID: ["Teboho Mokoena","Thalente Mbatha","Themba Zwane","Sphephelo Sithole","Jayden Adams"], FWD: ["Oswin Appollis","Tshepang Moremi","Lyle Foster","Relebohile Mofokeng","Thapelo Maseko","Iqraam Rayners","Evidence Makgopa","Kamogelo Sebelebele"] },
  argelia: { GK: ["Melvin Mastil","Oussama Benbot","Luca Zidane"], DEF: ["Aïssa Mandi","Achraf Abada","Mohamed Tougaï","Zineddine Belaïd","Jaouen Hadjam","Rayan Aït-Nouri","Rafik Belghali","Ramy Bensebaini","Samir Chergui"], MID: ["Ramiz Zerrouki","Houssem Aouar","Fares Chaïbi","Hicham Boudaoui","Nabil Bentaleb","Ibrahim Maza","Yassine Titraoui"], FWD: ["Riyad Mahrez","Amine Gouiri","Anis Hadj Moussa","Nadhir Benbouali","Mohamed Amoura","Adil Boulbina","Fares Ghedjemis"] },
  "cabo-verde": { GK: ["Vozinha","Márcio Rosa","CJ Dos Santos"], DEF: ["Stopira","Diney Borges","Pico Lopes","Logan Costa","Sidny Cabral","Steven Moreira","Wagner Pina","Kelvin Pires"], MID: ["Kevin Pina","Jovane Cabral","João Paulo","Jamiro Monteiro","Garry Rodrigues","Deroy Duarte","Laros Duarte","Yannick Semedo","Willy Semedo","Telmo Arcanjo","Nuno da Costa","Hélio Varela"], FWD: ["Gilson Benchimol","Dailon Livramento","Ryan Mendes"] },
  "costa-de-marfil": { GK: ["Yahia Fofana","Mohamed Koné","Alban Lafont"], DEF: ["Ousmane Diomandé","Ghislain Konan","Wilfried Singo","Odilon Kossounou","Christopher Operi","Guela Doué","Emmanuel Agbadou","Evan Ndicka"], MID: ["Jean Séri","Seko Fofana","Franck Kessié","Ibrahim Sangaré","Parfait Guiagon","Christ Oulai"], FWD: ["Ange-Yoan Bonny","Simon Adingra","Yan Diomandé","Elye Wahi","Oumar Diakité","Amad Diallo","Nicolas Pépé","Evann Guessand","Bazoumana Touré"] },
  egipto: { GK: ["Mohamed Elshenawy","Mahdy Soliman","Mostafa Shoubir","Mohamed Alaa"], DEF: ["Yasser Ibrahim","Mohamed Hany","Hossam Abdelmaguid","Ramy Rabia","Mohamed Abdelmoneim","Ahmed Fatouh","Karim Hafez","Tarek Alaa"], MID: ["Emam Ashour","Mostafa Zico","Hamdy Fathy","Mohanad Lashin","Nabil Donga","Marawan Attia","Mahmoud Saber"], FWD: ["Mahmoud Hassan","Hamza Abdelkarim","Mohamed Salah","Haissem Hassan","Ibrahim Adel","Omar Marmoush","Mahmoud Hamdy"] },
  ghana: { GK: ["Lawrence Zigi","Joseph Anang","Benjamin Asare"], DEF: ["Alidu Seidu","Jonas Adjetey","Abdul Mumin","Gideon Mensah","Baba Rahman","Jerome Opoku","Kojo Oppong","Derrick Luckassen","Marvin Senaya"], MID: ["Caleb Yirenkyi","Thomas Partey","Kwasi Sibo","Antoine Semenyo","Elisha Owusu","Augustine Boakye"], FWD: ["Fatawu Issahaku","Jordan Ayew","Brandon Thomas-Asante","Christopher Baah","Iñaki Williams","Kamaldeen Sulemana","Ernest Nuamah","Prince Adu"] },
  marruecos: { GK: ["Yassine Bounou","Munir El Kajoui","Ahmed Tagnaouti"], DEF: ["Achraf Hakimi","Noussair Mazraoui","Nayef Aguerd","Zakaria El Ouahdi","Issa Diop","Chadi Riad","Youssef Belammari","Redouane Halhal","Anass Salah-Eddine"], MID: ["Sofyan Amrabat","Ayyoub Bouaddi","Chemsdine Talbi","Azzedine Ounahi","Ismaël Saibari","Samir El Mourabet","Gessime Yassine","Bilal El Khannouss","Neil El Aynaoui"], FWD: ["Soufiane Rahimi","Brahim Díaz","Abde Ezzalzouli","Ayoub El Kaabi","Ayoub Amaimouni"] },
  "rd-congo": { GK: ["Lionel Mpasi","Timothy Fayulu","Matthieu Epolo"], DEF: ["Aaron Wan-Bissaka","Steve Kapuadi","Axel Tuanzebe","Dylan Batubinsika","Joris Kayembe","Chancel Mbemba","Gédéon Kalulu","Arthur Masuaku"], MID: ["Ngalayel Mukau","Nathanaël Mbuku","Samuel Moutoussamy","Théo Bongonda","Noah Sadiki","Aaron Tshibola","Charles Pickel","Edo Kayembe"], FWD: ["Brian Cipenga","Gaël Kakuta","Meschack Elia","Cédric Bakambu","Fiston Mayele","Yoane Wissa","Simon Banza"] },
  senegal: { GK: ["Yehvann Diouf","Édouard Mendy","Mory Diaw"], DEF: ["Mamadou Sarr","Kalidou Koulibaly","Abdoulaye Seck","Ismail Jakobs","Krepin Diatta","Moussa Niakhaté","Antoine Mendy","El Hadji Diouf"], MID: ["Idrissa Gueye","Pathé Ciss","Lamine Camara","Pape Sarr","Habib Diarra","Bara Ndiaye","Pape Gueye"], FWD: ["Assane Diao","Bamba Dieng","Sadio Mané","Nicolas Jackson","Chérif Ndiaye","Iliman Ndiaye","Ismaïla Sarr","Ibrahim Mbaye"] },
  tunez: { GK: ["Mouhib Chamakh","Aymen Dahmen","Sabri Ben Hessen"], DEF: ["Ali Abdi","Montassar Talbi","Omar Rekik","Adam Arous","Dylan Bronn","Mortadha Ben Ouanes","Yan Valery","Mohamed Ben Hmida","Moutaz Neffati","Raed Chikhaoui"], MID: ["Hannibal Mejbri","Ismaël Gharbi","Rani Khedira","Khalil Ayari","Mohamed Hadj Mahmoud","Ellyes Skhiri","Anis Slimane","Sebastian Tounekti"], FWD: ["Elias Achouri","Elias Saad","Hazem Mastouri","Rayan Elloumi","Firas Chaouat"] },
  "arabia-saudi": { GK: ["Nawaf Al-Aqidi","Mohammed Al-Owais","Ahmed Al-Kassar"], DEF: ["Ali Majrashi","Ali Lajami","Abdulelah Al-Amri","Hassan Al-Tambakti","Saud Abdulhamid","Nawaf Bu Washl","Hassan Kadish","Moteb Al-Harbi","Jehad Thikri","Mohammed Abu Alshamat"], MID: ["Nasser Al-Dawsari","Musab Al-Juwayr","Abdullah Al-Khaibari","Ziyad Al-Johani","Ala Al-Hajji","Mohamed Kanno"], FWD: ["Aiman Yahya","Feras Al-Brikan","Salem Al-Dawsari","Saleh Al-Shehri","Khalid Al-Ghannam","Abdullah Al-Hamddan","Sultan Mandash"] },
  australia: { GK: ["Mathew Ryan","Paul Izzo","Patrick Beach"], DEF: ["Miloš Degenek","Alessandro Circati","Jacob Italiano","Jordan Bos","Jason Geria","Kai Trewin","Aziz Behich","Harry Souttar","Cameron Burgess","Lucas Herrington"], MID: ["Connor Metcalfe","Aiden O'Neill","Cameron Devlin","Jackson Irvine","Paul Okon-Engstler"], FWD: ["Mathew Leckie","Mohamed Touré","Ajdin Hrustić","Awer Mabil","Nestory Irankunda","Cristian Volpato","Nishan Velupillay","Tete Yengi"] },
  irak: { GK: ["Fahad Talib","Jalal Hassan","Ahmed Basil"], DEF: ["Rebin Ghareeb","Hussein Ali","Zaid Tahseen","Akam Hashim","Munaf Younus","Ahmed Yahya","Merchas Doski","Mustafa Saadoon","Frans Putros"], MID: ["Youssef Amyn","Ibrahim Bayesh","Zidane Iqbal","Amir Al-Ammari","Kevin Yakob","Aimar Sher","Zaid Ismael"], FWD: ["Ali Al-Hamadi","Mohanad Ali","Ahmed Qasim","Ali Yousif","Ali Jasim","Aymen Hussein","Marko Farji"] },
  japon: { GK: ["Zion Suzuki","Keisuke Osako","Tomoki Hayakawa"], DEF: ["Yukinari Sugawara","Shogo Taniguchi","Kou Itakura","Yuto Nagatomo","Tsuyoshi Watanabe","Ayumu Seko","Hiroki Ito","Takehiro Tomiyasu","Junnosuke Suzuki"], MID: ["Wataru Endo","Ao Tanaka","Takefusa Kubo","Ritsu Doan","Daizen Maeda","Keito Nakamura","Junya Ito","Daichi Kamada","Yuito Suzuki","Kaishu Sano"], FWD: ["Keisuke Goto","Ayase Ueda","Koki Ogawa","Kento Shiogai"] },
  jordania: { GK: ["Yazeed Abu Laila","Nour Baniateyah","Abdallah Al-Fakhori"], DEF: ["Mohammad Abu Hasheesh","Abdallah Nasib","Husam Abu Dahab","Yazan Al-Arab","Mohammad Abu Al-Nadi","Saleem Obaid","Saed Al-Rosan","Ehsan Haddad","Anas Badawi"], MID: ["Amer Jamous","Noor Al-Rawabdeh","Rajaei Ayed","Ibrahim Sadeh","Mohannad Abu Taha","Nizar Al-Rashdan","Mohammad Al-Daoud"], FWD: ["Mohammad Abu Zraiq","Ali Olwan","Mousa Al-Tamari","Odeh Fakhoury","Mahmoud Al-Mardi","Ibrahim Sabra","Ali Azaizeh"] },
  uzbekistan: { GK: ["Utkir Yusupov","Abduvohid Nematov","Botirali Ergashev"], DEF: ["Abdukodir Khusanov","Khojiakbar Alijonov","Farrukh Sayfiev","Rustam Ashurmatov","Sherzod Nasrullaev","Umar Eshmurodov","Abdulla Abdullaev","Behruzjon Karimov","Avazbek Ulmasaliyev","Jakhongir Urozov"], MID: ["Akmal Mozgovoy","Otabek Shukurov","Jamshid Iskanderov","Odiljon Xamrobekov","Jaloliddin Masharipov","Oston Urunov","Dostonbek Khamdamov","Azizjon Ganiev","Abbosbek Fayzullaev","Sherzod Esanov"], FWD: ["Eldor Shomurodov","Azizbek Amonov","Igor Sergeev"] },
  qatar: { GK: ["Mahmoud Abu Nada","Salah Zakaria","Meshaal Barsham"], DEF: ["Pedro Miguel","Lucas Mendes","Issa Laye","Jassem Gaber","Ayoub Aloui","Homam Ahmed","Boualem Khoukhi","Sultan Al-Brake","Al-Hashmi Al-Hussein"], MID: ["Abdulaziz Hatem","Karim Boudiaf","Ahmed Al-Ganehi","Ahmed Fathy","Assim Madibo"], FWD: ["Ahmed Alaaeldin","Edmilson Júnior","Mohammed Muntari","Hassan Al-Haydos","Akram Afif","Yusuf Abdurisag","Almoez Ali","Tahsin Jamshid","Mohamed Manai"] },
  "corea-del-sur": { GK: ["Seunggyu Kim","Bumkeun Song","Hyeonwoo Jo"], DEF: ["Hanbeom Lee","Minjae Kim","Taehyeon Kim","Taeseok Lee","Wije Cho","Moonhwan Kim","Jinseob Park","Youngwoo Seol","Jens Castrop"], MID: ["Gihyuk Lee","Inbeom Hwang","Seungho Paik","Jaesung Lee","Heechan Hwang","Junho Bae","Kangin Lee","Hyunjun Yang","Jingyu Kim","Jisung Eom","Donggyeong Lee"], FWD: ["Heungmin Son","Guesung Cho","Hyeongyu Oh"] },
  iran: { GK: ["Alireza Beiranvand","Payam Niazmand","Hossein Hosseini"], DEF: ["Saleh Hardani","Ehsan Hajisafi","Shoja Khalilzadeh","Milad Mohammadi","Hossein Kanani","Arya Yousefi","Ali Nemati","Ramin Rezaeian","Danial Iri"], MID: ["Saeid Ezatolahi","Alireza Jahanbakhsh","Mohammad Mohebbi","Saman Ghoddos","Roozbeh Cheshmi","Mehdi Torabi","Mohammad Ghorbani","Amirmohammad Razaghinia"], FWD: ["Mehdi Taremi","Mehdi Ghayedi","Ali Alipour","Amirhossein Hosseinzadeh","Shahriyar Moghanloo","Dennis Dargahi"] },
  "nueva-zelanda": { GK: ["Max Crocombe","Alex Paulsen","Michael Woud"], DEF: ["Tim Payne","Francis de Vries","Tyler Bindon","Michael Boxall","Liberato Cacace","Nando Pijnaker","Finn Surman","Callan Elliot","Tommy Smith"], MID: ["Joe Bell","Matthew Garbett","Marko Stamenić","Sarpreet Singh","Elijah Just","Alex Rufer","Ben Old","Callum McCowatt","Ryan Thomas","Lachlan Bayliss"], FWD: ["Chris Wood","Kosta Barbarouses","Ben Waine","Jesse Randall"] },
};

/* -------------------------------------------------------------------------- */
/* Cross + update                                                              */
/* -------------------------------------------------------------------------- */

const ANNOUNCED_DATE = "2026-06-04";
const SOURCE = "Convocatoria oficial (api-football, 4 jun 2026)";

function crossUpdate(slug, grouped) {
  const filepath = path.join(ROOT, `${slug}.json`);
  if (!fs.existsSync(filepath)) {
    console.warn(`  ✗ JSON no encontrado: ${slug}.json`);
    return { slug, status: "missing", removed: 0, kept: 0, added: 0 };
  }

  const json = JSON.parse(fs.readFileSync(filepath, "utf8"));
  if (!json.wc_2026) json.wc_2026 = {};
  const existing = json.wc_2026.likely_squad || [];

  // Lista plana oficial: {name, pos}
  const official = [];
  for (const pos of ["GK", "DEF", "MID", "FWD"]) {
    for (const name of grouped[pos] || []) official.push({ name, pos });
  }

  const buckets = existing.map((p) => ({
    player: p,
    keys: [p.full_name || "", p.display_name || "", (p.id || "").replace(/-/g, " ")].filter(Boolean),
    matched: false,
  }));

  const newSquad = [];
  let added = 0;
  let kept = 0;

  for (const op of official) {
    const found = buckets.find(
      (b) => !b.matched && b.keys.some((k) => nameMatches(k, op.name)),
    );
    if (found) {
      found.matched = true;
      kept += 1;
      // Preserva todo lo curado; solo asegura posición y status oficial.
      newSquad.push({ ...found.player, position: op.pos, status: "fixed" });
    } else {
      added += 1;
      newSquad.push({
        id: slugify(op.name),
        full_name: op.name,
        display_name: op.name,
        position: op.pos,
        detailed_position: op.pos,
        club: null,
        shirt_number_expected: null,
        status: "fixed",
        photo_url: null,
      });
    }
  }

  const removed = buckets.filter((b) => !b.matched).length;
  json.wc_2026.likely_squad = newSquad;
  json.wc_2026.squad_announced = true;
  json.wc_2026.squad_announced_date = ANNOUNCED_DATE;
  json.wc_2026.squad_source = SOURCE;

  fs.writeFileSync(filepath, JSON.stringify(json, null, 2) + "\n", "utf8");
  return { slug, status: "updated", removed, kept, added, total: newSquad.length };
}

/* -------------------------------------------------------------------------- */
/* Run                                                                         */
/* -------------------------------------------------------------------------- */

console.log("Cruzando convocatorias OFICIALES Mundial 2026 (api-football, 4 jun)...\n");

const results = [];
for (const [slug, grouped] of Object.entries(SQUADS)) {
  results.push(crossUpdate(slug, grouped));
}

console.log("\nResumen:");
console.log("país".padEnd(20) + "removed".padStart(9) + "kept".padStart(7) + "added".padStart(7) + "total".padStart(7));
for (const r of results) {
  console.log(
    r.slug.padEnd(20) +
      String(r.removed).padStart(9) +
      String(r.kept).padStart(7) +
      String(r.added).padStart(7) +
      String((r.kept || 0) + (r.added || 0)).padStart(7),
  );
}
const ok = results.filter((r) => r.status === "updated").length;
console.log(`\n✓ ${ok}/${results.length} JSON actualizados`);
console.log(`Total selecciones en SQUADS: ${Object.keys(SQUADS).length}`);
