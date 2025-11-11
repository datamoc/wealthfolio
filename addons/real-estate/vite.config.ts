import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import externalGlobals from "rollup-plugin-external-globals";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: "src/addon.tsx",
      fileName: () => "addon.js",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["react", "react-dom", "i18next", "react-i18next"],
      plugins: [
        externalGlobals({
          react: "React",
          "react-dom": "ReactDOM",
          i18next: "i18next",
          "react-i18next": "ReactI18next",
        }),
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          i18next: "i18next",
          "react-i18next": "ReactI18next",
        },
      },
    },
    outDir: "dist",
    minify: false,
    sourcemap: true,
  },
});
