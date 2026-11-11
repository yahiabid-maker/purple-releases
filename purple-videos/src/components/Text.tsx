import type { CSSProperties } from "react";
import { FONT_MONO, FONT_TITLE } from "../fonts";
import type { Face } from "../lib/measure";
import { COLORS, TYPE } from "../theme";

/**
 * Système typographique de la vidéo.
 *  - Mots géants : Barlow Semi Condensed 800 italique, capitales serrées.
 *  - Lignes d'appui : la même famille en 600 italique, bas de casse.
 *  - Interface des cartes : Inter. Chronos et deltas : JetBrains Mono 800.
 */
export const DISPLAY_FACE: Face = { family: FONT_TITLE, weight: 800, italic: true };
export const LEAD_FACE: Face = { family: FONT_TITLE, weight: 600, italic: true };

/** Interlettrage et interlignage des mots géants (en em). */
export const DISPLAY_TRACKING = -0.012;
export const DISPLAY_LEADING = 0.88;
export const LEAD_LEADING = 1.16;

export const upper = (text: string) => text.toLocaleUpperCase("fr-FR");

/** Mot géant : jamais sous 110 px. Le texte doit être passé par upper(). */
export const displayStyle = (size: number = TYPE.titleMin): CSSProperties => ({
  fontFamily: FONT_TITLE,
  fontStyle: "italic",
  fontWeight: 800,
  fontSize: Math.max(size, TYPE.titleMin),
  lineHeight: DISPLAY_LEADING,
  letterSpacing: `${DISPLAY_TRACKING}em`,
  color: COLORS.text,
});

/** Ligne d'appui d'un titre : jamais sous 56 px. */
export const leadStyle = (size: number = 68): CSSProperties => ({
  fontFamily: FONT_TITLE,
  fontStyle: "italic",
  fontWeight: 600,
  fontSize: Math.max(size, TYPE.textMin),
  lineHeight: LEAD_LEADING,
  letterSpacing: "0.004em",
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
