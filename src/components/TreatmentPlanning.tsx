import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { 
  Award, 
  Activity, 
  Compass, 
  Sliders, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  Check, 
  Zap, 
  CheckCircle, 
  TrendingUp, 
  User, 
  ShieldAlert, 
  Bookmark, 
  Settings, 
  Layers, 
  Info,
  Calendar,
  Sparkles
} from 'lucide-react-native';
import tw from 'twrnc';
import { Assessment, PatientDetails, CephalometricInput, OciResult, AdvancedClinicalIntelligence } from '../types';
import { generateTreatmentPlan, TreatmentPlanResult, TreatmentPlanningOptions } from '../treatmentPlanner';

interface TreatmentPlanningProps {
  savedAssessments: Assessment[];
  onUpdateAssessment: (assessment: Assessment) => void;
  activeAssessmentId?: string | null;
}

export default function TreatmentPlanning({ savedAssessments, onUpdateAssessment, activeAssessmentId }: TreatmentPlanningProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPatientSelect, setShowPatientSelect] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'cdss' | 'planner' | 'biomechanics' | null>('cdss');

  const toggleSection = (section: 'cdss' | 'planner' | 'biomechanics') => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(prev => prev === section ? null : section);
  };

  // Treatment Options state
  const [ageGroup, setAgeGroup] = useState<'growing' | 'adult'>('adult');
  const [crowdingSeverity, setCrowdingSeverity] = useState<'none' | 'mild' | 'moderate' | 'severe'>('none');
  const [spacingSeverity, setSpacingSeverity] = useState<'none' | 'mild' | 'moderate' | 'severe'>('none');
  const [archDiscrepancy, setArchDiscrepancy] = useState<number>(0);
  const [clinicianOverride, setClinicianOverride] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selected patient
  useEffect(() => {
    if (activeAssessmentId) {
      setSelectedId(activeAssessmentId);
    } else if (savedAssessments.length > 0 && !selectedId) {
      setSelectedId(savedAssessments[0].id);
    }
  }, [activeAssessmentId, savedAssessments]);

  // Load and pre-populate options when selected patient changes
  useEffect(() => {
    if (!selectedId) return;
    const assessment = savedAssessments.find(a => a.id === selectedId);
    if (!assessment) return;

    const details = assessment.patientDetails;
    const adv = assessment.advanced;

    // Smart defaults based on patient age and properties
    const age = Number(details.age) || 0;
    setAgeGroup(age > 0 && age < 16 ? 'growing' : 'adult');

    const crowdingSpacing = details.crowdingSpacing;
    if (crowdingSpacing === 'Crowding') {
      setCrowdingSeverity('moderate');
      setSpacingSeverity('none');
    } else if (crowdingSpacing === 'Spacing') {
      setSpacingSeverity('moderate');
      setCrowdingSeverity('none');
    } else {
      setCrowdingSeverity('none');
      setSpacingSeverity('none');
    }

    setArchDiscrepancy(0);
    setClinicianOverride(adv?.finalClinicalSummary || details.clinicalNotes || '');
    setIsSaved(false);
  }, [selectedId, savedAssessments]);

  // Find currently selected assessment
  const activeAssessment = savedAssessments.find(a => a.id === selectedId);

  // Safe numerical fallback helper
  const getNumVal = (val: string | number | undefined, fallback = 0): number => {
    if (val === undefined || val === '') return fallback;
    const n = Number(val);
    return isNaN(n) ? fallback : n;
  };

  // Run the treatment planning rules engine dynamically
  let treatmentPlan: TreatmentPlanResult | null = null;
  if (activeAssessment) {
    const options: TreatmentPlanningOptions = {
      ageGroup,
      crowdingSeverity,
      spacingSeverity,
      archDiscrepancy
    };
    treatmentPlan = generateTreatmentPlan(
      activeAssessment.patientDetails,
      activeAssessment.cephalometricInput,
      activeAssessment.ociResult,
      options
    );
  }

  // Auto-save plan when planning options or override notes change (debounced)
  useEffect(() => {
    if (!activeAssessment || !treatmentPlan) return;
    
    // Extract current values for change guarding
    const currentOverride = activeAssessment.advanced?.finalClinicalSummary || activeAssessment.patientDetails.clinicalNotes || '';
    const currentAgeGroup = activeAssessment.advanced?.growthStatus?.includes('Active') ? 'growing' : 'adult';
    
    // Avoid running if values are identical to terminate loop
    if (clinicianOverride === currentOverride && ageGroup === currentAgeGroup) {
      return;
    }

    setIsSaving(true);
    const timer = setTimeout(() => {
      // Build the updated advanced data structure
      const updatedAdvanced: AdvancedClinicalIntelligence = {
        ...(activeAssessment.advanced || {}),
        complexity: treatmentPlan.treatmentComplexity,
        difficultyScore: treatmentPlan.treatmentComplexity === 'Severe / Surgical' ? '9' : treatmentPlan.treatmentComplexity === 'Complex' ? '7' : '4',
        extractionRecommendation: treatmentPlan.orthodonticCamouflage.extractionConsideration.includes('extraction is highly indicated') ? 'Extraction' : 'Non-Extraction',
        extractionReason: treatmentPlan.orthodonticCamouflage.extractionConsideration,
        surgeryRecommendation: treatmentPlan.surgicalOrthodontics.applicable ? 'Surgical Correction' : 'Orthodontic Camouflage',
        surgeryReason: treatmentPlan.surgicalOrthodontics.orthognathicReferralConsideration,
        primaryObjectives: treatmentPlan.treatmentObjectives[0] || 'Align dental arches.',
        secondaryObjectives: treatmentPlan.treatmentObjectives[1] || 'Optimize sagittal intercuspation.',
        treatmentSequence: 'Phase 1: Levelling & Alignment -> Phase 2: Space Closure -> Phase 3: Finishing',
        finalClinicalSummary: clinicianOverride || treatmentPlan.severityAssessment,
        growthStatus: ageGroup === 'growing' ? 'Active Growth Stage (Peak Vel.)' : 'Skeletally Mature (Completed)',
      };

      const updatedAssessment: Assessment = {
        ...activeAssessment,
        advanced: updatedAdvanced,
        patientDetails: {
          ...activeAssessment.patientDetails,
          clinicalNotes: clinicianOverride || activeAssessment.patientDetails.clinicalNotes
        }
      };

      onUpdateAssessment(updatedAssessment);
      setIsSaving(false);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [selectedId, ageGroup, crowdingSeverity, spacingSeverity, archDiscrepancy, clinicianOverride, activeAssessment, treatmentPlan]);

  const handleSavePlan = () => {
    if (!activeAssessment || !treatmentPlan) return;

    // Build the updated advanced data structure
    const updatedAdvanced: AdvancedClinicalIntelligence = {
      ...(activeAssessment.advanced || {}),
      complexity: treatmentPlan.treatmentComplexity,
      difficultyScore: treatmentPlan.treatmentComplexity === 'Severe / Surgical' ? '9' : treatmentPlan.treatmentComplexity === 'Complex' ? '7' : '4',
      extractionRecommendation: treatmentPlan.orthodonticCamouflage.extractionConsideration.includes('extraction is highly indicated') ? 'Extraction' : 'Non-Extraction',
      extractionReason: treatmentPlan.orthodonticCamouflage.extractionConsideration,
      surgeryRecommendation: treatmentPlan.surgicalOrthodontics.applicable ? 'Surgical Correction' : 'Orthodontic Camouflage',
      surgeryReason: treatmentPlan.surgicalOrthodontics.orthognathicReferralConsideration,
      primaryObjectives: treatmentPlan.treatmentObjectives[0] || 'Align dental arches.',
      secondaryObjectives: treatmentPlan.treatmentObjectives[1] || 'Optimize sagittal intercuspation.',
      treatmentSequence: 'Phase 1: Levelling & Alignment -> Phase 2: Space Closure -> Phase 3: Finishing',
      finalClinicalSummary: clinicianOverride || treatmentPlan.severityAssessment,
      growthStatus: ageGroup === 'growing' ? 'Active Growth Stage (Peak Vel.)' : 'Skeletally Mature (Completed)',
    };

    const updatedAssessment: Assessment = {
      ...activeAssessment,
      advanced: updatedAdvanced,
      patientDetails: {
        ...activeAssessment.patientDetails,
        clinicalNotes: clinicianOverride || activeAssessment.patientDetails.clinicalNotes
      }
    };

    onUpdateAssessment(updatedAssessment);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (savedAssessments.length === 0) {
    return (
      <View style={tw`flex-1 justify-center items-center p-6 bg-[#050814]`}>
        <View style={tw`bg-[#0B1020] border border-white/5 rounded-3xl p-8 max-w-md w-full items-center text-center shadow-2xl`}>
          <ShieldAlert size={48} color="#EF4444" style={tw`mb-4`} />
          <Text style={tw`text-lg font-black text-white text-center`}>No Patients Found</Text>
          <Text style={tw`text-xs text-slate-400 text-center mt-2 leading-relaxed`}>
            Please complete a Cephalometric Analysis and OCI assessment first to access the dynamic Treatment Planner.
          </Text>
        </View>
      </View>
    );
  }

  const complexityColor = (comp?: string) => {
    switch (comp) {
      case 'Severe / Surgical': return '#EF4444';
      case 'Complex': return '#F59E0B';
      case 'Moderate': return '#14B8A6';
      default: return '#10B981';
    }
  };

  const complexityBg = (comp?: string) => {
    switch (comp) {
      case 'Severe / Surgical': return 'bg-red-500/10 border-red-500/25';
      case 'Complex': return 'bg-amber-500/10 border-amber-500/25';
      case 'Moderate': return 'bg-teal-500/10 border-teal-500/25';
      default: return 'bg-emerald-500/10 border-emerald-500/25';
    }
  };

  return (
    <ScrollView style={tw`flex-1 bg-[#050814]`} contentContainerStyle={tw`pb-20`}>
      <View style={tw`p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full`}>
        
        {/* ====================================================
            HEADER BAR & PATIENT SELECTOR
           ==================================================== */}
        <View style={tw`flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0B1020]/40 p-6 rounded-3xl border border-white/5`}>
          <View style={tw`space-y-1`}>
            <View style={tw`flex-row items-center space-x-2`}>
              <Layers size={16} color="#14B8A6" />
              <Text style={tw`text-xs font-black text-teal-400 font-mono uppercase tracking-wider`}>Orthodontic Clinical Decision Support System</Text>
            </View>
            <Text style={tw`text-2xl font-black text-white`}>Treatment Planner & Biomechanics Engine</Text>
          </View>

          {/* Patient dropdown selection */}
          <View style={tw`w-full md:w-72`}>
            <Pressable
              onPress={() => {
                if (Platform.OS === 'android') {
                  UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
                }
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowPatientSelect(!showPatientSelect);
              }}
              style={tw`w-full bg-[#0B1226] border border-white/10 rounded-2xl px-4 py-3 flex-row justify-between items-center`}
            >
              <View style={tw`flex-row items-center space-x-2.5`}>
                <User size={14} color="#64748B" />
                <Text style={tw`text-xs font-extrabold text-white`}>
                  {activeAssessment ? activeAssessment.patientDetails.name : 'Select Patient'}
                </Text>
              </View>
              {showPatientSelect ? (
                <ChevronUp size={14} color="#14B8A6" />
              ) : (
                <ChevronDown size={14} color="#14B8A6" />
              )}
            </Pressable>
 
            {showPatientSelect && (
              <View style={tw`mt-2 bg-[#0B1020] border border-white/10 rounded-2xl overflow-hidden shadow-2xl`}>
                {savedAssessments.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      if (Platform.OS === 'android') {
                        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
                      }
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setSelectedId(item.id);
                      setShowPatientSelect(false);
                    }}
                    style={tw`px-4 py-3.5 border-b border-white/5 hover:bg-white/3 flex-row justify-between items-center`}
                  >
                    <View>
                      <Text style={tw`text-xs font-black text-white`}>{item.patientDetails.name}</Text>
                      <Text style={tw`text-[9px] text-slate-500 mt-0.5`}>ID: {item.patientDetails.caseNumber || 'N/A'}</Text>
                    </View>
                    {selectedId === item.id && <Check size={12} color="#14B8A6" />}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {activeAssessment && treatmentPlan && (
          <View style={tw`space-y-4`}>
            
            {/* 1. Orthodontic Clinical Decision Support System Accordion */}
            <View style={tw`bg-[#0B1020] border border-white/5 rounded-[28px] overflow-hidden shadow-xl`}>
              <Pressable
                onPress={() => toggleSection('cdss')}
                style={tw`p-5 flex-row justify-between items-center bg-[#0D152B]/60`}
              >
                <View style={tw`flex-row items-center space-x-3`}>
                  <View style={tw`w-8 h-8 rounded-full bg-teal-500/10 items-center justify-center`}>
                    <Layers size={14} color="#14B8A6" />
                  </View>
                  <Text style={tw`text-sm font-black text-white`}>Orthodontic Clinical Decision Support System</Text>
                </View>
                <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
                  {expandedSection === 'cdss' ? (
                    <ChevronUp size={14} color="#14B8A6" />
                  ) : (
                    <ChevronDown size={14} color="#14B8A6" />
                  )}
                </View>
              </Pressable>
              
              {expandedSection === 'cdss' && (
                <View style={tw`p-5 border-t border-white/5 space-y-5`}>
                  <View style={tw`flex-col md:flex-row gap-5`}>
                    
                    {/* Patient Profile Sub-Card */}
                    <View style={tw`flex-1 bg-black/25 rounded-2xl p-4 border border-white/5 space-y-3`}>
                      <Text style={tw`text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono border-b border-white/5 pb-1`}>
                        Active Patient Demographics
                      </Text>
                      <View style={tw`space-y-2`}>
                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={tw`text-xs text-slate-400`}>Gender / Age</Text>
                          <Text style={tw`text-xs font-bold text-white`}>
                            {activeAssessment.patientDetails.gender} • {activeAssessment.patientDetails.age} Y
                          </Text>
                        </View>
                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={tw`text-xs text-slate-400`}>Diagnosis Base</Text>
                          <Text style={tw`text-xs font-bold text-teal-400`}>
                            Skeletal {activeAssessment.patientDetails.diagnosis || 'Class I'}
                          </Text>
                        </View>
                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={tw`text-xs text-slate-400`}>Dentition Phase</Text>
                          <Text style={tw`text-xs font-bold text-[#22D3EE]`}>
                            {activeAssessment.patientDetails.dentitionPhase || 'Permanent Dentition'}
                          </Text>
                        </View>
                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={tw`text-xs text-slate-400`}>OCI Score</Text>
                          <Text style={tw`text-xs font-black text-white font-mono`}>
                            {activeAssessment.ociResult.totalScore}%
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Adjusted Options Sub-Card */}
                    <View style={tw`flex-1 bg-black/25 rounded-2xl p-4 border border-white/5 space-y-4`}>
                      <Text style={tw`text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono border-b border-white/5 pb-1`}>
                        Adjusted Treatment Variables
                      </Text>
                      
                      <View style={tw`space-y-4`}>
                        {/* Timing selector */}
                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={tw`text-xs text-slate-400`}>Timing Target</Text>
                          <View style={tw`flex-row bg-black/40 p-0.5 rounded-lg border border-white/5`}>
                            {[
                              { key: 'growing', label: 'Growing' },
                              { key: 'adult', label: 'Adult' }
                            ].map((opt) => (
                              <Pressable 
                                key={opt.key}
                                onPress={() => setAgeGroup(opt.key as any)}
                                style={tw`px-2.5 py-1 rounded-md ${ageGroup === opt.key ? 'bg-[#14B8A6]' : ''}`}
                              >
                                <Text style={tw`text-[9px] font-bold text-white`}>{opt.label}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>

                        {/* Crowding selector */}
                        <View style={tw`flex-row justify-between items-center`}>
                          <Text style={tw`text-xs text-slate-400`}>Mand. Crowding</Text>
                          <View style={tw`flex-row bg-black/40 p-0.5 rounded-lg border border-white/5`}>
                            {['none', 'mild', 'moderate', 'severe'].map((lvl) => (
                              <Pressable 
                                key={lvl}
                                onPress={() => {
                                  setCrowdingSeverity(lvl as any);
                                  setSpacingSeverity('none');
                                }}
                                style={tw`px-2 py-0.5 rounded-md ${crowdingSeverity === lvl ? 'bg-teal-500/20 border border-teal-500/30' : ''}`}
                              >
                                <Text style={tw`text-[8px] font-black text-slate-300 uppercase`}>{lvl}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      </View>
                    </View>

                  </View>

                  {/* Problem list & Objectives */}
                  <View style={tw`flex-col md:flex-row gap-5`}>
                    
                    {/* Diagnostic Problem List */}
                    <View style={tw`flex-1 bg-black/25 rounded-2xl p-4 border border-white/5 space-y-2`}>
                      <Text style={tw`text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono border-b border-white/5 pb-1`}>
                        Diagnostic Problem List
                      </Text>
                      <ScrollView style={{ maxHeight: 120 }}>
                        <View style={tw`space-y-1.5`}>
                          {treatmentPlan.problemList.map((problem, i) => (
                            <View key={i} style={tw`flex-row items-start space-x-2`}>
                              <Text style={tw`text-rose-500 font-bold text-xs mt-0.5`}>•</Text>
                              <Text style={tw`text-xs font-semibold text-slate-300 leading-relaxed flex-1`}>{problem}</Text>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Objectives */}
                    <View style={tw`flex-1 bg-black/25 rounded-2xl p-4 border border-white/5 space-y-2`}>
                      <Text style={tw`text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono border-b border-white/5 pb-1`}>
                        Primary Treatment Objectives
                      </Text>
                      <ScrollView style={{ maxHeight: 120 }}>
                        <View style={tw`space-y-1.5`}>
                          {treatmentPlan.treatmentObjectives.map((obj, i) => (
                            <View key={i} style={tw`flex-row items-start space-x-2`}>
                              <Text style={tw`text-emerald-400 font-bold text-xs mt-0.5`}>✓</Text>
                              <Text style={tw`text-xs font-semibold text-slate-300 leading-relaxed flex-1`}>{obj}</Text>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                  </View>
                </View>
              )}
            </View>

            {/* 2. Treatment Planner Accordion */}
            <View style={tw`bg-[#0B1020] border border-white/5 rounded-[28px] overflow-hidden shadow-xl`}>
              <Pressable
                onPress={() => toggleSection('planner')}
                style={tw`p-5 flex-row justify-between items-center bg-[#0D152B]/60`}
              >
                <View style={tw`flex-row items-center space-x-3`}>
                  <View style={tw`w-8 h-8 rounded-full bg-amber-500/10 items-center justify-center`}>
                    <Compass size={14} color="#F59E0B" />
                  </View>
                  <Text style={tw`text-sm font-black text-white`}>Treatment Planner</Text>
                </View>
                <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
                  {expandedSection === 'planner' ? (
                    <ChevronUp size={14} color="#F59E0B" />
                  ) : (
                    <ChevronDown size={14} color="#F59E0B" />
                  )}
                </View>
              </Pressable>

              {expandedSection === 'planner' && (
                <View style={tw`p-5 border-t border-white/5 space-y-6`}>
                  {/* Complexity Banner */}
                  <View style={tw`p-4 rounded-2xl border ${complexityBg(treatmentPlan.treatmentComplexity)} flex-row justify-between items-center gap-4`}>
                    <View style={tw`space-y-1 flex-1`}>
                      <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>OCI COMPLEXITY CLASSIFICATION</Text>
                      <Text style={[tw`text-lg font-black`, { color: complexityColor(treatmentPlan.treatmentComplexity) }]}>
                        {treatmentPlan.treatmentComplexity} malocclusion
                      </Text>
                      <Text style={tw`text-xs text-slate-300 leading-relaxed`}>
                        {treatmentPlan.severityAssessment}
                      </Text>
                    </View>
                    <View style={tw`w-10 h-10 rounded-full items-center justify-center bg-white/5 border border-white/10 shrink-0`}>
                      <Award size={18} color={complexityColor(treatmentPlan.treatmentComplexity)} />
                    </View>
                  </View>

                  {/* Growth Blueprint / Surgical Protocols */}
                  {ageGroup === 'growing' ? (
                    <View style={tw`bg-black/25 rounded-2xl p-4 border border-white/5 space-y-3`}>
                      <View style={tw`flex-row items-center space-x-2 border-b border-white/5 pb-2`}>
                        <TrendingUp size={13} color="#22D3EE" />
                        <Text style={tw`text-[9px] font-black text-slate-200 uppercase tracking-widest font-mono`}>
                          ORTHOPEDIC GROWTH MODIFICATION BLUEPRINT
                        </Text>
                      </View>
                      <View style={tw`space-y-3`}>
                        <View style={tw`bg-[#22D3EE]/5 p-3.5 rounded-xl border border-[#22D3EE]/15 space-y-1`}>
                          <Text style={tw`text-[8px] text-cyan-400 font-black uppercase tracking-wider`}>Timing Consideration</Text>
                          <Text style={tw`text-xs text-slate-200 leading-relaxed`}>{treatmentPlan.growthModification.timingConsideration}</Text>
                        </View>
                        <View style={tw`space-y-2`}>
                          <Text style={tw`text-xs font-bold text-slate-300`}>Growth guidance devices:</Text>
                          {treatmentPlan.growthModification.growthGuidanceOptions.map((opt, idx) => (
                            <View key={idx} style={tw`flex-row items-start space-x-2 bg-black/25 p-3 rounded-xl border border-white/5`}>
                              <Text style={tw`text-cyan-400 font-black text-xs`}>•</Text>
                              <Text style={tw`text-xs text-slate-300 flex-1 leading-relaxed`}>{opt}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  ) : treatmentPlan.surgicalOrthodontics.applicable ? (
                    <View style={tw`bg-red-950/15 rounded-2xl p-4 border border-red-500/20 space-y-3`}>
                      <View style={tw`flex-row items-center space-x-2 border-b border-red-500/10 pb-2`}>
                        <ShieldAlert size={13} color="#EF4444" />
                        <Text style={tw`text-[9px] font-black text-rose-400 uppercase tracking-widest font-mono`}>
                          SURGICAL ORTHODONTICS INDICATED (SEVERE MALOCCLUSION)
                        </Text>
                      </View>
                      <Text style={tw`text-xs text-slate-300 leading-relaxed`}>
                        {treatmentPlan.surgicalOrthodontics.orthognathicReferralConsideration}
                      </Text>
                    </View>
                  ) : null}

                  {/* Overrides & Auto-save indicator */}
                  <View style={tw`bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3`}>
                    <Text style={tw`text-[9px] font-black text-slate-200 uppercase tracking-widest font-mono border-b border-white/5 pb-1`}>
                      CLINICIAN OVERRIDES & CLINICAL NOTES
                    </Text>
                    <TextInput
                      value={clinicianOverride}
                      onChangeText={setClinicianOverride}
                      multiline
                      numberOfLines={3}
                      placeholder="Enter clinical objectives, diagnostic caveats, or patient-specific instructions to override standard recommendations..."
                      placeholderTextColor="#64748B"
                      style={[tw`w-full px-4 py-3 bg-black/45 text-slate-100 font-sans text-xs rounded-xl border border-white/10 focus:border-[#14B8A6]`, { minHeight: 80 }]}
                    />

                    <Pressable
                      disabled={true}
                      style={tw`w-full py-3 rounded-xl items-center justify-center border ${isSaving ? 'bg-amber-600/10 border-amber-500/20' : 'bg-emerald-600/10 border-emerald-500/20'}`}
                    >
                      <View style={tw`flex-row items-center space-x-2`}>
                        {isSaving ? (
                          <>
                            <ActivityIndicator size="small" color="#F59E0B" />
                            <Text style={tw`text-xs font-black text-amber-400 uppercase tracking-widest`}>Saving Plan...</Text>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} color="#10B981" />
                            <Text style={tw`text-xs font-black text-emerald-400 uppercase tracking-widest`}>Plan Auto-Saved</Text>
                          </>
                        )}
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* 3. Biomechanics Engine Accordion */}
            <View style={tw`bg-[#0B1020] border border-white/5 rounded-[28px] overflow-hidden shadow-xl`}>
              <Pressable
                onPress={() => toggleSection('biomechanics')}
                style={tw`p-5 flex-row justify-between items-center bg-[#0D152B]/60`}
              >
                <View style={tw`flex-row items-center space-x-3`}>
                  <View style={tw`w-8 h-8 rounded-full bg-cyan-500/10 items-center justify-center`}>
                    <Activity size={14} color="#22D3EE" />
                  </View>
                  <Text style={tw`text-sm font-black text-white`}>Biomechanics Engine</Text>
                </View>
                <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
                  {expandedSection === 'biomechanics' ? (
                    <ChevronUp size={14} color="#22D3EE" />
                  ) : (
                    <ChevronDown size={14} color="#22D3EE" />
                  )}
                </View>
              </Pressable>

              {expandedSection === 'biomechanics' && (
                <View style={tw`p-5 border-t border-white/5 space-y-6`}>
                  
                  {/* Camouflage Strategy */}
                  <View style={tw`bg-black/25 rounded-2xl p-4 border border-white/5 space-y-3`}>
                    <View style={tw`flex-row items-center space-x-2 border-b border-white/5 pb-2`}>
                      <Compass size={13} color="#14B8A6" />
                      <Text style={tw`text-[9px] font-black text-slate-200 uppercase tracking-widest font-mono`}>
                        CAMOUFLAGE & ANCHORAGE BIOMECHANICS
                      </Text>
                    </View>

                    <View style={tw`flex-col md:flex-row gap-4`}>
                      <View style={tw`flex-1 bg-black/30 p-3 rounded-xl border border-white/5 space-y-1`}>
                        <Text style={tw`text-[8px] text-slate-500 font-bold uppercase`}>Extraction Assessment</Text>
                        <Text style={tw`text-[10px] text-slate-300 leading-relaxed`}>
                          {treatmentPlan.orthodonticCamouflage.extractionConsideration}
                        </Text>
                      </View>

                      <View style={tw`flex-1 bg-black/30 p-3 rounded-xl border border-white/5 space-y-1`}>
                        <Text style={tw`text-[8px] text-slate-500 font-bold uppercase`}>Space Management</Text>
                        <Text style={tw`text-[10px] text-slate-300 leading-relaxed`}>
                          {treatmentPlan.orthodonticCamouflage.spaceManagement}
                        </Text>
                      </View>
                    </View>

                    <View style={tw`bg-[#14B8A6]/5 p-3.5 rounded-xl border border-[#14B8A6]/10 space-y-1`}>
                      <Text style={tw`text-[8px] text-teal-400 font-black uppercase`}>Dental Compensation Strategy</Text>
                      <Text style={tw`text-[11px] text-slate-200 leading-relaxed`}>
                        {treatmentPlan.orthodonticCamouflage.incisorCompensationStrategies}
                      </Text>
                    </View>
                  </View>

                  {/* Appliance Recommendations */}
                  <View style={tw`bg-black/25 rounded-2xl p-4 border border-white/5 space-y-3`}>
                    <View style={tw`flex-row items-center space-x-2 border-b border-white/5 pb-2`}>
                      <Zap size={13} color="#14B8A6" />
                      <Text style={tw`text-[9px] font-black text-slate-200 uppercase tracking-widest font-mono`}>
                        RECOMMENDED CLINICAL APPLIANCES
                      </Text>
                    </View>

                    <View style={tw`flex-col md:flex-row gap-4`}>
                      {treatmentPlan.applianceSuggestions.map((group, idx) => (
                        <View key={idx} style={tw`flex-1 bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-2`}>
                          <Text style={tw`text-[9px] font-black text-[#14B8A6] uppercase tracking-wider font-mono`}>
                            {group.category}
                          </Text>
                          <Text style={tw`text-[10px] text-slate-400 leading-normal`}>
                            {group.justification}
                          </Text>
                          <View style={tw`flex-row flex-wrap gap-1 pt-1`}>
                            {group.items.map((item, itemIdx) => (
                              <View key={itemIdx} style={tw`bg-white/5 px-2.5 py-1 rounded-lg border border-white/10`}>
                                <Text style={tw`text-[8px] font-bold text-slate-300`}>{item}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>

          </View>
        )}

      </View>
    </ScrollView>
  );
}
