import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { KineticTitle } from "../components/Kinetic";
import { EASE_IN_OUT, tween } from "../lib/anim";
import { useStaticFile } from "../lib/useStaticFile";
import { COLORS, CONTENT, FPS, SCENES, rgba } from "../theme";

/**
 * Arrêt aux stands (2–4 s) : la vidéo vue de dessus, en fondu enchaîné depuis
 * l'accroche et vers la photo aérienne de la scène 2, avec une légende.
 *
 * La séquence déborde de OVERLAP images de chaque côté pour les fondus.
 */
export const PIT_OVERLAP = 14;
export const PIT_DURATION = SCENES.pit.duration + 2 * PIT_OVERLAP;

/** Extrait utilisé : à partir de 3,6 s dans la source, lu à 1,2× (l'équipe au travail, le départ, les flèches au sol). */
const SOURCE_START_S = 3.6;
const RATE = 1.2;

export const ScenePitStop: React.FC<{ video: string; caption: string }> = ({ video, caption }) => {
  const frame = useCurrentFrame();
  const hasVideo = useStaticFile(video, "video") === "ready";

  // Fondus enchaînés : plein au moment où l'accroche disparaît, effacé pendant que la photo arrive.
  const fadeIn = tween(frame, 0, PIT_OVERLAP + 2, EASE_IN_OUT);
  const fadeOut = tween(frame, PIT_DURATION - PIT_OVERLAP, PIT_DURATION, EASE_IN_OUT);
  const opacity = fadeIn * (1 - fadeOut);
  // Très légère poussée de caméra pendant tout le plan : rien n'est jamais figé.
  const push = 1.06 - 0.06 * tween(frame, 0, PIT_DURATION, EASE_IN_OUT);

  return (
    <AbsoluteFill style={{ opacity }}>
      {hasVideo ? (
        <AbsoluteFill style={{ transform: `scale(${push})` }}>
          <OffthreadVideo
            src={staticFile(video)}
            muted
            trimBefore={Math.round(SOURCE_START_S * FPS)}
            playbackRate={RATE}
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.82) contrast(1.08) saturate(0.9)" }}
          />
          {/* Étalonnage : une pointe de violet dans les ombres, comme le reste de la vidéo. */}
          <AbsoluteFill style={{ background: rgba(COLORS.violet, 0.1), mixBlendMode: "color" }} />
        </AbsoluteFill>
      ) : null}

      {/* Vignette et voile bas pour la légende. */}
      <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 45%, ${rgba(COLORS.bg, 0)} 45%, ${rgba(COLORS.bg, 0.6)} 100%)` }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 980,
          bottom: 0,
          background: `linear-gradient(180deg, ${rgba(COLORS.bg, 0)} 0%, ${rgba(COLORS.bg, 0.78)} 45%, ${rgba(COLORS.bg, 0.9)} 100%)`,
        }}
      />

      <KineticTitle
        text={caption}
        frame={frame}
        start={PIT_OVERLAP + 10}
        stagger={5}
        bigSize={160}
        exit={fadeOut}
        style={{ position: "absolute", left: CONTENT.x, top: 1190 }}
      />
    </AbsoluteFill>
  );
};
