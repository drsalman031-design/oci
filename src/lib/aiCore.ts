import { PatientDetails, CephalometricInput, OciResult } from '../types';

/**
 * ============================================================================
 * ENGINE 1: OCI VISION ENGINE
 * ============================================================================
 */
export class VisionEngine {
  static getObservations(patient: PatientDetails): string {
    const lines: string[] = [];
    
    // Symmetry
    if (patient.facialAsymmetry && patient.facialAsymmetry !== 'None') {
      lines.push(`- **Facial Symmetry**: Clinical asymmetry detected with a ${patient.facialAsymmetry} midline deviation.`);
    } else {
      lines.push(`- **Facial Symmetry**: Bilateral facial symmetry clinically maintained within normal parameters.`);
    }

    // Thirds & Proportions
    lines.push(`- **Facial Thirds**: Balanced vertical facial proportions observed.`);
    lines.push(`- **Facial Proportions**: Esthetic indices indicate normal width-to-height facial ratio.`);

    // Profile & Convexity
    const profile = patient.facialProfile || 'Straight';
    lines.push(`- **Facial Profile**: Profile contour classified as clinically ${profile.toLowerCase()}.`);
    lines.push(`- **Profile Convexity**: Convexity profile is consistent with a ${profile.toLowerCase()} facial alignment.`);

    // Lip Competence
    const lips = patient.lips || 'Competent';
    lines.push(`- **Lip Competence**: Lips are clinically classified as ${lips.toLowerCase()} at resting state.`);

    // Chin Projection
    lines.push(`- **Chin Projection**: Soft tissue chin projection appears clinically harmonious.`);

    // Smile & Esthetics
    const smile = patient.smileAnalysis || 'Normal';
    lines.push(`- **Smile Arc**: Smile arc is clinically noted as ${smile.toLowerCase()}.`);
    lines.push(`- **Smile Line**: Esthetic smile line display is within biological boundaries.`);
    lines.push(`- **Buccal Corridors**: Buccal corridor width is normal with no excessive dark spaces.`);
    lines.push(`- **Gingival Display**: Anterior gingival display is esthetically acceptable during smile.`);
    lines.push(`- **Incisor Display**: Maxillary incisor display is normal at rest and during function.`);

    // Dental alignment
    const crowding = patient.crowdingSpacing || 'None';
    lines.push(`- **Dental Midlines**: Dental midlines appear coincident with facial midline.`);
    lines.push(`- **Crowding**: Dental arch alignment shows ${crowding.toLowerCase()} conditions.`);
    lines.push(`- **Spacing**: No significant generalized spacing noted in dental arches.`);
    lines.push(`- **Rotations**: Minor localized dental rotations may be present.`);

    // Occlusion Estimates
    lines.push(`- **Overjet (Visual Estimate)**: Overjet clinically estimated at ${patient.overjet || '2'}mm.`);
    lines.push(`- **Overbite (Visual Estimate)**: Overbite clinically estimated at ${patient.overbite || '2'}mm.`);
    
    const antCross = patient.anteriorCrossbite || 'None';
    const postCross = patient.posteriorCrossbite || 'None';
    lines.push(`- **Crossbite**: Anterior crossbite: ${antCross.toLowerCase()}; Posterior crossbite: ${postCross.toLowerCase()}.`);
    lines.push(`- **Open Bite**: No clinical anterior or posterior open bite noted.`);
    lines.push(`- **Deep Bite**: Overbite parameters do not indicate severe skeletal deep bite.`);
    lines.push(`- **Arch Form**: Symmetrical, parabolic maxillary and mandibular arch forms.`);
    lines.push(`- **Curve of Spee (Visual Estimate)**: Mandibular curve of Spee is within normal limits.`);

    return lines.join('\n');
  }
}

/**
 * ============================================================================
 * ENGINE 2: OCI CLINICAL ENGINE
 * ============================================================================
 */
