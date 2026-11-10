import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { GlassCard } from "../components/GlassCard";
import { KineticTitle } from "../components/Kinetic";
import { FONT_MONO, FONT_TEXT } from "../fonts";
import { rise, sceneExit, smooth, tween } from "../lib/anim";
import type { DebriefRow } from "../texts";
import { BEAT, COLORS, CONTENT, SCENES, rgba } from "../theme";

const DURATION = SCENES.debrief.duration;

/** Les trois lignes surgissent de la profondeur à un demi-temps d'écart, à partir du 1er temps. */
const ROWS_FROM = BEAT - 6;
const ROWS_GAP = BEAT / 2;

const CARD_TOP = 300;
const PAD = 48;
const INNER = CONTENT.w - 2 * PAD;

const parseDelta = (delta: string) => Math.abs(parseFloat(delta.replace("−", "-").replace(",", "."))) || 0;

/** Cartes floues à l'arrière-plan : elles donnent la profondeur de champ. */
const Shard: React.FC<{ x: number; y: number; w: number; h: number; frame: number; drift: number; bar: number }> = ({ x, y, w, h, frame, drift, bar }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y + Math.sin(frame / 30 + drift) * 10,
      width: w,
      height: h,
      borderRadius: 28,
      background: rgba(COLORS.surface, 0.6),
      boxShadow: `inset 0 0 0 1.5px ${rgba(COLORS.text, 0.12)}`,
      filter: "blur(7px)",
      transform: `rotate(${drift * 3}deg)`,
      overflow: "hidden",
    }}
  >
    <div style={{ position: "absolute", left: 24, right: 24, top: h / 2 - 8, height: 16, borderRadius: 8, background: rgba(COLORS.text, 0.1) }} />
    <div style={{ position: "absolute", left: 24, width: (w - 48) * bar, top: h / 2 - 8, height: 16, borderRadius: 8, background: COLORS.violet }} />
  </div>
);

/**
 * Scène 5 (14–17 s) : carte « Débrief » avec le top 3 des virages où gagner du
 * temps ; les lignes arrivent du fond de l'image, en 3D.
 */
export const SceneDebrief: React.FC<{ label: string; title: string; rows: DebriefRow[] }> = ({ label, title, rows }) => {
  const frame = useCurrentFrame();
  const exit = sceneExit(frame, DURATION);
  const cardIn = smooth(frame, 0);
  const biggest = Math.max(...rows.map((r) => parseDelta(r.delta)), 0.001);

  return (
    <AbsoluteFill>
      <div style={{ opacity: tween(frame, 0, 20) * (1 - exit) }}>
        <Shard x={620} y={200} w={290} h={120} frame={frame} drift={0.6} bar={0.7} />
        <Shard x={90} y={1340} w={340} h={140} frame={frame} drift={-0.8} bar={0.45} />
      </div>

      <GlassCard
        padding={PAD}
        sheen={tween(frame, 8, 58, Easing.inOut(Easing.quad))}
        style={{
          position: "absolute",
          left: CONTENT.x,
          top: CARD_TOP,
          width: CONTENT.w,
          opacity: Math.min(1, cardIn * 1.2) * (1 - exit),
          transform: `perspective(1600px) translate3d(0, ${(1 - cardIn) * 90 - exit * 28}px, 0) rotateX(${(1 - cardIn) * 18}deg)`,
        }}
      >
        {/* Étiquette */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            height: 84,
            padding: "0 30px 0 24px",
            borderRadius: 42,
            background: rgba(COLORS.violet, 0.16),
            boxShadow: `inset 0 0 0 1.5px ${rgba(COLORS.violetLight, 0.45)}`,
            fontFamily: FONT_TEXT,
            fontWeight: 600,
            fontSize: 56,
            color: COLORS.violetLight,
            ...rise(smooth(frame, 4), 0, { distance: 22 }),
          }}
        >
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: COLORS.violetLight, boxShadow: `0 0 16px ${COLORS.violet}` }} />
          {label}
        </div>

        <KineticTitle text={title} frame={frame} start={8} stagger={3} bigSize={230} smallSize={60} align="left" width={INNER} style={{ marginTop: 16 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 34, perspective: 1200 }}>
          {rows.map((row, i) => {
            const at = ROWS_FROM + i * ROWS_GAP;
            const p = smooth(frame, at);
            const bar = tween(frame, at + 8, at + 44);
            const share = parseDelta(row.delta) / biggest;
            const first = i === 0;
            const [number, unit] = row.delta.split(/\s+/);
            return (
              <div
                key={row.label}
                style={{
                  position: "relative",
                  height: 124,
                  borderRadius: 30,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 30px 0 24px",
                  gap: 24,
                  background: first ? rgba(COLORS.violet, 0.22) : rgba(COLORS.text, 0.05),
                  boxShadow: `inset 0 0 0 1.5px ${first ? rgba(COLORS.violetLight, 0.55) : rgba(COLORS.text, 0.12)}`,
                  opacity: Math.min(1, p * 1.3),
                  transform: `translate3d(0, ${(1 - p) * 50}px, ${(1 - p) * -520}px) rotateX(${(1 - p) * 24}deg)`,
                  filter: p < 0.97 ? `blur(${((1 - p) * 10).toFixed(2)}px)` : undefined,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    height: 7,
                    width: `${bar * share * 100}%`,
                    borderRadius: "0 4px 4px 0",
                    background: `linear-gradient(90deg, ${COLORS.violet} 0%, ${COLORS.violetLight} 100%)`,
                    boxShadow: `0 0 18px ${rgba(COLORS.violet, 0.9)}`,
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    fontSize: 56,
                    lineHeight: 1,
                    color: COLORS.text,
                    background: first ? COLORS.violet : rgba(COLORS.text, 0.1),
                    boxShadow: first ? `0 0 28px ${rgba(COLORS.violet, 0.8)}` : undefined,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ position: "relative", flex: 1, fontFamily: FONT_TEXT, fontWeight: 600, fontSize: 56, letterSpacing: "-0.015em", color: COLORS.text, whiteSpace: "nowrap" }}>
                  {row.label}
                </div>
                <div style={{ position: "relative", fontFamily: FONT_MONO, fontWeight: 700, fontSize: 60, letterSpacing: "-0.03em", color: first ? COLORS.text : COLORS.violetLight, whiteSpace: "nowrap" }}>
                  {number}
                  {unit ? <span style={{ marginLeft: "0.28em" }}>{unit}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};
