// Rend une liste d'images précises en une seule passe : pratique pour vérifier une
// animation image par image.
//
//   node scripts/frames.mjs 0,20,30            → out/images/image-0000.png, …
//   node scripts/frames.mjs 464-490:2          → de 464 à 490, une image sur deux
//   node scripts/frames.mjs 480,540 --zones    → avec les zones réservées TikTok
//   options : --comp=PurpleTikTok-Accroche2  --dir=out/x  --scale=0.5  --prefix=nom
//             --props='{"flagVideo":""}'

import { flag, option, renderStills } from "./lib/render-stills.mjs";

const frames = (process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "0").split(",").flatMap((part) => {
  const range = part.match(/^(\d+)-(\d+)(?::(\d+))?$/);
  if (!range) return [Number(part)];
  const [from, to, step] = [Number(range[1]), Number(range[2]), Number(range[3] ?? 1)];
  return Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
});

const prefix = option("prefix", "image");
await renderStills({
  comp: option("comp", "PurpleTikTok"),
  dir: option("dir", "out/images"),
  scale: Number(option("scale", "1")),
  inputProps: { ...JSON.parse(option("props", "{}")), ...(flag("zones") ? { showSafeZones: true } : {}) },
  shots: frames.map((frame) => ({ name: `${prefix}-${String(frame).padStart(4, "0")}`, frame })),
});
