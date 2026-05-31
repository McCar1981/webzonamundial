// src/data/historia-editorial/index.ts
// Agrega todos los lotes de contenido editorial en un único mapa por slug.

import type { EditorialMap } from "./types";
import { BATCH_A } from "./batch-a";
import { BATCH_B } from "./batch-b";
import { BATCH_C } from "./batch-c";
import { BATCH_D } from "./batch-d";
import { BATCH_E } from "./batch-e";

export type { EditorialArticle, EditorialSection, EditorialFAQ } from "./types";

export const HISTORIA_EDITORIAL: EditorialMap = {
  ...BATCH_A,
  ...BATCH_B,
  ...BATCH_C,
  ...BATCH_D,
  ...BATCH_E,
};
