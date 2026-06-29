import { CephalometricInput, OciResult, CategoryScore, OciWeights, NormativeRange } from './types';

// Default normative ranges for clinical cephalometrics
export const Norms: Record<string, NormativeRange> = {
  sna: { min: 80, max: 84, mean: 82, unit: '°', label: 'SNA' },
  snb: { min: 78, max: 82, mean: 80, unit: '°', label: 'SNB' },
  anb: { min: 0, max: 4, mean: 2, unit: '°', label: 'ANB' },
  wits: { min: -2, max: 2, mean: 0, unit: 'mm', label: 'Wits Appraisal' },
  snMp: { min: 27, max: 37, mean: 32, unit: '°', label: 'SN-MP' },
  fma: { min: 21, max: 29, mean: 25, unit: '°', label: 'FMA' },

  u1Sn: { min: 99, max: 109, mean: 104, unit: '°', label: 'U1-SN' },
  u1NaDeg: { min: 17, max: 27, mean: 22, unit: '°', label: 'U1-NA (°)' },
  u1NaMm: { min: 2, max: 6, mean: 4, unit: 'mm', label: 'U1-NA (mm)' },

  impa: { min: 85, max: 95, mean: 90, unit: '°', label: 'IMPA' },
  l1NbDeg: { min: 20, max: 30, mean: 25, unit: '°', label: 'L1-NB (°)' },
  l1NbMm: { min: 2, max: 6, mean: 4, unit: 'mm', label: 'L1-NB (mm)' },

  interincisalAngle: { min: 130, max: 140, mean: 135, unit: '°', label: 'Interincisal Angle' },
  overjet: { min: 1.5, max: 3.5, mean: 2.5, unit: 'mm', label: 'Overjet' },
  overbite: { min: 1.5, max: 3.5, mean: 2.5, unit: 'mm', label: 'Overbite' },

  upperLipELine: { min: -4, max: 0, mean: -2, unit: 'mm', label: 'Upper Lip to E-Line' },
  lowerLipELine: { min: -2, max: 2, mean: 0, unit: 'mm', label: 'Lower Lip to E-Line' },
  nasolabialAngle: { min: 94, max: 110, mean: 102, unit: '°', label: 'Nasolabial Angle' },
  facialConvexity: { min: 8, max: 16, mean: 12, unit: '°', label: 'Facial Convexity' },
};

// Default weights for OCI
export const DEFAULT_WEIGHTS: OciWeights = {
  skeletal: 20,
  maxillaryDental: 15,
  mandibularDental: 20,
  interincisal: 10,
  overjetOverbite: 10,
  softTissue: 15,
  overallHarmony: 10,
};

