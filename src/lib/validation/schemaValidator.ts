// ZonaMundial — Validador AJV con 5 chequeos de coherencia
// Uso: import { validateEdicion } from '@/lib/validation/schemaValidator'

import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import schema from '../../../schemas/edicion.schema.json';
import type { EdicionMundial } from '@/types/edicion';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validateSchema = ajv.compile(schema);

export interface CoherenceIssue {
  code: string;
  message: string;
}

const FLAG_REGEX = /^https:\/\/flagcdn\.com\/(?:(?:w|h)\d{2,4}|\d{2,3}x\d{2,3})\/([a-z]{2}(?:-[a-z]{3})?)\.(?:png|webp|jpg)$|^https:\/\/flagcdn\.com\/([a-z]{2}(?:-[a-z]{3})?)\.svg$/;

function checkFlagISO(banderaUrl: string | undefined, iso2: string): string | null {
  if (!banderaUrl) return null;
  const match = banderaUrl.match(FLAG_REGEX);
  if (!match) return `URL de bandera no respeta patrón flagcdn: ${banderaUrl}`;
  const isoFromUrl = match[1] || match[2];
  if (isoFromUrl !== iso2.toLowerCase()) {
    return `ISO de bandera (${isoFromUrl}) no coincide con iso2 declarado (${iso2})`;
  }
  return null;
}

function dateInRange(d: string, start: string, end: string): boolean {
  return d >= start && d <= end;
}

export function checkCoherence(edicion: EdicionMundial): CoherenceIssue[] {
  const issues: CoherenceIssue[] = [];

  // 1. Suma goles fase grupos + KO == totalGoles
  if (
    edicion.estadisticas.golesFaseGrupos !== undefined &&
    edicion.estadisticas.golesFaseKO !== undefined
  ) {
    const suma = edicion.estadisticas.golesFaseGrupos + edicion.estadisticas.golesFaseKO;
    if (suma !== edicion.estadisticas.totalGoles) {
      issues.push({
        code: 'COHERENCE_GOALS_SUM',
        message: `golesFaseGrupos (${edicion.estadisticas.golesFaseGrupos}) + golesFaseKO (${edicion.estadisticas.golesFaseKO}) = ${suma} no coincide con totalGoles (${edicion.estadisticas.totalGoles})`,
      });
    }
  }

  // 2. Promedio asistencia recalculado coincide
  if (
    edicion.estadisticas.asistenciaTotal &&
    edicion.estadisticas.asistenciaPromedio &&
    edicion.formato.numPartidos
  ) {
    const promedioCalc = Math.round(
      edicion.estadisticas.asistenciaTotal / edicion.formato.numPartidos
    );
    const diff = Math.abs(promedioCalc - edicion.estadisticas.asistenciaPromedio);
    const tolerancia = Math.max(50, edicion.estadisticas.asistenciaPromedio * 0.005);
    if (diff > tolerancia) {
      issues.push({
        code: 'COHERENCE_ATTENDANCE_AVG',
        message: `asistenciaPromedio (${edicion.estadisticas.asistenciaPromedio}) no coincide con asistenciaTotal/numPartidos = ${promedioCalc} (diff ${diff})`,
      });
    }
  }

  // 3. Banderas flagcdn coinciden con iso2 declarado
  for (const pais of edicion.sede.paises) {
    const err = checkFlagISO(pais.banderaUrl, pais.iso2);
    if (err) {
      issues.push({ code: 'COHERENCE_FLAG_SEDE', message: `[sede.paises] ${err}` });
    }
  }
  const sels = edicion.resultados
    ? [
        edicion.resultados.campeon,
        edicion.resultados.subcampeon,
        edicion.resultados.tercero,
        edicion.resultados.cuarto,
      ].filter((x): x is NonNullable<typeof x> => Boolean(x))
    : [];
  for (const sel of sels) {
    const err = checkFlagISO(sel.banderaUrl, sel.iso2);
    if (err) {
      issues.push({ code: 'COHERENCE_FLAG_RESULT', message: `[resultados.${sel.pais}] ${err}` });
    }
  }

  // 4. Fechas: final >= inicio, partidos dentro del rango
  if (edicion.fechas.final < edicion.fechas.inicio) {
    issues.push({
      code: 'COHERENCE_DATE_RANGE',
      message: `fechas.final (${edicion.fechas.final}) anterior a fechas.inicio (${edicion.fechas.inicio})`,
    });
  }
  const partidos = [
    { p: edicion.partidoInaugural, label: 'partidoInaugural' },
    { p: edicion.partidoFinal, label: 'partidoFinal' },
    { p: edicion.partido3, label: 'partido3' },
  ];
  for (const { p, label } of partidos) {
    if (p && !dateInRange(p.fecha, edicion.fechas.inicio, edicion.fechas.final)) {
      issues.push({
        code: 'COHERENCE_MATCH_DATE',
        message: `${label}.fecha (${p.fecha}) fuera de rango [${edicion.fechas.inicio}, ${edicion.fechas.final}]`,
      });
    }
  }

  // 5. Goleador con botaOro figura en topGoleadores con goles correctos
  const goleadores = edicion.topGoleadores ?? [];
  const botaOro = goleadores.find((g) => g.botaOro);
  if (botaOro) {
    const others = goleadores.filter((g) => !g.botaOro);
    for (const o of others) {
      if (o.goles > botaOro.goles) {
        issues.push({
          code: 'COHERENCE_BOTAORO_GOALS',
          message: `botaOro (${botaOro.nombre}, ${botaOro.goles}) tiene menos goles que ${o.nombre} (${o.goles})`,
        });
        break;
      }
    }
  }

  return issues;
}

export interface ValidationResult {
  ok: boolean;
  schemaErrors: ErrorObject[] | null;
  coherenceIssues: CoherenceIssue[];
}

export function validateEdicion(data: unknown): ValidationResult {
  const ok = validateSchema(data);
  if (!ok) {
    return {
      ok: false,
      schemaErrors: validateSchema.errors ?? null,
      coherenceIssues: [],
    };
  }
  const coherenceIssues = checkCoherence(data as EdicionMundial);
  return {
    ok: coherenceIssues.length === 0,
    schemaErrors: null,
    coherenceIssues,
  };
}
