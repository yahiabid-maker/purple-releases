import type { CSSProperties } from "react";
import { FONT_MONO, FONT_TEXT, FONT_TITLE, TITLE_VARIATION } from "../fonts";
import type { Face } from "../lib/measure";
import { COLORS, TYPE } from "../theme";

/**
 * Système typographique de la vidéo.
 *  - Mots géants : serif rétro très gras (Bropella une fois le fichier déposé,
 *    Fraunces en attendant), en bas de casse, écrits tels qu'ils sont saisis.
 *  - Lignes d'appui et interface des cartes : Inter.
 *  - Chronos et deltas : JetBrains Mono.
 */
export const DISPLAY_TRACKING = -0.018;
export const DISPLAY_LEADING = 1;
export const LEAD_LEADING = 1.2;
const LEAD_TRACKING = -0.015;

export const DISPLAY_FACE: Face = { family: FONT_TITLE, weight: 900, variation: TITLE_VARIATION, tracking: DISPLAY_TRACKING };
export const LEAD_FACE: Face = { family: FONT_TEXT, weight: 600, tracking: LEAD_TRACKING };

/** Mot géant : jamais sous 110 px. */
export const displayStyle = (size: number = TYPE.titleMin): CSSProperties => ({
  fontFamily: FONT_TITLE,
  fontWeight: 900,
  fontVariationSettings: TITLE_VARIATION,
  fontSize: Math.max(size, TYPE.titleMin),
  lineHeight: DISPLAY_LEADING,
  letterSpacing: `${DISPLAY_TRACKING}em`,
  color: COLORS.text,
});

/** Ligne d'appui d'un titre : jamais sous 56 px. */
export const leadStyle = (size: number = 64): CSSProperties => ({
  fontFamily: FONT_TEXT,
  fontWeight: 600,
  fontSize: Math.max(size, TYPE.textMin),
  lineHeight: LEAD_LEADING,
  letterSpacing: `${LEAD_TRACKING}em`,
  color: COLORS.text,
});

/** Chiffres : JetBrains Mono très gras, chiffres à chasse fixe. */
export const monoStyle = (size: number): CSSProperties => ({
  fontFamily: FONT_MONO,
  fontWeight: 800,
  fontSize: size,
  lineHeight: 1,
  letterSpacing: "-0.04em",
  fontVariantNumeric: "tabular-nums",
  color: COLORS.text,
});
