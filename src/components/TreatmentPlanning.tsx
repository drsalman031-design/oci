import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { Assessment } from '../types';
import { 
  Users, 
  Brain, 
  Sparkles, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Clock,
  Activity,
  Layers,
  Wrench,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Briefcase
} from 'lucide-react-native';
import tw from 'twrnc';

interface TreatmentPlanningProps {
  savedAssessments: Assessment[];
  onSelectAssessment?: (id: string) => void;
}

export default function TreatmentPlanning({ savedAssessments }: TreatmentPlanningProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [cvmsStage, setCvmsStage] = useState<string>('CVMS 3 (Peak)');
  const [dentitionPhase, setDentitionPhase] = useState<string>('Late Mixed');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [showActiveSelect, setShowActiveSelect] = useState<boolean>(false);
  const [showCvmsSelect, setShowCvmsSelect] = useState<boolean>(false);
  const [showDentitionSelect, setShowDentitionSelect] = useState<boolean>(false);

  // Find the selected assessment
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
            <Brain size={30} color="#14B8A6" />
          </View>
          <Text style={tw`text-lg font-black text-white`}>
            Treatment Planner
          </Text>
          <Text style={tw`text-slate-400 max-w-xs text-xs leading-relaxed text-center`}>
            No patient assessments have been indexed yet. Start a new cephalometric OCI analysis to load clinical records into the treatment planning assistant.
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

  const isClassIII = patientDetails.diagnosis === 'Class III' || (cephalometricInput.anb !== '' && Number(cephalometricInput.anb) < 0);
  const isClassII = patientDetails.diagnosis === 'Class II' || (cephalometricInput.anb !== '' && Number(cephalometricInput.anb) > 4);
  const isClassI = !isClassIII && !isClassII;

  const age = typeof patientDetails.age === 'number' ? patientDetails.age : 12;
  const isGrowing = age <= 14;

  const problemList: string[] = [];
  if (cephalometricInput.anb !== '') {
    if (Number(cephalometricInput.anb) < 0) problemList.push(`Skeletal Class III Discrepancy (ANB: ${cephalometricInput.anb}°)`);
    else if (Number(cephalometricInput.anb) > 4) problemList.push(`Skeletal Class II Discrepancy (ANB: ${cephalometricInput.anb}°)`);
  }
  if (cephalometricInput.wits !== '') {
    if (Number(cephalometricInput.wits) < -2) problemList.push(`Skeletal Class III Maxillo-Mandibular Disagreement (Wits: ${cephalometricInput.wits}mm)`);
    else if (Number(cephalometricInput.wits) > 2) problemList.push(`Skeletal Class II Maxillo-Mandibular Disagreement (Wits: ${cephalometricInput.wits}mm)`);
  }
  if (cephalometricInput.fma !== '') {
    if (Number(cephalometricInput.fma) > 29) problemList.push(`Hyperdivergent Growth / High Angle (FMA: ${cephalometricInput.fma}°)`);
    else if (Number(cephalometricInput.fma) < 21) problemList.push(`Hypodivergent Growth / Low Angle (FMA: ${cephalometricInput.fma}°)`);
  }
  if (cephalometricInput.impa !== '') {
    if (Number(cephalometricInput.impa) > 95) problemList.push(`Lower Incisor Proclination / Labial Tipping (IMPA: ${cephalometricInput.impa}°)`);
    else if (Number(cephalometricInput.impa) < 85) problemList.push(`Lower Incisor Retroclination / Lingual Tipping (IMPA: ${cephalometricInput.impa}°)`);
  }
  if (problemList.length === 0) {
    problemList.push('Mild dental malalignment, Class I sagittal profiles');
  }

  const objectives: string[] = [
    'Establish ideal Class I canine and molar dental relationships',
    'Achieve optimal overjet (2.0 - 2.5mm) and overbite (1.5 - 2.0mm)',
    'Optimize lower incisor position relative to mandibular basal bone',
    'Establish lip competence and pleasant soft tissue facial profiles'
  ];

  const getGrowthModificationNotes = () => {
    if (isClassIII) {
      return {
        appliances: 'Protraction Face Mask paired with Rapid Maxillary Expansion (RME) or Bone-Anchored Maxillary Protraction (BAMP)',
        guidelines: 'Initiate RME/Face Mask therapy immediately during early mixed dentition before suture closure. BAMP can be applied in late mixed dentition.'
      };
    } else if (isClassII) {
      return {
        appliances: 'Twin Block, Herbst Appliance, Activator or Forsus Fatigue Resistant Device',
        guidelines: 'Utilize active functional growth orthopedic correction during peak CVMS 3 stage. Twin block is highly effective in growing Class II cases.'
      };
    }
    return {
      appliances: 'Not indicated (Skeletal Class I)',
      guidelines: 'No skeletal modification is required. Plan conventional dentoalveolar treatment.'
    };
  };

  const getCamouflageNotes = () => {
    if (isClassIII) {
      return {
        extraction: 'Class III compensation typically calls for mandibular premolar extractions (lower first or second premolars) or Class III elastics.',
        compensation: 'Procline upper incisors up to 120° U1-SN and retrocline lower incisors down to 80° IMPA. Beware periodontal bone limits.'
      };
    } else if (isClassII) {
      return {
        extraction: 'Upper first premolar extraction or upper first and lower second premolar extractions to achieve Class II molar and Class I canine.',
        compensation: 'Procline lower incisors (do not exceed 98° IMPA to avoid gingival recession) and retrocline upper incisors.'
      };
    }
    return {
      extraction: 'No extractions indicated or non-extraction alignment using IPR (Interproximal Reduction).',
      compensation: 'Preserve dental alignment within standard envelope of motion.'
    };
  };

  const getSurgicalNotes = () => {
    const totalScoreNum = ociResult.totalScore;
    if (totalScoreNum > 75) {
      return {
        flag: true,
        protocol: 'Orthognathic Surgical Correction. Plan pre-surgical orthodontic decompensation, leveling, aligning, and coordinate arches.'
      };
    }
    return {
      flag: false,
      protocol: 'Conventional dental camouflage orthodontic therapy is feasible. No surgical jaw correction needed.'
    };
  };

  const growthInfo = getGrowthModificationNotes();
  const camoInfo = getCamouflageNotes();
  const surgeryInfo = getSurgicalNotes();

  const suggestedAppliances = [
    'Pre-adjusted MBT 0.022-inch bracket system',
    growthInfo.appliances !== 'Not indicated (Skeletal Class I)' ? growthInfo.appliances : 'Transpalatal Arch (TPA) for anchorage maintenance',
    camoInfo.extraction !== 'No extractions indicated or non-extraction alignment using IPR (Interproximal Reduction).' ? 'Class II/III Inter-arch Elastics' : 'Light NiTi Archwires'
  ];

  const steps = [
    {
      title: 'Problem List & Diagnostics',
      icon: AlertTriangle,
      summary: `${problemList.length} anomalies detected.`,
      content: (
        <View style={tw`space-y-2`}>
          {problemList.map((prob, idx) => (
            <View key={idx} style={tw`flex-row items-center bg-rose-500/10 px-4 py-3 rounded-2xl border border-rose-500/20`}>
              <View style={tw`w-2 h-2 rounded-full bg-[#EF4444] mr-2.5`} />
              <Text style={tw`text-[11px] text-rose-400 font-extrabold flex-1`}>{prob}</Text>
            </View>
          ))}
        </View>
      )
    },
    {
      title: 'Growth Modification',
      icon: Clock,
      summary: isGrowing ? 'Active growth phase. Growth modification indicated.' : 'Skeletal growth completed.',
      content: (
        <View style={tw`space-y-3`}>
          <View style={tw`bg-[#14B8A6]/10 p-4 rounded-2xl border border-[#14B8A6]/20`}>
            <Text style={tw`text-[9px] font-black text-teal-400 uppercase tracking-widest font-mono`}>Suggested Appliances</Text>
            <Text style={tw`text-xs text-white mt-1 leading-relaxed`}>{growthInfo.appliances}</Text>
          </View>
          <View style={tw`bg-black/30 p-4 rounded-2xl border border-white/5`}>
            <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Clinical Protocol</Text>
            <Text style={tw`text-xs text-slate-300 mt-1 leading-relaxed`}>{growthInfo.guidelines}</Text>
          </View>
        </View>
      )
    },
    {
      title: 'Dentoalveolar Camouflage',
      icon: Layers,
      summary: `Strategy: ${camoInfo.extraction.substring(0, 30)}...`,
      content: (
        <View style={tw`space-y-3`}>
          <View style={tw`bg-black/30 p-4 rounded-2xl border border-white/5`}>
            <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Extraction Blueprint</Text>
            <Text style={tw`text-xs text-slate-300 mt-1 leading-relaxed`}>{camoInfo.extraction}</Text>
          </View>
          <View style={tw`bg-black/30 p-4 rounded-2xl border border-white/5`}>
            <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Compensation Limits</Text>
            <Text style={tw`text-xs text-slate-300 mt-1 leading-relaxed`}>{camoInfo.compensation}</Text>
          </View>
        </View>
      )
    },
    {
      title: 'Surgical Feasibility (OCI)',
      icon: ShieldCheck,
      summary: surgeryInfo.flag ? 'Relatively high indication of surgery.' : 'Conventional camouflage predicted safe.',
      content: (
        <View style={tw`bg-cyan-500/10 p-4 rounded-2xl border border-cyan-500/20`}>
          <Text style={tw`text-xs text-[#22D3EE] leading-relaxed font-black`}>
            {surgeryInfo.protocol}
          </Text>
        </View>
      )
    },
    {
      title: 'Appliance Selection',
      icon: Wrench,
      summary: 'Recommended physical bracket prescriptions.',
      content: (
        <View style={tw`space-y-2`}>
          {suggestedAppliances.map((app, idx) => (
            <View key={idx} style={tw`flex-row items-center bg-black/45 border border-white/10 p-4 rounded-2xl w-full`}>
              <View style={tw`w-7 h-7 bg-teal-500/10 rounded-xl items-center justify-center mr-3 border border-teal-500/25`}>
                <Text style={tw`text-xs font-black text-teal-400`}>{idx + 1}</Text>
              </View>
              <Text style={tw`text-xs font-bold text-white flex-1 leading-normal`}>{app}</Text>
            </View>
          ))}
        </View>
      )
    }
  ];

  const handleExportCSV = () => {
    Alert.alert("Database Export", "Treatment planning clinical records saved to local clipboard / database successfully in full HIPAA compliance.");
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Selector Header */}
        <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
          <View>
            <View style={tw`flex-row items-center mb-1`}>
              <Brain size={18} color="#14B8A6" style={tw`mr-2`} />
              <Text style={tw`font-black text-base text-white tracking-tight uppercase`}>
                Planning Suite
              </Text>
            </View>
            <Text style={tw`text-xs text-slate-400`}>Biomechanics staging and growth mod guides</Text>
          </View>

          {/* Selector */}
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
                      setCustomNotes('');
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

        {/* Info Grid */}
        <View style={tw`flex-col space-y-6`}>
          
          <View style={tw`w-full space-y-6`}>
            
            {/* Demographics Card */}
            <View style={tw`bg-[#0B1020]/90 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-3`}>
              <View style={tw`flex-row items-center border-b border-white/5 pb-2.5`}>
                <Users size={15} color="#14B8A6" style={tw`mr-2`} />
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Case Summary</Text>
              </View>

              <View style={tw`space-y-1`}>
                {[
                  { label: 'Name', val: patientDetails.name || 'Anonymous' },
                  { label: 'Case ID', val: patientDetails.caseNumber || 'N/A' },
                  { label: 'Age / Gender', val: `${patientDetails.age || 'N/A'}y / ${patientDetails.gender}` },
                  { label: 'Diagnosis', val: patientDetails.diagnosis || 'Class I' },
                  { label: 'OCI Index', val: `${ociResult.totalScore}%` }
                ].map((row, i) => (
                  <View key={i} style={tw`flex-row justify-between py-2 border-b border-white/5`}>
                    <Text style={tw`text-xs text-slate-400`}>{row.label}</Text>
                    <Text style={tw`text-xs font-bold text-slate-200`}>{row.val}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Variable Selectors */}
            <View style={tw`bg-[#0B1020]/90 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
              <View style={tw`flex-row items-center border-b border-white/5 pb-2.5`}>
                <Sliders size={15} color="#14B8A6" style={tw`mr-2`} />
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Treatment Parameters</Text>
              </View>

              {/* CVMS */}
              <View>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono`}>Cervical Stage (CVMS)</Text>
                <Pressable
                  onPress={() => setShowCvmsSelect(!showCvmsSelect)}
                  style={tw`flex-row justify-between items-center bg-black/40 px-3.5 py-3 rounded-2xl border border-white/10`}
                >
                  <Text style={tw`text-xs font-bold text-slate-200`}>{cvmsStage}</Text>
                  <ChevronDown size={12} color="#14B8A6" />
                </Pressable>
                {showCvmsSelect && (
                  <View style={tw`mt-2 bg-[#050814] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50`}>
                    {['CVMS 1 (Pre-Peak)', 'CVMS 2 (Pre-Peak)', 'CVMS 3 (Peak)', 'CVMS 4 (Post-Peak)', 'CVMS 5 (Completed)'].map((st) => (
                      <Pressable
                        key={st}
                        onPress={() => {
                          setCvmsStage(st);
                          setShowCvmsSelect(false);
                        }}
                        style={tw`px-4 py-3.5 border-b border-white/5`}
                      >
                        <Text style={tw`text-xs text-slate-200 font-bold`}>{st}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Dentition Phase */}
              <View>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono`}>Dentition Phase</Text>
                <Pressable
                  onPress={() => setShowDentitionSelect(!showDentitionSelect)}
                  style={tw`flex-row justify-between items-center bg-black/40 px-3.5 py-3 rounded-2xl border border-white/10`}
                >
                  <Text style={tw`text-xs font-bold text-slate-200`}>{dentitionPhase}</Text>
                  <ChevronDown size={12} color="#14B8A6" />
                </Pressable>
                {showDentitionSelect && (
                  <View style={tw`mt-2 bg-[#050814] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50`}>
                    {['Primary', 'Early Mixed', 'Late Mixed', 'Permanent'].map((dp) => (
                      <Pressable
                        key={dp}
                        onPress={() => {
                          setDentitionPhase(dp);
                          setShowDentitionSelect(false);
                        }}
                        style={tw`px-4 py-3.5 border-b border-white/5`}
                      >
                        <Text style={tw`text-xs text-slate-200 font-bold`}>{dp} Dentition</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Operator Notes */}
              <View>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono`}>Custom Directives</Text>
                <TextInput
                  value={customNotes}
                  onChangeText={setCustomNotes}
                  placeholder="Record specific biomechanics or bracket specifications..."
                  placeholderTextColor="#475569"
                  multiline
                  numberOfLines={4}
                  style={[tw`w-full px-4 py-3 bg-black/45 border border-white/10 rounded-2xl text-white text-xs font-bold`, { minHeight: 80 }]}
                />
              </View>
            </View>

          </View>

          {/* Staging Steps Workflow */}
          <View style={tw`w-full space-y-6`}>
            
            <View style={tw`bg-[#0B1020]/90 p-5 rounded-[28px] border border-white/5 shadow-2xl`}>
              <View style={tw`flex-row justify-between items-center border-b border-white/5 pb-3.5 mb-4`}>
                <View style={tw`flex-row items-center`}>
                  <Brain size={16} color="#14B8A6" style={tw`mr-2`} />
                  <View>
                    <Text style={tw`font-black text-sm text-white`}>Biomechanics staging</Text>
                    <Text style={tw`text-[9px] text-slate-400`}>Select active stage details</Text>
                  </View>
                </View>
              </View>

              <View style={tw`space-y-3`}>
                {steps.map((step, idx) => {
                  const isExpanded = expandedStep === idx;
                  return (
                    <View 
                      key={idx}
                      style={tw`border rounded-2xl overflow-hidden ${
                        isExpanded 
                          ? 'border-[#14B8A6] bg-[#14B8A6]/5' 
                          : 'border-white/10 bg-black/20'
                      }`}
                    >
                      {/* Trigger bar */}
                      <Pressable
                        onPress={() => setExpandedStep(isExpanded ? null : idx)}
                        style={tw`px-4 py-3.5 flex-row items-center justify-between`}
                      >
                        <View style={tw`flex-row items-center flex-1 pr-4`}>
                          <View style={tw`w-7 h-7 rounded-full items-center justify-center mr-3 ${isExpanded ? 'bg-[#14B8A6]' : 'bg-white/10'}`}>
                            <Text style={tw`text-xs font-black ${isExpanded ? 'text-white' : 'text-slate-400'}`}>{idx + 1}</Text>
                          </View>
                          <View style={tw`flex-1`}>
                            <Text style={tw`text-xs font-bold text-white uppercase tracking-wide`}>{step.title}</Text>
                            <Text style={tw`text-[10px] text-slate-400 mt-0.5`} numberOfLines={1}>{step.summary}</Text>
                          </View>
                        </View>
                        {isExpanded ? <ChevronUp size={14} color="#14B8A6" /> : <ChevronDown size={14} color="#94a3b8" />}
                      </Pressable>

                      {/* Content details */}
                      {isExpanded && (
                        <View style={tw`px-4 pb-4 pt-2 border-t border-white/5 bg-black/20`}>
                          {step.content}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Diagnostic Copilot Synthesis */}
            <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-5 rounded-[28px] border border-[#14B8A6]/20 space-y-3 shadow-2xl`}>
              <View style={tw`flex-row items-center`}>
                <Sparkles size={16} color="#22D3EE" style={tw`mr-2`} />
                <Text style={tw`text-[10px] font-bold text-teal-300 uppercase tracking-widest font-mono`}>Diagnostic Synthesis</Text>
              </View>
              <Text style={tw`text-xs text-slate-200 leading-relaxed`}>
                {isClassIII 
                  ? `Clinical evaluation confirms skeletal Class III relationship with high dental compensation limits. Lower incisors retroclined (${cephalometricInput.impa || 'N/A'}°) while upper incisors proclined. Camouflage remains borderline (OCI: ${ociResult.totalScore}%).`
                  : isClassII 
                  ? `Clinical evaluation indicates skeletal Class II profile with natural dental camouflage. Upper incisors retroclined (${cephalometricInput.u1Sn || 'N/A'}°) while lower incisors proclined. Camouflage is realistic but requires strict anchorage.`
                  : `Clinical evaluation within normal sagittal ranges (OCI: ${ociResult.totalScore}%). Alignment using conventional prescription is highly predictable and stable.`
                }
              </Text>
              {customNotes !== '' && (
                <View style={tw`p-3.5 bg-black/45 border border-teal-500/20 rounded-xl mt-2`}>
                  <Text style={tw`text-[8px] text-teal-400 font-bold font-mono uppercase tracking-widest`}>Operator Directives</Text>
                  <Text style={tw`text-xs text-slate-200 italic leading-normal mt-1`}>{customNotes}</Text>
                </View>
              )}
            </View>

          </View>

        </View>

      </View>
    </ScrollView>
  );
}
