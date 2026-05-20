# Horarios oficiales Mundial 2026 — pega aquí las 104 horas

> **Fuente:** PDF FIFA `FWC26 Match Schedule_v17_10042026_ES.pdf`
> **Zona horaria:** Eastern Time (US ET)
> **Total de partidos:** 104 (72 grupos + 16 R32 + 8 R16 + 4 QF + 2 SF + 1 3°P + 1 FINAL)

## Formato

Una hora por línea, en formato `HH:MM` (24h). Acepta cualquiera de estos:

```
# Con número de partido (recomendado):
1: 15:00
2: 12:00
3: 18:00
...

# O sin número (yo asumo orden 1, 2, 3...):
15:00
12:00
18:00
...
```

Líneas que empiezan con `#`, vacías, o que no son una hora válida → se ignoran.

## Pega las 104 horas aquí

<!-- BEGIN HOURS -->


<!-- END HOURS -->

---

## Cómo aplicar tras pegar

```bash
node scripts/apply-match-times.mjs
```

El script lee `docs/fixture-times-2026.md`, parsea las 104 horas y aplica el
update SOLO al campo `t` de cada partido en `src/data/matches.ts`. NO toca
sedes, equipos, fechas. Y deja un comentario al principio de matches.ts
indicando que todas las horas son ET.
