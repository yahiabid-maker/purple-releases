/**
 * Tracé de circuit INVENTÉ pour la scène 2 : un polygone dessiné à la main dont
 * les sommets sont arrondis. Il ne reprend aucun circuit existant.
 * Repère local : boîte de 860 × 900 px.
 */

export type Pt = { x: number; y: number };
type Vertex = Pt & { r: number };

export const TRACK_BOX = { w: 860, h: 900 };

/** Point de départ / ligne d'arrivée, sur la ligne droite du bas. */
const START: Pt = { x: 240, y: 846 };

/** Sommets parcourus dans le sens du tour ; r = longueur du raccord arrondi. */
const VERTICES: Vertex[] = [
  { x: 700, y: 846, r: 90 },
  { x: 810, y: 700, r: 50 },
  { x: 770, y: 470, r: 140 },
  { x: 560, y: 380, r: 40 },
  { x: 640, y: 220, r: 40 },
  { x: 800, y: 180, r: 40 },
  { x: 760, y: 50, r: 40 },
  { x: 250, y: 50, r: 80 },
  { x: 60, y: 200, r: 60 },
  { x: 210, y: 380, r: 60 },
  { x: 480, y: 560, r: 60 },
  { x: 330, y: 680, r: 40 },
  { x: 140, y: 560, r: 50 },
  { x: 50, y: 700, r: 60 },
  { x: 90, y: 846, r: 50 },
];

/** Les trois virages mis en avant (indices dans VERTICES), dans l'ordre du tour. */
const HIGHLIGHTED = [3, 8, 11];

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Pt, b: Pt, k = 1): Pt => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const len = (a: Pt) => Math.hypot(a.x, a.y);
const unit = (a: Pt): Pt => {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l };
};
const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});
const fmt = (p: Pt) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

const build = () => {
  const n = VERTICES.length;
  let d = `M ${fmt(START)}`;
  const samples: Pt[] = [START];
  const corners: { index: number; apex: Pt; path: string; sampleIndex: number }[] = [];

  for (let i = 0; i < n; i++) {
    const v = VERTICES[i];
    const prev = i === 0 ? START : VERTICES[i - 1];
    const next = i === n - 1 ? START : VERTICES[i + 1];
    const dirIn = unit(sub(v, prev));
    const dirOut = unit(sub(next, v));
    const rIn = Math.min(v.r, len(sub(v, prev)) * 0.46);
    const rOut = Math.min(v.r, len(sub(next, v)) * 0.46);
    const a = add(v, dirIn, -rIn);
    const b = add(v, dirOut, rOut);
    d += ` L ${fmt(a)} Q ${fmt(v)} ${fmt(b)}`;

    samples.push(a);
    const apexSample = samples.length + 11;
    for (let s = 1; s <= 24; s++) samples.push(quad(a, v, b, s / 24));

    // Portion mise en couleur : le raccord, prolongé de 34 px de chaque côté.
    const pre = add(a, dirIn, -34);
    const post = add(b, dirOut, 34);
    corners.push({
      index: i,
      apex: quad(a, v, b, 0.5),
      path: `M ${fmt(pre)} L ${fmt(a)} Q ${fmt(v)} ${fmt(b)} L ${fmt(post)}`,
      sampleIndex: apexSample,
    });
  }
  d += ` L ${fmt(START)}`;
  samples.push(START);

  // Longueurs cumulées, pour placer un point à n'importe quelle fraction du tour.
  const cumulative = [0];
  for (let i = 1; i < samples.length; i++) {
    cumulative.push(cumulative[i - 1] + len(sub(samples[i], samples[i - 1])));
  }
  const total = cumulative[cumulative.length - 1];

  const pointAt = (fraction: number): Pt => {
    const target = Math.max(0, Math.min(1, fraction)) * total;
    let i = 1;
    while (i < cumulative.length - 1 && cumulative[i] < target) i++;
    const span = cumulative[i] - cumulative[i - 1] || 1;
    const k = (target - cumulative[i - 1]) / span;
    return add(samples[i - 1], sub(samples[i], samples[i - 1]), k);
  };

  return {
    d,
    start: START,
    pointAt,
    corners: HIGHLIGHTED.map((index) => {
      const c = corners[index];
      return { apex: c.apex, path: c.path, fraction: cumulative[c.sampleIndex] / total };
    }),
  };
};

export const TRACK = build();
