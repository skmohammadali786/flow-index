
import React, { useMemo } from 'react';
import { Cycle, UserSettings } from '../types';
import { calculateSmartCycleAverage } from '../utils/dateUtils';
import { Zap } from 'lucide-react';

interface CycleWheelProps {
  latestCycle: Cycle;
  settings: UserSettings;
  cycles?: Cycle[]; 
}

export const CycleWheel: React.FC<CycleWheelProps> = ({ latestCycle, settings, cycles = [] }) => {
  const today = new Date();
  
  // Use Smart Calculation
  const dynamicLength = useMemo(() => {
     return calculateSmartCycleAverage(cycles, settings.avgCycleLength);
  }, [cycles, settings.avgCycleLength]);

  // Safety: If no start date (first run), default to today
  const startDate = latestCycle.startDate ? new Date(latestCycle.startDate) : new Date();
  
  const cycleLen = dynamicLength;
  const periodLen = settings.avgPeriodLength || 5;
  
  // Calculate day of cycle (1-based)
  // Ensure we compare local dates (midnight to midnight)
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Parse startDate carefully to avoid timezone shifts
  const [startYear, startMonth, startDay] = latestCycle.startDate 
      ? latestCycle.startDate.split('-').map(Number) 
      : [today.getFullYear(), today.getMonth() + 1, today.getDate()];
      
  const startMidnight = new Date(startYear, startMonth - 1, startDay);
  
  const diffTime = todayMidnight.getTime() - startMidnight.getTime();
  const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Handle Future Dates gracefully
  const isFuture = daysDiff < 0;
  const cycleDay = isFuture ? 1 : Math.max(1, daysDiff + 1);
  const daysLeft = cycleLen - cycleDay;

  // Visual calculation
  const radius = 120;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Clamp progress (0 to 1)
  const progress = isFuture ? 0 : Math.min(cycleDay / cycleLen, 1);
  const strokeDashoffset = circumference - progress * circumference;

  // Medical Logic (Standard 14 day luteal phase assumption)
  const isPeriod = cycleDay <= periodLen;
  const ovulationDay = cycleLen - 14; 
  const isOvulationWindow = Math.abs(cycleDay - ovulationDay) <= 2; // 5 days window
  const isLuteal = cycleDay > (ovulationDay + 2);

  let statusText = "";
  let subText = "";
  let colorClass = "stroke-rose-400";
  let textColorClass = "text-rose-400";

  if (isFuture) {
      statusText = "Not Started";
      subText = `Starts in ${Math.abs(daysDiff)} days`;
      colorClass = "stroke-gray-300 dark:stroke-gray-600";
      textColorClass = "text-gray-400 dark:text-gray-500";
  } else if (daysLeft < 0) {
      statusText = "Late";
      subText = `${Math.abs(daysLeft)} Day${Math.abs(daysLeft) !== 1 ? 's' : ''} Late`;
      colorClass = "stroke-red-600";
      textColorClass = "text-red-600";
  } else if (isPeriod) {
      statusText = "Menstruation";
      subText = `Day ${cycleDay}`;
      colorClass = "stroke-rose-500";
      textColorClass = "text-rose-500";
  } else if (isOvulationWindow) {
      statusText = "Fertile Window";
      subText = "High chance of pregnancy";
      colorClass = "stroke-teal-400";
      textColorClass = "text-teal-500";
  } else if (isLuteal) {
      statusText = "Luteal Phase";
      subText = `${daysLeft} Day${daysLeft !== 1 ? 's' : ''} until period`;
      colorClass = "stroke-indigo-300";
      textColorClass = "text-indigo-400";
  } else {
      statusText = "Follicular Phase";
      subText = `Day ${cycleDay}`;
      colorClass = "stroke-pink-300";
      textColorClass = "text-pink-400";
  }

  // Detect if we are using smart prediction vs setting
  const isSmartPrediction = dynamicLength !== settings.avgCycleLength;

  return (
    <div className="relative flex items-center justify-center">
      <div className="relative w-64 h-64">
        {/* Background Circle */}
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-gray-100 dark:text-gray-700"
          />
          {/* Progress Circle */}
          <circle
            stroke="currentColor"
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-in-out' }}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={`${colorClass}`}
          />
        </svg>
        
        {/* Inner Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <h2 className="text-5xl font-bold text-gray-800 dark:text-white tracking-tight">{isFuture ? '--' : cycleDay}</h2>
            <p className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest font-bold mt-1">Cycle Day</p>
            <div className="mt-3 px-4 py-1.5 rounded-full bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700 shadow-sm">
                <p className={`text-sm font-bold ${textColorClass}`}>
                    {statusText}
                </p>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">{subText}</p>
            
            {/* Smart Indicator */}
            {isSmartPrediction && !isFuture && (
                <div className="absolute bottom-8 flex items-center text-[10px] text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full animate-fade-in-up">
                    <Zap size={10} className="mr-1" /> Smart Prediction ({dynamicLength}d)
                </div>
            )}
        </div>
      </div>
      
      {/* Decorative blurry blobs behind */}
      <div className="absolute top-0 left-10 w-32 h-32 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob dark:opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 right-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 dark:opacity-10 pointer-events-none"></div>
    </div>
  );
};