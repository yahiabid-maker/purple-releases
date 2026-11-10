import React from "react";
import type { CSSProperties } from "react";
import { COLORS, rgba } from "../theme";

/**
 * Carte en verre dépoli : surface semi-transparente, flou d'arrière-plan,
 * fine bordure claire et reflet doux.
 *
 * Important : animer `opacity` / `transform` sur la carte elle-même (prop style),
 * jamais sur un parent, sinon le flou d'arrière-plan ne voit plus le fond.
 */
export const GlassCard: React.FC<{
  children: React.ReactNode;
  style?: CSSProperties;
  padding?: number;
  radius?: number;
  /** 0 → 1 : passage unique d'un reflet en diagonale (à l'entrée de la carte). */
  sheen?: number;
}> = ({ children, style, padding = 48, radius = 48, sheen = 0 }) => {
  return (
    <div
      style={{
        position: "relative",
        boxSizing: "border-box",
        borderRadius: radius,
        padding,
        background: `linear-gradient(150deg, ${rgba(COLORS.surface, 0.42)} 0%, ${rgba(COLORS.surface, 0.56)} 45%, ${rgba(COLORS.surface, 0.68)} 100%)`,
        backdropFilter: "blur(42px) saturate(160%)",
        WebkitBackdropFilter: "blur(42px) saturate(160%)",
        boxShadow: `0 44px 110px ${rgba("#000000", 0.5)}, 0 0 140px ${rgba(COLORS.violet, 0.14)}`,
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Reflet doux, en haut à gauche. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(128deg, ${rgba(COLORS.text, 0.11)} 0%, ${rgba(COLORS.text, 0.035)} 24%, ${rgba(COLORS.text, 0)} 48%)`,
          pointerEvents: "none",
        }}
      />
      {/* Reflet qui traverse la carte une seule fois. */}
      {sheen > 0 && sheen < 1 ? (
        <div
          style={{
            position: "absolute",
            top: "-30%",
            bottom: "-30%",
            left: `${-45 + sheen * 190}%`,
            width: "34%",
            transform: "skewX(-18deg)",
            background: `linear-gradient(90deg, ${rgba(COLORS.text, 0)} 0%, ${rgba(COLORS.text, 0.09)} 50%, ${rgba(COLORS.text, 0)} 100%)`,
            opacity: Math.sin(sheen * Math.PI),
            pointerEvents: "none",
          }}
        />
      ) : null}
      {/* Fine bordure claire en dégradé (plus lumineuse là où la lumière arrive). */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          padding: 1.5,
          background: `linear-gradient(140deg, ${rgba(COLORS.text, 0.42)} 0%, ${rgba(COLORS.text, 0.1)} 30%, ${rgba(COLORS.violetLight, 0.1)} 68%, ${rgba(COLORS.violetLight, 0.34)} 100%)`,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};
