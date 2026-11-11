# Purple — vidéo TikTok (22 s)

Vidéo verticale 1080 × 1920, 60 i/s, 22 s, sans audio (la musique s'ajoute dans TikTok).
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

Balisage des titres (une ligne par `\n`) :

| Écriture | Rendu |
| --- | --- |
| `# du temps.` | ligne géante : Barlow Semi Condensed 800 italique, en capitales, calée sur la largeur (≥ 110 px) |
| `Tu perds` | ligne d'appui : Barlow Semi Condensed 600 italique, bas de casse (≥ 56 px) |
| `*Purple*` | mot en violet |
| `[jaunes.\|verts.\|violets.]` | mot dans une pastille violette ; les mots défilent et elle se pose sur le dernier |

Exemple : `"Tu perds\n# du temps."` affiche « Tu perds » en petit puis « DU TEMPS. » en géant.
Les mots sortent d'un masque un par un, dans l'ordre de lecture. Les lignes géantes sont
mesurées avec la vraie police : chacune prend le plus grand corps qui tient sur la largeur.

## Typographie

| Usage | Police |
| --- | --- |
| Mots géants, titres de cartes, puces S1/S2/S3 | Barlow Semi Condensed 800 italique, capitales |
| Lignes d'appui des titres | Barlow Semi Condensed 600 italique |
| Interface des cartes (libellés, sous-titre du coach, lignes du débrief) | Inter 500/600 |
| Chronos et deltas | JetBrains Mono 800 |

Les styles sont dans `src/components/Text.tsx` ; ne mélange pas d'autre police dans un titre.

Les variantes d'accroche sont dans `hookVariants`, en bas du même fichier.

Ces textes sont les props de la composition. On peut donc aussi rendre une accroche à
l'essai sans toucher au code :

```console
npx remotion render PurpleTikTok out/essai.mp4 --props='{"hook":["Ta phrase","# *en géant*."]}'
```

Pour prévisualiser et régler à l'image près : `npm run dev` (Remotion Studio).

## Logo

Dépose ton fichier dans **`public/logo.svg`**. Il est affiché tel quel dans la scène 6, jamais
redessiné. Tant que le fichier est absent, la scène affiche le nom « Purple » en texte à la place
(prop `logoFallback`).

## Photo et circuit de la scène 2

La scène 2 s'ouvre sur **`public/photo-circuit.jpg`** (photo aérienne), qui se fond dans le
tracé réel de Spa-Francorchamps. Pour changer de photo, remplace ce fichier ou change la prop
`trackPhoto` dans `src/texts.ts` (`""` pour s'en passer).

**Droits** : cette photo vient de Pinterest, son auteur n'est pas identifié. Avant toute
publication, obtiens une licence ou remplace-la par une photo dont tu as les droits.

Le tracé vient des données « f1-circuits » de Tomislav Bacinger (licence MIT,
<https://github.com/bacinger/f1-circuits>), non officielles. Les limites de secteurs
(S1 jusqu'aux Combes, S2 jusqu'à la sortie de Stavelot) sont approximatives et se règlent
dans `src/lib/spa.ts`.

## Vidéo de l'arrêt aux stands

La séquence de 2 à 4 s lit **`public/pitstop.mp4`** (extrait à partir de 3,6 s, à 1,2×, sans le son),
en fondu enchaîné entre l'accroche et la photo aérienne. Un chrono tourne pendant l'arrêt et se
fige quand la voiture repart ; la légende est la prop `pitStopCaption`.
Pour changer de vidéo, remplace le fichier ou la prop `pitStopVideo` (`""` pour s'en passer).
L'extrait, l'instant du départ (`LAUNCH`) et le temps affiché (`STOP_SECONDS`) se règlent en haut
de `src/scenes/SceneB_PitStop.tsx`.

**Droits** : cette vidéo vient de Pinterest et montre une monoplace et une équipe identifiables.
Elle n'est pas versionnée. Avant publication, obtiens les droits ou remplace-la.

## Drapeau à damier

Les scènes 1 et 6 posent en bas de l'image **`public/drapeau.mp4`** : une simulation de tissu
filmée sur fond noir. Un filtre (`src/components/Flag.tsx`) rend le noir transparent et teinte
les cases en violet ; n'importe quelle vidéo claire sur fond noir fonctionne donc à sa place.
Prop `flagVideo` (`""` pour s'en passer). L'extrait dure 3,9 s et ne boucle pas.

Le fichier livré est la vidéo d'origine (720 × 720, 30 i/s) agrandie en 1080 × 1080 et
interpolée à 60 i/s avec ffmpeg :

```console
ffmpeg -i source.mp4 -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,scale=1080:1080:flags=lanczos,unsharp=5:5:0.5:5:5:0.0" -c:v libx264 -crf 14 -an public/drapeau.mp4
```

**Droits** : cette boucle vient de Pinterest ; c'est une création d'Alan Finch (Cinema 4D) pour
une marque de boissons. Elle n'est pas versionnée. Avant publication, obtiens une licence ou
remplace-la par un drapeau dont tu as les droits.

## Images de contrôle

```console
npm run stills
```

- `out/controle/` : une image au milieu de chaque scène, plus l'état final de chaque scène ;
- `out/controle-zones/` : les mêmes, avec les zones réservées à l'interface TikTok en rouge
  (180 px en haut, 420 px en bas, 140 px à droite). Rien d'important ne doit s'y trouver ;
  le contenu s'arrête 4 px avant la zone de droite.

Le calque de zones s'active aussi dans le Studio avec la prop `showSafeZones`.

Pour vérifier une animation image par image (un seul lancement, plusieurs images) :

```console
node scripts/frames.mjs 0,20,30          # → out/images/image-0000.png, …
node scripts/frames.mjs 464-490:2        # la transition de 8 s, une image sur deux
```

## Repères

| Fichier | Rôle |
| --- | --- |
| `src/texts.ts` | Tous les textes (props par défaut) et les variantes d'accroche |
| `src/theme.ts` | Couleurs, zones sûres, découpage des scènes, tempo (120 BPM) |
| `src/fonts.ts` | Polices (Barlow Semi Condensed, Inter, JetBrains Mono) |
| `src/components/Text.tsx` | Styles typographiques (mots géants, lignes d'appui, chiffres) |
| `src/lib/measure.ts` | Mesure réelle des textes, pour caler les mots géants au pixel |
| `src/scenes/` | Une scène du storyboard par fichier |
| `src/components/Kinetic.tsx` | Titres en typographie cinétique (masques mot à mot, appui/géant, pastille) |
| `src/components/Flag.tsx` | Drapeau à damier : incrustation et teinte violette de la vidéo |
| `src/components/LightLine.tsx` | La ligne de lumière : elle tombe dans l'accroche, puis efface les scènes 2 et 4 |
| `src/components/Background.tsx` | Lueurs qui dérivent et respirent sur le tempo, grain |
| `src/components/GlassCard.tsx` | Carte en verre dépoli |
| `src/components/Neon.tsx` | Pastille néon (micro), cercles lumineux qui s'agrandissent |
| `src/components/Bloom.tsx` | Transition « éclosion » de la scène 3 vers la scène 4 |
| `src/scenes/SceneB_PitStop.tsx` | Arrêt aux stands (2–4 s) : vidéo en fondu enchaîné, étalonnage, chrono, légende |
| `src/components/LiquidWipe.tsx` | Transition liquide de la scène 5 vers la scène 6 |
| `src/components/Hud.tsx` | Équerres discrètes en bas de la zone utile |
| `src/components/SafeZones.tsx` | Calque de contrôle des zones TikTok |
| `src/lib/spa.ts` | Tracé réel de Spa-Francorchamps, virages mis en avant, limites de secteurs |
| `src/lib/track.ts` | Mise à l'échelle et lissage du tracé, projection 3D des étiquettes |

Rythme : un temps = 30 images, une mesure = 2 s. Les changements de scène tombent sur
0, 2, 4, 8, 12, 16 et 19 s ; à l'intérieur des scènes, les événements tombent sur les temps.

## Licence Remotion

Remotion est gratuit pour un particulier ou une entreprise de 3 salariés au plus, usage
commercial compris ; au-delà, il faut une licence entreprise. Texte de référence :
`node_modules/remotion/LICENSE.md` et <https://www.remotion.pro/license>.
