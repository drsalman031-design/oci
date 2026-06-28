import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { Sparkles, Info } from 'lucide-react-native';
import tw from 'twrnc';
import { OciResult, CephalometricInput } from '../types';

interface HeatmapProps {
  severityMap: OciResult['severityMap'];
  input: CephalometricInput;
}

type ZoneKey = 'upperIncisors' | 'lowerIncisors' | 'softTissue' | 'occlusion' | 'transverse';

export default function Heatmap({ severityMap, input }: HeatmapProps) {
  const [selectedZone, setSelectedZone] = useState<ZoneKey | null>('upperIncisors');

  const zoneMetadata: Record<ZoneKey, {
    title: string;
    metrics: string[];
    description: string;
    clinicalSignificance: string;
  }> = {
    upperIncisors: {
      title: 'Upper Incisor System',
      metrics: [
        `U1-SN: ${input.u1Sn !== '' && input.u1Sn !== undefined ? input.u1Sn + '°' : 'N/A'} (Normal: 104°)`,
        `U1-NA (°): ${input.u1NaDeg !== '' && input.u1NaDeg !== undefined ? input.u1NaDeg + '°' : 'N/A'} (Normal: 22°)`,
        `U1-NA (mm): ${input.u1NaMm !== '' && input.u1NaMm !== undefined ? input.u1NaMm + 'mm' : 'N/A'} (Normal: 4mm)`
      ],
      description: 'Maxillary dentoalveolar position. Proclination or retroclination represents dental attempts to mask skeletal anteroposterior gaps.',
      clinicalSignificance: 'Proclined incisors limit surgical advancement. Retroclined incisors in Class II cases mask the severity of mandibular retrognathia.'
    },
    lowerIncisors: {
      title: 'Lower Incisor System',
      metrics: [
        `IMPA: ${input.impa !== '' && input.impa !== undefined ? input.impa + '°' : 'N/A'} (Normal: 90°)`,
        `L1-NB (°): ${input.l1NbDeg !== '' && input.l1NbDeg !== undefined ? input.l1NbDeg + '°' : 'N/A'} (Normal: 25°)`,
        `L1-NB (mm): ${input.l1NbMm !== '' && input.l1NbMm !== undefined ? input.l1NbMm + 'mm' : 'N/A'} (Normal: 4mm)`
      ],
      description: 'Mandibular dentoalveolar inclination. This is a critical factor in determining non-surgical camouflage limits.',
      clinicalSignificance: 'An IMPA > 98° in Class II or IMPA < 82° in Class III represents high natural compensation. Over-tipping compromises periodontal support.'
    },
    softTissue: {
      title: 'Soft Tissue Profile',
      metrics: [
        `Upper Lip to E-Line: ${input.upperLipELine !== '' && input.upperLipELine !== undefined ? input.upperLipELine + 'mm' : 'N/A'} (Normal: -2mm)`,
        `Lower Lip to E-Line: ${input.lowerLipELine !== '' && input.lowerLipELine !== undefined ? input.lowerLipELine + 'mm' : 'N/A'} (Normal: 0mm)`,
        `Nasolabial Angle: ${input.nasolabialAngle !== '' && input.nasolabialAngle !== undefined ? input.nasolabialAngle + '°' : 'N/A'} (Normal: 102°)`,
        `Facial Convexity: ${input.facialConvexity !== '' && input.facialConvexity !== undefined ? input.facialConvexity + '°' : 'N/A'} (Normal: 12°)`
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
        `Deep bite / Open bite: ${input.deepBite !== '' && input.deepBite !== undefined ? input.deepBite + 'mm' : '0mm'} / ${input.openBite !== '' && input.openBite !== undefined ? input.openBite + 'mm' : '0mm'}`,
        `Curve of Spee: ${input.curveOfSpee !== '' && input.curveOfSpee !== undefined ? input.curveOfSpee + 'mm' : 'N/A'} (Normal: < 1.5mm)`
      ],
      description: 'Inter-arch sagittal and vertical interlock metrics.',
      clinicalSignificance: 'Mismatched molar vs skeletal profiles (Class I molar on Class III skeleton) confirm massive dentoalveolar masking.'
    },
    transverse: {
      title: 'Transverse Arch Relations',
      metrics: [
        `Posterior Crossbite: ${input.posteriorCrossbite || 'None'}`,
        `Arch Width Difference: ${input.archWidthDifference !== '' && input.archWidthDifference !== undefined ? input.archWidthDifference + 'mm' : '0mm'}`,
        `Dental Midline Dev: ${input.dentalMidlineDev !== '' && input.dentalMidlineDev !== undefined ? input.dentalMidlineDev + 'mm' : '0mm'}`
      ],
      description: 'Coronal/transverse dimensions showing dental expansion or narrowing compensating for jaw skeletal width mismatches.',
      clinicalSignificance: 'Skeletal Class III often features a constricted maxilla compensated by dental flaring (or crossbite if uncompensated).'
    }
  };

  const getHexColor = (colorKey: 'green' | 'yellow' | 'orange' | 'red') => {
    switch (colorKey) {
      case 'green': return '#10b981';
      case 'yellow': return '#f59e0b';
      case 'orange': return '#ea580c';
      case 'red': return '#ef4444';
      default: return '#10b981';
    }
  };

  const getBGEffectClass = (colorKey: 'green' | 'yellow' | 'orange' | 'red') => {
    switch (colorKey) {
      case 'green': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'yellow': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'orange': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'red': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default: return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
  };

  return (
    <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6`}>
      
      {/* Header */}
      <View style={tw`border-b border-slate-100 dark:border-slate-850 pb-4`}>
        <View style={tw`flex-row items-center mb-1`}>
          <Sparkles size={18} color="#0d9488" style={tw`mr-1.5`} />
          <Text style={tw`font-extrabold text-base text-slate-800 dark:text-slate-100`}>
            Interactive Severity Heatmap
          </Text>
        </View>
        <Text style={tw`text-xs text-slate-400`}>
          Tap highlighted skeletal or dental zones on the profile to inspect parameters
        </Text>
      </View>

      {/* Grid Layout */}
      <View style={tw`flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6 items-center`}>
        
        {/* SVG Schematic Face Profile */}
        <View style={tw`flex-row justify-center p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 w-full md:w-1/2`}>
          <Svg width="220" height="250" viewBox="0 0 200 240" style={tw`overflow-visible`}>
            {/* Outline of human profile */}
            <Path
              d="M 20,10 C 60,8 100,20 120,40 C 128,48 135,55 132,65 C 128,78 115,82 118,92 C 122,102 142,108 140,118 C 138,128 118,128 122,138 C 124,142 135,148 132,156 C 128,168 112,168 112,174 C 112,182 128,190 122,202 C 118,210 98,214 78,218 C 58,222 20,222 20,220"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2.5"
            />

            {/* Nose Accent */}
            <Path d="M 118,92 Q 135,100 140,118" fill="none" stroke="#94a3b8" strokeWidth="1" />

            {/* Dentition Maxilla */}
            <Path d="M 80,120 Q 95,120 105,125" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <Path d="M 80,155 Q 95,155 102,150" fill="none" stroke="#e2e8f0" strokeWidth="3" />

            {/* Hotspot Zones with touch handlers */}
            
            {/* Soft Tissue */}
            <G onPress={() => setSelectedZone('softTissue')}>
              <Path
                d="M 132,65 Q 118,92 118,92 Q 142,108 140,118 Q 118,128 122,138 Q 135,148 132,156 Q 112,168 112,174 Q 128,190 122,202"
                fill="none"
                stroke={getHexColor(severityMap.softTissue)}
                strokeWidth={selectedZone === 'softTissue' ? 7 : 4}
                opacity={0.85}
              />
              <Circle cx="132" cy="118" r="5" fill={getHexColor(severityMap.softTissue)} stroke="#ffffff" strokeWidth="1" />
            </G>

            {/* Upper Incisors */}
            <G onPress={() => setSelectedZone('upperIncisors')}>
              <Line
                x1="105" y1="125" x2="114" y2="137"
                stroke={getHexColor(severityMap.upperIncisors)}
                strokeWidth={selectedZone === 'upperIncisors' ? 9 : 5}
                strokeLinecap="round"
              />
              <Circle cx="109" cy="131" r="5" fill={getHexColor(severityMap.upperIncisors)} stroke="#ffffff" strokeWidth="1" />
            </G>

            {/* Lower Incisors */}
            <G onPress={() => setSelectedZone('lowerIncisors')}>
              <Line
                x1="102" y1="150" x2="111" y2="138"
                stroke={getHexColor(severityMap.lowerIncisors)}
                strokeWidth={selectedZone === 'lowerIncisors' ? 9 : 5}
                strokeLinecap="round"
              />
              <Circle cx="106" cy="144" r="5" fill={getHexColor(severityMap.lowerIncisors)} stroke="#ffffff" strokeWidth="1" />
            </G>

            {/* Occlusion */}
            <G onPress={() => setSelectedZone('occlusion')}>
              <Path
                d="M 85,134 L 102,134 Q 106,134 108,137"
                fill="none"
                stroke={getHexColor(severityMap.occlusion)}
                strokeWidth={selectedZone === 'occlusion' ? 6 : 4}
              />
              <Circle cx="94" cy="134" r="5" fill={getHexColor(severityMap.occlusion)} stroke="#ffffff" strokeWidth="1" />
            </G>

            {/* Transverse */}
            <G onPress={() => setSelectedZone('transverse')}>
              <Path
                d="M 60,110 Q 75,120 70,160"
                fill="none"
                stroke={getHexColor(severityMap.transverse)}
                strokeWidth={selectedZone === 'transverse' ? 6 : 3}
                strokeDasharray="4,3"
              />
              <Circle cx="68" cy="135" r="5" fill={getHexColor(severityMap.transverse)} stroke="#ffffff" strokeWidth="1" />
            </G>

            <SvgText x="35" y="105" fill="#94a3b8" fontSize="8" fontFamily="monospace">Skeletal Base</SvgText>
            <SvgText x="145" y="75" fill="#94a3b8" fontSize="8" fontFamily="monospace">E-Line</SvgText>
          </Svg>
        </View>

        {/* Selected Zone Info Panel */}
        <View style={tw`w-full md:w-1/2`}>
          {selectedZone ? (
            <View style={tw`bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4`}>
              <View style={tw`flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2`}>
                <Text style={tw`font-extrabold text-sm text-slate-800 dark:text-slate-100`}>
                  {zoneMetadata[selectedZone].title}
                </Text>
                <View style={tw`px-2 py-0.5 rounded-full border ${getBGEffectClass(severityMap[selectedZone])}`}>
                  <Text style={tw`text-[9px] font-black uppercase`}>
                    {severityMap[selectedZone]}
                  </Text>
                </View>
              </View>
              
              <Text style={tw`text-xs text-slate-500 leading-relaxed`}>
                {zoneMetadata[selectedZone].description}
              </Text>

              <View style={tw`space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider`}>Metrics In Focus</Text>
                <View style={tw`space-y-1.5`}>
                  {zoneMetadata[selectedZone].metrics.map((met, idx) => (
                    <View key={idx} style={tw`flex-row items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-150 dark:border-slate-850`}>
                      <View style={tw`w-1.5 h-1.5 rounded-full bg-teal-500 mr-2`} />
                      <Text style={tw`text-xs font-mono text-slate-700 dark:text-slate-300`}>{met}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={tw`border-t border-slate-200 dark:border-slate-800 pt-3`}>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider`}>Clinical Guidance</Text>
                <Text style={tw`text-xs text-slate-600 dark:text-slate-300 italic mt-1 leading-relaxed`}>
                  {zoneMetadata[selectedZone].clinicalSignificance}
                </Text>
              </View>
            </View>
          ) : (
            <View style={tw`bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 items-center justify-center min-h-[220px]`}>
              <Info size={24} color="#94a3b8" />
              <Text style={tw`text-sm font-semibold text-slate-400 mt-2`}>Tap on any hotspot to show diagnostics</Text>
            </View>
          )}
        </View>

      </View>
    </View>
  );
}
