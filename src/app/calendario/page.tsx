// src/app/calendario/page.tsx
// ZonaMundial.app — Calendario del Mundial 2026 (Diseño ESPECTACULAR)

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/i18n/LanguageContext";

const BG="#060B14",BG2="#0F1D32",BG3="#0B1825",GOLD="#c9a84c",GOLD2="#e8d48b",MID="#8a94b0",DIM="#6a7a9a",DARK="#4a5570";

// Calendario completo del Mundial 2026 - Todos los partidos
const M=[
  // GRUPO A (Jornada 1 - 11 Junio)
  {"i": 1, "g": "A", "p": "Fase de grupos", "j": 1, "h": "México", "hf": "mx", "a": "Sudáfrica", "af": "za", "d": "2026-06-11", "t": "12:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us"},
  {"i": 2, "g": "A", "p": "Fase de grupos", "j": 1, "h": "Corea del Sur", "hf": "kr", "a": "Rep. Checa", "af": "cz", "d": "2026-06-11", "t": "18:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx"},
  
  // GRUPO B (Jornada 1 - 12 Junio)
  {"i": 3, "g": "B", "p": "Fase de grupos", "j": 1, "h": "Canadá", "hf": "ca", "a": "Qatar", "af": "qa", "d": "2026-06-12", "t": "12:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us"},
  {"i": 4, "g": "B", "p": "Fase de grupos", "j": 1, "h": "Bosnia", "hf": "ba", "a": "Suiza", "af": "ch", "d": "2026-06-12", "t": "15:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us"},
  
  // GRUPO C (Jornada 1 - 12 Junio)
  {"i": 5, "g": "C", "p": "Fase de grupos", "j": 1, "h": "Brasil", "hf": "br", "a": "Haití", "af": "ht", "d": "2026-06-12", "t": "18:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us"},
  {"i": 6, "g": "C", "p": "Fase de grupos", "j": 1, "h": "Marruecos", "hf": "ma", "a": "Escocia", "af": "gb-sct", "d": "2026-06-12", "t": "21:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us"},
  
  // GRUPO D (Jornada 1 - 13 Junio)
  {"i": 7, "g": "D", "p": "Fase de grupos", "j": 1, "h": "EE.UU.", "hf": "us", "a": "Australia", "af": "au", "d": "2026-06-13", "t": "12:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us"},
  {"i": 8, "g": "D", "p": "Fase de grupos", "j": 1, "h": "Paraguay", "hf": "py", "a": "Turquía", "af": "tr", "d": "2026-06-13", "t": "15:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us"},
  
  // GRUPO E (Jornada 1 - 13 Junio)
  {"i": 9, "g": "E", "p": "Fase de grupos", "j": 1, "h": "Alemania", "hf": "de", "a": "C. de Marfil", "af": "ci", "d": "2026-06-13", "t": "18:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us"},
  {"i": 10, "g": "E", "p": "Fase de grupos", "j": 1, "h": "Curazao", "hf": "cw", "a": "Ecuador", "af": "ec", "d": "2026-06-13", "t": "21:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us"},
  
  // GRUPO F (Jornada 1 - 14 Junio)
  {"i": 11, "g": "F", "p": "Fase de grupos", "j": 1, "h": "P. Bajos", "hf": "nl", "a": "Túnez", "af": "tn", "d": "2026-06-14", "t": "12:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca"},
  {"i": 12, "g": "F", "p": "Fase de grupos", "j": 1, "h": "Japón", "hf": "jp", "a": "Suecia", "af": "se", "d": "2026-06-14", "t": "15:00", "vn": "Estadio BBVA", "vc": "Monterrey", "vf": "mx"},
  
  // GRUPO G (Jornada 1 - 14 Junio)
  {"i": 13, "g": "G", "p": "Fase de grupos", "j": 1, "h": "Bélgica", "hf": "be", "a": "N. Zelanda", "af": "nz", "d": "2026-06-14", "t": "18:00", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us"},
  {"i": 14, "g": "G", "p": "Fase de grupos", "j": 1, "h": "Egipto", "hf": "eg", "a": "Irán", "af": "ir", "d": "2026-06-14", "t": "21:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca"},
  
  // GRUPO H (Jornada 1 - 15 Junio)
  {"i": 15, "g": "H", "p": "Fase de grupos", "j": 1, "h": "España", "hf": "es", "a": "Cabo Verde", "af": "cv", "d": "2026-06-15", "t": "12:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx"},
  {"i": 16, "g": "H", "p": "Fase de grupos", "j": 1, "h": "Uruguay", "hf": "uy", "a": "A. Saudí", "af": "sa", "d": "2026-06-15", "t": "15:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us"},
  
  // GRUPO I (Jornada 1 - 15 Junio)
  {"i": 17, "g": "I", "p": "Fase de grupos", "j": 1, "h": "Francia", "hf": "fr", "a": "Senegal", "af": "sn", "d": "2026-06-15", "t": "18:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us"},
  {"i": 18, "g": "I", "p": "Fase de grupos", "j": 1, "h": "Noruega", "hf": "no", "a": "Irak", "af": "iq", "d": "2026-06-15", "t": "21:00", "vn": "Estadio Akron", "vc": "Guadalajara", "vf": "mx"},
  
  // GRUPO J (Jornada 1 - 16 Junio)
  {"i": 19, "g": "J", "p": "Fase de grupos", "j": 1, "h": "Argentina", "hf": "ar", "a": "Argelia", "af": "dz", "d": "2026-06-16", "t": "12:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us"},
  {"i": 20, "g": "J", "p": "Fase de grupos", "j": 1, "h": "Austria", "hf": "at", "a": "Jordania", "af": "jo", "d": "2026-06-16", "t": "15:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us"},
  
  // GRUPO K (Jornada 1 - 16 Junio)
  {"i": 21, "g": "K", "p": "Fase de grupos", "j": 1, "h": "Portugal", "hf": "pt", "a": "Uzbekistán", "af": "uz", "d": "2026-06-16", "t": "18:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us"},
  {"i": 22, "g": "K", "p": "Fase de grupos", "j": 1, "h": "Colombia", "hf": "co", "a": "RD Congo", "af": "cd", "d": "2026-06-16", "t": "21:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us"},
  
  // GRUPO L (Jornada 1 - 17 Junio)
  {"i": 23, "g": "L", "p": "Fase de grupos", "j": 1, "h": "Inglaterra", "hf": "gb-eng", "a": "Croacia", "af": "hr", "d": "2026-06-17", "t": "12:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us"},
  {"i": 24, "g": "L", "p": "Fase de grupos", "j": 1, "h": "Ghana", "hf": "gh", "a": "Panamá", "af": "pa", "d": "2026-06-17", "t": "15:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us"},
  
  // JORNADA 2 - 18-22 Junio
  {"i": 25, "g": "A", "p": "Fase de grupos", "j": 2, "h": "Sudáfrica", "hf": "za", "a": "Corea del Sur", "af": "kr", "d": "2026-06-18", "t": "15:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us"},
  {"i": 26, "g": "A", "p": "Fase de grupos", "j": 2, "h": "México", "hf": "mx", "a": "Rep. Checa", "af": "cz", "d": "2026-06-18", "t": "21:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx"},
  
  {"i": 27, "g": "B", "p": "Fase de grupos", "j": 2, "h": "Qatar", "hf": "qa", "a": "Bosnia", "af": "ba", "d": "2026-06-19", "t": "12:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us"},
  {"i": 28, "g": "B", "p": "Fase de grupos", "j": 2, "h": "Canadá", "hf": "ca", "a": "Suiza", "af": "ch", "d": "2026-06-19", "t": "18:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca"},
  
  {"i": 29, "g": "C", "p": "Fase de grupos", "j": 2, "h": "Haití", "hf": "ht", "a": "Marruecos", "af": "ma", "d": "2026-06-19", "t": "21:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us"},
  {"i": 30, "g": "C", "p": "Fase de grupos", "j": 2, "h": "Brasil", "hf": "br", "a": "Escocia", "af": "gb-sct", "d": "2026-06-20", "t": "15:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us"},
  
  {"i": 31, "g": "D", "p": "Fase de grupos", "j": 2, "h": "Australia", "hf": "au", "a": "Paraguay", "af": "py", "d": "2026-06-20", "t": "18:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us"},
  {"i": 32, "g": "D", "p": "Fase de grupos", "j": 2, "h": "EE.UU.", "hf": "us", "a": "Turquía", "af": "tr", "d": "2026-06-20", "t": "21:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us"},
  
  {"i": 33, "g": "E", "p": "Fase de grupos", "j": 2, "h": "C. de Marfil", "hf": "ci", "a": "Ecuador", "af": "ec", "d": "2026-06-21", "t": "12:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us"},
  {"i": 34, "g": "E", "p": "Fase de grupos", "j": 2, "h": "Alemania", "hf": "de", "a": "Curazao", "af": "cw", "d": "2026-06-21", "t": "18:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us"},
  
  {"i": 35, "g": "F", "p": "Fase de grupos", "j": 2, "h": "Túnez", "hf": "tn", "a": "Suecia", "af": "se", "d": "2026-06-21", "t": "21:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca"},
  {"i": 36, "g": "F", "p": "Fase de grupos", "j": 2, "h": "P. Bajos", "hf": "nl", "a": "Japón", "af": "jp", "d": "2026-06-22", "t": "15:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us"},
  
  {"i": 37, "g": "G", "p": "Fase de grupos", "j": 2, "h": "N. Zelanda", "hf": "nz", "a": "Egipto", "af": "eg", "d": "2026-06-22", "t": "18:00", "vn": "Estadio BBVA", "vc": "Monterrey", "vf": "mx"},
  {"i": 38, "g": "G", "p": "Fase de grupos", "j": 2, "h": "Bélgica", "hf": "be", "a": "Irán", "af": "ir", "d": "2026-06-22", "t": "21:00", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us"},
  
  {"i": 39, "g": "H", "p": "Fase de grupos", "j": 2, "h": "Cabo Verde", "hf": "cv", "a": "A. Saudí", "af": "sa", "d": "2026-06-23", "t": "12:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx"},
  {"i": 40, "g": "H", "p": "Fase de grupos", "j": 2, "h": "España", "hf": "es", "a": "Uruguay", "af": "uy", "d": "2026-06-23", "t": "18:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us"},
  
  {"i": 41, "g": "I", "p": "Fase de grupos", "j": 2, "h": "Senegal", "hf": "sn", "a": "Irak", "af": "iq", "d": "2026-06-23", "t": "21:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us"},
  {"i": 42, "g": "I", "p": "Fase de grupos", "j": 2, "h": "Francia", "hf": "fr", "a": "Noruega", "af": "no", "d": "2026-06-24", "t": "15:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us"},
  
  {"i": 43, "g": "J", "p": "Fase de grupos", "j": 2, "h": "Argelia", "hf": "dz", "a": "Jordania", "af": "jo", "d": "2026-06-24", "t": "18:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us"},
  {"i": 44, "g": "J", "p": "Fase de grupos", "j": 2, "h": "Argentina", "hf": "ar", "a": "Austria", "af": "at", "d": "2026-06-24", "t": "21:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us"},
  
  {"i": 45, "g": "K", "p": "Fase de grupos", "j": 2, "h": "Uzbekistán", "hf": "uz", "a": "RD Congo", "af": "cd", "d": "2026-06-25", "t": "12:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us"},
  {"i": 46, "g": "K", "p": "Fase de grupos", "j": 2, "h": "Portugal", "hf": "pt", "a": "Colombia", "af": "co", "d": "2026-06-25", "t": "18:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca"},
  
  {"i": 47, "g": "L", "p": "Fase de grupos", "j": 2, "h": "Croacia", "hf": "hr", "a": "Ghana", "af": "gh", "d": "2026-06-25", "t": "21:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us"},
  {"i": 48, "g": "L", "p": "Fase de grupos", "j": 2, "h": "Inglaterra", "hf": "gb-eng", "a": "Panamá", "af": "pa", "d": "2026-06-26", "t": "15:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us"},
  
  // JORNADA 3 - 26-30 Junio
  {"i": 49, "g": "A", "p": "Fase de grupos", "j": 3, "h": "Corea del Sur", "hf": "kr", "a": "México", "af": "mx", "d": "2026-06-26", "t": "18:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us"},
  {"i": 50, "g": "A", "p": "Fase de grupos", "j": 3, "h": "Rep. Checa", "hf": "cz", "a": "Sudáfrica", "af": "za", "d": "2026-06-26", "t": "21:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx"},
  
  {"i": 51, "g": "B", "p": "Fase de grupos", "j": 3, "h": "Suiza", "hf": "ch", "a": "Qatar", "af": "qa", "d": "2026-06-27", "t": "12:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us"},
  {"i": 52, "g": "B", "p": "Fase de grupos", "j": 3, "h": "Bosnia", "hf": "ba", "a": "Canadá", "af": "ca", "d": "2026-06-27", "t": "18:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca"},
  
  {"i": 53, "g": "C", "p": "Fase de grupos", "j": 3, "h": "Escocia", "hf": "gb-sct", "a": "Haití", "af": "ht", "d": "2026-06-27", "t": "21:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us"},
  {"i": 54, "g": "C", "p": "Fase de grupos", "j": 3, "h": "Marruecos", "hf": "ma", "a": "Brasil", "af": "br", "d": "2026-06-28", "t": "15:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us"},
  
  {"i": 55, "g": "D", "p": "Fase de grupos", "j": 3, "h": "Paraguay", "hf": "py", "a": "EE.UU.", "af": "us", "d": "2026-06-28", "t": "18:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us"},
  {"i": 56, "g": "D", "p": "Fase de grupos", "j": 3, "h": "Turquía", "hf": "tr", "a": "Australia", "af": "au", "d": "2026-06-28", "t": "21:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us"},
  
  {"i": 57, "g": "E", "p": "Fase de grupos", "j": 3, "h": "Curazao", "hf": "cw", "a": "C. de Marfil", "af": "ci", "d": "2026-06-29", "t": "12:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us"},
  {"i": 58, "g": "E", "p": "Fase de grupos", "j": 3, "h": "Ecuador", "hf": "ec", "a": "Alemania", "af": "de", "d": "2026-06-29", "t": "18:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us"},
  
  {"i": 59, "g": "F", "p": "Fase de grupos", "j": 3, "h": "Suecia", "hf": "se", "a": "P. Bajos", "af": "nl", "d": "2026-06-29", "t": "21:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca"},
  {"i": 60, "g": "F", "p": "Fase de grupos", "j": 3, "h": "Japón", "hf": "jp", "a": "Túnez", "af": "tn", "d": "2026-06-30", "t": "15:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us"},
  
  {"i": 61, "g": "G", "p": "Fase de grupos", "j": 3, "h": "Egipto", "hf": "eg", "a": "Bélgica", "af": "be", "d": "2026-06-30", "t": "18:00", "vn": "Estadio BBVA", "vc": "Monterrey", "vf": "mx"},
  {"i": 62, "g": "G", "p": "Fase de grupos", "j": 3, "h": "Irán", "hf": "ir", "a": "N. Zelanda", "af": "nz", "d": "2026-06-30", "t": "21:00", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us"},
  
  {"i": 63, "g": "H", "p": "Fase de grupos", "j": 3, "h": "A. Saudí", "hf": "sa", "a": "España", "af": "es", "d": "2026-07-01", "t": "12:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx"},
  {"i": 64, "g": "H", "p": "Fase de grupos", "j": 3, "h": "Uruguay", "hf": "uy", "a": "Cabo Verde", "af": "cv", "d": "2026-07-01", "t": "18:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us"},
  
  {"i": 65, "g": "I", "p": "Fase de grupos", "j": 3, "h": "Irak", "hf": "iq", "a": "Francia", "af": "fr", "d": "2026-07-01", "t": "21:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us"},
  {"i": 66, "g": "I", "p": "Fase de grupos", "j": 3, "h": "Noruega", "hf": "no", "a": "Senegal", "af": "sn", "d": "2026-07-02", "t": "15:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us"},
  
  {"i": 67, "g": "J", "p": "Fase de grupos", "j": 3, "h": "Jordania", "hf": "jo", "a": "Argentina", "af": "ar", "d": "2026-07-02", "t": "18:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us"},
  {"i": 68, "g": "J", "p": "Fase de grupos", "j": 3, "h": "Austria", "hf": "at", "a": "Argelia", "af": "dz", "d": "2026-07-02", "t": "21:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us"},
  
  {"i": 69, "g": "K", "p": "Fase de grupos", "j": 3, "h": "RD Congo", "hf": "cd", "a": "Portugal", "af": "pt", "d": "2026-07-03", "t": "12:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us"},
  {"i": 70, "g": "K", "p": "Fase de grupos", "j": 3, "h": "Colombia", "hf": "co", "a": "Uzbekistán", "af": "uz", "d": "2026-07-03", "t": "18:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca"},
  
  {"i": 71, "g": "L", "p": "Fase de grupos", "j": 3, "h": "Panamá", "hf": "pa", "a": "Inglaterra", "af": "gb-eng", "d": "2026-07-03", "t": "21:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us"},
  {"i": 72, "g": "L", "p": "Fase de grupos", "j": 3, "h": "Ghana", "hf": "gh", "a": "Croacia", "af": "hr", "d": "2026-07-04", "t": "15:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us"},
  
  // ELIMINATORIAS
  // 32avos de final
  {"i": 73, "g": "", "p": "32avos de final", "j": 0, "h": "1° Grupo A", "hf": "tbd", "a": "3° Grupo B/C", "af": "tbd", "d": "2026-07-05", "t": "12:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us"},
  {"i": 74, "g": "", "p": "32avos de final", "j": 0, "h": "1° Grupo C", "hf": "tbd", "a": "3° Grupo D/E/F", "af": "tbd", "d": "2026-07-05", "t": "15:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us"},
  {"i": 75, "g": "", "p": "32avos de final", "j": 0, "h": "1° Grupo E", "hf": "tbd", "a": "3° Grupo F/G/H", "af": "tbd", "d": "2026-07-05", "t": "18:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us"},
  {"i": 76, "g": "", "p": "32avos de final", "j": 0, "h": "1° Grupo G", "hf": "tbd", "a": "3° Grupo H/I/J", "af": "tbd", "d": "2026-07-05", "t": "21:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us"},
  {"i": 77, "g": "", "p": "32avos de final", "j": 0, "h": "2° Grupo B", "hf": "tbd", "a": "2° Grupo F", "af": "tbd", "d": "2026-07-06", "t": "12:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca"},
  {"i": 78, "g": "", "p": "32avos de final", "j": 0, "h": "2° Grupo D", "hf": "tbd", "a": "2° Grupo H", "af": "tbd", "d": "2026-07-06", "t": "15:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx"},
  {"i": 79, "g": "", "p": "32avos de final", "j": 0, "h": "2° Grupo J", "hf": "tbd", "a": "2° Grupo L", "af": "tbd", "d": "2026-07-06", "t": "18:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us"},
  {"i": 80, "g": "", "p": "32avos de final", "j": 0, "h": "1° Grupo I", "hf": "tbd", "a": "3° Grupo J/K/L", "af": "tbd", "d": "2026-07-06", "t": "21:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us"},
  {"i": 81, "g": "", "p": "32avos de final", "j": 0, "h": "1° Grupo K", "hf": "tbd", "a": "3° Grupo A/B/C", "af": "tbd", "d": "2026-07-07", "t": "12:00", "vn": "Lumen Field", "vc": "Seattle", "vf": "us"},
  {"i": 82, "g": "", "p": "32avos de final", "j": 0, "h": "1° Grupo L", "hf": "tbd", "a": "3° Grupo E/F/G", "af": "tbd", "d": "2026-07-07", "t": "15:00", "vn": "BMO Field", "vc": "Toronto", "vf": "ca"},
  {"i": 83, "g": "", "p": "32avos de final", "j": 0, "h": "2° Grupo A", "hf": "tbd", "a": "2° Grupo E", "af": "tbd", "d": "2026-07-07", "t": "18:00", "vn": "Estadio BBVA", "vc": "Monterrey", "vf": "mx"},
  {"i": 84, "g": "", "p": "32avos de final", "j": 0, "h": "2° Grupo C", "hf": "tbd", "a": "2° Grupo G", "af": "tbd", "d": "2026-07-07", "t": "21:00", "vn": "Arrowhead Stadium", "vc": "Kansas City", "vf": "us"},
  {"i": 85, "g": "", "p": "32avos de final", "j": 0, "h": "2° Grupo I", "hf": "tbd", "a": "2° Grupo K", "af": "tbd", "d": "2026-07-08", "t": "12:00", "vn": "Lincoln Financial Field", "vc": "Filadelfia", "vf": "us"},
  {"i": 86, "g": "", "p": "32avos de final", "j": 0, "h": "2° Grupo J", "hf": "tbd", "a": "3° Grupo A/B/D", "af": "tbd", "d": "2026-07-08", "t": "15:00", "vn": "Gillette Stadium", "vc": "Boston", "vf": "us"},
  {"i": 87, "g": "", "p": "32avos de final", "j": 0, "h": "2° Grupo D", "hf": "tbd", "a": "3° Grupo C/E/F", "af": "tbd", "d": "2026-07-08", "t": "18:00", "vn": "Levi's Stadium", "vc": "Bay Area", "vf": "us"},
  {"i": 88, "g": "", "p": "32avos de final", "j": 0, "h": "2° Grupo H", "hf": "tbd", "a": "3° Grupo G/I/J", "af": "tbd", "d": "2026-07-08", "t": "21:00", "vn": "Estadio Akron", "vc": "Guadalajara", "vf": "mx"},
  
  // 16avos de final
  {"i": 89, "g": "", "p": "16avos de final", "j": 0, "h": "Ganador 73", "hf": "tbd", "a": "Ganador 74", "af": "tbd", "d": "2026-07-09", "t": "12:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us"},
  {"i": 90, "g": "", "p": "16avos de final", "j": 0, "h": "Ganador 75", "hf": "tbd", "a": "Ganador 76", "af": "tbd", "d": "2026-07-09", "t": "15:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us"},
  {"i": 91, "g": "", "p": "16avos de final", "j": 0, "h": "Ganador 77", "hf": "tbd", "a": "Ganador 78", "af": "tbd", "d": "2026-07-09", "t": "18:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us"},
  {"i": 92, "g": "", "p": "16avos de final", "j": 0, "h": "Ganador 79", "hf": "tbd", "a": "Ganador 80", "af": "tbd", "d": "2026-07-09", "t": "21:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us"},
  {"i": 93, "g": "", "p": "16avos de final", "j": 0, "h": "Ganador 81", "hf": "tbd", "a": "Ganador 82", "af": "tbd", "d": "2026-07-10", "t": "12:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca"},
  {"i": 94, "g": "", "p": "16avos de final", "j": 0, "h": "Ganador 83", "hf": "tbd", "a": "Ganador 84", "af": "tbd", "d": "2026-07-10", "t": "15:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx"},
  {"i": 95, "g": "", "p": "16avos de final", "j": 0, "h": "Ganador 85", "hf": "tbd", "a": "Ganador 86", "af": "tbd", "d": "2026-07-10", "t": "18:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us"},
  {"i": 96, "g": "", "p": "16avos de final", "j": 0, "h": "Ganador 87", "hf": "tbd", "a": "Ganador 88", "af": "tbd", "d": "2026-07-10", "t": "21:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us"},
  
  // Octavos de final
  {"i": 97, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 89", "hf": "tbd", "a": "Ganador 90", "af": "tbd", "d": "2026-07-11", "t": "12:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us"},
  {"i": 98, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 91", "hf": "tbd", "a": "Ganador 92", "af": "tbd", "d": "2026-07-11", "t": "15:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us"},
  {"i": 99, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 93", "hf": "tbd", "a": "Ganador 94", "af": "tbd", "d": "2026-07-11", "t": "18:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us"},
  {"i": 100, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 95", "hf": "tbd", "a": "Ganador 96", "af": "tbd", "d": "2026-07-11", "t": "21:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us"},
  {"i": 101, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 97", "hf": "tbd", "a": "Ganador 98", "af": "tbd", "d": "2026-07-12", "t": "12:00", "vn": "BC Place", "vc": "Vancouver", "vf": "ca"},
  {"i": 102, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 99", "hf": "tbd", "a": "Ganador 100", "af": "tbd", "d": "2026-07-12", "t": "15:00", "vn": "Estadio Azteca", "vc": "Ciudad de México", "vf": "mx"},
  {"i": 103, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 101", "hf": "tbd", "a": "Ganador 102", "af": "tbd", "d": "2026-07-12", "t": "18:00", "vn": "Mercedes-Benz Stadium", "vc": "Atlanta", "vf": "us"},
  {"i": 104, "g": "", "p": "Octavos de final", "j": 0, "h": "Ganador 103", "hf": "tbd", "a": "Ganador 104", "af": "tbd", "d": "2026-07-12", "t": "21:00", "vn": "NRG Stadium", "vc": "Houston", "vf": "us"},
  
  // Cuartos de final
  {"i": 105, "g": "", "p": "Cuartos de final", "j": 0, "h": "Ganador 97", "hf": "tbd", "a": "Ganador 98", "af": "tbd", "d": "2026-07-14", "t": "12:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us"},
  {"i": 106, "g": "", "p": "Cuartos de final", "j": 0, "h": "Ganador 99", "hf": "tbd", "a": "Ganador 100", "af": "tbd", "d": "2026-07-14", "t": "15:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us"},
  {"i": 107, "g": "", "p": "Cuartos de final", "j": 0, "h": "Ganador 101", "hf": "tbd", "a": "Ganador 102", "af": "tbd", "d": "2026-07-14", "t": "18:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us"},
  {"i": 108, "g": "", "p": "Cuartos de final", "j": 0, "h": "Ganador 103", "hf": "tbd", "a": "Ganador 104", "af": "tbd", "d": "2026-07-14", "t": "21:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us"},
  
  // Semifinales
  {"i": 109, "g": "", "p": "Semifinal", "j": 0, "h": "Ganador 105", "hf": "tbd", "a": "Ganador 106", "af": "tbd", "d": "2026-07-17", "t": "15:00", "vn": "SoFi Stadium", "vc": "Los Ángeles", "vf": "us"},
  {"i": 110, "g": "", "p": "Semifinal", "j": 0, "h": "Ganador 107", "hf": "tbd", "a": "Ganador 108", "af": "tbd", "d": "2026-07-17", "t": "21:00", "vn": "AT&T Stadium", "vc": "Dallas", "vf": "us"},
  
  // 3er puesto
  {"i": 111, "g": "", "p": "Tercer puesto", "j": 0, "h": "Perdedor SF1", "hf": "tbd", "a": "Perdedor SF2", "af": "tbd", "d": "2026-07-19", "t": "12:00", "vn": "Hard Rock Stadium", "vc": "Miami", "vf": "us"},
  
  // FINAL
  {"i": 112, "g": "", "p": "FINAL", "j": 0, "h": "Ganador SF1", "hf": "tbd", "a": "Ganador SF2", "af": "tbd", "d": "2026-07-19", "t": "16:00", "vn": "MetLife Stadium", "vc": "Nueva York/NJ", "vf": "us"},
];

const PHASES=["Fase de grupos","Dieciseisavos","Octavos de final","Cuartos de final","Semifinal","Tercer puesto","FINAL"];
const GROUPS="ABCDEFGHIJKL".split("");
const MONTHS_ES={"06":"Junio","07":"Julio"};
const DAYS_FULL=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

const fmtDate=(s: string)=>{const d=new Date(s+"T12:00:00");return`${DAYS_FULL[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[s.split("-")[1] as keyof typeof MONTHS_ES]}`};
const fmtShort=(s: string)=>{const p=s.split("-");return`${parseInt(p[2])} ${p[1]==="06"?"Jun":"Jul"}`};
const flagUrl=(code: string | null,w=80)=>code&&code!=="tbd"?`https://flagcdn.com/w${w}/${code}.png`:null;

// Cuenta regresiva
function useCountdown(){
  const[target]=useState(()=>new Date("2026-06-11T12:00:00-05:00"));
  const[timeLeft,setTimeLeft]=useState({d:0,h:0,m:0,s:0});
  
  useEffect(()=>{
    const calc=()=>{
      const diff=target.getTime()-Date.now();
      if(diff<=0)return;
      setTimeLeft({
        d:Math.floor(diff/(1000*60*60*24)),
        h:Math.floor((diff%(1000*60*60*24))/(1000*60*60)),
        m:Math.floor((diff%(1000*60*60))/(1000*60)),
        s:Math.floor((diff%(1000*60))/1000)
      });
    };
    calc();
    const id=setInterval(calc,1000);
    return()=>clearInterval(id);
  },[target]);
  
  return timeLeft;
}

function useInView(th=0.1){
  const ref=useRef<HTMLDivElement>(null);const[v,setV]=useState(false);
  useEffect(()=>{if(!ref.current)return;const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);o.disconnect()}},{threshold:th,root:null});o.observe(ref.current);return()=>o.disconnect()},[]);
  return[ref,v] as const;
}

// Card de partido ESPECTACULAR
function MatchCard({m,onClick}:{m: typeof M[0];onClick: ()=>void}){
  const[hov,setHov]=useState(false);
  const isImportant=m.p==="FINAL"||m.p==="Semifinal";
  
  return(
    <div
      onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        borderRadius:20,
        cursor:"pointer",
        position:"relative",
        overflow:"hidden",
        border:`2px solid ${hov?"rgba(201,168,76,0.5)":isImportant?"rgba(201,168,76,0.3)":"rgba(255,255,255,0.05)"}`,
        boxShadow:hov?"0 20px 60px rgba(201,168,76,0.15), 0 8px 24px rgba(0,0,0,0.4)":"0 4px 12px rgba(0,0,0,0.2)",
        background:BG2,
        transition:"all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        transform:hov?"translateY(-4px) scale(1.02)":"translateY(0) scale(1)",
      }}
    >
      {/* Fondo con gradiente sutil */}
      <div style={{
        position:"absolute",
        inset:0,
        background:isImportant
          ?"linear-gradient(135deg, rgba(201,168,76,0.1), transparent 50%)"
          :hov?"linear-gradient(180deg, rgba(201,168,76,0.05), transparent)":"transparent",
        transition:"all 0.4s"
      }}/>
      
      {/* Línea dorada animada arriba */}
      <div style={{
        position:"absolute",
        top:0,
        left:0,
        right:0,
        height:3,
        background:"linear-gradient(90deg, transparent, #c9a84c, transparent)",
        transform:hov?"scaleX(1)":"scaleX(0)",
        transition:"transform 0.4s"
      }}/>

      <div style={{position:"relative",zIndex:1,padding:20}}>
        {/* Header con badges */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {m.g&&(
              <span style={{
                fontSize:11,
                fontWeight:900,
                color:GOLD,
                background:"rgba(201,168,76,0.15)",
                padding:"4px 10px",
                borderRadius:8,
                border:"1px solid rgba(201,168,76,0.2)"
              }}>
                GRUPO {m.g}
              </span>
            )}
            <span style={{fontSize:11,color:DIM,fontWeight:600}}>J{m.j}</span>
          </div>
          <span style={{
            fontSize:14,
            fontWeight:800,
            color:GOLD,
            fontVariantNumeric:"tabular-nums",
            background:"rgba(201,168,76,0.1)",
            padding:"4px 12px",
            borderRadius:8
          }}>
            {m.t}
          </span>
        </div>

        {/* Equipos - Layout horizontal */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          {/* Local */}
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <div style={{
              width:56,
              height:40,
              borderRadius:10,
              overflow:"hidden",
              boxShadow:hov?"0 8px 24px rgba(0,0,0,0.4)":"0 4px 12px rgba(0,0,0,0.3)",
              border:"2px solid rgba(255,255,255,0.1)",
              transition:"all 0.3s",
              transform:hov?"scale(1.1)":"scale(1)"
            }}>
              {m.hf&&m.hf!=="tbd"?(
                <Image src={flagUrl(m.hf,160)!} alt="" width={56} height={40} style={{objectFit:"cover",width:"100%",height:"100%"}} unoptimized/>
              ):(
                <div style={{width:"100%",height:"100%",background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:20,color:DIM}}>?</span>
                </div>
              )}
            </div>
            <span style={{
              fontSize:13,
              fontWeight:700,
              textAlign:"center",
              color:hov?"#fff":"#d0d4de",
              transition:"color 0.3s"
            }}>
              {m.h}
            </span>
          </div>

          {/* VS Badge */}
          <div style={{
            width:44,
            height:44,
            borderRadius:14,
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            background:hov?"linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.1))":"rgba(255,255,255,0.03)",
            border:`2px solid ${hov?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.06)"}`,
            boxShadow:hov?"0 0 20px rgba(201,168,76,0.2)":"none",
            transition:"all 0.3s"
          }}>
            <span style={{fontSize:12,fontWeight:900,color:hov?GOLD:DIM}}>VS</span>
          </div>

          {/* Visitante */}
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <div style={{
              width:56,
              height:40,
              borderRadius:10,
              overflow:"hidden",
              boxShadow:hov?"0 8px 24px rgba(0,0,0,0.4)":"0 4px 12px rgba(0,0,0,0.3)",
              border:"2px solid rgba(255,255,255,0.1)",
              transition:"all 0.3s",
              transform:hov?"scale(1.1)":"scale(1)"
            }}>
              {m.af&&m.af!=="tbd"?(
                <Image src={flagUrl(m.af,160)!} alt="" width={56} height={40} style={{objectFit:"cover",width:"100%",height:"100%"}} unoptimized/>
              ):(
                <div style={{width:"100%",height:"100%",background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:20,color:DIM}}>?</span>
                </div>
              )}
            </div>
            <span style={{
              fontSize:13,
              fontWeight:700,
              textAlign:"center",
              color:hov?"#fff":"#d0d4de",
              transition:"color 0.3s"
            }}>
              {m.a}
            </span>
          </div>
        </div>

        {/* Estadio */}
        <div style={{
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          gap:8,
          marginTop:16,
          paddingTop:16,
          borderTop:"1px solid rgba(255,255,255,0.05)"
        }}>
          {m.vf&&(
            <Image 
              src={flagUrl(m.vf,40)!} 
              alt="" 
              width={16} 
              height={11} 
              style={{borderRadius:2,objectFit:"cover"}} 
              unoptimized
            />
          )}
          <span style={{fontSize:12,color:hov?MID:DARK,transition:"color 0.3s"}}>
            {m.vn}
          </span>
          <span style={{color:"rgba(255,255,255,0.1)"}}>•</span>
          <span style={{fontSize:12,color:DIM}}>{m.vc}</span>
        </div>
      </div>
    </div>
  );
}

// Header de fecha
function DateHeader({date,count}:{date:string;count:number}){
  const{t}=useLanguage();const cT=t.calendario;
  return(
    <div style={{
      display:"flex",
      alignItems:"center",
      gap:16,
      marginBottom:24,
      position:"sticky",
      top:0,
      zIndex:10,
      padding:"16px 0",
      background:`linear-gradient(180deg,${BG} 80%,transparent)`
    }}>
      <div style={{
        width:48,
        height:48,
        borderRadius:14,
        background:"linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))",
        border:"2px solid rgba(201,168,76,0.3)",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        boxShadow:"0 0 20px rgba(201,168,76,0.15)"
      }}>
        <span style={{fontSize:20}}>📅</span>
      </div>
      
      <div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{
            fontSize:20,
            fontWeight:900,
            color:GOLD,
            background:"linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
            padding:"6px 16px",
            borderRadius:10,
            border:"1px solid rgba(201,168,76,0.2)"
          }}>
            {fmtShort(date)}
          </span>
          <span style={{fontSize:16,color:MID,fontWeight:600}}>
            {fmtDate(date)}
          </span>
        </div>
        <span style={{fontSize:13,color:DIM,marginTop:4,display:"block"}}>
          {count} {count===1?cT.partido:cT.partidoPlural}
        </span>
      </div>
    </div>
  );
}

// Botón de filtro
function FilterBtn({label,active,onClick}:{label:string;active:boolean;onClick:()=>void}){
  const[hov,setHov]=useState(false);
  return(
    <button
      onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        padding:"10px 18px",
        borderRadius:12,
        fontFamily:"inherit",
        cursor:"pointer",
        whiteSpace:"nowrap",
        fontSize:13,
        fontWeight:600,
        transition:"all 0.25s ease",
        border:`2px solid ${active?"rgba(201,168,76,0.4)":hov?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)"}`,
        background:active?"linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))":hov?"rgba(255,255,255,0.05)":"transparent",
        color:active?GOLD:hov?"#fff":DIM,
        boxShadow:active?"0 4px 16px rgba(201,168,76,0.15)":"none"
      }}
    >
      {label}
    </button>
  );
}

// Modal de detalle del partido
function MatchModal({m,onClose,onNav}:{m:typeof M[0];onClose:()=>void;onNav:(id:number)=>void}){
  const{t}=useLanguage();const cT=t.calendario;
  const[sameDay]=useState(()=>M.filter(x=>x.d===m.d&&x.i!==m.i).slice(0,4));
  const[groupM]=useState(()=>m.g?M.filter(x=>x.g===m.g&&x.i!==m.i).slice(0,3):[]);
  const idx=M.findIndex(x=>x.i===m.i);
  const[anim,setAnim]=useState(false);
  
  useEffect(()=>{setTimeout(()=>setAnim(true),50);return()=>setAnim(false)},[m.i]);
  
  const isFinal=m.p==="FINAL";
  const isSemifinal=m.p==="Semifinal";
  
  return(
    <div style={{
      position:"fixed",
      inset:0,
      background:"rgba(6,11,20,0.95)",
      backdropFilter:"blur(10px)",
      zIndex:100,
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      padding:20,
      opacity:anim?1:0,
      transition:"opacity 0.3s"
    }} onClick={onClose}>
      <div 
        style={{
          maxWidth:800,
          width:"100%",
          maxHeight:"90vh",
          overflow:"auto",
          background:BG2,
          borderRadius:28,
          border:`2px solid ${isFinal?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.08)"}`,
          boxShadow:isFinal?"0 0 80px rgba(201,168,76,0.2)":"0 20px 60px rgba(0,0,0,0.5)",
          transform:anim?"scale(1) translateY(0)":"scale(0.95) translateY(20px)",
          transition:"transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}
        onClick={e=>e.stopPropagation()}
      >
        {/* Header con cierre */}
        <div style={{padding:"24px 32px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button 
            onClick={onClose}
            style={{
              background:"none",
              border:"none",
              color:GOLD,
              cursor:"pointer",
              fontSize:14,
              fontWeight:600,
              display:"flex",
              alignItems:"center",
              gap:8,
              padding:"8px 16px",
              borderRadius:10,
              transition:"background 0.2s"
            }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.1)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            {cT.volver}
          </button>
          
          {(isFinal||isSemifinal)&&(
            <span style={{
              fontSize:12,
              fontWeight:800,
              color:isFinal?BG:GOLD,
              background:isFinal?"linear-gradient(135deg, #c9a84c, #e8d48b)":"rgba(201,168,76,0.15)",
              padding:"8px 16px",
              borderRadius:10,
              border:isFinal?"none":"1px solid rgba(201,168,76,0.3)"
            }}>
              {isFinal?"🏆 FINAL":"⚽ SEMIFINAL"}
            </span>
          )}
        </div>

        <div style={{padding:32}}>
          {/* Info del partido */}
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:16}}>
              {m.g&&(
                <span style={{
                  fontSize:13,
                  fontWeight:800,
                  color:GOLD,
                  background:"rgba(201,168,76,0.1)",
                  padding:"6px 14px",
                  borderRadius:10,
                  border:"1px solid rgba(201,168,76,0.2)"
                }}>
                  {cT.grupo} {m.g} • {cT.jornada} {m.j}
                </span>
              )}
            </div>
            
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:8}}>
              <span style={{fontSize:18,color:MID,fontWeight:600}}>{fmtDate(m.d)}</span>
              <span style={{color:"rgba(255,255,255,0.2)"}}>|</span>
              <span style={{
                fontSize:20,
                fontWeight:800,
                color:GOLD,
                background:"rgba(201,168,76,0.1)",
                padding:"6px 16px",
                borderRadius:10
              }}>
                {m.t}
              </span>
            </div>
          </div>

          {/* Equipos */}
          <div style={{
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            gap:40,
            marginBottom:32,
            padding:"32px",
            background:"linear-gradient(135deg, rgba(201,168,76,0.05), transparent)",
            borderRadius:20,
            border:"1px solid rgba(201,168,76,0.1)"
          }}>
            {/* Local */}
            <div style={{textAlign:"center",flex:1}}>
              <div style={{
                width:100,
                height:70,
                borderRadius:16,
                overflow:"hidden",
                margin:"0 auto 16px",
                boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
                border:"3px solid rgba(255,255,255,0.1)"
              }}>
                {m.hf&&m.hf!=="tbd"?(
                  <Image src={flagUrl(m.hf,320)!} alt="" width={100} height={70} style={{objectFit:"cover"}} unoptimized/>
                ):<div style={{width:"100%",height:"100%",background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:32,color:DIM}}>?</span></div>}
              </div>
              <h2 style={{fontSize:24,fontWeight:900,marginBottom:4}}>{m.h}</h2>
              <span style={{fontSize:13,color:DIM}}>{cT.local}</span>
            </div>

            {/* VS */}
            <div style={{
              width:70,
              height:70,
              borderRadius:20,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              background:"linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.1))",
              border:"2px solid rgba(201,168,76,0.3)",
              boxShadow:"0 0 30px rgba(201,168,76,0.2)"
            }}>
              <span style={{fontSize:18,fontWeight:900,color:GOLD}}>VS</span>
            </div>

            {/* Visitante */}
            <div style={{textAlign:"center",flex:1}}>
              <div style={{
                width:100,
                height:70,
                borderRadius:16,
                overflow:"hidden",
                margin:"0 auto 16px",
                boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
                border:"3px solid rgba(255,255,255,0.1)"
              }}>
                {m.af&&m.af!=="tbd"?(
                  <Image src={flagUrl(m.af,320)!} alt="" width={100} height={70} style={{objectFit:"cover"}} unoptimized/>
                ):<div style={{width:"100%",height:"100%",background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:32,color:DIM}}>?</span></div>}
              </div>
              <h2 style={{fontSize:24,fontWeight:900,marginBottom:4}}>{m.a}</h2>
              <span style={{fontSize:13,color:DIM}}>{cT.visitante}</span>
            </div>
          </div>

          {/* Estadio */}
          <div style={{
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            gap:12,
            padding:"16px 24px",
            background:BG3,
            borderRadius:16,
            marginBottom:32,
            border:"1px solid rgba(255,255,255,0.05)"
          }}>
            <span style={{fontSize:24}}>🏟️</span>
            <div>
              <p style={{fontSize:16,fontWeight:700,color:"#fff"}}>{m.vn}</p>
              <p style={{fontSize:14,color:MID}}>{m.vc}</p>
            </div>
          </div>

          {/* Acciones */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))",gap:12,marginBottom:32}}>
            <Link href="/app/predicciones" style={{
              padding:16,
              borderRadius:14,
              background:"linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
              border:"1px solid rgba(201,168,76,0.2)",
              textDecoration:"none",
              textAlign:"center",
              transition:"all 0.3s"
            }}>
              <span style={{fontSize:28,display:"block",marginBottom:8}}>🎯</span>
              <span style={{fontWeight:700,color:"#fff"}}>{cT.predice}</span>
            </Link>
            <Link href="/selecciones" style={{
              padding:16,
              borderRadius:14,
              background:"rgba(255,255,255,0.03)",
              border:"1px solid rgba(255,255,255,0.08)",
              textDecoration:"none",
              textAlign:"center",
              transition:"all 0.3s"
            }}>
              <span style={{fontSize:28,display:"block",marginBottom:8}}>⚽</span>
              <span style={{fontWeight:700,color:MID}}>{cT.equipos}</span>
            </Link>
            <Link href="/sedes" style={{
              padding:16,
              borderRadius:14,
              background:"rgba(255,255,255,0.03)",
              border:"1px solid rgba(255,255,255,0.08)",
              textDecoration:"none",
              textAlign:"center",
              transition:"all 0.3s"
            }}>
              <span style={{fontSize:28,display:"block",marginBottom:8}}>🏟️</span>
              <span style={{fontWeight:700,color:MID}}>{cT.sede}</span>
            </Link>
          </div>

          {/* Partidos del mismo grupo */}
          {groupM.length>0&&(
            <div style={{marginBottom:24}}>
              <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>
                <span style={{color:GOLD}}>{cT.masDeGrupo} {m.g}</span>
              </h3>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {groupM.map(x=>{
                  const match = M.find(item => item.i === x.i);
                  if (!match) return null;
                  return(
                  <div 
                    key={x.i} 
                    onClick={()=>onNav(x.i)}
                    style={{
                      display:"flex",
                      alignItems:"center",
                      gap:12,
                      padding:"12px 16px",
                      background:BG3,
                      borderRadius:12,
                      cursor:"pointer",
                      border:"1px solid rgba(255,255,255,0.04)",
                      transition:"all 0.2s"
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.2)";e.currentTarget.style.background="rgba(201,168,76,0.03)"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.04)";e.currentTarget.style.background=BG3}}
                  >
                    <span style={{fontSize:11,fontWeight:800,color:GOLD,background:"rgba(201,168,76,0.1)",padding:"4px 10px",borderRadius:6}}>J{x.j}</span>
                    <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontWeight:600}}>{x.h}</span>
                      <span style={{color:DARK}}>vs</span>
                      <span style={{fontWeight:600}}>{x.a}</span>
                    </div>
                    <span style={{fontSize:13,color:DIM}}>{x.t}</span>
                  </div>
                );})}
              </div>
            </div>
          )}

          {/* Navegación */}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:24,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
            {idx>0?(
              <button 
                onClick={()=>onNav(M[idx-1].i)}
                style={{background:"none",border:"none",color:MID,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",gap:8}}
              >
                ← {M[idx-1].h} vs {M[idx-1].a}
              </button>
            ):<span/>}
            {idx<M.length-1&&(
              <button 
                onClick={()=>onNav(M[idx+1].i)}
                style={{background:"none",border:"none",color:MID,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",gap:8}}
              >
                {M[idx+1].h} vs {M[idx+1].a} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Página principal
export default function CalendarioPage(){
  const{t,locale}=useLanguage();const cT=t.calendario;const nav=t.nav;
  const[phase,setPhase]=useState("all");
  const[group,setGroup]=useState("all");
  const[selected,setSelected]=useState<typeof M[0]|null>(null);
  const scrollRef=useRef<HTMLDivElement>(null);
  const countdown=useCountdown();

  const filtered=useMemo(()=>M.filter(m=>{
    if(phase!=="all"&&m.p!==phase)return false;
    if(group!=="all"&&m.g!==group)return false;
    return true;
  }),[phase,group]);

  const grouped=useMemo(()=>{
    const map=new Map<string,typeof M>();
    filtered.forEach(m=>{
      if(!map.has(m.d))map.set(m.d,[]);
      map.get(m.d)!.push(m);
    });
    return new Map([...map.entries()].sort());
  },[filtered]);

  const handleNav=(id:number)=>{
    const m=M.find(x=>x.i===id);
    if(m)setSelected(m);
  };

  return(
    <div ref={scrollRef} style={{background:BG,minHeight:"100vh",color:"#fff",fontFamily:"'Outfit',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      
      {/* Hero Section ESPECTACULAR */}
      <div style={{
        position:"relative",
        padding:"20px 24px 40px",
        overflow:"hidden",
        background:"linear-gradient(180deg, rgba(201,168,76,0.08), transparent)"
      }}>
        {/* Decoración de fondo */}
        <div style={{
          position:"absolute",
          top:"50%",
          left:"50%",
          transform:"translate(-50%,-50%)",
          width:600,
          height:600,
          background:"radial-gradient(circle, rgba(201,168,76,0.1), transparent 70%)",
          pointerEvents:"none"
        }}/>
        
        <div style={{maxWidth:1200,margin:"0 auto",position:"relative",zIndex:1}}>
          {/* Breadcrumb */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
            <Link href="/" style={{color:DIM,fontSize:14,textDecoration:"none"}}>{nav.inicio}</Link>
            <span style={{color:DIM}}>/</span>
            <span style={{color:GOLD,fontSize:14,fontWeight:600}}>{nav.calendario}</span>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:32,alignItems:"center",textAlign:"center"}}>
            {/* Título y descripción */}
            <div style={{maxWidth:700}}>
              <span style={{
                fontSize:12,
                fontWeight:800,
                color:GOLD,
                letterSpacing:3,
                textTransform:"uppercase",
                background:"rgba(201,168,76,0.1)",
                padding:"6px 14px",
                borderRadius:8,
                border:"1px solid rgba(201,168,76,0.2)",
                display:"inline-block"
              }}>
                {cT.badge}
              </span>

              <h1 style={{
                fontSize:"clamp(40px, 8vw, 72px)",
                fontWeight:900,
                marginTop:20,
                marginBottom:16,
                lineHeight:1,
                background:"linear-gradient(135deg, #fff 0%, #c9a84c 100%)",
                WebkitBackgroundClip:"text",
                WebkitTextFillColor:"transparent"
              }}>
                {cT.title}
              </h1>

              <p style={{color:MID,fontSize:18,maxWidth:600,lineHeight:1.6,marginBottom:24,marginLeft:"auto",marginRight:"auto"}}>
                {cT.subtitle}
              </p>

              {/* Stats */}
              <div style={{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center"}}>
                <div style={{
                  padding:"16px 24px",
                  background:BG2,
                  borderRadius:16,
                  border:"1px solid rgba(255,255,255,0.06)"
                }}>
                  <p style={{fontSize:28,fontWeight:900,color:GOLD}}>{M.length}</p>
                  <p style={{fontSize:13,color:DIM}}>{cT.partidos}</p>
                </div>
                <div style={{
                  padding:"16px 24px",
                  background:BG2,
                  borderRadius:16,
                  border:"1px solid rgba(255,255,255,0.06)"
                }}>
                  <p style={{fontSize:28,fontWeight:900,color:"#fff"}}>16</p>
                  <p style={{fontSize:13,color:DIM}}>{cT.sedes}</p>
                </div>
                <div style={{
                  padding:"16px 24px",
                  background:BG2,
                  borderRadius:16,
                  border:"1px solid rgba(255,255,255,0.06)"
                }}>
                  <p style={{fontSize:28,fontWeight:900,color:"#fff"}}>39</p>
                  <p style={{fontSize:13,color:DIM}}>{cT.dias}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px 80px"}}>
        {/* Filtros */}
        <div style={{
          marginBottom:40,
          padding:24,
          background:BG2,
          borderRadius:24,
          border:"1px solid rgba(255,255,255,0.05)"
        }}>
          <div style={{marginBottom:20}}>
            <p style={{fontSize:13,color:DIM,fontWeight:700,marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>{cT.fase}</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <FilterBtn label={cT.todas} active={phase==="all"} onClick={()=>setPhase("all")}/>
              {PHASES.map(p=><FilterBtn key={p} label={p} active={phase===p} onClick={()=>setPhase(p)}/>)}
            </div>
          </div>

          {(phase==="all"||phase==="Fase de grupos")&&(
            <div style={{marginBottom:20,paddingTop:20,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
              <p style={{fontSize:13,color:DIM,fontWeight:700,marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>{cT.grupo}</p>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <FilterBtn label={cT.todos} active={group==="all"} onClick={()=>setGroup("all")}/>
                {GROUPS.map(g=><FilterBtn key={g} label={g} active={group===g} onClick={()=>setGroup(g)}/>)}
              </div>
            </div>
          )}

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:20,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
            <span style={{color:DIM,fontSize:14}}>
              <strong style={{color:"#fff"}}>{filtered.length}</strong> {cT.encontrados}
            </span>
            {(phase!=="all"||group!=="all")&&(
              <button
                onClick={()=>{setPhase("all");setGroup("all")}}
                style={{
                  background:"none",
                  border:"none",
                  color:GOLD,
                  cursor:"pointer",
                  fontSize:14,
                  fontWeight:600
                }}
              >
                {cT.limpiar}
              </button>
            )}
          </div>
        </div>

        {/* Lista de partidos por fecha */}
        <div style={{position:"relative"}}>
          {/* Línea de tiempo vertical */}
          <div style={{
            position:"absolute",
            left:24,
            top:0,
            bottom:0,
            width:2,
            background:"linear-gradient(180deg, rgba(201,168,76,0.4), rgba(201,168,76,0.05))",
            borderRadius:2
          }}/>

          {[...grouped.entries()].map(([date,matches])=> (
            <div key={date} style={{marginBottom:48,position:"relative"}}>
              <DateHeader date={date} count={matches.length}/>
              
              <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))",
                gap:20,
                paddingLeft:64
              }}>
                {matches.map(m=> (
                  <MatchCard key={m.i} m={m} onClick={()=>setSelected(m)}/>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Final */}
        <div style={{
          marginTop:60,
          padding:40,
          background:"linear-gradient(135deg, rgba(201,168,76,0.1), transparent)",
          borderRadius:28,
          border:"1px solid rgba(201,168,76,0.15)",
          textAlign:"center"
        }}>
          <span style={{fontSize:48,marginBottom:16,display:"block"}}>🎯</span>
          <h2 style={{fontSize:28,fontWeight:900,marginBottom:12}}>{cT.ctaTitle}</h2>
          <p style={{color:MID,maxWidth:500,margin:"0 auto 24px",fontSize:16}}>
            {cT.ctaDesc}
          </p>
          <Link href="/app/predicciones" style={{
            display:"inline-flex",
            alignItems:"center",
            gap:10,
            padding:"16px 32px",
            background:"linear-gradient(135deg, #c9a84c, #e8d48b)",
            color:BG,
            borderRadius:14,
            fontWeight:800,
            fontSize:16,
            textDecoration:"none",
            boxShadow:"0 8px 32px rgba(201,168,76,0.3)"
          }}>
            {cT.ctaBtn}
          </Link>
        </div>
      </div>

      {/* Modal de partido */}
      {selected&&(
        <MatchModal 
          m={selected} 
          onClose={()=>setSelected(null)} 
          onNav={handleNav}
        />
      )}
    </div>
  );
}
