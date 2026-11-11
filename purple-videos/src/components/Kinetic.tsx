import React from "react";
import type { CSSProperties } from "react";
import { EASE_OUT, smooth, tween } from "../lib/anim";
import { widthEm } from "../lib/measure";
import { COLORS, CONTENT, TYPE, rgba } from "../theme";
import { DISPLAY_FACE, DISPLAY_LEADING, DISPLAY_TRACKING, LEAD_FACE, LEAD_LEADING, displayStyle, leadStyle, upper } from "./Text";

/**
 * Titres en typographie cinétique : une ligne d'appui (Barlow 600 italique, bas de
 * casse) porte un mot géant (Barlow 800 italique, capitales). Chaque mot sort d'un
 * masque, de bas en haut ; les mots géants sont calibrés sur la largeur disponible.
 *
 * Balisage, ligne par ligne (séparées par \n) :
 *   « # texte »        ligne géante, en capitales
 *   « texte »          ligne d'appui
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

/** Marge intérieure de la pastille, de chaque côté (en em). */
const PILL_PAD = 0.17;
/** Les lignes géantes s'arrêtent un cheveu avant le bord (débord de l'italique). */
const FIT = 0.985;

const plain = (word: Word) => word.segments.map((s) => s.text).join("");
const displayWordEm = (text: string) => widthEm(upper(text), DISPLAY_FACE) + DISPLAY_TRACKING * text.length;

/** Largeur naturelle d'une ligne, en em de son corps. */
const lineWidthEm = (line: Line) => {
  if (!line.display) {
    const text = line.words.map((w) => (w.pill ? w.pill[w.pill.length - 1] : "") + plain(w)).join(" ");
    return widthEm(text, LEAD_FACE) + 0.004 * text.length;
  }
  const space = widthEm(" ", DISPLAY_FACE);
  return line.words.reduce((total, word, i) => {
    const pill = word.pill ? Math.max(...word.pill.map(displayWordEm)) + 2 * PILL_PAD : 0;
    return total + pill + displayWordEm(plain(word)) + (i ? space : 0);
  }, 0);
};

/** Corps d'une ligne géante : le plus grand qui tient sur une ligne, jamais sous 110 px. */
const displaySize = (line: Line, max: number, width: number) =>
  Math.max(TYPE.titleMin, Math.min(max, Math.floor((width * FIT) / lineWidthEm(line))));

const lineSize = (line: Line, bigSize: number, smallSize: number, width: number) =>
  line.display ? displaySize(line, bigSize, width) : smallSize;

/** Espace entre deux lignes : réglé à l'œil sur la hauteur des capitales, pas sur les boîtes. */
const gapBetween = (previous: Line, current: Line) => {
  // Une pastille monte plus haut que les capitales : elle prend un peu d'air.
  if (current.words.some((w) => w.pill)) return 10;
  return current.display ? (previous.display ? 8 : -4) : previous.display ? 12 : 0;
};

type Sizes = { bigSize?: number; smallSize?: number; width?: number };

/** Hauteur d'un titre, pour centrer des blocs (mesurée avec la vraie police). */
export const estimateTitleHeight = (text: string, { bigSize = 200, smallSize = 68, width = CONTENT.w }: Sizes = {}) => {
  const lines = parseTitle(text);
  return lines.reduce((height, line, i) => {
    const size = lineSize(line, bigSize, smallSize, width);
    const rows = Math.max(1, Math.ceil((lineWidthEm(line) * size) / (width + 1)));
    return height + size * (line.display ? DISPLAY_LEADING : LEAD_LEADING) * rows + (i ? gapBetween(lines[i - 1], line) : 0);
  }, 0);
};

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

/** Un mot qui sort de son masque, de bas en haut ; les mots géants pivotent très légèrement en se posant. */
const Reveal: React.FC<{ progress: number; big: boolean; children: React.ReactNode }> = ({ progress, big, children }) => (
  <span
    style={{
      display: "inline-block",
      // Le masque déborde sur les côtés et en haut (italique, accents) ; il disparaît une fois le mot posé.
      clipPath: progress < 0.999 ? `inset(-0.4em -0.35em ${big ? "-0.03em" : "-0.1em"} -0.35em)` : undefined,
    }}
  >
    <span
      style={{
        display: "inline-block",
        transform:
          progress < 0.999
            ? `translate3d(0, ${((1 - progress) * 122).toFixed(2)}%, 0) rotate(${((1 - progress) * (big ? 3.5 : 0)).toFixed(2)}deg)`
            : undefined,
        transformOrigin: "0% 100%",
        opacity: progress > 0.001 ? 1 : 0,
      }}
    >
      {children}
    </span>
  </span>
);

/** Pastille : un parallélogramme violet se déroule, puis les mots défilent comme un compteur. */
const PILL_CYCLE = 10;

