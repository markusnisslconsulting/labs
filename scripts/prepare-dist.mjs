/**
 * Write the package.json that would actually be published.
 *
 * The workspace `exports` point at TypeScript source, which is right for
 * a monorepo: Vite compiles it, HMR works, and there is no build step
 * between changing a component and seeing it. It is also completely wrong
 * for a tarball — a consumer without our build would import .tsx.
 *
 * So the source manifest carries `publishConfig.exports` with the built
 * shape, and this script produces the artifact manifest from it. That is
 * the thing publint and "are the types wrong" have to inspect: checking
 * the workspace manifest would only ever confirm that source exports look
 * like source exports.
 *
 * It also copies the parts of the package that are not compiled: the
 * stylesheet layer and the generated token files. Both were declared in
 * the exports map and never emitted, so the published package promised a
 * token layer it did not contain — precisely the class of error npm
 * publishes without a word and publint catches in a second.
 *
 * The CSS is copied rather than bundled on purpose. styles.css is a list
 * of @imports whose first line declares the cascade layer order; letting
 * the consumer's bundler inline them keeps that order, and keeps
 * `./styles/brands/*.css` importable one at a time.
 *
 * Usage: node scripts/prepare-dist.mjs <packageDir> <distDir>
 */
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const [packageDir, distDir] = process.argv.slice(2);
if (!packageDir || !distDir) {
  console.error("usage: node scripts/prepare-dist.mjs <packageDir> <distDir>");
  process.exit(2);
}

const source = JSON.parse(
  readFileSync(join(packageDir, "package.json"), "utf8"),
);
const { publishConfig } = source;

if (!publishConfig?.exports) {
  console.error(
    `${packageDir}/package.json has no publishConfig.exports, so there is no ` +
      `published shape to describe. Add one, or drop this step.`,
  );
  process.exit(1);
}

// Built explicitly rather than by spreading and deleting: a manifest that
// lists what it publishes cannot accidentally carry a devDependency or a
// script into a tarball.
const manifest = {
  name: source.name,
  version: source.version,
  type: source.type,
  sideEffects: source.sideEffects,
  peerDependencies: source.peerDependencies,
  dependencies: source.dependencies,
  // Kept private on purpose: this repo does not publish. The manifest
  // exists so the shape can be validated, not so it can be pushed.
  private: true,
  exports: publishConfig.exports,
  files: ["**/*"],
};

writeFileSync(
  join(distDir, "package.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

/**
 * Minify a copied stylesheet.
 *
 * The source CSS in this repository is heavily commented on purpose —
 * most rules carry the measurement or the bug that produced them — and
 * `prepare-dist` copied it verbatim, so the published token layer was
 * 31 KB of which most was prose written for maintainers. A consumer
 * downloads the cascade, not the reasoning.
 *
 * esbuild rather than lightningcss, and that is not a preference: this
 * repository has already been bitten by lightningcss collapsing
 * `@layer tokens, base, components, print, overrides;` into nothing,
 * after which the first opened layer decided precedence and an active
 * chip rendered navy on navy. The assertion below is there because
 * knowing that once is not the same as never repeating it.
 */
async function minifyCss(text) {
  const { transform } = await import("esbuild");
  const out = await transform(text, { loader: "css", minify: true });
  return out.code;
}

const copied = [];
for (const relative of ["src/styles.css", "src/styles", "tokens"]) {
  const from = join(packageDir, relative);
  if (!existsSync(from)) {
    console.error(`${from} does not exist, but the exports map promises it`);
    process.exit(1);
  }
  const to = join(distDir, relative.replace(/^src\//, ""));
  cpSync(from, to, { recursive: true });
  copied.push(relative);
}

/**
 * Strip CSS imports out of the emitted declarations.
 *
 * A component's source begins `import "./Button.css"`, and tsc faithfully
 * copies that into Button.d.ts — where it means nothing, because a
 * declaration file has no runtime. It is worse than meaningless: the
 * bundled JavaScript refers to ../Button.css (the CSS is emitted one
 * level up) while the declaration still says ./Button.css, so every
 * component's types contained an import that resolves to nothing.
 *
 * "are the types wrong" reported it as an internal resolution error, which
 * is the polite name for "your types describe files you did not ship".
 */
let stripped = 0;
function stripCssImports(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      stripCssImports(path);
      continue;
    }
    if (!entry.endsWith(".d.ts")) continue;
    const before = readFileSync(path, "utf8");
    const after = before
      .replace(/^\s*import\s+["'][^"']+\.css["'];?\s*$/gm, "")
      // Give relative specifiers their extension. TypeScript emits
      // `from "./components/Button"`, which a bundler resolves and Node's
      // ESM resolver does not — so the types worked for a Vite consumer
      // and failed for anyone on node16 module resolution. The emitted
      // JavaScript already carries the extension; only the declarations
      // did not.
      // Two shapes, and the second was missing. `from "./X"` covers what
      // TypeScript writes for an import you wrote yourself. `import("./X")`
      // is what it writes for an *inferred* type — and it inferred one the
      // day `SplitButton.Item = Menu.Item` was added, emitting
      // `import("./Menu").MenuItemProps` with no extension while the
      // explicit import two lines above it was rewritten correctly. attw
      // caught it; nothing else would have, because a bundler resolves
      // both.
      .replace(
        /(\bfrom\s*["']|\bimport\(\s*["'])(\.\.?\/[^"']+?)(["'])/g,
        (whole, head, spec, tail) =>
          // Only a real extension counts. Matching /\.[a-z]+$/ treated
          // "./tokens.registry" as already extended, because the file name
          // itself contains a dot — and that one specifier was the last
          // thing attw complained about.
          /\.(js|mjs|cjs|json|css)$/.test(spec)
            ? whole
            : `${head}${spec}.js${tail}`,
      );
    if (after !== before) {
      writeFileSync(path, after);
      stripped += 1;
    }
  }
}
stripCssImports(distDir);

/** Minify every copied stylesheet, in place. */
let cssBefore = 0;
let cssAfter = 0;
async function minifyTree(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      await minifyTree(path);
      continue;
    }
    if (!entry.endsWith(".css")) continue;
    const before = readFileSync(path, "utf8");
    const after = await minifyCss(before);
    cssBefore += before.length;
    cssAfter += after.length;
    writeFileSync(path, after);
  }
}
await minifyTree(join(distDir, "styles"));
const entry = join(distDir, "styles.css");
if (existsSync(entry)) {
  const before = readFileSync(entry, "utf8");
  const after = await minifyCss(before);
  cssBefore += before.length;
  cssAfter += after.length;
  // The declaration has to survive, and it has to be first: whatever
  // opens a layer first decides the order, so losing it is a silent
  // precedence change rather than an error.
  if (
    !after
      .trimStart()
      .startsWith("@layer tokens,base,components,print,overrides;")
  ) {
    console.error(
      `${entry}: the cascade layer declaration did not survive minification. ` +
        `The minifier dropped or reordered it, which changes precedence ` +
        `without failing anything downstream.`,
    );
    process.exit(1);
  }
  writeFileSync(entry, after);
}

console.log(
  `wrote ${distDir}/package.json, copied ${copied.join(", ")}, ` +
    `stripped CSS imports from ${stripped} declaration file(s), ` +
    `minified CSS ${cssBefore} -> ${cssAfter} B`,
);
