import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { KineticTitle } from "../components/Kinetic";
import { CLAMP, EASE_IN, EASE_IN_OUT, pop, smooth, tween } from "../lib/anim";
import { TRACK, TRACK_BOX } from "../lib/track";
import { BEAT, COLORS, CONTENT, SCENES, rgba } from "../theme";

const DURATION = SCENES.track.duration;

/** Le tracé se dessine en 1,6 s. */
const DRAW = { from: 10, to: 106 };
const drawAt = (frame: number) => tween(frame, DRAW.from, DRAW.to, EASE_IN_OUT);

/** Passage au vert à la mesure suivante (4 s), un virage par temps. */
const GREEN_FROM = SCENES.track.duration / 2 - 5;

const STAGE_TOP = 530;
const GRID = 60;

/**
 * Scène 2 (2–6 s) : un tracé inventé se dessine sur une grille posée en
 * perspective ; trois virages s'allument en rouge au passage du point lumineux,
 * puis passent au vert. La caméra monte lentement pendant toute la scène.
 */
export const SceneTrack: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const exit = tween(frame, DURATION - 14, DURATION, EASE_IN);
  const draw = drawAt(frame);
  const head = TRACK.pointAt(draw);
  const headOpacity = Math.min(1, draw * 30) * (1 - tween(frame, DRAW.to - 4, DRAW.to + 14));
  const enter = smooth(frame, 0);

  // Caméra : le plan se redresse et tourne doucement (3D), sans jamais s'arrêter.
  const tilt = interpolate(frame, [0, DURATION], [50, 34], CLAMP);
  const spin = interpolate(frame, [0, DURATION], [-10, -3], CLAMP);
  const zoom = interpolate(frame, [0, DURATION], [0.87, 0.95], CLAMP);

  const dash = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw } as const;
  const visible = draw > 0.001;

  return (
    <AbsoluteFill>
      <KineticTitle
        text={title}
        frame={frame}
        start={2}
        stagger={6}
        bigSize={176}
        exit={exit}
        style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y + 36 }}
      />

      <div
        style={{
          position: "absolute",
          left: CONTENT.x,
          top: STAGE_TOP,
          width: TRACK_BOX.w,
          height: TRACK_BOX.h,
          perspective: 1500,
          perspectiveOrigin: "50% 20%",
          opacity: enter * (1 - exit),
          transform: `scale(${1 + 0.3 * exit})`,
          filter: exit > 0.01 ? `blur(${(exit * 12).toFixed(2)}px)` : undefined,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `rotateX(${tilt}deg) rotateZ(${spin}deg) scale(${zoom})`,
            transformOrigin: "50% 55%",
          }}
        >
          <svg width={TRACK_BOX.w} height={TRACK_BOX.h} viewBox={`0 0 ${TRACK_BOX.w} ${TRACK_BOX.h}`} style={{ overflow: "visible" }}>
            <defs>
              <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke={rgba(COLORS.text, 0.09)} strokeWidth={1.5} />
              </pattern>
              <radialGradient id="gridFade" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#fff" stopOpacity={1} />
                <stop offset="100%" stopColor="#fff" stopOpacity={0} />
              </radialGradient>
              <mask id="gridMask">
                <rect x={-300} y={-300} width={TRACK_BOX.w + 600} height={TRACK_BOX.h + 600} fill="url(#gridFade)" />
              </mask>
            </defs>

            {/* Sol quadrillé : il donne la profondeur au plan. */}
            <rect
              x={-300}
              y={-300}
              width={TRACK_BOX.w + 600}
              height={TRACK_BOX.h + 600}
              fill="url(#grid)"
              mask="url(#gridMask)"
              opacity={tween(frame, 0, 30)}
            />

            {visible ? (
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d={TRACK.d} stroke={rgba(COLORS.text, 0.08)} strokeWidth={44} {...dash} />
                <path d={TRACK.d} stroke={rgba(COLORS.surface, 0.92)} strokeWidth={38} {...dash} />
                <path
                  d={TRACK.d}
                  stroke={COLORS.violet}
                  strokeWidth={10}
                  style={{ filter: `drop-shadow(0 0 16px ${COLORS.violet})` }}
                  {...dash}
                />
                <path d={TRACK.d} stroke={COLORS.text} strokeWidth={4} {...dash} />
              </g>
            ) : null}

            {/* Ligne de départ */}
            <line
              x1={TRACK.start.x}
              y1={TRACK.start.y - 28}
              x2={TRACK.start.x}
              y2={TRACK.start.y + 28}
              stroke={COLORS.text}
              strokeWidth={7}
              strokeLinecap="round"
              opacity={tween(frame, 6, 18)}
            />

            {TRACK.corners.map((corner, i) => {
              let redFrame = DRAW.from;
              while (redFrame < DRAW.to && drawAt(redFrame) < corner.fraction) redFrame++;
              const greenFrame = GREEN_FROM + i * BEAT;
              if (frame < redFrame) return null;

              const lit = pop(frame, redFrame);
              const toGreen = smooth(frame, greenFrame);
              const color = interpolateColors(toGreen, [0, 1], [COLORS.red, COLORS.green]);

              const ring = (at: number, ringColor: string) => {
                const p = tween(frame, at, at + 40);
                if (p <= 0 || p >= 1) return null;
                return (
                  <circle
                    cx={corner.apex.x}
                    cy={corner.apex.y}
                    r={20 + p * 80}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={5 * (1 - p) + 1}
                    opacity={(1 - p) * 0.9}
                  />
                );
              };

              return (
                <g key={i}>
                  <path
                    d={corner.path}
                    fill="none"
                    stroke={color}
                    strokeWidth={15}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={Math.min(1, lit)}
                    style={{ filter: `drop-shadow(0 0 18px ${color})` }}
                  />
                  {ring(redFrame, COLORS.red)}
                  {ring(greenFrame + 3, COLORS.green)}
                  <circle cx={corner.apex.x} cy={corner.apex.y} r={17 * lit + 4 * Math.sin(toGreen * Math.PI)} fill={color} stroke={COLORS.bg} strokeWidth={6} />
                </g>
              );
            })}

            {headOpacity > 0.01 ? (
              <g opacity={headOpacity}>
                <circle cx={head.x} cy={head.y} r={30} fill={rgba(COLORS.violet, 0.5)} style={{ filter: "blur(12px)" }} />
                <circle cx={head.x} cy={head.y} r={10} fill={COLORS.text} />
              </g>
            ) : null}
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
