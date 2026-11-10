import React from "react";
import { COLORS, rgba } from "../theme";

/** Micro (pictogramme dessiné ici, trait arrondi). */
const MicIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={COLORS.text} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
    <rect x="17" y="6" width="14" height="24" rx="7" />
    <path d="M10 22a14 14 0 0 0 28 0" />
    <path d="M24 36v6" />
    <path d="M17 42h14" />
  </svg>
);

/** Pastille ronde « néon » : disque violet, liseré clair et halo. */
export const NeonCircle: React.FC<{ size?: number; glow?: number; children?: React.ReactNode }> = ({
  size = 96,
  glow = 1,
  children,
}) => (
  <div
    style={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: `radial-gradient(circle at 35% 30%, ${COLORS.violetLight} 0%, ${COLORS.violet} 55%, ${rgba(COLORS.violet, 0.85)} 100%)`,
      boxShadow: `inset 0 0 0 2px ${rgba(COLORS.text, 0.35)}, 0 0 ${28 * glow}px ${rgba(COLORS.violet, 0.75)}, 0 0 ${70 * glow}px ${rgba(COLORS.violet, 0.4)}`,
    }}
  >
    {children}
  </div>
);

export const NeonMic: React.FC<{ size?: number; glow?: number }> = ({ size = 96, glow }) => (
  <NeonCircle size={size} glow={glow}>
    <MicIcon size={size * 0.56} />
  </NeonCircle>
);

/** Cercle fin qui s'agrandit en s'effaçant (onde de choc lumineuse). */
export const Ring: React.FC<{ x: number; y: number; progress: number; from: number; to: number; width?: number; color?: string }> = ({
  x,
  y,
  progress,
  from,
  to,
  width = 2.5,
  color = COLORS.violetLight,
}) => {
  if (progress <= 0 || progress >= 1) return null;
  const r = from + (to - from) * progress;
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        boxSizing: "border-box",
        border: `${width}px solid ${color}`,
        opacity: (1 - progress) * 0.8,
        boxShadow: `0 0 18px ${rgba(COLORS.violet, 0.5 * (1 - progress))}`,
        pointerEvents: "none",
      }}
    />
  );
};
