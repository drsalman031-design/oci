import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PatientDetails, 
  CephalometricInput, 
  OciResult, 
  Assessment, 
  OciWeights 
} from './types';
import { calculateOCI, DEFAULT_WEIGHTS } from './scoringEngine';

// IndexedDB Helper
import {
  dbGetAssessments,
  dbSaveAssessment,
  dbDeleteAssessment,
  dbSaveSetting,
  dbGetSetting,
  dbExportBackup,
  dbImportBackup,
  dbClearAllData
} from './lib/db';

// Components
import Splash from './components/Splash';
import Home from './components/Home';
import PatientForm from './components/PatientForm';
import CephInput from './components/CephInput';
import ResultsDashboard from './components/ResultsDashboard';
import HistoryList from './components/HistoryList';
import SettingsPanel from './components/SettingsPanel';
import PdfReport from './components/PdfReport';
import TreatmentPlanning from './components/TreatmentPlanning';
import ReportsPanel from './components/ReportsPanel';

// Icons
import { 
  Activity, 
  Home as HomeIcon, 
  PlusCircle, 
  FileText, 
  Settings as SettingsIcon, 
  Info, 
  ChevronRight,
  Database,
  Moon,
  Sun,
  X,
  Sparkles,
  Users,
  Brain
} from 'lucide-react';

