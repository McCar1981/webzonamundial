"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "./actions";

interface CountryOption {
  code: string;
  name: string;
}
interface SeleccionOption {
  slug: string;
  nombre: string;
  flagCode: string;
}
interface CreadorOption {
  slug: string;
  nombre: string;
  imagen: string;
  plataformaPrincipal: string;
}

interface InitialValues {
  username: string;
  country: string;
  fav_team: string;
  fav_creator: string;
  locale: "es" | "en";
  birth_date: string;
}

export default function ProfileForm({
  email,
  initial,
  countries,
  selecciones,
  creadores,
}: {
  email: string;
  initial: InitialValues;
  countries: CountryOption[];
  selecciones: SeleccionOption[];
  creadores: CreadorOption[];
}) {
  const [values, setValues] = useState<InitialValues>(initial);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "ok" | "error";
    msg: string;
  } | null>(null);

  function handleChange<K extends keyof InitialValues>(key: K, value: InitialValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setFeedback(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const fd = new FormData();
    fd.set("username", values.username);
    fd.set("country", values.country);
    fd.set("fav_team", values.fav_team);
    fd.set("fav_creator", values.fav_creator);
    fd.set("locale", values.locale);
    fd.set("birth_date", values.birth_date);

    startTransition(async () => {
      const res = await updateProfileAction(fd);
      if (res.ok) {
        setFeedback({ type: "ok", msg: "Cambios guardados" });
      } else {
        setFeedback({ type: "error", msg: res.error ?? "Error" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email (readonly) */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Email
        </label>
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-3 rounded-xl bg-[#0B1825]/60 border border-[#1E293B] text-gray-300 text-sm cursor-not-allowed"
          />
          <span className="text-[10px] text-gray-500 whitespace-nowrap">
            Cambia en Seguridad
          </span>
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Nombre de usuario
        </label>
        <input
          type="text"
          value={values.username}
          onChange={(e) => handleChange("username", e.target.value)}
          maxLength={30}
          className="w-full px-4 py-3 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/40 transition-all"
          placeholder="tunombre"
        />
        <p className="text-[11px] text-gray-500 mt-1">
          3-30 caracteres. Solo letras minúsculas, números y guion bajo.
        </p>
      </div>

      {/* Grid 2 cols */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* País */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            País
          </label>
          <select
            value={values.country}
            onChange={(e) => handleChange("country", e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/40"
          >
            <option value="">— Selecciona país —</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Idioma */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Idioma preferido
          </label>
          <div className="flex gap-2">
            {(["es", "en"] as const).map((lang) => {
              const active = values.locale === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleChange("locale", lang)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all border"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, #C9A84C, #A8893D)"
                      : "transparent",
                    color: active ? "#030712" : "#cbd5e1",
                    borderColor: active ? "#C9A84C" : "#1E293B",
                  }}
                >
                  {lang === "es" ? "Español" : "English"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fecha nacimiento */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            value={values.birth_date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => handleChange("birth_date", e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/40"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Solo se usa para premios con restricción de edad.
          </p>
        </div>

        {/* Equipo favorito */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Selección favorita
          </label>
          <select
            value={values.fav_team}
            onChange={(e) => handleChange("fav_team", e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/40"
          >
            <option value="">— Sin selección favorita —</option>
            {selecciones.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Creador favorito */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Creador favorito
        </label>
        <p className="text-[11px] text-gray-500 mb-3">
          Te uniremos a su comunidad. Puedes cambiarlo cuando quieras.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleChange("fav_creator", "")}
            className="p-3 rounded-xl border text-left transition-all"
            style={{
              background: values.fav_creator === ""
                ? "rgba(201,168,76,0.1)"
                : "rgba(11,24,37,0.5)",
              borderColor: values.fav_creator === ""
                ? "#C9A84C"
                : "#1E293B",
            }}
          >
            <div className="text-xs font-bold text-white">Ninguno</div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              Sin creador asignado
            </div>
          </button>
          {creadores.map((c) => {
            const active = values.fav_creator === c.slug;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => handleChange("fav_creator", c.slug)}
                className="p-3 rounded-xl border text-left transition-all flex items-center gap-3"
                style={{
                  background: active
                    ? "rgba(201,168,76,0.1)"
                    : "rgba(11,24,37,0.5)",
                  borderColor: active ? "#C9A84C" : "#1E293B",
                }}
              >
                <span
                  className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden border"
                  style={{ borderColor: active ? "#C9A84C" : "#1E293B" }}
                >
                  <img
                    src={c.imagen}
                    alt={c.nombre}
                    className="w-full h-full object-cover"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-white truncate">
                    {c.nombre}
                  </span>
                  <span className="block text-[10px] text-gray-500 truncate">
                    {c.plataformaPrincipal}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback + submit */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1E293B]/40">
        <div className="text-sm">
          {feedback?.type === "ok" && (
            <span className="text-green-400">✓ {feedback.msg}</span>
          )}
          {feedback?.type === "error" && (
            <span className="text-red-400">✗ {feedback.msg}</span>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-3 rounded-xl text-[#030712] font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-[#C9A84C]/25"
          style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
