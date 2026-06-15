"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createCodeAction, updateCodeAction, toggleCodeAction } from "./actions";

// Forma del código tal como llega del server (sin importar el módulo
// server-only). Coincide con CodeWithOwner de lib/signup-codes/store.ts.
interface CodeRow {
  code: string;
  label: string | null;
  owner_email: string | null;
  reward_new_user: number;
  reward_owner: number;
  active: boolean;
  max_uses: number | null;
  uses_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  codes: CodeRow[];
  siteUrl: string;
}

type Msg = { ok: boolean; text: string } | null;

const fieldCls =
  "w-full px-3 py-2 rounded-lg bg-[#0B1825] border border-white/10 text-white text-sm focus:border-[#C9A84C] focus:outline-none";
const labelCls = "block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1";

export default function CodigosManager({ codes, siteUrl }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const createRef = useRef<HTMLFormElement>(null);

  async function run(action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, fd: FormData, okText: string) {
    setPending(true);
    setMsg(null);
    const res = await action(fd);
    setPending(false);
    if (res.ok) {
      setMsg({ ok: true, text: okText });
      setEditing(null);
      createRef.current?.reset();
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.error || "Error" });
    }
  }

  function shareUrl(code: string) {
    return `${siteUrl}/registro-codigo/${code}`;
  }

  async function copyLink(code: string) {
    try {
      await navigator.clipboard.writeText(shareUrl(code));
      setCopied(code);
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500);
    } catch {
      /* clipboard no disponible */
    }
  }

  return (
    <div className="space-y-8">
      {msg && (
        <div
          className={`p-3 rounded-xl text-sm text-center border ${
            msg.ok
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* ── Alta de código ─────────────────────────────────────────────── */}
      <section className="p-5 sm:p-6 rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.02)" }}>
        <h2 className="text-lg font-bold mb-4">Nuevo código</h2>
        <form
          ref={createRef}
          action={(fd) => run(createCodeAction, fd, "Código creado.")}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div>
            <label className={labelCls}>Código</label>
            <input name="code" required placeholder="RADIO5" className={`${fieldCls} uppercase tracking-wider font-bold`} maxLength={32} />
          </div>
          <div>
            <label className={labelCls}>Nombre / canal</label>
            <input name="label" placeholder="Radio Marca" className={fieldCls} maxLength={80} />
          </div>
          <div>
            <label className={labelCls}>Email del dueño (opcional)</label>
            <input name="owner_email" type="email" placeholder="embajador@email.com" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Fútcoins al nuevo usuario</label>
            <input name="reward_new_user" type="number" min={0} max={100000} defaultValue={150} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Fútcoins al dueño</label>
            <input name="reward_owner" type="number" min={0} max={100000} defaultValue={75} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Tope de usos (vacío = ilimitado)</label>
            <input name="max_uses" type="number" min={1} placeholder="∞" className={fieldCls} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={labelCls}>Notas internas (opcional)</label>
            <input name="notes" placeholder="Campaña radio junio, contacto Juan…" className={fieldCls} maxLength={600} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" name="active" defaultChecked className="w-4 h-4 accent-[#C9A84C]" />
            Activo
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2.5 rounded-xl text-[#030712] font-bold text-sm disabled:opacity-50 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
            >
              {pending ? "Guardando…" : "Crear código"}
            </button>
          </div>
        </form>
      </section>

      {/* ── Lista de códigos ───────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold mb-4">Códigos ({codes.length})</h2>
        {codes.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay códigos. Crea el primero arriba.</p>
        ) : (
          <div className="space-y-3">
            {codes.map((c) => (
              <div key={c.code} className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-black tracking-widest text-white">{c.code}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.active ? "bg-emerald-500/15 text-emerald-300" : "bg-gray-500/15 text-gray-400"
                        }`}
                      >
                        {c.active ? "Activo" : "Inactivo"}
                      </span>
                      {c.label && <span className="text-sm text-gray-400">· {c.label}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Nuevo +{c.reward_new_user} FC · Dueño +{c.reward_owner} FC
                      {c.owner_email ? ` (${c.owner_email})` : " (sin dueño)"} · Usos {c.uses_count}
                      {c.max_uses != null ? ` / ${c.max_uses}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyLink(c.code)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/15 text-gray-200 hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors cursor-pointer"
                      title={shareUrl(c.code)}
                    >
                      {copied === c.code ? "Copiado" : "Copiar enlace"}
                    </button>
                    <button
                      onClick={() => setEditing((e) => (e === c.code ? null : c.code))}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/15 text-gray-200 hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors cursor-pointer"
                    >
                      {editing === c.code ? "Cerrar" : "Editar"}
                    </button>
                    <form action={(fd) => run(toggleCodeAction, fd, c.active ? "Código desactivado." : "Código activado.")}>
                      <input type="hidden" name="code" value={c.code} />
                      <input type="hidden" name="next_active" value={(!c.active).toString()} />
                      <button
                        type="submit"
                        disabled={pending}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/15 text-gray-200 hover:border-white/30 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {c.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </div>
                </div>

                {editing === c.code && (
                  <form
                    action={(fd) => run(updateCodeAction, fd, "Código actualizado.")}
                    className="p-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    <input type="hidden" name="code" value={c.code} />
                    <div>
                      <label className={labelCls}>Nombre / canal</label>
                      <input name="label" defaultValue={c.label ?? ""} className={fieldCls} maxLength={80} />
                    </div>
                    <div>
                      <label className={labelCls}>Email del dueño</label>
                      <input name="owner_email" type="email" defaultValue={c.owner_email ?? ""} className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Tope de usos</label>
                      <input name="max_uses" type="number" min={1} defaultValue={c.max_uses ?? ""} className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Fútcoins al nuevo usuario</label>
                      <input name="reward_new_user" type="number" min={0} max={100000} defaultValue={c.reward_new_user} className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Fútcoins al dueño</label>
                      <input name="reward_owner" type="number" min={0} max={100000} defaultValue={c.reward_owner} className={fieldCls} />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mt-6">
                      <input type="checkbox" name="active" defaultChecked={c.active} className="w-4 h-4 accent-[#C9A84C]" />
                      Activo
                    </label>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className={labelCls}>Notas internas</label>
                      <input name="notes" defaultValue={c.notes ?? ""} className={fieldCls} maxLength={600} />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <button
                        type="submit"
                        disabled={pending}
                        className="px-5 py-2.5 rounded-xl text-[#030712] font-bold text-sm disabled:opacity-50 cursor-pointer"
                        style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
                      >
                        {pending ? "Guardando…" : "Guardar cambios"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
