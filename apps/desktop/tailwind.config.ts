import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 20px 80px rgba(3, 169, 244, 0.14)"
      },
      backgroundImage: {
        aurora: "radial-gradient(circle at 20% 0%, rgba(34,211,238,0.18), transparent 24%), radial-gradient(circle at 80% 0%, rgba(192,132,252,0.16), transparent 30%)"
      }
    }
  },
  plugins: []
} satisfies Config;
