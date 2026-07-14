import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { 
  Sparkles, 
  Search, 
  ArrowRight,
  UserPlus
} from 'lucide-react-native';
import tw from 'twrnc';
import { Assessment } from '../types';

interface HomeProps {
  onNewAssessment: (mode: 'clinic' | 'ceph' | 'turbo') => void;
  onViewHistory: () => void;
  onViewSettings: () => void;
  onViewAbout: () => void;
  onViewTreatmentPlanning?: () => void;
  onViewReports?: () => void;
  savedAssessments: Assessment[];
}

export default function Home({ 
  onNewAssessment, 
  onViewHistory, 
  onViewSettings, 
  onViewAbout,
  onViewTreatmentPlanning,
  onViewReports,
  savedAssessments 
}: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const getActiveScore = (item: Assessment) => {
    const mode = item.patientDetails.analysisMode || 'turbo';
    const workspace = mode === 'clinic' ? item.clinicWorkspace : mode === 'ceph' ? item.cephWorkspace : item.turboWorkspace;
    return workspace?.ociResult?.totalScore || 0;
  };

  const totalReports = savedAssessments.length;
  
  // Calculate average OCI Score
  const avgOciVal = totalReports > 0 
    ? Math.round(savedAssessments.reduce((sum, item) => sum + getActiveScore(item), 0) / totalReports)
    : 0;

  // Calculate High Complexity Cases (>60 OCI Score)
  const highComplexityCount = savedAssessments.filter(a => getActiveScore(a) > 60).length;

  // Calculate distribution metrics
  const mildCount = savedAssessments.filter(a => getActiveScore(a) <= 25).length;
  const modCount = savedAssessments.filter(a => getActiveScore(a) > 25 && getActiveScore(a) <= 50).length;
  const sevCount = savedAssessments.filter(a => getActiveScore(a) > 50 && getActiveScore(a) <= 75).length;
  const extCount = savedAssessments.filter(a => getActiveScore(a) > 75).length;
  
  const maxVal = Math.max(1, mildCount, modCount, sevCount, extCount);
  const mildHeight = Math.max(8, (mildCount / maxVal) * 100);
  const modHeight = Math.max(8, (modCount / maxVal) * 100);
  const sevHeight = Math.max(8, (sevCount / maxVal) * 100);
  const extHeight = Math.max(8, (extCount / maxVal) * 100);

  // Filter recent patients
  const filteredPatients = savedAssessments.filter(item => 
    item.patientDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.patientDetails.caseNumber && item.patientDetails.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ScrollView 
      contentContainerStyle={tw`pb-28 px-6 w-full bg-[#0A0C10]`} 
      style={tw`flex-1`}
      showsVerticalScrollIndicator={false}
    >
      <View style={tw`space-y-8 mt-6 max-w-4xl mx-auto w-full`}>
        
        {/* BRANDING & HERO SECTION */}
        <View style={tw`bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-8 shadow-sm space-y-6`}>
          <View style={tw`space-y-2`}>
            <View style={tw`flex-row items-center bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full self-start`}>
              <Sparkles size={12} color="#00E5FF" style={tw`mr-1.5`} />
              <Text style={tw`text-[#00E5FF] text-[10px] font-black uppercase tracking-wider`}>
                OCI CLINICAL SUITE V4.1
              </Text>
            </View>
            <Text style={tw`text-3xl font-black text-white tracking-tight`}>
              OCI ANALYZER
            </Text>
            <Text style={tw`text-sm text-[#D9E2F2] leading-relaxed`}>
              AI Powered Orthodontic Compensation Analysis
            </Text>
          </View>

          <Pressable
            onPress={() => onNewAssessment('turbo')}
            style={({ pressed }) => [
              tw`flex-row items-center justify-center bg-[#00E5FF] py-4 px-6 rounded-2xl shadow-sm`,
              pressed ? tw`opacity-90 scale-[0.99]` : null
            ]}
          >
            <UserPlus size={16} color="#FFF" style={tw`mr-2.5`} />
            <Text style={tw`text-sm font-black text-white uppercase tracking-wider`}>
              Start New OCI Analysis
            </Text>
            <ArrowRight size={16} color="#FFF" style={tw`ml-2.5`} />
          </Pressable>
        </View>

        {/* STATISTICS DASHBOARD */}
        <View style={tw`space-y-4`}>
          <Text style={tw`text-xs font-black text-[#D9E2F2]/60 uppercase tracking-widest`}>
            Key System Statistics
          </Text>
          
          <View style={tw`flex-row flex-wrap gap-4`}>
            {/* Total Patients */}
            <View style={tw`flex-1 min-w-[45%] bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-5 shadow-sm space-y-2`}>
              <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase tracking-wider`}>Total Patients</Text>
              <Text style={tw`text-2xl font-black text-white`}>{totalReports}</Text>
            </View>

            {/* Reports Generated */}
            <View style={tw`flex-1 min-w-[45%] bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-5 shadow-sm space-y-2`}>
              <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase tracking-wider`}>Reports Generated</Text>
              <Text style={tw`text-2xl font-black text-white`}>{totalReports}</Text>
            </View>

            {/* Average OCI Score */}
            <View style={tw`flex-1 min-w-[45%] bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-5 shadow-sm space-y-2`}>
              <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase tracking-wider`}>Average OCI Score</Text>
              <Text style={tw`text-2xl font-black text-white`}>{avgOciVal}%</Text>
            </View>

            {/* High Complexity Cases */}
            <View style={tw`flex-1 min-w-[45%] bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-5 shadow-sm space-y-2`}>
              <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase tracking-wider`}>High Complexity Cases</Text>
              <Text style={tw`text-2xl font-black text-white`}>{highComplexityCount}</Text>
            </View>
          </View>
        </View>

        {/* OCI DISTRIBUTION ANALYTICS */}
        <View style={tw`bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6 shadow-sm space-y-6`}>
          <View style={tw`space-y-1`}>
            <Text style={tw`text-base font-black text-white tracking-widest uppercase font-mono`}>
              OCI Distribution Analytics
            </Text>
            <Text style={tw`text-[9px] font-bold text-[#D9E2F2]/40 tracking-wider uppercase font-mono`}>
              Historical Diagnostic Demographics
            </Text>
          </View>

          {/* Bar Chart */}
          <View style={tw`flex-row justify-around items-end h-28 border-b border-[rgba(255,255,255,0.08)] pb-4 px-2`}>
            <View style={tw`items-center flex-1`}>
              <View style={tw`w-full max-w-[54px] h-full justify-end`}>
                <View style={[tw`w-full rounded-t-xl`, { height: `${mildHeight}%`, backgroundColor: '#00FF88', opacity: 0.85 }]} />
              </View>
              <Text style={tw`text-[9px] font-mono font-bold text-[#D9E2F2]/60 mt-2`}>MILD</Text>
            </View>
            <View style={tw`items-center flex-1`}>
              <View style={tw`w-full max-w-[54px] h-full justify-end`}>
                <View style={[tw`w-full rounded-t-xl`, { height: `${modHeight}%`, backgroundColor: '#00E5FF', opacity: 0.85 }]} />
              </View>
              <Text style={tw`text-[9px] font-mono font-bold text-[#D9E2F2]/60 mt-2`}>MOD</Text>
            </View>
            <View style={tw`items-center flex-1`}>
              <View style={tw`w-full max-w-[54px] h-full justify-end`}>
                <View style={[tw`w-full rounded-t-xl`, { height: `${sevHeight}%`, backgroundColor: '#8B5CF6', opacity: 0.85 }]} />
              </View>
              <Text style={tw`text-[9px] font-mono font-bold text-[#D9E2F2]/60 mt-2`}>SEV</Text>
            </View>
            <View style={tw`items-center flex-1`}>
              <View style={tw`w-full max-w-[54px] h-full justify-end`}>
                <View style={[tw`w-full rounded-t-xl`, { height: `${extHeight}%`, backgroundColor: '#FF4D4D', opacity: 0.85 }]} />
              </View>
              <Text style={tw`text-[9px] font-mono font-bold text-[#D9E2F2]/60 mt-2`}>EXT</Text>
            </View>
          </View>

          {/* Details Grid */}
          <View style={tw`space-y-3.5 pt-1`}>
            <View style={tw`flex-row justify-between gap-4`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[10px] text-[#D9E2F2]/60 font-bold leading-normal`}>
                  <Text style={tw`text-white font-black`}>MILD (0-25):</Text> Alveolar housing is healthy. Simple alignment.
                </Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[10px] text-[#D9E2F2]/60 font-bold leading-normal`}>
                  <Text style={tw`text-white font-black`}>MOD (26-50):</Text> Dentoalveolar adaptations high. Camouflage ready.
                </Text>
              </View>
            </View>
            <View style={tw`flex-row justify-between gap-4`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[10px] text-[#D9E2F2]/60 font-bold leading-normal`}>
                  <Text style={tw`text-white font-black`}>SEV (51-75):</Text> Borderline limits. Orthopedic / Extraction focus.
                </Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[10px] text-[#D9E2F2]/60 font-bold leading-normal`}>
                  <Text style={tw`text-white font-black`}>EXT (76-100):</Text> Basal skeletal discrepancy. Surgery preferred.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* RECENT ANALYSES & SEARCH */}
        <View style={tw`space-y-4`}>
          <View style={tw`flex-row justify-between items-center`}>
            <Text style={tw`text-xs font-black text-[#D9E2F2]/60 uppercase tracking-widest`}>
              Recent Analyses
            </Text>
            {totalReports > 0 && (
              <Pressable onPress={onViewHistory}>
                <Text style={tw`text-xs font-bold text-[#00E5FF] uppercase`}>View All →</Text>
              </Pressable>
            )}
          </View>

          {/* Quick Search */}
          <View style={tw`flex-row items-center bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 shadow-sm`}>
            <Search size={16} color="#D9E2F2" style={tw`mr-2`} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Quick search by patient name or ID..."
              placeholderTextColor="#D9E2F2"
              style={tw`flex-1 text-white text-xs h-9 p-0 font-bold`}
            />
          </View>

          {/* Patient List */}
          <View style={tw`space-y-3`}>
            {filteredPatients.length > 0 ? (
              filteredPatients.slice(0, 5).map((item) => (
                <View 
                  key={item.id}
                  style={tw`bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 shadow-sm flex-row items-center justify-between`}
                >
                  <View style={tw`flex-row items-center space-x-4`}>
                    <View style={tw`w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 items-center justify-center`}>
                      <Text style={tw`text-xs font-black text-[#00E5FF]`}>
                        {item.patientDetails.diagnosis === 'Class I' ? 'I' : item.patientDetails.diagnosis === 'Class II' ? 'II' : 'III'}
                      </Text>
                    </View>
                    <View>
                      <Text style={tw`text-xs font-black text-white`}>{item.patientDetails.name}</Text>
                      <Text style={tw`text-[10px] text-[#D9E2F2] mt-0.5 font-bold`}>
                        ID: {item.patientDetails.caseNumber || 'N/A'} • {item.createdAt.split('T')[0]}
                      </Text>
                    </View>
                  </View>
                  <View style={tw`items-end`}>
                    <Text style={tw`text-sm font-black text-[#00E5FF]`}>{getActiveScore(item)}%</Text>
                    <Text style={tw`text-[9px] text-[#D9E2F2]/60 uppercase font-black tracking-wider`}>OCI Score</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={tw`bg-[#161A20] rounded-2xl p-8 border border-[rgba(255,255,255,0.08)] items-center justify-center space-y-2`}>
                <Text style={tw`text-[#D9E2F2] text-xs text-center font-bold`}>
                  No recent patient analyses found.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* DEVELOPER CREDIT FOOTER */}
        <View style={tw`pt-12 pb-16 items-center space-y-3 border-t border-[rgba(255,255,255,0.08)] mt-4`}>
          <Text style={tw`text-[9px] text-[#D9E2F2]/40 font-mono text-center uppercase tracking-widest`}>
            OCI Analyzer™ • SECURE HIPAA-COMPLIANT CLINICAL PROTOCOLS
          </Text>
          <View style={tw`flex-col items-center space-y-1`}>
            <Text style={tw`text-[10px] text-[#D9E2F2]/60 font-bold uppercase tracking-widest text-center`}>
              Developed & Innovated by
            </Text>
            <Text style={tw`text-xs font-black text-[#00E5FF] tracking-wider text-center uppercase`}>
              Dr. Salman, MDS (Orthodontist)
            </Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}
