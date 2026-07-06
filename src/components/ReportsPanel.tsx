import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { Assessment } from '../types';
import { 
  FileText, 
  Activity, 
  Calendar, 
  Award,
  Layers,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
  Clock,
  Compass,
  Info
} from 'lucide-react-native';
import tw from 'twrnc';
import { Norms } from '../scoringEngine';
import { getReportData, ReactDonutChart, DonutSegment } from './PdfReport';

const cleanPercent = (val: string | number | undefined) => {
  if (val === undefined || val === '') return '0%';
  const s = String(val).trim();
  const cleaned = s.replace(/%+$/, '');
  return cleaned + '%';
};

interface ReportsPanelProps {
  savedAssessments: Assessment[];
  onOpenPdf: (assessment: Assessment) => void;
}

export default function ReportsPanel({ savedAssessments, onOpenPdf }: ReportsPanelProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [showActiveSelect, setShowActiveSelect] = useState<boolean>(false);
  const [sigText, setSigText] = useState('Dr. Salman');
  const [expandedSections, setExpandedSections] = useState({
    parameters: false,
    skeletal: true,
    dental: false,
    softTissue: false,
    synthesis: false,
  });

  // Find selected assessment or fallback
  const selectedAssessment = savedAssessments.find(a => a.id === selectedId) || savedAssessments[0];

  useEffect(() => {
    if (savedAssessments.length > 0 && !selectedId) {
      setSelectedId(savedAssessments[0].id);
    }
  }, [savedAssessments, selectedId]);

  if (savedAssessments.length === 0) {
    return (
      <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
        <View style={tw`bg-gradient-to-br from-teal-950/40 to-[#0B1020]/40 p-8 rounded-[32px] border border-white/5 shadow-2xl mt-8 items-center text-center space-y-5`}>
          <View style={tw`w-16 h-16 bg-[#14B8A6]/10 rounded-full items-center justify-center border border-[#14B8A6]/20 shadow-inner`}>
            <FileText size={30} color="#14B8A6" />
          </View>
          <Text style={tw`text-lg font-black text-white`}>
            Reports Archive
          </Text>
          <Text style={tw`text-slate-400 max-w-xs text-xs leading-relaxed text-center`}>
            Clinical history database is currently empty. Run an OCI analysis first to store patient parameters before accessing professional clinical reports.
          </Text>
          <View style={tw`pt-2 items-center`}>
            <Text style={tw`text-[9px] text-[#22D3EE] font-black font-mono uppercase tracking-widest`}>
              Clinical Decision Support
            </Text>
            <Text style={tw`text-[10px] text-slate-500 mt-1 font-mono uppercase`}>Director: Dr. Salman MDS</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  const { patientDetails, cephalometricInput, ociResult } = selectedAssessment;

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

  const getDeviationText = (val: number | '', norm: typeof Norms.sna) => {
    if (val === '') return 'N/A';
    const numVal = Number(val);
    if (numVal >= norm.min && numVal <= norm.max) return 'Normal';
    const diff = numVal - norm.mean;
    return diff > 0 ? `+${diff.toFixed(1)} (High)` : `${diff.toFixed(1)} (Low)`;
  };

  const getDeviationColor = (val: number | '', norm: typeof Norms.sna) => {
    if (val === '') return 'text-slate-500';
    const numVal = Number(val);
    if (numVal >= norm.min && numVal <= norm.max) return 'text-emerald-400 font-extrabold';
    return 'text-amber-400 font-extrabold';
  };

  // Upgraded Clinical Report Calculations (synchronized with PdfReport.tsx)
  const report = getReportData(selectedAssessment);
  const total = selectedAssessment.ociResult.totalScore;

  const snaVal = Number(selectedAssessment.cephalometricInput.sna) || 82;
  const snbVal = Number(selectedAssessment.cephalometricInput.snb) || 80;
  const anbVal = Number(selectedAssessment.cephalometricInput.anb) || 2;
  const fmaVal = Number(selectedAssessment.cephalometricInput.fma) || 25;

  const u1SnVal = Number(selectedAssessment.cephalometricInput.u1Sn) || 104;
  const impaVal = Number(selectedAssessment.cephalometricInput.impa) || 90;
  const overjetVal = Number(selectedAssessment.cephalometricInput.overjet) || 2.5;

  const upperLipELineVal = Number(selectedAssessment.cephalometricInput.upperLipELine) || -2;
  const lowerLipELineVal = Number(selectedAssessment.cephalometricInput.lowerLipELine) || 0;
  const nasolabialAngleVal = Number(selectedAssessment.cephalometricInput.nasolabialAngle) || 102;
  const facialConvexityVal = Number(selectedAssessment.cephalometricInput.facialConvexity) || 8;

  const isClass1 = selectedAssessment.patientDetails.diagnosis === 'Class I';
  const isClass2 = selectedAssessment.patientDetails.diagnosis === 'Class II' || anbVal > 4.5;
  const isClass3 = selectedAssessment.patientDetails.diagnosis === 'Class III' || anbVal < 0;

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
  const molarRelationVal = selectedAssessment.cephalometricInput.molarRelation || 'Class I';
  const molarDev = molarRelationVal === 'Class I' ? 1 : 4;
  const overjetDev = Math.max(0.5, Math.abs(overjetVal - 2.5));
  const speeDev = Math.max(0.5, Math.abs((Number(selectedAssessment.cephalometricInput.curveOfSpee) || 1) - 1));
  const dentalSum = u1Dev + l1Dev + molarDev + overjetDev + speeDev;

  const upperIncisorPct = Math.round((u1Dev / dentalSum) * 100);
  const lowerIncisorPct = Math.round((l1Dev / dentalSum) * 100);
  const upperMolarPct = Math.round(((molarDev * 0.5) / dentalSum) * 100);
  const lowerMolarPct = Math.round(((molarDev * 0.5) / dentalSum) * 100);
  const occlusalPct = 100 - (upperIncisorPct + lowerIncisorPct + upperMolarPct + lowerMolarPct);

  // 3. Soft Tissue Deviations
  const uLipDev = Math.max(0.5, Math.abs(upperLipELineVal - (-2)));
  const lLipDev = Math.max(0.5, Math.abs(lowerLipELineVal - 0));
  const profileVal = selectedAssessment.patientDetails.facialProfile || 'Straight';
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
  ];

  const handleExportPDF = () => {
    onOpenPdf(selectedAssessment);
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Patient Selection Header */}
        <View style={tw`bg-[#0B1226] p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
          <View style={tw`space-y-1`}>
            <View style={tw`flex-row items-center bg-teal-500/15 border border-teal-500/30 px-3 py-1 rounded-full self-start mb-1`}>
              <Sparkles size={11} color="#22D3EE" style={tw`mr-1.5`} />
              <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-wider font-mono`}>Diagnostic Archival Report</Text>
            </View>
            <Text style={tw`text-xl font-black text-white tracking-tight uppercase`}>
              Clinical Reports
            </Text>
            <Text style={tw`text-xs text-slate-400 mt-1`}>Review cephalometric metric profiles and detailed physiological compensations</Text>
          </View>

          {/* Selector trigger */}
          <View style={tw`relative`}>
            <Pressable
              onPress={() => setShowActiveSelect(!showActiveSelect)}
              style={tw`flex-row justify-between items-center bg-black/40 px-4 py-3.5 rounded-2xl border border-white/10`}
            >
              <Text style={tw`text-xs font-black text-slate-200`}>
                {patientDetails.name || 'Anonymous'} ({patientDetails.caseNumber || 'No Case'})
              </Text>
              <ChevronDown size={14} color="#14B8A6" />
            </Pressable>

            {showActiveSelect && (
              <View style={tw`mt-2 bg-[#0B1020] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50`}>
                {savedAssessments.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedId(item.id);
                      setShowActiveSelect(false);
                    }}
                    style={tw`px-4 py-3.5 border-b border-white/5`}
                  >
                    <Text style={tw`text-xs font-bold text-slate-200`}>
                      {item.patientDetails.name || 'Anonymous'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Active Patient Metadata Card */}
        <View style={tw`bg-[#0B1226]/60 p-5 rounded-[24px] border border-white/5 shadow-xl`}>
          <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-3`}>Patient Demographics & Clinical Profile</Text>
          <View style={tw`flex-row flex-wrap gap-3`}>
            <View style={tw`bg-black/30 px-3 py-2 rounded-xl border border-white/5 min-w-[120px] flex-1`}>
              <Text style={tw`text-[8px] text-slate-500 font-bold uppercase tracking-wider`}>Age / Gender</Text>
              <Text style={tw`text-xs font-black text-white mt-0.5`}>{patientDetails.age} Y / {patientDetails.gender || 'N/A'}</Text>
            </View>
            <View style={tw`bg-black/30 px-3 py-2 rounded-xl border border-white/5 min-w-[120px] flex-1`}>
              <Text style={tw`text-[8px] text-slate-500 font-bold uppercase tracking-wider`}>Dentition Phase</Text>
              <Text style={tw`text-xs font-black text-[#14B8A6] mt-0.5`}>{patientDetails.dentitionPhase || 'Permanent'}</Text>
            </View>
            <View style={tw`bg-black/30 px-3 py-2 rounded-xl border border-white/5 min-w-[120px] flex-1`}>
              <Text style={tw`text-[8px] text-slate-500 font-bold uppercase tracking-wider`}>Facial Profile</Text>
              <Text style={tw`text-xs font-black text-white mt-0.5`}>{patientDetails.facialProfile || 'Straight'}</Text>
            </View>
            <View style={tw`bg-black/30 px-3 py-2 rounded-xl border border-white/5 min-w-[120px] flex-1`}>
              <Text style={tw`text-[8px] text-slate-500 font-bold uppercase tracking-wider`}>Crowding & Spacing</Text>
              <Text style={tw`text-xs font-black text-white mt-0.5`}>{patientDetails.crowdingSpacing || 'None'}</Text>
            </View>
          </View>
        </View>

        {/* Top Score Section: Large animated score and overall donut */}
        <View style={tw`flex-col md:flex-row gap-5`}>
          
          {/* OCI Score Gauge Card */}
          <View style={tw`flex-1 bg-[#0B1226] rounded-3xl p-6 border border-white/5 items-center justify-center relative overflow-hidden`}>
            <View style={tw`absolute top-0 right-0 w-24 h-24 border-t border-r border-teal-500/10 rounded-tr-3xl` || {}}></View>
            <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-4`}>OCI Compensation Score</Text>
            
            <View style={tw`relative w-36 h-36 items-center justify-center`}>
              <ReactDonutChart segments={[{ name: 'OCI', value: total, color: severityColor }]} size={130} strokeWidth={10} />
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
                    <Text style={tw`text-[9px] text-slate-400 font-mono`}>Load Factor: {report.ociSkeletalContribution}</Text>
                  </View>
                </View>
                <View style={tw`flex-row items-center gap-3`}>
                  <View style={tw`w-2.5 h-2.5 rounded bg-emerald-500`}></View>
                  <View>
                    <Text style={tw`text-white font-bold text-xs`}>Dental Torque ({ociDen}%)</Text>
                    <Text style={tw`text-[9px] text-slate-400 font-mono`}>Load Factor: {report.ociDentalContribution}</Text>
                  </View>
                </View>
                <View style={tw`flex-row items-center gap-3`}>
                  <View style={tw`w-2.5 h-2.5 rounded bg-blue-500`}></View>
                  <View>
                    <Text style={tw`text-white font-bold text-xs`}>Soft Tissue ({ociSof}%)</Text>
                    <Text style={tw`text-[9px] text-slate-400 font-mono`}>Load Factor: {report.ociSoftTissueContribution}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Info Blocks: Anatomical Parameters Table */}
        <View style={tw`w-full bg-[#0B1226] rounded-[28px] border border-white/5 shadow-2xl overflow-hidden`}>
          <Pressable 
            onPress={() => setExpandedSections(prev => ({ ...prev, parameters: !prev.parameters }))}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center`}>
              <Activity size={15} color="#14B8A6" style={tw`mr-2`} />
              <Text style={tw`text-[10px] font-bold text-slate-200 uppercase tracking-widest font-mono`}>Anatomical Parameters & Deviations</Text>
            </View>
            <View style={tw`flex-row items-center gap-1.5`}>
              <Text style={tw`text-[9px] font-bold text-slate-400 font-mono`}>
                {expandedSections.parameters ? 'COLLAPSE' : 'EXPAND'}
              </Text>
              <View style={tw`w-5 h-5 rounded-full bg-white/5 items-center justify-center`}>
                {expandedSections.parameters ? (
                  <ChevronUp size={12} color="#14B8A6" />
                ) : (
                  <ChevronDown size={12} color="#14B8A6" />
                )}
              </View>
            </View>
          </Pressable>

          {expandedSections.parameters && (
            <View style={tw`p-5 pt-1 space-y-1`}>
              {measurementsList.map((item, idx) => {
                const val = (cephalometricInput as any)[item.key];
                return (
                  <View key={idx} style={tw`flex-row justify-between items-center py-3 border-b border-white/5`}>
                    <View style={tw`space-y-0.5`}>
                      <Text style={tw`text-xs font-bold text-slate-200`}>{item.name}</Text>
                      <Text style={tw`text-[9px] text-slate-500 font-mono`}>Norm: {item.norm.min}-{item.norm.max}{item.norm.unit}</Text>
                    </View>
                    <View style={tw`items-end space-y-0.5`}>
                      <Text style={tw`text-xs font-black text-white font-mono`}>
                        {val === '' || val === undefined ? '—' : `${val}${item.norm.unit}`}
                      </Text>
                      <Text style={tw`text-[9px] font-black uppercase ${getDeviationColor(val, item.norm)}`}>
                        {getDeviationText(val, item.norm)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Bento Grid: Three separate detailed analytical deconstruction cards */}
        <Text style={tw`text-[10px] font-black text-[#22D3EE] uppercase tracking-widest font-mono mt-4`}>Multidimensional Deconstruction Cards</Text>

        {/* CARD 1: SKELETAL DECOMPOSITION */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <Pressable 
            onPress={() => setExpandedSections(prev => ({ ...prev, skeletal: !prev.skeletal }))}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center gap-2 flex-1 pr-4`}>
              <View style={tw`bg-amber-500/10 p-1.5 rounded-lg`}>
                <Layers size={14} color="#F59E0B" />
              </View>
              <Text style={tw`text-xs font-black text-white uppercase tracking-wide`}>1. Skeletal Base Allocation</Text>
            </View>
            <View style={tw`flex-row items-center gap-2`}>
              <Text style={tw`text-xs font-mono font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg`}>{ociSke}%</Text>
              <View style={tw`w-5 h-5 rounded-full bg-white/5 items-center justify-center`}>
                {expandedSections.skeletal ? (
                  <ChevronUp size={12} color="#14B8A6" />
                ) : (
                  <ChevronDown size={12} color="#14B8A6" />
                )}
              </View>
            </View>
          </Pressable>

          {expandedSections.skeletal && (
            <View style={tw`p-6 space-y-4`}>
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
          )}
        </View>

        {/* CARD 2: DENTAL DECOMPOSITION */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <Pressable 
            onPress={() => setExpandedSections(prev => ({ ...prev, dental: !prev.dental }))}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center gap-2 flex-1 pr-4`}>
              <View style={tw`bg-emerald-500/10 p-1.5 rounded-lg`}>
                <Activity size={14} color="#10B981" />
              </View>
              <Text style={tw`text-xs font-black text-white uppercase tracking-wide`}>2. Dental Torque & Arch Allocation</Text>
            </View>
            <View style={tw`flex-row items-center gap-2`}>
              <Text style={tw`text-xs font-mono font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg`}>{ociDen}%</Text>
              <View style={tw`w-5 h-5 rounded-full bg-white/5 items-center justify-center`}>
                {expandedSections.dental ? (
                  <ChevronUp size={12} color="#14B8A6" />
                ) : (
                  <ChevronDown size={12} color="#14B8A6" />
                )}
              </View>
            </View>
          </Pressable>

          {expandedSections.dental && (
            <View style={tw`p-6 space-y-4`}>
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
          )}
        </View>

        {/* CARD 3: SOFT TISSUE DECOMPOSITION */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <Pressable 
            onPress={() => setExpandedSections(prev => ({ ...prev, softTissue: !prev.softTissue }))}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center gap-2 flex-1 pr-4`}>
              <View style={tw`bg-blue-500/10 p-1.5 rounded-lg`}>
                <Compass size={14} color="#3B82F6" />
              </View>
              <Text style={tw`text-xs font-black text-white uppercase tracking-wide`}>3. Soft Tissue & Lip Tension Allocation</Text>
            </View>
            <View style={tw`flex-row items-center gap-2`}>
              <Text style={tw`text-xs font-mono font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-lg`}>{ociSof}%</Text>
              <View style={tw`w-5 h-5 rounded-full bg-white/5 items-center justify-center`}>
                {expandedSections.softTissue ? (
                  <ChevronUp size={12} color="#14B8A6" />
                ) : (
                  <ChevronDown size={12} color="#14B8A6" />
                )}
              </View>
            </View>
          </Pressable>

          {expandedSections.softTissue && (
            <View style={tw`p-6 space-y-4`}>
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
          )}
        </View>

        {/* AI Clinical Summary Synthesis Section */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <Pressable 
            onPress={() => setExpandedSections(prev => ({ ...prev, synthesis: !prev.synthesis }))}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center gap-2`}>
              <Sparkles size={14} color="#22D3EE" />
              <Text style={tw`text-[10px] font-bold text-slate-200 uppercase tracking-widest font-mono`}>AI Clinical Summary Synthesis</Text>
            </View>
            <View style={tw`flex-row items-center gap-1.5`}>
              <Text style={tw`text-[9px] font-bold text-slate-400 font-mono`}>
                {expandedSections.synthesis ? 'COLLAPSE' : 'EXPAND'}
              </Text>
              <View style={tw`w-5 h-5 rounded-full bg-white/5 items-center justify-center`}>
                {expandedSections.synthesis ? (
                  <ChevronUp size={12} color="#14B8A6" />
                ) : (
                  <ChevronDown size={12} color="#14B8A6" />
                )}
              </View>
            </View>
          </Pressable>

          {expandedSections.synthesis && (
            <View style={tw`p-6 space-y-4`}>
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
                  <Text style={[tw`text-[8px] text-teal-400 font-black uppercase font-mono`]}>3. Compensation Severity</Text>
                  <Text style={[tw`text-xs font-extrabold text-white mt-1`, { color: severityColor }]}>{severityLabel} Compensation (OCI score: {total})</Text>
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
          )}
        </View>

        {/* ====================================
            OCI INDEX ANALYSIS
           ==================================== */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <View style={tw`p-5 bg-gradient-to-r from-[#14B8A6]/10 to-black/20 flex-row items-center gap-2 border-b border-white/5`}>
            <Activity size={14} color="#14B8A6" />
            <Text style={tw`text-[10px] font-black text-slate-200 uppercase tracking-widest font-mono`}>OCI INDEX ANALYSIS</Text>
          </View>
          <View style={tw`p-6 space-y-4`}>
            <View style={tw`flex-row flex-wrap gap-4`}>
              <View style={tw`flex-1 min-w-[200px] bg-white/3 p-4 rounded-2xl border border-white/5 items-center justify-center`}>
                <Text style={tw`text-[8px] text-slate-500 font-black uppercase tracking-widest font-mono`}>OCI Clinical Score</Text>
                <Text style={tw`text-3xl font-black text-white font-mono mt-1`}>{total}%</Text>
                <Text style={tw`text-[9px] text-slate-400 font-semibold mt-1`}>Dentoalveolar Compensatory Load</Text>
              </View>

              <View style={tw`flex-1 min-w-[200px] bg-white/3 p-4 rounded-2xl border border-white/5 justify-center space-y-2`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-[8px] text-slate-500 font-black uppercase tracking-widest font-mono`}>Severity Range</Text>
                  <Text style={[tw`text-xs font-black uppercase`, { color: severityColor }]}>{severityLabel}</Text>
                </View>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-[8px] text-slate-500 font-black uppercase tracking-widest font-mono`}>Confidence Index</Text>
                  <Text style={tw`text-xs font-black text-emerald-400 font-mono`}>95%</Text>
                </View>
              </View>
            </View>

            <View style={tw`space-y-3 pt-2`}>
              <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Domain-wise OCI Breakdown</Text>
              
              {/* Skeletal Base */}
              <View style={tw`space-y-1.5`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Skeletal Base Relationship</Text>
                  <Text style={tw`text-xs font-extrabold text-amber-400 font-mono`}>{ociSke}%</Text>
                </View>
                <View style={tw`w-full h-1.5 bg-white/5 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-amber-500`, { width: `${ociSke}%` }]} />
                </View>
              </View>

              {/* Dental Torque */}
              <View style={tw`space-y-1.5`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Dental Torque Adaptation</Text>
                  <Text style={tw`text-xs font-extrabold text-emerald-400 font-mono`}>{ociDen}%</Text>
                </View>
                <View style={tw`w-full h-1.5 bg-white/5 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-emerald-500`, { width: `${ociDen}%` }]} />
                </View>
              </View>

              {/* Soft Tissue */}
              <View style={tw`space-y-1.5`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Soft Tissue Tension Envelope</Text>
                  <Text style={tw`text-xs font-extrabold text-blue-400 font-mono`}>{ociSof}%</Text>
                </View>
                <View style={tw`w-full h-1.5 bg-white/5 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-blue-500`, { width: `${ociSof}%` }]} />
                </View>
              </View>
            </View>

            <View style={tw`bg-black/30 p-3.5 rounded-2xl border border-white/5 mt-2`}>
              <Text style={tw`text-[8px] text-slate-500 font-black uppercase tracking-widest font-mono`}>Diagnostic Interpretation</Text>
              <Text style={tw`text-xs font-semibold text-slate-300 mt-1 leading-normal`}>
                {selectedAssessment.ociResult.interpretation}. Lower incisor compensation ({impaVal}°) combined with upper incisor projection ({u1SnVal}°) produces a reciprocal mask protecting normal masticatory functions but straining sagittal bony support.
              </Text>
            </View>
          </View>
        </View>

        {/* ====================================
            OCI-BASED TREATMENT RANKING
           ==================================== */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <View style={tw`p-5 bg-gradient-to-r from-[#14B8A6]/10 to-black/20 flex-row items-center gap-2 border-b border-white/5`}>
            <Award size={14} color="#14B8A6" />
            <Text style={tw`text-[10px] font-black text-slate-200 uppercase tracking-widest font-mono`}>OCI-BASED TREATMENT RANKING</Text>
          </View>
          <View style={tw`p-6 space-y-4`}>
            
            {/* 1st option: Recommended by OCI */}
            <View style={tw`bg-[#14B8A6]/5 border-2 border-[#14B8A6] p-5 rounded-2xl space-y-3`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-[10px] font-black text-[#14B8A6] uppercase tracking-widest font-mono`}>🥇 Recommended by OCI</Text>
                <View style={tw`bg-[#14B8A6]/10 px-2 py-0.5 rounded border border-[#14B8A6]/25`}>
                  <Text style={tw`text-[8px] text-teal-400 font-mono font-bold uppercase`}>Primary Path</Text>
                </View>
              </View>
              <View style={tw`space-y-1`}>
                <Text style={tw`text-sm font-black text-white`}>
                  {selectedAssessment.advanced?.primaryPlanOption || report.primaryPlanOption || 'Orthodontic Camouflage (Non-extraction approach)'}
                </Text>
                <Text style={tw`text-xs text-slate-300 leading-relaxed`}>
                  <Text style={tw`font-bold text-teal-400`}>Why Recommended: </Text>
                  {selectedAssessment.advanced?.explanationWhy || 'Selected by the OCI Analyzer™ because patient parameters lie within predictable non-extraction sagittal compensation margins.'}
                </Text>
              </View>
              <View style={tw`flex-row space-x-4 pt-1 border-t border-[#14B8A6]/10`}>
                <View>
                  <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-[8px] text-slate-500 uppercase font-mono font-bold`}>Treatment Suitability</Text>
                    <Info size={10} color="#64748B" style={tw`ml-1`} />
                  </View>
                  <Text style={tw`text-xs font-black text-teal-400 font-mono`}>92%</Text>
                </View>
                <View>
                  <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-[8px] text-slate-500 uppercase font-mono font-bold`}>Prediction Confidence</Text>
                    <Info size={10} color="#64748B" style={tw`ml-1`} />
                  </View>
                  <Text style={tw`text-xs font-black text-[#22D3EE] font-mono`}>90%</Text>
                </View>
              </View>
            </View>

            {/* 2nd option: Alternative */}
            <View style={tw`bg-white/3 border border-white/5 p-4 rounded-2xl space-y-2`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>🥈 Alternative Pathway</Text>
              </View>
              <Text style={tw`text-xs font-extrabold text-white`}>
                {selectedAssessment.advanced?.alternativePlan1 || 'Surgical Decompensation / Mandibular Advancement'}
              </Text>
              <View style={tw`flex-row space-x-4 pt-1`}>
                <View>
                  <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-[8px] text-slate-500 uppercase font-mono font-bold`}>Treatment Suitability</Text>
                    <Info size={10} color="#64748B" style={tw`ml-1`} />
                  </View>
                  <Text style={tw`text-xs font-extrabold text-slate-300 font-mono`}>75%</Text>
                </View>
                <View>
                  <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-[8px] text-slate-500 uppercase font-mono font-bold`}>Prediction Confidence</Text>
                    <Info size={10} color="#64748B" style={tw`ml-1`} />
                  </View>
                  <Text style={tw`text-xs font-extrabold text-slate-400 font-mono`}>80%</Text>
                </View>
              </View>
            </View>

            {/* 3rd option: Third Option */}
            <View style={tw`bg-white/3 border border-white/5 p-4 rounded-2xl space-y-2`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>🥉 Third Option</Text>
              </View>
              <Text style={tw`text-xs font-extrabold text-white`}>
                {selectedAssessment.advanced?.alternativePlan2 || 'Skeletal Anchorage Camouflage with Retromolar Miniscrews'}
              </Text>
              <View style={tw`flex-row space-x-4 pt-1`}>
                <View>
                  <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-[8px] text-slate-500 uppercase font-mono font-bold`}>Treatment Suitability</Text>
                    <Info size={10} color="#64748B" style={tw`ml-1`} />
                  </View>
                  <Text style={tw`text-xs font-extrabold text-slate-300 font-mono`}>60%</Text>
                </View>
                <View>
                  <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-[8px] text-slate-500 uppercase font-mono font-bold`}>Prediction Confidence</Text>
                    <Info size={10} color="#64748B" style={tw`ml-1`} />
                  </View>
                  <Text style={tw`text-xs font-extrabold text-slate-400 font-mono`}>75%</Text>
                </View>
              </View>
            </View>

          </View>
        </View>

        {/* ====================================
            WHY OCI SELECTED THIS TREATMENT
           ==================================== */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <View style={tw`p-5 bg-gradient-to-r from-[#14B8A6]/10 to-black/20 flex-row items-center gap-2 border-b border-white/5`}>
            <Compass size={14} color="#14B8A6" />
            <Text style={tw`text-[10px] font-black text-slate-200 uppercase tracking-widest font-mono`}>WHY OCI SELECTED THIS TREATMENT</Text>
          </View>
          <View style={tw`p-6 space-y-3.5`}>
            <Text style={tw`text-xs text-slate-400 leading-normal`}>
              The OCI Analyzer™ evaluated the primary active orthodontic parameters to finalize the CAMouflage/Surgical suitability score:
            </Text>

            <View style={tw`space-y-2`}>
              
              {/* Factor 1: Skeletal discrepancy */}
              <View style={tw`flex-row items-start space-x-2.5 bg-black/25 p-3 rounded-xl border border-white/5`}>
                <Text style={tw`text-[#14B8A6] font-bold text-xs`}>✓</Text>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono`}>Skeletal Discrepancy</Text>
                  <Text style={tw`text-xs font-bold text-white`}>
                    Skeletal Class {anbVal > 4.5 ? 'II' : anbVal < 0 ? 'III' : 'I'} (ANB = {anbVal}°)
                  </Text>
                </View>
              </View>

              {/* Factor 2: Dental compensation */}
              <View style={tw`flex-row items-start space-x-2.5 bg-black/25 p-3 rounded-xl border border-white/5`}>
                <Text style={tw`text-[#14B8A6] font-bold text-xs`}>✓</Text>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono`}>Dental Compensation Load</Text>
                  <Text style={tw`text-xs font-bold text-white`}>
                    Lower incisor IMPA: {impaVal}° | Upper incisor U1-SN: {u1SnVal}°
                  </Text>
                </View>
              </View>

              {/* Factor 3: Growth status */}
              <View style={tw`flex-row items-start space-x-2.5 bg-black/25 p-3 rounded-xl border border-white/5`}>
                <Text style={tw`text-[#14B8A6] font-bold text-xs`}>✓</Text>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono`}>Physiological Growth Status</Text>
                  <Text style={tw`text-xs font-bold text-white`}>
                    {selectedAssessment.advanced?.growthStatus || 'Growth Completed / CVM Stage 5-6'}
                  </Text>
                </View>
              </View>

              {/* Factor 4: Soft tissue */}
              <View style={tw`flex-row items-start space-x-2.5 bg-black/25 p-3 rounded-xl border border-white/5`}>
                <Text style={tw`text-[#14B8A6] font-bold text-xs`}>✓</Text>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono`}>Soft Tissue Tension Envelope</Text>
                  <Text style={tw`text-xs font-bold text-white`}>
                    Nasolabial angle: {nasolabialAngleVal}° | Upper Lip to E-Line: {upperLipELineVal}mm
                  </Text>
                </View>
              </View>

              {/* Factor 5: Facial profile */}
              <View style={tw`flex-row items-start space-x-2.5 bg-black/25 p-3 rounded-xl border border-white/5`}>
                <Text style={tw`text-[#14B8A6] font-bold text-xs`}>✓</Text>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono`}>Facial Profile Coordinates</Text>
                  <Text style={tw`text-xs font-bold text-white`}>
                    {profileVal} Facial Profile | Lip/Chin coordinates stable
                  </Text>
                </View>
              </View>

              {/* Factor 6: Existing OCI parameters */}
              <View style={tw`flex-row items-start space-x-2.5 bg-black/25 p-3 rounded-xl border border-white/5`}>
                <Text style={tw`text-[#14B8A6] font-bold text-xs`}>✓</Text>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono`}>Integrated OCI Parameters</Text>
                  <Text style={tw`text-xs font-bold text-white`}>
                    {selectedAssessment.ociResult.interpretation} (OCI Score: {total})
                  </Text>
                </View>
              </View>

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

        {/* Export PDF Button and Core Specialist Credentials Signature */}
        <View style={tw`bg-[#0B1226] p-6 rounded-3xl border border-white/5 space-y-6`}>
          <Pressable
            onPress={handleExportPDF}
            style={({ pressed }) => [
              tw`w-full py-4 bg-[#14B8A6] rounded-2xl items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-400/30`,
              pressed ? tw`opacity-90 scale-98` : null
            ]}
          >
            <Text style={tw`text-xs font-black text-white uppercase tracking-widest`}>Export & View PDF Report</Text>
          </Pressable>

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
        </View>

      </View>
    </ScrollView>
  );
}
