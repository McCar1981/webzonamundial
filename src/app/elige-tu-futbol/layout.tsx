export const dynamic = "force-dynamic";

export const metadata = {
  title: "Elige tu fútbol · ZonaMundial",
  robots: { index: false, follow: false },
};

/*
  /elige-tu-futbol — GATE obligatorio: el usuario elige liga(s) + club antes de
  entrar al lobby /app. Vive FUERA de /app para que el gate del layout de /app
  no lo intercepte (sin bucle). Las guardas de acceso (invitado → /login,
  ya-eligió → /app) viven en page.tsx porque necesitan leer searchParams para el
  modo ?preview=1 (view-only para diseño/demo). Este layout solo aporta chrome.
*/
export default function EligeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)", filter: "blur(80px)" }}
        />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">{children}</div>
    </div>
  );
}
