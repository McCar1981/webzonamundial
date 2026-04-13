'use client';

import { useState } from 'react';

interface FAQItem {
  q: string;
  a: string;
}

interface Props {
  title: string;
  items: FAQItem[];
}

export function FAQAccordion({ title, items }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="rounded-3xl border border-white/5 bg-[#0B1825] p-5 sm:p-8">
      <h3 className="mb-6 text-xl sm:text-2xl font-black text-white">{title}</h3>
      <div className="space-y-3">
        {items.map((item, idx) => {
          const isOpen = open === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-colors ${isOpen ? 'border-[#c9a84c]/30 bg-[#060B14]' : 'border-white/5 bg-[#060B14] hover:border-white/10'}`}
            >
              <button
                onClick={() => setOpen(isOpen ? null : idx)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left"
              >
                <span className="text-sm font-bold text-white sm:text-base">{item.q}</span>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#c9a84c]/30 text-xs text-[#c9a84c] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                  ▼
                </span>
              </button>
              <div
                className="overflow-hidden transition-all"
                style={{ maxHeight: isOpen ? 200 : 0, opacity: isOpen ? 1 : 0 }}
              >
                <p className="px-4 pb-4 text-sm leading-relaxed text-[#8a94b0]">{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
