# Zona de Ligas

**El sistema operativo personal del aficionado al fútbol.**

Zona de Ligas conecta partidos, clubes, contenido, predicciones, fantasy,
trivia, IA, progresión y recompensas en una experiencia permanente.

El producto evoluciona desde **ZonaMundial**, la plataforma creada para el
Mundial 2026. El contenido histórico y las experiencias del torneo permanecen
como parte del producto; las nuevas superficies por liga, club y temporada
construyen su continuidad durante todo el año.

## Dirección de producto

La experiencia se organiza alrededor de dos bucles:

- **Jornada:** previa → participación → directo → resultado → progreso.
- **Temporada:** identidad → historial → competición → colección → retorno.

La home autenticada debe responder: **¿qué tengo hoy en mi fútbol?**

Consulta la documentación estratégica:

- [Current Platform Assessment](docs/strategy/CURRENT-PLATFORM-ASSESSMENT.md)
- [Product Evolution Blueprint](docs/strategy/PRODUCT-EVOLUTION-BLUEPRINT.md)
- [Growth Investment Case](docs/strategy/GROWTH-INVESTMENT-CASE.md)
- [Execution Roadmap](docs/strategy/EXECUTION-ROADMAP.md)

## Capacidades existentes

- Ligas, clubes, jugadores, fixtures y seguimiento personalizado.
- Match Center con previa, eventos, datos en vivo y participación.
- Predicciones, micro-predicciones, fantasy, Draft, trivia y Modo Carrera.
- Fútcoins, XP, rachas, logros, power-ups y rankings.
- IA Coach, generación editorial y personalización.
- Notificaciones push/email y calendario personal.
- Plan Pro, Founders, Stripe, publicidad, afiliación y patrocinios.
- Experiencias y herramientas para bares, creadores y ligas privadas.

## Stack

- **Framework:** Next.js 14, App Router
- **Lenguaje:** TypeScript
- **UI:** React 18, Tailwind CSS, Framer Motion y GSAP
- **Datos/Auth:** Supabase
- **Caché/operación live:** Vercel KV
- **Deploy:** Vercel
- **Pagos:** Stripe
- **IA:** Anthropic
- **Contenido:** Sanity y pipeline editorial propio
- **Datos deportivos:** API-Football

## Setup local

```bash
npm ci
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Comprobaciones disponibles:

```bash
npm run validate-content
npm run test-gate
npm run lint
npm run build
```

> El roadmap técnico incluye restaurar barreras de TypeScript/ESLint y ampliar
> las pruebas de economía, scoring, live y permisos antes de escalar adquisición.

## Estructura principal

```text
src/
├── app/
│   ├── app/              # Experiencias autenticadas
│   ├── ligas/            # Competiciones, clubes, jugadores y partidos
│   ├── api/              # Route handlers y automatizaciones
│   └── ...               # Contenido, adquisición, cuenta y operaciones
├── components/           # Componentes compartidos
└── lib/
    ├── competitions/     # Configuración de competiciones
    ├── ligas/            # Dominio de Zona de Ligas
    ├── match-center/     # Datos y experiencia de jornada
    ├── predictions/      # Predicciones y liquidación
    ├── fantasy/          # Fantasy y scoring
    ├── economy/          # Fútcoins y ledger
    ├── ia-coach/         # Inteligencia contextual
    └── ...               # Trivia, Draft, cromos, notificaciones, pagos
```

## Arquitectura de evolución

| Capa | Responsabilidad |
|---|---|
| Zona de Ligas | Producto B2C permanente |
| Fan Identity Engine | Preferencias, historial, reputación y memoria |
| Event Backbone | Competiciones, temporadas, partidos y estados |
| Experience Engine | Predicciones, retos, misiones y recompensas |
| Economy & Progression | Fútcoins, XP, logros y entitlements |
| Sponsor Intelligence | Activaciones B2B y reporting futuro |

La arquitectura es **football-first, sport-ready**: fútbol se resuelve como
producto antes de incorporar otro deporte.

## Restricciones legales y de confianza

- No utilizar marcas protegidas sin licencia.
- Usar «Mundial 2026» o «Copa del Mundo 2026», no marcas oficiales ajenas.
- Banderas nacionales pueden utilizarse; escudos y activos oficiales requieren
  revisión de derechos.
- Distinguir claramente dato real, simulación, predicción y opinión.
- No publicar cifras, autores, testimonios o social proof sin una fuente
  verificable.
- No basar la experiencia en apuestas.
- Acreditar fuentes editoriales y respetar privacidad, consentimiento y bajas.

## Propiedad

Creado y desarrollado por [SprintMarkt](https://sprintmarkt.com), Valencia,
España.

© 2026 SprintMarkt. Todos los derechos reservados.
