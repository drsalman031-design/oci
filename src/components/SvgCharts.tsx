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
      case 'Maxillary Incisor': return '#14b8a6';
      case 'Mandibular Incisor': return '#06b6d4';
      case 'Soft Tissue Lip Profile': return '#eab308';
      case 'Occlusion Sagitto-Vertical': return '#f97316';
      case 'Transverse Skeletodental': return '#ef4444';
      default: return '#10b981';
    }
  };

  return (
    <View style={tw`flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6 mt-6`}>
      
      {/* Radar Chart Panel */}
      <View style={tw`flex-1 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm items-center`}>
        <Text style={tw`font-extrabold text-sm text-slate-800 dark:text-slate-100 self-start mb-4`}>
          Orthodontic Dimension Profile (Radar)
        </Text>
        
        <View style={tw`w-full max-w-[280px] aspect-square items-center justify-center`}>
          <Svg width="100%" height="100%" viewBox="0 0 300 300" style={tw`overflow-visible`}>
            <Defs>
              <RadialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
              </RadialGradient>
            </Defs>

            {/* Grid Octagons */}
            {gridOctagons.map((points, idx) => (
              <SvgPolygon
                key={idx}
                points={points}
                fill="none"
                stroke="#e2e8f0"
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
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              );
            })}

            {/* score area */}
            <SvgPolygon
              points={scorePoints}
              fill="url(#radarGlow)"
              stroke="#0d9488"
              strokeWidth="2.5"
            />

            {/* score vertices dots */}
            {categoryScores.map((cat, i) => {
              const ratio = cat.score / cat.maxScore;
              const pct = Math.max(ratio, 0.05);
              const { x, y } = getCoordinates(i, pct);
              return (
                <SvgCircle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#0d9488"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            })}
          </Svg>
        </View>

        {/* Legend */}
        <View style={tw`flex-row flex-wrap justify-center gap-x-4 gap-y-2 mt-4`}>
          {categoryScores.map((cat, i) => (
            <View key={i} style={tw`flex-row items-center`}>
              <View style={tw`w-2.5 h-2.5 rounded-full mr-1.5`} backgroundColor={getClinicalColor(cat.name)} />
              <Text style={tw`text-[10px] font-bold text-slate-500`}>{cat.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bar Chart Panel */}
      <View style={tw`flex-1 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm justify-between`}>
        <Text style={tw`font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-4`}>
          Dimension Contributions
        </Text>

        <View style={tw`space-y-3.5 flex-1 justify-center`}>
          {categoryScores.map((cat, i) => {
            const pct = Math.round((cat.score / cat.maxScore) * 100);
            return (
              <View key={i} style={tw`space-y-1`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-xs font-bold text-slate-700 dark:text-slate-300`}>{cat.name}</Text>
                  <Text style={tw`text-xs font-bold font-mono text-slate-500`}>{cat.score}/{cat.maxScore} ({pct}%)</Text>
                </View>
                <View style={tw`w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden`}>
                  <View 
                    style={tw`h-full rounded-full`} 
                    backgroundColor={getClinicalColor(cat.name)}
                    width={`${pct}%`}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <Text style={tw`text-[10px] text-slate-400 font-mono mt-6 text-center uppercase`}>
          OCI MULTI-DIMENSIONAL CONTRIBUTION ANALYSIS
        </Text>
      </View>

    </View>
  );
}
