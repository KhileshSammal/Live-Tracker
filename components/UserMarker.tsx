
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { EntityState } from '../types';

interface UserMarkerProps {
  entity: EntityState;
  isActive: boolean;
  onSelect: () => void;
}

const UserMarker: React.FC<UserMarkerProps> = ({ entity, isActive, onSelect }) => {
  const getIconGlyph = () => {
    switch (entity.type) {
      case 'SupportCar': return '🚗';
      case 'EBike': return '⚡';
      default: return '🚲';
    }
  };

  const icon = L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative w-12 h-12 flex items-center justify-center">
        <!-- V2X Awareness Glow -->
        <div class="absolute w-12 h-12 rounded-full bg-blue-500/10 animate-pulse scale-150"></div>
        <div class="absolute w-12 h-12 rounded-full border-2 border-blue-500/20 animate-ping"></div>
        
        <div 
          class="w-10 h-10 rounded-[14px] border-[2.5px] shadow-[0_10px_25px_rgba(0,0,0,0.2)] flex items-center justify-center transition-all ${entity.isSOS ? 'sos-active' : ''}"
          style="background-color: ${entity.color}; border-color: ${isActive ? '#ffffff' : 'rgba(255,255,255,0.8)'}; transform: ${isActive ? 'scale(1.15)' : 'scale(1)'};"
        >
          <div class="flex flex-col items-center">
            <span class="text-white text-base font-black filter drop-shadow-md">${getIconGlyph()}</span>
            <div class="absolute -bottom-2 px-1.5 bg-slate-900 text-[8px] text-white font-black uppercase rounded-md border border-white/20 shadow-sm">${entity.initial}</div>
          </div>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -20]
  });

  return (
    <Marker position={[entity.location.lat, entity.location.lng]} icon={icon} eventHandlers={{ click: onSelect }}>
      <Popup closeButton={false} className="custom-popup">
        <div className="text-slate-900 p-2 min-w-[160px] font-sans">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
            {/* Fixed JSX error: class -> className */}
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <div className="font-black text-[11px] uppercase tracking-tight">{entity.name} • ${entity.type}</div>
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-[10px] font-bold">
             <div className="text-slate-400 uppercase tracking-tighter">Speed</div>
             <div className="text-right tabular-nums">${(entity.speed * 3.6).toFixed(1)} km/h</div>
             
             <div className="text-slate-400 uppercase tracking-tighter">Safety</div>
             <div className="text-right text-blue-600">${entity.insurance.safetyScore}%</div>
             
             <div className="text-slate-400 uppercase tracking-tighter">Eco Sav.</div>
             <div className="text-right text-emerald-600 font-black">${entity.ecoStats.carbonSavedKg}kg</div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default UserMarker;
