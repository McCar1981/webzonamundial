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

export function Dropdown({ label, value, options, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#6a7a9a]">
        {label}
      </span>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-xl border border-white/8 bg-[#0B1825] px-3 py-2 text-sm font-medium text-white transition-all hover:border-[#c9a84c]/30"
      >
        {selected?.icon && (
          <img src={selected.icon} alt="" className="h-3.5 w-5 rounded object-cover" />
        )}
        <span className="truncate">{selected?.label}</span>
        <svg
          className={`ml-auto h-4 w-4 text-[#6a7a9a] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0B1825] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {options.map((o) => (
            <div
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-[#c9a84c]/10 ${
                value === o.value ? "bg-[#c9a84c]/10 text-[#c9a84c]" : "text-white"
              }`}
            >
              {o.icon && <img src={o.icon} alt="" className="h-3.5 w-5 rounded object-cover" />}
              <span className="truncate">{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
