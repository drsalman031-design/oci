import { GoogleGenAI } from '@google/genai';

let aiInstance: any = null;

// Helper to get Gemini API Client safely
function getGeminiClient() {
  if (aiInstance) return aiInstance;

  // Check standard environment keys
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (apiKey) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return aiInstance;
  }
  return null;
}

export async function generateClinicalSummary(
  patientDetails: any,
  cephalometricInput: any,
  ociResult: any
): Promise<string> {
  const ai = getGeminiClient();

  if (!ai) {
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

### Skeletal Diagnosis
- **Skeletal Class**: [Analyze ANB, SNA, SNB, Wits and state Class I/II/III]
- **Discrepancy Severity**: [Determine discrepancy level (Mild, Moderate, Severe)]
- **Vertical Pattern**: [Analyze FMA/SN-MP to state Hyperdivergent / Hypodivergent / Average vertical pattern]
- **Transverse Findings**: [Analyze posterior crossbite/arch width if available, otherwise write 'No significant transverse discrepancies recorded']

### Dental Diagnosis
- **Incisor Inclination**: [Determine if upper and lower incisors are Proclined, Retroclined, or Normovertical]
- **Dental Compensation**: [Comment on dental compensations observed relative to skeletal pattern]
- **Crowding or Spacing**: [Discuss crowding or spacing based on Patient Details: ${patientDetails.crowdingSpacing || 'N/A'}]
- **Overjet & Overbite**: [Detailed assessment of Overjet (${cephalometricInput.overjet}mm) and Overbite (${cephalometricInput.overbite}mm/%)]
- **Midline Deviation**: [Midline deviation assessment: ${cephalometricInput.midlineDeviation || 'None'}]

### Soft Tissue Diagnosis
- **Facial Profile**: [Analyze profile: ${patientDetails.facialProfile || 'N/A'} and Facial Convexity]
- **Lip Position**: [Discuss lip positions relative to Rickett's E-Line and Nasolabial Angle]
- **Smile Characteristics**: [Discuss smile features based on: ${patientDetails.smileAnalysis || 'N/A'}]
- **Soft Tissue Compensation**: [Comment on soft tissue adaptation/profile compensation]

### OCI Interpretation
Explain what the computed OCI score of **${ociResult.totalScore}/100** and category '**${ociResult.interpretation}**' indicates regarding the severity of dentoalveolar compensation and its specific clinical implications. Highlight how much the dental structures have shifted to mask the underlying skeletal discrepancy, and the limits of further orthodontic camouflage.

---

## 2. Automatic Treatment Planning
Generate 3-4 evidence-informed treatment options tailored for this patient's age (${patientDetails.age} years) and OCI score. Options can include: Observation, Growth Modification, Orthodontic Camouflage, Extraction vs. Non-extraction, Anchorage Considerations, Expansion, Orthognathic Surgery evaluation, or Retention.

For each option, provide the following fields:
- **Option Name**
  - **Clinical Rationale**: [Detailed scientific explanation]
  - **Expected Benefits**: [What will this achieve]
  - **Potential Limitations**: [Risks, periodontal boundaries, compliance]
  - **Factors Influencing the Recommendation**: [Why this option is suggested based on OCI, age, etc.]

---

## 3. Clinical Notes
Provide a concise, formal summary:
- **Chief Diagnostic Findings**: [Synthesis of the malocclusion]
- **Key Cephalometric Abnormalities**: [List primary deviances from norms]
- **Major Compensation Patterns**: [How the dentition is compensating]
- **Primary Treatment Objectives**: [Aims of treatment]

---

## 4. Professional Disclaimer
*This report is an AI-assisted clinical decision-support tool. Final diagnosis and treatment decisions remain the responsibility of the treating orthodontist.*

Do not write any intro or outro; start directly with '# Comprehensive Orthodontic Analysis & Report'. Use precise, board-certified clinical terminology. No fluff or casual statements.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    return response.text || 'Unable to generate clinical report via Gemini.';
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

  // 3. Treatment planning recommendations
  let options = '';
  const isGrowing = Number(patient.age) <= 13;
  
  if (oci.totalScore > 60) {
    // Severe / Extreme Compensation case -> Surgical pathway suggested
    options += `- **Option 1: Orthognathic Surgery and Presurgical Decompensation**
  - **Clinical Rationale**: The severe skeletal discrepancy (${anbVal}°) and high OCI score (${oci.totalScore}/100) indicate that dental compensations have reached physiological limits. Attempting dental camouflage would compromise periodontal support and facial aesthetics.
  - **Expected Benefits**: Full skeletal harmony, optimal functional occlusion, major facial profile improvement, and long-term stability.
  - **Potential Limitations**: Requires combined orthodontic-surgical approach, general anesthesia risks, and temporary worsening of aesthetics during decompensation.
  - **Factors Influencing the Recommendation**: High OCI score (${oci.totalScore}/100), skeletal ${skeletalClass} severe discrepancy, and adult patient status.\n\n`;

    options += `- **Option 2: Orthodontic Camouflage (with Extractions/IPR)**
  - **Clinical Rationale**: If orthognathic surgery is declined, a highly compromised camouflage could be attempted with caution, though periodontal limits are extremely narrow.
  - **Expected Benefits**: Achievement of functional anterior overjet/overbite without surgical intervention.
  - **Potential Limitations**: High risk of labial bone dehiscence, compromises profile aesthetics (e.g., flattening of lips), and questionable long-term stability.
  - **Factors Influencing the Recommendation**: Patient's reluctance to undergo orthognathic surgery despite reaching skeletal limits.\n\n`;
  } else {
    // Camouflage is feasible
    options += `- **Option 1: Orthodontic Camouflage via Dental Arch Management**
  - **Clinical Rationale**: Mild-to-moderate OCI score (${oci.totalScore}/100) indicates that the dentoalveolar system possesses sufficient remaining adaptive capacity. Alignment and sagittal correction can be achieved safely within alveolar bone envelopes.
  - **Expected Benefits**: Stable Class I canine relationship, correction of overjet and overbite, and improved profile without surgical risk.
  - **Potential Limitations**: Dependent on excellent patient compliance with intermaxillary elastics and precise torque control.
  - **Factors Influencing the Recommendation**: Favorable OCI score (${oci.totalScore}/100) and moderate skeletal discrepancy.\n\n`;

    if (isGrowing) {
      options += `- **Option 2: Orthopedic Growth Modification**
  - **Clinical Rationale**: The patient is a growing adolescent (${patient.age}yo). Intercepting skeletal growth using functional appliances (e.g., Twin Block, Herbst, or Facemask) can modify jaw relationships orthopedically.
  - **Expected Benefits**: Reduces the severity of the skeletal discrepancy, minimizes future extraction needs, and guides dentofacial development.
  - **Potential Limitations**: Highly dependent on patient compliance during active wear phases; ineffective post-pubertal growth spurt.
  - **Factors Influencing the Recommendation**: Growing age of the patient (${patient.age} years old).\n\n`;
    } else {
      options += `- **Option 2: Selective Extractions or Interproximal Reduction (IPR)**
  - **Clinical Rationale**: To relieve crowding (${patient.crowdingSpacing || 'None'}) and gain space for sagittal overjet correction, selective extraction of premolars or arch-wide IPR is indicated to upright the incisors into safe bony houses.
  - **Expected Benefits**: Relieves dental crowding, permits uprighting of proclined incisors, and controls dental midlines.
  - **Potential Limitations**: Requires precise anchorage management and extended treatment duration.
  - **Factors Influencing the Recommendation**: IMPA limits, overjet requirements, and crowding status.\n\n`;
    }
  }

  // Active retention
  options += `- **Option 3: Retention and Post-Treatment Stability**
  - **Clinical Rationale**: Orthodontically corrected compensated bites have a high tendency to relapse toward original skeletal patterns. Robust retention protocol is clinically mandatory.
  - **Expected Benefits**: Long-term preservation of functional and aesthetic alignment.
  - **Potential Limitations**: High dependence on lifelong user compliance.
  - **Factors Influencing the Recommendation**: Mandibular plane angles and active OCI correction load.`;

  return `# Comprehensive Orthodontic Analysis & Report

## 1. Automatic Diagnosis

### Skeletal Diagnosis
- **Skeletal Class**: Skeletal ${skeletalClass}
- **Discrepancy Severity**: ${skeletalSeverity} skeletal sagittal discrepancy (ANB: ${anbVal}°, Wits: ${ceph.wits !== '' ? ceph.wits : '0'}mm)
- **Vertical Pattern**: ${verticalPattern}
- **Transverse Findings**: ${ceph.posteriorCrossbite && ceph.posteriorCrossbite !== 'None' ? `Posterior crossbite present (${ceph.posteriorCrossbite})` : 'No significant transverse discrepancies recorded'}

### Dental Diagnosis
- **Incisor Inclination**: Maxillary incisors are ${upperInc} (U1-SN: ${u1SnVal}°), Mandibular incisors are ${lowerInc} (IMPA: ${impaVal}°)
- **Dental Compensation**: ${dentalComp}
- **Crowding or Spacing**: ${patient.crowdingSpacing || 'None'}
- **Overjet & Overbite**: Overjet is ${ceph.overjet !== '' ? ceph.overjet : '2.5'}mm (Norm: 2.5mm), Overbite is ${ceph.overbite !== '' ? ceph.overbite : '2.5'}mm/% (Norm: 2.5mm / 30%)
- **Midline Deviation**: ${ceph.midlineDeviation && ceph.midlineDeviation !== '' ? `${ceph.midlineDeviation}mm deviation` : 'No significant midline deviation recorded'}

### Soft Tissue Diagnosis
- **Facial Profile**: ${patient.facialProfile || 'Straight'} profile, facial convexity is ${ceph.facialConvexity !== '' ? ceph.facialConvexity + '°' : '12°'}
- **Lip Position**: Upper lip to E-Line is ${ceph.upperLipELine !== '' ? ceph.upperLipELine : '-2'}mm, Lower lip to E-Line is ${ceph.lowerLipELine !== '' ? ceph.lowerLipELine : '0'}mm, Nasolabial Angle is ${ceph.nasolabialAngle !== '' ? ceph.nasolabialAngle : '102'}°
- **Smile Characteristics**: ${patient.smileAnalysis || 'Consonant'} smile
- **Soft Tissue Compensation**: Active lip adaptation to mask the underlying dental-skeletal discrepancy is noted.

### OCI Interpretation
The computed Orthodontic Compensation Index (OCI) score of **${oci.totalScore}/100** falls into the **${oci.interpretation}** category. This reflects the severity of dentoalveolar adjustments masking the skeletal error. ${oci.totalScore > 60 ? 'This high score indicates that natural dentoalveolar compensatory capacity is nearly exhausted. Attempting further dental camouflage presents a highly elevated risk of periodontal recession, cortical plate fenestration, and unstable alignment. Pre-surgical orthodontic decompensation followed by orthognathic corrective surgery is strongly indicated.' : 'This score indicates a favorable physiological margin of compensation. Achieving stable dental camouflage with conventional orthodontic movement is highly feasible, provided precise biomechanical force systems and torque control are maintained.'}

---

## 2. Automatic Treatment Planning
The following evidence-informed treatment pathways have been generated based on the patient's age of ${patient.age} years, OCI score of ${oci.totalScore}, and clinical constraints:

${options}

---

## 3. Clinical Notes
- **Chief Diagnostic Findings**: Skeletal Class ${skeletalClass === 'Class III' ? 'III' : skeletalClass === 'Class II' ? 'II' : 'I'} malocclusion with ${oci.interpretation.toLowerCase()}.
- **Key Cephalometric Abnormalities**: Primary deviances observed in ANB (${anbVal}°), IMPA (${impaVal}°), and U1-SN (${u1SnVal}°).
- **Major Compensation Patterns**: Dentoalveolar tilting of the incisors attempting to mask the jaw mismatch.
- **Primary Treatment Objectives**: Establish a healthy functional occlusion, restore proper interincisal relationship, protect periodontal attachment plates, and improve facial profile harmony.

---

## 4. Professional Disclaimer
*This report is an AI-assisted clinical decision-support tool. Final diagnosis and treatment decisions remain the responsibility of the treating orthodontist.*`;
}

export async function generateChatResponse(message: string, history: any[]): Promise<string> {
  const ai = getGeminiClient();

  if (!ai) {
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
    const formattedHistory = history.map((h: any) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

    // Start a chat session using chats API
    const chat = ai.chats.create({
      model: 'gemini-3.5-flash',
      config: {
        systemInstruction: `You are an expert, board-certified consulting orthodontist assisting Dr. Salman MDS.
Analyze dentofacial discrepancies, periodontal alveolar limit risks, sagittal skeletal discrepancies (Class II, Class III), vertical growth patterns (hyperdivergent, hypodivergent), and surgical planning decompensations.
Answer professionally, scientifically, with zero fluff. Focus strictly on clinical evidence, orthodontic metrics, and biotype safety boundaries.`,
      },
      history: formattedHistory,
    });

    const response = await chat.sendMessage({ message });
    return response.text || 'No response from Co-pilot AI.';
  } catch (error: any) {
    console.error('Chat error:', error);
    return `### Clinical Co-pilot Error

I encountered an error communicating with the live Gemini AI engine:
**${error.message || 'Request failed'}**

Please verify your API key is correctly configured in your environment or continue in offline consulting mode.`;
  }
}
