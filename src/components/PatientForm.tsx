import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { User, Clipboard, FileText, ArrowRight, X } from 'lucide-react-native';
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
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-12 px-4 max-w-2xl w-full mx-auto`}>
      <View style={tw`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mt-4`}>
        
        {/* Header */}
        <View style={tw`bg-teal-700 px-6 py-5 flex-row justify-between items-center`}>
          <View>
            <Text style={tw`text-[10px] font-mono text-teal-200 uppercase tracking-widest`}>Step 1 of 2</Text>
            <Text style={tw`text-xl font-bold text-white tracking-tight`}>Patient Demographics</Text>
          </View>
          <Pressable 
            onPress={onCancel}
            style={tw`p-2 hover:bg-white/10 rounded-xl`}
          >
            <X size={20} color="#ffffff" />
          </Pressable>
        </View>

        <View style={tw`p-6 space-y-6`}>
          
          {/* Patient Name */}
          <View style={tw`space-y-1.5`}>
            <View style={tw`flex-row items-center mb-1`}>
              <User size={14} color="#64748b" style={tw`mr-1.5`} />
              <Text style={tw`text-sm font-semibold text-slate-700 dark:text-slate-300`}>Patient Name *</Text>
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. John Doe"
              placeholderTextColor="#94a3b8"
              style={tw`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500 bg-red-50/5' : 'border-slate-200 dark:border-slate-700'} text-slate-800 dark:text-slate-200 text-sm`}
            />
            {errors.name && <Text style={tw`text-xs text-red-500 mt-1`}>{errors.name}</Text>}
          </View>

          {/* Case Number */}
          <View style={tw`space-y-1.5`}>
            <View style={tw`flex-row items-center mb-1`}>
              <Clipboard size={14} color="#64748b" style={tw`mr-1.5`} />
              <Text style={tw`text-sm font-semibold text-slate-700 dark:text-slate-300`}>Case Number / ID *</Text>
            </View>
            <TextInput
              value={caseNumber}
              onChangeText={setCaseNumber}
              placeholder="e.g. ORTHO-2026-98"
              placeholderTextColor="#94a3b8"
              style={tw`w-full px-4 py-3 rounded-xl border ${errors.caseNumber ? 'border-red-500 bg-red-50/5' : 'border-slate-200 dark:border-slate-700'} text-slate-800 dark:text-slate-200 text-sm`}
            />
            {errors.caseNumber && <Text style={tw`text-xs text-red-500 mt-1`}>{errors.caseNumber}</Text>}
          </View>

          {/* Age & Gender Row */}
          <View style={tw`flex-row justify-between`}>
            
            {/* Age */}
            <View style={tw`w-[47%] space-y-1.5`}>
              <Text style={tw`text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1`}>Age *</Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                placeholder="e.g. 24"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                style={tw`w-full px-4 py-3 rounded-xl border ${errors.age ? 'border-red-500 bg-red-50/5' : 'border-slate-200 dark:border-slate-700'} text-slate-800 dark:text-slate-200 text-sm`}
              />
              {errors.age && <Text style={tw`text-xs text-red-500 mt-1`}>{errors.age}</Text>}
            </View>

            {/* Gender Selection */}
            <View style={tw`w-[47%] space-y-1.5`}>
              <Text style={tw`text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1`}>Gender *</Text>
              <View style={tw`flex-row space-x-2 border border-slate-100 dark:border-slate-850 p-1 rounded-xl`}>
                {['Male', 'Female'].map((g) => {
                  const isSelected = gender === g;
                  return (
                    <Pressable
                      key={g}
                      onPress={() => setGender(g as any)}
                      style={tw`flex-1 py-2 rounded-lg items-center ${isSelected ? 'bg-teal-500' : 'bg-transparent'}`}
                    >
                      <Text style={tw`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {g}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.gender && <Text style={tw`text-xs text-red-500 mt-1`}>{errors.gender}</Text>}
            </View>

          </View>

          {/* Diagnosis Option Buttons */}
          <View style={tw`space-y-1.5`}>
            <Text style={tw`text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1`}>
              Skeletal Sagittal Diagnosis *
            </Text>
            <View style={tw`flex-row justify-between border border-slate-100 dark:border-slate-850 p-1 rounded-xl`}>
              {['Class I', 'Class II', 'Class III'].map((diag) => {
                const isSelected = diagnosis === diag;
                return (
                  <Pressable
                    key={diag}
                    onPress={() => setDiagnosis(diag as any)}
                    style={tw`flex-1 py-2.5 rounded-lg items-center ${isSelected ? 'bg-teal-500' : 'bg-transparent'}`}
                  >
                    <Text style={tw`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      {diag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.diagnosis && <Text style={tw`text-xs text-red-500 mt-1`}>{errors.diagnosis}</Text>}
          </View>

          {/* Clinical Notes */}
          <View style={tw`space-y-1.5`}>
            <View style={tw`flex-row items-center mb-1`}>
              <FileText size={14} color="#64748b" style={tw`mr-1.5`} />
              <Text style={tw`text-sm font-semibold text-slate-700 dark:text-slate-300`}>Clinical Notes / Observations</Text>
            </View>
            <TextInput
              value={clinicalNotes}
              onChangeText={setClinicalNotes}
              placeholder="Record pre-treatment periodontal status, profile characteristics, skeletal age (CVM), or specific concerns..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              style={[tw`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm`, { minHeight: 80 }]}
            />
          </View>

          {/* Action Buttons */}
          <View style={tw`flex-row space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800`}>
            <Pressable
              onPress={onCancel}
              style={tw`flex-1 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl items-center`}
            >
              <Text style={tw`text-slate-600 dark:text-slate-400 font-bold text-xs`}>Cancel</Text>
            </Pressable>
            
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                tw`flex-1 py-3.5 bg-teal-500 rounded-2xl items-center flex-row justify-center`,
                pressed ? tw`bg-teal-600` : null
              ]}
            >
              <Text style={tw`text-white font-bold text-xs mr-2`}>Ceph Analysis</Text>
              <ArrowRight size={14} color="#ffffff" />
            </Pressable>
          </View>

        </View>

      </View>
    </ScrollView>
  );
}
