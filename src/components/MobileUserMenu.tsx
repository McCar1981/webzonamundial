"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const BG = "#060B14";
const DARK = "#4a5570";

interface ProfileMini {
  username: string | null;
  avatar_url: string | null;
  onboarded_at: string | null;
}

/*
  MobileUserMenu

  Versión del HeaderUserMenu para el overlay mobile. Mismas piezas
  pero adaptadas a un layout vertical: ocupa todo el ancho, usa
  tipografías más grandes, y aparece dentro del menú hamburguesa.

  Props:
    onNavigate — callback que cierra el menú móvil al pulsar cualquier
                 link (consistente con el resto del menú).
    fallbackCtaLabel / fallbackCtaHint — labels del CTA cuando no hay
                                          sesión (i18n del padre).
*/
export default function MobileUserMenu({
  onNavigate,
  fallbackCtaLabel,
  fallbackCtaHint,
}: {
  onNavigate: () => void;
  fallbackCtaLabel: string;
  fallbackCtaHint: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileMini | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);

  const supabase = (() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!supabase) {
      setSupabaseAvailable(false);
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) fetchProfile(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function fetchProfile(userId: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from("profiles")
      .select("username,avatar_url,onboarded_at")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data);
  }

  async function handleSignOut() {
    onNavigate();
    await fetch("/auth/signout", { method: "POST" });
    router.refresh();
  }

  if (loading) {
    return null; // no mostrar nada hasta resolver sesión
  }

  // Sin Supabase configurado → solo CTA viejo
  if (!supabaseAvailable) {
    return (
      <div style={{ marginTop: 8, textAlign: "center" }}>
        <Link
          href="/registro"
          onClick={onNavigate}
          style={{
            display: "block",
            width: "100%",
            padding: "14px 0",
            borderRadius: 14,
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG,
            fontWeight: 700,
            fontSize: 16,
            textDecoration: "none",
          }}
        >
          {fallbackCtaLabel}
        </Link>
        <p style={{ fontSize: 12, color: DARK, marginTop: 10 }}>
          {fallbackCtaHint}
        </p>
      </div>
    );
  }

  // No logueado → "Iniciar sesión" + CTA pre-registro
  if (!user) {
    return (
      <div style={{ marginTop: 8 }}>
        <Link
          href="/login"
          onClick={onNavigate}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "14px 0",
            borderRadius: 14,
            border: `1px solid rgba(201,168,76,0.3)`,
            background: "transparent",
            color: GOLD,
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
            marginBottom: 12,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          onClick={onNavigate}
          style={{
            display: "block",
            width: "100%",
            padding: "14px 0",
            borderRadius: 14,
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG,
            fontWeight: 700,
            fontSize: 16,
            textDecoration: "none",
            textAlign: "center",
          }}
        >
          {fallbackCtaLabel}
        </Link>
        <p style={{ fontSize: 12, color: DARK, marginTop: 10, textAlign: "center" }}>
          {fallbackCtaHint}
        </p>
      </div>
    );
  }

  // Logueado → tarjeta de perfil + items
  const initial = (profile?.username || user.email || "?").charAt(0).toUpperCase();
  const needsOnboarding = !profile?.onboarded_at;

  return (
    <div style={{ marginTop: 8 }}>
      {/* Card de perfil */}
      <div
        style={{
          padding: 14,
          borderRadius: 14,
          border: "1px solid rgba(201,168,76,0.2)",
          background:
            "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.02))",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: profile?.avatar_url
              ? `url(${profile.avatar_url}) center/cover no-repeat`
              : `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG,
            fontWeight: 800,
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            flexShrink: 0,
          }}
        >
          {!profile?.avatar_url && initial}
          {needsOnboarding && (
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#ef4444",
                border: `2px solid ${BG}`,
              }}
            />
          )}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {profile?.username || user.email?.split("@")[0]}
          </div>
          <div
            style={{
              color: "#6a7a9a",
              fontSize: 11,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.email}
          </div>
        </div>
      </div>

      {/* Items */}
      {needsOnboarding && (
        <Link
          href="/onboarding"
          onClick={onNavigate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(201,168,76,0.06)",
            color: GOLD,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            marginBottom: 8,
          }}
        >
          <span>✨</span>
          Completa tu perfil
        </Link>
      )}

      <Link
        href="/cuenta"
        onClick={onNavigate}
        style={mobileItemStyle}
      >
        Mi cuenta
      </Link>
      <Link
        href="/cuenta/preferencias"
        onClick={onNavigate}
        style={mobileItemStyle}
      >
        Preferencias
      </Link>

      <button
        onClick={handleSignOut}
        style={{
          ...mobileItemStyle,
          width: "100%",
          background: "transparent",
          border: "1px solid rgba(239,68,68,0.2)",
          color: "#ef4444",
          cursor: "pointer",
          fontFamily: "inherit",
          marginTop: 8,
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}

const mobileItemStyle: React.CSSProperties = {
  display: "block",
  padding: "12px 14px",
  borderRadius: 12,
  color: "#fff",
  fontSize: 14,
  fontWeight: 500,
  textDecoration: "none",
  background: "rgba(15,29,50,0.5)",
  border: "1px solid rgba(255,255,255,0.04)",
  marginBottom: 6,
  textAlign: "left" as const,
};
