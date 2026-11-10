import type { CSSProperties } from "react";
import { FONT_TITLE } from "../fonts";
import { COLORS, TYPE } from "../theme";

/** Style des titres : Barlow Semi Condensed très gras, jamais sous 110 px. */
export const titleStyle = (size: number = TYPE.titleMin): CSSProperties => ({
  fontFamily: FONT_TITLE,
  fontWeight: 800,
  fontSize: Math.max(size, TYPE.titleMin),
  lineHeight: 1.03,
  letterSpacing: "-0.012em",
  color: COLORS.text,
  textWrap: "balance",
});
