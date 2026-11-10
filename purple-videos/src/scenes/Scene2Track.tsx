import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { Headline } from "../components/Text";
import { CLAMP, EASE_IN_OUT, pop, sceneExit, smooth, tween } from "../lib/anim";
import { TRACK, TRACK_BOX } from "../lib/track";
import { BEAT, COLORS, CONTENT, SCENES, rgba } from "../theme";

const DURATION = SCENES.track.duration;

/** Le tracé se dessine en 1,6 s. */
const DRAW = { from: 6, to: 102 };
const drawAt = (frame: number) => tween(frame, DRAW.from, DRAW.to, EASE_IN_OUT);

/** Passage au vert à la mesure suivante (4 s), un virage par temps. */
const GREEN_FROM = SCENES.track.duration / 2 - 5;

const TRACK_TOP = 566;

/**
 * Scène 2 (2–6 s) : un tracé inventé se dessine ; trois virages s'allument en
 * rouge au passage du point lumineux, puis passent au vert.
 */
export const SceneTrack: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const exit = sceneExit(frame, DURATION);
  const draw = drawAt(frame);
  const head = TRACK.pointAt(draw);
  const headOpacity = Math.min(1, draw * 30) * (1 - tween(frame, DRAW.to - 4, DRAW.to + 14));
  const enter = smooth(frame, 2);

  // Très lent travelling avant, pour que le tracé ne soit jamais figé.
  const scale = interpolate(frame, [0, DURATION], [0.985, 1.02], CLAMP);

  const dash = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw } as const;
  const visible = draw > 0.001;

  return (
    <AbsoluteFill>
      <Headline
        text={title}
        frame={frame}
        start={0}
        exit={exit}
        size={124}
        style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y + 44, width: CONTENT.w }}
      />

      <svg
        width={TRACK_BOX.w}
        height={TRACK_BOX.h}
        viewBox={`0 0 ${TRACK_BOX.w} ${TRACK_BOX.h}`}
        style={{
          position: "absolute",
          left: CONTENT.x,
          top: TRACK_TOP,
          overflow: "visible",
          opacity: enter * (1 - exit),
          transform: `translate3d(0, ${-exit * 28}px, 0) scale(${scale})`,
          transformOrigin: "50% 50%",
        }}
      >
        {visible ? (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Ruban de piste */}
            <path d={TRACK.d} stroke={rgba(COLORS.text, 0.075)} strokeWidth={40} {...dash} />
            <path d={TRACK.d} stroke={rgba(COLORS.surface, 0.9)} strokeWidth={34} {...dash} />
            {/* Trajectoire : halo violet + trait clair */}
            <path
              d={TRACK.d}
              stroke={COLORS.violet}
              strokeWidth={9}
              style={{ filter: `drop-shadow(0 0 14px ${COLORS.violet})` }}
              opacity={0.9}
              {...dash}
            />
            <path d={TRACK.d} stroke={COLORS.text} strokeWidth={3.5} {...dash} />
          </g>
        ) : null}

        {/* Ligne de départ */}
        <line
          x1={TRACK.start.x}
          y1={TRACK.start.y - 26}
          x2={TRACK.start.x}
          y2={TRACK.start.y + 26}
          stroke={COLORS.text}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={tween(frame, 2, 14)}
        />

        {/* Les trois virages analysés */}
        {TRACK.corners.map((corner, i) => {
          // Rouge : à l'image où le point lumineux franchit le virage.
          let redFrame = DRAW.from;
          while (redFrame < DRAW.to && drawAt(redFrame) < corner.fraction) redFrame++;
          const greenFrame = GREEN_FROM + i * BEAT;

          const lit = pop(frame, redFrame);
          const toGreen = smooth(frame, greenFrame);
          const color = interpolateColors(toGreen, [0, 1], [COLORS.red, COLORS.green]);
          if (frame < redFrame) return null;

          const ring = (start: number, ringColor: string) => {
            const p = tween(frame, start, start + 38);
            if (p <= 0 || p >= 1) return null;
            return (
              <circle
                cx={corner.apex.x}
                cy={corner.apex.y}
                r={18 + p * 62}
                fill="none"
                stroke={ringColor}
                strokeWidth={4 * (1 - p) + 1}
                opacity={(1 - p) * 0.85}
              />
            );
          };

          return (
            <g key={i}>
              <path
                d={corner.path}
                fill="none"
                stroke={color}
                strokeWidth={13}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={Math.min(1, lit)}
                style={{ filter: `drop-shadow(0 0 16px ${color})` }}
              />
              {ring(redFrame, COLORS.red)}
              {ring(greenFrame + 3, COLORS.green)}
              <circle
                cx={corner.apex.x}
                cy={corner.apex.y}
                r={15 * lit + 3 * Math.sin(toGreen * Math.PI)}
                fill={color}
                stroke={COLORS.bg}
                strokeWidth={6}
              />
            </g>
          );
        })}

        {/* Point lumineux en tête de tracé */}
        {headOpacity > 0.01 ? (
          <g opacity={headOpacity}>
            <circle cx={head.x} cy={head.y} r={26} fill={rgba(COLORS.violet, 0.45)} style={{ filter: "blur(10px)" }} />
            <circle cx={head.x} cy={head.y} r={9} fill={COLORS.text} />
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
