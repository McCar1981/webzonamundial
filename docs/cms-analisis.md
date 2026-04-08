# Análisis CMS para Blog y Noticias — ZonaMundial

> Fecha: 2026-04-02  
> Stack actual: Next.js 14 (App Router) · TypeScript · Vercel

---

## Situación actual

| Sección | Archivo | Contenido |
|---|---|---|
| Blog | `src/app/blog/page.tsx` | Array `POSTS` hardcodeado (4 posts) |
| Noticias | `src/app/noticias/page.tsx` | Array `POSTS` hardcodeado (6 artículos) |

**Problema:** Cualquier publicación nueva requiere editar código y hacer un redeploy. No hay base de datos, ni API routes, ni CMS.

---

## Opciones evaluadas

### 1. Sanity.io ⭐ Recomendado principal

**Tipo:** Headless CMS cloud (SaaS)  
**Plan gratuito:** Sí — 3 usuarios, 10 GB bandwidth, 2 proyectos

**Por qué encaja con ZonaMundial:**
- Integración nativa con Next.js 14 App Router (paquete `next-sanity`)
- GROQ (query language propio) permite filtrar por categoría, fecha, autor sin escribir SQL
- Studio visual que un editor no técnico puede usar para publicar noticias
- Soporte de imágenes con `@sanity/image-url` + transformaciones automáticas (ya usan imágenes externas)
- Incremental Static Regeneration (ISR) con webhooks: el contenido se actualiza sin redeploy

**Integración:**
```bash
npm install next-sanity @sanity/image-url
npx sanity init --env
```

**Schema de ejemplo para Noticias:**
```typescript
// sanity/schemas/noticia.ts
export default {
  name: 'noticia',
  type: 'document',
  fields: [
    { name: 'titulo', type: 'string' },
    { name: 'slug', type: 'slug', options: { source: 'titulo' } },
    { name: 'categoria', type: 'string', options: {
      list: ['Análisis','Datos & Stats','Historia','Sedes','Selecciones','Plataforma']
    }},
    { name: 'autor', type: 'string' },
    { name: 'portada', type: 'image' },
    { name: 'contenido', type: 'array', of: [{ type: 'block' }] },
    { name: 'fechaPublicacion', type: 'datetime' },
    { name: 'tiempoLectura', type: 'number' },
  ]
}
```

**Pros:**
- Studio embebido en la app (`/studio`) o en la nube
- Tiempo real (live preview)
- Gratis hasta escalar

**Contras:**
- Vendor lock-in con Sanity
- Curva de aprendizaje de GROQ
- El Studio usa React 18 pero puede haber conflictos de versiones con el proyecto

---

### 2. Notion como CMS

**Tipo:** Notion API como backend de contenido  
**Plan gratuito:** Sí (ya tienes el MCP de Notion conectado)

**Por qué encaja:**
- Ya tienen Notion disponible en el entorno (MCP configurado)
- Publicar desde Notion es ultra simple para editores no técnicos
- Cero infraestructura extra

**Cómo funcionaría:**
1. Crear una base de datos en Notion: `Noticias ZonaMundial`
2. Cada fila = un artículo (campos: Título, Categoría, Autor, Fecha, Imagen URL, Contenido)
3. En Next.js, `fetch` a la Notion API en cada request o con ISR

```typescript
// src/lib/notion.ts
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function getNoticias() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DB_ID!,
    filter: { property: 'Publicado', checkbox: { equals: true } },
    sorts: [{ property: 'Fecha', direction: 'descending' }],
  })
  return response.results
}
```

**Pros:**
- Sin coste adicional
- El equipo ya puede conocer Notion
- Integración rápida (1-2 días)
- Control total del contenido sin depender de terceros específicos de CMS

**Contras:**
- API de Notion tiene rate limits (3 req/seg)
- El rich text de Notion requiere parsing manual
- Las imágenes de Notion expiran (S3 con TTL de 1 hora) → necesitan re-hospedar imágenes
- No hay preview en tiempo real sin trabajo extra

---

### 3. TinaCMS

