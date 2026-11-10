import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { KineticTitle, estimateTitleHeight, titleLastWord } from "../components/Kinetic";
import { CLAMP, EASE_IN, smooth, tween } from "../lib/anim";
import { COLORS, CONTENT, HEIGHT, SCENES, WIDTH, rgba } from "../theme";

const DURATION = SCENES.hook.duration;

/** La ligne met 36 images à traverser l'écran, en accélérant comme une chute. */
const FALL_FRAMES = 36;
const fallAt = (frame: number) =>
  -60 +
  interpolate(frame, [0, FALL_FRAMES], [0, 1], { ...CLAMP, easing: Easing.bezier(0.5, 0, 0.78, 0.62) }) * (HEIGHT + 160);

/**
 * Le 1er bloc apparaît au passage de la ligne, le 2e enchaîne juste après.
 * Le rythme des mots se resserre pour les accroches longues : tout doit être
 * posé vers 1 s, au milieu de la scène.
 */
const BLOCK_A = 15;
const LAST_WORD_BY = 50;
const plan = (a: string, b: string | undefined, stagger: number) => {
  const startB = titleLastWord(a, BLOCK_A, stagger) + 4;
  const end = b ? titleLastWord(b, startB, stagger) : titleLastWord(a, BLOCK_A, stagger);
  return { stagger, startB, end };
};
const BIG = 168;
const SMALL = 64;
const BLOCK_GAP = 30;

/**
 * Scène 1 (0–2 s) : fond noir, une ligne violette tombe à travers l'écran comme
 * un chrono qui tombe ; l'accroche se construit mot à mot dans son sillage.
 */
export const SceneHook: React.FC<{ hook: string[] }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const lineY = fallAt(frame);
  const speed = fallAt(frame) - fallAt(frame - 1);

  const [a = "", b] = hook;
  const timing = [4, 3].map((s) => plan(a, b, s)).find((t) => t.end <= LAST_WORD_BY) ?? plan(a, b, 3);
  const hA = estimateTitleHeight(a, { bigSize: BIG, smallSize: SMALL });
  const hB = b ? estimateTitleHeight(b, { bigSize: BIG, smallSize: SMALL }) : 0;
  const total = hA + (b ? BLOCK_GAP + hB : 0);
  const top = CONTENT.y + (CONTENT.h - total) / 2 - 20;
  // Tant que le 2e bloc n'est pas là, le 1er reste centré ; il remonte quand le 2e arrive.
  const shift = b ? (1 - smooth(frame, timing.startB - 4)) * ((BLOCK_GAP + hB) / 2) : 0;

  // Sortie : léger zoom avant flouté, enchaîné sur la scène 2.
  const exit = tween(frame, DURATION - 14, DURATION, EASE_IN);

  return (
    <AbsoluteFill>
      {/* Rémanence : la lumière de la ligne s'éteint doucement en bas de l'écran. */}
      <div
        style={{
          position: "absolute",
          left: -200,
          width: WIDTH + 400,
          top: HEIGHT - 620,
          height: 900,
          background: `radial-gradient(closest-side, ${rgba(COLORS.violet, 0.34)} 0%, ${rgba(COLORS.violet, 0.1)} 55%, ${rgba(COLORS.violet, 0)} 100%)`,
          opacity: interpolate(frame, [FALL_FRAMES - 10, FALL_FRAMES + 2, DURATION], [0, 1, 0.4], CLAMP) * (1 - exit),
        }}
      />

      <div
        style={{
          position: "absolute",
          left: CONTENT.x,
          top,
          width: CONTENT.w,
          opacity: 1 - exit,
          transform: `scale(${1 + 0.14 * exit})`,
          transformOrigin: `50% ${total / 2}px`,
          filter: exit > 0.01 ? `blur(${(exit * 14).toFixed(2)}px)` : undefined,
        }}
      >
        <KineticTitle
          text={a}
          frame={frame}
          start={BLOCK_A}
          stagger={timing.stagger}
          bigSize={BIG}
          smallSize={SMALL}
          style={{ transform: `translate3d(0, ${shift}px, 0)` }}
        />
        {b ? (
          <KineticTitle
            text={b}
            frame={frame}
            start={timing.startB}
            stagger={timing.stagger}
            bigSize={BIG}
            smallSize={SMALL}
            style={{ marginTop: BLOCK_GAP }}
          />
        ) : null}
      </div>

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
