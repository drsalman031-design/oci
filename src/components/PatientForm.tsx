import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { User, Clipboard, FileText, ArrowRight, X, Heart, ShieldAlert, Sparkles, ChevronDown, ChevronUp, Info, Activity, Flame, Camera } from 'lucide-react-native';
import tw from 'twrnc';
import { PatientDetails } from '../types';
import ClinicPhotoWorkstation from './ClinicPhotoWorkstation';

interface PatientFormProps {
  initialDetails?: PatientDetails;
  mode?: 'clinic' | 'ceph' | 'turbo';
  onNext: (details: PatientDetails) => void;
  onCancel: () => void;
  onUpdate?: (details: PatientDetails) => void;
}

export default function PatientForm({ 
  initialDetails, 
  mode = 'turbo', 
  onNext, 
  onCancel,
  onUpdate
}: PatientFormProps) {
  const [name, setName] = useState(initialDetails?.name || '');
  const [age, setAge] = useState<string>(initialDetails?.age ? String(initialDetails.age) : '');
  const [gender, setGender] = useState<PatientDetails['gender']>(initialDetails?.gender || '');
  const [caseNumber, setCaseNumber] = useState(initialDetails?.caseNumber || '');
  const [diagnosis, setDiagnosis] = useState<PatientDetails['diagnosis']>(initialDetails?.diagnosis || '');
  const [facialProfile, setFacialProfile] = useState<PatientDetails['facialProfile']>(initialDetails?.facialProfile || 'Straight');
  const [smileAnalysis, setSmileAnalysis] = useState<PatientDetails['smileAnalysis']>(initialDetails?.smileAnalysis || 'Consonant');
  const [crowdingSpacing, setCrowdingSpacing] = useState<PatientDetails['crowdingSpacing']>(initialDetails?.crowdingSpacing || 'None');
  const [dentitionPhase, setDentitionPhase] = useState<PatientDetails['dentitionPhase']>(initialDetails?.dentitionPhase || 'Permanent Dentition');
  const [clinicalNotes, setClinicalNotes] = useState(initialDetails?.clinicalNotes || '');
  const [date] = useState(initialDetails?.date || new Date().toISOString().split('T')[0]);

  // Clinic-specific states
  const [chiefComplaint, setChiefComplaint] = useState(initialDetails?.chiefComplaint || '');
  const [facialAsymmetry, setFacialAsymmetry] = useState<PatientDetails['facialAsymmetry']>(initialDetails?.facialAsymmetry || 'None');
  const [lips, setLips] = useState<PatientDetails['lips']>(initialDetails?.lips || 'Competent');
  const [molarRelationRight, setMolarRelationRight] = useState<PatientDetails['molarRelationRight']>(initialDetails?.molarRelationRight || 'Class I');
  const [molarRelationLeft, setMolarRelationLeft] = useState<PatientDetails['molarRelationLeft']>(initialDetails?.molarRelationLeft || 'Class I');
  const [canineRelationRight, setCanineRelationRight] = useState<PatientDetails['canineRelationRight']>(initialDetails?.canineRelationRight || 'Class I');
  const [canineRelationLeft, setCanineRelationLeft] = useState<PatientDetails['canineRelationLeft']>(initialDetails?.canineRelationLeft || 'Class I');
  const [overjet, setOverjet] = useState<string>(initialDetails?.overjet ? String(initialDetails.overjet) : '2.5');
  const [overbite, setOverbite] = useState<string>(initialDetails?.overbite ? String(initialDetails.overbite) : '2.5');
  const [anteriorCrossbite, setAnteriorCrossbite] = useState<PatientDetails['anteriorCrossbite']>(initialDetails?.anteriorCrossbite || 'None');
  const [posteriorCrossbite, setPosteriorCrossbite] = useState<PatientDetails['posteriorCrossbite']>(initialDetails?.posteriorCrossbite || 'None');
  const [functionalAirway, setFunctionalAirway] = useState<PatientDetails['functionalAirway']>(initialDetails?.functionalAirway || 'Normal');
  const [tmjStatus, setTmjStatus] = useState<PatientDetails['tmjStatus']>(initialDetails?.tmjStatus || 'Normal');
  const [habits, setHabits] = useState<string[]>(initialDetails?.habits || []);
  const [cvmStage, setCvmStage] = useState<PatientDetails['cvmStage']>(initialDetails?.cvmStage || 'CS6');
  const [growthStatus, setGrowthStatus] = useState<PatientDetails['growthStatus']>(initialDetails?.growthStatus || 'Growth Complete');

  const [photos, setPhotos] = useState<Record<string, string>>(() => {
    const defaultData: Record<string, string> = {};
    const slotsKeys = [
      'frontal_rest', 'frontal_smile', 'right_profile', 'left_profile', 'profile_45',
      'frontal_occlusion', 'right_buccal', 'left_buccal', 'maxillary_occlusal', 'mandibular_occlusal'
    ];
    slotsKeys.forEach(k => {
      defaultData[k] = initialDetails?.clinicalPhotos?.[k] || 'MOCK_IMAGE';
    });
    return defaultData;
  });
  const [photoFindings, setPhotoFindings] = useState<string[]>(initialDetails?.clinicalPhotoFindings || []);
  const [landmarks, setLandmarks] = useState<Record<string, Record<string, { x: number; y: number }>>>(
    initialDetails?.clinicalPhotosLandmarks || {}
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [expandedSections, setExpandedSections] = useState({
    info: true,
    clinical: true,
    assessment: true,
    intraoral: true,
    functional: true,
    smile: true,
    photos: true,
    notes: true
  });

  const toggleSection = (sec: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const getLatestDetailsObject = (fieldOverrides: Partial<PatientDetails> = {}): PatientDetails => {
    return {
      name,
      age: age !== '' ? Number(age) : '',
      gender,
      caseNumber,
      diagnosis,
      date,
      clinicalNotes,
      facialProfile,
      smileAnalysis,
      crowdingSpacing,
      dentitionPhase,
      chiefComplaint,
      facialAsymmetry,
      lips,
      molarRelationRight,
      molarRelationLeft,
      canineRelationRight,
      canineRelationLeft,
      overjet: overjet !== '' ? Number(overjet) : '',
      overbite: overbite !== '' ? Number(overbite) : '',
      anteriorCrossbite,
      posteriorCrossbite,
      functionalAirway,
      tmjStatus,
      habits,
      cvmStage,
      growthStatus,
      analysisMode: mode,
      clinicalPhotos: photos,
      clinicalPhotoFindings: photoFindings,
      clinicalPhotosLandmarks: landmarks,
      ...fieldOverrides
    };
  };

  const triggerUpdate = (updatedFields: Partial<PatientDetails>) => {
    if (onUpdate) {
      const fullDetails = getLatestDetailsObject(updatedFields);
      onUpdate(fullDetails);
    }
  };

  const handleFieldChange = (field: keyof PatientDetails, value: any, setter: (val: any) => void) => {
    setter(value);
    triggerUpdate({ [field]: value });
  };

  const handleHabitToggle = (habit: string) => {
    let nextHabits: string[];
    if (habits.includes(habit)) {
      nextHabits = habits.filter(h => h !== habit);
    } else {
      nextHabits = [...habits, habit];
    }
    setHabits(nextHabits);
    triggerUpdate({ habits: nextHabits });
  };

  const validate = (): boolean => {
    const tempErrors: Record<string, string> = {};
    if (!name.trim()) tempErrors.name = 'Patient Name is required';
    
    const parsedAge = Number(age);
    if (!age || isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
      tempErrors.age = 'Enter a valid age (1-120)';
    }
    
    if (!gender) tempErrors.gender = 'Gender selection is required';
    if (!caseNumber.trim()) tempErrors.caseNumber = 'Case number is required';
    if (!diagnosis) tempErrors.diagnosis = 'Skeletal diagnosis is required';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onNext(getLatestDetailsObject());
    }
  };

  const isCephOnly = mode === 'ceph';

  return (
    <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Step Indicator Header Card */}
        <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-5 rounded-[28px] border border-white/5 shadow-2xl relative overflow-hidden`}>
          <View style={tw`absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl`} />
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`space-y-1`}>
              <View style={tw`flex-row items-center bg-teal-500/15 border border-teal-500/30 px-3 py-1 rounded-full self-start mb-2`}>
                <Sparkles size={11} color="#22D3EE" style={tw`mr-1.5`} />
                <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-wider font-mono`}>
                  {mode === 'clinic' ? 'Clinic Mode • Step 1 of 1' : 'Step 1 of 2 • Intake'}
                </Text>
              </View>
              <Text style={tw`text-xl font-black text-white tracking-tight`}>
                {mode === 'clinic' ? 'Clinical Assessment' : mode === 'ceph' ? 'Demographics Intake' : 'Intake & Clinical Exam'}
              </Text>
              <Text style={tw`text-xs text-slate-400`}>
                {mode === 'clinic' ? 'Clinical diagnosis parameters' : 'Establish the primary patient archive parameters'}
              </Text>
            </View>
            <Pressable 
              onPress={onCancel}
              style={tw`w-10 h-10 bg-white/5 border border-white/10 rounded-full items-center justify-center`}
            >
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={tw`h-1.5 w-full bg-white/5 rounded-full overflow-hidden`}>
          <View style={tw`h-full ${mode === 'clinic' ? 'w-full' : 'w-1/2'} bg-[#14B8A6] rounded-full`} />
        </View>

        {/* Form Container */}
        <View style={tw`space-y-4`}>
          
          {/* Section 1: Patient Information */}
          <View style={tw`bg-[#0B1020]/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl`}>
            <Pressable 
              onPress={() => toggleSection('info')}
              style={tw`flex-row justify-between items-center p-5 bg-black/20 border-b border-white/5`}
            >
              <View style={tw`flex-row items-center space-x-3`}>
                <View style={tw`p-2 bg-teal-500/10 rounded-xl`}>
                  <User size={16} color="#14B8A6" />
                </View>
                <View>
                  <Text style={tw`text-sm font-extrabold text-white`}>Patient Information</Text>
                  <Text style={tw`text-[10px] text-slate-400 font-medium`}>Demographics and case ID references</Text>
                </View>
              </View>
              {expandedSections.info ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
            </Pressable>

            {expandedSections.info && (
              <View style={tw`p-5 space-y-4`}>
                {/* Patient Name */}
                <View style={tw`space-y-1.5`}>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Patient Name *</Text>
                  <TextInput
                    value={name}
                    onChangeText={(val) => handleFieldChange('name', val, setName)}
                    placeholder="e.g. Liam Henderson"
                    placeholderTextColor="#475569"
                    style={tw`w-full h-13 px-4 bg-black/45 rounded-[18px] border ${errors.name ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-[#14B8A6]'} text-white text-xs font-bold`}
                  />
                  {errors.name && <Text style={tw`text-[10px] text-rose-400 font-mono`}>{errors.name}</Text>}
                </View>

                {/* Case Reference Number */}
                <View style={tw`space-y-1.5`}>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Case Reference ID *</Text>
                  <TextInput
                    value={caseNumber}
                    onChangeText={(val) => handleFieldChange('caseNumber', val, setCaseNumber)}
                    placeholder="e.g. SLM-2026-09"
                    placeholderTextColor="#475569"
                    style={tw`w-full h-13 px-4 bg-black/45 rounded-[18px] border ${errors.caseNumber ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-[#14B8A6]'} text-white text-xs font-bold`}
                  />
                  {errors.caseNumber && <Text style={tw`text-[10px] text-rose-400 font-mono`}>{errors.caseNumber}</Text>}
                </View>

                {/* Age & Gender Row */}
                <View style={tw`flex-row space-x-3`}>
                  {/* Age */}
                  <View style={tw`flex-1 space-y-1.5`}>
                    <Text style={tw`text-xs font-bold text-slate-300`}>Age (years) *</Text>
                    <TextInput
                      value={age}
                      onChangeText={(val) => handleFieldChange('age', val, setAge)}
                      placeholder="e.g. 24"
                      placeholderTextColor="#475569"
                      keyboardType="numeric"
                      style={tw`w-full h-13 px-4 bg-black/45 rounded-[18px] border ${errors.age ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-[#14B8A6]'} text-white text-xs font-bold`}
                    />
                    {errors.age && <Text style={tw`text-[10px] text-rose-400 font-mono`}>{errors.age}</Text>}
                  </View>

                  {/* Gender Selection */}
                  <View style={tw`flex-1 space-y-1.5`}>
                    <Text style={tw`text-xs font-bold text-slate-300`}>Gender *</Text>
                    <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                      {['Male', 'Female'].map((g) => {
                        const isSelected = gender === g;
                        return (
                          <Pressable
                            key={g}
                            onPress={() => handleFieldChange('gender', g, setGender)}
                            style={tw`flex-1 h-9 rounded-xl items-center justify-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                          >
                            <Text style={tw`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {g}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {errors.gender && <Text style={tw`text-[10px] text-rose-400 font-mono`}>{errors.gender}</Text>}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Section 2: Chief Complaint & Extraoral (Clinic / Turbo only) */}
          {!isCephOnly && (
            <View style={tw`bg-[#0B1020]/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl`}>
              <Pressable 
                onPress={() => toggleSection('clinical')}
                style={tw`flex-row justify-between items-center p-5 bg-black/20 border-b border-white/5`}
              >
                <View style={tw`flex-row items-center space-x-3`}>
                  <View style={tw`p-2 bg-emerald-500/10 rounded-xl`}>
                    <Clipboard size={16} color="#10B981" />
                  </View>
                  <View>
                    <Text style={tw`text-sm font-extrabold text-white`}>Clinical & Extraoral Exam</Text>
                    <Text style={tw`text-[10px] text-slate-400 font-medium`}>Chief complaint and soft tissue profile parameters</Text>
                  </View>
                </View>
                {expandedSections.clinical ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
              </Pressable>

              {expandedSections.clinical && (
                <View style={tw`p-5 space-y-4`}>
                  {/* Chief Complaint */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-xs font-bold text-slate-300`}>Chief Complaint</Text>
                    <TextInput
                      value={chiefComplaint}
                      onChangeText={(val) => handleFieldChange('chiefComplaint', val, setChiefComplaint)}
                      placeholder="e.g. Crooked front teeth, protruding jaw"
                      placeholderTextColor="#475569"
                      style={tw`w-full h-13 px-4 bg-black/45 rounded-[18px] border border-white/10 focus:border-[#14B8A6] text-white text-xs font-bold`}
                    />
                  </View>

                  {/* Asymmetry */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-xs font-bold text-slate-300`}>Facial Asymmetry</Text>
                    <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                      {['None', 'Mild', 'Moderate', 'Severe'].map((asym) => {
                        const isSelected = facialAsymmetry === asym;
                        return (
                          <Pressable
                            key={asym}
                            onPress={() => handleFieldChange('facialAsymmetry', asym, setFacialAsymmetry)}
                            style={tw`flex-1 h-9 rounded-xl items-center justify-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                          >
                            <Text style={tw`text-[10px] font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {asym}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Lips */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-xs font-bold text-slate-300`}>Lip Competency</Text>
                    <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                      {['Competent', 'Incompetent', 'Potentially Competent'].map((lp) => {
                        const isSelected = lips === lp;
                        return (
                          <Pressable
                            key={lp}
                            onPress={() => handleFieldChange('lips', lp, setLips)}
                            style={tw`flex-1 h-9 rounded-xl items-center justify-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                          >
                            <Text style={tw`text-[9px] font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {lp}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Section 3: Diagnostic Assessment */}
          <View style={tw`bg-[#0B1020]/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl`}>
            <Pressable 
              onPress={() => toggleSection('assessment')}
              style={tw`flex-row justify-between items-center p-5 bg-black/20 border-b border-white/5`}
            >
              <View style={tw`flex-row items-center space-x-3`}>
                <View style={tw`p-2 bg-indigo-500/10 rounded-xl`}>
                  <ShieldAlert size={16} color="#6366F1" />
                </View>
                <View>
                  <Text style={tw`text-sm font-extrabold text-white`}>Skeletal & Facial Profile</Text>
                  <Text style={tw`text-[10px] text-slate-400 font-medium`}>Skeletal pattern and facial parameters</Text>
                </View>
              </View>
              {expandedSections.assessment ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
            </Pressable>

            {expandedSections.assessment && (
              <View style={tw`p-5 space-y-4`}>
                {/* Diagnosis Skeletal classification buttons */}
                <View style={tw`space-y-1.5`}>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Skeletal Sagittal Pattern *</Text>
                  <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                    {['Class I', 'Class II', 'Class III'].map((diag) => {
                      const isSelected = diagnosis === diag;
                      return (
                        <Pressable
                          key={diag}
                          onPress={() => handleFieldChange('diagnosis', diag, setDiagnosis)}
                          style={tw`flex-1 h-9 rounded-xl items-center justify-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                        >
                          <Text style={tw`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                            {diag}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {errors.diagnosis && <Text style={tw`text-[10px] text-rose-400 font-mono`}>{errors.diagnosis}</Text>}
                </View>

                {/* Facial Profile Assessment */}
                <View style={tw`space-y-1.5`}>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Facial Profile Assessment</Text>
                  <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                    {['Straight', 'Convex', 'Concave'].map((prof) => {
                      const isSelected = facialProfile === prof;
                      return (
                        <Pressable
                          key={prof}
                          onPress={() => handleFieldChange('facialProfile', prof, setFacialProfile)}
                          style={tw`flex-1 h-9 rounded-xl items-center justify-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                        >
                          <Text style={tw`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                            {prof}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Section 4: Intraoral Examination (Clinic / Turbo only) */}
          {!isCephOnly && (
            <View style={tw`bg-[#0B1020]/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl`}>
              <Pressable 
                onPress={() => toggleSection('intraoral')}
                style={tw`flex-row justify-between items-center p-5 bg-black/20 border-b border-white/5`}
              >
                <View style={tw`flex-row items-center space-x-3`}>
                  <View style={tw`p-2 bg-pink-500/10 rounded-xl`}>
                    <Activity size={16} color="#EC4899" />
                  </View>
                  <View>
                    <Text style={tw`text-sm font-extrabold text-white`}>Intraoral & Dental Exam</Text>
                    <Text style={tw`text-[10px] text-slate-400 font-medium`}>Molar relation, crossbites, overjet, overbite</Text>
                  </View>
                </View>
                {expandedSections.intraoral ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
              </Pressable>

              {expandedSections.intraoral && (
                <View style={tw`p-5 space-y-4`}>
                  {/* Dentition Phase */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-xs font-bold text-slate-300`}>Dentition Phase</Text>
                    <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                      {['Primary Dentition', 'Mixed Dentition', 'Permanent Dentition'].map((phase) => {
                        const isSelected = dentitionPhase === phase;
                        return (
                          <Pressable
                            key={phase}
                            onPress={() => handleFieldChange('dentitionPhase', phase, setDentitionPhase)}
                            style={tw`flex-1 h-9 rounded-xl items-center justify-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                          >
                            <Text style={tw`text-[10px] font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {phase}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Crowding / Spacing */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-xs font-bold text-slate-300`}>Arch Crowding / Spacing</Text>
                    <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                      {['None', 'Crowding', 'Spacing'].map((space) => {
                        const isSelected = crowdingSpacing === space;
                        return (
                          <Pressable
                            key={space}
                            onPress={() => handleFieldChange('crowdingSpacing', space, setCrowdingSpacing)}
                            style={tw`flex-1 h-9 rounded-xl items-center justify-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                          >
                            <Text style={tw`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {space}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Molar Relations */}
                  <View style={tw`flex-row space-x-3`}>
                    <View style={tw`flex-1 space-y-1.5`}>
                      <Text style={tw`text-[11px] font-bold text-slate-300`}>Molar Relation (R)</Text>
                      <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[14px] h-11 items-center`}>
                        {['Class I', 'Class II', 'Class III'].map((cl) => (
                          <Pressable
                            key={cl}
                            onPress={() => handleFieldChange('molarRelationRight', cl, setMolarRelationRight)}
                            style={tw`flex-1 h-7 rounded-lg items-center justify-center ${molarRelationRight === cl ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                          >
                            <Text style={tw`text-[9px] font-black ${molarRelationRight === cl ? 'text-white' : 'text-slate-400'}`}>{cl.split(' ')[1]}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={tw`flex-1 space-y-1.5`}>
                      <Text style={tw`text-[11px] font-bold text-slate-300`}>Molar Relation (L)</Text>
                      <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[14px] h-11 items-center`}>
                        {['Class I', 'Class II', 'Class III'].map((cl) => (
                          <Pressable
                            key={cl}
                            onPress={() => handleFieldChange('molarRelationLeft', cl, setMolarRelationLeft)}
                            style={tw`flex-1 h-7 rounded-lg items-center justify-center ${molarRelationLeft === cl ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                          >
                            <Text style={tw`text-[9px] font-black ${molarRelationLeft === cl ? 'text-white' : 'text-slate-400'}`}>{cl.split(' ')[1]}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Overjet & Overbite */}
                  <View style={tw`flex-row space-x-3`}>
                    <View style={tw`flex-1 space-y-1.5`}>
                      <Text style={tw`text-xs font-bold text-slate-300`}>Overjet (mm)</Text>
                      <TextInput
                        value={overjet}
                        onChangeText={(val) => handleFieldChange('overjet', val, setOverjet)}
                        placeholder="e.g. 2.5"
                        placeholderTextColor="#475569"
                        keyboardType="numeric"
                        style={tw`w-full h-11 px-4 bg-black/45 rounded-[14px] border border-white/10 text-white text-xs font-bold`}
                      />
                    </View>
                    <View style={tw`flex-1 space-y-1.5`}>
                      <Text style={tw`text-xs font-bold text-slate-300`}>Overbite (mm)</Text>
                      <TextInput
                        value={overbite}
                        onChangeText={(val) => handleFieldChange('overbite', val, setOverbite)}
                        placeholder="e.g. 2.5"
                        placeholderTextColor="#475569"
                        keyboardType="numeric"
                        style={tw`w-full h-11 px-4 bg-black/45 rounded-[14px] border border-white/10 text-white text-xs font-bold`}
                      />
                    </View>
                  </View>

                  {/* Crossbites */}
                  <View style={tw`flex-row space-x-3`}>
                    <View style={tw`flex-1 space-y-1.5`}>
                      <Text style={tw`text-[11px] font-bold text-slate-300`}>Ant. Crossbite</Text>
                      <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[14px] h-11 items-center`}>
                        {['None', 'Single Tooth', 'Multiple'].map((cb) => (
                          <Pressable
                            key={cb}
                            onPress={() => handleFieldChange('anteriorCrossbite', cb, setAnteriorCrossbite)}
                            style={tw`flex-1 h-7 rounded-lg items-center justify-center ${anteriorCrossbite === cb ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                          >
                            <Text style={tw`text-[8px] font-black text-center ${anteriorCrossbite === cb ? 'text-white' : 'text-slate-400'}`}>{cb.split(' ')[0]}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={tw`flex-1 space-y-1.5`}>
                      <Text style={tw`text-[11px] font-bold text-slate-300`}>Post. Crossbite</Text>
                      <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[14px] h-11 items-center`}>
                        {['None', 'Unilateral', 'Bilateral'].map((cb) => (
                          <Pressable
                            key={cb}
                            onPress={() => handleFieldChange('posteriorCrossbite', cb, setPosteriorCrossbite)}
                            style={tw`flex-1 h-7 rounded-lg items-center justify-center ${posteriorCrossbite === cb ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                          >
                            <Text style={tw`text-[8px] font-black text-center ${posteriorCrossbite === cb ? 'text-white' : 'text-slate-400'}`}>{cb.split(' ')[0]}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Section 5: Functional, Smile & Growth (Clinic / Turbo only) */}
          {!isCephOnly && (
            <View style={tw`bg-[#0B1020]/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl`}>
              <Pressable 
                onPress={() => toggleSection('functional')}
                style={tw`flex-row justify-between items-center p-5 bg-black/20 border-b border-white/5`}
              >
                <View style={tw`flex-row items-center space-x-3`}>
                  <View style={tw`p-2 bg-amber-500/10 rounded-xl`}>
                    <Flame size={16} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={tw`text-sm font-extrabold text-white`}>Functional, Smile & Growth</Text>
                    <Text style={tw`text-[10px] text-slate-400 font-medium`}>Airway, TMJ status, CVM growth phase, habits</Text>
                  </View>
                </View>
                {expandedSections.functional ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
              </Pressable>

              {expandedSections.functional && (
                <View style={tw`p-5 space-y-4`}>
                  {/* Airway */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-xs font-bold text-slate-300`}>Functional Airway Profile</Text>
                    <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                      {['Normal', 'Mouth Breeder', 'Nasal Obstruction'].map((aw) => {
                        const isSelected = functionalAirway === aw;
                        return (
                          <Pressable
                            key={aw}
                            onPress={() => handleFieldChange('functionalAirway', aw, setFunctionalAirway)}
                            style={tw`flex-1 h-9 rounded-xl items-center justify-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                          >
                            <Text style={tw`text-[9px] font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {aw}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* TMJ Status */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-xs font-bold text-slate-300`}>Temporomandibular Joint (TMJ)</Text>
                    <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                      {['Normal', 'Clicking', 'Painful', 'Limited Opening'].map((tmj) => {
                        const isSelected = tmjStatus === tmj;
                        return (
                          <Pressable
                            key={tmj}
                            onPress={() => handleFieldChange('tmjStatus', tmj, setTmjStatus)}
                            style={tw`flex-1 h-9 rounded-xl items-center justify-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                          >
                            <Text style={tw`text-[9px] font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {tmj.split(' ')[0]}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* CVM Stage */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-xs font-bold text-slate-300`}>Cervical Vertebral Maturation (CVM Stage)</Text>
                    <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                      {['CS1', 'CS2', 'CS3', 'CS4', 'CS5', 'CS6'].map((stage) => {
                        const isSelected = cvmStage === stage;
                        return (
                          <Pressable
                            key={stage}
                            onPress={() => {
                              handleFieldChange('cvmStage', stage, setCvmStage);
                              // Auto sync growth status if CS6 (complete) vs CS1/3 (growing)
                              const nextGrowth = stage === 'CS6' || stage === 'CS5' ? 'Growth Complete' : stage === 'CS3' || stage === 'CS4' ? 'Peak Growth' : 'Growing';
                              handleFieldChange('growthStatus', nextGrowth, setGrowthStatus);
                            }}
                            style={tw`flex-1 h-9 rounded-xl items-center justify-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                          >
                            <Text style={tw`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {stage}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Smile Arc aesthetics */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-xs font-bold text-slate-300`}>Smile Arc Aesthetics</Text>
                    <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                      {['Consonant', 'Non-Consonant', 'Gummy', 'Flat'].map((smile) => {
                        const isSelected = smileAnalysis === smile;
                        return (
                          <Pressable
                            key={smile}
                            onPress={() => handleFieldChange('smileAnalysis', smile, setSmileAnalysis)}
                            style={tw`flex-1 h-9 rounded-xl items-center justify-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                          >
                            <Text style={tw`text-[10px] font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {smile}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Oral Habits */}
                  <View style={tw`space-y-1.5`}>
                    <Text style={tw`text-xs font-bold text-slate-300`}>Atypical Oral Habits</Text>
                    <View style={tw`flex-row flex-wrap gap-2`}>
                      {['Thumb Sucking', 'Tongue Thrusting', 'Nail Biting', 'Mouth Breathing'].map((hb) => {
                        const isSelected = habits.includes(hb);
                        return (
                          <Pressable
                            key={hb}
                            onPress={() => handleHabitToggle(hb)}
                            style={tw`px-3 py-2 rounded-xl border ${isSelected ? 'bg-teal-500/20 border-teal-400' : 'bg-black/40 border-white/10'}`}
                          >
                            <Text style={tw`text-[10px] font-extrabold ${isSelected ? 'text-teal-300' : 'text-slate-400'}`}>
                              {hb}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Section 5B: Clinical Photograph Upload (Foldable Card) */}
          {mode === 'clinic' && (
            <View style={tw`bg-[#0B1020]/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl`}>
              <Pressable 
                onPress={() => toggleSection('photos')}
                style={tw`flex-row justify-between items-center p-5 bg-black/20 border-b border-white/5`}
              >
                <View style={tw`flex-row items-center space-x-3`}>
                  <View style={tw`p-2 bg-teal-500/10 rounded-xl`}>
                    <Camera size={16} color="#14B8A6" />
                  </View>
                  <View>
                    <Text style={tw`text-sm font-extrabold text-white`}>📸 Clinical Photograph Upload</Text>
                    <Text style={tw`text-[10px] text-slate-400 font-medium`}>Standardized extraoral and intraoral views</Text>
                  </View>
                </View>
                {expandedSections.photos ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
              </Pressable>

              {expandedSections.photos && (
                <View style={tw`p-5`}>
                  <ClinicPhotoWorkstation
                    patientDetails={getLatestDetailsObject()}
                    photos={photos}
                    setPhotos={(p: Record<string, string>) => {
                      setPhotos(p);
                      triggerUpdate({ clinicalPhotos: p });
                    }}
                    landmarks={landmarks}
                    setLandmarks={(l: Record<string, Record<string, { x: number; y: number }>>) => {
                      setLandmarks(l);
                      triggerUpdate({ clinicalPhotosLandmarks: l });
                    }}
                    onComplete={(p: Record<string, string>, f: string[]) => {
                      setPhotos(p);
                      setPhotoFindings(f);
                      triggerUpdate({ clinicalPhotos: p, clinicalPhotoFindings: f });
                    }}
                    isEmbedded
                  />
                </View>
              )}
            </View>
          )}

          {/* Section 6: Clinical Observations & Notes */}
          <View style={tw`bg-[#0B1020]/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl`}>
            <Pressable 
              onPress={() => toggleSection('notes')}
              style={tw`flex-row justify-between items-center p-5 bg-black/20 border-b border-white/5`}
            >
              <View style={tw`flex-row items-center space-x-3`}>
                <View style={tw`p-2 bg-amber-500/10 rounded-xl`}>
                  <FileText size={16} color="#F59E0B" />
                </View>
                <View>
                  <Text style={tw`text-sm font-extrabold text-white`}>Clinical Notes & Observations</Text>
                  <Text style={tw`text-[10px] text-slate-400 font-medium`}>Special growth notes or soft tissue comments</Text>
                </View>
              </View>
              {expandedSections.notes ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
            </Pressable>

            {expandedSections.notes && (
              <View style={tw`p-5 space-y-3`}>
                <TextInput
                  value={clinicalNotes}
                  onChangeText={(val) => handleFieldChange('clinicalNotes', val, setClinicalNotes)}
                  placeholder="Record soft tissue profile, skeletal limits, or growth considerations..."
                  placeholderTextColor="#475569"
                  multiline
                  numberOfLines={4}
                  style={[tw`w-full p-4 bg-black/45 rounded-2xl border border-white/10 focus:border-[#14B8A6] text-white text-xs font-bold leading-relaxed`, { minHeight: 110 }]}
                />
              </View>
            )}
          </View>

          {/* Action button row */}
          <View style={tw`flex-row space-x-3 pt-6`}>
            <Pressable
              onPress={onCancel}
              style={tw`flex-1 h-14 bg-white/5 border border-white/10 rounded-[18px] items-center justify-center`}
            >
              <Text style={tw`text-slate-300 font-black text-xs uppercase tracking-widest`}>Back</Text>
            </Pressable>
            
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                tw`flex-1 h-14 bg-[#14B8A6] rounded-[18px] items-center justify-center flex-row shadow-lg shadow-teal-500/20 border border-teal-400/30`,
                pressed ? tw`opacity-90 scale-98` : null
              ]}
            >
              <Text style={tw`text-white font-black text-xs mr-2 uppercase tracking-widest`}>
                {mode === 'clinic' ? 'Clinical Analysis' : 'Ceph Inputs'}
              </Text>
              <ArrowRight size={14} color="#ffffff" />
            </Pressable>
          </View>

        </View>

      </View>
    </ScrollView>
  );
}
