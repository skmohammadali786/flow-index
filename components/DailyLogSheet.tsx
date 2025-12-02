
import React, { useState, useEffect, useRef } from 'react';
import { DailyLog, FlowIntensity, Mood, PhysicalSymptom, DischargeType, SexActivity } from '../types';
import { MOODS, SYMPTOMS, DISCHARGE_TYPES, SEX_ACTIVITIES } from '../constants';
import { X, Save, Droplet, Heart, Activity, GlassWater, Moon, Weight, Thermometer } from 'lucide-react';

interface DailyLogSheetProps {
  date: string;
  existingLog?: DailyLog;
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: DailyLog) => void;
  autoFocusMetric?: 'water' | 'sleep' | 'weight' | 'temperature' | null;
}

export const DailyLogSheet: React.FC<DailyLogSheetProps> = ({ 
    date, existingLog, isOpen, onClose, onSave, autoFocusMetric
}) => {
  const [flow, setFlow] = useState<FlowIntensity | null>(null);
  const [discharge, setDischarge] = useState<DischargeType | null>(null);
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<PhysicalSymptom[]>([]);
  const [selectedSex, setSelectedSex] = useState<SexActivity[]>([]);
  
  // New metrics
  const [water, setWater] = useState<number>(0);
  const [sleep, setSleep] = useState<string>(''); 
  const [weight, setWeight] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');

  const [notes, setNotes] = useState('');

  // Refs for scrolling to specific sections
  const waterRef = useRef<HTMLDivElement>(null);
  const sleepRef = useRef<HTMLDivElement>(null);
  const weightRef = useRef<HTMLDivElement>(null);
  const tempRef = useRef<HTMLDivElement>(null);

  // Reset or load state when date/log changes
  useEffect(() => {
    if (existingLog) {
        setFlow(existingLog.flow || null);
        setDischarge(existingLog.discharge || null);
        setSelectedMoods(existingLog.moods || []);
        setSelectedSymptoms(existingLog.symptoms || []);
        setSelectedSex(existingLog.sex || []);
        setWater(existingLog.water || 0);
        setSleep(existingLog.sleep ? existingLog.sleep.toString() : '');
        setWeight(existingLog.weight ? existingLog.weight.toString() : '');
        setTemperature(existingLog.temperature ? existingLog.temperature.toString() : '');
        setNotes(existingLog.notes || '');
    } else {
        setFlow(null);
        setDischarge(null);
        setSelectedMoods([]);
        setSelectedSymptoms([]);
        setSelectedSex([]);
        setWater(0);
        setSleep('');
        setWeight('');
        setTemperature('');
        setNotes('');
    }
  }, [date, existingLog]);

  // Handle auto-focus scrolling
  useEffect(() => {
    if (isOpen && autoFocusMetric) {
        // Small timeout to allow the modal to render before scrolling
        setTimeout(() => {
            const refs = {
                'water': waterRef,
                'sleep': sleepRef,
                'weight': weightRef,
                'temperature': tempRef
            };
            const targetRef = refs[autoFocusMetric];
            if (targetRef && targetRef.current) {
                targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add a temporary highlight effect
                targetRef.current.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2', 'dark:ring-blue-500');
                setTimeout(() => {
                    targetRef.current?.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2', 'dark:ring-blue-500');
                }, 1500);
            }
        }, 300);
    }
  }, [isOpen, autoFocusMetric]);

  const handleSave = () => {
    onSave({
        date,
        flow,
        discharge,
        moods: selectedMoods,
        symptoms: selectedSymptoms,
        sex: selectedSex,
        water,
        sleep: sleep ? parseFloat(sleep) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        notes
    });
    onClose();
  };

  const toggleSelection = <T extends string>(item: T, list: T[], setList: React.Dispatch<React.SetStateAction<T[]>>) => {
      if (list.includes(item)) {
          setList(list.filter(i => i !== item));
      } else {
          setList([...list, item]);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 shadow-2xl h-full flex flex-col animate-slide-in-right border-l border-gray-200 dark:border-gray-700">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 z-10 shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Log Details</h2>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{new Date(date).toDateString()}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                <X size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 bg-white dark:bg-gray-800 scroll-smooth">
            {/* Period Flow */}
            <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                    <Droplet size={14} className="mr-2 text-rose-500" /> Menstruation
                </h3>
                <div className="grid grid-cols-4 gap-2">
                    {['Light', 'Medium', 'Heavy', 'Spotting'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFlow(flow === f ? null : f as FlowIntensity)}
                            className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                                flow === f 
                                ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/30 transform scale-105' 
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-rose-300 hover:shadow-sm'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* New Metrics Section: Water, Sleep, Weight, Temp */}
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                    <Activity size={14} className="mr-2 text-blue-500" /> Daily Health Metrics
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                    {/* Water */}
                    <div ref={waterRef} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-300">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block flex items-center">
                            <GlassWater size={14} className="mr-1 text-blue-400" /> Water (Cups)
                        </label>
                        <div className="flex items-center justify-between">
                            <button onClick={() => setWater(Math.max(0, water - 1))} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600">-</button>
                            <span className="text-xl font-bold text-gray-800 dark:text-white">{water}</span>
                            <button onClick={() => setWater(water + 1)} className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-bold hover:bg-blue-200 dark:hover:bg-blue-800/50">+</button>
                        </div>
                    </div>

                    {/* Sleep */}
                    <div ref={sleepRef} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-300">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block flex items-center">
                            <Moon size={14} className="mr-1 text-indigo-400" /> Sleep (Hrs)
                        </label>
                        <input 
                            type="number" 
                            step="0.5"
                            value={sleep}
                            onChange={(e) => setSleep(e.target.value)}
                            className="w-full text-center font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 p-1 outline-none"
                            placeholder="0"
                        />
                    </div>

                    {/* Weight */}
                    <div ref={weightRef} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-300">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block flex items-center">
                            <Weight size={14} className="mr-1 text-emerald-400" /> Weight
                        </label>
                        <input 
                            type="number" 
                            step="0.1"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full text-center font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 p-1 outline-none"
                            placeholder="--"
                        />
                    </div>

                    {/* Temp */}
                    <div ref={tempRef} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-300">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block flex items-center">
                            <Thermometer size={14} className="mr-1 text-orange-400" /> BBT Temp
                        </label>
                        <input 
                            type="number" 
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                            className="w-full text-center font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 p-1 outline-none"
                            placeholder="--"
                        />
                    </div>
                </div>
            </div>

            {/* Discharge */}
            <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                        <Activity size={14} className="mr-2 text-cyan-500" /> Discharge
                </h3>
                <div className="grid grid-cols-3 gap-2">
                    {DISCHARGE_TYPES.map((d) => (
                        <button
                            key={d}
                            onClick={() => setDischarge(discharge === d ? null : d)}
                            className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                                discharge === d 
                                ? 'bg-cyan-500 text-white border-cyan-600 shadow-md transform scale-105' 
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-cyan-300'
                            }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>

                {/* Sex */}
                <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                        <Heart size={14} className="mr-2 text-pink-500" /> Sexual Activity
                </h3>
                <div className="flex flex-wrap gap-2">
                    {SEX_ACTIVITIES.map((s) => (
                        <button
                            key={s}
                            onClick={() => toggleSelection(s, selectedSex, setSelectedSex)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                                selectedSex.includes(s)
                                ? 'bg-pink-500 text-white border-pink-600 shadow-md transform scale-105' 
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-pink-300'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Moods */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Mood</h3>
                <div className="flex flex-wrap gap-2">
                    {MOODS.map(m => (
                        <button
                            key={m}
                            onClick={() => toggleSelection(m, selectedMoods, setSelectedMoods)}
                            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                                selectedMoods.includes(m)
                                ? 'bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 shadow-sm'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                            }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Symptoms */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Symptoms</h3>
                <div className="flex flex-wrap gap-2">
                    {SYMPTOMS.map(s => (
                        <button
                            key={s}
                            onClick={() => toggleSelection(s, selectedSymptoms, setSelectedSymptoms)}
                            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                                selectedSymptoms.includes(s)
                                ? 'bg-orange-100 dark:bg-orange-900/50 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 shadow-sm'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Notes</h3>
                    <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 text-gray-700 dark:text-gray-200 h-32 resize-none font-medium placeholder-gray-400 dark:placeholder-gray-600"
                    />
            </div>
        </div>

        {/* Footer with Save */}
        <div className="p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-800 dark:via-gray-800 z-20 shrink-0 pb-safe">
            <button 
                onClick={handleSave}
                className="w-full py-4 bg-gray-900 dark:bg-purple-600 text-white rounded-2xl font-bold shadow-xl shadow-gray-900/20 dark:shadow-purple-900/30 hover:bg-black dark:hover:bg-purple-700 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center"
            >
                <Save size={20} className="mr-2" />
                Save Log
            </button>
        </div>
      </div>
    </div>
  );
};
