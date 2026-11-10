import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, interpolateColors, staticFile, useCurrentFrame } from "remotion";
import { KineticTitle } from "../components/Kinetic";
import { FONT_TITLE } from "../fonts";
import { CLAMP, EASE_IN, EASE_IN_OUT, pop, smooth, tween } from "../lib/anim";
import { type Camera, type Pt, TRACK, TRACK_BOX, photoMatrix, project } from "../lib/track";
import { useStaticFile } from "../lib/useStaticFile";
import { COLORS, CONTENT, HEIGHT, SCENES, WIDTH, rgba } from "../theme";

const DURATION = SCENES.track.duration;

/**
 * Déroulé (images de la scène) :
 *  0–10    la photo aérienne apparaît, plein écran
 *  16      le tracé commence à se dessiner sur la photo, au bord haut, et suit la chicane
 *  40–140  la caméra dézoome en tournant ; la photo, calée sur le tracé, rapetisse avec lui
 *  64–112  la photo s'efface, la grille et la piste prennent le relais
 *  170     le tour est bouclé ; chaque secteur est passé au violet en se bouclant
 *  180+    les trois virages passent au vert, sur les croches
 */
/** La photo arrive en fondu enchaîné depuis l'arrêt aux stands (vu de dessus, lui aussi). */
const PHOTO = { in: 14, outFrom: 64, outTo: 112 };
const DRAW = { from: 16, to: 170 };
const DEZOOM = { from: 40, to: 140 };
const TILT = { from: 92, to: 160 };
const GREEN_FROM = 180;
const GREEN_GAP = 15;

const STAGE_TOP = 470;
const GRID = 60;
/** 1 pixel de la photo = 1,0667 pixel d'écran quand elle couvre l'écran (1350×1800 → 1080×1920). */
const COVER = Math.max(WIDTH / TRACK.photo.width, HEIGHT / TRACK.photo.height) * 1.03;

const drawEase = Easing.bezier(0.65, 0, 0.35, 1);
const progressAt = (frame: number) => drawEase(interpolate(frame, [DRAW.from, DRAW.to], [0, 1], CLAMP));
/** Le trait part 25 m après le bord haut de la photo, pour démarrer sous la barre de TikTok. */
const DRAW_FROM = TRACK.drawFrom + 0.0035;
/** Distance (en fraction du tour) entre le début du dessin et un point du tour. */
const ahead = (fraction: number) => (((fraction - DRAW_FROM) % 1) + 1) % 1;
const firstFrameReaching = (p: number) => {
  let f = DRAW.from;
  while (f < DRAW.to && progressAt(f) < p) f++;
  return f;
};

const START_CAM: Camera = {
  target: TRACK.photo.center,
  anchor: { x: WIDTH / 2, y: HEIGHT / 2 },
  zoom: COVER / TRACK.photo.pixel,
  angle: TRACK.photo.uprightAngle,
  tilt: 0,
};
const END_CAM: Camera = {
  target: { x: TRACK_BOX.w / 2, y: TRACK_BOX.h * 0.55 },
  anchor: { x: CONTENT.x + TRACK_BOX.w / 2, y: STAGE_TOP + TRACK_BOX.h * 0.55 - 50 },
  zoom: 0.92,
  angle: -1,
  tilt: 32,
};

