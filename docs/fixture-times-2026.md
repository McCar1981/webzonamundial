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
1: 15:00
2: 22:00
3: 15:00
4: 21:00
5: 21:00
6: 00:00
7: 18:00
8: 15:00
9: 19:00
10: 13:00
11: 16:00
12: 22:00
13: 18:00
14: 12:00
15: 21:00
16: 15:00
17: 15:00
18: 18:00
19: 21:00
20: 00:00
21: 19:00
22: 16:00
23: 13:00
24: 22:00
25: 12:00
26: 15:00
27: 18:00
28: 21:00
29: 20:30
30: 18:00
31: 23:00
32: 15:00
33: 16:00
34: 20:00
35: 13:00
36: 00:00
37: 18:00
38: 12:00
39: 15:00
40: 21:00
41: 20:00
42: 17:00
43: 13:00
44: 23:00
45: 16:00
46: 19:00
47: 13:00
48: 22:00
49: 18:00
50: 18:00
51: 15:00
52: 15:00
53: 21:00
54: 21:00
55: 16:00
56: 16:00
57: 19:00
58: 19:00
59: 22:00
60: 22:00
61: 15:00
62: 15:00
63: 23:00
64: 23:00
65: 20:00
66: 20:00
67: 17:00
68: 17:00
69: 22:00
70: 22:00
71: 19:30
72: 19:30
73: 15:00
74: 16:30
75: 21:00
76: 13:00
77: 17:00
78: 13:00
79: 21:00
80: 12:00
81: 20:00
82: 16:00
83: 19:00
84: 15:00
85: 23:00
86: 18:00
87: 21:30
88: 14:00
89: 17:00
90: 13:00
91: 16:00
92: 20:00
93: 15:00
94: 20:00
95: 12:00
96: 16:00
97: 16:00
98: 15:00
99: 17:00
100: 21:00
101: 15:00
102: 15:00
103: 17:00
104: 15:00
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
