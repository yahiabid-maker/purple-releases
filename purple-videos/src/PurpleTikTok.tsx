import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Background, Grain } from "./components/Background";
import { Bloom } from "./components/Bloom";
import { Hud } from "./components/Hud";
import { LineWipe, WIPE, WIPE_FRAMES } from "./components/LightLine";
import { LIQUID, LiquidWipe } from "./components/LiquidWipe";
import { PIT_DURATION, PIT_OVERLAP, ScenePitStop } from "./scenes/SceneB_PitStop";
import { SafeZones } from "./components/SafeZones";
import { SceneHook } from "./scenes/Scene1Hook";
import { SceneTrack } from "./scenes/Scene2Track";
import { S3_CENTER, SceneDelta } from "./scenes/Scene3Delta";
import { ORB_CENTER, SceneCoach } from "./scenes/Scene4Coach";
import { SceneDebrief } from "./scenes/Scene5Debrief";
import { SceneOutro } from "./scenes/Scene6Outro";
import type { PurpleTikTokProps } from "./texts";
import { useFontsReady } from "./fonts";
import { COLORS, SCENES } from "./theme";

/** Vidéo TikTok Purple — 1080 × 1920, 60 i/s, 22 s, sans audio. */
export const PurpleTikTok: React.FC<PurpleTikTokProps> = (props) => {
  // Les titres sont calibrés sur la largeur réelle des mots : on attend les polices.
  const fontsReady = useFontsReady();
  if (!fontsReady) return <AbsoluteFill style={{ backgroundColor: COLORS.bg }} />;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Background />

      <Sequence name="1 · Accroche" from={SCENES.hook.from} durationInFrames={SCENES.hook.duration}>
        <SceneHook hook={props.hook} flag={props.flagVideo} />
      </Sequence>
      <Sequence name="1 bis · Arrêt aux stands" from={SCENES.pit.from - PIT_OVERLAP} durationInFrames={PIT_DURATION}>
        <ScenePitStop video={props.pitStopVideo} caption={props.pitStopCaption} />
      </Sequence>
      <Sequence name="2 · Tracé du circuit" from={SCENES.track.from} durationInFrames={SCENES.track.duration + WIPE.tail}>
        <SceneTrack title={props.trackTitle} photo={props.trackPhoto} />
      </Sequence>
      <Sequence name="3 · Delta et secteurs" from={SCENES.delta.from} durationInFrames={SCENES.delta.duration}>
        <SceneDelta title={props.deltaTitle} label={props.deltaLabel} value={props.deltaValue} sectors={props.sectors} echo={props.deltaEcho} badge={props.deltaBadge} />
      </Sequence>
      <Sequence name="4 · Coach vocal" from={SCENES.coach.from} durationInFrames={SCENES.coach.duration + WIPE.tail}>
        <SceneCoach title={props.coachTitle} subtitle={props.coachSubtitle} note={props.coachNote} />
      </Sequence>
      <Sequence name="5 · Débrief" from={SCENES.debrief.from} durationInFrames={SCENES.debrief.duration}>
        <SceneDebrief label={props.debriefLabel} title={props.debriefTitle} rows={props.debriefRows} />
      </Sequence>
      <Sequence name="6 · Signature" from={SCENES.outro.from} durationInFrames={SCENES.outro.duration}>
        <SceneOutro tagline={props.tagline} cta={props.cta} logoFallback={props.logoFallback} flag={props.flagVideo} />
      </Sequence>

      {/* Transitions 2 → 3 et 4 → 5 : la ligne de lumière de l'accroche tombe et efface la scène. */}
      {[SCENES.delta.from, SCENES.debrief.from].map((cut) => (
        <Sequence key={cut} name="Transition ligne" from={cut - WIPE.lead} durationInFrames={WIPE_FRAMES}>
          <LineWipe />
        </Sequence>
      ))}

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
