import { 
  VisionEngine, 
  ClinicalEngine, 
  CephalometricEngine, 
  DecisionEngine, 
  ReportEngine, 
  AISelfValidator 
} from './aiCore';
import { ClinicalNarrativeQA } from './narrativeQA';
import { PatientDetails } from '../types';

let dynamicApiKey = '';

export function setDynamicApiKey(key: string) {
  dynamicApiKey = key;
}

export function getGeminiApiKey(): string {
  // Key is managed entirely on the secure backend server.
  // Return a static indicator to allow frontend execution.
  return 'secure-server-side-managed-key';
}

// Secure proxy client helper to communicate with backend server-side AI endpoints
async function callGeminiAPI(
  endpointName: string,
  payload: any
): Promise<any> {
  // Determine backend URL (relative URL for web client compatibility, fallback to localhost for others)
  let backendUrl = `/api/analysis/${endpointName}`;
  if (typeof window === 'undefined' || !window.location) {
    backendUrl = `http://localhost:3000/api/analysis/${endpointName}`;
  }
  
  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Secure Server API error (${response.status}): ${errorText}`);
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

    const data = await callGeminiAPI('clinical-summary', payload);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      const mode = patientDetails.analysisMode || 'turbo';
      const cleanedQA = ClinicalNarrativeQA.validateAndClean(text, { patient: patientDetails, ceph: cephalometricInput, oci: ociResult });
      const validation = AISelfValidator.validate(cleanedQA, mode, patientDetails, cephalometricInput, ociResult);
      return validation.cleanedText;
    }
    return 'Unable to generate clinical report via Gemini.';
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
  const mode = patient.analysisMode || 'turbo';
  const visionObs = VisionEngine.getObservations(patient);
  const clinicalOutput = ClinicalEngine.analyze(patient, visionObs);
  const cephOutput = CephalometricEngine.analyze(ceph);
  const decisionOutput = DecisionEngine.formulate(mode, clinicalOutput, cephOutput, oci, patient);
  const reportMarkdown = ReportEngine.compile(mode, clinicalOutput, cephOutput, decisionOutput, oci);
  
  const validation = AISelfValidator.validate(reportMarkdown, mode, patient, ceph, oci);
  return validation.cleanedText;
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

    const data = await callGeminiAPI('clinic-only', payload);
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

    const data = await callGeminiAPI('multimodal-vision', payload);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      const cleanedQA = ClinicalNarrativeQA.validateAndClean(text, { patient: patientDetails, ceph: null as any, oci: ociResult });
      const validation = AISelfValidator.validate(cleanedQA, 'clinic', patientDetails, null as any, ociResult);
      return validation.cleanedText;
    }
    return 'Unable to generate clinical report via Gemini.';
  } catch (error: any) {
    console.error('Error generating AI clinical summary, falling back to local clinical synthesis:', error);
    return generateLocalClinicOnlySynthesis(patientDetails, ociResult);
  }
}

export function generateLocalClinicOnlySynthesis(
  patient: any,
  oci: any
): string {
  const emptyCeph: any = {
    sna: '', snb: '', anb: '', wits: '', fma: '', snMp: '', yAxis: '', coA: '', coGn: '',
    u1Sn: '', u1NaDeg: '', u1NaMm: '', impa: '', l1NbDeg: '', l1NbMm: '',
    interincisalAngle: '', overjet: '', overbite: '', curveOfSpee: '', midlineDeviation: '',
    upperLipELine: '', lowerLipELine: '', nasolabialAngle: '', facialConvexity: '', molarRelation: 'Class I'
  };
  const visionObs = VisionEngine.getObservations(patient);
  const clinicalOutput = ClinicalEngine.analyze(patient, visionObs);
  const cephOutput = CephalometricEngine.analyze(emptyCeph);
  const decisionOutput = DecisionEngine.formulate('clinic', clinicalOutput, cephOutput, oci, patient);
  const reportMarkdown = ReportEngine.compile('clinic', clinicalOutput, cephOutput, decisionOutput, oci);
  
  const validation = AISelfValidator.validate(reportMarkdown, 'clinic', patient, emptyCeph, oci);
  return validation.cleanedText;
}

export async function uriToBase64(uri: string): Promise<{ data: string; mimeType: string }> {
  if (uri.startsWith('data:')) {
    const parts = uri.split(',');
    const mime = parts[0].split(':')[1].split(';')[0];
    return { data: parts[1], mimeType: mime };
  }
  
  const response = await fetch(uri);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const parts = base64data.split(',');
      const mime = parts[0].split(':')[1].split(';')[0];
      resolve({ data: parts[1], mimeType: mime });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function runMultimodalVisionAI(
  photos: Record<string, string>,
  patient: PatientDetails
): Promise<any> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API Key is not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY in your environment variables.");
  }

  const imageParts: any[] = [];
  
  for (const slotKey of Object.keys(photos)) {
    const uri = photos[slotKey];
    if (uri && uri !== 'MOCK_IMAGE') {
      try {
        const { data, mimeType } = await uriToBase64(uri);
        imageParts.push({
          inlineData: {
            mimeType,
            data
          }
        });
      } catch (err) {
        console.warn(`Failed to convert image ${slotKey} to base64:`, err);
      }
    }
  }

  const promptText = `
You are a board-certified consulting orthodontist. Analyze the attached clinical photographs (extraoral/intraoral) alongside the clinical details of this patient, and return structured observations.

Patient Demographics:
- Name: ${patient.name || 'Anonymous'}
- Age: ${patient.age || 'N/A'} years old
- Gender: ${patient.gender || 'N/A'}
- Chief Complaint: ${patient.chiefComplaint || 'N/A'}

Clinical Examination Findings:
- Clinician Profile Entry: ${patient.facialProfile || 'N/A'}
- Clinician Symmetry Entry: ${patient.facialAsymmetry || 'N/A'}
- Clinician Lip Competence Entry: ${patient.lips || 'N/A'}
- Clinician Crowding Entry: ${patient.crowdingSpacing || 'N/A'}
- Clinician Overjet Entry: ${patient.overjet !== undefined ? patient.overjet + 'mm' : 'N/A'}
- Clinician Overbite Entry: ${patient.overbite !== undefined ? patient.overbite + 'mm' : 'N/A'}

Analyze the images to extract observations for the following parameters. 
Return your response STRICTLY as a raw JSON object matching this schema (do NOT wrap it in markdown code blocks like \`\`\`json):
{
  "extraoral": {
    "facial_profile": "Convex | Concave | Straight",
    "facial_symmetry": "Symmetric | Mild asymmetry | Moderate asymmetry | Severe asymmetry",
    "lip_competence": "Competent | Incompetent | Potentially competent"
  },
  "intraoral": {
    "molar_relationship": "Class I | Class II | Class III | Unclear",
    "overjet": "Normal | Increased | Decreased | Reverse",
    "crowding": "None | Mild | Moderate | Severe"
  },
  "confidence": {
    "facial_profile": 0.95,
    "crowding": 0.93
  }
}

Do NOT write any diagnosis, treatment plans, or recommendations in this stage. Return ONLY the JSON observations.
`;

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText },
          ...imageParts
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const responseJson = await callGeminiAPI('qa', payload);
  const text = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No response content returned by Gemini vision model.");
  }

  try {
    const observations = JSON.parse(text.trim());
    return observations;
  } catch (err) {
    console.error("Failed to parse Gemini vision response:", text);
    throw new Error("Invalid JSON structure returned by Gemini vision model.");
  }
}
