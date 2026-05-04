"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DashboardStats } from "@/lib/registros-seed";
import styles from "./Registros.module.css";

interface RecentRecord {
  id: string;
  emailMasked: string;
  nombreCompleto: string;
  pais: string;
  paisNombre: string;
  fuente: string;
  fuenteLabel: string;
  fuenteType: string;
  createdAt: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  ES: "🇪🇸", MX: "🇲🇽", AR: "🇦🇷", CO: "🇨🇴", CL: "🇨🇱",
  PE: "🇵🇪", US: "🇺🇸", VE: "🇻🇪", UY: "🇺🇾", EC: "🇪🇨", GT: "🇬🇹",
};

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const d = Math.floor(hr / 24);
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

function fmtNumber(n: number): string {
  return n.toLocaleString("es-ES");
}

export default function RegistrosDashboard({
  stats,
  recent,
}: {
  stats: DashboardStats;
  recent: RecentRecord[];
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // Daily trend: chart bounds
  const trend = stats.dailyTrend;
  const maxCount = Math.max(...trend.map((d) => d.count), 1);

  async function handleSignOut() {
    setSigningOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function fmtDay(iso: string) {
    const [, m, d] = iso.split("-");
    const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
  }

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span style={{ color: "#fff" }}>ZONA</span>
          <span style={{ color: "#c9a84c", marginLeft: 4 }}>MUNDIAL</span>
          <span className={styles.adminBadge}>PANEL INTERNO</span>
        </div>
        <div className={styles.topbarRight}>
          <a
            href="/api/admin/registros/csv"
            className={styles.btnSecondary}
            download
          >
            📥 Exportar CSV
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className={styles.btnGhost}
          >
            {signingOut ? "Saliendo..." : "Cerrar sesión"}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Hero KPI */}
        <section className={styles.kpiHero}>
          <div className={styles.kpiHeroLabel}>Total pre-registrados</div>
          <div className={styles.kpiHeroValue}>{fmtNumber(stats.total)}</div>
          <div className={styles.kpiHeroSub}>
            Desde el lanzamiento (abril 2026)
          </div>
        </section>

        {/* KPI cards */}
        <section className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Hoy</div>
            <div className={styles.kpiValue}>{fmtNumber(stats.today)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Últimos 7 días</div>
            <div className={styles.kpiValue}>{fmtNumber(stats.thisWeek)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Este mes</div>
            <div className={styles.kpiValue}>{fmtNumber(stats.thisMonth)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Países</div>
            <div className={styles.kpiValue}>{stats.topCountries.length}</div>
          </div>
        </section>

        {/* Two-col row: trend + countries */}
        <section className={styles.twoCol}>
          {/* Daily trend */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>📈 Crecimiento diario</h2>
              <span className={styles.panelMeta}>
                Últimos {trend.length} días
              </span>
            </div>
            <div className={styles.trendChart}>
              {trend.map((d) => {
                const heightPct = (d.count / maxCount) * 100;
                return (
                  <div
                    key={d.day}
                    className={styles.trendBar}
                    style={{ height: `${heightPct}%` }}
                    title={`${fmtDay(d.day)}: ${d.count}`}
                  />
                );
              })}
            </div>
            <div className={styles.trendAxis}>
              <span>{fmtDay(trend[0]?.day || "")}</span>
              <span>{fmtDay(trend[Math.floor(trend.length / 2)]?.day || "")}</span>
              <span>{fmtDay(trend[trend.length - 1]?.day || "")}</span>
            </div>
          </div>

          {/* Country distribution */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>🌎 Por país</h2>
              <span className={styles.panelMeta}>
                {stats.topCountries.length} mercados activos
              </span>
            </div>
            <ul className={styles.distList}>
              {stats.topCountries.map((c) => (
                <li key={c.code} className={styles.distItem}>
                  <span className={styles.distFlag}>
                    {COUNTRY_FLAGS[c.code] || "🌐"}
                  </span>
                  <div className={styles.distInfo}>
                    <div className={styles.distLabel}>
                      <span>{c.name}</span>
                      <span className={styles.distCount}>
                        {fmtNumber(c.count)} <small>· {c.pct}%</small>
                      </span>
                    </div>
                    <div className={styles.distBar}>
                      <span style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Sources */}
        <section className={styles.panelFull}>
          <div className={styles.panelHeader}>
            <h2>🎯 Atribución por fuente</h2>
            <span className={styles.panelMeta}>
              Quién está atrayendo a los pre-registrados
            </span>
          </div>
          <div className={styles.sourcesGrid}>
            {stats.topSources.map((s) => {
              const max = stats.topSources[0].count;
              const heightPct = (s.count / max) * 100;
              const label = getLabelForSource(s.id);
              const isCreator = s.type === "Creador";
              return (
                <div key={s.id} className={styles.sourceCard}>
                  <div className={styles.sourceBar}>
                    <span
                      style={{
                        height: `${heightPct}%`,
                        background: isCreator
                          ? "linear-gradient(180deg, #c9a84c, #5b21b6)"
                          : "linear-gradient(180deg, #3b82f6, #1e3a8a)",
                      }}
                    />
                  </div>
                  <div className={styles.sourceLabel}>
                    <strong>{label}</strong>
                    <span>{s.type}</span>
                  </div>
                  <div className={styles.sourceCount}>
                    {fmtNumber(s.count)}
                    <small>{s.pct}%</small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent table */}
        <section className={styles.panelFull}>
          <div className={styles.panelHeader}>
            <h2>📋 Últimos 50 registros</h2>
            <span className={styles.panelMeta}>
              Emails parcialmente censurados (GDPR)
            </span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>País</th>
                  <th>Fuente</th>
                  <th>Cuándo</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <code className={styles.emailMono}>{r.emailMasked}</code>
                    </td>
                    <td>{r.nombreCompleto}</td>
                    <td>
                      <span className={styles.flagSmall}>
                        {COUNTRY_FLAGS[r.pais] || "🌐"}
                      </span>{" "}
                      {r.paisNombre}
                    </td>
                    <td>
                      <span
                        className={styles.sourcePill}
                        data-type={r.fuenteType.toLowerCase()}
                      >
                        {r.fuenteLabel}
                      </span>
                    </td>
                    <td className={styles.cellDim}>{fmtRelative(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className={styles.footer}>
          Datos agregados internos · zonamundial.app · Acceso restringido
        </footer>
      </main>
    </div>
  );
}

function getLabelForSource(id: string): string {
  const map: Record<string, string> = {
    josecobo: "José Cobo",
    svgiago: "SVGiago",
    pimpeano: "Pimpeano",
    nachocp: "Nacho CP",
    nereita: "Nereita",
    elopi23: "Elopi23",
    salvador: "Salvador",
    franbar: "Franbar",
    organic: "Orgánico",
    instagram: "Instagram",
    tiktok: "TikTok",
  };
  return map[id] || id;
}
