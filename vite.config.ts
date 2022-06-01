import { defineConfig } from "vite";

import packageJson from "./package.json";

export default defineConfig(({ command, mode }) => {
  return {
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
  };
});
