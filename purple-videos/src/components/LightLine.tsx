import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CLAMP } from "../lib/anim";
import { COLORS, HEIGHT, WIDTH, rgba } from "../theme";

/**
 * La ligne de lumière violette : le fil rouge de la vidéo. Elle tombe à travers
 * l'écran dans l'accroche, puis revient entre deux scènes en effaçant l'image
 * qu'elle traverse (voir LineWipe).
 */
export const LightLine: React.FC<{ y: number; speed: number }> = ({ y, speed }) => {
  if (y < -120 || y > HEIGHT + 120) return null;
  const trail = Math.min(560, Math.max(0, speed) * 9);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: WIDTH,
          top: y - trail,
          height: trail,
          background: `linear-gradient(to top, ${rgba(COLORS.violet, 0.34)} 0%, ${rgba(COLORS.violet, 0.09)} 45%, ${rgba(COLORS.violet, 0)} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: WIDTH,
          top: y - 2.5,
          height: 5,
          background: `linear-gradient(90deg, ${COLORS.violet} 0%, ${COLORS.violetLight} 22%, ${COLORS.text} 50%, ${COLORS.violetLight} 78%, ${COLORS.violet} 100%)`,
          boxShadow: `0 0 20px 4px ${COLORS.violet}, 0 0 110px 18px ${rgba(COLORS.violet, 0.65)}`,
        }}
      />
    </>
  );
};

/** Transition « ligne » : elle part WIPE.lead images avant la coupe et sort de l'écran WIPE.tail images après. */
export const WIPE = { lead: 16, tail: 8 };
export const WIPE_FRAMES = WIPE.lead + WIPE.tail;

const wipeLineY = (f: number) =>
  -90 + interpolate(f, [0, WIPE_FRAMES], [0, 1], { ...CLAMP, easing: Easing.bezier(0.45, 0, 0.8, 0.62) }) * (HEIGHT + 220);

/**
 * Masque d'une scène sortante, à passer à `clipPath` : tout ce que la ligne a déjà
 * traversé disparaît. `sceneFrame` est l'image de la scène, `duration` sa durée
 * nominale (la séquence doit durer WIPE.tail images de plus).
 */
export const wipeClip = (sceneFrame: number, duration: number) => {
  const f = sceneFrame - (duration - WIPE.lead);
  return f <= 0 ? undefined : `inset(${Math.max(0, wipeLineY(f)).toFixed(1)}px 0 0 0)`;
};

/**
 * Même masque pour un élément précis dont le bord haut est à `top` px de l'écran.
 * Les cartes en verre le portent elles-mêmes : posé sur un parent, il couperait
 * leur flou d'arrière-plan du fond de la vidéo.
 */
export const wipeClipAt = (sceneFrame: number, duration: number, top: number) => {
  const f = sceneFrame - (duration - WIPE.lead);
  return f <= 0 ? undefined : `inset(${Math.max(0, wipeLineY(f) - top).toFixed(1)}px -300px -300px -300px)`;
};

/** La ligne elle-même, à placer dans une séquence de WIPE_FRAMES images commençant WIPE.lead images avant la coupe. */
export const LineWipe: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <LightLine y={wipeLineY(f)} speed={wipeLineY(f) - wipeLineY(f - 1)} />
    </AbsoluteFill>
  );
};
