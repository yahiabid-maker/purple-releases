import { Easing, interpolate } from "remotion";
import { CLAMP } from "./anim";
import { HEIGHT } from "../theme";

/**
 * Transition de l'accroche vers la scène 2 (inspirée d'un plan zénithal d'arrêt aux
 * stands) : la caméra file vers le bas sur une bande d'asphalte fléchée, une
 * monoplace traverse le cadre, et l'on atterrit sur la photo aérienne.
 *
 * Images en temps global. Le contenu monte de `panAt(frame)` pixels.
 */
export const PAN = { from: 100, to: 146, band: 2400 };
export const PAN_DISTANCE = HEIGHT + PAN.band;
const ease = Easing.bezier(0.62, 0, 0.22, 1);

export const panAt = (frame: number) => PAN_DISTANCE * ease(interpolate(frame, [PAN.from, PAN.to], [0, 1], CLAMP));
export const panSpeed = (frame: number) => panAt(frame) - panAt(frame - 1);
/** Flou de mouvement vertical, proportionnel à la vitesse du travelling. */
export const panBlur = (frame: number) => Math.min(42, panSpeed(frame) * 0.32);
/** Décalage vertical de la scène 2 pendant qu'elle arrive par le bas. */
export const scene2Offset = (frame: number) => Math.max(0, PAN_DISTANCE - panAt(frame));

/** Passage de la monoplace (temps global) : elle traverse l'écran de haut en bas. */
export const CAR_PASS = { from: 103, to: 135 };
