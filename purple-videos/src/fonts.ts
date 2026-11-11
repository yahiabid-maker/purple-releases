import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { loadFont as loadTitle } from "@remotion/google-fonts/BarlowSemiCondensed";
import { loadFont as loadText } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// On ne charge que les graisses et le sous-ensemble utilisés : rendu plus rapide.
const options = { subsets: ["latin" as const] };

/** Titres : Barlow Semi Condensed italique — 800 pour les mots géants, 600 pour les lignes d'appui. */
const title = loadTitle("italic", { ...options, weights: ["600", "800"] });
/** Texte d'interface (cartes, libellés) : Inter. */
const text = loadText("normal", { ...options, weights: ["500", "600"] });
/** Chronos et deltas : JetBrains Mono, très gras pour tenir face aux titres. */
const mono = loadMono("normal", { ...options, weights: ["700", "800"] });

export const FONT_TITLE = title.fontFamily;
export const FONT_TEXT = text.fontFamily;
export const FONT_MONO = mono.fontFamily;

const fontsReady = Promise.all([title.waitUntilDone(), text.waitUntilDone(), mono.waitUntilDone()]);

/**
 * Vrai dès que les trois polices sont chargées. Rien ne doit être mesuré ni rendu
 * avant : les titres sont calibrés sur la largeur réelle des mots (voir lib/measure).
 */
export const useFontsReady = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Chargement des polices"));
  useEffect(() => {
    let alive = true;
    fontsReady.then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  return ready;
};
