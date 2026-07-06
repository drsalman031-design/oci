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

  // Dynamic biomechanical calculations based on patient cephalometrics and options
  const anbVal = activeAssessment ? getNumVal(activeAssessment.cephalometricInput.anb) : 2;
  const fmaVal = activeAssessment ? getNumVal(activeAssessment.cephalometricInput.fma) : 25;
  
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
    <ScrollView style={tw`flex-1 bg-[#F8FAFC]`} contentContainerStyle={tw`pb-20`}>
      <View style={tw`p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full`}>
        
        {/* ====================================================
            HEADER BAR & PATIENT SELECTOR
           ==================================================== */}
        <View style={tw`flex-col justify-between items-start gap-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm`}>
          <View style={tw`space-y-1`}>
            <View style={tw`flex-row items-center space-x-2`}>
              <Layers size={14} color="#2563EB" />
              <Text style={tw`text-[10px] font-black text-blue-600 font-mono uppercase tracking-wider`}>Orthodontic Clinical Decision Support System</Text>
            </View>
            <Text style={tw`text-lg font-black text-slate-900`}>Treatment Planner & Biomechanics Engine</Text>
          </View>

          {/* Patient dropdown selection */}
          <View style={tw`w-full`}>
            <Pressable
              onPress={() => {
                if (Platform.OS === 'android') {
                  UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
                }
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowPatientSelect(!showPatientSelect);
              }}
              style={tw`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex-row justify-between items-center`}
            >
              <View style={tw`flex-row items-center space-x-2.5`}>
                <User size={14} color="#64748B" />
                <Text style={tw`text-xs font-extrabold text-slate-800`}>
                  {activeAssessment ? activeAssessment.patientDetails.name : 'Select Patient'}
                </Text>
              </View>
              {showPatientSelect ? (
                <ChevronUp size={14} color="#2563EB" />
              ) : (
                <ChevronDown size={14} color="#2563EB" />
              )}
            </Pressable>
 
            {showPatientSelect && (
              <View style={tw`mt-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg`}>
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
                    style={tw`px-4 py-3.5 border-b border-slate-100 hover:bg-slate-50 flex-row justify-between items-center`}
                  >
                    <View>
                      <Text style={tw`text-xs font-black text-slate-800`}>{item.patientDetails.name}</Text>
                      <Text style={tw`text-[9px] text-slate-500 mt-0.5`}>ID: {item.patientDetails.caseNumber || 'N/A'}</Text>
                    </View>
                    {selectedId === item.id && <Check size={12} color="#2563EB" />}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {activeAssessment && treatmentPlan && (
          <View style={tw`space-y-6`}>

            {/* Adjusted Options Card */}
            <View style={tw`bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4`}>
              <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono border-b border-slate-100 pb-2`}>
                Diagnostic Variables
              </Text>
              
              <View style={tw`flex-row gap-4`}>
                <View style={tw`flex-1 space-y-1`}>
                  <Text style={tw`text-[10px] text-slate-500 font-bold`}>Timing Target</Text>
                  <View style={tw`flex-row bg-slate-50 p-1 rounded-xl border border-slate-200`}>
                    {[
                      { key: 'growing', label: 'Growing' },
                      { key: 'adult', label: 'Adult' }
                    ].map((opt) => (
                      <Pressable 
                        key={opt.key}
                        onPress={() => setAgeGroup(opt.key as any)}
                        style={tw`flex-1 py-1.5 rounded-lg items-center ${ageGroup === opt.key ? 'bg-blue-600 shadow-sm' : ''}`}
                      >
                        <Text style={tw`text-[10px] font-black ${ageGroup === opt.key ? 'text-white' : 'text-slate-600'}`}>{opt.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={tw`flex-1 space-y-1`}>
                  <Text style={tw`text-[10px] text-slate-500 font-bold`}>Mandibular Crowding</Text>
                  <View style={tw`flex-row bg-slate-50 p-1 rounded-xl border border-slate-200`}>
                    {['none', 'mild', 'mod', 'sev'].map((lvl) => {
                      const fullLvl = lvl === 'mod' ? 'moderate' : lvl === 'sev' ? 'severe' : lvl;
                      return (
                        <Pressable 
                          key={lvl}
                          onPress={() => {
                            setCrowdingSeverity(fullLvl as any);
                            setSpacingSeverity('none');
                          }}
                          style={tw`flex-1 py-1.5 rounded-lg items-center ${crowdingSeverity === fullLvl ? 'bg-blue-600 shadow-sm' : ''}`}
                        >
                          <Text style={tw`text-[8px] font-black uppercase ${crowdingSeverity === fullLvl ? 'text-white' : 'text-slate-600'}`}>{lvl}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* ====================================================
                🧠 MODULE 1: BIOMECHANICS ENGINE
               ==================================================== */}
            <View style={tw`bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-6`}>
              <View style={tw`flex-row items-center justify-between border-b border-slate-100 pb-3`}>
                <View style={tw`flex-row items-center space-x-2`}>
                  <Activity size={18} color="#2563EB" />
                  <Text style={tw`text-sm font-black text-slate-900`}>Biomechanics Engine</Text>
                </View>
                <View style={tw`bg-blue-50 px-2.5 py-1 rounded-full`}>
                  <Text style={tw`text-[9px] font-black text-blue-600 uppercase`}>AI Simulation Mode</Text>
                </View>
              </View>

              {/* A) Force Distribution Dashboard */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>A) Force Distribution Dashboard (0-100 Scale)</Text>
                <View style={tw`space-y-3`}>
                  {[
                    { label: 'Retraction Force', val: retractionForce },
                    { label: 'Intrusion Force', val: intrusionForce },
                    { label: 'Expansion Force', val: expansionForce },
                    { label: 'Torque Control', val: torqueControl },
                    { label: 'Rotation Correction', val: rotationCorrection },
                  ].map((item, idx) => (
                    <View key={idx} style={tw`space-y-1`}>
                      <View style={tw`flex-row justify-between items-center`}>
                        <Text style={tw`text-xs font-semibold text-slate-700`}>{item.label}</Text>
                        <Text style={tw`text-xs font-black text-blue-600`}>{item.val}/100 cN</Text>
                      </View>
                      <View style={tw`w-full h-2 bg-slate-100 rounded-full overflow-hidden`}>
                        <View style={[tw`h-full bg-blue-600 rounded-full`, { width: `${item.val}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* B) Biomechanics Complexity Index */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>B) Biomechanics Complexity Index</Text>
                <View style={tw`flex-row flex-wrap gap-2`}>
                  {[
                    { label: 'Anchorage Demand', val: anchorageDemand, color: 'text-amber-600 bg-amber-50' },
                    { label: 'Root Control', val: rootControl, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Torque Req.', val: torqueReq, color: 'text-indigo-600 bg-indigo-50' },
                    { label: 'Compliance Dep.', val: complianceDep, color: 'text-rose-600 bg-rose-50' },
                    { label: 'Appliance Comp.', val: applianceComplexity, color: 'text-purple-600 bg-purple-50' },
                  ].map((item, idx) => (
                    <View key={idx} style={tw`flex-1 min-w-[120px] p-3 rounded-xl border border-slate-100 bg-slate-50/50 justify-between`}>
                      <Text style={tw`text-[10px] font-bold text-slate-500`}>{item.label}</Text>
                      <View style={tw`flex-row justify-between items-baseline mt-2`}>
                        <Text style={tw`text-base font-black text-slate-800`}>{item.val}%</Text>
                        <View style={tw`w-1.5 h-1.5 rounded-full bg-blue-500`} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* C) Force Zones Map */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>C) Force Zones Map</Text>
                <View style={tw`flex-row space-x-2`}>
                  {[
                    { key: 'Light', label: 'Light Force Zone', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' },
                    { key: 'Medium', label: 'Medium Force Zone', color: 'bg-amber-500/10 border-amber-500/20 text-amber-700' },
                    { key: 'High', label: 'High Force Zone', color: 'bg-rose-500/10 border-rose-500/20 text-rose-700' },
                  ].map((zone) => {
                    const isActive = forceZone === zone.key;
                    return (
                      <View 
                        key={zone.key} 
                        style={tw`flex-1 py-2 px-1.5 rounded-xl border items-center justify-center ${zone.color} ${isActive ? 'border-2 shadow-sm' : 'opacity-40'}`}
                      >
                        <Text style={tw`text-[10px] font-black text-center`}>{zone.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* D) Tooth Movement Visualization */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>D) Tooth Movement Vectors</Text>
                <View style={tw`grid grid-cols-3 gap-2 flex-row`}>
                  {movements.map((m, idx) => (
                    <View key={idx} style={tw`flex-1 p-3 rounded-xl border border-slate-100 bg-slate-50 items-center space-y-1`}>
                      <Text style={tw`text-lg`}>{m.direction}</Text>
                      <Text style={tw`text-[10px] font-bold text-slate-800`}>{m.label}</Text>
                      <Text style={tw`text-[9px] font-mono text-blue-600 uppercase font-black`}>{m.intensity} Intensity</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* ====================================================
                🧠 MODULE 2: TREATMENT PLANNER
               ==================================================== */}
            <View style={tw`bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-6`}>
              <View style={tw`flex-row items-center justify-between border-b border-slate-100 pb-3`}>
                <View style={tw`flex-row items-center space-x-2`}>
                  <Compass size={18} color="#2563EB" />
                  <Text style={tw`text-sm font-black text-slate-900`}>Treatment Planner</Text>
                </View>
                <View style={tw`bg-blue-50 px-2.5 py-1 rounded-full`}>
                  <Text style={tw`text-[9px] font-black text-blue-600 uppercase`}>Interactive Scheduler</Text>
                </View>
              </View>

              {/* A) Treatment Strategy Card (Hero) */}
              <View style={tw`bg-blue-600 rounded-2xl p-4 shadow-md space-y-3`}>
                <Text style={tw`text-[8px] font-black text-blue-100 uppercase tracking-wider font-mono`}>A) Treatment Strategy Blueprint</Text>
                <View style={tw`grid grid-cols-2 gap-4 flex-row`}>
                  <View style={tw`flex-1 space-y-0.5`}>
                    <Text style={tw`text-[9px] text-blue-200 font-bold`}>Extraction Plan</Text>
                    <Text style={tw`text-lg font-black text-white`}>{extractionDecision}</Text>
                  </View>
                  <View style={tw`flex-1 space-y-0.5`}>
                    <Text style={tw`text-[9px] text-blue-200 font-bold`}>Complexity Level</Text>
                    <Text style={tw`text-lg font-black text-white`}>{treatmentPlan.treatmentComplexity.split(' ')[0]}</Text>
                  </View>
                </View>
                <View style={tw`grid grid-cols-2 gap-4 flex-row pt-1`}>
                  <View style={tw`flex-1 space-y-0.5`}>
                    <Text style={tw`text-[9px] text-blue-200 font-bold`}>Estimated Duration</Text>
                    <Text style={tw`text-lg font-black text-white`}>{estimatedDuration}</Text>
                  </View>
                  <View style={tw`flex-1 space-y-0.5`}>
                    <Text style={tw`text-[9px] text-blue-200 font-bold`}>Growth Influence</Text>
                    <Text style={tw`text-lg font-black text-white`}>{growthInfluence}</Text>
                  </View>
                </View>
              </View>

              {/* B) Treatment Phase Flow */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>B) Treatment Phase Flow (Timeline)</Text>
                <View style={tw`space-y-3`}>
                  {[
                    { phase: 'Phase 1: Levelling & Alignment', force: 'Light Continuous', risk: 'Low Risk', icon: '🦷' },
                    { phase: 'Phase 2: Space Closure / Sagittal', force: 'Medium Intermittent', risk: 'Moderate Risk', icon: '🔗' },
                    { phase: 'Phase 3: Finishing & Retention', force: 'Light Segmented', risk: 'Low Risk', icon: '✨' },
                  ].map((p, idx) => (
                    <View key={idx} style={tw`flex-row items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100`}>
                      <View style={tw`w-8 h-8 rounded-full bg-blue-50 items-center justify-center`}>
                        <Text style={tw`text-xs`}>{p.icon}</Text>
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-[11px] font-black text-slate-800`}>{p.phase}</Text>
                        <Text style={tw`text-[9px] text-slate-500 mt-0.5`}>Force: {p.force} • {p.risk}</Text>
                      </View>
                      <View style={tw`bg-emerald-50 px-2 py-0.5 rounded-md`}>
                        <Text style={tw`text-[8px] font-black text-emerald-600`}>Active</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* C) Alternative Plan Cards */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>C) Alternative Strategy Presets</Text>
                <View style={tw`flex-row space-x-2`}>
                  {[
                    { title: 'Non-Extraction', desc: 'Camouflage strategy', active: extractionDecision === 'No' },
                    { title: 'Extraction', desc: 'Premium anchorage', active: extractionDecision === 'Yes' },
                    { title: 'Orthopedic / Surgical', desc: 'Growth modification', active: treatmentPlan.surgicalOrthodontics.applicable || ageGroup === 'growing' },
                  ].map((item, idx) => (
                    <View 
                      key={idx} 
                      style={tw`flex-1 p-3 rounded-xl border bg-slate-50 ${item.active ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200'}`}
                    >
                      <Text style={tw`text-[10px] font-black text-slate-800`}>{item.title}</Text>
                      <Text style={tw`text-[8px] text-slate-500 mt-1`}>{item.desc}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* D) Outcome Prediction Chart */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>D) Treatment Outcome Predictions</Text>
                <View style={tw`space-y-3`}>
                  {[
                    { label: 'Long-term Stability', val: stabilityVal },
                    { label: 'Facial Esthetics', val: estheticsVal },
                    { label: 'Treatment Speed', val: timeVal },
                    { label: 'Relapse Risk Control', val: 100 - riskVal },
                  ].map((item, idx) => (
                    <View key={idx} style={tw`space-y-1`}>
                      <View style={tw`flex-row justify-between items-center`}>
                        <Text style={tw`text-xs font-semibold text-slate-700`}>{item.label}</Text>
                        <Text style={tw`text-xs font-black text-blue-600`}>{item.val}%</Text>
                      </View>
                      <View style={tw`w-full h-2 bg-slate-100 rounded-full overflow-hidden`}>
                        <View style={[tw`h-full bg-blue-600 rounded-full`, { width: `${item.val}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* ====================================================
                🧠 MODULE 3: ORTHODONTIC CLINICAL DECISION FORCE SYSTEM
               ==================================================== */}
            <View style={tw`bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-6`}>
              <View style={tw`flex-row items-center justify-between border-b border-slate-100 pb-3`}>
                <View style={tw`flex-row items-center space-x-2`}>
                  <Layers size={18} color="#2563EB" />
                  <Text style={tw`text-sm font-black text-slate-900`}>Orthodontic Clinical Decision Force System</Text>
                </View>
                <View style={tw`bg-blue-50 px-2.5 py-1 rounded-full`}>
                  <Text style={tw`text-[9px] font-black text-blue-600 uppercase`}>CDSS Engine</Text>
                </View>
              </View>

              {/* A) Force Decision Dashboard */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>A) Live Biomechanics Force System Vector (0-100 Scale)</Text>
                <View style={tw`space-y-3`}>
                  {[
                    { label: 'Retraction Mechanics', val: retractionForce },
                    { label: 'Intrusion Force', val: intrusionForce },
                    { label: 'Expansion Mechanics', val: expansionForce },
                    { label: 'Torque System Control', val: torqueControl },
                    { label: 'Rotation Arm Control', val: rotationCorrection },
                  ].map((item, idx) => (
                    <View key={idx} style={tw`space-y-1`}>
                      <View style={tw`flex-row justify-between items-center`}>
                        <Text style={tw`text-xs font-semibold text-slate-700`}>{item.label}</Text>
                        <Text style={tw`text-xs font-black text-blue-600`}>{item.val}/100 cN</Text>
                      </View>
                      <View style={tw`w-full h-2 bg-slate-100 rounded-full overflow-hidden`}>
                        <View style={[tw`h-full bg-blue-600 rounded-full`, { width: `${item.val}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* B) Anchorage Risk Indicator */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>B) Anchorage Risk Indicator</Text>
                <View style={tw`p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3`}>
                  <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-xs font-bold text-slate-700`}>Anchorage Demand Risk Index</Text>
                    <Text style={tw`text-xs font-black text-rose-600`}>{anchorageDemand}/100</Text>
                  </View>
                  <View style={tw`w-full h-3 bg-slate-200 rounded-full overflow-hidden`}>
                    <View style={[tw`h-full bg-rose-500 rounded-full`, { width: `${anchorageDemand}%` }]} />
                  </View>
                  <View style={tw`flex-row justify-between items-center pt-1`}>
                    {[
                      { key: 'Low', label: 'Low Anchorage', active: anchorageDemand < 40 },
                      { key: 'Mod', label: 'Moderate Anchorage', active: anchorageDemand >= 40 && anchorageDemand < 70 },
                      { key: 'High', label: 'High Anchorage', active: anchorageDemand >= 70 },
                    ].map((item, idx) => (
                      <View key={idx} style={tw`px-2 py-0.5 rounded bg-slate-100 ${item.active ? 'bg-rose-50 border border-rose-200' : ''}`}>
                        <Text style={tw`text-[8px] font-bold ${item.active ? 'text-rose-700 font-black' : 'text-slate-400'}`}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* C) Clinical Decision Output Card */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>C) Generated Clinical Decision Output</Text>
                <View style={tw`p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3`}>
                  <View style={tw`flex-row items-center space-x-2`}>
                    <Zap size={14} color="#2563EB" />
                    <Text style={tw`text-xs font-black text-slate-800`}>Mechanics: {anchorageDemand > 70 ? 'Segmented Force Mechanics' : 'Continuous Light-Force Wire'}</Text>
                  </View>
                  <View style={tw`flex-row flex-wrap gap-2 pt-1`}>
                    <View style={tw`bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100`}>
                      <Text style={tw`text-[9px] font-black text-blue-600 uppercase`}>Continuous Mode</Text>
                    </View>
                    <View style={tw`bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100`}>
                      <Text style={tw`text-[9px] font-black text-blue-600 uppercase`}>Intermittent Mode</Text>
                    </View>
                    <View style={tw`bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100`}>
                      <Text style={tw`text-[9px] font-black text-blue-600 uppercase`}>Segmented Mechanics</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* D) Biomechanical Safety Zone */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>D) Biomechanical Safety Zone status</Text>
                <View style={tw`flex-row space-x-2`}>
                  {[
                    { key: 'Safe', label: 'Safe Zone (Light force)', active: averageForce < 45, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' },
                    { key: 'Controlled', label: 'Controlled Zone (Mod force)', active: averageForce >= 45 && averageForce < 75, color: 'bg-blue-500/10 border-blue-500/20 text-blue-700' },
                    { key: 'Risk', label: 'Risk Zone (Heavy force)', active: averageForce >= 75, color: 'bg-rose-500/10 border-rose-500/20 text-rose-700' },
                  ].map((zone, idx) => (
                    <View 
                      key={idx} 
                      style={tw`flex-1 p-2.5 rounded-xl border items-center justify-center ${zone.color} ${zone.active ? 'border-2 shadow-sm' : 'opacity-40'}`}
                    >
                      <Text style={tw`text-[9px] font-black text-center`}>{zone.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Clinician Overrides & Override Save */}
              <View style={tw`p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3`}>
                <Text style={tw`text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono border-b border-slate-200 pb-1`}>
                  Clinician Notes & Directives
                </Text>
                <TextInput
                  value={clinicianOverride}
                  onChangeText={setClinicianOverride}
                  multiline
                  numberOfLines={2}
                  placeholder="Enter clinical objectives, diagnostic caveats, or patient-specific instructions..."
                  placeholderTextColor="#94A3B8"
                  style={[tw`w-full px-3 py-2 bg-white text-slate-800 font-sans text-xs rounded-xl border border-slate-200 focus:border-blue-500`, { minHeight: 60 }]}
                />

                <Pressable
                  disabled={true}
                  style={tw`w-full py-2.5 rounded-xl items-center justify-center border ${isSaving ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}
                >
                  <View style={tw`flex-row items-center space-x-1.5`}>
                    {isSaving ? (
                      <>
                        <ActivityIndicator size="small" color="#D97706" />
                        <Text style={tw`text-[10px] font-black text-amber-700 uppercase tracking-widest`}>Saving System...</Text>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={12} color="#059669" />
                        <Text style={tw`text-[10px] font-black text-emerald-700 uppercase tracking-widest`}>AI Parameters Sync Completed</Text>
                      </>
                    )}
                  </View>
                </Pressable>
              </View>

            </View>

          </View>
        )}

      </View>
    </ScrollView>
  );
}
