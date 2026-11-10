import React from "react";
import { AbsoluteFill, Img, interpolate, interpolateColors, staticFile, useCurrentFrame } from "remotion";
import { KineticTitle } from "../components/Kinetic";
import { FONT_TITLE } from "../fonts";
import { CLAMP, EASE_IN, EASE_IN_OUT, pop, smooth, tween } from "../lib/anim";
import { TRACK, TRACK_BOX, projectOnStage } from "../lib/track";
import { useStaticFile } from "../lib/useStaticFile";
import { COLORS, CONTENT, SCENES, rgba } from "../theme";

const DURATION = SCENES.track.duration;

/** La photo aérienne ouvre la scène, puis se fond dans le tracé qui se dessine. */
const PHOTO = { in: 10, fadeFrom: 38, fadeTo: 92 };
/** Le tracé se dessine en 1,75 s, pendant le fondu. */
const DRAW = { from: 46, to: 151 };
const drawAt = (frame: number) => tween(frame, DRAW.from, DRAW.to, EASE_IN_OUT);
/** Les virages passent au vert sur les croches qui suivent la fin du tracé. */
const GREEN_FROM = 158;
const GREEN_GAP = 15;

const STAGE_TOP = 470;
const PERSPECTIVE = 1500;
const GRID = 60;

const firstFrameReaching = (fraction: number) => {
  let f = DRAW.from;
  while (f < DRAW.to && drawAt(f) < fraction) f++;
  return f;
};

/**
 * Scène 2 (2–6 s) : photo aérienne du circuit, fondu vers le vrai tracé de Spa qui se
 * dessine sur une grille en perspective. Chaque secteur passe au violet quand il est
 * bouclé ; trois virages s'allument en rouge au passage, puis passent au vert.
 */
