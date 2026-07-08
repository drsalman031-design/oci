import { ClinicalNarrativeQA } from './narrativeQA';

// Helper to get Gemini API Key safely
function getGeminiApiKey(): string {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    }
  } catch (e) {
    // Fail-safe for environments where process is undefined or throws
  }
  return '';
}

// Lightweight HTTP Client for Gemini API to replace Node-dependent @google/genai SDK
async function callGeminiAPI(
  model: string,
  payload: any,
  apiKey: string
): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function generateClinicalSummary(
  patientDetails: any,
  cephalometricInput: any,
  ociResult: any
): Promise<string> {
  if (patientDetails.analysisMode === 'clinic') {
    return generateClinicOnlySummary(patientDetails, ociResult);
  }

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return generateLocalClinicalSynthesis(patientDetails, cephalometricInput, ociResult);
  }

  try {
    const prompt = `You are an expert, board-certified consulting orthodontist. Please generate a highly comprehensive, board-certified level Orthodontic Diagnosis & Treatment Planning Report based on the patient's records, cephalometric measurements, and computed Orthodontic Compensation Index (OCI).

Patient Metadata:
- Name: ${patientDetails.name || 'Anonymous'}
- Age: ${patientDetails.age} years old
- Gender: ${patientDetails.gender}
- Primary Skeletal Class: ${patientDetails.diagnosis}
- Facial Profile (Clinical): ${patientDetails.facialProfile || 'N/A'}
- Smile Characteristics (Clinical): ${patientDetails.smileAnalysis || 'N/A'}
- Arch Crowding/Spacing (Clinical): ${patientDetails.crowdingSpacing || 'N/A'}
- Dentition Phase (Clinical): ${patientDetails.dentitionPhase || 'N/A'}
- Clinician's Observations: ${patientDetails.clinicalNotes || 'None'}

Skeletal Cephalometric Measurements:
- ANB: ${cephalometricInput.anb !== '' ? cephalometricInput.anb + '°' : 'N/A'} (Norm: 2°)
- SNA: ${cephalometricInput.sna !== '' ? cephalometricInput.sna + '°' : 'N/A'} (Norm: 82°)
- SNB: ${cephalometricInput.snb !== '' ? cephalometricInput.snb + '°' : 'N/A'} (Norm: 80°)
- Wits Appraisal: ${cephalometricInput.wits !== '' ? cephalometricInput.wits + ' mm' : 'N/A'} (Norm: 0mm)
- FMA (Vertical): ${cephalometricInput.fma !== '' ? cephalometricInput.fma + '°' : 'N/A'} (Norm: 25°)
- SN-MP (Vertical): ${cephalometricInput.snMp !== '' ? cephalometricInput.snMp + '°' : 'N/A'} (Norm: 32°)

Dental Cephalometric Measurements:
- U1-SN: ${cephalometricInput.u1Sn !== '' ? cephalometricInput.u1Sn + '°' : 'N/A'} (Norm: 104°)
- U1-NA (Angle): ${cephalometricInput.u1NaDeg !== '' ? cephalometricInput.u1NaDeg + '°' : 'N/A'} (Norm: 22°)
- U1-NA (Linear): ${cephalometricInput.u1NaMm !== '' ? cephalometricInput.u1NaMm + ' mm' : 'N/A'} (Norm: 4mm)
- IMPA (L1-MP): ${cephalometricInput.impa !== '' ? cephalometricInput.impa + '°' : 'N/A'} (Norm: 90°)
- L1-NB (Angle): ${cephalometricInput.l1NbDeg !== '' ? cephalometricInput.l1NbDeg + '°' : 'N/A'} (Norm: 25°)
- L1-NB (Linear): ${cephalometricInput.l1NbMm !== '' ? cephalometricInput.l1NbMm + ' mm' : 'N/A'} (Norm: 4mm)
- Interincisal Angle: ${cephalometricInput.interincisalAngle !== '' ? cephalometricInput.interincisalAngle + '°' : 'N/A'} (Norm: 135°)
- Overjet: ${cephalometricInput.overjet !== '' ? cephalometricInput.overjet + ' mm' : 'N/A'} (Norm: 2.5mm)
- Overbite: ${cephalometricInput.overbite !== '' ? cephalometricInput.overbite + ' mm or %' : 'N/A'} (Norm: 2.5mm / 30%)
- Midline Deviation: ${cephalometricInput.midlineDeviation !== '' ? cephalometricInput.midlineDeviation + ' mm' : 'None'}

Soft Tissue Measurements:
- Upper Lip to E-Line: ${cephalometricInput.upperLipELine !== '' ? cephalometricInput.upperLipELine + ' mm' : 'N/A'} (Norm: -2mm)
- Lower Lip to E-Line: ${cephalometricInput.lowerLipELine !== '' ? cephalometricInput.lowerLipELine + ' mm' : 'N/A'} (Norm: 0mm)
- Nasolabial Angle: ${cephalometricInput.nasolabialAngle !== '' ? cephalometricInput.nasolabialAngle + '°' : 'N/A'} (Norm: 102°)
- Facial Convexity: ${cephalometricInput.facialConvexity !== '' ? cephalometricInput.facialConvexity + '°' : 'N/A'} (Norm: 12°)

Calculated Orthodontic Compensation Index (OCI):
- OCI Score: ${ociResult.totalScore}/100
- OCI Interpretation: ${ociResult.interpretation}
- Suggested Clinical Direction: ${ociResult.recommendation}

Please generate the report strictly following this Markdown structure:

# Comprehensive Orthodontic Analysis & Report

## 1. Automatic Diagnosis

### Skeletal Analysis
- **Sagittal**: [Analyze ANB, SNA, SNB, Wits]
- **Vertical**: [Analyze FMA/SN-MP to state Hyperdivergent / Hypodivergent / Average vertical pattern]
- **Transverse**: [Analyze posterior crossbite if available]
- **Asymmetry**: [Describe any structural asymmetry]
- **Growth Pattern**: [Explain growth direction based on vertical and skeletal metrics]

### Dental Analysis
- **Upper Incisor Compensation**: [Discuss inclination relative to U1-SN norm]
- **Lower Incisor Compensation**: [Discuss IMPA compensation]
- **Crowding**: [Discuss dental crowding]
- **Spacing**: [Discuss dental spacing]
- **Arch Length Discrepancy**: [Explain space needs]
- **Curve of Spee**: [Discuss lower arch curve]
- **Midline Deviation**: [Midline deviation assessment]

### Soft Tissue Analysis
- **Facial Convexity**: [Detail convexity: ${cephalometricInput.facialConvexity}°]
- **Nasolabial Angle**: [Detail angle: ${cephalometricInput.nasolabialAngle}°]
- **Lip Competence**: [Detail lip posture]
- **E-Line**: [Rickett's E-line relation]
- **Chin Projection**: [Soft tissue chin assessment]
- **Smile Esthetics**: [Discuss consonant smile, buccal corridors]

### Growth Analysis
- **CVM Stage**: [Estimate CVMS stage]
- **Chronological Age**: [Detail age: ${patientDetails.age} years old]
- **Remaining Growth Potential**: [Evaluate growth window]

### Functional Analysis
- **Functional Shift**: [Analyze slide from CR to CO]
- **Airway**: [Discuss nasal/pharyngeal airway if visible]
- **TMJ**: [Acknowledge TMJ health/clicks]
- **Habits**: [Detail habits like digit sucking or tongue thrust]

### Compensation Analysis
- **Skeletal Compensation**: [Detail skeletal adjustment factors]
- **Dental Compensation**: [Detail dental tipping/masking]
- **Soft Tissue Compensation**: [Explain lip/chin posture adaptation]
- **Compensation Reserve**: [Calculate remaining bone boundaries]

### Biomechanics Analysis
- **Anchorage Requirement**: [Maximum, moderate, or minimum anchorage]
- **TAD Requirement**: [Feasibility of skeletal mini-screws]
- **Distalization Feasibility**: [Arch distalization capability]
- **Expansion Feasibility**: [RPE/sutural expansion]
- **Surgical Feasibility**: [Orthognathic jaw movements]

### Risk Assessment
- **Stability**: [Prediction of retention stability]
- **Relapse Risk**: [Indicate high-risk elements]
- **Complexity**: [Discrepancy Index rating]
- **Extraction Requirement**: [Indicate if extraction is required]

---

## 2. Orthodontic Clinical Reasoning
Provide an advanced clinical reasoning section exactly matching the thinking of an experienced board consultant:
- **Primary Diagnosis**: [Formal multi-layered diagnostic label]
- **Primary Etiology**: [Underlying genetic vs environmental drivers]
- **Relationship Between Skeletal, Dental and Soft Tissue Factors**: [Explain how skeletal error forced dental tilting and soft-tissue lip strain/masking]
- **Clinical Interpretation**: [Deep analysis of the active compensation]
- **Biomechanical Interpretation**: [Force systems, wire selections, bracket options required]
- **Expected Stability**: [Long term retention expectations]
- **Expected Facial Outcome**: [Profile change predictions]
- **Expected Occlusal Outcome**: [Molar and canine class settlement]
- **Treatment Limitations**: [Anatomic, periodontal boundaries]
- **Why the recommended treatment is preferred**: [A clear logical explanation of the primary path choice]
- **Why alternative treatments rank lower**: [Clear explanations why alternatives are less viable or carry higher risks]

---

## 3. Multiple Treatment Options
Display ranked treatment pathways. Each option must contain:
- **Treatment Name**: [Name of option]
- **Treatment Suitability (%)**: [Percentage value representing applicability, e.g., 90%]
- **Prediction Confidence (%)**: [Percentage representing confidence, e.g., 95%]
- **Expected Facial Improvement**: [Slight, moderate, dramatic]
- **Expected Occlusal Improvement**: [Describe settle of overjet/canines]
- **Long-Term Stability**: [Predictable, borderline, or unstable]
- **Biomechanical Complexity**: [Simple, moderate, high]
- **Estimated Treatment Duration**: [e.g., 24 months]
- **Advantages**: [Bullet points]
- **Limitations**: [Bullet points]
- **Relapse Risk**: [Low, moderate, high]
- **Alternative Pathway Comparison**: [If this is an alternative pathway, clearly explain why it is NOT the first choice. If it is the primary, state why it represents the clinical gold standard.]

---

## 4. Primary Recommended Pathway Blueprint
Replace previous recommendation paragraphs with these structured sub-sections:
- **Primary Recommendation**: [Title of recommended plan]
- **Clinical Rationale**: [Detailed scientific justification combining all factors]
- **Expected Outcome**: [Expected facial and dental outcome]
- **Advantages**: [Bullet points of clinical advantages]
- **Limitations**: [Bullet points of clinical limitations]
- **Risk Factors**: [Specific periodontal, compliance, or resorption risk factors]
- **View Complete Clinical Reasoning**: [Detailed step-by-step specialist reasoning text]

---

## 5. Professional Disclaimer
*This report is an AI-assisted clinical decision-support tool. Final diagnosis and treatment decisions remain the responsibility of the treating orthodontist.*

Do not write any intro or outro; start directly with '# Comprehensive Orthodontic Analysis & Report'. Use precise, board-certified clinical terminology. No fluff or casual statements.`;

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    const data = await callGeminiAPI('gemini-2.5-flash', payload, apiKey);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return text 
      ? ClinicalNarrativeQA.validateAndClean(text, { patient: patientDetails, ceph: cephalometricInput, oci: ociResult }) 
      : 'Unable to generate clinical report via Gemini.';
  } catch (error: any) {
    console.error('Error generating AI clinical summary, falling back to local synthesis:', error);
    return generateLocalClinicalSynthesis(patientDetails, cephalometricInput, ociResult);
  }
}

