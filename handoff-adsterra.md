# HANDOFF — Integración Adsterra Native Banner (ZonaMundial)

**Fecha:** 2026-06-09
**Sitio:** zonamundial.app (Next.js App Router, desplegado en Vercel)
**Objetivo:** Mostrar el Native Banner de Adsterra en la web como puente de monetización para el Mundial 2026 (empieza 11/06).
**Estado actual:** 🟡 Arreglo COMPLETO de CSP aplicado y desplegado a `main` (commit `2206929`, 09/06). Falta verificar en producción tras el build de Vercel (ver sección 5) y confirmar impresiones.

---

## 1. Datos clave de la integración

| Elemento | Valor |
|---|---|
| Adsterra Website ID | `5836031` (zonamundial.app) — estado **Approved** |
| Ad Unit ID | `29592312` — "NativeBanner_1" — estado **Active** |
| Script (invoke.js) | `https://pl29692811.effectivecpmnetwork.com/2c3e7aab90e3d144a2aa3796d58e2610/invoke.js` |
| Container ID | `container-2c3e7aab90e3d144a2aa3796d58e2610` |
| Enlace de test (FUNCIONA) | `https://external.adsterratools.com/placement/29592312/test/12/` |

**Variables de entorno en Vercel:**
- `NEXT_PUBLIC_ADSTERRA_NATIVE_SRC` = (URL del invoke.js de arriba)
- `NEXT_PUBLIC_ADSTERRA_NATIVE_CONTAINER_ID` = `container-2c3e7aab90e3d144a2aa3796d58e2610`
- ⚠️ Son `NEXT_PUBLIC_` → se inyectan en **build**, requieren **redeploy** para aplicarse.

**Archivos:**
- Componente: `src/components/ads/AdsterraNative.tsx` (renderiza el `<div>` contenedor + carga el script).
- Montaje: `src/app/layout.tsx` → `<AdsterraNative enabled={showAds} />`, en el layout raíz (aparece en la home y páginas públicas; excluye /admin, /cuenta, /onboarding, etc.).
- **CSP: `next.config.js`, array `csp`, directiva `script-src` (línea ~71).**

---

## 2. Diagnóstico — causa raíz CONFIRMADA

El banner no se mostraba en NINGÚN dispositivo ni red. Tras descartar varias hipótesis (ver sección 4), la causa real es:

➡️ **La Content Security Policy (CSP) del propio sitio bloquea el script de Adsterra.**

En la pestaña **Network** del navegador, las peticiones a `invoke.js` salen con estado **`blocked:csp`**. La directiva `script-src` en `next.config.js` lista los dominios permitidos (Google AdSense, GA, Vercel, login) pero **no incluía el dominio de Adsterra** (`effectivecpmnetwork.com`). El navegador bloquea el script antes de ejecutarlo, para todos los visitantes por igual (la CSP la manda el servidor).

**Confirmación cruzada:** Adsterra verificó por su lado y llegó a la misma conclusión (CSP bloqueando scripts).

---

## 3. Conversación con el soporte de Adsterra (resumen cronológico)

1. **Adsterra:** "Los anuncios empiezan en unos minutos. El código del Banner Nativo está instalado, pero la unidad no se muestra. ¿En qué plataforma está el sitio (Wix, WordPress…)? Envía captura de cómo instalaste el código."
2. **Nosotros:** Sitio propio en **Next.js (React) / Vercel**, no es un CMS. Script `invoke.js` y `<div id="container-...">` presentes en el HTML (enviada captura del código fuente).
3. **Adsterra:** "El Banner Nativo funciona — compruébalo en el enlace de test [29592312/test/12]. No es visible en tu web por un problema de instalación del código. Revisa estos artículos (cargar scripts externos en React/Next.js, librería `react-advertising`, etc.)."
4. **Adsterra:** "¿Dónde instalaste exactamente el banner? ¿Sigue en la Página de Inicio?"
5. **Nosotros:** Sí, en la home, en el layout raíz; script + contenedor presentes.
6. **Adsterra (clave):** "El script está siendo **bloqueado por CSP**. Actualiza tu configuración de CSP para permitir que tu web cargue el script." (+ artículo de Intercom sobre errores de CSP: `https://www.intercom.com/help/en/articles/12292300-resolving-content-security-policy-csp-errors`)

---

## 4. Hipótesis descartadas (para no repetir trabajo)

- ❌ **No estaba aprobado / sin fill:** falso. Website **Approved**, unit **Active**, y el enlace de test renderiza perfectamente → la unidad y el relleno funcionan.
- ❌ **Problema de renderizado en la SPA (re-inyección de script):** era la sospecha intermedia, pero la causa real resultó ser la CSP.
- ❌ **Antivirus / DNS local de Carlos:** SÍ afectaba a SU equipo (error `NET::ERR_CERT_AUTHORITY_INVALID` por antivirus/DNS interceptando el dominio), pero es un problema **local de su máquina/red**, no del sitio. No usar el PC de Carlos como prueba: probar en **móvil con datos, sin antivirus/adblocker/Brave/DNS de filtrado**.
- ⚠️ Las **4 impresiones** registradas el 09/06 vienen del test/comprobaciones de Adsterra, no de renders reales en producción.

