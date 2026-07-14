import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polygon, Line, Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import tw from 'twrnc';
import { CategoryScore } from '../types';

const SvgPolygon = Polygon as any;
const SvgLine = Line as any;
const SvgCircle = Circle as any;

interface SvgChartsProps {
  categoryScores: CategoryScore[];
}

export default function SvgCharts({ categoryScores }: SvgChartsProps) {
  const numPoints = categoryScores.length;
  const radius = 100;
  const centerX = 150;
  const centerY = 150;

  const getCoordinates = (index: number, percentage: number) => {
    const angle = (Math.PI * 2 / numPoints) * index - Math.PI / 2;
    const r = radius * percentage;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridOctagons = gridLevels.map((level) => {
    const points: string[] = [];
    for (let i = 0; i < numPoints; i++) {
      const { x, y } = getCoordinates(i, level);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  });

  const scorePoints = categoryScores.map((cat, i) => {
    const ratio = cat.score / cat.maxScore;
    const pct = Math.max(ratio, 0.05);
    const { x, y } = getCoordinates(i, pct);
    return `${x},${y}`;
  }).join(' ');

  const totalScore = categoryScores.reduce((sum, item) => sum + item.score, 0);

  const getClinicalColor = (name: string) => {
    switch (name) {
      case 'Skeletal Compensation': return '#FFB300';
      case 'Maxillary Dental Compensation': return '#00E5FF';
      case 'Mandibular Dental Compensation': return '#22D3EE';
      case 'Interincisal Relationship': return '#A855F7';
      case 'Overjet/Overbite Compensation': return '#FF4D4D';
      case 'Soft Tissue Compensation': return '#EC4899';
      case 'Overall Harmony/Compensation': return '#00FF88';
      default: return '#00E5FF';
    }
  };

  return (
    <View style={tw`flex-col space-y-6 w-full`}>
      
      {/* Radar Chart Panel */}
      <View style={tw`w-full bg-white/5 p-5 pb-[24px] rounded-[28px] border border-white/10 shadow-2xl items-center`}>
        <Text style={tw`text-[16px] md:text-[18px] font-black text-white tracking-tight leading-snug self-start mb-1`}>
          Orthodontic Dimension Profile
        </Text>
        <Text style={tw`text-xs text-slate-400 leading-relaxed self-start mb-6`}>
          Radar representation of OCI values across skeletal, dental, and soft-tissue dimensions.
        </Text>
        
        <View style={tw`w-full max-w-[210px] md:max-w-[260px] aspect-square items-center justify-center`}>
          <Svg width="100%" height="100%" viewBox="0 0 300 300" style={tw`overflow-visible`}>
            <Defs>
              <RadialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.35" />
                <Stop offset="100%" stopColor="#22D3EE" stopOpacity="0.02" />
              </RadialGradient>
            </Defs>

            {/* Grid Octagons */}
            {gridOctagons.map((points, idx) => (
              <SvgPolygon
                key={idx}
                points={points}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
                strokeDasharray={idx < 3 ? '4,4' : undefined}
              />
            ))}

            {/* Axes Lines */}
            {categoryScores.map((_, i) => {
              const { x, y } = getCoordinates(i, 1.0);
              return (
                <SvgLine
                  key={i}
                  x1={centerX}
                  y1={centerY}
                  x2={x}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
              );
            })}

            {/* score area */}
            <SvgPolygon
              points={scorePoints}
              fill="url(#radarGlow)"
              stroke="#00E5FF"
              strokeWidth="2.5"
            />

            {/* score vertices dots with matching clinical colors */}
            {categoryScores.map((cat, i) => {
              const ratio = cat.score / cat.maxScore;
              const pct = Math.max(ratio, 0.05);
              const { x, y } = getCoordinates(i, pct);
              return (
                <SvgCircle
                  key={i}
                  cx={x}
                  cy={y}
                  r="5.5"
                  fill={getClinicalColor(cat.name)}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            })}
          </Svg>
        </View>

        {/* Responsive, left-aligned, wrap-friendly Grid Legend */}
        <View style={tw`w-full flex-row flex-wrap justify-start gap-x-[16px] gap-y-[12px] mt-[24px]`}>
          {categoryScores.map((cat, i) => (
            <View key={i} style={tw`flex-row items-center w-[46%] md:w-[30%] min-h-[32px]`}>
              <View style={[tw`w-[10px] h-[10px] md:w-[12px] md:h-[12px] rounded-full mr-[10px] flex-shrink-0`, { backgroundColor: getClinicalColor(cat.name) }]} />
              <Text style={tw`text-[12px] md:text-[13px] font-bold text-slate-300 leading-tight flex-1 flex-wrap`}>
                {cat.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bar Chart Panel */}
      <View style={tw`flex-1 bg-white/5 p-5 rounded-[28px] border border-white/10 shadow-2xl justify-between`}>
        <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-4`}>
          Dimension Contributions
        </Text>

        <View style={tw`space-y-4`}>
          {categoryScores.map((cat, i) => {
            const pct = Math.round((cat.score / cat.maxScore) * 100);
            return (
              <View key={i} style={tw`space-y-1.5`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-xs font-bold text-slate-200`}>{cat.name}</Text>
                  <Text style={tw`text-xs font-bold font-mono text-slate-400`}>{cat.score}/{cat.maxScore} ({pct}%)</Text>
                </View>
                <View style={tw`w-full h-2.5 bg-black/40 rounded-full overflow-hidden`}>
                  <View 
                    style={[tw`h-full rounded-full`, { backgroundColor: getClinicalColor(cat.name), width: `${pct}%` }]} 
                  />
                </View>
              </View>
            );
          })}
        </View>

        <Text style={tw`text-[10px] text-slate-500 font-mono mt-6 text-center uppercase tracking-widest`}>
          OCI MULTI-DIMENSIONAL CONTRIBUTION ANALYSIS
        </Text>
      </View>

    </View>
  );
}
