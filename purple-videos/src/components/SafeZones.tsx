import React from "react";
import { AbsoluteFill } from "remotion";
import { CONTENT, HEIGHT, SAFE, WIDTH } from "../theme";

const ZONE = "rgba(255, 60, 60, 0.16)";

/** Calque de contrôle : zones réservées à l'interface TikTok (prop showSafeZones). */
export const SafeZones: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: WIDTH, height: SAFE.top, background: ZONE }} />
    <div style={{ position: "absolute", left: 0, bottom: 0, width: WIDTH, height: SAFE.bottom, background: ZONE }} />
    <div
      style={{
        position: "absolute",
        right: 0,
        top: SAFE.top,
        width: SAFE.right,
        height: HEIGHT - SAFE.top - SAFE.bottom,
        background: ZONE,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: CONTENT.x,
        top: CONTENT.y,
        width: CONTENT.w,
        height: CONTENT.h,
        boxSizing: "border-box",
        border: "2px dashed rgba(80, 255, 170, 0.75)",
      }}
    />
  </AbsoluteFill>
);