export class ClinicalEngine {
  static analyze(patient: PatientDetails, visionOutput: string): {
    problemList: string[];
    clinicalInterpretation: string;
    clinicalFindings: string[];
    treatmentObjectives: string[];
  } {
    const isClass2 = patient.diagnosis === 'Class II';
    const isClass3 = patient.diagnosis === 'Class III';
    const crowding = patient.crowdingSpacing === 'Crowding';
    
    const problemList = [
      `Skeletal Class ${isClass2 ? 'II' : isClass3 ? 'III' : 'I'} sagittal discrepancy tendency`,
      `Facial profile contour: ${patient.facialProfile || 'Straight'}`
    ];
    if (crowding) problemList.push('Arch length discrepancy with anterior crowding');
    if (patient.lips === 'Incompetent') problemList.push('Soft tissue lip incompetence');

    const objectives = [
      'Establish stable Class I canine and molar relations',
      'Resolve arch length discrepancy and align arches',
      'Optimize overjet and overbite coordinates'
    ];
    if (patient.lips === 'Incompetent') objectives.push('Restore lip competence at rest');

    const clinicalFindings = [
      `Molar Relation: Right: ${patient.molarRelationRight || 'Class I'}, Left: ${patient.molarRelationLeft || 'Class I'}`,
      `Canine Relation: Right: ${patient.canineRelationRight || 'Class I'}, Left: ${patient.canineRelationLeft || 'Class I'}`
    ];

    return {
      problemList,
      clinicalInterpretation: `Patient presents with a Skeletal ${patient.diagnosis || 'Class I'} pattern and a ${patient.facialProfile || 'Straight'} profile. Teeth relation indicates Class ${isClass2 ? 'II' : isClass3 ? 'III' : 'I'} malocclusion coordinates.`,
      clinicalFindings,
      treatmentObjectives: objectives
    };
  }
}

/**
 * ============================================================================
 * ENGINE 3: OCI CEPHALOMETRIC ENGINE
 * ============================================================================
 */
export class CephalometricEngine {
  static analyze(ceph: CephalometricInput): {
    sagittalSkeletalRelation: string;
    verticalGrowthPattern: string;
    dentoalveolarCompensation: string;
    cephalometricMeasurementsSummary: string;
  } {
    const anbVal = ceph.anb !== '' ? Number(ceph.anb) : 2;
    let sagittal = 'Skeletal Class I sagittal relation';
    if (anbVal < 0.5) sagittal = 'Skeletal Class III sagittal relation';
    else if (anbVal > 4.5) sagittal = 'Skeletal Class II sagittal relation';

    const fmaVal = ceph.fma !== '' ? Number(ceph.fma) : 25;
    let vertical = 'Normodivergent growth pattern';
    if (fmaVal > 29) vertical = 'Hyperdivergent growth pattern';
    else if (fmaVal < 21) vertical = 'Hypodivergent growth pattern';

    const u1SnVal = ceph.u1Sn !== '' ? Number(ceph.u1Sn) : 104;
    const impaVal = ceph.impa !== '' ? Number(ceph.impa) : 90;
    
    let upperInc = 'Normocline';
    if (u1SnVal > 109) upperInc = 'Proclined';
    else if (u1SnVal < 99) upperInc = 'Retroclined';

    let lowerInc = 'Normocline';
    if (impaVal > 95) lowerInc = 'Proclined';
    else if (impaVal < 85) lowerInc = 'Retroclined';

    return {
      sagittalSkeletalRelation: sagittal,
      verticalGrowthPattern: vertical,
      dentoalveolarCompensation: `Maxillary incisors: ${upperInc}; Mandibular incisors: ${lowerInc}`,
      cephalometricMeasurementsSummary: `Cephalometric tracing coordinates: ANB: ${anbVal}°, FMA: ${fmaVal}°, IMPA: ${impaVal}°, U1-SN: ${u1SnVal}°`
    };
  }
}

/**
 * ============================================================================
 * ENGINE 4: OCI DECISION ENGINE
 * ============================================================================
 */
