import { defineConfig } from "tsup";

export default defineConfig({
  format: ["cjs", "esm"],
  entry: ["./src/index.ts", "./src/next/index.ts"],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  external: ["react", "next"],
  esbuildOptions: (options) => {
    options.jsx = "preserve";
  },
});
