import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { Easing } from "remotion";
import { RichText, titleStyle } from "../components/Text";
import { CLAMP, rise, sceneExit, smooth } from "../lib/anim";
import { COLORS, CONTENT, HEIGHT, SCENES, WIDTH, rgba } from "../theme";

const DURATION = SCENES.hook.duration;

/** La ligne met 36 images à traverser l'écran, en accélérant comme une chute. */
const FALL_FRAMES = 36;
const fallAt = (frame: number) =>
  -60 +
  interpolate(frame, [0, FALL_FRAMES], [0, 1], { ...CLAMP, easing: Easing.bezier(0.5, 0, 0.78, 0.62) }) * (HEIGHT + 160);

/** Le 2e temps de l'accroche part un peu avant le temps pour être posé dessus (1 s). */
const SECOND_BEAT_START = 38;

/**
 * Scène 1 (0–2 s) : fond noir, une ligne violette tombe à travers l'écran comme
 * un chrono qui tombe, et révèle l'accroche sur son passage.
 */
export const SceneHook: React.FC<{ hook: string[] }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const exit = sceneExit(frame, DURATION);
  const lineY = fallAt(frame);
  const speed = fallAt(frame) - fallAt(frame - 1);

  // Image à laquelle la ligne passe sur le texte : le texte y prend sa teinte violette, puis blanchit.
  let passFrame = 0;
  while (passFrame < FALL_FRAMES && fallAt(passFrame) < HEIGHT * 0.42) passFrame++;
  const firstColor = interpolateColors(frame, [passFrame, passFrame + 22], [COLORS.violetLight, COLORS.text]);

  const [first, second] = hook;
  const column: React.CSSProperties = {
    position: "absolute",
    left: CONTENT.x,
    top: CONTENT.y,
    width: CONTENT.w,
    height: CONTENT.h - 90,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 10,
    ...titleStyle(110),
  };

  // Les deux temps sont rendus dans deux calques superposés et identiques : seul
  // le premier est découpé par la ligne, le second arrive ensuite avec un ressort.
  const blocks = (visible: 0 | 1, secondStyle?: React.CSSProperties) => (
    <div style={column}>
      <div style={{ visibility: visible === 0 ? "visible" : "hidden", color: firstColor }}>
        <RichText text={first ?? ""} />
      </div>
      {second ? (
        <div style={{ visibility: visible === 1 ? "visible" : "hidden", ...secondStyle }}>
          <RichText text={second} />
        </div>
      ) : null}
    </div>
  );

  return (
    <AbsoluteFill>
      {/* Temps 1 : visible uniquement au-dessus de la ligne qui tombe. */}
      <AbsoluteFill
        style={{
          clipPath: `inset(0px 0px ${Math.max(0, HEIGHT - lineY)}px 0px)`,
          opacity: 1 - exit,
          transform: `translate3d(0, ${-exit * 28}px, 0)`,
        }}
      >
        {blocks(0)}
      </AbsoluteFill>

      {/* Temps 2. */}
      <AbsoluteFill>{blocks(1, rise(smooth(frame, SECOND_BEAT_START), exit))}</AbsoluteFill>

      {/* Rémanence : la lumière de la ligne s'éteint doucement en bas de l'écran. */}
      <div
        style={{
          position: "absolute",
          left: -200,
          width: WIDTH + 400,
          top: HEIGHT - 620,
          height: 900,
          background: `radial-gradient(closest-side, ${rgba(COLORS.violet, 0.34)} 0%, ${rgba(COLORS.violet, 0.1)} 55%, ${rgba(COLORS.violet, 0)} 100%)`,
          opacity: interpolate(frame, [FALL_FRAMES - 10, FALL_FRAMES + 2, DURATION], [0, 1, 0.35], CLAMP) * (1 - exit),
        }}
      />

      {/* La ligne et sa traîne. */}
      {lineY < HEIGHT + 80 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              width: WIDTH,
              top: lineY - Math.min(520, speed * 9),
              height: Math.min(520, speed * 9),
              background: `linear-gradient(to top, ${rgba(COLORS.violet, 0.3)} 0%, ${rgba(COLORS.violet, 0.08)} 45%, ${rgba(COLORS.violet, 0)} 100%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              width: WIDTH,
              top: lineY - 2,
              height: 4,
              background: `linear-gradient(90deg, ${COLORS.violet} 0%, ${COLORS.violetLight} 22%, ${COLORS.text} 50%, ${COLORS.violetLight} 78%, ${COLORS.violet} 100%)`,
              boxShadow: `0 0 18px 3px ${COLORS.violet}, 0 0 90px 14px ${rgba(COLORS.violet, 0.6)}`,
            }}
          />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
