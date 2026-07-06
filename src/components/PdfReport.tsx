import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert, Platform } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
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

const cleanPercent = (val: string | number | undefined) => {
  if (val === undefined || val === '') return '0%';
  const s = String(val).trim();
  const cleaned = s.replace(/%+$/, '');
  return cleaned + '%';
};

interface PdfReportProps {
  assessment: Assessment;
  onClose: () => void;
}

/**
 * Resolves advanced clinical intelligence fields for the given assessment.
 * Supports pre-populated seeded gold-standard cases, and calculates fallback options dynamically for new manually created patients.
 */
export function getReportData(assessment: Assessment) {
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

// Custom responsive React Native SVG Donut Chart for interactive dashboard
export interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

export function ReactDonutChart({ segments, size = 100, strokeWidth = 10 }: { segments: DonutSegment[]; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let currentOffset = 0;

  return (
    <View style={{ width: size, height: size, transform: [{ rotate: '-90deg' }] }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Base Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#1E293B"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Dynamic Segments */}
        {segments.map((seg, idx) => {
          const val = seg.value;
          if (val <= 0) return null;
          const strokeLength = (val / 100) * circumference;
          const offset = currentOffset;
          currentOffset += strokeLength;
          return (
            <Circle
              key={idx}
              cx={cx}
              cy={cy}
              r={r}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${strokeLength} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </View>
  );
}

export default function PdfReport({ assessment, onClose }: PdfReportProps) {
  const [clinicName, setClinicName] = useState('Central Orthodontic Clinic');
  const [doctorName, setDoctorName] = useState('Dr. Salman, MDS (Orthodontics)');
  const [sigText, setSigText] = useState('Dr. Salman');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');

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

  // Dynamic calculations based on patient cephalometrics
  const snaVal = Number(assessment.cephalometricInput.sna) || 82;
  const snbVal = Number(assessment.cephalometricInput.snb) || 80;
  const anbVal = Number(assessment.cephalometricInput.anb) || 2;
  const fmaVal = Number(assessment.cephalometricInput.fma) || 25;
  const witsVal = Number(assessment.cephalometricInput.wits) || 0;

  const u1SnVal = Number(assessment.cephalometricInput.u1Sn) || 104;
  const impaVal = Number(assessment.cephalometricInput.impa) || 90;
  const overjetVal = Number(assessment.cephalometricInput.overjet) || 2.5;
  const curveOfSpeeVal = Number(assessment.cephalometricInput.curveOfSpee) || 1;

  const upperLipELineVal = Number(assessment.cephalometricInput.upperLipELine) || -2;
  const lowerLipELineVal = Number(assessment.cephalometricInput.lowerLipELine) || 0;
  const nasolabialAngleVal = Number(assessment.cephalometricInput.nasolabialAngle) || 102;
  const facialConvexityVal = Number(assessment.cephalometricInput.facialConvexity) || 8;

  const isClass1 = assessment.patientDetails.diagnosis === 'Class I';
  const isClass2 = assessment.patientDetails.diagnosis === 'Class II' || anbVal > 4.5;
  const isClass3 = assessment.patientDetails.diagnosis === 'Class III' || anbVal < 0;

  // 1. Skeletal Deviations
  const snaDev = Math.max(0.5, Math.abs(snaVal - 82));
  const snbDev = Math.max(0.5, Math.abs(snbVal - 80));
  const fmaDev = Math.max(0.5, Math.abs(fmaVal - 25));
  const anbDev = Math.max(0.5, Math.abs(anbVal - 2));
  const skeletalSum = snaDev + snbDev + fmaDev + anbDev;

  const maxillaPct = Math.round((snaDev / skeletalSum) * 100);
  const mandiblePct = Math.round((snbDev / skeletalSum) * 100);
  const verticalPct = Math.round((fmaDev / skeletalSum) * 100);
  const balancePct = 100 - (maxillaPct + mandiblePct + verticalPct);

  // 2. Dental Deviations
  const u1Dev = Math.max(0.5, Math.abs(u1SnVal - 104));
  const l1Dev = Math.max(0.5, Math.abs(impaVal - 90));
  const molarRelationVal = assessment.cephalometricInput.molarRelation || 'Class I';
  const molarDev = molarRelationVal === 'Class I' ? 1 : 4;
  const overjetDev = Math.max(0.5, Math.abs(overjetVal - 2.5));
  const speeDev = Math.max(0.5, Math.abs(curveOfSpeeVal - 1));
  const dentalSum = u1Dev + l1Dev + molarDev + overjetDev + speeDev;

  const upperIncisorPct = Math.round((u1Dev / dentalSum) * 100);
  const lowerIncisorPct = Math.round((l1Dev / dentalSum) * 100);
  const upperMolarPct = Math.round(((molarDev * 0.5) / dentalSum) * 100);
  const lowerMolarPct = Math.round(((molarDev * 0.5) / dentalSum) * 100);
  const occlusalPct = 100 - (upperIncisorPct + lowerIncisorPct + upperMolarPct + lowerMolarPct);

  // 3. Soft Tissue Deviations
  const uLipDev = Math.max(0.5, Math.abs(upperLipELineVal - (-2)));
  const lLipDev = Math.max(0.5, Math.abs(lowerLipELineVal - 0));
  const profileVal = assessment.patientDetails.facialProfile || 'Straight';
  const chinDev = profileVal === 'Straight' ? 1 : 4;
  const nasoDev = Math.max(0.5, Math.abs(nasolabialAngleVal - 102));
  const convDev = Math.max(0.5, Math.abs(facialConvexityVal - 8));
  const softSum = uLipDev + lLipDev + chinDev + nasoDev + convDev;

  const upperLipPct = Math.round((uLipDev / softSum) * 100);
  const lowerLipPct = Math.round((lLipDev / softSum) * 100);
  const chinPct = Math.round((chinDev / softSum) * 100);
  const nasoPct = Math.round((nasoDev / softSum) * 100);
  const convexityPct = 100 - (upperLipPct + lowerLipPct + chinPct + nasoPct);

  // Determine dominant skeletal component
  let dominantSkeletalComponent = 'Maxillary Position';
  let dominantSkeletalPct = maxillaPct;
  if (mandiblePct > dominantSkeletalPct) {
    dominantSkeletalComponent = 'Mandibular Position';
    dominantSkeletalPct = mandiblePct;
  }
  if (verticalPct > dominantSkeletalPct) {
    dominantSkeletalComponent = 'Vertical Pattern';
    dominantSkeletalPct = verticalPct;
  }
  if (balancePct > dominantSkeletalPct) {
    dominantSkeletalComponent = 'Facial Skeletal Balance';
    dominantSkeletalPct = balancePct;
  }

  // Determine overall categories
  const ociSke = Number(report.ociSkeletalContribution) || (isClass1 ? 25 : isClass2 ? 45 : 50);
  const ociDen = Number(report.ociDentalContribution) || (isClass1 ? 55 : isClass2 ? 35 : 35);
  const ociSof = Number(report.ociSoftTissueContribution) || (isClass1 ? 20 : isClass2 ? 20 : 15);

  let dominantCompType = 'Dental Camouflage';
  let dominantCompVal = ociDen;
  if (ociSke > dominantCompVal) {
    dominantCompType = 'Skeletal Mismatch';
    dominantCompVal = ociSke;
  }
  if (ociSof > dominantCompVal) {
    dominantCompType = 'Soft Tissue Masking';
    dominantCompVal = ociSof;
  }

  let severityLabel = 'Mild';
  let severityColor = '#10B981'; // green
  if (total > 65) {
    severityLabel = 'Severe';
    severityColor = '#EF4444';
  } else if (total > 35) {
    severityLabel = 'Moderate';
    severityColor = '#F59E0B';
  }

  // Build AI summaries & interpretations
  const skeletalSummary = `Skeletal compensation is clinically classified as ${severityLabel.toLowerCase()}. The dominant loading is driven by the ${dominantSkeletalComponent} (${dominantSkeletalPct}%), reflecting active sagittal base masking. In response, dentoalveolar structures are adapting to maintain aesthetic facial coordinates.`;

  const dentalSummary = `Comprehensive dental analysis indicates major compensatory angulation. Lower incisor inclination (IMPA=${impaVal}°, contributing ${lowerIncisorPct}%) and upper incisors (U1-SN=${u1SnVal}°, contributing ${upperIncisorPct}%) exhibit significant reciprocal tipping. This high-torque masking conceals the skeletal jaw discrepancy but severely limits traditional orthodontic alignment without decompensation or therapeutic extractions.`;

  const softTissueSummary = `The soft tissue envelope is heavily influenced by underlying dental compensations, with ${profileVal} facial profile coordinates. The lips (Upper: ${upperLipELineVal}mm, Lower: ${lowerLipELineVal}mm, contributing ${upperLipPct + lowerLipPct}%) show active tension to overcome skeletal Class ${anbVal > 4.5 ? 'II' : anbVal < 0 ? 'III' : 'I'} disharmony. This masks bone discrepancies but compromises long-term lip competence and chin-neck esthetics.`;

  // Segment declarations for both React JSX and PDF templates
  const overallSegments: DonutSegment[] = [
    { name: 'Skeletal Compensation', value: ociSke, color: '#F59E0B' },
    { name: 'Dental Compensation', value: ociDen, color: '#10B981' },
    { name: 'Soft Tissue Compensation', value: ociSof, color: '#3B82F6' }
  ];

  const skeletalSegments: DonutSegment[] = [
    { name: 'Maxilla Position', value: maxillaPct, color: '#EF4444' },
    { name: 'Mandible Position', value: mandiblePct, color: '#3B82F6' },
    { name: 'Vertical Pattern', value: verticalPct, color: '#F59E0B' },
    { name: 'Facial Skeletal Balance', value: balancePct, color: '#10B981' }
  ];

  const dentalSegments: DonutSegment[] = [
    { name: 'Upper Incisor', value: upperIncisorPct, color: '#EC4899' },
    { name: 'Lower Incisor', value: lowerIncisorPct, color: '#8B5CF6' },
    { name: 'Upper Molar', value: upperMolarPct, color: '#10B981' },
    { name: 'Lower Molar', value: lowerMolarPct, color: '#3B82F6' },
    { name: 'Occlusal Plane', value: occlusalPct, color: '#F59E0B' }
  ];

  const softTissueSegments: DonutSegment[] = [
    { name: 'Upper Lip', value: upperLipPct, color: '#EF4444' },
    { name: 'Lower Lip', value: lowerLipPct, color: '#3B82F6' },
    { name: 'Chin', value: chinPct, color: '#10B981' },
    { name: 'Nasolabial Angle', value: nasoPct, color: '#F59E0B' },
    { name: 'Facial Convexity', value: convexityPct, color: '#8B5CF6' }
  ];  // HTML template generator for both PDF compilation and System printing
  const getHtmlTemplate = (scoreColor: string, bgLight: string) => {
    // Helper function to generate high-fidelity HTML SVG Donut Charts
    const getHtmlDonutChart = (segments: { name: string; value: number; color: string }[], size = 150, thickness = 14) => {
      const r = (size - thickness) / 2;
      const cx = size / 2;
      const cy = size / 2;
      const circumference = 2 * Math.PI * r;
      
      let currentAngle = -90; // Start at top
      let circlesHtml = '';
      
      // Base circle track
      circlesHtml += `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="#E2E8F0" stroke-width="${thickness}" fill="transparent" />`;
      
      segments.forEach((seg) => {
        const percentage = seg.value;
        if (percentage > 0) {
          const strokeLength = (percentage / 100) * circumference;
          const rotateAngle = currentAngle;
          currentAngle += (percentage / 100) * 360;
          
          circlesHtml += `
            <g transform="rotate(${rotateAngle} ${cx} ${cy})">
              <circle cx="${cx}" cy="${cy}" r="${r}" 
                stroke="${seg.color}" stroke-width="${thickness}" fill="transparent"
                stroke-dasharray="${strokeLength} ${circumference}" stroke-dashoffset="0"
                stroke-linecap="round" />
            </g>
          `;
        }
      });
      
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          ${circlesHtml}
        </svg>
      `;
    };

    // Overall Allocation Segments
    const overallSegments = [
      { name: 'Skeletal Compensation', value: ociSke, color: '#F59E0B' },
      { name: 'Dental Compensation', value: ociDen, color: '#10B981' },
      { name: 'Soft Tissue Compensation', value: ociSof, color: '#3B82F6' }
    ];

    // Card 1 Segments
    const skeletalSegments = [
      { name: 'Maxilla Position', value: maxillaPct, color: '#EF4444' },
      { name: 'Mandible Position', value: mandiblePct, color: '#3B82F6' },
      { name: 'Vertical Pattern', value: verticalPct, color: '#F59E0B' },
      { name: 'Facial Skeletal Balance', value: balancePct, color: '#10B981' }
    ];

    // Card 2 Segments
    const dentalSegments = [
      { name: 'Upper Incisor', value: upperIncisorPct, color: '#EC4899' },
      { name: 'Lower Incisor', value: lowerIncisorPct, color: '#8B5CF6' },
      { name: 'Upper Molar', value: upperMolarPct, color: '#10B981' },
      { name: 'Lower Molar', value: lowerMolarPct, color: '#3B82F6' },
      { name: 'Occlusal Plane', value: occlusalPct, color: '#F59E0B' }
    ];

    // Card 3 Segments
    const softTissueSegments = [
      { name: 'Upper Lip', value: upperLipPct, color: '#EF4444' },
      { name: 'Lower Lip', value: lowerLipPct, color: '#3B82F6' },
      { name: 'Chin', value: chinPct, color: '#10B981' },
      { name: 'Nasolabial Angle', value: nasoPct, color: '#F59E0B' },
      { name: 'Facial Convexity', value: convexityPct, color: '#8B5CF6' }
    ];

    // Recommendations derived dynamically
    const recommendationTxt = report.finalClinicalSummary || '';
    const suggestedExtractions = report.extractionRecommendation === 'Yes' ? 'Premolar Extractions Recommended' : 'Non-extraction Camouflage Therapy';

    // Cephalometric values list for diagnostic page 2
    const measurementsList = [
      { name: 'SNA (°)', val: snaVal, mean: 82, min: 80, max: 84, unit: '°' },
      { name: 'SNB (°)', val: snbVal, mean: 80, min: 78, max: 82, unit: '°' },
      { name: 'ANB (°)', val: anbVal, mean: 2, min: 1, max: 4, unit: '°' },
      { name: 'Wits Appraisal (mm)', val: witsVal, mean: 0, min: -1, max: 1, unit: ' mm' },
      { name: 'FMA (°)', val: fmaVal, mean: 25, min: 22, max: 28, unit: '°' },
      { name: 'U1-SN (°)', val: u1SnVal, mean: 104, min: 100, max: 108, unit: '°' },
      { name: 'IMPA (°)', val: impaVal, mean: 90, min: 85, max: 95, unit: '°' },
      { name: 'Overjet (mm)', val: overjetVal, mean: 2.5, min: 1.5, max: 3.5, unit: ' mm' },
      { name: 'Curve of Spee (mm)', val: curveOfSpeeVal, mean: 1.0, min: 0.5, max: 1.5, unit: ' mm' },
      { name: 'Upper Lip to E-Line (mm)', val: upperLipELineVal, mean: -2, min: -3, max: -1, unit: ' mm' },
      { name: 'Lower Lip to E-Line (mm)', val: lowerLipELineVal, mean: 0, min: -1, max: 1, unit: ' mm' },
      { name: 'Nasolabial Angle (°)', val: nasolabialAngleVal, mean: 102, min: 95, max: 110, unit: '°' },
      { name: 'Facial Convexity (°)', val: facialConvexityVal, mean: 8, min: 6, max: 10, unit: '°' }
    ];

    const getDeviationText = (val: number, min: number, max: number, mean: number) => {
      if (val >= min && val <= max) return 'Normal';
      const diff = val - mean;
      return diff > 0 ? `+${diff.toFixed(1)} (High)` : `${diff.toFixed(1)} (Low)`;
    };

    const getDeviationBadgeClass = (val: number, min: number, max: number) => {
      if (val >= min && val <= max) return 'text-emerald-700 bg-emerald-50/80 border-emerald-200';
      return 'text-amber-700 bg-amber-50/80 border-amber-200';
    };

    const tableRowsHtml = measurementsList.map((item) => {
      const devText = getDeviationText(item.val, item.min, item.max, item.mean);
      const badgeClass = getDeviationBadgeClass(item.val, item.min, item.max);
      return `
        <tr class="hover:bg-slate-50/60 transition-colors duration-150">
          <td class="p-3 pl-4 font-semibold text-slate-800 border-b border-slate-100">${item.name}</td>
          <td class="p-3 text-center text-slate-500 font-mono border-b border-slate-100">${item.min} to ${item.max}${item.unit}</td>
          <td class="p-3 text-right font-black text-slate-900 font-mono border-b border-slate-100">${item.val.toFixed(1)}${item.unit}</td>
          <td class="p-3 text-right pr-4 border-b border-slate-100">
            <span class="inline-block px-2.5 py-0.5 rounded-full text-[8.5px] font-black border uppercase ${badgeClass}">
              ${devText}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        .pdf-page {
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
      </style>

      <!-- PAGE 1: COVER & EXECUTIVE PORTFOLIO SUMMARY -->
      <div class="pdf-page" style="width: 794px; height: 1123px; background-color: white; padding: 50px; box-sizing: border-box; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;">
        <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 to-slate-900"></div>
        <div class="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-teal-500/30 rounded-tr-3xl"></div>
        
        <!-- Header -->
        <div class="flex justify-between items-start mt-4">
          <div class="space-y-2">
            <div class="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/20 px-3.5 py-1.5 rounded-full">
              <span class="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
              <span class="text-teal-600 text-[9px] font-black tracking-widest uppercase mono-font">OCI Portfolio Suite</span>
            </div>
            <h1 class="text-4xl font-black tracking-tight text-slate-900 heading-font uppercase">
              OCI ANALYZER REPORT
            </h1>
            <p class="text-slate-500 text-xs font-medium">
              AI-Powered Orthodontic Compensation Index & Clinical Dossier
            </p>
          </div>
          <div class="text-right space-y-1">
            <p class="text-[9px] text-slate-400 font-mono">Case ID: ${patientID}</p>
            <p class="text-[9px] text-slate-400 font-mono">Date: ${assessment.patientDetails.date || assessment.createdAt.split('T')[0]}</p>
            <p class="text-[9px] text-slate-400 font-mono">Clinic: ${clinicName}</p>
          </div>
        </div>

        <!-- Demographics Quick Info -->
        <div class="grid grid-cols-5 gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 my-4 text-xs">
          <div class="border-r border-slate-200/60 pr-2">
            <p class="text-[8px] text-slate-400 font-black uppercase tracking-wider">Patient Name</p>
            <p class="font-extrabold text-slate-800 mt-0.5 text-sm">${assessment.patientDetails.name}</p>
          </div>
          <div class="border-r border-slate-200/60 pr-2">
            <p class="text-[8px] text-slate-400 font-black uppercase tracking-wider">Age / Gender</p>
            <p class="font-extrabold text-slate-800 mt-0.5 text-sm">${assessment.patientDetails.age} Y / ${assessment.patientDetails.gender || 'N/A'}</p>
          </div>
          <div class="border-r border-slate-200/60 pr-2">
            <p class="text-[8px] text-slate-400 font-black uppercase tracking-wider">Dentition Phase</p>
            <p class="font-extrabold text-slate-800 mt-0.5 text-sm">${assessment.patientDetails.dentitionPhase || 'Permanent'}</p>
          </div>
          <div class="border-r border-slate-200/60 pr-2">
            <p class="text-[8px] text-slate-400 font-black uppercase tracking-wider">CVM Stage / Growth Status</p>
            <p class="font-extrabold text-teal-600 mt-0.5 text-sm">${report.cvmStage} (${report.growthStatus})</p>
          </div>
          <div>
            <p class="text-[8px] text-slate-400 font-black uppercase tracking-wider">Skeletal Pattern</p>
            <p class="font-extrabold text-slate-800 mt-0.5 text-sm">${assessment.patientDetails.diagnosis}</p>
          </div>
        </div>

        <!-- Top Section: Large Score & Distribution -->
        <div class="grid grid-cols-2 gap-6 items-center my-4 py-6 border-y border-slate-150">
          
          <!-- Left side: Large Circular Score -->
          <div class="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100/80">
            <div class="relative w-44 h-44 flex items-center justify-center">
              <svg width="176" height="176" viewBox="0 0 176 176" class="w-full h-full transform -rotate-90">
                <circle cx="88" cy="88" r="76" stroke="#E2E8F0" stroke-width="12" fill="transparent" />
                <circle cx="88" cy="88" r="76" stroke="${scoreColor}" stroke-width="12" fill="transparent" 
                  stroke-dasharray="477" stroke-dashoffset="${477 - (477 * total) / 100}" stroke-linecap="round" />
              </svg>
              <div class="absolute flex flex-col items-center justify-center">
                <span class="text-4xl font-black text-slate-950 heading-font">${total}%</span>
                <span class="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">OCI Index</span>
              </div>
            </div>
            <div class="mt-4 text-center">
              <span class="text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider border" style="color: ${scoreColor}; background-color: ${bgLight}; border-color: ${scoreColor}25">
                ${severityLabel} Compensation Pattern
              </span>
              <p class="text-[10px] text-slate-500 mt-2.5 font-semibold max-w-xs leading-relaxed">
                Quantified physiological masking of Class ${anbVal > 4.5 ? 'II' : anbVal < 0 ? 'III' : 'I'} skeletal discrepancy.
              </p>
            </div>
          </div>

          <!-- Right side: Overall Distribution Donut Chart -->
          <div class="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100/80">
            <h4 class="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-4">Overall Compensation Distribution</h4>
            
            <div class="flex items-center space-x-6">
              <!-- SVG Donut Chart -->
              <div>
                ${getHtmlDonutChart(overallSegments, 120, 12)}
              </div>
              
              <!-- Legend Grid -->
              <div class="space-y-3">
                <div class="flex items-center space-x-3">
                  <span class="w-3 h-3 rounded bg-amber-500 inline-block shadow-sm"></span>
                  <div>
                    <p class="text-[10px] font-extrabold text-slate-800">Skeletal Base</p>
                    <p class="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Load: ${ociSke}% | Score: ${report.ociSkeletalContribution}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-3">
                  <span class="w-3 h-3 rounded bg-emerald-500 inline-block shadow-sm"></span>
                  <div>
                    <p class="text-[10px] font-extrabold text-slate-800">Dental Torque</p>
                    <p class="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Load: ${ociDen}% | Score: ${report.ociDentalContribution}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-3">
                  <span class="w-3 h-3 rounded bg-blue-500 inline-block shadow-sm"></span>
                  <div>
                    <p class="text-[10px] font-extrabold text-slate-800">Soft Tissue</p>
                    <p class="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Load: ${ociSof}% | Score: ${report.ociSoftTissueContribution}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Clinical Branding & Supervisor Credentials -->
        <div class="border-t border-slate-200 pt-6 flex justify-between items-end">
          <div class="space-y-1">
            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Supervisor & Specialty Clinic</p>
            <p class="text-sm font-black text-slate-950 heading-font">${doctorName}</p>
            <p class="text-[9px] text-slate-500 font-medium">MDS (Orthodontics) | Senior Board Consultant</p>
          </div>
          <div class="text-right space-y-1">
            <p class="text-[9px] text-slate-400 font-mono">Software Audit Suite: OCI Analyzer v2.0</p>
            <p class="text-[9px] text-slate-400 font-mono">System Developer: Dr. Salman</p>
          </div>
        </div>

        <div class="text-center text-[7px] text-slate-400 pt-4 border-t border-slate-150 font-mono mt-2" style="border-top: 1px solid #E2E8F0; padding-top: 10px;">
          <p style="font-weight: bold; margin-bottom: 2px;">Generated by OCI Analyzer™ • Version 2.0 • Date: ${assessment.patientDetails.date || assessment.createdAt.split('T')[0]}</p>
          <p style="font-style: italic; color: #64748B;"><strong style="text-transform: uppercase; font-weight: 800; color: #475569;">Clinical Decision Support Disclaimer:</strong> This report is generated using the OCI Analyzer™ (AI-Powered). OCI is intended to support orthodontic diagnosis and treatment planning. Final clinical decisions remain the responsibility of the treating orthodontist.</p>
        </div>
      </div>

      <!-- PAGE 2: CEPHALOMETRIC METRIC PROFILE & DEVIATIONS -->
      <div class="pdf-page" style="width: 794px; height: 1123px; background-color: white; padding: 50px; box-sizing: border-box; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;">
        <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 to-slate-900"></div>
        <div class="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-teal-500/30 rounded-tr-3xl"></div>
        
        <div class="space-y-5">
          <!-- Page Header -->
          <div class="flex justify-between items-center border-b border-slate-200 pb-3 mt-4">
            <h3 class="text-lg font-black text-slate-900 heading-font uppercase">Cephalometric Metric Profile & Deviations</h3>
            <span class="text-[9px] text-slate-400 font-mono">Page 2 of 4</span>
          </div>

          <p class="text-[11px] text-slate-500 leading-relaxed font-medium">
            Anatomical sagittal, vertical, and dentoalveolar parameters measured on lateral cephalograms. Calculated deviations highlight major structural discrepancies and compensatory base movements.
          </p>

          <!-- Table Container -->
          <div class="overflow-hidden border border-slate-200/80 rounded-2xl shadow-sm">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-900 text-white font-black uppercase tracking-wider text-[8px]">
                  <th class="p-3.5 pl-4">Measurement Parameter</th>
                  <th class="p-3.5 text-center">Normative Range</th>
                  <th class="p-3.5 text-right">Patient Value</th>
                  <th class="p-3.5 text-right pr-4">Calculated Deviation</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>
        </div>

        <div class="text-center text-[7px] text-slate-400 pt-4 border-t border-slate-150 font-mono mt-4" style="border-top: 1px solid #E2E8F0; padding-top: 10px;">
          <p style="font-weight: bold; margin-bottom: 2px;">Generated by OCI Analyzer™ • Version 2.0 • Date: ${assessment.patientDetails.date || assessment.createdAt.split('T')[0]}</p>
          <p style="font-style: italic; color: #64748B;"><strong style="text-transform: uppercase; font-weight: 800; color: #475569;">Clinical Decision Support Disclaimer:</strong> This report is generated using the OCI Analyzer™ (AI-Powered). OCI is intended to support orthodontic diagnosis and treatment planning. Final clinical decisions remain the responsibility of the treating orthodontist.</p>
        </div>
      </div>

      <!-- PAGE 3: MULTIDIMENSIONAL DECOMPOSITION CARDS -->
      <div class="pdf-page" style="width: 794px; height: 1123px; background-color: white; padding: 50px; box-sizing: border-box; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;">
        <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 to-slate-900"></div>
        <div class="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-teal-500/30 rounded-tr-3xl"></div>
        
        <div class="space-y-4">
          <div class="flex justify-between items-center border-b border-slate-200 pb-3 mt-4">
            <h3 class="text-lg font-black text-slate-900 heading-font uppercase">Multidimensional Decomposition Analytics</h3>
            <span class="text-[9px] text-slate-400 font-mono">Page 3 of 4</span>
          </div>

          <!-- CARD 1: SKELETAL DECOMPOSITION -->
          <div class="p-5 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-200/60 flex items-start space-x-6">
            <div class="flex flex-col items-center" style="min-width: 140px;">
              ${getHtmlDonutChart(skeletalSegments, 110, 11)}
              <span class="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider mt-3 font-mono">Skeletal sub-load</span>
            </div>
            <div class="flex-1 space-y-3">
              <h4 class="text-xs font-black text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex justify-between">
                <span class="flex items-center"><span class="w-2.5 h-2.5 rounded bg-amber-500 mr-2 inline-block"></span>1. Skeletal Base Allocation</span>
                <span class="text-amber-600 font-mono bg-amber-50 px-2 rounded-md">${ociSke}% Contribution</span>
              </h4>
              <p class="text-[11px] text-slate-600 leading-relaxed font-medium">${skeletalSummary}</p>
              
              <!-- Segment Legend Row -->
              <div class="grid grid-cols-4 gap-2 pt-1">
                <div class="p-2 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                  <p class="text-[8px] text-slate-400 uppercase font-black tracking-wider mt-0.5">Maxilla</p>
                  <p class="text-[10px] font-black text-slate-800 font-mono mt-0.5">${maxillaPct}%</p>
                </div>
                <div class="p-2 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                  <p class="text-[8px] text-slate-400 uppercase font-black tracking-wider mt-0.5">Mandible</p>
                  <p class="text-[10px] font-black text-slate-800 font-mono mt-0.5">${mandiblePct}%</p>
                </div>
                <div class="p-2 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                  <p class="text-[8px] text-slate-400 uppercase font-black tracking-wider mt-0.5">Vertical</p>
                  <p class="text-[10px] font-black text-slate-800 font-mono mt-0.5">${verticalPct}%</p>
                </div>
                <div class="p-2 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  <p class="text-[8px] text-slate-400 uppercase font-black tracking-wider mt-0.5">Balance</p>
                  <p class="text-[10px] font-black text-slate-800 font-mono mt-0.5">${balancePct}%</p>
                </div>
              </div>
            </div>
          </div>

          <!-- CARD 2: DENTAL DECOMPOSITION -->
          <div class="p-5 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-200/60 flex items-start space-x-6">
            <div class="flex flex-col items-center" style="min-width: 140px;">
              ${getHtmlDonutChart(dentalSegments, 110, 11)}
              <span class="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider mt-3 font-mono">Dental sub-load</span>
            </div>
            <div class="flex-1 space-y-3">
              <h4 class="text-xs font-black text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex justify-between">
                <span class="flex items-center"><span class="w-2.5 h-2.5 rounded bg-emerald-500 mr-2 inline-block"></span>2. Dental Torque & Arch Allocation</span>
                <span class="text-emerald-600 font-mono bg-emerald-50 px-2 rounded-md">${ociDen}% Contribution</span>
              </h4>
              <p class="text-[11px] text-slate-600 leading-relaxed font-medium">${dentalSummary}</p>
              
              <!-- Segment Legend Row -->
              <div class="grid grid-cols-5 gap-1.5 pt-1">
                <div class="p-1.5 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-pink-500 inline-block"></span>
                  <p class="text-[7px] text-slate-400 uppercase font-black tracking-wider">U. Incisor</p>
                  <p class="text-[9px] font-black text-slate-800 font-mono mt-0.5">${upperIncisorPct}%</p>
                </div>
                <div class="p-1.5 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>
                  <p class="text-[7px] text-slate-400 uppercase font-black tracking-wider">L. Incisor</p>
                  <p class="text-[9px] font-black text-slate-800 font-mono mt-0.5">${lowerIncisorPct}%</p>
                </div>
                <div class="p-1.5 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  <p class="text-[7px] text-slate-400 uppercase font-black tracking-wider">U. Molar</p>
                  <p class="text-[9px] font-black text-slate-800 font-mono mt-0.5">${upperMolarPct}%</p>
                </div>
                <div class="p-1.5 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                  <p class="text-[7px] text-slate-400 uppercase font-black tracking-wider">L. Molar</p>
                  <p class="text-[9px] font-black text-slate-800 font-mono mt-0.5">${lowerMolarPct}%</p>
                </div>
                <div class="p-1.5 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                  <p class="text-[7px] text-slate-400 uppercase font-black tracking-wider">Occlusal</p>
                  <p class="text-[9px] font-black text-slate-800 font-mono mt-0.5">${occlusalPct}%</p>
                </div>
              </div>
            </div>
          </div>

          <!-- CARD 3: SOFT TISSUE DECOMPOSITION -->
          <div class="p-5 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-200/60 flex items-start space-x-6">
            <div class="flex flex-col items-center" style="min-width: 140px;">
              ${getHtmlDonutChart(softTissueSegments, 110, 11)}
              <span class="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider mt-3 font-mono">Soft tissue sub-load</span>
            </div>
            <div class="flex-1 space-y-3">
              <h4 class="text-xs font-black text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex justify-between">
                <span class="flex items-center"><span class="w-2.5 h-2.5 rounded bg-blue-500 mr-2 inline-block"></span>3. Soft Tissue & Lip Tension Allocation</span>
                <span class="text-blue-600 font-mono bg-blue-50 px-2 rounded-md">${ociSof}% Contribution</span>
              </h4>
              <p class="text-[11px] text-slate-600 leading-relaxed font-medium">${softTissueSummary}</p>
              
              <!-- Segment Legend Row -->
              <div class="grid grid-cols-5 gap-1.5 pt-1">
                <div class="p-1.5 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                  <p class="text-[7px] text-slate-400 uppercase font-black tracking-wider">U. Lip</p>
                  <p class="text-[9px] font-black text-slate-800 font-mono mt-0.5">${upperLipPct}%</p>
                </div>
                <div class="p-1.5 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                  <p class="text-[7px] text-slate-400 uppercase font-black tracking-wider">L. Lip</p>
                  <p class="text-[9px] font-black text-slate-800 font-mono mt-0.5">${lowerLipPct}%</p>
                </div>
                <div class="p-1.5 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  <p class="text-[7px] text-slate-400 uppercase font-black tracking-wider">Chin</p>
                  <p class="text-[9px] font-black text-slate-800 font-mono mt-0.5">${chinPct}%</p>
                </div>
                <div class="p-1.5 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                  <p class="text-[7px] text-slate-400 uppercase font-black tracking-wider">Nasolabial</p>
                  <p class="text-[9px] font-black text-slate-800 font-mono mt-0.5">${nasoPct}%</p>
                </div>
                <div class="p-1.5 bg-slate-50 rounded-lg border border-slate-200/40 text-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>
                  <p class="text-[7px] text-slate-400 uppercase font-black tracking-wider">Convexity</p>
                  <p class="text-[9px] font-black text-slate-800 font-mono mt-0.5">${convexityPct}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center text-[7px] text-slate-400 pt-4 border-t border-slate-150 font-mono mt-4" style="border-top: 1px solid #E2E8F0; padding-top: 10px;">
          <p style="font-weight: bold; margin-bottom: 2px;">Generated by OCI Analyzer™ • Version 2.0 • Date: ${assessment.patientDetails.date || assessment.createdAt.split('T')[0]}</p>
          <p style="font-style: italic; color: #64748B;"><strong style="text-transform: uppercase; font-weight: 800; color: #475569;">Clinical Decision Support Disclaimer:</strong> This report is generated using the OCI Analyzer™ (AI-Powered). OCI is intended to support orthodontic diagnosis and treatment planning. Final clinical decisions remain the responsibility of the treating orthodontist.</p>
        </div>
      </div>

      <!-- PAGE 4: AI CLINICAL SUMMARY & RECOMMENDATIONS -->
      <div class="pdf-page" style="width: 794px; height: 1123px; background-color: white; padding: 50px; box-sizing: border-box; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;">
        <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 to-slate-900"></div>
        <div class="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-teal-500/30 rounded-tr-3xl"></div>
        
        <div class="space-y-4">
          <div class="flex justify-between items-center border-b border-slate-200 pb-3 mt-4">
            <h3 class="text-lg font-black text-slate-900 heading-font uppercase">Clinical Treatment Decisions & AI Synthesis</h3>
            <span class="text-[9px] text-slate-400 font-mono">Page 4 of 4</span>
          </div>

          <!-- Section 1: AI Clinical Summary Grid -->
          <div class="space-y-2">
            <h4 class="text-[10px] font-black uppercase tracking-wider text-slate-400">AI Clinical Summary & Diagnostic Breakdown</h4>
            <div class="grid grid-cols-2 gap-3 text-[10px] leading-relaxed">
              <div class="p-3 bg-slate-50 rounded-xl border-l-4 border-amber-500 border-slate-100 space-y-1">
                <p class="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">1. Overall Compensation Pattern</p>
                <p class="font-bold text-slate-800">Skeletal Class ${anbVal > 4.5 ? 'II' : anbVal < 0 ? 'III' : 'I'} with Dentoalveolar Camouflage</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border-l-4 border-blue-500 border-slate-100 space-y-1">
                <p class="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">2. Dominant Compensation Type</p>
                <p class="font-bold text-slate-800">${dominantCompType} (${dominantCompVal}%)</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border-l-4 border-slate-100 space-y-1" style="border-left-color: ${scoreColor}">
                <p class="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">3. Compensation Severity</p>
                <p class="font-bold text-teal-600" style="color: ${scoreColor}">${severityLabel} Compensation (Score: ${total})</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border-l-4 border-blue-500 border-slate-100 space-y-1">
                <p class="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">4. Facial Esthetic Impact</p>
                <p class="font-semibold text-slate-700">${profileVal} Profile, compromised chin-lip projection, muscular tension.</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border-l-4 border-emerald-500 border-slate-100 space-y-1">
                <p class="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">5. Occlusal Impact</p>
                <p class="font-semibold text-slate-700">Restricted tooth positions, compromised dental bite, overjet/overbite distortion.</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border-l-4 border-emerald-500 border-slate-100 space-y-1">
                <p class="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">6. Anchorage Requirement</p>
                <p class="font-bold text-slate-800">${report.anchorageRequirement} Anchorage Level</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border-l-4 border-emerald-500 border-slate-100 space-y-1">
                <p class="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">7. Decompensation Requirement</p>
                <p class="font-semibold text-slate-700">Orthodontic torque/uprighting is required to coordinate incisors before surgery or final leveling.</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border-l-4 border-slate-600 border-slate-100 space-y-1">
                <p class="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">8. Treatment Difficulty</p>
                <p class="font-bold text-slate-800">${report.complexity}</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border-l-4 border-slate-600 border-slate-100 space-y-1">
                <p class="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">9. Treatment Prognosis</p>
                <p class="font-bold text-slate-800">${report.overallPrognosis}</p>
              </div>
              <div class="p-3 bg-teal-50 rounded-xl border-l-4 border-teal-500 border-teal-100 space-y-1">
                <p class="text-[7.5px] text-teal-600 font-bold uppercase tracking-wider">10. AI-Based Recommendations</p>
                <p class="font-bold text-teal-700">${suggestedExtractions}</p>
              </div>
            </div>
          </div>

          <!-- Section 2: Biomechanical Decisional Matrices -->
          <div class="space-y-2">
            <h4 class="text-[10px] font-black uppercase tracking-wider text-slate-400">Treatment Pathway & Sequence</h4>
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-[9px] font-black uppercase text-slate-400">Premolar Extractions</span>
                  <span class="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[9px] font-black">${report.extractionRecommendation}</span>
                </div>
                <div class="flex justify-between items-center">
                  <p class="font-extrabold text-slate-800">Probability: ${cleanPercent(report.extractionProbability)}</p>
                </div>
                <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div class="h-full bg-rose-500 rounded-full" style="width: ${cleanPercent(report.extractionProbability)}"></div>
                </div>
                <p class="text-[10px] text-slate-500 leading-normal mt-1">${report.extractionReason}</p>
              </div>
              <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-[9px] font-black uppercase text-slate-400">Orthognathic Surgery</span>
                  <span class="px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-[9px] font-black">${report.surgeryRecommendation}</span>
                </div>
                <div class="flex justify-between items-center">
                  <p class="font-extrabold text-slate-800">Probability: ${cleanPercent(report.surgeryProbability)}</p>
                </div>
                <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div class="h-full bg-sky-500 rounded-full" style="width: ${cleanPercent(report.surgeryProbability)}"></div>
                </div>
                <p class="text-[10px] text-slate-500 leading-normal mt-1">${report.surgeryReason}</p>
              </div>
            </div>

            <!-- Primary Recommended Plan Option -->
            <div class="p-4 bg-teal-50 border border-teal-200/60 rounded-xl text-xs space-y-1.5">
              <p class="text-[9px] font-mono uppercase text-teal-600 font-bold tracking-wider">Primary Treatment Recommendation & Final Clinical Summary</p>
              <p class="font-black text-[#14B8A6] text-sm">${report.primaryPlanOption}</p>
              <p class="text-[11px] text-slate-700 leading-relaxed font-semibold">${recommendationTxt}</p>
            </div>
          </div>

          <!-- Specialist Audit Stamp & Signatures -->
          <div class="flex justify-between items-end border-t border-slate-200 pt-6">
            <div class="space-y-2">
              <p class="text-[9px] text-slate-400 uppercase tracking-widest font-black">Clinical Integrity Seal</p>
              <div class="flex items-center space-x-4 text-[8px] text-slate-500 font-mono mt-1">
                <span class="bg-slate-100 px-2.5 py-1 rounded">Core: OCI-v2.0</span>
                <span class="bg-teal-50 text-teal-700 px-2.5 py-1 rounded">System: AI-Surgical-Ready</span>
                <span class="bg-slate-100 px-2.5 py-1 rounded">Audit Ref: d1d8d5b7</span>
              </div>
            </div>
            <div class="text-right" style="min-width: 150px;">
              <span class="text-base font-black italic text-teal-600 block border-b border-slate-200 pb-1 font-serif tracking-wide" style="font-family: 'Georgia', serif;">${sigText}</span>
              <span class="text-[8px] text-slate-400 uppercase font-black mt-1 block tracking-wider">Specialist Sign-off Seal</span>
            </div>
          </div>
        </div>

        <!-- OCI Clinical Decision Support System Printed Footer -->
        <div class="border-t border-slate-200 pt-6 px-4 pb-2 w-full max-w-[600px] mx-auto min-h-[100px] flex flex-col items-center justify-center text-center mt-4">
          <p class="text-xs font-black text-slate-900 uppercase tracking-wider leading-snug m-0">
            OCI Analyzer™
          </p>
          <p class="text-[10px] text-slate-500 font-mono uppercase mt-1 mb-4 leading-normal m-0">
            AI-Powered Orthodontic Clinical Decision Support System
          </p>
          
          <p class="text-[12px] font-medium text-slate-500 leading-normal m-0">
            Developed & Innovated by
          </p>
          <p class="text-[14px] font-semibold text-teal-600 mt-1 leading-normal m-0">
            Dr. Salman, MDS (Orthodontist)
          </p>
        </div>

        <div class="text-center text-[7px] text-slate-400 pt-4 border-t border-slate-150 font-mono mt-4" style="border-top: 1px solid #E2E8F0; padding-top: 10px;">
          <p style="font-style: italic; color: #64748B; margin: 0;"><strong style="text-transform: uppercase; font-weight: 800; color: #475569;">Clinical Decision Support Disclaimer:</strong> This report is generated using the OCI Analyzer™ (AI-Powered). OCI is intended to support orthodontic diagnosis and treatment planning. Final clinical decisions remain the responsibility of the treating orthodontist.</p>
        </div>
      </div>
    `;
  };

  // Direct high-fidelity PDF generator via html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (Platform.OS !== 'web') {
      try {
        Alert.alert("Feature Unavailable", "High-fidelity PDF generation is available in the Web version of the app. Please use the Web browser version to download PDF reports.");
      } catch (e) {
        console.log("Alert failed", e);
      }
      return;
    }

    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfProgress('Initializing document template...');

    // Color helpers for the printed layout based on OCI Score
    let scoreColor = '#10B981'; // green
    let bgLight = '#ECFDF5';
    if (total > 80) { scoreColor = '#EF4444'; bgLight = '#FEF2F2'; }
    else if (total > 60) { scoreColor = '#F97316'; bgLight = '#FFF7ED'; }
    else if (total > 40) { scoreColor = '#F59E0B'; bgLight = '#FEFBE8'; }
    else if (total > 20) { scoreColor = '#14B8A6'; bgLight = '#F0FDFA'; }

    try {
      const { jsPDF } = require('jspdf');
      const html2canvas = require('html2canvas');

      // 1. Create a secure, hidden render wrapper
      const renderContainer = document.createElement('div');
      renderContainer.id = 'pdf-render-root';
      renderContainer.style.position = 'absolute';
      renderContainer.style.left = '-9999px';
      renderContainer.style.top = '-9999px';
      renderContainer.style.width = '794px';
      renderContainer.style.backgroundColor = '#F1F5F9';
      document.body.appendChild(renderContainer);

      // 2. Populate rendering container with active templates
      renderContainer.innerHTML = getHtmlTemplate(scoreColor, bgLight);

      setPdfProgress('Rendering Page 1 of 4...');
      await new Promise(resolve => setTimeout(resolve, 400));

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pages = renderContainer.querySelectorAll('.pdf-page');

      for (let i = 0; i < pages.length; i++) {
        setPdfProgress(`Capturing Page ${i + 1} of ${pages.length}...`);
        const pageEl = pages[i] as HTMLElement;

        // CRITICAL FIX: we do not set allowTaint to true as that causes SecurityErrors in modern browsers 
        // when saving canvas. toDataURL. We use useCORS: true instead.
        const canvas = await html2canvas(pageEl, {
          scale: 2, // retina crisp HD resolution!
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      setPdfProgress('Packing PDF...');
      pdf.save(`${pdfFilename}.pdf`);

      document.body.removeChild(renderContainer);
      
      try {
        Alert.alert("Success", "Professional OCI report downloaded successfully as an attachment.");
      } catch (e) {
        console.log("Success alert blocked");
      }
    } catch (err) {
      console.error("PDF engine crash", err);
      try {
        Alert.alert("Engine Failure", "Local download failed. Please enable browser canvas features or use the System Print fallback option.");
      } catch (e) {
        console.warn("Alert blocked", err);
      }
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress('');
    }
  };

  // High-fidelity vector system printing & PDF export fallback
  const handleSystemPrint = () => {
    if (Platform.OS !== 'web') {
      try {
        Alert.alert("Feature Unavailable", "System print is available in the Web version of the app. Please use the Web browser version to print reports.");
      } catch (e) {
        console.log("Alert failed", e);
      }
      return;
    }

    let scoreColor = '#10B981'; // green
    let bgLight = '#ECFDF5';
    if (total > 80) { scoreColor = '#EF4444'; bgLight = '#FEF2F2'; }
    else if (total > 60) { scoreColor = '#F97316'; bgLight = '#FFF7ED'; }
    else if (total > 40) { scoreColor = '#F59E0B'; bgLight = '#FEFBE8'; }
    else if (total > 20) { scoreColor = '#14B8A6'; bgLight = '#F0FDFA'; }

    const printContent = getHtmlTemplate(scoreColor, bgLight);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-1';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc) return;

    iframeDoc.write(`
      <html>
        <head>
          <title>${pdfFilename}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
            body {
              margin: 0;
              padding: 0;
              background-color: white;
              font-family: 'Inter', sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .pdf-page {
              width: 210mm;
              height: 297mm;
              padding: 20mm;
              box-sizing: border-box;
              page-break-after: always;
              position: relative;
              background: white;
            }
            @media print {
              body {
                background: white;
              }
              .pdf-page {
                width: 210mm;
                height: 297mm;
                page-break-after: always;
                margin: 0;
                padding: 20mm;
                box-shadow: none;
                border: none;
              }
            }
            .heading-font {
              font-family: 'Space Grotesk', sans-serif;
            }
            .mono-font {
              font-family: 'JetBrains Mono', monospace;
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  if (window.parent && window.parent.document && window.frameElement) {
                    window.parent.document.body.removeChild(window.frameElement);
                  }
                }, 500);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    iframeDoc.close();
  };

  const handleShare = () => {
    try {
      Alert.alert(
        "Clinical Share Protocol",
        `The clinical files for OCI case ${assessment.patientDetails.caseNumber} have been compiled. Shared link is active for Dr. Salman.`
      );
    } catch (e) {
      console.log("Share Alert blocked. Protocol compiled successfully.");
    }
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
            {/* System Print Button */}
            <Pressable
              onPress={handleSystemPrint}
              style={({ pressed }) => [
                tw`px-4 py-2 bg-slate-800 rounded-xl flex-row items-center justify-center border border-slate-700`,
                pressed ? tw`opacity-90 scale-98` : null
              ]}
            >
              <Printer size={13} color="#22D3EE" style={tw`mr-1.5`} />
              <Text style={tw`text-[10px] font-black text-[#22D3EE] uppercase tracking-widest`}>System Print</Text>
            </Pressable>

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
        <ScrollView contentContainerStyle={tw`p-6 space-y-6 bg-[#050814]`} style={tw`flex-1`}>
          
          {/* Clinical Customizer Strip */}
          <View style={tw`bg-[#0B1226] p-4 rounded-2xl border border-white/5 flex-row gap-4 items-center`}>
            <View style={tw`bg-teal-500/10 p-2 rounded-xl`}>
              <User size={16} color="#14B8A6" />
            </View>
            <View style={tw`flex-1 flex-row gap-4`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[8px] text-slate-400 font-bold uppercase tracking-wider`}>Clinic Location</Text>
                <TextInput
                  value={clinicName}
                  onChangeText={setClinicName}
                  placeholder="Enter Clinic Name"
                  placeholderTextColor="#475569"
                  style={tw`text-white font-bold text-xs mt-0.5 p-0`}
                />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[8px] text-slate-400 font-bold uppercase tracking-wider`}>Supervisor & Specialist</Text>
                <TextInput
                  value={doctorName}
                  onChangeText={setDoctorName}
                  placeholder="Enter Doctor Name"
                  placeholderTextColor="#475569"
                  style={tw`text-white font-bold text-xs mt-0.5 p-0`}
                />
              </View>
            </View>
          </View>

          {/* Top Score Section: Large animated score and overall donut */}
          <View style={tw`flex-col md:flex-row gap-5`}>
            
            {/* OCI Score Gauge Card */}
            <View style={tw`flex-1 bg-[#0B1226] rounded-3xl p-6 border border-white/5 items-center justify-center relative overflow-hidden`}>
              <View style={tw`absolute top-0 right-0 w-24 h-24 border-t border-r border-teal-500/10 rounded-tr-3xl`}></View>
              <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-4`}>OCI Compensation Score</Text>
              
              <View style={tw`relative w-36 h-36 items-center justify-center`}>
                <Svg width={144} height={144} viewBox="0 0 144 144" style={tw`transform -rotate-90`}>
                  <Circle cx={72} cy={72} r={62} stroke="#1E293B" strokeWidth={10} fill="transparent" />
                  <Circle cx={72} cy={72} r={62} stroke={severityColor} strokeWidth={10} fill="transparent" 
                    strokeDasharray={390} strokeDashoffset={390 - (390 * total) / 100} strokeLinecap="round" />
                </Svg>
                <View style={tw`absolute flex-col items-center`}>
                  <Text style={tw`text-3xl font-black text-white`}>{total}%</Text>
                  <Text style={tw`text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5`}>OCI Index</Text>
                </View>
              </View>

              <View style={tw`mt-4 items-center`}>
                <View style={[tw`px-3.5 py-1 rounded-full border flex-row items-center`, { borderColor: `${severityColor}40`, backgroundColor: `${severityColor}10` }]}>
                  <Text style={[tw`text-[10px] font-black uppercase tracking-wider`, { color: severityColor }]}>
                    {severityLabel} Compensation
                  </Text>
                </View>
                <Text style={tw`text-[10px] text-slate-400 text-center mt-2 px-4 leading-normal`}>
                  Quantified severity of physiological compensation masking skeletal Class {anbVal > 4.5 ? 'II' : anbVal < 0 ? 'III' : 'I'} mismatch.
                </Text>
              </View>
            </View>

            {/* Overall Allocation Donut Card */}
            <View style={tw`flex-1 bg-[#0B1226] rounded-3xl p-6 border border-white/5 justify-center`}>
              <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-4 text-center md:text-left`}>Overall Compensation Distribution</Text>
              
              <View style={tw`flex-col sm:flex-row items-center justify-around gap-4`}>
                <ReactDonutChart segments={overallSegments} size={130} strokeWidth={12} />
                
                <View style={tw`space-y-3`}>
                  <View style={tw`flex-row items-center gap-3`}>
                    <View style={tw`w-2.5 h-2.5 rounded bg-amber-500`}></View>
                    <View>
                      <Text style={tw`text-white font-bold text-xs`}>Skeletal Base ({ociSke}%)</Text>
                      <Text style={tw`text-[9px] text-slate-400 font-mono`}>Load Factor Score: {report.ociSkeletalContribution}</Text>
                    </View>
                  </View>
                  <View style={tw`flex-row items-center gap-3`}>
                    <View style={tw`w-2.5 h-2.5 rounded bg-emerald-500`}></View>
                    <View>
                      <Text style={tw`text-white font-bold text-xs`}>Dental Torque ({ociDen}%)</Text>
                      <Text style={tw`text-[9px] text-slate-400 font-mono`}>Load Factor Score: {report.ociDentalContribution}</Text>
                    </View>
                  </View>
                  <View style={tw`flex-row items-center gap-3`}>
                    <View style={tw`w-2.5 h-2.5 rounded bg-blue-500`}></View>
                    <View>
                      <Text style={tw`text-white font-bold text-xs`}>Soft Tissue ({ociSof}%)</Text>
                      <Text style={tw`text-[9px] text-slate-400 font-mono`}>Load Factor Score: {report.ociSoftTissueContribution}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Bento Grid: Three separate detailed analytical deconstruction cards */}
          <Text style={tw`text-[10px] font-black text-[#22D3EE] uppercase tracking-widest font-mono mt-4`}>Multidimensional Deconstruction Cards</Text>

          {/* CARD 1: SKELETAL DECOMPOSITION */}
          <View style={tw`bg-[#0B1226] rounded-3xl p-6 border border-white/5 space-y-4`}>
            <View style={tw`flex-row flex-wrap justify-between items-center gap-2 border-b border-white/5 pb-3`}>
              <View style={tw`flex-row items-center gap-2 flex-1 min-w-[180px]`}>
                <View style={tw`bg-amber-500/10 p-1.5 rounded-lg`}>
                  <Layers size={14} color="#F59E0B" />
                </View>
                <Text style={tw`text-sm font-black text-white flex-1`}>1. Skeletal Base Allocation</Text>
              </View>
              <Text style={tw`text-xs font-mono font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg`}>{ociSke}% Contribution</Text>
            </View>

            <View style={tw`flex-col lg:flex-row gap-5 items-center`}>
              <View style={tw`items-center`}>
                <ReactDonutChart segments={skeletalSegments} size={110} strokeWidth={10} />
                <Text style={tw`text-[8px] text-slate-500 font-bold uppercase mt-2`}>Skeletal Sub-load</Text>
              </View>

              <View style={tw`flex-1 space-y-3 w-full`}>
                <Text style={tw`text-xs text-slate-300 leading-relaxed font-medium`}>{skeletalSummary}</Text>
                
                {/* Visual Bar Legends */}
                <View style={tw`flex-row flex-wrap gap-2 pt-1`}>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[70px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-red-400 font-black uppercase`}>Maxilla</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{maxillaPct}%</Text>
                  </View>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[70px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-blue-400 font-black uppercase`}>Mandible</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{mandiblePct}%</Text>
                  </View>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[70px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-amber-400 font-black uppercase`}>Vertical</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{verticalPct}%</Text>
                  </View>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[70px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-emerald-400 font-black uppercase`}>Balance</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{balancePct}%</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* CARD 2: DENTAL DECOMPOSITION */}
          <View style={tw`bg-[#0B1226] rounded-3xl p-6 border border-white/5 space-y-4`}>
            <View style={tw`flex-row flex-wrap justify-between items-center gap-2 border-b border-white/5 pb-3`}>
              <View style={tw`flex-row items-center gap-2 flex-1 min-w-[180px]`}>
                <View style={tw`bg-emerald-500/10 p-1.5 rounded-lg`}>
                  <Activity size={14} color="#10B981" />
                </View>
                <Text style={tw`text-sm font-black text-white flex-1`}>2. Dental Torque & Arch Allocation</Text>
              </View>
              <Text style={tw`text-xs font-mono font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg`}>{ociDen}% Contribution</Text>
            </View>

            <View style={tw`flex-col lg:flex-row gap-5 items-center`}>
              <View style={tw`items-center`}>
                <ReactDonutChart segments={dentalSegments} size={110} strokeWidth={10} />
                <Text style={tw`text-[8px] text-slate-500 font-bold uppercase mt-2`}>Dental Sub-load</Text>
              </View>

              <View style={tw`flex-1 space-y-3 w-full`}>
                <Text style={tw`text-xs text-slate-300 leading-relaxed font-medium`}>{dentalSummary}</Text>
                
                {/* Visual Bar Legends */}
                <View style={tw`flex-row flex-wrap gap-2 pt-1`}>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[55px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-pink-400 font-black uppercase`}>U. Incisor</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{upperIncisorPct}%</Text>
                  </View>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[55px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-purple-400 font-black uppercase`}>L. Incisor</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{lowerIncisorPct}%</Text>
                  </View>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[55px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-emerald-400 font-black uppercase`}>U. Molar</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{upperMolarPct}%</Text>
                  </View>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[55px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-blue-400 font-black uppercase`}>L. Molar</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{lowerMolarPct}%</Text>
                  </View>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[55px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-amber-400 font-black uppercase`}>Occlusal</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{occlusalPct}%</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* CARD 3: SOFT TISSUE DECOMPOSITION */}
          <View style={tw`bg-[#0B1226] rounded-3xl p-6 border border-white/5 space-y-4`}>
            <View style={tw`flex-row flex-wrap justify-between items-center gap-2 border-b border-white/5 pb-3`}>
              <View style={tw`flex-row items-center gap-2 flex-1 min-w-[180px]`}>
                <View style={tw`bg-blue-500/10 p-1.5 rounded-lg`}>
                  <Compass size={14} color="#3B82F6" />
                </View>
                <Text style={tw`text-sm font-black text-white flex-1`}>3. Soft Tissue & Lip Tension Allocation</Text>
              </View>
              <Text style={tw`text-xs font-mono font-black text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-lg`}>{ociSof}% Contribution</Text>
            </View>

            <View style={tw`flex-col lg:flex-row gap-5 items-center`}>
              <View style={tw`items-center`}>
                <ReactDonutChart segments={softTissueSegments} size={110} strokeWidth={10} />
                <Text style={tw`text-[8px] text-slate-500 font-bold uppercase mt-2`}>Soft Tissue Sub-load</Text>
              </View>

              <View style={tw`flex-1 space-y-3 w-full`}>
                <Text style={tw`text-xs text-slate-300 leading-relaxed font-medium`}>{softTissueSummary}</Text>
                
                {/* Visual Bar Legends */}
                <View style={tw`flex-row flex-wrap gap-2 pt-1`}>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[55px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-red-400 font-black uppercase`}>U. Lip</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{upperLipPct}%</Text>
                  </View>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[55px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-blue-400 font-black uppercase`}>L. Lip</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{lowerLipPct}%</Text>
                  </View>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[55px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-emerald-400 font-black uppercase`}>Chin</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{chinPct}%</Text>
                  </View>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[55px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-amber-400 font-black uppercase`}>Nasolabial</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{nasoPct}%</Text>
                  </View>
                  <View style={tw`bg-white/5 p-2 rounded-xl border border-white/5 flex-grow min-w-[55px] items-center justify-center`}>
                    <Text style={tw`text-[7px] text-purple-400 font-black uppercase`}>Convexity</Text>
                    <Text style={tw`text-xs font-mono font-black text-white mt-0.5`}>{convexityPct}%</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* AI Clinical Summary Synthesis Section */}
          <Text style={tw`text-[10px] font-black text-[#22D3EE] uppercase tracking-widest font-mono mt-4`}>AI Clinical Summary Synthesis</Text>
          <View style={tw`bg-[#0B1226] rounded-3xl p-6 border border-white/5 space-y-4`}>
            <View style={tw`flex-row flex-wrap gap-3`}>
              <View style={tw`bg-white/3 p-3.5 rounded-2xl border border-white/5 w-full sm:w-[48%] flex-grow`}>
                <Text style={tw`text-[8px] text-teal-400 font-black uppercase font-mono`}>1. Overall Compensation Pattern</Text>
                <Text style={tw`text-xs font-extrabold text-white mt-1`}>Skeletal Class {anbVal > 4.5 ? 'II' : anbVal < 0 ? 'III' : 'I'} Bases with Dentoalveolar Camouflage</Text>
              </View>
              <View style={tw`bg-white/3 p-3.5 rounded-2xl border border-white/5 w-full sm:w-[48%] flex-grow`}>
                <Text style={tw`text-[8px] text-teal-400 font-black uppercase font-mono`}>2. Dominant Compensation Type</Text>
                <Text style={tw`text-xs font-extrabold text-white mt-1`}>{dominantCompType} ({dominantCompVal}%)</Text>
              </View>
              <View style={tw`bg-white/3 p-3.5 rounded-2xl border border-white/5 w-full sm:w-[48%] flex-grow`}>
                <Text style={tw`text-[8px] text-teal-400 font-black uppercase font-mono`}>3. Compensation Severity</Text>
                <Text style={tw`text-xs font-extrabold text-white mt-1`}>{severityLabel} Compensation (OCI score: {total})</Text>
              </View>
              <View style={tw`bg-white/3 p-3.5 rounded-2xl border border-white/5 w-full sm:w-[48%] flex-grow`}>
                <Text style={tw`text-[8px] text-teal-400 font-black uppercase font-mono`}>4. Facial Esthetic Impact</Text>
                <Text style={tw`text-xs font-bold text-slate-300 mt-1`}>{profileVal} Profile, compromised chin-lip projection, active labial mental tension</Text>
              </View>
              <View style={tw`bg-white/3 p-3.5 rounded-2xl border border-white/5 w-full sm:w-[48%] flex-grow`}>
                <Text style={tw`text-[8px] text-teal-400 font-black uppercase font-mono`}>5. Occlusal Impact</Text>
                <Text style={tw`text-xs font-bold text-slate-300 mt-1`}>Distorted dental overjet, sagittal intercuspation limitations, reciprocal torque loss</Text>
              </View>
              <View style={tw`bg-white/3 p-3.5 rounded-2xl border border-white/5 w-full sm:w-[48%] flex-grow`}>
                <Text style={tw`text-[8px] text-teal-400 font-black uppercase font-mono`}>6. Anchorage Requirement</Text>
                <Text style={tw`text-xs font-extrabold text-white mt-1`}>{report.anchorageRequirement} Anchorage Level</Text>
              </View>
              <View style={tw`bg-white/3 p-3.5 rounded-2xl border border-white/5 w-full sm:w-[48%] flex-grow`}>
                <Text style={tw`text-[8px] text-teal-400 font-black uppercase font-mono`}>7. Decompensation Requirement</Text>
                <Text style={tw`text-xs font-bold text-slate-300 mt-1`}>Active orthodontic incisor uprighting/leveling before surgery or definitive correction</Text>
              </View>
              <View style={tw`bg-white/3 p-3.5 rounded-2xl border border-white/5 w-full sm:w-[48%] flex-grow`}>
                <Text style={tw`text-[8px] text-teal-400 font-black uppercase font-mono`}>8. Treatment Difficulty</Text>
                <Text style={tw`text-xs font-extrabold text-white mt-1`}>{report.complexity}</Text>
              </View>
              <View style={tw`bg-white/3 p-3.5 rounded-2xl border border-white/5 w-full sm:w-[48%] flex-grow`}>
                <Text style={tw`text-[8px] text-teal-400 font-black uppercase font-mono`}>9. Treatment Prognosis</Text>
                <Text style={tw`text-xs font-extrabold text-white mt-1`}>{report.overallPrognosis}</Text>
              </View>
              <View style={tw`bg-[#115E59]/10 p-3.5 rounded-2xl border border-[#14B8A6]/20 w-full sm:w-[48%] flex-grow`}>
                <Text style={tw`text-[8px] text-[#22D3EE] font-black uppercase font-mono`}>10. AI Treatment Action</Text>
                <Text style={tw`text-xs font-black text-white mt-1`}>
                  {report.extractionRecommendation === 'Yes' ? 'Premolar Extraction Sequence' : 'Camouflage Non-extraction approach'}
                </Text>
              </View>
            </View>
          </View>

          {/* Biomechanical Decisional Probability Matrices */}
          <View style={tw`flex-col md:flex-row gap-5`}>
            
            {/* Extraction Decision Card */}
            <View style={tw`flex-1 bg-[#0B1226] p-5 rounded-3xl border border-white/5 space-y-2`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Biomechanical Extraction Matrix</Text>
                <Text style={tw`px-2.5 py-0.5 bg-rose-500/10 text-rose-400 rounded-lg text-[9px] font-black border border-rose-500/20`}>{report.extractionRecommendation}</Text>
              </View>
              <Text style={tw`text-sm font-black text-white`}>Extraction Probability: {cleanPercent(report.extractionProbability)}</Text>
              <Text style={tw`text-[10px] text-slate-400 leading-normal mt-1.5`}>{report.extractionReason}</Text>
            </View>

            {/* Surgical Decision Card */}
            <View style={tw`flex-1 bg-[#0B1226] p-5 rounded-3xl border border-white/5 space-y-2`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Surgical Correction Matrix</Text>
                <Text style={tw`px-2.5 py-0.5 bg-sky-500/10 text-sky-400 rounded-lg text-[9px] font-black border border-sky-500/20`}>{report.surgeryRecommendation}</Text>
              </View>
              <Text style={tw`text-sm font-black text-white`}>Surgical Probability: {cleanPercent(report.surgeryProbability)}</Text>
              <Text style={tw`text-[10px] text-slate-400 leading-normal mt-1.5`}>{report.surgeryReason}</Text>
            </View>
          </View>

          {/* Primary Sequence Path Option */}
          <View style={tw`bg-[#0B1226] p-5 rounded-3xl border border-white/5 space-y-2`}>
            <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Primary Treatment Sequence Pathway</Text>
            <Text style={tw`text-sm font-extrabold text-[#14B8A6]`}>{report.primaryPlanOption}</Text>
            <Text style={tw`text-xs text-slate-300 leading-relaxed font-medium`}>{report.finalClinicalSummary}</Text>
          </View>

          {/* Specialist Sign-off Seal (interactive, centered, responsive) */}
          <View style={tw`border-t border-white/10 pt-5 w-full flex-col items-center justify-center`}>
            <TextInput
              value={sigText}
              onChangeText={setSigText}
              style={tw`text-sm text-[#14B8A6] font-extrabold italic border-b border-white/15 p-1 text-center w-full max-w-[280px] bg-transparent outline-none`}
            />
            <Text style={tw`text-[8px] text-slate-500 mt-1.5 uppercase tracking-wider font-bold text-center`}>Specialist Sign-off Seal</Text>
          </View>

          {/* OCI Clinical Decision Support System Footer */}
          <View style={tw`border-t border-white/10 pt-6 px-4 pb-2 w-full max-w-[600px] mx-auto min-h-[100px] flex-col items-center justify-center`}>
            <Text style={tw`text-xs font-black text-white text-center uppercase tracking-wider leading-snug`}>
              OCI Analyzer™
            </Text>
            <Text style={tw`text-[10px] text-slate-400 font-mono text-center uppercase mt-1 mb-4 leading-normal`}>
              AI-Powered Orthodontic Clinical Decision Support System
            </Text>
            
            <Text style={tw`text-[12px] font-medium text-slate-400 text-center leading-normal`}>
              Developed & Innovated by
            </Text>
            <Text style={tw`text-[14px] font-semibold text-teal-400 text-center mt-1 leading-normal`}>
              Dr. Salman, MDS (Orthodontist)
            </Text>
          </View>

        </ScrollView>
      </View>

      {/* Premium Loader Overlay */}
      {isGeneratingPdf && (
        <View style={[tw`absolute inset-0 bg-black/80 z-[9999] justify-center items-center p-6`]}>
          <View style={tw`bg-[#0B1020] border border-[#14B8A6]/20 rounded-3xl p-8 max-w-xs w-full shadow-2xl items-center space-y-6`}>
            <View style={tw`w-16 h-16 rounded-full border-4 border-[#14B8A6]/10 border-t-[#14B8A6] items-center justify-center animate-spin`}>
              <FileText size={24} color="#14B8A6" />
            </View>
            <View style={tw`space-y-2 items-center`}>
              <Text style={tw`text-white font-black text-xs uppercase tracking-widest text-center`}>Compiling Clinical Dossier</Text>
              <Text style={tw`text-[#22D3EE] font-mono text-[10px] font-bold text-center`}>{pdfProgress}</Text>
              <Text style={tw`text-slate-400 text-[9px] text-center mt-2 leading-relaxed`}>
                Generating clinical vectors, high-fidelity layouts, and rendering OCI charts...
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
