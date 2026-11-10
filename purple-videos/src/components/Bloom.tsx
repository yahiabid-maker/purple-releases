import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CLAMP, EASE_IN_OUT, tween } from "../lib/anim";
import { COLORS, rgba } from "../theme";

/**
 * Transition « éclosion » entre deux scènes : un point violet grossit jusqu'à
 * remplir l'écran, puis la lumière se condense dans l'élément de la scène suivante.
 */
export const Bloom: React.FC<{ from: { x: number; y: number }; to: { x: number; y: number } }> = ({ from, to }) => {
  const f = useCurrentFrame();
  const move = tween(f, 14, 38, EASE_IN_OUT);
  const x = from.x + (to.x - from.x) * move;
  const y = from.y + (to.y - from.y) * move;
  const r =
    f < 20
      ? interpolate(f, [0, 20], [40, 2400], { ...CLAMP, easing: EASE_IN_OUT })
      : interpolate(f, [20, 46], [2400, 600], { ...CLAMP, easing: EASE_IN_OUT });
  // Montée et descente en courbe douce (pas de flash sec) ; la lumière restante se
  // resserre sur la sphère en s'éteignant.
  const opacity = tween(f, 0, 10, EASE_IN_OUT) * (1 - tween(f, 20, 48, EASE_IN_OUT));
  if (opacity <= 0.001) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${rgba(COLORS.violetLight, 0.85)} 0%, ${rgba(COLORS.violet, 0.78)} 32%, ${rgba(COLORS.violet, 0.5)} 68%, ${rgba(COLORS.violet, 0)} 100%)`,
          opacity,
        }}
      />
    </AbsoluteFill>
  );
};
