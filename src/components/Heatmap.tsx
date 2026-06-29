import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { Sparkles, Info, Cpu } from 'lucide-react-native';
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
      case 'green': return 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30';
      case 'yellow': return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
      case 'orange': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'red': return 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30';
      default: return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    }
  };

  return (
    <View style={tw`bg-white/5 p-5 rounded-[32px] border border-white/10 shadow-2xl space-y-6`}>
      
      {/* Header */}
      <View style={tw`border-b border-white/5 pb-4`}>
        <View style={tw`flex-row items-center mb-1`}>
          <Sparkles size={18} color="#14B8A6" style={tw`mr-2`} />
          <Text style={tw`font-black text-base text-white tracking-tight`}>
            Interactive Severity Heatmap
          </Text>
        </View>
        <Text style={tw`text-xs text-slate-400`}>
          Tap highlighted profile nodes to verify dentofacial compensation metrics
        </Text>
      </View>

      {/* Grid Layout */}
      <View style={tw`flex-col space-y-4 items-center w-full`}>
        
        {/* SVG Schematic Face Profile */}
        <View style={tw`flex-row justify-center p-5 bg-black/40 rounded-[24px] border border-white/5 w-full`}>
          <View style={tw`relative w-[200px] h-[240px]`}>
            <Svg width="200" height="240" viewBox="0 0 200 240" style={tw`overflow-visible`}>
              {/* Outline of human profile */}
              <Path
                d="M 20,10 C 60,8 100,20 120,40 C 128,48 135,55 132,65 C 128,78 115,82 118,92 Q 135,100 140,118 C 138,128 118,128 122,138 C 124,142 135,148 132,156 Q 112,168 112,174 C 112,182 128,190 122,202 Q 118,210 98,214 Q 58,222 20,220"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2"
              />

              {/* Nose Accent */}
              <Path d="M 118,92 Q 135,100 140,118" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

              {/* Dentition Maxilla */}
              <Path d="M 80,120 Q 95,120 105,125" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <Path d="M 80,155 Q 95,155 102,150" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />

              {/* Hotspot Zones with touch handlers */}
              
              {/* Soft Tissue */}
              <G>
                <Path
                  d="M 132,65 Q 118,92 118,92 Q 142,108 140,118 Q 118,128 122,138 Q 135,148 132,156 Q 112,168 112,174 Q 128,190 122,202"
                  fill="none"
                  stroke={getHexColor(severityMap.softTissue)}
                  strokeWidth={selectedZone === 'softTissue' ? 6 : 3.5}
                  opacity={0.9}
                />
                <Circle cx="132" cy="118" r="5" fill={getHexColor(severityMap.softTissue)} stroke="#ffffff" strokeWidth="1" />
              </G>

              {/* Upper Incisors */}
              <G>
                <Line
                  x1="105" y1="125" x2="114" y2="137"
                  stroke={getHexColor(severityMap.upperIncisors)}
                  strokeWidth={selectedZone === 'upperIncisors' ? 8 : 4.5}
                  strokeLinecap="round"
                />
                <Circle cx="109" cy="131" r="5" fill={getHexColor(severityMap.upperIncisors)} stroke="#ffffff" strokeWidth="1" />
              </G>

              {/* Lower Incisors */}
              <G>
                <Line
                  x1="102" y1="150" x2="111" y2="138"
                  stroke={getHexColor(severityMap.lowerIncisors)}
                  strokeWidth={selectedZone === 'lowerIncisors' ? 8 : 4.5}
                  strokeLinecap="round"
                />
                <Circle cx="106" cy="144" r="5" fill={getHexColor(severityMap.lowerIncisors)} stroke="#ffffff" strokeWidth="1" />
              </G>

              {/* Occlusion */}
              <G>
                <Path
                  d="M 85,134 L 102,134 Q 106,134 108,137"
                  fill="none"
                  stroke={getHexColor(severityMap.occlusion)}
                  strokeWidth={selectedZone === 'occlusion' ? 5 : 3.5}
                />
                <Circle cx="94" cy="134" r="5" fill={getHexColor(severityMap.occlusion)} stroke="#ffffff" strokeWidth="1" />
              </G>

              {/* Transverse */}
              <G>
                <Path
                  d="M 60,110 Q 75,120 70,160"
                  fill="none"
                  stroke={getHexColor(severityMap.transverse)}
                  strokeWidth={selectedZone === 'transverse' ? 5 : 2.5}
                  strokeDasharray="4,3"
                />
                <Circle cx="68" cy="135" r="5" fill={getHexColor(severityMap.transverse)} stroke="#ffffff" strokeWidth="1" />
              </G>

              <SvgText x="30" y="105" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">Skeletal Profile</SvgText>
              <SvgText x="145" y="75" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">Ricketts E-Line</SvgText>
            </Svg>

            {/* Absolute-positioned safe Pressable overlays with 44px mobile touch targets & zero DOM warnings */}
            <Pressable
              onPress={() => setSelectedZone('softTissue')}
              style={[
                tw`absolute w-11 h-11 rounded-full items-center justify-center cursor-pointer`,
                { left: 132 - 22, top: 118 - 22 }
              ]}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: true }}
            >
              <View style={[tw`w-2 h-2 rounded-full bg-transparent`, selectedZone === 'softTissue' && tw`bg-white border border-black/30 w-2.5 h-2.5 shadow-sm`]} />
            </Pressable>

            <Pressable
              onPress={() => setSelectedZone('upperIncisors')}
              style={[
                tw`absolute w-11 h-11 rounded-full items-center justify-center cursor-pointer`,
                { left: 109 - 22, top: 131 - 22 }
              ]}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: true }}
            >
              <View style={[tw`w-2 h-2 rounded-full bg-transparent`, selectedZone === 'upperIncisors' && tw`bg-white border border-black/30 w-2.5 h-2.5 shadow-sm`]} />
            </Pressable>

            <Pressable
              onPress={() => setSelectedZone('lowerIncisors')}
              style={[
                tw`absolute w-11 h-11 rounded-full items-center justify-center cursor-pointer`,
                { left: 106 - 22, top: 144 - 22 }
              ]}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: true }}
            >
              <View style={[tw`w-2 h-2 rounded-full bg-transparent`, selectedZone === 'lowerIncisors' && tw`bg-white border border-black/30 w-2.5 h-2.5 shadow-sm`]} />
            </Pressable>

            <Pressable
              onPress={() => setSelectedZone('occlusion')}
              style={[
                tw`absolute w-11 h-11 rounded-full items-center justify-center cursor-pointer`,
                { left: 94 - 22, top: 134 - 22 }
              ]}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: true }}
            >
              <View style={[tw`w-2 h-2 rounded-full bg-transparent`, selectedZone === 'occlusion' && tw`bg-white border border-black/30 w-2.5 h-2.5 shadow-sm`]} />
            </Pressable>

            <Pressable
              onPress={() => setSelectedZone('transverse')}
              style={[
                tw`absolute w-11 h-11 rounded-full items-center justify-center cursor-pointer`,
                { left: 68 - 22, top: 135 - 22 }
              ]}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: true }}
            >
              <View style={[tw`w-2 h-2 rounded-full bg-transparent`, selectedZone === 'transverse' && tw`bg-white border border-black/30 w-2.5 h-2.5 shadow-sm`]} />
            </Pressable>
          </View>
        </View>

        {/* Selected Zone Info Panel */}
        <View style={tw`w-full`}>
          {selectedZone ? (
            <View style={tw`bg-black/30 p-5 rounded-[24px] border border-white/10 space-y-4`}>
              <View style={tw`flex-row items-center justify-between border-b border-white/5 pb-3`}>
                <Text style={tw`font-extrabold text-sm text-white`}>
                  {zoneMetadata[selectedZone].title}
                </Text>
                <View style={tw`px-3 py-1 rounded-full border ${getBGEffectClass(severityMap[selectedZone])}`}>
                  <Text style={tw`text-[9px] font-black uppercase tracking-wider`}>
                    {severityMap[selectedZone]}
                  </Text>
                </View>
              </View>
              
              <Text style={tw`text-xs text-slate-300 leading-relaxed`}>
                {zoneMetadata[selectedZone].description}
              </Text>

              <View style={tw`space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-[#14B8A6] uppercase tracking-widest font-mono`}>Metrics In Focus</Text>
                <View style={tw`space-y-1.5`}>
                  {zoneMetadata[selectedZone].metrics.map((met, idx) => (
                    <View key={idx} style={tw`flex-row items-center bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/5`}>
                      <View style={tw`w-1.5 h-1.5 rounded-full bg-teal-400 mr-2.5`} />
                      <Text style={tw`text-xs font-mono text-slate-300`}>{met}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={tw`border-t border-white/5 pt-3.5`}>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Clinical Guidance</Text>
                <Text style={tw`text-xs text-teal-300 italic mt-1.5 leading-relaxed`}>
                  {zoneMetadata[selectedZone].clinicalSignificance}
                </Text>
              </View>
            </View>
          ) : (
            <View style={tw`bg-black/30 p-6 rounded-[24px] border border-white/5 items-center justify-center min-h-[200px]`}>
              <Info size={24} color="#94a3b8" />
              <Text style={tw`text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider`}>Tap profile nodes to view parameters</Text>
            </View>
          )}
        </View>

      </View>
    </View>
  );
}
