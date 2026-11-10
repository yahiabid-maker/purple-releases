import { loadFont as loadTitle } from "@remotion/google-fonts/BarlowSemiCondensed";
import { loadFont as loadText } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// On ne charge que les graisses et le sous-ensemble utilisés : rendu plus rapide.
const options = { subsets: ["latin" as const] };

/** Titres : Barlow Semi Condensed, très gras. */
export const FONT_TITLE = loadTitle("normal", { ...options, weights: ["800"] }).fontFamily;
/** Texte courant : Inter. */
export const FONT_TEXT = loadText("normal", { ...options, weights: ["500", "600"] }).fontFamily;
/** Chronos et deltas : JetBrains Mono. */
export const FONT_MONO = loadMono("normal", { ...options, weights: ["500", "700"] }).fontFamily;
