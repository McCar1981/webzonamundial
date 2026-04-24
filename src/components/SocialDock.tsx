"use client";

import styles from "./SocialDock.module.css";

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

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/zona.mundial",
    Icon: IconInstagram,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1Ay733gLRU/",
    Icon: IconFacebook,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@zonamundialfutbol",
    Icon: IconTikTok,
  },
];

export function SocialDock() {
  return (
    <aside className={styles.dock} aria-label="Redes sociales de ZonaMundial">
      <span className={styles.eyebrow} aria-hidden="true">
        SÍGUENOS
      </span>
      <span className={styles.line} aria-hidden="true" />
      {SOCIALS.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`ZonaMundial en ${s.label}`}
          className={styles.btn}
        >
          <s.Icon />
          <span className={styles.label}>{s.label}</span>
        </a>
      ))}
      <span className={styles.line} aria-hidden="true" />
    </aside>
  );
}