export const SceneTrack: React.FC<{ title: string; photo: string }> = ({ title, photo }) => {
  const frame = useCurrentFrame();
  const hasPhoto = useStaticFile(photo, "image") === "ready";
  const exit = tween(frame, DURATION - 14, DURATION, EASE_IN);
  const draw = drawAt(frame);
  const head = TRACK.pointAt(draw);
  const headOpacity = Math.min(1, draw * 30) * (1 - tween(frame, DRAW.to - 4, DRAW.to + 14));

  // Caméra : le plan se redresse et tourne doucement, sans jamais s'arrêter.
  const cam = {
    tilt: interpolate(frame, [0, DURATION], [44, 30], CLAMP),
    spin: interpolate(frame, [0, DURATION], [-7, -1], CLAMP),
    zoom: interpolate(frame, [0, DURATION], [0.9, 0.98], CLAMP),
  };
  // Sans photo, le plan du circuit est là dès l'ouverture de la scène.
  const stageIn = hasPhoto ? tween(frame, PHOTO.fadeFrom, PHOTO.fadeFrom + 30, EASE_IN_OUT) : tween(frame, 0, 20, EASE_IN_OUT);

  const photoOpacity = tween(frame, 0, PHOTO.in, EASE_IN_OUT) * (1 - tween(frame, PHOTO.fadeFrom, PHOTO.fadeTo, EASE_IN_OUT));
  const photoFade = tween(frame, PHOTO.fadeFrom, PHOTO.fadeTo, EASE_IN_OUT);

  const dash = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw } as const;
  const visible = draw > 0.001;

  // Secteurs : chacun passe au violet à l'image où le point lumineux le boucle.
  const sectors = TRACK.sectors.map(([a, b], i) => {
    const doneAt = firstFrameReaching(b - 0.001);
    const on = smooth(frame, doneAt);
    const mid = TRACK.pointAt((a + b) / 2);
    const away = { x: mid.x - TRACK.centroid.x, y: mid.y - TRACK.centroid.y };
    const k = 92 / (Math.hypot(away.x, away.y) || 1);
    const anchor = { x: mid.x + away.x * k, y: mid.y + away.y * k };
    return { i, a, b, doneAt, on, end: TRACK.pointAt(b), anchor };
  });

  return (
    <AbsoluteFill>
      {/* Photo aérienne, étalonnée sombre pour la marque, qui se fond dans le tracé. */}
      {hasPhoto && photoOpacity > 0.001 ? (
        <AbsoluteFill style={{ opacity: photoOpacity, overflow: "hidden" }}>
          <Img
            src={staticFile(photo)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${1.14 - 0.1 * tween(frame, 0, PHOTO.fadeTo, EASE_IN_OUT) + 0.06 * photoFade})`,
              filter: `brightness(0.9) saturate(0.95) contrast(1.05) blur(${(photoFade * 8).toFixed(2)}px)`,
            }}
          />
          {/* Teinte violette légère : la photo entre dans l'univers de la marque. */}
          <AbsoluteFill style={{ background: rgba(COLORS.violet, 0.12), mixBlendMode: "color" }} />
          {/* Haut assombri pour le titre ; bord droit assombri (il porte de la publicité). */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 860, background: `linear-gradient(180deg, ${rgba(COLORS.bg, 0.96)} 0%, ${rgba(COLORS.bg, 0.88)} 52%, ${rgba(COLORS.bg, 0)} 100%)` }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 330, background: `linear-gradient(270deg, ${rgba(COLORS.bg, 0.97)} 0%, ${rgba(COLORS.bg, 0.9)} 40%, ${rgba(COLORS.bg, 0)} 100%)` }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 560, background: `linear-gradient(0deg, ${rgba(COLORS.bg, 0.9)} 0%, ${rgba(COLORS.bg, 0)} 100%)` }} />
        </AbsoluteFill>
      ) : null}

      <KineticTitle
        text={title}
        frame={frame}
        start={4}
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
          perspective: PERSPECTIVE,
          perspectiveOrigin: "50% 20%",
          opacity: stageIn * (1 - exit),
          transform: `scale(${1 + 0.3 * exit})`,
          filter: exit > 0.01 ? `blur(${(exit * 12).toFixed(2)}px)` : undefined,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `rotateX(${cam.tilt}deg) rotateZ(${cam.spin}deg) scale(${cam.zoom})`,
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

            <rect x={-300} y={-300} width={TRACK_BOX.w + 600} height={TRACK_BOX.h + 600} fill="url(#grid)" mask="url(#gridMask)" />

            {visible ? (
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                {/* Ruban de piste puis trajectoire claire. */}
                <path d={TRACK.d} stroke={rgba(COLORS.text, 0.08)} strokeWidth={36} {...dash} />
                <path d={TRACK.d} stroke={rgba(COLORS.surface, 0.92)} strokeWidth={30} {...dash} />
                <path d={TRACK.d} stroke={rgba(COLORS.text, 0.9)} strokeWidth={4} style={{ filter: `drop-shadow(0 0 8px ${rgba(COLORS.violetLight, 0.8)})` }} {...dash} />
              </g>
            ) : null}

            {/* Secteurs violets */}
            {sectors.map((s) =>
              s.on > 0.001 ? (
                <g key={s.i} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={Math.min(1, s.on * 1.4)}>
                  <path
                    d={TRACK.d}
                    pathLength={1}
                    strokeDasharray={`${s.b - s.a} 2`}
                    strokeDashoffset={-s.a}
                    stroke={COLORS.violet}
                    strokeWidth={14}
                    style={{ filter: `drop-shadow(0 0 16px ${COLORS.violet})` }}
                  />
                  <path d={TRACK.d} pathLength={1} strokeDasharray={`${s.b - s.a} 2`} strokeDashoffset={-s.a} stroke={COLORS.violetLight} strokeWidth={4} />
                </g>
              ) : null,
            )}

            {/* Ligne de départ */}
            <line
              x1={TRACK.start.x - TRACK.startNormal.x * 26}
              y1={TRACK.start.y - TRACK.startNormal.y * 26}
              x2={TRACK.start.x + TRACK.startNormal.x * 26}
              y2={TRACK.start.y + TRACK.startNormal.y * 26}
              stroke={COLORS.text}
              strokeWidth={7}
              strokeLinecap="round"
              opacity={tween(frame, DRAW.from - 6, DRAW.from + 6)}
            />

            {/* Fin de secteur : onde violette */}
            {sectors.map((s) => {
              const p = tween(frame, s.doneAt, s.doneAt + 36);
              if (p <= 0 || p >= 1) return null;
              return <circle key={s.i} cx={s.end.x} cy={s.end.y} r={16 + p * 70} fill="none" stroke={COLORS.violetLight} strokeWidth={5 * (1 - p) + 1} opacity={(1 - p) * 0.9} />;
            })}

            {/* Virages analysés : rouge au passage, vert ensuite. */}
            {TRACK.corners.map((corner, i) => {
              const redFrame = firstFrameReaching(corner.fraction);
              const greenFrame = GREEN_FROM + i * GREEN_GAP;
              if (frame < redFrame) return null;
              const lit = pop(frame, redFrame);
              const toGreen = smooth(frame, greenFrame);
              const color = interpolateColors(toGreen, [0, 1], [COLORS.red, COLORS.green]);
              const ring = (at: number, ringColor: string) => {
                const p = tween(frame, at, at + 40);
                if (p <= 0 || p >= 1) return null;
                return <circle cx={corner.apex.x} cy={corner.apex.y} r={18 + p * 70} fill="none" stroke={ringColor} strokeWidth={5 * (1 - p) + 1} opacity={(1 - p) * 0.9} />;
              };
              return (
                <g key={i}>
                  {ring(redFrame, COLORS.red)}
                  {ring(greenFrame + 3, COLORS.green)}
                  <circle
                    cx={corner.apex.x}
                    cy={corner.apex.y}
                    r={15 * lit + 4 * Math.sin(toGreen * Math.PI)}
                    fill={color}
                    stroke={COLORS.bg}
                    strokeWidth={6}
                    style={{ filter: `drop-shadow(0 0 12px ${color})` }}
                  />
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

        {/* Étiquettes de secteur : posées droites au-dessus du plan incliné. */}
        {sectors.map((s) => {
          if (s.on <= 0.001) return null;
          const p = projectOnStage(s.anchor, cam, { perspective: PERSPECTIVE });
          const bounce = pop(frame, s.doneAt);
          return (
            <div
              key={s.i}
              style={{
                position: "absolute",
                left: p.x,
                top: p.y,
                transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * bounce})`,
                opacity: Math.min(1, s.on * 1.5),
                padding: "4px 20px 6px",
                borderRadius: 22,
                background: `linear-gradient(180deg, ${rgba(COLORS.violetLight, 0.45)} 0%, ${rgba(COLORS.violet, 0)} 60%), ${COLORS.violet}`,
                boxShadow: `inset 0 0 0 1.5px ${rgba(COLORS.text, 0.35)}, 0 0 30px ${rgba(COLORS.violet, 0.8)}`,
                fontFamily: FONT_TITLE,
                fontWeight: 800,
                fontSize: 56,
                lineHeight: 1.1,
                color: COLORS.text,
                whiteSpace: "nowrap",
              }}
            >
              S{s.i + 1}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
