export function GlobalStyles() {
  return (
    <style jsx global>{`
      @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 12px rgba(212, 175, 55, 0.3); } 50% { box-shadow: 0 0 24px rgba(212, 175, 55, 0.6); } }

      .animate-fade-in { animation: fade-in 0.9s ease-out; }
      .animate-slide-up { animation: slide-up 0.9s ease-out; }
      .animate-gradient-shift { background-size: 200% 200%; animation: gradient-shift 3s ease-in-out infinite; }

      * { scroll-behavior: smooth; }
      body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

      @media (prefers-reduced-motion: reduce) {
        * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
      }

      .gradient-radial {
        background: radial-gradient(var(--tw-gradient-stops));
      }
    `}</style>
  );
}
