import { useState, useEffect } from 'react';
import { OciResult, CephalometricInput, PatientDetails } from '../types';
import { 
  Award, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Edit,
  Cpu,
  BookmarkPlus
} from 'lucide-react';
import SvgCharts from './SvgCharts';
import Heatmap from './Heatmap';

interface ResultsDashboardProps {
  patientDetails: PatientDetails;
  cephalometricInput: CephalometricInput;
  ociResult: OciResult;
  onSaveAssessment: (aiSummary: string) => void;
  onOpenPdf: (aiSummary: string) => void;
  onBack: () => void;
}

export default function ResultsDashboard({
  patientDetails,
  cephalometricInput,
  ociResult,
  onSaveAssessment,
  onOpenPdf,
  onBack
}: ResultsDashboardProps) {
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fetch AI Clinical Summary on Mount
  useEffect(() => {
    async function fetchAiSummary() {
      setLoadingSummary(true);
      try {
        const response = await fetch('/api/assessments/ai-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientDetails,
            cephalometricInput,
            ociResult
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setAiSummary(data.summary);
          setEditedSummary(data.summary);
        } else {
          throw new Error('Failed to generate summary');
        }
      } catch (err) {
        console.warn('AI API disconnected, using local clinical synthesis engine:', err);
        // Fallback clinical intelligence algorithm
        const localSynthesis = generateLocalClinicalSynthesis(patientDetails, cephalometricInput, ociResult);
        setAiSummary(localSynthesis);
        setEditedSummary(localSynthesis);
      } finally {
        setLoadingSummary(false);
      }
    }

    fetchAiSummary();
  }, [patientDetails, cephalometricInput, ociResult]);

  // Handle saving assessment record
  const handleSave = () => {
    onSaveAssessment(editedSummary);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const scorePercentage = ociResult.totalScore / 100;
  const strokeDasharray = 2 * Math.PI * 45; // Radius of 45
  const strokeDashoffset = strokeDasharray - (scorePercentage * strokeDasharray);

  // Determine score color classes
  const getScoreColor = (score: number) => {
    if (score <= 20) return 'text-emerald-500 stroke-emerald-500';
    if (score <= 40) return 'text-teal-500 stroke-teal-500';
    if (score <= 60) return 'text-amber-500 stroke-amber-500';
    if (score <= 80) return 'text-orange-500 stroke-orange-500';
    return 'text-red-500 stroke-red-500';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center glass-panel p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">Assessment Completed</span>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">
            Results Dashboard: {patientDetails.name || 'Anonymous'}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Edit Inputs
          </button>
          <button
            onClick={() => onOpenPdf(editedSummary)}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Generate PDF</span>
          </button>
          <button
            onClick={handleSave}
            disabled={savedSuccess}
            className={`flex-1 sm:flex-none px-5 py-2 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm ${
              savedSuccess ? 'bg-emerald-600' : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {savedSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Saved to Local DB!</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4" />
                <span>Save Assessment</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Stats Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Circular Gauge */}
        <div className="glass-panel p-8 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orthodontic Compensation Index</h3>
          
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full rotate-[-90deg]">
              {/* Outer grey circle */}
              <circle
                cx="88"
                cy="88"
                r="45"
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth="10"
                className="dark:stroke-slate-800"
                transform="translate(0, 0)"
              />
              {/* Animated Progress circle */}
              <circle
                cx="88"
                cy="88"
                r="45"
                fill="transparent"
                strokeWidth="10"
                strokeDasharray={`${strokeDasharray}`}
                strokeDashoffset={`${strokeDashoffset}`}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out ${getScoreColor(ociResult.totalScore)}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                {ociResult.totalScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100 max</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-200">
              {ociResult.interpretation}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[220px]">
              Dentoalveolar structures show a substantial degree of masking for sagittal bone structures.
            </p>
          </div>
        </div>

        {/* Right Scale Interpretation & Recommendations */}
        <div className="md:col-span-2 glass-panel p-8 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight border-b border-slate-100 dark:border-slate-800 pb-2">
              Clinical Interpretation & Severity Scale
            </h3>
            
            {/* Severity horizontal progress indicators */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[
                { range: '0-20', label: 'Minimal', color: 'bg-emerald-500', active: ociResult.totalScore <= 20 },
                { range: '21-40', label: 'Mild', color: 'bg-teal-500', active: ociResult.totalScore > 20 && ociResult.totalScore <= 40 },
                { range: '41-60', label: 'Moderate', color: 'bg-amber-500', active: ociResult.totalScore > 40 && ociResult.totalScore <= 60 },
                { range: '61-80', label: 'Severe', color: 'bg-orange-500', active: ociResult.totalScore > 60 && ociResult.totalScore <= 80 },
                { range: '81-100', label: 'Extreme', color: 'bg-red-500', active: ociResult.totalScore > 80 }
              ].map((tier, idx) => (
                <div 
                  key={idx} 
                  className={`p-2.5 rounded-xl border text-center transition ${
                    tier.active 
                      ? `${tier.color} text-white border-transparent font-bold ring-2 ring-offset-2 ring-slate-100 dark:ring-slate-950` 
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200/50 dark:border-slate-800/50'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider">{tier.label}</p>
                  <p className="text-[9px] font-mono opacity-80">{tier.range}</p>
                </div>
              ))}
            </div>

            {/* Recommendation alert container */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-4 rounded-2xl flex items-start space-x-3">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-bold text-blue-900 dark:text-blue-100">Algorithmic Clinical Recommendation</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  {ociResult.recommendation}
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 italic">
            * This index evaluates sagittal compensation limits. Treatment choice (camouflage vs. surgery) must integrate vertical mechanics, facial profile esthetics, joint wellness, and patient consent.
          </div>
        </div>

      </div>

      {/* AI Clinical Summary Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-6 h-6 text-teal-400 animate-pulse" />
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white flex items-center space-x-2">
                <span>Gemini Clinical Copilot Summary</span>
                <span className="bg-teal-500/10 text-teal-300 text-[9px] px-2 py-0.5 rounded-full border border-teal-500/20 font-bold uppercase tracking-wide">Live</span>
              </h3>
              <p className="text-xs text-slate-400">Synthesizes ANB metrics and dentoalveolar tipping profiles automatically</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditingSummary(!isEditingSummary)}
            className="flex items-center space-x-1 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{isEditingSummary ? 'View summary' : 'Edit text'}</span>
          </button>
        </div>

        {loadingSummary ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Synthesizing patient cephalometric and clinical data...</p>
          </div>
        ) : isEditingSummary ? (
          <div className="space-y-3">
            <textarea
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-100 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition resize-none"
            />
            <p className="text-[10px] text-slate-500 font-mono">You can modify the AI output to tailor it precisely for your medical records before saving.</p>
          </div>
        ) : (
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 font-sans text-sm leading-relaxed text-slate-200">
            {editedSummary || 'No summary generated.'}
          </div>
        )}
      </div>

      {/* Heatmap & Graphics */}
      <Heatmap severityMap={ociResult.severityMap} input={cephalometricInput} />

      {/* Chart profiles */}
      <SvgCharts categoryScores={ociResult.categoryScores} />

    </div>
  );
}

// Client-side expert-system fallback report generator if Gemini API key is missing or offline
function generateLocalClinicalSynthesis(
  patient: PatientDetails,
  ceph: CephalometricInput,
  oci: OciResult
): string {
  const dx = patient.diagnosis || 'skeletal malocclusion';
  const anbText = ceph.anb !== '' ? `ANB is ${ceph.anb}°` : 'ANB';
  const impaText = ceph.impa !== '' ? `IMPA is ${ceph.impa}°` : 'IMPA';
  const overjetText = ceph.overjet !== '' ? `Overjet is ${ceph.overjet}mm` : 'Overjet';

  let summary = `The patient displays a ${oci.interpretation} of sagittal disharmony (computed OCI score: ${oci.totalScore}/100) associated with a skeletal ${dx} discrepancy. `;

  if (patient.diagnosis === 'Class III') {
    summary += `Cephalometrics indicate skeletal Class III relationship (${anbText}). Upper incisors display proclination while lower incisors show retroclination as a primary compensatory mechanism to establish positive overjet (${overjetText}). `;
    if (oci.totalScore > 60) {
      summary += `Due to the severe degree of dental compensation, orthodontic camouflage possesses high limitation. Mandibular incisors have exceeded normal biomechanical limits (${impaText}). An orthognathic consultation should be strongly pursued.`;
    } else {
      summary += `Compensation levels are within clinical guidelines. Orthodontic dental camouflage may be successfully achieved with carefully managed mechanics and anchorage.`;
    }
  } else if (patient.diagnosis === 'Class II') {
    summary += `Cephalometrics indicate skeletal Class II sagittal profile (${anbText}). Compensatory dental patterns show a mismatch, with proclined lower incisors (${impaText}) and retroclined upper incisors to maintain functional overjet (${overjetText}). `;
    if (oci.totalScore > 60) {
      summary += `With an OCI of ${oci.totalScore}, dentoalveolar limits have been heavily compromised. Camouflage will yield unstable or periodontally hazardous outcomes. Suggest presurgical decompensation and surgical correction.`;
    } else {
      summary += `Moderate compensation is observed. Dentoalveolar camouflage is realistic, potentially involving selective dental extractions or interproximal reduction (IPR) to preserve labial bone plates.`;
    }
  } else {
    summary += `Diagnostic parameters show well-balanced sagittal relations (${anbText}) and mild dentialveolar compensations, appropriate for conventional orthodontic alignment.`;
  }

  return summary;
}
