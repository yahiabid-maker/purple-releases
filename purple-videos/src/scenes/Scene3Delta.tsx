import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { GlassCard } from "../components/GlassCard";
import { KineticTitle } from "../components/Kinetic";
import { Ring } from "../components/Neon";
import { FONT_MONO, FONT_TEXT, FONT_TITLE } from "../fonts";
import { CLAMP, sceneExit, smooth, tween } from "../lib/anim";
import { BEAT, COLORS, CONTENT, SCENES, rgba } from "../theme";

const DURATION = SCENES.delta.duration;

/** Le delta défile de 0 à sa valeur finale, puis se pose avant la mesure suivante. */
const COUNT = { from: 22, to: 100 };
/** Les puces passent au violet une par temps, à partir de 8 s. */
const CHIPS_FROM = DURATION / 2 - 5;

// Mise en page de la carte (px) : fixée pour que la transition suivante parte de S3.
const CARD_TOP = 540;
const PAD = 48;
const INNER = CONTENT.w - 2 * PAD;
const LABEL_H = 68;
const DIGIT_SIZE = 196;
const LINE = Math.round(DIGIT_SIZE * 1.1);
const CELL = Math.round(DIGIT_SIZE * 0.6);
const CHART_H = 190;
const CHIP_H = 116;
const CHIP_GAP = 20;
const CHIP_W = (INNER - 2 * CHIP_GAP) / 3;
const CHIPS_TOP = PAD + LABEL_H + 6 + LINE + 14 + CHART_H + 28;

/** Centre de la puce S3, en coordonnées écran : point de départ de la transition vers la scène 4. */
export const S3_CENTER = {
  x: CONTENT.x + PAD + 2 * (CHIP_W + CHIP_GAP) + CHIP_W / 2,
  y: CARD_TOP + CHIPS_TOP + CHIP_H / 2,
};

/** Courbe de delta sur le tour (0 → −0,412 s), gagnée surtout dans les virages. */
const CURVE = [0, -0.005, -0.02, -0.06, -0.09, -0.1, -0.16, -0.22, -0.25, -0.31, -0.36, -0.39, -0.412];
const curveAt = (t: number, target: number) => {
  const x = Math.max(0, Math.min(1, t)) * (CURVE.length - 1);
  const i = Math.min(CURVE.length - 2, Math.floor(x));
  const k = x - i;
  const s = (1 - Math.cos(k * Math.PI)) / 2;
  const v = CURVE[i] + (CURVE[i + 1] - CURVE[i]) * s;
  return (v / CURVE[CURVE.length - 1]) * Math.abs(target);
};
const progressAt = (frame: number) =>
  interpolate(frame, [COUNT.from, COUNT.to], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });

const chartY = (gain: number, target: number) => 30 + (gain / Math.abs(target)) * (CHART_H - 60);

/** Position d'un rouleau de chiffres : il ne tourne que lorsque le rouleau à sa droite passe de 9 à 0. */
const rollAt = (value: number, column: number) => {
  const p = (value * 1000) / 10 ** column + 1e-6;
  if (column === 0) return p;
  const whole = Math.floor(p);
  return whole + Math.max(0, Math.min(1, (p - whole - 0.9) / 0.1));
};

const cellStyle: React.CSSProperties = {
  width: CELL,
  height: LINE,
  lineHeight: `${LINE}px`,
  textAlign: "center",
  flexShrink: 0,
};

