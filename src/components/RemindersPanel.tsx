import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { Assessment } from '../types';
import { ClinicalReminder, dbGetReminders, dbSaveReminders, dbAddReminder, dbToggleReminder, dbDeleteReminder } from '../lib/reminders';
import { 
  Calendar, 
  Clock, 
  Trash2, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  PlusCircle, 
  Sparkles, 
  Bell, 
  Check, 
  Users, 
  Layers,
  ChevronRight
} from 'lucide-react-native';
import tw from 'twrnc';

interface RemindersPanelProps {
  savedAssessments: Assessment[];
}

export default function RemindersPanel({ savedAssessments }: RemindersPanelProps) {
  const [reminders, setReminders] = useState<ClinicalReminder[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'missed' | 'completed'>('pending');
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [type, setType] = useState<'daily' | 'monthly'>('monthly');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Load reminders on mount and whenever savedAssessments change
  const loadRemindersData = async () => {
    let list = await dbGetReminders();
    
    // Clean up reminders for patients that no longer exist (e.g. after database migration or deletion)
    if (savedAssessments.length > 0) {
      const activePatientIds = new Set(savedAssessments.map(a => a.id));
      const filteredList = list.filter(r => activePatientIds.has(r.patientId));
      if (filteredList.length !== list.length) {
        await dbSaveReminders(filteredList);
        list = filteredList;
      }
    } else {
      if (list.length > 0) {
        await dbSaveReminders([]);
        list = [];
      }
    }
    
    // Seed initial follow-ups for assessments if no reminders exist
    if (list.length === 0 && savedAssessments.length > 0) {
      const seeded: ClinicalReminder[] = [];
      const today = new Date();
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      savedAssessments.forEach((item, index) => {
        // Set some dates in the past (missed) and some in the future
        const isPast = index % 2 === 0;
        const dailyD = new Date(today);
        dailyD.setDate(today.getDate() + (isPast ? -2 : 1));

        const monthlyD = new Date(today);
        monthlyD.setMonth(today.getMonth() + (isPast ? -1 : 1));

        seeded.push({
          id: `rem_seeded_daily_${item.id}`,
          patientId: item.id,
          patientName: item.patientDetails.name,
          caseNumber: item.patientDetails.caseNumber,
          type: 'daily',
          title: item.patientDetails.diagnosis === 'Class II' ? 'Review Class II elastics wear & aligner adaptation' : 'Review hygiene & anterior alignment progression',
          dueDate: formatDate(dailyD),
          completed: isPast && index > 2, // some completed
          completedAt: isPast && index > 2 ? new Date().toISOString() : null,
        });

        seeded.push({
          id: `rem_seeded_monthly_${item.id}`,
          patientId: item.id,
          patientName: item.patientDetails.name,
          caseNumber: item.patientDetails.caseNumber,
          type: 'monthly',
          title: item.patientDetails.age && Number(item.patientDetails.age) < 14 
            ? 'Growth status check & functional orthopedic appliance activation' 
            : 'Archwire alignment engagement & bracket position assessment',
          dueDate: formatDate(monthlyD),
          completed: false,
        });
      });

      await dbSaveReminders(seeded);
      list = seeded;
    }
    
    setReminders(list);
  };

  useEffect(() => {
    loadRemindersData();
  }, [savedAssessments]);

  const handleToggleCompleted = async (id: string) => {
    const updated = await dbToggleReminder(id);
    setReminders(updated);
  };

  const handleDeleteReminder = async (id: string) => {
    Alert.alert(
      "Delete Reminder",
      "Are you sure you want to permanently delete this follow-up record?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          const updated = await dbDeleteReminder(id);
          setReminders(updated);
        }}
      ]
    );
  };

  const handleCreateReminder = async () => {
    if (!selectedPatientId) {
      Alert.alert("Missing Patient Selection", "Please select a patient from your digital record list first.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Missing Details", "Please enter follow-up activity instructions.");
      return;
    }
    if (!dueDate.trim()) {
      Alert.alert("Missing Due Date", "Please enter a target calendar date (YYYY-MM-DD).");
      return;
    }

    // Validate date format YYYY-MM-DD
    const dateReg = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateReg.test(dueDate)) {
      Alert.alert("Invalid Date Format", "Please use the YYYY-MM-DD standard format (e.g., 2026-07-20).");
      return;
    }

    const patient = savedAssessments.find(a => a.id === selectedPatientId);
    if (!patient) return;

    await dbAddReminder({
      patientId: selectedPatientId,
      patientName: patient.patientDetails.name,
      caseNumber: patient.patientDetails.caseNumber,
      type,
      title,
      dueDate,
    });

    // Reset Form
    setTitle('');
    setDueDate('');
    setShowAddForm(false);
    
    // Reload
    await loadRemindersData();
    Alert.alert("Reminder Added", "Follow-up schedule updated and saved.");
  };

  // Setup form with current date and first patient by default
  const openFormAndPrepopulate = () => {
    if (savedAssessments.length > 0) {
      setSelectedPatientId(savedAssessments[0].id);
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDueDate(tomorrow.toISOString().split('T')[0]);
    setShowAddForm(true);
  };

  // Group and sort logic
  const todayStr = new Date().toISOString().split('T')[0];

  const missedList = reminders.filter(r => !r.completed && r.dueDate < todayStr);
  const pendingList = reminders.filter(r => !r.completed && r.dueDate >= todayStr);
  const completedList = reminders.filter(r => r.completed);

  // Stats
  const dailyCount = reminders.filter(r => !r.completed && r.type === 'daily').length;
  const monthlyCount = reminders.filter(r => !r.completed && r.type === 'monthly').length;
  const missedCount = missedList.length;

  const currentList = activeTab === 'pending' 
    ? pendingList.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    : activeTab === 'missed'
      ? missedList.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      : completedList.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));

  return (
    <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Header Block */}
        <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-5 rounded-[28px] border border-white/5 shadow-2xl`}>
          <View style={tw`flex-row items-center bg-teal-500/15 border border-teal-500/30 px-3 py-1 rounded-full self-start mb-2`}>
            <Sparkles size={11} color="#22D3EE" style={tw`mr-1.5`} />
            <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-wider font-mono`}>Clinical Scheduler</Text>
          </View>
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`flex-row items-center`}>
              <Bell size={18} color="#14B8A6" style={tw`mr-2`} />
              <Text style={tw`font-black text-lg text-white uppercase tracking-tight`}>Reminders & Follow-Ups</Text>
            </View>
            <Pressable
              onPress={openFormAndPrepopulate}
              style={({ pressed }) => [
                tw`flex-row items-center bg-[#14B8A6] px-3.5 py-1.5 rounded-xl border border-teal-400/30`,
                pressed ? tw`opacity-90` : null
              ]}
            >
              <PlusCircle size={12} color="#ffffff" style={tw`mr-1`} />
              <Text style={tw`text-[9px] font-black text-white uppercase tracking-wider`}>New Task</Text>
            </Pressable>
          </View>
          <Text style={tw`text-xs text-slate-400 mt-1`}>
            Monitor patient appliance tracking, monthly activation schedules, and hygiene reviews.
          </Text>
        </View>

        {/* Diagnostic Stats */}
        <View style={tw`flex-row justify-between gap-2.5`}>
          <View style={tw`flex-1 bg-white/5 border border-white/10 rounded-[20px] p-3 shadow-md items-center`}>
            <Text style={tw`text-[7px] font-black text-slate-400 uppercase tracking-wider font-mono`}>Daily Wear Check</Text>
            <Text style={tw`text-xl font-black text-teal-400 font-mono mt-1`}>{dailyCount}</Text>
          </View>
          <View style={tw`flex-1 bg-white/5 border border-white/10 rounded-[20px] p-3 shadow-md items-center`}>
            <Text style={tw`text-[7px] font-black text-slate-400 uppercase tracking-wider font-mono`}>Monthly Activation</Text>
            <Text style={tw`text-xl font-black text-[#22D3EE] font-mono mt-1`}>{monthlyCount}</Text>
          </View>
          <View style={tw`flex-1 bg-white/5 border border-white/10 rounded-[20px] p-3 shadow-md items-center`}>
            <Text style={tw`text-[7px] font-black text-slate-400 uppercase tracking-wider font-mono`}>Missed Alerts</Text>
            <Text style={tw`text-xl font-black text-rose-400 font-mono mt-1`}>{missedCount}</Text>
          </View>
        </View>

        {/* Task Form Drawer */}
        {showAddForm && (
          <View style={tw`bg-[#0B1020] p-5 rounded-3xl border border-white/10 shadow-2xl space-y-4`}>
            <View style={tw`flex-row justify-between items-center border-b border-white/5 pb-2`}>
              <Text style={tw`text-[10px] font-black text-[#22D3EE] uppercase tracking-wider`}>Create Clinical Schedule Task</Text>
              <Pressable onPress={() => setShowAddForm(false)}>
                <Text style={tw`text-[10px] font-bold text-slate-400`}>Cancel</Text>
              </Pressable>
            </View>

            {savedAssessments.length === 0 ? (
              <Text style={tw`text-xs text-rose-400 italic`}>No patients in clinical database. Create a patient first.</Text>
            ) : (
              <View style={tw`space-y-3`}>
                {/* Select Patient */}
                <View>
                  <Text style={tw`text-[8px] text-slate-400 font-bold uppercase`}>Select Patient</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mt-1.5`}>
                    <View style={tw`flex-row gap-2`}>
                      {savedAssessments.map(pt => (
                        <Pressable
                          key={pt.id}
                          onPress={() => setSelectedPatientId(pt.id)}
                          style={tw`px-3 py-2 rounded-xl border ${selectedPatientId === pt.id ? 'bg-[#14B8A6]/20 border-[#14B8A6]' : 'bg-black/30 border-white/5'}`}
                        >
                          <Text style={tw`text-[10px] font-bold ${selectedPatientId === pt.id ? 'text-teal-400' : 'text-slate-300'}`}>
                            {pt.patientDetails.name} ({pt.patientDetails.caseNumber})
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Select Type */}
                <View>
                  <Text style={tw`text-[8px] text-slate-400 font-bold uppercase`}>Task Cycle</Text>
                  <View style={tw`flex-row gap-2 mt-1.5`}>
                    <Pressable
                      onPress={() => setType('daily')}
                      style={tw`flex-1 py-2 rounded-xl border text-center items-center ${type === 'daily' ? 'bg-[#14B8A6]/20 border-[#14B8A6]' : 'bg-black/30 border-white/5'}`}
                    >
                      <Text style={tw`text-[10px] font-bold ${type === 'daily' ? 'text-teal-400' : 'text-slate-300'}`}>Daily Hygiene/Compliance</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setType('monthly')}
                      style={tw`flex-1 py-2 rounded-xl border text-center items-center ${type === 'monthly' ? 'bg-[#14B8A6]/20 border-[#14B8A6]' : 'bg-black/30 border-white/5'}`}
                    >
                      <Text style={tw`text-[10px] font-bold ${type === 'monthly' ? 'text-teal-400' : 'text-slate-300'}`}>Monthly Activation Check</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Title */}
                <View>
                  <Text style={tw`text-[8px] text-slate-400 font-bold uppercase`}>Task Details / Instructions</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Check bracket bond, Class II elastics wear, etc."
                    placeholderTextColor="#64748b"
                    style={tw`bg-black/40 text-white border border-white/10 rounded-xl px-3 py-2 text-xs font-bold mt-1.5`}
                  />
                </View>

                {/* Due Date */}
                <View>
                  <Text style={tw`text-[8px] text-slate-400 font-bold uppercase`}>Due Date (YYYY-MM-DD)</Text>
                  <TextInput
                    value={dueDate}
                    onChangeText={setDueDate}
                    placeholder="e.g. 2026-07-20"
                    placeholderTextColor="#64748b"
                    style={tw`bg-black/40 text-[#22D3EE] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold mt-1.5`}
                  />
                </View>

                <Pressable
                  onPress={handleCreateReminder}
                  style={tw`bg-[#14B8A6] py-3.5 rounded-xl items-center justify-center border border-teal-400/30 mt-2`}
                >
                  <Text style={tw`text-white font-black text-xs uppercase tracking-widest`}>Add To Schedule</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Tab Controllers */}
        <View style={tw`flex-row bg-[#0B1020] p-1 rounded-2xl border border-white/5`}>
          {[
            { id: 'pending', label: 'Pending', count: pendingList.length },
            { id: 'missed', label: 'Missed Alerts', count: missedList.length, badgeColor: 'bg-rose-500/20 text-rose-400' },
            { id: 'completed', label: 'Completed', count: completedList.length }
          ].map(tab => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              style={tw`flex-1 py-2.5 rounded-xl items-center justify-center flex-row space-x-1.5 ${activeTab === tab.id ? 'bg-white/5 border border-white/10' : ''}`}
            >
              <Text style={tw`text-[10px] font-black uppercase tracking-wider ${activeTab === tab.id ? 'text-teal-400' : 'text-slate-400'}`}>
                {tab.label}
              </Text>
              <View style={tw`px-1.5 py-0.5 rounded-md bg-black/40`}>
                <Text style={tw`text-[8px] font-bold ${tab.id === 'missed' && tab.count > 0 ? 'text-rose-400 font-black' : 'text-slate-400'}`}>{tab.count}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Reminders List Stream */}
        <View style={tw`space-y-3`}>
          {currentList.length > 0 ? (
            currentList.map(item => (
              <View 
                key={item.id} 
                style={tw`bg-[#0B1020] rounded-2xl border border-white/5 p-4.5 flex-row justify-between items-center`}
              >
                <View style={tw`flex-1 pr-3 flex-row items-start space-x-3`}>
                  {/* Status checkbox */}
                  <Pressable 
                    onPress={() => handleToggleCompleted(item.id)}
                    style={tw`mt-0.5`}
                  >
                    {item.completed ? (
                      <View style={tw`w-5 h-5 rounded-lg bg-teal-500/20 border border-teal-500/40 justify-center items-center`}>
                        <Check size={11} color="#14B8A6" />
                      </View>
                    ) : (
                      <View style={tw`w-5 h-5 rounded-lg border border-white/20 bg-black/40`} />
                    )}
                  </Pressable>

                  <View style={tw`flex-1 space-y-1`}>
                    <View style={tw`flex-row items-center flex-wrap gap-1.5`}>
                      <Text style={tw`text-[10px] font-black text-slate-100`}>
                        {item.patientName}
                      </Text>
                      <View style={tw`bg-white/5 px-1.5 py-0.5 rounded border border-white/5`}>
                        <Text style={tw`text-[8px] text-slate-500 font-mono font-bold`}>{item.caseNumber}</Text>
                      </View>
                      <View style={tw`px-1.5 py-0.5 rounded ${item.type === 'daily' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                        <Text style={tw`text-[7px] font-bold uppercase tracking-wider`}>{item.type}</Text>
                      </View>
                    </View>

                    <Text style={tw`text-xs text-slate-300 leading-normal`}>
                      {item.title}
                    </Text>

                    <View style={tw`flex-row items-center space-x-1.5 pt-0.5`}>
                      {activeTab === 'missed' ? (
                        <AlertTriangle size={9} color="#F43F5E" />
                      ) : (
                        <Calendar size={9} color="#94A3B8" />
                      )}
                      <Text style={tw`text-[9px] font-mono font-semibold ${activeTab === 'missed' ? 'text-rose-400' : 'text-slate-400'}`}>
                        {activeTab === 'missed' ? `Missed on: ${item.dueDate}` : `Due: ${item.dueDate}`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Delete/Trash action */}
                <Pressable
                  onPress={() => handleDeleteReminder(item.id)}
                  style={({ pressed }) => [
                    tw`p-2 bg-white/5 rounded-xl border border-white/5`,
                    pressed ? tw`bg-rose-500/10 border-rose-500/15` : null
                  ]}
                >
                  <Trash2 size={11} color="#64748b" />
                </Pressable>
              </View>
            ))
          ) : (
            <View style={tw`bg-white/5 p-8 rounded-[28px] border border-white/5 justify-center items-center text-center space-y-2`}>
              <View style={tw`w-12 h-12 bg-white/5 rounded-2xl justify-center items-center border border-white/10`}>
                <Calendar size={18} color="#64748b" />
              </View>
              <Text style={tw`text-xs font-black text-slate-300 uppercase tracking-widest`}>No Reminders Found</Text>
              <Text style={tw`text-[10px] text-slate-500 max-w-xs text-center leading-normal`}>
                {activeTab === 'pending' 
                  ? "All daily and monthly follow-ups are clean. You have no pending tasks scheduled."
                  : activeTab === 'missed'
                    ? "Great job, Dr. Salman! You have no outstanding missed patient follow-ups."
                    : "No completed follow-ups logged in this session yet."}
              </Text>
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}
