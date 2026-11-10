// Images de contrôle : une image fixe au milieu de chaque scène (npx remotion still).
//
//   node scripts/stills.mjs                 → out/controle/scene-N-milieu.png
//   node scripts/stills.mjs --zones         → idem, avec les zones réservées TikTok en surimpression
//   node scripts/stills.mjs --fin           → ajoute l'état final de chaque scène
//   node scripts/stills.mjs --dir=out/x     → autre dossier de sortie
//   node scripts/stills.mjs --comp=PurpleTikTok-Accroche2

import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

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

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => (args.find((a) => a.startsWith(`--${name}=`)) ?? `=${fallback}`).split("=")[1];

const zones = flag("zones");
const dir = option("dir", zones ? "out/controle-zones" : "out/controle");
const comp = option("comp", "PurpleTikTok");
mkdirSync(dir, { recursive: true });

const shots = [];
for (const [name, from, to] of SCENES) {
  shots.push([`${name}-milieu`, Math.round(((from + to) / 2) * FPS)]);
  // État final : juste avant la sortie de scène (dernière image pour la signature).
  if (flag("fin")) shots.push([`${name}-fin`, to === END ? END * FPS - 1 : to * FPS - 16]);
}

for (const [name, frame] of shots) {
  const output = `${dir}/${name}.png`;
  const cli = ["remotion", "still", comp, output, `--frame=${frame}`, "--log=error"];
  if (zones) cli.push(`--props=${JSON.stringify({ showSafeZones: true })}`);
  execFileSync("npx", cli, { stdio: "inherit" });
  console.log(`✓ ${output}  (image ${frame})`);
}
