import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import packageJson from "./package.json";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "index.ts",
      name: "useSpaMetrics",
      // eslint-disable-next-line
      fileName: (format) => `${packageJson.name}.${format}.js`,
    },
    rollupOptions: {
      external: ["react"],
      output: {
        globals: {
          react: "React",
        },
      },
    },
  },
  resolve: {
    alias: {
      "remix-use-spa-metrics":
        process.env.USE_SOURCE === "true"
          ? resolve(__dirname, "index.ts")
          : resolve(__dirname, packageJson.module),
    },
  },
});
