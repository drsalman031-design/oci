var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new import_genai.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.post("/api/assessments/ai-summary", async (req, res) => {
  try {
    const { patientDetails, cephalometricInput, ociResult } = req.body;
    if (!patientDetails || !cephalometricInput || !ociResult) {
      return res.status(400).json({ error: "Missing assessment data" });
    }
    if (!ai) {
      const mockSummary = `AI SUMMARY (DEMO MODE - GEMINI_API_KEY NOT CONFIGURED):
The patient ${patientDetails.name || "Anonymous"} (${patientDetails.age || "N/A"}yo ${patientDetails.gender || "N/A"}) exhibits ${ociResult.interpretation} (OCI score: ${ociResult.totalScore}/100) associated with a skeletal ${patientDetails.diagnosis || "Class II/III"} discrepancy.
The maxillary dentoalveolar components exhibit compensations corresponding to the jaw relationship. Overjet is ${cephalometricInput.overjet !== "" ? cephalometricInput.overjet + "mm" : "N/A"} and IMPA is ${cephalometricInput.impa || "N/A"}\xB0. 
Clinical recommendation: ${ociResult.recommendation}.`;
      return res.json({ summary: mockSummary });
    }
    const prompt = `You are a professional consulting orthodontist. Please generate a concise, premium-quality clinical summary and assessment report for an orthodontic patient based on their diagnostic details, cephalometric inputs, and computed Orthodontic Compensation Index (OCI).

Patient Information:
- Name: ${patientDetails.name || "Anonymous"}
- Age: ${patientDetails.age}
- Gender: ${patientDetails.gender}
- Primary Diagnosis: ${patientDetails.diagnosis}
- Clinical Notes: ${patientDetails.clinicalNotes || "None"}

Key Cephalometric Inputs:
- ANB Angle: ${cephalometricInput.anb}\xB0 (Normal: 2\xB0)
- SNA Angle: ${cephalometricInput.sna}\xB0 (Normal: 82\xB0)
- SNB Angle: ${cephalometricInput.snb}\xB0 (Normal: 80\xB0)
- Wits Appraisal: ${cephalometricInput.wits} mm (Normal: 0mm)
- FMA (Vertical): ${cephalometricInput.fma}\xB0 (Normal: 25\xB0)
- U1-SN Angle: ${cephalometricInput.u1Sn}\xB0 (Normal: 104\xB0)
- IMPA Angle: ${cephalometricInput.impa}\xB0 (Normal: 90\xB0)
- Overjet: ${cephalometricInput.overjet} mm (Normal: 2.5mm)
- Overbite: ${cephalometricInput.overbite} mm (Normal: 2.5mm)

Computed Assessment Result:
- Orthodontic Compensation Index (OCI) Score: ${ociResult.totalScore}/100
- Compensation Severity: ${ociResult.interpretation}
- Algorithm Recommendation: ${ociResult.recommendation}

Please write a highly polished, professional 3-4 sentence orthodontic clinical summary that synthesizes the relationship between the underlying skeletal discrepancy and the dentoalveolar compensations (e.g., incisor proclination/retroclination). Provide guidance on therapeutic limitations (e.g., whether dental camouflage is realistic or if an orthognathic surgical consultation/presurgical decompensation is suggested). Do not use flowery marketing language; write strictly as a board-certified specialist.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });
    const summary = response.text || "Unable to generate summary.";
    res.json({ summary });
  } catch (error) {
    console.error("Error generating AI clinical summary:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
});
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} under NODE_ENV=${process.env.NODE_ENV}`);
  });
}
setupServer();
//# sourceMappingURL=server.cjs.map
