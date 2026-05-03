"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Translations } from "@/i18n/translations";
import PromoPopup from "@/components/PromoPopup";
import { SiteFooter } from "@/components/SiteFooter";
import { SocialDock } from "@/components/SocialDock";
import HeaderUserMenu from "@/components/HeaderUserMenu";
import MobileUserMenu from "@/components/MobileUserMenu";

const BG="#060B14",BG2="#0F1D32",BG3="#0B1825",GOLD="#c9a84c",GOLD2="#e8d48b",MID="#8a94b0",DIM="#6a7a9a",DARK="#4a5570";

function buildNav(t: Translations) {
  return [
    { id: "torneo", label: t.nav.torneo, items: [
      { id: "selecciones", label: t.nav.selecciones, href: "/selecciones" },
      { id: "grupos",      label: t.nav.grupos,      href: "/grupos" },
      { id: "sedes",       label: t.nav.sedes,        href: "/sedes" },
      { id: "calendario",  label: t.nav.calendario,   href: "/calendario" },
      { id: "historia",    label: t.nav.historia,     href: "/historia" },
      { id: "formato",     label: t.nav.formato,      href: "/formato" },
    ]},
    { id: "plataforma", label: t.nav.plataforma, items: [
      { id: "predicciones", label: t.nav.predicciones, href: "/app/predicciones" },
      { id: "fantasy",      label: t.nav.fantasy,      href: "/app/fantasy" },
      { id: "iaCoach",      label: t.nav.iaCoach,      href: "/app/ia-coach" },
      { id: "trivia",       label: t.nav.trivia,       href: "/app/trivia" },
      { id: "modoCarrera",  label: t.nav.modoCarrera,  href: "/app/modo-carrera" },
      { id: "ligas",        label: t.nav.ligas,        href: "/app/ligas" },
      { id: "streaming",    label: t.nav.streaming,    href: "/app/streaming" },
      { id: "album",        label: t.nav.album,        href: "/app/album" },
    ]},
    { id: "noticias",   label: t.nav.noticias,   href: "/noticias" },
    { id: "blog",       label: t.nav.blog,        href: "/blog" },
    { id: "tutoriales", label: t.nav.tutoriales,  href: "/tutoriales" },
    { id: "creadores",  label: t.nav.creadores,   href: "/creadores" },
    { id: "premium",    label: t.nav.premium,     href: "/premium" },
  ];
}

function buildFooterLinks(t: Translations) {
  return {
    [t.footer.torneo]: [
      { label: t.footer.selecciones, href: "/selecciones" },
      { label: t.footer.grupos,      href: "/grupos" },
      { label: t.footer.sedes,       href: "/sedes" },
      { label: t.footer.calendario,  href: "/calendario" },
      { label: t.footer.historia,    href: "/historia" },
    ],
    [t.footer.plataforma]: [
      { label: t.footer.predicciones, href: "/app/predicciones" },
      { label: t.footer.fantasy,       href: "/app/fantasy" },
      { label: t.footer.iaCoach,       href: "/app/ia-coach" },
      { label: t.footer.trivia,        href: "/app/trivia" },
      { label: t.footer.modoCarrera,   href: "/app/modo-carrera" },
      { label: t.footer.premium,       href: "/premium" },
    ],
    [t.footer.comunidad]: [
      { label: t.footer.noticias,   href: "/noticias" },
      { label: t.footer.blog,        href: "/blog" },
      { label: t.footer.tutoriales,  href: "/tutoriales" },
      { label: t.footer.creadores,   href: "/creadores" },
      { label: t.footer.ligas,       href: "/app/ligas" },
      { label: t.footer.rankings,    href: "/app/rankings" },
      { label: t.footer.streaming,   href: "/app/streaming" },
    ],
    [t.footer.legal]: [
      { label: t.footer.avisoLegal,  href: "/legal/aviso-legal" },
      { label: t.footer.terminos,    href: "/legal/terminos" },
      { label: t.footer.privacidad,  href: "/legal/privacidad" },
      { label: t.footer.cookies,     href: "/legal/cookies" },
      { label: t.footer.eula,        href: "/legal/eula" },
      { label: t.footer.contacto,    href: "/contacto" },
    ],
  };
}

function HamburgerIcon({ open }: { open: boolean }) {
  const bar = (top: number, rot?: string | null, op: number = 1) => ({
    position: "absolute" as const, left: 0, width: 22, height: 2,
    background: open ? GOLD : "#fff", borderRadius: 1,
    transition: "all 0.3s", top,
    transform: rot || "none", opacity: op,
  });
  return (
    <div style={{ width: 22, height: 16, position: "relative", cursor: "pointer" }}>
      <span style={bar(open ? 7 : 0, open ? "rotate(45deg)" : undefined)} />
      <span style={bar(7, open ? "translateX(-8px)" : undefined, open ? 0 : 1)} />
      <span style={bar(open ? 7 : 14, open ? "rotate(-45deg)" : undefined)} />
    </div>
  );
}

