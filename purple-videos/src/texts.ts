/**
 * ─────────────────────────────────────────────────────────────
 *  TOUS LES TEXTES DE LA VIDÉO SE MODIFIENT ICI.
 * ─────────────────────────────────────────────────────────────
 *  Ce sont les props par défaut de la composition : on peut aussi
 *  les surcharger sans toucher au code, avec --props='{"hook":["…","…"]}'.
 *
 *  Balisage des titres (une ligne par \n) :
 *    « # texte »   ligne géante (Barlow Semi Condensed très gras)
 *    « texte »     ligne courte (Inter)
 *    « *mot* »     mot en violet
 *    « [a|b|c] »   mot dans une pastille violette ; les mots défilent
 *                  et la pastille se pose sur le dernier ([mot] pour un seul)
 *
 *  Rappel lisibilité : lignes géantes ≥ 110 px (réduites automatiquement
 *  si elles sont trop longues, jamais en dessous), lignes courtes ≥ 56 px.
 */

export type DebriefRow = { label: string; delta: string };

export type PurpleTikTokProps = {
  /** Scène 1 — accroche en deux temps. */
  hook: string[];
  /** Arrêt aux stands — vidéo dans public/ ("" pour s'en passer) et sa légende. */
  pitStopVideo: string;
  pitStopCaption: string;
  /** Scène 2 — tracé du circuit. */
  trackTitle: string;
  /** Photo aérienne d'ouverture de la scène 2, dans public/ ("" pour s'en passer). */
  trackPhoto: string;
  /** Scène 3 — carte delta. */
  deltaTitle: string;
  deltaLabel: string;
  /** Valeur finale du delta, en secondes (affichée « −0,412 »). */
  deltaValue: number;
  sectors: string[];
  /** Mot géant en contour qui défile derrière la carte (décor). */
  deltaEcho: string;
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
  hook: ["Tu perds\n# du temps.", "# *Purple*\nsait où."],

  pitStopVideo: "pitstop.mp4",
  pitStopCaption: "Au stand, tout se joue\n# au *dixième*.",

  trackTitle: "Chaque virage\n# *analysé.*",
  trackPhoto: "photo-circuit.jpg",

  deltaTitle: "Fais tomber des secteurs\n# [jaunes.|verts.|violets.]",
  deltaLabel: "Delta",
  deltaValue: -0.412,
  sectors: ["S1", "S2", "S3"],
  deltaEcho: "VIOLET",

  coachTitle: "Coach vocal",
  coachSubtitle: "Freine 10 mètres plus tard au virage 3.",
  coachNote: "Pendant que tu roules.",

  debriefLabel: "Débrief",
  debriefTitle: "# Top 3\ndes virages où gagner du temps",
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
  "PurpleTikTok-Accroche2": ["Ton meilleur\n# tour", "n’est pas encore\n# *écrit*."],
  "PurpleTikTok-Accroche3": ["Un\n# *coach IA*\nqui te parle", "pendant que\n# tu roules."],
} as const;