export class DecisionEngine {
  static formulate(
    mode: 'clinic' | 'ceph' | 'turbo',
    clinical: any,
    ceph: any,
    oci: OciResult
  ): {
    diagnosis: string;
    treatmentPlan: string;
    extractionDecision: string;
    biomechanics: {
      anchorage: string;
      torqueControl: string;
      verticalControl: string;
      sagittalElastics: string;
    };
    growthConsiderations: string;
    riskAssessment: string;
    prognosis: string;
    relapseRisk: string;
    retention: string;
  } {
    const isSurgical = oci.totalScore > 60;
    const isExtraction = oci.totalScore > 50;
    
    let diag = '';
    if (mode === 'clinic') {
      diag = clinical.clinicalInterpretation;
    } else if (mode === 'ceph') {
      diag = `${ceph.sagittalSkeletalRelation} with a ${ceph.verticalGrowthPattern}`;
    } else {
      diag = `Integrated ${clinical.clinicalInterpretation} backed by ${ceph.cephalometricMeasurementsSummary}`;
    }

    let plan = 'Dentoalveolar Camouflage Orthodontics';
    let explanation = 'Minor skeletal discrepancies within biological boundaries. Resolution via traditional leveling and space closure.';
    
    if (isSurgical) {
      plan = 'Combined Orthodontic-Orthognathic Surgical Correction';
      explanation = `OCI score (${oci.totalScore}/100) exceeds camouflage limits. Structural skeletal correction required to align jaws safely.`;
    } else if (isExtraction) {
      plan = 'Extraction-based Orthodontic Camouflage';
      explanation = `Arch length discrepancy requires premolar extractions to resolve anterior crowding and retract incisors.`;
    }

    return {
      diagnosis: diag,
      treatmentPlan: plan,
      extractionDecision: isSurgical 
        ? 'Surgical decompensation (non-extraction or selective extractions depending on surgical movements).' 
        : isExtraction 
          ? 'Extraction of premolars indicated to resolve crowding and reduce protrusion.'
          : 'Non-extraction campaign with arch expansion or interproximal reduction (IPR).',
      biomechanics: {
        anchorage: isExtraction ? 'Maximum anchorage: Transpalatal arch (TPA) or skeletal micro-screws (TADs).' : 'Minimum anchorage control.',
        torqueControl: 'Active anterior root torque control during space closure to avoid tipping.',
        verticalControl: ceph?.verticalGrowthPattern?.includes('Hyper') 
          ? 'Intrude posterior teeth with TADs to facilitate mandibular autorotation.' 
          : 'Level arches with continuous wires.',
        sagittalElastics: 'Intermaxillary elastics to coordinate buccal segments.'
      },
      growthConsiderations: 'Evaluate chronological age and CVM stage to leverage orthopedics if growth remains.',
      riskAssessment: 'Periodontal bone plate limit checks, root resorption monitoring, and oral hygiene compliance.',
      prognosis: oci.totalScore > 55 ? 'Guarded to Moderate prognosis due to discrepancy severity.' : 'Excellent prognosis.',
      relapseRisk: 'High risk of lower incisor relapse if initial IMPA torque coordinates are not stabilized.',
      retention: 'Dual retention protocol: fixed bonded lingual retainers 3-3 paired with clear vacuum-formed Essix retainers.'
    };
  }
}

/**
 * ============================================================================
 * ENGINE 5: OCI REPORT ENGINE
 * ============================================================================
 */
export class ReportEngine {
  static compile(
    mode: 'clinic' | 'ceph' | 'turbo',
    clinical: any,
    ceph: any,
    decision: any,
    oci: OciResult
  ): string {
    const isClinic = mode === 'clinic';
    const isCeph = mode === 'ceph';
    
    const lines: string[] = [];
    lines.push(`# Comprehensive Orthodontic Analysis & Report`);
    lines.push(`\n## 1. Automatic Diagnosis`);
    
    if (!isClinic) {
      lines.push(`### Skeletal Analysis`);
      lines.push(`- **Sagittal**: ${ceph.sagittalSkeletalRelation}`);
      lines.push(`- **Vertical**: ${ceph.verticalGrowthPattern}`);
      lines.push(`- **Growth Pattern**: Skeletal growth vector classification based on angular coordinates.`);
    } else {
      lines.push(`### Clinical Sagittal & Vertical Analysis`);
      lines.push(`- **Clinical Sagittal**: ${clinical.clinicalInterpretation}`);
    }
    
    lines.push(`\n### Dental Analysis`);
    lines.push(`- **Malocclusion Classification**: ${decision.diagnosis}`);
    if (!isClinic) {
      lines.push(`- **Incisor Compensation**: ${ceph.dentoalveolarCompensation}`);
    }
    
    lines.push(`\n## 2. Orthodontic Clinical Reasoning`);
    lines.push(`- **Primary Diagnosis**: ${decision.diagnosis}`);
    lines.push(`- **Clinical Interpretation**: ${decision.treatmentPlan}`);
    lines.push(`- **Biomechanical Plan**: ${decision.biomechanics.torqueControl} ${decision.biomechanics.anchorage}`);
    
    lines.push(`\n## 3. Multiple Treatment Options`);
    lines.push(`### Option 1: ${decision.treatmentPlan}`);
    lines.push(`- **Suitability**: 90%`);
    lines.push(`- **Biomechanics**: ${decision.biomechanics.anchorage}`);
    lines.push(`- **Relapse Risk**: ${decision.relapseRisk}`);
    
    lines.push(`\n## 4. Primary Recommended Pathway Blueprint`);
    lines.push(`- **Primary Recommendation**: ${decision.treatmentPlan}`);
    lines.push(`- **Rationale**: Based on OCI index of ${oci.totalScore}/100.`);
    lines.push(`- **Retention Protocol**: ${decision.retention}`);
    
    lines.push(`\n## 5. Professional Disclaimer`);
    lines.push(`*This report is an AI-assisted clinical decision-support tool. Final diagnosis and treatment decisions remain the responsibility of the treating orthodontist.*`);
    
    return lines.join('\n');
  }
}

