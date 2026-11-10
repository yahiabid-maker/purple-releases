import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CLAMP } from "../lib/anim";
import { CAR_PASS, PAN, panAt, panBlur } from "../lib/pan";
import { COLORS, HEIGHT, WIDTH, rgba } from "../theme";
import { CAR_RATIO, CarTopDown } from "./CarTopDown";

const CAR_WIDTH = 380;
const ARROW_GAP = 240;

/** Flèche peinte au sol, pointe vers le bas. */
const Chevron: React.FC<{ y: number }> = ({ y }) => (
  <g transform={`translate(${WIDTH / 2} ${y})`}>
    <path d="M 0 -70 L 0 40" stroke={rgba(COLORS.violetLight, 0.9)} strokeWidth={16} strokeLinecap="round" />
    <path d="M -46 0 L 0 52 L 46 0" fill="none" stroke={rgba(COLORS.violetLight, 0.9)} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/**
 * Transition accroche → scène 2, vue de dessus : la caméra file vers le bas sur une
 * bande d'asphalte marquée de flèches violettes ; une monoplace la traverse à pleine
 * vitesse ; le bas de la bande se fond dans la photo aérienne qui arrive.
 * Images en temps global (la séquence commence à PAN.from).
 */
export const PanTransition: React.FC = () => {
  const frame = useCurrentFrame() + PAN.from;
  const x = panAt(frame);
  const top = HEIGHT - x;
  const blur = panBlur(frame);

  // Monoplace : elle descend plus vite que la caméra, en accélérant.
  const carY = interpolate(frame, [CAR_PASS.from, CAR_PASS.to], [-CAR_WIDTH * CAR_RATIO, HEIGHT + 80], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.75, 1),
  });
  const carSpeed = carY - interpolate(frame - 1, [CAR_PASS.from, CAR_PASS.to], [-CAR_WIDTH * CAR_RATIO, HEIGHT + 80], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.75, 1),
  });
  // Flou limité : la monoplace doit rester lisible, comme dans la référence.
  const carBlur = Math.min(10, carSpeed * 0.08);
  const carOn = frame >= CAR_PASS.from && frame <= CAR_PASS.to + 2;
  const carLength = CAR_WIDTH * CAR_RATIO;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="carBlur" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation={`0 ${carBlur.toFixed(1)}`} />
        </filter>
      </svg>

      {/* Bande d'asphalte fléchée : elle monte avec le travelling. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top,
          width: WIDTH,
          height: PAN.band,
          background: `linear-gradient(90deg, #121219 0%, #191922 50%, #121219 100%)`,
          maskImage: "linear-gradient(180deg, transparent 0px, #000 260px, #000 calc(100% - 420px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0px, #000 260px, #000 calc(100% - 420px), transparent 100%)",
          filter: blur > 0.5 ? "url(#panBlur)" : undefined,
        }}
      >
        <svg width={WIDTH} height={PAN.band} style={{ position: "absolute", inset: 0 }}>
          {/* Lignes de voie, lumineuses */}
          {[250, 830].map((lx) => (
            <g key={lx}>
              <rect x={lx - 9} y={0} width={18} height={PAN.band} fill={rgba(COLORS.violet, 0.35)} />
              <rect x={lx - 4} y={0} width={8} height={PAN.band} fill={COLORS.violetLight} opacity={0.85} />
            </g>
          ))}
          {/* Repères d'emplacement, comme les marques au sol d'un stand */}
          {Array.from({ length: Math.floor(PAN.band / 600) }, (_, i) => (
            <g key={i}>
              <rect x={250} y={300 + i * 600} width={120} height={10} rx={5} fill={rgba(COLORS.text, 0.55)} />
              <rect x={710} y={300 + i * 600} width={120} height={10} rx={5} fill={rgba(COLORS.text, 0.55)} />
            </g>
          ))}
          {Array.from({ length: Math.floor(PAN.band / ARROW_GAP) }, (_, i) => (
            <Chevron key={i} y={160 + i * ARROW_GAP} />
          ))}
        </svg>
      </div>

      {/* Raccord : le haut de la photo qui arrive se fond dans l'asphalte. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: WIDTH,
          top: top + PAN.band - 40,
          height: 360,
          background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${rgba(COLORS.bg, 0.85)} 35%, ${rgba(COLORS.bg, 0)} 100%)`,
          opacity: 1 - interpolate(frame, [PAN.to - 10, PAN.to + 3], [0, 1], CLAMP),
        }}
      />

      {/* Monoplace : traînées lumineuses derrière elle, puis la voiture, nez vers le bas. */}
      {carOn ? (
        <div style={{ position: "absolute", left: WIDTH / 2 - CAR_WIDTH / 2, top: carY - carLength, width: CAR_WIDTH, height: carLength }}>
          {[-0.33, 0.33].map((side) => (
            <div
              key={side}
              style={{
                position: "absolute",
                left: CAR_WIDTH / 2 + side * CAR_WIDTH - 9,
                bottom: carLength * 0.86,
                width: 18,
                height: Math.min(1100, 160 + carSpeed * 6),
                borderRadius: 9,
                background: `linear-gradient(0deg, ${rgba(COLORS.violetLight, 0.85)} 0%, ${rgba(COLORS.violet, 0.4)} 40%, ${rgba(COLORS.violet, 0)} 100%)`,
              }}
            />
          ))}
          <div style={{ filter: carBlur > 0.5 ? "url(#carBlur)" : undefined, transform: "rotate(180deg)" }}>
            <CarTopDown width={CAR_WIDTH} id="passCar" light={1.6} />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
