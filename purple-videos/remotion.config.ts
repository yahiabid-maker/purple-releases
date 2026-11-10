/**
 * Réglages de rendu de la vidéo TikTok Purple.
 * Toutes les options : https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setOverwriteOutput(true);

// Sortie : MP4 H.264, sans piste audio (la musique est ajoutée dans TikTok).
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setCrf(16);
// BT.709 : les couleurs de la marque restent fidèles après encodage.
Config.setColorSpace("bt709");
// Images intermédiaires sans perte : pas d'artefacts JPEG dans les dégradés sombres.
Config.setVideoImageFormat("png");
Config.setStillImageFormat("png");

// Certaines images (3D + flous) sont lourdes en rendu logiciel : on laisse jusqu'à 2 min
// par image avant d'abandonner, au lieu de 30 s par défaut.
Config.setDelayRenderTimeoutInMilliseconds(120000);

// Facultatif : utiliser un Chrome déjà installé (CI, machine sans accès au
// téléchargement automatique du navigateur de rendu).
const browser = process.env.REMOTION_BROWSER_EXECUTABLE;
if (browser) {
  Config.setBrowserExecutable(browser);
  Config.setChromeMode("chrome-for-testing");
}
