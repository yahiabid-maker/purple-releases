import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Flag } from "../components/Flag";
import { KineticTitle, estimateTitleHeight, titleLastWord } from "../components/Kinetic";
import { LightLine } from "../components/LightLine";
import { CLAMP, EASE_IN_OUT, tween } from "../lib/anim";
import { COLORS, CONTENT, HEIGHT, SCENES, WIDTH, rgba } from "../theme";

const DURATION = SCENES.hook.duration;

/** La ligne de lumière met 36 images à traverser l'écran, en accélérant comme une chute. */
const FALL_FRAMES = 36;
/** Elle est déjà en mouvement à la première image : rien n'attend. */
const FALL_START = -5;
const fallAt = (frame: number) =>
  -60 +
  interpolate(frame, [FALL_START, FALL_START + FALL_FRAMES], [0, 1], { ...CLAMP, easing: Easing.bezier(0.5, 0, 0.78, 0.62) }) *
    (HEIGHT + 160);

/**
 * Le 1er bloc sort au passage de la ligne, le 2e enchaîne juste après. Le rythme des
 * mots se resserre pour les accroches longues : tout est posé avant 1 s.
 */
const BLOCK_A = 7;
const LAST_WORD_BY = 50;
const plan = (a: string, b: string | undefined, stagger: number) => {
  const startB = titleLastWord(a, BLOCK_A, stagger) + 4;
  const end = b ? titleLastWord(b, startB, stagger) : titleLastWord(a, BLOCK_A, stagger);
  return { stagger, startB, end };
};
const BIG = 216;
const SMALL = 74;
const BLOCK_GAP = 22;
/** Le texte occupe le haut de la zone utile ; le drapeau, le bas de l'image. */
const TEXT_ZONE = { top: 220, bottom: 960 };

/**
 * Scène 1 (0–2 s) : une ligne de lumière violette tombe à travers l'écran ; l'accroche
 * sort mot à mot dans son sillage, en capitales géantes, et le drapeau à damier
 * s'allume en bas de l'image quand la ligne l'atteint.
 */
export const SceneHook: React.FC<{ hook: string[]; flag: string }> = ({ hook, flag }) => {
  const frame = useCurrentFrame();
  const lineY = fallAt(frame);
  const speed = fallAt(frame) - fallAt(frame - 1);

  const [a = "", b] = hook;
  const timing = [4, 3].map((s) => plan(a, b, s)).find((t) => t.end <= LAST_WORD_BY) ?? plan(a, b, 3);
  const sizes = { bigSize: BIG, smallSize: SMALL };
  const hA = estimateTitleHeight(a, sizes);
  const hB = b ? estimateTitleHeight(b, sizes) : 0;
  const total = hA + (b ? BLOCK_GAP + hB : 0);
  const top = TEXT_ZONE.top + Math.max(0, (TEXT_ZONE.bottom - TEXT_ZONE.top - total) / 2);

  // Sortie : fondu enchaîné vers l'arrêt aux stands, avec une très légère poussée.
  const exit = tween(frame, DURATION - 14, DURATION - 1, EASE_IN_OUT);
  // Le drapeau reste dans la pénombre tant que la ligne ne l'a pas dépassé.
  const lit = tween(frame, 16, FALL_START + FALL_FRAMES + 4, EASE_IN_OUT);

  return (
    <AbsoluteFill style={{ opacity: 1 - exit, transform: `scale(${1 + 0.04 * exit})` }}>
      {/* Lueur derrière le drapeau. */}
      <div
        style={{
          position: "absolute",
          left: -260,
          width: WIDTH + 520,
          top: HEIGHT - 1040,
          height: 1300,
          background: `radial-gradient(closest-side, ${rgba(COLORS.violet, 0.42)} 0%, ${rgba(COLORS.violet, 0.14)} 55%, ${rgba(COLORS.violet, 0)} 100%)`,
          opacity: 0.25 + 0.75 * lit,
        }}
      />

      <Flag video={flag} startAt={0} size={1180} offsetY={64 - 76 * (frame / DURATION)} opacity={0.3 + 0.7 * lit} />

      {/* Le bas de l'image s'éteint doucement : c'est la zone de l'interface TikTok. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 560,
          background: `linear-gradient(180deg, ${rgba(COLORS.bg, 0)} 0%, ${rgba(COLORS.bg, 0.72)} 100%)`,
        }}
      />

      <div style={{ position: "absolute", left: CONTENT.x, top, width: CONTENT.w }}>
        <KineticTitle text={a} frame={frame} start={BLOCK_A} stagger={timing.stagger} {...sizes} />
        {b ? <KineticTitle text={b} frame={frame} start={timing.startB} stagger={timing.stagger} {...sizes} style={{ marginTop: BLOCK_GAP }} /> : null}
      </div>

      <LightLine y={lineY} speed={speed} />
    </AbsoluteFill>
  );
};
