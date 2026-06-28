import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { 
  FileText, 
  PlusCircle, 
  Settings, 
  Info, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight
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
  
  // Calculate quick stats
  const totalReports = savedAssessments.length;
  const avgOci = totalReports > 0 
    ? Math.round(savedAssessments.reduce((sum, item) => sum + item.ociResult.totalScore, 0) / totalReports)
    : 0;
    
  const class2Count = savedAssessments.filter(a => a.patientDetails.diagnosis === 'Class II').length;
  const class3Count = savedAssessments.filter(a => a.patientDetails.diagnosis === 'Class III').length;

  return (
    <ScrollView contentContainerStyle={tw`pb-8 px-4 max-w-5xl w-full mx-auto`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Hero Welcome Banner */}
        <View style={tw`bg-teal-800 rounded-3xl p-6 shadow-xl relative overflow-hidden border border-teal-700`}>
          <View style={tw`space-y-3 z-10`}>
            <View style={tw`flex-row items-center bg-white/10 px-3 py-1 rounded-full self-start border border-white/10`}>
              <ShieldCheck size={14} color="#5eead4" style={tw`mr-1.5`} />
              <Text style={tw`text-teal-200 text-xs font-semibold`}>
                Dentoalveolar Decision Support
              </Text>
            </View>
            
            <Text style={tw`text-2xl md:text-3xl font-extrabold text-white tracking-tight`}>
              Orthodontic Compensation Index
            </Text>
            
            <Text style={tw`text-teal-100 text-sm leading-relaxed max-w-xl`}>
              Durable, clinical-grade offline tool to objectively quantify tooth movement masking underlying skeletal Class II and Class III sagittal discrepancies.
            </Text>

            <Pressable
              onPress={onNewAssessment}
              style={({ pressed }) => [
                tw`bg-emerald-500 rounded-2xl py-3 px-5 flex-row items-center self-start mt-2 shadow-md`,
                pressed ? tw`opacity-90 scale-98` : null
              ]}
            >
              <Text style={tw`text-white font-bold text-sm mr-2`}>Start OCI Analysis</Text>
              <PlusCircle size={16} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {/* Diagnostic Analytics Cards */}
        <View style={tw`flex-row flex-wrap justify-between mt-4`}>
          {/* Card 1: Total Patients */}
          <View style={tw`w-[48%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 shadow-sm`}>
            <View style={tw`flex-row items-center justify-between mb-2`}>
              <Text style={tw`text-xs font-bold text-slate-400 uppercase tracking-wider`}>Active Records</Text>
              <Users size={16} color="#0d9488" />
            </View>
            <Text style={tw`text-2xl font-black text-slate-800 dark:text-slate-100`}>
              {totalReports}
            </Text>
            <Text style={tw`text-[10px] text-slate-400 mt-1`}>Total patients archived</Text>
          </View>

          {/* Card 2: Average OCI Score */}
          <View style={tw`w-[48%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 shadow-sm`}>
            <View style={tw`flex-row items-center justify-between mb-2`}>
              <Text style={tw`text-xs font-bold text-slate-400 uppercase tracking-wider`}>Avg OCI Score</Text>
              <TrendingUp size={16} color="#10b981" />
            </View>
            <Text style={tw`text-2xl font-black text-slate-800 dark:text-slate-100`}>
              {avgOci}%
            </Text>
            <Text style={tw`text-[10px] text-slate-400 mt-1`}>Mean dentoalveolar tilt</Text>
          </View>
        </View>

        {/* Clinical Distribution Sub-panel */}
        {totalReports > 0 && (
          <View style={tw`bg-slate-100/60 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-850 flex-row justify-around`}>
            <View style={tw`items-center`}>
              <Text style={tw`text-[10px] font-bold text-slate-400 uppercase`}>Skeletal Class II</Text>
              <Text style={tw`text-lg font-bold text-slate-700 dark:text-slate-300`}>{class2Count} cases</Text>
            </View>
            <View style={tw`w-[1px] bg-slate-200 dark:bg-slate-800`} />
            <View style={tw`items-center`}>
              <Text style={tw`text-[10px] font-bold text-slate-400 uppercase`}>Skeletal Class III</Text>
              <Text style={tw`text-lg font-bold text-slate-700 dark:text-slate-300`}>{class3Count} cases</Text>
            </View>
          </View>
        )}

        {/* Quick Launcher Action Grid */}
        <View style={tw`space-y-4 mt-2`}>
          <Text style={tw`text-sm font-extrabold text-slate-400 uppercase tracking-wider pl-1`}>
            Clinical Modules
          </Text>

          <View style={tw`space-y-3`}>
            {/* OCI Analysis Menu Option */}
            <Pressable
              onPress={onNewAssessment}
              style={({ pressed }) => [
                tw`flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm justify-between`,
                pressed ? tw`bg-slate-50 dark:bg-slate-850` : null
              ]}
            >
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-10 h-10 bg-teal-500/10 rounded-xl items-center justify-center mr-3`}>
                  <TrendingUp size={20} color="#0d9488" />
                </View>
                <View>
                  <Text style={tw`text-sm font-extrabold text-slate-800 dark:text-slate-100`}>
                    New OCI Analysis
                  </Text>
                  <Text style={tw`text-xs text-slate-400`}>
                    Calculate index & compensation level
                  </Text>
                </View>
              </View>
              <ArrowRight size={16} color="#64748b" />
            </Pressable>

            {/* Patients Menu Option */}
            <Pressable
              onPress={onViewHistory}
              style={({ pressed }) => [
                tw`flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm justify-between`,
                pressed ? tw`bg-slate-50 dark:bg-slate-850` : null
              ]}
            >
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-10 h-10 bg-teal-500/10 rounded-xl items-center justify-center mr-3`}>
                  <Users size={20} color="#0d9488" />
                </View>
                <View>
                  <Text style={tw`text-sm font-extrabold text-slate-800 dark:text-slate-100`}>
                    Patient Records
                  </Text>
                  <Text style={tw`text-xs text-slate-400`}>
                    Review clinical history & OCI scores
                  </Text>
                </View>
              </View>
              <ArrowRight size={16} color="#64748b" />
            </Pressable>

            {/* About Menu Option */}
            <Pressable
              onPress={onViewAbout}
              style={({ pressed }) => [
                tw`flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm justify-between`,
                pressed ? tw`bg-slate-50 dark:bg-slate-850` : null
              ]}
            >
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-10 h-10 bg-teal-500/10 rounded-xl items-center justify-center mr-3`}>
                  <Info size={20} color="#0d9488" />
                </View>
                <View>
                  <Text style={tw`text-sm font-extrabold text-slate-800 dark:text-slate-100`}>
                    About OCI Index
                  </Text>
                  <Text style={tw`text-xs text-slate-400`}>
                    Review compensatory skeletal logic
                  </Text>
                </View>
              </View>
              <ArrowRight size={16} color="#64748b" />
            </Pressable>

            {/* Settings Menu Option */}
            <Pressable
              onPress={onViewSettings}
              style={({ pressed }) => [
                tw`flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm justify-between`,
                pressed ? tw`bg-slate-50 dark:bg-slate-850` : null
              ]}
            >
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-10 h-10 bg-teal-500/10 rounded-xl items-center justify-center mr-3`}>
                  <Settings size={20} color="#0d9488" />
                </View>
                <View>
                  <Text style={tw`text-sm font-extrabold text-slate-800 dark:text-slate-100`}>
                    Database & Settings
                  </Text>
                  <Text style={tw`text-xs text-slate-400`}>
                    Backup export, import, & index weights
                  </Text>
                </View>
              </View>
              <ArrowRight size={16} color="#64748b" />
            </Pressable>

          </View>
        </View>

        {/* App Sign-off Branding */}
        <View style={tw`mt-8 items-center`}>
          <Text style={tw`text-[11px] text-teal-600 dark:text-teal-400 font-bold tracking-wide`}>
            Developed by Dr. Salman MDS Orthodontist
          </Text>
          <Text style={tw`text-[9px] text-slate-400 mt-0.5`}>
            Education & Clinical Decision-Support Tool
          </Text>
        </View>

      </View>
    </ScrollView>
  );
}
