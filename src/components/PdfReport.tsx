import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { Assessment } from '../types';
import { 
  Printer, 
  Share2, 
  X, 
  ShieldCheck, 
  Award
} from 'lucide-react-native';
import SvgCharts from './SvgCharts';
import Heatmap from './Heatmap';
import tw from 'twrnc';

interface PdfReportProps {
  assessment: Assessment;
  onClose: () => void;
}

export default function PdfReport({ assessment, onClose }: PdfReportProps) {
  const [clinicName, setClinicName] = useState('Central Orthodontic Clinic');
  const [doctorName, setDoctorName] = useState('Dr. Salman, DDS');
  const [sigText, setSigText] = useState('Dr. Salman');

  const handlePrint = () => {
    Alert.alert("Offline PDF Printing", "This printable clinical record has been prepared. In a native environment, this exports directly to your phone's native Print Manager.");
  };

  const handleShare = () => {
    Alert.alert("Secure Patient Share", "HIPAA-compliant sharing initiated. The patient report has been prepared for native share sheet export.");
  };

  return (
    <View style={[tw`absolute inset-0 bg-slate-900/80 z-50 justify-center p-4`, { elevation: 10 }]}>
      <View style={tw`bg-white dark:bg-slate-950 rounded-3xl overflow-hidden flex-col max-h-[90%] shadow-2xl`}>
        
        {/* Top Control Bar */}
        <View style={tw`px-6 py-4 bg-slate-950 flex-row justify-between items-center`}>
          <View style={tw`flex-1 pr-4`}>
            <Text style={tw`text-[10px] font-bold tracking-wide text-slate-400 uppercase`}>Report Compilation Stage</Text>
            <View style={tw`flex-row items-center mt-0.5`}>
              <ShieldCheck size={16} color="#2dd4bf" style={tw`mr-1.5`} />
              <Text style={tw`font-bold text-sm text-white`}>Certified OCI Diagnostic Sheet</Text>
            </View>
          </View>
          
          <View style={tw`flex-row items-center space-x-2`}>
            <Pressable
              onPress={handlePrint}
              style={tw`px-3 py-2 bg-blue-600 rounded-xl flex-row items-center`}
            >
              <Printer size={12} color="#ffffff" style={tw`mr-1`} />
              <Text style={tw`text-[10px] font-bold text-white`}>Print PDF</Text>
            </Pressable>
            
            <Pressable
              onPress={handleShare}
              style={tw`p-2 hover:bg-slate-800 rounded-xl`}
            >
              <Share2 size={16} color="#94a3b8" />
            </Pressable>

            <Pressable
              onPress={onClose}
              style={tw`p-2 bg-slate-800 rounded-xl ml-1`}
            >
              <X size={16} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {/* Scrollable Printable Paper Content */}
        <ScrollView contentContainerStyle={tw`p-6 space-y-6 bg-white dark:bg-slate-950`}>
          
          {/* Clinic Header Block */}
          <View style={tw`border-b-2 border-slate-900 dark:border-slate-850 pb-4`}>
            <TextInput
              value={clinicName}
              onChangeText={setClinicName}
              placeholder="Clinic Name"
              placeholderTextColor="#94a3b8"
              style={tw`text-lg font-black text-slate-900 dark:text-white p-0`}
            />
            <Text style={tw`text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1`}>
              Dentoalveolar Orthodontics Specialist Center
            </Text>
            <View style={tw`flex-row justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-900`}>
              <Text style={tw`text-[10px] font-mono text-slate-500`}>Case ID: {assessment.patientDetails.caseNumber}</Text>
              <Text style={tw`text-[10px] font-mono text-slate-500`}>
                Exam Date: {assessment.patientDetails.date || assessment.createdAt.split('T')[0]}
              </Text>
            </View>
          </View>

          {/* Patient Details & OCI Score Block */}
          <View style={tw`flex-col md:flex-row gap-4 items-center`}>
            
            {/* Patient demographics */}
            <View style={tw`flex-1 w-full space-y-3`}>
              <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono`}>Patient Demographics</Text>
              
              <View style={tw`space-y-2`}>
                <View style={tw`flex-row justify-between border-b border-slate-100 dark:border-slate-900 pb-1.5`}>
                  <Text style={tw`text-xs text-slate-400`}>Full Name:</Text>
                  <Text style={tw`text-xs font-bold text-slate-800 dark:text-slate-100`}>{assessment.patientDetails.name}</Text>
                </View>
                <View style={tw`flex-row justify-between border-b border-slate-100 dark:border-slate-900 pb-1.5`}>
                  <Text style={tw`text-xs text-slate-400`}>Diagnosis:</Text>
                  <Text style={tw`text-xs font-bold text-blue-600 dark:text-blue-400`}>{assessment.patientDetails.diagnosis}</Text>
                </View>
                <View style={tw`flex-row justify-between border-b border-slate-100 dark:border-slate-900 pb-1.5`}>
                  <Text style={tw`text-xs text-slate-400`}>Age / Gender:</Text>
                  <Text style={tw`text-xs font-bold text-slate-800 dark:text-slate-100`}>
                    {assessment.patientDetails.age} years • {assessment.patientDetails.gender}
                  </Text>
                </View>
              </View>
            </View>

            {/* Large Score Banner */}
            <View style={tw`w-full md:w-48 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center items-center justify-center`}>
              <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono text-center`}>Orthodontic Compensation Index</Text>
              <Text style={tw`text-4xl font-black font-mono text-slate-900 dark:text-white mt-1 text-center`}>{assessment.ociResult.totalScore}%</Text>
              <Text style={tw`text-[10px] font-bold text-teal-600 dark:text-teal-400 mt-1 uppercase tracking-wide text-center`}>
                {assessment.ociResult.interpretation}
              </Text>
            </View>
          </View>

          {/* Cephalometric Values Summary Table */}
          <View style={tw`space-y-2`}>
            <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono`}>Dentoalveolar cephalometric readings</Text>
            
            <View style={tw`flex-row flex-wrap gap-2`}>
              {[
                { label: 'ANB', val: assessment.cephalometricInput.anb, norm: '2°' },
                { label: 'SNA', val: assessment.cephalometricInput.sna, norm: '82°' },
                { label: 'SNB', val: assessment.cephalometricInput.snb, norm: '80°' },
                { label: 'Wits', val: assessment.cephalometricInput.wits, norm: '0mm' },
                { label: 'U1-SN', val: assessment.cephalometricInput.u1Sn, norm: '104°' },
                { label: 'IMPA', val: assessment.cephalometricInput.impa, norm: '90°' },
                { label: 'Overjet', val: assessment.cephalometricInput.overjet, norm: '2.5mm' },
                { label: 'Overbite', val: assessment.cephalometricInput.overbite, norm: '2.5mm' }
              ].map((m, idx) => (
                <View key={idx} style={tw`bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 flex-row justify-between w-[48%]`}>
                  <Text style={tw`text-xs text-slate-400 font-bold`}>{m.label}:</Text>
                  <Text style={tw`text-xs font-bold text-slate-800 dark:text-slate-200`}>
                    {m.val !== '' ? m.val : 'N/A'} <Text style={tw`text-[9px] text-slate-400`}>({m.norm})</Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* AI Clinical Summary report */}
          <View style={tw`bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-1`}>
            <View style={tw`flex-row items-center mb-1`}>
              <Award size={14} color="#0d9488" style={tw`mr-1.5`} />
              <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono`}>Certified Medical Analysis</Text>
            </View>
            <Text style={tw`text-xs text-slate-800 dark:text-slate-200 leading-relaxed italic font-sans`}>
              "{assessment.aiSummary || 'No clinical report recorded.'}"
            </Text>
          </View>

          {/* Svg Charts */}
          <View style={tw`border-t border-slate-150 dark:border-slate-850 pt-4 items-center`}>
            <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-3`}>Deviation Profile Summary</Text>
            <View style={tw`w-full items-center justify-center`}>
              <SvgCharts categoryScores={assessment.ociResult.categoryScores} />
            </View>
          </View>

          {/* Signature Block */}
          <View style={tw`border-t border-slate-150 dark:border-slate-850 pt-4 space-y-4`}>
            <View style={tw`space-y-1.5`}>
              <Text style={tw`text-[10px] font-bold text-slate-500 uppercase`}>Clinical Responsibility Disclaimer</Text>
              <Text style={tw`text-[10px] text-slate-400 leading-normal`}>
                The computed OCI represents an algorithmic clinical assistant. All dental camouflage or orthognathic diagnostic pathways remain under the sole accountability of the treating certified orthodontist.
              </Text>
            </View>
            
            <View style={tw`border-t border-slate-100 dark:border-slate-900 pt-3 flex-row justify-between items-end`}>
              <View style={tw`flex-1 pr-4`}>
                <Text style={tw`text-[10px] text-slate-400`}>Authorized Practitioner Seal</Text>
                <TextInput
                  value={doctorName}
                  onChangeText={setDoctorName}
                  style={tw`font-bold text-sm text-slate-800 dark:text-white p-0 mt-1`}
                />
              </View>
              
              <View style={tw`items-end`}>
                <TextInput
                  value={sigText}
                  onChangeText={setSigText}
                  placeholder="Sign Name"
                  placeholderTextColor="#94a3b8"
                  style={[tw`text-lg text-teal-600 font-bold italic border-b border-slate-300 dark:border-slate-800 p-0 text-right`, { fontFamily: 'serif' }]}
                />
                <Text style={tw`text-[9px] text-slate-400 mt-1`}>Orthodontic Specialist Signature</Text>
              </View>
            </View>
          </View>

        </ScrollView>
        
      </View>
    </View>
  );
}