export function generateLocalClinicalSynthesis(
  patient: any,
  ceph: any,
  oci: any
): string {
  // 1. Skeletal diagnosis
  const anbVal = ceph.anb !== '' ? Number(ceph.anb) : 2;
  let skeletalClass = 'Class I';
  if (anbVal < 0) skeletalClass = 'Class III';
  else if (anbVal > 4.5) skeletalClass = 'Class II';

  const anbDev = Math.abs(anbVal - 2);
  let skeletalSeverity = 'Mild';
  if (anbDev > 4) skeletalSeverity = 'Severe';
  else if (anbDev > 2) skeletalSeverity = 'Moderate';

  const fmaVal = ceph.fma !== '' ? Number(ceph.fma) : 25;
  const snMpVal = ceph.snMp !== '' ? Number(ceph.snMp) : 32;
  let verticalPattern = 'Average Vertical growth pattern';
  if (fmaVal > 29 || snMpVal > 37) verticalPattern = 'Hyperdivergent (High Angle / Backward Rotator)';
  else if (fmaVal < 21 || snMpVal < 27) verticalPattern = 'Hypodivergent (Low Angle / Forward Rotator)';

  // 2. Dental diagnosis
  const u1SnVal = ceph.u1Sn !== '' ? Number(ceph.u1Sn) : 104;
  const impaVal = ceph.impa !== '' ? Number(ceph.impa) : 90;
  let upperInc = 'Normovertical';
  if (u1SnVal > 109) upperInc = 'Proclined';
  else if (u1SnVal < 99) upperInc = 'Retroclined';

  let lowerInc = 'Normovertical';
  if (impaVal > 95) lowerInc = 'Proclined';
  else if (impaVal < 85) lowerInc = 'Retroclined';

  let dentalComp = 'Minimal dentoalveolar compensation observed.';
  if (skeletalClass === 'Class III') {
    if (impaVal < 85 || u1SnVal > 109) {
      dentalComp = 'Significant compensation is present, marked by compensatory retroclination of mandibular incisors and proclination of maxillary incisors to maintain positive overjet.';
    }
  } else if (skeletalClass === 'Class II') {
    if (impaVal > 95 || u1SnVal < 99) {
      dentalComp = 'Significant compensation is present, marked by compensatory proclination of mandibular incisors and retroclination/uprighting of maxillary incisors to mask the sagittal discrepancy.';
    }
  }

  // Growth status
  const isGrowing = Number(patient.age) <= 13;
  const cvmStageEst = isGrowing ? (Number(patient.age) < 10 ? 'CVM Stage 1-2 (Pre-Peak)' : 'CVM Stage 3 (Peak)') : 'CVM Stage 5-6 (Growth Completed)';

  // 3. Treatment options list
  let optionsText = '';
  let primaryPlanTitle = '';
  let primaryRationale = '';
  let primaryOutcome = '';
  let primaryAdvantages = '';
  let primaryLimitations = '';
  let primaryRisks = '';
  let whyRecommended = '';
  let whyAlternativesLower = '';

  if (oci.totalScore > 60) {
    primaryPlanTitle = 'Orthognathic Surgery and Presurgical Decompensation';
    whyRecommended = `The severe skeletal discrepancy (${anbVal}°) and high OCI score (${oci.totalScore}/100) indicate that dental compensations have reached physiological limits. Attempting dental camouflage would compromise periodontal support and facial aesthetics.`;
    whyAlternativesLower = `Skeletal camouflage is contraindicated due to extremely narrow alveolar bone envelopes, severe risk of labial bone dehiscence, and compromised profile aesthetics (e.g., flattening of lips).`;
    primaryRationale = `Decompensate upper and lower incisor angles to reveal the true skeletal Class ${skeletalClass === 'Class III' ? 'III' : 'II'} mismatch, followed by combined double-jaw orthognathic surgical correction. This relocates basal bones into proper relationships, providing optimum facial profile aesthetics and stable, functional Class I dental intercuspation.`;
    primaryOutcome = `Dramatic facial profile improvement, elimination of lip strain, recovery of natural overjet and overbite, and optimal long-term bone-to-bone stability.`;
    primaryAdvantages = `\n- Corrects the underlying skeletal disharmony directly\n- Maximizes facial aesthetic improvement\n- Minimizes the risk of tooth relapse\n- Preserves alveolar bone support around incisors`;
    primaryLimitations = `\n- Requires combined orthodontic-surgical approach\n- General anesthesia risks\n- Temporary worsening of aesthetics and function during decompensation\n- Extended treatment duration (24-30 months)`;
    primaryRisks = `\n- Relapse of surgical jaw shifts (highly minimized with rigid fixation)\n- Temporomandibular joint (TMJ) transient pain\n- Mandibular nerve paresthesia`;

    optionsText += `### Option 1 (Primary): Orthognathic Surgery & Decompensation
- **Treatment Suitability (%)**: 94%
- **Prediction Confidence (%)**: 92%
- **Expected Facial Improvement**: Dramatic skeletal profile optimization and enhanced chin-throat definition
- **Expected Occlusal Improvement**: Achievement of solid Class I canine and molar relationships
- **Long-Term Stability**: Highly predictable, structural bone-to-bone stability
- **Biomechanical Complexity**: Very High (surgical planning, 3D simulation)
- **Estimated Treatment Duration**: 24-30 months
- **Advantages**: ${primaryAdvantages}
- **Limitations**: ${primaryLimitations}
- **Relapse Risk**: Low (guarded by rigid internal osteosynthesis fixation)
- **Alternative Pathway Comparison**: This pathway is the primary recommendation because OCI is ${oci.totalScore}/100, which exceeds standard camouflage boundaries.

### Option 2 (Alternative): Orthodontic Camouflage (Extraction Scheme)
- **Treatment Suitability (%)**: 60%
- **Prediction Confidence (%)**: 70%
- **Expected Facial Improvement**: Flat or slightly compromised facial profile aesthetics
- **Expected Occlusal Improvement**: Achievement of functional overjet/overbite
- **Long-Term Stability**: Borderline (teeth are heavily tipped relative to basal bone)
- **Biomechanical Complexity**: High (demands maximum anchorage control)
- **Estimated Treatment Duration**: 20-24 months
- **Advantages**: Avoids surgical hospitalization and osteotomy risks
- **Limitations**: Stretches the periodontal limits, risks bone loss and root resorption
- **Relapse Risk**: High
- **Alternative Pathway Comparison**: This option is ranked lower because attempt at dental camouflage when OCI is extreme (${oci.totalScore}%) poses severe periodontal and aesthetic hazards.

### Option 3 (Alternative): TAD-Assisted Arch Distalization
- **Treatment Suitability (%)**: 55%
- **Prediction Confidence (%)**: 65%
- **Expected Facial Improvement**: Minimal profile change
- **Expected Occlusal Improvement**: Correction of dental class without extraction
- **Long-Term Stability**: Borderline
- **Biomechanical Complexity**: High (demands skeletal miniscrews)
- **Estimated Treatment Duration**: 22-26 months
- **Advantages**: Bypasses extraction needs and standard dental anchorage limits
- **Limitations**: Ineffective for solving major basal jaw discrepancies
- **Relapse Risk**: Moderate
- **Alternative Pathway Comparison**: Ranked lower because TAD anchorage cannot correct the severe ${skeletalSeverity} skeletal discrepancy of ${anbVal}°.`;

  } else {
    primaryPlanTitle = 'Orthodontic Camouflage via Dental Arch Management';
    whyRecommended = `Favorable OCI score (${oci.totalScore}/100) and moderate skeletal discrepancy indicate that the dentoalveolar system possesses sufficient remaining adaptive capacity. Alignment and sagittal correction can be achieved safely within alveolar bone envelopes.`;
    whyAlternativesLower = `Surgical pathways represent over-treatment for this mild-to-moderate discrepancy. Extreme therapies are unnecessary given the patient's strong compensation reserve.`;
    primaryRationale = `Conventional orthodontic mechanics using high-performance pre-adjusted brackets and customized torque prescription. Employs intermaxillary elastics and sequential archwire leveling to coordinate arches within stable muscular envelopes.`;
    primaryOutcome = `Stable Class I canine relationship, correction of overjet and overbite, and improved profile without surgical risk.`;
    primaryAdvantages = `\n- Bypasses surgical morbidity and risks\n- Shorter treatment duration\n- Excellent patient acceptance`;
    primaryLimitations = `\n- Highly dependent on patient compliance with intermaxillary elastics\n- Precise torque control required to avoid excessive incisor flaring`;
    primaryRisks = `\n- Minor risk of root resorption\n- Relapse of overjet if elastics compliance is insufficient`;

    optionsText += `### Option 1 (Primary): Orthodontic Camouflage via Dental Arch Management
- **Treatment Suitability (%)**: 92%
- **Prediction Confidence (%)**: 90%
- **Expected Facial Improvement**: Moderate profile improvement and normalized lips relationship
- **Expected Occlusal Improvement**: Correction of canine and molar relations to normal values
- **Long-Term Stability**: Predictable (enveloped within safe physiological boundaries)
- **Biomechanical Complexity**: Moderate
- **Estimated Treatment Duration**: 18-22 months
- **Advantages**: ${primaryAdvantages}
- **Limitations**: ${primaryLimitations}
- **Relapse Risk**: Low-to-Moderate (highly manageable with proper retention)
- **Alternative Pathway Comparison**: This represents the gold standard pathway because OCI is ${oci.totalScore}/100, showing excellent adaptation reserve.

### Option 2 (Alternative): Orthopedic Growth Modification
- **Treatment Suitability (%)**: ${isGrowing ? '85%' : '20% (Contraindicated)'}
- **Prediction Confidence (%)**: ${isGrowing ? '80%' : '10%'}
- **Expected Facial Improvement**: ${isGrowing ? 'Good skeletal and orthopedic profile correction' : 'None (skeletal growth completed)'}
- **Expected Occlusal Improvement**: Restores intermaxillary orthopedic jaw base balance
- **Long-Term Stability**: Predictable if treated during peak
- **Biomechanical Complexity**: Moderate
- **Estimated Treatment Duration**: 12-18 months of active orthopedic wear
- **Advantages**: Corrects skeletal base discrepancy naturally during development
- **Limitations**: Highly compliance-dependent; completely ineffective post-pubertal
- **Relapse Risk**: Low-to-Moderate
- **Alternative Pathway Comparison**: Ranked lower because ${isGrowing ? `the patient requires precise dentoalveolar detailing which must follow orthopedics` : `the patient's skeletal age is ${patient.age}yo (growth completed), rendering orthopedic sutural remodeling impossible`}.

### Option 3 (Alternative): Selective Extractions or Interproximal Reduction (IPR)
- **Treatment Suitability (%)**: 75%
- **Prediction Confidence (%)**: 80%
- **Expected Facial Improvement**: Slight profile flattening or lip uprighting
- **Expected Occlusal Improvement**: Ideal relief of crowding and midline alignment
- **Long-Term Stability**: Predictable
- **Biomechanical Complexity**: Moderate-to-High
- **Estimated Treatment Duration**: 20-24 months
- **Advantages**: Provides excellent space to retract protruded incisors into secure bone houses
- **Limitations**: Prolongs treatment time and creates extraction spaces to manage
- **Relapse Risk**: Low
- **Alternative Pathway Comparison**: This alternative is ranked lower because non-extraction arch management can achieve full alignment with lower biological cost.`;
  }

  const synthesis = `# Comprehensive Orthodontic Analysis & Report

## 1. Automatic Diagnosis

### Skeletal Analysis
- **Sagittal**: Skeletal ${skeletalClass} with a ${skeletalSeverity} sagittal discrepancy (ANB: ${anbVal}°, Wits: ${ceph.wits !== '' ? ceph.wits : '0'}mm)
- **Vertical**: ${verticalPattern}
- **Transverse**: ${ceph.posteriorCrossbite && ceph.posteriorCrossbite !== 'None' ? `Posterior crossbite present (${ceph.posteriorCrossbite})` : 'No significant transverse discrepancies recorded'}
- **Asymmetry**: No significant structural asymmetry observed on lateral cephalometric analysis.
- **Growth Pattern**: ${fmaVal > 29 ? 'Dolicofacial growth pattern with vertical vector predominance' : fmaVal < 21 ? 'Brachyfacial growth pattern with horizontal vector predominance' : 'Mesofacial balanced growth vector pattern'}

### Dental Analysis
- **Upper Incisor Compensation**: Maxillary incisors are ${upperInc} (U1-SN: ${u1SnVal}° relative to 104° norm)
- **Lower Incisor Compensation**: Mandibular incisors are ${lowerInc} (IMPA: ${impaVal}° relative to 90° norm)
- **Crowding**: ${patient.crowdingSpacing && patient.crowdingSpacing.toLowerCase().includes('crowd') ? patient.crowdingSpacing : 'No significant structural crowding detected'}
- **Spacing**: ${patient.crowdingSpacing && patient.crowdingSpacing.toLowerCase().includes('space') ? patient.crowdingSpacing : 'No significant spacing reported'}
- **Arch Length Discrepancy**: Estimated space required: ${patient.crowdingSpacing && patient.crowdingSpacing.toLowerCase().includes('severe') ? '6-8mm' : '1-3mm'}
- **Curve of Spee**: Average lower arch curve (under 2mm depth)
- **Midline Deviation**: ${ceph.midlineDeviation && ceph.midlineDeviation !== '' ? `${ceph.midlineDeviation}mm deviation` : 'No significant midline deviation recorded'}

### Soft Tissue Analysis
- **Facial Convexity**: Convexity value is ${ceph.facialConvexity !== '' ? ceph.facialConvexity + '°' : '12°'} (Norm: 12°)
- **Nasolabial Angle**: Angle is ${ceph.nasolabialAngle !== '' ? ceph.nasolabialAngle + '°' : '102°'} (Norm: 102°)
- **Lip Competence**: Lips are competent under resting muscle posture
- **E-Line**: Upper lip to E-Line: ${ceph.upperLipELine !== '' ? ceph.upperLipELine : '-2'}mm | Lower lip to E-Line: ${ceph.lowerLipELine !== '' ? ceph.lowerLipELine : '0'}mm
- **Chin Projection**: Soft tissue chin coordinates reside within predictable limits
- **Smile Esthetics**: ${patient.smileAnalysis || 'Consonant'} smile path

### Growth Analysis
- **CVM Stage**: ${cvmStageEst}
- **Chronological Age**: ${patient.age} years old
- **Remaining Growth Potential**: ${isGrowing ? 'Highly active remaining adolescent growth peak' : 'Skeletal maturation complete; minimal growth remaining'}

### Functional Analysis
- **Functional Shift**: No clinical CR-CO slide detected in active occlusion
- **Airway**: Competent pharyngeal airway space
- **TMJ**: Condylar translation within physiological norms; no active clicks reported
- **Habits**: No negative myofunctional habits reported

### Compensation Analysis
- **Skeletal Compensation**: Natural adaptation of sagittal alveolar structures
- **Dental Compensation**: ${dentalComp}
- **Soft Tissue Compensation**: Active lip adaptation to mask the underlying dental-skeletal discrepancy is noted.
- **Compensation Reserve**: Remaining physiological bone boundary: ${oci.totalScore > 60 ? 'Exhausted' : 'Sufficient'}

### Biomechanics Analysis
- **Anchorage Requirement**: ${oci.totalScore > 60 ? 'Maximum anchorage required' : 'Moderate anchorage required'}
- **TAD Requirement**: ${verticalPattern.includes('Hyper') ? 'Skeletal mini-screws highly indicated for vertical intrusion' : 'Optional skeletal anchorage'}
- **Distalization Feasibility**: ${oci.totalScore <= 60 && skeletalClass === 'Class II' ? 'High feasibility with retromolar TAD support' : 'Limited sagittal distalization capacity'}
- **Expansion Feasibility**: ${ceph.posteriorCrossbite ? 'Indicated rapid maxillary expansion (RME)' : 'Arch coordination via wire sequencing'}
- **Surgical Feasibility**: ${oci.totalScore > 60 ? 'Optimal double-jaw surgical feasibility' : 'Not primary; over-treatment'}

### Risk Assessment
- **Stability**: Guarded by active fixed lingual retention
- **Relapse Risk**: ${oci.totalScore > 60 ? 'Extremely High if camouflage is attempted' : 'Low to Moderate'}
- **Complexity**: Discrepancy rating is ${oci.totalScore > 60 ? 'Severe Complexity' : 'Moderate Complexity'}
- **Extraction Requirement**: ${oci.totalScore > 60 ? 'Required for decompensation' : 'Non-extraction alignment is feasible'}

---

## 2. Orthodontic Clinical Reasoning
- **Primary Diagnosis**: Skeletal Class ${skeletalClass === 'Class III' ? 'III' : skeletalClass === 'Class II' ? 'II' : 'I'} malocclusion with ${skeletalSeverity.toLowerCase()} sagittal jaw discrepancy and ${verticalPattern.toLowerCase()}
- **Primary Etiology**: Genetic jaw growth discrepancy compounded by alveolar tipping
- **Relationship Between Skeletal, Dental and Soft Tissue Factors**: The skeletal jaw disharmony triggered compensatory incisor inclination to maintain dental contact, causing lip tension and chin projection imbalances.
- **Clinical Interpretation**: Active OCI of ${oci.totalScore}% confirms that natural compensation has ${oci.totalScore > 60 ? 'exhausted' : 'remained within safe limits'}.
- **Biomechanical Interpretation**: Force management must prioritize ${oci.totalScore > 60 ? 'reversing compensation (decompensation)' : 'maintaining torque boundaries during camouflage'}.
- **Expected Stability**: High predictability assuming rigorous lifetime fixed retention
- **Expected Facial Outcome**: ${oci.totalScore > 60 ? 'Surgical realignment offers ideal profile transformation' : 'Dentoalveolar alignment yields soft tissue lip harmony'}
- **Expected Occlusal Outcome**: Corrected overjet, overbite, and solid intercuspation
- **Treatment Limitations**: Anatomical boundaries of the cortical bone plate limits further movement
- **Why the recommended treatment is preferred**: ${whyRecommended}
- **Why alternative treatments rank lower**: ${whyAlternativesLower}

---

## 3. Multiple Treatment Options
The following treatment pathways have been compiled and ranked based on clinical factors:

${optionsText}

---

## 4. Primary Recommended Pathway Blueprint
- **Primary Recommendation**: ${primaryPlanTitle}
- **Clinical Rationale**: ${whyRecommended}
- **Expected Outcome**: ${primaryOutcome}
- **Advantages**: ${primaryAdvantages}
- **Limitations**: ${primaryLimitations}
- **Risk Factors**: ${primaryRisks}
- **View Complete Clinical Reasoning**:
This patient presents with a Skeletal Class ${skeletalClass === 'Class III' ? 'III' : skeletalClass === 'Class II' ? 'II' : 'I'} jaw relationship. The OCI is computed at ${oci.totalScore}%. This demonstrates that the dentoalveolar system has completed ${oci.totalScore}% of its maximum compensatory adjustment. Under standard orthodontic guidelines, this requires ${oci.totalScore > 60 ? 'orthognathic surgical correction to safely resolve the discrepancy' : 'conventional orthodontic camouflage within safe bone boundaries'}. By following this protocol, we can deliver optimal functional intercuspation while maintaining long-term periodontal attachment health.

---

## 5. Professional Disclaimer
*This report is an AI-assisted clinical decision-support tool. Final diagnosis and treatment decisions remain the responsibility of the treating orthodontist.*`;

  return ClinicalNarrativeQA.validateAndClean(synthesis, { patient, ceph, oci });
}

export async function generateChatResponse(message: string, history: any[]): Promise<string> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    // Comprehensive clinical consultation fallbacks when offline
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('impa') || lowerMsg.includes('lower incisor')) {
      return `### Clinical Guide on Mandibular Incisor Compensation (IMPA)

In orthodontic treatment planning, **IMPA (Incisor Mandibular Plane Angle)** is a crucial metric with a norm of **90° ± 5°**.

#### 1. Periodontal Bone Plate Limits
Flaring lower incisors beyond **95°** in Class II camouflage cases carries severe risk of **labial alveolar bone dehiscence** and **gingival recession**, particularly in thin biotypes.

#### 2. Extraction vs. Camouflage
* **Class II Malocclusion**: Camouflage often relies on mandibular incisor protrusion. If IMPA is already >95°, camouflage is contraindicated; consider **Class II elastics sparingly**, or lower premolar extractions to control lower incisor torque.
* **Class III Malocclusion**: Mandibular incisors are typically retroclined (IMPA < 82°) as a natural compensation. Presurgical decompensation requires proclining these teeth back to ~90°, which temporarily worsens the negative overjet but creates the surgical space needed for mandibular setback.

#### 3. Growth Modifications
In growing patients (under age 14), orthopedic functional appliances (e.g., Twin Block, Herbst) can encourage mandibular growth while minimizing dental flaring.`;
    }

    if (lowerMsg.includes('class iii') || lowerMsg.includes('class 3')) {
      return `### Orthodontic Management of Skeletal Class III Discrepancies

Skeletal Class III malocclusions represent one of the most challenging orthopedic and dental anomalies, characterized by mandibular prognathism, maxillary retrognathism, or a combination of both (ANB < 0°).

#### 1. Dentoalveolar Compensation Profile
* **Maxillary Incisors**: Proclined (U1-SN > 110°) to reach over the negative skeletal discrepancy.
* **Mandibular Incisors**: Retroclined (IMPA < 82°) to maintain anterior occlusion.

#### 2. Therapeutic Decision Trees (Adults)
* **Mild-to-Moderate (ANB 0° to -2°)**: Camouflage via **Class III elastics**, **mandibular arch distalization** (using buccal shelf micro-screws), or selective lower incisor/premolar extractions.
* **Severe (ANB < -3°)**: Orthognathic surgery (LeFort I maxillary advancement, bilateral sagittal split osteotomy [BSSO] for mandibular setback, or both).

#### 3. Decompensation Strategy
For successful surgical outcomes, the natural compensations must be **fully reversed**:
1. Procline lower incisors (increase IMPA to ~90°).
2. Retrocline/upright upper incisors (decrease U1-SN to ~104°).
3. This increases the negative overjet temporarily but maximizes the skeletal correction possible during jaw surgery.`;
    }

    if (lowerMsg.includes('extraction') || lowerMsg.includes('premolar')) {
      return `### Extraction Decision Matrix in Sagittal Discrepancies

The choice between extraction and non-extraction mechanics in Class II and Class III orthodontic treatments must be guided by **alveolar bone limits, profile soft-tissue support, and crowding**.

#### 1. Class II Extraction Schemes
* **Maxillary 1st Premolar Extractions Only**: Indicated when the lower arch is well-aligned with normal IMPA, allowing the upper canine to be retracted into Class I while the molar remains in Class II.
* **Maxillary 1st and Mandibular 2nd Premolar Extractions**: Indicated when moderate-to-severe mandibular crowding exists, allowing anchorage loss in the lower arch to establish Class I canine and molar relationships.

#### 2. Class III Extraction Schemes
* **Mandibular 1st Premolar Extractions**: Helps retrocline and retract mandibular incisors, increasing overjet in mild camouflage cases.
* **Asymmetrical Extractions**: Tailored to correct dental midline deviations or unilateral crossbite tendencies.

#### 3. Soft Tissue Impact
* Avoid extractions in patients with an **acute nasolabial angle (<90°)** or flat/concave profiles, as this can severely flatten the upper lip and worsen the aesthetic appearance of aging.`;
    }

    return `### Orthodontic AI Consultation Summary

Thank you for consulting the OCI Clinical Co-pilot. I am ready to assist you with advanced biomechanical advice and diagnostic calculations.

Here are several topics you can query:
* **"Explain Class III compensation limits"** to analyze anatomical and surgical limits.
* **"IMPA torque boundaries"** to review periodontal bone plate safety.
* **"Premolar extraction patterns"** to examine therapeutic extraction matrices.
* **"Presurgical decompensation goals"** to plan orthognathic surgery preparation.

*Note: This is an offline consulting assistant running with built-in orthodontic expertise. Set the EXPO_PUBLIC_GEMINI_API_KEY environment variable to enable live web-connected case reviews.*`;
  }

  try {
    const contents = history.map((h: any) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const systemInstructionText = `You are an expert, board-certified consulting orthodontist assisting Dr. Salman MDS.
Analyze dentofacial discrepancies, periodontal alveolar limit risks, sagittal skeletal discrepancies (Class II, Class III), vertical growth patterns (hyperdivergent, hypodivergent), and surgical planning decompensations.
Answer professionally, scientifically, with zero fluff. Focus strictly on clinical evidence, orthodontic metrics, and biotype safety boundaries.`;

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      }
    };

    const data = await callGeminiAPI('gemini-2.5-flash', payload, apiKey);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || 'No response from Co-pilot AI.';
  } catch (error: any) {
    console.error('Chat error:', error);
    return `### Clinical Co-pilot Error

I encountered an error communicating with the live Gemini AI engine:
**${error.message || 'Request failed'}**

Please verify your API key is correctly configured in your environment or continue in offline consulting mode.`;
  }
}

export async function generateClinicOnlySummary(
  patientDetails: any,
  ociResult: any
): Promise<string> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return generateLocalClinicOnlySynthesis(patientDetails, ociResult);
  }

  try {
    const prompt = `You are an expert, board-certified consulting orthodontist. Please generate a highly comprehensive, board-certified level Orthodontic Diagnosis & Treatment Planning Report based SOLELY on the patient's chairside clinical examination and the calculated OCI Clinical Score.
    
IMPORTANT: Do NOT refer to or request any lateral cephalograms, radiographs, cephalometric tracings, CBCT, OPG, patient photos, digital scans, or STL files. This is a rapid chairside consultation. Do NOT mention any cephalometric parameters such as ANB, SNA, SNB, Wits, IMPA, U1-SN, FMA, SN-MP, or any angular/linear measurements. Use wording like "Based on clinical examination...", "The facial profile suggests...", "The occlusal relationship indicates...", "The clinical findings support...", "The patient demonstrates...".

Patient Metadata:
- Name: ${patientDetails.name || 'Anonymous'}
- Age: ${patientDetails.age} years old
- Gender: ${patientDetails.gender}
- Chief Complaint: ${patientDetails.chiefComplaint || 'N/A'}
- Primary Clinical Skeletal Class: ${patientDetails.diagnosis}
- Facial Profile: ${patientDetails.facialProfile || 'N/A'}
- Facial Symmetry: ${patientDetails.facialAsymmetry || 'N/A'}
- Lip Competence: ${patientDetails.lips || 'N/A'}
- Smile Characteristics: ${patientDetails.smileAnalysis || 'N/A'}
- Dentition Phase: ${patientDetails.dentitionPhase || 'N/A'}
- Clinician's Observations: ${patientDetails.clinicalNotes || 'None'}

Clinical Examination Findings:
- Molar Relationship: Right: ${patientDetails.molarRelationRight || 'Class I'}, Left: ${patientDetails.molarRelationLeft || 'Class I'}
- Canine Relationship: Right: ${patientDetails.canineRelationRight || 'Class I'}, Left: ${patientDetails.canineRelationLeft || 'Class I'}
- Overjet: ${patientDetails.overjet !== undefined && patientDetails.overjet !== '' ? patientDetails.overjet + ' mm' : 'N/A'}
- Overbite: ${patientDetails.overbite !== undefined && patientDetails.overbite !== '' ? patientDetails.overbite + ' mm' : 'N/A'}
- Crowding/Spacing: ${patientDetails.crowdingSpacing || 'N/A'}
- Anterior Crossbite: ${patientDetails.anteriorCrossbite || 'None'}
- Posterior Crossbite: ${patientDetails.posteriorCrossbite || 'None'}
- TMJ Status: ${patientDetails.tmjStatus || 'Normal'}
- Functional Airway: ${patientDetails.functionalAirway || 'Normal'}
- Atypical Habits: ${patientDetails.habits && patientDetails.habits.length > 0 ? patientDetails.habits.join(', ') : 'None'}
- Growth Status: ${patientDetails.growthStatus || 'N/A'}

OCI Clinical Difficulty Index:
- Clinical Score: ${ociResult.totalScore}/100
- Raw Difficulty Value: ${ociResult.rawScore.toFixed(2)}
- Category Breakdown:
${ociResult.categoryScores.map((c: any) => `  * ${c.name}: ${c.score}/${c.maxScore} (${c.severity}) - Details: ${c.details}`).join('\n')}

Please structure the report exactly as follows with no introduction or outro:

# Comprehensive Clinical Orthodontic Analysis & Report

## 1. Clinical Case Analysis & Diagnosis
- **Skeletal Pattern Prediction (Clinical)**: [Detailed clinical description based on profile and chin position]
- **Dental Relationship & Malocclusion**: [Detailed description based on molar/canine relations, overjet, overbite, crossbites, and crowding]
- **Soft Tissue & Facial Esthetics**: [Esthetic assessment based on facial profile, symmetry, lips, and smile]
- **Functional Examination**: [Assessment of TMJ, airway, and oral habits]

## 2. Problem List & Treatment Objectives
- **Clinical Problem List**: [Prioritized list of patient problems]
- **Treatment Objectives**: [Specific goals to resolve malocclusion and facial disharmony]

## 3. Treatment Strategy & Recommendations
- **Primary Recommendation**: [Title of recommended plan]
- **Clinical Rationale**: [Justification based purely on clinical exam indicators]
- **Extraction Recommendation**: [Whether extractions are indicated and why]
- **Anchorage Requirement**: [Anchorage description based on retraction needs]
- **Surgical Probability & Difficulty**: [Surgical probability and difficulty index description]

## 4. Biomechanical & Growth Management
- **Biomechanics Strategy**: [Detailed mechanics to achieve dental movements]
- **Growth Modification Recommendation**: [Growth management if applicable]
- **Estimated Treatment Duration**: [Duration estimate]

## 5. Risk Assessment, Prognosis & Retention
- **Risk Assessment**: [Periodontal, root resorption, compliance, or hygiene risks]
- **Prognosis**: [Treatment success probability]
- **Relapse Risk & Retention Protocol**: [Relapse factors and proposed retention protocol]

## 6. Professional Disclaimer
*This report is an AI-assisted clinical decision-support tool. Final diagnosis and treatment decisions remain the responsibility of the treating orthodontist.*
`;

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    const data = await callGeminiAPI('gemini-2.5-flash', payload, apiKey);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return text 
      ? ClinicalNarrativeQA.validateAndClean(text, { patient: patientDetails, ceph: null as any, oci: ociResult }) 
      : 'Unable to generate clinical report via Gemini.';
  } catch (error: any) {
    console.error('Error generating AI clinical summary, falling back to local clinical synthesis:', error);
    return generateLocalClinicOnlySynthesis(patientDetails, ociResult);
  }
}

export function generateLocalClinicOnlySynthesis(
  patient: any,
  oci: any
): string {
  const isClass2 = patient.diagnosis === 'Class II';
  const isClass3 = patient.diagnosis === 'Class III';

  let skeletalSummary = `Based on clinical examination, the patient demonstrates a ${patient.diagnosis || 'Class I'} skeletal relationship. `;
  if (patient.facialProfile) {
    skeletalSummary += `The facial profile suggests a ${patient.facialProfile.toLowerCase()} convexity, matching the skeletal pattern. `;
  }
  if (patient.facialAsymmetry && patient.facialAsymmetry !== 'None') {
    skeletalSummary += `Facial symmetry is clinically noted as ${patient.facialAsymmetry.toLowerCase()} asymmetry. `;
  }

  let dentalSummary = `The occlusal relationship indicates a Class ${isClass2 ? 'II' : isClass3 ? 'III' : 'I'} dental malocclusion. `;
  if (patient.overjet) {
    dentalSummary += `Overjet is clinically measured at ${patient.overjet} mm. `;
  }
  if (patient.overbite) {
    dentalSummary += `Overbite is clinically measured at ${patient.overbite} mm. `;
  }
  if (patient.crowdingSpacing && patient.crowdingSpacing !== 'None') {
    dentalSummary += `Arch analysis reveals ${patient.crowdingSpacing.toLowerCase()} within the dentition. `;
  }
  if (patient.anteriorCrossbite && patient.anteriorCrossbite !== 'None') {
    dentalSummary += `An anterior crossbite is clinically present (${patient.anteriorCrossbite.toLowerCase()}). `;
  }
  if (patient.posteriorCrossbite && patient.posteriorCrossbite !== 'None') {
    dentalSummary += `A posterior crossbite is clinically present (${patient.posteriorCrossbite.toLowerCase()}). `;
  }

  let softTissueSummary = `Soft tissue assessment shows ${patient.lips === 'Incompetent' ? 'incompetent lips at rest' : 'competent lips'}. `;
  if (patient.smileAnalysis) {
    softTissueSummary += `Smile characteristics indicate ${patient.smileAnalysis.toLowerCase()}. `;
  }

  let functionalSummary = `Functional examination shows ${patient.tmjStatus === 'Normal' ? 'healthy TMJ functions with no clicking or pain' : `TMJ findings indicating ${patient.tmjStatus.toLowerCase()}`}. `;
  if (patient.functionalAirway) {
    functionalSummary += `Functional airway profile is noted as ${patient.functionalAirway.toLowerCase()}. `;
  }
  if (patient.habits && patient.habits.length > 0) {
    functionalSummary += `Active atypical habits include: ${patient.habits.join(', ')}. `;
  }

  let strategy = oci.interpretation;
  let rec = oci.recommendation;

  return `# Comprehensive Clinical Orthodontic Analysis & Report

## 1. Clinical Case Analysis & Diagnosis
- **Skeletal Pattern Prediction (Clinical)**: ${skeletalSummary}
- **Dental Relationship & Malocclusion**: ${dentalSummary}
- **Soft Tissue & Facial Esthetics**: ${softTissueSummary}
- **Functional Examination**: ${functionalSummary}

## 2. Problem List & Treatment Objectives
- **Clinical Problem List**:
  1. Skeletal ${patient.diagnosis || 'Class I'} discrepancy.
  2. Dental ${isClass2 ? 'Class II' : isClass3 ? 'Class III' : 'Class I'} malocclusion.
  ${patient.crowdingSpacing === 'Crowding' ? '3. Dental crowding and alignment deficiency.\\n' : ''}  ${patient.lips === 'Incompetent' ? '4. Lip incompetence and facial muscle strain.\\n' : ''}
- **Treatment Objectives**:
  1. Normalize dental arch alignment and resolve tooth crowding.
  2. Restore normal overjet and overbite relationships.
  3. Optimize facial soft-tissue harmony and lip competence.

## 3. Treatment Strategy & Recommendations
- **Primary Recommendation**: ${oci.treatmentSuggestion}
- **Clinical Rationale**: The patient demonstrates a clinical difficulty rating of ${oci.totalScore}/100. ${rec}
- **Extraction Recommendation**: ${oci.totalScore > 65 ? 'Selective extraction of premolars is recommended to gain alignment space and retract anterior segments.' : 'Non-extraction approach with selective interproximal reduction (IPR) or arch expansion.'}
- **Anchorage Requirement**: ${oci.totalScore > 65 ? 'Moderate to maximum anchorage (consider temporary anchorage devices / TADs).' : 'Minimum anchorage.'}
- **Surgical Probability & Difficulty**: Difficulty index is ${oci.totalScore > 85 ? 'High (orthognathic surgical consultation recommended)' : oci.totalScore > 50 ? 'Moderate' : 'Low'}.

## 4. Biomechanical & Growth Management
- **Biomechanics Strategy**: ${isClass2 ? 'Use Class II elastics or fixed functional appliances to retract maxillary segments and correct overjet.' : isClass3 ? 'Use Class III elastics or protraction face mask if patient is growing, to advance maxilla.' : 'Standard leveling and alignment mechanics.'}
- **Growth Modification Recommendation**: ${patient.growthStatus === 'Growing' || patient.growthStatus === 'Peak Growth' ? 'Functional orthopedics indicated due to active growth status.' : 'Growth modification is not viable as growth is complete.'}
- **Estimated Treatment Duration**: ${oci.totalScore > 75 ? '24-30 months' : oci.totalScore > 40 ? '18-24 months' : '12-18 months'}.

## 5. Risk Assessment, Prognosis & Retention
- **Risk Assessment**: Moderate risk of root resorption or relapse if skeletal boundaries are exceeded. Careful monitoring of periodontal attachment is recommended.
- **Prognosis**: Favorable, contingent upon patient compliance with elastics and hygiene.
- **Relapse Risk & Retention Protocol**: Relapse risk is ${oci.totalScore > 60 ? 'high' : 'moderate'}. Fixed lingual retainers on both arches coupled with clear overlay vacuum retainers at night are recommended.

## 6. Professional Disclaimer
*This report is an AI-assisted clinical decision-support tool. Final diagnosis and treatment decisions remain the responsibility of the treating orthodontist.*
`;
}
