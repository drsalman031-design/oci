import { useState } from 'react';
import { OciResult, CephalometricInput } from '../types';
import { 
  Info, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface HeatmapProps {
  severityMap: OciResult['severityMap'];
  input: CephalometricInput;
}

type ZoneKey = 'upperIncisors' | 'lowerIncisors' | 'softTissue' | 'occlusion' | 'transverse';

export default function Heatmap({ severityMap, input }: HeatmapProps) {
  const [selectedZone, setSelectedZone] = useState<ZoneKey | null>('upperIncisors');

  // Human-readable labels for interactive hotspot zones
  const zoneMetadata: Record<ZoneKey, {
    title: string;
    metrics: string[];
    description: string;
    clinicalSignificance: string;
  }> = {
    upperIncisors: {
      title: 'Upper Incisor System',
      metrics: [
        `U1-SN: ${input.u1Sn !== '' ? input.u1Sn + '°' : 'N/A'} (Normal: 104°)`,
        `U1-NA (°): ${input.u1NaDeg !== '' ? input.u1NaDeg + '°' : 'N/A'} (Normal: 22°)`,
        `U1-NA (mm): ${input.u1NaMm !== '' ? input.u1NaMm + 'mm' : 'N/A'} (Normal: 4mm)`
      ],
      description: 'Maxillary dentoalveolar position. Proclination or retroclination represents dental attempts to mask skeletal anteroposterior gaps.',
      clinicalSignificance: 'Proclined incisors limit surgical advancement. Retroclined incisors in Class II cases mask the severity of mandibular retrognathia.'
    },
    lowerIncisors: {
      title: 'Lower Incisor System',
      metrics: [
        `IMPA: ${input.impa !== '' ? input.impa + '°' : 'N/A'} (Normal: 90°)`,
        `L1-NB (°): ${input.l1NbDeg !== '' ? input.l1NbDeg + '°' : 'N/A'} (Normal: 25°)`,
        `L1-NB (mm): ${input.l1NbMm !== '' ? input.l1NbMm + 'mm' : 'N/A'} (Normal: 4mm)`
      ],
      description: 'Mandibular dentoalveolar inclination. This is a critical factor in determining non-surgical camouflage limits.',
      clinicalSignificance: 'An IMPA > 98° in Class II or IMPA < 82° in Class III represents high natural compensation. Over-tipping compromises periodontal support.'
    },
    softTissue: {
      title: 'Soft Tissue Profile',
      metrics: [
        `Upper Lip to E-Line: ${input.upperLipELine !== '' ? input.upperLipELine + 'mm' : 'N/A'} (Normal: -2mm)`,
        `Lower Lip to E-Line: ${input.lowerLipELine !== '' ? input.lowerLipELine + 'mm' : 'N/A'} (Normal: 0mm)`,
        `Nasolabial Angle: ${input.nasolabialAngle !== '' ? input.nasolabialAngle + '°' : 'N/A'} (Normal: 102°)`,
        `Facial Convexity: ${input.facialConvexity !== '' ? input.facialConvexity + '°' : 'N/A'} (Normal: 12°)`
      ],
      description: 'Soft tissue envelope and profile draping. Shows the clinical appearance of lips relative to Ricketts E-Line.',
      clinicalSignificance: 'High dental compensation may mask bad bony profiles, but can cause flat upper lips (retroclined U1) or excessively protruded lower lips.'
    },
    occlusion: {
      title: 'Occlusion & Vertical relations',
      metrics: [
        `Molar Relation: ${input.molarRelation || 'N/A'}`,
        `Canine Relation: ${input.canineRelation || 'N/A'}`,
        `Crossbite: ${input.crossbite || 'N/A'}`,
        `Deep bite / Open bite: ${input.deepBite !== '' ? input.deepBite + 'mm' : '0mm'} / ${input.openBite !== '' ? input.openBite + 'mm' : '0mm'}`,
        `Curve of Spee: ${input.curveOfSpee !== '' ? input.curveOfSpee + 'mm' : 'N/A'} (Normal: < 1.5mm)`
      ],
      description: 'Inter-arch sagittal and vertical interlock metrics.',
      clinicalSignificance: 'Mismatched molar vs skeletal profiles (Class I molar on Class III skeleton) confirm massive dentoalveolar masking.'
    },
    transverse: {
      title: 'Transverse Arch Relations',
      metrics: [
        `Posterior Crossbite: ${input.posteriorCrossbite || 'None'}`,
        `Arch Width Difference: ${input.archWidthDifference !== '' ? input.archWidthDifference + 'mm' : '0mm'}`,
        `Dental Midline Dev: ${input.dentalMidlineDev !== '' ? input.dentalMidlineDev + 'mm' : '0mm'}`
      ],
      description: 'Coronal/transverse dimensions showing dental expansion or narrowing compensating for jaw skeletal width mismatches.',
      clinicalSignificance: 'Skeletal Class III often features a constricted maxilla compensated by dental flaring (or crossbite if uncompensated).'
    }
  };

  const getHexColor = (colorKey: 'green' | 'yellow' | 'orange' | 'red') => {
    switch (colorKey) {
      case 'green': return '#10b981'; // Emerald
      case 'yellow': return '#f59e0b'; // Amber/Yellow
      case 'orange': return '#ea580c'; // Orange
      case 'red': return '#ef4444'; // Red
    }
  };

  const getBGEffectClass = (colorKey: 'green' | 'yellow' | 'orange' | 'red') => {
    switch (colorKey) {
      case 'green': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'yellow': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'orange': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'red': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <span>Interactive Severity Heatmap</span>
          </h2>
          <p className="text-xs text-slate-500">Click highlighted skeletal or dental zones on the face profile to inspect parameters</p>
        </div>
        <div className="flex space-x-3 text-xs font-mono">
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> <span className="text-slate-500">Minimal</span></span>
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> <span className="text-slate-500">Mild</span></span>
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> <span className="text-slate-500">Mod</span></span>
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> <span className="text-slate-500">Severe</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: SVG Schematic Profile Face & Teeth */}
        <div className="flex justify-center p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl relative border border-slate-100 dark:border-slate-800">
          <svg className="w-full max-w-[280px] h-auto overflow-visible select-none" viewBox="0 0 200 240">
            {/* Outline of human profile (Schematic silhouette) */}
            <path
              d="M 20,10 C 60,8 100,20 120,40 C 128,48 135,55 132,65 C 128,78 115,82 118,92 C 122,102 142,108 140,118 C 138,128 118,128 122,138 C 124,142 135,148 132,156 C 128,168 112,168 112,174 C 112,182 128,190 122,202 C 118,210 98,214 78,218 C 58,222 20,222 20,220"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              className="dark:stroke-slate-800"
              strokeLinecap="round"
            />

            {/* Nose Profile Accent */}
            <path d="M 118,92 Q 135,100 140,118" fill="none" stroke="#94a3b8" strokeWidth="1" className="dark:stroke-slate-700" />

            {/* DENTITION SCHEMATIC */}
            {/* Maxilla base */}
            <path d="M 80,120 Q 95,120 105,125" fill="none" stroke="#e2e8f0" strokeWidth="3" className="dark:stroke-slate-800" />
            {/* Mandible base */}
            <path d="M 80,155 Q 95,155 102,150" fill="none" stroke="#e2e8f0" strokeWidth="3" className="dark:stroke-slate-800" />

            {/* HOTSPOT ZONES */}

            {/* 1. SOFT TISSUE PROFILE ZONE */}
            <g className="cursor-pointer" onClick={() => setSelectedZone('softTissue')}>
              {/* Profile soft envelope glowing outline */}
              <path
                d="M 132,65 Q 118,92 118,92 Q 142,108 140,118 Q 118,128 122,138 Q 135,148 132,156 Q 112,168 112,174 Q 128,190 122,202"
                fill="none"
                stroke={getHexColor(severityMap.softTissue)}
                strokeWidth={selectedZone === 'softTissue' ? '6' : '3'}
                className="opacity-80 transition hover:opacity-100"
              />
              <circle cx="132" cy="118" r="8" fill={getHexColor(severityMap.softTissue)} className="opacity-40 animate-ping" />
              <circle cx="132" cy="118" r="5" fill={getHexColor(severityMap.softTissue)} className="stroke-white dark:stroke-slate-900" />
            </g>

            {/* 2. UPPER INCISOR ZONE */}
            <g className="cursor-pointer" onClick={() => setSelectedZone('upperIncisors')}>
              {/* Upper incisor wedge */}
              <line
                x1="105" y1="125" x2="114" y2="137"
                stroke={getHexColor(severityMap.upperIncisors)}
                strokeWidth={selectedZone === 'upperIncisors' ? '9' : '5'}
                strokeLinecap="round"
                className="transition-all"
              />
              <circle cx="109" cy="131" r="5" fill={getHexColor(severityMap.upperIncisors)} className="stroke-white dark:stroke-slate-900" />
            </g>

            {/* 3. LOWER INCISOR ZONE */}
            <g className="cursor-pointer" onClick={() => setSelectedZone('lowerIncisors')}>
              {/* Lower incisor wedge */}
              <line
                x1="102" y1="150" x2="111" y2="138"
                stroke={getHexColor(severityMap.lowerIncisors)}
                strokeWidth={selectedZone === 'lowerIncisors' ? '9' : '5'}
                strokeLinecap="round"
                className="transition-all"
              />
              <circle cx="106" cy="144" r="5" fill={getHexColor(severityMap.lowerIncisors)} className="stroke-white dark:stroke-slate-900" />
            </g>

            {/* 4. OCCLUSION ZONE */}
            <g className="cursor-pointer" onClick={() => setSelectedZone('occlusion')}>
              {/* Molar occlusion zone */}
              <path
                d="M 85,134 L 102,134 Q 106,134 108,137"
                fill="none"
                stroke={getHexColor(severityMap.occlusion)}
                strokeWidth={selectedZone === 'occlusion' ? '6' : '4'}
                className="transition-all"
              />
              <circle cx="94" cy="134" r="5" fill={getHexColor(severityMap.occlusion)} className="stroke-white dark:stroke-slate-900" />
            </g>

            {/* 5. TRANSVERSE ARCH WIDTH ZONE */}
            <g className="cursor-pointer" onClick={() => setSelectedZone('transverse')}>
              {/* Lateral coronal arc representing width discrepancy */}
              <path
                d="M 60,110 Q 75,120 70,160"
                fill="none"
                stroke={getHexColor(severityMap.transverse)}
                strokeWidth={selectedZone === 'transverse' ? '6' : '3'}
                strokeDasharray="4,3"
                className="transition-all"
              />
              <circle cx="68" cy="135" r="5" fill={getHexColor(severityMap.transverse)} className="stroke-white dark:stroke-slate-900" />
            </g>

            {/* Label overlays directly on SVG */}
            <text x="35" y="105" className="fill-slate-400 dark:fill-slate-600 font-mono text-[7px]">Skeletal Base</text>
            <text x="145" y="75" className="fill-slate-400 dark:fill-slate-600 font-mono text-[7px] text-right">E-Line</text>
          </svg>
        </div>

        {/* Right: Selected Zone Specific Metrics Card */}
        <div className="space-y-4">
          {selectedZone ? (
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 min-h-[220px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    {zoneMetadata[selectedZone].title}
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBGEffectClass(severityMap[selectedZone])}`}>
                    {severityMap[selectedZone].toUpperCase()}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5">
                  {zoneMetadata[selectedZone].description}
                </p>

                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metrics In Focus</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {zoneMetadata[selectedZone].metrics.map((met, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        <span>{met}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3 mt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Guidance</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-1 leading-relaxed">
                  {zoneMetadata[selectedZone].clinicalSignificance}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center min-h-[220px]">
              <div className="text-center text-slate-400 space-y-1">
                <Info className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-medium">Click on any hotspot to show diagnostics</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
