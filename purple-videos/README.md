# Purple — vidéo TikTok (20 s)

Vidéo verticale 1080 × 1920, 60 i/s, 20 s, sans audio (la musique s'ajoute dans TikTok).
Projet [Remotion](https://www.remotion.dev) autonome, séparé du dépôt de l'appli.

## Installer

```console
npm install
```

## Rendre les vidéos

```console
npm run render            # version principale       → out/purple-tiktok.mp4
npm run render:accroche2  # « Ton meilleur tour… »    → out/purple-tiktok-accroche-2.mp4
npm run render:accroche3  # « Un coach IA… »          → out/purple-tiktok-accroche-3.mp4
npm run render:all        # les trois à la suite
```

Sortie : MP4 H.264, BT.709, sans piste audio. Les réglages sont dans `remotion.config.ts`.

## Modifier les textes

Tout est dans **`src/texts.ts`** : accroches, titres, sous-titre du coach, lignes du débrief,
signature, appel à l'action.

- `*mot*` affiche le mot en violet ;
- `\n` force un saut de ligne dans un titre ;
- les variantes d'accroche sont dans `hookVariants`, en bas du même fichier.

Ces textes sont les props de la composition. On peut donc aussi rendre une accroche à
l'essai sans toucher au code :

```console
npx remotion render PurpleTikTok out/essai.mp4 --props='{"hook":["Ta phrase.","*Purple* la suite."]}'
```

Pour prévisualiser et régler à l'image près : `npm run dev` (Remotion Studio).

## Logo

Dépose ton fichier dans **`public/logo.svg`**. Il est affiché tel quel dans la scène 6, jamais
redessiné. Tant que le fichier est absent, la scène affiche le nom « Purple » en texte à la place
(prop `logoFallback`).

## Images de contrôle

```console
npm run stills
```

- `out/controle/` : une image au milieu de chaque scène, plus l'état final de chaque scène ;
- `out/controle-zones/` : les mêmes, avec les zones réservées à l'interface TikTok en rouge
  (180 px en haut, 420 px en bas, 140 px à droite). Rien d'important ne doit s'y trouver.

Le calque de zones s'active aussi dans le Studio avec la prop `showSafeZones`.

## Repères

| Fichier | Rôle |
| --- | --- |
| `src/texts.ts` | Tous les textes (props par défaut) et les variantes d'accroche |
| `src/theme.ts` | Couleurs, zones sûres, découpage des scènes, tempo (120 BPM) |
| `src/fonts.ts` | Polices (Barlow Semi Condensed, Inter, JetBrains Mono) |
| `src/scenes/` | Une scène du storyboard par fichier |
| `src/components/` | Fond (lueurs, grain), carte en verre, titres, calque de zones |
| `src/lib/track.ts` | Tracé du circuit inventé de la scène 2 |

Rythme : un temps = 30 images, une mesure = 2 s. Les changements de scène tombent sur
0, 2, 6, 10, 14 et 17 s ; à l'intérieur des scènes, les événements tombent sur les temps.

## Licence Remotion

Remotion est gratuit pour un particulier ou une entreprise de 3 salariés au plus, usage
commercial compris ; au-delà, il faut une licence entreprise. Texte de référence :
`node_modules/remotion/LICENSE.md` et <https://www.remotion.pro/license>.
