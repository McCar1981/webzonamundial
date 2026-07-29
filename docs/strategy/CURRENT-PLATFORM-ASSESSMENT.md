# Current Platform Assessment

## 1. Veredicto ejecutivo

Zona de Ligas no es una idea en fase de presentación. Es la evolución de un
producto existente con una base funcional amplia: identidad, contenido,
predicciones, fantasy, Draft, trivia, cromos, economía, rankings, IA, Match
Center, notificaciones, pagos y operaciones.

El riesgo principal ya no es «no tener suficiente producto». Es que la amplitud
se convierta en fragmentación, deuda operativa y una experiencia difícil de
explicar, medir y vender.

La recomendación es:

1. conservar el repositorio activo como base;
2. cerrar los riesgos de confianza y calidad;
3. unificar módulos alrededor de dos bucles: **jornada** y **temporada**;
4. medir retención y economía antes de escalar adquisición;
5. extraer FOS solo a partir de capacidades demostradas.

No se recomienda una reescritura, un nuevo repositorio de plataforma ni una
abstracción multideporte completa en esta fase.

## 2. Evidencia del repositorio

Revisión estática sobre `main` en el commit `accb088`.

| Indicador | Estado observado |
|---|---:|
| Archivos versionados | 2.579 |
| Páginas de App Router | 167 |
| Route handlers bajo `src/app/api` | 205 |
| Scripts SQL versionados | 65 |
| Workflows de GitHub Actions | 7 |
| Script de test declarado | 1 |
| Tamaño informado por GitHub | ≈ 520 MB |

El producto incluye, entre otras, estas áreas:

- `ligas`: directorio, páginas de competición, partidos, clubes, jugadores,
  predicciones y fantasy por liga;
- `match-center`: directo, eventos, formaciones, previa, narración, votaciones y
  sala social;
- `predictions`, `micro`, `trivia`, `fantasy`, `draft`, `cromos` y
  `modo-carrera`;
- economía con Fútcoins, XP, power-ups, recompensas y ledger;
- perfil, clubes y ligas seguidas, rankings, historial y notificaciones;
- IA Coach y generación editorial;
- Stripe, plan Pro, Founders, afiliación, publicidad y herramientas para bares;
- paneles administrativos, monitorización y automatizaciones.

Esto confirma que la propuesta debe organizar y potenciar activos existentes,
no describir un producto hipotético.

## 3. Lo que está bien construido

### 3.1 Base transaccional y economía

La economía contiene operaciones atómicas e idempotentes, control
server-authoritative y un ledger. Fantasy y Draft recalculan puntuaciones y
recompensas en servidor en vez de confiar en valores enviados por el cliente.

Este activo puede convertirse en la capa económica común de todo el producto.

### 3.2 Match Center y datos en vivo

Existe una base avanzada con caché compartida, degradación controlada,
procesamiento de eventos, notificaciones y distintas superficies de partido.
Debe ser el núcleo de la jornada, no otro módulo dentro de un menú extenso.

### 3.3 Predicciones y resolución

La auditoría de junio señalaba la ausencia de resolución automática. El código
actual ya contiene rutas y procesos de resolución para Mundial y ligas,
liquidación de micro-picks, retos y notificaciones. El riesgo histórico no debe
presentarse como si siguiera intacto.

### 3.4 Seguridad de automatizaciones e IA

También se han corregido riesgos importantes detectados en junio:

- `requireCron` falla cerrado si no existe `CRON_SECRET`;
- los principales endpoints de IA Coach exigen usuario y rate limit;
- el ranking de Fantasy recalcula puntos en servidor;
- los procesos de predicciones ya disponen de resolución automatizada.

La velocidad con la que se han aplicado estas correcciones es una señal
positiva de capacidad de ejecución.

### 3.5 Producto permanente ya iniciado

Las rutas por liga, club, jugador y fixture, las predicciones por competición,
el fantasy de ligas y el historial por club demuestran que el cambio
ZonaMundial → Zona de Ligas ya está en el código. No es solo un cambio de nombre.

## 4. Riesgos actuales

### 4.1 Las barreras de calidad están desactivadas

`next.config.js` contiene:

- `typescript.ignoreBuildErrors: true`;
- `eslint.ignoreDuringBuilds: true`.

Además, `tsconfig.json` mantiene `strict: false`. El despliegue puede continuar
aunque existan errores que deberían bloquearlo.

El único script de test declarado valida de forma determinista el gate editorial
de noticias. No existe todavía una red de seguridad proporcional al valor y a
la superficie del producto.

