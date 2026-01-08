
import React, { useState } from 'react';
import { Materia, MnemonicResponse } from '../types';
import { generateMnemonic } from '../services/geminiService';

const MnemonicGenerator: React.FC = () => {
  const [materia, setMateria] = useState<Materia>('Direito Administrativo');
  const [loading, setLoading] = useState(false);
  const [mnemonic, setMnemonic] = useState<MnemonicResponse | null>(null);

  const materias: Materia[] = [
    'Língua Portuguesa', 'Matemática', 'Raciocínio Lógico', 'Informática', 
    'Direito Constitucional', 'Direito Administrativo', 'Direito Penal'
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setMnemonic(null);
    try {
      const result = await generateMnemonic(materia);
      setMnemonic(result);
    } catch (e) {
      alert("Falha na síntese.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition max-w-4xl mx-auto space-y-12 pb-20">
      <header className="border-l-4 border-blue-600 pl-6">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">SISTEMA <span className="text-blue-500">MNEMÔNICO</span></h2>
        <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-1">Sitema de Ancoragem e Memorização</p>
      </header>

      <div className="glass-card p-8 md:p-10 rounded-[2.5rem] flex flex-wrap gap-8 items-end border-zinc-900">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">DISCIPLINA FOCO</label>
          <select 
            value={materia} 
            onChange={(e) => setMateria(e.target.value as Materia)}
            className="w-full bg-zinc-950 text-zinc-300 p-5 rounded-2xl border border-zinc-800 focus:border-blue-500 outline-none cursor-pointer font-black text-[11px] uppercase tracking-widest"
          >
            {materias.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full md:w-auto px-12 h-[62px] neon-button-solid text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] btn-click-effect disabled:opacity-30"
        >
          {loading ? 'SINTETIZANDO...' : 'SINTETIZAR AGORA'}
        </button>
      </div>

      {!mnemonic && !loading && (
        <div className="h-80 border border-zinc-900 bg-zinc-950/30 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 opacity-30">
          <div className="text-8xl mb-8 grayscale drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">🧠</div>
          <p className="text-[11px] font-black uppercase tracking-[0.5em]">Aguardando Processamento</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-8">
          <div className="w-16 h-16 border-4 border-zinc-900 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Codificando Memória...</p>
        </div>
      )}

      {mnemonic && (
        <div className="glass-card p-12 md:p-20 rounded-[4rem] space-y-12 animate-in zoom-in duration-700 border-blue-500/10 overflow-hidden relative">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="space-y-4">
            <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.5em]">ANCORAGEM CRÍTICA</span>
            <h3 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none font-mono drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{mnemonic.phrase}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-4">
                <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,1)]"></span> DECODIFICAÇÃO
              </h4>
              <p className="text-zinc-200 text-lg font-bold leading-relaxed bg-zinc-900/40 p-10 rounded-[2.5rem] border border-zinc-800 shadow-inner">
                {mnemonic.meaning}
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-4">
                <span className="w-2 h-2 bg-zinc-700 rounded-full"></span> FUNDAMENTO TÉCNICO
              </h4>
              <p className="text-zinc-400 text-sm leading-relaxed italic border-l-2 border-zinc-800 pl-10 py-4">
                {mnemonic.explanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MnemonicGenerator;