export default function App() {
  // Core Screen Navigation
  const [screen, setScreen] = useState<'splash' | 'home' | 'patient-form' | 'ceph-input' | 'results' | 'history' | 'settings' | 'about' | 'treatment-planning' | 'reports'>('splash');
  
  // Local persistent states
  const [savedAssessments, setSavedAssessments] = useState<Assessment[]>([]);
  const [weights, setWeights] = useState<OciWeights>(DEFAULT_WEIGHTS);
  const [darkMode, setDarkMode] = useState(false);

  // Active Assessment State Flow
  const [activePatient, setActivePatient] = useState<PatientDetails | null>(null);
  const [activeCeph, setActiveCeph] = useState<CephalometricInput | null>(null);
  const [activeResult, setActiveResult] = useState<OciResult | null>(null);

  // PDF Overlay State
  const [pdfReportAssessment, setPdfReportAssessment] = useState<Assessment | null>(null);

  // Load persistence on mount from IndexedDB (with fallback)
  useEffect(() => {
    async function loadIndexedData() {
      try {
        // Load assessments
        const assessments = await dbGetAssessments();
        if (assessments && assessments.length > 0) {
          setSavedAssessments(assessments);
        } else {
          // fallback to localStorage if exist
          const fallbackAssessments = localStorage.getItem('oci_assessments');
          if (fallbackAssessments) {
            const parsed = JSON.parse(fallbackAssessments) as Assessment[];
            setSavedAssessments(parsed);
            // Migrate to IndexedDB
            for (const item of parsed) {
              await dbSaveAssessment(item);
            }
          }
        }

        // Load custom weights
        const storedWeights = await dbGetSetting<OciWeights>('oci_weights', DEFAULT_WEIGHTS);
        setWeights(storedWeights);

        // Load dark mode
        const storedTheme = await dbGetSetting<boolean>('oci_dark_mode', false);
        setDarkMode(storedTheme);
        if (storedTheme) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // Run automatic local backup on start
        const allAssessments = assessments && assessments.length > 0 ? assessments : [];
        if (allAssessments.length > 0) {
          localStorage.setItem('oci_assessments_autobackup', JSON.stringify({
            timestamp: new Date().toISOString(),
            data: allAssessments
          }));
        }
      } catch (e) {
        console.error('Error loading clinical IndexedDB database:', e);
      }
    }
    loadIndexedData();
  }, []);

  // Update dark mode class
  const toggleDarkMode = async () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    await dbSaveSetting('oci_dark_mode', nextDark);
    // Double persistent backup
    localStorage.setItem('oci_dark_mode', String(nextDark));
    
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Step Navigations
  const handleStartNewAssessment = () => {
    setActivePatient(null);
    setActiveCeph(null);
    setActiveResult(null);
    setScreen('patient-form');
  };

  const handlePatientSubmit = (details: PatientDetails) => {
    setActivePatient(details);
    setScreen('ceph-input');
  };

  const handleCephSubmit = (input: CephalometricInput) => {
    setActiveCeph(input);
    const result = calculateOCI(input, weights);
    setActiveResult(result);
    setScreen('results');
  };

  // Database mutations with dual-layer offline persistence
  const handleSaveAssessment = async (aiSummaryText: string) => {
    if (!activePatient || !activeCeph || !activeResult) return;

    const newAssessment: Assessment = {
      id: crypto.randomUUID(),
      patientDetails: activePatient,
      cephalometricInput: activeCeph,
      ociResult: activeResult,
      aiSummary: aiSummaryText,
      createdAt: new Date().toISOString()
    };

    const nextAssessments = [newAssessment, ...savedAssessments];
    setSavedAssessments(nextAssessments);
    
    // Save to IndexedDB (Primary)
    await dbSaveAssessment(newAssessment);
    
    // Auto backup to localStorage (Dual-layer persistent safety)
    localStorage.setItem('oci_assessments', JSON.stringify(nextAssessments));
    localStorage.setItem('oci_assessments_autobackup', JSON.stringify({
      timestamp: new Date().toISOString(),
      data: nextAssessments
    }));
  };

  const handleDeleteAssessment = async (id: string) => {
    if (confirm('Delete this patient diagnostic record permanently?')) {
      const nextAssessments = savedAssessments.filter(a => a.id !== id);
      setSavedAssessments(nextAssessments);
      
      // Delete from IndexedDB
      await dbDeleteAssessment(id);
      
      // Sync local backup
      localStorage.setItem('oci_assessments', JSON.stringify(nextAssessments));
    }
  };

  const handleDuplicateAssessment = (assessment: Assessment) => {
    const duplicatedPatient: PatientDetails = {
      ...assessment.patientDetails,
      name: `${assessment.patientDetails.name} (Copy)`,
      caseNumber: `${assessment.patientDetails.caseNumber}-DUP`,
      date: new Date().toISOString().split('T')[0]
    };
    setActivePatient(duplicatedPatient);
    setActiveCeph(assessment.cephalometricInput);
    setActiveResult(assessment.ociResult);
    setScreen('ceph-input');
  };

  const handleUpdateWeights = async (newWeights: OciWeights) => {
    setWeights(newWeights);
    await dbSaveSetting('oci_weights', newWeights);
    localStorage.setItem('oci_weights', JSON.stringify(newWeights));
  };

  const handleImportDatabase = async (jsonStr: string): Promise<boolean> => {
    try {
      // Direct restoration using raw json backing or full json file
      const success = await dbImportBackup(jsonStr);
      if (success) {
        const loaded = await dbGetAssessments();
        setSavedAssessments(loaded);
        return true;
      }
      
      // Traditional direct raw array parse fallback
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        const isValid = parsed.every(item => item.id && item.patientDetails && item.ociResult);
        if (isValid) {
          const combined = [...parsed, ...savedAssessments];
          const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          
          setSavedAssessments(unique);
          for (const item of unique) {
            await dbSaveAssessment(item);
          }
          localStorage.setItem('oci_assessments', JSON.stringify(unique));
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Import failure:', e);
      return false;
    }
  };

  const handleExportDatabase = async () => {
    try {
      const backupJson = await dbExportBackup();
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OCI_Clinical_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export OCI index backup:', e);
    }
  };

  const handleResetDatabase = async () => {
    await dbClearAllData();
    setSavedAssessments([]);
    localStorage.removeItem('oci_assessments');
    localStorage.removeItem('oci_assessments_autobackup');
    alert('IndexedDB and dual-layer local databases successfully wiped.');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 flex flex-col transition-colors duration-300">
      
      {/* 1. Splash Overlay Screen */}
      <AnimatePresence>
        {screen === 'splash' && (
          <Splash onFinish={() => setScreen('home')} />
        )}
      </AnimatePresence>

      {/* 2. Top Navigation Bar (Hidden during Splash) */}
      {screen !== 'splash' && (
        <header className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-150 dark:border-slate-850 z-30 px-6 py-4 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setScreen('home')}>
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
                OCI ANALYZER
              </h1>
              <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest">Orthodontic Diagnostic Support</p>
            </div>
          </div>

          {/* Nav menu links for Desktop */}
          <nav className="hidden md:flex items-center space-x-1.5 text-xs font-semibold">
            {[
              { id: 'home', label: 'Dashboard', icon: HomeIcon },
              { id: 'history', label: 'Patients', icon: Users },
              { id: 'patient-form', label: 'OCI Analysis', icon: Activity, action: handleStartNewAssessment },
              { id: 'treatment-planning', label: 'Treatment Planning', icon: Brain },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'settings', label: 'Settings', icon: SettingsIcon }
            ].map((item) => (
              <button
                key={item.id}
                onClick={item.action ? item.action : () => setScreen(item.id as any)}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer border ${
                  screen === item.id || (item.id === 'patient-form' && (screen === 'patient-form' || screen === 'ceph-input' || screen === 'results'))
                    ? 'bg-teal-50/60 dark:bg-teal-950/40 border-teal-100/40 text-teal-700 dark:text-teal-300 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <item.icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Quick theme toggles */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
            </button>
            
            <button
              onClick={handleStartNewAssessment}
              className="md:hidden p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition cursor-pointer"
              title="Start New Assessment"
            >
              <PlusCircle className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>
      )}

      {/* 3. Main Dashboard Body Container */}
      {screen !== 'splash' && (
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8 print:p-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full"
            >
              {screen === 'home' && (
                <Home 
                  onNewAssessment={handleStartNewAssessment}
                  onViewHistory={() => setScreen('history')}
                  onViewSettings={() => setScreen('settings')}
                  onViewAbout={() => setScreen('about')}
                  savedAssessments={savedAssessments}
                />
              )}

              {screen === 'patient-form' && (
                <PatientForm
                  initialDetails={activePatient || undefined}
                  onNext={handlePatientSubmit}
                  onCancel={() => setScreen('home')}
                />
              )}

              {screen === 'ceph-input' && activePatient && (
                <CephInput
                  initialInput={activeCeph || undefined}
                  diagnosis={activePatient.diagnosis}
                  onCalculate={handleCephSubmit}
                  onBack={() => setScreen('patient-form')}
                />
              )}

              {screen === 'results' && activePatient && activeCeph && activeResult && (
                <ResultsDashboard
                  patientDetails={activePatient}
                  cephalometricInput={activeCeph}
                  ociResult={activeResult}
                  onSaveAssessment={handleSaveAssessment}
                  onOpenPdf={(editedSummaryText) => {
                    setPdfReportAssessment({
                      id: 'preview',
                      patientDetails: activePatient,
                      cephalometricInput: activeCeph,
                      ociResult: activeResult,
                      aiSummary: editedSummaryText,
                      createdAt: new Date().toISOString()
                    });
                  }}
                  onBack={() => setScreen('ceph-input')}
                />
              )}

              {screen === 'history' && (
                <HistoryList
                  assessments={savedAssessments}
                  onSelect={(item) => {
                    setActivePatient(item.patientDetails);
                    setActiveCeph(item.cephalometricInput);
                    setActiveResult(item.ociResult);
                    setScreen('results');
                  }}
                  onDuplicate={handleDuplicateAssessment}
                  onDelete={handleDeleteAssessment}
                  onNewAssessment={handleStartNewAssessment}
                />
              )}

              {screen === 'settings' && (
                <SettingsPanel
                  weights={weights}
                  onUpdateWeights={handleUpdateWeights}
                  onImportData={handleImportDatabase}
                  onExportData={handleExportDatabase}
                  onResetDatabase={handleResetDatabase}
                  darkMode={darkMode}
                  onToggleDarkMode={toggleDarkMode}
                />
              )}

              {screen === 'treatment-planning' && (
                <TreatmentPlanning
                  savedAssessments={savedAssessments}
                />
              )}

              {screen === 'reports' && (
                <ReportsPanel
                  savedAssessments={savedAssessments}
                />
              )}

              {screen === 'about' && (
                <div className="max-w-4xl mx-auto space-y-8 pb-12">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-6">
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      Orthodontic Compensation Index (OCI) Guidelines
                    </h2>
                    
                    <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <p>
                        Dentoalveolar compensation is the physiological system's natural reaction to skeletal sagittal discrepancies. In individuals with Class II or Class III jaw mismatches, teeth tip and glide to establish stable occlusal contacts, masking the true severity of the skeletal pattern.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100/30">
                          <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-2">Class II Compensatory Archetype</h4>
                          <ul className="list-disc list-inside space-y-1.5 text-xs">
                            <li>Retroclined maxillary incisors (U1-SN tipped backward)</li>
                            <li>Proclined mandibular incisors (IMPA flared forward)</li>
                            <li>Increased Curve of Spee in lower arch</li>
                            <li>Substantial masking of severe mandibular deficiency</li>
                          </ul>
                        </div>

                        <div className="p-5 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-100/30">
                          <h4 className="font-bold text-teal-900 dark:text-teal-300 mb-2">Class III Compensatory Archetype</h4>
                          <ul className="list-disc list-inside space-y-1.5 text-xs">
                            <li>Proclined maxillary incisors (U1-SN flared forward)</li>
                            <li>Retroclined mandibular incisors (IMPA uprighted/backward)</li>
                            <li>Flattered lower Curve of Spee</li>
                            <li>Narrowed maxilla compensated by transverse tooth flaring</li>
                          </ul>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg pt-4">Clinical Index Ranges</h3>
                      <div className="space-y-2 text-xs">
                        <p>**0–20: Minimal Compensation.** Teeth align naturally over bone centers. Excellent candidate for simple orthodontic alignment.</p>
                        <p>**21–40: Mild Compensation.** Moderate tipping observed. Standard orthodontic camouflage is highly predictable.</p>
                        <p>**41–60: Moderate Compensation (Borderline).** High tooth inclination. Dental limits are stretched. Careful examination of periodontal bone plates and soft-tissue profile is necessary before planning camouflage treatment.</p>
                        <p>**61–80: Severe Compensation.** Extreme tipping. Camouflage carries substantial periodontal risks (dehiscence, instability) or profile compromise. Orthognathic surgery is advisable.</p>
                        <p>**81–100: Extreme Compensation.** Critical limits breached. Orthognathic surgery with pre-surgical decompensation (purposefully reversing the tipping to expose true skeletal gap) is highly recommended.</p>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-150 dark:border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Medical Clinical Lead</p>
                          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-display">Dr. Salman MDS Orthodontist</p>
                        </div>
                        <span className="px-3 py-1.5 bg-teal-50/60 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 text-[10px] font-bold uppercase rounded-xl tracking-wider border border-teal-100/20 dark:border-teal-900/20">
                          Developed by Dr. Salman MDS Orthodontist
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      )}

      {/* 3.5 Premium Clinical Footer */}
      {screen !== 'splash' && (
        <footer className="w-full text-center py-6 border-t border-slate-150 dark:border-slate-850 bg-white/40 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 text-xs mt-auto print:hidden">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center px-4 sm:px-8 gap-2">
            <div>
              <p className="font-mono text-[10px] tracking-widest uppercase text-slate-400/85 dark:text-slate-500/85">OCI ANALYZER • CLINICAL DECISION SUPPORT ENGINE</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide">
                Developed by <span className="text-teal-600 dark:text-teal-400 font-bold">Dr. Salman MDS Orthodontist</span>
              </span>
            </div>
          </div>
        </footer>
      )}

      {/* 4. PDF Fullscreen Overlay Modal (Hidden unless selected) */}
      {pdfReportAssessment && (
        <PdfReport
          assessment={pdfReportAssessment}
          onClose={() => setPdfReportAssessment(null)}
        />
      )}

      {/* 5. Floating Bottom Navigation for Mobile (Print Hidden) */}
      {screen !== 'splash' && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl shadow-teal-950/5 flex justify-around items-center py-2 px-1 print:hidden">
          {[
            { id: 'home', label: 'Dashboard', icon: HomeIcon },
            { id: 'history', label: 'Patients', icon: Users },
            { id: 'patient-form', label: 'OCI', icon: Activity, action: handleStartNewAssessment },
            { id: 'treatment-planning', label: 'Planning', icon: Brain },
            { id: 'reports', label: 'Reports', icon: FileText },
            { id: 'settings', label: 'Settings', icon: SettingsIcon }
          ].map((item) => {
            const isActive = screen === item.id || 
              (item.id === 'patient-form' && (screen === 'patient-form' || screen === 'ceph-input' || screen === 'results'));
            return (
              <button
                key={item.id}
                onClick={item.action ? item.action : () => setScreen(item.id as any)}
                className={`flex flex-col items-center justify-center space-y-0.5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? 'text-teal-600 dark:text-teal-400 font-bold bg-teal-500/10 scale-105' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-[9px] font-semibold tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}
