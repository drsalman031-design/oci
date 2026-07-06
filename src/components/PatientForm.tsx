import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { User, Clipboard, FileText, ArrowRight, X, Heart, ShieldAlert, Sparkles, ChevronDown, ChevronUp, Info } from 'lucide-react-native';
import tw from 'twrnc';
import { PatientDetails } from '../types';

interface PatientFormProps {
  initialDetails?: PatientDetails;
  onNext: (details: PatientDetails) => void;
  onCancel: () => void;
}

export default function PatientForm({ initialDetails, onNext, onCancel }: PatientFormProps) {
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
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [expandedSections, setExpandedSections] = useState({
    info: true,
    assessment: true,
    smile: true,
    notes: true
  });

  const toggleSection = (sec: 'info' | 'assessment' | 'smile' | 'notes') => {
    setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
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
      onNext({
        name,
        age: Number(age),
        gender,
        caseNumber,
        diagnosis,
        date,
        clinicalNotes,
        facialProfile,
        smileAnalysis,
        crowdingSpacing,
        dentitionPhase,
      });
    }
  };

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
                <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-wider font-mono`}>Step 1 of 2 • Assessment Intake</Text>
              </View>
              <Text style={tw`text-xl font-black text-white tracking-tight`}>Patient Information</Text>
              <Text style={tw`text-xs text-slate-400`}>Establish the primary clinical patient archive parameters</Text>
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
          <View style={tw`h-full w-1/2 bg-[#14B8A6] rounded-full`} />
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
                    onChangeText={setName}
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
                    onChangeText={setCaseNumber}
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
                      onChangeText={setAge}
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
                            onPress={() => setGender(g as any)}
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

          {/* Section 2: Clinical & Skeletal Assessment */}
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
                  <Text style={tw`text-sm font-extrabold text-white`}>Clinical Assessment</Text>
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
                          onPress={() => setDiagnosis(diag as any)}
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
                          onPress={() => setFacialProfile(prof as any)}
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

          {/* Section 3: Smile & Arch Analysis */}
          <View style={tw`bg-[#0B1020]/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl`}>
            <Pressable 
              onPress={() => toggleSection('smile')}
              style={tw`flex-row justify-between items-center p-5 bg-black/20 border-b border-white/5`}
            >
              <View style={tw`flex-row items-center space-x-3`}>
                <View style={tw`p-2 bg-pink-500/10 rounded-xl`}>
                  <Heart size={16} color="#EC4899" />
                </View>
                <View>
                  <Text style={tw`text-sm font-extrabold text-white`}>Smile & Arch Analysis</Text>
                  <Text style={tw`text-[10px] text-slate-400 font-medium`}>Consonancy, crowding, and dentition spacing</Text>
                </View>
              </View>
              {expandedSections.smile ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
            </Pressable>

            {expandedSections.smile && (
              <View style={tw`p-5 space-y-4`}>
                {/* Smile Analysis */}
                <View style={tw`space-y-1.5`}>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Smile Arc Aesthetics</Text>
                  <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                    {['Consonant', 'Non-Consonant', 'Gummy', 'Flat'].map((smile) => {
                      const isSelected = smileAnalysis === smile;
                      return (
                        <Pressable
                          key={smile}
                          onPress={() => setSmileAnalysis(smile as any)}
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

                {/* Crowding / Spacing */}
                <View style={tw`space-y-1.5`}>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Arch Crowding / Spacing</Text>
                  <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                    {['None', 'Crowding', 'Spacing'].map((space) => {
                      const isSelected = crowdingSpacing === space;
                      return (
                        <Pressable
                          key={space}
                          onPress={() => setCrowdingSpacing(space as any)}
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

                {/* Dentition Phase */}
                <View style={tw`space-y-1.5`}>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Dentition Phase</Text>
                  <View style={tw`flex-row bg-black/45 border border-white/10 p-1 rounded-[18px] h-13 items-center`}>
                    {['Primary Dentition', 'Mixed Dentition', 'Permanent Dentition'].map((phase) => {
                      const isSelected = dentitionPhase === phase;
                      return (
                        <Pressable
                          key={phase}
                          onPress={() => setDentitionPhase(phase as any)}
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
              </View>
            )}
          </View>

          {/* Section 4: Clinical Observations */}
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
                  onChangeText={setClinicalNotes}
                  placeholder="Record soft tissue profile, skeletal limits, or growth considerations (e.g. CVM stage)..."
                  placeholderTextColor="#475569"
                  multiline
                  numberOfLines={4}
                  style={[tw`w-full p-4 bg-black/45 rounded-2xl border border-white/10 focus:border-[#14B8A6] text-white text-xs font-bold leading-relaxed`, { minHeight: 110 }]}
                />
              </View>
            )}
          </View>

          {/* Next button row */}
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
              <Text style={tw`text-white font-black text-xs mr-2 uppercase tracking-widest`}>Ceph Inputs</Text>
              <ArrowRight size={14} color="#ffffff" />
            </Pressable>
          </View>

        </View>

      </View>
    </ScrollView>
  );
}
