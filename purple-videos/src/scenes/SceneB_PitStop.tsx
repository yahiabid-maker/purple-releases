import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { KineticTitle } from "../components/Kinetic";
import { Ring } from "../components/Neon";
import { monoStyle } from "../components/Text";
import { EASE_IN_OUT, EASE_OUT, pop, smooth, tween } from "../lib/anim";
import { useStaticFile } from "../lib/useStaticFile";
import { COLORS, CONTENT, FPS, SCENES, rgba } from "../theme";

/**
 * Arrêt aux stands (2–4 s) : la vidéo vue de dessus, en fondu enchaîné depuis
 * l'accroche et vers la photo aérienne de la scène 2. Un chrono tourne pendant
 * l'arrêt et se fige à l'instant où la voiture repart ; la légende se pose dessous.
 *
 * La séquence déborde de OVERLAP images de chaque côté pour les fondus.
 */
export const PIT_OVERLAP = 14;
export const PIT_DURATION = SCENES.pit.duration + 2 * PIT_OVERLAP;

/** Extrait utilisé : à partir de 3,6 s dans la source, lu à 1,2× (l'équipe au travail, le départ, les flèches au sol). */
const SOURCE_START_S = 3.6;
const RATE = 1.2;

/** La voiture repart à 5,1 s dans la source, soit à cette image de la séquence. */
const LAUNCH = Math.round(((5.1 - SOURCE_START_S) / RATE) * FPS);
/** Durée de l'arrêt affichée à l'instant du départ (le chrono tourne déjà quand le plan commence). */
const STOP_SECONDS = 2.3;
const CHRONO_IN = PIT_OVERLAP + 2;
const CHRONO_TOP = 1052;
const CHRONO_H = 128;
const CAPTION_TOP = 1212;

const format = (seconds: number) => seconds.toFixed(2).replace(".", ",");

export const ScenePitStop: React.FC<{ video: string; caption: string }> = ({ video, caption }) => {
  const frame = useCurrentFrame();
  const hasVideo = useStaticFile(video, "video") === "ready";

  // Fondus enchaînés : plein au moment où l'accroche disparaît, effacé pendant que la photo arrive.
  const fadeIn = tween(frame, 0, PIT_OVERLAP + 2, EASE_IN_OUT);
  const fadeOut = tween(frame, PIT_DURATION - PIT_OVERLAP, PIT_DURATION, EASE_IN_OUT);
  const opacity = fadeIn * (1 - fadeOut);
  // Très légère poussée de caméra pendant tout le plan : rien n'est jamais figé.
  const push = 1.06 - 0.06 * tween(frame, 0, PIT_DURATION, EASE_IN_OUT);

  const chronoIn = smooth(frame, CHRONO_IN);
  const stopped = frame >= LAUNCH;
  const seconds = STOP_SECONDS - Math.max(0, LAUNCH - frame) / FPS;
  const stamp = pop(frame, LAUNCH);
  const flash = stopped ? 1 - tween(frame, LAUNCH, LAUNCH + 26, EASE_OUT) : 0;

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

      {/* Vignette et voile bas pour le chrono et la légende. */}
      <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 45%, ${rgba(COLORS.bg, 0)} 45%, ${rgba(COLORS.bg, 0.6)} 100%)` }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 800,
          bottom: 0,
          background: `linear-gradient(180deg, ${rgba(COLORS.bg, 0)} 0%, ${rgba(COLORS.bg, 0.86)} 42%, ${rgba(COLORS.bg, 0.94)} 100%)`,
        }}
      />

      {/* Chrono de l'arrêt : il tourne, puis se fige au départ de la voiture. */}
      <div
        style={{
          position: "absolute",
          left: CONTENT.x,
          top: CHRONO_TOP,
          height: CHRONO_H,
          display: "flex",
          alignItems: "center",
          gap: 26,
          padding: "0 38px 0 32px",
          borderRadius: 30,
          background: rgba(COLORS.surface, 0.62),
          backdropFilter: "blur(26px)",
          WebkitBackdropFilter: "blur(26px)",
          boxShadow: `inset 0 0 0 1.5px ${rgba(stopped ? COLORS.violetLight : COLORS.text, 0.2 + 0.5 * flash)}, 0 0 ${60 * flash}px ${rgba(COLORS.violet, 0.8 * flash)}`,
          opacity: Math.min(1, chronoIn * 1.3) * (1 - fadeOut),
          transform: `translate3d(${(1 - chronoIn) * -40}px, 0, 0) scale(${1 + 0.05 * (stopped ? 1 - stamp : 0)})`,
          transformOrigin: "0% 50%",
        }}
      >
        <Ring x={46} y={CHRONO_H / 2} progress={stopped ? tween(frame, LAUNCH, LAUNCH + 34) : 0} from={20} to={150} />
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: stopped ? 6 : "50%",
            background: stopped ? COLORS.violetLight : COLORS.violet,
            boxShadow: `0 0 ${18 + 10 * Math.sin(frame / 4)}px ${COLORS.violet}`,
            opacity: stopped ? 1 : 0.55 + 0.45 * Math.abs(Math.sin(frame / 7)),
          }}
        />
        <div style={{ ...monoStyle(92), color: stopped ? COLORS.violetLight : COLORS.text, textShadow: `0 0 ${24 + 40 * flash}px ${rgba(COLORS.violet, 0.5 + 0.5 * flash)}` }}>
          {format(seconds)}
          <span style={{ marginLeft: "0.22em", opacity: 0.7 }}>s</span>
        </div>
      </div>

      <KineticTitle
        text={caption}
        frame={frame}
        start={PIT_OVERLAP + 10}
        stagger={5}
        bigSize={190}
        exit={fadeOut}
        style={{ position: "absolute", left: CONTENT.x, top: CAPTION_TOP }}
      />
    </AbsoluteFill>
  );
};
