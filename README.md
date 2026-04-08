# ZonaMundial 🏆

**Plataforma de predicciones, fantasy y engagement para la Copa del Mundo 2026.**

48 selecciones · 104 partidos · 39 días · 16 sedes · 3 países

## Stack

- **Framework:** Next.js 14 (App Router)
- **Estilos:** Tailwind CSS
- **Lenguaje:** TypeScript
- **Deploy:** Vercel
- **Font:** Outfit (Google Fonts)

## Setup local

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del proyecto

```
src/
├── app/              # Páginas (Next.js App Router)
│   ├── layout.tsx    # Layout global (header + footer)
│   ├── page.tsx      # Home
│   ├── selecciones/  # 48 selecciones
│   ├── sedes/        # 16 estadios
│   ├── grupos/       # 12 grupos + simulador
│   ├── calendario/   # 104 partidos
│   ├── historia/     # Historia mundiales
│   ├── noticias/     # Blog
│   ├── creadores/    # Landings por creador
│   └── registro/     # Pre-registro
├── components/       # Componentes reutilizables
│   ├── layout/       # Header, Footer, Nav
│   ├── ui/           # Cards, Tablas, CTAs
│   └── seo/          # JSON-LD, Meta tags
├── lib/
│   ├── data/         # Datos estáticos (equipos, sedes, grupos)
│   └── constants.ts  # Config, colores, URLs
└── styles/
    └── globals.css   # Estilos globales + Tailwind
```

## Colores de marca

| Color | Hex | Uso |
|-------|-----|-----|
| Background | `#060B14` | Fondo principal |
| Surface | `#0F1D32` | Fondo secundario |
| Surface 2 | `#0B1825` | Fondo terciario |
| Gold | `#c9a84c` | Acento (textos, bordes, CTAs) |

## Restricciones legales

- ❌ NUNCA usar marcas protegidas (FIFA™, World Cup™)
- ✅ Usar: "Copa del Mundo 2026", "Mundial 2026"
- ❌ NUNCA usar la palabra "quinielas"
- ✅ Usar: "predicciones", "pronósticos"
- ✅ Banderas nacionales = dominio público
- ❌ Escudos de federaciones = requieren licencia
- ✅ Nombres de jugadores en contexto editorial

## Documentación

- `/docs/web-reference/` — Referencia visual de todas las páginas
- `/docs/blog/` — Artículos del blog en Markdown

## Equipo

Desarrollado por [Sprintmarkt](https://sprintmarkt.com) · Valencia, España

---

© 2026 Sprintmarkt. Todos los derechos reservados.
