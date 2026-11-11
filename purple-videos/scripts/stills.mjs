// Images de contrôle : une image fixe au milieu de chaque scène.
//
//   node scripts/stills.mjs                 → out/controle/scene-N-milieu.png
//   node scripts/stills.mjs --zones         → idem, avec les zones réservées TikTok en surimpression
//   node scripts/stills.mjs --fin           → ajoute l'état final de chaque scène
//   node scripts/stills.mjs --dir=out/x     → autre dossier de sortie
//   node scripts/stills.mjs --comp=PurpleTikTok-Accroche2

import { flag, option, renderStills } from "./lib/render-stills.mjs";

const FPS = 60;
// [nom, début (s), fin (s)] — même découpage que SCENES dans src/theme.ts
const SCENES = [
  ["scene-1-accroche", 0, 2],
  ["scene-1b-stand", 2, 4],
  ["scene-2-trace", 4, 8],
  ["scene-3-delta", 8, 12],
  ["scene-4-coach", 12, 16],
  ["scene-5-debrief", 16, 19],
  ["scene-6-signature", 19, 22],
];
const END = 22;

const zones = flag("zones");
const shots = [];
for (const [name, from, to] of SCENES) {
  shots.push({ name: `${name}-milieu`, frame: Math.round(((from + to) / 2) * FPS) });
  // État final : juste avant la transition de sortie (dernière image pour la signature).
  if (flag("fin")) shots.push({ name: `${name}-fin`, frame: to === END ? END * FPS - 1 : to * FPS - 20 });
}

await renderStills({
  comp: option("comp", "PurpleTikTok"),
  dir: option("dir", zones ? "out/controle-zones" : "out/controle"),
  inputProps: zones ? { showSafeZones: true } : {},
  shots,
});
