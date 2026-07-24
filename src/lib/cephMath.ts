// Pure geometry + cephalometric measurement math. No React / native dependencies,
// so this is fully unit-testable in isolation (see cephMath.test.ts).
//
// Coordinate convention (must match how landmarks are stored):
//   anterior = +x, superior = -y  (image/screen pixels grow downward).
//
// IMPORTANT — accuracy note:
//   Angles are scale-independent and correct from pixel coordinates alone.
//   Millimetre measurements require a pixel->mm scale from calibration; without it
//   they are returned as null. The directed-vector conventions for the multi-line
//   angles (U1-SN, IMPA, interincisal, U1-NA, L1-NB) follow standard cephalometric
//   practice but should be validated against a few real traced cases per clinic and
//   adjusted if a convention differs.

import { LandmarkPositions, MEASUREMENT_SPECS, Point } from './cephLandmarks';

const RAD2DEG = 180 / Math.PI;

// ---- Vector helpers -------------------------------------------------------

interface Vec {
  x: number;
  y: number;
}

function sub(a: Point, b: Point): Vec {
  return { x: a.x - b.x, y: a.y - b.y };
}

function dot(a: Vec, b: Vec): number {
  return a.x * b.x + a.y * b.y;
}

function cross(a: Vec, b: Vec): number {
  return a.x * b.y - a.y * b.x;
}

function mag(a: Vec): number {
  return Math.hypot(a.x, a.y);
}

// ---- Angle primitives -----------------------------------------------------

/** Angle (degrees, 0..180) at `vertex`, between rays vertex->a and vertex->b. */
export function angleAtVertex(a: Point, vertex: Point, b: Point): number {
  const u = sub(a, vertex);
  const v = sub(b, vertex);
  const denom = mag(u) * mag(v);
  if (denom === 0) return 0;
  const c = Math.min(1, Math.max(-1, dot(u, v) / denom));
  return Math.acos(c) * RAD2DEG;
}

/**
 * Angle (degrees, 0..180) between the directed vectors a1->a2 and b1->b2.
 * Direction matters: pass points in the anatomically conventional order.
 */
export function angleBetweenLines(a1: Point, a2: Point, b1: Point, b2: Point): number {
  const u = sub(a2, a1);
  const v = sub(b2, b1);
  const denom = mag(u) * mag(v);
  if (denom === 0) return 0;
  const c = Math.min(1, Math.max(-1, dot(u, v) / denom));
  return Math.acos(c) * RAD2DEG;
}

/** Acute angle (degrees, 0..90) between two lines, ignoring direction. */
export function acuteAngleBetweenLines(a1: Point, a2: Point, b1: Point, b2: Point): number {
  const theta = angleBetweenLines(a1, a2, b1, b2);
  return theta > 90 ? 180 - theta : theta;
}

/**
 * Signed perpendicular distance (in pixels) from point `p` to the line through
 * l1->l2. Sign is positive when p lies on the +x (anterior) side of the directed
 * line, negative on the -x side. Uses the 2-D cross product.
 */
export function signedPerpDistance(p: Point, l1: Point, l2: Point): number {
  const dir = sub(l2, l1);
  const len = mag(dir);
  if (len === 0) return 0;
  // Perpendicular distance = cross(dir, l1->p) / |dir|. We then orient the sign so
  // that "in front of the face" (larger x) reads positive.
  const raw = cross(dir, sub(p, l1)) / len;
  // `raw` is positive toward the normal (-dir.y, dir.x), whose x-component is -dir.y.
  // So raw is already anterior-positive when dir.y < 0; flip when the line points
  // downward (dir.y > 0) so that "in front of the face" (+x) always reads positive.
  return dir.y <= 0 ? raw : -raw;
}