const Pill: React.FC<{ words: string[]; frame: number; at: number }> = ({ words, frame, at }) => {
  const wipe = tween(frame, at, at + 14, EASE_OUT);
  // La pastille épouse le mot affiché : sa largeur glisse d'un mot au suivant.
  const widths = words.map((w) => displayWordEm(w) + 2 * PILL_PAD);
  const width = widths.reduce((current, next, i) => (i ? current + (next - current) * smooth(frame, at + 6 + i * PILL_CYCLE) : next), widths[0]);
  return (
    <span style={{ position: "relative", display: "inline-block", padding: `0 ${PILL_PAD}em` }}>
      <span
        style={{
          position: "absolute",
          left: 0,
          top: "0.02em",
          bottom: "-0.07em",
          width: `${width.toFixed(4)}em`,
          borderRadius: "0.09em",
          background: `linear-gradient(180deg, ${rgba(COLORS.violetLight, 0.55)} 0%, ${rgba(COLORS.violet, 0)} 60%), ${COLORS.violet}`,
          boxShadow: `0 0 0.4em ${rgba(COLORS.violet, 0.6 * wipe)}`,
          transform: `skewX(-9deg) scaleX(${wipe})`,
          transformOrigin: "0% 50%",
        }}
      />
      <span style={{ position: "relative", display: "inline-grid", clipPath: "inset(-0.02em -0.3em -0.05em)", verticalAlign: "top" }}>
        {words.map((word, i) => {
          const enter = at + 6 + i * PILL_CYCLE;
          const pIn = tween(frame, enter, enter + 8, EASE_OUT);
          const pOut = i < words.length - 1 ? tween(frame, enter + PILL_CYCLE, enter + PILL_CYCLE + 8, EASE_OUT) : 0;
          return (
            <span
              key={i}
              style={{
                gridArea: "1 / 1",
                color: COLORS.text,
                transform: `translate3d(0, ${((1 - pIn) * 80 - pOut * 80).toFixed(2)}%, 0)`,
                opacity: pIn * (1 - pOut),
              }}
            >
              {upper(word)}
            </span>
          );
        })}
      </span>
    </span>
  );
};

/**
 * Mot en violet. Dans une ligne géante, il est éclairé par le haut (violet clair → violet)
 * avec un halo discret : plus lumineux, donc plus lisible, qu'un aplat. La boîte déborde
 * un peu du mot pour que l'italique et les accents restent peints.
 */
const accentStyle = (display: boolean): CSSProperties =>
  display
    ? {
        display: "inline-block",
        padding: "0.16em 0.12em 0.1em",
        margin: "-0.16em -0.12em -0.1em",
        backgroundImage: `linear-gradient(180deg, ${COLORS.violetLight} 0%, ${COLORS.violetLight} 24%, ${COLORS.violet} 80%)`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        filter: `drop-shadow(0 0 0.16em ${rgba(COLORS.violet, 0.42)})`,
      }
    : { color: COLORS.violetLight };

const Segments: React.FC<{ segments: Segment[]; display: boolean }> = ({ segments, display }) => (
  <>
    {segments.map((s, i) => (
      <span key={i} style={s.accent ? accentStyle(display) : undefined}>
        {display ? upper(s.text) : s.text}
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
  /** Corps maximal des lignes géantes (réduit automatiquement si la ligne est trop longue). */
  bigSize?: number;
  smallSize?: number;
  align?: "left" | "center";
  width?: number;
  /** 0 → 1 : sortie du titre (monte et se floute). */
  exit?: number;
  style?: CSSProperties;
}> = ({ text, frame, start = 0, stagger = 5, bigSize = 200, smallSize = 68, align = "left", width = CONTENT.w, exit = 0, style }) => {
  const lines = parseTitle(text);
  const timed = titleWordTimes(text, start, stagger);

  return (
    <div
      style={{
        width,
        textAlign: align,
        opacity: 1 - exit,
        transform: exit > 0.001 ? `translate3d(0, ${(-exit * 46).toFixed(2)}px, 0)` : undefined,
        filter: exit > 0.01 ? `blur(${(exit * 10).toFixed(2)}px)` : undefined,
        ...style,
      }}
    >
      {lines.map((line, li) => {
        const size = lineSize(line, bigSize, smallSize, width);
        const fits = lineWidthEm(line) * size <= width;
        return (
          <div
            key={li}
            style={{
              ...(line.display ? displayStyle(size) : { ...leadStyle(size), color: rgba(COLORS.text, 0.92) }),
              marginTop: li ? gapBetween(lines[li - 1], line) : 0,
              whiteSpace: line.display && fits ? "nowrap" : undefined,
              textWrap: "balance",
            }}
          >
            {line.words.map((word, wi) => {
              const at = timed[li][wi];
              const space = wi < line.words.length - 1 ? " " : null;
              const content = (
                <>
                  {word.pill ? <Pill words={word.pill} frame={frame} at={at} /> : null}
                  <Segments segments={word.segments} display={line.display} />
                </>
              );
              return (
                <React.Fragment key={wi}>
                  {word.pill ? (
                    <span style={{ display: "inline-block" }}>{content}</span>
                  ) : (
                    <Reveal progress={tween(frame, at, at + (line.display ? 22 : 17), EASE_OUT)} big={line.display}>
                      {content}
                    </Reveal>
                  )}
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
