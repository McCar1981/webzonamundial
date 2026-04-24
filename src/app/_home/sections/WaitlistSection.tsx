"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CREADORES } from "@/data/creadores";
import styles from "./WaitlistSection.module.css";

/* ====================== Icons ====================== */

const IconEnvelope = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l2.9 7.5L22 10l-5.5 5L18 22l-6-3.5L6 22l1.5-7L2 10l7.1-.5L12 2z" />
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14m-7-7 7 7-7 7" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12 5 5L20 7" />
  </svg>
);

/* Benefit icons (illustrated) */
const IconLock = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="wl-lock-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F5D07A" />
        <stop offset="100%" stopColor="#B8913F" />
      </linearGradient>
    </defs>
    <path d="M14 20v-4a10 10 0 0 1 20 0v4" fill="none" stroke="url(#wl-lock-g)" strokeWidth="3" strokeLinecap="round" />
    <rect x="10" y="20" width="28" height="22" rx="3" fill="#0F2A44" stroke="url(#wl-lock-g)" strokeWidth="1.5" />
    <rect x="12" y="22" width="24" height="18" rx="2" fill="url(#wl-lock-g)" opacity="0.15" />
    <circle cx="24" cy="30" r="3" fill="url(#wl-lock-g)" />
    <rect x="23" y="30" width="2" height="6" fill="url(#wl-lock-g)" />
  </svg>
);

const IconGift = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="wl-gift-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4FA0C2" />
        <stop offset="100%" stopColor="#2E86AB" />
      </linearGradient>
    </defs>
    <rect x="8" y="18" width="32" height="8" rx="1" fill="url(#wl-gift-g)" stroke="#0F2A44" strokeWidth="1" />
    <rect x="10" y="26" width="28" height="18" rx="2" fill="url(#wl-gift-g)" stroke="#0F2A44" strokeWidth="1" />
    <rect x="21" y="18" width="6" height="26" fill="#F5D07A" stroke="#8B6A2E" strokeWidth="0.8" />
    <path d="M18 14c-2-4 1-7 4-5s2 9 2 9-6 0-6-4zM30 14c2-4-1-7-4-5s-2 9-2 9 6 0 6-4z" fill="#F5D07A" stroke="#8B6A2E" strokeWidth="0.8" />
  </svg>
);

const IconTrophy = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="wl-tro-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFF1C4" />
        <stop offset="50%" stopColor="#D4A853" />
        <stop offset="100%" stopColor="#8B6A2E" />
      </linearGradient>
    </defs>
    <path d="M14 8h20l-1 16c0 4-4 7-9 7s-9-3-9-7z" fill="url(#wl-tro-g)" stroke="#6B4E1A" strokeWidth="1" />
    <path d="M14 10c-4 0-6 2-6 6s3 8 6 8M34 10c4 0 6 2 6 6s-3 8-6 8" fill="none" stroke="url(#wl-tro-g)" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 14l2 5 5 1-4 3.5 1 5-4-2.5-4 2.5 1-5L12 20l5-1z" fill="#0F2A44" stroke="#F5D07A" strokeWidth="0.5" />
    <rect x="21" y="31" width="6" height="5" fill="#8B6A2E" />
    <rect x="14" y="36" width="20" height="4" rx="1" fill="url(#wl-tro-g)" stroke="#6B4E1A" strokeWidth="1" />
  </svg>
);

/* Strip icons */
const StarGold = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 7.5L22 10l-5.5 5L18 22l-6-3.5L6 22l1.5-7L2 10l7.1-.5L12 2z" /></svg>
);
const BoltGold = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" /></svg>
);
const TrendingUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m3 17 6-6 4 4 8-8M14 7h7v7" />
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M11 18h2" />
  </svg>
);

/* ====================== Data ====================== */

const BENEFITS = [
  { Icon: IconLock, title: "Acceso anticipado a la app" },
  { Icon: IconGift, title: "Beneficios exclusivos" },
  { Icon: IconTrophy, title: "Compite desde el día uno" },
];

const STRIP_ITEMS = [
  { Icon: StarGold, text: "La IA acertó 3\nresultados seguidos" },
  { Icon: BoltGold, text: "El fantasy\nes adictivo" },
  { Icon: TrendingUp, text: "Los creadores hacen\nque todo sea más épico" },
  { Icon: PhoneIcon, text: "Por fin una app que\nentiende de fútbol" },
  { Icon: StarGold, text: "El fantasy\nes adictivo" },
  { Icon: BoltGold, text: "La IA acertó 3\nresultados seguidos" },
];

const SPARKS = [
  { left: "5%", top: "10%", dur: "12s", delay: "0s", kind: "dash" },
  { left: "15%", top: "40%", dur: "16s", delay: "3s", kind: "sq" },
  { left: "28%", top: "18%", dur: "14s", delay: "1.5s", kind: "dot" },
  { left: "42%", top: "75%", dur: "13s", delay: "4s", kind: "sq" },
  { left: "55%", top: "25%", dur: "15s", delay: "2.5s", kind: "dot" },
  { left: "68%", top: "55%", dur: "18s", delay: "5s", kind: "dash" },
  { left: "80%", top: "12%", dur: "14s", delay: "0.5s", kind: "sq" },
  { left: "92%", top: "48%", dur: "16s", delay: "6s", kind: "dot" },
  { left: "35%", top: "85%", dur: "13s", delay: "2s", kind: "dash" },
  { left: "60%", top: "5%", dur: "17s", delay: "7s", kind: "dot" },
];

