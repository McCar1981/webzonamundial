// src/app/app/stories/feed/page.tsx
//
// Visor funcional de Stories (rebanada vertical inicial del módulo). Vive bajo
// el grupo /app (noindex,follow por su layout) y NO toca el landing promocional
// de /app/stories. La lógica real está en el cliente <StoryViewer/>.

import Link from "next/link";
import StoryViewer from "@/components/stories/StoryViewer";

const NAVY = "#0a1729";
const GOLD = "#c9a84c";

export const metadata = {
  title: "Stories — ZonaMundial",
};

export default function StoriesFeedPage() {
  return (
    <main style={{ minHeight: "100vh", background: NAVY, color: "#fff", padding: "16px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <Link href="/app/stories" style={{ color: GOLD, textDecoration: "none", fontSize: 14 }}>
          ← Stories
        </Link>
      </header>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "8px 0 4px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Stories en vivo</h1>
        <Link
          href="/app/stories/crear"
          style={{ padding: "8px 14px", borderRadius: 999, background: GOLD, color: NAVY, fontWeight: 800, fontSize: 13, textDecoration: "none" }}
        >
          + Crear
        </Link>
      </div>
      <p style={{ color: "#8a94b0", fontSize: 14, marginBottom: 8 }}>
        Toca una burbuja para abrir el visor.
      </p>
      <StoryViewer />
    </main>
  );
}
