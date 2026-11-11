import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Flag } from "../components/Flag";
import { KineticTitle } from "../components/Kinetic";
import { Ring } from "../components/Neon";
import { displayStyle } from "../components/Text";
import { FONT_TEXT } from "../fonts";
import { EASE_IN_OUT, EASE_OUT, rise, smooth, tween } from "../lib/anim";
import { useStaticFile } from "../lib/useStaticFile";
import { BEAT, CENTER_X, COLORS, CONTENT, HEIGHT, SCENES, rgba } from "../theme";

/** Signature sur la mesure de 18 s, appel à l'action un demi-temps plus tard, « tap » à 19 s. */
const TAGLINE_AT = 2 * BEAT - 14;
const CTA_AT = 2.5 * BEAT - 10;
const TAP_AT = 4 * BEAT - 4;

const DURATION = SCENES.outro.duration;
const LOGO_FILE = "logo.svg";
const LOGO_Y = 530;
const TAGLINE_TOP = 776;
const CTA_TOP = 944;

/** Le logo est le fichier public/logo.svg fourni par Purple : affiché tel quel, jamais redessiné. */

/**
 * Scène 6 (19–22 s) : le drapeau à damier se lève en bas de l'image pendant qu'un
 * faisceau de lumière descend sur le logo ; puis la signature et l'appel à l'action
 * dans un bouton en verre. La dernière image reste posée (pas de fondu).
 */
export const SceneOutro: React.FC<{ tagline: string; cta: string; logoFallback: string; flag: string }> = ({ tagline, cta, logoFallback, flag }) => {
  const frame = useCurrentFrame();
  const logo = useStaticFile(LOGO_FILE, "svg");
  const beam = tween(frame, 0, 30, EASE_IN_OUT);
  const logoIn = smooth(frame, 8);
  const flagUp = tween(frame, 0, 56, EASE_OUT);
  const ctaIn = smooth(frame, CTA_AT);
  const tap = tween(frame, TAP_AT, TAP_AT + 34);
  const press = Math.sin(Math.PI * tween(frame, TAP_AT - 2, TAP_AT + 12));
  const breathe = 1 + 0.025 * Math.sin(frame / 20);

  return (
    <AbsoluteFill>
      {/* Faisceau : cône de lumière venu d'en haut, posé sur le logo. Le flou s'applique
          après la découpe, pour des bords doux comme une vraie lumière. */}
      <div
        style={{
          position: "absolute",
          left: CENTER_X - 520,
          top: -60,
          width: 1040,
          height: LOGO_Y + 340,
          filter: "blur(30px)",
          opacity: beam * 0.85,
          transformOrigin: "50% 0%",
          transform: `scaleY(${0.6 + 0.4 * beam})`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            clipPath: "polygon(43% 0%, 57% 0%, 100% 100%, 0% 100%)",
            background: `linear-gradient(180deg, ${rgba(COLORS.violetLight, 0.5)} 0%, ${rgba(COLORS.violet, 0.34)} 55%, ${rgba(COLORS.violet, 0)} 100%)`,
          }}
        />
      </div>
      {/* Halo au point d'impact */}
      <div
        style={{
          position: "absolute",
          left: CENTER_X - 380,
          top: LOGO_Y - 380,
          width: 760,
          height: 760,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${rgba(COLORS.violetLight, 0.45)} 0%, ${rgba(COLORS.violet, 0.4)} 30%, ${rgba(COLORS.violet, 0.12)} 62%, ${rgba(COLORS.violet, 0)} 100%)`,
          opacity: logoIn,
          transform: `scale(${(0.6 + 0.4 * logoIn) * breathe})`,
        }}
      />

      {/* Drapeau à damier : il se lève derrière la nappe liquide, puis ondule jusqu'à la fin. */}
      <div
        style={{
          position: "absolute",
          left: -260,
          right: -260,
          top: HEIGHT - 980,
          height: 1240,
          background: `radial-gradient(closest-side, ${rgba(COLORS.violet, 0.4)} 0%, ${rgba(COLORS.violet, 0.13)} 55%, ${rgba(COLORS.violet, 0)} 100%)`,
          opacity: flagUp,
        }}
      />
      {/* Le tissu descend peu à peu dans la vidéo source : on le remonte d'autant pour garder la crête en place. */}
      <Flag video={flag} startAt={0.5} size={1180} offsetY={70 + (1 - flagUp) * 320 - 110 * (frame / DURATION)} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 520,
          background: `linear-gradient(180deg, ${rgba(COLORS.bg, 0)} 0%, ${rgba(COLORS.bg, 0.7)} 100%)`,
        }}
      />

      <Ring x={CENTER_X} y={LOGO_Y} progress={tween(frame, 18, 64)} from={150} to={460} width={2.5} />

      {/* Logo */}
      <div
        style={{
          position: "absolute",
          left: CONTENT.x,
          width: CONTENT.w,
          top: LOGO_Y - 160,
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: Math.min(1, logoIn * 1.15),
          transform: `scale(${0.86 + logoIn * 0.14})`,
          filter: logoIn < 0.98 ? `blur(${((1 - logoIn) * 14).toFixed(2)}px)` : undefined,
        }}
      >
        {logo === "ready" ? (
          <Img src={staticFile(LOGO_FILE)} style={{ width: 560, height: 300, objectFit: "contain", filter: `drop-shadow(0 0 60px ${rgba(COLORS.violet, 0.6)})` }} />
        ) : logo === "missing" ? (
          <div style={{ ...displayStyle(224), lineHeight: 1, textShadow: `0 0 70px ${rgba(COLORS.violet, 0.75)}` }}>{logoFallback}</div>
        ) : null}
      </div>

      {/* Signature */}
      <KineticTitle
        text={tagline.startsWith("# ") ? tagline : `# ${tagline}`}
        frame={frame}
        start={TAGLINE_AT}
        stagger={4}
        bigSize={150}
        align="center"
        style={{ position: "absolute", left: CONTENT.x, top: TAGLINE_TOP }}
      />

      {/* Appel à l'action : bouton en verre, avec un « tap » à 19 s. */}
      <div style={{ position: "absolute", left: CONTENT.x, width: CONTENT.w, top: CTA_TOP, display: "flex", justifyContent: "center", ...rise(ctaIn, 0, { distance: 34 }) }}>
        <div
          style={{
            position: "relative",
            height: 118,
            padding: "0 50px",
            borderRadius: 59,
            display: "flex",
            alignItems: "center",
            fontFamily: FONT_TEXT,
            fontWeight: 600,
            fontSize: 56,
            letterSpacing: "-0.01em",
            color: COLORS.text,
            background: `linear-gradient(180deg, ${rgba(COLORS.violet, 0.4)} 0%, ${rgba(COLORS.violet, 0.22)} 100%)`,
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            boxShadow: `inset 0 0 0 2px ${rgba(COLORS.violetLight, 0.65)}, 0 0 ${40 + 30 * press}px ${rgba(COLORS.violet, 0.55 + 0.3 * press)}`,
            transform: `scale(${1 - 0.04 * press})`,
            whiteSpace: "nowrap",
          }}
        >
          {cta}
          {tap > 0 && tap < 1 ? (
            <div
              style={{
                position: "absolute",
                right: 70 - 60 * tap,
                top: 59 - 60 * tap,
                width: 120 * tap,
                height: 120 * tap,
                borderRadius: "50%",
                background: rgba(COLORS.text, 0.25 * (1 - tap)),
                boxShadow: `inset 0 0 0 2px ${rgba(COLORS.text, 0.5 * (1 - tap))}`,
              }}
            />
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
