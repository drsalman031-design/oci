import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { User, FileText, ArrowRight, Sparkles } from 'lucide-react-native';
import tw from 'twrnc';
import { PatientDetails } from '../types';
import { sanitizeInput } from '../lib/crypto';

interface PatientFormProps {
  initialDetails?: PatientDetails;
  mode?: 'clinic' | 'ceph' | 'turbo';
  onNext: (details: PatientDetails) => void;
  onCancel: () => void;
  onUpdate?: (details: PatientDetails) => void;
}

export default function PatientForm({ 
  initialDetails, 
  onNext, 
  onCancel,
}: PatientFormProps) {
  const [name, setName] = useState(initialDetails?.name || '');
  const [age, setAge] = useState<string>(initialDetails?.age ? String(initialDetails.age) : '');
  const [gender, setGender] = useState<PatientDetails['gender']>(initialDetails?.gender || '');
  const [caseNumber, setCaseNumber] = useState(initialDetails?.caseNumber || '');
  const [chiefComplaint, setChiefComplaint] = useState(initialDetails?.chiefComplaint || '');
  const [clinicalNotes, setClinicalNotes] = useState(initialDetails?.clinicalNotes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const tempErrors: Record<string, string> = {};
    if (!name.trim()) tempErrors.name = 'Patient Name is required';
    if (!caseNumber.trim()) tempErrors.caseNumber = 'Patient ID is required';
    
    const parsedAge = Number(age);
    if (!age || isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
      tempErrors.age = 'Enter a valid age (1-120)';
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const patientData: PatientDetails = {
      name: sanitizeInput(name),
      age: Number(age),
      gender,
      caseNumber: sanitizeInput(caseNumber),
      chiefComplaint: sanitizeInput(chiefComplaint),
      clinicalNotes: sanitizeInput(clinicalNotes),
      date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      facialProfile: '',
      lips: '',
      molarRelationRight: '',
      molarRelationLeft: '',
      canineRelationRight: '',
      canineRelationLeft: '',
      overjet: '',
      overbite: '',
      anteriorCrossbite: '',
      posteriorCrossbite: '',
      functionalAirway: '',
      tmjStatus: '',
      habits: [],
      cvmStage: '',
      growthStatus: '',
      analysisMode: 'turbo'
    };

    onNext(patientData);
  };

  return (
    <ScrollView 
      contentContainerStyle={tw`pb-28 px-6 w-full bg-slate-50`} 
      style={tw`flex-1`}
      keyboardShouldPersistTaps="handled"
    >
      <View style={tw`space-y-6 mt-6 max-w-xl mx-auto w-full`}>
        {/* Header */}
        <View style={tw`space-y-1.5`}>
          <View style={tw`flex-row items-center bg-teal-50 border border-teal-100 px-3 py-1 rounded-full self-start`}>
            <Sparkles size={11} color="#0D9488" style={tw`mr-1.5`} />
            <Text style={tw`text-[#0D9488] text-[9px] font-black uppercase tracking-wider`}>
              Step 1 of 3: Patient Intake
            </Text>
          </View>
          <Text style={tw`text-2xl font-black text-slate-900 tracking-tight`}>
            New Patient Details
          </Text>
          <Text style={tw`text-xs text-slate-500`}>
            Please fill out the basic patient information below to register them for OCI Analysis.
          </Text>
        </View>

        {/* Form Card */}
        <View style={tw`bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm space-y-5`}>
          
          {/* Patient Name */}
          <View style={tw`space-y-1.5`}>
            <Text style={tw`text-xs font-bold text-slate-700`}>Patient Name *</Text>
            <View style={tw`flex-row items-center w-full h-12 bg-slate-50 rounded-xl border ${errors.name ? 'border-red-500' : 'border-slate-200'} px-4`}>
              <User size={16} color="#64748B" style={tw`mr-2`} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. John Doe"
                placeholderTextColor="#94A3B8"
                style={tw`flex-1 text-slate-800 text-xs h-full p-0 font-bold`}
              />
            </View>
            {errors.name && <Text style={tw`text-[10px] text-red-500 font-bold`}>{errors.name}</Text>}
          </View>

          {/* Patient ID */}
          <View style={tw`space-y-1.5`}>
            <Text style={tw`text-xs font-bold text-slate-700`}>Patient ID / Case Number *</Text>
            <View style={tw`flex-row items-center w-full h-12 bg-slate-50 rounded-xl border ${errors.caseNumber ? 'border-red-500' : 'border-slate-200'} px-4`}>
              <FileText size={16} color="#64748B" style={tw`mr-2`} />
              <TextInput
                value={caseNumber}
                onChangeText={setCaseNumber}
                placeholder="e.g. OCI-9842"
                placeholderTextColor="#94A3B8"
                style={tw`flex-1 text-slate-800 text-xs h-full p-0 font-bold`}
              />
            </View>
            {errors.caseNumber && <Text style={tw`text-[10px] text-red-500 font-bold`}>{errors.caseNumber}</Text>}
          </View>

          {/* Age & Gender */}
          <View style={tw`flex-row space-x-4`}>
            {/* Age */}
            <View style={tw`flex-1 space-y-1.5`}>
              <Text style={tw`text-xs font-bold text-slate-700`}>Age *</Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="e.g. 24"
                placeholderTextColor="#94A3B8"
                style={tw`w-full h-12 px-4 bg-slate-50 rounded-xl border ${errors.age ? 'border-red-500' : 'border-slate-200'} text-slate-800 text-xs font-bold`}
              />
              {errors.age && <Text style={tw`text-[10px] text-red-500 font-bold`}>{errors.age}</Text>}
            </View>

            {/* Gender */}
            <View style={tw`flex-1 space-y-1.5`}>
              <Text style={tw`text-xs font-bold text-slate-700`}>Gender</Text>
              <View style={tw`flex-row bg-slate-100 p-1 rounded-xl h-12 items-center`}>
                {['Male', 'Female'].map((g) => {
                  const isSelected = gender === g;
                  return (
                    <Pressable
                      key={g}
                      onPress={() => setGender(g as any)}
                      style={tw`flex-1 h-10 rounded-lg items-center justify-center ${isSelected ? 'bg-teal-600' : 'bg-transparent'}`}
                    >
                      <Text style={tw`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                        {g}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Chief Complaint */}
          <View style={tw`space-y-1.5`}>
            <Text style={tw`text-xs font-bold text-slate-700`}>Chief Complaint (optional)</Text>
            <TextInput
              value={chiefComplaint}
              onChangeText={setChiefComplaint}
              placeholder="e.g. Crowded lower anterior teeth, difficulty chewing"
              placeholderTextColor="#94A3B8"
              style={tw`w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs font-bold`}
            />
          </View>

          {/* Doctor Notes */}
          <View style={tw`space-y-1.5`}>
            <Text style={tw`text-xs font-bold text-slate-700`}>Doctor Notes (optional)</Text>
            <TextInput
              value={clinicalNotes}
              onChangeText={setClinicalNotes}
              placeholder="Additional findings or history notes..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              style={tw`w-full min-h-[80px] p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs font-bold`}
            />
          </View>

        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row space-x-4 pt-2`}>
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [
              tw`flex-1 py-4 bg-slate-100 rounded-xl border border-slate-200 items-center justify-center`,
              pressed ? tw`opacity-80` : null
            ]}
          >
            <Text style={tw`text-slate-600 font-bold text-xs uppercase tracking-wider`}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              tw`flex-1 py-4 bg-teal-600 rounded-xl items-center justify-center flex-row shadow-sm`,
              pressed ? tw`opacity-90 scale-[0.99]` : null
            ]}
          >
            <Text style={tw`text-white font-black text-xs uppercase tracking-wider mr-2`}>Next: Upload Records</Text>
            <ArrowRight size={14} color="#FFF" />
          </Pressable>
        </View>

      </View>
    </ScrollView>
  );
}