**Tipo:** Git-based CMS (el contenido vive en el repo como MDX/JSON)  
**Plan gratuito:** Sí (Tina Cloud gratuito hasta 2 usuarios)

**Por qué encaja:**
- El contenido se guarda como archivos `.mdx` en el repositorio (versionado con Git)
- Editor visual que modifica los archivos directamente
- Sin base de datos externa
- Funciona perfecto con Vercel

**Flujo:**
```
Editor escribe en Tina UI → commit automático al repo → Vercel redeploy (ISR)
```

**Pros:**
- Contenido versionado en Git (no hay vendor lock-in de datos)
- Perfecto si el equipo ya usa GitHub
- MDX permite componentes React dentro del contenido

**Contras:**
- Cada publicación genera un commit → puede ensuciar el historial de git
- Los redeploys de Vercel tardan ~1-2 min (no es instantáneo)
- Tina Cloud gratuito tiene límite de 2 editores

---

### 4. Strapi (self-hosted)

**Tipo:** Headless CMS open source, self-hosted  
**Plan gratuito:** Sí (open source)

**Por qué NO es ideal aquí:**
- Requiere un servidor propio (no corre en Vercel)
- Necesitaría Railway, Render o un VPS (~$5-7/mes)
- Mayor complejidad de mantenimiento
- Overkill para un blog de noticias deportivas

---

### 5. Contentful

**Tipo:** Headless CMS SaaS empresarial  
**Plan gratuito:** Sí — 5 usuarios, 25.000 records

**Por qué NO es la primera opción:**
- La free tier es generosa pero el salto al plan pago es muy caro ($300+/mes)
- La DX es más compleja que Sanity para proyectos pequeños
- Bueno a largo plazo si el proyecto escala a nivel empresarial

---

## Comparativa rápida

| CMS | Setup | Coste | DX Next.js | Editores no técnicos | Imágenes | Recomendado para |
|---|---|---|---|---|---|---|
| **Sanity** | Medio | Gratis → $99/mes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Nativo | Escalar el proyecto |
| **Notion** | Rápido | Gratis | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Externo | Empezar rápido |
| **TinaCMS** | Medio | Gratis | ⭐⭐⭐⭐ | ⭐⭐⭐ | Via Git | Control total |
| **Strapi** | Lento | Infraestructura | ⭐⭐⭐⭐ | ⭐⭐⭐ | Sí | Proyectos grandes |
| **Contentful** | Medio | Gratis → caro | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Nativo | Enterprise |

---

## Recomendación

### Corto plazo (implementación en 1-2 días): **Notion como CMS**

Ya tienen el MCP de Notion conectado. Se puede crear la base de datos hoy mismo y adaptar `noticias/page.tsx` para consumir la API de Notion con ISR. Es la ruta más rápida para que alguien pueda publicar noticias sin tocar código.

**Limitación clave a resolver:** Las imágenes de Notion expiran. Solución: usar Cloudinary o Vercel Blob para las imágenes, y solo guardar la URL final en Notion.

### Largo plazo (si el proyecto crece): **Sanity.io**

Si ZonaMundial va a publicar contenido frecuentemente (diario/semanal), Sanity ofrece la mejor DX con Next.js 14, live preview, y un Studio profesional. La migración desde Notion sería sencilla porque los schemas son similares.

---

## Plan de implementación sugerido (Notion → Next.js)

```
Semana 1
├── Crear DB en Notion (Noticias + Blog por separado)
├── Instalar @notionhq/client
├── Crear src/lib/notion.ts con helpers de fetch
├── Migrar los 6 artículos hardcodeados a Notion
└── Adaptar noticias/page.tsx para consumir API (ISR 60s)

Semana 2
├── Migrar blog/page.tsx
├── Crear páginas de detalle /noticias/[slug]
├── Configurar revalidación con webhook de Notion → Vercel
└── Subir imágenes a Vercel Blob / Cloudinary
```

---

## Variables de entorno necesarias

```env
# .env.local
NOTION_API_KEY=secret_xxxxxxxxxxxx
NOTION_NOTICIAS_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_BLOG_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

*Generado por Claude Code — ZonaMundial 2026*
