
import { DailyLog, Cycle } from '../types';

export const formatDateISO = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateISO(date);
};

export const diffDays = (date1Str: string, date2Str: string): number => {
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// --- Advanced Prediction Algorithms ---

interface SimpleCycle {
    startDate: string;
    length: number;
}

/**
 * Calculates a 'Smart' Cycle Average using Weighted Moving Average (WMA).
 */
export const calculateSmartCycleAverage = (history: SimpleCycle[], userDefault: number): number => {
    // 1. Filter History: Exclude the current active cycle (index 0) and outliers
    const completedCycles = history.slice(1); 
    
    const validCycles = completedCycles.filter(c => c.length >= 21 && c.length <= 45);

    if (validCycles.length === 0) return userDefault;

    // If we only have 1 or 2 valid cycles, use simple average
    if (validCycles.length < 3) {
        const sum = validCycles.reduce((acc, c) => acc + c.length, 0);
        return Math.round(sum / validCycles.length);
    }

    // Take the last 3 valid cycles for WMA
    const recent = validCycles.slice(0, 3);
    
    // Weighted Calculation (Weights must sum to 1.0)
    const w1 = 0.5; // 50%
    const w2 = 0.3; // 30%
    const w3 = 0.2; // 20%

    const weightedSum = (recent[0].length * w1) + (recent[1].length * w2) + (recent[2].length * w3);
    
    return Math.round(weightedSum);
};

export const getFertileWindowStartDay = (cycleLength: number): number => {
    const lutealPhaseLength = 14; 
    const ovulationDay = cycleLength - lutealPhaseLength;
    return Math.max(1, ovulationDay - 5); 
};

export const getCycleRegularity = (cycles: SimpleCycle[]): number => {
    if (cycles.length < 4) return 100; 
    const completedLengths = cycles.slice(1, 7).map(c => c.length).filter(l => l >= 21 && l <= 45);
    if (completedLengths.length < 2) return 100;

    const min = Math.min(...completedLengths);
    const max = Math.max(...completedLengths);
    const variation = max - min;

    if (variation <= 2) return 100; 
    if (variation <= 4) return 80;  
    if (variation <= 7) return 60;  
    if (variation <= 10) return 40; 
    return 20; 
};

// --- Dynamic Cycle Analysis ---

/**
 * Scans all daily logs to automatically identify cycles.
 * Logic:
 * - Sorts all logs by date.
 * - Identifies "Period Clusters": consecutive or near-consecutive (gap <= 7 days) flow days.
 * - The first day of a cluster is the Cycle Start Date.
 * - The cycle length is determined by the distance to the *next* Cycle Start Date.
 */
export const analyzeCyclesFromLogs = (logs: DailyLog[], defaultCycleLen: number): Cycle[] => {
    // 1. Get all logs with confirmed flow, sorted oldest to newest
    const flowLogs = logs
        .filter(l => l.flow && l.flow !== 'Spotting')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (flowLogs.length === 0) return [];

    const cycles: Cycle[] = [];
    
    // Start with the very first log
    let currentCycleStart = new Date(flowLogs[0].date);
    let lastFlowLogDate = new Date(flowLogs[0].date);

    for (let i = 1; i < flowLogs.length; i++) {
        const currentLogDate = new Date(flowLogs[i].date);
        const diffDays = (currentLogDate.getTime() - lastFlowLogDate.getTime()) / (1000 * 3600 * 24);

        // If the gap between this flow day and the last flow day is large (e.g., > 7 days),
        // it means the previous period finished and this is the start of a NEW cycle.
        if (diffDays > 7) {
            // Close the previous cycle
            // Length = diff between THIS cycle start and the PREVIOUS cycle start
            const prevCycleStartISO = formatDateISO(currentCycleStart);
            const thisCycleStartISO = formatDateISO(currentLogDate);
            
            // Calculate length of the cycle that just finished
            const cycleLength = diffDaysBetween(prevCycleStartISO, thisCycleStartISO);

            cycles.push({
                startDate: prevCycleStartISO,
                length: cycleLength
            });

            // Set up for the new cycle
            currentCycleStart = currentLogDate;
        }
        
        lastFlowLogDate = currentLogDate;
    }

    // Handle the final/current cycle
    // It hasn't finished yet, so we don't know the true length.
    // We store it with the default length, which the UI will override with "Smart Prediction".
    cycles.push({
        startDate: formatDateISO(currentCycleStart),
        length: defaultCycleLen 
    });

    // Return newest first (reverse chronological order)
    return cycles.reverse();
};

const diffDaysBetween = (d1: string, d2: string) => {
    return Math.floor((new Date(d2).getTime() - new Date(d1).getTime()) / (1000 * 3600 * 24));
};