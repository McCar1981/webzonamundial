# Product Evolution Blueprint

## 1. North Star

> Zona de Ligas será la plataforma que conoce a cada aficionado mejor que su
> club y convierte cada jornada en una experiencia propia, persistente y difícil
> de replicar.

La promesa no es «tener todas las funciones». La promesa es que cada persona
encuentre, en segundos, qué importa hoy para sus clubes, competiciones,
predicciones, amigos y progreso.

## 2. Posicionamiento

**Categoría:** sistema operativo del aficionado al fútbol.

**No es:**

- una web de resultados;
- un fantasy aislado;
- una app de noticias genérica;
- una colección de minijuegos;
- una demo de IA;
- una plataforma de apuestas.

**Sí es:** una capa personal que conecta identidad, partidos, contenido,
participación, progresión y recompensas durante todo el año.

## 3. Los dos bucles principales

### 3.1 Bucle de jornada

| Momento | Pregunta del usuario | Experiencia |
|---|---|---|
| Antes | ¿Qué importa hoy? | agenda personal, previa, alineaciones, IA Coach, predicción |
| Durante | ¿Qué está pasando y cómo participo? | Match Center, microretos, votación, amigos, recompensas |
| Después | ¿Cómo me fue y qué cambia? | resultado, aciertos, XP/Fútcoins, ranking, recap y siguiente acción |

El Match Center deja de ser una sección y se convierte en el contenedor de
jornada. Predicciones, micro, IA y comunidad aparecen dentro del contexto del
partido, no como destinos desconectados.

### 3.2 Bucle de temporada

1. El usuario sigue clubes y ligas.
2. Participa en jornadas.
3. Acumula historial, reputación, colecciones y progresión.
4. Compite con amigos, comunidad o liga privada.
5. Desbloquea utilidad, personalización y estatus.
6. Regresa porque la siguiente jornada continúa su historia.

Fantasy, Draft, cromos y Modo Carrera son capas de profundidad de este bucle. No
deben competir por convertirse cada uno en «la app».

## 4. La superficie principal: Hoy

La home autenticada debe responder una única pregunta: **¿qué tengo hoy en mi
fútbol?**

Orden recomendado:

1. partido o decisión más urgente;
2. estado de los clubes y ligas seguidos;
3. acciones pendientes —predecir, elegir, responder, reclamar—;
4. progreso de jornada y temporada;
5. contenido personalizado;
6. descubrimiento secundario.

Cada tarjeta debe explicar:

- por qué aparece;
- cuánto tiempo requiere;
- qué cambia al completarla;
- cuál es la siguiente acción.

El éxito no se mide por clics a módulos, sino por el porcentaje de usuarios que
completa una jornada personal.

## 5. Capas del producto

### 5.1 Fan Identity Engine

Fuente única para:

- usuario y preferencias;
- clubes, ligas y selecciones seguidos;
- zona horaria e idioma;
- historial de participación;
- nivel, reputación, rachas y logros;
- suscripción y permisos;
- señales de interés y fatiga.

El perfil no es una página estática. Es el contexto que decide qué experiencia
ensamblar.

### 5.2 Event Backbone

Modelo operativo compartido:

`deporte → competición → temporada → fase → evento → participante`

Para fútbol, un evento normalmente es un partido y sus estados:

`programado → previo → en vivo → finalizado → liquidado`

Predicciones, fantasy, notificaciones, IA y contenido deben reaccionar a la misma
identidad de evento y al mismo estado canónico.

### 5.3 Experience Engine

Representa acciones reutilizables:

- predecir;
- responder;
- votar;
- elegir;
- completar una misión;
- competir;
- reclamar;
- compartir.

Cada acción declara elegibilidad, ventana temporal, coste, recompensa,
liquidación y trazabilidad. Esto reduce la duplicación de reglas entre módulos.

### 5.4 Economy & Progression

Una única capa para:

- Fútcoins y ledger;
- XP y nivel;
- rachas;
- logros;
- power-ups;
- recompensas y cosméticos;
- entitlements Free, Pro, Founders o patrocinados.

Toda emisión de moneda debe tener una razón y todo gasto debe aportar utilidad,
estatus o aceleración. La métrica relevante es circulación, no saldo acumulado.

### 5.5 Intelligence & Personalization

La IA se organiza como servicio transversal y no como cinco productos
independientes.

Patrón económico:

