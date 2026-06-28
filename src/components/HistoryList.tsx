import { useState } from 'react';
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
  TrendingDown,
  Info,
  Download,
  PlusCircle
} from 'lucide-react';

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

  const getScoreBadgeClass = (score: number) => {
    if (score <= 20) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300';
    if (score <= 40) return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-300';
    if (score <= 60) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300';
    if (score <= 80) return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300';
    return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300';
  };

  const exportCSV = () => {
    if (filtered.length === 0) return;
    
    // Header
    const headers = [
      'Case Number',
      'Patient Name',
      'Age',
      'Gender',
      'Diagnosis',
      'Date',
      'OCI Total Score',
      'Interpretation',
      'AI Summary'
    ];
    
    const rows = filtered.map(item => [
      `"${item.patientDetails.caseNumber || ''}"`,
      `"${item.patientDetails.name || ''}"`,
      item.patientDetails.age || '',
      `"${item.patientDetails.gender || ''}"`,
      `"${item.patientDetails.diagnosis || ''}"`,
      `"${item.patientDetails.date || ''}"`,
      item.ociResult.totalScore,
      `"${item.ociResult.interpretation || ''}"`,
      `"${(item.aiSummary || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `OCI_Clinical_History_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and Filter panel */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2 font-display">
              <Clipboard className="w-5 h-5 text-teal-600" />
              <span>Assessment History & Archives</span>
            </h2>
            <p className="text-xs text-slate-500">Search, filter, and export archived clinical records</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Quick add and CSV Buttons */}
            {onNewAssessment && (
              <button
                onClick={onNewAssessment}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-md shadow-teal-500/10"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Quick Add Patient</span>
              </button>
            )}

            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-md shadow-indigo-500/10"
              title="Export filtered records as CSV sheet"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            {/* Search Input */}
            <div className="relative flex-1 md:flex-initial min-w-[180px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, case ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Diagnosis filter */}
            <select
              value={diagFilter}
              onChange={(e) => setDiagFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Diagnoses</option>
              <option value="Class I">Class I</option>
              <option value="Class II">Class II</option>
              <option value="Class III">Class III</option>
            </select>
          </div>
        </div>

        {/* Sort triggers */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/40">
          <span className="self-center mr-2">Sort by:</span>
          <button
            onClick={() => toggleSort('date')}
            className={`px-3 py-1.5 rounded-lg border flex items-center space-x-1 cursor-pointer transition ${
              sortBy === 'date' 
                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-600 dark:text-teal-300' 
                : 'bg-transparent border-slate-200 dark:border-slate-800'
            }`}
          >
            <span>Date</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>

          <button
            onClick={() => toggleSort('name')}
            className={`px-3 py-1.5 rounded-lg border flex items-center space-x-1 cursor-pointer transition ${
              sortBy === 'name' 
                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-600 dark:text-teal-300' 
                : 'bg-transparent border-slate-200 dark:border-slate-800'
            }`}
          >
            <span>Patient Name</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>

          <button
            onClick={() => toggleSort('score')}
            className={`px-3 py-1.5 rounded-lg border flex items-center space-x-1 cursor-pointer transition ${
              sortBy === 'score' 
                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-600 dark:text-teal-300' 
                : 'bg-transparent border-slate-200 dark:border-slate-800'
            }`}
          >
            <span>OCI Score</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Grid List */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sorted.map((item) => (
            <div 
              key={item.id} 
              className="glass-panel rounded-3xl hover:shadow-lg transition-all duration-300 p-6 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">
                      {item.patientDetails.caseNumber}
                    </span>
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg group-hover:text-teal-600 dark:group-hover:text-teal-400 transition truncate max-w-[220px] font-display">
                      {item.patientDetails.name}
                    </h3>
                  </div>
                  
                  {/* Large OCI score badge */}
                  <div className={`px-4 py-2 rounded-2xl border flex flex-col items-center justify-center shrink-0 ${getScoreBadgeClass(item.ociResult.totalScore)}`}>
                    <span className="text-xl font-black font-mono leading-none">{item.ociResult.totalScore}</span>
                    <span className="text-[8px] uppercase tracking-wider font-bold">OCI</span>
                  </div>
                </div>

                {/* Patient metadata summary */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Diagnosis</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{item.patientDetails.diagnosis}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Age / Sex</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.patientDetails.age}yo • {item.patientDetails.gender}
                    </p>
                  </div>
                  <div className="space-y-1 col-span-2 border-t border-slate-100 dark:border-slate-850 pt-2 flex items-center space-x-1 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Calculated on: {item.patientDetails.date || item.createdAt.split('T')[0]}</span>
                  </div>
                </div>

                {/* Snippet of AI clinical notes summary */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                  "{item.aiSummary || 'No clinical report recorded.'}"
                </p>
              </div>

              {/* Action bar */}
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-850 pt-4 mt-6">
                <button
                  onClick={() => onSelect(item)}
                  className="inline-flex items-center space-x-1 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-bold text-xs cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Inspect Assessment</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onDuplicate(item)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title="Duplicate Assessment (Compare)"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-slate-400 hover:text-red-600 transition cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
          <Info className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-600 dark:text-slate-300 font-display">No Assessments Archived</p>
          <p className="text-xs text-slate-400">Archived diagnostics will appear here once saved from the results panel.</p>
        </div>
      )}
    </div>
  );
}
