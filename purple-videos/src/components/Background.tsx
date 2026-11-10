import React from "react";
import { AbsoluteFill, Img, interpolate, random, useCurrentFrame } from "remotion";
import { CLAMP, EASE_IN_OUT } from "../lib/anim";
import { COLORS, HEIGHT, SCENES, WIDTH, rgba } from "../theme";

/**
 * Fond continu sur les 20 s : lueurs violettes floues qui dérivent lentement et
 * se replacent en douceur à chaque changement de scène (une position par scène).
 * La scène 1 reste noire : les lueurs s'allument à l'arrivée de la scène 2.
 */

// Chaque lueur glisse vers sa nouvelle place sur ~1 s, à cheval sur la coupe.
const BOUNDS = [SCENES.track.from, SCENES.delta.from, SCENES.coach.from, SCENES.debrief.from, SCENES.outro.from];
const KEY_FRAMES = [0, ...BOUNDS.flatMap((b) => [b - 12, b + 48])];

/** Une valeur par scène → une courbe lissée sur toute la vidéo. */
const perScene = (frame: number, values: number[]) => {
  const output = [values[0], ...values.slice(1).flatMap((v, i) => [values[i], v])];
  return interpolate(frame, KEY_FRAMES, output, { ...CLAMP, easing: EASE_IN_OUT });
};

type Orb = {
  color: string;
  x: number[];
  y: number[];
  size: number[];
  alpha: number[];
  /** Dérive lente : amplitude en px, période en secondes, phase. */
  drift: [number, number, number];
};

//                      scène :   1     2     3     4     5     6
const ORBS: Orb[] = [
  {
    color: COLORS.violet,
    x: [540, 720, 830, 230, 800, 540],
    y: [960, 1080, 800, 880, 520, 610],
    size: [900, 1180, 1120, 1180, 1160, 1040],
    alpha: [0, 0.46, 0.5, 0.5, 0.46, 0.4],
    drift: [70, 13, 0],
  },
  {
    color: COLORS.violetLight,
    x: [300, 150, 140, 900, 150, 540],
    y: [500, 400, 1300, 500, 1280, 600],
    size: [700, 760, 820, 780, 840, 600],
    alpha: [0, 0.2, 0.22, 0.22, 0.22, 0.2],
    drift: [90, 17, 2.1],
  },
  {
    color: COLORS.violet,
    x: [800, 1000, 280, 820, 300, 540],
    y: [1500, 1740, 220, 1560, 1640, 1500],
    size: [800, 940, 820, 900, 880, 900],
    alpha: [0, 0.3, 0.26, 0.3, 0.28, 0.2],
    drift: [80, 11, 4.2],
  },
  {
    // Lueur plus serrée, à cheval sur le bord des cartes (scènes 3 à 5) : nette à
    // l'extérieur, diffusée sous le verre — c'est elle qui rend le dépoli lisible.
    color: COLORS.violetLight,
    x: [540, 900, 912, 62, 918, 540],
    y: [960, 700, 702, 398, 362, 620],
    size: [300, 300, 440, 440, 440, 300],
    alpha: [0, 0, 0.62, 0.58, 0.6, 0],
    drift: [34, 9, 1.2],
  },
];

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, overflow: "hidden" }}>
      {ORBS.map((orb, i) => {
        const [amp, period, phase] = orb.drift;
        const size = perScene(frame, orb.size);
        const x = perScene(frame, orb.x) + Math.sin((t / period) * Math.PI * 2 + phase) * amp;
        const y = perScene(frame, orb.y) + Math.cos((t / (period * 1.3)) * Math.PI * 2 + phase) * amp * 0.8;
        const alpha = perScene(frame, orb.alpha);
        if (alpha <= 0.001) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              // Dégradé radial très progressif : c'est lui qui fait le flou, sans filtre coûteux.
              background: `radial-gradient(closest-side, ${rgba(orb.color, alpha)} 0%, ${rgba(orb.color, alpha * 0.55)} 34%, ${rgba(orb.color, alpha * 0.16)} 68%, ${rgba(orb.color, 0)} 100%)`,
            }}
          />
        );
      })}
      {/* Vignette : garde les bords sombres pour que le texte reste le plus lumineux. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 80% at 50% 45%, ${rgba(COLORS.bg, 0)} 40%, ${rgba(COLORS.bg, 0.55)} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Bruit généré par le navigateur (aucune image à fournir), en gris neutre à 50 % :
// en mode « overlay », il module l'image sans en changer la teinte moyenne.
const TILE = 320;
const NOISE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${TILE}' height='${TILE}'>` +
      `<filter id='n' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>` +
      `<feTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' seed='11' stitchTiles='stitch'/>` +
      `<feColorMatrix values='0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1'/>` +
      `</filter><rect width='${TILE}' height='${TILE}' filter='url(#n)'/></svg>`,
  );
const COLUMNS = Math.ceil(WIDTH / TILE) + 1;
const ROWS = Math.ceil(HEIGHT / TILE) + 1;

/**
 * Grain léger par-dessus toute l'image : casse les aplats et évite les bandes
 * dans les dégradés sombres. Il change une image sur deux (grain à 30 i/s).
 * Les tuiles sont des <Img> : Remotion attend leur chargement avant de rendre.
 */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.62 }) => {
  const frame = useCurrentFrame();
  const step = Math.floor(frame / 2);
  const dx = Math.round(random(`grain-x-${step}`) * (TILE - 1));
  const dy = Math.round(random(`grain-y-${step}`) * (TILE - 1));
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity, overflow: "hidden", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: -dx,
          top: -dy,
          width: COLUMNS * TILE,
          height: ROWS * TILE,
          display: "flex",
          flexWrap: "wrap",
          lineHeight: 0,
        }}
      >
        {Array.from({ length: COLUMNS * ROWS }, (_, i) => (
          <Img key={i} src={NOISE} width={TILE} height={TILE} style={{ display: "block" }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
