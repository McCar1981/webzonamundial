import { NextRequest, NextResponse } from 'next/server';
import { addRegistro, getCount } from '@/lib/registros-store';
import { sendWelcomeEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RegistroBody {
  email: string;
  nombre: string;
  creador?: string;
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

  const { email, nombre, creador } = body || ({} as RegistroBody);

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

  const result = await addRegistro({
    email,
    nombre,
    creador,
    ip: getClientIp(request),
    kind: 'full',
  });

  if ('error' in result) {
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

  // Success: send welcome email without blocking the response.
  void sendWelcomeEmail(email.toLowerCase().trim(), nombre.trim());

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
