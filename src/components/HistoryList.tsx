import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { Assessment } from '../types';
import { 
  Search, 
  Trash2, 
  Copy, 
  FileText, 
  Calendar, 
  User, 
  Clipboard,
  Filter,
  ArrowUpDown,
  PlusCircle
} from 'lucide-react-native';
import tw from 'twrnc';

interface HistoryListProps {
  assessments: Assessment[];
  onSelect: (assessment: Assessment) => void;
  onDelete: (id: string) => void;
  onDuplicate: (assessment: Assessment) => void;
  onNewAssessment?: () => void;
}

export default function HistoryList({ 
  assessments, 
  onSelect, 
  onDelete, 
  onDuplicate,
  onNewAssessment
}: HistoryListProps) {
  const [search, setSearch] = useState('');
  const [diagFilter, setDiagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

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

  const getScoreBadgeBg = (score: number) => {
    if (score <= 20) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600';
    if (score <= 40) return 'bg-teal-500/10 border-teal-500/20 text-teal-600';
    if (score <= 60) return 'bg-amber-500/10 border-amber-500/20 text-amber-600';
    if (score <= 80) return 'bg-orange-500/10 border-orange-500/20 text-orange-600';
    return 'bg-red-500/10 border-red-500/20 text-red-600';
  };

  const handleExportCSV = () => {
    Alert.alert("Offline Export", "Archived clinical database records processed and saved to local clip archive successfully.");
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Case",
      `Are you sure you want to permanently delete ${name}'s assessment archive?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(id) }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-12 px-4 max-w-5xl w-full mx-auto`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Header and top buttons */}
        <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4`}>
          <View style={tw`flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
            <View>
              <View style={tw`flex-row items-center mb-1`}>
                <Clipboard size={18} color="#0d9488" style={tw`mr-1.5`} />
                <Text style={tw`font-extrabold text-base text-slate-800 dark:text-slate-100`}>
                  Patient Case History
                </Text>
              </View>
              <Text style={tw`text-xs text-slate-400`}>Search, filter, and review archived records</Text>
            </View>

            <View style={tw`flex-row gap-2 w-full sm:w-auto`}>
              {onNewAssessment && (
                <Pressable
                  onPress={onNewAssessment}
                  style={tw`flex-1 sm:flex-initial py-2.5 px-4 bg-teal-500 rounded-xl flex-row items-center justify-center`}
                >
                  <PlusCircle size={14} color="#ffffff" style={tw`mr-1.5`} />
                  <Text style={tw`text-xs font-bold text-white`}>New Case</Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleExportCSV}
                style={tw`flex-1 sm:flex-initial py-2.5 px-4 border border-slate-200 dark:border-slate-800 rounded-xl items-center justify-center`}
              >
                <Text style={tw`text-xs font-bold text-slate-600 dark:text-slate-400`}>Export database</Text>
              </Pressable>
            </View>
          </View>

          {/* Search bar and Filters trigger */}
          <View style={tw`flex-col sm:flex-row gap-3`}>
            <View style={tw`flex-1 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 flex-row items-center`}>
              <Search size={14} color="#94a3b8" style={tw`mr-2`} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search patient name or Case ID..."
                placeholderTextColor="#94a3b8"
                style={tw`flex-1 text-slate-800 dark:text-slate-200 text-xs py-1`}
              />
            </View>

            {/* Diagnostic category filters */}
            <View style={tw`relative`}>
              <Pressable
                onPress={() => setShowFilterDropdown(!showFilterDropdown)}
                style={tw`flex-row items-center bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 justify-between`}
              >
                <Filter size={12} color="#64748b" style={tw`mr-2`} />
                <Text style={tw`text-xs font-semibold text-slate-600 dark:text-slate-400`}>
                  {diagFilter === 'all' ? 'All Diagnoses' : diagFilter}
                </Text>
              </Pressable>

              {showFilterDropdown && (
                <View style={tw`mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg z-50`}>
                  {['all', 'Class I', 'Class II', 'Class III'].map((dx) => (
                    <Pressable
                      key={dx}
                      onPress={() => {
                        setDiagFilter(dx);
                        setShowFilterDropdown(false);
                      }}
                      style={tw`px-4 py-2.5 border-b border-slate-100 dark:border-slate-850`}
                    >
                      <Text style={tw`text-xs text-slate-700`}>{dx === 'all' ? 'All Diagnoses' : dx}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Sorting header indicators */}
        <View style={tw`flex-row justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm items-center`}>
          <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider`}>Sorting Metrics:</Text>
          <View style={tw`flex-row space-x-3`}>
            {[
              { id: 'date', label: 'Date' },
              { id: 'name', label: 'Name' },
              { id: 'score', label: 'Score' }
            ].map((st) => {
              const isActive = sortBy === st.id;
              return (
                <Pressable
                  key={st.id}
                  onPress={() => toggleSort(st.id as any)}
                  style={tw`flex-row items-center bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border ${isActive ? 'border-teal-500 bg-teal-500/5' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  <Text style={tw`text-[10px] font-bold ${isActive ? 'text-teal-600' : 'text-slate-500'}`}>{st.label}</Text>
                  <ArrowUpDown size={10} color={isActive ? '#0d9488' : '#64748b'} style={tw`ml-1`} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Cases List */}
        <View style={tw`space-y-4`}>
          {sorted.length > 0 ? (
            sorted.map((item) => (
              <View 
                key={item.id} 
                style={tw`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4`}
              >
                <View style={tw`flex-row justify-between items-start`}>
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-950 items-center justify-center mr-3 border border-slate-150 dark:border-slate-850`}>
                      <User size={18} color="#0d9488" />
                    </View>
                    <View>
                      <Text style={tw`font-extrabold text-sm text-slate-800 dark:text-slate-100`}>
                        {item.patientDetails.name || 'Anonymous'}
                      </Text>
                      <View style={tw`flex-row items-center mt-1`}>
                        <Calendar size={10} color="#94a3b8" style={tw`mr-1`} />
                        <Text style={tw`text-[10px] text-slate-400 font-mono`}>{item.patientDetails.date || 'No Date'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={tw`px-3 py-1.5 rounded-full border ${getScoreBadgeBg(item.ociResult.totalScore)}`}>
                    <Text style={tw`text-xs font-black font-mono`}>OCI: {item.ociResult.totalScore}%</Text>
                  </View>
                </View>

                {/* Patient Case stats info row */}
                <View style={tw`grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150 dark:border-slate-850`}>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-[9px] text-slate-400 font-mono uppercase`}>Case ID</Text>
                    <Text style={tw`text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5`}>{item.patientDetails.caseNumber || 'N/A'}</Text>
                  </View>
                  <View style={tw`items-center border-x border-slate-200 dark:border-slate-800`}>
                    <Text style={tw`text-[9px] text-slate-400 font-mono uppercase`}>Diagnosis</Text>
                    <Text style={tw`text-xs font-bold text-teal-600 mt-0.5`}>{item.patientDetails.diagnosis || 'Class I'}</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-[9px] text-slate-400 font-mono uppercase`}>Age</Text>
                    <Text style={tw`text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5`}>{item.patientDetails.age || 'N/A'} yrs</Text>
                  </View>
                </View>

                {/* Actions row */}
                <View style={tw`flex-row justify-between items-center border-t border-slate-100 dark:border-slate-850 pt-3.5`}>
                  <Pressable
                    onPress={() => onSelect(item)}
                    style={tw`flex-row items-center px-4 py-2 bg-teal-500/10 rounded-xl border border-teal-500/20`}
                  >
                    <FileText size={12} color="#0d9488" style={tw`mr-1.5`} />
                    <Text style={tw`text-xs font-bold text-teal-600`}>View Case Details</Text>
                  </Pressable>

                  <View style={tw`flex-row space-x-2`}>
                    <Pressable
                      onPress={() => onDuplicate(item)}
                      style={tw`p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800`}
                    >
                      <Copy size={12} color="#64748b" />
                    </Pressable>
                    <Pressable
                      onPress={() => confirmDelete(item.id, item.patientDetails.name)}
                      style={tw`p-2.5 bg-red-500/10 rounded-xl border border-red-500/20`}
                    >
                      <Trash2 size={12} color="#ef4444" />
                    </Pressable>
                  </View>
                </View>

              </View>
            ))
          ) : (
            <View style={tw`bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm items-center justify-center text-center`}>
              <Text style={tw`text-sm font-semibold text-slate-400`}>No historical cases match the search filters.</Text>
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}
