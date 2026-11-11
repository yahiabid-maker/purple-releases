import { useEffect, useState } from "react";
import { continueRender, delayRender, getStaticFiles, staticFile } from "remotion";
import { loadVariableFont as loadSerif } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadText } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

/**
 * Police des titres.
 *
 * La police retenue (Bropella, de Martype co) est payante : dépose le fichier acheté
 * dans public/fonts/ sous l'un des noms ci-dessous et elle remplace automatiquement
 * la police de secours, sans toucher au code. Tant qu'il est absent, les titres sont
 * en Fraunces (libre, licence OFL), réglée sur ses formes « rétro » les plus proches.
 */
export const TITLE_FILES = ["fonts/titre.woff2", "fonts/titre.woff", "fonts/titre.otf", "fonts/titre.ttf"];
const TITLE_LOCAL = "Purple Titre";

const serif = loadSerif("normal", { subsets: ["latin", "latin-ext"] });
/** Texte (lignes d'appui, interface des cartes) : Inter. */
const text = loadText("normal", { subsets: ["latin", "latin-ext"], weights: ["500", "600", "700"] });
/** Chronos et deltas : JetBrains Mono. */
const mono = loadMono("normal", { subsets: ["latin"], weights: ["700", "800"] });

export const FONT_TITLE = `"${TITLE_LOCAL}", "${serif.fontFamily}"`;
export const FONT_TEXT = text.fontFamily;
export const FONT_MONO = mono.fontFamily;

/**
 * Réglages de Fraunces : empattements adoucis, formes « bizarres » et grand corps.
 * Ignorés par une police non variable, donc sans effet sur la police achetée.
 */
export const TITLE_VARIATION = `"SOFT" 100, "WONK" 1, "opsz" 144`;

/** Charge la police achetée si son fichier est présent. Renvoie le fichier utilisé. */
const loadLocalTitle = async () => {
  // La liste de public/ est connue sans requête : on ne demande que les fichiers présents.
  const present = new Set(getStaticFiles().map((f) => f.name));
  for (const file of TITLE_FILES.filter((f) => present.has(f))) {
    try {
      const res = await fetch(staticFile(file));
      // Un fichier absent répond 404 (ou par une page HTML selon le serveur).
      if (!res.ok || (res.headers.get("content-type") ?? "").includes("html")) continue;
      const face = new FontFace(TITLE_LOCAL, await res.arrayBuffer(), { weight: "100 900", style: "normal" });
      await face.load();
      document.fonts.add(face);
      return file;
    } catch {
      // Fichier illisible : on essaie le suivant, puis la police de secours.
    }
  }
  return null;
};

const fontsReady =
  typeof document === "undefined"
    ? Promise.resolve()
    : Promise.all([serif.waitUntilDone(), text.waitUntilDone(), mono.waitUntilDone(), loadLocalTitle()]).then(() => undefined);

/**
 * Vrai dès que les polices sont chargées. Rien ne doit être mesuré ni rendu avant :
 * les titres sont calibrés sur la largeur réelle des mots (voir lib/measure).
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
