
import React, { useState, useMemo } from 'react';
import { MONTHS, WEEKDAYS } from '../constants';
import { getDaysInMonth, getFirstDayOfMonth, formatDateISO, calculateSmartCycleAverage, getFertileWindowStartDay } from '../utils/dateUtils';
import { Cycle, DailyLog, UserSettings } from '../types';
import { ChevronLeft, ChevronRight, Droplet, Zap, Activity, Sparkles } from 'lucide-react';

interface CalendarViewProps {
  logs: DailyLog[];
  cycles: Cycle[];
  settings: UserSettings;
  onSelectDate: (date: string) => void;
  selectedDate: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ logs, cycles, settings, onSelectDate, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // --- Advanced Prediction Engine ---
  const predictionData = useMemo(() => {
    const map = new Map<string, { isProjectedPeriod: boolean; isFertile: boolean; isOvulationDay: boolean }>();
    
    // 1. Calculate Smart Average based on history
    const smartLength = calculateSmartCycleAverage(cycles, settings.avgCycleLength);
    const periodLen = settings.avgPeriodLength || 5;
    
    // 2. Mark Historical/Active Cycles (Ground Truth)
    // We trust manual logs over predictions for past dates
    cycles.forEach(cycle => {
        const start = new Date(cycle.startDate);
        // Mark confirmed period days logic is handled by 'logs' prop in render, 
        // but we reserve space here if needed for hybrid views.
        // For predictions map, we mostly care about FUTURE.
    });

    // 3. Project Future Cycles (Project 12 months ahead)
    if (cycles.length > 0) {
        // Cycles are sorted desc, so [0] is latest/active
        const latestStart = new Date(cycles[0].startDate);

        // Project 12 future cycles
        for(let c = 1; c <= 12; c++) {
            const nextStart = new Date(latestStart);
            nextStart.setDate(latestStart.getDate() + (smartLength * c));

            // A. Mark Projected Period
            for(let i=0; i < periodLen; i++) {
                const pDay = new Date(nextStart);
                pDay.setDate(nextStart.getDate() + i);
                const iso = formatDateISO(pDay);
                map.set(iso, { isProjectedPeriod: true, isFertile: false, isOvulationDay: false });
            }

            // B. Mark Fertile Window & Ovulation Day
            // Backtrack 14 days from NEXT period to find Ovulation
            const nextCycleStart = new Date(nextStart); // This is the start of the period we just marked
            const ovulationDate = new Date(nextCycleStart);
            ovulationDate.setDate(nextCycleStart.getDate() - 14);

            // Window: -5 days to +1 day around ovulation
            for(let o = -5; o <= 1; o++) {
                 const fDay = new Date(ovulationDate);
                 fDay.setDate(ovulationDate.getDate() + o);
                 const iso = formatDateISO(fDay);
                 const isOvulationDay = o === 0;
                 
                 // Don't overwrite period predictions
                 const existing = map.get(iso);
                 if (!existing?.isProjectedPeriod) {
                    map.set(iso, { 
                        isProjectedPeriod: false, 
                        isFertile: true,
                        isOvulationDay: isOvulationDay
                    });
                 }
            }
        }
    }

    return { map, usedLength: smartLength };
  }, [cycles, settings]);


  const days = [];
  // Empty slots for prev month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
  }

  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = formatDateISO(dateObj);
    const isSelected = selectedDate === dateStr;
    const isToday = formatDateISO(new Date()) === dateStr;

    // Check Actual Logs (The Truth)
    const log = logs.find(l => l.date === dateStr);
    const hasLog = !!log;
    const isPeriodLog = log?.flow && log.flow !== 'Spotting';
    
    // Check Predictions (The Projection)
    const prediction = predictionData.map.get(dateStr);
    const isProjectedPeriod = prediction?.isProjectedPeriod && !isPeriodLog; 
    const isFertile = prediction?.isFertile;
    const isOvulationDay = prediction?.isOvulationDay;

    let bgClass = '';
    let textClass = 'text-gray-700 dark:text-gray-200';
    let icon = null;

    // Prioritize Actual Logs > Ovulation Day > Period Prediction > Fertile Window
    if (isPeriodLog) {
        bgClass = 'bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-rose-900/50';
        textClass = 'text-white';
        icon = <Droplet size={10} className="absolute top-1 right-1 opacity-50" />;
    } else if (isProjectedPeriod) {
        bgClass = 'bg-rose-50 dark:bg-rose-900/10 text-rose-400 dark:text-rose-300 border border-rose-200 dark:border-rose-800 border-dashed'; 
        icon = <Droplet size={8} className="absolute top-1 right-1 text-rose-300 dark:text-rose-500 opacity-70" />;
    } else if (isOvulationDay) {
        // Distinct look for Ovulation Day
        bgClass = 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 border-2 border-teal-300 dark:border-teal-600';
        icon = <Sparkles size={10} className="absolute -top-1 -right-1 text-teal-600 dark:text-teal-400 fill-teal-400" />;
    } else if (isFertile) {
        bgClass = 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300';
    }

    if (isSelected) {
        bgClass += ' ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 dark:ring-offset-gray-800';
    }
    
    if (isToday && !bgClass) {
        bgClass = 'bg-gray-200 dark:bg-gray-700 font-bold';
    }

    days.push(
      <button
        key={d}
        onClick={() => onSelectDate(dateStr)}
        className={`h-10 w-10 rounded-full flex flex-col items-center justify-center text-sm relative transition-all duration-200 ${bgClass} ${textClass} hover:scale-110`}
      >
        <span>{d}</span>
        {icon}
        {hasLog && !isPeriodLog && (
            <div className={`absolute -bottom-1 h-1.5 w-1.5 rounded-full ${isProjectedPeriod ? 'bg-rose-400' : 'bg-purple-500'}`}></div>
        )}
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl shadow-pink-500/5 dark:shadow-none border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
            <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{MONTHS[month]} {year}</h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
            <ChevronRight size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-y-4 justify-items-center mb-2">
        {WEEKDAYS.map(day => (
            <div key={day} className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-y-2 justify-items-center">
        {days}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4">
          <div className="flex items-center"><div className="w-3 h-3 bg-rose-500 rounded-full mr-2"></div> Period</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-rose-50 dark:bg-rose-900/10 border border-dashed border-rose-300 mr-2 flex items-center justify-center"><div className="w-1 h-1 bg-rose-400 rounded-full"></div></div> Predicted</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-teal-50 dark:bg-teal-900/20 rounded-full mr-2"></div> Fertile</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-teal-100 border border-teal-300 rounded-full mr-2 flex items-center justify-center relative"><Sparkles size={8} className="absolute text-teal-600" /></div> Ovulation</div>
          
          {/* Dynamic Config Indicator */}
          <div className="flex items-center text-purple-500 dark:text-purple-400 font-bold ml-auto bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md">
             {predictionData.usedLength !== settings.avgCycleLength ? (
                 <>
                    <Zap size={12} className="mr-1" />
                    Smart: {predictionData.usedLength}d
                 </>
             ) : (
                 <>
                    <Activity size={12} className="mr-1" />
                    Static: {settings.avgCycleLength}d
                 </>
             )}
          </div>
      </div>
    </div>
  );
};
