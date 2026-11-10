import React from "react";
import { Composition } from "remotion";
import { PurpleTikTok } from "./PurpleTikTok";
import { defaultTexts, hookVariants } from "./texts";
import { DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH } from "./theme";

const format = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION_IN_FRAMES };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Version principale */}
      <Composition id="PurpleTikTok" component={PurpleTikTok} defaultProps={defaultTexts} {...format} />

      {/* Variantes : même vidéo, seule l'accroche de la scène 1 change */}
      {Object.entries(hookVariants).map(([id, hook]) => (
        <Composition
          key={id}
          id={id}
          component={PurpleTikTok}
          defaultProps={{ ...defaultTexts, hook: [...hook] }}
          {...format}
        />
      ))}
    </>
  );
};
