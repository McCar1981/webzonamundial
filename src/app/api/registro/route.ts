import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

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
  try {
    const body = (await request.json()) as RegistroBody;
    const { email, nombre, creador } = body;

    // Validation
    if (!email || !nombre) {
      return NextResponse.json(
        { error: 'Email y nombre son obligatorios' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email no válido' },
        { status: 400 }
      );
    }

    if (nombre.length < 3 || nombre.length > 30) {
      return NextResponse.json(
        { error: 'El nombre debe tener entre 3 y 30 caracteres' },
        { status: 400 }
      );
    }

    const id = `zm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedNombre = nombre.trim();
    const fecha = new Date().toISOString();
    const ip = getClientIp(request);

    const insert = db.prepare(`
      INSERT INTO registros (id, email, nombre, creador, fecha, ip)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insert.run(id, normalizedEmail, normalizedNombre, creador || '', fecha, ip);

    // Enviar email de bienvenida sin bloquear la respuesta
    void sendWelcomeEmail(normalizedEmail, normalizedNombre);

    const total = (db.prepare('SELECT COUNT(*) as total FROM registros').get() as { total: number }).total;

    return NextResponse.json(
      {
        success: true,
        message: 'Registro completado',
        id,
        total,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en registro:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      const field = error.message.includes('email') ? 'email' : 'nombre de usuario';
      return NextResponse.json(
        { error: `Este ${field} ya está registrado` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET: count registrations (public stat)
export async function GET() {
  try {
    const row = db.prepare('SELECT COUNT(*) as total FROM registros').get() as { total: number } | undefined;
    return NextResponse.json({ total: row?.total ?? 0 });
  } catch (error) {
    console.error('Error al contar registros:', error);
    return NextResponse.json({ total: 0 });
  }
}