const Roller: React.FC<{ offset: number; speed: number; id: string }> = ({ offset, speed, id }) => {
  const blur = Math.min(46, speed * LINE * 0.17);
  return (
    <div
      style={{
        ...cellStyle,
        overflow: "hidden",
        maskImage: "linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%)",
      }}
    >
      {blur > 0.5 ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-5%" y="-10%" width="110%" height="120%">
            <feGaussianBlur stdDeviation={`0 ${blur.toFixed(1)}`} />
          </filter>
        </svg>
      ) : null}
      <div style={{ transform: `translate3d(0, ${-(offset % 10) * LINE}px, 0)`, filter: blur > 0.5 ? `url(#${id})` : undefined }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit, i) => (
          <div key={i} style={cellStyle}>
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Mot géant en contour qui défile derrière la carte (on le voit flouté à travers le verre). */
const Echo: React.FC<{ word: string; frame: number; opacity: number }> = ({ word, frame, opacity }) => (
  <>
    {[
      { top: CARD_TOP - 40, dx: -260, dir: -1 },
      { top: CARD_TOP + 260, dx: -700, dir: 1 },
      { top: CARD_TOP + 560, dx: -380, dir: -1 },
    ].map((row, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: row.dx + row.dir * frame * 1.1,
          top: row.top,
          whiteSpace: "nowrap",
          fontFamily: FONT_TITLE,
          fontWeight: 800,
          fontSize: 300,
          lineHeight: 1,
          letterSpacing: "0.02em",
          color: "transparent",
          WebkitTextStroke: `2.5px ${rgba(COLORS.violetLight, 0.22)}`,
          opacity,
        }}
      >
        {`${word} ${word} ${word} ${word}`}
      </div>
    ))}
  </>
);

/**
 * Scène 3 (6–10 s) : une carte en verre affiche un delta qui défile jusqu'à
 * −0,412 en suivant la courbe du tour, puis les puces S1, S2 et S3 passent au
 * violet l'une après l'autre.
 */
