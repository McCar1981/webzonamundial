import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { sendSponsorLeadNotification } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Solicitud de PATROCINIO entrante desde /patrocina. El lead se guarda en KV
// (best-effort, lista `patrocina:leads`) Y se notifica por email a Carlos. Mismo
// patrón anti-abuso que /api/registro (rate limit por IP, fail-closed).

interface LeadBody {
  empresa?: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  categoria?: string;
  paquete?: string;
  mensaje?: string;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

const RATE_LIMIT_WINDOW_S = 60;
const RATE_LIMIT_MAX = 5;

async function checkRateLimit(ip: string): Promise<boolean> {
  // Fail-closed: sin KV o error → bloquear (igual que /api/registro).
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return false;
  }
  try {
    const key = `patrocina:rate:${ip}`;
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, RATE_LIMIT_WINDOW_S);
    }
    return count <= RATE_LIMIT_MAX;
  } catch {
    return false;
  }
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let body: LeadBody;
  try {
    body = (await request.json()) as LeadBody;
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const empresa = clean(body.empresa, 120);
  const nombre = clean(body.nombre, 80);
  const email = clean(body.email, 160).toLowerCase();
  const telefono = clean(body.telefono, 40);
  const categoria = clean(body.categoria, 60);
  const paquete = clean(body.paquete, 60);
  const mensaje = clean(body.mensaje, 1000);

  if (!empresa || !nombre || !email) {
    return NextResponse.json(
      { error: 'Empresa, nombre y email son obligatorios' },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Email no válido' }, { status: 400 });
  }

  const lead = {
    empresa,
    nombre,
    email,
    telefono,
    categoria,
    paquete,
    mensaje,
    ip,
    ts: new Date().toISOString(),
  };

  // Guardado en KV (best-effort): no perdemos el lead aunque falle el email.
  try {
    await kv.lpush('patrocina:leads', JSON.stringify(lead));
  } catch (e) {
    console.error('[Patrocina] KV lpush falló:', e);
  }

  // Notificación interna a Carlos. Fire-and-forget: si SMTP falla, el lead ya
  // está en KV.
  void sendSponsorLeadNotification({
    empresa,
    nombre,
    email,
    telefono,
    categoria,
    paquete,
    mensaje,
  });

  return NextResponse.json(
    { success: true, message: 'Solicitud recibida' },
    { status: 201 }
  );
}