1. generar una base verificable por `partido × club × idioma`;
2. cachear esa base;
3. recuperar perfil, historial y estado de juego;
4. ensamblar una respuesta breve para la persona;
5. registrar coste, latencia, utilidad y reutilización.

La IA puede explicar, resumir, recomendar y adaptar el tono. No debe inventar
hechos, fingir certeza ni sustituir datos deportivos.

### 5.6 Sponsor Intelligence

Capa B2B posterior que utiliza las anteriores para:

- segmentar activaciones sin vender datos personales;
- asociar una marca a jornadas, retos o recompensas;
- medir participación y uplift;
- operar ligas privadas o experiencias white-label;
- dar reporting verificable a patrocinadores.

KNOSIS encaja aquí como oportunidad complementaria. No sustituye el núcleo B2C.

## 6. Integración de los módulos actuales

| Módulo actual | Papel objetivo |
|---|---|
| Ligas, clubes y jugadores | Contexto permanente del perfil |
| Match Center | Orquestador de la jornada |
| Predicciones | Acción principal antes del partido |
| Micro | Acción rápida durante el partido |
| IA Coach | Capa explicativa dentro de cada contexto |
| Trivia | Misión breve para días sin partido y activación de contenido |
| Fantasy | Compromiso de temporada |
| Draft | Formación de identidad y competición por liga |
| Cromos | Colección, recuerdo y estatus |
| Modo Carrera | Experiencia profunda para usuarios de alta afinidad |
| Rankings | Vista común por amigos, club, liga y temporada |
| Fútcoins/XP | Economía y progresión compartidas |
| Bares y creadores | Canales de adquisición y experiencias patrocinables |

## 7. Principios de experiencia

### 7.1 Mobile real

Con una audiencia mayoritariamente Android de gama media:

- contenido primero, efectos después;
- texto, SVG y WebP antes que vídeo;
- carga progresiva y degradación limpia;
- superficies táctiles simples;
- presupuesto de rendimiento por ruta;
- push útil y configurable, no volumen indiscriminado.

### 7.2 Confianza visible

- distinguir dato, predicción, simulación y opinión;
- mostrar fuente y actualización;
- explicar por qué se recomienda una acción;
- evitar contadores o urgencias artificiales;
- no utilizar autores o testimonios ficticios;
- dar al usuario control sobre perfil y notificaciones.

### 7.3 Una acción dominante

Cada pantalla tiene una acción principal. Los módulos secundarios aparecen
cuando aportan contexto, no para llenar la interfaz.

## 8. Football-first, sport-ready

No se construye hoy una plataforma genérica para todos los deportes. Se
neutralizan únicamente primitivas que ya son compartibles:

- deporte;
- competición;
- temporada;
- fase;
- evento;
- participante;
- perfil;
- acción;
- economía;
- contenido;
- entitlement;
- telemetría.

Las reglas propias de fútbol —alineaciones, mercado de goles, formaciones,
offside, puntuación fantasy— permanecen en adaptadores de fútbol.

### Condición para abrir un segundo deporte

Solo se incorpora cuando:

1. el bucle de fútbol demuestra retención;
2. existe un canal de distribución concreto;
3. los derechos y datos tienen coste conocido;
4. al menos el 70 % de identidad, economía, eventos y analítica se reutiliza;
5. el nuevo deporte no reduce la calidad de la experiencia de fútbol.

## 9. Lo que no se prioriza

- reescritura completa;
- repositorio FOS independiente sin consumidores reales;
- vídeo generado como núcleo;
- AR/3D como propuesta de valor;
- apuestas;
- chat público sin capacidad de moderación;
- abrir muchas ligas sin presupuesto de datos y contenidos;
- nuevas monedas o progresiones paralelas;
- funcionalidades sin evento analítico y criterio de éxito.

## 10. Métrica North Star

**Jornadas personales completadas por usuario activo al mes.**

Una jornada personal se completa cuando el usuario realiza al menos dos acciones
significativas alrededor de un evento seguido y recibe su cierre:

- predice o toma una decisión;
- participa en vivo o consume el seguimiento;
- recibe resultado, progreso o recap.

Métricas de soporte:

- activación en 24 horas;
- retención D7 y D30;
- usuarios con perfil completo;
- sesiones por jornada;
- ligas/jornadas activas por usuario;
- circulación de Fútcoins;
- conversión Free → Pro;
- coste de datos e IA por usuario activo;
- reactivación atribuida a push/email;
- porcentaje de usuarios que cruza dos experiencias dentro del mismo partido.
