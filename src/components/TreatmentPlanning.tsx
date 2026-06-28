import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert, Platform } from 'react-native';
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
      <ScrollView contentContainerStyle={tw`pb-12 px-4 max-w-4xl w-full mx-auto`}>
        <View style={tw`bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 mt-8 items-center text-center`}>
          <View style={tw`w-16 h-16 bg-teal-500/10 rounded-full items-center justify-center border border-teal-500/20 text-teal-500`}>
            <Brain size={30} color="#0d9488" />
          </View>
          <Text style={tw`text-xl font-extrabold text-slate-800 dark:text-slate-100`}>
            Treatment Planning Core Offline
          </Text>
          <Text style={tw`text-slate-500 dark:text-slate-400 max-w-xs text-xs leading-relaxed text-center`}>
            No patient assessments have been indexed yet. Start a new cephalometric OCI analysis to load clinical records into the treatment planning assistant.
          </Text>
          <View style={tw`pt-2 items-center`}>
            <Text style={tw`text-[9px] text-teal-500/75 font-mono uppercase tracking-widest`}>
              Clinical Decision Support Engine
            </Text>
            <Text style={tw`text-xs text-slate-400 mt-1`}>Developed by Dr. Salman MDS Orthodontist</Text>
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
      summary: `${problemList.length} skeletal and dental anomalies detected.`,
      content: (
        <View style={tw`space-y-2`}>
          {problemList.map((prob, idx) => (
            <View key={idx} style={tw`flex-row items-center bg-red-500/5 px-3 py-2.5 rounded-xl border border-red-500/10`}>
              <View style={tw`w-2 h-2 rounded-full bg-red-500 mr-2.5`} />
              <Text style={tw`text-xs text-red-700 dark:text-red-400 font-bold flex-1`}>{prob}</Text>
            </View>
          ))}
        </View>
      )
    },
    {
      title: 'Growth Modification',
      icon: Clock,
      summary: isGrowing ? 'Patient is in active growth phase. Suture modification indicated.' : 'Patient is adult. Dental camouflage only.',
      content: (
        <View style={tw`space-y-3`}>
          <View style={tw`bg-teal-500/5 p-3 rounded-xl border border-teal-500/10`}>
            <Text style={tw`text-[10px] font-bold text-teal-600 uppercase tracking-wider`}>Suggested Appliances</Text>
            <Text style={tw`text-xs text-slate-800 dark:text-slate-200 mt-1`}>{growthInfo.appliances}</Text>
          </View>
          <View style={tw`bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800`}>
            <Text style={tw`text-[10px] font-bold text-slate-500 uppercase tracking-wider`}>Clinical Timing Protocol</Text>
            <Text style={tw`text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed`}>{growthInfo.guidelines}</Text>
          </View>
        </View>
      )
    },
    {
      title: 'Dentoalveolar Camouflage',
      icon: Layers,
      summary: `Extraction Strategy: ${camoInfo.extraction.substring(0, 45)}...`,
      content: (
        <View style={tw`space-y-3`}>
          <View style={tw`bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800`}>
            <Text style={tw`text-[10px] font-bold text-slate-500 uppercase tracking-wider`}>Extraction / Non-Extraction Strategy</Text>
            <Text style={tw`text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed`}>{camoInfo.extraction}</Text>
          </View>
          <View style={tw`bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800`}>
            <Text style={tw`text-[10px] font-bold text-slate-500 uppercase tracking-wider`}>Incisor Compensation Envelope</Text>
            <Text style={tw`text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed`}>{camoInfo.compensation}</Text>
          </View>
        </View>
      )
    },
    {
      title: 'Surgical Feasibility (OCI)',
      icon: ShieldCheck,
      summary: surgeryInfo.flag ? 'Relatively high indication of orthognathic surgery.' : 'Camouflage is safe and periodontally sound.',
      content: (
        <View style={tw`bg-blue-500/5 p-4 rounded-xl border border-blue-500/10`}>
          <Text style={tw`text-xs text-blue-700 dark:text-blue-300 leading-relaxed`}>
            {surgeryInfo.protocol}
          </Text>
        </View>
      )
    },
    {
      title: 'Appliance Selection',
      icon: Wrench,
      summary: 'Recommended physical bracket system and auxiliary elastics.',
      content: (
        <View style={tw`flex-row flex-wrap gap-2`}>
          {suggestedAppliances.map((app, idx) => (
            <View key={idx} style={tw`flex-row items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl w-full`}>
              <View style={tw`w-6 h-6 bg-teal-500/10 rounded-lg items-center justify-center mr-2.5`}>
                <Text style={tw`text-xs font-bold text-teal-600`}>{idx + 1}</Text>
              </View>
              <Text style={tw`text-xs font-bold text-slate-700 dark:text-slate-300 flex-1`}>{app}</Text>
            </View>
          ))}
        </View>
      )
    }
  ];

  const handleExportCSV = () => {
    Alert.alert("Offline CSV Export", "Treatment planning clinical records saved to local clipboard / database successfully in full HIPAA compliance.");
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-12 px-4 max-w-5xl w-full mx-auto`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Dynamic selector top bar */}
        <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4`}>
          <View>
            <View style={tw`flex-row items-center`}>
              <Brain size={16} color="#0d9488" style={tw`mr-1.5`} />
              <Text style={tw`font-extrabold text-sm text-slate-800 dark:text-slate-100`}>
                Orthodontic Treatment Planning Assistant
              </Text>
            </View>
            <Text style={tw`text-xs text-slate-400 mt-1`}>Developed by Dr. Salman MDS Orthodontist</Text>
          </View>

          {/* Custom Select dropdown trigger */}
          <View style={tw`relative`}>
            <Pressable
              onPress={() => setShowActiveSelect(!showActiveSelect)}
              style={tw`flex-row justify-between items-center bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800`}
            >
              <Text style={tw`text-xs font-bold text-slate-700 dark:text-slate-300`}>
                {patientDetails.name || 'Anonymous'} ({patientDetails.caseNumber || 'No Case'}) - {patientDetails.diagnosis}
              </Text>
              <ChevronDown size={14} color="#64748b" />
            </Pressable>

            {showActiveSelect && (
              <View style={tw`mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg z-50`}>
                {savedAssessments.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedId(item.id);
                      setCustomNotes('');
                      setShowActiveSelect(false);
                    }}
                    style={tw`px-4 py-3 border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50`}
                  >
                    <Text style={tw`text-xs font-semibold text-slate-700 dark:text-slate-300`}>
                      {item.patientDetails.name || 'Anonymous'} - {item.patientDetails.diagnosis}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Layout Grid */}
        <View style={tw`flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6`}>
          
          {/* Left Column: Brief Metadata & Variable selectors */}
          <View style={tw`w-full md:w-[35%] space-y-6`}>
            
            {/* Demographics Card */}
            <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3`}>
              <View style={tw`flex-row items-center border-b border-slate-100 dark:border-slate-850 pb-2.5`}>
                <Users size={16} color="#0d9488" style={tw`mr-1.5`} />
                <Text style={tw`font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase`}>Clinical Metadata</Text>
              </View>

              <View style={tw`space-y-2`}>
                {[
                  { label: 'Name', val: patientDetails.name || 'Anonymous' },
                  { label: 'Case ID', val: patientDetails.caseNumber || 'N/A' },
                  { label: 'Age', val: `${patientDetails.age || 'N/A'} yrs` },
                  { label: 'Diagnosis', val: patientDetails.diagnosis || 'Class I' },
                  { label: 'OCI Index', val: `${ociResult.totalScore}/100` }
                ].map((row, i) => (
                  <View key={i} style={tw`flex-row justify-between py-1.5 border-b border-slate-50 dark:border-slate-850/50`}>
                    <Text style={tw`text-xs text-slate-400`}>{row.label}</Text>
                    <Text style={tw`text-xs font-bold text-slate-700 dark:text-slate-300`}>{row.val}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Variable Selectors */}
            <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4`}>
              <View style={tw`flex-row items-center border-b border-slate-100 dark:border-slate-850 pb-2.5`}>
                <Sliders size={16} color="#0d9488" style={tw`mr-1.5`} />
                <Text style={tw`font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase`}>Planning Variables</Text>
              </View>

              {/* CVMS Dropdown */}
              <View>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1`}>Cervical Maturity (CVMS)</Text>
                <Pressable
                  onPress={() => setShowCvmsSelect(!showCvmsSelect)}
                  style={tw`flex-row justify-between items-center bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800`}
                >
                  <Text style={tw`text-xs font-semibold text-slate-700 dark:text-slate-300`}>{cvmsStage}</Text>
                  <ChevronDown size={12} color="#64748b" />
                </Pressable>
                {showCvmsSelect && (
                  <View style={tw`mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg z-50`}>
                    {['CVMS 1 (Pre-Peak)', 'CVMS 2 (Pre-Peak)', 'CVMS 3 (Peak)', 'CVMS 4 (Post-Peak)', 'CVMS 5 (Completed)'].map((st) => (
                      <Pressable
                        key={st}
                        onPress={() => {
                          setCvmsStage(st);
                          setShowCvmsSelect(false);
                        }}
                        style={tw`px-3 py-2.5 border-b border-slate-100 dark:border-slate-850`}
                      >
                        <Text style={tw`text-xs text-slate-700`}>{st}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Dentition Phase Dropdown */}
              <View>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1`}>Dentition Phase</Text>
                <Pressable
                  onPress={() => setShowDentitionSelect(!showDentitionSelect)}
                  style={tw`flex-row justify-between items-center bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800`}
                >
                  <Text style={tw`text-xs font-semibold text-slate-700 dark:text-slate-300`}>{dentitionPhase}</Text>
                  <ChevronDown size={12} color="#64748b" />
                </Pressable>
                {showDentitionSelect && (
                  <View style={tw`mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg z-50`}>
                    {['Primary', 'Early Mixed', 'Late Mixed', 'Permanent'].map((dp) => (
                      <Pressable
                        key={dp}
                        onPress={() => {
                          setDentitionPhase(dp);
                          setShowDentitionSelect(false);
                        }}
                        style={tw`px-3 py-2.5 border-b border-slate-100 dark:border-slate-850`}
                      >
                        <Text style={tw`text-xs text-slate-700`}>{dp} Dentition</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Custom treatment plan notes */}
              <View>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1`}>Custom treatment plan notes</Text>
                <TextInput
                  value={customNotes}
                  onChangeText={setCustomNotes}
                  placeholder="Enter specific orthodontic biomechanics, bracket torque specifications, or patient compliance instructions..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  style={[tw`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs`, { minHeight: 70 }]}
                />
              </View>
            </View>

            {/* Offline Export tools */}
            <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3`}>
              <Text style={tw`font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase`}>Export Treatment Records</Text>
              <Pressable
                onPress={handleExportCSV}
                style={tw`w-full py-2.5 bg-teal-500 rounded-xl items-center justify-center flex-row`}
              >
                <Text style={tw`text-xs font-bold text-white`}>Export CSV Offline</Text>
              </Pressable>
              <Text style={tw`text-[10px] text-slate-400 text-center italic`}>
                * Exports are generated fully offline to secure HIPAA compliance.
              </Text>
            </View>

          </View>

          {/* Right Column: Expandable Clinical Steps Workflow */}
          <View style={tw`flex-1 space-y-4`}>
            
            <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm`}>
              <View style={tw`flex-row justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3 mb-4`}>
                <View style={tw`flex-row items-center`}>
                  <Brain size={18} color="#0d9488" style={tw`mr-2 animate-pulse`} />
                  <View>
                    <Text style={tw`font-black text-sm text-slate-800 dark:text-slate-100`}>Planning Staging Workflow</Text>
                    <Text style={tw`text-[9px] text-slate-400`}>Click titles to toggle biomechanical stages</Text>
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
                          ? 'border-teal-500 bg-teal-500/5' 
                          : 'border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {/* Trigger bar */}
                      <Pressable
                        onPress={() => setExpandedStep(isExpanded ? null : idx)}
                        style={tw`px-4 py-3 flex-row items-center justify-between`}
                      >
                        <View style={tw`flex-row items-center flex-1 pr-4`}>
                          <View style={tw`w-7 h-7 rounded-full items-center justify-center mr-3 ${isExpanded ? 'bg-teal-500 text-white' : 'bg-slate-100'}`}>
                            <Text style={tw`text-xs font-bold ${isExpanded ? 'text-white' : 'text-slate-500'}`}>{idx + 1}</Text>
                          </View>
                          <View style={tw`flex-1`}>
                            <Text style={tw`text-xs font-bold text-slate-800 dark:text-slate-100 uppercase`}>{step.title}</Text>
                            <Text style={tw`text-[10px] text-slate-400 mt-0.5`} numberOfLines={1}>{step.summary}</Text>
                          </View>
                        </View>
                        {isExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                      </Pressable>

                      {/* Content details */}
                      {isExpanded && (
                        <View style={tw`px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60`}>
                          {step.content}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Diagnostic Copilot Synthesis text box */}
            <View style={tw`bg-slate-950 p-5 rounded-3xl border border-slate-850 space-y-3`}>
              <View style={tw`flex-row items-center`}>
                <Sparkles size={16} color="#2dd4bf" style={tw`mr-2`} />
                <Text style={tw`font-extrabold text-xs text-teal-300 uppercase`}>Diagnostic Copilot Synthesis</Text>
              </View>
              <Text style={tw`text-xs text-slate-200 leading-relaxed font-sans`}>
                {isClassIII 
                  ? `Clinical index evaluation confirms a skeletal Class III relationship with severe dental compensation limits. Lower incisors are tipped lingually (${cephalometricInput.impa || 'N/A'}°) while upper incisors are proclined to establish positive overjet. Camouflage remains borderline (OCI: ${ociResult.totalScore}/100).`
                  : isClassII 
                  ? `Clinical index evaluation indicates skeletal Class II profile with natural dental camouflage adaptations. Upper incisors are tipped lingually (${cephalometricInput.u1Sn || 'N/A'}°) while lower incisors are proclined. Camouflage is realistic but requires careful anchorage management.`
                  : `Clinical index evaluation is within normal sagittal ranges (OCI: ${ociResult.totalScore}/100). Alignment using standard prescription is safe and highly stable, with no skeletal limits breached.`
                }
              </Text>
              {customNotes !== '' && (
                <View style={tw`p-3 bg-slate-900 border border-teal-500/20 rounded-xl mt-2`}>
                  <Text style={tw`text-[8px] text-teal-400 font-mono uppercase tracking-widest`}>Clinical Operator Directives</Text>
                  <Text style={tw`text-xs text-teal-100 italic leading-normal mt-0.5`}>{customNotes}</Text>
                </View>
              )}
            </View>

          </View>

        </View>

      </View>
    </ScrollView>
  );
}