export function calculateOCI(input: CephalometricInput, weights: OciWeights = DEFAULT_WEIGHTS): OciResult {
  const categoryScores: CategoryScore[] = [];

  // Extract variables with default fallback to normative means
  const sna = input.sna !== '' ? Number(input.sna) : 82;
  const snb = input.snb !== '' ? Number(input.snb) : 80;
  const anb = input.anb !== '' ? Number(input.anb) : 2;
  const wits = input.wits !== '' ? Number(input.wits) : 0;

  const u1Sn = input.u1Sn !== '' ? Number(input.u1Sn) : 104;
  const u1NaDeg = input.u1NaDeg !== '' ? Number(input.u1NaDeg) : 22;
  const u1NaMm = input.u1NaMm !== '' ? Number(input.u1NaMm) : 4;

  const impa = input.impa !== '' ? Number(input.impa) : 90;
  const l1NbDeg = input.l1NbDeg !== '' ? Number(input.l1NbDeg) : 25;
  const l1NbMm = input.l1NbMm !== '' ? Number(input.l1NbMm) : 4;

  const interincisalAngle = input.interincisalAngle !== '' ? Number(input.interincisalAngle) : 135;
  const overjet = input.overjet !== '' ? Number(input.overjet) : 2.5;
  const overbite = input.overbite !== '' ? Number(input.overbite) : 2.5;

  const upperLipELine = input.upperLipELine !== '' ? Number(input.upperLipELine) : -2;
  const lowerLipELine = input.lowerLipELine !== '' ? Number(input.lowerLipELine) : 0;
  const nasolabialAngle = input.nasolabialAngle !== '' ? Number(input.nasolabialAngle) : 102;

  // 1. Determine Skeletal Pattern (Class I, II, or III)
  let skeletalPattern: 'Class I' | 'Class II' | 'Class III' = 'Class I';
  if (anb < 0) {
    skeletalPattern = 'Class III';
  } else if (anb > 4.5) {
    skeletalPattern = 'Class II';
  } else {
    skeletalPattern = 'Class I';
  }

  // 1. Skeletal Compensation (Max: 20)
  // Evaluates sagittal discrepancies (ANB, Wits) and jaw imbalances.
  const anbDev = Math.abs(anb - 2);
  const anbScore = Math.min(Math.max(0, anbDev - 2) * 2.5, 10); // max 10

  const witsDev = Math.abs(wits - 0);
  const witsScore = Math.min(Math.max(0, witsDev - 2) * 2, 6); // max 6

  const snaDev = Math.abs(sna - 82);
  const snbDev = Math.abs(snb - 80);
  const snaSnbScore = Math.min((Math.max(0, snaDev - 2) + Math.max(0, snbDev - 2)) * 1.0, 4); // max 4

  const skeletalScore = Math.round(anbScore + witsScore + snaSnbScore);

  categoryScores.push({
    name: 'Skeletal Compensation',
    score: skeletalScore,
    maxScore: 20,
    severity: getSeverity(skeletalScore, 20),
    details: `Skeletal Pattern Class ${skeletalPattern}. ANB: ${anb}° (Norm: 2°), Wits: ${wits}mm (Norm: 0mm), SNA: ${sna}°/SNB: ${snb}°.`
  });

  // 2. Maxillary Dental Compensation (Max: 15)
  // Measures tipping and displacement of maxillary incisors relative to anterior skull base and maxilla.
  const u1SnDev = Math.abs(u1Sn - 104);
  const u1SnScore = Math.min(Math.max(0, u1SnDev - 5) * 1.0, 6); // max 6

  const u1NaDegDev = Math.abs(u1NaDeg - 22);
  const u1NaDegScore = Math.min(Math.max(0, u1NaDegDev - 5) * 1.0, 5); // max 5

  const u1NaMmDev = Math.abs(u1NaMm - 4);
  const u1NaMmScore = Math.min(Math.max(0, u1NaMmDev - 2) * 1.5, 4); // max 4

  const maxillaryScore = Math.round(u1SnScore + u1NaDegScore + u1NaMmScore);

  categoryScores.push({
    name: 'Maxillary Dental Compensation',
    score: maxillaryScore,
    maxScore: 15,
    severity: getSeverity(maxillaryScore, 15),
    details: `U1-SN: ${u1Sn}° (Norm: 104°), U1-NA: ${u1NaDeg}° / ${u1NaMm}mm. Shows compensatory tipping of the maxillary incisors.`
  });

  // 3. Mandibular Dental Compensation (Max: 20)
  // Evaluates position and proclination of lower incisors relative to the mandibular plane.
  const impaDev = Math.abs(impa - 90);
  const impaScore = Math.min(Math.max(0, impaDev - 5) * 1.25, 8); // max 8

  const l1NbDegDev = Math.abs(l1NbDeg - 25);
  const l1NbDegScore = Math.min(Math.max(0, l1NbDegDev - 5) * 1.25, 7); // max 7

  const l1NbMmDev = Math.abs(l1NbMm - 4);
  const l1NbMmScore = Math.min(Math.max(0, l1NbMmDev - 2) * 1.5, 5); // max 5

  const mandibularScore = Math.round(impaScore + l1NbDegScore + l1NbMmScore);

  categoryScores.push({
    name: 'Mandibular Dental Compensation',
    score: mandibularScore,
    maxScore: 20,
    severity: getSeverity(mandibularScore, 20),
    details: `IMPA: ${impa}° (Norm: 90°), L1-NB: ${l1NbDeg}° / ${l1NbMm}mm. Displays lower incisor tilt masking skeletal sagittal gaps.`
  });

  // 4. Interincisal Relationship (Max: 10)
  // Reflects combined tipping status.
  const interincisalDev = Math.abs(interincisalAngle - 135);
  const interincisalScore = Math.round(Math.min(Math.max(0, interincisalDev - 5) * 0.5, 10)); // max 10

  categoryScores.push({
    name: 'Interincisal Relationship',
    score: interincisalScore,
    maxScore: 10,
    severity: getSeverity(interincisalScore, 10),
    details: `Interincisal Angle: ${interincisalAngle}° (Norm: 135°). Reveals bimaxillary protrusion (<125°) or upright retroclination (>140°).`
  });

  // 5. Overjet/Overbite Compensation (Max: 10)
  // Compares anterior occlusion relative to skeletal pattern limits.
  const ojDev = Math.abs(overjet - 2.5);
  const ojScore = Math.min(Math.max(0, ojDev - 1.0) * 1.25, 5); // max 5

  const overbiteMm = overbite > 10 ? overbite * 0.08 : overbite; // percentage conversion fallback
  const obDev = Math.abs(overbiteMm - 2.5);
  const obScore = Math.min(Math.max(0, obDev - 1.0) * 1.25, 5); // max 5

  const overjetOverbiteScore = Math.round(ojScore + obScore);

  categoryScores.push({
    name: 'Overjet/Overbite Compensation',
    score: overjetOverbiteScore,
    maxScore: 10,
    severity: getSeverity(overjetOverbiteScore, 10),
    details: `Overjet: ${overjet}mm (Norm: 2.5mm), Overbite: ${overbite}${overbite > 10 ? '%' : 'mm'} (Norm: 2.5mm / 30%).`
  });

  // 6. Soft Tissue Compensation (Max: 15)
  // Evaluates upper and lower lip profiles relative to E-Line and nasolabial angle.
  const upperLipDev = Math.abs(upperLipELine - (-2));
  const upperLipScore = Math.min(Math.max(0, upperLipDev - 2) * 1.5, 5); // max 5

  const lowerLipDev = Math.abs(lowerLipELine - 0);
  const lowerLipScore = Math.min(Math.max(0, lowerLipDev - 2) * 1.5, 5); // max 5

  const nasolabialDev = Math.abs(nasolabialAngle - 102);
  const nasolabialScore = Math.min(Math.max(0, nasolabialDev - 8) * 0.4, 5); // max 5

  const softTissueScore = Math.round(upperLipScore + lowerLipScore + nasolabialScore);

  categoryScores.push({
    name: 'Soft Tissue Compensation',
    score: softTissueScore,
    maxScore: 15,
    severity: getSeverity(softTissueScore, 15),
    details: `Upper Lip to E-line: ${upperLipELine}mm (Norm: -2mm), Lower Lip to E-line: ${lowerLipELine}mm (Norm: 0mm), Nasolabial: ${nasolabialAngle}° (Norm: 102°).`
  });

  // 7. Overall Harmony/Compensation (Max: 10)
  // Measures the degree of general dental-skeletal balance.
  const overallScore = Math.round((skeletalScore / 20 * 3) + (maxillaryScore / 15 * 3) + (mandibularScore / 20 * 4));

  categoryScores.push({
    name: 'Overall Harmony/Compensation',
    score: overallScore,
    maxScore: 10,
    severity: getSeverity(overallScore, 10),
    details: `Weighted index aggregation representing total holistic facial balance and compensation load.`
  });

  // Calculate Total Score (Sum of categories, guaranteed <= 100)
  const totalScore = Math.min(
    categoryScores.reduce((sum, item) => sum + item.score, 0),
    100
  );

  // Determine Interpretation
  let interpretation: OciResult['interpretation'] = 'Minimal Compensation';
  if (totalScore <= 20) interpretation = 'Minimal Compensation';
  else if (totalScore <= 40) interpretation = 'Mild Compensation';
  else if (totalScore <= 60) interpretation = 'Moderate Compensation';
  else if (totalScore <= 80) interpretation = 'Severe Compensation';
  else interpretation = 'Extreme Compensation';

  // Determine Recommendation based on OCI & Skeletal Discrepancy
  let recommendation = 'Conventional Orthodontics';
  const isSevereSkeletal = anb > 6 || anb < -2;

  if (totalScore <= 20) {
    recommendation = 'Conventional Orthodontics (Excellent candidate for direct biomechanical alignment with minimal compensation)';
  } else if (totalScore <= 40) {
    recommendation = 'Camouflage Highly Feasible (Dentoalveolar system has reasonable adaptive capacity; standard orthodontics is recommended)';
  } else if (totalScore <= 60) {
    if (isSevereSkeletal) {
      recommendation = 'Borderline Camouflage Case (Camouflage vs. Surgical Option depends heavily on soft tissue profile & patient aesthetics)';
    } else {
      recommendation = 'Conventional Orthodontics with minor extractions/IPR or active torque management';
    }
  } else if (totalScore <= 80) {
    recommendation = 'Orthognathic Consultation Suggested (Skeletal limit reached; orthognathic surgical planning is highly advisable)';
  } else {
    recommendation = 'Presurgical Decompensation Recommended (Highly compromised dentoalveolar system; must reverse compensations before surgery)';
  }

  // Calculate severity map colors for schematic face heatmap
  const severityMap: OciResult['severityMap'] = {
    upperIncisors: getSeverityColor(maxillaryScore, 15),
    lowerIncisors: getSeverityColor(mandibularScore, 20),
    softTissue: getSeverityColor(softTissueScore, 15),
    occlusion: getSeverityColor(overjetOverbiteScore, 10),
    transverse: getSeverityColor(overallScore, 10),
  };

  return {
    totalScore,
    interpretation,
    recommendation,
    categoryScores,
    severityMap,
  };
}

function getSeverity(score: number, max: number): CategoryScore['severity'] {
  const pct = score / max;
  if (pct <= 0.2) return 'Minimal';
  if (pct <= 0.4) return 'Mild';
  if (pct <= 0.6) return 'Moderate';
  if (pct <= 0.8) return 'Severe';
  return 'Extreme';
}

function getSeverityColor(score: number, max: number): OciResult['severityMap']['upperIncisors'] {
  const pct = score / max;
  if (pct <= 0.2) return 'green';
  if (pct <= 0.5) return 'yellow';
  if (pct <= 0.8) return 'orange';
  return 'red';
}
