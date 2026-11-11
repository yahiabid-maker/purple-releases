/**
 * Mesure de texte dans le navigateur, avec la vraie police : les mots géants sont
 * calibrés au pixel près sur la largeur disponible, quel que soit le texte.
 * À n'appeler qu'une fois les polices chargées (voir useFontsReady).
 */
export type Face = { family: string; weight: number; italic?: boolean };

let context: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

/** Largeur d'un texte en em (largeur en px ÷ corps), sans interlettrage. */
export const widthEm = (text: string, face: Face) => {
  if (!text) return 0;
  const key = `${face.italic ? "i" : "n"}${face.weight}|${face.family}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  // Hors navigateur (jamais pendant un rendu) : estimation grossière.
  if (typeof document === "undefined") return text.length * 0.5;
  context ??= document.createElement("canvas").getContext("2d");
  if (!context) return text.length * 0.5;
  const family = /^["']/.test(face.family) ? face.family : `"${face.family}"`;
  context.font = `${face.italic ? "italic " : ""}${face.weight} 200px ${family}`;
  const width = context.measureText(text).width / 200;
  cache.set(key, width);
  return width;
};
