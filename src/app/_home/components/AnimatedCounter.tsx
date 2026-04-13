export function AnimatedCounter({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center group cursor-default">
      <div className="text-3xl sm:text-4xl font-black text-[#C9A84C] mb-1 group-hover:scale-110 transition-transform duration-300">
        <span className="stat-number" data-value={value}>0</span>
      </div>
      <div className="text-xs sm:text-sm text-gray-400 font-medium">{label}</div>
    </div>
  );
}
