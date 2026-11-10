/**
 * Tracé du circuit de la scène 2 : le vrai tracé de Spa-Francorchamps (voir spa.ts),
 * ajusté dans une boîte de 856 × 1000 px, lissé (Catmull-Rom) et mesuré pour pouvoir
 * placer un point à n'importe quelle fraction du tour.
 */
import { SPA_CORNERS, SPA_POINTS, SPA_SECTORS, SPA_SIZE } from "./spa";

export type Pt = { x: number; y: number };

export const TRACK_BOX = { w: 856, h: 1000 };
const MARGIN = 40;

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Pt, b: Pt, k = 1): Pt => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const len = (a: Pt) => Math.hypot(a.x, a.y);
const fmt = (p: Pt) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
const cubic = (a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
};

const build = () => {
  const scale = Math.min((TRACK_BOX.w - 2 * MARGIN) / SPA_SIZE.w, (TRACK_BOX.h - 2 * MARGIN) / SPA_SIZE.h);
  const ox = (TRACK_BOX.w - SPA_SIZE.w * scale) / 2;
  const oy = (TRACK_BOX.h - SPA_SIZE.h * scale) / 2;
  const P: Pt[] = SPA_POINTS.map(([x, y]) => ({ x: ox + x * scale, y: oy + y * scale }));
  const n = P.length;
  const at = (i: number) => P[((i % n) + n) % n];

  // Boucle fermée lissée : chaque segment devient une courbe de Bézier (Catmull-Rom).
  let d = `M ${fmt(P[0])}`;
  const samples: Pt[] = [P[0]];
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const b1 = add(p1, sub(p2, p0), 1 / 6);
    const b2 = add(p2, sub(p3, p1), -1 / 6);
    d += ` C ${fmt(b1)} ${fmt(b2)} ${fmt(p2)}`;
    for (let s = 1; s <= 6; s++) samples.push(cubic(p1, b1, b2, p2, s / 6));
  }
  d += " Z";

  const cumulative = [0];
  for (let i = 1; i < samples.length; i++) cumulative.push(cumulative[i - 1] + len(sub(samples[i], samples[i - 1])));
  const total = cumulative[cumulative.length - 1];

  const pointAt = (fraction: number): Pt => {
    const target = Math.max(0, Math.min(1, fraction)) * total;
    let i = 1;
    while (i < cumulative.length - 1 && cumulative[i] < target) i++;
    const span = cumulative[i] - cumulative[i - 1] || 1;
    return add(samples[i - 1], sub(samples[i], samples[i - 1]), (target - cumulative[i - 1]) / span);
  };

  const centroid = P.reduce((c, p) => ({ x: c.x + p.x / n, y: c.y + p.y / n }), { x: 0, y: 0 });
  const tangent = sub(at(1), at(-1));
  const t = len(tangent) || 1;

  return {
    d,
    pointAt,
    centroid,
    start: P[0],
    /** Direction perpendiculaire à la piste sur la ligne de départ. */
    startNormal: { x: -tangent.y / t, y: tangent.x / t },
    corners: SPA_CORNERS.map((c) => ({ name: c.name, fraction: c.at, apex: pointAt(c.at) })),
    sectors: SPA_SECTORS,
  };
};

export const TRACK = build();

/**
 * Projette un point du plan du circuit (coordonnées de la boîte) à l'écran, avec la même
 * caméra CSS que la scène 2 : perspective sur le parent, puis rotateX · rotateZ · scale.
 * Sert à poser des étiquettes droites (non inclinées) au-dessus du plan 3D.
 */
export const projectOnStage = (
  p: Pt,
  cam: { tilt: number; spin: number; zoom: number },
  { perspective = 1500, origin = { x: 0.5, y: 0.55 }, eye = { x: 0.5, y: 0.2 } } = {},
): Pt => {
  const ox = TRACK_BOX.w * origin.x;
  const oy = TRACK_BOX.h * origin.y;
  const x0 = (p.x - ox) * cam.zoom;
  const y0 = (p.y - oy) * cam.zoom;
  const s = (cam.spin * Math.PI) / 180;
  const x1 = x0 * Math.cos(s) - y0 * Math.sin(s);
  const y1 = x0 * Math.sin(s) + y0 * Math.cos(s);
  const r = (cam.tilt * Math.PI) / 180;
  const x2 = x1 + ox;
  const y2 = y1 * Math.cos(r) + oy;
  const z2 = y1 * Math.sin(r);
  const ex = TRACK_BOX.w * eye.x;
  const ey = TRACK_BOX.h * eye.y;
  const k = perspective / (perspective - z2);
  return { x: ex + (x2 - ex) * k, y: ey + (y2 - ey) * k };
};
