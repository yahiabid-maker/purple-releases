import React from "react";
import type { CSSProperties } from "react";
import { FONT_TEXT, FONT_TITLE } from "../fonts";
import { EASE_OUT, pop, smooth, tween } from "../lib/anim";
import { COLORS, CONTENT, TYPE, rgba } from "../theme";

/**
 * Titres en typographie cinétique : les mots arrivent un par un, un petit texte
 * (Inter) porte un mot géant (Barlow très gras).
 *
 * Balisage, ligne par ligne (séparées par \n) :
 *   « # texte »        ligne géante (Barlow Semi Condensed 800)
 *   « texte »          ligne courte (Inter)
 *   « *mot* »          mot en violet
 *   « [a|b|c] »        mot dans une pastille violette ; les mots défilent et
 *                      la pastille se pose sur le dernier
 */

type Segment = { text: string; accent: boolean };
type Word = { segments: Segment[]; pill?: string[] };
type Line = { display: boolean; words: Word[] };

export const parseTitle = (text: string): Line[] =>
  text.split("\n").map((raw) => {
    const display = raw.startsWith("# ");
    const body = display ? raw.slice(2) : raw;
    const words: Word[] = [];
    let accent = false;
    for (const chunk of body.split(" ").filter(Boolean)) {
      const pill = chunk.match(/^\[([^\]]+)\](.*)$/);
      if (pill) {
        words.push({ pill: pill[1].split("|"), segments: pill[2] ? [{ text: pill[2], accent }] : [] });
        continue;
      }
      const segments: Segment[] = [];
      let current = "";
      for (const ch of chunk) {
        if (ch === "*") {
          if (current) segments.push({ text: current, accent });
          current = "";
          accent = !accent;
        } else {
          current += ch;
        }
      }
      if (current) segments.push({ text: current, accent });
      words.push({ segments });
    }
    return { display, words };
  });

const lineChars = (line: Line) =>
  line.words.reduce(
    (n, w) =>
      n +
      (w.pill ? Math.max(...w.pill.map((p) => p.length)) + 0.8 : 0) +
      w.segments.reduce((m, s) => m + s.text.length, 0) +
      0.4,
    0,
  );

/** Taille d'une ligne géante : la plus grande qui tient sur une ligne, jamais sous 110 px. */
const displaySize = (line: Line, max: number, width: number) =>
  Math.max(TYPE.titleMin, Math.min(max, Math.floor(width / (lineChars(line) * 0.5))));

const LINE_GAP = 4;

/** Hauteur estimée d'un titre (sans mesurer le texte), pour centrer des blocs. */
export const estimateTitleHeight = (
  text: string,
  { bigSize = 170, smallSize = 64, width = CONTENT.w }: { bigSize?: number; smallSize?: number; width?: number } = {},
) =>
  parseTitle(text).reduce((h, line, i) => {
    const lineHeight = line.display
      ? displaySize(line, bigSize, width) * 1.02
      : smallSize * 1.28 * Math.max(1, Math.ceil((lineChars(line) * smallSize * 0.54) / width));
    return h + lineHeight + (i ? LINE_GAP : 0);
  }, 0);

/** Image d'apparition de chaque mot, dans l'ordre de lecture. Les mots géants prennent un peu plus d'air. */
export const titleWordTimes = (text: string, start: number, stagger: number) => {
  let t = start;
  let previousDisplay = false;
  return parseTitle(text).map((line) =>
    line.words.map(() => {
      if (line.display && !previousDisplay) t += 3;
      const at = t;
      t += line.display ? stagger + 2 : stagger;
      previousDisplay = line.display;
      return at;
    }),
  );
};

/** Image d'apparition du dernier mot d'un titre. */
export const titleLastWord = (text: string, start: number, stagger: number) =>
  Math.max(start, ...titleWordTimes(text, start, stagger).flat());

/** Pastille : le fond se déroule, puis les mots défilent comme un compteur. */
const PILL_CYCLE = 10;

