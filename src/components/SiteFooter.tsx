"use client";

import Link from "next/link";
import styles from "./SiteFooter.module.css";

/* Social icons */
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17 2h-3a5 5 0 0 0-5 5v3H6v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" />
  </svg>
);
const IconTikTok = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.321 5.562a5.122 5.122 0 0 1-3.414-1.267 5.124 5.124 0 0 1-1.537-2.723h-3.061v13.08a3.18 3.18 0 1 1-3.18-3.18c.13 0 .258.009.383.025v-3.12a6.273 6.273 0 0 0-.383-.012 6.292 6.292 0 1 0 6.292 6.293V8.973a8.212 8.212 0 0 0 4.9 1.58v-3.06a5.165 5.165 0 0 1 0-1.931z" />
  </svg>
);
const IconGlobe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
  </svg>
);

/* =============== Data =============== */

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/zona.mundial", Icon: IconInstagram },
  { label: "Facebook", href: "https://www.facebook.com/share/1Ay733gLRU/", Icon: IconFacebook },
  { label: "TikTok", href: "https://www.tiktok.com/@zonamundialfutbol", Icon: IconTikTok },
];

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Torneo",
    links: [
      { label: "48 Selecciones", href: "/selecciones" },
      { label: "12 Grupos", href: "/grupos" },
      { label: "16 Sedes", href: "/sedes" },
      { label: "Calendario", href: "/calendario" },
      { label: "Historia", href: "/historia" },
    ],
  },
  {
    title: "Plataforma",
    links: [
      { label: "Predicciones", href: "/app/predicciones" },
      { label: "Fantasy", href: "/app/fantasy" },
      { label: "IA Coach", href: "/app/ia-coach" },
      { label: "Trivia", href: "/app/trivia" },
      { label: "Modo Carrera", href: "/app/modo-carrera" },
      { label: "Premium", href: "/premium" },
    ],
  },
  {
    title: "Comunidad",
    links: [
      { label: "Noticias", href: "/noticias" },
      { label: "Blog", href: "/blog" },
      { label: "Tutoriales", href: "/tutoriales" },
      { label: "Creadores", href: "/creadores" },
      { label: "Ligas Privadas", href: "/app/ligas" },
      { label: "Rankings", href: "/app/rankings" },
      { label: "Streaming", href: "/app/streaming" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Aviso Legal", href: "/legal/aviso-legal" },
      { label: "Términos de uso", href: "/legal/terminos" },
      { label: "Privacidad", href: "/legal/privacidad" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "EULA", href: "/legal/eula" },
      { label: "Contacto", href: "mailto:business.dev@sprintmarkt.com" },
    ],
  },
];

/* =============== Component =============== */

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          {/* Brand column */}
          <div className={styles.brand}>
            <Link href="/" className={styles.brandLogo}>
              <span className={styles.brandLogoWhite}>ZONA</span>
              <span className={styles.brandLogoGold}>MUNDIAL</span>
            </Link>
            <p className={styles.brandTag}>
              Predicciones, fantasy y engagement en español para la Copa del Mundo 2026.
            </p>

            <div className={styles.socials}>
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`ZonaMundial en ${s.label}`}
                  className={styles.social}
                >
                  <s.Icon />
                </a>
              ))}
            </div>

            <p className={styles.poweredBy}>
              Powered by{" "}
              <a href="https://sprintmarkt.com" target="_blank" rel="noopener noreferrer">
                Sprintmarkt
              </a>
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className={styles.colTitle}>{col.title}</h4>
              <ul className={styles.colList}>
                {col.links.map((l) => {
                  const isExternal = l.href.startsWith("http") || l.href.startsWith("mailto:");
                  return (
                    <li key={l.href}>
                      {isExternal ? (
                        <a
                          href={l.href}
                          className={styles.colLink}
                          target={l.href.startsWith("http") ? "_blank" : undefined}
                          rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        >
                          {l.label}
                        </a>
                      ) : (
                        <Link href={l.href} className={styles.colLink}>
                          {l.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom legal strip */}
        <div className={styles.bottom}>
          <span className={styles.bottomItem}>
            <span className={styles.bottomIcon}>
              <IconGlobe />
            </span>
            © 2026 Sprintmarkt · Valencia, España
          </span>
          <span className={styles.bottomItem}>
            Plataforma de predicciones gratuita. No implica apuesta monetaria.
          </span>
        </div>
      </div>
    </footer>
  );
}
