import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/*
  Waitlist endpoint — simple file-backed signup store.
  - GET  /api/waitlist    -> { count: number }
  - POST /api/waitlist    -> { ok: true, count: number } | { ok: false, error }

  Base count starts at 1247 (matches the launch mockup) and increments
  for every unique email that signs up. When you move to Supabase/Postgres
  later, only this file has to change.
*/

const STORE_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(STORE_DIR, "waitlist.json");
const BASE_COUNT = 1247;

type Store = {
  emails: string[];
  createdAt: string;
};

async function loadStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    return JSON.parse(raw) as Store;
  } catch {
    return { emails: [], createdAt: new Date().toISOString() };
  }
}

async function saveStore(store: Store) {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export async function GET() {
  const store = await loadStore();
  return NextResponse.json({ count: BASE_COUNT + store.emails.length });
}

export async function POST(req: NextRequest) {
  let body: { email?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ ok: false, error: "Email requerido" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
  }

  const store = await loadStore();

  if (store.emails.includes(email)) {
    return NextResponse.json({
      ok: true,
      alreadyRegistered: true,
      count: BASE_COUNT + store.emails.length,
    });
  }

  store.emails.push(email);
  await saveStore(store);

  return NextResponse.json({
    ok: true,
    alreadyRegistered: false,
    count: BASE_COUNT + store.emails.length,
  });
}
