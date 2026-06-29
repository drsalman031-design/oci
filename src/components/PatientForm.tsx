import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { User, Clipboard, FileText, ArrowRight, X, Heart, ShieldAlert, Sparkles } from 'lucide-react-native';
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
  const [clinicalNotes, setClinicalNotes] = useState(initialDetails?.clinicalNotes || '');
  const [date] = useState(initialDetails?.date || new Date().toISOString().split('T')[0]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        <View style={tw`bg-[#0B1020]/80 border border-white/5 rounded-[32px] p-6 space-y-6 shadow-2xl`}>
          
          {/* Patient Name */}
          <View style={tw`space-y-2`}>
            <View style={tw`flex-row items-center mb-1`}>
              <User size={13} color="#14B8A6" style={tw`mr-2`} />
              <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Patient Name *</Text>
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Liam Henderson"
              placeholderTextColor="#475569"
              style={tw`w-full px-4 py-3.5 bg-black/45 rounded-2xl border ${errors.name ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-[#14B8A6]'} text-white text-xs font-bold`}
            />
            {errors.name && <Text style={tw`text-[10px] text-rose-400 font-mono mt-1`}>{errors.name}</Text>}
          </View>

          {/* Case Reference Number */}
          <View style={tw`space-y-2`}>
            <View style={tw`flex-row items-center mb-1`}>
              <Clipboard size={13} color="#14B8A6" style={tw`mr-2`} />
              <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Case ID *</Text>
            </View>
            <TextInput
              value={caseNumber}
              onChangeText={setCaseNumber}
              placeholder="e.g. SLM-2026-09"
              placeholderTextColor="#475569"
              style={tw`w-full px-4 py-3.5 bg-black/45 rounded-2xl border ${errors.caseNumber ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-[#14B8A6]'} text-white text-xs font-bold`}
            />
            {errors.caseNumber && <Text style={tw`text-[10px] text-rose-400 font-mono mt-1`}>{errors.caseNumber}</Text>}
          </View>

          {/* Age & Gender Row */}
          <View style={tw`flex-row space-x-4`}>
            
            {/* Age */}
            <View style={tw`flex-1 space-y-2`}>
              <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1`}>Age *</Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                placeholder="e.g. 24"
                placeholderTextColor="#475569"
                keyboardType="numeric"
                style={tw`w-full px-4 py-3.5 bg-black/45 rounded-2xl border ${errors.age ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-[#14B8A6]'} text-white text-xs font-bold`}
              />
              {errors.age && <Text style={tw`text-[10px] text-rose-400 font-mono mt-1`}>{errors.age}</Text>}
            </View>

            {/* Gender Selection */}
            <View style={tw`flex-1 space-y-2`}>
              <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1`}>Gender *</Text>
              <View style={tw`flex-row bg-black/40 border border-white/10 p-1 rounded-2xl`}>
                {['Male', 'Female'].map((g) => {
                  const isSelected = gender === g;
                  return (
                    <Pressable
                      key={g}
                      onPress={() => setGender(g as any)}
                      style={tw`flex-1 py-3.5 rounded-xl items-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                    >
                      <Text style={tw`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                        {g}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.gender && <Text style={tw`text-[10px] text-rose-400 font-mono mt-1`}>{errors.gender}</Text>}
            </View>

          </View>

          {/* Diagnosis Skeletal classification buttons */}
          <View style={tw`space-y-2`}>
            <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1`}>
              Skeletal Sagittal Pattern *
            </Text>
            <View style={tw`flex-row bg-black/40 border border-white/10 p-1 rounded-2xl`}>
              {['Class I', 'Class II', 'Class III'].map((diag) => {
                const isSelected = diagnosis === diag;
                return (
                  <Pressable
                    key={diag}
                    onPress={() => setDiagnosis(diag as any)}
                    style={tw`flex-1 py-3 rounded-xl items-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                  >
                    <Text style={tw`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                      {diag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.diagnosis && <Text style={tw`text-[10px] text-rose-400 font-mono mt-1`}>{errors.diagnosis}</Text>}
          </View>

          {/* Facial Profile Assessment */}
          <View style={tw`space-y-2`}>
            <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1`}>
              Facial Profile Assessment
            </Text>
            <View style={tw`flex-row bg-black/40 border border-white/10 p-1 rounded-2xl`}>
              {['Straight', 'Convex', 'Concave'].map((prof) => {
                const isSelected = facialProfile === prof;
                return (
                  <Pressable
                    key={prof}
                    onPress={() => setFacialProfile(prof as any)}
                    style={tw`flex-1 py-3 rounded-xl items-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                  >
                    <Text style={tw`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                      {prof}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Smile Analysis */}
          <View style={tw`space-y-2`}>
            <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1`}>
              Smile Analysis
            </Text>
            <View style={tw`flex-row bg-black/40 border border-white/10 p-1 rounded-2xl`}>
              {['Consonant', 'Non-Consonant', 'Gummy', 'Flat'].map((smile) => {
                const isSelected = smileAnalysis === smile;
                return (
                  <Pressable
                    key={smile}
                    onPress={() => setSmileAnalysis(smile as any)}
                    style={tw`flex-1 py-3 rounded-xl items-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                  >
                    <Text style={tw`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                      {smile}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Crowding / Spacing */}
          <View style={tw`space-y-2`}>
            <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1`}>
              Arch Crowding / Spacing
            </Text>
            <View style={tw`flex-row bg-black/40 border border-white/10 p-1 rounded-2xl`}>
              {['None', 'Crowding', 'Spacing'].map((space) => {
                const isSelected = crowdingSpacing === space;
                return (
                  <Pressable
                    key={space}
                    onPress={() => setCrowdingSpacing(space as any)}
                    style={tw`flex-1 py-3 rounded-xl items-center ${isSelected ? 'bg-[#14B8A6]' : 'bg-transparent'}`}
                  >
                    <Text style={tw`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                      {space}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Clinical Diagnostic Notes */}
          <View style={tw`space-y-2`}>
            <View style={tw`flex-row items-center mb-1`}>
              <FileText size={13} color="#14B8A6" style={tw`mr-2`} />
              <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Clinical Observations</Text>
            </View>
            <TextInput
              value={clinicalNotes}
              onChangeText={setClinicalNotes}
              placeholder="Record soft tissue profile, skeletal limits, or growth considerations (e.g. CVM stage)..."
              placeholderTextColor="#475569"
              multiline
              numberOfLines={4}
              style={[tw`w-full px-4 py-3.5 bg-black/45 rounded-2xl border border-white/10 focus:border-[#14B8A6] text-white text-xs font-bold`, { minHeight: 90 }]}
            />
          </View>

          {/* Next button row */}
          <View style={tw`flex-row space-x-3 pt-4 border-t border-white/5`}>
            <Pressable
              onPress={onCancel}
              style={tw`flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl items-center`}
            >
              <Text style={tw`text-slate-400 font-black text-xs uppercase tracking-widest`}>Back</Text>
            </Pressable>
            
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                tw`flex-1 py-4 bg-[#14B8A6] rounded-2xl items-center flex-row justify-center shadow-lg shadow-teal-500/20 border border-teal-400/30`,
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
