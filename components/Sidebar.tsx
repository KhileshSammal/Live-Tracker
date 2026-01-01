
import React, { useState, useRef, useEffect } from 'react';
import { EntityState, AppConfig, SafetyAlert, ChatMessage } from '../types';

interface SidebarProps {
  entities: EntityState[];
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  alerts: SafetyAlert[];
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onEntitySelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (name: string, initial: string) => void;
  onRemoveMember: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  entities, config, setConfig, alerts, messages, onSendMessage, onEntitySelect, isOpen, onClose, onAddMember, onRemoveMember 
}) => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'chat' | 'eco' | 'wallet'>('fleet');
  const [expandedRiderId, setExpandedRiderId] = useState<string | null>(null);
  const [msgInput, setMsgInput] = useState('');
  
  // Add Member Form State
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInitial, setNewInitial] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const handleSend = () => {
    if (!msgInput.trim()) return;
    onSendMessage(msgInput);
    setMsgInput('');
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRiderId(expandedRiderId === id ? null : id);
  };

  const handleAddSubmit = () => {
    if (newName.trim() && newInitial.trim()) {
      onAddMember(newName, newInitial);
      setNewName('');
      setNewInitial('');
      setIsAddingMember(false);
    }
  };

  return (
    <div className={`fixed top-0 left-0 h-full w-80 bg-white z-[2000] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out border-r border-slate-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex bg-slate-50 p-2 gap-1 border-b border-slate-200">
        {(['fleet', 'chat', 'eco', 'wallet'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            {tab}
          </button>
        ))}
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {activeTab === 'fleet' && (
          <div className="p-2 space-y-2">
            {entities.map(e => {
              const isExpanded = expandedRiderId === e.id;
              return (
                <div 
                  key={e.id}
                  onClick={() => onEntitySelect(e.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${config.activeEntityId === e.id ? 'bg-indigo-50 border-indigo-200' : 'border-slate-100 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white shadow-lg shrink-0`} style={{ backgroundColor: e.color }}>{e.initial}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold flex justify-between items-center">
                        <span className="truncate">{e.name} {e.isHost && '👑'}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded-md uppercase font-bold">{e.type}</span>
                          <button 
                            onClick={(event) => toggleExpand(e.id, event)}
                            className="p-1 hover:bg-indigo-100 rounded-full transition-colors"
                          >
                            <svg className={`w-4 h-4 text-indigo-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                          </button>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 flex gap-2 mt-1 font-medium">
                        <span>{Math.round(e.speed * 3.6)} km/h</span>
                        <span>•</span>
                        <span>{e.telemetrySource}</span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200/60 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between items-center mb-2">
                         <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bike Profile</h4>
                         {e.id !== config.currentUserEntityId && (
                           <button 
                             onClick={(ev) => { ev.stopPropagation(); onRemoveMember(e.id); }}
                             className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors"
                           >
                             Remove Rider
                           </button>
                         )}
                      </div>
                      
                      {e.bikeSpecs && (
                        <div className="mb-4">
                          <div className="bg-white/50 rounded-xl p-3 border border-slate-100">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-500 font-bold uppercase">Spec</span>
                              <span className="text-slate-900 font-black">{e.bikeSpecs.brand}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] mt-1">
                              <span className="text-slate-500 font-bold uppercase">Type / Year</span>
                              <span className="text-slate-900 font-black">{e.bikeSpecs.type} • {e.bikeSpecs.year}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {e.recentStats && (
                        <div>
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Recent Performance</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-indigo-500/5 rounded-xl p-2 border border-indigo-100/50 flex flex-col items-center">
                              <span className="text-lg font-black text-indigo-600">{e.recentStats.totalKm}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase">Total KM</span>
                            </div>
                            <div className="bg-emerald-500/5 rounded-xl p-2 border border-emerald-100/50 flex flex-col items-center">
                              <span className="text-lg font-black text-emerald-600">{e.recentStats.avgSpeed}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase">Avg KPH</span>
                            </div>
                            <div className="bg-amber-500/5 rounded-xl p-2 border border-amber-100/50 flex flex-col items-center">
                              <span className="text-lg font-black text-amber-600">{e.recentStats.elevationGain}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase">Elev (m)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Member Quick Action */}
            {!isAddingMember ? (
              <button 
                onClick={() => setIsAddingMember(true)}
                className="w-full p-4 rounded-2xl border border-dashed border-slate-300 text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                <span className="text-xs font-black uppercase tracking-widest">Add Rider</span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      placeholder="Rider Name" 
                      className="flex-1 px-3 py-2 text-sm bg-white border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <input 
                      placeholder="Init" 
                      className="w-16 px-3 py-2 text-sm bg-white border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 uppercase text-center"
                      maxLength={1}
                      value={newInitial}
                      onChange={(e) => setNewInitial(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsAddingMember(false)}
                      className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddSubmit}
                      className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest bg-indigo-500 text-white rounded-xl shadow-md hover:bg-indigo-600 transition-colors"
                    >
                      Confirm Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full bg-slate-50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.senderId === config.currentUserEntityId ? 'items-end' : 'items-start'}`}>
                  {m.isSystem ? (
                    <div className="w-full text-center py-2 text-[10px] font-bold uppercase text-slate-400 tracking-widest">{m.text}</div>
                  ) : (
                    <>
                      <span className="text-[9px] font-bold text-slate-400 mb-1 px-2">{m.senderName}</span>
                      <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${m.senderId === config.currentUserEntityId ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                        {m.text}
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <input 
                value={msgInput} 
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Team message..." 
                className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={handleSend} className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'eco' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Global Impact</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl">
                <div className="text-2xl font-black text-emerald-600">84.2</div>
                <div className="text-[9px] uppercase font-bold text-emerald-400">KG CO2 Saved</div>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-3xl">
                <div className="text-2xl font-black text-blue-600">412</div>
                <div className="text-[9px] uppercase font-bold text-blue-400">Eco Tokens</div>
              </div>
            </div>
            <button className="w-full py-4 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg hover:bg-emerald-700 transition-colors">Open Marketplace</button>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="p-6 space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase text-indigo-400">Safety Insurance</span>
                <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full">ACTIVE</span>
              </div>
              <div className="text-3xl font-black text-slate-800">$12.50<span className="text-sm text-slate-400 font-bold">/mo</span></div>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Safety Score: 92%</p>
            </div>
            <button className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg hover:bg-black transition-colors">Request Roadside Help</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
