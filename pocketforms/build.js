/**
 * PocketForms client build.
 *
 * Produces three artefacts in dist/:
 *   - pocketforms.js       ESM, for bundlers
 *   - pocketforms.cjs      CJS, for legacy node tooling
 *   - pocketforms.iife.js  Drop-in <script> bundle that auto-initializes
 *                          any [data-pocketforms] forms on the page.
 *
 * The IIFE bundle is what most users will use: include it on a page,
 * sprinkle data-attributes on a <form>, done.
 */
import { build } from "esbuild";
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const common = {
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ["es2020"],
  logLevel: "info",
};

await Promise.all([
  build({
    ...common,
    entryPoints: [resolve(__dirname, "src/index.js")],
    outfile: resolve(dist, "pocketforms.js"),
    format: "esm",
  }),
  build({
    ...common,
    entryPoints: [resolve(__dirname, "src/index.js")],
    outfile: resolve(dist, "pocketforms.cjs"),
    format: "cjs",
  }),
  build({
    ...common,
    entryPoints: [resolve(__dirname, "src/auto-init.js")],
    outfile: resolve(dist, "pocketforms.iife.js"),
    format: "iife",
    globalName: "PocketForms",
  }),
]);

// Tiny .d.ts shim so consumers using TS get rough typing without us
// shipping a full TypeScript pipeline. Hand-written, intentionally minimal.
writeFileSync(
  resolve(dist, "pocketforms.d.ts"),
  `export interface PocketFormsOptions {
  pocketbaseUrl: string;
  defaultMode?: "ajax" | "classic";
}

export interface AttachOptions {
  slug: string;
  mode?: "ajax" | "classic";
  honeypotName?: string;
  minTimeMs?: number;
  turnstileSiteKey?: string;
  onSuccess?: (data: any, form: HTMLFormElement) => void;
  onError?: (err: { error: string; message?: string }, form: HTMLFormElement) => void;
}

export interface PocketFormsInstance {
  attach(target: string | HTMLFormElement, opts: AttachOptions): void;
  detach(target: string | HTMLFormElement): void;
}

export const PocketForms: {
  init(opts: PocketFormsOptions): PocketFormsInstance;
  version: string;
};

export default PocketForms;
`,
);

console.log("\n  pocketforms built → dist/");
