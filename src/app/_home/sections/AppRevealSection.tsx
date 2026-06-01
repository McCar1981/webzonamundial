"use client";

/**
 * AppRevealSection — coming-soon teaser
 * - Stadium BG with gold confetti and ambient sparks
 * - Phone mockup with parallax tilt on mouse + breathing gold ring
 * - Animated loading bar inside the phone screen
 * - "MUY PRONTO" pill with rotating clock
 * - Notification card with bell ring animation
 * - 2 store buttons (App Store / Google Play) with hover sheen
 * - 3 feature pills with icon hover effects
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeSections } from "@/i18n/home-sections";
import styles from "./AppRevealSection.module.css";

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <rect x="9.2" y="10" width="5.6" height="5" rx="1" />
      <path d="M10.5 10V8.5a1.5 1.5 0 0 1 3 0V10" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.5 2.9 1-6.1L3.1 9.5l6.1-.9L12 3Z" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

const FEATURE_ICONS = [<ShieldIcon key="s" />, <StarIcon key="t" />, <PhoneIcon key="p" />];

export function AppRevealSection() {
  const { locale } = useLanguage();
  const t = homeSections[locale].appReveal;
  const sectionRef = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // IntersectionObserver to start animations only when in view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Phone parallax tilt on mouse move
  useEffect(() => {
    const el = sectionRef.current;
    const phone = phoneRef.current;
    if (!el || !phone) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width;
      const cy = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rx = (0.5 - cy) * 8; // -4..4deg
        const ry = (cx - 0.5) * 10; // -5..5deg
        phone.style.setProperty("--rx", `${rx}deg`);
        phone.style.setProperty("--ry", `${ry}deg`);
      });
    };
    const onLeave = () => {
      phone.style.setProperty("--rx", "0deg");
      phone.style.setProperty("--ry", "0deg");
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className={`${styles.section} ${visible ? styles.visible : ""}`} aria-label={t.pill}>
      {/* BG layers */}
      <div className={styles.bgStadium} aria-hidden />
      <div className={styles.bgVignette} aria-hidden />
      <div className={styles.confetti} aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={styles.flake} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <div className={styles.sparks} aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={styles.spark} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>

      <div className={styles.inner}>
        {/* LEFT: copy column */}
        <div className={styles.copyCol}>
          <span className={styles.pill}>
            <span className={styles.pillClock}><ClockIcon /></span>
            {t.pill}
          </span>

          <h2 className={styles.title}>
            {t.title}
            <br />
            <em className={styles.titleGold}>{t.titleGold}</em>
          </h2>

          <span className={styles.divider} aria-hidden />

          <p className={styles.subtitle}>{t.subtitle}</p>

          <div className={styles.notify}>
            <span className={styles.notifyIcon}><BellIcon /></span>
            <div className={styles.notifyText}>
              <strong>{t.notify.title}</strong>
              <span>{t.notify.desc}</span>
            </div>
          </div>

          <div className={styles.stores}>
            <Link href={t.cta.href} className={styles.installBtn} aria-label={t.cta.label}>
              <span className={styles.storeLogo}><PhoneIcon /></span>
              <span className={styles.installText}>{t.cta.label}</span>
              <span className={styles.installArrow}><ArrowIcon /></span>
              <span className={styles.storeShine} aria-hidden />
            </Link>
          </div>
        </div>

        {/* RIGHT: phone mockup */}
        <div className={styles.phoneCol}>
          <div ref={phoneRef} className={styles.phoneWrap}>
            <div className={styles.phoneRing} aria-hidden />
            <div className={styles.phoneGlow} aria-hidden />
            <div className={styles.phone}>
              <div className={styles.phoneNotch} aria-hidden />
              <div className={styles.phoneScreen}>
                <div className={styles.phoneLogo}>
                  <Image
                    src="/img/zonamundial-images/imagenes/IMG-20260302-WA0016-removebg-preview.webp"
                    alt={t.phoneLabel}
                    width={180}
                    height={180}
                    className={styles.phoneLogoImg}
                    priority={false}
                  />
                </div>
                <div className={styles.phoneBrand}>{t.phoneLabel}</div>
                <div className={styles.phoneLoading}>{t.phoneLoading}</div>
                <div className={styles.phoneBar} aria-hidden>
                  <span />
                </div>
              </div>
              <div className={styles.phoneBezelHi} aria-hidden />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM: feature strip */}
      <div className={styles.featureBox}>
        {t.features.map((f, i) => (
          <div key={f.title} className={styles.feature}>
            <span className={styles.featureIcon}>{FEATURE_ICONS[i]}</span>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
