import { PatientDetails, CephalometricInput, OciResult } from '../types';

/**
 * ============================================================================
 * LAYER 1: KNOWLEDGE BASE
 * ============================================================================
 */
export const OrthoKnowledgeBase = {
  SkeletalSagittal: {
    ClassI: {
      label: 'Skeletal Class I',
      description: 'Normal orthognathic relation between maxilla and mandible.',
      anbRange: { min: 0.5, max: 4.5 },
      witsRange: { min: -2, max: 2 }
    },
    ClassII: {
      label: 'Skeletal Class II',
      description: 'Distoclusion with maxillary prognathism, mandibular retrognathia, or both.',
      anbRange: { min: 4.6, max: 20 },
      witsRange: { min: 2.1, max: 20 }
    },
    ClassIII: {
      label: 'Skeletal Class III',
      description: 'Mesioclusion with maxillary retrognathism, mandibular prognathism, or both.',
      anbRange: { min: -15, max: 0.4 },
      witsRange: { min: -20, max: -2.1 }
    }
  },
  VerticalPattern: {
    Normodivergent: {
      label: 'Normodivergent Vertical Pattern',
      description: 'Average vertical growth pattern with balanced facial proportions.',
      fmaRange: { min: 21, max: 29 },
      snMpRange: { min: 27, max: 37 }
    },
    Hyperdivergent: {
      label: 'Hyperdivergent Vertical Pattern',
      description: 'High-angle growth pattern characterized by clockwise rotation of the mandible and long lower face height.',
      fmaRange: { min: 29.1, max: 60 },
      snMpRange: { min: 37.1, max: 70 }
    },
    Hypodivergent: {
      label: 'Hypodivergent Vertical Pattern',
      description: 'Low-angle growth pattern characterized by counter-clockwise rotation of the mandible and deep bite tendency.',
      fmaRange: { min: 0, max: 20.9 },
      snMpRange: { min: 0, max: 26.9 }
    }
  },
  DentalCompensation: {
    LowerIncisorIMPA: {
      norm: 90,
      min: 85,
      max: 95,
      proclined: 'Mandibular incisor proclination represents a natural effort to compensate for maxillary deficiency.',
      retroclined: 'Mandibular incisor retroclination represents a natural effort to compensate for maxillary excess.'
    },
    UpperIncisorU1SN: {
      norm: 104,
      min: 99,
      max: 109,
      proclined: 'Maxillary incisor proclination masks skeletal Class II/retrognathic discrepancies.',
      retroclined: 'Maxillary incisor retroclination/uprighting masks skeletal Class III/prognathic discrepancies.'
    }
  },
  GrowthStages: {
    Growing: { minAge: 6, maxAge: 13, timing: 'Highly Indicated for orthopedic therapy (Twin Block / Protraction Mask).' },
    Adult: { minAge: 14, maxAge: 99, timing: 'Growth completed. Dentoalveolar camouflage or orthognathic surgery indicated.' }
  },
  ExtractionRules: {
    BorderlineThreshold: 50, // OCI score > 50 suggests extraction feasibility
    SurgicalThreshold: 60, // OCI score > 60 suggests orthognathic referral
    SevereCrowdingThreshold: 7 // > 7mm crowding suggests extraction necessity
  },
  RetentionRules: {
    DualRetention: 'Dual-retention protocol (fixed bonded lingual wire 3-3 paired with clear vacuum-formed overlay Essix retainer).',
    ActiveRetention: 'Class II/III dental camouflage cases require long-term active retention to preserve incisor torque coordinates.'
  }
};

/**
 * ============================================================================
 * LAYER 2: CLINICAL DECISION ENGINE
 * ============================================================================
 */
export class ClinicalDecisionEngine {
  static evaluateClinicMode(patient: PatientDetails): any {
    // Mode Isolation Validation
    if (
      (patient as any).anb !== undefined ||
      (patient as any).sna !== undefined ||
      (patient as any).impa !== undefined
    ) {
      throw new Error('MODE VIOLATION: Cephalometric variables are prohibited in Clinic Mode.');
    }

    const diagnosis = patient.diagnosis || 'Class I';
    const facialProfile = patient.facialProfile || 'Straight';
    const growthStatus = Number(patient.age) <= 13 ? 'Growing' : 'Adult';
    
    return {
      mode: 'clinic',
      diagnosis: `Skeletal ${diagnosis} sagittal pattern (Clinically estimated)`,
      profile: `${facialProfile} facial contour`,
      verticalPattern: patient.facialProfile === 'Convex' ? 'High angle vertical tendency' : 'Balanced vertical proportions',
      growthStatus,
      isGrowing: growthStatus === 'Growing'
    };
  }

