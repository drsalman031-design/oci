import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Award, 
  Sparkles, 
  CheckCircle,
  FileText,
  BookmarkPlus,
  Cpu,
  Edit2,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react-native';
import MarkdownRenderer from './MarkdownRenderer';
import { generateClinicalSummary, generateLocalClinicalSynthesis } from '../lib/gemini';
import tw from 'twrnc';
import { OciResult, CephalometricInput, PatientDetails } from '../types';
import SvgCharts from './SvgCharts';

interface ResultsDashboardProps {
  patientDetails: PatientDetails;
  cephalometricInput: CephalometricInput;
  ociResult: OciResult;
  onSaveAssessment: (aiSummary: string) => void;
  onOpenPdf: (aiSummary: string) => void;
  onBack: () => void;
  mode?: 'clinic' | 'ceph' | 'turbo';
}

export default function ResultsDashboard({
  patientDetails,
  cephalometricInput,
  ociResult,
  onSaveAssessment,
  onOpenPdf,
  onBack,
  mode = 'turbo'
}: ResultsDashboardProps) {
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activePillarTab, setActivePillarTab] = useState<'skeletal' | 'dental' | 'softTissue'>('skeletal');
  const [activePlanTab, setActivePlanTab] = useState<'orthopedic' | 'camouflage' | 'surgical' | 'retention'>('camouflage');

  // Load persisted tabs on mount
  useEffect(() => {
    async function loadTabs() {
      try {
        const pillar = await AsyncStorage.getItem('oci_rd_active_pillar_tab');
        const plan = await AsyncStorage.getItem('oci_rd_active_plan_tab');
        if (pillar) setActivePillarTab(pillar as any);
        if (plan) setActivePlanTab(plan as any);
      } catch (err) {
        console.log('Error loading rd tabs:', err);
      }
    }
    loadTabs();
  }, []);

  // Save tabs on change
  useEffect(() => {
    try {
      AsyncStorage.setItem('oci_rd_active_pillar_tab', activePillarTab);
    } catch (err) {
      console.log('Error saving rd active pillar tab:', err);
    }
  }, [activePillarTab]);

  useEffect(() => {
    try {
      AsyncStorage.setItem('oci_rd_active_plan_tab', activePlanTab);
    } catch (err) {
      console.log('Error saving rd active plan tab:', err);
    }
  }, [activePlanTab]);

  // Fetch AI Clinical Summary on mount (fallback to local synthesis) and auto-save it
  useEffect(() => {
    async function fetchAiSummary() {
      setLoadingSummary(true);
      try {
        const summary = await generateClinicalSummary(patientDetails, cephalometricInput, ociResult);
        setAiSummary(summary);
        setEditedSummary(summary);
        onSaveAssessment(summary);
      } catch (err) {
        console.warn('AI API offline or restricted, using local synthesis:', err);
        const localSynthesis = generateLocalClinicalSynthesis(patientDetails, cephalometricInput, ociResult);
        setAiSummary(localSynthesis);
        setEditedSummary(localSynthesis);
        onSaveAssessment(localSynthesis);
      } finally {
        setLoadingSummary(false);
      }
    }

    fetchAiSummary();
  }, [patientDetails, cephalometricInput, ociResult]);

  // Auto-save editedSummary when it changes (debounced)
  useEffect(() => {
    if (!patientDetails || !cephalometricInput || !ociResult || !editedSummary) return;
    
    // Guard against running auto-save on initial mount load
    if (editedSummary === aiSummary) return;

    setIsSaving(true);
    const timer = setTimeout(() => {
      onSaveAssessment(editedSummary);
      setIsSaving(false);
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(timer);
  }, [editedSummary, aiSummary]);

  const handleSave = () => {
    onSaveAssessment(editedSummary);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const getScoreColor = (score: number) => {
    if (score <= 20) return 'text-[#10B981]';
    if (score <= 40) return 'text-[#14B8A6]';
    if (score <= 60) return 'text-[#F59E0B]';
    if (score <= 80) return 'text-orange-400';
    return 'text-[#EF4444]';
  };

  const getGaugeBorderColor = (score: number) => {
    if (score <= 20) return 'border-[#10B981]/40';
    if (score <= 40) return 'border-[#14B8A6]/40';
    if (score <= 60) return 'border-[#F59E0B]/40';
    if (score <= 80) return 'border-orange-500/40';
    return 'border-[#EF4444]/40';
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Title / Action Header Card */}
        <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
          <View style={tw`space-y-1`}>
            <View style={tw`flex-row items-center space-x-2 mb-1.5`}>
              <View style={tw`flex-row items-center bg-teal-500/15 border border-teal-500/30 px-2.5 py-0.5 rounded-full`}>
                <Sparkles size={10} color="#22D3EE" style={tw`mr-1`} />
                <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-wider font-mono`}>
                  {patientDetails.analysisMode === 'clinic' ? 'Clinic Mode' : patientDetails.analysisMode === 'ceph' ? 'Ceph Mode' : 'OCI Turbo Mode'}
                </Text>
              </View>
              <View style={tw`flex-row items-center bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-full`}>
                <Text style={tw`text-indigo-300 text-[8px] font-black uppercase tracking-wider font-mono`}>
                  Confidence: {patientDetails.analysisMode === 'clinic' ? '85%' : patientDetails.analysisMode === 'ceph' ? '90%' : '98%'}
                </Text>
              </View>
            </View>
            <Text style={tw`text-xl font-black text-white tracking-tight`}>
              Case: {patientDetails.name || 'Anonymous'}
            </Text>
            <Text style={tw`text-xs text-slate-400`}>Review instant computational compensations & diagnostic limits</Text>
          </View>
          
          <View style={tw`space-y-2.5 w-full`}>
            <View style={tw`flex-row gap-2.5 w-full`}>
              <Pressable
                onPress={onBack}
                style={({ pressed }) => [
                  tw`flex-1 py-3.5 bg-white/5 border border-white/10 rounded-2xl items-center`,
                  pressed ? tw`bg-white/10` : null
                ]}
              >
                <Text style={tw`text-xs font-black text-slate-300 uppercase tracking-widest`}>Modify Input</Text>
              </Pressable>

              <Pressable
                disabled={true}
                style={tw`flex-row items-center justify-center flex-1 py-3.5 ${isSaving ? 'bg-amber-600/10 border-amber-500/20' : 'bg-emerald-600/10 border-emerald-500/20'} rounded-2xl border`}
              >
                {isSaving ? (
                  <>
                    <ActivityIndicator size="small" color="#F59E0B" style={tw`mr-1.5`} />
                    <Text style={tw`text-xs font-black text-amber-400 uppercase tracking-widest`}>Saving...</Text>
                  </>
                ) : (
                  <>
                    <CheckCircle size={13} color="#10B981" style={tw`mr-1.5`} />
                    <Text style={tw`text-xs font-black text-emerald-400 uppercase tracking-widest`}>Auto-Saved</Text>
                  </>
                )}
              </Pressable>
            </View>

            <Pressable
              onPress={() => onOpenPdf(editedSummary)}
              style={({ pressed }) => [
                tw`flex-row items-center justify-center w-full py-4 bg-cyan-500/10 border border-cyan-500/25 rounded-2xl shadow-md`,
                pressed ? tw`bg-[#22D3EE]/20` : null
              ]}
            >
              <FileText size={14} color="#22D3EE" style={tw`mr-2`} />
              <Text style={tw`text-xs font-black text-cyan-400 uppercase tracking-widest`}>
                {mode === 'clinic' ? 'Export Clinical Report (PDF)' : mode === 'ceph' ? 'Export Cephalometric Report (PDF)' : 'Export OCI Turbo Report (PDF)'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Circular Gauge and Severity Scale */}
        <View style={tw`flex-col space-y-6`}>
          
          {/* Circular Score Gauge */}
          <View style={tw`w-full bg-[#0B1020]/80 p-6 rounded-[28px] border border-white/5 shadow-2xl items-center justify-center relative overflow-hidden`}>
            {/* Ambient background glow inside the gauge */}
            <View style={tw`absolute w-40 h-40 rounded-full bg-teal-500/5 blur-3xl`} />
            
            <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 text-center font-mono`}>
              Orthodontic Compensation Index
            </Text>
            
            <View style={tw`w-40 h-40 items-center justify-center bg-black/40 rounded-full border-4 ${getGaugeBorderColor(ociResult.totalScore)} relative shadow-inner`}>
              <Text style={tw`text-4xl font-black font-mono tracking-tighter ${getScoreColor(ociResult.totalScore)}`}>
                {ociResult.totalScore}%
              </Text>
              <Text style={tw`text-[9px] text-slate-400 font-mono font-bold mt-1 uppercase tracking-widest`}>Tilt Index</Text>
            </View>

            <Text style={tw`text-lg font-black text-white mt-6 text-center`}>
              {ociResult.interpretation}
            </Text>
            <Text style={tw`text-xs text-slate-300 mt-2 text-center leading-relaxed px-4`}>
              Incisor coordinates display compensation levels masking underlying skeletal sagittal discrepancies.
            </Text>
          </View>

          {/* Recommendations and Severity Indicators */}
          <View style={tw`w-full bg-[#0B1020]/80 p-6 rounded-[28px] border border-white/5 shadow-2xl space-y-5`}>
            <View style={tw`space-y-4`}>
              <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2.5 font-mono`}>
                Clinical Interpretation Severity Scale
              </Text>

              {/* Severity tier blocks */}
              <View style={tw`flex-row space-x-1 justify-between`}>
                {[
                  { range: '0-20', label: 'Minimal', color: 'bg-emerald-500', active: ociResult.totalScore <= 20 },
                  { range: '21-40', label: 'Mild', color: 'bg-teal-500', active: ociResult.totalScore > 20 && ociResult.totalScore <= 40 },
                  { range: '41-60', label: 'Mod', color: 'bg-amber-500', active: ociResult.totalScore > 40 && ociResult.totalScore <= 60 },
                  { range: '61-80', label: 'Sev', color: 'bg-orange-500', active: ociResult.totalScore > 60 && ociResult.totalScore <= 80 },
                  { range: '81-100', label: 'Ext', color: 'bg-rose-500', active: ociResult.totalScore > 80 }
                ].map((tier, idx) => (
                  <View 
                    key={idx} 
                    style={tw`flex-1 py-2 rounded-xl border items-center ${
                      tier.active 
                        ? `${tier.color} border-transparent shadow-lg` 
                        : 'bg-black/30 border-white/5'
                    }`}
                  >
                    <Text style={tw`text-[8px] font-black uppercase tracking-wider ${tier.active ? 'text-white' : 'text-slate-500'}`}>
                      {tier.label}
                    </Text>
                    <Text style={tw`text-[7px] font-mono mt-0.5 ${tier.active ? 'text-white/80' : 'text-slate-500'}`}>
                      {tier.range}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Algorithmic Clinical recommendation card */}
              <View style={tw`bg-teal-500/5 border border-teal-500/15 p-4 rounded-2xl flex-row items-start space-x-3`}>
                <Award size={16} color="#14B8A6" style={tw`mr-1.5 mt-0.5 shrink-0`} />
                <View style={tw`flex-1`}>
                  <Text style={tw`font-extrabold text-xs text-white uppercase tracking-wide`}>
                    Algorithmic Recommendation
                  </Text>
                  <Text style={tw`text-[11px] text-slate-300 leading-relaxed mt-1.5`}>
                    {ociResult.recommendation}
                  </Text>
                </View>
              </View>
            </View>

            <View style={tw`flex-row items-start space-x-2`}>
              <Info size={11} color="#64748b" style={tw`mt-0.5 shrink-0`} />
              <Text style={tw`text-[9px] text-slate-500 italic leading-relaxed`}>
                This index evaluates sagittal dental compensation. Treatment pathways must also integrate vertical profile esthetics, soft-tissue contours, TMJ health, and patient consent.
              </Text>
            </View>
          </View>

        </View>

        {/* Unified OCI 3-Pillar Synthesis Section */}
          {(() => {
            const skeletalScoreObj = ociResult.categoryScores.find(c => c.name.includes('Skeletal')) || { score: 0, maxScore: 20, details: '' };
            const maxDentalScoreObj = ociResult.categoryScores.find(c => c.name.includes('Maxillary Dental')) || { score: 0, maxScore: 15, details: '' };
            const mandDentalScoreObj = ociResult.categoryScores.find(c => c.name.includes('Mandibular Dental')) || { score: 0, maxScore: 20, details: '' };
            const interincisalScoreObj = ociResult.categoryScores.find(c => c.name.includes('Interincisal')) || { score: 0, maxScore: 10, details: '' };
            const ojObScoreObj = ociResult.categoryScores.find(c => c.name.includes('Overjet')) || { score: 0, maxScore: 10, details: '' };
            const softTissueScoreObj = ociResult.categoryScores.find(c => c.name.includes('Soft Tissue')) || { score: 0, maxScore: 15, details: '' };
            const harmonyScoreObj = ociResult.categoryScores.find(c => c.name.includes('Harmony')) || { score: 0, maxScore: 10, details: '' };

            const totalDentalScore = maxDentalScoreObj.score + mandDentalScoreObj.score + interincisalScoreObj.score + ojObScoreObj.score;
            const maxDentalScore = 55;

            const anbVal = cephalometricInput.anb !== '' ? Number(cephalometricInput.anb) : 2;
            const isClassIII = anbVal < 0;
            const isClassII = anbVal > 4.5;
            const isClassI = !isClassIII && !isClassII;
            const ageVal = Number(patientDetails.age) || 12;
            const isGrowing = ageVal <= 13;

            return (
              <View style={tw`space-y-6`}>
                {/* 3 Pillars Card */}
                <View style={tw`w-full bg-[#0B1020]/80 p-6 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
                  <View style={tw`border-b border-white/5 pb-3`}>
                    <Text style={tw`text-[11px] font-black text-teal-400 uppercase tracking-widest font-mono`}>
                      Unified OCI Pillar Synthesis
                    </Text>
                    <Text style={tw`text-[10px] text-slate-400 mt-1`}>
                      Skeletal, Dental, and Soft Tissue components contributing to OCI score ({ociResult.totalScore}%)
                    </Text>
                  </View>

                  {/* 3 Pillar Tabs */}
                  <View style={tw`flex-row bg-black/40 p-1 rounded-xl`}>
                    {[
                      { id: 'skeletal', label: 'Skeletal (20%)', score: `${skeletalScoreObj.score}/20` },
                      { id: 'dental', label: 'Dental (55%)', score: `${totalDentalScore}/55` },
                      { id: 'softTissue', label: 'Soft Tissue (15%)', score: `${softTissueScoreObj.score}/15` }
                    ].map((tab) => (
                      <Pressable
                        key={tab.id}
                        onPress={() => setActivePillarTab(tab.id as any)}
                        style={tw`flex-1 py-2 rounded-lg items-center ${activePillarTab === tab.id ? 'bg-[#14B8A6]' : ''}`}
                      >
                        <Text style={tw`text-[9px] font-black uppercase ${activePillarTab === tab.id ? 'text-white' : 'text-slate-400'}`}>
                          {tab.label.split(' ')[0]}
                        </Text>
                        <Text style={tw`text-[8px] font-mono mt-0.5 ${activePillarTab === tab.id ? 'text-white/80' : 'text-slate-500'}`}>
                          {tab.score}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Tab Contents */}
                  {activePillarTab === 'skeletal' && (
                    <View style={tw`space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5`}>
                      <View style={tw`flex-row justify-between items-center`}>
                        <Text style={tw`text-xs font-bold text-white`}>Skeletal Discrepancy Factor</Text>
                        <Text style={tw`text-xs font-black font-mono text-teal-400`}>{skeletalScoreObj.score} / 20 pts</Text>
                      </View>
                      
                      {/* Progress bar */}
                      <View style={tw`w-full h-1.5 bg-black/40 rounded-full overflow-hidden`}>
                        <View style={[tw`h-full bg-teal-400`, { width: `${(skeletalScoreObj.score / 20) * 100}%` }]} />
                      </View>

                      <View style={tw`space-y-2 pt-1`}>
                        {[
                          { name: 'ANB angle', val: cephalometricInput.anb !== '' ? `${cephalometricInput.anb}°` : '2°', norm: '0° to 4°', desc: 'Skeletal Jaw Relationship' },
                          { name: 'Wits Appraisal', val: cephalometricInput.wits !== '' ? `${cephalometricInput.wits} mm` : '0 mm', norm: '-2 to 2 mm', desc: 'A-B Sagittal Discrepancy' },
                          { name: 'SNA / SNB', val: `${cephalometricInput.sna || 82}° / ${cephalometricInput.snb || 80}°`, norm: '82° / 80°', desc: 'Maxillary & Mandibular baselines' },
                          { name: 'FMA (Vertical)', val: cephalometricInput.fma !== '' ? `${cephalometricInput.fma}°` : '25°', norm: '21° to 29°', desc: 'Vertical jaw growth angle' }
                        ].map((item, i) => (
                          <View key={i} style={tw`flex-row justify-between items-center bg-black/30 px-3 py-2 rounded-xl`}>
                            <View>
                              <Text style={tw`text-[10px] font-bold text-slate-300`}>{item.name}</Text>
                              <Text style={tw`text-[8px] text-slate-500`}>{item.desc}</Text>
                            </View>
                            <View style={tw`items-end`}>
                              <Text style={tw`text-xs font-bold text-slate-200 font-mono`}>{item.val}</Text>
                              <Text style={tw`text-[8px] text-[#22D3EE] font-mono`}>Norm: {item.norm}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {activePillarTab === 'dental' && (
                    <View style={tw`space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5`}>
                      <View style={tw`flex-row justify-between items-center`}>
                        <Text style={tw`text-xs font-bold text-white`}>Dentoalveolar Dental Factor</Text>
                        <Text style={tw`text-xs font-black font-mono text-teal-400`}>{totalDentalScore} / 55 pts</Text>
                      </View>

                      {/* Progress bar */}
                      <View style={tw`w-full h-1.5 bg-black/40 rounded-full overflow-hidden`}>
                        <View style={[tw`h-full bg-cyan-400`, { width: `${(totalDentalScore / 55) * 100}%` }]} />
                      </View>

                      <View style={tw`space-y-2 pt-1`}>
                        {[
                          { name: 'U1-SN angle', val: cephalometricInput.u1Sn !== '' ? `${cephalometricInput.u1Sn}°` : '104°', norm: '99° to 109°', desc: 'Upper incisor position' },
                          { name: 'IMPA (L1-MP)', val: cephalometricInput.impa !== '' ? `${cephalometricInput.impa}°` : '90°', norm: '85° to 95°', desc: 'Lower incisor tilt baseline' },
                          { name: 'Interincisal Angle', val: cephalometricInput.interincisalAngle !== '' ? `${cephalometricInput.interincisalAngle}°` : '135°', norm: '130° to 140°', desc: 'Relative incisor alignment' },
                          { name: 'Overjet & Overbite', val: `${cephalometricInput.overjet || 2.5}mm / ${cephalometricInput.overbite || 2.5}mm`, norm: '2.5mm / 2.5mm', desc: 'Anterior dental overlap' }
                        ].map((item, i) => (
                          <View key={i} style={tw`flex-row justify-between items-center bg-black/30 px-3 py-2 rounded-xl`}>
                            <View>
                              <Text style={tw`text-[10px] font-bold text-slate-300`}>{item.name}</Text>
                              <Text style={tw`text-[8px] text-slate-500`}>{item.desc}</Text>
                            </View>
                            <View style={tw`items-end`}>
                              <Text style={tw`text-xs font-bold text-slate-200 font-mono`}>{item.val}</Text>
                              <Text style={tw`text-[8px] text-[#22D3EE] font-mono`}>Norm: {item.norm}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {activePillarTab === 'softTissue' && (
                    <View style={tw`space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5`}>
                      <View style={tw`flex-row justify-between items-center`}>
                        <Text style={tw`text-xs font-bold text-white`}>Soft Tissue Esthetics Factor</Text>
                        <Text style={tw`text-xs font-black font-mono text-teal-400`}>{softTissueScoreObj.score} / 15 pts</Text>
                      </View>

                      {/* Progress bar */}
                      <View style={tw`w-full h-1.5 bg-black/40 rounded-full overflow-hidden`}>
                        <View style={[tw`h-full bg-rose-400`, { width: `${(softTissueScoreObj.score / 15) * 100}%` }]} />
                      </View>

                      <View style={tw`space-y-2 pt-1`}>
                        {[
                          { name: 'Upper Lip to E-Line', val: cephalometricInput.upperLipELine !== '' ? `${cephalometricInput.upperLipELine} mm` : '-2 mm', norm: '-4 to 0 mm', desc: 'Upper lip projection' },
                          { name: 'Lower Lip to E-Line', val: cephalometricInput.lowerLipELine !== '' ? `${cephalometricInput.lowerLipELine} mm` : '0 mm', norm: '-2 to 2 mm', desc: 'Lower lip projection' },
                          { name: 'Nasolabial Angle', val: cephalometricInput.nasolabialAngle !== '' ? `${cephalometricInput.nasolabialAngle}°` : '102°', norm: '94° to 110°', desc: 'Subnasal contour' },
                          { name: 'Facial Convexity', val: cephalometricInput.facialConvexity !== '' ? `${cephalometricInput.facialConvexity}°` : '12°', norm: '8° to 16°', desc: 'General aesthetic profile' }
                        ].map((item, i) => (
                          <View key={i} style={tw`flex-row justify-between items-center bg-black/30 px-3 py-2 rounded-xl`}>
                            <View>
                              <Text style={tw`text-[10px] font-bold text-slate-300`}>{item.name}</Text>
                              <Text style={tw`text-[8px] text-slate-500`}>{item.desc}</Text>
                            </View>
                            <View style={tw`items-end`}>
                              <Text style={tw`text-xs font-bold text-slate-200 font-mono`}>{item.val}</Text>
                              <Text style={tw`text-[8px] text-[#22D3EE] font-mono`}>Norm: {item.norm}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Formula Breakdown Indicator */}
                  <View style={tw`bg-teal-500/5 border border-teal-500/10 p-3 rounded-xl flex-row items-center justify-between`}>
                    <Text style={tw`text-[9px] font-mono text-slate-400`}>
                      OCI = Skeletal ({skeletalScoreObj.score}) + Dental ({totalDentalScore}) + Soft Tissue ({softTissueScoreObj.score}) + Harmony ({harmonyScoreObj.score})
                    </Text>
                    <Text style={tw`text-xs font-black font-mono text-teal-400`}>= {ociResult.totalScore}%</Text>
                  </View>
                </View>

                {/* Algorithmic treatment plan based on compiled scores */}
                <View style={tw`w-full bg-[#0B1020]/80 p-6 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
                  <View style={tw`border-b border-white/5 pb-3`}>
                    <View style={tw`flex-row items-center`}>
                      <Zap size={14} color="#14B8A6" style={tw`mr-2`} />
                      <Text style={tw`text-[11px] font-black text-white uppercase tracking-widest font-mono`}>
                        Automated Biomechanics Treatment Plan
                      </Text>
                    </View>
                    <Text style={tw`text-[10px] text-slate-400 mt-1`}>
                      Treatment phases triggered by OCI limits, patient age ({patientDetails.age || 'N/A'}y), and Skeletal Class {isClassIII ? 'III' : isClassII ? 'II' : 'I'} profile.
                    </Text>
                  </View>

                  {/* Plan Tabs */}
                  <View style={tw`flex-row bg-black/40 p-1 rounded-xl`}>
                    {[
                      { id: 'orthopedic', label: 'Orthopedic', active: isGrowing && !isClassI },
                      { id: 'camouflage', label: 'Camouflage', active: ociResult.totalScore <= 60 },
                      { id: 'surgical', label: 'Surgical', active: ociResult.totalScore > 60 },
                      { id: 'retention', label: 'Retention', active: true }
                    ].map((tab) => {
                      const isSelected = activePlanTab === tab.id;
                      return (
                        <Pressable
                          key={tab.id}
                          onPress={() => setActivePlanTab(tab.id as any)}
                          style={tw`flex-1 py-2 rounded-lg items-center ${isSelected ? 'bg-teal-500' : ''}`}
                        >
                          <Text style={tw`text-[8px] font-black uppercase tracking-tighter ${isSelected ? 'text-white' : tab.active ? 'text-slate-300' : 'text-slate-500'}`}>
                            {tab.label}
                          </Text>
                          {tab.active && !isSelected && (
                            <View style={tw`w-1 h-1 bg-teal-400 rounded-full mt-0.5`} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Plan Contents */}
                  {activePlanTab === 'orthopedic' && (
                    <View style={tw`space-y-3`}>
                      <View style={tw`bg-teal-500/5 p-4 rounded-2xl border border-teal-500/15`}>
                        <Text style={tw`text-[9px] font-black text-teal-400 uppercase tracking-widest font-mono`}>
                          Growth Modification Orthopedics ({isGrowing ? 'Highly Indicated' : 'Completed / Contraindicated'})
                        </Text>
                        <Text style={tw`text-xs text-slate-200 mt-2 leading-relaxed`}>
                          {isClassIII 
                            ? 'Skeletal Class III growth modification is indicated using a Protraction Face Mask paired with Rapid Maxillary Expansion (RME) or BAMP (Bone-Anchored Maxillary Protraction) to guide circummaxillary suture growth.' 
                            : isClassII 
                            ? 'Skeletal Class II growth modification is indicated using dynamic myofunctional orthopedic appliances (e.g., Twin Block or Herbst Appliance) to stimulate mandibular advancement during peak adolescent growth (CVMS 3).'
                            : 'Conventional orthodontic mechanics. No major skeletal orthopedic modification is indicated.'
                          }
                        </Text>
                        {!isGrowing && (
                          <View style={tw`mt-3 p-2 bg-rose-500/10 rounded-xl border border-rose-500/20`}>
                            <Text style={tw`text-[9px] font-bold text-rose-400 font-mono`}>
                              ⚠️ SKELETAL AGE WARNING: Patient is {patientDetails.age}yo. Orthopedic suture correction is typically ineffective post-pubertal. Dentoalveolar camouflage or orthognathic surgery is indicated.
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {activePlanTab === 'camouflage' && (
                    <View style={tw`space-y-3`}>
                      <View style={tw`bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/15 space-y-3.5`}>
                        <View>
                          <Text style={tw`text-[9px] font-black text-cyan-400 uppercase tracking-widest font-mono`}>
                            Extraction Blueprint
                          </Text>
                          <Text style={tw`text-xs text-slate-200 leading-relaxed mt-1`}>
                            {isClassIII 
                              ? 'Mandibular first or second premolar extractions combined with Class III elastics. Allows controlled mandibular incisor retraction to establish positive overjet within periodontal limits.' 
                              : isClassII 
                              ? 'Maxillary first premolar extractions (or upper first and lower second premolars) to resolve crowding, establish Class I canine relationships, and retract upper incisors.'
                              : 'Non-extraction alignment or selective Interproximal Reduction (IPR) if minor crowding exists.'
                            }
                          </Text>
                        </View>

                        <View>
                          <Text style={tw`text-[9px] font-black text-cyan-400 uppercase tracking-widest font-mono`}>
                            Dentoalveolar Torque & Periodontal Safeguards
                          </Text>
                          <Text style={tw`text-xs text-slate-200 leading-relaxed mt-1`}>
                            {isClassIII 
                              ? `Maintain IMPA >= 80° (current IMPA: ${cephalometricInput.impa || '90'}°) to avoid severe retroclination and aesthetic flattening of the lower lip. Control torque of upper incisors (U1-SN) under 120°.` 
                              : isClassII 
                              ? `Do not flare lower incisors beyond 98° IMPA (current IMPA: ${cephalometricInput.impa || '90'}°) to avoid labial plate dehiscence and gingival recession. Maintain root torque control on upper incisors.`
                              : `Preserve the patient's existing dental positions. Establish Class I canine and molar relationships.`
                            }
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {activePlanTab === 'surgical' && (
                    <View style={tw`space-y-3`}>
                      <View style={tw`bg-rose-500/5 p-4 rounded-2xl border border-rose-500/15 space-y-3`}>
                        <Text style={tw`text-[9px] font-black text-rose-400 uppercase tracking-widest font-mono`}>
                          Orthognathic Surgery & Decompensation ({ociResult.totalScore > 60 ? 'Highly Advised' : 'Alternative Secondary Pathway'})
                        </Text>
                        <Text style={tw`text-xs text-slate-200 leading-relaxed`}>
                          {ociResult.totalScore > 60 
                            ? `Skeletal limit reached (OCI: ${ociResult.totalScore}%). Attempting standard orthodontic camouflage carries high periodontal risk. Complete orthognathic surgical consultation is highly recommended.` 
                            : 'Patient resides within the orthodontic camouflage threshold. Orthognathic surgery is not primary but remains a secondary option if soft tissue aesthetics require extreme skeletal profile alteration.'
                          }
                        </Text>

                        <View style={tw`bg-black/30 p-3 rounded-xl border border-white/5`}>
                          <Text style={tw`text-[9px] font-black text-slate-300 uppercase tracking-widest font-mono`}>
                            Presurgical Decompensation Protocol
                          </Text>
                          <Text style={tw`text-xs text-slate-300 mt-1 leading-relaxed`}>
                            {isClassIII 
                              ? `To permit surgical maxillary advancement/mandibular setback, we must reverse dental compensation: PROCLINE lower incisors back to 90° IMPA, and RETROCLINE upper incisors. This temporarily increases the reverse overjet to allow surgical jaw correction.` 
                              : isClassII 
                              ? `To permit surgical mandibular advancement, we must reverse compensation: RETROCLINE lower incisors back to 90° IMPA, and PROCLINE upper incisors. This temporarily increases the overjet to permit surgical advancement of the mandible.`
                              : 'No major decompensation required. Arches are leveled and aligned.'
                            }
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {activePlanTab === 'retention' && (
                    <View style={tw`space-y-3`}>
                      <View style={tw`bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/15 space-y-2`}>
                        <Text style={tw`text-[9px] font-black text-indigo-400 uppercase tracking-widest font-mono`}>
                          Orthodontic Retention & Long-term Stability
                        </Text>
                        <Text style={tw`text-xs text-slate-200 leading-relaxed`}>
                          Since teeth have been moved out of their original compensatory positions, the tendency to relapse toward the original skeletal jaw relationship is extremely high.
                        </Text>
                        <Text style={tw`text-xs text-slate-300 leading-relaxed font-bold`}>
                          • Mandibular: Fixed lingual bonded retainer (3-3) is clinically mandatory to preserve mandibular incisor torque.
                          {"\n"}• Maxillary: Clear vacuum-formed Essix retainer paired with a nighttime Hawley appliance to preserve arch width and torque.
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })()}

        {/* Gemini Copilot Summary section with ReactMarkdown */}
        <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-6 rounded-[28px] border border-[#14B8A6]/20 space-y-4 shadow-2xl`}>
          <View style={tw`flex-row justify-between items-center border-b border-white/5 pb-3.5`}>
            <View style={tw`flex-row items-center`}>
              <Cpu size={16} color="#22D3EE" style={tw`mr-2.5`} />
              <View>
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`font-black text-sm text-white mr-2`}>Gemini Clinical Copilot</Text>
                  <View style={tw`bg-teal-500/15 px-2 py-0.5 rounded-full border border-teal-500/25`}>
                    <Text style={tw`text-[7px] text-[#22D3EE] font-mono font-black uppercase tracking-widest`}>LIVE CORE</Text>
                  </View>
                </View>
                <Text style={tw`text-[9px] text-slate-400 mt-0.5`}>Synthesizes ANB metrics & dental tipping profiles</Text>
              </View>
            </View>
            
            <Pressable
              onPress={() => setIsEditingSummary(!isEditingSummary)}
              style={tw`flex-row items-center bg-white/5 px-3 py-1.5 rounded-xl border border-white/10`}
            >
              <Edit2 size={10} color="#cbd5e1" style={tw`mr-1.5`} />
              <Text style={tw`text-[9px] font-black text-slate-300 uppercase tracking-widest`}>
                {isEditingSummary ? 'View' : 'Edit'}
              </Text>
            </Pressable>
          </View>

          {loadingSummary ? (
            <View style={tw`py-6 items-center justify-center space-y-2`}>
              <ActivityIndicator size="small" color="#14B8A6" />
              <Text style={tw`text-[9px] font-mono text-teal-400 font-black uppercase tracking-wider`}>SYNTHESIZING CLINICAL DATA...</Text>
            </View>
          ) : isEditingSummary ? (
            <View style={tw`space-y-2`}>
              <TextInput
                value={editedSummary}
                onChangeText={setEditedSummary}
                multiline
                numberOfLines={6}
                style={[tw`w-full px-4 py-3.5 bg-black/45 text-slate-100 font-sans text-xs rounded-2xl border border-white/10 focus:border-[#14B8A6]`, { minHeight: 120 }]}
              />
              <Text style={tw`text-[9px] font-mono text-slate-500`}>
                You can adjust this AI text before saving to patient charts or exporting files.
              </Text>
            </View>
          ) : (
            <MarkdownRenderer>{editedSummary}</MarkdownRenderer>
          )}
        </View>

        {/* Charts */}
        <SvgCharts categoryScores={ociResult.categoryScores} />

      </View>
    </ScrollView>
  );
}
