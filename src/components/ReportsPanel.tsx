import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Assessment } from '../types';
import { 
  FileText, 
  Activity, 
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  User,
  Compass,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react-native';
import tw from 'twrnc';
import { Norms } from '../scoringEngine';
import { getReportData } from './PdfReport';

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
  const [activeSection, setActiveSection] = useState<'severity' | 'parameters' | 'compensation' | 'pathways' | null>('severity');
  const [clinicalExpanded, setClinicalExpanded] = useState<boolean>(false);

  const toggleSection = (section: 'severity' | 'parameters' | 'compensation' | 'pathways') => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveSection(prev => prev === section ? null : section);
  };

  // Find selected assessment or fallback
  const rawSelectedAssessment = savedAssessments.find(a => a.id === selectedId) || savedAssessments[0];

  const activeMode = rawSelectedAssessment?.patientDetails?.analysisMode || 'turbo';
  const activeWorkspace = activeMode === 'clinic' ? rawSelectedAssessment?.clinicWorkspace : activeMode === 'ceph' ? rawSelectedAssessment?.cephWorkspace : rawSelectedAssessment?.turboWorkspace;

  const selectedAssessment: any = rawSelectedAssessment ? {
    ...rawSelectedAssessment,
    cephalometricInput: (activeWorkspace as any)?.cephalometricInput || {
      anb: '', sna: '', snb: '', wits: '', snMp: '', fma: '',
      u1Sn: '', u1NaDeg: '', u1NaMm: '', impa: '', l1NbDeg: '', l1NbMm: '',
      interincisalAngle: '', overjet: '', overbite: '', upperLipELine: '', lowerLipELine: '',
      nasolabialAngle: '', facialConvexity: '', molarRelation: '', canineRelation: '',
      crossbite: '', deepBite: '', openBite: '', curveOfSpee: '', midlineDeviation: '',
      posteriorCrossbite: '', archWidthDifference: '', dentalMidlineDev: ''
    },
    ociResult: (activeWorkspace as any)?.ociResult || {
      totalScore: 0,
      interpretation: 'Normal',
      recommendation: '',
      categoryScores: [],
      verticalPattern: 'Normodivergent',
      compensationLevel: 'Normal',
      severityMap: { upperIncisors: 'green', lowerIncisors: 'green', softTissue: 'green', occlusion: 'green', transverse: 'green' }
    },
    aiSummary: (activeWorkspace as any)?.aiSummary || 'No summary generated yet.',
    advanced: (activeWorkspace as any)?.advanced || {}
  } : rawSelectedAssessment;

  useEffect(() => {
    if (savedAssessments.length > 0 && !selectedId) {
      setSelectedId(savedAssessments[0].id);
    }
  }, [savedAssessments, selectedId]);

  if (savedAssessments.length === 0) {
    return (
      <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
        <View style={tw`bg-[#0B1020]/60 p-8 rounded-[32px] border border-white/5 shadow-2xl mt-8 items-center text-center space-y-5`}>
          <View style={tw`w-16 h-16 bg-[#14B8A6]/10 rounded-full items-center justify-center border border-[#14B8A6]/20 shadow-inner`}>
            <FileText size={30} color="#14B8A6" />
          </View>
          <Text style={tw`text-lg font-black text-white`}>
            Reports Archive
          </Text>
          <Text style={tw`text-slate-400 max-w-xs text-xs leading-relaxed text-center`}>
            Clinical history database is currently empty. Run an OCI analysis first to store patient parameters before accessing professional clinical reports.
          </Text>
        </View>
      </ScrollView>
    );
  }

  const { patientDetails, cephalometricInput } = selectedAssessment;

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

  // Calculations
  const report = getReportData(selectedAssessment);
  const total = selectedAssessment.ociResult.totalScore;

  const isClinicMode = selectedAssessment.patientDetails.analysisMode === 'clinic';
  const isClass1 = selectedAssessment.patientDetails.diagnosis === 'Class I';
  const isClass2 = selectedAssessment.patientDetails.diagnosis === 'Class II';
  const isClass3 = selectedAssessment.patientDetails.diagnosis === 'Class III';

  const snaVal = isClinicMode ? (isClass2 ? 84 : isClass3 ? 78 : 82) : (Number(selectedAssessment.cephalometricInput.sna) || 82);
  const snbVal = isClinicMode ? (isClass2 ? 78 : isClass3 ? 80 : 80) : (Number(selectedAssessment.cephalometricInput.snb) || 80);
  const anbVal = isClinicMode ? (isClass2 ? 6.0 : isClass3 ? -2.0 : 2.0) : (Number(selectedAssessment.cephalometricInput.anb) || 2);
  const fmaVal = isClinicMode ? (selectedAssessment.patientDetails.facialProfile === 'Convex' ? 29 : selectedAssessment.patientDetails.facialProfile === 'Concave' ? 20 : 25) : (Number(selectedAssessment.cephalometricInput.fma) || 25);

  const u1SnVal = isClinicMode ? (isClass2 ? 98 : isClass3 ? 112 : 104) : (Number(selectedAssessment.cephalometricInput.u1Sn) || 104);
  const impaVal = isClinicMode ? (isClass2 ? 98 : isClass3 ? 83 : 90) : (Number(selectedAssessment.cephalometricInput.impa) || 90);
  const overjetVal = isClinicMode ? (selectedAssessment.patientDetails.overjet !== undefined && selectedAssessment.patientDetails.overjet !== '' ? Number(selectedAssessment.patientDetails.overjet) : 2.5) : (Number(selectedAssessment.cephalometricInput.overjet) || 2.5);

  const upperLipELineVal = isClinicMode ? (isClass2 ? 1 : isClass3 ? -3 : -2) : (Number(selectedAssessment.cephalometricInput.upperLipELine) || -2);
  const lowerLipELineVal = isClinicMode ? (isClass2 ? 2 : isClass3 ? -1 : 0) : (Number(selectedAssessment.cephalometricInput.lowerLipELine) || 0);
  const nasolabialAngleVal = isClinicMode ? (isClass2 ? 92 : isClass3 ? 108 : 102) : (Number(selectedAssessment.cephalometricInput.nasolabialAngle) || 102);
  const facialConvexityVal = isClinicMode ? (isClass2 ? 18 : isClass3 ? 6 : 12) : (Number(selectedAssessment.cephalometricInput.facialConvexity) || 8);

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

  // Determine overall categories
  const ociSke = Number(report.ociSkeletalContribution) || (isClass1 ? 25 : isClass2 ? 45 : 50);
  const ociDen = Number(report.ociDentalContribution) || (isClass1 ? 55 : isClass2 ? 35 : 35);
  const ociSof = Number(report.ociSoftTissueContribution) || (isClass1 ? 20 : isClass2 ? 20 : 15);

  let severityLabel = 'Mild';
  let severityColor = '#27AE60'; 
  if (total > 80) {
    severityLabel = 'Extreme';
    severityColor = '#E74C3C';
  } else if (total > 60) {
    severityLabel = 'Severe';
    severityColor = '#E67E22';
  } else if (total > 40) {
    severityLabel = 'Moderate';
    severityColor = '#F1C40F';
  } else if (total <= 20) {
    severityLabel = 'Minimal';
    severityColor = '#2ECC71';
  }

  // Deconstruct systems
  const systems = [
    { name: 'Skeletal System', val: ociSke, color: '#E74C3C', icon: '💀', highlight: 'Skeletal Dominance' },
    { name: 'Dental System', val: ociDen, color: '#1E88FF', icon: '🦷', highlight: 'Dental Compensation' },
    { name: 'Soft Tissue System', val: ociSof, color: '#8E44AD', icon: '👄', highlight: 'Soft Tissue Strain' },
  ].sort((a, b) => b.val - a.val);

  const handleExportPDF = () => {
    onOpenPdf(selectedAssessment);
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* ====================================
            PATIENT SELECTION HEADER (NO LOGOS / NO BRANDING HEADERS)
           ==================================== */}
        <View style={tw`bg-[#0B1226] p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
          <View style={tw`relative`}>
            <Pressable
              onPress={() => setShowActiveSelect(!showActiveSelect)}
              style={tw`flex-row justify-between items-center bg-black/40 px-4 py-3.5 rounded-2xl border border-white/10`}
            >
              <View style={tw`flex-row items-center space-x-2`}>
                <User size={14} color="#14B8A6" />
                <Text style={tw`text-xs font-black text-slate-200`}>
                  {patientDetails.name || 'Anonymous'} ({patientDetails.caseNumber || 'No Case'})
                </Text>
              </View>
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
                    style={tw`px-4 py-3.5 border-b border-white/5 hover:bg-white/3`}
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

        {/* Demographics Card */}
        <View style={tw`bg-[#0B1226]/60 p-5 rounded-[24px] border border-white/5 shadow-xl`}>
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

        {/* ====================================================
            📂 FOLDABLE / COLLAPSIBLE ACCORDION UI CARDS
           ==================================================== */}

        {/* SECTION 1: OCI SEVERITY DISTRIBUTION */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <Pressable 
            onPress={() => toggleSection('severity')}
            style={tw`p-5 bg-gradient-to-r from-[#14B8A6]/10 to-black/20 flex-row justify-between items-center border-b border-white/5`}
          >
            <View style={tw`flex-row items-center space-x-2`}>
              <FileText size={15} color="#14B8A6" />
              <Text style={tw`text-[11px] font-black text-white uppercase tracking-wider font-mono`}>OCI Severity & Classification</Text>
            </View>
            {activeSection === 'severity' ? (
              <ChevronUp size={15} color="#14B8A6" />
            ) : (
              <ChevronDown size={15} color="#14B8A6" />
            )}
          </Pressable>

          {activeSection === 'severity' && (
            <View style={tw`p-5 space-y-4`}>
              <View style={tw`space-y-3.5`}>
                {[
                  { label: 'Minimal', range: '0-20%', active: total <= 20, color: '#2ECC71', desc: 'Skeletal base harmony' },
                  { label: 'Mild', range: '21-40%', active: total > 20 && total <= 40, color: '#27AE60', desc: 'Compensatory boundary' },
                  { label: 'Moderate', range: '41-60%', active: total > 40 && total <= 60, color: '#F1C40F', desc: 'Dentoalveolar torque adaptation' },
                  { label: 'Severe', range: '61-80%', active: total > 60 && total <= 80, color: '#E67E22', desc: 'Extensive skeletal base discrepancy' },
                  { label: 'Extreme', range: '81-100%', active: total > 80, color: '#E74C3C', desc: 'Surgical decompensation target boundary' },
                ].map((cat, idx) => (
                  <View key={idx} style={tw`space-y-1`}>
                    <View style={tw`flex-row justify-between items-center`}>
                      <View style={tw`flex-row items-center space-x-2`}>
                        <View style={[tw`w-2.5 h-2.5 rounded-full`, { backgroundColor: cat.color }]} />
                        <Text style={[tw`text-xs font-black`, cat.active ? tw`text-white` : tw`text-slate-400`]}>{cat.label}</Text>
                        <Text style={tw`text-[8px] text-slate-500 font-bold font-mono`}>{cat.range}</Text>
                      </View>
                      <View style={tw`flex-row items-center space-x-2`}>
                        {cat.active && (
                          <View style={tw`bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20`}>
                            <Text style={tw`text-[8px] font-black text-teal-400 uppercase`}>ACTIVE PATIENT ({total}%)</Text>
                          </View>
                        )}
                        <Text style={tw`text-xs font-black text-slate-300 font-mono`}>{cat.active ? 'Count: 1' : 'Count: 0'}</Text>
                      </View>
                    </View>
                    <View style={tw`w-full h-2.5 bg-slate-950 rounded-full overflow-hidden`}>
                      <View style={[tw`h-full rounded-full`, { width: cat.active ? `${total}%` : '5%', backgroundColor: cat.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* SECTION 2: ANATOMICAL PARAMETERS & DEVIATIONS */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <Pressable 
            onPress={() => toggleSection('parameters')}
            style={tw`p-5 bg-gradient-to-r from-[#14B8A6]/10 to-black/20 flex-row justify-between items-center border-b border-white/5`}
          >
            <View style={tw`flex-row items-center space-x-2`}>
              <Activity size={15} color="#14B8A6" />
              <Text style={tw`text-[11px] font-black text-white uppercase tracking-wider font-mono`}>Anatomical Parameters & Deviations</Text>
            </View>
            {activeSection === 'parameters' ? (
              <ChevronUp size={15} color="#14B8A6" />
            ) : (
              <ChevronDown size={15} color="#14B8A6" />
            )}
          </Pressable>

          {activeSection === 'parameters' && (
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

        {/* SECTION 3: COMPENSATION ANALYSIS & FLOW */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <Pressable 
            onPress={() => toggleSection('compensation')}
            style={tw`p-5 bg-gradient-to-r from-[#14B8A6]/10 to-black/20 flex-row justify-between items-center border-b border-white/5`}
          >
            <View style={tw`flex-row items-center space-x-2`}>
              <Layers size={15} color="#14B8A6" />
              <Text style={tw`text-[11px] font-black text-white uppercase tracking-wider font-mono`}>Compensation Analysis & Flow</Text>
            </View>
            {activeSection === 'compensation' ? (
              <ChevronUp size={15} color="#14B8A6" />
            ) : (
              <ChevronDown size={15} color="#14B8A6" />
            )}
          </Pressable>

          {activeSection === 'compensation' && (
            <View style={tw`p-5 space-y-6`}>
              
              {/* A) SKELETAL DOMINANCE */}
              <View style={tw`bg-[#E74C3C]/10 border border-[#E74C3C]/40 rounded-2xl p-4.5 space-y-3`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <View style={tw`flex-row items-center space-x-2`}>
                    <Text style={tw`text-sm`}>💀</Text>
                    <Text style={tw`text-xs font-black text-white`}>Skeletal base mismatch</Text>
                  </View>
                  <View style={tw`bg-[#E74C3C]/20 border border-[#E74C3C]/50 px-2 py-0.5 rounded`}>
                    <Text style={tw`text-[8px] font-black text-white uppercase`}>Skeletal Dominance</Text>
                  </View>
                </View>
                <View style={tw`w-full h-2 bg-slate-950 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-[#E74C3C]`, { width: `${ociSke}%` }]} />
                </View>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-[9px] text-slate-400 font-bold uppercase`}>Skeletal Load Factor</Text>
                  <Text style={tw`text-xs font-black text-[#E74C3C] font-mono`}>{ociSke}%</Text>
                </View>
              </View>

              {/* B) DENTAL COMPENSATION */}
              <View style={tw`bg-[#1E88FF]/10 border border-[#1E88FF]/40 rounded-2xl p-4.5 space-y-3`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <View style={tw`flex-row items-center space-x-2`}>
                    <Text style={tw`text-sm`}>🦷</Text>
                    <Text style={tw`text-xs font-black text-white`}>Torque shift load</Text>
                  </View>
                  <View style={tw`bg-[#1E88FF]/20 border border-[#1E88FF]/50 px-2 py-0.5 rounded`}>
                    <Text style={tw`text-[8px] font-black text-white uppercase`}>Dental Compensation</Text>
                  </View>
                </View>
                <View style={tw`w-full h-2 bg-slate-950 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-[#1E88FF]`, { width: `${ociDen}%` }]} />
                </View>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-[9px] text-slate-400 font-bold uppercase`}>Dental Comp. Level</Text>
                  <Text style={tw`text-xs font-black text-[#1E88FF] font-mono`}>{ociDen}%</Text>
                </View>
              </View>

              {/* C) SOFT TISSUE STRAIN */}
              <View style={tw`bg-[#8E44AD]/10 border border-[#8E44AD]/40 rounded-2xl p-4.5 space-y-3`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <View style={tw`flex-row items-center space-x-2`}>
                    <Text style={tw`text-sm`}>👤</Text>
                    <Text style={tw`text-xs font-black text-white`}>Labio-mental tension profile</Text>
                  </View>
                  <View style={tw`bg-[#8E44AD]/20 border border-[#8E44AD]/50 px-2 py-0.5 rounded`}>
                    <Text style={tw`text-[8px] font-black text-white uppercase`}>Soft Tissue Strain</Text>
                  </View>
                </View>
                <View style={tw`w-full h-2 bg-slate-950 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-[#8E44AD]`, { width: `${ociSof}%` }]} />
                </View>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-[9px] text-slate-400 font-bold uppercase`}>Lip/Chin Strain Index</Text>
                  <Text style={tw`text-xs font-black text-[#8E44AD] font-mono`}>{ociSof}%</Text>
                </View>
              </View>

              {/* D) PHYSIOLOGICAL INTERACTION FLOW DIAGRAM */}
              <View style={tw`bg-black/35 p-4 rounded-2xl border border-white/5 space-y-3`}>
                <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Anatomical Interaction Flow</Text>
                
                <View style={tw`space-y-3`}>
                  {/* Step 1 */}
                  <View style={tw`flex-row items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-[9px] font-black text-slate-500 uppercase font-mono`}>Influence Base</Text>
                      <Text style={tw`text-xs font-extrabold text-[#E74C3C]`}>Skeletal Dominance</Text>
                    </View>
                    <View style={tw`mx-2`}>
                      <ArrowRight size={14} color="#E74C3C" />
                    </View>
                    <View style={tw`flex-1 items-end`}>
                      <Text style={tw`text-[9px] font-black text-slate-500 uppercase font-mono`}>Adapting System</Text>
                      <Text style={tw`text-xs font-extrabold text-[#1E88FF]`}>Dental Compensation</Text>
                    </View>
                  </View>

                  {/* Step 2 */}
                  <View style={tw`flex-row items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-[9px] font-black text-slate-500 uppercase font-mono`}>Influence Base</Text>
                      <Text style={tw`text-xs font-extrabold text-[#1E88FF]`}>Dental Displacement</Text>
                    </View>
                    <View style={tw`mx-2`}>
                      <ArrowRight size={14} color="#1E88FF" />
                    </View>
                    <View style={tw`flex-1 items-end`}>
                      <Text style={tw`text-[9px] font-black text-slate-500 uppercase font-mono`}>Adapting System</Text>
                      <Text style={tw`text-xs font-extrabold text-[#8E44AD]`}>Soft Tissue Adaptation</Text>
                    </View>
                  </View>
                </View>
              </View>

            </View>
          )}
        </View>

        {/* SECTION 4: AI RECOMMENDED TREATMENT PATHWAYS */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <Pressable 
            onPress={() => toggleSection('pathways')}
            style={tw`p-5 bg-gradient-to-r from-[#14B8A6]/10 to-black/20 flex-row justify-between items-center border-b border-white/5`}
          >
            <View style={tw`flex-row items-center space-x-2`}>
              <Award size={15} color="#14B8A6" />
              <Text style={tw`text-[11px] font-black text-white uppercase tracking-wider font-mono`}>AI Recommended Treatment Pathways</Text>
            </View>
            {activeSection === 'pathways' ? (
              <ChevronUp size={15} color="#14B8A6" />
            ) : (
              <ChevronDown size={15} color="#14B8A6" />
            )}
          </Pressable>

          {activeSection === 'pathways' && (
            <View style={tw`p-5 space-y-4`}>
              
              {/* 1st option: Recommended by OCI */}
              <View style={tw`bg-[#14B8A6]/5 border border-[#14B8A6]/40 p-5 rounded-2xl space-y-3`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-[10px] font-black text-[#14B8A6] uppercase tracking-widest font-mono`}>🥇 Recommended Plan Option</Text>
                  <View style={tw`bg-[#14B8A6]/10 px-2 py-0.5 rounded border border-[#14B8A6]/25`}>
                    <Text style={tw`text-[8px] text-teal-400 font-mono font-bold uppercase`}>Primary Path</Text>
                  </View>
                </View>
                <View style={tw`space-y-1`}>
                  <Text style={tw`text-sm font-black text-white`}>
                    {selectedAssessment.advanced?.primaryPlanOption || report.primaryPlanOption || 'Orthodontic Camouflage'}
                  </Text>
                </View>
                <View style={tw`flex-row space-x-4 pt-2 border-t border-[#14B8A6]/10`}>
                  <View>
                    <Text style={tw`text-[8px] text-slate-500 uppercase font-mono font-bold`}>Treatment Suitability</Text>
                    <Text style={tw`text-xs font-black text-teal-400 font-mono`}>92%</Text>
                  </View>
                  <View>
                    <Text style={tw`text-[8px] text-slate-500 uppercase font-mono font-bold`}>Prediction Confidence</Text>
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
                    <Text style={tw`text-[8px] text-slate-500 uppercase font-mono font-bold`}>Treatment Suitability</Text>
                    <Text style={tw`text-xs font-extrabold text-slate-300 font-mono`}>75%</Text>
                  </View>
                  <View>
                    <Text style={tw`text-[8px] text-slate-500 uppercase font-mono font-bold`}>Prediction Confidence</Text>
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
                    <Text style={tw`text-[8px] text-slate-500 uppercase font-mono font-bold`}>Treatment Suitability</Text>
                    <Text style={tw`text-xs font-extrabold text-slate-300 font-mono`}>60%</Text>
                  </View>
                  <View>
                    <Text style={tw`text-[8px] text-slate-500 uppercase font-mono font-bold`}>Prediction Confidence</Text>
                    <Text style={tw`text-xs font-extrabold text-slate-400 font-mono`}>75%</Text>
                  </View>
                </View>
              </View>

            </View>
          )}
        </View>

        {/* Biomechanical Decisional Probability Matrices */}
        <View style={tw`flex-col md:flex-row gap-5`}>
          
          {/* Extraction Decision Card */}
          <View style={tw`flex-1 bg-[#0B1226] p-5 rounded-3xl border border-white/5 space-y-2`}>
            <View style={tw`flex-row flex-wrap justify-between items-center gap-2`}>
              <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Biomechanical Extraction Matrix</Text>
              <Text style={tw`px-2.5 py-1 bg-[#1E88FF]/10 text-[#1E88FF] rounded-lg text-[9px] font-black border border-[#1E88FF]/20 text-center flex-wrap max-w-full`}>{report.extractionRecommendation}</Text>
            </View>
            <Text style={tw`text-sm font-black text-white`}>Extraction Probability: {cleanPercent(report.extractionProbability)}</Text>
          </View>

          {/* Surgical Decision Card */}
          <View style={tw`flex-1 bg-[#0B1226] p-5 rounded-3xl border border-white/5 space-y-2`}>
            <View style={tw`flex-row flex-wrap justify-between items-center gap-2`}>
              <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Surgical Correction Matrix</Text>
              <Text style={tw`px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-[9px] font-black border border-purple-500/20 text-center flex-wrap max-w-full`}>{report.surgeryRecommendation}</Text>
            </View>
            <Text style={tw`text-sm font-black text-white`}>Surgical Probability: {cleanPercent(report.surgeryProbability)}</Text>
          </View>
        </View>

        {/* ====================================================
            🧠 OCI CLINICAL INTELLIGENCE ACCORDION CARD
           ==================================================== */}
        <View style={tw`bg-[#0B1226] rounded-[24px] border border-white/5 shadow-xl overflow-hidden`}>
          <Pressable
            onPress={() => {
              if (Platform.OS === 'android') {
                UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
              }
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setClinicalExpanded(!clinicalExpanded);
            }}
            style={tw`p-5 flex-row justify-between items-center bg-black/20`}
          >
            <View style={tw`flex-row items-center space-x-2.5`}>
              <Sparkles size={14} color="#14B8A6" />
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>OCI Clinical Intelligence</Text>
            </View>
            {clinicalExpanded ? (
              <ChevronUp size={14} color="#14B8A6" />
            ) : (
              <ChevronDown size={14} color="#14B8A6" />
            )}
          </Pressable>

          {clinicalExpanded && (
            <View style={tw`p-5 space-y-4 border-t border-white/5`}>
              {/* Diagnosis Reasoning */}
              <View style={tw`space-y-1`}>
                <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Why OCI selected this diagnosis</Text>
                <Text style={tw`text-xs text-slate-300 leading-normal pl-1`}>
                  {isClinicMode ? (
                    `Based on the patient's clinical examination and facial profile, the engine mapped a Skeletal ${selectedAssessment.patientDetails.diagnosis || 'Class I'} sagittal pattern. The vertical growth pattern shows a ${selectedAssessment.ociResult.verticalPattern || 'Normodivergent'} tendency.`
                  ) : (
                    `Based on the patient's skeletal parameters (ANB: ${typeof selectedAssessment.cephalometricInput.anb === 'number' ? selectedAssessment.cephalometricInput.anb : parseFloat(selectedAssessment.cephalometricInput.anb as any) || 2}°, Wits: ${typeof selectedAssessment.cephalometricInput.wits === 'number' ? selectedAssessment.cephalometricInput.wits : parseFloat(selectedAssessment.cephalometricInput.wits as any) || 0}mm), the engine mapped a Skeletal ${selectedAssessment.patientDetails.diagnosis || 'Class I'} sagittal pattern. The vertical growth pattern shows a ${selectedAssessment.ociResult.verticalPattern || 'Normodivergent'} tendency.`
                  )}
                </Text>
              </View>

              {/* Compensation Reasoning */}
              <View style={tw`space-y-1`}>
                <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Why OCI detected these compensations</Text>
                <Text style={tw`text-xs text-slate-300 leading-normal pl-1`}>
                  {isClinicMode ? (
                    `The clinical lower incisor position and upper incisor position demonstrate a ${selectedAssessment.ociResult.compensationLevel || 'moderate'} compensation profile. These features represent the dentoalveolar system's natural effort to mask the underlying skeletal disharmony.`
                  ) : (
                    `The lower incisor sagittal inclination (IMPA: ${typeof selectedAssessment.cephalometricInput.impa === 'number' ? selectedAssessment.cephalometricInput.impa : parseFloat(selectedAssessment.cephalometricInput.impa as any) || 90}°) and upper incisor inclination (U1-SN: ${typeof selectedAssessment.cephalometricInput.u1Sn === 'number' ? selectedAssessment.cephalometricInput.u1Sn : parseFloat(selectedAssessment.cephalometricInput.u1Sn as any) || 104}°) demonstrate a ${selectedAssessment.ociResult.compensationLevel || 'moderate'} compensation profile. These movements represent the dentoalveolar system's natural effort to mask the underlying skeletal disharmony.`
                  )}
                </Text>
              </View>

              {/* Treatment Reasoning */}
              <View style={tw`space-y-1`}>
                <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Why OCI selected this treatment plan</Text>
                <Text style={tw`text-xs text-slate-300 leading-normal pl-1`}>
                  For OCI Score {selectedAssessment.ociResult.totalScore}/10, a {report.surgeryRecommendation === 'Surgical Correction' ? 'presurgical decompensation and orthognathic surgery' : 'conventional orthodontic camouflage'} approach was selected. Extraction planning recommends a {report.extractionRecommendation === 'Extraction' ? 'premolar extraction pattern' : 'non-extraction pattern'} to optimize dental and facial aesthetics.
                </Text>
              </View>

              {/* Risk Factors */}
              <View style={tw`space-y-1`}>
                <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Risk Factors</Text>
                <Text style={tw`text-xs text-slate-300 leading-normal pl-1`}>
                  {selectedAssessment.ociResult.totalScore > 6.0 ? 'Root resorption (high risk due to extensive movement requirements), periodontal compromise (due to thin buccal cortical plate), and anchorage loss.' : 'Minimal risk profile; standard considerations include compliance with elastics and light transient root resorption.'}
                </Text>
              </View>

              {/* Prognosis */}
              <View style={tw`space-y-1`}>
                <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Prognosis</Text>
                <Text style={tw`text-xs text-slate-300 leading-normal pl-1`}>
                  {report.overallPrognosis} ({report.explanationWhy || 'Skeletal and dental parameters are within stable boundaries.'})
                </Text>
              </View>

              {/* Relapse Risk */}
              <View style={tw`space-y-1`}>
                <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Relapse Risk</Text>
                <Text style={tw`text-xs text-slate-300 leading-normal pl-1`}>
                  {report.relapseRisk} ({report.relapseReason || 'Stable post-treatment intercuspation.'})
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Export PDF Button and Core Specialist Credentials Signature (NO LOGOS / NO OCI HEADER TEXT) */}
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

          {/* Specialist Sign-off Seal */}
          <View style={tw`border-t border-white/10 pt-5 w-full flex-col items-center justify-center`}>
            <TextInput
              value={sigText}
              onChangeText={setSigText}
              style={tw`text-sm text-[#14B8A6] font-extrabold italic border-b border-white/15 p-1 text-center w-full max-w-[280px] bg-transparent outline-none`}
            />
            <Text style={tw`text-[8px] text-slate-500 mt-1.5 uppercase tracking-wider font-bold text-center`}>Specialist Sign-off Seal</Text>
          </View>

          {/* Clean Specialist developer signature footer - NO LOGOS */}
          <View style={tw`border-t border-white/10 pt-6 px-4 pb-2 w-full max-w-[600px] mx-auto flex-col items-center justify-center`}>
            <Text style={tw`text-[11px] font-medium text-slate-400 text-center leading-normal`}>
              Clinician Director & Specialist Lead
            </Text>
            <Text style={tw`text-sm font-semibold text-teal-400 text-center mt-1 leading-normal`}>
              Dr. Salman, MDS (Orthodontist)
            </Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}