export const SceneDelta: React.FC<{
  title: string;
  label: string;
  value: number;
  sectors: string[];
  echo: string;
}> = ({ title, label, value, sectors, echo }) => {
  const frame = useCurrentFrame();
  const exit = sceneExit(frame, DURATION);
  const cardIn = smooth(frame, 4);

  const progress = progressAt(frame);
  const current = curveAt(progress, value);
  const previous = curveAt(progressAt(frame - 1), value);
  const settle = Math.sin(tween(frame, COUNT.to - 4, COUNT.to + 40, Easing.out(Easing.quad)) * Math.PI);
  const whole = Math.floor(Math.abs(value));
  const sign = value < 0 ? "−" : "+";

  // Courbe échantillonnée, puis découpée à la progression courante.
  const samples = Array.from({ length: 121 }, (_, i) => i / 120);
  const pathD = samples.map((t, i) => `${i ? "L" : "M"} ${(t * INNER).toFixed(1)} ${chartY(curveAt(t, value), value).toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${INNER} 30 L 0 30 Z`;
  const dot = { x: progress * INNER, y: chartY(current, value) };

  return (
    <AbsoluteFill>
      <Echo word={echo} frame={frame} opacity={tween(frame, 0, 24) * (1 - exit)} />

      <KineticTitle
        text={title}
        frame={frame}
        start={2}
        stagger={4}
        bigSize={150}
        exit={exit}
        style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y + 36 }}
      />

      <GlassCard
        padding={PAD}
        sheen={tween(frame, 14, 64, Easing.inOut(Easing.quad))}
        style={{
          position: "absolute",
          left: CONTENT.x,
          top: CARD_TOP,
          width: CONTENT.w,
          opacity: Math.min(1, cardIn * 1.2) * (1 - exit),
          transform: `perspective(1600px) translate3d(0, ${(1 - cardIn) * 90 + Math.sin(frame / 45) * 5 - exit * 28}px, 0) rotateX(${(1 - cardIn) * 16}deg) rotateY(${(1 - cardIn) * -12}deg)`,
        }}
      >
        <div style={{ height: LABEL_H, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: FONT_TEXT, fontWeight: 600, fontSize: 56, color: rgba(COLORS.text, 0.72) }}>{label}</div>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: COLORS.violetLight,
              boxShadow: `0 0 ${14 + 14 * Math.sin(frame / 9)}px ${COLORS.violet}`,
            }}
          />
        </div>

        {/* Le delta : JetBrains Mono, chiffres en rouleaux, halo qui s'intensifie à l'arrivée. */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 6,
            marginLeft: -20,
            marginRight: -20,
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: DIGIT_SIZE,
            color: COLORS.text,
            filter: `drop-shadow(0 0 ${(16 + settle * 26).toFixed(1)}px ${rgba(COLORS.violet, 0.5 + settle * 0.4)})`,
          }}
        >
          <div style={cellStyle}>{sign}</div>
          <div style={cellStyle}>{whole}</div>
          <div style={{ ...cellStyle, margin: `0 ${-Math.round(CELL * 0.2)}px` }}>,</div>
          {[2, 1, 0].map((column) => (
            <Roller
              key={column}
              id={`delta-roll-${column}`}
              offset={rollAt(current, column)}
              speed={Math.abs(rollAt(current, column) - rollAt(previous, column))}
            />
          ))}
        </div>

        {/* Courbe du delta sur le tour, avec le point lumineux qui la trace. */}
        <svg width={INNER} height={CHART_H} style={{ display: "block", marginTop: 14, overflow: "visible" }}>
          <defs>
            <linearGradient id="deltaArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.violet} stopOpacity={0.05} />
              <stop offset="100%" stopColor={COLORS.violet} stopOpacity={0.45} />
            </linearGradient>
            <clipPath id="deltaClip">
              <rect x={-20} y={-40} width={progress * INNER + 20} height={CHART_H + 80} />
            </clipPath>
          </defs>
          <line x1={0} y1={30} x2={INNER} y2={30} stroke={rgba(COLORS.text, 0.25)} strokeWidth={2} strokeDasharray="8 10" />
          <g clipPath="url(#deltaClip)">
            <path d={areaD} fill="url(#deltaArea)" />
            <path d={pathD} fill="none" stroke={COLORS.violetLight} strokeWidth={5} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${COLORS.violet})` }} />
          </g>
          {progress > 0.001 ? (
            <g>
              <circle cx={dot.x} cy={dot.y} r={26} fill={rgba(COLORS.violet, 0.55)} style={{ filter: "blur(10px)" }} />
              <circle cx={dot.x} cy={dot.y} r={10} fill={COLORS.text} />
            </g>
          ) : null}
        </svg>

        {/* Puces de secteur */}
        <div style={{ display: "flex", gap: CHIP_GAP, marginTop: 28 }}>
          {sectors.map((sector, i) => {
            const at = CHIPS_FROM + i * BEAT;
            const on = smooth(frame, at);
            const fill = tween(frame, at, at + 16);
            const bump = Math.sin(Math.PI * tween(frame, at, at + 24, Easing.out(Easing.quad)));
            return (
              <div key={sector} style={{ position: "relative", width: CHIP_W, height: CHIP_H }}>
                <Ring x={CHIP_W / 2} y={CHIP_H / 2} progress={tween(frame, at + 2, at + 40)} from={60} to={190} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 32,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: rgba(COLORS.text, 0.06),
                    boxShadow: `inset 0 0 0 1.5px ${rgba(COLORS.text, 0.14 + on * 0.18)}, 0 0 ${on * 56}px ${rgba(COLORS.violet, on * 0.7)}`,
                    transform: `scale(${1 + 0.06 * bump})`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(180deg, ${rgba(COLORS.violetLight, 0.35)} 0%, ${rgba(COLORS.violet, 0)} 46%), ${COLORS.violet}`,
                      maskImage: `linear-gradient(90deg, #000 ${fill * 140 - 40}%, transparent ${fill * 140}%)`,
                      WebkitMaskImage: `linear-gradient(90deg, #000 ${fill * 140 - 40}%, transparent ${fill * 140}%)`,
                    }}
                  />
                  <div
                    style={{
                      position: "relative",
                      fontFamily: FONT_TITLE,
                      fontWeight: 800,
                      fontSize: 66,
                      letterSpacing: "0.01em",
                      color: rgba(COLORS.text, 0.6 + on * 0.4),
                    }}
                  >
                    {sector}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};
