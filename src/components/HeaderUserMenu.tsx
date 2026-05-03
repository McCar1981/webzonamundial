"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const BG = "#060B14";
const MID = "#8a94b0";
const DIM = "#6a7a9a";

interface ProfileMini {
  username: string | null;
  avatar_url: string | null;
  onboarded_at: string | null;
}

/*
  HeaderUserMenu

  Pieza inteligente del header que decide qué mostrar:
  - Sin sesión   → botón "Iniciar sesión"
  - Con sesión   → avatar + dropdown (Mi cuenta, Cerrar sesión)

  Si las env vars de Supabase no están configuradas (ej. preview de
  rama sin connect), no rompe el render: vuelve al CTA viejo de
  pre-registro como fallback.
*/

export default function HeaderUserMenu({
  fallbackCtaLabel,
  fallbackCtaHref = "/registro",
}: {
  fallbackCtaLabel: string;
  fallbackCtaHref?: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileMini | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Try to instantiate Supabase. If env vars missing, skip auth UI.
  const supabase = (() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  })();

  // Detect session + subscribe to auth changes
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

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      // refetch profile when session changes
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch profile mini when user appears
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

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    // POST to /auth/signout for proper cookie cleanup
    await fetch("/auth/signout", { method: "POST" });
    router.refresh();
  }

  // ── Loading state — render nothing visible during initial check.
  if (loading) {
    return <div style={{ width: 120, height: 36 }} aria-hidden />;
  }

  // ── Fallback if Supabase not configured: original CTA
  if (!supabaseAvailable) {
    return (
      <Link
        href={fallbackCtaHref}
        className="cta-desktop"
        style={{
          padding: "8px 20px",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
          color: BG,
          fontWeight: 700,
          fontSize: 13,
          fontFamily: "inherit",
          transition: "all 0.3s",
          letterSpacing: 0.2,
          textDecoration: "none",
          display: "inline-flex",
          whiteSpace: "nowrap",
          alignItems: "center",
        }}
      >
        {fallbackCtaLabel}
      </Link>
    );
  }

  // ── Logged out: "Iniciar sesión" + CTA pre-registro
  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <Link
          href="/login"
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: `1px solid rgba(201,168,76,0.3)`,
            background: "transparent",
            color: GOLD,
            fontWeight: 600,
            fontSize: 13,
            fontFamily: "inherit",
            transition: "all 0.3s",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(201,168,76,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <svg
            width="14"
            height="14"
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
          href={fallbackCtaHref}
          className="cta-desktop"
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG,
            fontWeight: 700,
            fontSize: 13,
            fontFamily: "inherit",
            transition: "all 0.3s",
            letterSpacing: 0.2,
            textDecoration: "none",
            display: "inline-flex",
          }}
        >
          {fallbackCtaLabel}
        </Link>
      </div>
    );
  }

  // ── Logged in: avatar + dropdown
  const initial = (profile?.username || user.email || "?").charAt(0).toUpperCase();
  const needsOnboarding = !profile?.onboarded_at;

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px 4px 4px",
          borderRadius: 999,
          border: "1px solid rgba(201,168,76,0.2)",
          background: "rgba(201,168,76,0.05)",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)";
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: profile?.avatar_url
              ? `url(${profile.avatar_url}) center/cover no-repeat`
              : `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG,
            fontWeight: 800,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            flexShrink: 0,
          }}
          aria-hidden
        >
          {!profile?.avatar_url && initial}
          {needsOnboarding && (
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#ef4444",
                border: `2px solid ${BG}`,
              }}
              title="Completa tu perfil"
            />
          )}
        </span>
        <span
          style={{
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            maxWidth: 100,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {profile?.username || user.email?.split("@")[0]}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke={MID}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 220,
            background: "#0F1D32",
            border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: 12,
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            overflow: "hidden",
            zIndex: 1100,
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profile?.username || user.email?.split("@")[0]}
            </div>
            <div
              style={{
                color: DIM,
                fontSize: 11,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.email}
            </div>
          </div>

          {needsOnboarding && (
            <Link
              href="/onboarding"
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                color: GOLD,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                background: "rgba(201,168,76,0.06)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ fontSize: 14 }}>✨</span>
              Completa tu perfil
            </Link>
          )}

          <Link
            href="/cuenta"
            onClick={() => setOpen(false)}
            style={menuItemStyle}
          >
            Mi cuenta
          </Link>
          <Link
            href="/cuenta/preferencias"
            onClick={() => setOpen(false)}
            style={menuItemStyle}
          >
            Preferencias
          </Link>

          <button
            onClick={handleSignOut}
            style={{
              ...menuItemStyle,
              width: "100%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontFamily: "inherit",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              color: "#ef4444",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "block",
  padding: "10px 14px",
  color: "#fff",
  fontSize: 13,
  fontWeight: 500,
  textDecoration: "none",
  textAlign: "left",
  transition: "background 0.15s",
};
