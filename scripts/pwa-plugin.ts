import type { Plugin } from "vite";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

/** Emit only from the client build; Nitro copies these files to the provider's public output. */
export function haloPwa(): Plugin {
  return {
    name: "halo-pwa",
    apply: "build",
    generateBundle(_options, bundle) {
      if (this.environment.name !== "client") return;
      const assets = Object.keys(bundle)
        .filter((name) => /\.(js|css)$/.test(name))
        .map((name) => `/${name}`);
      const publicFiles = [
        "manifest.webmanifest",
        "offline.html",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/maskable-512.png",
        "icons/apple-touch-icon.png",
      ];
      const template = readFileSync("src/sw.js", "utf8");
      const hash = createHash("sha256").update(JSON.stringify(assets)).update(template);
      for (const file of publicFiles) hash.update(readFileSync(`public/${file}`));
      const source = template
        .replace('"__VERSION__"', JSON.stringify(hash.digest("hex").slice(0, 16)))
        .replace(
          '"__ASSETS__"',
          JSON.stringify([...assets, ...publicFiles.map((file) => `/${file}`)]),
        );
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}
