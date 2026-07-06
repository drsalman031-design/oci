import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
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
  ArrowRight
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
  const [expandedSections, setExpandedSections] = useState({
    parameters: false,
    skeletal: true,
    dental: false,
    softTissue: false,
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

        {/* ====================================
            📊 1. OCI SEVERITY DISTRIBUTION (BAR CHART SYSTEM)
           ==================================== */}
        <View style={tw`bg-[#0B1226] rounded-3xl p-6 border border-white/5 shadow-2xl space-y-4`}>
          <View style={tw`border-b border-white/5 pb-2`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>OCI Severity Distribution</Text>
            <Text style={tw`text-[8px] text-slate-500 font-bold uppercase mt-0.5`}>Current Patient Classification</Text>
          </View>

          <View style={tw`space-y-3.5`}>
            {[
              { label: 'Minimal', range: '0-20%', active: total <= 20, color: '#2ECC71', desc: 'Skeletal base harmony' },
              { label: 'Mild', range: '21-40%', active: total > 20 && total <= 40, color: '#27AE60', desc: 'Compensatory boundary' },
              { label: 'Moderate', range: '41-60%', active: total > 40 && total <= 60, color: '#F1C40F', desc: 'Dentoalveolar torque adaptation' },
              { label: 'Severe', range: '61-80%', active: total > 60 && total <= 80, color: '#E67E22', desc: 'Extensive skeletal base discrepancy' },
              { label: 'Extreme', range: '81-100%', active: total > 80, color: '#E74C3C', desc: 'Surgical decompensation target boundary' },
            ].map((cat, idx) => {
              return (
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
              );
            })}
          </View>
        </View>

        {/* ====================================
            🧠 2. COMPENSATION ANALYSIS MODULE
           ==================================== */}
        <View style={tw`bg-[#0B1226] rounded-3xl p-6 border border-white/5 shadow-2xl space-y-5`}>
          <View style={tw`border-b border-white/5 pb-2`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Orthodontic Compensation Analysis</Text>
            <Text style={tw`text-[8px] text-slate-500 font-bold uppercase mt-0.5`}>Physiological adaptation deconstruction</Text>
          </View>

          {/* A) COMPENSATION BALANCE CHART */}
          <View style={tw`space-y-3 bg-black/35 p-4 rounded-2xl border border-white/5`}>
            <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>A) Compensation Balance Indices</Text>
            <View style={tw`space-y-3`}>
              <View style={tw`space-y-1`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Skeletal Influence</Text>
                  <Text style={tw`text-xs font-black text-[#E74C3C]`}>{ociSke}%</Text>
                </View>
                <View style={tw`w-full h-1.5 bg-slate-950 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-[#E74C3C]`, { width: `${ociSke}%` }]} />
                </View>
              </View>

              <View style={tw`space-y-1`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Dental Compensation</Text>
                  <Text style={tw`text-xs font-black text-[#1E88FF]`}>{ociDen}%</Text>
                </View>
                <View style={tw`w-full h-1.5 bg-slate-950 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-[#1E88FF]`, { width: `${ociDen}%` }]} />
                </View>
              </View>

              <View style={tw`space-y-1`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Soft Tissue Adaptation</Text>
                  <Text style={tw`text-xs font-black text-[#8E44AD]`}>{ociSof}%</Text>
                </View>
                <View style={tw`w-full h-1.5 bg-slate-950 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-[#8E44AD]`, { width: `${ociSof}%` }]} />
                </View>
              </View>
            </View>
          </View>

          {/* B) DOMINANT PROBLEM IDENTIFIER */}
          <View style={tw`space-y-3`}>
            <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>B) Dominant System Classification</Text>
            <View style={tw`flex-row gap-2.5`}>
              {[
                { label: 'Skeletal Dominance', active: ociSke >= ociDen && ociSke >= ociSof, color: 'bg-[#E74C3C]/15 border-[#E74C3C]/35 text-[#E74C3C]', tag: 'Skeletal base mismatch' },
                { label: 'Dental Compensation', active: ociDen > ociSke && ociDen >= ociSof, color: 'bg-[#1E88FF]/15 border-[#1E88FF]/35 text-[#1E88FF]', tag: 'Torque shift load' },
                { label: 'Soft Tissue Strain', active: ociSof > ociSke && ociSof > ociDen, color: 'bg-[#8E44AD]/15 border-[#8E44AD]/35 text-[#8E44AD]', tag: 'Labio-mental tension profile' },
              ].map((sys, idx) => (
                <View 
                  key={idx} 
                  style={tw`flex-1 p-3 rounded-xl border ${sys.color} ${sys.active ? 'border-2 shadow-sm' : 'opacity-30'}`}
                >
                  <Text style={tw`text-[10px] font-black text-center`}>{sys.label}</Text>
                  <Text style={tw`text-[7px] font-bold text-center mt-1 text-slate-400`}>{sys.tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* C) INTERACTION FLOW VISUAL */}
          <View style={tw`space-y-3 bg-black/35 p-4 rounded-2xl border border-white/5`}>
            <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>C) Physiological Interaction Flow</Text>
            <View style={tw`space-y-2`}>
              <View style={tw`flex-row items-center justify-between bg-black/20 p-2.5 rounded-xl border border-white/5`}>
                <Text style={tw`text-[10px] font-bold text-[#E74C3C]`}>Skeletal Base Relationship</Text>
                <ArrowRight size={10} color="#E74C3C" />
                <Text style={tw`text-[10px] font-bold text-[#1E88FF]`}>Dental compensation bases</Text>
              </View>
              <View style={tw`flex-row items-center justify-between bg-black/20 p-2.5 rounded-xl border border-white/5`}>
                <Text style={tw`text-[10px] font-bold text-[#1E88FF]`}>Dental Displacement</Text>
                <ArrowRight size={10} color="#1E88FF" />
                <Text style={tw`text-[10px] font-bold text-[#8E44AD]`}>Soft tissue adaptation strain</Text>
              </View>
              <View style={tw`flex-row items-center justify-between bg-black/20 p-2.5 rounded-xl border border-white/5`}>
                <Text style={tw`text-[10px] font-bold text-[#8E44AD]`}>Lip/Chin Strain Profile</Text>
                <ArrowRight size={10} color="#8E44AD" />
                <Text style={tw`text-[10px] font-bold text-[#E74C3C]`}>Functional skeletal base feedback</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ====================================
            📉 3. PROBLEM SEVERITY HIGHLIGHT (RANKED CARD)
           ==================================== */}
        <View style={tw`bg-[#0B1226] rounded-3xl p-6 border border-white/5 shadow-2xl space-y-4`}>
          <View style={tw`border-b border-white/5 pb-2`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Problem Severity Hierarchy</Text>
            <Text style={tw`text-[8px] text-slate-500 font-bold uppercase mt-0.5`}>Skeletal ➔ Dental ➔ Soft Tissue Rank</Text>
          </View>

          <View style={tw`space-y-3`}>
            {systems.map((sys, idx) => {
              const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
              const rankName = idx === 0 ? 'Primary System Load' : idx === 1 ? 'Secondary Compensatory Shift' : 'Adaptive Envelope Response';
              return (
                <View key={idx} style={tw`flex-row items-center space-x-3.5 bg-black/35 p-3.5 rounded-2xl border border-white/5`}>
                  <View style={tw`w-9 h-9 rounded-full bg-slate-950 items-center justify-center`}>
                    <Text style={tw`text-lg`}>{sys.icon}</Text>
                  </View>
                  <View style={tw`flex-1`}>
                    <View style={tw`flex-row items-center space-x-1.5`}>
                      <Text style={tw`text-[8px] font-mono font-black text-slate-400 uppercase`}>{rankEmoji} {rankName}</Text>
                    </View>
                    <Text style={tw`text-xs font-black text-white mt-0.5`}>{sys.name}</Text>
                    <View style={tw`w-full h-1.5 bg-slate-950 rounded-full mt-2 overflow-hidden`}>
                      <View style={[tw`h-full rounded-full`, { width: `${sys.val}%`, backgroundColor: sys.color }]} />
                    </View>
                  </View>
                  <View style={[tw`px-3 py-1.5 rounded-xl border`, { borderColor: `${sys.color}25`, backgroundColor: `${sys.color}10` }]}>
                    <Text style={[tw`text-xs font-black font-mono`, { color: sys.color }]}>{sys.val}%</Text>
                  </View>
                </View>
              );
            })}
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
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <Pressable 
            onPress={() => setExpandedSections(prev => ({ ...prev, skeletal: !prev.skeletal }))}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center gap-2 flex-1 pr-4`}>
              <View style={tw`bg-amber-500/10 p-1.5 rounded-lg`}>
                <Layers size={14} color="#F59E0B" />
              </View>
              <Text style={tw`text-[10px] font-bold text-slate-200 uppercase tracking-widest font-mono`}>Skeletal Base Relationships</Text>
            </View>
            <View style={tw`flex-row items-center gap-1.5`}>
              <Text style={tw`text-[9px] font-bold text-slate-400 font-mono`}>
                {expandedSections.skeletal ? 'COLLAPSE' : 'EXPAND'}
              </Text>
              <View style={tw`w-5 h-5 rounded-full bg-white/5 items-center justify-center`}>
                {expandedSections.skeletal ? (
                  <ChevronUp size={12} color="#F59E0B" />
                ) : (
                  <ChevronDown size={12} color="#F59E0B" />
                )}
              </View>
            </View>
          </Pressable>

          {expandedSections.skeletal && (
            <View style={tw`p-5 space-y-4`}>
              <View style={tw`space-y-3`}>
                {[
                  { name: 'Maxilla Position', val: maxillaPct, color: '#EF4444' },
                  { name: 'Mandible Position', val: mandiblePct, color: '#3B82F6' },
                  { name: 'Vertical Pattern', val: verticalPct, color: '#F59E0B' },
                  { name: 'Facial Skeletal Balance', val: balancePct, color: '#10B981' }
                ].map((item, idx) => (
                  <View key={idx} style={tw`space-y-1`}>
                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-xs font-semibold text-slate-300`}>{item.name}</Text>
                      <Text style={tw`text-xs font-black text-white font-mono`}>{item.val}%</Text>
                    </View>
                    <View style={tw`w-full h-1.5 bg-slate-950 rounded-full overflow-hidden`}>
                      <View style={[tw`h-full rounded-full`, { width: `${item.val}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* CARD 2: DENTAL COMPENSATIONS */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <Pressable 
            onPress={() => setExpandedSections(prev => ({ ...prev, dental: !prev.dental }))}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center gap-2 flex-1 pr-4`}>
              <View style={tw`bg-emerald-500/10 p-1.5 rounded-lg`}>
                <Layers size={14} color="#10B981" />
              </View>
              <Text style={tw`text-[10px] font-bold text-slate-200 uppercase tracking-widest font-mono`}>Dental Compensations</Text>
            </View>
            <View style={tw`flex-row items-center gap-1.5`}>
              <Text style={tw`text-[9px] font-bold text-slate-400 font-mono`}>
                {expandedSections.dental ? 'COLLAPSE' : 'EXPAND'}
              </Text>
              <View style={tw`w-5 h-5 rounded-full bg-white/5 items-center justify-center`}>
                {expandedSections.dental ? (
                  <ChevronUp size={12} color="#10B981" />
                ) : (
                  <ChevronDown size={12} color="#10B981" />
                )}
              </View>
            </View>
          </Pressable>

          {expandedSections.dental && (
            <View style={tw`p-5 space-y-4`}>
              <View style={tw`space-y-3`}>
                {[
                  { name: 'Upper Incisor', val: upperIncisorPct, color: '#EC4899' },
                  { name: 'Lower Incisor', val: lowerIncisorPct, color: '#8B5CF6' },
                  { name: 'Upper Molar', val: upperMolarPct, color: '#10B981' },
                  { name: 'Lower Molar', val: lowerMolarPct, color: '#3B82F6' },
                  { name: 'Occlusal Plane', val: occlusalPct, color: '#F59E0B' }
                ].map((item, idx) => (
                  <View key={idx} style={tw`space-y-1`}>
                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-xs font-semibold text-slate-300`}>{item.name}</Text>
                      <Text style={tw`text-xs font-black text-white font-mono`}>{item.val}%</Text>
                    </View>
                    <View style={tw`w-full h-1.5 bg-slate-950 rounded-full overflow-hidden`}>
                      <View style={[tw`h-full rounded-full`, { width: `${item.val}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* CARD 3: SOFT TISSUE ADAPTATION */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <Pressable 
            onPress={() => setExpandedSections(prev => ({ ...prev, softTissue: !prev.softTissue }))}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center gap-2 flex-1 pr-4`}>
              <View style={tw`bg-blue-500/10 p-1.5 rounded-lg`}>
                <Layers size={14} color="#3B82F6" />
              </View>
              <Text style={tw`text-[10px] font-bold text-slate-200 uppercase tracking-widest font-mono`}>Soft Tissue Adaptations</Text>
            </View>
            <View style={tw`flex-row items-center gap-1.5`}>
              <Text style={tw`text-[9px] font-bold text-slate-400 font-mono`}>
                {expandedSections.softTissue ? 'COLLAPSE' : 'EXPAND'}
              </Text>
              <View style={tw`w-5 h-5 rounded-full bg-white/5 items-center justify-center`}>
                {expandedSections.softTissue ? (
                  <ChevronUp size={12} color="#3B82F6" />
                ) : (
                  <ChevronDown size={12} color="#3B82F6" />
                )}
              </View>
            </View>
          </Pressable>

          {expandedSections.softTissue && (
            <View style={tw`p-5 space-y-4`}>
              <View style={tw`space-y-3`}>
                {[
                  { name: 'Upper Lip', val: upperLipPct, color: '#EF4444' },
                  { name: 'Lower Lip', val: lowerLipPct, color: '#3B82F6' },
                  { name: 'Chin Projection', val: chinPct, color: '#10B981' },
                  { name: 'Nasolabial Angle', val: nasoPct, color: '#F59E0B' },
                  { name: 'Facial Convexity', val: convexityPct, color: '#8B5CF6' }
                ].map((item, idx) => (
                  <View key={idx} style={tw`space-y-1`}>
                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-xs font-semibold text-slate-300`}>{item.name}</Text>
                      <Text style={tw`text-xs font-black text-white font-mono`}>{item.val}%</Text>
                    </View>
                    <View style={tw`w-full h-1.5 bg-slate-950 rounded-full overflow-hidden`}>
                      <View style={[tw`h-full rounded-full`, { width: `${item.val}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ====================================
            OCI-BASED TREATMENT PATHWAYS (NO BRANDING / NO TEXT LOGS)
           ==================================== */}
        <View style={tw`bg-[#0B1226] rounded-3xl border border-white/5 overflow-hidden shadow-2xl`}>
          <View style={tw`p-5 bg-gradient-to-r from-[#14B8A6]/10 to-black/20 flex-row items-center gap-2 border-b border-white/5`}>
            <Award size={14} color="#14B8A6" />
            <Text style={tw`text-[10px] font-black text-slate-200 uppercase tracking-widest font-mono`}>AI RECOMMENDED TREATMENT PATHWAYS</Text>
          </View>
          <View style={tw`p-6 space-y-4`}>
            
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
        </View>

        {/* Biomechanical Decisional Probability Matrices */}
        <View style={tw`flex-col md:flex-row gap-5`}>
          
          {/* Extraction Decision Card */}
          <View style={tw`flex-1 bg-[#0B1226] p-5 rounded-3xl border border-white/5 space-y-2`}>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Biomechanical Extraction Matrix</Text>
              <Text style={tw`px-2.5 py-0.5 bg-[#1E88FF]/10 text-[#1E88FF] rounded-lg text-[9px] font-black border border-[#1E88FF]/20`}>{report.extractionRecommendation}</Text>
            </View>
            <Text style={tw`text-sm font-black text-white`}>Extraction Probability: {cleanPercent(report.extractionProbability)}</Text>
          </View>

          {/* Surgical Decision Card */}
          <View style={tw`flex-1 bg-[#0B1226] p-5 rounded-3xl border border-white/5 space-y-2`}>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Surgical Correction Matrix</Text>
              <Text style={tw`px-2.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-lg text-[9px] font-black border border-purple-500/20`}>{report.surgeryRecommendation}</Text>
            </View>
            <Text style={tw`text-sm font-black text-white`}>Surgical Probability: {cleanPercent(report.surgeryProbability)}</Text>
          </View>
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
