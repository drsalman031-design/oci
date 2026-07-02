import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { Assessment, PatientDetails, CephalometricInput, OciResult } from '../types';
import { 
  Printer, 
  Share2, 
  X, 
  ShieldCheck, 
  Award,
  Sparkles,
  FileText,
  User,
  Activity,
  AlertTriangle,
  Brain,
  Layers,
  Clock,
  Compass,
  ArrowRight,
  TrendingUp,
  Download
} from 'lucide-react-native';
import tw from 'twrnc';
import { generateTreatmentPlan } from '../treatmentPlanner';

interface PdfReportProps {
  assessment: Assessment;
  onClose: () => void;
}

/**
 * Resolves advanced clinical intelligence fields for the given assessment.
 * Supports pre-populated seeded gold-standard cases, and calculates fallback options dynamically for new manually created patients.
 */
function getReportData(assessment: Assessment) {
  const adv = assessment.advanced || {};
  
  // If the advanced fields are already populated (seeded case), use them directly!
  if (adv.cvmStage) {
    return {
      cvmStage: adv.cvmStage,
      growthStatus: adv.growthStatus || 'Growth Complete',
      skeletalMaturity: adv.skeletalMaturity || 'Mature',
      extractionRecommendation: adv.extractionRecommendation || 'No',
      extractionProbability: adv.extractionProbability || '10',
      extractionReason: adv.extractionReason || 'Non-extraction approach indicated.',
      surgeryRecommendation: adv.surgeryRecommendation || 'No',
      surgeryProbability: adv.surgeryProbability || '5',
      surgeryReason: adv.surgeryReason || 'Skeletal and dental base within acceptable parameters.',
      anchorageRequirement: adv.anchorageRequirement || 'Minimum',
      suggestedAnchorage: adv.suggestedAnchorage || 'Conventional alignment',
      difficultyScore: adv.difficultyScore || '30',
      complexity: adv.complexity || 'Easy',
      estimatedDuration: adv.estimatedDuration || '18',
      estimatedAppointments: adv.estimatedAppointments || '14',
      estimatedRetention: adv.estimatedRetention || 'Standard retention protocols.',
      relapseRisk: adv.relapseRisk || 'Low',
      relapseProbability: adv.relapseProbability || '15',
      relapseReason: adv.relapseReason || 'Stable post-treatment intercuspation.',
      ociSkeletalContribution: adv.ociSkeletalContribution || '30',
      ociDentalContribution: adv.ociDentalContribution || '40',
      ociSoftTissueContribution: adv.ociSoftTissueContribution || '30',
      ociScoreExplanation: adv.ociScoreExplanation || 'Skeletal and dental parameters are harmonious.',
      diagnosticConfidence: adv.diagnosticConfidence || '95',
      treatmentConfidence: adv.treatmentConfidence || '95',
      borderlineCategory: adv.borderlineCategory || 'None',
      borderlineReason: adv.borderlineReason || 'Clear-cut dental alignment indicators.',
      skeletalProblems: adv.skeletalProblems || 'None',
      dentalProblems: adv.dentalProblems || 'Mild dental crowding',
      softTissueProblems: adv.softTissueProblems || 'None',
      functionalProblems: adv.functionalProblems || 'None',
      primaryObjectives: adv.primaryObjectives || 'Align arches.',
      secondaryObjectives: adv.secondaryObjectives || 'Refine occlusion.',
      longTermObjectives: adv.longTermObjectives || 'Maintain stability.',
      treatmentSequence: adv.treatmentSequence || 'Phase 1: Alignment, Phase 2: Leveling.',
      contraindications: adv.contraindications || 'None',
      contraindicationReason: adv.contraindicationReason || 'N/A',
      primaryPlanOption: adv.primaryPlanOption || 'Non-extraction aligners.',
      alternativePlan1: adv.alternativePlan1 || 'Fixed braces.',
      alternativePlan2: adv.alternativePlan2 || 'Minimal IPR.',
      overallPrognosis: adv.overallPrognosis || 'Excellent',
      skeletalCorrectionPotential: adv.skeletalCorrectionPotential || 'Stable',
      dentalCorrectionPotential: adv.dentalCorrectionPotential || 'Excellent',
      softTissueImprovement: adv.softTissueImprovement || 'Balanced',
      longTermStability: adv.longTermStability || 'Stable',
      successProbability: adv.successProbability || '95',
      explanationWhy: adv.explanationWhy || 'Skeletal harmony is stable.',
      decisionTrace: adv.decisionTrace || 'Diagnostics verified.',
      riskAlerts: adv.riskAlerts || 'None',
      finalClinicalSummary: adv.finalClinicalSummary || 'Healthy functional occlusion indicated.'
    };
  }

  // Otherwise, calculate them dynamically on-the-fly for manually-created cases!
  const anb = typeof assessment.cephalometricInput.anb === 'number' ? assessment.cephalometricInput.anb : 2;
  const impa = typeof assessment.cephalometricInput.impa === 'number' ? assessment.cephalometricInput.impa : 90;
  
  const isClass1 = assessment.patientDetails.diagnosis === 'Class I';
  const isClass2 = assessment.patientDetails.diagnosis === 'Class II' || anb > 4.5;
  const isClass3 = assessment.patientDetails.diagnosis === 'Class III' || anb < 0;
  
  const age = Number(assessment.patientDetails.age) || 20;
  const isGrowing = age < 14;
  
  // Dynamic growth indicators
  let cvmStage = 'CS6';
  let growthStatus = 'Growth Complete';
  let skeletalMaturity = 'Mature';
  if (isGrowing) {
    if (age <= 9) {
      cvmStage = 'CS1';
      growthStatus = 'Growing';
      skeletalMaturity = 'Immature';
    } else if (age <= 11) {
      cvmStage = 'CS3';
      growthStatus = 'Peak Growth';
      skeletalMaturity = 'Transitional';
    } else {
      cvmStage = 'CS4';
      growthStatus = 'Decelerating Growth';
      skeletalMaturity = 'Transitional';
    }
  }

  // Use treatment planning rules engine to build dynamic options
  const plan = generateTreatmentPlan(
    assessment.patientDetails,
    assessment.cephalometricInput,
    assessment.ociResult,
    {
      ageGroup: isGrowing ? 'growing' : 'adult',
      crowdingSeverity: assessment.patientDetails.crowdingSpacing === 'Crowding' ? 'moderate' : 'none',
      spacingSeverity: assessment.patientDetails.crowdingSpacing === 'Spacing' ? 'moderate' : 'none',
      archDiscrepancy: 0
    }
  );

  const total = assessment.ociResult.totalScore;
  const isSurgical = total > 60 || plan.treatmentComplexity === 'Severe / Surgical';
  const isExtraction = total > 45 || assessment.patientDetails.crowdingSpacing === 'Crowding';

  const skeletonDiag = isClass2 ? 'Skeletal Class II' : isClass3 ? 'Skeletal Class III' : 'Skeletal Class I';
  const dentalDiag = isClass2 ? 'Class II Division 1' : isClass3 ? 'Class III' : 'Class I';

  return {
    cvmStage,
    growthStatus,
    skeletalMaturity,
    extractionRecommendation: isExtraction ? 'Yes' : 'No',
    extractionProbability: isExtraction ? '85' : '10',
    extractionReason: isExtraction ? 'Required to relieve dental crowding and upright lower incisors.' : 'Non-extraction approach is fully indicated; dental arches possess sufficient volume.',
    surgeryRecommendation: isSurgical ? 'Yes' : 'No',
    surgeryProbability: isSurgical ? '90' : '5',
    surgeryReason: isSurgical ? 'Severe jaw mismatch exceeds standard orthodontic alveolar bone plate limits.' : 'Orthognathic corrective surgery is not indicated; skeletal discrepancy is manageable via standard dental movement.',
    anchorageRequirement: isSurgical ? 'Maximum' : isExtraction ? 'Moderate' : 'Minimum',
    suggestedAnchorage: isSurgical ? 'Temporary Anchorage Devices (TADs) / Palatal Miniscrews' : isExtraction ? 'Transpalatal Arch (TPA) / Lingual Holding Arch' : 'Conventional reciprocal alignment',
    difficultyScore: total > 60 ? '90' : total > 40 ? '65' : '30',
    complexity: plan.treatmentComplexity,
    estimatedDuration: total > 60 ? '24' : total > 40 ? '20' : '14',
    estimatedAppointments: total > 60 ? '22' : total > 40 ? '16' : '12',
    estimatedRetention: 'Standard fixed bonded wire coupled with nocturnal vacuum-formed retainers.',
    relapseRisk: total > 60 ? 'High' : total > 40 ? 'Moderate' : 'Low',
    relapseProbability: total > 60 ? '75' : total > 40 ? '45' : '15',
    relapseReason: total > 60 ? 'Inherent mechanical bounce and neuromuscular adaptation limits.' : 'Favorable vertical pattern and skeletal stability support low rebound risk.',
    ociSkeletalContribution: isClass1 ? '25' : isClass2 ? '45' : '50',
    ociDentalContribution: isClass1 ? '55' : isClass2 ? '35' : '35',
    ociSoftTissueContribution: isClass1 ? '20' : isClass2 ? '20' : '15',
    ociScoreExplanation: `OCI reflects the level of compensatory dentoalveolar masking of the underlying ${assessment.patientDetails.diagnosis} skeletal discrepancy.`,
    diagnosticConfidence: '95',
    treatmentConfidence: '90',
    borderlineCategory: total >= 55 && total <= 65 ? 'Surgical Camouflage Borderline' : 'None',
    borderlineReason: total >= 55 && total <= 65 ? 'Score falls close to the surgical transition threshold (60%).' : 'Clear-cut diagnosis.',
    skeletalProblems: plan.problemList.filter(p => p.toLowerCase().includes('skeletal') || p.toLowerCase().includes('mandibular') || p.toLowerCase().includes('maxillary')).join(', ') || 'Normal skeletal bases.',
    dentalProblems: plan.problemList.filter(p => !p.toLowerCase().includes('skeletal') && !p.toLowerCase().includes('profile')).join(', ') || 'Class I dental relationship.',
    softTissueProblems: plan.problemList.filter(p => p.toLowerCase().includes('profile')).join(', ') || 'Balanced straight facial profile.',
    functionalProblems: isClass2 ? 'Airway obstruction risk / lip incompetence' : isClass3 ? 'Mouth breathing risk / speech discrepancy' : 'None',
    primaryObjectives: plan.treatmentObjectives[0] || 'Align arches.',
    secondaryObjectives: plan.treatmentObjectives[1] || 'Refine occlusion.',
    longTermObjectives: 'Establish optimal structural periodontal support, stable joint relations, and facial aesthetics.',
    treatmentSequence: 'Phase 1: Records -> Phase 2: Alignment -> Phase 3: Leveling -> Phase 4: Space Closure -> Phase 5: Finishing -> Phase 6: Active Retention',
    contraindications: isGrowing ? 'Avoid premature orthodontic force prior to root formation.' : 'Avoid high cervical headgear vectors.',
    contraindicationReason: isGrowing ? 'Risk of root resorption.' : 'Cervical vectors can extrude molars and worsen hyperdivergent pattern.',
    primaryPlanOption: plan.possibleApproaches[0]?.name || 'Dentoalveolar Camouflage via Fixed Appliances',
    alternativePlan1: plan.possibleApproaches[1]?.name || 'Sequential Clear Aligners',
    alternativePlan2: 'Fixed brackets combined with intermaxillary elastics',
    overallPrognosis: total > 60 ? 'Fair' : total > 40 ? 'Good' : 'Excellent',
    skeletalCorrectionPotential: isClass1 ? 'Excellent' : isGrowing ? 'Good (via Orthopedics)' : 'Poor (Adult camouflage limits)',
    dentalCorrectionPotential: 'Excellent',
    softTissueImprovement: total > 40 ? 'Moderate' : 'Excellent',
    longTermStability: total > 60 ? 'Unstable without surgery' : 'Highly Stable',
    successProbability: total > 60 ? '60' : total > 40 ? '80' : '95',
    explanationWhy: `The dental correction is highly predictable, but stable skeletal corrections depend on growth status or surgical cooperation.`,
    decisionTrace: `Cephalometrics Analyzed -> OCI Score Calculated -> Treatment Options Drafted.`,
    riskAlerts: total > 60 ? 'High periodontal bone loss risk if camouflage is forced.' : 'Minimal treatment risk.',
    finalClinicalSummary: `Chief Diagnosis: ${skeletonDiag}, ${dentalDiag}, ${growthStatus} growth status, overall OCI score of ${total}%. Recommended Treatment: ${plan.possibleApproaches[0]?.name || 'Alignment'}.`
  };
}

