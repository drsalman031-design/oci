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
  skeletal: 15,
  upperIncisor: 15,
  lowerIncisor: 20,
  interincisal: 10,
  overjet: 10,
  softTissue: 10,
  occlusion: 10,
  transverse: 10,
};

// Helper to calculate absolute deviation normalized to a score
function getDeviationRatio(val: number | '', norm: NormativeRange, maxTolerance: number = 10): number {
  if (val === '') return 0;
  const dev = Math.abs(val - norm.mean);
  const idealRange = (norm.max - norm.min) / 2;
  
  if (dev <= idealRange) {
    return 0; // within normal range
  }
  
  // normalized deviation ratio up to 1.0
  const excessDev = dev - idealRange;
  return Math.min(excessDev / maxTolerance, 1.0);
}

export function calculateOCI(input: CephalometricInput, weights: OciWeights = DEFAULT_WEIGHTS): OciResult {
  const categoryScores: CategoryScore[] = [];

  // 1. Skeletal Discrepancy (Max: weights.skeletal)
  // Higher skeletal deviation means more severe malocclusion.
  const anbDev = getDeviationRatio(input.anb, Norms.anb, 6);
  const witsDev = getDeviationRatio(input.wits, Norms.wits, 6);
  const fmaDev = getDeviationRatio(input.fma, Norms.fma, 8);
  const skeletalRatio = (anbDev * 0.5 + witsDev * 0.3 + fmaDev * 0.2);
  const skeletalScore = Math.round(skeletalRatio * weights.skeletal);
  categoryScores.push({
    name: 'Skeletal Discrepancy',
    score: skeletalScore,
    maxScore: weights.skeletal,
    severity: getSeverity(skeletalScore, weights.skeletal),
    details: `Skeletal Class deviation assessed via ANB (${input.anb || 'N/A'}°), Wits (${input.wits !== '' ? input.wits + 'mm' : 'N/A'}), and vertical FMA (${input.fma || 'N/A'}°).`
  });

  // 2. Upper Incisor Compensation (Max: weights.upperIncisor)
  // Reflects dental compensation in the maxilla.
  const u1SnDev = getDeviationRatio(input.u1Sn, Norms.u1Sn, 15);
  const u1NaDegDev = getDeviationRatio(input.u1NaDeg, Norms.u1NaDeg, 15);
  const u1NaMmDev = getDeviationRatio(input.u1NaMm, Norms.u1NaMm, 5);
  const upperRatio = (u1SnDev * 0.4 + u1NaDegDev * 0.4 + u1NaMmDev * 0.2);
  const upperScore = Math.round(upperRatio * weights.upperIncisor);
  categoryScores.push({
    name: 'Upper Incisor Compensation',
    score: upperScore,
    maxScore: weights.upperIncisor,
    severity: getSeverity(upperScore, weights.upperIncisor),
    details: `Maxillary incisor tipping/displacement (U1-SN: ${input.u1Sn || 'N/A'}°, U1-NA: ${input.u1NaDeg || 'N/A'}° / ${input.u1NaMm || 'N/A'}mm).`
  });

  // 3. Lower Incisor Compensation (Max: weights.lowerIncisor)
  // Reflects dental compensation in the mandible (crucial in both Class II & III).
  const impaDev = getDeviationRatio(input.impa, Norms.impa, 15);
  const l1NbDegDev = getDeviationRatio(input.l1NbDeg, Norms.l1NbDeg, 15);
  const l1NbMmDev = getDeviationRatio(input.l1NbMm, Norms.l1NbMm, 5);
  const lowerRatio = (impaDev * 0.4 + l1NbDegDev * 0.4 + l1NbMmDev * 0.2);
  const lowerScore = Math.round(lowerRatio * weights.lowerIncisor);
  categoryScores.push({
    name: 'Lower Incisor Compensation',
    score: lowerScore,
    maxScore: weights.lowerIncisor,
    severity: getSeverity(lowerScore, weights.lowerIncisor),
    details: `Mandibular incisor tipping/displacement (IMPA: ${input.impa || 'N/A'}°, L1-NB: ${input.l1NbDeg || 'N/A'}° / ${input.l1NbMm || 'N/A'}mm).`
  });

  // 4. Interincisal Angle (Max: weights.interincisal)
  // Reflects the combined relationship of upper & lower incisors.
  const interincisalDev = getDeviationRatio(input.interincisalAngle, Norms.interincisalAngle, 20);
  const interincisalScore = Math.round(interincisalDev * weights.interincisal);
  categoryScores.push({
    name: 'Interincisal Relationship',
    score: interincisalScore,
    maxScore: weights.interincisal,
    severity: getSeverity(interincisalScore, weights.interincisal),
    details: `Interincisal angle (${input.interincisalAngle || 'N/A'}°) reflecting relative protrusion or retroclination.`
  });

  // 5. Overjet Compensation (Max: weights.overjet)
  // If skeletal ANB is severely Class II (>6°) or Class III (< -1°),
  // but overjet is compensated to normal (1.5 - 3.5mm), we have extreme dental compensation.
  // If overjet is severe (e.g. 10mm in Class II, or -5mm in Class III), we have LESS dental compensation.
  let overjetRatio = 0;
  if (input.anb !== '' && input.overjet !== '') {
    const anbVal = input.anb;
    const ojVal = input.overjet;
    // Ideal skeletal Class I (ANB = 2°) generally has normal overjet (~2.5mm).
    // Let's measure mismatch.
    const expectedOverjet = 2.5 + (anbVal - 2) * 0.8; // theoretical overjet without compensation
    const compensationAmount = Math.abs(expectedOverjet - ojVal);
    overjetRatio = Math.min(compensationAmount / 8, 1.0);
  } else {
    overjetRatio = getDeviationRatio(input.overjet, Norms.overjet, 5);
  }
  const overjetScore = Math.round(overjetRatio * weights.overjet);
  categoryScores.push({
    name: 'Overjet Compensation',
    score: overjetScore,
    maxScore: weights.overjet,
    severity: getSeverity(overjetScore, weights.overjet),
    details: `Clinical overjet (${input.overjet !== '' ? input.overjet + 'mm' : 'N/A'}) compared against expected skeletal overjet profile.`
  });

  // 6. Soft Tissue Compensation (Max: weights.softTissue)
  const lipUDev = getDeviationRatio(input.upperLipELine, Norms.upperLipELine, 4);
  const lipLDev = getDeviationRatio(input.lowerLipELine, Norms.lowerLipELine, 4);
  const nasoDev = getDeviationRatio(input.nasolabialAngle, Norms.nasolabialAngle, 15);
  const softRatio = (lipUDev * 0.3 + lipLDev * 0.3 + nasoDev * 0.4);
  const softTissueScore = Math.round(softRatio * weights.softTissue);
  categoryScores.push({
    name: 'Soft Tissue Masking',
    score: softTissueScore,
    maxScore: weights.softTissue,
    severity: getSeverity(softTissueScore, weights.softTissue),
    details: `Lip to E-Line (${input.upperLipELine || '0'}mm / ${input.lowerLipELine || '0'}mm) and nasolabial angle (${input.nasolabialAngle || 'N/A'}°).`
  });

  // 7. Occlusal Compensation (Max: weights.occlusion)
  // Hard/soft categorical inputs
  let occlRatio = 0;
  let occlCount = 0;
  if (input.molarRelation) {
    occlCount++;
    if (input.molarRelation !== 'Class I') occlRatio += 0.4;
  }
  if (input.canineRelation) {
    occlCount++;
    if (input.canineRelation !== 'Class I') occlRatio += 0.3;
  }
  if (input.crossbite && input.crossbite !== 'None') {
    occlCount++;
    occlRatio += 0.2;
  }
  if (input.deepBite !== '') {
    occlCount++;
    if (input.deepBite > 4) occlRatio += 0.2;
  }
  if (input.openBite !== '') {
    occlCount++;
    if (input.openBite > 0) occlRatio += 0.2;
  }
  if (input.curveOfSpee !== '') {
    occlCount++;
    if (input.curveOfSpee > 2) occlRatio += 0.1;
  }
  
  const occlFactor = occlCount > 0 ? Math.min(occlRatio, 1.0) : 0;
  const occlusalScore = Math.round(occlFactor * weights.occlusion);
  categoryScores.push({
    name: 'Occlusal Compensation',
    score: occlusalScore,
    maxScore: weights.occlusion,
    severity: getSeverity(occlusalScore, weights.occlusion),
    details: `Molar Relation (${input.molarRelation || 'N/A'}), Deep bite (${input.deepBite || '0'}mm), Curve of Spee (${input.curveOfSpee || '0'}mm).`
  });

  // 8. Transverse Compensation (Max: weights.transverse)
  let transRatio = 0;
  let transCount = 0;
  if (input.posteriorCrossbite && input.posteriorCrossbite !== 'None') {
    transCount++;
    transRatio += input.posteriorCrossbite === 'Bilateral' ? 0.6 : 0.4;
  }
  if (input.archWidthDifference !== '') {
    transCount++;
    // Normal arch width diff maxilla vs mandible is ~0-2mm. Significant mismatch triggers high compensation.
    const diff = Math.abs(input.archWidthDifference);
    if (diff > 4) transRatio += 0.4;
    else if (diff > 2) transRatio += 0.2;
  }
  if (input.dentalMidlineDev !== '') {
    transCount++;
    if (input.dentalMidlineDev > 2) transRatio += 0.2;
  }

  const transFactor = transCount > 0 ? Math.min(transRatio, 1.0) : 0;
  const transverseScore = Math.round(transFactor * weights.transverse);
  categoryScores.push({
    name: 'Transverse Compensation',
    score: transverseScore,
    maxScore: weights.transverse,
    severity: getSeverity(transverseScore, weights.transverse),
    details: `Transverse base discrepancy and dental arch width mismatch (${input.archWidthDifference || '0'}mm diff).`
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
  const isClassIII = input.anb !== '' && input.anb < 0;
  const isSevereSkeletal = input.anb !== '' && (input.anb > 6 || input.anb < -2);

  if (totalScore <= 20) {
    recommendation = 'Conventional Orthodontics (Excellent candidate for direct biomechanical alignment)';
  } else if (totalScore <= 40) {
    recommendation = 'Camouflage Possible (Dentoalveolar system has adaptive capacity; standard orthodontic corrections)';
  } else if (totalScore <= 60) {
    if (isSevereSkeletal) {
      recommendation = 'Borderline Case (Camouflage vs. Surgical Option depends heavily on soft tissue profile & patient desires)';
    } else {
      recommendation = 'Conventional Orthodontics with minor extractions/IPR or custom torque mechanics';
    }
  } else if (totalScore <= 80) {
    recommendation = 'Orthognathic Consultation Suggested (Skeletal limit reached; orthodontic-surgical plan advisable)';
  } else {
    recommendation = 'Presurgical Decompensation Recommended (Highly compromised dentition; must reverse compensation before orthognathic surgery)';
  }

  // Calculate severity map colors for schematic face heatmap
  const severityMap: OciResult['severityMap'] = {
    upperIncisors: getSeverityColor(upperScore, weights.upperIncisor),
    lowerIncisors: getSeverityColor(lowerScore, weights.lowerIncisor),
    softTissue: getSeverityColor(softTissueScore, weights.softTissue),
    occlusion: getSeverityColor(occlusalScore, weights.occlusion),
    transverse: getSeverityColor(transverseScore, weights.transverse),
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
