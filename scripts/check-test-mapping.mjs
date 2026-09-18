import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const allowlistPath = path.join(root, "tests", "behavior-test-allowlist.json");
const allowlist = new Set(
  JSON.parse(readFileSync(allowlistPath, "utf8")).map(({ source }) => source),
);

function filesBelow(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    if ([".turbo", "coverage", "dist", "node_modules"].includes(entry)) {
      return [];
    }

    const absolute = path.join(directory, entry);
    return statSync(absolute).isDirectory() ? filesBelow(absolute) : [absolute];
  });
}

const roots = [
  path.join(root, "apps", "web", "src"),
  ...filesBelow(path.join(root, "packages"))
    .filter((file) => file.endsWith(`${path.sep}src${path.sep}index.ts`))
    .map((file) => path.dirname(file)),
  path.join(root, "workers", "image-processing", "src"),
];

const sources = roots
  .flatMap(filesBelow)
  .filter((file) => /\.(?:ts|tsx)$/.test(file) && !file.endsWith(".d.ts"));

function expectedTestPaths(source) {
  const relative = path.relative(root, source);
  const withoutExtension = relative.replace(/\.(?:ts|tsx)$/, "");
  let behaviorPath;

  if (withoutExtension.startsWith(`apps${path.sep}web${path.sep}src${path.sep}`)) {
    behaviorPath = withoutExtension.slice(`apps${path.sep}web${path.sep}src${path.sep}`.length);
  } else if (withoutExtension.startsWith(`packages${path.sep}`)) {
    behaviorPath = withoutExtension.replace(`${path.sep}src${path.sep}`, path.sep).slice("packages/".length);
  } else {
    behaviorPath = withoutExtension.replace(`${path.sep}src${path.sep}`, path.sep);
  }

  return ["unit", "integration"].flatMap((suite) =>
    ["ts", "tsx"].map((extension) =>
      path.join(root, "tests", suite, `${behaviorPath}.test.${extension}`),
    ),
  );
}

const missing = sources.filter((source) => {
  const relative = path.relative(root, source);
  return !allowlist.has(relative) && !expectedTestPaths(source).some(existsSync);
});

if (missing.length > 0) {
  console.error("Behavioral source files without a corresponding test or allowlist entry:");
  for (const source of missing) console.error(`- ${path.relative(root, source)}`);
  process.exitCode = 1;
}
