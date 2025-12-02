
import React, { useState, useMemo, useEffect } from 'react';
import { Cycle, DailyLog } from '../types';
import { TrendingUp, Activity, Droplet, Moon, Weight, Thermometer } from 'lucide-react';

interface AnalysisViewProps {
  logs: DailyLog[];
  cycles: Cycle[];
  onNavigateToLog?: () => void; // Optional prop to redirect if empty
}

type MetricType = 'water' | 'sleep' | 'weight' | 'temperature';

const METRICS: { id: MetricType; icon: React.ElementType; label: string; unit: string; color: string }[] = [
  { id: 'weight', icon: Weight, label: 'Weight', unit: 'kg', color: '#10b981' }, // emerald
  { id: 'sleep', icon: Moon, label: 'Sleep', unit: 'hrs', color: '#6366f1' }, // indigo
  { id: 'water', icon: Droplet, label: 'Water', unit: 'cups', color: '#3b82f6' }, // blue
  { id: 'temperature', icon: Thermometer, label: 'Temp', unit: '°', color: '#f97316' }, // orange
];

export const AnalysisView: React.FC<AnalysisViewProps> = ({ logs, cycles, onNavigateToLog }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
  const [focusedPoint, setFocusedPoint] = useState<{x: number, y: number, value: number, date: string} | null>(null);

  // Auto-select a metric that has data on mount
  useEffect(() => {
    for (const m of METRICS) {
      const hasData = logs.some(l => l[m.id] !== undefined && l[m.id] !== null && !isNaN(l[m.id] as number) && (l[m.id] as number) > 0);
      if (hasData) {
        setSelectedMetric(m.id);
        return;
      }
    }
  }, [logs.length]); // Run once when logs load

  // --- Cycle History Calculations ---
  const cycleData = useMemo(() => {
    // Take last 6 cycles, reverse to show oldest to newest left-to-right
    const recent = [...cycles].slice(0, 6).reverse();
    const maxLen = Math.max(...recent.map(c => c.length), 35); // Scale max
    return { recent, maxLen };
  }, [cycles]);

  // --- Trend Data Calculations ---
  const trendData = useMemo(() => {
    // Sort logs by date ascending
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Filter last 14 entries (2 weeks) that have values for the selected metric
    const dataPoints = sortedLogs
        .filter(l => l[selectedMetric] !== undefined && l[selectedMetric] !== null && !isNaN(l[selectedMetric] as number))
        .slice(-14)
        .map(l => ({ date: l.date, value: l[selectedMetric] as number }));

    if (dataPoints.length === 0) return null;

    const values = dataPoints.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    // Ensure range is at least 1 to avoid division by zero if all values are same
    // Add some padding to min/max so points aren't on the very edge
    const range = (max - min) === 0 ? 1 : max - min; 
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return { dataPoints, min, max, range, avg };
  }, [logs, selectedMetric]);

  // --- Symptom Frequency Calculations ---
  const symptomStats = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      log.symptoms.forEach(s => counts[s] = (counts[s] || 0) + 1);
    });
    // Sort by count desc
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5
  }, [logs]);

  const activeMetricInfo = METRICS.find(m => m.id === selectedMetric)!;

  // Render Logic for Chart
  const renderChart = () => {
    if (!trendData || trendData.dataPoints.length === 0) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-700 p-4 rounded-full shadow-sm mb-3">
                    <Activity size={32} className="text-gray-300 dark:text-gray-500" />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No {activeMetricInfo.label} data yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mb-4">Log your daily stats to see trends</p>
            </div>
        );
    }

    const { dataPoints, min, range } = trendData;
    const width = 1000;
    const height = 200;
    const paddingX = 40;
    const paddingY = 40;
    const drawWidth = width - (paddingX * 2);
    const drawHeight = height - (paddingY * 2);

    // Calculate Coordinates
    const points = dataPoints.map((pt, i) => {
        let x;
        if (dataPoints.length === 1) {
            x = width / 2;
        } else {
            x = paddingX + (i * (drawWidth / (dataPoints.length - 1)));
        }
        
        const normalizedY = (pt.value - min) / range;
        const y = (height - paddingY) - (normalizedY * drawHeight);
        return { x, y, ...pt };
    });

    // Generate Path
    let d = "";
    if (points.length === 1) {
        // Draw a small horizontal line if only one point
        d = `M ${points[0].x - 20},${points[0].y} L ${points[0].x + 20},${points[0].y}`;
    } else {
        d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    }
    
    // Fill Area Path (for gradient)
    const fillD = points.length > 1 
        ? `${d} L ${points[points.length-1].x},${height} L ${points[0].x},${height} Z`
        : "";

    return (
        <div className="relative w-full h-64 select-none touch-none">
             <svg className="w-full h-full drop-shadow-sm" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                 <defs>
                    <linearGradient id={`grad-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={activeMetricInfo.color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={activeMetricInfo.color} stopOpacity="0" />
                    </linearGradient>
                 </defs>

                 {/* Grid Lines */}
                 <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="currentColor" className="text-gray-100 dark:text-gray-700" strokeWidth="2" />
                 <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="currentColor" className="text-gray-100 dark:text-gray-700" strokeWidth="2" strokeDasharray="4 4"/>

                 {/* Min/Max Labels */}
                 <text x={10} y={height - paddingY} className="text-xs fill-gray-400 dark:fill-gray-500 font-medium" alignmentBaseline="middle">{min}</text>
                 <text x={10} y={paddingY} className="text-xs fill-gray-400 dark:fill-gray-500 font-medium" alignmentBaseline="middle">{trendData.max}</text>

                 {/* Gradient Fill */}
                 {fillD && <path d={fillD} fill={`url(#grad-${selectedMetric})`} stroke="none" />}

                 {/* Line */}
                 <path
                    d={d} 
                    fill="none"
                    stroke={activeMetricInfo.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                 />

                 {/* Data Points */}
                 {points.map((p, i) => (
                     <g key={i} onClick={() => setFocusedPoint(p)}>
                        {/* Invisible larger hit area for mobile tapping */}
                        <circle cx={p.x} cy={p.y} r="20" fill="transparent" className="cursor-pointer" />
                        {/* Visible dot */}
                        <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r={focusedPoint && focusedPoint.date === p.date ? 8 : 5} 
                            fill="white" 
                            stroke={activeMetricInfo.color} 
                            strokeWidth="3"
                            className="transition-all duration-300 pointer-events-none dark:fill-gray-800"
                        />
                     </g>
                 ))}
             </svg>
             
             {/* Tooltip Overlay */}
             {focusedPoint && (
                 <div 
                    className="absolute bg-gray-900 dark:bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl transform -translate-x-1/2 transition-all pointer-events-none z-10"
                    style={{ left: `${(focusedPoint.x / width) * 100}%`, top: `${(focusedPoint.y / height) * 100}%`, marginTop: '-45px' }}
                 >
                     <div className="flex flex-col items-center">
                         <span>{focusedPoint.value} {activeMetricInfo.unit}</span>
                         <span className="text-[10px] text-gray-400 font-medium">{new Date(focusedPoint.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                     </div>
                     {/* Triangle arrow */}
                     <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                 </div>
             )}
        </div>
    );
  };

  return (
    <div className="animate-fade-in-up pb-24 md:pb-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analysis</h1>
      </div>

      {/* Cycle History Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-purple-500/5 dark:shadow-none border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
          <Activity className="mr-2 text-rose-500" size={20} />
          Cycle History
        </h2>
        
        {cycleData.recent.length > 0 ? (
            <div className="h-48 flex items-end justify-between space-x-2 md:space-x-4">
            {cycleData.recent.map((cycle, i) => {
                const heightPercent = (cycle.length / cycleData.maxLen) * 100;
                const isNormal = cycle.length >= 21 && cycle.length <= 35;
                const dateLabel = new Date(cycle.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                
                return (
                <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full flex justify-center items-end h-full">
                        <div 
                            style={{ height: `${heightPercent}%` }} 
                            className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 relative group-hover:opacity-80 ${
                                isNormal ? 'bg-rose-400' : 'bg-orange-400'
                            }`}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                                {cycle.length} Days
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-3 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                        {dateLabel}
                    </span>
                </div>
                );
            })}
            </div>
        ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                Log at least one cycle to see history
            </div>
        )}
      </div>

      {/* Health Trends */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-purple-500/5 dark:shadow-none border border-gray-100 dark:border-gray-700">
         <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center mb-4 md:mb-0">
                <TrendingUp className="mr-2 text-blue-500" size={20} />
                Health Trends
            </h2>
            
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl overflow-x-auto no-scrollbar">
                {METRICS.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => { setSelectedMetric(m.id); setFocusedPoint(null); }}
                        className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                            selectedMetric === m.id 
                            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <m.icon size={14} className="mr-1.5" />
                        {m.label}
                    </button>
                ))}
            </div>
         </div>

         {/* The Chart Component */}
         {renderChart()}

         {trendData && (
             <div className="mt-6 grid grid-cols-3 gap-4 border-t border-gray-50 dark:border-gray-700 pt-4">
                 <div className="text-center">
                     <p className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-bold">Average</p>
                     <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{trendData.avg.toFixed(1)} <span className="text-xs text-gray-400">{activeMetricInfo.unit}</span></p>
                 </div>
                 <div className="text-center border-l border-gray-100 dark:border-gray-700">
                     <p className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-bold">Highest</p>
                     <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{trendData.max} <span className="text-xs text-gray-400">{activeMetricInfo.unit}</span></p>
                 </div>
                 <div className="text-center border-l border-gray-100 dark:border-gray-700">
                     <p className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-bold">Lowest</p>
                     <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{trendData.min} <span className="text-xs text-gray-400">{activeMetricInfo.unit}</span></p>
                 </div>
             </div>
         )}
      </div>

      {/* Symptom Frequency */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-purple-500/5 dark:shadow-none border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Common Symptoms</h2>
          
          <div className="space-y-4">
              {symptomStats.length > 0 ? symptomStats.map(([symptom, count], index) => {
                  const max = symptomStats[0][1];
                  const percent = (count / max) * 100;
                  
                  return (
                      <div key={symptom}>
                          <div className="flex justify-between text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
                              <span>{symptom}</span>
                              <span className="text-gray-400 dark:text-gray-500">{count} times</span>
                          </div>
                          <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                style={{ width: `${percent}%` }} 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                    index === 0 ? 'bg-rose-400' :
                                    index === 1 ? 'bg-orange-400' :
                                    index === 2 ? 'bg-yellow-400' :
                                    'bg-purple-300'
                                }`}
                              ></div>
                          </div>
                      </div>
                  )
              }) : (
                  <div className="text-center py-8">
                      <p className="text-gray-400 dark:text-gray-500 text-sm italic mb-4">No symptoms logged yet.</p>
                      <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold transition-colors">
                          Log Today's Symptoms
                      </button>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};