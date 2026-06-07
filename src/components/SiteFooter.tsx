"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeSections } from "@/i18n/home-sections";
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
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconStripe = () => (
  <svg viewBox="0 0 60 25" fill="currentColor" aria-label="Stripe" role="img">
    <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.02-13.17 4.02-.86v3.54h3.14V9.4h-3.16v5.95zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z" />
  </svg>
);

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/zona.mundial", Icon: IconInstagram },
  { label: "Facebook", href: "https://www.facebook.com/share/1Ay733gLRU/", Icon: IconFacebook },
  { label: "TikTok", href: "https://www.tiktok.com/@zonamundialfutbol", Icon: IconTikTok },
];

export function SiteFooter() {
  const { locale } = useLanguage();
  const t = homeSections[locale].footer;
  const tSocial = homeSections[locale].socialDock;

  const columns = [t.columns.torneo, t.columns.plataforma, t.columns.comunidad, t.columns.legal];

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
            <p className={styles.brandTag}>{t.tag}</p>

            <div className={styles.socials}>
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${tSocial.on} ${s.label}`}
                  className={styles.social}
                >
                  <s.Icon />
                </a>
              ))}
            </div>

            <p className={styles.poweredBy}>
              {t.poweredBy}{" "}
              <a
                href="https://sprintmarkt.com/es/"
                target="_blank"
                rel="noopener"
                title="SprintMarkt — Agencia digital en Valencia"
              >
                Sprintmarkt
              </a>
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
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
            {t.copyrightParts.prefix}
            <a
              href="https://sprintmarkt.com/es/"
              target="_blank"
              rel="noopener"
              title="SprintMarkt — Agencia digital en Valencia"
            >
              {t.copyrightParts.brand}
            </a>
            {t.copyrightParts.suffix}
          </span>
          <span className={styles.securePay}>
            <span className={styles.securePayLock}>
              <IconLock />
            </span>
            {t.securePayment}
            <span className={styles.stripeMark}>
              <IconStripe />
            </span>
          </span>
          <span className={styles.bottomItem}>{t.disclaimer}</span>
        </div>
      </div>
    </footer>
  );
}
