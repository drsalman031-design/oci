export interface PatientDetails {
  name: string;
  age: number | '';
  gender: 'Male' | 'Female' | 'Other' | '';
  caseNumber: string;
  diagnosis: 'Class II' | 'Class III' | 'Class I' | '';
  date: string;
  clinicalNotes: string;
}

export interface CephalometricInput {
  // Skeletal
  anb: number | '';
  sna: number | '';
  snb: number | '';
  wits: number | '';
  snMp: number | '';
  fma: number | '';

  // Upper Incisor
  u1Sn: number | '';
  u1NaDeg: number | '';
  u1NaMm: number | '';

  // Lower Incisor
  impa: number | '';
  l1NbDeg: number | '';
  l1NbMm: number | '';

  // Combined
  interincisalAngle: number | '';
  overjet: number | '';
  overbite: number | '';

  // Soft Tissue
  upperLipELine: number | '';
  lowerLipELine: number | '';
  nasolabialAngle: number | '';
  facialConvexity: number | '';

  // Occlusion
  molarRelation: 'Class I' | 'Class II' | 'Class III' | '';
  canineRelation: 'Class I' | 'Class II' | 'Class III' | '';
  crossbite: 'None' | 'Anterior' | 'Posterior' | 'Single Tooth' | '';
  deepBite: number | ''; // in mm
  openBite: number | ''; // in mm
  curveOfSpee: number | ''; // in mm
  midlineDeviation: number | ''; // in mm

  // Transverse
  posteriorCrossbite: 'None' | 'Unilateral' | 'Bilateral' | '';
  archWidthDifference: number | ''; // in mm (Maxilla vs Mandible)
  dentalMidlineDev: number | ''; // in mm
}

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  severity: 'Minimal' | 'Mild' | 'Moderate' | 'Severe' | 'Extreme';
  details: string;
}

export interface OciResult {
  totalScore: number;
  interpretation: 'Minimal Compensation' | 'Mild Compensation' | 'Moderate Compensation' | 'Severe Compensation' | 'Extreme Compensation';
  recommendation: string;
  categoryScores: CategoryScore[];
  severityMap: {
    upperIncisors: 'green' | 'yellow' | 'orange' | 'red';
    lowerIncisors: 'green' | 'yellow' | 'orange' | 'red';
    softTissue: 'green' | 'yellow' | 'orange' | 'red';
    occlusion: 'green' | 'yellow' | 'orange' | 'red';
    transverse: 'green' | 'yellow' | 'orange' | 'red';
  };
}

export interface Assessment {
  id: string;
  patientDetails: PatientDetails;
  cephalometricInput: CephalometricInput;
  ociResult: OciResult;
  aiSummary: string;
  createdAt: string;
}

export interface NormativeRange {
  min: number;
  max: number;
  mean: number;
  unit: string;
  label: string;
}

export interface OciWeights {
  skeletal: number;       // Max: 15
  upperIncisor: number;   // Max: 15
  lowerIncisor: number;   // Max: 20
  interincisal: number;   // Max: 10
  overjet: number;        // Max: 10
  softTissue: number;     // Max: 10
  occlusion: number;      // Max: 10
  transverse: number;     // Max: 10
}
