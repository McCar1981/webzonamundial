"use client";

interface FilterBtnProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterBtn({ label, active, onClick }: FilterBtnProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "whitespace-nowrap rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all",
        "border-2",
        active
          ? "border-[#c9a84c]/40 bg-gradient-to-br from-[#c9a84c]/15 to-[#c9a84c]/5 text-[#c9a84c] shadow-[0_4px_16px_rgba(201,168,76,0.15)]"
          : "border-white/[0.06] bg-transparent text-[#6a7a9a] hover:border-white/15 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