const cameraAt = (frame: number): Camera => {
  const e = tween(frame, DEZOOM.from, DEZOOM.to, EASE_IN_OUT);
  const hold = tween(frame, 0, DEZOOM.from, EASE_IN_OUT);
  const after = tween(frame, DEZOOM.to, DURATION, EASE_IN_OUT);
  const z0 = START_CAM.zoom * (1 + 0.03 * hold);
  const zoom = Math.exp(Math.log(z0) + (Math.log(END_CAM.zoom) - Math.log(z0)) * e) * (1 + 0.02 * after);
  // Le point visé se déplace au rythme de la taille du champ : rien ne glisse tant qu'on est près.
  const w = (1 / zoom - 1 / z0) / (1 / END_CAM.zoom - 1 / z0);
  const k = Math.max(0, Math.min(1, w));
  return {
    target: {
      x: START_CAM.target.x + (END_CAM.target.x - START_CAM.target.x) * k,
      y: START_CAM.target.y + (END_CAM.target.y - START_CAM.target.y) * k,
    },
    anchor: {
      x: START_CAM.anchor.x + (END_CAM.anchor.x - START_CAM.anchor.x) * e,
      y: START_CAM.anchor.y + (END_CAM.anchor.y - START_CAM.anchor.y) * e,
    },
    zoom,
    angle: START_CAM.angle + (END_CAM.angle - START_CAM.angle) * e + 2.5 * after,
    tilt: END_CAM.tilt * tween(frame, TILT.from, TILT.to, EASE_IN_OUT) - 4 * after,
  };
};

const toPath = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

/**
 * Masque de la photo : la bande de droite est retirée (elle porte de la publicité), et
 * les bords se fondent progressivement pendant le dézoom (plein cadre au départ,
 * tache aux bords doux quand elle rapetisse).
 */
const photoMask = (soft: number) => {
  const rx = 125 - 70 * soft;
  const ry = 125 - 72 * soft;
  const inner = 80 - 45 * soft;
  return [
    "linear-gradient(90deg, #000 0%, #000 76%, transparent 81%)",
    `radial-gradient(ellipse ${rx.toFixed(1)}% ${ry.toFixed(1)}% at 50% 48%, #000 ${inner.toFixed(1)}%, transparent 100%)`,
  ].join(", ");
};

/**
 * Scène 2 (2–6 s) : la photo aérienne du Bus Stop ; le tracé de Spa commence à se
 * dessiner dessus, calé sur la piste, puis la caméra dézoome en tournant jusqu'au
 * circuit entier vu en perspective. Chaque secteur passe au violet quand il est
 * bouclé ; trois virages s'allument en rouge au passage, puis passent au vert.
 */
