
import React from 'react';

interface ControlsProps {
  isSOSActive: boolean;
  onToggleSOS: () => void;
  onRecenter: () => void;
  sunlightMode: boolean;
  onToggleSunlight: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  isSOSActive, onToggleSOS, onRecenter, sunlightMode, onToggleSunlight
}) => {
  return (
    <div className="absolute bottom-[300px] right-4 z-[1000] flex flex-col gap-4 items-end pointer-events-none">
      
      {/* Cluster Stack */}
      <div className="flex flex-col bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-100 pointer-events-auto">
        {/* Layer/Sunlight Toggle */}
        <button 
          onClick={onToggleSunlight}
          className={`w-12 h-12 flex items-center justify-center transition-all active:scale-90 ${sunlightMode ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
          </svg>
        </button>
        <div className="h-px bg-slate-100 mx-2"></div>
        {/* Orientation/Recenter Button */}
        <button 
          onClick={onRecenter} 
          className="w-12 h-12 text-blue-600 flex items-center justify-center transition-all hover:bg-slate-50 active:scale-90"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>

      {/* SOS Primary Emergency Button - High priority, distinct shadow */}
      <button 
        onClick={onToggleSOS}
        className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-[0_15px_40px_rgba(239,68,68,0.35)] active:scale-95 border-2 pointer-events-auto ${isSOSActive ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-white border-red-600 text-red-600 hover:bg-red-50'}`}
      >
        <div className="flex flex-col items-center leading-none">
          <span className="text-[10px] font-black uppercase tracking-tighter mb-0.5">Alert</span>
          <span className="text-xl font-black tracking-tighter">SOS</span>
        </div>
      </button>
    </div>
  );
};

export default Controls;
