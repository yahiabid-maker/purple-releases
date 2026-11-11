import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CLAMP, tween } from "../lib/anim";
import { COLORS, HEIGHT, SCENES, WIDTH } from "../theme";

/**
 * Transition liquide (débrief → signature) : une nappe violette entre par la gauche
 * avec un bord ondulant, couvre l'écran, puis repart vers la droite en laissant des
 * filaments horizontaux qui se cassent en gouttelettes et s'évanouissent.
 * La coupure entre les deux scènes tombe pendant que l'écran est couvert (image 16).
 */
export const LIQUID = { from: SCENES.outro.from - 16, duration: 50 };

const STEP = 8;
const YS = Array.from({ length: Math.ceil((HEIGHT + 120) / STEP) + 1 }, (_, i) => -60 + i * STEP);
const FINGERS = [
  { y: 150, len: 300, w: 30, r: 12 },
  { y: 360, len: 520, w: 40, r: 16 },
  { y: 540, len: 260, w: 26, r: 11 },
  { y: 760, len: 460, w: 44, r: 17 },
  { y: 980, len: 340, w: 32, r: 13 },
  { y: 1170, len: 560, w: 46, r: 18 },
  { y: 1390, len: 280, w: 28, r: 12 },
  { y: 1580, len: 480, w: 40, r: 16 },
  { y: 1800, len: 320, w: 30, r: 13 },
];
const SPECKS = Array.from({ length: 16 }, (_, i) => ({
  y: 90 + ((i * 523) % 1760),
  lag: 160 + ((i * 197) % 420),
  r: 6 + (i % 4) * 2.5,
  delay: (i % 5) * 0.05,
}));

const path = (pts: [number, number][], closeX: number) =>
  `M ${closeX} -60 ` + pts.map(([x, y]) => `L ${x.toFixed(1)} ${y}`).join(" ") + ` L ${closeX} ${HEIGHT + 60} Z`;

export const LiquidWipe: React.FC = () => {
  const f = useCurrentFrame();
  const entering = f <= 14;

  let d: string;
  const drops: { x: number; y: number; r: number }[] = [];
  if (entering) {
    const lead = interpolate(f, [0, 16], [-380, WIDTH + 380], { ...CLAMP, easing: Easing.bezier(0.5, 0, 0.3, 1) });
    const pts = YS.map((y): [number, number] => [
      lead + 120 * Math.sin(y / 300 + f * 0.18) + 45 * Math.sin(y / 110 + 1.9 + f * 0.3) + 160 * Math.exp(-(((y - 1000 + f * 14) / 320) ** 2)),
      y,
    ]);
    d = path(pts, -420);
  } else {
    const t = interpolate(f, [15, 43], [0, 1], CLAMP);
    const trail = -280 + Easing.bezier(0.45, 0, 0.6, 1)(t) * (WIDTH + 1500);
    const stretch = Easing.out(Easing.quad)(t);
    const pts = YS.map((y): [number, number] => {
      let lag = 0;
      for (const k of FINGERS) lag += k.len * stretch * Math.exp(-(((y - k.y) / k.w) ** 2));
      return [trail - lag + 40 * Math.sin(y / 140 + f * 0.3), y];
    });
    d = path(pts, WIDTH + 2200);
    // Gouttelettes : elles se détachent au bout des filaments et rétrécissent.
    FINGERS.forEach((k, i) => {
      for (let j = 0; j < 2; j++) {
        const r = k.r * (1 - tween(t, 0.3 + j * 0.12, 0.95)) * Math.min(1, t * 5);
        if (r > 0.3) drops.push({ x: trail - k.len * stretch * 1.12 - 34 - j * 58 * (1 + t), y: k.y + (j ? 12 : -8) + (i % 2 ? 4 : -4), r });
      }
    });
    for (const s of SPECKS) {
      const r = s.r * (1 - tween(t, 0.35 + s.delay, 0.98)) * Math.min(1, (t - s.delay) * 6);
      if (r > 0.3) drops.push({ x: trail - s.lag - 260 * t, y: s.y, r });
    }
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={WIDTH} height={HEIGHT}>
        <defs>
          {/* Dégradé fixé à l'écran : il ne bouge pas quand la forme de la nappe change. */}
          <linearGradient id="liquid" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={WIDTH} y2={HEIGHT}>
            <stop offset="0%" stopColor="#7A2EF0" />
            <stop offset="55%" stopColor={COLORS.violet} />
            <stop offset="100%" stopColor="#9C5CFF" />
          </linearGradient>
        </defs>
        <path d={d} fill="url(#liquid)" />
        {drops.map((p, i) => (
          <ellipse key={i} cx={p.x} cy={p.y} rx={p.r * 1.6} ry={p.r} fill={COLORS.violet} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
