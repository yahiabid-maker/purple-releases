import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { GlassCard } from "../components/GlassCard";
import { Headline } from "../components/Text";
import { FONT_MONO, FONT_TEXT, FONT_TITLE } from "../fonts";
import { CLAMP, sceneExit, smooth, tween } from "../lib/anim";
import { BEAT, COLORS, CONTENT, SCENES, rgba } from "../theme";

const DURATION = SCENES.delta.duration;

/** Le delta défile de 0 à sa valeur finale, puis se pose avant la mesure suivante. */
const COUNT = { from: 22, to: 100 };
/** Les puces passent au violet une par temps, à partir de 8 s. */
const CHIPS_FROM = DURATION / 2 - 5;

const DIGIT_SIZE = 196;
const LINE = Math.round(DIGIT_SIZE * 1.1);
const CELL = Math.round(DIGIT_SIZE * 0.6);

const valueAt = (frame: number, target: number) =>
  Math.abs(target) *
  interpolate(frame, [COUNT.from, COUNT.to], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });

/** Position d'un rouleau de chiffres, façon compteur : il ne tourne que lorsque le rouleau à sa droite passe de 9 à 0. */
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
  // Flou de mouvement vertical proportionnel à la vitesse : pas de scintillement quand ça défile vite.
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
      <div
        style={{
          transform: `translate3d(0, ${-(offset % 10) * LINE}px, 0)`,
          filter: blur > 0.5 ? `url(#${id})` : undefined,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit, i) => (
          <div key={i} style={cellStyle}>
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Scène 3 (6–10 s) : une carte en verre affiche un delta qui défile jusqu'à
 * −0,412, puis les puces S1, S2 et S3 passent au violet l'une après l'autre.
 */
export const SceneDelta: React.FC<{
  title: string;
  label: string;
  value: number;
  sectors: string[];
}> = ({ title, label, value, sectors }) => {
  const frame = useCurrentFrame();
  const exit = sceneExit(frame, DURATION);
  const cardIn = smooth(frame, 4);

  const current = valueAt(frame, value);
  const previous = valueAt(frame - 1, value);
  const settle = Math.sin(tween(frame, COUNT.to - 4, COUNT.to + 40, Easing.out(Easing.quad)) * Math.PI);
  const whole = Math.floor(Math.abs(value));
  const sign = value < 0 ? "−" : "+";

  // Jauge : la part de gain, remplie depuis le centre vers la gauche.
  const gauge = Math.min(1, current / 0.5);

  return (
    <AbsoluteFill>
      <Headline
        text={title}
        frame={frame}
        exit={exit}
        size={124}
        style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y + 44, width: CONTENT.w }}
      />

      <GlassCard
        sheen={tween(frame, 14, 64, Easing.inOut(Easing.quad))}
        style={{
          position: "absolute",
          left: CONTENT.x,
          top: 696,
          width: CONTENT.w,
          opacity: Math.min(1, cardIn * 1.2) * (1 - exit),
          transform: `translate3d(0, ${(1 - cardIn) * 70 - exit * 28}px, 0) scale(${0.97 + cardIn * 0.03})`,
        }}
      >
        <div
          style={{
            fontFamily: FONT_TEXT,
            fontWeight: 600,
            fontSize: 56,
            lineHeight: "68px",
            color: rgba(COLORS.text, 0.72),
          }}
        >
          {label}
        </div>

        {/* Le delta : JetBrains Mono, chiffres en rouleaux. */}
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
            // Halo sur l'ensemble du nombre : un text-shadow serait coupé par la fenêtre de chaque rouleau.
            filter: `drop-shadow(0 0 ${(16 + settle * 26).toFixed(1)}px ${rgba(COLORS.violet, 0.5 + settle * 0.4)})`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <div style={cellStyle}>{sign}</div>
          <div style={cellStyle}>{whole}</div>
          {/* La virgule garde sa chasse, mais on resserre les blancs autour. */}
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

        {/* Jauge de gain */}
        <div
          style={{
            position: "relative",
            height: 10,
            marginTop: 22,
            borderRadius: 5,
            background: rgba(COLORS.text, 0.09),
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "50%",
              top: 0,
              bottom: 0,
              width: `${gauge * 50}%`,
              borderRadius: 5,
              background: `linear-gradient(90deg, ${COLORS.violetLight}, ${COLORS.violet})`,
              boxShadow: `0 0 22px ${rgba(COLORS.violet, 0.8)}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -9,
              width: 4,
              height: 28,
              marginLeft: -2,
              borderRadius: 2,
              background: rgba(COLORS.text, 0.6),
            }}
          />
        </div>

        {/* Puces de secteur */}
        <div style={{ display: "flex", gap: 20, marginTop: 50 }}>
          {sectors.map((sector, i) => {
            const at = CHIPS_FROM + i * BEAT;
            const on = smooth(frame, at);
            const fill = tween(frame, at, at + 16);
            return (
              <div
                key={sector}
                style={{
                  position: "relative",
                  flex: 1,
                  height: 124,
                  borderRadius: 32,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: rgba(COLORS.text, 0.06),
                  boxShadow: `inset 0 0 0 1.5px ${rgba(COLORS.text, 0.14 + on * 0.18)}, 0 0 ${on * 56}px ${rgba(COLORS.violet, on * 0.7)}`,
                  transform: `scale(${1 + 0.045 * Math.sin(Math.PI * tween(frame, at, at + 24, Easing.out(Easing.quad)))})`,
                }}
              >
                {/* Le violet remplit la puce de gauche à droite. */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(180deg, ${rgba(COLORS.violetLight, 0.35)} 0%, ${rgba(COLORS.violet, 0)} 46%), ${COLORS.violet}`,
                    // Balayage à bord doux, de gauche à droite.
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
            );
          })}
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};
