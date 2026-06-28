import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API endpoint to generate AI Clinical Summary
app.post('/api/assessments/ai-summary', async (req, res) => {
  try {
    const { patientDetails, cephalometricInput, ociResult } = req.body;

    if (!patientDetails || !cephalometricInput || !ociResult) {
      return res.status(400).json({ error: 'Missing assessment data' });
    }

    if (!ai) {
      // Return a professional mock summary if API Key is missing, to maintain offline readiness
      const mockSummary = `AI SUMMARY (DEMO MODE - GEMINI_API_KEY NOT CONFIGURED):
The patient ${patientDetails.name || 'Anonymous'} (${patientDetails.age || 'N/A'}yo ${patientDetails.gender || 'N/A'}) exhibits ${ociResult.interpretation} (OCI score: ${ociResult.totalScore}/100) associated with a skeletal ${patientDetails.diagnosis || 'Class II/III'} discrepancy.
The maxillary dentoalveolar components exhibit compensations corresponding to the jaw relationship. Overjet is ${cephalometricInput.overjet !== '' ? cephalometricInput.overjet + 'mm' : 'N/A'} and IMPA is ${cephalometricInput.impa || 'N/A'}°. 
Clinical recommendation: ${ociResult.recommendation}.`;
      return res.json({ summary: mockSummary });
    }

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

    const summary = response.text || 'Unable to generate summary.';
    res.json({ summary });
  } catch (error: any) {
    console.error('Error generating AI clinical summary:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Setup Vite Dev server or Serve static files
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT} under NODE_ENV=${process.env.NODE_ENV}`);
  });
}

setupServer();
