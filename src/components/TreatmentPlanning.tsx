import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert, Clipboard } from 'react-native';
import { Assessment } from '../types';
import { 
  Users, 
  Brain, 
  Sparkles, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Clock,
  Activity,
  Layers,
  Wrench,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Briefcase,
  Zap,
  Check,
  Copy
} from 'lucide-react-native';
import tw from 'twrnc';

interface TreatmentPlanningProps {
  savedAssessments: Assessment[];
  onSelectAssessment?: (id: string) => void;
}

export default function TreatmentPlanning({ savedAssessments }: TreatmentPlanningProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [activePathway, setActivePathway] = useState<'orthopedic' | 'camouflage' | 'surgical' | 'tad'>('camouflage');
  const [cvmsStage, setCvmsStage] = useState<string>('CVMS 3 (Peak)');
  const [dentitionPhase, setDentitionPhase] = useState<string>('Late Mixed');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [showActiveSelect, setShowActiveSelect] = useState<boolean>(false);
  const [showCvmsSelect, setShowCvmsSelect] = useState<boolean>(false);
  const [showDentitionSelect, setShowDentitionSelect] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Find the selected assessment
  const selectedAssessment = savedAssessments.find(a => a.id === selectedId) || savedAssessments[0];

  useEffect(() => {
    if (savedAssessments.length > 0 && !selectedId) {
      setSelectedId(savedAssessments[0].id);
    }
  }, [savedAssessments, selectedId]);

  if (savedAssessments.length === 0) {
    return (
      <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
        <View style={tw`bg-gradient-to-br from-teal-950/40 to-[#0B1020]/40 p-8 rounded-[32px] border border-white/5 shadow-2xl mt-8 items-center text-center space-y-5`}>
          <View style={tw`w-16 h-16 bg-[#14B8A6]/10 rounded-full items-center justify-center border border-[#14B8A6]/20 shadow-inner`}>
            <Brain size={30} color="#14B8A6" />
          </View>
          <Text style={tw`text-lg font-black text-white`}>
            Treatment Planner
          </Text>
          <Text style={tw`text-slate-400 max-w-xs text-xs leading-relaxed text-center`}>
            No patient assessments have been indexed yet. Start a new cephalometric OCI analysis to load clinical records into the treatment planning assistant.
          </Text>
          <View style={tw`pt-2 items-center`}>
            <Text style={tw`text-[9px] text-[#22D3EE] font-black font-mono uppercase tracking-widest`}>
              Clinical Decision Support
            </Text>
            <Text style={tw`text-[10px] text-slate-500 mt-1 font-mono uppercase`}>Director: Dr. Salman MDS</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  const { patientDetails, cephalometricInput, ociResult } = selectedAssessment;

  // 1. Clinical variables extraction
  const anbVal = cephalometricInput.anb !== '' ? Number(cephalometricInput.anb) : 2;
  const witsVal = cephalometricInput.wits !== '' ? Number(cephalometricInput.wits) : 0;
  const fmaVal = cephalometricInput.fma !== '' ? Number(cephalometricInput.fma) : 25;
  const impaVal = cephalometricInput.impa !== '' ? Number(cephalometricInput.impa) : 90;
  const u1SnVal = cephalometricInput.u1Sn !== '' ? Number(cephalometricInput.u1Sn) : 104;
  const upperLipVal = cephalometricInput.upperLipELine !== '' ? Number(cephalometricInput.upperLipELine) : -2;
  const lowerLipVal = cephalometricInput.lowerLipELine !== '' ? Number(cephalometricInput.lowerLipELine) : 0;
  const ageVal = typeof patientDetails.age === 'number' ? patientDetails.age : Number(patientDetails.age) || 12;

  // 2. Classifications
  const skeletalPattern = anbVal < 0 ? 'Class III' : anbVal > 4.5 ? 'Class II' : 'Class I';
  const verticalPattern = fmaVal > 29 ? 'Hyperdivergent' : fmaVal < 21 ? 'Hypodivergent' : 'Normodivergent';
  const lipProfile = (upperLipVal > 0 || lowerLipVal > 2) ? 'Protrusive' : (upperLipVal < -4 || lowerLipVal < -2) ? 'Retrusive' : 'Aesthetic';
  const ociScore = ociResult.totalScore;

  let ociLevel: 'Minimal' | 'Mild' | 'Moderate' | 'Severe' | 'Extreme' = 'Minimal';
  let ociColor = '#22C55E'; // green
  if (ociScore <= 20) {
    ociLevel = 'Minimal';
    ociColor = '#22C55E';
  } else if (ociScore <= 40) {
    ociLevel = 'Mild';
    ociColor = '#14B8A6'; // teal
  } else if (ociScore <= 60) {
    ociLevel = 'Moderate';
    ociColor = '#EAB308'; // yellow
  } else if (ociScore <= 80) {
    ociLevel = 'Severe';
    ociColor = '#F97316'; // orange
  } else {
    ociLevel = 'Extreme';
    ociColor = '#EF4444'; // red
  }

  // 3. Dynamic Feasibilities
  // Orthopedic: Growing and skeletal discrepancy
  const isGrowing = cvmsStage.includes('Pre-Peak') || cvmsStage.includes('Peak') || ageVal <= 13;
  const orthopedicFeasibility = (() => {
    if (cvmsStage.includes('Completed')) return 5;
    if (cvmsStage.includes('Post-Peak')) return 35;
    if (skeletalPattern === 'Class I') return 15;
    return skeletalPattern === 'Class II' ? 95 : 90;
  })();

  // Camouflage: Ideal in mild-moderate, hazardous in severe-extreme
  const camouflageFeasibility = (() => {
    if (ociScore <= 20) return 98;
    if (ociScore <= 40) return 90;
    if (ociScore <= 60) return 70; // moderate is borderline
    if (ociScore <= 80) return 30; // severe is highly risky
    return 10; // extreme is contraindicated
  })();

  // Surgical: Ideal in severe-extreme adults
  const surgicalFeasibility = (() => {
    if (ociScore <= 20) return 5;
    if (ociScore <= 40) return 20;
    if (ociScore <= 60) return 55; // optional alternative
    if (ociScore <= 80) {
      return isGrowing ? 65 : 90; // defer if growing, highly indicated if adult
    }
    return isGrowing ? 75 : 98; // absolute requirement if adult
  })();

  // TAD-assisted: Dynamic based on FMA (intrusion) or severe camouflage needing extra movement
  const tadFeasibility = (() => {
    let score = 50;
    if (verticalPattern === 'Hyperdivergent') score += 30; // ideal for vertical control via molar intrusion
    if (ociScore > 35 && ociScore <= 70) score += 25; // expands camouflage envelope
    return Math.min(score, 95);
  })();

  // Get status details based on percentages
  const getStatusDetails = (pct: number) => {
    if (pct >= 85) return { label: 'Primary Path', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    if (pct >= 60) return { label: 'Viable Plan', style: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
    if (pct >= 35) return { label: 'Borderline', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    return { label: 'High Risk / Contraindicated', style: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
  };

  // 4. Clinical Problem List
  const problemList: string[] = [];
  if (skeletalPattern !== 'Class I') {
    problemList.push(`Skeletal ${skeletalPattern} basal relation (ANB: ${anbVal}°, Wits: ${witsVal}mm)`);
  }
  if (verticalPattern !== 'Normodivergent') {
    problemList.push(`${verticalPattern} vertical facial pattern (FMA: ${fmaVal}°)`);
  }
  if (impaVal > 95 || impaVal < 85) {
    problemList.push(`Incisor tipping anomaly (IMPA: ${impaVal}°, Norm: 90°)`);
  }
  if (lipProfile === 'Protrusive') {
    problemList.push(`Soft-tissue profile protrusion (Lips to E-line: U: ${upperLipVal}mm, L: ${lowerLipVal}mm)`);
  }
  if (problemList.length === 0) {
    problemList.push('Mild dental crowding, normal skeletal profile');
  }

  // 5. Pathway-Specific Prescription Details
  const getPrescription = () => {
    switch (activePathway) {
      case 'orthopedic':
        return {
          title: 'Skeletal Orthopedics & Growth Redirection Protocol',
          diagnosis: `Growing ${patientDetails.age || 'N/A'}yo patient in ${cvmsStage} stage presenting with Skeletal ${skeletalPattern} relationship.`,
          bracketSelection: 'Conventional Pre-Adjusted Edgewise (.022 slot) brackets to be deferred until transition to permanent dentition. Only local attachment or space management in mixed dentition.',
          archwires: [
            { step: 'Phase I (Orthopedic)', wire: 'Orthopedic Appliances Active', duration: '9 - 12 Months', action: 'Directing sutural growth / remodeling mandibular condyle.' },
            { step: 'Phase II (Alignment)', wire: '.014 NiTi -> .016x.022 NiTi', duration: '3 - 6 Months', action: 'Leveling and aligning arches after permanent teeth erupt.' },
            { step: 'Phase III (Detailing)', wire: '.019x.025 Stainless Steel -> .014 TMA', duration: '4 - 6 Months', action: 'Coordinating arches, settling occlusion, and detorque control.' }
          ],
          anchorage: skeletalPattern === 'Class II' 
            ? 'Removable/Fixed functional appliances utilizing dental anchorage to advance the mandible. High mandibular anchorage.'
            : 'Sutural protraction via maxillary expansion (Hyrax) and forehead/chin caps (Face Mask). High skeletal anchor demand.',
          mechanics: skeletalPattern === 'Class II'
            ? '• Twin Block appliance adjusted with 2mm advancement increments monthly. Active wear 22 hrs/day.\n• Stimulate condylar cartilage growth and remodel glenoid fossa.\n• Avoid dental tipping by keeping mandibular incisor capping integrity.'
            : '• Rapid Maxillary Expansion (Hyrax) activated 2 turns/day (0.5mm) for 10-14 days to open midpalatal suture.\n• Maxillary Protraction Face Mask initiated immediately with 350-400g orthopedic force per side, pulling downward and forward 14 hours/day.',
          retention: '• Nighttime wear of a customized Hawley retainer with an acrylic labial bow to hold expansion, or continuous functional wear during retention transition.'
        };

      case 'camouflage':
        return {
          title: 'Dentoalveolar Camouflage Orthodontics Protocol',
          diagnosis: `Dentoalveolar camouflage of Skeletal ${skeletalPattern} relationship (OCI score: ${ociScore}%, ${ociLevel} demand).`,
          bracketSelection: skeletalPattern === 'Class II'
            ? 'MBT 0.022" Prescription: Assign HIGH TORQUE upper incisor brackets (+17°) to resist retrograde root tipping during space closure, and standard lower incisor brackets.'
            : 'MBT 0.022" Prescription: Assign LOW TORQUE upper incisor brackets (+7°) and standard lower incisor brackets to maintain sagittal balance.',
          archwires: [
            { step: 'Leveling & Aligning', wire: '.014 NiTi -> .016 NiTi -> .016x.022 NiTi', duration: '4 - 6 Months', action: 'Resolving dental crowding, correcting rotated teeth, and leveling Curve of Spee.' },
            { step: 'Working / Space Closure', wire: '.019x.025 Stainless Steel with elastics', duration: '6 - 10 Months', action: 'En-masse retraction or anterior consolidation using Class II/III elastics.' },
            { step: 'Finishing & Detailing', wire: '.019x.025 TMA or .014 TMA', duration: '3 - 4 Months', action: 'Individualizing artistic detailing bends, root torquing, and occlusal settling.' }
          ],
          anchorage: skeletalPattern === 'Class II'
            ? 'Maximum anchorage upper arch (e.g. Transpalatal Arch or Nance button) if extractions are indicated, to preserve molar class.'
            : 'Maximum anchorage lower arch (e.g. Lingual Arch) to resist lower molar mesialization during lower incisor retraction.',
          mechanics: skeletalPattern === 'Class II'
            ? `• If lips are protrusive: Extract Maxillary first premolars. Retract canine and anterior segment on a heavy .019x.025 SS wire.\n• Apply light, continuous Class II elastics (3/16", 4.5 oz) to assist canine retraction, maintaining strict control on IMPA (do not exceed 98° IMPA to guard labial bone).`
            : `• If lower arch has severe crowding: Extract Mandibular first premolars (or single lower incisor if localized anterior crowding).\n• Class III elastics (1/4", 4.5 oz) applied on .019x.025 SS wire to guide lower incisor retroclination back to 80° IMPA, establishing dental overjet.`,
          retention: '• Mandibular: Bonded fixed lingual retainer (3-3) to secure lower incisor torque.\n• Maxillary: Essix clear retainer paired with a nighttime Hawley appliance.'
        };

      case 'surgical':
        return {
          title: 'Surgical-Orthodontic (Orthognathic) Prep Protocol',
          diagnosis: `Severe Skeletal ${skeletalPattern} relationship exceeding physiological compensation limits (OCI score: ${ociScore}%).`,
          bracketSelection: 'Standard MBT 0.022" Slot brackets. Normal torque assignment. We avoid compensatory bracket torque since the teeth must be aligned exactly over their native basal bone (decompensated) to maximize surgical movement.',
          archwires: [
            { step: 'Pre-Surgical Leveling', wire: '.014 NiTi -> .016x.022 NiTi -> .019x.025 NiTi', duration: '6 - 9 Months', action: 'Leveling arches, correcting rotations, and flatting Curve of Spee without tipping.' },
            { step: 'Decompensation & Coord.', wire: '.019x.025 Stainless Steel (Surgical Wires)', duration: '4 - 6 Months', action: 'Decompensating incisors (reversing tipping) and coordinating upper/lower arch widths.' },
            { step: 'Post-Surgical Settling', wire: '.014 TMA / light elastics', duration: '3 - 6 Months', action: 'Settling dental occlusion post-surgery, closing localized gaps, and final detailing.' }
          ],
          anchorage: 'Surgical arches require absolute coordination. Pre-surgical wires (.019x.025 SS) must have soldered/brass surgical hooks on every embrasure to facilitate intermaxillary surgical fixation.',
          mechanics: skeletalPattern === 'Class II'
            ? `• Pre-surgical Decompensation: Upright upper incisors (procline back to 104° U1-SN) and upright lower incisors (retrocline back to 90° IMPA). This temporarily increases overjet to allow surgical mandibular advancement.\n• Surgery: Bilateral Sagittal Split Osteotomy (BSSO) to advance the mandible 6-8mm.`
            : `• Pre-surgical Decompensation: Upright lower incisors (procline back to 90° IMPA; current IMPA: ${impaVal}°) and retrocline upper incisors (retrocline back to 104° U1-SN). This increases reverse overjet, maximizing space for surgical correction.\n• Surgery: Le Fort I maxillary advancement (3-5mm) paired with BSSO mandibular setback (3-4mm).`,
          retention: '• Permanent bonded retainers on both upper and lower anterior teeth (3-3) combined with rigid vacuum-formed retainers. Relapse pressure is high as soft tissues adapt to the new skeletal profile.'
        };

      case 'tad':
        return {
          title: 'TAD-Assisted Micro-implant Biomechanics Protocol',
          diagnosis: `Skeletal ${skeletalPattern} with ${verticalPattern} profile. OCI score: ${ociScore}%, utilizing skeletal anchors.`,
          bracketSelection: 'Standard Pre-adjusted MBT 0.022" slots. Allows utilization of micro-implants to carry the load, protecting individual dental units from anchorage loss.',
          archwires: [
            { step: 'Aligning & Leveling', wire: '.014 NiTi -> .016x.022 NiTi', duration: '4 - 5 Months', action: 'Preparing arch slots and aligning teeth to permit stiff working wires.' },
            { step: 'Skeletal Distalization', wire: '.019x.025 Stainless Steel with TAD hookups', duration: '8 - 12 Months', action: 'Distalizing the entire arch or intruding posterior segment using skeletal mini-screws.' },
            { step: 'Finishing & Detailing', wire: '.019x.025 TMA', duration: '3 - 4 Months', action: 'Individualizing details and settling the buccal intercuspation.' }
          ],
          anchorage: 'Absolute skeletal anchorage. Mini-screws bypass dental anchorage entirely, allowing tooth movement in 3 dimensions without unwanted reciprocal forces.',
          mechanics: verticalPattern === 'Hyperdivergent'
            ? '• Place 2 mini-screws (1.6mm x 8mm) in the zygomatic alveolar crests bilaterally, and 2 in the paramedian palatal vault.\n• Deliver 150g intrusive force per side directly to the upper first and second molars to intrude them. This allows mandibular auto-rotation, closing the anterior open bite and reducing FMA.'
            : skeletalPattern === 'Class II'
            ? '• Place 2 mini-screws (2.0mm x 12mm) in the Infrazygomatic Crest (IZC) region.\n• Connect NiTi closed coil springs from the mini-screws to sliding jigs or power arms on a .019x.025 SS wire to distalize the entire maxillary arch, correcting Class II canine and overjet without extractions.'
            : '• Place 2 mini-screws (2.0mm x 12mm) in the Mandibular Buccal Shelf (MBS) region.\n• Direct pull to distalize the lower arch to establish overjet and correct Class III dental relationship.',
          retention: '• Standard fixed lingual 3-3 retainers and clear vacuum retainers. If vertical open bite was corrected, continuous nighttime retainer with vertical posterior bite blocks is advised.'
        };
    }
  };

  const rx = getPrescription();

  // 6. Generate the Markdown clinical text for clipboard export
  const generateClinicalText = () => {
    return `==========================================
ORTHODONTIC CLINICAL TREATMENT PLAN
==========================================
PATIENT INFORMATION:
- Name: ${patientDetails.name || 'Anonymous'}
- Case Number: ${patientDetails.caseNumber || 'N/A'}
- Age: ${patientDetails.age || 'N/A'} yo
- Gender: ${patientDetails.gender || 'N/A'}
- Diagnosis: Skeletal ${skeletalPattern} (${verticalPattern})

OCI INDEX ANALYSIS:
- Overall OCI Score: ${ociScore}%
- Severity Level: ${ociLevel} Compensation
- Skeletal Compensation: ${ociResult.categoryScores[0]?.score || 0} / 20 pts
- Maxillary Dental: ${ociResult.categoryScores[1]?.score || 0} / 15 pts
- Mandibular Dental: ${ociResult.categoryScores[2]?.score || 0} / 20 pts
- Soft Tissue Esthetics: ${ociResult.categoryScores[5]?.score || 0} / 15 pts

SELECTED THERAPEUTIC PATHWAY:
${rx.title.toUpperCase()}
Clinical Indication Level: ${activePathway === 'camouflage' ? camouflageFeasibility : activePathway === 'orthopedic' ? orthopedicFeasibility : activePathway === 'surgical' ? surgicalFeasibility : tadFeasibility}%

DIAGNOSTIC CASE SYNTHESIS:
${rx.diagnosis}

BRACKET PRESCRIPTION & TORQUE SUMMARY:
${rx.bracketSelection}

SUGGESTED ARCHWIRE SEQUENCING SEQUENCE:
${rx.archwires.map(w => `* ${w.step}: ${w.wire} (${w.duration}) -> Intended action: ${w.action}`).join('\n')}

ACTIVE BIOMECHANICS & MOVEMENT GUIDELINES:
${rx.mechanics}

ANCHORAGE CONSTRAINTS:
${rx.anchorage}

RETENTION PROTOCOL:
${rx.retention}

OPERATOR NOTES / SPECIAL DIRECTIVES:
${customNotes || 'None recorded.'}

------------------------------------------
Clinical Director: Dr. Salman MDS
Generated via OCI Orthodontic Decision Engine
==========================================`;
  };

  const handleCopyToClipboard = () => {
    const text = generateClinicalText();
    Clipboard.setString(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
    Alert.alert("Success", "Complete medical treatment plan copied to clipboard. You can now paste this directly into your patient records or EHR.");
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Selector Header */}
        <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
          <View style={tw`flex-row justify-between items-start`}>
            <View>
              <View style={tw`flex-row items-center mb-1`}>
                <Brain size={18} color="#14B8A6" style={tw`mr-2`} />
                <Text style={tw`font-black text-base text-white tracking-tight uppercase`}>
                  Orthodontic Decision Engine
                </Text>
              </View>
              <Text style={tw`text-xs text-slate-400`}>Algorithmic biomechanical staging based on OCI scores</Text>
            </View>
            <View style={tw`bg-[#14B8A6]/10 px-2.5 py-1 rounded-xl border border-[#14B8A6]/20`}>
              <Text style={tw`text-[9px] font-mono font-black text-teal-400 uppercase`}>MDS Suite</Text>
            </View>
          </View>

          {/* Selector */}
          <View style={tw`relative`}>
            <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono`}>Select Case Record</Text>
            <Pressable
              onPress={() => setShowActiveSelect(!showActiveSelect)}
              style={tw`flex-row justify-between items-center bg-black/40 px-4 py-3.5 rounded-2xl border border-white/10`}
            >
              <Text style={tw`text-xs font-black text-slate-200`}>
                {patientDetails.name || 'Anonymous'} ({patientDetails.caseNumber || 'No Case'}) - OCI: {ociScore}%
              </Text>
              <ChevronDown size={14} color="#14B8A6" />
            </Pressable>

            {showActiveSelect && (
              <View style={tw`mt-2 bg-[#0B1020] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50`}>
                {savedAssessments.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedId(item.id);
                      setCustomNotes('');
                      setShowActiveSelect(false);
                    }}
                    style={tw`px-4 py-3.5 border-b border-white/5 flex-row justify-between items-center`}
                  >
                    <Text style={tw`text-xs font-bold text-slate-200`}>
                      {item.patientDetails.name || 'Anonymous'} ({item.patientDetails.caseNumber || 'N/A'})
                    </Text>
                    <Text style={tw`text-xs font-mono font-black text-teal-400`}>
                      OCI: {item.ociResult.totalScore}%
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Clinical Summary Bar */}
        <View style={tw`bg-[#0B1020]/90 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
          <View style={tw`flex-row justify-between items-center border-b border-white/5 pb-2.5`}>
            <View style={tw`flex-row items-center`}>
              <Users size={15} color="#14B8A6" style={tw`mr-2`} />
              <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Case Metrics</Text>
            </View>
            <Text style={tw`text-xs font-mono font-bold text-slate-300`}>Age: {patientDetails.age}y / {patientDetails.gender}</Text>
          </View>

          {/* OCI Visual Severity Gauge */}
          <View style={tw`space-y-3`}>
            <View style={tw`flex-row justify-between items-end`}>
              <View>
                <Text style={tw`text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono`}>OCI Compensation Severity</Text>
                <Text style={tw`text-sm font-black text-white mt-0.5`}>{ociLevel} Compensation</Text>
              </View>
              <View style={[tw`px-3 py-1.5 rounded-xl border`, { borderColor: `${ociColor}30`, backgroundColor: `${ociColor}10` }]}>
                <Text style={[tw`text-sm font-black font-mono`, { color: ociColor }]}>Score: {ociScore}%</Text>
              </View>
            </View>

            {/* Gauge slider segments */}
            <View style={tw`h-3 w-full bg-black/45 rounded-full overflow-hidden flex-row border border-white/5`}>
              <View style={tw`h-full flex-1 bg-green-500`} />
              <View style={tw`h-full flex-1 bg-teal-500`} />
              <View style={tw`h-full flex-1 bg-yellow-500`} />
              <View style={tw`h-full flex-1 bg-orange-500`} />
              <View style={tw`h-full flex-1 bg-red-500`} />
            </View>

            {/* Scale references */}
            <View style={tw`flex-row justify-between text-center`}>
              {['Minimal\n(0-20)', 'Mild\n(21-40)', 'Moderate\n(41-60)', 'Severe\n(61-80)', 'Extreme\n(81-100)'].map((seg, idx) => {
                const isCurrent = 
                  (idx === 0 && ociScore <= 20) ||
                  (idx === 1 && ociScore > 20 && ociScore <= 40) ||
                  (idx === 2 && ociScore > 40 && ociScore <= 60) ||
                  (idx === 3 && ociScore > 60 && ociScore <= 80) ||
                  (idx === 4 && ociScore > 80);
                return (
                  <View key={idx} style={tw`flex-1 items-center`}>
                    <Text style={[tw`text-[8px] leading-tight font-mono font-bold text-center`, isCurrent ? tw`text-teal-400 font-extrabold` : tw`text-slate-500`]}>
                      {seg}
                    </Text>
                    {isCurrent && (
                      <View style={tw`w-1.5 h-1.5 rounded-full bg-teal-400 mt-1`} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Biomechanics Tuning Parameters Panel */}
        <View style={tw`bg-[#0B1020]/90 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
          <View style={tw`flex-row items-center border-b border-white/5 pb-2.5`}>
            <Sliders size={15} color="#14B8A6" style={tw`mr-2`} />
            <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Parameters Calibration</Text>
          </View>

          <View style={tw`flex-row space-x-4`}>
            {/* CVMS */}
            <View style={tw`flex-1`}>
              <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono`}>Vertebral Stage (CVMS)</Text>
              <Pressable
                onPress={() => setShowCvmsSelect(!showCvmsSelect)}
                style={tw`flex-row justify-between items-center bg-black/40 px-3.5 py-3 rounded-2xl border border-white/10`}
              >
                <Text style={tw`text-xs font-bold text-slate-200`}>{cvmsStage}</Text>
                <ChevronDown size={12} color="#14B8A6" />
              </Pressable>
              {showCvmsSelect && (
                <View style={tw`mt-2 bg-[#050814] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50`}>
                  {['CVMS 1 (Pre-Peak)', 'CVMS 2 (Pre-Peak)', 'CVMS 3 (Peak)', 'CVMS 4 (Post-Peak)', 'CVMS 5 (Completed)'].map((st) => (
                    <Pressable
                      key={st}
                      onPress={() => {
                        setCvmsStage(st);
                        setShowCvmsSelect(false);
                      }}
                      style={tw`px-4 py-3 border-b border-white/5`}
                    >
                      <Text style={tw`text-xs text-slate-200 font-bold`}>{st}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Dentition Phase */}
            <View style={tw`flex-1`}>
              <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono`}>Dentition Phase</Text>
              <Pressable
                onPress={() => setShowDentitionSelect(!showDentitionSelect)}
                style={tw`flex-row justify-between items-center bg-black/40 px-3.5 py-3 rounded-2xl border border-white/10`}
              >
                <Text style={tw`text-xs font-bold text-slate-200`}>{dentitionPhase}</Text>
                <ChevronDown size={12} color="#14B8A6" />
              </Pressable>
              {showDentitionSelect && (
                <View style={tw`mt-2 bg-[#050814] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50`}>
                  {['Primary', 'Early Mixed', 'Late Mixed', 'Permanent'].map((dp) => (
                    <Pressable
                      key={dp}
                      onPress={() => {
                        setDentitionPhase(dp);
                        setShowDentitionSelect(false);
                      }}
                      style={tw`px-4 py-3 border-b border-white/5`}
                    >
                      <Text style={tw`text-xs text-slate-200 font-bold`}>{dp} Dentition</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Operator Directives */}
          <View>
            <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono`}>Custom Clinical Directives</Text>
            <TextInput
              value={customNotes}
              onChangeText={setCustomNotes}
              placeholder="Record specific patient biomechanics or anchorage details..."
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
              style={[tw`w-full px-4 py-3 bg-black/45 border border-white/10 rounded-2xl text-white text-xs font-bold`, { minHeight: 70 }]}
            />
          </View>
        </View>

        {/* Dynamic Case Diagnostics Synthesis */}
        <View style={tw`bg-gradient-to-r from-teal-950/20 to-[#0B1020]/40 p-5 rounded-[28px] border border-[#14B8A6]/20 space-y-3`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <Sparkles size={16} color="#22D3EE" style={tw`mr-2`} />
              <Text style={tw`text-[10px] font-bold text-teal-300 uppercase tracking-widest font-mono`}>Diagnostic Synthesis</Text>
            </View>
            <Text style={tw`text-[9px] font-mono font-bold text-[#22D3EE]`}>{skeletalPattern} • {verticalPattern}</Text>
          </View>

          <View style={tw`space-y-2`}>
            {problemList.map((prob, idx) => (
              <View key={idx} style={tw`flex-row items-center bg-black/30 px-3.5 py-2.5 rounded-xl border border-white/5`}>
                <View style={tw`w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2.5`} />
                <Text style={tw`text-xs text-slate-300 font-bold flex-1`}>{prob}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Clinical Decision Matrix (4 Pathways) */}
        <View style={tw`space-y-4`}>
          <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono pl-1`}>
            Clinical Decision Matrix (Therapeutic Pathways)
          </Text>

          {[
            {
              id: 'orthopedic',
              name: 'Orthopedic / Growth modification',
              icon: Clock,
              feasibility: orthopedicFeasibility,
              summary: skeletalPattern === 'Class I' 
                ? 'Skeletal arches aligned. Orthopedic modification is not primary.'
                : isGrowing 
                ? `Highly advised. CVMS is ${cvmsStage}, perfect window to modify ${skeletalPattern} growth.` 
                : 'Skeletal age is post-pubertal. Skeletal sutural remodeling is contraindicated.',
              color: 'emerald'
            },
            {
              id: 'camouflage',
              name: 'Dentoalveolar Camouflage Orthodontics',
              icon: Layers,
              feasibility: camouflageFeasibility,
              summary: ociScore <= 40 
                ? `Highly favorable camouflage. Patient is within secure dentoalveolar limits.` 
                : ociScore <= 60
                ? 'Favorable, but limits are stretched. Strictly supervise lower incisor IMPA and cortical plates.'
                : `Severe risk (OCI: ${ociScore}%). Camouflage carries massive relapse and root resorption hazards.`,
              color: 'teal'
            },
            {
              id: 'surgical',
              name: 'Orthognathic Surgical Correction',
              icon: ShieldCheck,
              feasibility: surgicalFeasibility,
              summary: ociScore > 60 
                ? `Highly recommended (OCI: ${ociScore}%). Decompensation + double-jaw correction represents the optimal outcome.` 
                : 'Skeletal gap resides safely within camouflage limits. Orthognathic surgery is over-treatment.',
              color: 'rose'
            },
            {
              id: 'tad',
              name: 'TAD-Assisted (Micro-implant) Biomechanics',
              icon: Wrench,
              feasibility: tadFeasibility,
              summary: verticalPattern === 'Hyperdivergent'
                ? 'Highly Indicated. Skeletal screws enable posterior molar intrusion to rotate the mandible.'
                : 'Bypasses standard dental anchorage limits to distalize entire dental arches without extraction.',
              color: 'cyan'
            }
          ].map((path) => {
            const isActive = activePathway === path.id;
            const status = getStatusDetails(path.feasibility);
            return (
              <Pressable
                key={path.id}
                onPress={() => setActivePathway(path.id as any)}
                style={tw`bg-[#0B1020]/90 p-5 rounded-[24px] border ${isActive ? 'border-[#14B8A6] bg-[#14B8A6]/5' : 'border-white/5'} shadow-xl space-y-3`}
              >
                <View style={tw`flex-row justify-between items-start`}>
                  <View style={tw`flex-row items-center flex-1 pr-4`}>
                    <View style={tw`w-9 h-9 rounded-xl items-center justify-center mr-3 ${isActive ? 'bg-[#14B8A6]' : 'bg-white/5'}`}>
                      <path.icon size={18} color={isActive ? '#ffffff' : '#94A3B8'} />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-xs font-black text-white uppercase tracking-wide`}>{path.name}</Text>
                      <View style={tw`flex-row items-center mt-1`}>
                        <View style={[tw`px-2 py-0.5 rounded border ${status.style} mr-2`]}>
                          <Text style={tw`text-[8px] font-black uppercase tracking-wider font-mono`}>{status.label}</Text>
                        </View>
                        <Text style={tw`text-[10px] font-bold text-slate-400 font-mono`}>Feasibility: {path.feasibility}%</Text>
                      </View>
                    </View>
                  </View>

                  {/* Radio selector */}
                  <View style={tw`w-4 h-4 rounded-full border ${isActive ? 'border-[#14B8A6]' : 'border-slate-500'} items-center justify-center mt-1`}>
                    {isActive && <View style={tw`w-2 h-2 rounded-full bg-[#14B8A6]`} />}
                  </View>
                </View>

                <Text style={tw`text-xs text-slate-300 leading-normal font-medium`}>{path.summary}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Selected Clinical Pathway Deep-Dive & Recipe Book */}
        <View style={tw`bg-[#0B1020]/90 p-6 rounded-[28px] border border-white/5 shadow-2xl space-y-5`}>
          <View style={tw`border-b border-white/5 pb-3`}>
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center`}>
                <Wrench size={16} color="#14B8A6" style={tw`mr-2`} />
                <Text style={tw`text-xs font-black text-teal-400 uppercase tracking-widest font-mono`}>
                  Pathway Clinical Protocol Setup
                </Text>
              </View>
              <Pressable 
                onPress={handleCopyToClipboard}
                style={tw`flex-row items-center bg-[#14B8A6]/10 px-3 py-1.5 rounded-xl border border-[#14B8A6]/20`}
              >
                <Copy size={12} color="#14B8A6" style={tw`mr-1.5`} />
                <Text style={tw`text-[9px] font-mono font-black text-teal-400 uppercase`}>
                  {copiedSuccess ? 'COPIED!' : 'COPY RX'}
                </Text>
              </Pressable>
            </View>
            <Text style={tw`text-sm font-black text-white mt-2`}>
              {rx.title}
            </Text>
          </View>

          {/* Diagnosis Block */}
          <View style={tw`bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1`}>
            <Text style={tw`text-[8px] text-slate-400 font-black font-mono uppercase tracking-wider`}>Case Diagnosis Target</Text>
            <Text style={tw`text-xs text-slate-200 font-bold leading-normal`}>{rx.diagnosis}</Text>
          </View>

          {/* Torque & Bracket Setup */}
          <View style={tw`bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1`}>
            <Text style={tw`text-[8px] text-teal-400 font-black font-mono uppercase tracking-wider`}>Bracket Selection & Torque Control</Text>
            <Text style={tw`text-xs text-slate-200 font-bold leading-normal`}>{rx.bracketSelection}</Text>
          </View>

          {/* Archwire Sequence Table */}
          <View style={tw`space-y-3`}>
            <Text style={tw`text-[9px] text-slate-400 font-black font-mono uppercase tracking-widest pl-1`}>Clinical Archwire Sequence</Text>
            <View style={tw`space-y-2`}>
              {rx.archwires.map((wire, idx) => (
                <View key={idx} style={tw`flex-row bg-black/45 border border-white/5 p-4 rounded-2xl items-center`}>
                  <View style={tw`w-8 h-8 rounded-xl bg-[#14B8A6]/10 items-center justify-center border border-[#14B8A6]/20 mr-3`}>
                    <Text style={tw`text-xs font-mono font-black text-teal-400`}>T{idx + 1}</Text>
                  </View>
                  <View style={tw`flex-1 space-y-0.5`}>
                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-xs font-black text-white uppercase`}>{wire.step}</Text>
                      <Text style={tw`text-[9px] font-mono font-bold text-teal-400`}>{wire.duration}</Text>
                    </View>
                    <Text style={tw`text-[11px] font-mono font-bold text-slate-300`}>{wire.wire}</Text>
                    <Text style={tw`text-[10px] text-slate-400 leading-normal`}>{wire.action}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Anchorage Strategy */}
          <View style={tw`bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1`}>
            <Text style={tw`text-[8px] text-amber-400 font-black font-mono uppercase tracking-wider`}>Anchorage Maintenance Protocol</Text>
            <Text style={tw`text-xs text-slate-200 font-bold leading-normal`}>{rx.anchorage}</Text>
          </View>

          {/* Biomechanical Guidelines */}
          <View style={tw`bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1`}>
            <Text style={tw`text-[8px] text-cyan-400 font-black font-mono uppercase tracking-wider`}>Orthodontic Force Mechanics</Text>
            <Text style={tw`text-xs text-slate-200 font-bold leading-normal`}>{rx.mechanics}</Text>
          </View>

          {/* Retention Plan */}
          <View style={tw`bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1`}>
            <Text style={tw`text-[8px] text-indigo-400 font-black font-mono uppercase tracking-wider`}>Long-term Retention Protocol</Text>
            <Text style={tw`text-xs text-slate-200 font-bold leading-normal`}>{rx.retention}</Text>
          </View>

          {/* Dynamic Warning Label */}
          {activePathway === 'camouflage' && ociScore > 50 && (
            <View style={tw`bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex-row items-center space-x-3`}>
              <AlertTriangle size={18} color="#EF4444" style={tw`shrink-0`} />
              <View style={tw`flex-1`}>
                <Text style={tw`text-[9px] font-mono font-black text-rose-400 uppercase tracking-widest`}>Skeletal Limit Caution</Text>
                <Text style={tw`text-[11px] text-rose-300 font-medium leading-relaxed mt-0.5`}>
                  Patient resides beyond primary dentoalveolar limits (OCI: {ociScore}%). Planning aggressive camouflage raises root resorption, tooth flaring, and cortical bone fenestration risks. Evaluate lower anterior lingual plate thickness before appliance activation.
                </Text>
              </View>
            </View>
          )}

          {activePathway === 'orthopedic' && !isGrowing && (
            <View style={tw`bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex-row items-center space-x-3`}>
              <AlertTriangle size={18} color="#EF4444" style={tw`shrink-0`} />
              <View style={tw`flex-1`}>
                <Text style={tw`text-[9px] font-mono font-black text-rose-400 uppercase tracking-widest`}>Skeletal Age Contraindication</Text>
                <Text style={tw`text-[11px] text-rose-300 font-medium leading-relaxed mt-0.5`}>
                  Patient is {ageVal}yo in a completed growth stage ({cvmsStage}). Suture manipulation and mandibular advancement are highly unpredictable or ineffective post-pubertal. Dentoalveolar camouflage or orthognathic surgery is clinically indicated.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Diagnostic Copilot Synthesis Custom Note */}
        {customNotes !== '' && (
          <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-5 rounded-[28px] border border-teal-500/20 space-y-2`}>
            <Text style={tw`text-[8px] text-teal-400 font-bold font-mono uppercase tracking-widest`}>Operator Custom Directives</Text>
            <Text style={tw`text-xs text-slate-200 italic leading-normal`}>"{customNotes}"</Text>
          </View>
        )}

      </View>
    </ScrollView>
  );
}
