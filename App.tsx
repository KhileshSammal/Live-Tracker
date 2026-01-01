
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { GoogleGenAI, Modality } from "@google/genai";

import { EntityState, AppConfig, Coordinate, SafetyAlert, Hazard, ChatMessage, RideStats, NavigationInstruction } from './types';
import { DEFAULT_ENTITIES, MAP_TILES, PLANNED_ROUTE } from './constants';
import { useGeolocation } from './hooks/useGeolocation';
import { useWakeLock } from './hooks/useWakeLock';
import Sidebar from './components/Sidebar';
import UserMarker from './components/UserMarker';
import Controls from './components/Controls';
import Dashboard from './components/Dashboard';

// Audio Helpers for Gemini TTS
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Geospatial Helpers
function getDistance(c1: Coordinate, c2: Coordinate) {
  const R = 6371e3; // metres
  const φ1 = c1.lat * Math.PI / 180;
  const φ2 = c2.lat * Math.PI / 180;
  const Δφ = (c2.lat - c1.lat) * Math.PI / 180;
  const Δλ = (c2.lng - c1.lng) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getBearing(c1: Coordinate, c2: Coordinate) {
  const λ1 = c1.lng * Math.PI / 180;
  const λ2 = c2.lng * Math.PI / 180;
  const φ1 = c1.lat * Math.PI / 180;
  const φ2 = c2.lat * Math.PI / 180;
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

const MapUpdater: React.FC<{ activeEntity: EntityState | null; targetCoords?: Coordinate; recenterTrigger?: number }> = ({ activeEntity, targetCoords, recenterTrigger }) => {
  const map = useMap();
  useEffect(() => {
    if (recenterTrigger && activeEntity) {
      map.flyTo([activeEntity.location.lat, activeEntity.location.lng], 17, { animate: true, duration: 1.5 });
    } else if (targetCoords) {
      map.flyTo([targetCoords.lat, targetCoords.lng], 16, { animate: true });
    }
  }, [activeEntity, targetCoords, recenterTrigger, map]);
  return null;
};

const App: React.FC = () => {
  const [entities, setEntities] = useState<EntityState[]>(DEFAULT_ENTITIES);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isPTTActive, setIsPTTActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rideStats, setRideStats] = useState<RideStats>({ distanceMeters: 0, startTime: null, durationSeconds: 0 });
  const [groundingUrls, setGroundingUrls] = useState<{uri: string, title: string}[]>([]);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [routeIndex, setRouteIndex] = useState(0);
  
  const [config, setConfig] = useState<AppConfig>({
    sunlightMode: false,
    heatmapMode: false,
    activeEntityId: '1', 
    currentUserEntityId: '1', 
    isRiding: false,
    followMeMode: false,
    units: 'Metric',
    currency: 'USD',
    language: 'en',
    subscriptionTier: 'Pro',
    destination: undefined,
    dynamicRoute: undefined,
    isVoiceNavEnabled: true,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSpokenMilestone = useRef<{ index: number, type: '200m' | '50m' | 'arrival' } | null>(null);

  useWakeLock();

  const handleAddMember = (name: string, initial: string) => {
    const colors = ['#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#6366F1'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const currentUser = entities.find(e => e.id === config.currentUserEntityId);
    
    const newMember: EntityState = {
      id: `m-${Date.now()}`,
      type: 'Cycle',
      name: name,
      initial: initial.toUpperCase().charAt(0),
      color: randomColor,
      location: currentUser ? { ...currentUser.location } : { lat: 45.523062, lng: -122.676482 },
      heading: 0,
      speed: 0,
      battery: 100,
      lastSeen: Date.now(),
      isSOS: false,
      isHost: false,
      history: [],
      hasSignedWaiver: true,
      privacyRadius: 100,
      telemetrySource: 'GPS',
      ecoStats: { carbonSavedKg: 0, tokensEarned: 0, treesEquivalent: 0 },
      insurance: { safetyScore: 100, currentPremium: 10, dynamicDiscount: 0 },
      bikeSpecs: { brand: 'Unspecified', type: 'Road', year: new Date().getFullYear() },
      recentStats: { totalKm: 0, avgSpeed: 0, elevationGain: 0 }
    };

    setEntities(prev => [...prev, newMember]);
    setMessages(prev => [...prev, { id: `sys-${Date.now()}`, senderId: 'system', senderName: 'System', text: `${name} joined the fleet.`, timestamp: Date.now(), isSystem: true }]);
  };

  const handleRemoveMember = (id: string) => {
    if (id === config.currentUserEntityId) return; // Prevent removing self
    const member = entities.find(e => e.id === id);
    setEntities(prev => prev.filter(e => e.id !== id));
    if (config.activeEntityId === id) {
      setConfig(prev => ({ ...prev, activeEntityId: config.currentUserEntityId }));
    }
    if (member) {
      setMessages(prev => [...prev, { id: `sys-${Date.now()}`, senderId: 'system', senderName: 'System', text: `${member.name} left the fleet.`, timestamp: Date.now(), isSystem: true }]);
    }
  };

  const speakInstruction = async (text: string) => {
    if (!config.isVoiceNavEnabled) return;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `You are a professional cycling navigation system. Announce this instruction clearly and professionally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
      }
    } catch (e) {
      console.error('TTS Error:', e);
    }
  };

  useEffect(() => {
    if (!config.isRiding) return;
    const interval = setInterval(() => {
      setEntities(prev => prev.map(e => {
        const route = config.dynamicRoute || PLANNED_ROUTE;
        
        if (e.id === config.currentUserEntityId) {
          const targetNode = route[routeIndex] || route[route.length - 1];
          const currentPos = e.location;
          const distToNext = getDistance(currentPos, targetNode);
          
          if (distToNext < 5 && routeIndex < route.length - 1) {
            setRouteIndex(prev => prev + 1);
            return e;
          }

          const stepSize = 0.0001; 
          const latDiff = targetNode.lat - currentPos.lat;
          const lngDiff = targetNode.lng - currentPos.lng;
          const mag = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
          
          const newPos = mag > 0 ? {
            lat: currentPos.lat + (latDiff / mag) * stepSize,
            lng: currentPos.lng + (lngDiff / mag) * stepSize
          } : currentPos;

          if (routeIndex < route.length) {
            const nextNode = route[routeIndex];
            const dist = getDistance(newPos, nextNode);
            
            let maneuver: NavigationInstruction['maneuver'] = 'straight';
            if (routeIndex > 0 && routeIndex < route.length - 1) {
              const b1 = getBearing(route[routeIndex - 1], route[routeIndex]);
              const b2 = getBearing(route[routeIndex], route[routeIndex + 1]);
              const diff = (b2 - b1 + 540) % 360 - 180;
              if (diff > 30) maneuver = 'turn-right';
              else if (diff < -30) maneuver = 'turn-left';
            }

            const maneuverText = maneuver === 'turn-left' ? "Turn left" : maneuver === 'turn-right' ? "Turn right" : "Continue straight";
            const instructionText = `${maneuverText} toward the next waypoint`;

            if (routeIndex === route.length - 1 && dist < 10 && lastSpokenMilestone.current?.type !== 'arrival') {
              speakInstruction("You have arrived at your destination.");
              lastSpokenMilestone.current = { index: routeIndex, type: 'arrival' };
            } else if (dist < 50 && (lastSpokenMilestone.current?.index !== routeIndex || lastSpokenMilestone.current?.type !== '50m')) {
              speakInstruction(`${maneuverText} in 50 meters.`);
              lastSpokenMilestone.current = { index: routeIndex, type: '50m' };
            } else if (dist < 200 && (lastSpokenMilestone.current?.index !== routeIndex || lastSpokenMilestone.current?.type !== '200m')) {
              speakInstruction(`In 200 meters, ${maneuverText}.`);
              lastSpokenMilestone.current = { index: routeIndex, type: '200m' };
            }

            setRideStats(s => ({
              ...s,
              nextInstruction: {
                text: routeIndex === route.length - 1 && dist < 10 ? "Arrived" : instructionText,
                distanceMeters: dist,
                maneuver: routeIndex === route.length - 1 && dist < 10 ? 'arrival' : maneuver
              }
            }));
          }

          return { ...e, location: newPos, speed: 18 + Math.random() * 4 };
        }

        const jitter = (Math.random() - 0.5) * 0.0001;
        return {
          ...e,
          location: { lat: e.location.lat + jitter, lng: e.location.lng + jitter },
          speed: e.speed > 0 ? e.speed + (Math.random() - 0.5) : 15 + Math.random() * 5
        };
      }));

      setRideStats(prev => ({
        ...prev,
        durationSeconds: prev.durationSeconds + 1,
        distanceMeters: prev.distanceMeters + 6.5 
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [config.isRiding, config.dynamicRoute, routeIndex]);

  useEffect(() => {
    const checkSafety = () => {
      const support = entities.filter(e => e.type === 'SupportCar');
      const active = entities.filter(e => e.type !== 'SupportCar');
      
      active.forEach(cyclist => {
        support.forEach(car => {
          const dist = getDistance(cyclist.location, car.location);
          if (dist < 30) { 
            const alertId = `proximity-${cyclist.id}-${car.id}`;
            if (!alerts.find(a => a.id === alertId)) {
              setAlerts(prev => [...prev, {
                id: alertId,
                type: 'blindspot',
                severity: 'high',
                message: `BLINDSPOT: Support vehicle near ${cyclist.name}`,
                timestamp: Date.now()
              }]);
            }
          }
        });
      });
    };
    const interval = setInterval(checkSafety, 3000);
    return () => clearInterval(interval);
  }, [entities, alerts]);

  const handleLocationUpdate = useCallback(({ location, heading, speed }: any) => {
    setEntities(prev => prev.map(e => {
      if (e.id === config.currentUserEntityId) {
        return { ...e, location, heading, speed, lastSeen: Date.now(), history: [...e.history, location].slice(-20) };
      }
      return e;
    }));
  }, [config.currentUserEntityId]);

  useGeolocation(handleLocationUpdate);

  const handleSendMessage = (text: string) => {
    const user = entities.find(e => e.id === config.currentUserEntityId);
    if (!user) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), senderId: user.id, senderName: user.name, text, timestamp: Date.now() }]);
  };

  const handleMultiModalRoute = async (dest: string) => {
    try {
      setIsSearching(true);
      setGroundingUrls([]);
      const currentUser = entities.find(e => e.id === config.currentUserEntityId);
      const startPos = currentUser ? currentUser.location : PLANNED_ROUTE[0];
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite-latest",
        contents: `Location: [${startPos.lat}, ${startPos.lng}]. Destination: "${dest}". Return a bike-safe JSON route array of lat/lng objects.`,
        config: { 
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: startPos.lat,
                longitude: startPos.lng
              }
            }
          }
        },
      });

      const textResponse = response.text || '';
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        setGroundingUrls(chunks.filter(c => c.maps).map(c => ({ uri: c.maps!.uri, title: c.maps!.title || 'Route Source' })));
      }

      const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const routeData = JSON.parse(jsonMatch[0]);
        setConfig(prev => ({ ...prev, destination: dest, dynamicRoute: routeData }));
        setRouteIndex(0);
        lastSpokenMilestone.current = null;
      }
    } catch (e) {
      console.error('Route Search Error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleRide = () => {
    if (!config.isRiding) {
      setRideStats({ distanceMeters: 0, startTime: Date.now(), durationSeconds: 0 });
      setRouteIndex(0);
      lastSpokenMilestone.current = null;
      setMessages(prev => [...prev, { id: 'sys-' + Date.now(), senderId: 'system', senderName: 'System', text: 'Ride started', timestamp: Date.now(), isSystem: true }]);
      speakInstruction("Starting navigation. Ride safely.");
    } else {
      setMessages(prev => [...prev, { id: 'sys-' + Date.now(), senderId: 'system', senderName: 'System', text: 'Ride complete', timestamp: Date.now(), isSystem: true }]);
      speakInstruction("Ride completed. Well done.");
    }
    setConfig(prev => ({ ...prev, isRiding: !prev.isRiding }));
  };

  const activeEntity = useMemo(() => entities.find(e => e.id === config.activeEntityId) || null, [entities, config.activeEntityId]);

  return (
    <div className={`flex flex-col h-screen w-full bg-[#f8f9fa] overflow-hidden font-sans text-slate-900 ${config.sunlightMode ? 'high-contrast' : ''}`}>
      
      {/* Premium Floating Search & Navigation Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1001] max-w-lg md:mx-auto">
        <div className="group flex items-center h-14 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 px-4 gap-3 transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors active:scale-90"
          >
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <input 
            type="text" 
            placeholder={config.destination ? `To: ${config.destination}` : "Navigate to..."} 
            className="flex-1 bg-transparent border-none outline-none text-[15px] font-semibold text-slate-800 placeholder:text-slate-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleMultiModalRoute((e.target as HTMLInputElement).value);
            }}
          />
          <div className="flex items-center gap-2">
            {isSearching ? (
              <div className="w-5 h-5 border-[2.5px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            )}
            <div className="w-8 h-8 rounded-xl bg-blue-600 shadow-md shadow-blue-200 flex items-center justify-center text-white text-[10px] font-black tracking-tight">NX</div>
          </div>
        </div>
      </div>

      {/* Floating Map Layers (Top Right) */}
      <div className="absolute top-[84px] right-4 z-[1000] flex flex-col gap-3">
        <button 
          onClick={() => setConfig(prev => ({...prev, sunlightMode: !prev.sunlightMode}))}
          className={`w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg flex items-center justify-center transition-all active:scale-90 border border-slate-100 ${config.sunlightMode ? 'text-blue-600' : 'text-slate-500'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
        </button>
      </div>

      <main className="flex-1 relative">
        <MapContainer center={[DEFAULT_ENTITIES[0].location.lat, DEFAULT_ENTITIES[0].location.lng]} zoom={15} zoomControl={false} className="h-full w-full">
          <TileLayer attribution='&copy; Google' url={config.sunlightMode ? MAP_TILES.SUNLIGHT : MAP_TILES.STANDARD} />
          
          <Polyline 
            positions={(config.dynamicRoute || PLANNED_ROUTE).map(p => [p.lat, p.lng])} 
            color="#4285F4" 
            weight={7} 
            opacity={0.85}
            lineCap="round"
            lineJoin="round"
          />

          <MarkerClusterGroup>
            {entities.map(e => (
              <UserMarker key={e.id} entity={e} isActive={config.activeEntityId === e.id} onSelect={() => setConfig(prev => ({ ...prev, activeEntityId: e.id }))} />
            ))}
          </MarkerClusterGroup>

          {entities.filter(e => e.type === 'SupportCar').map(car => (
            <Circle key={`danger-${car.id}`} center={[car.location.lat, car.location.lng]} radius={45} pathOptions={{ color: '#ea4335', weight: 1.5, fillColor: '#ea4335', fillOpacity: 0.12 }} />
          ))}

          <MapUpdater activeEntity={activeEntity} recenterTrigger={recenterTrigger} />
        </MapContainer>

        {/* Improved Navigation HUD - Visual Priority for Active Guidance */}
        {config.isRiding && rideStats.nextInstruction && (
          <div className="absolute top-[84px] left-4 right-20 z-[1000] flex justify-center pointer-events-none">
            <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl text-white p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-5 border border-white/10 animate-in slide-in-from-top-6 duration-700">
               <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                  {rideStats.nextInstruction.maneuver === 'turn-left' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>}
                  {rideStats.nextInstruction.maneuver === 'turn-right' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>}
                  {rideStats.nextInstruction.maneuver === 'straight' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>}
                  {rideStats.nextInstruction.maneuver === 'arrival' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
               </div>
               <div className="flex-1 flex flex-col min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400 mb-0.5">Maneuver</span>
                  <span className="text-base font-black leading-tight truncate uppercase tracking-tight">{rideStats.nextInstruction.text}</span>
               </div>
               <div className="flex flex-col items-center bg-white/10 px-4 py-2 rounded-2xl border border-white/5">
                  <span className="text-2xl font-black tabular-nums">{Math.round(rideStats.nextInstruction.distanceMeters)}</span>
                  <span className="text-[9px] font-bold uppercase opacity-50 tracking-widest">m</span>
               </div>
            </div>
          </div>
        )}

        <Controls 
          isSOSActive={!!entities.find(e => e.id === config.currentUserEntityId)?.isSOS}
          onToggleSOS={() => setEntities(prev => prev.map(e => e.id === config.currentUserEntityId ? { ...e, isSOS: !e.isSOS } : e))}
          onRecenter={() => setRecenterTrigger(prev => prev + 1)}
        />

        <Dashboard 
          stats={rideStats} 
          isActive={config.isRiding} 
          onToggle={toggleRide} 
          config={config}
          setConfig={setConfig}
          onPTTStart={() => setIsPTTActive(true)}
          onPTTStop={() => setIsPTTActive(false)}
          isPTTActive={isPTTActive}
          onReportHazard={(type) => setMessages(prev => [...prev, { id: Date.now().toString(), senderId: 'system', senderName: 'Alert', text: `Hazard reported: ${type}`, timestamp: Date.now(), isSystem: true }])}
        />
      </main>

      <Sidebar 
        entities={entities} 
        config={config}
        setConfig={setConfig}
        alerts={alerts}
        messages={messages}
        onSendMessage={handleSendMessage}
        onEntitySelect={(id) => { setConfig(prev => ({ ...prev, activeEntityId: id })); setIsSidebarOpen(false); }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  );
};

export default App;
