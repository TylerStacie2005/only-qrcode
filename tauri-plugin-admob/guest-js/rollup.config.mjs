import typescript from "@rollup/plugin-typescript";

export default {
  input: "index.ts",
  output: [
    { file: "dist/index.js", format: "esm" },
    { file: "dist/index.cjs", format: "cjs" },
  ],
  plugins: [typescript({ tsconfig: "./tsconfig.json" })],
  external: ["@tauri-apps/api/core"],
};
