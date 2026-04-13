export interface Match {
  i: number;
  g: string;
  p: string;
  j: number;
  h: string;
  hf: string;
  a: string;
  af: string;
  d: string;
  t: string;
  vn: string;
  vc: string;
  vf: string;
}

export const MATCHES: Match[] = [
  // GRUPO A (Jornada 1 - 11 Junio)
  { "i": 1, "g": "A", "p": "Fase de grupos", "j": 1, "h": "México", "hf": "mx", "a": "Sudáfrica", "af": "za", "d": "2026-06-11", "t": "12:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
  { "i": 2, "g": "A", "p": "Fase de grupos", "j": 1, "h": "Corea del Sur", "hf": "kr", "a": "Rep. Checa", "af": "cz", "d": "2026-06-11", "t": "18:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx" },

  // GRUPO B (Jornada 1 - 12 Junio)
  { "i": 3, "g": "B", "p": "Fase de grupos", "j": 1, "h": "Canadá", "hf": "ca", "a": "Qatar", "af": "qa", "d": "2026-06-12", "t": "12:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },
  { "i": 4, "g": "B", "p": "Fase de grupos", "j": 1, "h": "Bosnia", "hf": "ba", "a": "Suiza", "af": "ch", "d": "2026-06-12", "t": "15:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },

  // GRUPO C (Jornada 1 - 12 Junio)
  { "i": 5, "g": "C", "p": "Fase de grupos", "j": 1, "h": "Brasil", "hf": "br", "a": "Haití", "af": "ht", "d": "2026-06-12", "t": "18:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },
  { "i": 6, "g": "C", "p": "Fase de grupos", "j": 1, "h": "Marruecos", "hf": "ma", "a": "Escocia", "af": "gb-sct", "d": "2026-06-12", "t": "21:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },

  // GRUPO D (Jornada 1 - 13 Junio)
  { "i": 7, "g": "D", "p": "Fase de grupos", "j": 1, "h": "EE.UU.", "hf": "us", "a": "Australia", "af": "au", "d": "2026-06-13", "t": "12:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us" },
  { "i": 8, "g": "D", "p": "Fase de grupos", "j": 1, "h": "Paraguay", "hf": "py", "a": "Turquía", "af": "tr", "d": "2026-06-13", "t": "15:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },

  // GRUPO E (Jornada 1 - 13 Junio)
  { "i": 9, "g": "E", "p": "Fase de grupos", "j": 1, "h": "Alemania", "hf": "de", "a": "C. de Marfil", "af": "ci", "d": "2026-06-13", "t": "18:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 10, "g": "E", "p": "Fase de grupos", "j": 1, "h": "Curazao", "hf": "cw", "a": "Ecuador", "af": "ec", "d": "2026-06-13", "t": "21:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us" },

  // GRUPO F (Jornada 1 - 14 Junio)
  { "i": 11, "g": "F", "p": "Fase de grupos", "j": 1, "h": "P. Bajos", "hf": "nl", "a": "Túnez", "af": "tn", "d": "2026-06-14", "t": "12:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },
  { "i": 12, "g": "F", "p": "Fase de grupos", "j": 1, "h": "Japón", "hf": "jp", "a": "Suecia", "af": "se", "d": "2026-06-14", "t": "15:00", "vn": "Estadio BBVA", "vc": "Monterrey", "vf": "mx" },

  // GRUPO G (Jornada 1 - 14 Junio)
  { "i": 13, "g": "G", "p": "Fase de grupos", "j": 1, "h": "Bélgica", "hf": "be", "a": "N. Zelanda", "af": "nz", "d": "2026-06-14", "t": "18:00", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us" },
  { "i": 14, "g": "G", "p": "Fase de grupos", "j": 1, "h": "Egipto", "hf": "eg", "a": "Irán", "af": "ir", "d": "2026-06-14", "t": "21:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca" },

  // GRUPO H (Jornada 1 - 15 Junio)
  { "i": 15, "g": "H", "p": "Fase de grupos", "j": 1, "h": "España", "hf": "es", "a": "Cabo Verde", "af": "cv", "d": "2026-06-15", "t": "12:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx" },
  { "i": 16, "g": "H", "p": "Fase de grupos", "j": 1, "h": "Uruguay", "hf": "uy", "a": "A. Saudí", "af": "sa", "d": "2026-06-15", "t": "15:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },

  // GRUPO I (Jornada 1 - 15 Junio)
  { "i": 17, "g": "I", "p": "Fase de grupos", "j": 1, "h": "Francia", "hf": "fr", "a": "Senegal", "af": "sn", "d": "2026-06-15", "t": "18:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },
  { "i": 18, "g": "I", "p": "Fase de grupos", "j": 1, "h": "Noruega", "hf": "no", "a": "Irak", "af": "iq", "d": "2026-06-15", "t": "21:00", "vn": "Estadio Akron", "vc": "Guadalajara", "vf": "mx" },

  // GRUPO J (Jornada 1 - 16 Junio)
  { "i": 19, "g": "J", "p": "Fase de grupos", "j": 1, "h": "Argentina", "hf": "ar", "a": "Argelia", "af": "dz", "d": "2026-06-16", "t": "12:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },
  { "i": 20, "g": "J", "p": "Fase de grupos", "j": 1, "h": "Austria", "hf": "at", "a": "Jordania", "af": "jo", "d": "2026-06-16", "t": "15:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },

  // GRUPO K (Jornada 1 - 16 Junio)
  { "i": 21, "g": "K", "p": "Fase de grupos", "j": 1, "h": "Portugal", "hf": "pt", "a": "Uzbekistán", "af": "uz", "d": "2026-06-16", "t": "18:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },
  { "i": 22, "g": "K", "p": "Fase de grupos", "j": 1, "h": "Colombia", "hf": "co", "a": "RD Congo", "af": "cd", "d": "2026-06-16", "t": "21:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us" },

  // GRUPO L (Jornada 1 - 17 Junio)
  { "i": 23, "g": "L", "p": "Fase de grupos", "j": 1, "h": "Inglaterra", "hf": "gb-eng", "a": "Croacia", "af": "hr", "d": "2026-06-17", "t": "12:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 24, "g": "L", "p": "Fase de grupos", "j": 1, "h": "Ghana", "hf": "gh", "a": "Panamá", "af": "pa", "d": "2026-06-17", "t": "15:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us" },

  // JORNADA 2 - 18-22 Junio
  { "i": 25, "g": "A", "p": "Fase de grupos", "j": 2, "h": "Sudáfrica", "hf": "za", "a": "Corea del Sur", "af": "kr", "d": "2026-06-18", "t": "15:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
  { "i": 26, "g": "A", "p": "Fase de grupos", "j": 2, "h": "México", "hf": "mx", "a": "Rep. Checa", "af": "cz", "d": "2026-06-18", "t": "21:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx" },

  { "i": 27, "g": "B", "p": "Fase de grupos", "j": 2, "h": "Qatar", "hf": "qa", "a": "Bosnia", "af": "ba", "d": "2026-06-19", "t": "12:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },
  { "i": 28, "g": "B", "p": "Fase de grupos", "j": 2, "h": "Canadá", "hf": "ca", "a": "Suiza", "af": "ch", "d": "2026-06-19", "t": "18:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },

  { "i": 29, "g": "C", "p": "Fase de grupos", "j": 2, "h": "Haití", "hf": "ht", "a": "Marruecos", "af": "ma", "d": "2026-06-19", "t": "21:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 30, "g": "C", "p": "Fase de grupos", "j": 2, "h": "Brasil", "hf": "br", "a": "Escocia", "af": "gb-sct", "d": "2026-06-20", "t": "15:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },

  { "i": 31, "g": "D", "p": "Fase de grupos", "j": 2, "h": "Australia", "hf": "au", "a": "Paraguay", "af": "py", "d": "2026-06-20", "t": "18:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },
  { "i": 32, "g": "D", "p": "Fase de grupos", "j": 2, "h": "EE.UU.", "hf": "us", "a": "Turquía", "af": "tr", "d": "2026-06-20", "t": "21:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us" },

  { "i": 33, "g": "E", "p": "Fase de grupos", "j": 2, "h": "C. de Marfil", "hf": "ci", "a": "Ecuador", "af": "ec", "d": "2026-06-21", "t": "12:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us" },
  { "i": 34, "g": "E", "p": "Fase de grupos", "j": 2, "h": "Alemania", "hf": "de", "a": "Curazao", "af": "cw", "d": "2026-06-21", "t": "18:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },

  { "i": 35, "g": "F", "p": "Fase de grupos", "j": 2, "h": "Túnez", "hf": "tn", "a": "Suecia", "af": "se", "d": "2026-06-21", "t": "21:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca" },
  { "i": 36, "g": "F", "p": "Fase de grupos", "j": 2, "h": "P. Bajos", "hf": "nl", "a": "Japón", "af": "jp", "d": "2026-06-22", "t": "15:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },

  { "i": 37, "g": "G", "p": "Fase de grupos", "j": 2, "h": "N. Zelanda", "hf": "nz", "a": "Egipto", "af": "eg", "d": "2026-06-22", "t": "18:00", "vn": "Estadio BBVA", "vc": "Monterrey", "vf": "mx" },
  { "i": 38, "g": "G", "p": "Fase de grupos", "j": 2, "h": "Bélgica", "hf": "be", "a": "Irán", "af": "ir", "d": "2026-06-22", "t": "21:00", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us" },

  { "i": 39, "g": "H", "p": "Fase de grupos", "j": 2, "h": "Cabo Verde", "hf": "cv", "a": "A. Saudí", "af": "sa", "d": "2026-06-23", "t": "12:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx" },
  { "i": 40, "g": "H", "p": "Fase de grupos", "j": 2, "h": "España", "hf": "es", "a": "Uruguay", "af": "uy", "d": "2026-06-23", "t": "18:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },

  { "i": 41, "g": "I", "p": "Fase de grupos", "j": 2, "h": "Senegal", "hf": "sn", "a": "Irak", "af": "iq", "d": "2026-06-23", "t": "21:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 42, "g": "I", "p": "Fase de grupos", "j": 2, "h": "Francia", "hf": "fr", "a": "Noruega", "af": "no", "d": "2026-06-24", "t": "15:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },

  { "i": 43, "g": "J", "p": "Fase de grupos", "j": 2, "h": "Argelia", "hf": "dz", "a": "Jordania", "af": "jo", "d": "2026-06-24", "t": "18:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },
  { "i": 44, "g": "J", "p": "Fase de grupos", "j": 2, "h": "Argentina", "hf": "ar", "a": "Austria", "af": "at", "d": "2026-06-24", "t": "21:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },

  { "i": 45, "g": "K", "p": "Fase de grupos", "j": 2, "h": "Uzbekistán", "hf": "uz", "a": "RD Congo", "af": "cd", "d": "2026-06-25", "t": "12:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },
  { "i": 46, "g": "K", "p": "Fase de grupos", "j": 2, "h": "Portugal", "hf": "pt", "a": "Colombia", "af": "co", "d": "2026-06-25", "t": "18:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },

  { "i": 47, "g": "L", "p": "Fase de grupos", "j": 2, "h": "Croacia", "hf": "hr", "a": "Ghana", "af": "gh", "d": "2026-06-25", "t": "21:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 48, "g": "L", "p": "Fase de grupos", "j": 2, "h": "Inglaterra", "hf": "gb-eng", "a": "Panamá", "af": "pa", "d": "2026-06-26", "t": "15:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us" },

  // JORNADA 3 - 26-30 Junio
  { "i": 49, "g": "A", "p": "Fase de grupos", "j": 3, "h": "Rep. Checa", "hf": "cz", "a": "Sudáfrica", "af": "za", "d": "2026-06-26", "t": "21:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
  { "i": 50, "g": "A", "p": "Fase de grupos", "j": 3, "h": "Corea del Sur", "hf": "kr", "a": "México", "af": "mx", "d": "2026-06-26", "t": "21:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx" },

  { "i": 51, "g": "B", "p": "Fase de grupos", "j": 3, "h": "Suiza", "hf": "ch", "a": "Qatar", "af": "qa", "d": "2026-06-27", "t": "15:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },
  { "i": 52, "g": "B", "p": "Fase de grupos", "j": 3, "h": "Bosnia", "hf": "ba", "a": "Canadá", "af": "ca", "d": "2026-06-27", "t": "15:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },

  { "i": 53, "g": "C", "p": "Fase de grupos", "j": 3, "h": "Escocia", "hf": "gb-sct", "a": "Haití", "af": "ht", "d": "2026-06-27", "t": "21:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },
  { "i": 54, "g": "C", "p": "Fase de grupos", "j": 3, "h": "Marruecos", "hf": "ma", "a": "Brasil", "af": "br", "d": "2026-06-27", "t": "21:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },

  { "i": 55, "g": "D", "p": "Fase de grupos", "j": 3, "h": "Turquía", "hf": "tr", "a": "Australia", "af": "au", "d": "2026-06-28", "t": "15:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },
  { "i": 56, "g": "D", "p": "Fase de grupos", "j": 3, "h": "EE.UU.", "hf": "us", "a": "Paraguay", "af": "py", "d": "2026-06-28", "t": "15:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us" },

  { "i": 57, "g": "E", "p": "Fase de grupos", "j": 3, "h": "Ecuador", "hf": "ec", "a": "Curazao", "af": "cw", "d": "2026-06-28", "t": "21:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us" },
  { "i": 58, "g": "E", "p": "Fase de grupos", "j": 3, "h": "Alemania", "hf": "de", "a": "C. de Marfil", "af": "ci", "d": "2026-06-28", "t": "21:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },

  { "i": 59, "g": "F", "p": "Fase de grupos", "j": 3, "h": "Suecia", "hf": "se", "a": "Japón", "af": "jp", "d": "2026-06-29", "t": "15:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca" },
  { "i": 60, "g": "F", "p": "Fase de grupos", "j": 3, "h": "Túnez", "hf": "tn", "a": "P. Bajos", "af": "nl", "d": "2026-06-29", "t": "15:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },

  { "i": 61, "g": "G", "p": "Fase de grupos", "j": 3, "h": "Irán", "hf": "ir", "a": "N. Zelanda", "af": "nz", "d": "2026-06-29", "t": "21:00", "vn": "Estadio BBVA", "vc": "Monterrey", "vf": "mx" },
  { "i": 62, "g": "G", "p": "Fase de grupos", "j": 3, "h": "Egipto", "hf": "eg", "a": "Bélgica", "af": "be", "d": "2026-06-29", "t": "21:00", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us" },

  { "i": 63, "g": "H", "p": "Fase de grupos", "j": 3, "h": "A. Saudí", "hf": "sa", "a": "España", "af": "es", "d": "2026-06-30", "t": "15:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx" },
  { "i": 64, "g": "H", "p": "Fase de grupos", "j": 3, "h": "Uruguay", "hf": "uy", "a": "Cabo Verde", "af": "cv", "d": "2026-06-30", "t": "15:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },

  { "i": 65, "g": "I", "p": "Fase de grupos", "j": 3, "h": "Irak", "hf": "iq", "a": "Francia", "af": "fr", "d": "2026-06-30", "t": "21:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 66, "g": "I", "p": "Fase de grupos", "j": 3, "h": "Senegal", "hf": "sn", "a": "Noruega", "af": "no", "d": "2026-06-30", "t": "21:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },

  { "i": 67, "g": "J", "p": "Fase de grupos", "j": 3, "h": "Jordania", "hf": "jo", "a": "Argentina", "af": "ar", "d": "2026-06-30", "t": "21:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },
  { "i": 68, "g": "J", "p": "Fase de grupos", "j": 3, "h": "Austria", "hf": "at", "a": "Argelia", "af": "dz", "d": "2026-06-30", "t": "21:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },

  { "i": 69, "g": "K", "p": "Fase de grupos", "j": 3, "h": "RD Congo", "hf": "cd", "a": "Portugal", "af": "pt", "d": "2026-06-30", "t": "21:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },
  { "i": 70, "g": "K", "p": "Fase de grupos", "j": 3, "h": "Colombia", "hf": "co", "a": "Uzbekistán", "af": "uz", "d": "2026-06-30", "t": "21:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },

  { "i": 71, "g": "L", "p": "Fase de grupos", "j": 3, "h": "Panamá", "hf": "pa", "a": "Inglaterra", "af": "gb-eng", "d": "2026-06-30", "t": "21:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us" },
  { "i": 72, "g": "L", "p": "Fase de grupos", "j": 3, "h": "Ghana", "hf": "gh", "a": "Croacia", "af": "hr", "d": "2026-06-30", "t": "21:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },

  // ELIMINATORIAS - Dieciseisavos (28 jun - 2 jul)
  { "i": 73, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1A", "hf": "tbd", "a": "3C/D/E/F", "af": "tbd", "d": "2026-06-28", "t": "12:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
  { "i": 74, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1C", "hf": "tbd", "a": "3A/B/E/F", "af": "tbd", "d": "2026-06-28", "t": "16:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 75, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1B", "hf": "tbd", "a": "3A/C/D/E", "af": "tbd", "d": "2026-06-28", "t": "20:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },
  { "i": 76, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1D", "hf": "tbd", "a": "3B/E/F/G/H", "af": "tbd", "d": "2026-06-29", "t": "12:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },
  { "i": 77, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1E", "hf": "tbd", "a": "3A/B/C/D", "af": "tbd", "d": "2026-06-29", "t": "16:00", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us" },
  { "i": 78, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1F", "hf": "tbd", "a": "3A/B/C/H", "af": "tbd", "d": "2026-06-29", "t": "20:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx" },
  { "i": 79, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1G", "hf": "tbd", "a": "3B/C/D/E/F", "af": "tbd", "d": "2026-06-30", "t": "12:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },
  { "i": 80, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1H", "hf": "tbd", "a": "3A/D/E/F/G", "af": "tbd", "d": "2026-06-30", "t": "16:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca" },
  { "i": 81, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1I", "hf": "tbd", "a": "3C/D/G/H", "af": "tbd", "d": "2026-06-30", "t": "20:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },
  { "i": 82, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1J", "hf": "tbd", "a": "3A/B/F/G/H", "af": "tbd", "d": "2026-07-01", "t": "12:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },
  { "i": 83, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1K", "hf": "tbd", "a": "3B/D/E/F/H", "af": "tbd", "d": "2026-07-01", "t": "16:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us" },
  { "i": 84, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1L", "hf": "tbd", "a": "3C/E/G/H", "af": "tbd", "d": "2026-07-01", "t": "20:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },
  { "i": 85, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1° Mejores 3eros", "hf": "tbd", "a": "1° Mejores 3eros", "af": "tbd", "d": "2026-07-02", "t": "12:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us" },
  { "i": 86, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1° Mejores 3eros", "hf": "tbd", "a": "1° Mejores 3eros", "af": "tbd", "d": "2026-07-02", "t": "16:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us" },
  { "i": 87, "g": "", "p": "Dieciseisavos", "j": 0, "h": "1° Mejores 3eros", "hf": "tbd", "a": "1° Mejores 3eros", "af": "tbd", "d": "2026-07-02", "t": "20:00", "vn": "Estadio BBVA", "vc": "Monterrey", "vf": "mx" },

  // OCTAVOS (3-6 jul)
  { "i": 88, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 32-1", "hf": "tbd", "a": "Ganador 32-2", "af": "tbd", "d": "2026-07-03", "t": "12:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
  { "i": 89, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 32-3", "hf": "tbd", "a": "Ganador 32-4", "af": "tbd", "d": "2026-07-03", "t": "16:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 90, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 32-5", "hf": "tbd", "a": "Ganador 32-6", "af": "tbd", "d": "2026-07-03", "t": "20:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },
  { "i": 91, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 32-7", "hf": "tbd", "a": "Ganador 32-8", "af": "tbd", "d": "2026-07-04", "t": "12:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },
  { "i": 92, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 32-9", "hf": "tbd", "a": "Ganador 32-10", "af": "tbd", "d": "2026-07-04", "t": "16:00", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us" },
  { "i": 93, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 32-11", "hf": "tbd", "a": "Ganador 32-12", "af": "tbd", "d": "2026-07-04", "t": "20:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx" },
  { "i": 94, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 32-13", "hf": "tbd", "a": "Ganador 32-14", "af": "tbd", "d": "2026-07-05", "t": "12:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },
  { "i": 95, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 32-15", "hf": "tbd", "a": "Ganador 32-16", "af": "tbd", "d": "2026-07-05", "t": "16:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca" },

  // CUARTOS (9-12 jul)
  { "i": 96, "g": "", "p": "Cuartos de final", "j": 0, "h": "Ganador O-1", "hf": "tbd", "a": "Ganador O-2", "af": "tbd", "d": "2026-07-09", "t": "16:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },
  { "i": 97, "g": "", "p": "Cuartos de final", "j": 0, "h": "Ganador O-3", "hf": "tbd", "a": "Ganador O-4", "af": "tbd", "d": "2026-07-09", "t": "20:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },
  { "i": 98, "g": "", "p": "Cuartos de final", "j": 0, "h": "Ganador O-5", "hf": "tbd", "a": "Ganador O-6", "af": "tbd", "d": "2026-07-10", "t": "16:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us" },
  { "i": 99, "g": "", "p": "Cuartos de final", "j": 0, "h": "Ganador O-7", "hf": "tbd", "a": "Ganador O-8", "af": "tbd", "d": "2026-07-10", "t": "20:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },

  // SEMIFINALES (14-15 jul)
  { "i": 100, "g": "", "p": "Semifinal", "j": 0, "h": "Ganador C-1", "hf": "tbd", "a": "Ganador C-2", "af": "tbd", "d": "2026-07-14", "t": "20:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 101, "g": "", "p": "Semifinal", "j": 0, "h": "Ganador C-3", "hf": "tbd", "a": "Ganador C-4", "af": "tbd", "d": "2026-07-15", "t": "20:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us" },

  // TERCER PUESTO (18 jul)
  { "i": 102, "g": "", "p": "Tercer puesto", "j": 0, "h": "Perdedor SF1", "hf": "tbd", "a": "Perdedor SF2", "af": "tbd", "d": "2026-07-18", "t": "16:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },

  // FINAL (19 jul)
  { "i": 103, "g": "", "p": "FINAL", "j": 0, "h": "Ganador SF1", "hf": "tbd", "a": "Ganador SF2", "af": "tbd", "d": "2026-07-19", "t": "16:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
];

export const PHASE_COLORS: Record<string, string> = {
  "Fase de grupos": "#3b82f6",
  "Dieciseisavos": "#22c55e",
  "Octavos de final": "#06b6d4",
  "Cuartos de final": "#a855f7",
  "Semifinal": "#f59e0b",
  "Tercer puesto": "#ec4899",
  "FINAL": "#c9a84c",
};

export const BG = "#060B14";
export const BG2 = "#0F1D32";
export const BG3 = "#0B1825";
export const GOLD = "#c9a84c";
export const GOLD2 = "#e8d48b";
export const MID = "#8a94b0";
export const DIM = "#6a7a9a";
export const DARK = "#4a5570";

export const PHASES = ["Fase de grupos", "Dieciseisavos", "Octavos de final", "Cuartos de final", "Semifinal", "Tercer puesto", "FINAL"];
export const GROUPS = "ABCDEFGHIJKL".split("");
export const MONTHS_ES = { "06": "Junio", "07": "Julio" };
export const DAYS_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const fmtDate = (s: string) => {
  const d = new Date(s + "T12:00:00");
  return `${DAYS_FULL[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[s.split("-")[1] as keyof typeof MONTHS_ES]}`;
};

export const fmtShort = (s: string) => {
  const p = s.split("-");
  return `${parseInt(p[2])} ${p[1] === "06" ? "Jun" : "Jul"}`;
};

export const flagUrl = (code: string | null, w = 80) =>
  code && code !== "tbd" ? `https://flagcdn.com/w${w}/${code}.png` : null;

export const VENUES = Array.from(
  new Map(MATCHES.filter((m) => m.vn).map((m) => [m.vn, { name: m.vn, city: m.vc, flag: m.vf }])).values()
).sort((a, b) => a.name.localeCompare(b.name));