  static evaluateCephMode(ceph: CephalometricInput): any {
    // Mode Isolation Validation
    if (
      (ceph as any).facialProfile !== undefined ||
      (ceph as any).lips !== undefined ||
      (ceph as any).smileAnalysis !== undefined
    ) {
      throw new Error('MODE VIOLATION: Clinical examination findings are prohibited in Ceph Mode.');
    }

    const anbVal = ceph.anb !== '' ? Number(ceph.anb) : 2;
    let diagnosis = 'Class I';
    if (anbVal < 0.5) diagnosis = 'Class III';
    else if (anbVal > 4.5) diagnosis = 'Class II';

    const fmaVal = ceph.fma !== '' ? Number(ceph.fma) : 25;
    let verticalPattern = 'Normodivergent';
    if (fmaVal > 29) verticalPattern = 'Hyperdivergent';
    else if (fmaVal < 21) verticalPattern = 'Hypodivergent';

    const u1SnVal = ceph.u1Sn !== '' ? Number(ceph.u1Sn) : 104;
    const impaVal = ceph.impa !== '' ? Number(ceph.impa) : 90;

    let upperInc = 'Normovertical';
    if (u1SnVal > 109) upperInc = 'Proclined';
    else if (u1SnVal < 99) upperInc = 'Retroclined';

    let lowerInc = 'Normovertical';
    if (impaVal > 95) lowerInc = 'Proclined';
    else if (impaVal < 85) lowerInc = 'Retroclined';

    return {
      mode: 'ceph',
      diagnosis: `Skeletal ${diagnosis} sagittal relation (ANB: ${anbVal}°)`,
      verticalPattern: `${verticalPattern} growth profile (FMA: ${fmaVal}°)`,
      upperIncisor: upperInc,
      lowerIncisor: lowerInc,
      compensationLevel: Math.abs(u1SnVal - 104) > 5 || Math.abs(impaVal - 90) > 5 ? 'Significant Dentoalveolar Compensation' : 'No Significant Compensation'
    };
  }

  static evaluateTurboMode(patient: PatientDetails, ceph: CephalometricInput): any {
    const anbVal = ceph.anb !== '' ? Number(ceph.anb) : 2;
    let diagnosis = patient.diagnosis || 'Class I';
    if (anbVal < 0.5) diagnosis = 'Class III';
    else if (anbVal > 4.5) diagnosis = 'Class II';

    const fmaVal = ceph.fma !== '' ? Number(ceph.fma) : 25;
    let verticalPattern = 'Normodivergent';
    if (fmaVal > 29) verticalPattern = 'Hyperdivergent';
    else if (fmaVal < 21) verticalPattern = 'Hypodivergent';

    const growthStatus = Number(patient.age) <= 13 ? 'Growing' : 'Adult';

    return {
      mode: 'turbo',
      diagnosis: `Integrated Skeletal ${diagnosis} sagittal relationship (ANB: ${anbVal}°, clinically consistent with ${patient.facialProfile || 'Straight'} profile)`,
      verticalPattern: `Integrated ${verticalPattern} growth pattern (FMA: ${fmaVal}°, facial features indicate ${patient.facialProfile || 'Straight'} vertical height)`,
      growthStatus,
      isGrowing: growthStatus === 'Growing'
    };
  }
}

/**
 * ============================================================================
 * LAYER 3: TREATMENT PLANNING ENGINE
 * ============================================================================
 */
export class TreatmentPlanningEngine {
  static formulatePlan(decision: any, oci: OciResult, patient: PatientDetails, ceph: CephalometricInput): any {
    const isGrowing = decision.isGrowing || Number(patient.age) <= 13;
    const isClassII = decision.diagnosis.includes('Class II');
    const isClassIII = decision.diagnosis.includes('Class III');
    const score = oci.totalScore;

    let strategy = 'Conventional Orthodontic Camouflage';
    let explanation = 'Skeletal limits reside within camouflage boundaries. Arch coordinates can be resolved via routine biomechanics.';
    
    if (score > OrthoKnowledgeBase.ExtractionRules.SurgicalThreshold) {
      strategy = 'Orthognathic Surgical Correction';
      explanation = `OCI score (${score}/100) exceeds camouflage limits. Attempting tooth movement would carry periodontal and aesthetic risks.`;
    } else if (score > OrthoKnowledgeBase.ExtractionRules.BorderlineThreshold) {
      strategy = 'Orthodontic Extraction Camouflage';
      explanation = `High severity score (${score}/100) and space constraints justify extraction coordinates to retract anterior teeth.`;
    }

    // Dynamic problems and objectives
    const problemList = [
      `Skeletal mismatch: ${decision.diagnosis}`,
      `Vertical mismatch: ${decision.verticalPattern}`
    ];
    if (patient.crowdingSpacing === 'Crowding') {
      problemList.push('Severe maxillary & mandibular dental crowding');
    }
    if (patient.lips === 'Incompetent') {
      problemList.push('Lip incompetence and soft tissue strain');
    }

    const objectives = [
      'Establish functional Class I canine relations',
      'Resolve dental crowding and achieve root alignment',
      'Achieve stable overjet and overbite parameters'
    ];
    if (patient.lips === 'Incompetent') {
      objectives.push('Optimize soft tissue lip competence at rest');
    }

    // Dynamic appliance selection
    const appliances: string[] = [];
    if (isGrowing) {
      if (isClassII) {
        appliances.push('Twin Block or Herbst Appliance (indicated for active mandibular advancement during peak growth)');
      } else if (isClassIII) {
        appliances.push('Protraction Face Mask paired with RME (Rapid Maxillary Expansion)');
      }
    } else {
      appliances.push('Fixed pre-adjusted edgewise brackets (0.022" slot)');
      if (score > OrthoKnowledgeBase.ExtractionRules.SurgicalThreshold) {
        appliances.push('Orthognathic surgical guides (maxillary LeFort I and mandibular BSSO)');
      }
    }

    return {
      strategy,
      explanation,
      problemList,
      objectives,
      appliances,
      extractionRecommended: score > OrthoKnowledgeBase.ExtractionRules.BorderlineThreshold ? 'Extraction Indicated' : 'Non-extraction Campaign'
    };
  }
}

