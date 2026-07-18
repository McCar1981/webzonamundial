"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface DropdownProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
}

/** Las opciones cuyo value empieza por "__header_" son encabezados de sección
 *  (p.ej. el país en el selector de sedes): se pintan como rótulo no
 *  interactivo, no como opción seleccionable. */
export function Dropdown({ label, value, options, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#6e6552]">
        {label}
      </span>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-xl border border-white/8 bg-[#0a0906] px-3 py-2 text-sm font-medium text-white transition-all hover:border-[#c9a84c]/30"
      >
        {selected?.icon && (
          <img src={selected.icon} alt="" width={20} height={14} className="h-3.5 w-5 rounded object-cover" />
        )}
        <span className="truncate">{selected?.label}</span>
        <svg
          className={`ml-auto h-4 w-4 text-[#6e6552] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0a0906] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
          {options.map((o) =>
            o.value.startsWith("__header_") ? (
              <div
                key={o.value}
                className="px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]/80"
              >
                {o.label}
              </div>
            ) : (
              <div
                key={o.value}
                role="option"
                aria-selected={value === o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-[#c9a84c]/10 ${
                  value === o.value ? "bg-[#c9a84c]/10 text-[#c9a84c]" : "text-white"
                }`}
              >
                {o.icon && (
                  <img src={o.icon} alt="" width={20} height={14} className="h-3.5 w-5 rounded object-cover" />
                )}
                <span className="truncate">{o.label}</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
