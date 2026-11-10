/**
 * ─────────────────────────────────────────────────────────────
 *  TOUS LES TEXTES DE LA VIDÉO SE MODIFIENT ICI.
 * ─────────────────────────────────────────────────────────────
 *  Ce sont les props par défaut de la composition : on peut aussi
 *  les surcharger sans toucher au code, avec --props='{"hook":["…","…"]}'.
 *
 *  Mise en forme :
 *    *mot*  → le mot passe en violet (accent)
 *    \n     → saut de ligne forcé dans un titre
 *
 *  Rappel lisibilité : titres ≥ 110 px, textes ≥ 56 px. Un texte plus long
 *  passe à la ligne tout seul, il ne rétrécit pas.
 */

export type DebriefRow = { label: string; delta: string };

export type PurpleTikTokProps = {
  /** Scène 1 — accroche en deux temps (le 2e arrive sur le temps suivant). */
  hook: string[];
  /** Scène 2 — tracé du circuit. */
  trackTitle: string;
  /** Scène 3 — carte delta. */
  deltaTitle: string;
  deltaLabel: string;
  /** Valeur finale du delta, en secondes (affichée « −0,412 »). */
  deltaValue: number;
  sectors: string[];
  /** Scène 4 — coach vocal. */
  coachTitle: string;
  coachSubtitle: string;
  coachNote: string;
  /** Scène 5 — débrief. */
  debriefLabel: string;
  debriefTitle: string;
  debriefRows: DebriefRow[];
  /** Scène 6 — signature. */
  tagline: string;
  cta: string;
  /** Texte affiché à la place du logo tant que public/logo.svg est absent. */
  logoFallback: string;
  /** Contrôle qualité : affiche les zones réservées à l'interface TikTok. */
  showSafeZones: boolean;
};

export const defaultTexts: PurpleTikTokProps = {
  hook: ["Tu perds du temps.", "*Purple* sait où."],

  trackTitle: "Chaque virage\n*analysé*.",

  deltaTitle: "Fais tomber\ndes secteurs\n*violets*.",
  deltaLabel: "Delta",
  deltaValue: -0.412,
  sectors: ["S1", "S2", "S3"],

  coachTitle: "Coach vocal",
  coachSubtitle: "Freine 10 mètres plus tard au virage 3.",
  coachNote: "Pendant que tu roules.",

  debriefLabel: "Débrief",
  debriefTitle: "Top 3 des virages\noù gagner\ndu temps",
  debriefRows: [
    { label: "Virage 3", delta: "−0,18 s" },
    { label: "Virage 7", delta: "−0,11 s" },
    { label: "Virage 11", delta: "−0,07 s" },
  ],

  tagline: "Roule en *violet*.",
  cta: "Bêta gratuite · lien en bio",
  logoFallback: "Purple",

  showSafeZones: false,
};

/** Variantes d'accroche (scène 1). Chacune a sa composition dans Root.tsx. */
export const hookVariants = {
  "PurpleTikTok-Accroche2": ["Ton meilleur tour", "n’est pas encore *écrit*."],
  "PurpleTikTok-Accroche3": ["Un *coach IA* qui te parle", "pendant que tu roules."],
} as const;
