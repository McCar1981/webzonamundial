'use client';

// FlagSelect — dropdown con bandera + nombre, con buscador integrado.
// Reemplaza a <select> nativo cuando queremos mostrar imágenes (las
// banderas) junto a cada opción.
//
// UX:
//   - Click en el campo abre el panel
//   - Filtro por texto al teclear (search instantáneo)
//   - Click fuera o ESC cierra
//   - Flechas arriba/abajo navegan, Enter selecciona
//   - Mobile-friendly: el panel se expande a toda la anchura del campo
//
// Por qué no <select> nativo: <option> NO admite imágenes ni HTML en
// ningún navegador. Las banderas tienen que ir en un dropdown custom.

import { useEffect, useRef, useState, useMemo } from 'react';

export interface FlagSelectOption {
  value: string;          // valor guardado al seleccionar (slug, ISO code, etc.)
  label: string;          // texto principal mostrado
  sublabel?: string;      // texto secundario (ej. "Grupo H")
  flagCode: string;       // código para la URL de la bandera (flagcdn)
}

interface FlagSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FlagSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  iconLeftSlot?: React.ReactNode; // opcional, icono SVG al lado izquierdo
  ariaLabel?: string;
}

function flagUrl(code: string, size = 40): string {
  // flagcdn.com soporta códigos ISO-2 y los regionales tipo gb-eng / gb-sct.
  return `https://flagcdn.com/w${size}/${code.toLowerCase()}.png`;
}

export default function FlagSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = 'Buscar…',
  emptyMessage = 'Sin resultados',
  iconLeftSlot,
  ariaLabel,
}: FlagSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel ?? '').toLowerCase().includes(q),
    );
  }, [options, query]);

  // Cerrar al click fuera o ESC
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Foco al search al abrir
  useEffect(() => {
    if (open) {
      setActiveIdx(0);
      const t = setTimeout(() => searchRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Reset índice si el filtro cambia
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Scrollear opción activa a la vista cuando se navega con flechas
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const item = list.children[activeIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  const select = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIdx]) select(filtered[activeIdx].value);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger field (parece un <select> nativo, pero es <button>) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 transition-all cursor-pointer text-left flex items-center gap-3"
      >
        {iconLeftSlot && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {iconLeftSlot}
          </span>
        )}

        {selected ? (
          <span className="flex items-center gap-3 min-w-0 flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flagUrl(selected.flagCode, 40)}
              alt=""
              width={24}
              height={16}
              className="flex-shrink-0 rounded-sm border border-white/10"
              style={{ objectFit: 'cover' }}
            />
            <span className="truncate">
              {selected.label}
              {selected.sublabel && (
                <span className="text-gray-500 ml-1.5">· {selected.sublabel}</span>
              )}
            </span>
          </span>
        ) : (
          <span className="text-gray-500 flex-1">{placeholder}</span>
        )}

        <svg
          className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-xl bg-[#0B1825] border border-[#C9A84C]/30 shadow-2xl overflow-hidden"
          role="listbox"
        >
          {/* Buscador interno */}
          <div className="p-2 border-b border-[#1E293B]">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0F1D32] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Lista de opciones */}
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            <ul ref={listRef} className="max-h-72 overflow-y-auto py-1">
              {filtered.map((o, i) => {
                const isSelected = o.value === value;
                const isActive = i === activeIdx;
                return (
                  <li
                    key={o.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => select(o.value)}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
                        : isActive
                          ? 'bg-[#1E293B] text-white'
                          : 'text-gray-300 hover:bg-[#1E293B]/60'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={flagUrl(o.flagCode, 40)}
                      alt=""
                      width={24}
                      height={16}
                      className="flex-shrink-0 rounded-sm border border-white/10"
                      style={{ objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <span className="flex-1 truncate text-sm">
                      {o.label}
                      {o.sublabel && (
                        <span className="text-gray-500 ml-1.5 text-xs">· {o.sublabel}</span>
                      )}
                    </span>
                    {isSelected && (
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
