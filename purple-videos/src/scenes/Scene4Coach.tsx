import React from "react";
import { AbsoluteFill, Easing, interpolateColors, useCurrentFrame } from "remotion";
import { GlassCard } from "../components/GlassCard";
import { titleStyle } from "../components/Text";
import { FONT_TEXT } from "../fonts";
import { rise, sceneExit, smooth, tween } from "../lib/anim";
import { BEAT, COLORS, CONTENT, SCENES, rgba } from "../theme";

const DURATION = SCENES.coach.duration;

/** La phrase du coach est « dite » entre ces deux images ; la note arrive sur le temps de 11,5 s. */
const SPEECH = { from: 20, to: 128 };
const NOTE_AT = 3 * BEAT - 6;

const BARS = 34;
const WAVE_HEIGHT = 250;

/** Découpe la phrase en mots avec un temps de parole proportionnel à leur longueur. */
const schedule = (sentence: string) => {
  const words = sentence.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => 2.2 + w.length);
  const total = weights.reduce((a, b) => a + b, 0);
  let cursor = SPEECH.from;
  return words.map((word, i) => {
    const length = ((SPEECH.to - SPEECH.from) * weights[i]) / total;
    const slot = { word, from: cursor, to: cursor + length };
    cursor += length;
    return slot;
  });
};

/** Niveau de la voix à une image donnée : une bosse par mot, un creux entre deux mots. */
const voiceAt = (frame: number, slots: ReturnType<typeof schedule>) => {
  // Au repos, l'onde respire doucement : le coach écoute.
  let level = 0.24 + 0.06 * Math.sin(frame / 11);
  for (const slot of slots) {
    const p = (frame - slot.from) / (slot.to - slot.from);
    if (p > -0.2 && p < 1.5) {
      const bump = p < 0.22 ? Math.max(0, p + 0.2) / 0.42 : Math.max(0, 1 - (p - 0.22) / 1.28);
      level = Math.max(level, 0.3 + 0.7 * bump);
    }
  }
  return level;
};

/**
 * Scène 4 (10–14 s) : carte « Coach vocal », forme d'onde animée et sous-titre
 * qui s'affiche mot à mot, comme une voix qui parle.
 */
export const SceneCoach: React.FC<{ title: string; subtitle: string; note: string }> = ({
  title,
  subtitle,
  note,
}) => {
  const frame = useCurrentFrame();
  const exit = sceneExit(frame, DURATION);
  const cardIn = smooth(frame, 2);
  const slots = schedule(subtitle);
  const speaking = voiceAt(frame, slots) > 0.25;

  return (
    <AbsoluteFill>
      <GlassCard
        sheen={tween(frame, 8, 58, Easing.inOut(Easing.quad))}
        style={{
          position: "absolute",
          left: CONTENT.x,
          top: 420,
          width: CONTENT.w,
          opacity: Math.min(1, cardIn * 1.2) * (1 - exit),
          transform: `translate3d(0, ${(1 - cardIn) * 70 - exit * 28}px, 0) scale(${0.97 + cardIn * 0.03})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ ...titleStyle(112), ...rise(smooth(frame, 8), 0, { distance: 26 }) }}>{title}</div>
          {/* Témoin « en direct » */}
          <div
            style={{
              position: "relative",
              width: 30,
              height: 30,
              marginRight: 6,
              borderRadius: "50%",
              background: speaking ? COLORS.violetLight : rgba(COLORS.violetLight, 0.6),
              boxShadow: `0 0 ${16 + 16 * Math.sin(frame / 7)}px ${COLORS.violet}`,
            }}
          />
        </div>

        {/* Forme d'onde */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: WAVE_HEIGHT,
            marginTop: 34,
          }}
        >
          {Array.from({ length: BARS }, (_, i) => {
            const center = (i - (BARS - 1) / 2) / ((BARS - 1) / 2);
            const bell = 0.32 + 0.68 * Math.exp(-center * center * 2.1);
            // Chaque barre suit la voix avec un léger retard depuis le centre : l'onde se propage.
            const level = voiceAt(frame - Math.abs(center) * 5, slots);
            const wobble =
              0.42 +
              0.58 *
                (0.5 + 0.5 * Math.sin(frame * 0.29 + i * 1.31)) *
                (0.55 + 0.45 * Math.sin(frame * 0.173 + i * 0.77 + 1.3));
            const height = Math.max(12, WAVE_HEIGHT * level * bell * wobble);
            return (
              <div
                key={i}
                style={{
                  width: 12,
                  height,
                  borderRadius: 6,
                  background: `linear-gradient(180deg, ${COLORS.violetLight} 0%, ${COLORS.violet} 55%, ${COLORS.violetLight} 100%)`,
                  boxShadow: `0 0 ${10 + level * 22}px ${rgba(COLORS.violet, 0.35 + level * 0.4)}`,
                  opacity: (0.55 + 0.45 * level) * cardIn,
                }}
              />
            );
          })}
        </div>

        {/* Sous-titre : chaque mot s'allume quand il est prononcé. */}
        <div
          style={{
            marginTop: 34,
            fontFamily: FONT_TEXT,
            fontWeight: 600,
            fontSize: 66,
            lineHeight: 1.22,
            letterSpacing: "-0.015em",
            textWrap: "balance",
          }}
        >
          {slots.map((slot, i) => {
            const said = tween(frame, slot.from - 2, slot.from + 9);
            const done = tween(frame, slot.to, slot.to + 14);
            const color = interpolateColors(
              said + done,
              [0, 1, 2],
              [rgba(COLORS.text, 0.4), COLORS.violetLight, COLORS.text],
            );
            return (
              <React.Fragment key={i}>
                <span style={{ color }}>{slot.word}</span>
                {i < slots.length - 1 ? " " : null}
              </React.Fragment>
            );
          })}
        </div>
      </GlassCard>

      {/* Petit texte, sous la carte */}
      <div
        style={{
          position: "absolute",
          // Le texte s'aligne sur la colonne de texte de la carte (x = 128).
          left: CONTENT.x + 16,
          top: 1170,
          width: CONTENT.w - 32,
          display: "flex",
          alignItems: "center",
          gap: 24,
          fontFamily: FONT_TEXT,
          fontWeight: 500,
          fontSize: 56,
          lineHeight: "72px",
          color: rgba(COLORS.text, 0.86),
          ...rise(smooth(frame, NOTE_AT), exit, { distance: 30 }),
        }}
      >
        <div
          style={{
            width: 8,
            height: 56,
            borderRadius: 4,
            background: COLORS.violet,
            boxShadow: `0 0 20px ${rgba(COLORS.violet, 0.8)}`,
          }}
        />
        {note}
      </div>
    </AbsoluteFill>
  );
};
