# Execution Roadmap

## 1. Objetivo

Llegar a un producto coherente, medible y preparado para recibir capital de
crecimiento sin multiplicar deuda, costes o complejidad.

La secuencia es:

`confianza → medición → bucle principal → retención → adquisición → escala`

## 2. Primeros 90 días

### Días 0–30 — Fundamentos y verdad

**Producto**

- definir «jornada personal completada»;
- inventariar cada módulo y asignarlo a jornada, temporada, distribución o
  diferido;
- fijar la navegación objetivo y la acción principal de la home autenticada;
- documentar qué contenidos del Mundial permanecen como archivo SEO.

**Tecnología**

- crear CI para contenido, test, typecheck y lint;
- registrar el baseline de errores y reducirlo hasta poder bloquear regresiones;
- crear un manifiesto canónico de migraciones SQL;
- añadir pruebas a economía, puntuación, rewards, resolución y permisos;
- documentar presupuesto de cuota y degradación de API-Football.

**Datos**

- definir taxonomía de eventos;
- conectar `source`, `campaign`, `creator_code` y `competition` con el usuario;
- crear dashboard de activación, D7/D30 y jornada;
- medir coste de IA y datos por usuario activo.

**Salida**

- ninguna métrica crítica depende de una cifra manual;
- cada cambio pasa una barrera mínima;
- se puede reconstruir una cohorte desde adquisición hasta retorno.

### Días 31–60 — Unificar la experiencia

**Producto**

- construir la superficie «Hoy» para usuarios autenticados;
- integrar previa, predicción, live y cierre en una misma jornada;
- unificar perfil, Fútcoins, XP, rachas y rankings;
- introducir recap personal después de cada partido seguido;
- reducir módulos promocionados simultáneamente.

**IA**

- inventariar prompts, modelos, cachés y coste;
- compartir generación por `partido × club × idioma`;
- mover IA Coach al contexto donde aporta una decisión;
- registrar utilidad —acción posterior, feedback o abandono—.

**Retención**

- calendario personal y notificaciones por club/liga;
- reactivación basada en acciones pendientes;
- digest con lo que cambió para el usuario;
- frecuencia y consentimiento configurables.

**Salida**

- el usuario entiende qué hacer hoy sin conocer los módulos;
- una jornada une al menos dos acciones y un cierre;
- perfil y economía se actualizan de manera común.

### Días 61–90 — Growth readiness

**Adquisición**

- ejecutar pruebas pequeñas por canal, liga y mensaje;
- crear landing y código de atribución por partner;
- comparar paid, creadores, SEO, ligas privadas y bares;
- detener cohortes sin retorno temprano.

**Monetización**

- simplificar propuesta Pro;
- diseñar un primer paquete de jornada patrocinada;
- instrumentar impresiones, participación y uplift;
- preparar una activación piloto con reporting.

**Inversión**

- completar data room;
- generar deck con métricas verificadas;
- construir modelo de uso de fondos por etapas;
- preparar lista cualificada de inversores y partners;
- iniciar outreach solo cuando el embudo esté reconciliado.

**Salida**

- existe al menos un canal con señales repetibles;
- el coste por usuario activado y retenido es visible;
- el pitch se sostiene con producto y cohortes, no con proyecciones aisladas.

## 3. Horizonte de 12–18 meses

### Horizonte 1 — Cerrar economía y perfil

- identidad única;
- progreso compartido;
- utilidad clara de Fútcoins;
- Pro alineado con valor recurrente;
- métricas de cohortes y coste.

### Horizonte 2 — Jornada e IA unificadas

- Match Center como orquestador;
- inteligencia compartida y cacheada;
- misiones antes/durante/después;
- recap y memoria de temporada;
- primeras activaciones patrocinadas repetibles.

### Horizonte 3 — Memoria profunda y FOS

- grafo de afinidad del aficionado;
- personalización basada en historial;
- componentes FOS separados por contratos internos;
- Sponsor Intelligence;
- evaluación de segundo deporte con un partner concreto.

## 4. Backlog inicial priorizado

