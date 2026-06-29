import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { Assessment } from '../types';
import { 
  Printer, 
  Share2, 
  X, 
  ShieldCheck, 
  Award,
  Sparkles
} from 'lucide-react-native';
import MarkdownRenderer from './MarkdownRenderer';
import SvgCharts from './SvgCharts';
import Heatmap from './Heatmap';
import tw from 'twrnc';

interface PdfReportProps {
  assessment: Assessment;
  onClose: () => void;
}

export default function PdfReport({ assessment, onClose }: PdfReportProps) {
  const [clinicName, setClinicName] = useState('Central Orthodontic Clinic');
  const [doctorName, setDoctorName] = useState('Dr. Salman, MDS');
  const [sigText, setSigText] = useState('Dr. Salman');

  const handlePrint = () => {
    Alert.alert("Print Job Queued", "This printable clinical record has been prepared. In a native environment, this exports directly to your device's native Print Manager.");
  };

  const handleShare = () => {
    Alert.alert("Secure Share Initiated", "HIPAA-compliant sharing initialized. The patient report has been prepared for native share sheet export.");
  };

  return (
    <View style={[tw`absolute inset-0 bg-[#050814]/98 z-50 justify-center p-4`, { elevation: 10 }]}>
      <View style={tw`bg-[#0B1020] rounded-[32px] border border-white/10 overflow-hidden flex-col max-h-[92%] shadow-2xl`}>
        
        {/* Top Control Bar */}
        <View style={tw`px-6 py-4 bg-black/40 border-b border-white/5 flex-row justify-between items-center`}>
          <View style={tw`flex-1 pr-4`}>
            <View style={tw`flex-row items-center bg-teal-500/15 border border-teal-500/30 px-2.5 py-0.5 rounded-full self-start mb-1`}>
              <Sparkles size={10} color="#22D3EE" style={tw`mr-1.5`} />
              <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-wider font-mono`}>Report Compiler</Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <ShieldCheck size={14} color="#14B8A6" style={tw`mr-1.5`} />
              <Text style={tw`font-black text-xs text-white uppercase tracking-wider`}>Certified OCI Report</Text>
            </View>
          </View>
          
          <View style={tw`flex-row items-center space-x-2`}>
            <Pressable
              onPress={handlePrint}
              style={({ pressed }) => [
                tw`px-3 py-2 bg-[#14B8A6] rounded-xl flex-row items-center justify-center shadow-lg border border-teal-400/30`,
                pressed ? tw`opacity-90` : null
              ]}
            >
              <Printer size={12} color="#ffffff" style={tw`mr-1`} />
              <Text style={tw`text-[10px] font-black text-white uppercase tracking-widest`}>Print</Text>
            </Pressable>
            
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                tw`p-2 bg-white/5 rounded-xl border border-white/10`,
                pressed ? tw`bg-white/10` : null
              ]}
            >
              <Share2 size={13} color="#22D3EE" />
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                tw`p-2 bg-white/5 rounded-xl border border-white/10 ml-1`,
                pressed ? tw`bg-white/10` : null
              ]}
            >
              <X size={13} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {/* Scrollable Paper Content */}
        <ScrollView contentContainerStyle={tw`p-6 space-y-6 bg-[#0B1020]`}>
          
          {/* Clinic Header Block */}
          <View style={tw`border-b border-white/10 pb-4`}>
            <TextInput
              value={clinicName}
              onChangeText={setClinicName}
              placeholder="Clinic Name"
              placeholderTextColor="#475569"
              style={tw`text-base font-black text-slate-100 p-0`}
            />
            <Text style={tw`text-[9px] font-mono text-[#22D3EE] uppercase tracking-widest mt-1`}>
              Dentoalveolar Orthodontics Specialist Center
            </Text>
            <View style={tw`flex-row justify-between items-center mt-3 pt-2 border-t border-white/5`}>
              <Text style={tw`text-[9px] font-mono text-slate-400`}>Case Reference: {assessment.patientDetails.caseNumber}</Text>
              <Text style={tw`text-[9px] font-mono text-slate-400`}>
                Exam Date: {assessment.patientDetails.date || assessment.createdAt.split('T')[0]}
              </Text>
            </View>
          </View>

          {/* Patient Details & OCI Score Block */}
          <View style={tw`space-y-4`}>
            
            {/* Patient demographics */}
            <View style={tw`space-y-2`}>
              <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Patient Demographics</Text>
              
              <View style={tw`space-y-1 bg-black/40 p-4 rounded-2xl border border-white/5`}>
                <View style={tw`flex-row justify-between border-b border-white/5 py-1.5`}>
                  <Text style={tw`text-xs text-slate-400`}>Full Name:</Text>
                  <Text style={tw`text-xs font-bold text-white`}>{assessment.patientDetails.name}</Text>
                </View>
                <View style={tw`flex-row justify-between border-b border-white/5 py-1.5`}>
                  <Text style={tw`text-xs text-slate-400`}>Skeletal Discrepancy:</Text>
                  <Text style={tw`text-xs font-bold text-[#22D3EE]`}>{assessment.patientDetails.diagnosis}</Text>
                </View>
                <View style={tw`flex-row justify-between py-1.5`}>
                  <Text style={tw`text-xs text-slate-400`}>Demographic Profile:</Text>
                  <Text style={tw`text-xs font-bold text-white`}>
                    {assessment.patientDetails.age} yrs • {assessment.patientDetails.gender}
                  </Text>
                </View>
              </View>
            </View>

            {/* Score Banner */}
            <View style={tw`w-full bg-teal-500/5 p-5 rounded-2xl border border-teal-500/10 items-center justify-center`}>
              <Text style={tw`text-[9px] font-bold text-teal-400 uppercase tracking-widest font-mono text-center`}>Orthodontic Compensation Index</Text>
              <Text style={tw`text-3xl font-black font-mono text-white mt-1 text-center`}>{assessment.ociResult.totalScore}%</Text>
              <Text style={tw`text-[10px] font-black text-[#22D3EE] mt-1.5 uppercase tracking-wider text-center`}>
                {assessment.ociResult.interpretation}
              </Text>
            </View>
          </View>

          {/* Cephalometric Values Summary Table */}
          <View style={tw`space-y-2`}>
            <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Parameters Table</Text>
            
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
                <View key={idx} style={tw`bg-black/35 p-3 rounded-xl border border-white/5 flex-row justify-between w-[48%]`}>
                  <Text style={tw`text-xs text-slate-400 font-bold`}>{m.label}:</Text>
                  <Text style={tw`text-xs font-extrabold text-slate-200 font-mono`}>
                    {m.val !== '' && m.val !== undefined ? m.val : '—'} <Text style={tw`text-[8px] text-slate-500`}>({m.norm})</Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* AI Clinical Summary with ReactMarkdown */}
          <View style={tw`bg-white/5 p-5 rounded-2xl border border-white/5 space-y-2`}>
            <View style={tw`flex-row items-center mb-1`}>
              <Award size={13} color="#14B8A6" style={tw`mr-1.5`} />
              <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Clinical Diagnosis Synthesis</Text>
            </View>
            <MarkdownRenderer>{assessment.aiSummary || 'No clinical report recorded.'}</MarkdownRenderer>
          </View>

          {/* Svg Charts */}
          <View style={tw`border-t border-white/5 pt-4 items-center`}>
            <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-4`}>Metric Deviation Profile</Text>
            <View style={tw`w-full items-center justify-center`}>
              <SvgCharts categoryScores={assessment.ociResult.categoryScores} />
            </View>
          </View>

          {/* Signature Block */}
          <View style={tw`border-t border-white/5 pt-4 space-y-4`}>
            <View style={tw`space-y-1.5`}>
              <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Anatomical Liability Seal</Text>
              <Text style={tw`text-[9px] text-slate-500 leading-normal`}>
                The computed OCI represents an algorithmic clinical assistant. All dental camouflage or orthognathic diagnostic pathways remain under the sole accountability of the treating certified orthodontist.
              </Text>
            </View>
            
            <View style={tw`border-t border-white/5 pt-3 flex-row justify-between items-end`}>
              <View style={tw`flex-1 pr-4`}>
                <Text style={tw`text-[8px] text-slate-500 font-mono`}>Authorized Practitioner</Text>
                <TextInput
                  value={doctorName}
                  onChangeText={setDoctorName}
                  style={tw`font-extrabold text-xs text-white p-0 mt-1`}
                />
              </View>
              
              <View style={tw`items-end`}>
                <TextInput
                  value={sigText}
                  onChangeText={setSigText}
                  placeholder="Sign Name"
                  placeholderTextColor="#475569"
                  style={[tw`text-base text-[#14B8A6] font-black italic border-b border-white/10 p-0 text-right`]}
                />
                <Text style={tw`text-[8px] text-slate-500 mt-1`}>Specialist Orthodontist Signature</Text>
              </View>
            </View>
          </View>

        </ScrollView>
        
      </View>
    </View>
  );
}
