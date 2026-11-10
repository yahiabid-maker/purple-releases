// Identité visuelle Purple + grille de la vidéo. Ne pas ajouter de couleur hors palette.

export const FPS = 60;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION_IN_FRAMES = 22 * FPS;

/** 120 BPM à 60 i/s : un temps = 30 images, une mesure (2 s) = 120 images. */
export const BEAT = 30;

export const COLORS = {
  bg: "#0B0B10",
  surface: "#15151D",
  violet: "#8B3DFF",
  violetLight: "#B98CFF",
  text: "#F4F4F6",
  // Couleurs sémantiques, utilisées uniquement pour les virages de la scène 2.
  red: "#FF4D5E",
  green: "#3DDC97",
} as const;

/** Zones réservées à l'interface TikTok (rien d'important dedans). */
export const SAFE = { top: 180, bottom: 420, right: 140, left: 80 } as const;

/** Rectangle utile : x 80 → 936 (4 px de marge avant la zone de droite), y 180 → 1500. */
export const CONTENT = {
  x: SAFE.left,
  y: SAFE.top,
  w: WIDTH - SAFE.left - SAFE.right - 4,
  h: HEIGHT - SAFE.top - SAFE.bottom,
} as const;

/** Axe vertical des compositions centrées (milieu de la zone utile, pas de l'écran). */
export const CENTER_X = CONTENT.x + CONTENT.w / 2;

/** Découpage du storyboard, en images. Toutes les bornes tombent sur un temps. */
export const SCENES = {
  hook: { from: 0, duration: 2 * FPS },
  pit: { from: 2 * FPS, duration: 2 * FPS },
  track: { from: 4 * FPS, duration: 4 * FPS },
  delta: { from: 8 * FPS, duration: 4 * FPS },
  coach: { from: 12 * FPS, duration: 4 * FPS },
  debrief: { from: 16 * FPS, duration: 3 * FPS },
  outro: { from: 19 * FPS, duration: 3 * FPS },
} as const;

/** Tailles minimales imposées pour la lecture sur téléphone. */
export const TYPE = { titleMin: 110, textMin: 56 } as const;

export const rgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};
