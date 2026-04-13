"use client";

export function SaulTicker({
  items,
  speed = 30,
  className = "",
  itemClassName = "",
}: {
  items: string[];
  speed?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={`relative overflow-hidden whitespace-nowrap ${className}`}>
      <div
        className="inline-flex"
        style={{
          animation: `ticker-scroll ${speed}s linear infinite`,
        }}
      >
        {[...items, ...items, ...items, ...items].map((text, i) => (
          <span
            key={i}
            className={`inline-flex items-center mx-6 ${itemClassName}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 mr-4" />
            {text}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
