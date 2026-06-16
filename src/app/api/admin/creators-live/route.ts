// /api/admin/creators-live — disparador MANUAL solo-admin del push
// "creador en directo" para CUALQUIER creador (no solo los de Twitch).
//
// Por qué existe: el cron /api/cron/poll-creators-live solo detecta directos
// vía la Twitch Helix API, así que solo avisa de SVGiago / Elopi23. Los
// creadores grandes que emiten en YouTube (José Cobo), TikTok (Niku) o
// Instagram (Nereita) nunca disparan el aviso automático. Este endpoint deja
// que un admin lo lance a mano cuando ve que uno de ellos está en directo.
//
// Seguridad / diseño (mínimo y reutilizando lo existente):
//   - MISMA auth que el resto de /api/admin: cookie zm_admin firmada. El
//     middleware ya protege /api/admin/*, y revalidamos aquí (defensa en
//     profundidad, igual que /api/admin/push/send).
//   - MISMA ruta de envío que el directo de Twitch: broadcastPush({ kind:
//     "creators", ... }) con la MISMA forma de payload (tag por creador, icon,
//     url al perfil interno). NO se crea infraestructura de push nueva ni se
//     integra ninguna API externa de YouTube/TikTok/Instagram.
//   - DRY-RUN POR DEFECTO: sin confirm:true NO se envía nada; solo devuelve a
//     cuántos dispositivos llegaría (mismo cálculo que el envío real). Igual
//     que el patrón de /admin/push: enviar de verdad exige confirm:true.
//
// Body JSON:
//   { slug: string, confirm?: boolean, message?: string }
//   - slug:    id del creador (CREADORES[].slug). Acepta también { id }.
//   - confirm: true → envía de verdad. Ausente/false → dry-run.
//   - message: texto opcional para el cuerpo del push (máx 140). Si no, se
//     genera uno con la plataforma principal del creador.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import { broadcastPush, listSubscriptionsForKind } from "@/lib/push-notifications";
import { CREADORES, getCreadorBySlug } from "@/data/creadores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Categoría de audiencia: la MISMA que usa el aviso automático de Twitch.
const PUSH_KIND = "creators";

async function requireAdmin(): Promise<boolean> {
  const cookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return !!cookie && (await isValidAdminCookie(cookie));
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo no válido." }, { status: 400 });
  }

  const slug = String(body.slug ?? body.id ?? "").trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ error: "Falta el slug del creador." }, { status: 400 });
  }

  const creador = getCreadorBySlug(slug);
  if (!creador) {
    return NextResponse.json(
      {
        error: `Creador "${slug}" no encontrado.`,
        validSlugs: CREADORES.map((c) => c.slug),
      },
      { status: 404 },
    );
  }

  // Cuerpo del push: opcional del admin, o uno generado emoji-free con la
  // plataforma principal del creador (regla dura del CEO: sin emojis).
  const custom = String(body.message ?? "").trim();
  const title = `EN DIRECTO · ${creador.nombre}`;
  const fallback = `${creador.nombre} está transmitiendo ahora mismo${
    creador.plataformaPrincipal ? ` en ${creador.plataformaPrincipal}` : ""
  }.`;
  const text = (custom ? custom : fallback).slice(0, 140);

  // Payload con la MISMA forma que notifyLiveCreators (Twitch): tag por creador
  // para que el navegador reemplace un duplicado, icon = foto del creador, y
  // enlace al perfil interno /creadores/[slug].
  const payload = {
    title,
    body: text,
    url: `/creadores/${creador.slug}`,
    tag: `creator-live-${creador.slug}`,
    icon: creador.imagen,
    pushId: `manual-live-${creador.slug}-${Date.now()}`,
  };

  // DRY-RUN por defecto: sin confirm:true, solo contamos destinatarios.
  if (body.confirm !== true) {
    try {
      const subs = await listSubscriptionsForKind(PUSH_KIND);
      return NextResponse.json({
        ok: true,
        dryRun: true,
        creator: { slug: creador.slug, nombre: creador.nombre },
        kind: PUSH_KIND,
        recipients: subs.length,
        preview: { title: payload.title, body: payload.body, url: payload.url },
        note: "Dry-run: NO se ha enviado nada. Envía con confirm:true para disparar el push real.",
      });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }

  // Envío REAL: misma ruta que el directo automático de Twitch.
  try {
    const result = await broadcastPush({ kind: PUSH_KIND, payload });
    return NextResponse.json({
      ok: true,
      dryRun: false,
      creator: { slug: creador.slug, nombre: creador.nombre },
      kind: PUSH_KIND,
      ...result,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