/**
 * ============================================================================
 * LAYER 4: BIOMECHANICS ENGINE
 * ============================================================================
 */
export class BiomechanicsEngine {
  static getVectors(decision: any, plan: any, ceph: CephalometricInput): any {
    const isClassII = decision.diagnosis.includes('Class II');
    const isClassIII = decision.diagnosis.includes('Class III');
    const isHyper = decision.verticalPattern.includes('Hyperdivergent') || decision.verticalPattern.includes('High angle');
    
    const impaVal = ceph.impa !== '' ? Number(ceph.impa) : 90;
    
    // Formulate biomechanics dynamically
    const torqueControl = isClassII
      ? 'Active root torque control on maxillary incisors to permit controlled retraction without tipping.'
      : isClassIII
      ? `Proclination check: avoid severe retroclination of mandibular incisors below 80° IMPA (current: ${impaVal}°).`
      : 'Maintain standard incisor torque configurations.';

    const verticalControl = isHyper
      ? 'High angle control: use posterior bite blocks or temporary anchorage devices (TADs) to intrude molars and allow auto-rotation of the mandible.'
      : 'Standard leveling and alignment mechanics to resolve curve of Spee.';

    const sagittalElastics = isClassII
      ? 'Class II elastics (3/16" 4.5oz) to assist sagittal canine settlement.'
      : isClassIII
      ? 'Class III elastics (3/16" 4.5oz) to coordinate dental arches.'
      : 'Light coordination elastics during detailing phase.';

    const anchorage = plan.strategy.includes('Surgical') || plan.extractionRecommended.includes('Extraction')
      ? 'Maximum anchorage: consider transpalatal arch (TPA) or skeletal micro-screws (TADs).'
      : 'Minimum to moderate anchorage requirements.';

    return {
      torqueControl,
      verticalControl,
      sagittalElastics,
      anchorage
    };
  }
}

/**
 * ============================================================================
 * LAYER 5: REPORT GENERATOR
 * ============================================================================
 */
