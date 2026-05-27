import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        chain: "#236C5F",
        proof: "#2F5EAA"
      }
    }
  }
};

export default config;
