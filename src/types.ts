export interface PatientDetails {
  name: string;
  age: number | '';
  gender: 'Male' | 'Female' | 'Other' | '';
  caseNumber: string;
  diagnosis: 'Class II' | 'Class III' | 'Class I' | '';
  date: string;
  clinicalNotes: string;
  facialProfile?: 'Straight' | 'Convex' | 'Concave' | '';
  smileAnalysis?: 'Consonant' | 'Non-Consonant' | 'Gummy' | 'Flat' | '';
  crowdingSpacing?: 'None' | 'Crowding' | 'Spacing' | '';
  dentitionPhase?: 'Primary Dentition' | 'Mixed Dentition' | 'Permanent Dentition' | '';
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

export interface AdvancedClinicalIntelligence {
  cvmStage?: string;
  growthStatus?: string;
  skeletalMaturity?: string;
  extractionRecommendation?: string;
  extractionProbability?: string;
  extractionReason?: string;
  surgeryRecommendation?: string;
  surgeryProbability?: string;
  surgeryReason?: string;
  anchorageRequirement?: string;
  suggestedAnchorage?: string;
  difficultyScore?: string;
  complexity?: string;
  estimatedDuration?: string;
  estimatedAppointments?: string;
  estimatedRetention?: string;
  relapseRisk?: string;
  relapseProbability?: string;
  relapseReason?: string;
  ociSkeletalContribution?: string;
  ociDentalContribution?: string;
  ociSoftTissueContribution?: string;
  ociScoreExplanation?: string;
  diagnosticConfidence?: string;
  treatmentConfidence?: string;
  borderlineCategory?: string;
  borderlineReason?: string;
  skeletalProblems?: string;
  dentalProblems?: string;
  softTissueProblems?: string;
  functionalProblems?: string;
  primaryObjectives?: string;
  secondaryObjectives?: string;
  longTermObjectives?: string;
  treatmentSequence?: string;
  contraindications?: string;
  contraindicationReason?: string;
  primaryPlanOption?: string;
  alternativePlan1?: string;
  alternativePlan2?: string;
  overallPrognosis?: string;
  skeletalCorrectionPotential?: string;
  dentalCorrectionPotential?: string;
  softTissueImprovement?: string;
  longTermStability?: string;
  successProbability?: string;
  explanationWhy?: string;
  decisionTrace?: string;
  riskAlerts?: string;
  finalClinicalSummary?: string;
}

export interface Assessment {
  id: string;
  patientDetails: PatientDetails;
  cephalometricInput: CephalometricInput;
  ociResult: OciResult;
  aiSummary: string;
  createdAt: string;
  advanced?: AdvancedClinicalIntelligence;
}

export interface NormativeRange {
  min: number;
  max: number;
  mean: number;
  unit: string;
  label: string;
}

export interface OciWeights {
  skeletal: number;       // Max: 20
  maxillaryDental: number; // Max: 15
  mandibularDental: number; // Max: 20
  interincisal: number;   // Max: 10
  overjetOverbite: number; // Max: 10
  softTissue: number;     // Max: 15
  overallHarmony: number; // Max: 10
}

export type UserRole = 'Developer' | 'Administrator' | 'Orthodontist' | 'Faculty' | 'Resident' | 'Staff';

export interface UserProfile {
  id: string; // Email (lowercase)
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  passwordHash: string;
  role: UserRole;
  createdDate: string;
  lastLogin: string;
  status: 'Active' | 'Disabled';
  googleAccountConnected: boolean;
  driveBackupEnabled: boolean;
  lastBackup?: string;
}

export interface UserPermission {
  fullAccess: boolean;
  patientManagement: boolean;
  validationLab: boolean;
  cloudSync: boolean;
  reports: boolean;
  settings: boolean;
  databaseManagement: boolean;
  userManagement: boolean;
  import: boolean;
  export: boolean;
}