**Impacto:** riesgo de regresiones en pagos, economía, puntuación, live y
retención; también debilita una due diligence técnica.

### 4.2 Migraciones sin registro canónico

Los 65 scripts SQL usan prefijos repetidos —por ejemplo, existen varias
migraciones `2026-05`, `2026-08`, `2026-19`, `2026-34` y `2026-41`.

**Impacto:** no queda demostrado por el repositorio qué migraciones se aplicaron,
en qué orden ni en qué entornos.

### 4.3 El producto sigue contando dos historias

El README y numerosos textos, rutas y prompts continúan centrados en
ZonaMundial/Mundial 2026. Parte de ese contenido es un activo SEO legítimo, pero
otra parte corresponde a lógica, copy y documentación que ya deberían hablar
de Zona de Ligas.

**Impacto:** confusión de marca, mantenimiento duplicado y peor lectura para
inversores o colaboradores técnicos.

### 4.4 Más módulos que bucles de usuario

El código ofrece muchas experiencias, pero cada una presenta su propia entrada,
progresión, ranking o contexto. La persona debe entender la arquitectura interna
del producto para decidir qué hacer.

**Impacto:** la amplitud no se transforma automáticamente en activación,
retención o monetización.

### 4.5 Operación dependiente de cuotas y cron

El producto depende de API-Football, noticias, Anthropic, KV, Supabase, push,
email, Stripe y múltiples automatizaciones. Los workflows actuales son
principalmente tareas cron y watchdogs; no existe un workflow de CI convencional
que valide cada cambio.

**Impacto:** el crecimiento pagado podría elevar costes y fallos antes de elevar
retención.

### 4.6 Monetización dispersa

Existen Pro, Founders, publicidad, afiliación, programas para creadores, bares,
patrocinios y premios. Es una buena cartera de posibilidades, pero todavía no
constituye una tesis económica única y demostrable.

**Impacto:** un inversor no sabrá qué motor financiar ni cómo el gasto de
marketing se convierte en ingresos.

### 4.7 Riesgos de confianza que deben permanecer cerrados

La auditoría previa identificó cifras ficticias, autores ficticios, simulaciones
presentadas como reales y riesgos de copyright. Parte ha sido corregida, pero la
regla de producto debe quedar institucionalizada:

- no publicar social proof sin fuente;
- etiquetar claramente demo, simulación y proyección;
- acreditar y enlazar las fuentes;
- no presentar personalidades ficticias como autores reales;
- no basar el crecimiento en apuestas.

La confianza es parte del producto y del valor de inversión.

## 5. Lectura de madurez

| Dimensión | Evaluación | Razón |
|---|---|---|
| Amplitud funcional | Alta | Existe una cartera considerable de experiencias |
| Diferenciación potencial | Alta | Integración de jornada, identidad, IA y economía |
| Coherencia de experiencia | Media-baja | Los módulos aún compiten por la atención |
| Calidad verificable | Baja-media | Gates desactivados y cobertura de tests mínima |
| Operación a escala | Media-baja | Dependencias, cuotas y cron requieren observabilidad |
| Monetización | Media | Hay vías implementadas, falta demostrar un motor |
| Preparación para inversión | Media | Buen activo; falta paquete de métricas y unit economics |
| Preparación multideporte | Baja | Hay primitivas reutilizables, pero el dominio sigue acoplado |

## 6. Qué conservar, consolidar y diferir

| Decisión | Capacidades |
|---|---|
| **Conservar como núcleo** | Match Center, identidad, ligas/clubes, predicciones, economía, notificaciones |
| **Consolidar en el núcleo** | IA Coach, micro, trivia, rankings, mis predicciones, logros |
| **Conectar al bucle de temporada** | Fantasy, Draft, cromos, Modo Carrera |
| **Usar como distribución B2B** | Bares, creadores, códigos de captación, patrocinios |
| **Diferir como apuesta central** | Chat abierto, streaming propio, AR, 3D intensivo y vídeo generado |
| **Extraer más adelante como FOS** | identidad, eventos, economía, retos, segmentación y Sponsor Intelligence |

## 7. Decisión de salida

La plataforma puede presentarse como un activo real, pero todavía no debe
comprar crecimiento a gran escala. Primero debe demostrar:

1. un camino de activación principal;
2. retención D7/D30 por cohorte;
3. uso repetido en jornadas;
4. circulación sana de Fútcoins;
5. coste técnico por usuario activo;
6. conversión de al menos un motor económico.

Una vez medidos esos seis puntos, la financiación puede defenderse como
**capital de crecimiento**, no como dinero para averiguar qué producto construir.