/** Signed position of `p` projected onto the directed axis l1->l2 (anterior +). */
function signedProjection(p: Point, l1: Point, l2: Point): number {
  const dir = sub(l2, l1);
  const len = mag(dir);
  if (len === 0) return 0;
  const proj = dot(sub(p, l1), dir) / len;
  // Orient so anterior (+x direction of the axis) is positive.
  return dir.x >= 0 ? proj : -proj;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// ---- Calibration ----------------------------------------------------------

/** Pixels-per-mm from a calibration line of known real-world length. */
export function pxPerMmFrom(p1: Point, p2: Point, knownMm: number): number | null {
  if (!knownMm || knownMm <= 0) return null;
  const px = distance(p1, p2);
  if (px <= 0) return null;
  return px / knownMm;
}

// ---- Measurement computation ----------------------------------------------

export interface ComputedMeasurements {
  // Skeletal (angles)
  sna: number | null;
  snb: number | null;
  anb: number | null;
  snMp: number | null;
  fma: number | null;
  facialConvexity: number | null;
  // Dental (angles)
  u1Sn: number | null;
  u1NaDeg: number | null;
  impa: number | null;
  l1NbDeg: number | null;
  interincisalAngle: number | null;
  // mm measurements (null unless pxPerMm provided)
  wits: number | null;
  u1NaMm: number | null;
  l1NbMm: number | null;
  overjet: number | null;
  overbite: number | null;
  upperLipELine: number | null;
  lowerLipELine: number | null;
  // Soft tissue (angle)
  nasolabialAngle: number | null;
}

const round1 = (v: number): number => Math.round(v * 10) / 10;

/** True if every listed landmark id is present in `pos`. */
function has(pos: LandmarkPositions, ...ids: string[]): boolean {
  return ids.every((id) => pos[id] != null);
}

/**
 * Compute all supported cephalometric measurements from placed landmarks.
 * Any measurement whose landmarks are missing (or which needs mm-calibration when
 * `pxPerMm` is null) is returned as null.
 */
export function computeMeasurements(
  pos: LandmarkPositions,
  pxPerMm: number | null = null,
): ComputedMeasurements {
  const out: ComputedMeasurements = {
    sna: null, snb: null, anb: null, snMp: null, fma: null, facialConvexity: null,
    u1Sn: null, u1NaDeg: null, impa: null, l1NbDeg: null, interincisalAngle: null,
    wits: null, u1NaMm: null, l1NbMm: null, overjet: null, overbite: null,
    upperLipELine: null, lowerLipELine: null, nasolabialAngle: null,
  };

  // Skeletal angles
  if (has(pos, 'S', 'N', 'A')) out.sna = round1(angleAtVertex(pos.S, pos.N, pos.A));
  if (has(pos, 'S', 'N', 'B')) out.snb = round1(angleAtVertex(pos.S, pos.N, pos.B));
  if (out.sna != null && out.snb != null) out.anb = round1(out.sna - out.snb);
  if (has(pos, 'S', 'N', 'Go', 'Me')) out.snMp = round1(acuteAngleBetweenLines(pos.S, pos.N, pos.Go, pos.Me));
  if (has(pos, 'Po', 'Or', 'Go', 'Me')) out.fma = round1(acuteAngleBetweenLines(pos.Po, pos.Or, pos.Go, pos.Me));
  // Hard-tissue facial convexity = 180 - angle(N, A, Pog); 0 = straight, + = convex.
  if (has(pos, 'N', 'A', 'Pog')) out.facialConvexity = round1(180 - angleAtVertex(pos.N, pos.A, pos.Pog));

  // Dental angles (directed conventions, see file header)
  if (has(pos, 'U1A', 'U1T', 'S', 'N')) out.u1Sn = round1(angleBetweenLines(pos.U1T, pos.U1A, pos.S, pos.N));
  if (has(pos, 'U1A', 'U1T', 'N', 'A')) out.u1NaDeg = round1(angleBetweenLines(pos.U1A, pos.U1T, pos.N, pos.A));
  if (has(pos, 'L1A', 'L1T', 'Go', 'Me')) out.impa = round1(angleBetweenLines(pos.L1A, pos.L1T, pos.Go, pos.Me));
  if (has(pos, 'L1A', 'L1T', 'N', 'B')) out.l1NbDeg = round1(angleBetweenLines(pos.L1T, pos.L1A, pos.N, pos.B));
  if (has(pos, 'U1A', 'U1T', 'L1A', 'L1T')) out.interincisalAngle = round1(angleBetweenLines(pos.U1T, pos.U1A, pos.L1T, pos.L1A));

  // Soft-tissue angle
  if (has(pos, 'Pr', 'Sn', 'Ls')) out.nasolabialAngle = round1(angleAtVertex(pos.Pr, pos.Sn, pos.Ls));

  // mm measurements require calibration
  if (pxPerMm && pxPerMm > 0) {
    // Wits: AO-BO along the functional occlusal plane (midpoint of incisor tips to
    // midpoint of first molars). Positive => A ahead of B (Class II tendency).
    if (has(pos, 'A', 'B', 'U1T', 'L1T', 'U6', 'L6')) {
      const occ1: Point = { x: (pos.U1T.x + pos.L1T.x) / 2, y: (pos.U1T.y + pos.L1T.y) / 2 };
      const occ2: Point = { x: (pos.U6.x + pos.L6.x) / 2, y: (pos.U6.y + pos.L6.y) / 2 };
      const ao = signedProjection(pos.A, occ1, occ2);
      const bo = signedProjection(pos.B, occ1, occ2);
      out.wits = round1((ao - bo) / pxPerMm);
    }
    if (has(pos, 'U1T', 'N', 'A')) out.u1NaMm = round1(signedPerpDistance(pos.U1T, pos.N, pos.A) / pxPerMm);
    if (has(pos, 'L1T', 'N', 'B')) out.l1NbMm = round1(signedPerpDistance(pos.L1T, pos.N, pos.B) / pxPerMm);
    // Overjet: horizontal gap between incisal edges (anterior +).
    if (has(pos, 'U1T', 'L1T')) out.overjet = round1((pos.U1T.x - pos.L1T.x) / pxPerMm);
    // Overbite: vertical overlap of incisal edges.
    if (has(pos, 'U1T', 'L1T')) out.overbite = round1((pos.L1T.y - pos.U1T.y) / pxPerMm);
    // Ricketts E-line: perpendicular distance of lip to Pr-Pog' line (behind = negative).
    if (has(pos, 'Ls', 'Pr', 'Pogs')) out.upperLipELine = round1(signedPerpDistance(pos.Ls, pos.Pr, pos.Pogs) / pxPerMm);
    if (has(pos, 'Li', 'Pr', 'Pogs')) out.lowerLipELine = round1(signedPerpDistance(pos.Li, pos.Pr, pos.Pogs) / pxPerMm);
  }

  return out;
}

/** List of measurement keys that cannot be computed yet (missing landmarks). */
export function missingForMeasurements(pos: LandmarkPositions): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const spec of MEASUREMENT_SPECS) {
    const missing = spec.landmarks.filter((id) => pos[id] == null);
    if (missing.length > 0) result[spec.key] = missing;
  }
  return result;
}
