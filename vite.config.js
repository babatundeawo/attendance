import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { defineConfig } from "vite";

/**
 * After the build, list every emitted file inside the service worker so the whole
 * app is cached for offline use, and give the cache a version that changes
 * whenever any file changes.
 */
function precacheManifest() {
  let outDir;
  return {
    name: "precache-manifest",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const files = [];
      const walk = (dir) => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else files.push(relative(outDir, full).split("\\").join("/"));
        }
      };
      walk(outDir);
      const precache = files
        .filter((f) => !["service-worker.js", "404.html", "og-image.png", "robots.txt"].includes(f) && !f.endsWith(".map"))
        .sort();
      const hash = createHash("sha256");
      for (const f of precache) hash.update(f).update(readFileSync(join(outDir, f)));
      const swPath = join(outDir, "service-worker.js");
      const sw = readFileSync(swPath, "utf8")
        .replace("__PRECACHE__", JSON.stringify(precache))
        .replace("__VERSION__", hash.digest("hex").slice(0, 10));
      writeFileSync(swPath, sw);
    },
  };
}

export default defineConfig({
  // GitHub Actions sets BASE_PATH (for example "/attendance/"); locally it stays relative.
  base: process.env.BASE_PATH || "./",
  plugins: [precacheManifest()],
  build: {
    target: "es2022",
    sourcemap: false,
    // The database library is large by nature; it loads only after sign-in.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: { main: resolve(import.meta.dirname, "index.html"), notFound: resolve(import.meta.dirname, "404.html") },
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.js"],
  },
});
