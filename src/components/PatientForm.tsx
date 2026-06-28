import React, { useState, useEffect } from 'react';
import { PatientDetails } from '../types';
import { User, Clipboard, Calendar, FileText, ArrowRight, X } from 'lucide-react';

interface PatientFormProps {
  initialDetails?: PatientDetails;
  onNext: (details: PatientDetails) => void;
  onCancel: () => void;
}

export default function PatientForm({ initialDetails, onNext, onCancel }: PatientFormProps) {
  const [name, setName] = useState(initialDetails?.name || '');
  const [age, setAge] = useState<number | ''>(initialDetails?.age || '');
  const [gender, setGender] = useState<PatientDetails['gender']>(initialDetails?.gender || '');
  const [caseNumber, setCaseNumber] = useState(initialDetails?.caseNumber || '');
  const [diagnosis, setDiagnosis] = useState<PatientDetails['diagnosis']>(initialDetails?.diagnosis || '');
  const [clinicalNotes, setClinicalNotes] = useState(initialDetails?.clinicalNotes || '');
  const [date, setDate] = useState(initialDetails?.date || new Date().toISOString().split('T')[0]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const tempErrors: Record<string, string> = {};
    if (!name.trim()) tempErrors.name = 'Patient Name is required';
    if (age === '' || age <= 0 || age > 120) tempErrors.age = 'Enter a valid age (1-120)';
    if (!gender) tempErrors.gender = 'Gender selection is required';
    if (!caseNumber.trim()) tempErrors.caseNumber = 'Case number is required';
    if (!diagnosis) tempErrors.diagnosis = 'Skeletal diagnosis is required';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext({
        name,
        age: Number(age),
        gender,
        caseNumber,
        diagnosis,
        date,
        clinicalNotes,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-teal-600 px-8 py-6 text-white flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-teal-200 font-mono">Step 1 of 2</span>
          <h2 className="text-2xl font-bold tracking-tight">Patient Demographics</h2>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Patient Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <User className="w-4 h-4 text-slate-400" />
              <span>Patient Name *</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500 bg-red-50/20' : 'border-slate-200 dark:border-slate-700'} bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Case Number */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Clipboard className="w-4 h-4 text-slate-400" />
              <span>Case Number / ID *</span>
            </label>
            <input
              type="text"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="e.g. ORTHO-2026-98"
              className={`w-full px-4 py-3 rounded-xl border ${errors.caseNumber ? 'border-red-500 bg-red-50/20' : 'border-slate-200 dark:border-slate-700'} bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
            />
            {errors.caseNumber && <p className="text-xs text-red-500">{errors.caseNumber}</p>}
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Age *
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 24"
              className={`w-full px-4 py-3 rounded-xl border ${errors.age ? 'border-red-500 bg-red-50/20' : 'border-slate-200 dark:border-slate-700'} bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
            />
            {errors.age && <p className="text-xs text-red-500">{errors.age}</p>}
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Gender *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Male', 'Female', 'Other'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-3 rounded-xl border text-sm font-medium transition cursor-pointer ${
                    gender === g 
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-300' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
          </div>

          {/* Diagnosis */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Primary Skeletal Sagittal Diagnosis *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Class I', 'Class II', 'Class III'] as const).map((diag) => (
                <button
                  key={diag}
                  type="button"
                  onClick={() => setDiagnosis(diag)}
                  className={`py-3 rounded-xl border text-sm font-medium transition cursor-pointer ${
                    diagnosis === diag 
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-600 dark:text-teal-300' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {diag}
                </button>
              ))}
            </div>
            {errors.diagnosis && <p className="text-xs text-red-500">{errors.diagnosis}</p>}
          </div>

          {/* Assessment Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Assessment Date</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

        </div>

        {/* Clinical Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Clinical Notes / Medical History</span>
          </label>
          <textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="e.g., Patient displays macrognathia, high angle profile, severe crowding in lower arch..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
          />
        </div>

        {/* Navigation Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium transition cursor-pointer text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition cursor-pointer flex items-center space-x-2 text-sm shadow-md shadow-blue-500/10"
          >
            <span>Proceed to Cephalometrics</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
