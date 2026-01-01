
import React from 'react';

interface ControlsProps {
  isSOSActive: boolean;
  onToggleSOS: () => void;
  onRecenter: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  isSOSActive, onToggleSOS, onRecenter
}) => {
  return (
    <div className="absolute bottom-[280px] right-4 z-[1000] flex flex-col gap-4 items-end pointer-events-none">
      
      {/* Primary Navigation Tools */}
      <div className="flex flex-col gap-3 pointer-events-auto">
        {/* Recenter / Orientation Button */}
        <button 
          onClick={onRecenter} 
          className="w-14 h-14 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 rounded-full flex items-center justify-center transition-all hover:bg-slate-50 active:scale-90"
          title="Recenter"
        >
          <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
        </button>

        {/* SOS Emergency Button - Distinct and high priority */}
        <button 
          onClick={onToggleSOS}
          className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-[0_15px_40px_rgba(220,38,38,0.3)] active:scale-95 border-2 ${isSOSActive ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-white border-red-600 text-red-600 hover:bg-red-50'}`}
        >
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] font-black uppercase tracking-tighter mb-0.5">Emergency</span>
            <span className="text-xl font-black tracking-tighter">SOS</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Controls;
