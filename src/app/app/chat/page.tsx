"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SvgIcon } from "@/components/icons";

gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

const FEATURES = [
  { icon: "micro-predicciones", title: "Reacciones en vivo", desc: "Envía reacciones rápidas para celebrar goles, paradas y jugadas polémicas." },
  { icon: "predicciones", title: "Predicciones compartidas", desc: "Comparte tu pronóstico en el chat antes de cada partido." },
  { icon: "ranking", title: "Rankings de la sala", desc: "Descubre quién es el más acertado dentro de cada chat." },
  { icon: "ia coach", title: "Spoiler-free", desc: "Modo seguidor: oculta resultados si llegaste tarde al partido." },
  { icon: "match center", title: "Moderación oficial", desc: "Moderadores en cada sala para mantener el respeto." },
];

const ROOMS = [
  { name: "Sala Argentina", users: "1.2k", flag: "ar" },
  { name: "Sala España", users: "980", flag: "es" },
  { name: "Sala México", users: "850", flag: "mx" },
  { name: "Sala Brasil", users: "1.5k", flag: "br" },
  { name: "Sala Colombia", users: "720", flag: "co" },
  { name: "Sala Global", users: "8.4k", flag: "un" },
];

export default function ChatPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline();
      heroTl.from("[data-hero-badge]", { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" })
            .from("[data-hero-title]", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.3")
            .from("[data-hero-desc]", { y: 30, opacity: 0, duration: 0.7, ease: "power2.out" }, "-=0.5")
            .from("[data-hero-cta]", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.4");

      gsap.from("[data-feat-card]", {
        scrollTrigger: { trigger: "[data-feats-grid]", start: "top 85%" },
        y: 50, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out"
      });

      gsap.from("[data-chat-ui]", {
        scrollTrigger: { trigger: "[data-chat-section]", start: "top 80%" },
        x: 60, opacity: 0, duration: 0.9, ease: "power3.out"
      });

      gsap.from("[data-room-card]", {
        scrollTrigger: { trigger: "[data-rooms-grid]", start: "top 85%" },
        y: 40, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power2.out"
      });

      gsap.from("[data-cta-content]", {
        scrollTrigger: { trigger: "[data-cta-section]", start: "top 80%" },
        y: 40, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out"
      });

      gsap.utils.toArray<HTMLElement>("[data-hover-card]").forEach((card) => {
        card.addEventListener("mouseenter", () => { gsap.to(card, { y: -8, duration: 0.3, ease: "power2.out" }); });
        card.addEventListener("mouseleave", () => { gsap.to(card, { y: 0, duration: 0.3, ease: "power2.out" }); });
      });

      gsap.utils.toArray<HTMLElement>("[data-hover-btn]").forEach((btn) => {
        btn.addEventListener("mouseenter", () => { gsap.to(btn, { scale: 1.05, duration: 0.2, ease: "power2.out" }); });
        btn.addEventListener("mouseleave", () => { gsap.to(btn, { scale: 1, duration: 0.2, ease: "power2.out" }); });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ padding: "20px 20px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(59,130,246,0.08) 0%,transparent 60%)" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <span data-hero-badge style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", display: "inline-block" }}>Comunidad</span>
          <h1 data-hero-title style={{ fontSize: "clamp(36px,7vw,56px)", fontWeight: 900, marginTop: 20, lineHeight: 1.1 }}>
            Chat por <span style={{ color: "#3b82f6" }}>Liga</span>
          </h1>
          <p data-hero-desc style={{ color: MID, marginTop: 24, maxWidth: 600, margin: "24px auto 0", lineHeight: 1.7, fontSize: 18 }}>
            Salas en tiempo real para cada partido. Habla con tu comunidad, celebra los goles y compite por ser el más acertado.
          </p>
          <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/registro" data-hero-cta data-hover-btn style={{
              padding: "16px 36px", borderRadius: 14,
              background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
              color: BG, fontWeight: 800, fontSize: 16, textDecoration: "none", display: "inline-block",
              boxShadow: "0 8px 32px rgba(201,168,76,0.3)"
            }}>
              Entrar al chat
            </Link>
            <span data-hero-cta style={{
              padding: "16px 28px", borderRadius: 14,
              background: BG2, border: "1px solid rgba(255,255,255,0.1)",
              color: MID, fontWeight: 600, fontSize: 14
            }}>
              Gratis con registro
            </span>
          </div>
        </div>
      </section>

      {/* Features + UI representativa */}
      <section data-chat-section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 40, alignItems: "center" }}>
            <div data-feats-grid>
              <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800, marginBottom: 24 }}>
                Todo lo que puedes <span style={{ color: "#3b82f6" }}>hacer</span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {FEATURES.map((f, i) => (
                  <div key={i} data-feat-card data-hover-card style={{
                    padding: 16, borderRadius: 12, background: BG2,
                    border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 14, alignItems: "center", cursor: "pointer"
                  }}>
                    <SvgIcon name={f.icon} size={32} style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{f.title}</div>
                      <div style={{ fontSize: 13, color: DIM }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div data-chat-ui style={{
              padding: 24, borderRadius: 20, background: BG2,
              border: "1px solid rgba(255,255,255,0.08)", maxWidth: 420, margin: "0 auto"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Sala Argentina vs Francia</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: DIM }}>2.4k online</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { user: "Messi10", text: "¡Vamos Argentina!", color: "#60a5fa", align: "left" },
                  { user: "LaScaloneta", text: "Gol de Messi en cualquier momento", color: "#f59e0b", align: "right" },
                  { user: "FanFootball", text: "Qué jugada de Di María", color: "#60a5fa", align: "left" },
                ].map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.align === "right" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    padding: "10px 14px", borderRadius: 12,
                    background: m.align === "right" ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${m.align === "right" ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.06)"}`
                  }}>
                    <div style={{ fontSize: 11, color: m.color, fontWeight: 700, marginBottom: 2 }}>{m.user}</div>
                    <div style={{ fontSize: 13 }}>{m.text}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8 }}>
                <div style={{ flex: 1, height: 36, borderRadius: 18, background: BG3, border: "1px solid rgba(255,255,255,0.06)" }} />
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke={BG} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Salas disponibles */}
      <section style={{ padding: "80px 20px", background: BG }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              Salas <span style={{ color: "#3b82f6" }}>disponibles</span>
            </h2>
            <p style={{ color: MID, marginTop: 12, fontSize: 16 }}>Únete a la de tu país o entra en la sala global</p>
          </div>
          <div data-rooms-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {ROOMS.map((r, i) => (
              <div key={i} data-room-card data-hover-card style={{
                padding: 18, borderRadius: 14, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer"
              }}>
                <img src={`https://flagcdn.com/w40/${r.flag}.png`} alt="" style={{ width: 32, height: 22, borderRadius: 3, objectFit: "cover" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "#22c55e" }}>{r.users} en línea</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-cta-section style={{ padding: "100px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(59,130,246,0.1) 0%, transparent 60%)" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
          <SvgIcon name="chat en vivo" size={72} style={{ marginBottom: 24 }} />
          <h2 data-cta-content style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, marginBottom: 16 }}>
            La fiesta está en el <span style={{ color: "#3b82f6" }}>chat</span>
          </h2>
          <p data-cta-content style={{ color: MID, marginBottom: 40, fontSize: 18, maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.6 }}>
            No mires los partidos solo. Entra a tu sala, reacciona en tiempo real y vive el Mundial con tu comunidad.
          </p>
          <Link href="/registro" data-cta-content data-hover-btn style={{
            padding: "18px 44px", borderRadius: 14,
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG, fontWeight: 800, fontSize: 18, textDecoration: "none", display: "inline-block",
            boxShadow: "0 8px 32px rgba(201,168,76,0.35)"
          }}>
            Crear cuenta gratis
          </Link>
        </div>
      </section>
    </div>
  );
}
