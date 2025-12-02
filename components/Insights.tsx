import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import { DailyLog, Cycle, UserSettings } from '../types';
import { generateHealthInsight } from '../services/geminiService';
import { formatDateISO } from '../utils/dateUtils';

interface InsightsProps {
  logs: DailyLog[];
  latestCycle: Cycle;
  settings: UserSettings;
  onAskLuna: () => void;
}

export const Insights: React.FC<InsightsProps> = ({ logs, latestCycle, settings, onAskLuna }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-generate insight on mount if logs exist
    const fetchInsight = async () => {
        setLoading(true);
        const today = formatDateISO(new Date());
        const result = await generateHealthInsight(logs, latestCycle, today, settings.name);
        setInsight(result);
        setLoading(false);
    };

    fetchInsight();
  }, [logs.length]);

  return (
    <div 
        onClick={onAskLuna}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-3 shadow-md shadow-purple-500/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between group cursor-pointer hover:shadow-purple-500/20 transition-all"
    >
        {/* Subtle decorative background */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full mix-blend-overlay transform translate-x-8 -translate-y-8 pointer-events-none"></div>

        <div className="flex items-center w-full">
            <div className="p-1.5 bg-white/10 rounded-lg mr-3 backdrop-blur-sm shrink-0">
                <Sparkles className="text-yellow-300" size={16} />
            </div>
            <div className="flex-1 min-w-0">
                 <div className="flex items-baseline mb-0.5">
                     <h3 className="text-[10px] font-bold text-purple-200 uppercase tracking-widest mr-2">Daily Insight</h3>
                 </div>
                 <div className="min-h-[16px]">
                    {loading ? (
                        <div className="flex space-x-1 animate-pulse items-center h-4">
                            <div className="w-1 h-1 bg-white/50 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-white/50 rounded-full animate-bounce delay-75"></div>
                            <div className="w-1 h-1 bg-white/50 rounded-full animate-bounce delay-150"></div>
                        </div>
                    ) : (
                        <p className="text-white text-xs md:text-sm font-medium leading-snug truncate md:whitespace-normal line-clamp-2 md:line-clamp-none">
                            {insight || "Log your symptoms to get personalized daily insights from Flow!"}
                        </p>
                    )}
                </div>
            </div>
            <ChevronRight className="text-white/50 ml-2 shrink-0 md:hidden" size={16} />
        </div>

        <div className="hidden md:flex items-center ml-4 shrink-0">
             <span className="text-[9px] font-bold text-purple-300/60 uppercase tracking-widest mr-3">Powered by Flow AI</span>
             <button className="flex items-center text-[10px] font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm">
                Ask Flow <ArrowRight size={12} className="ml-1.5" />
             </button>
        </div>
    </div>
  );
};