# ZonaMundial — Guía de Limpieza y Organización del Repo GitHub

**Repo:** `xarlytos/zonamundial` (privado)
**Deploy:** Vercel → zonamundial.vercel.app
**Fecha:** 12 marzo 2026

---

## PASO 1: Clonar el repo fresco (si no lo tienes ya)

```bash
cd ~/Desktop
git clone https://github.com/xarlytos/zonamundial.git
cd zonamundial
```

---

## PASO 2: Eliminar archivos basura del repo

Estos archivos NUNCA deben estar en git:

```bash
# Eliminar node_modules del tracking de git (NO de tu disco)
git rm -r --cached node_modules/

# Eliminar los archivos con rutas de Windows rotas
git rm --cached "C*Users*carlo*Desktop*" 2>/dev/null
# Si el comando anterior no funciona, busca los archivos exactos:
git ls-files | grep "C:" | xargs -I{} git rm --cached "{}"

# Eliminar archivos que no deben estar en la raíz
git rm --cached index.html 2>/dev/null
```

---

## PASO 3: Copiar el nuevo .gitignore

Copia el archivo `.gitignore` de este kit a la raíz del proyecto (reemplaza el existente si hay uno).

```bash
cp /ruta/al/kit/.gitignore .
```

---

## PASO 4: Estructura objetivo del proyecto

Tu repo debe quedar así:

```
zonamundial/
├── .gitignore
├── README.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── public/
│   ├── img/
│   │   └── logo.png
│   ├── flags/          (si usas flags locales, si no flagcdn.com)
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← Layout global (header + footer + nav)
│   │   ├── page.tsx                ← HOME PAGE
│   │   ├── globals.css
│   │   ├── selecciones/
│   │   │   ├── page.tsx            ← /selecciones (listado 48 equipos)
│   │   │   └── [slug]/
│   │   │       └── page.tsx        ← /selecciones/espana
│   │   ├── sedes/
│   │   │   ├── page.tsx            ← /sedes (16 estadios)
│   │   │   └── [slug]/
│   │   │       └── page.tsx        ← /sedes/metlife-stadium
│   │   ├── grupos/
│   │   │   └── page.tsx            ← /grupos (12 grupos + simulador)
│   │   ├── calendario/
│   │   │   └── page.tsx            ← /calendario (104 partidos)
│   │   ├── historia/
│   │   │   └── page.tsx            ← /historia + /formato
│   │   ├── noticias/
│   │   │   ├── page.tsx            ← /noticias (blog index)
│   │   │   └── [slug]/
│   │   │       └── page.tsx        ← /noticias/espana-mundial-2026
│   │   ├── la-app/
│   │   │   └── page.tsx            ← Showcase de módulos
│   │   ├── registro/
│   │   │   └── page.tsx            ← Pre-registro con selector de creador
│   │   ├── creadores/
│   │   │   └── [codigo]/
│   │   │       └── page.tsx        ← Landing por creador (/creadores/cobo)
│   │   ├── legal/
│   │   │   ├── terminos/page.tsx
│   │   │   ├── privacidad/page.tsx
│   │   │   └── cookies/page.tsx
│   │   ├── faq/
│   │   │   └── page.tsx
│   │   └── not-found.tsx           ← 404 custom
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── Breadcrumbs.tsx
│   │   ├── ui/
│   │   │   ├── MatchCard.tsx
│   │   │   ├── TeamCard.tsx
│   │   │   ├── StadiumCard.tsx
│   │   │   ├── GroupTable.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   ├── Flag.tsx
│   │   │   └── CTABanner.tsx
│   │   └── seo/
│   │       ├── JsonLd.tsx
│   │       └── MetaTags.tsx
│   ├── lib/
│   │   ├── data/
│   │   │   ├── teams.ts            ← 48 selecciones (datos estáticos)
│   │   │   ├── venues.ts           ← 16 sedes
│   │   │   ├── groups.ts           ← 12 grupos
│   │   │   ├── matches.ts          ← 104 partidos
│   │   │   ├── creators.ts         ← 8 creadores (sin Joaco)
│   │   │   └── history.ts          ← Historia mundiales
│   │   ├── utils.ts
│   │   └── constants.ts            ← Colores, URLs, config
│   └── styles/
│       └── globals.css
└── docs/
    ├── web-reference/              ← Los ZIPs originales como referencia
    │   ├── 00-COMPLETO/
    │   ├── 01-SELECCIONES/
    │   ├── 02-SEDES/
    │   ├── 03-GRUPOS/
    │   ├── 04-HISTORIA/
    │   └── 06-PREREGISTRO/
    └── blog/                       ← Artículos del blog (los .md)
        ├── S01_ART01_espana.md
        ├── S01_ART02_argentina.md
        ├── S01_ART45_historia.md
        └── S01_ART48_formato.md
```

---

## PASO 5: Mover archivos a la estructura correcta

Desde la raíz del proyecto:

```bash
# Crear estructura de carpetas
mkdir -p src/app/selecciones/[slug]
mkdir -p src/app/sedes/[slug]
mkdir -p src/app/grupos
mkdir -p src/app/calendario
mkdir -p src/app/historia
mkdir -p src/app/noticias/[slug]
mkdir -p src/app/la-app
mkdir -p src/app/registro
mkdir -p src/app/creadores/[codigo]
mkdir -p src/app/legal/terminos
mkdir -p src/app/legal/privacidad
mkdir -p src/app/legal/cookies
mkdir -p src/app/faq
mkdir -p src/components/layout
mkdir -p src/components/ui
mkdir -p src/components/seo
mkdir -p src/lib/data
mkdir -p src/styles
mkdir -p docs/web-reference
mkdir -p docs/blog
```

---

## PASO 6: Copiar archivos del kit a sus posiciones

Los archivos de configuración de este kit van a la raíz:
- `package.json` → raíz
- `next.config.ts` → raíz
- `tsconfig.json` → raíz
- `tailwind.config.ts` → raíz
- `postcss.config.mjs` → raíz
- `.gitignore` → raíz
- `README.md` → raíz

Los archivos de datos van a `src/lib/`:
- `constants.ts` → `src/lib/constants.ts`
- `creators.ts` → `src/lib/data/creators.ts`

---

## PASO 7: Commit limpio

```bash
git add -A
git commit -m "refactor: reorganizar proyecto Next.js - estructura limpia para desarrollo"
git push origin main
```

---

## PASO 8: Verificar deploy en Vercel

Vercel debería detectar el push y re-deployar automáticamente. Si falla:
1. Ve a vercel.com → tu proyecto
2. Settings → General → Framework Preset: **Next.js**
3. Root Directory: `.` (raíz)
4. Build Command: `next build`
5. Output Directory: `.next`

---

## IMPORTANTE

- **NUNCA subas `node_modules/`** — está en `.gitignore`
- **NUNCA subas archivos con rutas de Windows** — cuidado al hacer drag & drop
- Antes de cada commit: `git status` para revisar qué vas a subir
- Los archivos en `docs/web-reference/` son REFERENCIA para los devs, no código ejecutable
- El código real de producción va en `src/`