---

## 5. Estado del arreglo (RESUELTO en código — 09/06/2026)

**Diagnóstico fino completado** (analizando el `invoke.js` real descargado de Adsterra):

- El `script-src` de producción ya incluía el comodín `https://*.com https://*.net` (commit `a21881d` de Carlos), así que el **`invoke.js` SÍ cargaba y se ejecutaba**. El script y el contenedor estaban presentes en el HTML de producción (verificado por fetch directo).
- El fallo restante: el `invoke.js` hace **XHR** (`connect-src`) y abre **iframes** (`frame-src`) contra dominios de Adsterra que NO estaban permitidos en esas dos directivas. Hipótesis 1 de este handoff **confirmada**.
- **Dominios reales extraídos del `invoke.js`** (no hizo falta esperar a soporte): `fizzyacerbitymellow.com` (peticiones de anuncios/píxeles), `protrafficinspector.com`, `cdn.cloudvideosa.com`. ⚠️ Adsterra los **rota sin avisar** — por eso el arreglo replica el comodín `*.com`/`*.net` en vez de fiarlo todo a dominios explícitos.

**Arreglo aplicado** (commit `2206929` en `main`, pusheado 09/06): `connect-src` y `frame-src` en `next.config.js` ahora incluyen los dominios explícitos de Adsterra + `https://*.com https://*.net` (mismo criterio que Carlos asumió en `script-src`). El push a `main` dispara un **build nuevo** en Vercel (no un redeploy), así que el cambio de `next.config.js` sí se aplica.

**Cómo verificar que quedó bien:** abrir la web → Network → recargar → filtrar por Adsterra → confirmar que `invoke.js` (y los demás recursos de Adsterra) **ya no** salen como `blocked:csp`. Si salta un dominio NUEVO bloqueado, ese es el siguiente que falta en la CSP. También: `Invoke-WebRequest -Uri https://zonamundial.app -Method Head` y comprobar que la cabecera `Content-Security-Policy` incluye `fizzyacerbitymellow.com` en `connect-src` (señal de que el build nuevo ya está servido).

---

## 6. Avisos importantes para quien continúe

- **Seguridad:** permitir `effectivecpmnetwork.com` (y demás dominios de Adsterra) en la CSP les da permiso para ejecutar **JavaScript arbitrario** en el sitio y sobre los usuarios. Adsterra conlleva **riesgo de malvertising**. Es una decisión de negocio consciente del dueño (Carlos la asume).
- **Bloqueabilidad:** el dominio de Adsterra está en listas de adblockers/Brave/DNS de filtrado. Un porcentaje de visitantes nunca verá el banner aunque la CSP esté perfecta. Es el peaje conocido de Adsterra como puente.
- **Solo Native Banner:** decisión tomada — NO usar Popunder, Social Bar ni Smartlink (intrusivos, dañan UX/credibilidad y exigen abrir aún más la CSP).
- ~~El árbol de trabajo está MUY sucio~~ → **Ya no (09/06 noche):** la rama actual es `main`, el árbol quedó limpio (los ~114 archivos se commitearon/mergearon vía PRs #19/#20 y commits de auditoría). Sigue aplicando: commitear con **rutas explícitas**, varios agentes comparten `main`, nunca force-push.
- **Nota:** el commit `2206929` arrastró también `MIS-CAMBIOS.md` (estaba en staging de antes; es solo documentación de un PR anterior, inocuo).
- **Seguridad de la CSP actual:** con `*.com`/`*.net` en `script-src`, `connect-src` y `frame-src`, la CSP ya casi no protege contra XSS. Es el precio de Adsterra + rotación de dominios. Cuando termine el puente de monetización (post-Mundial), endurecer: quitar comodines y restaurar listas explícitas.
- **Fuente de verdad de actividad:** Adsterra → **STATISTICS → Today → Impressions** (no la pestaña "Websites", que solo muestra estado).

---

## 7. Tareas pendientes

- [x] ~~Pedir a Adsterra la lista de dominios~~ → innecesario: dominios extraídos directamente del `invoke.js` (`fizzyacerbitymellow.com`, `protrafficinspector.com`, `cdn.cloudvideosa.com`) + comodín por la rotación.
- [x] Aplicar esos dominios en `next.config.js` (`connect-src` + `frame-src`) y desplegar a **`main`** con build nuevo → commit `2206929`, pusheado 09/06.
- [ ] Verificar tras el build de Vercel que la cabecera CSP de producción incluye los dominios nuevos y que en Network ya no hay `blocked:csp`.
- [ ] Probar en dispositivo limpio (móvil con datos, sin antivirus/adblocker). **Humano.**
- [ ] Confirmar impresiones reales en STATISTICS → Today. **Humano.**
- [ ] KYC / documentación de cobro en Adsterra (acción del dueño). **Humano.**
