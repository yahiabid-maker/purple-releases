// Rend plusieurs images fixes en une seule passe : un seul bundle, un seul navigateur.

import { mkdirSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

/**
 * @param {{ comp: string, dir: string, shots: { name: string, frame: number }[], inputProps?: object, scale?: number }} options
 */
export const renderStills = async ({ comp, dir, shots, inputProps = {}, scale = 1 }) => {
  mkdirSync(dir, { recursive: true });

  // Même réglage que remotion.config.ts : un Chrome déjà installé, si on en fournit un.
  const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;
  const chromeMode = browserExecutable ? "chrome-for-testing" : "headless-shell";
  const common = { browserExecutable, chromeMode, timeoutInMilliseconds: 120000, logLevel: "error" };

  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
  const composition = await selectComposition({ serveUrl, id: comp, inputProps, ...common });
  const browser = await openBrowser("chrome", { browserExecutable, chromeMode, logLevel: "error" });
  try {
    for (const { name, frame } of shots) {
      const output = path.resolve(dir, `${name}.png`);
      await renderStill({ composition, serveUrl, output, frame, inputProps, imageFormat: "png", scale, puppeteerInstance: browser, ...common });
      console.log(`✓ ${path.relative(process.cwd(), output)}  (image ${frame})`);
    }
  } finally {
    await browser.close({ silent: true });
  }
};

export const flag = (name) => process.argv.slice(2).includes(`--${name}`);
export const option = (name, fallback) =>
  (process.argv.slice(2).find((a) => a.startsWith(`--${name}=`)) ?? `=${fallback}`).split("=").slice(1).join("=");