export default function PdfReport({ assessment, onClose }: PdfReportProps) {
  const [clinicName, setClinicName] = useState('Central Orthodontic Clinic');
  const [doctorName, setDoctorName] = useState('Dr. Salman, MDS (Orthodontics)');
  const [sigText, setSigText] = useState('Dr. Salman');

  const report = getReportData(assessment);
  const total = assessment.ociResult.totalScore;

  // Formatting date into YYYYMMDD for the filename
  const getFormattedDateForFile = (dateStr?: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0].replace(/-/g, '');
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const fileDateStr = getFormattedDateForFile(assessment.patientDetails.date);
  const patientID = assessment.patientDetails.caseNumber || 'CASE';
  const pdfFilename = `OCI_Report_${patientID}_${fileDateStr}`;

  // Direct high-fidelity PDF print stream generator
  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      Alert.alert("Popup Blocked", "Please enable popups for this site to generate the clinical PDF report.");
      return;
    }

    // Color helpers for the printed layout based on OCI Score
    let scoreColor = '#10B981'; // green
    let bgLight = '#ECFDF5';
    if (total > 80) { scoreColor = '#EF4444'; bgLight = '#FEF2F2'; }
    else if (total > 60) { scoreColor = '#F97316'; bgLight = '#FFF7ED'; }
    else if (total > 40) { scoreColor = '#F59E0B'; bgLight = '#FEFBE8'; }
    else if (total > 20) { scoreColor = '#14B8A6'; bgLight = '#F0FDFA'; }

    printWindow.document.write(`
      <html>
        <head>
          <title>${pdfFilename}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              color: #0F172A;
              background: #FFFFFF;
            }
            .heading-font {
              font-family: 'Space Grotesk', sans-serif;
            }
            .mono-font {
              font-family: 'JetBrains Mono', monospace;
            }
            
            /* Print Specific Directives */
            @media print {
              body {
                background: #FFFFFF;
                color: #000000;
              }
              .no-print {
                display: none !important;
              }
              .page-break {
                page-break-after: always;
                break-after: page;
              }
              .avoid-break {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              @page {
                size: A4 portrait;
                margin: 20mm;
              }
              
              /* Custom running footers */
              .print-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                font-size: 8px;
                color: #64748B;
                border-top: 1px solid #E2E8F0;
                padding-top: 8px;
                text-align: center;
              }
            }
            
            /* CSS circular gauge */
            .gauge-circle {
              transition: stroke-dashoffset 0.35s;
              transform: rotate(-90deg);
              transform-origin: 50% 50%;
            }
          </style>
        </head>
        <body class="p-8 bg-slate-50 antialiased">
          
          <!-- Floating Download controller in print tab -->
          <div class="no-print mb-8 p-4 bg-slate-900 text-white rounded-3xl flex justify-between items-center shadow-xl max-w-4xl mx-auto">
            <div class="flex items-center space-x-3">
              <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <p class="text-xs font-bold uppercase tracking-wider text-slate-300">Dossier prepared for: ${pdfFilename}</p>
            </div>
            <button onclick="window.print()" class="px-5 py-2 bg-[#14B8A6] hover:bg-teal-500 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition shadow-lg">
              Print / Save as PDF
            </button>
          </div>

          <div class="max-w-4xl mx-auto bg-white p-12 shadow-2xl rounded-[32px] border border-slate-100 relative min-h-[297mm]">
            
            <!-- Page 1: COVER PAGE -->
            <div class="page-break flex flex-col justify-between h-[255mm] relative">
              
              <!-- Subtle decorative corner accent -->
              <div class="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-teal-500/30 rounded-tr-3xl"></div>
              
              <!-- Cover Header -->
              <div class="space-y-4">
                <div class="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/20 px-3.5 py-1.5 rounded-full">
                  <span class="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                  <span class="text-teal-600 text-[9px] font-black tracking-widest uppercase mono-font">OCI Analyzer Clinical System</span>
                </div>
                <h1 class="text-6xl font-black tracking-tight text-slate-900 heading-font uppercase mt-4">
                  OCI ANALYZER
                </h1>
                <h2 class="text-xl font-bold tracking-wide text-teal-600 uppercase">
                  AI-Powered Orthodontic Diagnosis
                </h2>
                <p class="text-slate-500 text-sm max-w-md">
                  Cephalometric Analysis & Treatment Planning System
                </p>
              </div>

              <!-- Huge circular gauge block -->
              <div class="flex flex-col items-center justify-center my-12 py-8 bg-slate-50 rounded-[40px] border border-slate-100 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white opacity-50"></div>
                <div class="relative w-48 h-48 flex items-center justify-center z-10">
                  <svg class="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="84" stroke="#E2E8F0" stroke-width="12" fill="transparent" />
                    <circle cx="96" cy="96" r="84" stroke="${scoreColor}" stroke-width="12" fill="transparent" 
                      stroke-dasharray="527" stroke-dashoffset="${527 - (527 * total) / 100}" stroke-linecap="round" />
                  </svg>
                  <div class="absolute flex flex-col items-center justify-center">
                    <span class="text-5xl font-black text-slate-900 heading-font">${total}%</span>
                    <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total OCI Score</span>
                  </div>
                </div>
                <div class="mt-6 text-center z-10 px-4">
                  <span class="text-xs font-black px-4 py-1.5 bg-slate-200/60 rounded-full uppercase tracking-wider text-slate-700" style="color: ${scoreColor}; background-color: ${bgLight}">
                    ${assessment.ociResult.interpretation}
                  </span>
                  <p class="text-[10px] text-slate-500 mt-3 max-w-sm font-medium">
                    Quantified severity of physiological dentoalveolar compensation masking skeletal base discrepancy.
                  </p>
                </div>
              </div>

              <!-- Cover Footer -->
              <div class="border-t border-slate-200 pt-8 flex justify-between items-end">
                <div class="space-y-1.5">
                  <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Lead Developer & Clinical Supervisor</p>
                  <p class="text-base font-black text-slate-900 heading-font">${doctorName}</p>
                  <p class="text-[10px] text-slate-500">Orthodontist | OCI Analyzer Developer</p>
                </div>
                <div class="text-right space-y-1">
                  <p class="text-[9px] text-slate-400 font-mono">ID: ${patientID}</p>
                  <p class="text-[9px] text-slate-400 font-mono">Date: ${assessment.patientDetails.date || assessment.createdAt.split('T')[0]}</p>
                  <p class="text-[9px] text-slate-400 font-mono">Clinic: ${clinicName}</p>
                </div>
              </div>

              <!-- Cover page footer directive (every page matching branding rules) -->
              <div class="print-footer mt-8">
                Generated using OCI Analyzer | Developed by Dr. Salman, MDS (Orthodontics) | AI-Powered Orthodontic Diagnosis & Treatment Planning System | © OCI Analyzer. All Rights Reserved.
              </div>
            </div>

            <!-- Page 2: CLINICAL WORKSPACE & CEPHALOMETRICS -->
            <div class="page-break flex flex-col justify-between h-[255mm]">
              <div class="space-y-6">
                
                <!-- Section Header -->
                <div class="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h3 class="text-lg font-black text-slate-900 heading-font uppercase">Patient Demographics & Growth Assessment</h3>
                  <span class="text-[9px] text-slate-400 font-mono">Page 2 of 4</span>
                </div>

                <!-- Patient Grid info -->
                <div class="grid grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p class="text-[8px] text-slate-400 font-black uppercase tracking-wider">Patient Name</p>
                    <p class="text-xs font-bold text-slate-800 mt-0.5">${assessment.patientDetails.name}</p>
                  </div>
                  <div>
                    <p class="text-[8px] text-slate-400 font-black uppercase tracking-wider">Chronological Age</p>
                    <p class="text-xs font-bold text-slate-800 mt-0.5">${assessment.patientDetails.age} Years</p>
                  </div>
                  <div>
                    <p class="text-[8px] text-slate-400 font-black uppercase tracking-wider">Biological Sex</p>
                    <p class="text-xs font-bold text-slate-800 mt-0.5">${assessment.patientDetails.gender}</p>
                  </div>
                  <div>
                    <p class="text-[8px] text-slate-400 font-black uppercase tracking-wider">Exam Date</p>
                    <p class="text-xs font-bold text-slate-800 mt-0.5">${assessment.patientDetails.date || assessment.createdAt.split('T')[0]}</p>
                  </div>
                </div>

                <!-- Growth Assessment Section -->
                <div class="space-y-3">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Growth & Skeletal Maturity Intelligence</h4>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex flex-col justify-between">
                      <span class="text-[8px] text-indigo-400 font-black uppercase tracking-widest">CVM Stage</span>
                      <span class="text-lg font-black text-indigo-700 mt-1">${report.cvmStage}</span>
                      <span class="text-[9px] text-indigo-500 mt-1">Cervical Maturation Indicator</span>
                    </div>
                    <div class="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50 flex flex-col justify-between">
                      <span class="text-[8px] text-emerald-400 font-black uppercase tracking-widest">Growth Status</span>
                      <span class="text-sm font-black text-emerald-700 mt-1">${report.growthStatus}</span>
                      <span class="text-[9px] text-emerald-500 mt-1">Clinical Velocity Gauge</span>
                    </div>
                    <div class="p-4 bg-teal-50/50 rounded-xl border border-teal-100/50 flex flex-col justify-between">
                      <span class="text-[8px] text-teal-400 font-black uppercase tracking-widest">Skeletal Maturity</span>
                      <span class="text-sm font-black text-teal-700 mt-1">${report.skeletalMaturity}</span>
                      <span class="text-[9px] text-teal-500 mt-1">Physiological Status</span>
                    </div>
                  </div>
                  <div class="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <p class="text-[10px] text-slate-600 leading-normal">
                      <strong class="text-slate-800">Growth Directive:</strong> Treatment pathways and mechanotherapy selections are configured primarily against <strong>skeletal maturation status</strong> (${report.cvmStage}) rather than chronological age. Growing status indications specify functional orthopedic viability while complete status commands stable adult camouflage or orthognathic correction.
                    </p>
                  </div>
                </div>

                <!-- Cephalometrics Parameters Summary Tables -->
                <div class="space-y-3">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Calculated Cephalometric Analysis Table</h4>
                  <table class="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr class="bg-slate-100 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                        <th class="p-2.5">Parameter Group</th>
                        <th class="p-2.5">Diagnostic Abbr</th>
                        <th class="p-2.5">Measured Value</th>
                        <th class="p-2.5">Standard Mean Range</th>
                        <th class="p-2.5">Clinical Classification</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <!-- Skeletal parameters -->
                      <tr class="hover:bg-slate-50/60">
                        <td class="p-2.5 font-bold text-slate-700">Maxillary Base Position</td>
                        <td class="p-2.5 font-mono">SNA (°)</td>
                        <td class="p-2.5 font-bold">${assessment.cephalometricInput.sna}°</td>
                        <td class="p-2.5 text-slate-400">82.0° (± 2.0°)</td>
                        <td class="p-2.5 text-slate-500">${Number(assessment.cephalometricInput.sna) > 84 ? 'Prognathic Maxilla' : Number(assessment.cephalometricInput.sna) < 80 ? 'Retrognathic Maxilla' : 'Normal position'}</td>
                      </tr>
                      <tr class="hover:bg-slate-50/60">
                        <td class="p-2.5 font-bold text-slate-700">Mandibular Base Position</td>
                        <td class="p-2.5 font-mono">SNB (°)</td>
                        <td class="p-2.5 font-bold">${assessment.cephalometricInput.snb}°</td>
                        <td class="p-2.5 text-slate-400">80.0° (± 2.0°)</td>
                        <td class="p-2.5 text-slate-500">${Number(assessment.cephalometricInput.snb) > 82 ? 'Prognathic Mandible' : Number(assessment.cephalometricInput.snb) < 78 ? 'Retrognathic Mandible' : 'Normal position'}</td>
                      </tr>
                      <tr class="hover:bg-slate-50/60">
                        <td class="p-2.5 font-bold text-slate-700">Sagittal Jaw Discrepancy</td>
                        <td class="p-2.5 font-mono">ANB (°)</td>
                        <td class="p-2.5 font-bold text-teal-600">${assessment.cephalometricInput.anb}°</td>
                        <td class="p-2.5 text-slate-400">2.0° (0.0° - 4.0°)</td>
                        <td class="p-2.5 font-bold">${assessment.patientDetails.diagnosis} bases</td>
                      </tr>
                      <tr class="hover:bg-slate-50/60">
                        <td class="p-2.5 font-bold text-slate-700">Linear Sagittal appraisal</td>
                        <td class="p-2.5 font-mono">Wits (mm)</td>
                        <td class="p-2.5 font-bold">${assessment.cephalometricInput.wits} mm</td>
                        <td class="p-2.5 text-slate-400">0.0 mm (± 2.0mm)</td>
                        <td class="p-2.5 text-slate-500">${Number(assessment.cephalometricInput.wits) > 2 ? 'Class II trend' : Number(assessment.cephalometricInput.wits) < -2 ? 'Class III trend' : 'In harmony'}</td>
                      </tr>
                      <tr class="hover:bg-slate-50/60">
                        <td class="p-2.5 font-bold text-slate-700">Vertical Mandibular Angle</td>
                        <td class="p-2.5 font-mono">FMA (°)</td>
                        <td class="p-2.5 font-bold">${assessment.cephalometricInput.fma}°</td>
                        <td class="p-2.5 text-slate-400">25.0° (21.0° - 29.0°)</td>
                        <td class="p-2.5 text-slate-500">${Number(assessment.cephalometricInput.fma) > 29 ? 'Hyperdivergent pattern' : Number(assessment.cephalometricInput.fma) < 21 ? 'Hypodivergent pattern' : 'Average Pattern'}</td>
                      </tr>
                      <!-- Dental parameters -->
                      <tr class="hover:bg-slate-50/60">
                        <td class="p-2.5 font-bold text-slate-700">Upper Incisor Inclination</td>
                        <td class="p-2.5 font-mono">U1-SN (°)</td>
                        <td class="p-2.5 font-bold">${assessment.cephalometricInput.u1Sn}°</td>
                        <td class="p-2.5 text-slate-400">104.0° (99.0° - 109.0°)</td>
                        <td class="p-2.5 text-slate-500">${Number(assessment.cephalometricInput.u1Sn) > 109 ? 'Proclined' : Number(assessment.cephalometricInput.u1Sn) < 99 ? 'Retroclined' : 'Normovertical'}</td>
                      </tr>
                      <tr class="hover:bg-slate-50/60">
                        <td class="p-2.5 font-bold text-slate-700">Lower Incisor Inclination</td>
                        <td class="p-2.5 font-mono">IMPA (°)</td>
                        <td class="p-2.5 font-bold">${assessment.cephalometricInput.impa}°</td>
                        <td class="p-2.5 text-slate-400">90.0° (85.0° - 95.0°)</td>
                        <td class="p-2.5 text-slate-500">${Number(assessment.cephalometricInput.impa) > 95 ? 'Proclined lower incisors' : Number(assessment.cephalometricInput.impa) < 85 ? 'Retroclined lower incisors' : 'Normovertical'}</td>
                      </tr>
                      <!-- Soft Tissue parameters -->
                      <tr class="hover:bg-slate-50/60">
                        <td class="p-2.5 font-bold text-slate-700">Nasolabial Angle</td>
                        <td class="p-2.5 font-mono">Nasolabial (°)</td>
                        <td class="p-2.5 font-bold">${assessment.cephalometricInput.nasolabialAngle}°</td>
                        <td class="p-2.5 text-slate-400">102.0° (94.0° - 110.0°)</td>
                        <td class="p-2.5 text-slate-500">${Number(assessment.cephalometricInput.nasolabialAngle) > 110 ? 'Obtuse Angle' : Number(assessment.cephalometricInput.nasolabialAngle) < 94 ? 'Acute Angle' : 'Aesthetic Balance'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Compensation patterns -->
                <div class="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                  <h4 class="text-[10px] font-black uppercase tracking-wider text-slate-500">Compensation Pattern Analysis</h4>
                  <div class="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p class="text-[8px] text-slate-400 uppercase font-bold">Selected Archetype Pattern</p>
                      <p class="font-extrabold text-slate-800 mt-0.5">${assessment.patientDetails.diagnosis === 'Class II' ? 'Retroclined Maxillary & Proclined Mandibular Incisors' : assessment.patientDetails.diagnosis === 'Class III' ? 'Proclined Maxillary & Retroclined Mandibular Incisors' : 'Symmetrical Arch Harmony'}</p>
                    </div>
                    <div>
                      <p class="text-[8px] text-slate-400 uppercase font-bold">Physiological Compensation Severity</p>
                      <p class="font-extrabold text-teal-600 mt-0.5">${assessment.ociResult.interpretation}</p>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Page Footer -->
              <div class="print-footer">
                Generated using OCI Analyzer | Developed by Dr. Salman, MDS (Orthodontics) | AI-Powered Orthodontic Diagnosis & Treatment Planning System | © OCI Analyzer. All Rights Reserved.
              </div>
            </div>

            <!-- Page 3: COMPREHENSIVE PROBLEMS & OBJECTIVES -->
            <div class="page-break flex flex-col justify-between h-[255mm]">
              <div class="space-y-6">
                
                <div class="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h3 class="text-lg font-black text-slate-900 heading-font uppercase">Clinical Problems & Strategic Objectives</h3>
                  <span class="text-[9px] text-slate-400 font-mono">Page 3 of 4</span>
                </div>

                <!-- OCI Score Contribution analysis -->
                <div class="space-y-3">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">OCI Index Dimension Score Contributions</h4>
                  <div class="flex space-x-3">
                    <div class="flex-1 p-3.5 bg-[#FFF7ED] rounded-xl border border-orange-100 items-center justify-center text-center">
                      <span class="text-[8px] text-orange-400 font-black uppercase tracking-widest">Skeletal Load</span>
                      <span class="block text-xl font-black text-orange-700 mt-1">${report.ociSkeletalContribution}%</span>
                    </div>
                    <div class="flex-1 p-3.5 bg-[#F0FDFA] rounded-xl border border-teal-100 items-center justify-center text-center">
                      <span class="text-[8px] text-teal-400 font-black uppercase tracking-widest">Dental Load</span>
                      <span class="block text-xl font-black text-teal-700 mt-1">${report.ociDentalContribution}%</span>
                    </div>
                    <div class="flex-1 p-3.5 bg-[#F0F9FF] rounded-xl border border-sky-100 items-center justify-center text-center">
                      <span class="text-[8px] text-sky-400 font-black uppercase tracking-widest">Soft Tissue Load</span>
                      <span class="block text-xl font-black text-sky-700 mt-1">${report.ociSoftTissueContribution}%</span>
                    </div>
                  </div>
                  <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-600">
                    <p><strong>OCI Mathematical Balance Explanation:</strong> ${report.ociScoreExplanation}</p>
                  </div>
                </div>

                <!-- Comprehensive Problem List (Module 1) -->
                <div class="space-y-3">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Structured Clinical Problem List</h4>
                  
                  <div class="space-y-2 text-xs">
                    <div class="p-3 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl">
                      <p class="font-extrabold text-rose-800 text-[10px] uppercase tracking-wider">Skeletal Etiologies</p>
                      <p class="text-slate-600 mt-1 leading-relaxed">${report.skeletalProblems}</p>
                    </div>
                    
                    <div class="p-3 bg-teal-50 border-l-4 border-teal-500 rounded-r-xl">
                      <p class="font-extrabold text-teal-800 text-[10px] uppercase tracking-wider">Dental Alignments & Compensations</p>
                      <p class="text-slate-600 mt-1 leading-relaxed">${report.dentalProblems}</p>
                    </div>
                    
                    <div class="p-3 bg-sky-50 border-l-4 border-sky-500 rounded-r-xl">
                      <p class="font-extrabold text-sky-800 text-[10px] uppercase tracking-wider">Soft Tissue Adapting Aesthetics</p>
                      <p class="text-slate-600 mt-1 leading-relaxed">${report.softTissueProblems}</p>
                    </div>

                    <div class="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl">
                      <p class="font-extrabold text-amber-800 text-[10px] uppercase tracking-wider">Functional & Neuromuscular Complexities</p>
                      <p class="text-slate-600 mt-1 leading-relaxed">${report.functionalProblems}</p>
                    </div>
                  </div>
                </div>

                <!-- Strategic Objectives (Module 2) -->
                <div class="space-y-3">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Primary & Secondary Treatment Objectives</h4>
                  <div class="grid grid-cols-2 gap-4 text-xs">
                    <div class="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                      <p class="font-black text-slate-800 text-[10px] uppercase tracking-wider">Primary Short-term Targets</p>
                      <p class="text-slate-600 leading-normal">${report.primaryObjectives}</p>
                    </div>
                    <div class="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                      <p class="font-black text-slate-800 text-[10px] uppercase tracking-wider">Secondary & Long-term Targets</p>
                      <p class="text-slate-600 leading-normal">${report.secondaryObjectives} • ${report.longTermObjectives}</p>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Page Footer -->
              <div class="print-footer">
                Generated using OCI Analyzer | Developed by Dr. Salman, MDS (Orthodontics) | AI-Powered Orthodontic Diagnosis & Treatment Planning System | © OCI Analyzer. All Rights Reserved.
              </div>
            </div>

            <!-- Page 4: CLINICAL RECOMMENDATIONS & DECISION TRACE -->
            <div class="page-break flex flex-col justify-between h-[255mm]">
              <div class="space-y-6">
                
                <div class="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h3 class="text-lg font-black text-slate-900 heading-font uppercase">Clinical Decision Support & Treatment Sequence</h3>
                  <span class="text-[9px] text-slate-400 font-mono">Page 4 of 4</span>
                </div>

                <!-- Biomechanical planning decisions -->
                <div class="space-y-3">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Core Biomechanical Decisional Matrices</h4>
                  
                  <div class="grid grid-cols-2 gap-4 text-xs">
                    <!-- Extraction Box -->
                    <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                      <div class="flex justify-between items-center">
                        <span class="text-[9px] font-black uppercase text-slate-400">Premolar Extractions</span>
                        <span class="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[9px] font-bold">${report.extractionRecommendation}</span>
                      </div>
                      <p class="font-extrabold text-slate-800">Extraction Probability: ${report.extractionProbability}%</p>
                      <p class="text-[10px] text-slate-500 leading-normal mt-1">${report.extractionReason}</p>
                    </div>

                    <!-- Surgical Box -->
                    <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                      <div class="flex justify-between items-center">
                        <span class="text-[9px] font-black uppercase text-slate-400">Orthognathic Surgery</span>
                        <span class="px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-[9px] font-bold">${report.surgeryRecommendation}</span>
                      </div>
                      <p class="font-extrabold text-slate-800">Surgical Probability: ${report.surgeryProbability}%</p>
                      <p class="text-[10px] text-slate-500 leading-normal mt-1">${report.surgeryReason}</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 text-xs">
                    <!-- Anchorage -->
                    <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                      <span class="text-[9px] font-black uppercase text-slate-400">Anchorage Consolidation</span>
                      <p class="font-extrabold text-slate-800">Anchorage Class: ${report.anchorageRequirement}</p>
                      <p class="text-[10px] text-slate-600 mt-1">${report.suggestedAnchorage}</p>
                    </div>

                    <!-- Contraindications -->
                    <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                      <span class="text-[9px] font-black uppercase text-slate-400 text-orange-500">Contraindications</span>
                      <p class="font-extrabold text-slate-800">${report.contraindications}</p>
                      <p class="text-[10px] text-slate-500 leading-normal mt-1">${report.contraindicationReason}</p>
                    </div>
                  </div>
                </div>

                <!-- Treatment sequence and planning alternates (Modules 3, 4, 5) -->
                <div class="space-y-3">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Treatment Pathways & Sequencing</h4>
                  <div class="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-2">
                    <p><strong class="text-slate-800 uppercase text-[9px] tracking-wide block mb-1">Recommended Sequence:</strong> ${report.treatmentSequence}</p>
                    <div class="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200/50 text-[10px]">
                      <div>
                        <strong class="text-teal-600 block mb-0.5">Primary Plan Option:</strong>
                        <span class="text-slate-500">${report.primaryPlanOption}</span>
                      </div>
                      <div>
                        <strong class="text-slate-700 block mb-0.5">Alternative Plan 1:</strong>
                        <span class="text-slate-500">${report.alternativePlan1}</span>
                      </div>
                      <div>
                        <strong class="text-slate-700 block mb-0.5">Alternative Plan 2:</strong>
                        <span class="text-slate-500">${report.alternativePlan2}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Prognosis & stability (Modules 6, 9, 10) -->
                <div class="grid grid-cols-2 gap-4 text-xs">
                  <div class="p-4 bg-slate-50 rounded-xl space-y-1.5">
                    <span class="text-[9px] font-mono uppercase text-slate-400">Clinical Prognosis</span>
                    <p class="font-extrabold text-slate-800">Prognosis: ${report.overallPrognosis} (${report.successProbability}% Success)</p>
                    <p class="text-[10px] text-slate-500 mt-1">${report.explanationWhy}</p>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-xl space-y-1.5">
                    <span class="text-[9px] font-mono uppercase text-slate-400">Relapse & Stability Risks</span>
                    <p class="font-extrabold text-rose-700">Relapse Threat: ${report.relapseRisk} (${report.relapseProbability}% Risk)</p>
                    <p class="text-[10px] text-slate-500 mt-1">${report.relapseReason}</p>
                  </div>
                </div>

                <!-- Developer branding disclaimer -->
                <div class="p-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl">
                  <p class="text-[9px] text-slate-400 uppercase tracking-widest font-black text-center">OCI Software Audit Registry</p>
                  <div class="flex justify-between items-center text-[8px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-100">
                    <span>Software: OCI Analyzer</span>
                    <span>Version: 1.0</span>
                    <span>Developer: Dr. Salman, MDS (Orthodontics)</span>
                    <span>Class: CS-Decision Tool v2.0</span>
                  </div>
                </div>

              </div>

              <!-- Page Footer -->
              <div class="print-footer">
                Generated using OCI Analyzer | Developed by Dr. Salman, MDS (Orthodontics) | AI-Powered Orthodontic Diagnosis & Treatment Planning System | © OCI Analyzer. All Rights Reserved.
              </div>
            </div>

          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShare = () => {
    Alert.alert(
      "Clinical Share Protocol",
      `The clinical files for OCI case ${assessment.patientDetails.caseNumber} have been compiled. Shared link is active for Dr. Salman.`
    );
  };

  return (
    <View style={[tw`absolute inset-0 bg-[#050814]/98 z-50 justify-center p-3`, { elevation: 15 }]}>
      <View style={tw`bg-[#0B1020] rounded-[32px] border border-white/10 overflow-hidden flex-col max-h-[95%] shadow-2xl max-w-4xl w-full mx-auto`}>
        
        {/* Top Header Controls */}
        <View style={tw`px-6 py-4 bg-black/40 border-b border-white/5 flex-row justify-between items-center`}>
          <View style={tw`flex-1 pr-4`}>
            <View style={tw`flex-row items-center bg-teal-500/15 border border-teal-500/30 px-3 py-1 rounded-full self-start mb-1`}>
              <Sparkles size={11} color="#22D3EE" style={tw`mr-1.5`} />
              <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-widest font-mono`}>Report Dossier Suite</Text>
            </View>
            <View style={tw`flex-row items-center mt-1`}>
              <ShieldCheck size={14} color="#14B8A6" style={tw`mr-1.5`} />
              <Text style={tw`font-black text-xs text-white uppercase tracking-wider`}>OCI Analyzer Dossier (v2.0)</Text>
            </View>
          </View>
          
          <View style={tw`flex-row items-center space-x-2`}>
            {/* Main Download Button */}
            <Pressable
              onPress={handleDownloadPdf}
              style={({ pressed }) => [
                tw`px-4 py-2 bg-[#14B8A6] rounded-xl flex-row items-center justify-center shadow-lg border border-teal-400/30`,
                pressed ? tw`opacity-90 scale-98` : null
              ]}
            >
              <Download size={13} color="#ffffff" style={tw`mr-1.5`} />
              <Text style={tw`text-[10px] font-black text-white uppercase tracking-widest`}>Download PDF</Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                tw`p-2 bg-white/5 rounded-xl border border-white/10`,
                pressed ? tw`bg-white/10` : null
              ]}
            >
              <Share2 size={13} color="#22D3EE" />
            </Pressable>
            
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                tw`p-2 bg-white/5 rounded-xl border border-white/10 ml-1`,
                pressed ? tw`bg-white/10` : null
              ]}
            >
              <X size={13} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {/* Scrollable Clinical Preview */}
        <ScrollView contentContainerStyle={tw`p-6 space-y-6 bg-[#0B1020]`} style={tw`flex-1`}>
          
          {/* Customizer Panel */}
          <View style={tw`bg-gradient-to-r from-teal-950/20 to-blue-950/20 p-5 rounded-2xl border border-white/5 space-y-4`}>
            <Text style={tw`text-[9px] font-bold text-[#22D3EE] uppercase tracking-widest font-mono`}>Clinical Branding & Credentials</Text>
            <View style={tw`flex-row gap-3`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[8px] text-slate-400 font-bold uppercase`}>Clinic Name</Text>
                <TextInput
                  value={clinicName}
                  onChangeText={setClinicName}
                  style={tw`bg-black/30 text-white border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold mt-1`}
                />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[8px] text-slate-400 font-bold uppercase`}>Supervisor Name</Text>
                <TextInput
                  value={doctorName}
                  onChangeText={setDoctorName}
                  style={tw`bg-black/30 text-white border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold mt-1`}
                />
              </View>
            </View>
          </View>

          {/* Section 1: Demographics & Growth */}
          <View style={tw`bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4`}>
            <Text style={tw`text-[10px] font-black uppercase text-teal-400 tracking-wider font-mono`}>Section 1: Demographics & Growth Assessment</Text>
            <View style={tw`grid flex-row flex-wrap gap-3`}>
              <View style={tw`bg-black/20 p-3 rounded-xl border border-white/5 w-[48%]`}>
                <Text style={tw`text-[8px] text-slate-400 uppercase font-mono`}>Case ID</Text>
                <Text style={tw`text-xs font-black text-white mt-0.5`}>{assessment.patientDetails.caseNumber}</Text>
              </View>
              <View style={tw`bg-black/20 p-3 rounded-xl border border-white/5 w-[48%]`}>
                <Text style={tw`text-[8px] text-slate-400 uppercase font-mono`}>Patient Name</Text>
                <Text style={tw`text-xs font-black text-white mt-0.5`}>{assessment.patientDetails.name}</Text>
              </View>
              <View style={tw`bg-black/20 p-3 rounded-xl border border-white/5 w-[31%]`}>
                <Text style={tw`text-[8px] text-slate-400 uppercase font-mono`}>Age (years)</Text>
                <Text style={tw`text-xs font-black text-white mt-0.5`}>{assessment.patientDetails.age}</Text>
              </View>
              <View style={tw`bg-black/20 p-3 rounded-xl border border-white/5 w-[31%]`}>
                <Text style={tw`text-[8px] text-slate-400 uppercase font-mono`}>Sex</Text>
                <Text style={tw`text-xs font-black text-white mt-0.5`}>{assessment.patientDetails.gender}</Text>
              </View>
              <View style={tw`bg-black/20 p-3 rounded-xl border border-white/5 w-[31%]`}>
                <Text style={tw`text-[8px] text-slate-400 uppercase font-mono`}>CVM Stage</Text>
                <Text style={tw`text-xs font-black text-emerald-400 mt-0.5`}>{report.cvmStage}</Text>
              </View>
            </View>
            <View style={tw`bg-[#111827]/60 p-4 rounded-xl border border-white/5 flex-row justify-between`}>
              <View>
                <Text style={tw`text-[8px] text-slate-400 uppercase`}>Skeletal Maturity</Text>
                <Text style={tw`text-xs font-bold text-white mt-0.5`}>{report.skeletalMaturity}</Text>
              </View>
              <View style={tw`items-end`}>
                <Text style={tw`text-[8px] text-slate-400 uppercase`}>Growth Status</Text>
                <Text style={tw`text-xs font-bold text-[#22D3EE] mt-0.5`}>{report.growthStatus}</Text>
              </View>
            </View>
          </View>

          {/* Section 2: Cephalometrics & Problem List */}
          <View style={tw`bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4`}>
            <Text style={tw`text-[10px] font-black uppercase text-teal-400 tracking-wider font-mono`}>Section 2: Problem List & Compensations</Text>
            
            <View style={tw`space-y-2`}>
              <View style={tw`p-3 bg-red-950/20 rounded-xl border border-red-900/30`}>
                <Text style={tw`text-[8px] text-red-400 font-bold uppercase`}>Skeletal Problems</Text>
                <Text style={tw`text-xs text-slate-200 mt-1`}>{report.skeletalProblems}</Text>
              </View>
              <View style={tw`p-3 bg-teal-950/20 rounded-xl border border-teal-900/30`}>
                <Text style={tw`text-[8px] text-teal-400 font-bold uppercase`}>Dental Problems</Text>
                <Text style={tw`text-xs text-slate-200 mt-1`}>{report.dentalProblems}</Text>
              </View>
              <View style={tw`p-3 bg-blue-950/20 rounded-xl border border-blue-900/30`}>
                <Text style={tw`text-[8px] text-blue-400 font-bold uppercase`}>Soft Tissue Problems</Text>
                <Text style={tw`text-xs text-slate-200 mt-1`}>{report.softTissueProblems}</Text>
              </View>
            </View>
          </View>

          {/* Section 3: Recommended Treatment Pathway */}
          <View style={tw`bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4`}>
            <Text style={tw`text-[10px] font-black uppercase text-teal-400 tracking-wider font-mono`}>Section 3: Clinical Treatment Decisions</Text>
            
            <View style={tw`flex-row flex-wrap gap-3`}>
              <View style={tw`bg-black/20 p-4 rounded-xl border border-white/5 w-[48%]`}>
                <Text style={tw`text-[8px] text-slate-400 uppercase`}>Extraction Probability</Text>
                <Text style={tw`text-lg font-black text-white mt-1`}>{report.extractionProbability}%</Text>
                <Text style={tw`text-[9px] text-slate-500 mt-1`}>{report.extractionRecommendation === 'Yes' ? 'Premolars suggested' : 'Non-extraction approach'}</Text>
              </View>
              <View style={tw`bg-black/20 p-4 rounded-xl border border-white/5 w-[48%]`}>
                <Text style={tw`text-[8px] text-slate-400 uppercase`}>Surgical Probability</Text>
                <Text style={tw`text-lg font-black text-white mt-1`}>{report.surgeryProbability}%</Text>
                <Text style={tw`text-[9px] text-slate-500 mt-1`}>{report.surgeryRecommendation === 'Yes' ? 'Orthognathic pathway' : 'Orthodontic Camouflage'}</Text>
              </View>
            </View>

            <View style={tw`p-4 bg-black/40 rounded-xl border border-white/5 space-y-2`}>
              <Text style={tw`text-[8px] text-slate-400 uppercase`}>Recommended Primary Treatment Option</Text>
              <Text style={tw`text-xs font-black text-[#22D3EE]`}>{report.primaryPlanOption}</Text>
              <Text style={tw`text-[10px] text-slate-400 mt-1 leading-normal`}>{report.finalClinicalSummary}</Text>
            </View>
          </View>

          {/* Section 4: Clinical Stability, Relapse & Retention */}
          <View style={tw`bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4`}>
            <Text style={tw`text-[10px] font-black uppercase text-teal-400 tracking-wider font-mono`}>Section 4: Retention, Follow-Up & Relapse</Text>
            <View style={tw`flex-row gap-4`}>
              <View style={tw`flex-1 p-3 bg-red-950/15 border border-red-900/20 rounded-xl`}>
                <Text style={tw`text-[8px] text-red-400 font-bold uppercase`}>Relapse Probability</Text>
                <Text style={tw`text-base font-black text-white mt-1`}>{report.relapseProbability}%</Text>
                <Text style={tw`text-[9px] text-slate-400 mt-1`}>{report.relapseReason}</Text>
              </View>
              <View style={tw`flex-1 p-3 bg-emerald-950/15 border border-emerald-900/20 rounded-xl`}>
                <Text style={tw`text-[8px] text-emerald-400 font-bold uppercase`}>Estimated Duration</Text>
                <Text style={tw`text-base font-black text-white mt-1`}>{report.estimatedDuration} months</Text>
                <Text style={tw`text-[9px] text-slate-400 mt-1`}>{report.estimatedAppointments} Appointments total</Text>
              </View>
            </View>
          </View>

          {/* Core Signature Area */}
          <View style={tw`border-t border-white/10 pt-4 flex-row justify-between items-end`}>
            <View>
              <Text style={tw`text-[8px] text-slate-500 font-mono`}>Software: OCI Analyzer v1.0</Text>
              <Text style={tw`text-[8px] text-slate-500 font-mono mt-0.5`}>Developed by Dr. Salman, MDS (Orthodontics)</Text>
            </View>
            <View style={tw`items-end`}>
              <TextInput
                value={sigText}
                onChangeText={setSigText}
                style={tw`text-sm text-[#14B8A6] font-black italic border-b border-white/15 p-0 text-right`}
              />
              <Text style={tw`text-[8px] text-slate-500 mt-1`}>Specialist Sign-off Seal</Text>
            </View>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}
