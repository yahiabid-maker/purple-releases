import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Img,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { RichText, titleStyle } from "../components/Text";
import { FONT_TEXT, FONT_TITLE } from "../fonts";
import { rise, smooth, tween } from "../lib/anim";
import { BEAT, COLORS, SCENES, WIDTH, rgba } from "../theme";

/** Signature sur la mesure de 18 s, appel à l'action un demi-temps plus tard. */
const TAGLINE_AT = 2 * BEAT - 12;
const CTA_AT = 2.5 * BEAT - 10;

const LOGO_FILE = "logo.svg";

/**
 * Le logo est le fichier public/logo.svg fourni par Purple : il est affiché tel
 * quel, jamais redessiné. S'il est absent, on affiche le nom en texte à la place.
 */
const useLogo = () => {
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [handle] = useState(() => delayRender("Recherche de public/logo.svg"));
  useEffect(() => {
    fetch(staticFile(LOGO_FILE))
      .then((res) => {
        const type = res.headers.get("content-type") ?? "";
        setStatus(res.ok && type.includes("svg") ? "ready" : "missing");
      })
      .catch(() => setStatus("missing"))
      .finally(() => continueRender(handle));
  }, [handle]);
  return status;
};

/**
 * Scène 6 (17–20 s) : le logo apparaît dans une lueur violette, puis la
 * signature et l'appel à l'action. La dernière image reste posée (pas de fondu).
 */
export const SceneOutro: React.FC<{ tagline: string; cta: string; logoFallback: string }> = ({
  tagline,
  cta,
  logoFallback,
}) => {
  const frame = useCurrentFrame();
  const logo = useLogo();
  const bloom = smooth(frame, 0);
  const logoIn = smooth(frame, 6);
  const breathe = 1 + 0.03 * Math.sin(frame / 22);
  const duration = SCENES.outro.duration;

  return (
    <AbsoluteFill>
      {/* Lueur violette derrière le logo */}
      <div
        style={{
          position: "absolute",
          left: WIDTH / 2 - 390,
          top: 620 - 390,
          width: 780,
          height: 780,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${rgba(COLORS.violetLight, 0.5)} 0%, ${rgba(COLORS.violet, 0.5)} 26%, ${rgba(COLORS.violet, 0.16)} 60%, ${rgba(COLORS.violet, 0)} 100%)`,
          opacity: bloom * (0.9 + 0.1 * Math.sin(frame / 22)),
          transform: `scale(${(0.55 + bloom * 0.45) * breathe})`,
        }}
      />

      {/* Logo */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: WIDTH,
          top: 460,
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: Math.min(1, logoIn * 1.15),
          transform: `scale(${0.88 + logoIn * 0.12})`,
          filter: logoIn < 0.98 ? `blur(${((1 - logoIn) * 12).toFixed(2)}px)` : undefined,
        }}
      >
        {logo === "ready" ? (
          <Img
            src={staticFile(LOGO_FILE)}
            style={{ width: 560, height: 300, objectFit: "contain", filter: `drop-shadow(0 0 60px ${rgba(COLORS.violet, 0.6)})` }}
          />
        ) : logo === "missing" ? (
          <div
            style={{
              fontFamily: FONT_TITLE,
              fontWeight: 800,
              fontSize: 210,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: COLORS.text,
              textShadow: `0 0 70px ${rgba(COLORS.violet, 0.75)}`,
            }}
          >
            {logoFallback}
          </div>
        ) : null}
      </div>

      {/* Signature */}
      <div
        style={{
          position: "absolute",
          left: 140,
          width: WIDTH - 280,
          top: 934,
          textAlign: "center",
          ...titleStyle(116),
          ...rise(smooth(frame, TAGLINE_AT)),
        }}
      >
        <RichText text={tagline} />
      </div>

      {/* Appel à l'action */}
      <div
        style={{
          position: "absolute",
          left: 140,
          width: WIDTH - 280,
          top: 1096,
          textAlign: "center",
          fontFamily: FONT_TEXT,
          fontWeight: 500,
          fontSize: 56,
          lineHeight: "72px",
          letterSpacing: "-0.01em",
          color: rgba(COLORS.text, 0.9),
          ...rise(smooth(frame, CTA_AT), 0, { distance: 30 }),
        }}
      >
        {cta}
      </div>

      {/* Fin de filet : un trait violet qui se referme sous l'appel à l'action */}
      <div
        style={{
          position: "absolute",
          left: WIDTH / 2 - 60,
          top: 1200,
          width: 120,
          height: 6,
          borderRadius: 3,
          background: COLORS.violet,
          boxShadow: `0 0 24px ${rgba(COLORS.violet, 0.9)}`,
          transform: `scaleX(${tween(frame, CTA_AT + 10, Math.min(duration, CTA_AT + 46))})`,
        }}
      />
    </AbsoluteFill>
  );
};
