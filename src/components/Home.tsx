import { Assessment } from '../types';
import { motion } from 'motion/react';
import { 
  FileText, 
  PlusCircle, 
  Settings, 
  Info, 
  Database, 
  Users, 
  Calculator, 
  TrendingUp, 
  ShieldCheck, 
  Flame,
  ArrowRight
} from 'lucide-react';

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
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-600 rounded-3xl text-white p-8 md:p-12 shadow-xl shadow-teal-950/10 border border-teal-600/20">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-teal-950/40 rounded-full blur-2xl" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium border border-white/10 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-teal-300" />
              <span>Dentoalveolar Decision Support Engine</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Orthodontic Compensation Index
            </h1>
            <p className="text-teal-100 max-w-xl text-sm md:text-base leading-relaxed">
              Durable, clinical-grade offline tool to objectively quantify tooth movement masking underlying skeletal Class II and Class III sagittal discrepancies.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={onNewAssessment}
                className="inline-flex items-center space-x-2 bg-white text-teal-900 hover:bg-teal-50 hover:text-teal-950 active:bg-teal-100 px-6 py-3 rounded-xl font-semibold shadow-lg transition duration-200 text-sm cursor-pointer"
              >
                <PlusCircle className="w-5 h-5 text-teal-600" />
                <span>New Assessment</span>
              </button>
              <button
                onClick={onViewHistory}
                className="inline-flex items-center space-x-2 bg-white/15 hover:bg-white/25 active:bg-white/35 px-6 py-3 rounded-xl font-medium text-white border border-white/10 backdrop-blur-sm transition duration-200 text-sm cursor-pointer"
              >
                <FileText className="w-5 h-5 text-teal-200" />
                <span>Clinical History ({totalReports})</span>
              </button>
            </div>
          </div>
          
          {/* Logo illustration */}
          <div className="hidden md:flex justify-center">
            <div className="w-44 h-44 bg-white/5 rounded-3xl border border-white/10 p-6 flex flex-col items-center justify-center relative shadow-inner">
              <svg className="w-24 h-24 text-teal-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3" />
              </svg>
              <span className="font-mono text-[10px] text-teal-300 mt-2 tracking-widest uppercase">OCI v1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Metrics & Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel glass-card-accent p-6 rounded-3xl shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total Patients</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalReports}</p>
          </div>
        </div>

        <div className="glass-panel glass-card-accent p-6 rounded-3xl shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Avg OCI Score</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{avgOci} <span className="text-xs text-slate-400">/100</span></p>
          </div>
        </div>

        <div className="glass-panel glass-card-accent p-6 rounded-3xl shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Class II Maloccl.</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{class2Count}</p>
          </div>
        </div>

        <div className="glass-panel glass-card-accent p-6 rounded-3xl shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Class III Maloccl.</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{class3Count}</p>
          </div>
        </div>
      </div>

      {/* Main navigation menu grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: About OCI Index Panel */}
        <div className="md:col-span-2 glass-panel glass-card-accent p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
            <div className="flex items-center space-x-3">
              <Info className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">About Orthodontic Compensation Index (OCI)</h2>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold italic bg-slate-50/50 dark:bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-150 dark:border-slate-850 whitespace-nowrap">
              Developed by <span className="text-teal-600 dark:text-teal-400 font-bold not-italic">Dr. Salman MDS Orthodontist</span>
            </div>
          </div>
          
          <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            <p>
              In skeletal Class II and Class III malocclusions, the dentition often compensates naturally to mask the jaw mismatch. Upper incisors may procline while lower incisors retrocline (in Class III), or vice-versa (in Class II) to establish functional overjet and overbite.
            </p>
            <p>
              The **Orthodontic Compensation Index (OCI)** is an algorithmic clinical decision-support engine designed to aggregate multidimensional cephalometric and dental cast parameters into a single, cohesive score from **0 to 100**.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Camouflage boundary</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">An OCI of 40–60 indicates borderline camouflage feasibility, above which surgical intervention becomes preferable.</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Pre-Surgical target</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">High scores (&gt;80) guide the extent of presurgical decompensation required to enable appropriate surgical jaw movements.</p>
              </div>
            </div>
            <button
              onClick={onViewAbout}
              className="inline-flex items-center space-x-1 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-semibold text-sm transition"
            >
              <span>Read complete clinical guidelines</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right side: App Actions & Shortcuts */}
        <div className="space-y-6">
          <div className="glass-panel glass-card-accent p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={onNewAssessment}
                className="w-full flex items-center justify-between p-4 bg-teal-50 hover:bg-teal-100/70 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 rounded-xl transition text-left cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-600 rounded-lg text-white">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-teal-900 dark:text-teal-100">New Diagnosis</p>
                    <p className="text-xs text-teal-600/80 dark:text-teal-300/80">Enter Ceph metrics</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-teal-600 transition group-hover:translate-x-1" />
              </button>

              <button 
                onClick={onViewHistory}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-700/40 rounded-xl transition text-left cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-600 rounded-lg text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">View Patients</p>
                    <p className="text-xs text-slate-500">Search & edit archives</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 transition group-hover:translate-x-1" />
              </button>

              <button 
                onClick={onViewSettings}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-700/40 rounded-xl transition text-left cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-600 rounded-lg text-white">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">App Settings</p>
                    <p className="text-xs text-slate-500">Weights & backups</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 transition group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Backup alert */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between">
            <div className="flex items-start space-x-3">
              <Database className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Local Database Secured</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Assessments are stored fully offline on your clinical workstation.</p>
              </div>
            </div>
            <button
              onClick={onViewSettings}
              className="mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline text-left"
            >
              Configure model coefficients or backup db
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