/* ====================== Hooks ====================== */

/** Counter animated from 0 to target with easeOutCubic when visible. */
function useAnimatedCounter(target: number, duration = 1600) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const from = prevTarget.current;
    const to = target;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prevTarget.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

/* ====================== Component ====================== */

export function WaitlistSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // Counter state (fetched from /api/waitlist on mount + after signup)
  const [targetCount, setTargetCount] = useState(1247);
  const displayedCount = useAnimatedCounter(targetCount);
  const [counterReady, setCounterReady] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  /* Fetch initial count only when section enters viewport */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let cancelled = false;
    const obs = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || counterReady) return;
        try {
          const res = await fetch("/api/waitlist", { cache: "no-store" });
          const data = await res.json();
          if (!cancelled && typeof data?.count === "number") {
            setTargetCount(data.count);
          }
        } catch {
          /* ignore, keep fallback */
        } finally {
          if (!cancelled) setCounterReady(true);
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => {
      cancelled = true;
      obs.disconnect();
    };
  }, [counterReady]);

  /* Cursor glow tracking */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
        raf = 0;
      });
    };
    el.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMsg(data?.error || "No se pudo guardar. Intenta de nuevo.");
        return;
      }
      if (typeof data.count === "number") setTargetCount(data.count);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Error de red. Intenta de nuevo.");
    }
  }

  // First 3 creators as avatars shown next to the counter
  const avatars = CREADORES.slice(0, 3);

  return (
    <section ref={sectionRef} className={styles.section} id="waitlist">
      <div className={styles.cursorGlow} aria-hidden="true" />
      <div className={styles.sparks} aria-hidden="true">
        {SPARKS.map((s, i) => (
          <span
            key={i}
            className={`${styles.spark} ${
              s.kind === "sq" ? styles.sparkSquare : s.kind === "dot" ? styles.sparkDot : ""
            }`}
            style={{
              left: s.left,
              top: s.top,
              ["--dur" as string]: s.dur,
              ["--delay" as string]: s.delay,
            }}
          />
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.grid}>
          {/* LEFT */}
          <div className={styles.left}>
            <div className={styles.pill}>
              <span className={styles.pillIcon}>
                <IconStar />
              </span>
              Lista de espera
            </div>

            <h2 className={styles.title}>
              Sé de los
              <span className={styles.titleGold}>primeros.</span>
            </h2>

            <p className={styles.desc}>
              La app llega pronto. Tu lugar está{" "}
              <span className={styles.descBold}>reservado</span> si lo reclamas ahora.
            </p>

            <div className={styles.benefits}>
              {BENEFITS.map((b) => (
                <div key={b.title} className={styles.benefit}>
                  <span className={styles.benefitIconWrap}>
                    <b.Icon />
                  </span>
                  <p className={styles.benefitTitle}>{b.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className={styles.right}>
            <div className={styles.mailBadge} aria-hidden="true">
              <IconEnvelope />
            </div>

            <div className={styles.formBox}>
              {status === "success" ? (
                <div className={styles.successMsg} role="status" aria-live="polite">
                  <div className={styles.successIcon}>
                    <IconCheck />
                  </div>
                  <h3>¡Estás dentro!</h3>
                  <p>
                    Tu lugar en la lista está reservado. Te avisaremos por email en cuanto la
                    app esté disponible.
                  </p>
                  <div className={styles.counter} style={{ marginTop: 22 }}>
                    <div className={styles.counterAvatars}>
                      {avatars.map((c, i) => (
                        <div key={c.slug} className={styles.counterAvatar}>
                          <img src={c.imagen} alt="" loading="lazy" decoding="async" />
                        </div>
                      ))}
                    </div>
                    <span className={styles.counterText}>
                      <span className={styles.counterNum}>
                        {displayedCount.toLocaleString("es-ES")}
                      </span>
                      personas ya están dentro
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate>
                  <div className={styles.formHead}>
                    <p className={styles.formTitle}>
                      Únete a la lista y asegura tu lugar
                    </p>
                  </div>

                  <div className={styles.emailField}>
                    <span className={styles.emailIcon}>
                      <IconEnvelope />
                    </span>
                    <input
                      type="email"
                      className={styles.emailInput}
                      placeholder="Tu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={status === "loading"}
                      autoComplete="email"
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={status === "loading" || !email}
                  >
                    {status === "loading" ? "Reservando..." : "Unirme a la lista"}
                    {status !== "loading" && <IconArrowRight />}
                  </button>

                  {status === "error" && (
                    <p className={styles.errorMsg} role="alert">
                      {errorMsg}
                    </p>
                  )}

                  <div className={styles.assurance}>
                    <span className={styles.assuranceIcon}>
                      <IconShield />
                    </span>
                    Sin spam. Sin compromiso. Solo fútbol.
                  </div>

                  <div className={styles.counter}>
                    <div className={styles.counterAvatars}>
                      {avatars.map((c) => (
                        <div key={c.slug} className={styles.counterAvatar}>
                          <img src={c.imagen} alt="" loading="lazy" decoding="async" />
                        </div>
                      ))}
                    </div>
                    <span className={styles.counterText}>
                      <span className={styles.counterNum}>
                        {displayedCount.toLocaleString("es-ES")}
                      </span>
                      personas delante de ti
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className={styles.strip}>
          {STRIP_ITEMS.map((s, i) => (
            <div key={i} className={styles.stripItem}>
              <span className={styles.stripIconWrap}>
                <s.Icon />
              </span>
              <span style={{ whiteSpace: "pre-line" }}>{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