export const SceneTrack: React.FC<{ title: string; photo: string }> = ({ title, photo }) => {
  const frame = useCurrentFrame();
  const hasPhoto = useStaticFile(photo, "image") === "ready";
  const exit = tween(frame, DURATION - 14, DURATION, EASE_IN);
  const cam = cameraAt(frame);
  const P = (p: Pt) => project(p, cam);

  const photoOpacity = hasPhoto ? tween(frame, 0, PHOTO.in, EASE_IN_OUT) * (1 - tween(frame, PHOTO.outFrom, PHOTO.outTo, EASE_IN_OUT)) : 0;
  const mapOpacity = 1 - photoOpacity;
  const gridOpacity = tween(frame, TILT.from - 10, TILT.to - 20, EASE_IN_OUT);

  const progress = progressAt(frame);
  const drawn = toPath(TRACK.slice(DRAW_FROM, progress).map(P));
  const head = P(TRACK.pointAt(DRAW_FROM + progress));
  const headOpacity = Math.min(1, progress * 200) * (1 - tween(frame, DRAW.to - 4, DRAW.to + 14));

  const sectors = TRACK.sectors.map(([a, b], i) => {
    const containsStart = DRAW_FROM > a && DRAW_FROM < b;
    const doneAt = firstFrameReaching(containsStart ? 0.999 : ahead(b));
    const on = smooth(frame, doneAt);
    const mid = TRACK.pointAt((a + b) / 2);
    const away = { x: mid.x - TRACK.centroid.x, y: mid.y - TRACK.centroid.y };
    const k = 92 / (Math.hypot(away.x, away.y) || 1);
    return {
      i,
      doneAt,
      on,
      path: on > 0.001 ? toPath(TRACK.slice(a, b - a).map(P)) : "",
      end: P(TRACK.pointAt(b)),
      label: P({ x: mid.x + away.x * k, y: mid.y + away.y * k }),
    };
  });

  // Ligne de départ : un trait perpendiculaire à la piste, de taille fixe à l'écran.
  const s0 = P(TRACK.start);
  const s1 = P({ x: TRACK.start.x + TRACK.startNormal.x, y: TRACK.start.y + TRACK.startNormal.y });
  const sn = { x: s1.x - s0.x, y: s1.y - s0.y };
  const snl = Math.hypot(sn.x, sn.y) || 1;
  const startOn = progress >= ahead(0) ? 1 : 0;

  // Grille du sol, projetée (les droites restent droites en perspective).
  const gridLines: string[] = [];
  for (let x = -300; x <= TRACK_BOX.w + 300; x += GRID) gridLines.push(toPath([P({ x, y: -300 }), P({ x, y: TRACK_BOX.h + 300 })]));
  for (let y = -300; y <= TRACK_BOX.h + 300; y += GRID) gridLines.push(toPath([P({ x: -300, y }), P({ x: TRACK_BOX.w + 300, y })]));
  const gridCenter = P({ x: TRACK_BOX.w / 2, y: TRACK_BOX.h / 2 });

  return (
    <AbsoluteFill
      style={{
        opacity: 1 - exit,
        transform: `scale(${1 + 0.3 * exit})`,
        transformOrigin: `${END_CAM.anchor.x}px ${END_CAM.anchor.y}px`,
        filter: exit > 0.01 ? `blur(${(exit * 12).toFixed(2)}px)` : undefined,
      }}
    >
      {/* Photo aérienne, calée sur le tracé : elle dézoome et tourne avec lui. */}
      {photoOpacity > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: TRACK.photo.width,
            height: TRACK.photo.height,
            transformOrigin: "0 0",
            transform: photoMatrix(cam),
            opacity: photoOpacity,
            maskImage: photoMask(tween(frame, DEZOOM.from, DEZOOM.from + 40, EASE_IN_OUT)),
            WebkitMaskImage: photoMask(tween(frame, DEZOOM.from, DEZOOM.from + 40, EASE_IN_OUT)),
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
            isolation: "isolate",
          }}
        >
          <Img src={staticFile(photo)} style={{ width: "100%", height: "100%", display: "block", filter: "brightness(0.9) saturate(0.95) contrast(1.05)" }} />
          <div style={{ position: "absolute", inset: 0, background: rgba(COLORS.violet, 0.12), mixBlendMode: "color" }} />
        </div>
      ) : null}

      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <radialGradient id="gridFade" gradientUnits="userSpaceOnUse" cx={gridCenter.x} cy={gridCenter.y} r={720}>
            <stop offset="0%" stopColor="#fff" stopOpacity={1} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id="gridMask" maskUnits="userSpaceOnUse" x={0} y={0} width={WIDTH} height={HEIGHT}>
            <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="url(#gridFade)" />
          </mask>
          <radialGradient id="cometGlow">
            <stop offset="0%" stopColor={COLORS.violetLight} stopOpacity={0.75} />
            <stop offset="45%" stopColor={COLORS.violet} stopOpacity={0.35} />
            <stop offset="100%" stopColor={COLORS.violet} stopOpacity={0} />
          </radialGradient>
        </defs>

        {gridOpacity > 0.001 ? (
          <g mask="url(#gridMask)" opacity={gridOpacity} stroke={rgba(COLORS.text, 0.09)} strokeWidth={1.5} fill="none">
            {gridLines.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        ) : null}

        {progress > 0.0005 ? (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Ruban de piste : seulement une fois la photo partie (sur la photo, la vraie piste suffit). */}
            <path d={drawn} stroke={rgba(COLORS.text, 0.08)} strokeWidth={40} opacity={mapOpacity} />
            <path d={drawn} stroke={rgba(COLORS.surface, 0.92)} strokeWidth={34} opacity={mapOpacity} />
            {/* Trajectoire : halo puis trait clair. */}
            <path d={drawn} stroke={rgba(COLORS.violetLight, 0.22)} strokeWidth={18} />
            <path d={drawn} stroke={COLORS.text} strokeWidth={4.5} />
          </g>
        ) : null}

        {/* Secteurs violets */}
        {sectors.map((s) =>
          s.on > 0.001 ? (
            <g key={s.i} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={Math.min(1, s.on * 1.4)}>
              <path d={s.path} stroke={rgba(COLORS.violet, 0.35)} strokeWidth={30} />
              <path d={s.path} stroke={COLORS.violet} strokeWidth={13} />
              <path d={s.path} stroke={COLORS.violetLight} strokeWidth={4} />
            </g>
          ) : null,
        )}

        {/* Ligne de départ */}
        <line
          x1={s0.x - (sn.x / snl) * 26}
          y1={s0.y - (sn.y / snl) * 26}
          x2={s0.x + (sn.x / snl) * 26}
          y2={s0.y + (sn.y / snl) * 26}
          stroke={COLORS.text}
          strokeWidth={7}
          strokeLinecap="round"
          opacity={startOn}
        />

        {/* Fin de secteur : onde violette */}
        {sectors.map((s) => {
          const p = tween(frame, s.doneAt, s.doneAt + 36);
          if (p <= 0 || p >= 1) return null;
          return <circle key={s.i} cx={s.end.x} cy={s.end.y} r={16 + p * 70} fill="none" stroke={COLORS.violetLight} strokeWidth={5 * (1 - p) + 1} opacity={(1 - p) * 0.9} />;
        })}

        {/* Virages analysés : rouge au passage, vert ensuite. */}
        {TRACK.corners.map((corner, i) => {
          const redFrame = firstFrameReaching(ahead(corner.fraction));
          const greenFrame = GREEN_FROM + i * GREEN_GAP;
          if (frame < redFrame) return null;
          const c = P(corner.apex);
          const lit = pop(frame, redFrame);
          const toGreen = smooth(frame, greenFrame);
          const color = interpolateColors(toGreen, [0, 1], [COLORS.red, COLORS.green]);
          const ring = (at: number, ringColor: string) => {
            const p = tween(frame, at, at + 40);
            if (p <= 0 || p >= 1) return null;
            return <circle cx={c.x} cy={c.y} r={18 + p * 72} fill="none" stroke={ringColor} strokeWidth={5 * (1 - p) + 1} opacity={(1 - p) * 0.9} />;
          };
          return (
            <g key={i}>
              {ring(redFrame, COLORS.red)}
              {ring(greenFrame + 3, COLORS.green)}
              <circle cx={c.x} cy={c.y} r={26 * lit} fill={rgba(color, 0.3)} />
              <circle cx={c.x} cy={c.y} r={15 * lit + 4 * Math.sin(toGreen * Math.PI)} fill={color} stroke={COLORS.bg} strokeWidth={6} />
            </g>
          );
        })}

        {headOpacity > 0.01 ? (
          <g opacity={headOpacity}>
            <circle cx={head.x} cy={head.y} r={40} fill="url(#cometGlow)" />
            <circle cx={head.x} cy={head.y} r={10} fill={COLORS.text} />
          </g>
        ) : null}
      </svg>

      {/* Haut assombri pour le titre, tant que la photo ou le dézoom passent dessous. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 860,
          // Entre en fondu avec la photo : la scène précédente (vidéo du stand) est encore visible dessous.
          opacity: tween(frame, 0, PHOTO.in, EASE_IN_OUT) * Math.max(photoOpacity, 1 - tween(frame, DEZOOM.to - 10, DEZOOM.to + 20, EASE_IN_OUT)),
          background: `linear-gradient(180deg, ${rgba(COLORS.bg, 0.96)} 0%, ${rgba(COLORS.bg, 0.88)} 52%, ${rgba(COLORS.bg, 0)} 100%)`,
        }}
      />

      {/* Étiquettes de secteur, droites au-dessus du plan incliné. */}
      {sectors.map((s) => {
        if (s.on <= 0.001) return null;
        const bounce = pop(frame, s.doneAt);
        return (
          <div
            key={s.i}
            style={{
              position: "absolute",
              left: s.label.x,
              top: s.label.y,
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

      <KineticTitle text={title} frame={frame} start={8} stagger={6} bigSize={176} style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y + 36 }} />
    </AbsoluteFill>
  );
};
