#!/bin/bash
# ══════════════════════════════════════════════
# ZonaMundial — Script de limpieza del repo
# Ejecutar desde la raíz del proyecto en Git Bash
# ══════════════════════════════════════════════

echo "🧹 Limpiando repo ZonaMundial..."
echo ""

# 1. Eliminar node_modules del tracking de git
if git ls-files --error-unmatch node_modules/ > /dev/null 2>&1; then
  echo "❌ Eliminando node_modules del tracking de git..."
  git rm -r --cached node_modules/
  echo "✅ node_modules eliminado del tracking"
else
  echo "✅ node_modules no está trackeado"
fi

# 2. Eliminar archivos con rutas de Windows
echo ""
echo "🔍 Buscando archivos con rutas de Windows..."
WINDOWS_FILES=$(git ls-files | grep -i "C:" || true)
if [ -n "$WINDOWS_FILES" ]; then
  echo "❌ Encontrados archivos basura:"
  echo "$WINDOWS_FILES"
  echo "$WINDOWS_FILES" | while read -r file; do
    git rm --cached "$file" 2>/dev/null
  done
  echo "✅ Archivos de Windows eliminados del tracking"
else
  echo "✅ No hay archivos con rutas de Windows"
fi

# 3. Eliminar dist/ del tracking si existe
if git ls-files --error-unmatch dist/ > /dev/null 2>&1; then
  echo ""
  echo "❌ Eliminando dist/ del tracking..."
  git rm -r --cached dist/
  echo "✅ dist eliminado"
fi

# 4. Crear estructura de carpetas si no existe
echo ""
echo "📁 Creando estructura de carpetas..."
mkdir -p src/app/selecciones/\[slug\]
mkdir -p src/app/sedes/\[slug\]
mkdir -p src/app/grupos
mkdir -p src/app/calendario
mkdir -p src/app/historia
mkdir -p src/app/noticias/\[slug\]
mkdir -p src/app/la-app
mkdir -p src/app/registro
mkdir -p src/app/creadores/\[codigo\]
mkdir -p src/app/legal/terminos
mkdir -p src/app/legal/privacidad
mkdir -p src/app/legal/cookies
mkdir -p src/app/faq
mkdir -p src/components/layout
mkdir -p src/components/ui
mkdir -p src/components/seo
mkdir -p src/lib/data
mkdir -p src/styles
mkdir -p public/img
mkdir -p docs/web-reference
mkdir -p docs/blog
echo "✅ Estructura creada"

# 5. Resumen
echo ""
echo "══════════════════════════════════════"
echo "📋 SIGUIENTE PASO:"
echo ""
echo "1. Copia los archivos del kit a la raíz:"
echo "   - .gitignore"
echo "   - package.json"
echo "   - next.config.ts"
echo "   - tsconfig.json"
echo "   - tailwind.config.ts"
echo "   - postcss.config.mjs"
echo "   - README.md"
echo ""
echo "2. Copia los archivos lib:"
echo "   - src/lib/constants.ts"
echo "   - src/lib/data/creators.ts"
echo "   - src/app/globals.css"
echo ""
echo "3. Mueve los page.tsx a sus carpetas:"
echo "   - Home page → src/app/page.tsx"
echo "   - Layout → src/app/layout.tsx"
echo "   - Selecciones → src/app/selecciones/"
echo "   - etc."
echo ""
echo "4. Haz commit:"
echo "   git add -A"
echo "   git commit -m 'refactor: estructura limpia Next.js'"
echo "   git push origin main"
echo "══════════════════════════════════════"
