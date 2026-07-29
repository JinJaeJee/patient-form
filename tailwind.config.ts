import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "field-flash": {
          "0%": { backgroundColor: "rgb(219 234 254)" }, // blue-100
          "100%": { backgroundColor: "transparent" },
        },
      },
      animation: {
        "field-flash": "field-flash 1s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
