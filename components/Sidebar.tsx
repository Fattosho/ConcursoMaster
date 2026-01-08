
import React, { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Logo = () => (
  <div className="relative group">
    <div className="w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 shadow-2xl transition-all duration-500 group-hover:border-blue-500/30">
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        {/* Minimalist Brain Concept - Symmetric arcs */}
        <path 
          d="M50 25 C 30 25, 20 40, 20 55 C 20 70, 30 80, 50 80" 
          stroke="#3b82f6" 
          strokeWidth="6" 
          strokeLinecap="round" 
          fill="none"
          className="opacity-90"
        />
        <path 
          d="M50 25 C 70 25, 80 40, 80 55 C 80 70, 70 80, 50 80" 
          stroke="#ffffff" 
          strokeWidth="6" 
          strokeLinecap="round" 
          fill="none"
          className="opacity-20"
        />
        <path 
          d="M50 35 L 50 70" 
          stroke="#3b82f6" 
          strokeWidth="4" 
          strokeLinecap="round"
          className="opacity-40"
        />
        <circle cx="50" cy="30" r="3" fill="#3b82f6" />
      </svg>
    </div>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'simulator', label: 'SIMULADOR', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'essay', label: 'REDAÇÃO', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { id: 'mnemonics', label: 'MNEMÔNICOS', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { id: 'image-tools', label: 'MAPAS MENTAIS', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { id: 'news', label: 'NOTÍCIAS', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6m-6 4h6' },
  ];

  return (
    <>
      <header className="md:hidden flex items-center justify-between p-4 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-900 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Logo />
          <h1 className="font-black text-lg tracking-tighter uppercase">Concurso<span className="text-blue-500">Master</span></h1>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-zinc-400 neon-button-blue rounded-lg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {isOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </header>

      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-zinc-950 border-r border-zinc-900 h-full flex flex-col z-50 transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)]
        md:translate-x-0 md:sticky md:top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-10 flex flex-col items-center">
          <Logo />
          <h1 className="font-black text-2xl mt-5 tracking-tighter uppercase">MASTER<span className="text-blue-500">.</span></h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 text-center">Seu amigo dos momentos importantes.</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
              className={`w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center gap-4 group btn-click-effect ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)]' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
              }`}
            >
              <svg className={`w-5 h-5 transition-all flex-shrink-0 ${activeTab === item.id ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-zinc-700 group-hover:text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} />
              </svg>
              <span className="font-black text-[11px] tracking-widest uppercase">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800/50">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">STATUS OPERACIONAL</p>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">SISTEMA ONLINE</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