export class ReportGenerator {
  static generateReport(
    patient: PatientDetails,
    ceph: CephalometricInput,
    oci: OciResult
  ): string {
    const isClinic = patient.analysisMode === 'clinic';
    const isCeph = patient.analysisMode === 'ceph';
    
    // 1. Clinical Decision (Layer 2)
    let decision;
    if (isClinic) {
      decision = ClinicalDecisionEngine.evaluateClinicMode(patient);
    } else if (isCeph) {
      decision = ClinicalDecisionEngine.evaluateCephMode(ceph);
    } else {
      decision = ClinicalDecisionEngine.evaluateTurboMode(patient, ceph);
    }

    // 2. Treatment Planning (Layer 3)
    const plan = TreatmentPlanningEngine.formulatePlan(decision, oci, patient, ceph);

    // 3. Biomechanics (Layer 4)
    const biomech = BiomechanicsEngine.getVectors(decision, plan, ceph);

    // 4. Quality Assurance validation check (Layer 7)
    const qaResult = QualityAssuranceEngine.validate(decision, plan, biomech, patient, ceph);
    let finalPlan = plan;
    let finalBiomech = biomech;
    
    if (!qaResult.isValid) {
      const corrected = QualityAssuranceEngine.autoCorrect(decision, plan, biomech, patient, ceph, qaResult.errors);
      finalPlan = corrected.plan;
      finalBiomech = corrected.biomech;
    }

    // 5. Build the structured 10-section clinical report text
    return `
# Comprehensive Orthodontic Analysis & Report

## 1. Diagnosis
- **Skeletal & Vertical Profile**: ${decision.diagnosis}. ${decision.verticalPattern}.
${isClinic && (patient.facialProfile === 'Convex' || patient.facialProfile === 'Concave') ? `- **Clinical Impression**: Facial appearance suggests a possible skeletal discrepancy. Confirmation with cephalometric analysis is recommended.\n` : ''}- **Growth Stage**: ${decision.growthStatus || 'Growth completed / Adult phase'}.

## 2. Problem List
${finalPlan.problemList.map((p: string, i: number) => `  ${i + 1}. ${p}`).join('\n')}

## 3. Treatment Objectives
${finalPlan.objectives.map((o: string, i: number) => `  ${i + 1}. ${o}`).join('\n')}

## 4. Treatment Plan
- **Recommended Strategy**: ${finalPlan.strategy}.
- **Clinical Rationale**: ${finalPlan.explanation}
- **Extraction Protocol**: ${finalPlan.extractionRecommended}.
- **Proposed Appliances**: ${finalPlan.appliances.join(', ')}.

## 5. Biomechanics
- **Torque Vector Control**: ${finalBiomech.torqueControl}
- **Vertical Vector Control**: ${finalBiomech.verticalControl}
- **Sagittal Vector Control**: ${finalBiomech.sagittalElastics}
- **Anchorage Requirement**: ${finalBiomech.anchorage}

## 6. Risk Assessment
- **Clinical Risks**: Moderate risk of root resorption during alignment mechanics, compliant elastic wear requirements, and periodontal checkup bounds.
- **Complexity**: OCI score ${oci.totalScore}/100.

## 7. Prognosis
- **Overall Prognosis**: ${oci.totalScore > 60 ? 'Fair prognosis' : 'Excellent prognosis'}.
- **Explanation**: Favorable outcomes are expected when biomechanics vectors are executed in alignment with skeletal envelopes.

## 8. Relapse Assessment
- **Relapse Potential**: ${oci.totalScore > 50 ? 'Moderate' : 'Low'} relapse risk.
- **Relapse Reason**: The presence of original dentoalveolar masking increases the risk of tooth relapse towards original malocclusion.

## 9. Retention
- **Retention Strategy**: ${OrthoKnowledgeBase.RetentionRules.DualRetention}
- **Retention Detail**: ${OrthoKnowledgeBase.RetentionRules.ActiveRetention}

## 10. Clinical Summary
The patient demonstrates a ${decision.diagnosis} with ${decision.verticalPattern}. The recommended strategy is ${finalPlan.strategy} using ${finalPlan.extractionRecommended}. Dual-retention is clinically recommended post-treatment to maintain ideal coordinates.
`;
  }
}

/**
 * ============================================================================
 * LAYER 7: QUALITY ASSURANCE ENGINE & AUTO-CORRECTION
 * ============================================================================
 */
export class QualityAssuranceEngine {
  static validate(decision: any, plan: any, biomech: any, patient: PatientDetails, ceph: CephalometricInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const age = Number(patient.age) || 30;

    // 1. Growth recommendations contradiction check (Adult check)
    if (age > 13) {
      plan.appliances.forEach((app: string) => {
        if (app.toLowerCase().includes('twin block') || app.toLowerCase().includes('herbst') || app.toLowerCase().includes('face mask')) {
          errors.push(`CONTRADICTION: Growth modification appliances suggested for adult patient of age ${age} years.`);
        }
      });
    }

    // 2. Mode isolation check
    if (patient.analysisMode === 'clinic') {
      const cephKeywords = ['anb', 'sna', 'snb', 'impa', 'wits', 'u1-sn'];
      cephKeywords.forEach(kw => {
        if (decision.diagnosis.toLowerCase().includes(kw) || plan.explanation.toLowerCase().includes(kw)) {
          errors.push(`MODE VIOLATION: Cephalometric variables found in Clinic Mode report.`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static autoCorrect(decision: any, plan: any, biomech: any, patient: PatientDetails, ceph: CephalometricInput, errors: string[]): any {
    const correctedPlan = { ...plan };
    const correctedBiomech = { ...biomech };

    errors.forEach(err => {
      if (err.includes('CONTRADICTION')) {
        // Remove orthopedic functional appliances from adult plans
        correctedPlan.appliances = correctedPlan.appliances.filter((app: string) => 
          !app.toLowerCase().includes('twin block') && 
          !app.toLowerCase().includes('herbst') && 
          !app.toLowerCase().includes('face mask')
        );
        if (correctedPlan.appliances.length === 0) {
          correctedPlan.appliances.push('Fixed pre-adjusted edgewise brackets (0.022" slot)');
        }
      }
    });

    return {
      plan: correctedPlan,
      biomech: correctedBiomech
    };
  }
}
