// Cephalometric landmark definitions for the OCI Analyzer tracing feature.
//
// These are the anatomical points a clinician places (or an ML model detects) on a
// lateral cephalogram. Every angular/linear measurement is derived purely from these
// points, so getting the points right is what makes the measurements correct.
//
// Orientation convention used throughout the ceph math: the cephalogram faces RIGHT,
// i.e. anterior = +x, and because screen/image pixels grow downward, superior = -y.

export type LandmarkType = 'skeletal' | 'dental' | 'soft-tissue';

export interface LandmarkDef {
  id: string;
  name: string;
  abbreviation: string;
  type: LandmarkType;
  description: string;
  // Whether this point is one of the "core" ISBI-19-style landmarks that a
  // pre-trained model can auto-detect in Phase 1. Non-core points (incisor apices,
  // molars, some soft-tissue) must be placed manually until a fuller model exists.
  core: boolean;
}

export interface Point {
  x: number;
  y: number;
}

// A placed tracing: landmark id -> pixel coordinates on the (original) image.
export type LandmarkPositions = Record<string, Point>;

export const LANDMARKS: LandmarkDef[] = [
  { id: 'S', name: 'Sella', abbreviation: 'S', type: 'skeletal', core: true, description: 'Center of Sella Turcica (pituitary fossa). Key cranial base landmark.' },
  { id: 'N', name: 'Nasion', abbreviation: 'N', type: 'skeletal', core: true, description: 'Most anterior point of the frontonasal suture.' },
  { id: 'Po', name: 'Porion', abbreviation: 'Po', type: 'skeletal', core: true, description: 'Highest point on the margin of the external auditory meatus.' },
  { id: 'Or', name: 'Orbitale', abbreviation: 'Or', type: 'skeletal', core: true, description: 'Lowest point on the margin of the bony orbit.' },
  { id: 'ANS', name: 'Anterior Nasal Spine', abbreviation: 'ANS', type: 'skeletal', core: true, description: 'Tip of the bony anterior nasal spine at the palatal plane.' },
  { id: 'PNS', name: 'Posterior Nasal Spine', abbreviation: 'PNS', type: 'skeletal', core: true, description: 'Tip of the posterior nasal spine of the palatal bone.' },
  { id: 'A', name: 'Point A (Subspinale)', abbreviation: 'A', type: 'skeletal', core: true, description: 'Deepest midline point on the maxilla between ANS and the incisor.' },
  { id: 'B', name: 'Point B (Supramentale)', abbreviation: 'B', type: 'skeletal', core: true, description: 'Deepest midline point on the mandibular alveolar symphysis.' },
  { id: 'Pog', name: 'Pogonion', abbreviation: 'Pog', type: 'skeletal', core: true, description: 'Most anterior point on the bony mandibular chin symphysis.' },
  { id: 'Gn', name: 'Gnathion', abbreviation: 'Gn', type: 'skeletal', core: true, description: 'Most antero-inferior point on the bony symphysis contour.' },
  { id: 'Me', name: 'Menton', abbreviation: 'Me', type: 'skeletal', core: true, description: 'Lowest point on the inferior border of the mandibular symphysis.' },
  { id: 'Go', name: 'Gonion', abbreviation: 'Go', type: 'skeletal', core: true, description: 'Midpoint on the curvature of the mandibular angle.' },
  { id: 'Ar', name: 'Articulare', abbreviation: 'Ar', type: 'skeletal', core: true, description: 'Intersection of the cranial base and the posterior border of the mandibular ramus.' },
  { id: 'Ba', name: 'Basion', abbreviation: 'Ba', type: 'skeletal', core: false, description: 'Lowest point on the anterior margin of the foramen magnum.' },

  { id: 'U1T', name: 'Upper Incisor Tip', abbreviation: 'U1T', type: 'dental', core: true, description: 'Incisal edge of the most prominent maxillary central incisor.' },
  { id: 'U1A', name: 'Upper Incisor Apex', abbreviation: 'U1A', type: 'dental', core: false, description: 'Root apex of the most prominent maxillary central incisor.' },
  { id: 'L1T', name: 'Lower Incisor Tip', abbreviation: 'L1T', type: 'dental', core: true, description: 'Incisal edge of the most prominent mandibular central incisor.' },
  { id: 'L1A', name: 'Lower Incisor Apex', abbreviation: 'L1A', type: 'dental', core: false, description: 'Root apex of the most prominent mandibular central incisor.' },
  { id: 'U6', name: 'Upper First Molar', abbreviation: 'U6', type: 'dental', core: false, description: 'Mesiobuccal cusp tip of the maxillary first permanent molar.' },
  { id: 'L6', name: 'Lower First Molar', abbreviation: 'L6', type: 'dental', core: false, description: 'Mesiobuccal cusp tip of the mandibular first permanent molar.' },

  { id: 'Pr', name: 'Pronasale', abbreviation: 'Pr', type: 'soft-tissue', core: false, description: 'Most anterior point of the soft-tissue nose contour (tip of nose).' },
  { id: 'Sn', name: 'Subnasale', abbreviation: 'Sn', type: 'soft-tissue', core: true, description: 'Junction of the nasal septum base and the philtrum of the upper lip.' },
  { id: 'Ls', name: 'Labrale Superius', abbreviation: 'Ls', type: 'soft-tissue', core: true, description: 'Most prominent point on the midline contour of the upper lip.' },
  { id: 'Li', name: 'Labrale Inferius', abbreviation: 'Li', type: 'soft-tissue', core: true, description: 'Most prominent point on the midline contour of the lower lip.' },
  { id: 'Ns', name: 'Soft Tissue Nasion', abbreviation: "N'", type: 'soft-tissue', core: false, description: 'Deepest point of the soft-tissue concavity of the nasal bridge.' },
  { id: 'Pogs', name: 'Soft Tissue Pogonion', abbreviation: "Pog'", type: 'soft-tissue', core: true, description: 'Most anterior point on the soft-tissue chin.' },
  { id: 'Mes', name: 'Soft Tissue Menton', abbreviation: "Me'", type: 'soft-tissue', core: false, description: 'Lowest point on the soft-tissue chin contour.' },
];

