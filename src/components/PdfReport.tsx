import React, { useState, useRef, useEffect } from 'react';
import { Assessment } from '../types';
import { 
  Printer, 
  Share2, 
  X, 
  PenTool, 
  ShieldCheck, 
  Award,
  BookOpen
} from 'lucide-react';
import SvgCharts from './SvgCharts';
import Heatmap from './Heatmap';

interface PdfReportProps {
  assessment: Assessment;
  onClose: () => void;
}

export default function PdfReport({ assessment, onClose }: PdfReportProps) {
  const [clinicName, setClinicName] = useState('Central Orthodontic Clinic');
  const [doctorName, setDoctorName] = useState('Dr. Salman, DDS');
  const [typedSignature, setTypedSignature] = useState(false);
  const [sigText, setSigText] = useState('Dr. Salman');
  
  // Signature Drawing Pad Refs & State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!typedSignature && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000080'; // Navy ink
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
      }
    }
  }, [typedSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get position
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `Orthodontic Compensation Index (OCI) Report for Case ${assessment.patientDetails.caseNumber}. Score: ${assessment.ociResult.totalScore}/100.`;
    if (navigator.share) {
      navigator.share({
        title: `OCI Assessment - ${assessment.patientDetails.name}`,
        text: text,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${text} Link: ${window.location.href}`);
      alert('Report link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center z-40 overflow-y-auto p-4 md:p-6 print:p-0 print:bg-white print:relative">
      
      <div className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 w-full max-w-4xl rounded-3xl print:rounded-none shadow-2xl print:shadow-none overflow-hidden my-4 md:my-8 print:my-0 flex flex-col">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="px-8 py-5 bg-slate-950 text-white flex justify-between items-center border-b border-slate-850 shrink-0 print:hidden">
          <div>
            <h3 className="font-bold text-sm tracking-wide text-slate-400">REPORT COMPILATION STAGE</h3>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <span>Certified OCI Diagnostic Sheet</span>
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={handleShare}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              title="Share Report"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Paper Content */}
        <div className="p-8 md:p-12 space-y-8 flex-1 print:p-4 print:bg-white print:text-black">
          
          {/* Clinic Header Block */}
          <div className="border-b-2 border-slate-900 dark:border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              {/* Editable Clinic Name on UI, static on print */}
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="text-2xl font-black text-slate-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded p-1 w-full max-w-[350px] print:border-none print:p-0 print:text-black"
                title="Click to edit clinic name"
              />
              <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Dentoalveolar Orthodontics Specialist Center</p>
            </div>
            
            <div className="text-left md:text-right text-xs font-mono text-slate-500 dark:text-slate-400">
              <p>Case ID: {assessment.patientDetails.caseNumber}</p>
              <p>Exam Date: {assessment.patientDetails.date || assessment.createdAt.split('T')[0]}</p>
            </div>
          </div>

          {/* Patient Details & OCI Score Block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Patient demographics */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Patient Demographics</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1.5">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{assessment.patientDetails.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1.5">
                  <span className="text-slate-400">Diagnosis:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{assessment.patientDetails.diagnosis}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1.5">
                  <span className="text-slate-400">Age / Gender:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{assessment.patientDetails.age} years • {assessment.patientDetails.gender}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1.5">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Fully Compensated</span>
                </div>
              </div>
            </div>

            {/* Large Score Banner */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Orthodontic Compensation Index</span>
              <span className="text-5xl font-black font-mono text-slate-900 dark:text-white mt-1">{assessment.ociResult.totalScore}</span>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-1 uppercase tracking-wide">
                {assessment.ociResult.interpretation}
              </span>
            </div>

          </div>

          {/* Cephalometric Values Summary Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Dentoalveolar cephalometric readings</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              {[
                { label: 'ANB', val: assessment.cephalometricInput.anb, norm: '2°' },
                { label: 'SNA', val: assessment.cephalometricInput.sna, norm: '82°' },
                { label: 'SNB', val: assessment.cephalometricInput.snb, norm: '80°' },
                { label: 'Wits', val: assessment.cephalometricInput.wits, norm: '0mm' },
                { label: 'U1-SN', val: assessment.cephalometricInput.u1Sn, norm: '104°' },
                { label: 'IMPA', val: assessment.cephalometricInput.impa, norm: '90°' },
                { label: 'Overjet', val: assessment.cephalometricInput.overjet, norm: '2.5mm' },
                { label: 'Overbite', val: assessment.cephalometricInput.overbite, norm: '2.5mm' }
              ].map((m, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 flex justify-between">
                  <span className="text-slate-400 font-bold">{m.label}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {m.val !== '' ? m.val : 'N/A'} <span className="text-[9px] opacity-50">({m.norm})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Clinical Summary report */}
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-teal-600" />
              <span>Certified Medical Analysis & Diagnostics</span>
            </h4>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans italic">
              "{assessment.aiSummary || 'No clinical report recorded.'}"
            </p>
          </div>

          {/* SVG Profile Chart embed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t border-b border-slate-100 dark:border-slate-900 py-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-4">Functional System Map</h4>
              <Heatmap severityMap={assessment.ociResult.severityMap} input={assessment.cephalometricInput} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-4">Deviation Profile Summary</h4>
              <SvgCharts categoryScores={assessment.ociResult.categoryScores} />
            </div>
          </div>

          {/* Signature Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6 items-end">
            <div className="space-y-2 text-xs text-slate-400 max-w-sm leading-relaxed">
              <p className="font-bold text-slate-500">Notice of Clinical Responsibility</p>
              <p>The computed OCI represents an algorithmic clinical assistant. All dental camouflage or orthognathic diagnostic pathways remain under the sole accountability of the treating certified orthodontist.</p>
            </div>
            
            {/* Signature Draw / Type Box */}
            <div className="space-y-3 flex flex-col items-end">
              <div className="flex space-x-2 text-[10px] font-bold text-slate-400 print:hidden mb-1">
                <button 
                  onClick={() => setTypedSignature(false)} 
                  className={`px-2 py-1 rounded-lg border ${!typedSignature ? 'bg-slate-100 text-slate-700' : ''}`}
                >
                  Draw Ink
                </button>
                <button 
                  onClick={() => setTypedSignature(true)} 
                  className={`px-2 py-1 rounded-lg border ${typedSignature ? 'bg-slate-100 text-slate-700' : ''}`}
                >
                  Type Script
                </button>
              </div>

              <div className="w-64 border-b border-slate-900 dark:border-slate-800 flex flex-col items-center justify-center min-h-[90px] relative">
                {typedSignature ? (
                  <input
                    type="text"
                    value={sigText}
                    onChange={(e) => setSigText(e.target.value)}
                    className="font-signature text-3xl text-navy bg-transparent border-none text-center focus:outline-none w-full italic"
                    style={{ fontFamily: 'Georgia, serif' }}
                    placeholder="Type name to sign"
                  />
                ) : (
                  <>
                    <canvas
                      ref={canvasRef}
                      width={256}
                      height={90}
                      className="bg-transparent cursor-crosshair max-w-full"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    <button
                      onClick={clearSignature}
                      className="absolute bottom-1 right-1 text-[9px] text-red-500 font-bold bg-white/80 px-1 rounded border print:hidden"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>

              {/* Doctor Details Editable */}
              <div className="text-right space-y-1">
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="font-bold text-slate-800 dark:text-white bg-transparent border-none text-right focus:outline-none focus:ring-1 focus:ring-blue-500 rounded p-0.5 text-xs print:border-none print:p-0 print:text-black"
                  title="Click to edit doctor name"
                />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Orthodontic Specialist Signature</p>
              </div>
            </div>
          </div>

        </div>

        {/* Print Disclaimer */}
        <p className="hidden print:block text-center text-[8px] text-slate-400 font-mono pb-4 border-t border-slate-100 pt-2">
          Page 1 of 1 • Orthodontic Compensation Index (OCI) Clinician Sheet • Generated via OCI Analyzer offline engine.
        </p>

      </div>
    </div>
  );
}
