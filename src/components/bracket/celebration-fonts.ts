// src/components/bracket/celebration-fonts.ts
//
// Fonts específicas del Victory Screen del bracket. Cargadas solo
// donde se usan, no en el layout root, para no inflar todo el site.
//
//   Anton    → headline brush-look bold uppercase (TU MUNDIAL / ESTÁ COMPLETO)
//   Mr Dafoe → script script para sign-off ("Tú lo predijiste...")

import { Anton, Mr_Dafoe } from "next/font/google";

export const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--zm-font-anton",
});

export const mrDafoe = Mr_Dafoe({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--zm-font-dafoe",
});
