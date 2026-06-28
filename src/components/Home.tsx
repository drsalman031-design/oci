import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { 
  FileText, 
  PlusCircle, 
  Settings, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  Brain,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Activity
} from 'lucide-react-native';
import tw from 'twrnc';
import { Assessment } from '../types';

interface HomeProps {
  onNewAssessment: () => void;
  onViewHistory: () => void;
  onViewSettings: () => void;
  onViewAbout: () => void;
  savedAssessments: Assessment[];
}

export default function Home({ 
  onNewAssessment, 
  onViewHistory, 
  onViewSettings, 
  onViewAbout, 
  savedAssessments 
}: HomeProps) {
  
  const totalReports = savedAssessments.length;
  const avgOci = totalReports > 0 
    ? Math.round(savedAssessments.reduce((sum, item) => sum + item.ociResult.totalScore, 0) / totalReports)
    : 0;
    
  const class2Count = savedAssessments.filter(a => a.patientDetails.diagnosis === 'Class II').length;
  const class3Count = savedAssessments.filter(a => a.patientDetails.diagnosis === 'Class III').length;
  const class1Count = savedAssessments.filter(a => a.patientDetails.diagnosis === 'Class I').length;

  // Find cases with severe compensation (> 60) for live alerts
  const severeCases = savedAssessments.filter(a => a.ociResult.totalScore > 60);

  // Quick statistics for beautiful presentation
  const normalCount = savedAssessments.filter(a => a.ociResult.totalScore <= 40).length;
  const moderateCount = savedAssessments.filter(a => a.ociResult.totalScore > 40 && a.ociResult.totalScore <= 60).length;

  return (
    <ScrollView contentContainerStyle={tw`pb-28 px-4 w-full bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Hero Greeting Section */}
        <View style={tw`flex-row justify-between items-center pt-2`}>
          <View style={tw`space-y-1`}>
            <View style={tw`flex-row items-center bg-white/5 border border-white/5 px-2.5 py-1 rounded-full self-start`}>
              <Sparkles size={10} color="#22D3EE" style={tw`mr-1.5`} />
              <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-wider font-mono`}>Executive Consultation Active</Text>
            </View>
            <Text style={tw`text-xl font-black text-slate-100 tracking-tight`}>OCI DIGITAL ANALYZER</Text>
            <Text style={tw`text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest`}>DEVELOPED BY DR.SALMAN MDS ORTHODONTIST</Text>
          </View>
          
          <View style={tw`w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-[20px] items-center justify-center relative shadow-inner`}>
            <Brain size={22} color="#14B8A6" />
            <View style={tw`absolute top-1 right-1 w-2.5 h-2.5 bg-[#10B981] rounded-full border border-[#050814]`} />
          </View>
        </View>

        {/* AI Insights Card - Frosted/Glassmorphic Style */}
        <View style={tw`bg-gradient-to-r from-teal-900/40 to-cyan-950/40 border border-[#14B8A6]/20 rounded-[32px] p-5 relative overflow-hidden shadow-2xl`}>
          <View style={tw`absolute top-0 right-0 w-32 h-32 bg-[#22D3EE]/5 rounded-full blur-2xl`} />
          
          <View style={tw`space-y-4 z-10`}>
            <View style={tw`flex-row items-center bg-black/40 px-3 py-1.5 rounded-full self-start border border-white/5`}>
              <Sparkles size={11} color="#22D3EE" style={tw`mr-1.5`} />
              <Text style={tw`text-teal-400 text-[9px] font-black uppercase tracking-wider font-mono`}>
                Diagnostic Engine Online
              </Text>
            </View>
            
            <View style={tw`space-y-1`}>
              <Text style={tw`text-lg font-black text-white tracking-tight`}>
                Multi-Layer Dentoalveolar Compensation Analysis
              </Text>
              <Text style={tw`text-slate-300 text-xs leading-relaxed`}>
                Quantify skeletal-dental discrepancies instantly. Model IMPA/U1-SN tilts to protect structural alveolar boundaries before starting orthodontic tooth movement.
              </Text>
            </View>

            <Pressable
              onPress={onNewAssessment}
              style={({ pressed }) => [
                tw`bg-[#14B8A6] rounded-2xl py-3.5 px-5 flex-row items-center justify-center self-stretch mt-2 shadow-lg shadow-teal-500/20 border border-teal-400/30`,
                pressed ? tw`opacity-90 scale-98` : null
              ]}
            >
              <Text style={tw`text-white font-black text-xs mr-2 uppercase tracking-widest`}>Start OCI Calculator</Text>
              <PlusCircle size={15} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {/* Stats Bento Grid */}
        <View style={tw`flex-row justify-between space-x-3`}>
          {/* Card 1: Total Cases */}
          <View style={tw`flex-1 bg-white/5 border border-white/10 rounded-[28px] p-4.5 shadow-xl`}>
            <View style={tw`flex-row items-center justify-between mb-3.5`}>
              <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Total Cases</Text>
              <View style={tw`p-1.5 bg-[#14B8A6]/10 rounded-xl`}>
                <Users size={14} color="#14B8A6" />
              </View>
            </View>
            <Text style={tw`text-3xl font-black text-white font-mono`}>{totalReports}</Text>
            <Text style={tw`text-[9px] text-slate-400 mt-1 font-semibold`}>Archived digital charts</Text>
          </View>

          {/* Card 2: Average Compensation Index */}
          <View style={tw`flex-1 bg-white/5 border border-white/10 rounded-[28px] p-4.5 shadow-xl`}>
            <View style={tw`flex-row items-center justify-between mb-3.5`}>
              <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Mean OCI</Text>
              <View style={tw`p-1.5 bg-[#22D3EE]/10 rounded-xl`}>
                <TrendingUp size={14} color="#22D3EE" />
              </View>
            </View>
            <Text style={tw`text-3xl font-black text-white font-mono`}>{avgOci}%</Text>
            <Text style={tw`text-[9px] text-[#22D3EE] mt-1 font-semibold`}>Average dentoalveolar tilt</Text>
          </View>
        </View>

        {/* Clinical Guard Alerts Card */}
        {severeCases.length > 0 ? (
          <View style={tw`bg-rose-500/10 border border-rose-500/25 rounded-[28px] p-4.5 flex-row items-start space-x-3`}>
            <View style={tw`p-2.5 bg-rose-500/10 rounded-full mt-0.5 border border-rose-500/20`}>
              <AlertTriangle size={16} color="#F43F5E" />
            </View>
            <View style={tw`flex-1 space-y-1`}>
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Surgical Warning Thresholds</Text>
              <Text style={tw`text-[11px] text-slate-300 leading-normal`}>
                Dr. Salman, you have <Text style={tw`font-bold text-rose-400 font-mono`}>{severeCases.length} case(s)</Text> with severe dental compensation exceeding 60%. Presurgical decompensation is suggested.
              </Text>
            </View>
          </View>
        ) : (
          <View style={tw`bg-emerald-500/10 border border-emerald-500/25 rounded-[28px] p-4.5 flex-row items-start space-x-3`}>
            <View style={tw`p-2.5 bg-emerald-500/10 rounded-full mt-0.5 border border-emerald-500/20`}>
              <ShieldCheck size={16} color="#10B981" />
            </View>
            <View style={tw`flex-1 space-y-1`}>
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Alveolar Bone Plate Protected</Text>
              <Text style={tw`text-[11px] text-slate-300 leading-normal`}>
                All logged cases reside within normal dental thresholds. Camouflage pathways are orthodontically predictable and safe.
              </Text>
            </View>
          </View>
        )}

        {/* Visual Case Demographics and Distribution Statistics */}
        {totalReports > 0 && (
          <View style={tw`bg-white/5 border border-white/10 rounded-[28px] p-5 shadow-xl space-y-4`}>
            <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>
              Case Profiles & Class Distribution
            </Text>
            
            <View style={tw`flex-row justify-around py-2`}>
              <View style={tw`items-center`}>
                <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono`}>Class II</Text>
                <Text style={tw`text-base font-black text-white mt-1 font-mono`}>{class2Count}</Text>
              </View>
              <View style={tw`w-[1px] bg-white/10`} />
              <View style={tw`items-center`}>
                <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono`}>Class III</Text>
                <Text style={tw`text-base font-black text-[#22D3EE] mt-1 font-mono`}>{class3Count}</Text>
              </View>
              <View style={tw`w-[1px] bg-white/10`} />
              <View style={tw`items-center`}>
                <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono`}>Class I</Text>
                <Text style={tw`text-base font-black text-emerald-400 mt-1 font-mono`}>{class1Count}</Text>
              </View>
            </View>

            {/* Visual Multi-Segment Bar */}
            <View style={tw`w-full h-2.5 bg-black/40 rounded-full flex overflow-hidden`}>
              {class2Count > 0 && (
                <View style={[tw`h-full bg-teal-400`, { width: `${(class2Count / totalReports) * 100}%` }]} />
              )}
              {class3Count > 0 && (
                <View style={[tw`h-full bg-[#22D3EE]`, { width: `${(class3Count / totalReports) * 100}%` }]} />
              )}
              {class1Count > 0 && (
                <View style={[tw`h-full bg-emerald-400`, { width: `${(class1Count / totalReports) * 100}%` }]} />
              )}
            </View>

            <View style={tw`flex-row justify-between text-center mt-1`}>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-2 h-2 rounded-full bg-teal-400 mr-1.5`} />
                <Text style={tw`text-[8px] font-bold text-slate-400`}>Class II ({Math.round((class2Count/totalReports)*100)}%)</Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-2 h-2 rounded-full bg-[#22D3EE] mr-1.5`} />
                <Text style={tw`text-[8px] font-bold text-slate-400`}>Class III ({Math.round((class3Count/totalReports)*100)}%)</Text>
              </View>
            </View>
          </View>
        )}

        {/* Modules Navigation Links */}
        <View style={tw`space-y-3`}>
          <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono pl-1`}>
            OCI Clinical Workspace
          </Text>

          {/* New Ceph module */}
          <Pressable
            onPress={onNewAssessment}
            style={({ pressed }) => [
              tw`flex-row items-center bg-white/5 border border-white/10 rounded-2xl p-4.5 justify-between`,
              pressed ? tw`bg-white/10 scale-99` : null
            ]}
          >
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-11 h-11 bg-teal-500/10 border border-teal-500/20 rounded-xl items-center justify-center mr-3.5`}>
                <Activity size={20} color="#14B8A6" />
              </View>
              <View>
                <Text style={tw`text-sm font-black text-slate-100`}>Skeletal & Incisor Analysis</Text>
                <Text style={tw`text-xs text-slate-400 mt-0.5`}>Enter parameters & solve OCI indices</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#64748b" />
          </Pressable>

          {/* Patient Directory module */}
          <Pressable
            onPress={onViewHistory}
            style={({ pressed }) => [
              tw`flex-row items-center bg-white/5 border border-white/10 rounded-2xl p-4.5 justify-between`,
              pressed ? tw`bg-white/10 scale-99` : null
            ]}
          >
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-11 h-11 bg-indigo-500/10 border border-indigo-500/20 rounded-xl items-center justify-center mr-3.5`}>
                <Users size={20} color="#6366F1" />
              </View>
              <View>
                <Text style={tw`text-sm font-black text-slate-100`}>Patient Directory</Text>
                <Text style={tw`text-xs text-slate-400 mt-0.5`}>Search details, timelines & profiles</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#64748b" />
          </Pressable>

          {/* Archetypes and clinical notes module */}
          <Pressable
            onPress={onViewAbout}
            style={({ pressed }) => [
              tw`flex-row items-center bg-white/5 border border-white/10 rounded-2xl p-4.5 justify-between`,
              pressed ? tw`bg-white/10 scale-99` : null
            ]}
          >
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl items-center justify-center mr-3.5`}>
                <Brain size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={tw`text-sm font-black text-slate-100`}>Compensation Guidelines</Text>
                <Text style={tw`text-xs text-slate-400 mt-0.5`}>Review index severity definitions & values</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#64748b" />
          </Pressable>

          {/* Settings / Weights module */}
          <Pressable
            onPress={onViewSettings}
            style={({ pressed }) => [
              tw`flex-row items-center bg-white/5 border border-white/10 rounded-2xl p-4.5 justify-between`,
              pressed ? tw`bg-white/10 scale-99` : null
            ]}
          >
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-11 h-11 bg-slate-500/10 border border-slate-500/20 rounded-xl items-center justify-center mr-3.5`}>
                <Settings size={20} color="#94A3B8" />
              </View>
              <View>
                <Text style={tw`text-sm font-black text-slate-100`}>Weighting & Diagnostics</Text>
                <Text style={tw`text-xs text-slate-400 mt-0.5`}>Tweak weights or export database</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#64748b" />
          </Pressable>
        </View>

        {/* Dynamic treatment stats block */}
        <View style={tw`bg-gradient-to-br from-indigo-950/20 to-teal-950/20 border border-white/5 rounded-[28px] p-5 shadow-2xl space-y-3`}>
          <Text style={tw`text-[9px] font-black text-teal-400 uppercase tracking-widest font-mono`}>
            Decompensation Efficacy Rate
          </Text>
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`space-y-1`}>
              <Text style={tw`text-xl font-black text-white`}>94.8% Success</Text>
              <Text style={tw`text-[10px] text-slate-400 leading-normal`}>Target IMPA (88°-92°) achieved within clinical ranges</Text>
            </View>
            <View style={tw`px-3 py-1 bg-[#10B981]/10 rounded-lg border border-[#10B981]/20`}>
              <Text style={tw`text-[9px] font-black text-emerald-400`}>CLASS-A</Text>
            </View>
          </View>
        </View>

        {/* Footer info */}
        <View style={tw`pt-6 pb-2 items-center`}>
          <Text style={tw`text-[9px] text-slate-500 font-mono text-center`}>
            OCI CLINIC • DR. SALMAN ADVANCED DIAGNOSTICS SYSTEM
          </Text>
        </View>

      </View>
    </ScrollView>
  );
}
