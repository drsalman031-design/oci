import React, { useState } from 'react';
import { Assessment } from '../types';
import { motion } from 'motion/react';
import { 
  FileText, 
  Printer, 
  Download, 
  CheckCircle, 
  Activity, 
  Calendar, 
  ShieldCheck, 
  Award,
  Layers,
  AlertTriangle,
  Brain,
  Info
} from 'lucide-react';
import { Norms } from '../scoringEngine';

interface ReportsPanelProps {
  savedAssessments: Assessment[];
}

export default function ReportsPanel({ savedAssessments }: ReportsPanelProps) {
  const [selectedId, setSelectedId] = useState<string>('');

  // Find selected assessment or fallback
  const selectedAssessment = savedAssessments.find(a => a.id === selectedId) || savedAssessments[0];

  React.useEffect(() => {
    if (savedAssessments.length > 0 && !selectedId) {
      setSelectedId(savedAssessments[0].id);
    }
  }, [savedAssessments, selectedId]);

  if (savedAssessments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-12 rounded-3xl space-y-6 border border-slate-200 dark:border-slate-800 shadow-xl"
        >
          <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto border border-teal-500/20 text-teal-500 animate-pulse">
            <FileText className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">Offline Clinical Reports Core</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
            Clinical history database is currently empty. Run an OCI analysis first to store patient parameters before accessing professional clinical reports.
          </p>
          <div className="pt-2">
            <span className="text-[10px] text-teal-500/75 font-mono uppercase tracking-widest block">Clinical Decision Support Engine</span>
            <span className="text-xs text-slate-400">Developed by Dr. Salman MDS Orthodontist</span>
          </div>
        </motion.div>
      </div>
    );
  }

  const { patientDetails, cephalometricInput, ociResult } = selectedAssessment;

  // Measurement rows to display
  const measurementsList = [
    { key: 'sna', name: 'SNA (°)', norm: Norms.sna },
    { key: 'snb', name: 'SNB (°)', norm: Norms.snb },
    { key: 'anb', name: 'ANB (°)', norm: Norms.anb },
    { key: 'wits', name: 'Wits Appraisal (mm)', norm: Norms.wits },
    { key: 'fma', name: 'FMA (°)', norm: Norms.fma },
    { key: 'u1Sn', name: 'U1-SN (°)', norm: Norms.u1Sn },
    { key: 'impa', name: 'IMPA (°)', norm: Norms.impa },
    { key: 'interincisalAngle', name: 'Interincisal Angle (°)', norm: Norms.interincisalAngle },
    { key: 'overjet', name: 'Overjet (mm)', norm: Norms.overjet },
    { key: 'overbite', name: 'Overbite (mm)', norm: Norms.overbite }
  ];

  // Logic to calculate deviation from norm
  const getDeviationText = (val: number | '', norm: typeof Norms.sna) => {
    if (val === '') return 'N/A';
    const numVal = Number(val);
    if (numVal >= norm.min && numVal <= norm.max) return 'Normal';
    const diff = numVal - norm.mean;
    return diff > 0 ? `+${diff.toFixed(1)} (High)` : `${diff.toFixed(1)} (Low)`;
  };

  // Treatment rules (mirroring TreatmentPlanning for perfect report synergy)
  const isClassIII = patientDetails.diagnosis === 'Class III' || (cephalometricInput.anb !== '' && cephalometricInput.anb < 0);
  const isClassII = patientDetails.diagnosis === 'Class II' || (cephalometricInput.anb !== '' && cephalometricInput.anb > 4);
  const isGrowing = (typeof patientDetails.age === 'number' ? patientDetails.age : 12) <= 14;

  const objectives = [
    'Establish Class I canine and molar relationships.',
    'Optimize incisor inclinations (Target IMPA ~90°).',
    'Achieve functional overjet/overbite and seal.',
    'Establish stable facial profile harmony.'
  ];

  const suggestedAppliances = [
    isGrowing ? (isClassII ? 'Twin Block Orthopedics' : 'Protraction Facemask therapy') : 'Fixed Brackets (0.022-inch Roth prescription)',
    ociResult.totalScore > 50 ? 'Temporary Anchorage Devices (TADs)' : 'Clear Aligners Feasible',
    'Bonded Lower lingual wire (3-3) + Upper Essix night retainer'
  ];

  const exportCSV = () => {
    const csvContent = [
      ['CLINICAL EXAMINATION REPORT', 'OCI ANALYZER'],
      ['Developed by', 'Dr. Salman MDS Orthodontist'],
      ['Export Date', new Date().toLocaleDateString()],
      ['', ''],
      ['--- PATIENT METADATA ---', ''],
      ['Name', patientDetails.name || 'Anonymous'],
      ['Case ID', patientDetails.caseNumber || 'N/A'],
      ['Age', String(patientDetails.age || 'N/A')],
      ['Gender', patientDetails.gender || 'N/A'],
      ['Date of Exam', patientDetails.date || 'N/A'],
      ['Primary Diagnosis', patientDetails.diagnosis || 'Class I'],
      ['OCI Total Score', `${ociResult.totalScore}/100`],
      ['OCI Interpretation', ociResult.interpretation],
      ['Algorithmic Recommendation', ociResult.recommendation],
      ['', ''],
      ['--- CEPHALOMETRIC ANALYSIS ---', ''],
      ['Measurement', 'Value', 'Clinical Norm', 'Assessment'],
      ...measurementsList.map(item => {
        const val = (cephalometricInput as any)[item.key];
        return [
          item.name,
          val === '' ? 'N/A' : `${val}`,
          `${item.norm.min} - ${item.norm.max}`,
          getDeviationText(val, item.norm)
        ];
      }),
      ['', ''],
      ['--- INTERPRETIVE ANALYSIS ---', ''],
      ['Skeletal compensation', isClassIII ? 'Class III compensation active' : isClassII ? 'Class II compensation active' : 'Balanced jaw relations'],
      ['Clinical complexity', ociResult.totalScore > 60 ? 'HIGH CLINICAL COMPLEXITY' : 'MODERATE CLINICAL COMPLEXITY'],
      ['', ''],
      ['--- TREATMENT STRATEGY ---', ''],
      ...objectives.map((obj, i) => [`Objective ${i+1}`, obj]),
      ...suggestedAppliances.map((app, i) => [`Suggested Appliance ${i+1}`, app]),
      ['Clinical Notes', patientDetails.clinicalNotes || 'None']
    ].map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ClinicalReport_${patientDetails.name || 'Patient'}_${patientDetails.caseNumber || 'Case'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Top filter action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center glass-panel p-6 rounded-3xl shadow-sm gap-4 print:hidden">
        <div>
          <span className="text-xs uppercase tracking-wider text-teal-500 font-mono flex items-center">
            <FileText className="w-3.5 h-3.5 mr-1.5" /> Clinical Reports Center
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-display">
            Printable Patient Reports
          </h2>
        </div>

        {/* Dropdown Select Patient */}
        <div className="flex items-center space-x-3 w-full sm:w-auto shrink-0">
          <label className="text-xs font-bold text-slate-400 font-mono whitespace-nowrap">Active Patient:</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
          >
            {savedAssessments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.patientDetails.name || 'Anonymous'} - {item.patientDetails.caseNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Printable Area card */}
      <div className="glass-panel p-8 sm:p-12 rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 relative overflow-hidden print:shadow-none print:border-none print:p-0 print:bg-white print:text-black">
        
        {/* Printable Logo/Header */}
        <div className="border-b-2 border-slate-200 dark:border-slate-800/80 pb-6 mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-mono font-bold text-base shrink-0">
                Ω
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white font-display print:text-black">
                  OCI CLINICAL REPORT
                </h1>
                <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Clinical Orthodontic Decision Support Engine</p>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 print:text-black">Developed by Dr. Salman MDS Orthodontist</p>
            <p className="text-[10px] text-slate-400">Offline Expert-System Architecture</p>
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8 bg-slate-50/50 dark:bg-slate-950/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 print:bg-slate-50 print:text-black print:border-slate-300">
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Patient Name</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 print:text-black">{patientDetails.name || 'Anonymous'}</p>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Case ID / Chart Number</span>
            <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100 print:text-black">{patientDetails.caseNumber || 'N/A'}</p>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Examination Date</span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 print:text-black">{patientDetails.date || 'N/A'}</p>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Age / Gender</span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 print:text-black">{patientDetails.age || 'N/A'} yrs / {patientDetails.gender || 'N/A'}</p>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Primary Malocclusion</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 print:text-black">{patientDetails.diagnosis || 'Class I'}</p>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">OCI Compensation Score</span>
            <p className="text-sm font-black text-teal-600 dark:text-teal-400 print:text-black">{ociResult.totalScore}/100 ({ociResult.interpretation})</p>
          </div>
        </div>

        {/* Measurements comparison table */}
        <div className="space-y-4 mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 print:text-black">
            Cephalometric Metrics & Clinical Deviations
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 print:border-slate-300">
                  <th className="py-2.5 font-bold">Parameters Analyzed</th>
                  <th className="py-2.5 font-bold text-center">Value Record</th>
                  <th className="py-2.5 font-bold text-center">Clinical Norms</th>
                  <th className="py-2.5 font-bold text-right">Interpretation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/40 print:divide-slate-300">
                {measurementsList.map((item) => {
                  const val = (cephalometricInput as any)[item.key];
                  const devText = getDeviationText(val, item.norm);
                  const isNormal = devText === 'Normal';
                  return (
                    <tr key={item.key} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/20 print:text-black">
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300 print:text-black">{item.name}</td>
                      <td className="py-3 font-mono font-bold text-center text-slate-800 dark:text-slate-100 print:text-black">
                        {val === '' ? 'N/A' : `${val}${item.norm.unit}`}
                      </td>
                      <td className="py-3 text-center text-slate-500 font-mono">
                        {item.norm.min} - {item.norm.max}{item.norm.unit}
                      </td>
                      <td className={`py-3 text-right font-bold ${
                        val === '' ? 'text-slate-400' : isNormal ? 'text-teal-600 dark:text-teal-400 print:text-black' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {devText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Treatment Objectives + Appliance planning details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 print:text-black">
              Clinical Objectives Summary
            </h3>
            <div className="space-y-2">
              {objectives.map((obj, i) => (
                <div key={i} className="flex items-start space-x-2.5 text-xs text-slate-600 dark:text-slate-300 print:text-black">
                  <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5 print:hidden" />
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 print:text-black">
              Biomechanical Appliance Suggestions
            </h3>
            <div className="space-y-2">
              {suggestedAppliances.map((app, i) => (
                <div key={i} className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850 text-xs text-slate-700 dark:text-slate-300 print:bg-slate-50 print:text-black print:border-slate-300">
                  <span className="font-bold text-teal-600 dark:text-teal-400 mr-1">{i + 1}.</span> {app}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Algorithmic Recommendation Summary */}
        <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 mb-8 space-y-2 print:bg-slate-50 print:text-black print:border-slate-300">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black">Decision-Support Recommendation</h4>
          <p className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed font-sans font-medium print:text-black">
            {ociResult.recommendation}
          </p>
          <p className="text-[10px] text-slate-400 leading-normal pt-1 italic print:text-black">
            * This computational analysis aggregates cephalometric limits and dental compensation indices offline. Final treatment decisions must factor in soft tissue profiles, mandibular joint health, and biological skeletal growth staging.
          </p>
        </div>

        {/* Clinical notes area */}
        {patientDetails.clinicalNotes && (
          <div className="space-y-2 mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 print:text-black">
              Direct Examination Notes
            </h3>
            <div className="p-4 bg-slate-50/30 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed print:bg-slate-50 print:text-black print:border-slate-300">
              {patientDetails.clinicalNotes}
            </div>
          </div>
        )}

        {/* Doctor signature line (Print layout) */}
        <div className="hidden print:block mt-16 pt-12 border-t border-slate-200 flex justify-between items-center text-xs text-slate-800">
          <div>
            <p className="font-bold">Clinical Examiner Signature</p>
            <p className="text-slate-500 mt-8">_______________________________</p>
            <p className="mt-1 text-slate-500">Dr. Salman MDS Orthodontist</p>
          </div>
          <div className="text-right">
            <p className="font-bold">Examination Date</p>
            <p className="text-slate-500 mt-8">{patientDetails.date || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Quick floating controls */}
      <div className="flex justify-center space-x-3.5 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-2xl shadow-lg shadow-teal-600/10 font-bold text-xs tracking-wider transition duration-200 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>PRINT OR EXPORT TO PDF</span>
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center space-x-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs tracking-wider border border-slate-200 dark:border-slate-800 transition duration-200 cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>DOWNLOAD SPREADSHEET (CSV)</span>
        </button>
      </div>

    </div>
  );
}
