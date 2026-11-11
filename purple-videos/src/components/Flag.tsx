import React from "react";
import { OffthreadVideo, staticFile } from "remotion";
import { useStaticFile } from "../lib/useStaticFile";
import { FPS, HEIGHT, WIDTH } from "../theme";

/**
 * Drapeau à damier : une simulation de tissu filmée sur fond noir, posée en bas de
 * l'image. Un filtre convertit la luminance en transparence et en couleur : le noir
 * disparaît, les cases prennent le violet de la charte et les reflets tirent vers le
 * blanc. Le drapeau se pose donc sur n'importe quel fond, sans mode de fusion.
 *
 * L'extrait ne boucle pas : `startAt` + la durée affichée doivent rester sous 3,9 s.
 */

// Dégradé appliqué selon la luminance (0 → 1, cinq paliers) :
// transparent → violet #8B3DFF → violet clair #B98CFF → presque blanc #F4F4F6.
const RAMP = {
  r: "0.545 0.545 0.588 0.725 0.925",
  g: "0.239 0.239 0.333 0.549 0.885",
  b: "1 1 1 1 0.975",
  a: "0 0.66 0.92 1 1",
};
const FILTER_ID = "flag-violet";

export const Flag: React.FC<{
  video: string;
  /** Instant de départ dans la vidéo, en secondes. */
  startAt?: number;
  /** Côté du carré vidéo à l'écran : il est centré et calé sur le bas de l'image. */
  size?: number;
  /** Décalage vertical (px) : positif = le drapeau descend. */
  offsetY?: number;
  opacity?: number;
  /** Miroir horizontal : la crête monte vers la droite. */
  flip?: boolean;
}> = ({ video, startAt = 0, size = 1180, offsetY = 0, opacity = 1, flip = false }) => {
  const ready = useStaticFile(video, "video") === "ready";
  if (!ready || opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: (WIDTH - size) / 2,
        top: HEIGHT - size + offsetY,
        width: size,
        height: size,
        opacity,
        pointerEvents: "none",
        // Le tissu s'assombrit vers le bas : la lumière reste sur la crête.
        maskImage: "linear-gradient(180deg, #000 0%, #000 52%, rgba(0, 0, 0, 0.55) 100%)",
        WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 52%, rgba(0, 0, 0, 0.55) 100%)",
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={FILTER_ID} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          {/* Les quatre canaux reçoivent la luminance… */}
          <feColorMatrix
            type="matrix"
            values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0"
          />
          {/* …puis chacun suit sa rampe : couleur et transparence. */}
          <feComponentTransfer>
            <feFuncR type="table" tableValues={RAMP.r} />
            <feFuncG type="table" tableValues={RAMP.g} />
            <feFuncB type="table" tableValues={RAMP.b} />
            <feFuncA type="table" tableValues={RAMP.a} />
          </feComponentTransfer>
        </filter>
      </svg>
      <OffthreadVideo
        src={staticFile(video)}
        muted
        trimBefore={Math.round(startAt * FPS)}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
          transform: flip ? "scaleX(-1)" : undefined,
          filter: `brightness(1.16) contrast(1.1) url(#${FILTER_ID})`,
        }}
      />
    </div>
  );
};
