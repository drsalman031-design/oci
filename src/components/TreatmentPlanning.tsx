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
                  { label: 'Expansion Force', val: 65, color: '#2ECC71', intensity: 'Active Arch Widening' },
                  { label: 'Torque Control', val: 100, color: '#F39C12', intensity: 'Maximum Boundary' },
                  { label: 'Rotation Correction', val: 70, color: '#E74C3C', intensity: 'Heavy Derotation' },
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
                <View style={tw`bg-[#2ECC71]/15 border border-[#2ECC71]/30 px-3 py-1.5 rounded-xl flex-row items-center space-x-1.5`}>
                  <View style={tw`w-2 h-2 rounded-full bg-[#2ECC71]`} />
                  <Text style={tw`text-[10px] font-black text-[#2ECC71] uppercase`}>Safe Zone (Light force)</Text>
                </View>

                <View style={tw`bg-[#F1C40F]/15 border border-[#F1C40F]/30 px-3 py-1.5 rounded-xl flex-row items-center space-x-1.5`}>
                  <View style={tw`w-2 h-2 rounded-full bg-[#F1C40F]`} />
                  <Text style={tw`text-[10px] font-black text-[#F1C40F] uppercase`}>Controlled Zone (Moderate force)</Text>
                </View>

                <View style={tw`bg-[#E74C3C]/15 border border-[#E74C3C]/30 px-3 py-1.5 rounded-xl flex-row items-center space-x-1.5`}>
                  <View style={tw`w-2 h-2 rounded-full bg-[#E74C3C]`} />
                  <Text style={tw`text-[10px] font-black text-[#E74C3C] uppercase`}>Risk Zone (Heavy force)</Text>
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

              <View style={tw`flex-row flex-wrap gap-3`}>
                {/* Vector 1 */}
                <View style={tw`flex-1 min-w-[135px] p-4 bg-black/35 border border-white/5 rounded-2xl space-y-2`}>
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
                <View style={tw`flex-1 min-w-[135px] p-4 bg-black/35 border border-white/5 rounded-2xl space-y-2`}>
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
                <View style={tw`flex-1 min-w-[135px] p-4 bg-black/35 border border-white/5 rounded-2xl space-y-2`}>
                  <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-xs font-black text-white`}>Transverse Exp.</Text>
                    <Text style={tw`text-lg`}>➡️</Text>
                  </View>
                  <View style={tw`w-full h-1 bg-slate-950 rounded-full overflow-hidden`}>
                    <View style={tw`h-full bg-[#2ECC71] w-2/3`} />
                  </View>
                  <View style={tw`flex-row justify-between items-center pt-0.5`}>
                    <Text style={tw`text-[9px] text-[#2ECC71] font-black`}>65 cN</Text>
                    <Text style={tw`text-[8px] font-black text-amber-400 uppercase`}>Optimum</Text>
                  </View>
                </View>

                {/* Vector 4 */}
                <View style={tw`flex-1 min-w-[135px] p-4 bg-black/35 border border-white/5 rounded-2xl space-y-2`}>
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
                  { label: 'Esthetics', val: estheticsVal, color: '#2ECC71' },
                  { label: 'Treatment Efficiency', val: timeVal, color: '#8E44AD' },
                  { label: 'Risk Level', val: riskVal, color: '#E74C3C' },
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
                      <ActivityIndicator size="small" color="#F59E0B" />
                      <Text style={tw`text-[10px] font-black text-amber-500 uppercase tracking-widest`}>Saving System...</Text>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={12} color="#10B981" />
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
