# Fixture oficial Mundial 2026 — pega aquí los partidos

> Lee la cabecera de `scripts/validate-matches.mjs` para el formato exacto.

## Formato (separador ` · ` recomendado, también acepta ` | `)

```
N° · FASE · JORNADA · YYYY-MM-DD · HH:MM · ESTADIO · CIUDAD · PAÍS · HOME vs AWAY
```

| Campo | Valores |
|---|---|
| N° | 1-104 (entero) |
| FASE | `GA`..`GL` (grupos), o `R32`/`R16`/`QF`/`SF`/`THIRD`/`FINAL` |
| JORNADA | `J1`/`J2`/`J3` para grupos, `-` para KO |
| FECHA | YYYY-MM-DD |
| HORA | HH:MM (24h, hora **local** de la sede) |
| ESTADIO | Nombre completo del estadio |
| CIUDAD | Una de las 16 sedes (idéntica a las usadas en `src/data/matches.ts`) |
| PAÍS | `us` / `mx` / `ca` |
| HOME vs AWAY | Nombres exactos como los usa la web (con tildes) |

## Ejemplo

```
1 · GA · J1 · 2026-06-11 · 13:00 · Estadio Azteca · Ciudad de México · mx · México vs Sudáfrica
2 · GA · J1 · 2026-06-11 · 12:00 · Mercedes-Benz Stadium · Atlanta · us · Corea del Sur vs Rep. Checa
```

Líneas que empiezan con `#` o vacías se ignoran.

---

## Pega aquí los 104 partidos del fixture oficial FIFA

<!-- BEGIN OFFICIAL FIXTURE -->

# ─── FASE DE GRUPOS ───
# (72 partidos, jornadas 1-3, del 11 al 27 de junio)


# ─── ELIMINATORIAS ───
# R32 = Dieciseisavos (16 partidos)
# R16 = Octavos (8)
# QF = Cuartos (4)
# SF = Semifinales (2)
# THIRD = Tercer Puesto (1)
# FINAL = Final (1)


<!-- END OFFICIAL FIXTURE -->

---

## Cómo correr el validador

```bash
# Solo reporte (no modifica nada):
node scripts/validate-matches.mjs

# Solo valida grupos:
node scripts/validate-matches.mjs --only-groups

# Genera src/data/matches.fixed.ts con las correcciones:
node scripts/validate-matches.mjs --apply

# Con más detalle:
node scripts/validate-matches.mjs --verbose
```

El script **nunca sobrescribe `src/data/matches.ts`**. Con `--apply` genera
`src/data/matches.fixed.ts` para que tú revises con `git diff` y luego decidas
si mover o no.
