/**
 * Mesure de texte dans le navigateur, avec la vraie police et tous ses réglages
 * (graisse, axes variables, interlettrage) : les mots géants sont calibrés au pixel
 * près sur la largeur disponible, quel que soit le texte.
 * À n'appeler qu'une fois les polices chargées (voir useFontsReady).
 */
export type Face = {
  /** Pile de polices CSS (ex. `"Purple Titre", "Fraunces"`). */
  family: string;
  weight: number;
  italic?: boolean;
  /** Valeur CSS de font-variation-settings. */
  variation?: string;
  /** Interlettrage, en em. */
  tracking?: number;
};

let probe: HTMLSpanElement | null = null;
const cache = new Map<string, number>();
const SIZE = 200;

/** Largeur d'un texte en em (largeur en px ÷ corps). */
export const widthEm = (text: string, face: Face) => {
  if (!text) return 0;
  const key = [face.family, face.weight, face.italic ? "i" : "n", face.variation ?? "", face.tracking ?? 0, text].join("|");
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  // Hors navigateur (jamais pendant un rendu) : estimation grossière.
  if (typeof document === "undefined") return text.length * 0.5;
  if (!probe) {
    probe = document.createElement("span");
    Object.assign(probe.style, { position: "absolute", left: "-100000px", top: "0", whiteSpace: "pre", visibility: "hidden", fontSize: `${SIZE}px` });
    document.body.appendChild(probe);
  }
  probe.style.fontFamily = face.family;
  probe.style.fontWeight = String(face.weight);
  probe.style.fontStyle = face.italic ? "italic" : "normal";
  probe.style.fontVariationSettings = face.variation ?? "normal";
  probe.style.letterSpacing = `${face.tracking ?? 0}em`;
  probe.textContent = text;
  const width = probe.getBoundingClientRect().width / SIZE;
  cache.set(key, width);
  return width;
};
