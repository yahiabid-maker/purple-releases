import type { CSSProperties } from "react";
import { Easing, interpolate, spring } from "remotion";
import { FPS } from "../theme";

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Ease-out long et doux (type « expo »), pour tout ce qui se pose. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.in(Easing.cubic);

/** Ressort amorti, sans rebond : entrées de textes et de cartes. */
export const smooth = (frame: number, delay = 0) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping: 200, stiffness: 150, mass: 0.9 } });

/** Ressort vif avec un très léger dépassement : puces, marqueurs. */
export const pop = (frame: number, delay = 0) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping: 15, stiffness: 190, mass: 0.7 } });

/** Progression 0 → 1 entre deux images. */
export const tween = (frame: number, from: number, to: number, easing = EASE_OUT) =>
  interpolate(frame, [from, to], [0, 1], { ...CLAMP, easing });

/** Sortie commune à toutes les scènes : 12 images, fondu vers le haut. */
export const sceneExit = (frame: number, duration: number, length = 12) =>
  tween(frame, duration - length, duration, EASE_IN);

/** Apparition « monte + fond », combinée à la sortie de scène. */
export const rise = (
  enter: number,
  exit = 0,
  { distance = 44, blur = 10 }: { distance?: number; blur?: number } = {},
): CSSProperties => {
  const amount = (1 - enter) * blur;
  return {
    opacity: Math.max(0, Math.min(1, enter * 1.15)) * (1 - exit),
    transform: `translate3d(0, ${(1 - enter) * distance - exit * 28}px, 0)`,
    filter: amount > 0.15 ? `blur(${amount.toFixed(2)}px)` : undefined,
  };
};
