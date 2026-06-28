import React, { useState } from 'react';
import { Assessment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Brain, 
  Sparkles, 
  Sliders, 
  TrendingUp, 
  Activity, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Briefcase, 
  Printer, 
  Download,
  Info,
  Calendar,
  Layers,
  Wrench,
  RotateCcw
} from 'lucide-react';

interface TreatmentPlanningProps {
  savedAssessments: Assessment[];
  onSelectAssessment?: (id: string) => void;
}

export default function TreatmentPlanning({ savedAssessments }: TreatmentPlanningProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [cvmsStage, setCvmsStage] = useState<string>('CVMS 3 (Peak)');
  const [dentitionPhase, setDentitionPhase] = useState<string>('Late Mixed');
  const [customNotes, setCustomNotes] = useState<string>('');

  // Find the selected assessment
  const selectedAssessment = savedAssessments.find(a => a.id === selectedId) || savedAssessments[0];

  // Initialize selectedId if there are assessments and none is selected
  React.useEffect(() => {
    if (savedAssessments.length > 0 && !selectedId) {
      setSelectedId(savedAssessments[0].id);
    }
  }, [savedAssessments, selectedId]);

  if (savedAssessments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-12 rounded-3xl space-y-6 border border-slate-200 dark:border-slate-800 shadow-xl"
        >
          <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto border border-teal-500/20 text-teal-500 animate-pulse">
            <Brain className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">Treatment Planning Core Offline</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
            No patient assessments have been indexed yet. Start a new 3D cephalometric OCI analysis to load clinical records into the treatment planning assistant.
          </p>
          <div className="pt-2">
            <span className="text-[10px] text-teal-500/75 font-mono uppercase tracking-widest block">Clinical Decision Support Engine</span>
            <span className="text-xs text-slate-400">Developed by Dr. Salman MDS Orthodontist</span>
          </div>
        </motion.div>
      </div>
    );
  }

  const { patientDetails, cephalometricInput, ociResult } = selectedAssessment;

  // Expert rules based on raw numbers and OCI
  const isClassIII = patientDetails.diagnosis === 'Class III' || (cephalometricInput.anb !== '' && cephalometricInput.anb < 0);
  const isClassII = patientDetails.diagnosis === 'Class II' || (cephalometricInput.anb !== '' && cephalometricInput.anb > 4);
  const isClassI = !isClassIII && !isClassII;

  const age = typeof patientDetails.age === 'number' ? patientDetails.age : 12;
  const isGrowing = age <= 14;

  // Automatically detect clinical problems from cephalometric inputs
  const problemList: string[] = [];
  if (cephalometricInput.anb !== '') {
    if (cephalometricInput.anb < 0) problemList.push(`Skeletal Class III Discrepancy (ANB: ${cephalometricInput.anb}°)`);
    else if (cephalometricInput.anb > 4) problemList.push(`Skeletal Class II Discrepancy (ANB: ${cephalometricInput.anb}°)`);
  }
  if (cephalometricInput.wits !== '') {
    if (cephalometricInput.wits < -2) problemList.push(`Skeletal Class III Maxillo-Mandibular Disagreement (Wits: ${cephalometricInput.wits}mm)`);
    else if (cephalometricInput.wits > 2) problemList.push(`Skeletal Class II Maxillo-Mandibular Disagreement (Wits: ${cephalometricInput.wits}mm)`);
  }
  if (cephalometricInput.fma !== '') {
    if (cephalometricInput.fma > 29) problemList.push(`Hyperdivergent Growth Pattern / High Angle Mandibular Plane (FMA: ${cephalometricInput.fma}°)`);
    else if (cephalometricInput.fma < 21) problemList.push(`Hypodivergent Growth Pattern / Low Angle Mandibular Plane (FMA: ${cephalometricInput.fma}°)`);
  }
  if (cephalometricInput.impa !== '') {
    if (cephalometricInput.impa > 95) problemList.push(`Lower Incisor Proclination / Labial Tipping (IMPA: ${cephalometricInput.impa}°)`);
    else if (cephalometricInput.impa < 85) problemList.push(`Lower Incisor Retroclination / Lingual Tipping (IMPA: ${cephalometricInput.impa}°)`);
  }
  if (cephalometricInput.u1Sn !== '') {
    if (cephalometricInput.u1Sn > 109) problemList.push(`Upper Incisor Proclination (U1-SN: ${cephalometricInput.u1Sn}°)`);
    else if (cephalometricInput.u1Sn < 99) problemList.push(`Upper Incisor Retroclination (U1-SN: ${cephalometricInput.u1Sn}°)`);
  }
  if (cephalometricInput.overjet !== '') {
    if (cephalometricInput.overjet > 4) problemList.push(`Excessive Overjet / Protrusion (${cephalometricInput.overjet}mm)`);
    else if (cephalometricInput.overjet < 1) problemList.push(`Reduced Overjet / Anterior Edge-to-Edge / Negative Overjet (${cephalometricInput.overjet}mm)`);
  }
  if (cephalometricInput.overbite !== '') {
    if (cephalometricInput.overbite > 4) problemList.push(`Severe Deep Overbite (${cephalometricInput.overbite}mm)`);
    else if (cephalometricInput.overbite < 0) problemList.push(`Anterior Open Bite (${Math.abs(Number(cephalometricInput.overbite))}mm)`);
  }
  if (cephalometricInput.crossbite && cephalometricInput.crossbite !== 'None') {
    problemList.push(`${cephalometricInput.crossbite} Crossbite relationship`);
  }
  if (cephalometricInput.archWidthDifference !== '' && Math.abs(cephalometricInput.archWidthDifference) > 2) {
    problemList.push(`Transverse Arch Width Mismatch (${Math.abs(cephalometricInput.archWidthDifference)}mm discrepancy)`);
  }
  if (problemList.length === 0) {
    problemList.push('Mild dental malalignment, Class I sagittal profiles');
  }

  // Treatment Objectives
  const objectives: string[] = [
    'Establish ideal Class I canine and molar dental relationships',
    'Achieve optimal overjet (2.0 - 2.5mm) and overbite (1.5 - 2.0mm)',
    'Optimize lower incisor position relative to mandibular basal bone (IMPA Target ~90°)',
    'Establish lip competence and pleasant soft tissue facial profiles',
    'Ensure long-term structural stability of the dental arches and periodontal health'
  ];
  if (isClassIII) {
    objectives.unshift('Correct skeletal Class III pattern and maximize anterior dental display');
    objectives.push('Decompensate dental arches to expose true skeletal gap (if planning orthognathic surgery)');
  } else if (isClassII) {
    objectives.unshift('Improve/restrict sagittal skeletal Class II mandibular deficiency or maxillary excess');
    objectives.push('Manage lower incisor labial tipping limits to avoid dehiscence/fenestration');
  }

  // Generate treatment approaches based on rules
  const getGrowthModificationNotes = () => {
    if (isClassIII) {
      return {
        timing: isGrowing ? 'Optimal treatment window is active. Growth is highly active.' : 'Growth limits reached. Skeletal modification efficacy is poor.',
        guidelines: 'In skeletal Class III growing cases, orthopedic force should target maxillary protraction and mandibular growth guidance.',
        appliances: isGrowing ? 'Reverse-pull Facemask paired with Rapid Maxillary Expansion (RME/Hyrax) or skeletal anchored miniplates.' : 'Skeletal maturity restricts functional therapy. Recommend orthognathic surgical planning.'
      };
    } else if (isClassII) {
      return {
        timing: isGrowing ? `Highly favorable growth window (Age: ${age}, CVMS Stage: ${cvmsStage}).` : 'Skeletally mature. Minimal growth remaining.',
        guidelines: 'Promote mandibular advancement in retrognathic growing profiles, or restrict forward maxillary translocation.',
        appliances: isGrowing ? 'Twin Block, Herbst appliance, Activator, or Mara appliance.' : 'Functional modification is highly limited. Camouflage or surgical plan indicated.'
      };
    }
    return {
      timing: 'Not indicated (Skeletal Class I)',
      guidelines: 'Skeletal relationships are in balance. Direct therapeutic alignment is standard.',
      appliances: 'N/A'
    };
  };

  const getCamouflageNotes = () => {
    const isSurgicalCandidate = ociResult.totalScore > 65;
    if (isClassIII) {
      return {
        extraction: isSurgicalCandidate ? 'Extraction of lower premolars carried extreme periodontal risk due to thin lingual bone plate.' : 'Consider extraction of lower first premolars or mandibular third molars for en-masse distalization with micro-screws.',
        compensation: 'Procline upper incisors further (with bone limits warning) and retrocline lower incisors (IMPA limit is ~82°).',
        anchorage: 'Maximum mandibular anchorage required to distalize lower segment. Consider Temporary Anchorage Devices (TADs).',
        complexity: ociResult.totalScore > 60 ? 'Extreme Camouflage complexity - periodontal health must be monitored.' : 'Moderate Camouflage complexity.'
      };
    } else if (isClassII) {
      return {
        extraction: isSurgicalCandidate ? 'Premolar extractions carry risk of flattening profile further. Re-evaluate.' : 'Extraction of upper first premolars to retract anterior segment, or lower second premolars to facilitate Class I molar.',
        compensation: 'Procline lower incisors cautiously (do not exceed IMPA of 98°) and retrocline upper incisors.',
        anchorage: 'Moderate to maximum maxillary anchorage. Consider transpalatal arch (TPA) or TADs.',
        complexity: ociResult.totalScore > 60 ? 'High Camouflage complexity - risk of root resorption or unstable tipping.' : 'Mild to Moderate Camouflage complexity.'
      };
    }
    return {
      extraction: 'Non-extraction with Interproximal Reduction (IPR) if crowding is < 4mm, or extraction of 4 premolars if crowding is severe.',
      compensation: 'Preserve ideal inclinations. Maintain Interincisal Angle ~135°.',
      anchorage: 'Minimal to moderate anchorage depending on crowding.',
      complexity: 'Low complexity dental alignment.'
    };
  };

  const getSurgicalNotes = () => {
    const score = ociResult.totalScore;
    if (score > 65) {
      return {
        flag: true,
        reason: `OCI Score of ${score}/100 exceeds safe physiological dental compensation limits. True skeletal discrepancy is severe.`,
        protocol: 'Recommend orthognathic surgery: LeFort I osteotomy for maxillary advancement (Class III) or BSSO for mandibular advancement (Class II). Pre-surgical orthodontic decompensation is mandatory: purposefully reverse any dental compensations to reveal the true skeletal gap prior to surgery.',
        consultation: 'Urgent referral to Maxillofacial surgeon for dual-disciplinary workup.'
      };
    }
    return {
      flag: false,
      reason: 'Skeletal disharmony is mild/moderate and well masked by natural dentialveolar adaptations. Safe orthodontic camouflage is feasible.',
      protocol: 'No surgical correction required. Traditional biomechanics suffice.',
      consultation: 'Not indicated.'
    };
  };

  const growthInfo = getGrowthModificationNotes();
  const camoInfo = getCamouflageNotes();
  const surgeryInfo = getSurgicalNotes();

  // Appliance suggestion list based on analysis
  const suggestedAppliances: string[] = [];
  if (isGrowing && (isClassII || isClassIII)) {
    suggestedAppliances.push(isClassII ? 'Twin Block (Advise 12-14 hrs daily wear)' : 'Facemask / Protraction therapy with Maxillary Expansion');
  }
  if (cephalometricInput.posteriorCrossbite !== 'None' || (cephalometricInput.archWidthDifference !== '' && Math.abs(cephalometricInput.archWidthDifference) > 2)) {
    suggestedAppliances.push('Rapid Maxillary Expander (RME/Hyrax appliance - skeletal expansion)');
  }
  suggestedAppliances.push('Fixed Orthodontic Brackets (0.022-inch Roth/MBT slot prescription)');
  if (ociResult.totalScore < 45) {
    suggestedAppliances.push('Clear Aligner Therapy (Safe with virtual staging and staging attachments)');
  }
  if (ociResult.totalScore > 50 || isClassIII) {
    suggestedAppliances.push('Temporary Anchorage Devices (TADs - 1.6mm x 8mm orthodontic micro-screws)');
  }
  suggestedAppliances.push('Retention System: Upper Essix vacuum-formed retainer + Lower 3-3 bonded lingual wire');

  // Interactive step description
  const steps = [
    {
      title: 'Diagnosis & Skeletal Analysis',
      icon: Activity,
      summary: `Skeletal Class ${isClassI ? 'I' : isClassII ? 'II' : 'III'} profile based on ANB (${cephalometricInput.anb || 'N/A'}°) and Wits Appraisal (${cephalometricInput.wits || 'N/A'}mm).`,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50/55 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1">Sagittal Relationship</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {isClassI ? 'Skeletal Class I (Normal jaw balance)' : isClassII ? 'Skeletal Class II (Mandibular retrognathia or Maxillary excess)' : 'Skeletal Class III (Maxillary retrognathia or Mandibular prognathia)'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Wits: {cephalometricInput.wits !== '' ? `${cephalometricInput.wits} mm` : 'Not recorded'}. ANB: {cephalometricInput.anb !== '' ? `${cephalometricInput.anb}°` : 'Not recorded'}.
              </p>
            </div>
            <div className="p-4 bg-slate-50/55 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1">Vertical Pattern</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {cephalometricInput.fma !== '' ? (cephalometricInput.fma > 29 ? 'Hyperdivergent (High Angle)' : cephalometricInput.fma < 21 ? 'Hypodivergent (Low Angle)' : 'Normodivergent (Neutral pattern)') : 'Not recorded'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                FMA: {cephalometricInput.fma !== '' ? `${cephalometricInput.fma}°` : 'N/A'}. SN-MP: {cephalometricInput.snMp !== '' ? `${cephalometricInput.snMp}°` : 'N/A'}.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Identified Clinical Problems</h4>
            <ul className="space-y-1.5">
              {problemList.map((prob, idx) => (
                <li key={idx} className="flex items-start text-xs text-slate-600 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5 mr-2"></span>
                  <span>{prob}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Treatment Objectives',
      icon: ShieldCheck,
      summary: `Correct skeletal mismatch and optimize lower incisor target position (IMPA Target ~90°).`,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Clinical objectives are formulated to address dentofacial esthetics, chewing function, and periodontal limits:
          </p>
          <div className="space-y-2">
            {objectives.map((obj, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 p-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/40">
                <CheckCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{obj}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Treatment Options',
      icon: Sliders,
      summary: `Evaluates Orthopedic growth mod. vs. Camouflage extraction vs. Orthognathic Surgery.`,
      content: (
        <div className="space-y-6">
          {/* A. Growth modification */}
          <div className="p-4 bg-teal-50/20 dark:bg-teal-950/20 rounded-2xl border border-teal-500/10 space-y-2">
            <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400">
              <Clock className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Option A: Growth Modification (Orthopedics)</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Growth Timing status</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{growthInfo.timing}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Biomechanical Principles</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{growthInfo.guidelines}</p>
              </div>
            </div>
            <div className="text-xs border-t border-teal-500/10 pt-2">
              <span className="font-semibold text-teal-700 dark:text-teal-300">Suggested orthopedic appliance: </span>
              <span className="text-slate-600 dark:text-slate-300">{growthInfo.appliances}</span>
            </div>
          </div>

          {/* B. Orthodontic Camouflage */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-800/60 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Option B: Orthodontic Camouflage</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 font-display">Extraction vs Non-Extraction</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{camoInfo.extraction}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Compensation Mechanism</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{camoInfo.compensation}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Anchorage Strategy</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{camoInfo.anchorage}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Clinical Complexity</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{camoInfo.complexity}</p>
              </div>
            </div>
          </div>

          {/* C. Surgical Orthodontics */}
          <div className={`p-4 rounded-2xl border transition-all ${
            surgeryInfo.flag 
              ? 'bg-rose-50/20 dark:bg-rose-950/25 border-rose-500/20 shadow-lg shadow-rose-500/5' 
              : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-150 dark:border-slate-800/60'
          } space-y-2`}>
            <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Option C: Surgical Orthodontics (Orthognathics)</h4>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{surgeryInfo.reason}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{surgeryInfo.protocol}</p>
            <div className="text-xs pt-2 border-t border-slate-150 dark:border-slate-850">
              <span className="font-semibold text-rose-700 dark:text-rose-400">Surgical consultation request: </span>
              <span className="text-slate-600 dark:text-slate-300">{surgeryInfo.consultation}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Clinical Biomechanics',
      icon: Brain,
      summary: 'Manage force vectors, archwire sequencing, and tooth torque requirements.',
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <p>
            Excellent orthodontic outcomes require careful staging of forces to protect the periodontal support and optimize root movement:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">1. Leveling & Alignment</p>
              <p className="text-slate-500 dark:text-slate-400">
                Begin with highly flexible 0.014-inch Nickel-Titanium (NiTi) archwires, transitioning to 0.018-inch and 0.016 x 0.022-inch NiTi. Avoid high forces in cases of severe crowding.
              </p>
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">2. Working Stage / Space Closure</p>
              <p className="text-slate-500 dark:text-slate-400">
                Utilize rigid stainless steel wires (0.019 x 0.025-inch) paired with active nickel-titanium closed coil springs (150g force) or elastomeric chains for sliding space closure.
              </p>
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">3. Torque Expression & Control</p>
              <p className="text-slate-500 dark:text-slate-400">
                Manage upper/lower incisor inclinations. If performing camouflage, request custom high/low torque brackets to prevent excessive labial/lingual crown tipping.
              </p>
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">4. Finishing & Interdigitation</p>
              <p className="text-slate-500 dark:text-slate-400">
                Utilize highly flexible 0.016 x 0.022-inch braided steel wires with vertical seating elastics (3/16-inch, 3.5oz) to optimize clinical dental interdigitation.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Appliance Selection',
      icon: Wrench,
      summary: `${suggestedAppliances.length} clinical appliances recommended for this custom scenario.`,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The following physical appliances are selected according to biological limits and diagnostic parameters:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestedAppliances.map((app, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
                <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-mono text-xs font-extrabold shrink-0">
                  {idx + 1}
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug">{app}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Retention Protocol',
      icon: RotateCcw,
      summary: 'Ensure stability via bonded lingual wire + upper vacuum-formed overlay.',
      content: (
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">
            Relapse occurs primarily due to periodontal ligament recoil and continued late mandibular growth. A dual-retention system is strongly recommended:
          </p>
          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <span className="font-bold text-slate-800 dark:text-slate-200">Fixed Retention: </span>
              <span>Bonded lingual wire (0.016-inch multi-strand stainless steel) adapted from canine-to-canine (3-3) in both upper and lower arches.</span>
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <span className="font-bold text-slate-800 dark:text-slate-200">Removable Retention: </span>
              <span>Upper Essix vacuum-formed retainer (1.0mm thickness) for night-only wear (8 hours daily) or a custom Hawley retainer for minor dental expansion maintenance.</span>
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <span className="font-bold text-slate-800 dark:text-slate-200">Review Schedule: </span>
              <span>Patient recalls at 1 month, 3 months, 6 months, and 12 months post-debonding to check wire integrity and orthodontic stability.</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Client-side CSV generator
  const exportToCSV = () => {
    const csvContent = [
      ['Patient Name', patientDetails.name || 'Anonymous'],
      ['Case Number', patientDetails.caseNumber || 'N/A'],
      ['Age', String(patientDetails.age || 'N/A')],
      ['Gender', patientDetails.gender || 'N/A'],
      ['Diagnosis', patientDetails.diagnosis || 'N/A'],
      ['Assessment Date', patientDetails.date || 'N/A'],
      ['OCI Total Score', `${ociResult.totalScore}/100`],
      ['OCI Interpretation', ociResult.interpretation],
      ['Algorithmic Recommendation', ociResult.recommendation],
      ['', ''],
      ['--- PROBLEM LIST ---', ''],
      ...problemList.map((prob, i) => [`Problem ${i+1}`, prob]),
      ['', ''],
      ['--- STRATEGIC TREATMENT OBJECTIVES ---', ''],
      ...objectives.map((obj, i) => [`Objective ${i+1}`, obj]),
      ['', ''],
      ['--- THERAPEUTIC OPTIONS ---', ''],
      ['Growth Modification Appliances', growthInfo.appliances],
      ['Growth Modification Guidelines', growthInfo.guidelines],
      ['Camouflage Extraction Strategy', camoInfo.extraction],
      ['Camouflage Incisor Strategy', camoInfo.compensation],
      ['Surgical Approach Required', surgeryInfo.flag ? 'YES' : 'NO'],
      ['Surgical Guideline Details', surgeryInfo.protocol],
      ['', ''],
      ['--- APPLIANCE PLAN ---', ''],
      ...suggestedAppliances.map((app, i) => [`Appliance ${i+1}`, app]),
      ['', ''],
      ['Clinical Treatment Planner Notes', customNotes || 'None']
    ].map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TreatmentPlan_${patientDetails.name || 'Patient'}_${patientDetails.caseNumber || 'Case'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-side PDF Print trigger
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Dynamic top bar with Patient Select */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center glass-panel p-6 rounded-3xl shadow-sm gap-4">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider text-teal-500 font-mono flex items-center">
            <Brain className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> Interactive AI Treatment Planner
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-display">
            Orthodontic Treatment Planning Assistant
          </h2>
        </div>

        {/* Dropdown Select Patient */}
        <div className="flex items-center space-x-3 w-full sm:w-auto shrink-0">
          <label className="text-xs font-bold text-slate-400 font-mono whitespace-nowrap">Active Record:</label>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setCustomNotes('');
            }}
            className="w-full sm:w-64 px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          >
            {savedAssessments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.patientDetails.name || 'Anonymous'} ({item.patientDetails.caseNumber || 'No Case'}) - {item.patientDetails.diagnosis}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient demographics overlay panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left column: Patient Brief + Core diagnosis parameters */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-850 pb-3">
              <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-display">Clinical Metadata</h3>
            </div>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100/50 dark:border-slate-800/30">
                <span className="text-slate-400">Name:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{patientDetails.name || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100/50 dark:border-slate-800/30">
                <span className="text-slate-400">Case ID:</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{patientDetails.caseNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100/50 dark:border-slate-800/30">
                <span className="text-slate-400">Age:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{patientDetails.age || 'N/A'} yrs</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100/50 dark:border-slate-800/30">
                <span className="text-slate-400">Gender:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{patientDetails.gender || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100/50 dark:border-slate-800/30">
                <span className="text-slate-400">Skeletal diagnosis:</span>
                <span className="font-semibold px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-md border border-teal-100/20">{patientDetails.diagnosis || 'Class I'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100/50 dark:border-slate-800/30">
                <span className="text-slate-400">OCI Index Score:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{ociResult.totalScore} / 100</span>
              </div>
            </div>
          </div>

          {/* Interactive treatment parameters */}
          <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-display flex items-center space-x-1.5 border-b border-slate-100 dark:border-slate-850 pb-3">
              <Sliders className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Planning variables</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Cervical Vertebral Maturity (CVMS)</label>
                <select
                  value={cvmsStage}
                  onChange={(e) => setCvmsStage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                >
                  <option value="CVMS 1 (Pre-Peak)">CVMS 1 (Pre-Peak / Growth potential high)</option>
                  <option value="CVMS 2 (Pre-Peak)">CVMS 2 (Pre-Peak / Accelerator active)</option>
                  <option value="CVMS 3 (Peak)">CVMS 3 (Peak / Maximum velocity window)</option>
                  <option value="CVMS 4 (Post-Peak)">CVMS 4 (Post-Peak / Velocity deceleration)</option>
                  <option value="CVMS 5 (Completed)">CVMS 5 (Completed / Mature stature)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Dentition Phase</label>
                <select
                  value={dentitionPhase}
                  onChange={(e) => setDentitionPhase(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                >
                  <option value="Primary">Primary Dentition</option>
                  <option value="Early Mixed">Early Mixed Dentition</option>
                  <option value="Late Mixed">Late Mixed Dentition</option>
                  <option value="Permanent">Permanent Dentition</option>
                </select>
              </div>

              {/* Clinical treatment notes editor */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Custom treatment plan notes</label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Enter specific orthodontic biomechanics, bracket torque specifications, or patient compliance instructions..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-teal-500 transition resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Quick export shortcuts */}
          <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">Export treatment records</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={triggerPrint}
                className="flex items-center justify-center space-x-1.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold tracking-wide transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print PDF</span>
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center justify-center space-x-1.5 py-2.5 bg-teal-600/10 hover:bg-teal-600/25 text-teal-700 dark:text-teal-400 rounded-xl text-xs font-bold tracking-wide transition cursor-pointer border border-teal-500/10"
              >
                <Download className="w-4 h-4 text-teal-600" />
                <span>Export CSV</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center leading-normal pt-1 italic">
              * Exports are generated fully offline to secure HIPAA compliance.
            </p>
          </div>
        </div>

        {/* Right column: Interactive Clinical Timeline steps (Expandable frosted panels) */}
        <div className="md:col-span-2 space-y-4">
          <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-150 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-5.5 h-5.5 text-teal-600 dark:text-teal-400 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 font-display">Interactive Planning Timeline</h3>
                  <p className="text-[10px] text-slate-400">Step-by-step biomechanical staging workflow</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-teal-50/60 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 text-[10px] font-bold uppercase rounded-xl tracking-wider">
                Developed by Dr. Salman MDS
              </span>
            </div>

            <div className="space-y-4">
              {steps.map((step, idx) => {
                const isExpanded = expandedStep === idx;
                return (
                  <motion.div 
                    key={idx}
                    layout="position"
                    className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                      isExpanded 
                        ? 'bg-white/40 dark:bg-slate-900/60 border-teal-500/25 shadow-md shadow-teal-500/5' 
                        : 'bg-slate-50/40 dark:bg-slate-950/20 border-slate-150 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/30'
                    }`}
                  >
                    {/* Header trigger */}
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : idx)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer select-none"
                    >
                      <div className="flex items-center space-x-3.5 pr-4">
                        {/* Step indicator circle */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                          isExpanded 
                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20 scale-105' 
                            : 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <step.icon className={`w-4 h-4 ${isExpanded ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">{step.title}</h4>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug mt-0.5 line-clamp-1">{step.summary}</p>
                        </div>
                      </div>
                      
                      {isExpanded ? (
                        <ChevronUp className="w-4.5 h-4.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4.5 h-4.5 text-slate-400" />
                      )}
                    </button>

                    {/* Content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-850/60">
                            {step.content}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Expert Diagnostic Summary */}
          <div className="p-6 bg-gradient-to-tr from-teal-900/40 via-slate-900 to-emerald-950/40 rounded-3xl border border-teal-500/10 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm text-teal-300 font-display uppercase tracking-widest">Diagnostic Copilot Synthesis</h3>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {isClassIII 
                  ? `Clinical index evaluation confirms a skeletal Class III relationship with severe dental compensation limits. Lower incisors have been tipped lingually (${cephalometricInput.impa || 'N/A'}°) while upper incisors are proclined to establish positive overjet. Orthodontic camouflage remains borderline (OCI: ${ociResult.totalScore}/100); close periodontal checks on thin anterior alveolar housing is advised.`
                  : isClassII 
                  ? `Clinical index evaluation indicates skeletal Class II profile with natural dental camouflage adaptations. Upper incisors are tipped lingually (${cephalometricInput.u1Sn || 'N/A'}°) while lower incisors are proclined. Camouflage with space closure remains feasible but requires moderate anchorage management to avoid unstable root exposure.`
                  : `Clinical index evaluation is within normal sagittal ranges (OCI: ${ociResult.totalScore}/100). Conventional alignment using standard Roth/MBT prescription is safe and highly stable, with no skeletal limits breached.`
                }
              </p>
              {customNotes && (
                <div className="p-3 bg-slate-950/60 border border-teal-500/20 rounded-xl">
                  <span className="text-[9px] text-teal-400 font-mono uppercase tracking-widest block mb-0.5">Clinical Operator Directives</span>
                  <p className="text-xs text-teal-100 leading-normal italic">{customNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
