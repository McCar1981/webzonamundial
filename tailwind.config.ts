import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ZonaMundial Brand Colors
        zm: {
          bg: "#060B14",           // Main background
          surface: "#0F1D32",      // Support background 1
          surface2: "#0B1825",     // Support background 2
          gold: "#c9a84c",         // Gold accent
          "gold-light": "#e8d48b", // Gold hover
          "gold-dark": "#a88a3d",  // Gold pressed
          text: "#E2E8F0",         // Primary text
          "text-muted": "#94A3B8", // Secondary text
          border: "#1E293B",       // Borders
        },
      },
      fontFamily: {
        outfit: ["Outfit", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern": "linear-gradient(135deg, #060B14 0%, #0F1D32 50%, #0B1825 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.6s ease-out",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(201, 168, 76, 0.4)" },
          "50%": { boxShadow: "0 0 0 10px rgba(201, 168, 76, 0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
