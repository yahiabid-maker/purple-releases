import React from "react";
import { AbsoluteFill, Easing, interpolateColors, useCurrentFrame } from "remotion";
import { GlassCard } from "../components/GlassCard";
import { NeonMic, Ring } from "../components/Neon";
import { titleStyle } from "../components/Text";
import { FONT_TEXT } from "../fonts";
import { rise, smooth, tween } from "../lib/anim";
import { BEAT, CENTER_X, COLORS, CONTENT, SCENES, rgba } from "../theme";

const DURATION = SCENES.coach.duration;

/** La phrase du coach est « dite » entre ces deux images ; la note arrive sur le temps de 11,5 s. */
const SPEECH = { from: 26, to: 132 };
const NOTE_AT = 3 * BEAT - 6;

// Mise en page de la carte (px).
const CARD_TOP = 290;
const PAD = 48;
const HEADER_H = 120;
const ORB_ZONE = 430;
const ORB_SIZE = 200;
const BARS = 60;
const BAR_BASE = 128;
const BAR_MAX = 72;

/** Centre de la sphère, en coordonnées écran : la transition depuis la scène 3 s'y condense. */
export const ORB_CENTER = { x: CENTER_X, y: CARD_TOP + PAD + HEADER_H + 24 + ORB_ZONE / 2 };

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

/** Niveau de la voix : une bosse par mot ; au repos, la sphère respire doucement. */
const voiceAt = (frame: number, slots: ReturnType<typeof schedule>) => {
  let level = 0.2 + 0.06 * Math.sin(frame / 11);
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
 * Scène 4 (10–14 s) : carte « Coach vocal ». Au centre, une sphère lumineuse
 * entourée d'une onde circulaire qui suit la voix ; le sous-titre s'allume mot à mot.
 */
export const SceneCoach: React.FC<{ title: string; subtitle: string; note: string }> = ({ title, subtitle, note }) => {
  const frame = useCurrentFrame();
  const exit = tween(frame, DURATION - 14, DURATION, Easing.in(Easing.cubic));
  const cardIn = smooth(frame, 6);
  const orbIn = smooth(frame, 12);
  const slots = schedule(subtitle);
  const level = voiceAt(frame, slots);

  const zoneCenter = { x: CONTENT.w / 2 - PAD, y: ORB_ZONE / 2 };

  return (
    <AbsoluteFill>
      <GlassCard
        padding={PAD}
        sheen={tween(frame, 12, 62, Easing.inOut(Easing.quad))}
        style={{
          position: "absolute",
          left: CONTENT.x,
          top: CARD_TOP,
          width: CONTENT.w,
          opacity: Math.min(1, cardIn * 1.2) * (1 - exit),
          transform: `translate3d(0, ${(1 - cardIn) * 60 - exit * 60}px, 0) scale(${0.95 + cardIn * 0.05})`,
          filter: exit > 0.01 ? `blur(${(exit * 10).toFixed(2)}px)` : undefined,
        }}
      >
        <div style={{ height: HEADER_H, display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ transform: `scale(${0.6 + 0.4 * smooth(frame, 10)})`, opacity: smooth(frame, 10) }}>
            <NeonMic size={104} glow={0.8 + 0.4 * level} />
          </div>
          <div style={{ ...titleStyle(120), whiteSpace: "nowrap", ...rise(smooth(frame, 14), 0, { distance: 26 }) }}>{title}</div>
        </div>

        {/* Sphère et onde circulaire */}
        <div style={{ position: "relative", height: ORB_ZONE, marginTop: 24 }}>
          {slots.map((slot, i) => (
            <Ring key={i} x={zoneCenter.x} y={zoneCenter.y} progress={tween(frame, slot.from, slot.from + 46)} from={130} to={300} width={2} />
          ))}
          {Array.from({ length: BARS }, (_, i) => {
            const angle = (i / BARS) * 360;
            // L'onde tourne lentement et chaque barre suit la voix avec un léger décalage.
            const phase = (i * 7) % BARS;
            const local = voiceAt(frame - (phase % 6), slots);
            const wobble = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame * 0.31 + i * 1.7)) * (0.6 + 0.4 * Math.sin(frame * 0.17 + i * 0.9));
            const length = 8 + BAR_MAX * local * wobble * orbIn;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: zoneCenter.x - 4,
                  top: zoneCenter.y - BAR_BASE - length,
                  width: 8,
                  height: length,
                  borderRadius: 4,
                  background: `linear-gradient(0deg, ${COLORS.violet} 0%, ${COLORS.violetLight} 100%)`,
                  boxShadow: `0 0 12px ${rgba(COLORS.violet, 0.6)}`,
                  transformOrigin: `4px ${BAR_BASE + length}px`,
                  transform: `rotate(${angle + frame * 0.25}deg)`,
                  opacity: orbIn * (0.55 + 0.45 * local),
                }}
              />
            );
          })}
          <div
            style={{
              position: "absolute",
              left: zoneCenter.x - ORB_SIZE / 2,
              top: zoneCenter.y - ORB_SIZE / 2,
              width: ORB_SIZE,
              height: ORB_SIZE,
              borderRadius: "50%",
              background: `radial-gradient(circle at 36% 30%, ${COLORS.text} 0%, ${COLORS.violetLight} 24%, ${COLORS.violet} 62%, ${rgba(COLORS.violet, 0.9)} 100%)`,
              boxShadow: `0 0 ${50 + 50 * level}px ${rgba(COLORS.violet, 0.85)}, 0 0 ${140 + 80 * level}px ${rgba(COLORS.violet, 0.45)}`,
              transform: `scale(${(0.4 + 0.6 * orbIn) * (0.94 + 0.1 * level)})`,
              opacity: orbIn,
            }}
          />
        </div>

        {/* Sous-titre : chaque mot s'allume quand il est prononcé. */}
        <div
          style={{
            marginTop: 20,
            textAlign: "center",
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
            const color = interpolateColors(said + done, [0, 1, 2], [rgba(COLORS.text, 0.4), COLORS.violetLight, COLORS.text]);
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
          left: CONTENT.x,
          top: 1196,
          width: CONTENT.w,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          fontFamily: FONT_TEXT,
          fontWeight: 500,
          fontSize: 56,
          lineHeight: "72px",
          color: rgba(COLORS.text, 0.88),
          ...rise(smooth(frame, NOTE_AT), exit, { distance: 30 }),
        }}
      >
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: COLORS.violet, boxShadow: `0 0 18px ${COLORS.violet}` }} />
        {note}
      </div>
    </AbsoluteFill>
  );
};
