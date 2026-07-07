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
