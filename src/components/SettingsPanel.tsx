import React, { useState } from 'react';
import { OciWeights } from '../types';
import { DEFAULT_WEIGHTS } from '../scoringEngine';
import { 
  Settings, 
  Trash2, 
  Download, 
  Upload, 
  Info, 
  Save, 
  RefreshCw,
  Moon,
  Sun
} from 'lucide-react';

interface SettingsPanelProps {
  weights: OciWeights;
  onUpdateWeights: (newWeights: OciWeights) => void;
  onImportData: (data: string) => Promise<boolean> | boolean;
  onExportData: () => void;
  onResetDatabase: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function SettingsPanel({
  weights,
  onUpdateWeights,
  onImportData,
  onExportData,
  onResetDatabase,
  darkMode,
  onToggleDarkMode
}: SettingsPanelProps) {
  const [localWeights, setLocalWeights] = useState<OciWeights>({ ...weights });
  const [successMsg, setSuccessMsg] = useState('');
  const [importError, setImportError] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleWeightChange = (key: keyof OciWeights, value: number) => {
    // Clamp to ensure we keep a reasonable max score distribution
    const clampedValue = Math.max(0, Math.min(value, 50));
    setLocalWeights(prev => ({
      ...prev,
      [key]: clampedValue
    }));
  };

  const saveWeights = () => {
    onUpdateWeights(localWeights);
    setSuccessMsg('Scoring weights saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const resetWeightsToDefault = () => {
    setLocalWeights({ ...DEFAULT_WEIGHTS });
    onUpdateWeights(DEFAULT_WEIGHTS);
    setSuccessMsg('Weights restored to expert defaults!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Sum of current local weights
  const totalWeightSum = Object.values(localWeights).reduce((sum, v) => (sum as number) + (v as number), 0) as number;

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await onImportData(content);
      if (success) {
        setImportSuccess(true);
        setImportError(false);
        setTimeout(() => setImportSuccess(false), 3000);
      } else {
        setImportError(true);
        setImportSuccess(false);
        setTimeout(() => setImportError(false), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      
      {/* Upper header */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2 font-display">
          <Settings className="w-5 h-5 text-teal-600 animate-spin-slow" />
          <span>System Settings & Configurator</span>
        </h2>
        <p className="text-xs text-slate-500">Fine-tune OCI index coefficients, import backups, or adjust visual theme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left column: Theme, Backup, Restore, reset */}
        <div className="space-y-6 md:col-span-1">
          
          {/* Theme card */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Visual Preferences</h3>
            <button
              onClick={onToggleDarkMode}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl transition cursor-pointer"
            >
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Dark Mode Interface</span>
              {darkMode ? <Moon className="w-4.5 h-4.5 text-teal-400" /> : <Sun className="w-4.5 h-4.5 text-amber-500" />}
            </button>
          </div>

          {/* Backup Restores */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Offline Database Maintenance</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-850">
              <span className="font-semibold text-teal-600 dark:text-teal-400">Status: Sandbox Active</span> • 100% cloudless storage. All data is written locally on your device via IndexedDB.
            </p>

            <div className="space-y-3 text-xs">
              {/* Export backup */}
              <button
                onClick={onExportData}
                className="w-full flex items-center justify-between p-3.5 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-slate-950/40 dark:hover:bg-slate-950 border border-indigo-100 dark:border-indigo-900/30 rounded-xl transition cursor-pointer text-indigo-700 dark:text-indigo-400 font-semibold"
              >
                <span>Backup JSON Database</span>
                <Download className="w-4 h-4" />
              </button>

              {/* Import backup */}
              <label className="w-full flex items-center justify-between p-3.5 bg-teal-50/50 hover:bg-teal-50 dark:bg-slate-950/40 dark:hover:bg-slate-950 border border-teal-100 dark:border-teal-900/30 rounded-xl transition cursor-pointer text-teal-700 dark:text-teal-400 font-semibold">
                <span>Restore/Import Archive</span>
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>

              {importSuccess && (
                <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200">
                  Data restored successfully!
                </p>
              )}

              {importError && (
                <p className="text-[10px] text-red-600 font-bold bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200">
                  Error restoring. Check file format!
                </p>
              )}
            </div>

            {/* Danger Zone Reset */}
            <div className="border-t border-slate-100 dark:border-slate-850 pt-4 mt-2">
              <button
                onClick={() => {
                  if (confirm('Are you absolutely sure you want to completely wipe all patient assessments? This cannot be undone.')) {
                    onResetDatabase();
                  }
                }}
                className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 border border-red-100 dark:border-red-900/40 rounded-xl transition cursor-pointer text-red-700 dark:text-red-400 font-semibold"
              >
                <span>Reset Local Database</span>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clinical Authoring Card */}
          <div className="glass-panel p-6 rounded-3xl space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">Clinical Directorship</h3>
            <div className="p-3.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl">
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest mb-1">Chief Investigator</p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Dr. Salman MDS Orthodontist</p>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Developed by Dr. Salman MDS Orthodontist, this expert-system engine utilizes dual-layer IndexedDB logic to score orthodontic and orthognathic compensation indices safely offline.
            </p>
          </div>
        </div>

        {/* Right column: Configurable OCI weights */}
        <div className="md:col-span-2 glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">OCI Category Weight Coefficients</h3>
              <p className="text-xs text-slate-500">Configure parameters contribution to final max index score (target = 100)</p>
            </div>
            <button
              onClick={resetWeightsToDefault}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs flex items-center space-x-1 font-semibold cursor-pointer"
              title="Reset to original research defaults"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-start space-x-3 text-xs text-slate-500 leading-relaxed border border-slate-100 dark:border-slate-800">
            <Info className="w-5 h-5 text-teal-500 shrink-0" />
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">Sum of Max OCI Score: {totalWeightSum} / 100</p>
              <p className="mt-1">For optimal clinical indexing, adjust categories so that the total sum balances to exactly **100**. This ensures matching scores with literature reference models.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'skeletal', label: 'Skeletal Discrepancy' },
              { key: 'upperIncisor', label: 'Upper Incisor Compensation' },
              { key: 'lowerIncisor', label: 'Lower Incisor Compensation' },
              { key: 'interincisal', label: 'Interincisal Angle Relation' },
              { key: 'overjet', label: 'Overjet Mismatch' },
              { key: 'softTissue', label: 'Soft Tissue Profile Mask' },
              { key: 'occlusion', label: 'Occlusal Compensation' },
              { key: 'transverse', label: 'Transverse Arch width' }
            ].map((item) => (
              <div key={item.key} className="space-y-1.5 bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800/40">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>{item.label}</span>
                  <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">{localWeights[item.key as keyof OciWeights]}</span>
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={localWeights[item.key as keyof OciWeights]}
                    onChange={(e) => handleWeightChange(item.key as keyof OciWeights, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <input
                    type="number"
                    value={localWeights[item.key as keyof OciWeights]}
                    onChange={(e) => handleWeightChange(item.key as keyof OciWeights, Number(e.target.value))}
                    className="w-12 px-1.5 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-850 pt-5">
            <p className="text-xs font-semibold text-slate-400">
              * Weights are synced instantly in memory and saved to disk.
            </p>
            <div className="flex items-center space-x-2">
              {successMsg && (
                <span className="text-xs text-emerald-600 font-bold animate-pulse">{successMsg}</span>
              )}
              <button
                type="button"
                onClick={saveWeights}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-md shadow-teal-500/10"
              >
                <Save className="w-4 h-4" />
                <span>Save New Coefficients</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
