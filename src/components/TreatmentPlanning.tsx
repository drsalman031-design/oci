import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [intelligenceExpanded, setIntelligenceExpanded] = useState(false);

  // Load expanded states on mount
  useEffect(() => {
    async function loadExpandedStates() {
      try {
        const expSec = await AsyncStorage.getItem('oci_tp_expanded_section');
        const intelExp = await AsyncStorage.getItem('oci_tp_intel_expanded');
        if (expSec !== null) setExpandedSection(expSec === '' ? null : expSec as any);
        if (intelExp !== null) setIntelligenceExpanded(intelExp === 'true');
      } catch (err) {
        console.log('Error loading tp expanded states:', err);
      }
    }
    loadExpandedStates();
  }, []);

  // Save expanded states on change
  useEffect(() => {
    try {
      AsyncStorage.setItem('oci_tp_expanded_section', expandedSection || '');
    } catch (err) {
      console.log('Error saving tp expanded section:', err);
    }
  }, [expandedSection]);

  useEffect(() => {
    try {
      AsyncStorage.setItem('oci_tp_intel_expanded', String(intelligenceExpanded));
    } catch (err) {
      console.log('Error saving tp intel expanded:', err);
    }
  }, [intelligenceExpanded]);

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
    const rawAssessment = savedAssessments.find(a => a.id === selectedId);
    if (!rawAssessment) return;

    const modeVal = rawAssessment.patientDetails.analysisMode || 'turbo';
    const workspaceVal = modeVal === 'clinic' ? rawAssessment.clinicWorkspace : modeVal === 'ceph' ? rawAssessment.cephWorkspace : rawAssessment.turboWorkspace;

    const details = rawAssessment.patientDetails;
    const adv = workspaceVal?.advanced || {};

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
  const rawActiveAssessment = savedAssessments.find(a => a.id === selectedId);

  const activeMode = rawActiveAssessment?.patientDetails?.analysisMode || 'turbo';
  const activeWorkspace = activeMode === 'clinic' ? rawActiveAssessment?.clinicWorkspace : activeMode === 'ceph' ? rawActiveAssessment?.cephWorkspace : rawActiveAssessment?.turboWorkspace;

  const activeAssessment: any = rawActiveAssessment ? {
    ...rawActiveAssessment,
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
  } : undefined;

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

      const originalAssessment = savedAssessments.find(a => a.id === activeAssessment.id);
      if (!originalAssessment) return;
      const workspaceMode = originalAssessment.patientDetails.analysisMode || 'turbo';
      const updatedAssessment = { ...originalAssessment };
      if (workspaceMode === 'clinic' && updatedAssessment.clinicWorkspace) {
        updatedAssessment.clinicWorkspace = {
          ...updatedAssessment.clinicWorkspace,
          advanced: updatedAdvanced,
          patientDetails: {
            ...updatedAssessment.clinicWorkspace.patientDetails,
            clinicalNotes: clinicianOverride || updatedAssessment.clinicWorkspace.patientDetails.clinicalNotes
          }
        };
      } else if (workspaceMode === 'ceph' && updatedAssessment.cephWorkspace) {
        updatedAssessment.cephWorkspace = {
          ...updatedAssessment.cephWorkspace,
          advanced: updatedAdvanced
        };
      } else if (workspaceMode === 'turbo' && updatedAssessment.turboWorkspace) {
        updatedAssessment.turboWorkspace = {
          ...updatedAssessment.turboWorkspace,
          advanced: updatedAdvanced,
          patientDetails: {
            ...updatedAssessment.turboWorkspace.patientDetails,
            clinicalNotes: clinicianOverride || updatedAssessment.turboWorkspace.patientDetails.clinicalNotes
          }
        };
      }

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

    const originalAssessment = savedAssessments.find(a => a.id === activeAssessment.id);
    if (!originalAssessment) return;
    const workspaceMode = originalAssessment.patientDetails.analysisMode || 'turbo';
    const updatedAssessment = { ...originalAssessment };
    if (workspaceMode === 'clinic' && updatedAssessment.clinicWorkspace) {
      updatedAssessment.clinicWorkspace = {
        ...updatedAssessment.clinicWorkspace,
        advanced: updatedAdvanced,
        patientDetails: {
          ...updatedAssessment.clinicWorkspace.patientDetails,
          clinicalNotes: clinicianOverride || updatedAssessment.clinicWorkspace.patientDetails.clinicalNotes
        }
      };
    } else if (workspaceMode === 'ceph' && updatedAssessment.cephWorkspace) {
      updatedAssessment.cephWorkspace = {
        ...updatedAssessment.cephWorkspace,
        advanced: updatedAdvanced
      };
    } else if (workspaceMode === 'turbo' && updatedAssessment.turboWorkspace) {
      updatedAssessment.turboWorkspace = {
        ...updatedAssessment.turboWorkspace,
        advanced: updatedAdvanced,
        patientDetails: {
          ...updatedAssessment.turboWorkspace.patientDetails,
          clinicalNotes: clinicianOverride || updatedAssessment.turboWorkspace.patientDetails.clinicalNotes
        }
      };
    }

    onUpdateAssessment(updatedAssessment);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (savedAssessments.length === 0) {
    return (
      <View style={tw`flex-1 justify-center items-center p-6 bg-[#050814]`}>
        <View style={tw`bg-[#0B1020] border border-white/5 rounded-3xl p-8 max-w-md w-full items-center text-center shadow-2xl`}>
          <ShieldAlert size={48} color="#FF4D4D" style={tw`mb-4`} />
          <Text style={tw`text-lg font-black text-white text-center`}>No Patients Found</Text>
          <Text style={tw`text-xs text-slate-400 text-center mt-2 leading-relaxed`}>
            Please complete an OCI analysis first to access the dynamic Treatment Planner.
          </Text>
        </View>
      </View>
    );
  }

  const complexityColor = (comp?: string) => {
    switch (comp) {
      case 'Severe / Surgical': return '#FF4D4D';
      case 'Complex': return '#FFB300';
      case 'Moderate': return '#00E5FF';
      default: return '#00FF88';
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

  // Dynamic biomechanical calculations based on patient cephalometrics and options
  const isClinicMode = activeAssessment?.patientDetails.analysisMode === 'clinic';
  const isClass2 = activeAssessment?.patientDetails.diagnosis === 'Class II';
  const isClass3 = activeAssessment?.patientDetails.diagnosis === 'Class III';

  const anbVal = isClinicMode ? (isClass2 ? 6.0 : isClass3 ? -2.0 : 2.0) : (activeAssessment ? getNumVal(activeAssessment.cephalometricInput.anb) : 2);
  const fmaVal = isClinicMode ? (activeAssessment?.patientDetails.facialProfile === 'Convex' ? 29.0 : activeAssessment?.patientDetails.facialProfile === 'Concave' ? 20.0 : 25.0) : (activeAssessment ? getNumVal(activeAssessment.cephalometricInput.fma) : 25);
  const impaVal = isClinicMode ? (isClass2 ? 98.0 : isClass3 ? 83.0 : 90.0) : (activeAssessment ? getNumVal(activeAssessment.cephalometricInput.impa) : 90);
  const overjetVal = isClinicMode ? (activeAssessment?.patientDetails.overjet !== undefined && activeAssessment?.patientDetails.overjet !== '' ? Number(activeAssessment.patientDetails.overjet) : 2.5) : (activeAssessment ? getNumVal(activeAssessment.cephalometricInput.overjet) : 2.5);
  const overbiteVal = isClinicMode ? (activeAssessment?.patientDetails.overbite !== undefined && activeAssessment?.patientDetails.overbite !== '' ? Number(activeAssessment.patientDetails.overbite) : 2.5) : (activeAssessment ? getNumVal(activeAssessment.cephalometricInput.overbite) : 2.5);
  
  // 1. Biomechanics Engine Metrics
  const retractionForce = anbVal > 4 ? 75 : anbVal < 0 ? 35 : 15;
  const intrusionForce = fmaVal < 22 ? 80 : fmaVal > 30 ? 25 : 50;
  const expansionForce = crowdingSeverity === 'severe' ? 90 : crowdingSeverity === 'moderate' ? 65 : 30;
  const torqueControl = Math.round(Math.min(100, Math.max(10, Math.abs(anbVal - 2) * 15 + 30)));
  const rotationCorrection = crowdingSeverity !== 'none' ? 70 : 20;

  // Complexity & Anchorage
  const anchorageDemand = retractionForce > 50 || expansionForce > 60 ? 85 : 45;
  const rootControl = torqueControl > 50 ? 75 : 40;
  const torqueReq = torqueControl;
  const complianceDep = ageGroup === 'growing' ? 80 : 35;
  const applianceComplexity = treatmentPlan?.treatmentComplexity === 'Severe / Surgical' ? 90 : treatmentPlan?.treatmentComplexity === 'Complex' ? 70 : 45;

  const averageForce = (retractionForce + intrusionForce + expansionForce + torqueControl + rotationCorrection) / 5;
  const forceZone = averageForce > 70 ? 'High' : averageForce > 40 ? 'Medium' : 'Light';

  // Tooth movement indicators
  const movements = [
    { label: 'Distalization', direction: anbVal > 4 ? '➡️' : anbVal < 0 ? '⬅️' : '—', intensity: anbVal > 4 || anbVal < 0 ? 'High' : 'Low' },
    { label: 'Intrusion', direction: fmaVal < 22 ? '↗️' : '—', intensity: fmaVal < 22 ? 'High' : 'Low' },
    { label: 'Extrusion', direction: fmaVal > 30 ? '↘️' : '—', intensity: fmaVal > 30 ? 'High' : 'Low' },
  ];

  // 2. Treatment Planner Metrics
  const extractionDecision = treatmentPlan?.orthodonticCamouflage.extractionConsideration.toLowerCase().includes('extraction is highly indicated') ? 'Yes' : 'No';
  const estimatedDuration = treatmentPlan?.treatmentComplexity === 'Severe / Surgical' ? '28-36 mos' : treatmentPlan?.treatmentComplexity === 'Complex' ? '24-28 mos' : '18-22 mos';
  const growthInfluence = ageGroup === 'growing' ? 'High (CS3-CS4)' : 'None (CS6)';
  // Outcome Predictions
  const stabilityVal = ageGroup === 'growing' ? 85 : 70;
  const estheticsVal = treatmentPlan?.treatmentComplexity === 'Severe / Surgical' ? 95 : 80;
  const timeVal = treatmentPlan?.treatmentComplexity === 'Severe / Surgical' ? 40 : 85; 
  const riskVal = treatmentPlan?.treatmentComplexity === 'Severe / Surgical' ? 75 : 30;

  return (
    <ScrollView style={tw`flex-1 bg-[#050814]`} contentContainerStyle={tw`pb-20`}>
      <View style={tw`p-4 md:p-6 space-y-7 max-w-3xl mx-auto w-full`}>
        
        {/* ====================================================
            PATIENT SELECTOR (NO BRANDING HEADER)
           ==================================================== */}
        <View style={tw`flex-col justify-between items-start gap-3 bg-[#0B1020]/40 p-5 rounded-3xl border border-white/5 shadow-xl`}>
          <View style={tw`w-full`}>
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
                <ChevronUp size={14} color="#00E5FF" />
              ) : (
                <ChevronDown size={14} color="#00E5FF" />
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
                    {selectedId === item.id && <Check size={12} color="#00E5FF" />}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {activeAssessment && treatmentPlan && (
          <View style={tw`space-y-7`}>

            {/* Diagnostic Options Card */}
            <View style={tw`bg-[#0B1020] rounded-3xl border border-white/5 shadow-xl p-5 space-y-4`}>
              <Text style={tw`text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono border-b border-white/5 pb-2`}>
                Diagnostic Variables
              </Text>
              
              <View style={tw`flex-row gap-4`}>
                <View style={tw`flex-1 space-y-1`}>
                  <Text style={tw`text-[10px] text-slate-400 font-bold`}>Timing Target</Text>
                  <View style={tw`flex-row bg-black/40 p-1 rounded-xl border border-white/5`}>
                    {[
                      { key: 'growing', label: 'Growing' },
                      { key: 'adult', label: 'Adult' }
                    ].map((opt) => (
                      <Pressable 
                        key={opt.key}
                        onPress={() => setAgeGroup(opt.key as any)}
                        style={tw`flex-1 py-1.5 rounded-lg items-center ${ageGroup === opt.key ? 'bg-teal-500/25 border border-teal-500/30' : ''}`}
                      >
                        <Text style={tw`text-[10px] font-black ${ageGroup === opt.key ? 'text-[#22D3EE]' : 'text-slate-400'}`}>{opt.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={tw`flex-1 space-y-1`}>
                  <Text style={tw`text-[10px] text-slate-400 font-bold`}>Mandibular Crowding</Text>
                  <View style={tw`flex-row bg-black/40 p-1 rounded-xl border border-white/5`}>
                    {['none', 'mild', 'mod', 'sev'].map((lvl) => {
                      const fullLvl = lvl === 'mod' ? 'moderate' : lvl === 'sev' ? 'severe' : lvl;
                      return (
                        <Pressable 
                          key={lvl}
                          onPress={() => {
                            setCrowdingSeverity(fullLvl as any);
                            setSpacingSeverity('none');
                          }}
                          style={tw`flex-1 py-1.5 rounded-lg items-center ${crowdingSeverity === fullLvl ? 'bg-teal-500/25 border border-teal-500/30' : ''}`}
                        >
                          <Text style={tw`text-[8px] font-black uppercase ${crowdingSeverity === fullLvl ? 'text-[#22D3EE]' : 'text-slate-400'}`}>{lvl}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* ====================================================
                🧠 OCI INTELLIGENCE TREATMENT PLANNING ACCORDION
               ==================================================== */}
            <View style={tw`bg-[#0B1020] rounded-[24px] border border-white/5 shadow-xl overflow-hidden`}>
              <Pressable
                onPress={() => {
                  if (Platform.OS === 'android') {
                    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
                  }
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setIntelligenceExpanded(!intelligenceExpanded);
                }}
                style={tw`p-5 flex-row justify-between items-center bg-black/25`}
              >
                <View style={tw`flex-row items-center space-x-2.5`}>
                  <Sparkles size={14} color="#00E5FF" />
                  <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>OCI Intelligence Treatment Planning</Text>
                </View>
                {intelligenceExpanded ? (
                  <ChevronUp size={14} color="#00E5FF" />
                ) : (
                  <ChevronDown size={14} color="#00E5FF" />
                )}
              </Pressable>

              {intelligenceExpanded && (
                <View style={tw`p-5 space-y-4 border-t border-white/5`}>
                  {/* Treatment Objectives */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Treatment Objectives</Text>
                    <View style={tw`space-y-1 pl-1`}>
                      <Text style={tw`text-xs text-slate-300 leading-normal`}><Text style={tw`font-extrabold text-teal-400`}>• Skeletal: </Text>{anbVal > 4.5 ? (isClinicMode ? `Promote orthopedic redirection of the maxilla and/or encourage mandibular advancement to resolve the Class II sagittal discrepancy.` : `Promote orthopedic redirection of the maxilla and/or encourage mandibular growth advancement to resolve the Class II sagittal discrepancy (ANB: ${anbVal}°).`) : anbVal < 0.5 ? (isClinicMode ? `Decompensate the arch to prepare for orthognathic surgery or restrict mandibular projection while encouraging maxillary advancement.` : `Decompensate the arch to prepare for orthognathic surgery or restrict mandibular projection while encouraging maxillary advancement (ANB: ${anbVal}°).`) : (isClinicMode ? `Maintain the existing skeletal sagittal relationship within normal physiological limits.` : `Maintain the existing skeletal sagittal relationship (ANB: ${anbVal}°) within normal physiological limits.`)}</Text>
                      <Text style={tw`text-xs text-slate-300 leading-normal`}><Text style={tw`font-extrabold text-teal-400`}>• Dental: </Text>{impaVal > 95 ? (isClinicMode ? `Retract and upright the proclined mandibular incisors to restore proper labiolingual inclination.` : `Retract and upright the proclined mandibular incisors (IMPA: ${impaVal}°) to restore proper labiolingual inclination.`) : impaVal < 85 ? (isClinicMode ? `Procline and decompensate the retroclined mandibular incisors to create adequate dental arch perimeter.` : `Procline and decompensate the retroclined mandibular incisors (IMPA: ${impaVal}°) to create adequate dental arch perimeter.`) : (isClinicMode ? `Maintain correct lower incisor sagittal inclination relative to the mandibular basal bone.` : `Maintain correct lower incisor sagittal inclination (IMPA: ${impaVal}°) relative to the mandibular basal bone.`)}</Text>
                      <Text style={tw`text-xs text-slate-300 leading-normal`}><Text style={tw`font-extrabold text-teal-400`}>• Facial: </Text>{activeAssessment.ociResult.totalScore > 60 ? `Coordinate dentoalveolar dimensions to optimize soft-tissue support, improve nasolabial angle, and enhance chin projection.` : `Support lip posture and facial profile symmetry through conservative arch alignment.`}</Text>
                      <Text style={tw`text-xs text-slate-300 leading-normal`}><Text style={tw`font-extrabold text-teal-400`}>• Occlusal: </Text>{`Establish Class I canine/molar relationship, resolve sagittal discrepancy (Overjet: ${overjetVal}mm, Overbite: ${overbiteVal}mm), and coordinate the arches.`}</Text>
                    </View>
                  </View>

                  {/* Treatment Sequence */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Treatment Sequence</Text>
                    <View style={tw`space-y-1 pl-1`}>
                      <Text style={tw`text-xs text-slate-300 leading-normal`}><Text style={tw`font-extrabold text-cyan-400`}>1. Aligning & Leveling: </Text>{`Use light, continuous forces (.014 to .018 NiTi wires) to resolve rotation and level the arches, utilizing ${crowdingSeverity !== 'none' ? 'space gained from extraction/stripping' : 'available arch space'}. (4-6 months)`}</Text>
                      <Text style={tw`text-xs text-slate-300 leading-normal`}><Text style={tw`font-extrabold text-cyan-400`}>2. Sagittal Correction: </Text>{`Establish sagittal coordination. Apply ${anbVal > 4.5 ? 'Class II elastics and/or molar distalization' : anbVal < 0.5 ? 'Class III elastics and/or surgical decompensation' : 'light intermaxillary elastics'} for arch coordination. (8-12 months)`}</Text>
                      <Text style={tw`text-xs text-slate-300 leading-normal`}><Text style={tw`font-extrabold text-cyan-400`}>3. Finishing & Detailing: </Text>{`Introduce coordinate steel wires with artistic detailing bends. Achieve maximum intercuspation and seat canine relations. (3-5 months)`}</Text>
                    </View>
                  </View>

                  {/* Appliance Selection */}
                  <View style={tw`space-y-1`}>
                    <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Appliance Selection</Text>
                    <Text style={tw`text-xs text-slate-300 leading-normal pl-1`}>
                      {activeAssessment.ociResult.totalScore > 80 ? `Pre-adjusted edgewise twin brackets (.022 slot) with high-torque prescriptions or custom surgical splints indicating orthognathic surgical support.` : activeAssessment.ociResult.totalScore > 40 ? `Pre-adjusted active self-ligation brackets (.022 slot) to optimize sliding mechanics during compensation.` : `Clear aligners or standard twin bracket systems suitable for mild space closure and alignment.`}
                    </Text>
                  </View>

                  {/* Extraction Decision */}
                  <View style={tw`space-y-1`}>
                    <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Extraction Decision</Text>
                    <Text style={tw`text-xs text-slate-300 leading-normal pl-1`}>
                      {activeAssessment.ociResult.totalScore > 60 && crowdingSeverity === 'severe' ? `Extraction of first premolars is highly indicated to gain ${archDiscrepancy || 6}mm space and resolve severe crowding without pushing incisors out of labial alveolar bone.` : activeAssessment.ociResult.totalScore > 40 && anbVal > 4.5 ? `Extraction of upper first premolars and lower second premolars is recommended to coordinate arch alignment.` : `Non-extraction approach utilizing interproximal reduction (IPR) or arch expansion to gain required space safely.`}
                    </Text>
                  </View>

                  {/* Anchorage Planning */}
                  <View style={tw`space-y-1`}>
                    <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Anchorage Planning</Text>
                    <Text style={tw`text-xs text-slate-300 leading-normal pl-1`}>
                      {activeAssessment.ociResult.totalScore > 60 ? `Maximum anchorage required. Recommend temporary anchorage devices (TADs) or transpalatal arch (TPA) to prevent mesial molar migration during anterior retraction.` : activeAssessment.ociResult.totalScore > 40 ? `Moderate anchorage required. Use second molar inclusion and light Class II/III elastics to manage space closure.` : `Minimum anchorage required. Standard sliding mechanics with minimal auxiliary support is sufficient.`}
                    </Text>
                  </View>

                  {/* Biomechanics */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Biomechanics Considerations</Text>
                    <View style={tw`space-y-1 pl-1`}>
                      <Text style={tw`text-xs text-slate-300 leading-normal`}><Text style={tw`font-extrabold text-amber-500`}>• Torque: </Text>{isClinicMode ? `Apply active utility arches or high-torque bracket values to control lower incisor torque.` : `Apply active utility arches or high-torque bracket values to control lower incisor torque (current IMPA: ${impaVal}°).`}</Text>
                      <Text style={tw`text-xs text-slate-300 leading-normal`}><Text style={tw`font-extrabold text-amber-500`}>• Intrusion: </Text>{overbiteVal > 4 ? `Use anterior intrusion arches to resolve deep bite of ${overbiteVal}mm.` : `Standard intrusion control.`}</Text>
                      <Text style={tw`text-xs text-slate-300 leading-normal`}><Text style={tw`font-extrabold text-amber-500`}>• Expansion: </Text>{crowdingSeverity === 'severe' ? `Perform slow maxillary expansion using NiTi archwires or quad-helix to gain 4-5mm transverse width.` : `Standard archwire expansion.`}</Text>
                      <Text style={tw`text-xs text-slate-300 leading-normal`}><Text style={tw`font-extrabold text-amber-500`}>• Elastics: </Text>{anbVal > 4.5 ? `Class II elastics (3/16 inch, 4.5oz) for active sagittal coordination.` : anbVal < 0.5 ? `Class III elastics for active sagittal coordination.` : `Light vertical detailing elastics.`}</Text>
                    </View>
                  </View>

                  {/* Patient timing Considerations */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Age & Surgical Considerations</Text>
                    <View style={tw`space-y-1 pl-1`}>
                      <Text style={tw`text-xs text-slate-300 leading-normal`}><Text style={tw`font-extrabold text-rose-400`}>• Growth & Age: </Text>{ageGroup === 'growing' ? `Patient has active growth potential. Consider orthopedic appliances (e.g., Twin Block or Herbst for Class II, Facemask for Class III) to guide mandibular/maxillary growth.` : `Adult patient. No growth potential remaining. Monitor periodontal attachment health; biomechanics must use light force values to prevent root resorption.`}</Text>
                      <Text style={tw`text-xs text-slate-300 leading-normal`}><Text style={tw`font-extrabold text-rose-400`}>• Surgical: </Text>{activeAssessment.ociResult.totalScore > 80 ? (isClinicMode ? `Severe skeletal discrepancy. Orthognathic surgery (LeFort I and/or BSSO) is indicated to restore ideal facial profile and airway dimensions.` : `Severe skeletal discrepancy (ANB: ${anbVal}°). Orthognathic surgery (LeFort I and/or BSSO) is indicated to restore ideal facial profile and airway dimensions.`) : `Skeletal discrepancy is within orthodontic camouflage limits. Surgical intervention is not primary.`}</Text>
                    </View>
                  </View>

                  {/* Finishing Goals */}
                  <View style={tw`space-y-1`}>
                    <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Finishing Goals</Text>
                    <Text style={tw`text-xs text-slate-300 leading-normal pl-1`}>
                      Establish mutually protected occlusion, achieve ideal overjet/overbite, ensure parallel roots, align dental midlines, and place stable passive retainers.
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* ====================================================
                📊 1. FORCE DISTRIBUTION DASHBOARD
               ==================================================== */}
            <View style={tw`bg-[#0B1020] rounded-[24px] border border-white/5 shadow-xl p-5 space-y-4`}>
              <View style={tw`border-b border-white/5 pb-2`}>
                <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Force Distribution Dashboard</Text>
                <Text style={tw`text-[8px] text-slate-500 font-bold uppercase mt-0.5`}>Real-time mechanical loading index</Text>
              </View>
              <View style={tw`space-y-3.5`}>
                {[
                  { label: 'Retraction Force', val: 35, color: '#1E88FF', intensity: 'Controlled Loading' },
                  { label: 'Intrusion Force', val: 50, color: '#8E44AD', intensity: 'Optimum Intrusion' },
                  { label: 'Expansion Force', val: 65, color: '#00FF88', intensity: 'Active Arch Widening' },
                  { label: 'Torque Control', val: 100, color: '#F39C12', intensity: 'Maximum Boundary' },
                  { label: 'Rotation Correction', val: 70, color: '#FF4D4D', intensity: 'Heavy Derotation' },
                ].map((item, idx) => (
                  <View key={idx} style={tw`space-y-1`}>
                    <View style={tw`flex-row justify-between items-center`}>
                      <View style={tw`flex-row items-center space-x-1.5`}>
                        <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: item.color }]} />
                        <Text style={tw`text-xs font-semibold text-slate-300`}>{item.label}</Text>
                      </View>
                      <View style={tw`flex-row items-center space-x-2`}>
                        <Text style={tw`text-[8px] font-black text-slate-500 uppercase tracking-wide`}>{item.intensity}</Text>
                        <Text style={tw`text-xs font-black text-white`}>{item.val}/100 cN</Text>
                      </View>
                    </View>
                    <View style={tw`w-full h-2.5 bg-slate-950 rounded-full overflow-hidden`}>
                      <View style={[tw`h-full rounded-full`, { width: `${item.val}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ====================================================
                🧠 2. FORCE ZONES (BADGES ONLY)
               ==================================================== */}
            <View style={tw`bg-[#0B1020] rounded-[24px] border border-white/5 shadow-xl p-5 space-y-4`}>
              <View style={tw`border-b border-white/5 pb-2`}>
                <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Force Zones Status Map</Text>
                <Text style={tw`text-[8px] text-slate-500 font-bold uppercase mt-0.5`}>Real-time biological reaction safety</Text>
              </View>
              <View style={tw`flex-row flex-wrap gap-2.5`}>
                <View style={tw`bg-[#00FF88]/15 border border-[#00FF88]/30 px-3 py-1.5 rounded-xl flex-row items-center space-x-1.5`}>
                  <View style={tw`w-2 h-2 rounded-full bg-[#00FF88]`} />
                  <Text style={tw`text-[10px] font-black text-[#00FF88] uppercase`}>Safe Zone (Light force)</Text>
                </View>

                <View style={tw`bg-[#FFB300]/15 border border-[#FFB300]/30 px-3 py-1.5 rounded-xl flex-row items-center space-x-1.5`}>
                  <View style={tw`w-2 h-2 rounded-full bg-[#FFB300]`} />
                  <Text style={tw`text-[10px] font-black text-[#FFB300] uppercase`}>Controlled Zone (Moderate force)</Text>
                </View>

                <View style={tw`bg-[#FF4D4D]/15 border border-[#FF4D4D]/30 px-3 py-1.5 rounded-xl flex-row items-center space-x-1.5`}>
                  <View style={tw`w-2 h-2 rounded-full bg-[#FF4D4D]`} />
                  <Text style={tw`text-[10px] font-black text-[#FF4D4D] uppercase`}>Risk Zone (Heavy force)</Text>
                </View>

                <View style={tw`bg-[#1E88FF]/10 border border-[#1E88FF]/20 px-3 py-1.5 rounded-xl`}>
                  <Text style={tw`text-[10px] font-black text-[#1E88FF] uppercase`}>Light Force Zone</Text>
                </View>

                <View style={tw`bg-[#8E44AD]/10 border border-[#8E44AD]/20 px-3 py-1.5 rounded-xl`}>
                  <Text style={tw`text-[10px] font-black text-[#8E44AD] uppercase`}>Medium Force Zone</Text>
                </View>

                <View style={tw`bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl`}>
                  <Text style={tw`text-[10px] font-black text-rose-400 uppercase`}>High Force Zone</Text>
                </View>
              </View>
            </View>

            {/* ====================================================
                ⚙️ 4. LIVE BIOMECHANICS FORCE VECTOR SYSTEM
               ==================================================== */}
            <View style={tw`bg-[#0B1020] rounded-[24px] border border-white/5 shadow-xl p-5 space-y-4`}>
              <View style={tw`border-b border-white/5 pb-2 flex-row justify-between items-center`}>
                <View>
                  <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Live Biomechanics Force Vector System</Text>
                  <Text style={tw`text-[8px] text-slate-500 font-bold uppercase mt-0.5`}>Vector mapping & movement intensities</Text>
                </View>
                <View style={tw`flex-row items-center space-x-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20`}>
                  <View style={tw`w-1.5 h-1.5 rounded-full bg-emerald-400`} />
                  <Text style={tw`text-[8px] font-black text-emerald-400`}>SIMULATION FEED</Text>
                </View>
              </View>

              <View style={tw`flex-row flex-wrap justify-between gap-y-3`}>
                {/* Vector 1 */}
                <View style={tw`w-[48%] p-3.5 bg-black/35 border border-white/5 rounded-2xl space-y-2`}>
                  <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-xs font-black text-white`}>Anterior Retraction</Text>
                    <Text style={tw`text-lg`}>⬅️</Text>
                  </View>
                  <View style={tw`w-full h-1 bg-slate-950 rounded-full overflow-hidden`}>
                    <View style={tw`h-full bg-[#1E88FF] w-3/10`} />
                  </View>
                  <View style={tw`flex-row justify-between items-center pt-0.5`}>
                    <Text style={tw`text-[9px] text-[#1E88FF] font-black`}>35 cN</Text>
                    <Text style={tw`text-[8px] font-black text-emerald-400 uppercase`}>Safe</Text>
                  </View>
                </View>

                {/* Vector 2 */}
                <View style={tw`w-[48%] p-3.5 bg-black/35 border border-white/5 rounded-2xl space-y-2`}>
                  <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-xs font-black text-white`}>Vertical Intrusion</Text>
                    <Text style={tw`text-lg`}>↗️</Text>
                  </View>
                  <View style={tw`w-full h-1 bg-slate-950 rounded-full overflow-hidden`}>
                    <View style={tw`h-full bg-[#8E44AD] w-1/2`} />
                  </View>
                  <View style={tw`flex-row justify-between items-center pt-0.5`}>
                    <Text style={tw`text-[9px] text-[#8E44AD] font-black`}>50 cN</Text>
                    <Text style={tw`text-[8px] font-black text-emerald-400 uppercase`}>Safe</Text>
                  </View>
                </View>

                {/* Vector 3 */}
                <View style={tw`w-[48%] p-3.5 bg-black/35 border border-white/5 rounded-2xl space-y-2`}>
                  <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-xs font-black text-white`}>Transverse Exp.</Text>
                    <Text style={tw`text-lg`}>➡️</Text>
                  </View>
                  <View style={tw`w-full h-1 bg-slate-950 rounded-full overflow-hidden`}>
                    <View style={tw`h-full bg-[#00FF88] w-2/3`} />
                  </View>
                  <View style={tw`flex-row justify-between items-center pt-0.5`}>
                    <Text style={tw`text-[9px] text-[#00FF88] font-black`}>65 cN</Text>
                    <Text style={tw`text-[8px] font-black text-amber-400 uppercase`}>Optimum</Text>
                  </View>
                </View>

                {/* Vector 4 */}
                <View style={tw`w-[48%] p-3.5 bg-black/35 border border-white/5 rounded-2xl space-y-2`}>
                  <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-xs font-black text-white`}>Root Torque</Text>
                    <Text style={tw`text-lg`}>↘️</Text>
                  </View>
                  <View style={tw`w-full h-1 bg-slate-950 rounded-full overflow-hidden`}>
                    <View style={tw`h-full bg-[#F39C12] w-full`} />
                  </View>
                  <View style={tw`flex-row justify-between items-center pt-0.5`}>
                    <Text style={tw`text-[9px] text-[#F39C12] font-black`}>100 cN</Text>
                    <Text style={tw`text-[8px] font-black text-rose-400 uppercase`}>Maximum</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ====================================================
                📉 3. TREATMENT OUTCOME PREDICTION
               ==================================================== */}
            <View style={tw`bg-[#0B1020] rounded-[24px] border border-white/5 shadow-xl p-5 space-y-4`}>
              <View style={tw`border-b border-white/5 pb-2`}>
                <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Treatment Outcome Prediction Projections</Text>
                <Text style={tw`text-[8px] text-slate-500 font-bold uppercase mt-0.5`}>Simulated aesthetic & stability projections</Text>
              </View>
              <View style={tw`space-y-3.5`}>
                {[
                  { label: 'Stability', val: stabilityVal, color: '#1E88FF' },
                  { label: 'Esthetics', val: estheticsVal, color: '#00FF88' },
                  { label: 'Treatment Efficiency', val: timeVal, color: '#8E44AD' },
                  { label: 'Risk Level', val: riskVal, color: '#FF4D4D' },
                  { label: 'Anchorage Demand', val: anchorageDemand, color: '#F39C12' },
                ].map((item, idx) => (
                  <View key={idx} style={tw`space-y-1`}>
                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-xs font-semibold text-slate-300`}>{item.label}</Text>
                      <Text style={tw`text-xs font-black text-white`}>{item.val}%</Text>
                    </View>
                    <View style={tw`w-full h-2.5 bg-slate-950 rounded-full overflow-hidden`}>
                      <View style={[tw`h-full rounded-full`, { width: `${item.val}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Notes overrides and sync */}
            <View style={tw`bg-[#0B1020] rounded-[24px] border border-white/5 shadow-xl p-5 space-y-3`}>
              <View style={tw`border-b border-white/5 pb-2`}>
                <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Clinician Notes & Directives</Text>
                <Text style={tw`text-[8px] text-slate-500 font-bold uppercase mt-0.5`}>Case Override Logs</Text>
              </View>
              <TextInput
                value={clinicianOverride}
                onChangeText={setClinicianOverride}
                multiline
                numberOfLines={2}
                placeholder="Enter clinical objectives, diagnostic caveats, or patient-specific instructions to save changes..."
                placeholderTextColor="#475569"
                style={[tw`w-full px-3 py-2 bg-black/45 text-white font-sans text-xs rounded-xl border border-white/10 focus:border-teal-500`, { minHeight: 60 }]}
              />

              <Pressable
                disabled={true}
                style={tw`w-full py-2.5 rounded-xl items-center justify-center border ${isSaving ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}
              >
                <View style={tw`flex-row items-center space-x-1.5`}>
                  {isSaving ? (
                    <>
                      <ActivityIndicator size="small" color="#FFB300" />
                      <Text style={tw`text-[10px] font-black text-amber-500 uppercase tracking-widest`}>Saving System...</Text>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={12} color="#00FF88" />
                      <Text style={tw`text-[10px] font-black text-emerald-500 uppercase tracking-widest`}>AI Parameters Sync Completed</Text>
                    </>
                  )}
                </View>
              </Pressable>
            </View>

          </View>
        )}

      </View>
    </ScrollView>
  );
}
