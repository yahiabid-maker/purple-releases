import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Background, Grain } from "./components/Background";
import { Bloom } from "./components/Bloom";
import { Hud } from "./components/Hud";
import { LIQUID, LiquidWipe } from "./components/LiquidWipe";
import { PanTransition } from "./components/PanTransition";
import { PAN, panBlur } from "./lib/pan";
import { SafeZones } from "./components/SafeZones";
import { SceneHook } from "./scenes/Scene1Hook";
import { SceneTrack } from "./scenes/Scene2Track";
import { S3_CENTER, SceneDelta } from "./scenes/Scene3Delta";
import { ORB_CENTER, SceneCoach } from "./scenes/Scene4Coach";
import { SceneDebrief } from "./scenes/Scene5Debrief";
import { SceneOutro } from "./scenes/Scene6Outro";
import type { PurpleTikTokProps } from "./texts";
import { COLORS, SCENES } from "./theme";

/** Vidéo TikTok Purple — 1080 × 1920, 60 i/s, 20 s, sans audio. */
export const PurpleTikTok: React.FC<PurpleTikTokProps> = (props) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Flou de mouvement vertical du travelling accroche → scène 2 */}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="panBlur" x="-5%" y="-20%" width="110%" height="140%">
          <feGaussianBlur stdDeviation={`0 ${panBlur(frame).toFixed(1)}`} />
        </filter>
      </svg>
      <Background />

      <Sequence name="1 · Accroche" from={SCENES.hook.from} durationInFrames={SCENES.hook.duration}>
        <SceneHook hook={props.hook} />
      </Sequence>
      <Sequence name="2 · Tracé du circuit" from={SCENES.track.from} durationInFrames={SCENES.track.duration}>
        <SceneTrack title={props.trackTitle} photo={props.trackPhoto} />
      </Sequence>
      <Sequence name="3 · Delta et secteurs" from={SCENES.delta.from} durationInFrames={SCENES.delta.duration}>
        <SceneDelta title={props.deltaTitle} label={props.deltaLabel} value={props.deltaValue} sectors={props.sectors} echo={props.deltaEcho} />
      </Sequence>
      <Sequence name="4 · Coach vocal" from={SCENES.coach.from} durationInFrames={SCENES.coach.duration}>
        <SceneCoach title={props.coachTitle} subtitle={props.coachSubtitle} note={props.coachNote} />
      </Sequence>
      <Sequence name="5 · Débrief" from={SCENES.debrief.from} durationInFrames={SCENES.debrief.duration}>
        <SceneDebrief label={props.debriefLabel} title={props.debriefTitle} rows={props.debriefRows} />
      </Sequence>
      <Sequence name="6 · Signature" from={SCENES.outro.from} durationInFrames={SCENES.outro.duration}>
        <SceneOutro tagline={props.tagline} cta={props.cta} logoFallback={props.logoFallback} />
      </Sequence>

      {/* Transition 1 → 2, vue de dessus : travelling sur l'asphalte fléché, passage de la monoplace. */}
      <Sequence name="Transition travelling" from={PAN.from} durationInFrames={PAN.to - PAN.from + 4}>
        <PanTransition />
      </Sequence>

      {/* Transition 5 → 6 : nappe liquide violette. */}
      <Sequence name="Transition liquide" from={LIQUID.from} durationInFrames={LIQUID.duration}>
        <LiquidWipe />
      </Sequence>

      {/* Transition 3 → 4 : la puce S3 éclot et se condense dans la sphère du coach. */}
      <Sequence name="Transition éclosion" from={SCENES.coach.from - 16} durationInFrames={56}>
        <Bloom from={S3_CENTER} to={ORB_CENTER} />
      </Sequence>

      <Hud />
      <Grain />
      {props.showSafeZones ? <SafeZones /> : null}
    </AbsoluteFill>
  );
};
