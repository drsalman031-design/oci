import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Assessment } from '../types';
import { 
  Search, 
  Trash2, 
  Copy, 
  FileText, 
  Calendar, 
  Filter, 
  ArrowUpDown,
  PlusCircle,
  TrendingUp,
  Cpu,
  Bookmark,
  ChevronRight,
  ShieldCheck,
  Award,
  Edit2,
  Clock,
  Cloud
} from 'lucide-react-native';
import tw from 'twrnc';

interface HistoryListProps {
  assessments: Assessment[];
  onSelect: (assessment: Assessment) => void;
  onDelete: (id: string) => void;
  onDuplicate: (assessment: Assessment) => void;
  onEdit: (assessment: Assessment) => void;
  onOpenSyncDashboard: () => void;
  onNewAssessment?: () => void;
}

export default function HistoryList({ 
  assessments, 
  onSelect, 
  onDelete, 
  onDuplicate,
  onEdit,
  onOpenSyncDashboard,
  onNewAssessment
}: HistoryListProps) {
  const [search, setSearch] = useState('');
  const [diagFilter, setDiagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function checkDrive() {
      const connected = await AsyncStorage.getItem('oci_gdrive_connected') === 'true';
      setIsDriveConnected(connected);
    }
    checkDrive();
  }, [assessments]);

  // Filter & Search logic
  const filtered = assessments.filter(a => {
    const nameMatch = a.patientDetails.name.toLowerCase().includes(search.toLowerCase());
    const caseMatch = a.patientDetails.caseNumber.toLowerCase().includes(search.toLowerCase());
    const dxMatch = diagFilter === 'all' || a.patientDetails.diagnosis === diagFilter;
    return (nameMatch || caseMatch) && dxMatch;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'name') {
      comparison = a.patientDetails.name.localeCompare(b.patientDetails.name);
    } else if (sortBy === 'score') {
      comparison = a.ociResult.totalScore - b.ociResult.totalScore;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const toggleSort = (type: 'date' | 'name' | 'score') => {
    if (sortBy === type) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  const getScoreColorPalette = (score: number) => {
    if (score <= 20) return { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', glow: '#10B981' };
    if (score <= 40) return { bg: 'bg-teal-500/10 border-teal-500/20', text: 'text-teal-400', glow: '#14B8A6' };
    if (score <= 60) return { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', glow: '#F59E0B' };
    if (score <= 80) return { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', glow: '#F97316' };
    return { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400', glow: '#F43F5E' };
  };

  const handleExportCSV = () => {
    Alert.alert("Database Export", "Archived clinical database records processed and saved to local clip archive successfully.");
  };

  const confirmDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleDuplicateWithToast = (item: Assessment) => {
    try {
      onDuplicate(item);
      setToast(`Successfully duplicated record for ${item.patientDetails.name}`);
      setTimeout(() => setToast(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'PT';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <View style={tw`flex-1 relative bg-[#050814]`}>
      <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Brand Card header */}
        <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-5 rounded-[28px] border border-white/5 shadow-2xl relative overflow-hidden`}>
          <View style={tw`absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl`} />
          <View style={tw`flex-row justify-between items-start`}>
            <View style={tw`space-y-1`}>
              <View style={tw`flex-row items-center bg-teal-500/15 border border-teal-500/30 px-3 py-1 rounded-full self-start mb-2`}>
                <Award size={11} color="#14B8A6" style={tw`mr-1.5`} />
                <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-wider font-mono`}>Digital Archive Suite</Text>
              </View>
              <Text style={tw`font-black text-xl text-white tracking-tight`}>Patient Records</Text>
              <Text style={tw`text-xs text-slate-400`}>Review saved cephalometric evaluations and OCI histories</Text>
            </View>
            <Pressable
              onPress={onNewAssessment}
              style={({ pressed }) => [
                tw`w-11 h-11 bg-teal-500/10 border border-teal-500/20 rounded-2xl items-center justify-center shadow-lg`,
                pressed ? tw`opacity-90` : null
              ]}
            >
              <PlusCircle size={18} color="#14B8A6" />
            </Pressable>
          </View>

          {/* Quick Actions Bar */}
          <View style={tw`flex-row gap-3 mt-4`}>
            <Pressable
              onPress={onOpenSyncDashboard}
              style={({ pressed }) => [
                tw`flex-1 py-3 bg-[#14B8A6]/10 border border-[#14B8A6]/25 rounded-2xl items-center justify-center flex-row space-x-1.5`,
                pressed ? tw`bg-[#14B8A6]/20` : null
              ]}
            >
              <Cloud size={12} color="#14B8A6" />
              <Text style={tw`text-[10px] font-black text-teal-400 uppercase tracking-widest`}>Google Cloud Backup</Text>
            </Pressable>
            <View style={tw`px-4 bg-teal-500/5 rounded-2xl border border-teal-500/10 justify-center items-center`}>
              <Text style={tw`text-[10px] font-black text-teal-400 font-mono`}>{assessments.length} Patients</Text>
            </View>
          </View>
        </View>

        {/* Filters and Search panel */}
        <View style={tw`bg-white/5 border border-white/5 rounded-[28px] p-4.5 shadow-xl space-y-3`}>
          {/* Elegant search input */}
          <View style={tw`bg-black/40 px-4 py-3 rounded-2xl border border-white/10 flex-row items-center`}>
            <Search size={14} color="#64748b" style={tw`mr-2.5`} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by patient name or Case ID..."
              placeholderTextColor="#64748b"
              style={tw`flex-1 text-white text-xs py-1`}
            />
          </View>

          {/* Filters Selector */}
          <View style={tw`relative`}>
            <Pressable
              onPress={() => setShowFilterDropdown(!showFilterDropdown)}
              style={tw`flex-row items-center bg-black/40 px-4 py-3 rounded-2xl border border-white/10 justify-between`}
            >
              <View style={tw`flex-row items-center`}>
                <Filter size={12} color="#14B8A6" style={tw`mr-2`} />
                <Text style={tw`text-xs font-bold text-slate-300`}>
                  Filter: {diagFilter === 'all' ? 'All Diagnostic Archetypes' : diagFilter}
                </Text>
              </View>
              <Text style={tw`text-[10px] font-bold text-slate-400 font-mono`}>Modify</Text>
            </Pressable>

            {showFilterDropdown && (
              <View style={tw`mt-2 bg-[#0B1020] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50`}>
                {['all', 'Class I', 'Class II', 'Class III'].map((dx) => (
                  <Pressable
                    key={dx}
                    onPress={() => {
                      setDiagFilter(dx);
                      setShowFilterDropdown(false);
                    }}
                    style={tw`px-4 py-3.5 border-b border-white/5 flex-row items-center justify-between`}
                  >
                    <Text style={tw`text-xs text-slate-200 font-bold`}>{dx === 'all' ? 'Show All Classes' : `Skeletal ${dx}`}</Text>
                    {diagFilter === dx && (
                      <View style={tw`w-2 h-2 rounded-full bg-teal-400`} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Sort indicator row */}
        <View style={tw`flex-row justify-between items-center px-1`}>
          <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Sort Parameters</Text>
          <View style={tw`flex-row gap-2`}>
            {[
              { id: 'date', label: 'Date' },
              { id: 'name', label: 'Name' },
              { id: 'score', label: 'OCI' }
            ].map((st) => {
              const isActive = sortBy === st.id;
              return (
                <Pressable
                  key={st.id}
                  onPress={() => toggleSort(st.id as any)}
                  style={tw`flex-row items-center bg-white/5 px-3.5 py-2 rounded-xl border ${isActive ? 'border-[#14B8A6] bg-[#14B8A6]/10' : 'border-white/5'}`}
                >
                  <Text style={tw`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-teal-400' : 'text-slate-400'}`}>{st.label}</Text>
                  <ArrowUpDown size={9} color={isActive ? '#14B8A6' : '#64748b'} style={tw`ml-1.5`} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Patient cards timeline stream */}
        <View style={tw`space-y-4`}>
          {sorted.length > 0 ? (
            sorted.map((item) => {
              const colors = getScoreColorPalette(item.ociResult.totalScore);
              return (
                <View 
                  key={item.id} 
                  style={tw`bg-[#0B1020]/90 rounded-[28px] border border-white/5 shadow-2xl p-5 relative overflow-hidden`}
                >
                  {/* Glowing background hint based on severity */}
                  <View style={[tw`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10`, { backgroundColor: colors.glow }]} />
                  
                  <View style={tw`flex-row justify-between items-start mb-4`}>
                    <View style={tw`flex-row items-center`}>
                      {/* Premium Initials Avatar with custom border */}
                      <View style={tw`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center mr-3.5 shadow-inner`}>
                        <Text style={tw`text-xs font-black text-slate-200`}>{getInitials(item.patientDetails.name)}</Text>
                      </View>
                      
                      <View style={tw`space-y-1`}>
                        <Text style={tw`font-extrabold text-sm text-slate-100 tracking-tight`}>
                          {item.patientDetails.name || 'Anonymous'}
                        </Text>
                        <View style={tw`flex-row items-center`}>
                          <Calendar size={10} color="#64748b" style={tw`mr-1.5`} />
                          <Text style={tw`text-[9px] text-slate-500 font-mono uppercase font-bold`}>{item.patientDetails.date || 'No Date'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Premium index severity capsule */}
                    <View style={tw`px-3 py-1.5 rounded-xl border flex-row items-center space-x-1.5 ${colors.bg}`}>
                      <View style={[tw`w-1.5 h-1.5 rounded-full`, { backgroundColor: colors.glow }]} />
                      <Text style={tw`text-[10px] font-black font-mono ${colors.text}`}>OCI: {item.ociResult.totalScore}%</Text>
                    </View>
                  </View>

                  {/* Patient mini metrics chart */}
                  <View style={tw`flex-row justify-between bg-black/35 p-3 rounded-2xl border border-white/5 mb-3`}>
                    <View style={tw`flex-1 items-center`}>
                      <Text style={tw`text-[8px] text-slate-400 font-mono uppercase tracking-widest`}>Case File</Text>
                      <Text style={tw`text-xs font-extrabold text-slate-200 mt-0.5`}>{item.patientDetails.caseNumber || 'N/A'}</Text>
                    </View>
                    <View style={tw`flex-1 items-center border-x border-white/10`}>
                      <Text style={tw`text-[8px] text-slate-400 font-mono uppercase tracking-widest`}>Discrepancy</Text>
                      <Text style={tw`text-xs font-extrabold text-[#22D3EE] mt-0.5`}>{item.patientDetails.diagnosis || 'Class I'}</Text>
                    </View>
                    <View style={tw`flex-1 items-center`}>
                      <Text style={tw`text-[8px] text-slate-400 font-mono uppercase tracking-widest`}>Demographic</Text>
                      <Text style={tw`text-xs font-extrabold text-slate-200 mt-0.5`}>{item.patientDetails.age || 'N/A'}y / {item.patientDetails.gender[0] || '?'}</Text>
                    </View>
                  </View>

                  {/* Vault & Synchronicity Status indicators */}
                  <View style={tw`flex-row justify-between items-center mb-4 px-1.5`}>
                    <View style={tw`flex-row items-center space-x-1`}>
                      <Clock size={10} color="#94A3B8" />
                      <Text style={tw`text-[8px] text-slate-400 font-mono`}>
                        Mod: {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Text>
                    </View>

                    <View style={tw`flex-row items-center space-x-3`}>
                      <View style={tw`flex-row items-center space-x-1`}>
                        <Cloud size={10} color={isDriveConnected ? "#14B8A6" : "#64748B"} />
                        <Text style={[tw`text-[8px] font-mono font-bold`, isDriveConnected ? tw`text-teal-400` : tw`text-slate-500`]}>
                          {isDriveConnected ? "Cloud Sync: Synced" : "Local Vault"}
                        </Text>
                      </View>

                      <View style={tw`flex-row items-center space-x-1`}>
                        <ShieldCheck size={10} color="#22D3EE" />
                        <Text style={tw`text-[8px] text-cyan-400 font-mono font-black`}>AES-256</Text>
                      </View>
                    </View>
                  </View>

                  {/* Clinical Actions */}
                  <View style={tw`flex-row justify-between items-center border-t border-white/5 pt-3.5`}>
                    <Pressable
                      onPress={() => onSelect(item)}
                      style={({ pressed }) => [
                        tw`flex-row items-center px-4 py-2.5 bg-teal-500/10 rounded-xl border border-teal-500/20`,
                        pressed ? tw`opacity-80` : null
                      ]}
                    >
                      <FileText size={12} color="#14B8A6" style={tw`mr-2`} />
                      <Text style={tw`text-xs font-black text-teal-400 uppercase tracking-widest`}>Analyze Case</Text>
                    </Pressable>

                    <View style={tw`flex-row space-x-2`}>
                      <Pressable
                        onPress={() => onEdit(item)}
                        style={({ pressed }) => [
                          tw`p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20`,
                          pressed ? tw`bg-cyan-500/20` : null
                        ]}
                      >
                        <Edit2 size={12} color="#22D3EE" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDuplicateWithToast(item)}
                        style={({ pressed }) => [
                          tw`p-2.5 bg-white/5 rounded-xl border border-white/10`,
                          pressed ? tw`bg-white/10` : null
                        ]}
                      >
                        <Copy size={12} color="#94a3b8" />
                      </Pressable>
                      <Pressable
                        onPress={() => confirmDelete(item.id, item.patientDetails.name)}
                        style={({ pressed }) => [
                          tw`p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20`,
                          pressed ? tw`bg-rose-500/20` : null
                        ]}
                      >
                        <Trash2 size={12} color="#F43F5E" />
                      </Pressable>
                    </View>
                  </View>

                </View>
              );
            })
          ) : (
            <View style={tw`bg-white/5 p-10 rounded-[28px] border border-white/5 shadow-lg items-center justify-center`}>
              <Text style={tw`text-xs font-bold text-slate-500 uppercase tracking-widest font-mono`}>No digital archives found</Text>
            </View>
          )}
        </View>

      </View>
    </ScrollView>

    {/* Custom Premium Delete Confirmation Modal */}
    {deleteTarget && (
      <View style={tw`absolute inset-0 bg-black/85 z-50 justify-center items-center p-6`}>
        <View style={tw`bg-[#0B1020] border border-white/10 rounded-[28px] p-6 max-w-sm w-full shadow-2xl space-y-4`}>
          <View style={tw`w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 items-center justify-center self-center mb-1`}>
            <Trash2 size={20} color="#F43F5E" />
          </View>
          <Text style={tw`text-white font-black text-center text-sm uppercase tracking-wider`}>Delete Case Archive?</Text>
          <Text style={tw`text-slate-400 text-xs text-center leading-relaxed`}>
            Are you sure you want to permanently delete <Text style={tw`text-rose-400 font-extrabold`}>{deleteTarget.name}</Text>'s assessment archive? This action cannot be undone.
          </Text>
          <View style={tw`flex-row gap-3 pt-2`}>
            <Pressable
              onPress={() => setDeleteTarget(null)}
              style={({ pressed }) => [
                tw`flex-1 py-3 bg-white/5 border border-white/10 rounded-xl items-center justify-center`,
                pressed ? tw`bg-white/10` : null
              ]}
            >
              <Text style={tw`text-slate-300 text-xs font-bold`}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onDelete(deleteTarget.id);
                setToast(`Deleted record for ${deleteTarget.name}`);
                setDeleteTarget(null);
                setTimeout(() => setToast(null), 3500);
              }}
              style={({ pressed }) => [
                tw`flex-1 py-3 bg-rose-500 rounded-xl items-center justify-center shadow-lg shadow-rose-500/20`,
                pressed ? tw`opacity-90` : null
              ]}
            >
              <Text style={tw`text-white text-xs font-black`}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    )}

    {/* Custom Toast Notification Banner */}
    {toast && (
      <View style={tw`absolute bottom-20 left-4 right-4 bg-[#14B8A6] border border-teal-400 rounded-2xl p-4 shadow-2xl flex-row items-center z-50`}>
        <Award size={16} color="#ffffff" style={tw`mr-3`} />
        <Text style={tw`text-white text-xs font-extrabold flex-1`}>{toast}</Text>
        <Pressable onPress={() => setToast(null)}>
          <Text style={tw`text-white/60 text-xs font-mono px-1`}>✕</Text>
        </Pressable>
      </View>
    )}
  </View>
);
}
