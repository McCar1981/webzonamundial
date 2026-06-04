"use client";

// Tienda de cosméticos (mejora G: sumidero de monedas). Marcos de avatar,
// colores de nombre y títulos que se compran con Fútcoins y se lucen en rankings
// y ligas. No dan ventaja: son puro prestigio para dar salida a las monedas.
// Self-contained: consume /api/predictions/cosmetics. Solo iconos SVG.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Coins, Lock, Palette } from "lucide-react";

const BG2 = "#0F1D32", BG3 = "#0B1825";
const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a", GREEN = "#22c55e";
const CARD_BORDER = "1px solid rgba(255,255,255,0.07)";

type Kind = "frame" | "name_color" | "title";

interface Item {
  id: string; kind: Kind; name: string; description: string; cost: number; min_level: number;
  value: string; gradient?: string; glow?: string;
  owned: boolean; equipped: boolean; can_buy: boolean;
}
interface State {
  coins: number; level: number; items: Item[];
  equipped: { frame: string | null; name_color: string | null; title: string | null };
}

const KIND_LABEL: Record<Kind, string> = { frame: "Marcos de avatar", name_color: "Colores de nombre", title: "Títulos" };
const KIND_ORDER: Kind[] = ["frame", "name_color", "title"];

export default function Cosmetics() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/predictions/cosmetics");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (flash) { const id = setTimeout(() => setFlash(null), 3500); return () => clearTimeout(id); } }, [flash]);

  const post = useCallback(async (body: Record<string, unknown>, okMsg: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/predictions/cosmetics", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) { setFlash(okMsg); await load(); }
      else setFlash(
        j.error === "insufficient_coins" ? "Monedas insuficientes"
        : j.error === "level_required" ? "Necesitas más nivel"
        : j.error === "already_owned" ? "Ya lo tienes"
        : "No se pudo",
      );
    } finally { setBusy(false); }
  }, [load]);

  const grouped = useMemo(() => {
    const g: Record<Kind, Item[]> = { frame: [], name_color: [], title: [] };
    for (const it of data?.items ?? []) g[it.kind].push(it);
    return g;
  }, [data]);

  if (!data) return null;
  const ownedCount = data.items.filter((i) => i.owned).length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", textAlign: "left", cursor: "pointer", background: BG2,
          border: CARD_BORDER, borderRadius: 14, padding: "12px 14px", color: "inherit",
          display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <div style={{ fontSize: 11, color: DIM, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
            <Palette size={13} color={GOLD2} /> Cosméticos
          </div>
          <div style={{ fontWeight: 800, marginTop: 3, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            Personaliza tu perfil
            <span style={{ color: MID, fontSize: 12, fontWeight: 700 }}>{ownedCount}/{data.items.length} desbloqueados</span>
            <span style={{ color: GOLD2, fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Coins size={13} /> {data.coins}
            </span>
          </div>
          <div style={{ color: DIM, fontSize: 11, marginTop: 4 }}>
            Marcos, colores de nombre y títulos que se lucen en rankings y ligas.
          </div>
        </div>
        <span style={{ color: GOLD2, fontWeight: 800, fontSize: 13 }}>{open ? "Ocultar" : "Ver tienda"}</span>
      </button>

      {open && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 14 }}>
          {KIND_ORDER.map((kind) => (
            <div key={kind}>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: GOLD2, marginBottom: 8 }}>{KIND_LABEL[kind]}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
                {grouped[kind].map((it) => (
                  <CosmeticCard
                    key={it.id} item={it} coins={data.coins} busy={busy}
                    onBuy={() => post({ action: "buy", id: it.id }, `${it.name} comprado`)}
                    onEquip={() => post({ action: "equip", id: it.id }, `${it.name} equipado`)}
                    onUnequip={() => post({ action: "unequip", kind: it.kind }, "Quitado")}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {flash && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: BG2, border: `1px solid ${GOLD}`, color: GOLD2, borderRadius: 12, padding: "11px 18px", fontWeight: 700, fontSize: 13.5, zIndex: 50, boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
          {flash}
        </div>
      )}
    </div>
  );
}

function Preview({ item }: { item: Item }) {
  if (item.kind === "title") {
    return (
      <span style={{ fontSize: 11, fontWeight: 800, color: GOLD2, border: "1px solid rgba(232,212,139,0.35)", background: "rgba(232,212,139,0.08)", borderRadius: 99, padding: "2px 9px" }}>
        {item.value}
      </span>
    );
  }
  if (item.kind === "name_color") {
    const style = item.gradient
      ? { background: item.gradient, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" } as const
      : { color: item.value };
    return <span style={{ fontWeight: 900, fontSize: 15, ...style }}>TuNombre</span>;
  }
  // frame
  return (
    <span style={{ display: "inline-flex", borderRadius: 99, padding: 2, background: item.gradient ?? item.value, boxShadow: item.glow ? `0 0 12px ${item.glow}` : undefined }}>
      <span style={{ background: BG3, borderRadius: 99, width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: GOLD2, fontSize: 13 }}>1</span>
    </span>
  );
}

function CosmeticCard({ item, coins, busy, onBuy, onEquip, onUnequip }: {
  item: Item; coins: number; busy: boolean;
  onBuy: () => void; onEquip: () => void; onUnequip: () => void;
}) {
  const affordable = coins >= item.cost;
  const lockedByLevel = !item.owned && !item.can_buy;
  return (
    <div style={{ background: BG2, border: item.equipped ? `1px solid ${GREEN}` : CARD_BORDER, borderRadius: 12, padding: "11px 13px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 13.5 }}>{item.name}</span>
        <Preview item={item} />
      </div>
      <div style={{ color: MID, fontSize: 12, minHeight: 32 }}>{item.description}</div>

      {item.owned ? (
        item.equipped ? (
          <button
            onClick={onUnequip} disabled={busy}
            style={{ width: "100%", cursor: "pointer", background: "transparent", color: GREEN, border: `1px solid ${GREEN}`, borderRadius: 9, fontWeight: 800, fontSize: 13, padding: "8px 10px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}
          >
            <CheckCircle2 size={14} /> Equipado · quitar
          </button>
        ) : (
          <button
            onClick={onEquip} disabled={busy}
            style={{ width: "100%", cursor: "pointer", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#1a1206", border: CARD_BORDER, borderRadius: 9, fontWeight: 800, fontSize: 13, padding: "8px 10px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}
          >
            <Check size={14} /> Equipar
          </button>
        )
      ) : (
        <button
          onClick={onBuy} disabled={busy || !affordable || lockedByLevel}
          style={{
            width: "100%", cursor: affordable && !lockedByLevel ? "pointer" : "default",
            background: affordable && !lockedByLevel ? `linear-gradient(135deg,${GOLD},${GOLD2})` : BG3,
            color: affordable && !lockedByLevel ? "#1a1206" : DIM, border: CARD_BORDER, borderRadius: 9,
            fontWeight: 800, fontSize: 13, padding: "8px 10px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}
        >
          {lockedByLevel
            ? <><Lock size={13} /> Nivel {item.min_level}</>
            : <>Comprar · <Coins size={13} /> {item.cost}</>}
        </button>
      )}
    </div>
  );
}
