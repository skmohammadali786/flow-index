
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

import { DailyLog, Cycle } from '../types';

/**
 * Scans all daily logs to automatically identify cycles.
 * Logic:
 * - A period Start Date is a day with flow where the previous day did NOT have flow.
 * - If there is a gap of > 10 days between flow days, it is considered a new cycle.
 * - This handles cases where a user might log "Spotting" (ignored) vs "Light/Medium/Heavy".
 */
export const analyzeCyclesFromLogs = (logs: DailyLog[], defaultCycleLen: number): Cycle[] => {
    // 1. Filter logs that have Period Flow (exclude Spotting if desired)
    const flowLogs = logs
        .filter(l => l.flow && l.flow !== 'Spotting')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (flowLogs.length === 0) return [];

    const cycles: Cycle[] = [];
    let currentPeriodStart = new Date(flowLogs[0].date);
    let lastFlowDate = new Date(flowLogs[0].date);

    // 2. Iterate and Group
    for (let i = 1; i < flowLogs.length; i++) {
        const currentLogDate = new Date(flowLogs[i].date);
        const diff = (currentLogDate.getTime() - lastFlowDate.getTime()) / (1000 * 3600 * 24);

        // If gap is large (e.g., > 10 days), the previous period ended, and this is a new one.
        if (diff > 10) {
            // Close previous cycle
            // Length = diff days between START of prev and START of this
            const cycleLen = Math.ceil((currentLogDate.getTime() - currentPeriodStart.getTime()) / (1000 * 3600 * 24));
            
            // Add the previous cycle to list
            cycles.push({
                startDate: formatDateISO(currentPeriodStart),
                length: cycleLen
            });

            // Reset trackers for new cycle
            currentPeriodStart = currentLogDate;
        }
        
        lastFlowDate = currentLogDate;
    }

    // 3. Handle the Current (Active) Cycle
    // It has no end date yet, so we use a projected length
    cycles.push({
        startDate: formatDateISO(currentPeriodStart),
        length: defaultCycleLen 
    });

    // Return sorted newest first
    return cycles.reverse();
};
