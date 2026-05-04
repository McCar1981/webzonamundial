"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const resp = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, next: nextPath }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setError(data.error === "wrong password" ? "Contraseña incorrecta" : "Error de acceso");
        setBusy(false);
        return;
      }
      const data = await resp.json();
      router.push(data.next || nextPath);
      router.refresh();
    } catch (err) {
      setError("Error de red");
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(ellipse at top, #1a1130 0%, #0F1D32 50%, #060B14 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#fff",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "rgba(15, 29, 50, 0.9)",
          border: "1px solid rgba(201, 168, 76, 0.15)",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 24px 60px -16px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              fontFamily: "var(--zm-font-outfit), system-ui, sans-serif",
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: 1.2,
              color: "#fff",
            }}
          >
            ZONA<span style={{ color: "#c9a84c", marginLeft: 4 }}>MUNDIAL</span>
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#c9a84c",
              fontWeight: 700,
              marginTop: 6,
            }}
          >
            Acceso interno
          </div>
        </div>

        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: 0.4,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
          htmlFor="zm-admin-pwd"
        >
          Contraseña
        </label>
        <input
          id="zm-admin-pwd"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
          autoFocus
          required
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: error
              ? "1px solid rgba(239,68,68,0.6)"
              : "1px solid rgba(201, 168, 76, 0.3)",
            background: "rgba(6,11,20,0.6)",
            color: "#fff",
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {error && (
          <div
            style={{
              marginTop: 10,
              color: "#ef4444",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !password}
          style={{
            marginTop: 18,
            width: "100%",
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            background: busy
              ? "rgba(201,168,76,0.4)"
              : "linear-gradient(135deg, #c9a84c, #e8d48b)",
            color: "#060B14",
            fontWeight: 800,
            fontSize: 14,
            cursor: busy ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            letterSpacing: 0.3,
            transition: "transform 0.15s",
          }}
        >
          {busy ? "Verificando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
