
import React from 'react';
import { RideStats, AppConfig, Hazard } from '../types';

interface DashboardProps {
  stats: RideStats;
  isActive: boolean;
  onToggle: () => void;
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  onPTTStart: () => void;
  onPTTStop: () => void;
  isPTTActive: boolean;
  onReportHazard: (type: Hazard['type']) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  stats, isActive, onToggle, config, setConfig, onPTTStart, onPTTStop, isPTTActive, onReportHazard 
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDist = (m: number) => {
    return (m / 1000).toFixed(2);
  };

  return (
    <div className={`absolute bottom-0 left-0 right-0 z-[1002] bg-white rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] transition-transform duration-700 cubic-bezier(0.19, 1, 0.22, 1) transform border-t border-slate-100 ${isActive ? 'translate-y-0' : 'translate-y-[calc(100%-120px)]'}`}>
      {/* Visual Handle */}
      <div className="p-1 flex justify-center pt-4">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
      </div>
      
      <div className="px-8 pb-10 pt-4">
        {/* Main Stats Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Distance</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">{formatDist(stats.distanceMeters)}</span>
              <span className="text-[13px] font-black text-blue-600 uppercase">km</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Time</span>
            <span className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">{formatTime(stats.durationSeconds)}</span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Speed</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">23.2</span>
              <span className="text-[13px] font-black text-emerald-600 uppercase">kph</span>
            </div>
          </div>
        </div>

        {/* Quick Utility Actions Row */}
        <div className="flex items-center justify-between gap-4 mb-8 bg-slate-50 p-2 rounded-3xl border border-slate-100">
          <button 
            onMouseDown={onPTTStart}
            onMouseUp={onPTTStop}
            onTouchStart={onPTTStart}
            onTouchEnd={onPTTStop}
            className={`flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 transition-all ${isPTTActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 shadow-sm border border-slate-100'}`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z"/><path d="M5 19a2 2 0 104 0H5z"/></svg>
            <span className="text-[11px] font-black uppercase tracking-widest">Intercom</span>
          </button>

          <button 
            onClick={() => onReportHazard('pothole')}
            className="flex-1 h-12 bg-white rounded-2xl flex items-center justify-center gap-2 text-orange-600 shadow-sm border border-slate-100 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span className="text-[11px] font-black uppercase tracking-widest">Report</span>
          </button>

          <button 
            onClick={() => setConfig(prev => ({...prev, isVoiceNavEnabled: !prev.isVoiceNavEnabled}))}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${config.isVoiceNavEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-slate-300'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
          </button>
        </div>

        {/* Primary Action Button */}
        <button 
          onClick={onToggle}
          className={`w-full h-16 rounded-[24px] font-black uppercase text-[15px] tracking-[0.25em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 ${isActive ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200/50' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50'}`}
        >
          {isActive ? (
            <>
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-white rounded-[2px]"></div>
              </div>
              End Ride
            </>
          ) : (
            <>
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.516 7.548c0-.443.359-.802.802-.802h11.364c.443 0 .802.359.802.802v4.904c0 .443-.359.802-.802.802H5.318a.802.802 0 01-.802-.802V7.548z"/><path d="M8.232 5.06l1.768-1.768 1.768 1.768a1.25 1.25 0 11-1.768 1.768l-.884-.884v6.114a1.25 1.25 0 11-2.5 0V5.944l-.884.884a1.25 1.25 0 11-1.768-1.768z"/></svg>
              </div>
              Start Session
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