export const LANDMARK_BY_ID: Record<string, LandmarkDef> = LANDMARKS.reduce(
  (acc, lm) => {
    acc[lm.id] = lm;
    return acc;
  },
  {} as Record<string, LandmarkDef>,
);

// Which landmarks each computed measurement depends on. Used to:
//  - tell the user which points still need placing for a given measurement,
//  - grey out measurements that cannot yet be computed,
//  - flag measurements that require mm-calibration (see requiresScale).
export interface MeasurementSpec {
  key: string;         // matches CephalometricInput keys where applicable
  label: string;
  unit: '°' | 'mm';
  landmarks: string[]; // landmark ids required
  requiresScale: boolean; // true => needs px->mm calibration to be valid
}

export const MEASUREMENT_SPECS: MeasurementSpec[] = [
  { key: 'sna', label: 'SNA', unit: '°', landmarks: ['S', 'N', 'A'], requiresScale: false },
  { key: 'snb', label: 'SNB', unit: '°', landmarks: ['S', 'N', 'B'], requiresScale: false },
  { key: 'anb', label: 'ANB', unit: '°', landmarks: ['S', 'N', 'A', 'B'], requiresScale: false },
  { key: 'snMp', label: 'SN-MP', unit: '°', landmarks: ['S', 'N', 'Go', 'Me'], requiresScale: false },
  { key: 'fma', label: 'FMA (FH-MP)', unit: '°', landmarks: ['Po', 'Or', 'Go', 'Me'], requiresScale: false },
  { key: 'u1Sn', label: 'U1-SN', unit: '°', landmarks: ['U1A', 'U1T', 'S', 'N'], requiresScale: false },
  { key: 'u1NaDeg', label: 'U1-NA angle', unit: '°', landmarks: ['U1A', 'U1T', 'N', 'A'], requiresScale: false },
  { key: 'u1NaMm', label: 'U1-NA distance', unit: 'mm', landmarks: ['U1T', 'N', 'A'], requiresScale: true },
  { key: 'impa', label: 'IMPA (L1-MP)', unit: '°', landmarks: ['L1A', 'L1T', 'Go', 'Me'], requiresScale: false },
  { key: 'l1NbDeg', label: 'L1-NB angle', unit: '°', landmarks: ['L1A', 'L1T', 'N', 'B'], requiresScale: false },
  { key: 'l1NbMm', label: 'L1-NB distance', unit: 'mm', landmarks: ['L1T', 'N', 'B'], requiresScale: true },
  { key: 'interincisalAngle', label: 'Interincisal', unit: '°', landmarks: ['U1A', 'U1T', 'L1A', 'L1T'], requiresScale: false },
  { key: 'overjet', label: 'Overjet', unit: 'mm', landmarks: ['U1T', 'L1T'], requiresScale: true },
  { key: 'overbite', label: 'Overbite', unit: 'mm', landmarks: ['U1T', 'L1T'], requiresScale: true },
  { key: 'wits', label: 'Wits appraisal', unit: 'mm', landmarks: ['A', 'B', 'U6', 'L6'], requiresScale: true },
  { key: 'upperLipELine', label: 'Upper lip to E-line', unit: 'mm', landmarks: ['Ls', 'Pr', 'Pogs'], requiresScale: true },
  { key: 'lowerLipELine', label: 'Lower lip to E-line', unit: 'mm', landmarks: ['Li', 'Pr', 'Pogs'], requiresScale: true },
  { key: 'nasolabialAngle', label: 'Nasolabial angle', unit: '°', landmarks: ['Pr', 'Sn', 'Ls'], requiresScale: false },
  { key: 'facialConvexity', label: 'Facial convexity', unit: '°', landmarks: ['N', 'A', 'Pog'], requiresScale: false },
];
