/**
 * Tracé du circuit de la scène 2 : le vrai tracé de Spa-Francorchamps (voir spa.ts),
 * ajusté dans une boîte de 856 × 1000 px (le « plan »), lissé (Catmull-Rom) et mesuré
 * pour placer un point à n'importe quelle fraction du tour.
 *
 * La caméra est calculée ici (projection 3D faite en code) : le tracé est dessiné
 * directement en coordonnées écran, net à tous les niveaux de zoom.
 */
import { SPA_CORNERS, SPA_PHOTO, SPA_POINTS, SPA_SECTORS, SPA_SIZE } from "./spa";

export type Pt = { x: number; y: number };

export const TRACK_BOX = { w: 856, h: 1000 };
const MARGIN = 40;

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Pt, b: Pt, k = 1): Pt => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const len = (a: Pt) => Math.hypot(a.x, a.y);
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

  // Boucle fermée lissée (Catmull-Rom), échantillonnée finement.
  const samples: Pt[] = [P[0]];
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const b1 = add(p1, sub(p2, p0), 1 / 6);
    const b2 = add(p2, sub(p3, p1), -1 / 6);
    for (let s = 1; s <= 6; s++) samples.push(cubic(p1, b1, b2, p2, s / 6));
  }
  const cumulative = [0];
  for (let i = 1; i < samples.length; i++) cumulative.push(cumulative[i - 1] + len(sub(samples[i], samples[i - 1])));
  const total = cumulative[cumulative.length - 1];
  const fracs = cumulative.map((c) => c / total);

  const pointAt = (fraction: number): Pt => {
    const f = ((fraction % 1) + 1) % 1;
    let i = 1;
    while (i < fracs.length - 1 && fracs[i] < f) i++;
    const span = fracs[i] - fracs[i - 1] || 1;
    return add(samples[i - 1], sub(samples[i], samples[i - 1]), (f - fracs[i - 1]) / span);
  };

  /** Points de la boucle de la fraction `from` sur une longueur `length` (avec passage par l'arrivée). */
  const slice = (from: number, length: number): Pt[] => {
    if (length <= 0) return [];
    const out: Pt[] = [pointAt(from)];
    const end = from + Math.min(1, length);
    const startTurn = Math.floor(from);
    for (let turn = startTurn; turn <= Math.floor(end); turn++) {
      for (let i = 0; i < fracs.length; i++) {
        const f = turn + fracs[i];
        if (f > from && f < end) out.push(samples[i]);
      }
    }
    out.push(pointAt(end));
    return out;
  };

  const centroid = P.reduce((c, p) => ({ x: c.x + p.x / n, y: c.y + p.y / n }), { x: 0, y: 0 });
  const tangent = sub(at(1), at(-1));
  const t = len(tangent) || 1;

  // Photo aérienne dans le plan : plan = (scale / k) · R(−phi) · photo + décalage.
  const r = scale / SPA_PHOTO.k;
  const cos = Math.cos(SPA_PHOTO.phi);
  const sin = Math.sin(SPA_PHOTO.phi);
  const photoToBox = (p: Pt): Pt => {
    const x = p.x - SPA_PHOTO.tx;
    const y = p.y - SPA_PHOTO.ty;
    return { x: ox + r * (cos * x + sin * y), y: oy + r * (-sin * x + cos * y) };
  };

  return {
    /** Unités du plan par mètre réel. */
    metre: scale,
    pointAt,
    slice,
    centroid,
    start: P[0],
    /** Direction perpendiculaire à la piste sur la ligne de départ. */
    startNormal: { x: -tangent.y / t, y: tangent.x / t },
    corners: SPA_CORNERS.map((c) => ({ name: c.name, fraction: c.at, apex: pointAt(c.at) })),
    sectors: SPA_SECTORS,
    /** Fraction où le tracé commence à se dessiner : le bord haut de la photo. */
    drawFrom: SPA_PHOTO.drawFrom,
    photo: {
      width: SPA_PHOTO.width,
      height: SPA_PHOTO.height,
      /** Taille d'un pixel de la photo, en unités du plan. */
      pixel: r,
      /** Rotation à donner à la caméra pour voir la photo droite (degrés). */
      uprightAngle: (SPA_PHOTO.phi * 180) / Math.PI,
      center: photoToBox({ x: SPA_PHOTO.width / 2, y: SPA_PHOTO.height / 2 }),
      origin: photoToBox({ x: 0, y: 0 }),
      /** Axes de la photo dans le plan (vecteurs d'un pixel en x et en y). */
      ux: { x: r * cos, y: -r * sin },
      uy: { x: r * sin, y: r * cos },
    },
  };
};

export const TRACK = build();

/** Caméra : point du plan visé, point d'écran où il apparaît, zoom, rotation et inclinaison. */
export type Camera = { target: Pt; anchor: Pt; zoom: number; angle: number; tilt: number };

export const PERSPECTIVE = 1500;
/** Point de fuite de la perspective, en coordonnées écran. */
export const EYE = { x: 508, y: 700 };

/** Projette un point du plan à l'écran (rotation, inclinaison 3D puis perspective). */
export const project = (p: Pt, cam: Camera): Pt => {
  const x0 = (p.x - cam.target.x) * cam.zoom;
  const y0 = (p.y - cam.target.y) * cam.zoom;
  const a = (cam.angle * Math.PI) / 180;
  const x1 = x0 * Math.cos(a) - y0 * Math.sin(a);
  const y1 = x0 * Math.sin(a) + y0 * Math.cos(a);
  const t = (cam.tilt * Math.PI) / 180;
  const X = x1 + cam.anchor.x;
  const Y = y1 * Math.cos(t) + cam.anchor.y;
  const Z = y1 * Math.sin(t);
  const k = PERSPECTIVE / (PERSPECTIVE - Z);
  return { x: EYE.x + (X - EYE.x) * k, y: EYE.y + (Y - EYE.y) * k };
};

/** Matrice CSS 2D qui pose la photo à l'écran pour une caméra sans inclinaison. */
export const photoMatrix = (cam: Camera) => {
  const o = project(TRACK.photo.origin, { ...cam, tilt: 0 });
  const a = (cam.angle * Math.PI) / 180;
  const rot = (v: Pt): Pt => ({
    x: (v.x * Math.cos(a) - v.y * Math.sin(a)) * cam.zoom,
    y: (v.x * Math.sin(a) + v.y * Math.cos(a)) * cam.zoom,
  });
  const ux = rot(TRACK.photo.ux);
  const uy = rot(TRACK.photo.uy);
  return `matrix(${ux.x}, ${ux.y}, ${uy.x}, ${uy.y}, ${o.x}, ${o.y})`;
};
