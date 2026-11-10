import React from "react";
import type { CSSProperties } from "react";
import { COLORS, rgba } from "../theme";

/**
 * Monoplace générique vue de dessus, livrée violette Purple, sans aucune marque.
 * Dessinée nez vers le haut dans une boîte de 200 × 560 (largeur × longueur).
 */
export const CAR_RATIO = 560 / 200;

export const CarTopDown: React.FC<{ width: number; style?: CSSProperties; id?: string; light?: number }> = ({
  width,
  style,
  id = "car",
  light = 1,
}) => (
  <svg width={width} height={width * CAR_RATIO} viewBox="-100 -280 200 560" style={{ overflow: "visible", ...style }}>
    <defs>
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#5E1FC4" />
        <stop offset="35%" stopColor={COLORS.violet} />
        <stop offset="50%" stopColor="#A46BFF" />
        <stop offset="65%" stopColor={COLORS.violet} />
        <stop offset="100%" stopColor="#5E1FC4" />
      </linearGradient>
      <radialGradient id={`${id}-shadow`}>
        <stop offset="0%" stopColor="#000" stopOpacity={0.55} />
        <stop offset="100%" stopColor="#000" stopOpacity={0} />
      </radialGradient>
      <radialGradient id={`${id}-light`}>
        <stop offset="0%" stopColor={COLORS.violetLight} stopOpacity={0.9} />
        <stop offset="100%" stopColor={COLORS.violetLight} stopOpacity={0} />
      </radialGradient>
    </defs>
    {/* Ombre portée au sol */}
    <ellipse cx={8} cy={14} rx={120} ry={300} fill={`url(#${id}-shadow)`} />
    {/* Pneus */}
    {[
      [-106, -212, 32, 66],
      [74, -212, 32, 66],
      [-110, 128, 38, 84],
      [72, 128, 38, 84],
    ].map(([x, y, w, h], i) => (
      <g key={i}>
        <rect x={x} y={y} width={w} height={h} rx={9} fill="#0B0B10" />
        <rect x={x + 4} y={y + 6} width={4} height={h - 12} rx={2} fill={rgba(COLORS.text, 0.18)} />
      </g>
    ))}
    {/* Bras de suspension */}
    <g stroke="#2A2A35" strokeWidth={6} strokeLinecap="round">
      <line x1={-26} y1={-186} x2={-76} y2={-180} />
      <line x1={26} y1={-186} x2={76} y2={-180} />
      <line x1={-30} y1={-160} x2={-76} y2={-166} />
      <line x1={30} y1={-160} x2={76} y2={-166} />
      <line x1={-40} y1={150} x2={-74} y2={160} />
      <line x1={40} y1={150} x2={74} y2={160} />
    </g>
    {/* Aileron avant */}
    <rect x={-98} y={-278} width={196} height={26} rx={8} fill={COLORS.surface} />
    <rect x={-98} y={-270} width={196} height={6} rx={3} fill={COLORS.violet} />
    <rect x={-104} y={-282} width={10} height={36} rx={4} fill={COLORS.violetLight} />
    <rect x={94} y={-282} width={10} height={36} rx={4} fill={COLORS.violetLight} />
    {/* Nez */}
    <path d="M -13 -256 L 13 -256 L 30 -130 L -30 -130 Z" fill={`url(#${id}-body)`} />
    {/* Coque, pontons et capot moteur */}
    <path
      d="M -34 -136 L 34 -136 L 40 -44 Q 94 -24 94 40 L 90 118 Q 72 150 46 160 L 30 236 L -30 236 L -46 160 Q -72 150 -90 118 L -94 40 Q -94 -24 -40 -44 Z"
      fill={`url(#${id}-body)`}
    />
    <path d="M -86 30 Q -80 -10 -50 -30" fill="none" stroke={COLORS.violetLight} strokeWidth={3} opacity={0.8} />
    <path d="M 86 30 Q 80 -10 50 -30" fill="none" stroke={COLORS.violetLight} strokeWidth={3} opacity={0.8} />
    <rect x={-5} y={-250} width={10} height={480} rx={5} fill={COLORS.violetLight} opacity={0.75} />
    {/* Cockpit et arceau de protection */}
    <ellipse cx={0} cy={-74} rx={23} ry={36} fill="#0B0B10" />
    <path d="M -24 -60 Q 0 -122 24 -60" fill="none" stroke="#3A3A48" strokeWidth={8} strokeLinecap="round" />
    <ellipse cx={0} cy={-18} rx={14} ry={18} fill={COLORS.surface} />
    {/* Aileron arrière et feu */}
    <rect x={-90} y={234} width={180} height={30} rx={6} fill={COLORS.surface} />
    <rect x={-90} y={240} width={180} height={6} rx={3} fill={COLORS.violet} />
    <rect x={-98} y={226} width={10} height={44} rx={4} fill={COLORS.violetLight} />
    <rect x={88} y={226} width={10} height={44} rx={4} fill={COLORS.violetLight} />
    <ellipse cx={0} cy={270} rx={34 * light} ry={18 * light} fill={`url(#${id}-light)`} />
    <rect x={-10} y={264} width={20} height={7} rx={3} fill={COLORS.violetLight} />
  </svg>
);