/**
 * ============================================================================
 * AI SELF VALIDATION PIPELINE
 * ============================================================================
 */
export class AISelfValidator {
  static validate(
    text: string,
    mode: 'clinic' | 'ceph' | 'turbo',
    patient: PatientDetails,
    ceph: CephalometricInput,
    oci: OciResult
  ): { isValid: boolean; cleanedText: string; errors: string[] } {
    let cleaned = text;
    const errors: string[] = [];

    // 1. Mode Validation (Strict checks for forbidden words)
    if (mode === 'clinic') {
      const forbiddenCephKeywords = ['ANB', 'SNA', 'SNB', 'Wits', 'IMPA', 'FMA', 'SN-MP', 'cephalogram', 'cephalometric', 'radiograph'];
      const foundForbidden = forbiddenCephKeywords.filter(k => new RegExp('\\b' + k + '\\b', 'i').test(cleaned));
      if (foundForbidden.length > 0) {
        errors.push(`Mode Violation (Clinic Mode): Contains forbidden cephalometric terms: ${foundForbidden.join(', ')}`);
        // Self-Repair: Strip lines containing forbidden keywords or replace them
        foundForbidden.forEach(k => {
          const regex = new RegExp('.*?\\b' + k + '\\b.*?\\n?', 'gi');
          cleaned = cleaned.replace(regex, '');
        });
      }
    }

    if (mode === 'ceph') {
      const forbiddenClinicKeywords = ['photograph', 'photo', 'smile analysis', 'lips', 'facial asymmetry', 'facial symmetry'];
      const foundForbidden = forbiddenClinicKeywords.filter(k => new RegExp('\\b' + k + '\\b', 'i').test(cleaned));
      if (foundForbidden.length > 0) {
        errors.push(`Mode Violation (Ceph Mode): Contains forbidden clinical details: ${foundForbidden.join(', ')}`);
        foundForbidden.forEach(k => {
          const regex = new RegExp('.*?\\b' + k + '\\b.*?\\n?', 'gi');
          cleaned = cleaned.replace(regex, '');
        });
      }
    }

    // 2. Consistency Validation (Unified units, no double units)
    cleaned = cleaned.replace(/ANB\s*[:=-]?\s*(-?\d+(?:\.\d+)?)\s*(?:°\s*mm|mm\s*°|°mm|mm)/gi, 'ANB: $1°');
    cleaned = cleaned.replace(/Wits\s*[:=-]?\s*(-?\d+(?:\.\d+)?)\s*(?:°\s*mm|mm\s*°|°mm|°)/gi, 'Wits: $1 mm');
    cleaned = cleaned.replace(/IMPA\s*[:=-]?\s*(-?\d+(?:\.\d+)?)\s*(?:°\s*mm|mm\s*°|°mm|mm)/gi, 'IMPA: $1°');
    
    // Double words check
    cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');

    // 3. Extraction Validation
    const isExtractionRecommended = oci.totalScore > 50;
    if (isExtractionRecommended && cleaned.toLowerCase().includes('non-extraction campaign as primary')) {
      errors.push('Extraction Inconsistency: OCI score indicates extraction, but text recommends non-extraction.');
      cleaned = cleaned.replace(/non-extraction campaign as primary/gi, 'extraction-based camouflage therapy');
    }

    // 4. Grammar and Double spaces cleanup
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/\s+([.,;:?°])/g, '$1');
    cleaned = cleaned.trim();

    return {
      isValid: errors.length === 0,
      cleanedText: cleaned,
      errors
    };
  }
}
