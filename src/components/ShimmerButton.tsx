"use client";

import { ReactNode } from "react";

interface ShimmerButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}

export function ShimmerButton({ children, className = "", onClick, href }: ShimmerButtonProps) {
  const baseClasses = `
    relative inline-flex items-center justify-center overflow-hidden rounded-xl
    px-8 py-3.5 font-bold text-sm transition-all duration-300
    hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(201,168,76,0.35)]
    active:scale-[0.98] shimmer-border
  `;

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      <span
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: "linear-gradient(135deg, #c9a84c, #e8d48b)",
        }}
      />
      <span
        className="absolute inset-[1px] rounded-[11px] pointer-events-none z-[1]"
        style={{ background: "#060B14" }}
      />
      <span className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none z-[2]"
        style={{
          background: "linear-gradient(135deg, #e8d48b, #c9a84c)",
        }}
      />
      <span className="absolute inset-0 rounded-xl shimmer-rotate pointer-events-none z-[3]"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, rgba(201,168,76,0.4) 60deg, rgba(232,212,139,0.8) 120deg, rgba(201,168,76,0.4) 180deg, transparent 240deg)`,
          maskImage: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMaskImage: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />
    </>
  );

  const textClass = "relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#c9a84c] to-[#e8d48b]";

  if (href) {
    return (
      <a href={href} className={`${baseClasses} ${className}`} onClick={onClick}>
        <span className={textClass}>{children}</span>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={`${baseClasses} ${className}`} onClick={onClick}>
      <span className={textClass}>{children}</span>
      {content}
    </button>
  );
}
