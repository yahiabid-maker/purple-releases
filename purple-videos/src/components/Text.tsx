import React from "react";
import type { CSSProperties } from "react";
import { FONT_TITLE } from "../fonts";
import { rise, smooth } from "../lib/anim";
import { COLORS, TYPE } from "../theme";

/** Mot d'accent : violet de la marque, net (un halo clair derrière réduirait son contraste). */
export const ACCENT: CSSProperties = {
  color: COLORS.violet,
};

/** Rend « un *mot* en violet » : les passages entre astérisques prennent l'accent. */
export const RichText: React.FC<{ text: string; accent?: CSSProperties }> = ({ text, accent }) => (
  <>
    {text.split("*").map((part, i) =>
      i % 2 === 1 ? (
        <span key={i} style={{ ...ACCENT, ...accent }}>
          {part}
        </span>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      ),
    )}
  </>
);

export const titleStyle = (size: number = TYPE.titleMin): CSSProperties => ({
  fontFamily: FONT_TITLE,
  fontWeight: 800,
  fontSize: Math.max(size, TYPE.titleMin),
  lineHeight: 1.03,
  letterSpacing: "-0.012em",
  color: COLORS.text,
  textWrap: "balance",
});

/** Titre multi-lignes : chaque ligne monte et se met au net, en léger décalé. */
export const Headline: React.FC<{
  text: string;
  frame: number;
  start?: number;
  stagger?: number;
  exit?: number;
  size?: number;
  style?: CSSProperties;
}> = ({ text, frame, start = 0, stagger = 5, exit = 0, size, style }) => (
  <div style={{ ...titleStyle(size), ...style }}>
    {text.split("\n").map((line, i) => (
      <div key={i} style={rise(smooth(frame, start + i * stagger), exit)}>
        <RichText text={line} />
      </div>
    ))}
  </div>
);
