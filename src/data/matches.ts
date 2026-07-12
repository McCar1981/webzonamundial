// ⏰ HORARIOS: todas las horas del campo "t" están en Eastern Time (ET) de
//    EE.UU. Fuente: FIFA Sortable Schedule (xlsx oficial, mayo 2026).
//    Generado automáticamente desde el Excel para asegurar fidelidad 1:1.
//    Para convertir a la zona horaria del usuario, usar el helper
//    src/lib/bracket/match-time.ts (Intl.DateTimeFormat).
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
  // FASE DE GRUPOS — JORNADA 1
  { "i": 1, "g": "A", "p": "Fase de grupos", "j": 1, "h": "México", "hf": "mx", "a": "Sudáfrica", "af": "za", "d": "2026-06-11", "t": "15:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx" },
  { "i": 2, "g": "A", "p": "Fase de grupos", "j": 1, "h": "Corea del Sur", "hf": "kr", "a": "Rep. Checa", "af": "cz", "d": "2026-06-11", "t": "22:00", "vn": "Estadio Akron", "vc": "Guadalajara", "vf": "mx" },
  { "i": 3, "g": "B", "p": "Fase de grupos", "j": 1, "h": "Canadá", "hf": "ca", "a": "Bosnia", "af": "ba", "d": "2026-06-12", "t": "15:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca" },
  { "i": 4, "g": "D", "p": "Fase de grupos", "j": 1, "h": "EE.UU.", "hf": "us", "a": "Paraguay", "af": "py", "d": "2026-06-12", "t": "21:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },
  { "i": 5, "g": "C", "p": "Fase de grupos", "j": 1, "h": "Haití", "hf": "ht", "a": "Escocia", "af": "gb-sct", "d": "2026-06-13", "t": "21:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us" },
  { "i": 6, "g": "D", "p": "Fase de grupos", "j": 1, "h": "Australia", "hf": "au", "a": "Turquía", "af": "tr", "d": "2026-06-13", "t": "23:59", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },
  { "i": 7, "g": "C", "p": "Fase de grupos", "j": 1, "h": "Brasil", "hf": "br", "a": "Marruecos", "af": "ma", "d": "2026-06-13", "t": "18:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
  { "i": 8, "g": "B", "p": "Fase de grupos", "j": 1, "h": "Qatar", "hf": "qa", "a": "Suiza", "af": "ch", "d": "2026-06-13", "t": "15:00", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us" },
  { "i": 9, "g": "E", "p": "Fase de grupos", "j": 1, "h": "C. de Marfil", "hf": "ci", "a": "Ecuador", "af": "ec", "d": "2026-06-14", "t": "19:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us" },
  { "i": 10, "g": "E", "p": "Fase de grupos", "j": 1, "h": "Alemania", "hf": "de", "a": "Curazao", "af": "cw", "d": "2026-06-14", "t": "13:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },
  { "i": 11, "g": "F", "p": "Fase de grupos", "j": 1, "h": "P. Bajos", "hf": "nl", "a": "Japón", "af": "jp", "d": "2026-06-14", "t": "16:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 12, "g": "F", "p": "Fase de grupos", "j": 1, "h": "Suecia", "hf": "se", "a": "Túnez", "af": "tn", "d": "2026-06-14", "t": "22:00", "vn": "Estadio BBVA", "vc": "Monterrey", "vf": "mx" },
  { "i": 13, "g": "H", "p": "Fase de grupos", "j": 1, "h": "A. Saudí", "hf": "sa", "a": "Uruguay", "af": "uy", "d": "2026-06-15", "t": "18:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },
  { "i": 14, "g": "H", "p": "Fase de grupos", "j": 1, "h": "España", "hf": "es", "a": "Cabo Verde", "af": "cv", "d": "2026-06-15", "t": "12:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },
  { "i": 15, "g": "G", "p": "Fase de grupos", "j": 1, "h": "Irán", "hf": "ir", "a": "N. Zelanda", "af": "nz", "d": "2026-06-15", "t": "21:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },
  { "i": 16, "g": "G", "p": "Fase de grupos", "j": 1, "h": "Bélgica", "hf": "be", "a": "Egipto", "af": "eg", "d": "2026-06-15", "t": "15:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },
  { "i": 17, "g": "I", "p": "Fase de grupos", "j": 1, "h": "Francia", "hf": "fr", "a": "Senegal", "af": "sn", "d": "2026-06-16", "t": "15:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
  { "i": 18, "g": "I", "p": "Fase de grupos", "j": 1, "h": "Irak", "hf": "iq", "a": "Noruega", "af": "no", "d": "2026-06-16", "t": "18:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us" },
  { "i": 19, "g": "J", "p": "Fase de grupos", "j": 1, "h": "Argentina", "hf": "ar", "a": "Argelia", "af": "dz", "d": "2026-06-16", "t": "21:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us" },
  { "i": 20, "g": "J", "p": "Fase de grupos", "j": 1, "h": "Austria", "hf": "at", "a": "Jordania", "af": "jo", "d": "2026-06-16", "t": "23:59", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us" },
  { "i": 21, "g": "L", "p": "Fase de grupos", "j": 1, "h": "Inglaterra", "hf": "gb-eng", "a": "Croacia", "af": "hr", "d": "2026-06-17", "t": "16:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 22, "g": "L", "p": "Fase de grupos", "j": 1, "h": "Ghana", "hf": "gh", "a": "Panamá", "af": "pa", "d": "2026-06-17", "t": "19:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca" },
  { "i": 23, "g": "K", "p": "Fase de grupos", "j": 1, "h": "Portugal", "hf": "pt", "a": "RD Congo", "af": "cd", "d": "2026-06-17", "t": "13:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },
  { "i": 24, "g": "K", "p": "Fase de grupos", "j": 1, "h": "Uzbekistán", "hf": "uz", "a": "Colombia", "af": "co", "d": "2026-06-17", "t": "22:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx" },

  // FASE DE GRUPOS — JORNADA 2
  { "i": 25, "g": "A", "p": "Fase de grupos", "j": 2, "h": "Rep. Checa", "hf": "cz", "a": "Sudáfrica", "af": "za", "d": "2026-06-18", "t": "12:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },
  { "i": 26, "g": "B", "p": "Fase de grupos", "j": 2, "h": "Suiza", "hf": "ch", "a": "Bosnia", "af": "ba", "d": "2026-06-18", "t": "15:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },
  { "i": 27, "g": "B", "p": "Fase de grupos", "j": 2, "h": "Canadá", "hf": "ca", "a": "Qatar", "af": "qa", "d": "2026-06-18", "t": "18:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },
  { "i": 28, "g": "A", "p": "Fase de grupos", "j": 2, "h": "México", "hf": "mx", "a": "Corea del Sur", "af": "kr", "d": "2026-06-18", "t": "21:00", "vn": "Estadio Akron", "vc": "Guadalajara", "vf": "mx" },
  { "i": 29, "g": "C", "p": "Fase de grupos", "j": 2, "h": "Brasil", "hf": "br", "a": "Haití", "af": "ht", "d": "2026-06-19", "t": "21:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us" },
  { "i": 30, "g": "C", "p": "Fase de grupos", "j": 2, "h": "Escocia", "hf": "gb-sct", "a": "Marruecos", "af": "ma", "d": "2026-06-19", "t": "18:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us" },
  { "i": 31, "g": "D", "p": "Fase de grupos", "j": 2, "h": "Turquía", "hf": "tr", "a": "Paraguay", "af": "py", "d": "2026-06-19", "t": "23:59", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us" },
  { "i": 32, "g": "D", "p": "Fase de grupos", "j": 2, "h": "EE.UU.", "hf": "us", "a": "Australia", "af": "au", "d": "2026-06-19", "t": "15:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },
  { "i": 33, "g": "E", "p": "Fase de grupos", "j": 2, "h": "Alemania", "hf": "de", "a": "C. de Marfil", "af": "ci", "d": "2026-06-20", "t": "16:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca" },
  { "i": 34, "g": "E", "p": "Fase de grupos", "j": 2, "h": "Ecuador", "hf": "ec", "a": "Curazao", "af": "cw", "d": "2026-06-20", "t": "20:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us" },
  { "i": 35, "g": "F", "p": "Fase de grupos", "j": 2, "h": "P. Bajos", "hf": "nl", "a": "Suecia", "af": "se", "d": "2026-06-20", "t": "13:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },
  { "i": 36, "g": "F", "p": "Fase de grupos", "j": 2, "h": "Túnez", "hf": "tn", "a": "Japón", "af": "jp", "d": "2026-06-20", "t": "23:59", "vn": "Estadio BBVA", "vc": "Monterrey", "vf": "mx" },
  { "i": 37, "g": "H", "p": "Fase de grupos", "j": 2, "h": "Uruguay", "hf": "uy", "a": "Cabo Verde", "af": "cv", "d": "2026-06-21", "t": "18:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },
  { "i": 38, "g": "H", "p": "Fase de grupos", "j": 2, "h": "España", "hf": "es", "a": "A. Saudí", "af": "sa", "d": "2026-06-21", "t": "12:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },
  { "i": 39, "g": "G", "p": "Fase de grupos", "j": 2, "h": "Bélgica", "hf": "be", "a": "Irán", "af": "ir", "d": "2026-06-21", "t": "15:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },
  { "i": 40, "g": "G", "p": "Fase de grupos", "j": 2, "h": "N. Zelanda", "hf": "nz", "a": "Egipto", "af": "eg", "d": "2026-06-21", "t": "21:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },
  { "i": 41, "g": "I", "p": "Fase de grupos", "j": 2, "h": "Noruega", "hf": "no", "a": "Senegal", "af": "sn", "d": "2026-06-22", "t": "20:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
  { "i": 42, "g": "I", "p": "Fase de grupos", "j": 2, "h": "Francia", "hf": "fr", "a": "Irak", "af": "iq", "d": "2026-06-22", "t": "17:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us" },
  { "i": 43, "g": "J", "p": "Fase de grupos", "j": 2, "h": "Argentina", "hf": "ar", "a": "Austria", "af": "at", "d": "2026-06-22", "t": "13:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 44, "g": "J", "p": "Fase de grupos", "j": 2, "h": "Jordania", "hf": "jo", "a": "Argelia", "af": "dz", "d": "2026-06-22", "t": "23:00", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us" },
  { "i": 45, "g": "L", "p": "Fase de grupos", "j": 2, "h": "Inglaterra", "hf": "gb-eng", "a": "Ghana", "af": "gh", "d": "2026-06-23", "t": "16:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us" },
  { "i": 46, "g": "L", "p": "Fase de grupos", "j": 2, "h": "Panamá", "hf": "pa", "a": "Croacia", "af": "hr", "d": "2026-06-23", "t": "19:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca" },
  { "i": 47, "g": "K", "p": "Fase de grupos", "j": 2, "h": "Portugal", "hf": "pt", "a": "Uzbekistán", "af": "uz", "d": "2026-06-23", "t": "13:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },
  { "i": 48, "g": "K", "p": "Fase de grupos", "j": 2, "h": "Colombia", "hf": "co", "a": "RD Congo", "af": "cd", "d": "2026-06-23", "t": "22:00", "vn": "Estadio Akron", "vc": "Guadalajara", "vf": "mx" },

  // FASE DE GRUPOS — JORNADA 3
  { "i": 49, "g": "C", "p": "Fase de grupos", "j": 3, "h": "Escocia", "hf": "gb-sct", "a": "Brasil", "af": "br", "d": "2026-06-24", "t": "18:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },
  { "i": 50, "g": "C", "p": "Fase de grupos", "j": 3, "h": "Marruecos", "hf": "ma", "a": "Haití", "af": "ht", "d": "2026-06-24", "t": "18:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },
  { "i": 51, "g": "B", "p": "Fase de grupos", "j": 3, "h": "Suiza", "hf": "ch", "a": "Canadá", "af": "ca", "d": "2026-06-24", "t": "15:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },
  { "i": 52, "g": "B", "p": "Fase de grupos", "j": 3, "h": "Bosnia", "hf": "ba", "a": "Qatar", "af": "qa", "d": "2026-06-24", "t": "15:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },
  { "i": 53, "g": "A", "p": "Fase de grupos", "j": 3, "h": "Rep. Checa", "hf": "cz", "a": "México", "af": "mx", "d": "2026-06-24", "t": "21:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx" },
  { "i": 54, "g": "A", "p": "Fase de grupos", "j": 3, "h": "Sudáfrica", "hf": "za", "a": "Corea del Sur", "af": "kr", "d": "2026-06-24", "t": "21:00", "vn": "Estadio BBVA", "vc": "Monterrey", "vf": "mx" },
  { "i": 55, "g": "E", "p": "Fase de grupos", "j": 3, "h": "Curazao", "hf": "cw", "a": "C. de Marfil", "af": "ci", "d": "2026-06-25", "t": "16:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us" },
  { "i": 56, "g": "E", "p": "Fase de grupos", "j": 3, "h": "Ecuador", "hf": "ec", "a": "Alemania", "af": "de", "d": "2026-06-25", "t": "16:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
  { "i": 57, "g": "F", "p": "Fase de grupos", "j": 3, "h": "Japón", "hf": "jp", "a": "Suecia", "af": "se", "d": "2026-06-25", "t": "19:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 58, "g": "F", "p": "Fase de grupos", "j": 3, "h": "Túnez", "hf": "tn", "a": "P. Bajos", "af": "nl", "d": "2026-06-25", "t": "19:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us" },
  { "i": 59, "g": "D", "p": "Fase de grupos", "j": 3, "h": "Turquía", "hf": "tr", "a": "EE.UU.", "af": "us", "d": "2026-06-25", "t": "22:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },
  { "i": 60, "g": "D", "p": "Fase de grupos", "j": 3, "h": "Paraguay", "hf": "py", "a": "Australia", "af": "au", "d": "2026-06-25", "t": "22:00", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us" },
  { "i": 61, "g": "I", "p": "Fase de grupos", "j": 3, "h": "Noruega", "hf": "no", "a": "Francia", "af": "fr", "d": "2026-06-26", "t": "15:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us" },
  { "i": 62, "g": "I", "p": "Fase de grupos", "j": 3, "h": "Senegal", "hf": "sn", "a": "Irak", "af": "iq", "d": "2026-06-26", "t": "15:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca" },
  { "i": 63, "g": "G", "p": "Fase de grupos", "j": 3, "h": "Egipto", "hf": "eg", "a": "Irán", "af": "ir", "d": "2026-06-26", "t": "23:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },
  { "i": 64, "g": "G", "p": "Fase de grupos", "j": 3, "h": "N. Zelanda", "hf": "nz", "a": "Bélgica", "af": "be", "d": "2026-06-26", "t": "23:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },
  { "i": 65, "g": "H", "p": "Fase de grupos", "j": 3, "h": "Cabo Verde", "hf": "cv", "a": "A. Saudí", "af": "sa", "d": "2026-06-26", "t": "20:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },
  { "i": 66, "g": "H", "p": "Fase de grupos", "j": 3, "h": "Uruguay", "hf": "uy", "a": "España", "af": "es", "d": "2026-06-26", "t": "20:00", "vn": "Estadio Akron", "vc": "Guadalajara", "vf": "mx" },
  { "i": 67, "g": "L", "p": "Fase de grupos", "j": 3, "h": "Panamá", "hf": "pa", "a": "Inglaterra", "af": "gb-eng", "d": "2026-06-27", "t": "17:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
  { "i": 68, "g": "L", "p": "Fase de grupos", "j": 3, "h": "Croacia", "hf": "hr", "a": "Ghana", "af": "gh", "d": "2026-06-27", "t": "17:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us" },
  { "i": 69, "g": "J", "p": "Fase de grupos", "j": 3, "h": "Argelia", "hf": "dz", "a": "Austria", "af": "at", "d": "2026-06-27", "t": "22:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us" },
  { "i": 70, "g": "J", "p": "Fase de grupos", "j": 3, "h": "Jordania", "hf": "jo", "a": "Argentina", "af": "ar", "d": "2026-06-27", "t": "22:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 71, "g": "K", "p": "Fase de grupos", "j": 3, "h": "Colombia", "hf": "co", "a": "Portugal", "af": "pt", "d": "2026-06-27", "t": "19:30", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },
  { "i": 72, "g": "K", "p": "Fase de grupos", "j": 3, "h": "RD Congo", "hf": "cd", "a": "Uzbekistán", "af": "uz", "d": "2026-06-27", "t": "19:30", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },

  // DIECISEISAVOS
  { "i": 73, "g": "", "p": "Dieciseisavos", "j": 0, "h": "Sudáfrica", "hf": "za", "a": "Canadá", "af": "ca", "d": "2026-06-28", "t": "15:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },
  { "i": 74, "g": "", "p": "Dieciseisavos", "j": 0, "h": "Alemania", "hf": "de", "a": "Paraguay", "af": "py", "d": "2026-06-29", "t": "16:30", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us" },
  { "i": 75, "g": "", "p": "Dieciseisavos", "j": 0, "h": "P. Bajos", "hf": "nl", "a": "Marruecos", "af": "ma", "d": "2026-06-29", "t": "21:00", "vn": "Estadio BBVA", "vc": "Monterrey", "vf": "mx" },
  { "i": 76, "g": "", "p": "Dieciseisavos", "j": 0, "h": "Brasil", "hf": "br", "a": "Japón", "af": "jp", "d": "2026-06-29", "t": "13:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },
  { "i": 77, "g": "", "p": "Dieciseisavos", "j": 0, "h": "Francia", "hf": "fr", "a": "Suecia", "af": "se", "d": "2026-06-30", "t": "17:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
  { "i": 78, "g": "", "p": "Dieciseisavos", "j": 0, "h": "C. de Marfil", "hf": "ci", "a": "Noruega", "af": "no", "d": "2026-06-30", "t": "13:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 79, "g": "", "p": "Dieciseisavos", "j": 0, "h": "México", "hf": "mx", "a": "Ecuador", "af": "ec", "d": "2026-06-30", "t": "21:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx" },
  { "i": 80, "g": "", "p": "Dieciseisavos", "j": 0, "h": "Inglaterra", "hf": "gb-eng", "a": "RD Congo", "af": "cd", "d": "2026-07-01", "t": "12:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },
  { "i": 81, "g": "", "p": "Dieciseisavos", "j": 0, "h": "EE.UU.", "hf": "us", "a": "Bosnia", "af": "ba", "d": "2026-07-01", "t": "20:00", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us" },
  { "i": 82, "g": "", "p": "Dieciseisavos", "j": 0, "h": "Bélgica", "hf": "be", "a": "Senegal", "af": "sn", "d": "2026-07-01", "t": "16:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },
  { "i": 83, "g": "", "p": "Dieciseisavos", "j": 0, "h": "Portugal", "hf": "pt", "a": "Croacia", "af": "hr", "d": "2026-07-02", "t": "19:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca" },
  { "i": 84, "g": "", "p": "Dieciseisavos", "j": 0, "h": "España", "hf": "es", "a": "Austria", "af": "at", "d": "2026-07-02", "t": "15:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },
  { "i": 85, "g": "", "p": "Dieciseisavos", "j": 0, "h": "Suiza", "hf": "ch", "a": "Argelia", "af": "dz", "d": "2026-07-02", "t": "23:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },
  { "i": 86, "g": "", "p": "Dieciseisavos", "j": 0, "h": "Argentina", "hf": "ar", "a": "Cabo Verde", "af": "cv", "d": "2026-07-03", "t": "18:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },
  { "i": 87, "g": "", "p": "Dieciseisavos", "j": 0, "h": "Colombia", "hf": "co", "a": "Ghana", "af": "gh", "d": "2026-07-03", "t": "21:30", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us" },
  { "i": 88, "g": "", "p": "Dieciseisavos", "j": 0, "h": "Australia", "hf": "au", "a": "Egipto", "af": "eg", "d": "2026-07-03", "t": "14:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },

  // OCTAVOS DE FINAL
  { "i": 89, "g": "", "p": "Octavos de final", "j": 0, "h": "Paraguay", "hf": "py", "a": "Francia", "af": "fr", "d": "2026-07-04", "t": "17:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us" },
  { "i": 90, "g": "", "p": "Octavos de final", "j": 0, "h": "Canadá", "hf": "ca", "a": "Marruecos", "af": "ma", "d": "2026-07-04", "t": "13:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us" },
  { "i": 91, "g": "", "p": "Octavos de final", "j": 0, "h": "Brasil", "hf": "br", "a": "Noruega", "af": "no", "d": "2026-07-05", "t": "16:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
  { "i": 92, "g": "", "p": "Octavos de final", "j": 0, "h": "México", "hf": "mx", "a": "Inglaterra", "af": "gb-eng", "d": "2026-07-05", "t": "20:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx" },
  { "i": 93, "g": "", "p": "Octavos de final", "j": 0, "h": "Portugal", "hf": "pt", "a": "España", "af": "es", "d": "2026-07-06", "t": "15:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 94, "g": "", "p": "Octavos de final", "j": 0, "h": "EE.UU.", "hf": "us", "a": "Bélgica", "af": "be", "d": "2026-07-06", "t": "20:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us" },
  { "i": 95, "g": "", "p": "Octavos de final", "j": 0, "h": "Argentina", "hf": "ar", "a": "Egipto", "af": "eg", "d": "2026-07-07", "t": "12:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },
  { "i": 96, "g": "", "p": "Octavos de final", "j": 0, "h": "Suiza", "hf": "ch", "a": "Colombia", "af": "co", "d": "2026-07-07", "t": "16:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca" },

  // CUARTOS DE FINAL
  { "i": 97, "g": "", "p": "Cuartos de final", "j": 0, "h": "Francia", "hf": "fr", "a": "Marruecos", "af": "ma", "d": "2026-07-09", "t": "16:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us" },
  { "i": 98, "g": "", "p": "Cuartos de final", "j": 0, "h": "España", "hf": "es", "a": "Bélgica", "af": "be", "d": "2026-07-10", "t": "15:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us" },
  { "i": 99, "g": "", "p": "Cuartos de final", "j": 0, "h": "Noruega", "hf": "no", "a": "Inglaterra", "af": "gb-eng", "d": "2026-07-11", "t": "17:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },
  { "i": 100, "g": "", "p": "Cuartos de final", "j": 0, "h": "Argentina", "hf": "ar", "a": "Suiza", "af": "ch", "d": "2026-07-11", "t": "21:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us" },

  // SEMIFINAL
  { "i": 101, "g": "", "p": "Semifinal", "j": 0, "h": "Francia", "hf": "fr", "a": "España", "af": "es", "d": "2026-07-14", "t": "15:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us" },
  { "i": 102, "g": "", "p": "Semifinal", "j": 0, "h": "Inglaterra", "hf": "gb-eng", "a": "Argentina", "af": "ar", "d": "2026-07-15", "t": "15:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us" },

  // TERCER PUESTO
  { "i": 103, "g": "", "p": "Tercer puesto", "j": 0, "h": "L101", "hf": "tbd", "a": "L102", "af": "tbd", "d": "2026-07-18", "t": "17:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us" },

  // FINAL
  { "i": 104, "g": "", "p": "FINAL", "j": 0, "h": "W101", "hf": "tbd", "a": "W102", "af": "tbd", "d": "2026-07-19", "t": "15:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us" },
  // ── PRUEBA Match Center con datos reales de un amistoso (no se lista: j=99).
  //    El fixture real se autoresuelve desde api-football (liga 10) por nombres.
  //    t en ET: 15:45 ET = 20:45 (hora de Portugal, WEST) del miércoles 10/6/2026.
  //    OJO: las ventanas del cron/featured se derivan de esta fecha; si el
  //    partido cambia de día/rival hay que actualizar esta fila Y el nombre del
  //    rival en getFixtureId() de src/lib/match-center/store.ts.
  { "i": 9002, "g": "", "p": "Amistoso", "j": 99, "h": "Portugal", "hf": "pt", "a": "Nigeria", "af": "ng", "d": "2026-06-10", "t": "15:45", "vn": "Estádio Magalhães Pessoa", "vc": "Leiria", "vf": "pt" },
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
