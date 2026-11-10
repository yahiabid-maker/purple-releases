import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { GlassCard } from "../components/GlassCard";
import { Headline } from "../components/Text";
import { FONT_MONO, FONT_TEXT } from "../fonts";
import { rise, sceneExit, smooth, tween } from "../lib/anim";
import type { DebriefRow } from "../texts";
import { BEAT, COLORS, CONTENT, SCENES, rgba } from "../theme";

const DURATION = SCENES.debrief.duration;

/** Les trois lignes glissent à un demi-temps d'écart, à partir du 1er temps. */
const ROWS_FROM = BEAT - 6;
const ROWS_GAP = BEAT / 2;

const parseDelta = (delta: string) => Math.abs(parseFloat(delta.replace("−", "-").replace(",", "."))) || 0;

/**
 * Scène 5 (14–17 s) : carte « Débrief » avec le top 3 des virages où gagner du temps.
 */
export const SceneDebrief: React.FC<{ label: string; title: string; rows: DebriefRow[] }> = ({
  label,
  title,
  rows,
}) => {
  const frame = useCurrentFrame();
  const exit = sceneExit(frame, DURATION);
  const cardIn = smooth(frame, 2);
  const biggest = Math.max(...rows.map((r) => parseDelta(r.delta)), 0.001);

  return (
    <AbsoluteFill>
      <GlassCard
        sheen={tween(frame, 8, 58, Easing.inOut(Easing.quad))}
        style={{
          position: "absolute",
          left: CONTENT.x,
          top: 352,
          width: CONTENT.w,
          opacity: Math.min(1, cardIn * 1.2) * (1 - exit),
          transform: `translate3d(0, ${(1 - cardIn) * 70 - exit * 28}px, 0) scale(${0.97 + cardIn * 0.03})`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontFamily: FONT_TEXT,
            fontWeight: 600,
            fontSize: 56,
            lineHeight: "68px",
            color: COLORS.violetLight,
            ...rise(smooth(frame, 6), 0, { distance: 22 }),
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: COLORS.violetLight,
              boxShadow: `0 0 18px ${COLORS.violet}`,
            }}
          />
          {label}
        </div>

        <Headline text={title} frame={frame} start={9} stagger={4} size={110} style={{ marginTop: 12 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 38 }}>
          {rows.map((row, i) => {
            const at = ROWS_FROM + i * ROWS_GAP;
            const slide = smooth(frame, at);
            const bar = tween(frame, at + 8, at + 44);
            const share = parseDelta(row.delta) / biggest;
            const first = i === 0;
            // « −0,18 s » : le nombre et son unité, séparés par une espace fine.
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
                  background: first ? rgba(COLORS.violet, 0.2) : rgba(COLORS.text, 0.05),
                  boxShadow: `inset 0 0 0 1.5px ${first ? rgba(COLORS.violetLight, 0.5) : rgba(COLORS.text, 0.12)}`,
                  opacity: Math.min(1, slide * 1.2),
                  transform: `translate3d(${(1 - slide) * 90}px, 0, 0)`,
                }}
              >
                {/* Barre de gain : proportionnelle au temps à gagner dans ce virage. */}
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
                <div
                  style={{
                    position: "relative",
                    flex: 1,
                    fontFamily: FONT_TEXT,
                    fontWeight: 600,
                    fontSize: 56,
                    letterSpacing: "-0.015em",
                    color: COLORS.text,
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    position: "relative",
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    fontSize: 60,
                    letterSpacing: "-0.03em",
                    color: first ? COLORS.text : COLORS.violetLight,
                    whiteSpace: "nowrap",
                  }}
                >
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