const Pill: React.FC<{ words: string[]; frame: number; at: number }> = ({ words, frame, at }) => {
  const wipe = tween(frame, at, at + 12, EASE_OUT);
  const radius = "0.16em";
  return (
    <span style={{ position: "relative", display: "inline-block", padding: "0.02em 0.2em 0.04em" }}>
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          background: `linear-gradient(180deg, ${rgba(COLORS.violetLight, 0.5)} 0%, ${rgba(COLORS.violet, 0)} 55%), ${COLORS.violet}`,
          boxShadow: `0 0 0.35em ${rgba(COLORS.violet, 0.55 * wipe)}`,
          transform: `scaleX(${wipe})`,
          transformOrigin: "0% 50%",
        }}
      />
      <span style={{ position: "relative", display: "inline-grid", overflow: "hidden", verticalAlign: "top" }}>
        {words.map((word, i) => {
          const enter = at + 6 + i * PILL_CYCLE;
          const pIn = tween(frame, enter, enter + 7, EASE_OUT);
          const pOut = i < words.length - 1 ? tween(frame, enter + PILL_CYCLE, enter + PILL_CYCLE + 7, EASE_OUT) : 0;
          return (
            <span
              key={i}
              style={{
                gridArea: "1 / 1",
                color: COLORS.text,
                transform: `translate3d(0, ${(1 - pIn) * 70 - pOut * 70}%, 0)`,
                opacity: pIn * (1 - pOut),
              }}
            >
              {word}
            </span>
          );
        })}
      </span>
    </span>
  );
};

const Segments: React.FC<{ segments: Segment[] }> = ({ segments }) => (
  <>
    {segments.map((s, i) => (
      <span key={i} style={s.accent ? { color: COLORS.violet } : undefined}>
        {s.text}
      </span>
    ))}
  </>
);

export const KineticTitle: React.FC<{
  text: string;
  frame: number;
  /** Image d'apparition du premier mot. */
  start?: number;
  /** Écart entre deux mots, en images. */
  stagger?: number;
  bigSize?: number;
  smallSize?: number;
  align?: "center" | "left";
  width?: number;
  /** 0 → 1 : sortie du titre (monte et se floute). */
  exit?: number;
  style?: CSSProperties;
}> = ({ text, frame, start = 0, stagger = 5, bigSize = 170, smallSize = 64, align = "center", width = CONTENT.w, exit = 0, style }) => {
  const lines = parseTitle(text);

  const timed = titleWordTimes(text, start, stagger);

  return (
    <div
      style={{
        width,
        textAlign: align,
        opacity: 1 - exit,
        transform: `translate3d(0, ${-exit * 40}px, 0)`,
        filter: exit > 0.01 ? `blur(${(exit * 10).toFixed(2)}px)` : undefined,
        ...style,
      }}
    >
      {lines.map((line, li) => {
        const size = line.display ? displaySize(line, bigSize, width) : smallSize;
        return (
          <div
            key={li}
            style={{
              fontFamily: line.display ? FONT_TITLE : FONT_TEXT,
              fontWeight: line.display ? 800 : 600,
              fontSize: size,
              lineHeight: line.display ? 1.02 : 1.28,
              letterSpacing: line.display ? "-0.012em" : "-0.015em",
              color: line.display ? COLORS.text : rgba(COLORS.text, 0.88),
              marginTop: li ? LINE_GAP : 0,
              whiteSpace: line.display ? "nowrap" : undefined,
              textWrap: "balance",
            }}
          >
            {line.words.map((word, wi) => {
              const at = timed[li][wi];
              const space = wi < line.words.length - 1 ? " " : null;
              if (line.display) {
                // Mot géant : arrive net d'un coup, avec un léger rebond d'échelle.
                const p = pop(frame, at);
                const settled = Math.min(1, smooth(frame, at) * 1.3);
                return (
                  <React.Fragment key={wi}>
                    <span
                      style={{
                        display: "inline-block",
                        opacity: settled,
                        transform: `scale(${1 + 0.16 * (1 - p)})`,
                        filter: settled < 0.98 ? `blur(${((1 - settled) * 14).toFixed(2)}px)` : undefined,
                      }}
                    >
                      {word.pill ? <Pill words={word.pill} frame={frame} at={at} /> : null}
                      <Segments segments={word.segments} />
                    </span>
                    {space}
                  </React.Fragment>
                );
              }
              // Mot court : glisse vers le haut depuis un masque.
              const p = smooth(frame, at);
              return (
                <React.Fragment key={wi}>
                  <span
                    style={{
                      display: "inline-block",
                      overflow: "hidden",
                      padding: "0.14em 0.05em",
                      margin: "-0.14em -0.05em",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        transform: `translate3d(0, ${(1 - p) * 110}%, 0)`,
                        opacity: p > 0.02 ? 1 : 0,
                      }}
                    >
                      {word.pill ? <Pill words={word.pill} frame={frame} at={at} /> : null}
                      <Segments segments={word.segments} />
                    </span>
                  </span>
                  {space}
                </React.Fragment>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
