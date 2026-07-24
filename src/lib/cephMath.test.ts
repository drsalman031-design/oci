// Lightweight self-contained tests for the ceph geometry/measurement math.
// Run with:  npx tsx src/lib/cephMath.test.ts
// No test framework needed; exits non-zero on first failure.

import {
  angleAtVertex,
  angleBetweenLines,
  acuteAngleBetweenLines,
  signedPerpDistance,
  distance,
  pxPerMmFrom,
  computeMeasurements,
} from './cephMath';
import { LandmarkPositions } from './cephLandmarks';

let failures = 0;
function approx(actual: number | null, expected: number, tol: number, name: string) {
  if (actual == null || Math.abs(actual - expected) > tol) {
    console.error(`FAIL ${name}: expected ~${expected} (±${tol}), got ${actual}`);
    failures++;
  } else {
    console.log(`ok   ${name}: ${actual}`);
  }
}

// --- Primitive: angleAtVertex --------------------------------------------
// Right angle at origin between +x and -y (up on screen).
approx(angleAtVertex({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -1 }), 90, 1e-6, 'angleAtVertex right angle');
// Straight line = 180
approx(angleAtVertex({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }), 180, 1e-6, 'angleAtVertex straight');
// 45 degrees
approx(angleAtVertex({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: -1 }), 45, 1e-6, 'angleAtVertex 45');

// --- Primitive: angleBetweenLines (directed) -----------------------------
// Same direction => 0
approx(angleBetweenLines({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 5, y: 5 }, { x: 6, y: 5 }), 0, 1e-6, 'angleBetweenLines parallel');
// Opposite direction => 180
approx(angleBetweenLines({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }, { x: -1, y: 0 }), 180, 1e-6, 'angleBetweenLines opposite');
// Perpendicular => 90
approx(angleBetweenLines({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }), 90, 1e-6, 'angleBetweenLines perp');

// --- Primitive: acuteAngleBetweenLines -----------------------------------
approx(acuteAngleBetweenLines({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }, { x: -1, y: 0.0001 }), 0, 0.1, 'acute of opposite ~0');
approx(acuteAngleBetweenLines({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: -1 }), 45, 1e-6, 'acute 45');

// --- Primitive: signedPerpDistance ---------------------------------------
// Vertical line x=0 directed upward (0,0)->(0,-1). Point at x=3 is anterior (+).
approx(signedPerpDistance({ x: 3, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -1 }), 3, 1e-6, 'signedPerp anterior +');
// Point at x=-3 is posterior (-).
approx(signedPerpDistance({ x: -3, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -1 }), -3, 1e-6, 'signedPerp posterior -');

// --- Primitive: distance & calibration -----------------------------------
approx(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5, 1e-6, 'distance 3-4-5');
approx(pxPerMmFrom({ x: 0, y: 0 }, { x: 100, y: 0 }, 20), 5, 1e-6, 'pxPerMm 100px=20mm => 5');

// --- Measurement: SNA/SNB/ANB with a constructed tracing -----------------
// Place N at origin. S behind-and-up. A and B below N with A slightly more anterior.
// Using anterior=+x, superior=-y.
const pos: LandmarkPositions = {
  S: { x: -120, y: -15 },   // posterior, slightly superior of N
  N: { x: 0, y: 0 },
  A: { x: 10, y: 100 },     // below N, anterior
  B: { x: 0, y: 130 },      // below N, on N vertical
};
// SNA = angle at N between N->S and N->A.
// N->S = (-120,-15), N->A = (10,100). Compute expected by hand:
// cos = (-120*10 + -15*100)/(|..||..|) = (-1200-1500)/(120.93*100.50)= -2700/12153 = -0.2222 => 102.84
approx(computeMeasurements(pos).sna, 102.8, 0.3, 'SNA constructed');
// SNB = angle at N between N->S and N->B. N->B=(0,130).
// cos = (-120*0 + -15*130)/(120.93*130) = -1950/15721 = -0.124 => 97.13
approx(computeMeasurements(pos).snb, 97.1, 0.3, 'SNB constructed');
// ANB = SNA - SNB = 102.8 - 97.1 = 5.7
approx(computeMeasurements(pos).anb, 5.7, 0.4, 'ANB constructed');

// --- Measurement: mm requires calibration --------------------------------
const posMm: LandmarkPositions = {
  U1T: { x: 100, y: 0 },
  L1T: { x: 90, y: 5 },
};
// Without scale => overjet null.
approx((computeMeasurements(posMm).overjet ?? -999), -999, 0, 'overjet null without scale');
// With scale 5 px/mm: overjet = (100-90)/5 = 2mm.
approx(computeMeasurements(posMm, 5).overjet, 2, 1e-6, 'overjet 2mm with scale');
// overbite = (5-0)/5 = 1mm.
approx(computeMeasurements(posMm, 5).overbite, 1, 1e-6, 'overbite 1mm with scale');

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log('\nAll ceph math tests passed');
}
