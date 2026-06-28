import { CategoryScore } from '../types';

interface SvgChartsProps {
  categoryScores: CategoryScore[];
}

export default function SvgCharts({ categoryScores }: SvgChartsProps) {
  // 1. Radar Chart Setup
  // We have 8 categories. Let's map them to 8 points on a circle.
  const numPoints = categoryScores.length;
  const radius = 100;
  const centerX = 150;
  const centerY = 150;

  // Calculate coordinates for a given point index, distance percentage
  const getCoordinates = (index: number, percentage: number) => {
    const angle = (Math.PI * 2 / numPoints) * index - Math.PI / 2; // Start from top
    const r = radius * percentage;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y };
  };

  // Generate grid concentric octagons
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridOctagons = gridLevels.map((level) => {
    const points: string[] = [];
    for (let i = 0; i < numPoints; i++) {
      const { x, y } = getCoordinates(i, level);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  });

  // Generate radar score polygon path
  const scorePoints = categoryScores.map((cat, i) => {
    const ratio = cat.score / cat.maxScore;
    // ensure at least a tiny bit is visible
    const pct = Math.max(ratio, 0.05);
    const { x, y } = getCoordinates(i, pct);
    return `${x},${y}`;
  }).join(' ');

  // 2. Donut Chart Setup (Contributions)
  const totalScore = categoryScores.reduce((sum, item) => sum + item.score, 0);
  let accumulatedAngle = -Math.PI / 2; // Start from top

  const donutRadius = 70;
  const donutCX = 150;
  const donutCY = 150;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * donutRadius;

  // Calculate segment paths for donut chart
  const segments = categoryScores.map((cat, i) => {
    if (totalScore === 0) {
      // equal contribution if score is 0
      const pct = 1 / numPoints;
      const strokeDashoffset = circumference - (pct * circumference);
      const rotation = ((i * (360 / numPoints)) - 90);
      return {
        ...cat,
        dashoffset: strokeDashoffset,
        rotation,
        percentage: 0,
        color: getRandomColor(i)
      };
    }

    const pct = cat.score / totalScore;
    const strokeDashoffset = circumference - (pct * circumference);
    const rotation = (accumulatedAngle + Math.PI / 2) * (180 / Math.PI) - 90;
    accumulatedAngle += pct * Math.PI * 2;

    return {
      ...cat,
      dashoffset: strokeDashoffset,
      rotation,
      percentage: Math.round(pct * 100),
      color: getClinicalColor(cat.name)
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Interactive Radar Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4 tracking-tight self-start">
          Orthodontic Dimension Profile (Radar)
        </h3>
        
        <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 300 300">
            {/* Definitions for Glow Filter */}
            <defs>
              <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
              </radialGradient>
            </defs>

            {/* Concentric grid octagons */}
            {gridOctagons.map((points, idx) => (
              <polygon
                key={idx}
                points={points}
                fill="none"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="1"
                strokeDasharray={idx < 3 ? '4,4' : 'none'}
              />
            ))}

            {/* Category axes lines from center */}
            {categoryScores.map((_, i) => {
              const { x, y } = getCoordinates(i, 1.0);
              return (
                <line
                  key={i}
                  x1={centerX}
                  y1={centerY}
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="1"
                />
              );
            })}

            {/* Radar shaded polygon area */}
            <polygon
              points={scorePoints}
              fill="url(#radarGlow)"
              stroke="#0d9488"
              strokeWidth="2.5"
              className="drop-shadow-[0_2px_8px_rgba(13,148,136,0.3)]"
            />

            {/* Labels around the perimeter */}
            {categoryScores.map((cat, i) => {
              const { x, y } = getCoordinates(i, 1.18);
              const isLeft = x < centerX;
              const textAnchor = Math.abs(x - centerX) < 15 ? 'middle' : isLeft ? 'end' : 'start';
              const labelWords = cat.name.split(' ');
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  className="fill-slate-500 dark:fill-slate-400 font-semibold font-sans text-[8.5px] tracking-tight"
                >
                  {/* Handle multiline wrapping nicely */}
                  {labelWords.map((word, wIdx) => (
                    <tspan key={wIdx} x={x} dy={wIdx > 0 ? '10' : '0'}>
                      {word}
                    </tspan>
                  ))}
                </text>
              );
            })}

            {/* Octagon vertices markers */}
            {categoryScores.map((cat, i) => {
              const ratio = cat.score / cat.maxScore;
              const { x, y } = getCoordinates(i, Math.max(ratio, 0.05));
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill={getClinicalColor(cat.name)}
                    className="stroke-white dark:stroke-slate-900 stroke-2"
                  />
                  <text
                    cx={x}
                    cy={y - 10}
                    className="fill-slate-700 dark:fill-slate-200 font-bold font-mono text-[9px]"
                  >
                    {/* Only show scores on outer boundary */}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Pie/Donut Chart & Contribution Breakdown */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-1/2 flex flex-col items-center">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4 tracking-tight self-start">
            Compensation Contribution Ratio
          </h3>
          <div className="relative w-full max-w-[220px] aspect-square flex items-center justify-center">
            <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 300 300">
              {segments.map((seg, idx) => (
                <circle
                  key={idx}
                  cx={donutCX}
                  cy={donutCY}
                  r={donutRadius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={seg.dashoffset}
                  transform={`rotate(${seg.rotation} ${donutCX} ${donutCY})`}
                  className="transition-all duration-1000 ease-out hover:stroke-[30px]"
                  style={{ strokeDasharray: circumference }}
                />
              ))}
            </svg>
            <div className="absolute flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-full w-[100px] h-[100px] shadow-sm">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                {totalScore}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase font-mono">
                Total OCI
              </span>
            </div>
          </div>
        </div>

        {/* Legend listing item percentages */}
        <div className="w-full md:w-1/2 space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metric Breakdown</h4>
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-2">
            {segments.map((seg, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px]" title={seg.name}>
                    {seg.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2 font-mono shrink-0">
                  <span className="text-slate-400 font-medium">{seg.score}/{seg.maxScore}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">({seg.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// Map parameters to cohesive color palettes
function getClinicalColor(catName: string): string {
  if (catName.includes('Skeletal')) return '#3b82f6';       // Blue
  if (catName.includes('Upper Incisor')) return '#0d9488';   // Teal
  if (catName.includes('Lower Incisor')) return '#06b6d4';   // Cyan
  if (catName.includes('Interincisal')) return '#6366f1';    // Indigo
  if (catName.includes('Overjet')) return '#f59e0b';         // Amber
  if (catName.includes('Soft')) return '#ec4899';            // Pink
  if (catName.includes('Occlusal')) return '#8b5cf6';        // Purple
  return '#14b8a6';                                         // Teal alternative
}

function getRandomColor(idx: number): string {
  const colors = ['#3b82f6', '#0d9488', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
  return colors[idx % colors.length];
}