| # | Entregable | Prioridad | Criterio de terminado |
|---:|---|---|---|
| 1 | Taxonomía de eventos de producto | P0 | Esquema versionado y usado por los flujos críticos |
| 2 | Dashboard de activación y retención | P0 | D1/D7/D30 por cohorte y canal |
| 3 | Baseline de CI | P0 | Ningún cambio aumenta errores conocidos |
| 4 | Registro de migraciones | P0 | Orden y estado por entorno trazables |
| 5 | Tests de economía y scoring | P0 | Casos de duplicación, fraude y liquidación cubiertos |
| 6 | Home «Hoy» | P1 | Acción prioritaria personalizada y medible |
| 7 | Jornada unificada | P1 | Previa → live → cierre sobre el mismo evento |
| 8 | Perfil/economía compartidos | P1 | Progreso consistente en todas las acciones |
| 9 | Atribución por canal/partner | P1 | Alta y retención conectadas con origen |
| 10 | Paquete patrocinado piloto | P1 | Inventario, acción y reporting definidos |
| 11 | Catálogo de IA y costes | P1 | Modelo, prompt, TTL y coste por caso |
| 12 | Data room de inversión | P1 | Evidencias accesibles y cifras reconciliadas |

## 5. Taxonomía mínima de analítica

### Identidad y adquisición

- `landing_viewed`
- `signup_started`
- `signup_completed`
- `profile_completed`
- `club_followed`
- `competition_followed`

### Jornada

- `matchday_opened`
- `prediction_submitted`
- `live_opened`
- `micro_answered`
- `match_recap_viewed`
- `matchday_completed`

### Economía y retención

- `coins_earned`
- `coins_spent`
- `reward_claimed`
- `streak_continued`
- `notification_reactivated`

### Monetización

- `paywall_viewed`
- `checkout_started`
- `subscription_started`
- `sponsor_experience_viewed`
- `sponsor_action_completed`

Todo evento debe incluir, cuando aplique:

`user_id`, `anonymous_id`, `sport`, `competition`, `event_id`, `club_id`,
`source`, `campaign`, `partner_code`, `surface`, `timestamp` y versión de
experimento.

## 6. Cuadro de mando

| Nivel | Métrica |
|---|---|
| North Star | Jornadas personales completadas por usuario activo/mes |
| Activación | Perfil + seguimiento + primera acción en 24 h |
| Retención | D1, D7, D30 y jornadas activas por cohorte |
| Profundidad | Acciones significativas por jornada |
| Economía | Earn/spend ratio, usuarios que gastan, inflación |
| Ingresos | Conversión Pro, ARPU, patrocinio y B2B |
| Growth | CAC por activado y por retenido |
| Eficiencia | Coste de datos/IA/email por usuario activo |
| Confianza | errores live, reclamaciones, bajas y opt-outs |

## 7. Reglas para experimentos de marketing

- presupuesto pequeño hasta demostrar activación;
- una hipótesis y un segmento por experimento;
- attribution code o UTM obligatorios;
- comparar cohortes, no solo CPC o registros;
- ventana suficiente para observar la segunda jornada;
- criterio de parada definido antes de lanzar;
- no escalar por volumen si D7 empeora;
- conservar un grupo orgánico de referencia cuando sea posible.

## 8. Stop doing

Durante este ciclo:

- no abrir un repositorio FOS paralelo;
- no lanzar otro deporte;
- no añadir una progresión independiente;
- no crear nuevas home alternativas;
- no comprar tráfico masivo sin cohortes;
- no presentar métricas no reconciliadas;
- no priorizar vídeo, AR o chat abierto;
- no aumentar ligas si la cuota de datos no está presupuestada;
- no introducir una funcionalidad sin owner, evento y métrica.

## 9. Definición de preparación para ronda

Zona de Ligas está preparada para una captación orientada a marketing cuando:

1. la propuesta se entiende en una frase;
2. el producto lleva al usuario a una jornada personal;
3. D7/D30 están disponibles por canal;
4. se conoce el coste por usuario activado y retenido;
5. existe evidencia de monetización o patrocinio;
6. el sistema soporta una cohorte mayor sin degradación;
7. cada cifra del deck tiene una fuente;
8. el uso de fondos está vinculado a hitos medibles.

Hasta entonces, el objetivo no es «parecer grande». Es demostrar una máquina
pequeña que puede crecer con capital.
