import { NextRequest, NextResponse } from 'next/server';
import { addRegistro, getCount } from '@/lib/registros-store';
import { sendWelcomeEmail, sendNewRegistrationNotification } from '@/lib/email';
import { subscribe } from '@/lib/email-subscriptions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RegistroBody {
  email: string;
  nombre: string;
  // Nombre real y apellido(s) — ahora obligatorios desde el form para
  // que la tabla auth.users de Supabase tenga `display_name` real en
  // vez de "-". Los recibe el endpoint pero no rompe si vienen vacíos
  // (registros viejos / fuente externa).
  first_name?: string;
  last_name?: string;
  full_name?: string;
  creador?: string;
  // País del usuario (ISO-3166 alpha-2 lowercase).
  country?: string | null;
  // Slug de la selección favorita (argentina, espana, brasil…).
  // Crítico para producto: la app móvil consume este campo via
  // /api/users/me/profile y activa notificaciones push exclusivas
  // de ese equipo cuando juega, anota, se publica plantilla, etc.
  fav_team?: string | null;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  let body: RegistroBody;
  try {
    body = (await request.json()) as RegistroBody;
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { email, nombre, first_name, last_name, full_name, creador, country, fav_team } = body || ({} as RegistroBody);

  if (!email || !nombre) {
    return NextResponse.json(
      { error: 'Email y nombre son obligatorios' },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Email no válido' }, { status: 400 });
  }

  if (nombre.length < 3 || nombre.length > 30) {
    return NextResponse.json(
      { error: 'El nombre debe tener entre 3 y 30 caracteres' },
      { status: 400 }
    );
  }

  if (/\s/.test(nombre)) {
    return NextResponse.json(
      { error: 'El nombre no puede contener espacios' },
      { status: 400 }
    );
  }

  // Validación country: ISO-3166 alpha-2 lowercase. Si viene mal, lo
  // tiramos sin error 400 (mejor pre-registro sin país que rechazado).
  let cleanCountry: string | null = null;
  if (typeof country === 'string' && /^[a-z]{2}$/.test(country.trim().toLowerCase())) {
    cleanCountry = country.trim().toLowerCase();
  }

  // Validación fav_team: solo letras, números, guiones (slug). Si viene
  // algo raro lo descartamos silenciosamente.
  let cleanFavTeam: string | null = null;
  if (typeof fav_team === 'string' && /^[a-z0-9-]{2,40}$/.test(fav_team.trim().toLowerCase())) {
    cleanFavTeam = fav_team.trim().toLowerCase();
  }

  // Sanitización de nombres: letras Unicode + espacios, apóstrofes y guiones.
  // Si llegan vacíos (clientes antiguos), no falla — los guarda como null.
  const nameRegex = /^[\p{L}][\p{L}\s'\-.]{1,49}$/u;
  const cleanFirstName =
    typeof first_name === 'string' && nameRegex.test(first_name.trim())
      ? first_name.trim().replace(/\s+/g, ' ')
      : null;
  const cleanLastName =
    typeof last_name === 'string' && nameRegex.test(last_name.trim())
      ? last_name.trim().replace(/\s+/g, ' ')
      : null;
  const cleanFullName =
    typeof full_name === 'string' && full_name.trim().length > 0
      ? full_name.trim().replace(/\s+/g, ' ').slice(0, 120)
      : cleanFirstName && cleanLastName
        ? `${cleanFirstName} ${cleanLastName}`
        : null;

  const result = await addRegistro({
    email,
    nombre,
    first_name: cleanFirstName,
    last_name: cleanLastName,
    full_name: cleanFullName,
    creador,
    country: cleanCountry,
    fav_team: cleanFavTeam,
    ip: getClientIp(request),
    kind: 'full',
  });

  if (result.ok === false) {
    if (result.error === 'email_taken') {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      );
    }
    if (result.error === 'nombre_taken') {
      return NextResponse.json(
        { error: 'Este nombre de usuario ya está registrado' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }

  // Success: send welcome email + internal notification without blocking
  // the response. Ambos son fire-and-forget — si Resend falla logueamos
  // y seguimos. NUNCA bloquear el flujo de registro al user por culpa
  // de emails secundarios.
  void sendWelcomeEmail(email.toLowerCase().trim(), nombre.trim());
  void sendNewRegistrationNotification({
    email: email.toLowerCase().trim(),
    username: nombre.trim(),
    firstName: cleanFirstName,
    lastName: cleanLastName,
    country: cleanCountry,
    favTeam: cleanFavTeam,
    favCreator: creador?.trim() || null,
  });

  // Auto-suscribir al digest diario de noticias. RGPD-compliant porque:
  //  1. Se menciona en el email de bienvenida y en /legal/privacidad.
  //  2. Cada digest lleva link visible de "Darse de baja" en el footer.
  //  3. El usuario puede gestionarlo en /cuenta/notificaciones.
  // Si subscribe() falla (KV down, DB pausada, etc.) no bloquea el registro.
  void subscribe({
    email: email.toLowerCase().trim(),
    kind: 'daily-digest',
    source: 'registro-auto',
  });

  return NextResponse.json(
    {
      success: true,
      message: 'Registro completado',
      id: result.id,
      total: result.total,
    },
    { status: 201 }
  );
}

// GET: public count used by the home/registro counters.
export async function GET() {
  const total = await getCount();
  return NextResponse.json({ total });
}
