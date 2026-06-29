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
    // Elegant clinical mock summary when API key is not present
    return `### Clinical Summary (Offline/Local Mode)

The patient **${patientDetails.name || 'Anonymous'}** (${patientDetails.age || 'N/A'}yo ${patientDetails.gender || 'N/A'}) presents with **${ociResult.interpretation}** (computed OCI score: **${ociResult.totalScore}/100**), reflecting a skeletal **${patientDetails.diagnosis || 'Class II/III'}** discrepancy.

#### Dentoalveolar Profile
* **Overjet**: ${cephalometricInput.overjet !== '' ? cephalometricInput.overjet + ' mm' : 'N/A'} (Norm: 2.5mm)
* **IMPA (Lower Incisor)**: ${cephalometricInput.impa !== '' ? cephalometricInput.impa + '°' : 'N/A'} (Norm: 90°)
* **U1-SN (Upper Incisor)**: ${cephalometricInput.u1Sn !== '' ? cephalometricInput.u1Sn + '°' : 'N/A'} (Norm: 104°)

#### Clinical Directive
${ociResult.recommendation}`;
  }

  try {
    const prompt = `You are a professional consulting orthodontist. Please generate a concise, premium-quality clinical summary and assessment report for an orthodontic patient based on their diagnostic details, cephalometric inputs, and computed Orthodontic Compensation Index (OCI).

Patient Information:
- Name: ${patientDetails.name || 'Anonymous'}
- Age: ${patientDetails.age}
- Gender: ${patientDetails.gender}
- Primary Diagnosis: ${patientDetails.diagnosis}
- Clinical Notes: ${patientDetails.clinicalNotes || 'None'}

Key Cephalometric Inputs:
- ANB Angle: ${cephalometricInput.anb}° (Normal: 2°)
- SNA Angle: ${cephalometricInput.sna}° (Normal: 82°)
- SNB Angle: ${cephalometricInput.snb}° (Normal: 80°)
- Wits Appraisal: ${cephalometricInput.wits} mm (Normal: 0mm)
- FMA (Vertical): ${cephalometricInput.fma}° (Normal: 25°)
- U1-SN Angle: ${cephalometricInput.u1Sn}° (Normal: 104°)
- IMPA Angle: ${cephalometricInput.impa}° (Normal: 90°)
- Overjet: ${cephalometricInput.overjet} mm (Normal: 2.5mm)
- Overbite: ${cephalometricInput.overbite} mm (Normal: 2.5mm)

Computed Assessment Result:
- Orthodontic Compensation Index (OCI) Score: ${ociResult.totalScore}/100
- Compensation Severity: ${ociResult.interpretation}
- Algorithm Recommendation: ${ociResult.recommendation}

Please write a highly polished, professional 3-4 sentence orthodontic clinical summary that synthesizes the relationship between the underlying skeletal discrepancy and the dentoalveolar compensations (e.g., incisor proclination/retroclination). Provide guidance on therapeutic limitations (e.g., whether dental camouflage is realistic or if an orthognathic surgical consultation/presurgical decompensation is suggested). Do not use flowery marketing language; write strictly as a board-certified specialist.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    return response.text || 'Unable to generate clinical summary via Gemini.';
  } catch (error: any) {
    console.error('Error generating AI clinical summary:', error);
    return `### Clinical Summary (Local Safe Fallback)

The patient **${patientDetails.name || 'Anonymous'}** exhibits **${ociResult.interpretation}** with an index score of **${ociResult.totalScore}%**.

*Note: Live analysis failed due to connection or configuration error: ${error.message || 'Check API key'}.*`;
  }
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
