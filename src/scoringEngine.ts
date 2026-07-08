import { CephalometricInput, OciResult, CategoryScore, OciWeights, NormativeRange, PatientDetails } from './types';

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
  const anb = input.anb !== '' ? Number(input.anb) : 2;
  const sna = input.sna !== '' ? Number(input.sna) : 82;
  const snb = input.snb !== '' ? Number(input.snb) : 80;
  const wits = input.wits !== '' ? Number(input.wits) : -1;
  const fma = input.fma !== '' ? Number(input.fma) : 25;
  const snMp = input.snMp !== '' ? Number(input.snMp) : 32;

  const u1Sn = input.u1Sn !== '' ? Number(input.u1Sn) : 104;
  const impa = input.impa !== '' ? Number(input.impa) : 90;
  const overjet = input.overjet !== '' ? Number(input.overjet) : 2.5;

  // Layer 1: Normalization (Convert cephalometrics to Z-scores)
  const zSna = (sna - 82) / 2;
  const zSnb = (snb - 80) / 2;
  const zAnb = (anb - 2) / 2;
  const zWits = (wits - (-1)) / 2;
  const zFma = (fma - 25) / 3;
  const zSnMp = (snMp - 32) / 3;

  // Approximate or read yAxis, coA, and coGn
  const yAxis = input.yAxis !== '' && input.yAxis !== undefined ? Number(input.yAxis) : 59 + (fma - 25) * 1.0;
  const coA = input.coA !== '' && input.coA !== undefined ? Number(input.coA) : 85 + (sna - 82) * 1.5;
  const coGn = input.coGn !== '' && input.coGn !== undefined ? Number(input.coGn) : 110 + (snb - 80) * 2.0;

  const zYaxis = (yAxis - 59) / 3;
  const zCoA = (coA - 85) / 3;
  const zCoGn = (coGn - 110) / 4;

  // Layer 2: Module Analysis
  const ms = 0.5 * zSna;
  const mns = 0.5 * zSnb;
  const srs = (zAnb + zWits) / 2;

  // Layer 3: Vertical Growth
  const vcs = (zFma + zSnMp + zYaxis) / 3;

  // Layer 4: Size Discrepancy
  const sds = zCoGn - zCoA;

  // Layer 5: Compensation Engine
  const si = Math.max(0, (Math.abs(srs) * 2.0) + (Math.abs(vcs) * 1.0)); // Skeletal Severity Index
  const sc = Math.abs(sds) * 1.5; // Size Discrepancy Index

  // Compensation Modifier (CM) based on dental compensation (U1-SN, IMPA, Overjet)
  const zU1Sn = (u1Sn - 104) / 5;
  const zImpa = (impa - 90) / 5;
  const zOverjet = (overjet - 2.5) / 1;
  const cm = Math.max(0, (Math.abs(zU1Sn) + Math.abs(zImpa) + Math.abs(zOverjet)) / 3 * 0.15);

  // Final OCI score calculation (clamped to 0 - 10)
  let rawScore = (si + sc) * (1 + cm);
  rawScore = Math.min(10.0, Math.max(0.0, rawScore));
  
  const totalScore = Math.round(rawScore * 10); // Scale out of 100 for backward compatibility

  // Determine Interpretation based on 5-tier Clinical Meaning scale
  let interpretation = 'Normal';
  if (rawScore <= 2.0) interpretation = 'Normal';
  else if (rawScore <= 4.0) interpretation = 'Mild';
  else if (rawScore <= 6.0) interpretation = 'Moderate';
  else if (rawScore <= 8.0) interpretation = 'Severe';
  else interpretation = 'Surgical-level';

  // 1. Skeletal Classification
  let skeletalClassification = 'Class I Normal Sagittal Relationship';
  if (anb > 4.5) skeletalClassification = `Class II Malocclusion (ANB: ${anb}°)`;
  else if (anb < 0) skeletalClassification = `Class III Malocclusion (ANB: ${anb}°)`;

  // 2. Maxilla/Mandible Status
  const maxStatus = zSna > 1.5 ? 'Protrusive Maxilla' : zSna < -1.5 ? 'Retrusive Maxilla' : 'Normal Maxillary position';
  const mandStatus = zSnb > 1.5 ? 'Protrusive Mandible' : zSnb < -1.5 ? 'Retrusive Mandible' : 'Normal Mandibular position';
  const maxillaMandibleStatus = `${maxStatus}, ${mandStatus}`;

  // 3. Size Balance
  const sizeBalance = Math.abs(sds) > 1.5 
    ? `${sds > 0 ? 'Mandibular' : 'Maxillary'} dominance (Discrepancy: ${sds.toFixed(1)} SD)`
    : 'Harmonious Maxillo-Mandibular Size Balance';

  // 4. Vertical Pattern
  const verticalPattern = vcs > 1.0 
    ? `Hyperdivergent growth pattern (VCS: ${vcs.toFixed(1)} SD)`
    : vcs < -1.0 
      ? `Hypodivergent growth pattern (VCS: ${vcs.toFixed(1)} SD)`
      : 'Normodivergent vertical growth pattern';

  // 5. Compensation Level
  const compensationLevel = cm > 0.4 
    ? `High dentoalveolar compensation (CM: ${cm.toFixed(2)})`
    : cm > 0.15 
      ? `Moderate dentoalveolar compensation (CM: ${cm.toFixed(2)})`
      : `Minimal dentoalveolar compensation (CM: ${cm.toFixed(2)})`;

  // 6. Treatment Suggestion
  let treatmentSuggestion = 'Conventional Orthodontics';
  if (rawScore <= 2.0) treatmentSuggestion = 'No active skeletal therapy required; minor alignment only.';
  else if (rawScore <= 4.0) treatmentSuggestion = 'Orthodontic alignment with light mechanics (non-extraction).';
  else if (rawScore <= 6.0) treatmentSuggestion = 'Dentoalveolar camouflage therapy using intermaxillary elastics or selective extractions.';
  else if (rawScore <= 8.0) treatmentSuggestion = 'Skeletal correction with absolute anchorage (TADs) or functional appliances.';
  else treatmentSuggestion = 'Combined Orthognathic Surgery and Orthodontic decompensation is indicated.';

  const recommendation = treatmentSuggestion;

  // Build the three main category scores representing the engine layers
  const skeletalScoreVal = Math.round(Math.min(5.0, si) * 10);
  categoryScores.push({
    name: 'Skeletal Severity (SI)',
    score: skeletalScoreVal,
    maxScore: 50,
    severity: getSeverity(skeletalScoreVal, 50),
    details: `Skeletal Pattern: ${skeletalClassification}. Sagittal SRS: ${srs.toFixed(2)} SD, Vertical VCS: ${vcs.toFixed(2)} SD.`
  });

  const sizeScoreVal = Math.round(Math.min(2.0, sc) * 10);
  categoryScores.push({
    name: 'Size Discrepancy (SC)',
    score: sizeScoreVal,
    maxScore: 20,
    severity: getSeverity(sizeScoreVal, 20),
    details: `Maxillo-Mandibular Size Discrepancy: ${sds.toFixed(2)} SD. ${sizeBalance}.`
  });

  const compScoreVal = Math.round(Math.min(0.3, cm) * 100);
  categoryScores.push({
    name: 'Compensation Modifier (CM)',
    score: compScoreVal,
    maxScore: 30,
    severity: getSeverity(compScoreVal, 30),
    details: `Dental Camouflage Offset: ${compensationLevel}. U1-SN z-score: ${zU1Sn.toFixed(2)}, IMPA z-score: ${zImpa.toFixed(2)}.`
  });

  // Calculate severity map colors for schematic face heatmap
  const severityMap: OciResult['severityMap'] = {
    upperIncisors: Math.abs(zU1Sn) < 1.0 ? 'green' : Math.abs(zU1Sn) < 2.0 ? 'yellow' : Math.abs(zU1Sn) < 3.0 ? 'orange' : 'red',
    lowerIncisors: Math.abs(zImpa) < 1.0 ? 'green' : Math.abs(zImpa) < 2.0 ? 'yellow' : Math.abs(zImpa) < 3.0 ? 'orange' : 'red',
    softTissue: Math.abs(zYaxis) < 1.0 ? 'green' : Math.abs(zYaxis) < 2.0 ? 'yellow' : Math.abs(zYaxis) < 3.0 ? 'orange' : 'red',
    occlusion: Math.abs(zOverjet) < 1.0 ? 'green' : Math.abs(zOverjet) < 2.0 ? 'yellow' : Math.abs(zOverjet) < 3.0 ? 'orange' : 'red',
    transverse: rawScore < 2.0 ? 'green' : rawScore < 5.0 ? 'yellow' : rawScore < 8.0 ? 'orange' : 'red',
  };

  return {
    totalScore,
    rawScore,
    interpretation,
    recommendation,
    categoryScores,
    severityMap,
    skeletalClassification,
    maxillaMandibleStatus,
    sizeBalance,
    verticalPattern,
    compensationLevel,
    treatmentSuggestion,
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

export function calculateClinicalOCI(patient: PatientDetails, weights: OciWeights = DEFAULT_WEIGHTS): OciResult {
  // 1. Skeletal Pattern Severity (max 50)
  let skeletalScore = 0;
  let skeletalClassification = 'Class I';

  if (patient.diagnosis === 'Class II') {
    skeletalScore += 25;
    skeletalClassification = 'Class II';
  } else if (patient.diagnosis === 'Class III') {
    skeletalScore += 30;
    skeletalClassification = 'Class III';
  }

  if (patient.facialProfile === 'Convex') {
    skeletalScore += 10;
  } else if (patient.facialProfile === 'Concave') {
    skeletalScore += 15;
  }

  if (patient.facialAsymmetry === 'Mild') {
    skeletalScore += 5;
  } else if (patient.facialAsymmetry === 'Moderate') {
    skeletalScore += 15;
  } else if (patient.facialAsymmetry === 'Severe') {
    skeletalScore += 25;
  }

  skeletalScore = Math.min(50, skeletalScore);

  // 2. Dental Occlusion Severity (max 40)
  let dentalScore = 0;
  
  const hasClassII = patient.molarRelationRight === 'Class II' || patient.molarRelationLeft === 'Class II' || patient.canineRelationRight === 'Class II' || patient.canineRelationLeft === 'Class II';
  const hasClassIII = patient.molarRelationRight === 'Class III' || patient.molarRelationLeft === 'Class III' || patient.canineRelationRight === 'Class III' || patient.canineRelationLeft === 'Class III';

  if (hasClassII) dentalScore += 10;
  else if (hasClassIII) dentalScore += 12;

  const ojVal = patient.overjet !== undefined && patient.overjet !== '' ? Number(patient.overjet) : 2.5;
  const obVal = patient.overbite !== undefined && patient.overbite !== '' ? Number(patient.overbite) : 2.5;

  if (ojVal > 4) dentalScore += 8;
  else if (ojVal < 0) dentalScore += 10;

  if (obVal > 4) dentalScore += 6;
  else if (obVal < 0) dentalScore += 8;

  if (patient.anteriorCrossbite === 'Single Tooth') dentalScore += 6;
  else if (patient.anteriorCrossbite === 'Multiple') dentalScore += 12;

  if (patient.posteriorCrossbite === 'Unilateral') dentalScore += 8;
  else if (patient.posteriorCrossbite === 'Bilateral') dentalScore += 12;

  if (patient.crowdingSpacing === 'Crowding') dentalScore += 6;
  else if (patient.crowdingSpacing === 'Spacing') dentalScore += 4;

  dentalScore = Math.min(40, dentalScore);

  // 3. Soft-Tissue / Functional Severity (max 30)
  let functionalScore = 0;

  if (patient.lips === 'Incompetent') functionalScore += 10;
  else if (patient.lips === 'Potentially Competent') functionalScore += 5;

  if (patient.functionalAirway === 'Mouth Breeder') functionalScore += 10;
  
  if (patient.habits && patient.habits.length > 0) {
    functionalScore += 10;
  }

  functionalScore = Math.min(30, functionalScore);

  // Raw and Normalized scores
  const rawScore = (skeletalScore + dentalScore + functionalScore) / 10.0; // max ~ 12.0
  const totalScore = Math.min(100, Math.round(((skeletalScore + dentalScore + functionalScore) / 120.0) * 100));

  let interpretation = 'Optimal Compensation';
  let recommendation = 'Camouflage treatment via dental alignment and cosmetic detailing is highly feasible.';
  let treatmentSuggestion = 'Camouflage Therapy';

  if (totalScore <= 20) {
    interpretation = 'Optimal Compensation';
    recommendation = 'Non-extraction alignment with interproximal reduction (IPR) if required.';
  } else if (totalScore <= 45) {
    interpretation = 'Mild Compensation Limits';
    recommendation = 'Minor dental camouflage. Interarch expansion or selective IPR to resolve crowding and detail occlusion.';
  } else if (totalScore <= 70) {
    interpretation = 'Moderate Compensation Limits';
    recommendation = 'Borderline extraction case. Selective tooth extraction or skeletal anchorage (TADs) to retract segments and restore dental balance.';
    treatmentSuggestion = 'Extraction or TAD-supported Retraction';
  } else if (totalScore <= 85) {
    interpretation = 'Severe Structural Compensation Limits';
    recommendation = 'Extreme dental camouflage required. Careful biomechanical planning is necessary; risk of incisor fenestration or poor profile outcome.';
    treatmentSuggestion = 'Skeletal Anchorage / Segmental Retraction';
  } else {
    interpretation = 'Extreme Structural Limit / Surgical Threshold';
    recommendation = 'Decompensation followed by Orthognathic Surgery is recommended. Dental compensation is contraindicated due to periodontal boundaries.';
    treatmentSuggestion = 'Orthognathic Surgical Consultation';
  }

  const categoryScores: CategoryScore[] = [
    {
      name: 'Clinical Skeletal Pattern',
      score: Math.round(skeletalScore),
      maxScore: 50,
      severity: getSeverity(skeletalScore, 50),
      details: `Profile: ${patient.facialProfile || 'Normal'}, Asymmetry: ${patient.facialAsymmetry || 'None'}.`
    },
    {
      name: 'Clinical Dental Occlusion',
      score: Math.round(dentalScore),
      maxScore: 40,
      severity: getSeverity(dentalScore, 40),
      details: `Molar Relation: ${patient.molarRelationRight || 'Class I'}. Overjet: ${ojVal} mm, Overbite: ${obVal} mm.`
    },
    {
      name: 'Clinical Soft-Tissue / Functional',
      score: Math.round(functionalScore),
      maxScore: 30,
      severity: getSeverity(functionalScore, 30),
      details: `Lips: ${patient.lips || 'Competent'}, Airway: ${patient.functionalAirway || 'Normal'}.`
    }
  ];

  const severityMap: OciResult['severityMap'] = {
    upperIncisors: ojVal > 4 ? 'yellow' : 'green',
    lowerIncisors: ojVal < 0 ? 'orange' : 'green',
    softTissue: patient.lips === 'Incompetent' ? 'orange' : 'green',
    occlusion: hasClassII || hasClassIII ? 'yellow' : 'green',
    transverse: patient.posteriorCrossbite && patient.posteriorCrossbite !== 'None' ? 'orange' : 'green'
  };

  return {
    totalScore,
    rawScore,
    interpretation,
    recommendation,
    categoryScores,
    severityMap,
    skeletalClassification,
    maxillaMandibleStatus: patient.facialProfile === 'Convex' ? 'Maxillary Protrusion / Mandibular Retrusion' : patient.facialProfile === 'Concave' ? 'Mandibular Protrusion / Maxillary Deficiency' : 'Normal Mandibular/Maxillary Balance',
    sizeBalance: patient.facialAsymmetry !== 'None' ? 'Asymmetric Balance' : 'Symmetric Balance',
    verticalPattern: patient.facialProfile === 'Convex' ? 'Hyperdivergent Growth Pattern' : patient.facialProfile === 'Concave' ? 'Hypodivergent Growth Pattern' : 'Normodivergent Growth Pattern',
    compensationLevel: totalScore > 70 ? 'Extreme Dental Camouflage Required' : totalScore > 40 ? 'Moderate Camouflage Feasible' : 'Minimal Camouflage Required',
    treatmentSuggestion,
  };
}
