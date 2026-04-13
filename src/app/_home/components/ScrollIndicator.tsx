"use client";

import { useLanguage } from "@/i18n/LanguageContext";

export function ScrollIndicator() {
  const { t } = useLanguage();

  const handleClick = () => {
    const el = document.getElementById("stats-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 hover:text-[#C9A84C] transition-colors group"
      aria-label={t.home?.scrollIndicator || "Scroll to explore"}
    >
      <span className="text-[11px] font-semibold tracking-widest uppercase opacity-70 group-hover:opacity-100 transition-opacity">
        {t.home?.scrollIndicator || "Descubre más"}
      </span>
      <div className="w-6 h-10 rounded-full border-2 border-current flex justify-center p-1">
        <div className="w-1 h-2 bg-current rounded-full animate-bounce" />
      </div>
    </button>
  );
}
