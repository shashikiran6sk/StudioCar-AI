// Bundles a worker entry point into one ES module. Everything is inlined
// except `sharp`, whose native libvips binary must ship beside the bundle for
// the target platform. Used by `build`, `build:local` and `package:lambda`, so
// local containers run exactly what the Lambda runs.
//
// Usage: node scripts/bundle.mjs <entry.ts> <outfile.mjs>
import process from "node:process";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

/** Native packages that must stay outside the bundle. */
export const NATIVE_EXTERNALS = ["sharp"];

/**
 * Bundled CommonJS dependencies still call `require` for Node built-ins; an
 * ES module has none, so the bundle defines one for itself.
 */
const REQUIRE_BANNER =
  "import { createRequire as __studiocarCreateRequire } from 'node:module';\n" +
  "const require = __studiocarCreateRequire(import.meta.url);";

export async function bundleEntry(entryPoint, outfile) {
  return build({
    entryPoints: [entryPoint],
    outfile,
    bundle: true,
    platform: "node",
    target: "node24",
    format: "esm",
    external: NATIVE_EXTERNALS,
    banner: { js: REQUIRE_BANNER },
    legalComments: "none",
    minifySyntax: true,
    metafile: true,
    logLevel: "warning",
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [entryPoint, outfile] = process.argv.slice(2);
  if (!entryPoint || !outfile) {
    throw new Error("Usage: node scripts/bundle.mjs <entry.ts> <outfile.mjs>");
  }
  await bundleEntry(entryPoint, outfile);
}
