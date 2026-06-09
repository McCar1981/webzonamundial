// src/app/app/stories/crear/page.tsx
//
// Página para crear una Story propia (tipo cromo). Bajo el grupo /app
// (noindex,follow). No toca el landing promocional de /app/stories.

import Link from "next/link";
import StoryCreator from "@/components/stories/StoryCreator";

const NAVY = "#0a1729";
const GOLD = "#c9a84c";

export const metadata = {
  title: "Crear Story — ZonaMundial",
};

export default function CrearStoryPage() {
  return (
    <main style={{ minHeight: "100vh", background: NAVY, color: "#fff", overflowX: "hidden" }}>
      {/* Columna centrada tipo móvil: en escritorio NO se estira a todo el ancho. */}
      <div style={{ maxWidth: 440, margin: "0 auto", padding: 16, boxSizing: "border-box" }}>
        <header style={{ marginBottom: 12 }}>
          <Link href="/app" style={{ color: GOLD, textDecoration: "none", fontSize: 14 }}>
            ← Volver al inicio
          </Link>
        </header>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 16px" }}>Crear Story</h1>
        <StoryCreator />
      </div>
    </main>
  );
}