interface NavDropdownProps {
  label: string;
  items: { id: string; label: string; href: string }[];
  isMobile?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

function NavDropdown({ label, items, isMobile, expanded, onToggle, onNavigate }: NavDropdownProps) {
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <button onClick={onToggle} style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "16px 0", display: "flex", alignItems: "center",
          justifyContent: "space-between", fontFamily: "inherit", color: "#fff",
        }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>{label}</span>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none"
            style={{ transition: "transform 0.3s", transform: expanded ? "rotate(180deg)" : "none" }}>
            <path d="M1 1.5L6 6.5L11 1.5" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div style={{ maxHeight: expanded ? 400 : 0, overflow: "hidden", transition: "max-height 0.4s ease" }}>
          <div style={{ paddingBottom: 12, paddingLeft: 14 }}>
            {items.map(c => (
              <Link
                key={c.id}
                href={c.href}
                onClick={onNavigate}
                style={{ display: "block", padding: "9px 0", fontSize: 15, color: DIM, cursor: "pointer", fontWeight: 500, textDecoration: "none" }}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="nav-link" style={{
        background: "none", border: "none", cursor: "pointer",
        color: MID, fontSize: 14, fontWeight: 600, fontFamily: "inherit",
        display: "flex", alignItems: "center", gap: 4, padding: "6px 0",
        transition: "color 0.3s",
      }}
        onMouseEnter={e => e.currentTarget.style.color = GOLD}
        onMouseLeave={e => e.currentTarget.style.color = MID}
      >
        {label}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "none" }}>
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: -12, paddingTop: 8, zIndex: 100, minWidth: 200 }}>
          <div style={{
            background: BG2, border: "1px solid rgba(201,168,76,0.12)",
            borderRadius: 14, padding: "6px 0",
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          }}>
            {items.map(c => (
              <Link
                key={c.id}
                href={c.href}
                style={{
                  display: "block",
                  padding: "9px 18px", fontSize: 13, color: DIM, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(201,168,76,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = DIM; e.currentTarget.style.background = "transparent"; }}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LateralAds() {
  return (
    <>
      <div className="zm-pub-lat zm-pub-lat--izq">
        <img src="/img/imagenessilviu/rotulemos120x600.webp" alt="Publicidad Rotulemos — rótulos profesionales" loading="lazy" decoding="async" />
      </div>
      <div className="zm-pub-lat zm-pub-lat--der">
        <img src="/img/imagenessilviu/ChatGPT Image 8 abr 2026, 04_49_43 p.m..webp" alt="Publicidad Mr Cool Cat — cerveza artesanal" loading="lazy" decoding="async" />
      </div>
    </>
  );
}

function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div style={{
      display: "flex", alignItems: "center",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(201,168,76,0.15)",
      borderRadius: 8, overflow: "hidden",
      fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
    }}>
      <button
        onClick={() => setLocale("es")}
        title="Español"
        style={{
          background: locale === "es" ? `linear-gradient(135deg,${GOLD},${GOLD2})` : "transparent",
          color: locale === "es" ? BG : MID,
          border: "none", cursor: "pointer", padding: "5px 10px",
          fontFamily: "inherit", fontSize: 12, fontWeight: 700,
          transition: "all 0.2s",
        }}
      >
        ES
      </button>
      <button
        onClick={() => setLocale("en")}
        title="English"
        style={{
          background: locale === "en" ? `linear-gradient(135deg,${GOLD},${GOLD2})` : "transparent",
          color: locale === "en" ? BG : MID,
          border: "none", cursor: "pointer", padding: "5px 10px",
          fontFamily: "inherit", fontSize: 12, fontWeight: 700,
          transition: "all 0.2s",
        }}
      >
        EN
      </button>
    </div>
  );
}

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const NAV = buildNav(t);
  const FOOTER_LINKS = buildFooterLinks(t);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // set correct state on mount (SSR hydration fix)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div
      ref={containerRef}
      style={{
        background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* ═══ HEADER ═══ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 1000,
        background: scrolled
          ? "rgba(6,11,20,0.88)"
          : "linear-gradient(180deg, rgba(6,11,20,0.55) 0%, rgba(6,11,20,0.15) 70%, transparent 100%)",
        backdropFilter: scrolled ? "blur(18px) saturate(180%)" : "blur(6px)",
        WebkitBackdropFilter: scrolled ? "blur(18px) saturate(180%)" : "blur(6px)",
        borderBottom: scrolled ? "1px solid rgba(201,168,76,0.1)" : "1px solid transparent",
        boxShadow: scrolled ? "0 10px 40px -10px rgba(0,0,0,0.5)" : "none",
        transition: "background 0.35s ease, backdrop-filter 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease",
      }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 28px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textDecoration: "none", flexShrink: 0 }} onClick={closeMobile}>
            <img
              src="/img/zonamundial-images/imagenes/IMG-20260302-WA0016-removebg-preview.webp"
              alt="ZonaMundial Logo"
              style={{ width: 36, height: 36, objectFit: "contain" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontWeight: 900, fontSize: 20, color: "#fff", letterSpacing: -0.5 }}>ZONA</span>
              <span style={{ fontWeight: 900, fontSize: 20, color: GOLD, letterSpacing: -0.5 }}>MUNDIAL</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: 22 }} className="desktop-nav">
            {NAV.map(item =>
              item.items ? (
                <NavDropdown key={item.id} label={item.label} items={item.items} />
              ) : (
                <Link
                  key={item.id}
                  href={item.href || "/"}
                  style={{ fontSize: 14, fontWeight: 600, color: MID, cursor: "pointer", transition: "color 0.3s", padding: "6px 0", textDecoration: "none", whiteSpace: "nowrap" }}
                  onMouseEnter={e => e.currentTarget.style.color = GOLD}
                  onMouseLeave={e => e.currentTarget.style.color = MID}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            {/* Language toggle */}
            <div className="lang-toggle">
              <LanguageToggle />
            </div>

            {/* User menu (login / avatar+dropdown) — desktop solamente */}
            <div className="user-menu-desktop">
              <HeaderUserMenu fallbackCtaLabel={t.cta.register} />
            </div>

            {/* Hamburger mobile */}
            <button className="hamburger-btn" onClick={() => setMobileOpen(!mobileOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 8, alignItems: "center", justifyContent: "center" }}>
              <HamburgerIcon open={mobileOpen} />
            </button>
          </div>
        </div>
      </header>

      {/* ═══ MOBILE OVERLAY ═══ */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 99,
        background: "rgba(6,11,20,0.98)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        transition: "opacity 0.35s,visibility 0.35s",
        opacity: mobileOpen ? 1 : 0, visibility: mobileOpen ? "visible" : "hidden",
        paddingTop: 80, overflowY: "auto",
      }}>
        <nav style={{ maxWidth: 400, margin: "0 auto", padding: "20px 24px" }}>
          {NAV.map(item =>
            item.items ? (
              <NavDropdown
                key={item.id}
                label={item.label}
                items={item.items}
                isMobile
                expanded={expandedMobile === item.id}
                onToggle={() => setExpandedMobile(expandedMobile === item.id ? null : item.id)}
                onNavigate={closeMobile}
              />
            ) : (
              <div key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <Link
                  href={item.href || "/"}
                  style={{ display: "block", padding: "16px 0", fontWeight: 700, fontSize: 18, color: "#fff", cursor: "pointer", textDecoration: "none" }}
                  onClick={closeMobile}
                >
                  {item.label}
                </Link>
              </div>
            )
          )}
          <div style={{ marginTop: 20, paddingBottom: 16 }}>
            <LanguageToggle />
          </div>
          <MobileUserMenu
            onNavigate={closeMobile}
            fallbackCtaLabel={t.cta.registerFree}
            fallbackCtaHint={t.cta.registerHint}
          />
        </nav>
      </div>

      {/* ═══ LATERAL ADS — Desktop only, append directly to body to escape scroll container ═══ */}
      <LateralAds />

      {/* ═══ PROMO POPUP (global) ═══ */}
      <PromoPopup />

      {/* ═══ PAGE CONTENT ═══ */}
      <main>{children}</main>

      {/* ═══ FLOATING SOCIAL DOCK ═══ */}
      <SocialDock />

      {/* ═══ FOOTER ═══ */}
      <SiteFooter />

      {/* Responsive CSS */}
      <style>{`
        .desktop-nav { display: flex; }
        .cta-desktop { display: inline-flex; }
        .hamburger-btn { display: none; }
        .lang-toggle { display: flex; }
        .user-menu-desktop { display: flex; }
        .user-menu-mobile { display: none; }
        @media(max-width:768px) {
          .desktop-nav { display: none !important; }
          .cta-desktop { display: none !important; }
          .hamburger-btn { display: flex !important; }
          .lang-toggle { display: none !important; }
          .user-menu-desktop { display: none !important; }
          .user-menu-mobile { display: block !important; }
          .footer-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
}
