import { readdir } from "node:fs/promises";
import { registerHooks } from "node:module";

/**
 * Build-time only. Import our metadata-only TypeScript with Node's type stripping.
 * JSON import attributes are supplied here; Vite supplies them in the web build.
 */
export async function readCollection(root) {
  const hooks = registerHooks({
    resolve(specifier, context, next) {
      const nextContext = specifier.endsWith(".json")
        ? { ...context, importAttributes: { type: "json" } }
        : context;
      try {
        return next(specifier, nextContext);
      } catch (error) {
        if ((specifier.startsWith(".") || specifier.startsWith("/")) && !/\.[a-z]+$/i.test(specifier)) {
          return next(`${specifier}.ts`, nextContext);
        }
        throw error;
      }
    },
    load(url, context, next) {
      return next(url, url.endsWith(".json")
        ? { ...context, importAttributes: { type: "json" } }
        : context);
    },
  });
  try {
    const modules = new URL("src/modules/", root);
    const families = (await readdir(modules, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    const activities = [];
    for (const family of families) {
      const { manifest } = await import(new URL(`${family}/manifest.ts`, modules));
      for (const activity of manifest) activities.push({ ...activity, family });
    }
    return { families, activities };
  } finally {
    hooks.deregister();
  }
}
