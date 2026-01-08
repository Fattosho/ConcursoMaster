
import React, { useState, useEffect, useRef } from 'react';
import { Banca, EssayFeedback } from '../types';
import { generateEssayTheme, evaluateEssayImage, getEssayTips } from '../services/geminiService';

const EssaySimulator: React.FC = () => {
  const [banca, setBanca] = useState<Banca>('FGV');
  const [examMinutes, setExamMinutes] = useState(60);
  const [theme, setTheme] = useState<string | null>(null);
  const [loadingTheme, setLoadingTheme] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null);

  // Professor Help States
  const [tips, setTips] = useState<string[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Timer States
  const [timerStatus, setTimerStatus] = useState<'idle' | 'reading' | 'writing' | 'expired'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tipTimerRef = useRef<NodeJS.Timeout | null>(null);

  const bancas: Banca[] = [
    'FGV', 'Cebraspe', 'FCC', 'Vunesp', 'Cesgranrio', 'Instituto AOCP', 
    'IBFC', 'Idecan', 'Instituto Quadrix', 'IADES', 'Selecon'
  ];

  const handleGenerateTheme = async () => {
    setLoadingTheme(true);
    setTheme(null);
    setFeedback(null);
    setTips([]);
    setTimerStatus('idle');
    if (timerRef.current) clearInterval(timerRef.current);
    if (tipTimerRef.current) clearInterval(tipTimerRef.current);

    try {
      const themeResult = await generateEssayTheme(banca);
      setTheme(themeResult);
      
      const tipsResult = await getEssayTips(themeResult, banca);
      setTips(tipsResult);
      setCurrentTipIndex(0);

      // Inicia fase de leitura (1 minuto = 60 segundos)
      setTimerStatus('reading');
      setTimeLeft(60);
    } catch (e) {
      alert("FALHA AO PROJETAR TEMA.");
    } finally {
      setLoadingTheme(false);
    }
  };

  useEffect(() => {
    if (timerStatus === 'idle' || timerStatus === 'expired') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerStatus === 'reading') {
            setTimerStatus('writing');
            return examMinutes * 60;
          } else {
            setTimerStatus('expired');
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerStatus, examMinutes]);

  // Tip Rotation Effect (every 5 minutes = 300,000ms)
  useEffect(() => {
    if ((timerStatus === 'reading' || timerStatus === 'writing') && tips.length > 0 && !feedback) {
      tipTimerRef.current = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 300000);
    } else {
      if (tipTimerRef.current) clearInterval(tipTimerRef.current);
    }
    return () => { if (tipTimerRef.current) clearInterval(tipTimerRef.current); };
  }, [timerStatus, tips, feedback]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setSelectedImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEvaluate = async () => {
    if (!selectedImage || !theme) return;
    setIsEvaluating(true);
    try {
      const result = await evaluateEssayImage(selectedImage, theme, banca);
      setFeedback(result);
    } catch (e: any) {
      alert("ERRO NA ANÁLISE ÓPTICA.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="page-transition max-w-6xl mx-auto space-y-12 pb-20">
      <header className="border-l-4 border-blue-600 pl-6">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">CORRETOR DE <span className="text-blue-500">REDAÇÃO</span></h2>
        <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-1">ENVIE FOTO DA SUA REDAÇÃO MANUSCRITA PARA AVALIAÇÃO POR SISTEMA ESPECIALISTA</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-card p-10 rounded-[2.5rem] border-zinc-900 space-y-8">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">CONFIGURAÇÃO</h3>
            
            <div className="space-y-4">
              <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-widest">BANCA ALVO</label>
              <select 
                value={banca} 
                onChange={(e) => setBanca(e.target.value as Banca)}
                className="w-full bg-zinc-950 text-zinc-300 p-4 rounded-2xl border border-zinc-800 focus:border-blue-500 outline-none text-[11px] font-black uppercase tracking-widest appearance-none"
              >
                {bancas.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-widest">TEMPO DE PROVA (MINUTOS)</label>
              <input 
                type="number" 
                value={examMinutes} 
                onChange={(e) => setExamMinutes(Number(e.target.value))}
                min="10"
                max="300"
                className="w-full bg-zinc-950 text-zinc-300 p-4 rounded-2xl border border-zinc-800 focus:border-blue-500 outline-none text-[11px] font-black uppercase tracking-widest"
              />
            </div>

            <button 
              onClick={handleGenerateTheme}
              disabled={loadingTheme}
              className="w-full neon-button-blue text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] btn-click-effect disabled:opacity-30"
            >
              {loadingTheme ? 'ELABORANDO...' : 'PROJETAR TEMA'}
            </button>
          </div>

          {loadingTheme ? (
            <div className="glass-card p-10 rounded-[2.5rem] border-blue-500/20 flex flex-col items-center justify-center space-y-8 min-h-[250px] animate-in fade-in duration-300 shadow-[0_0_30px_rgba(59,130,246,0.05)]">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse rounded-full"></div>
                <div className="text-7xl animate-writing relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">✍️</div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-blue-500 tracking-[0.4em] uppercase mb-2">SINTETIZANDO PROPOSTA</p>
                <div className="flex gap-1 justify-center">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          ) : theme ? (
            <div className="glass-card p-10 rounded-[2.5rem] border-blue-500/10 space-y-8 animate-in slide-in-from-left-8 duration-500 shadow-xl">
              <div>
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">TEMA GERADO</h3>
                <p className="text-white font-bold text-xl leading-relaxed tracking-tight italic mt-2">"{theme}"</p>
              </div>

              {/* Ajuda do Professor - Agora aqui acima do cronômetro */}
              {tips.length > 0 && !feedback && (timerStatus === 'reading' || timerStatus === 'writing') && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 space-y-4 animate-in fade-in duration-1000">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 text-lg">🎓</span>
                      <h4 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">DICA DO PROFESSOR</h4>
                    </div>
                    <div className="flex gap-1">
                      {tips.map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full transition-all duration-500 ${i === currentTipIndex ? 'bg-emerald-500 w-3' : 'bg-emerald-500/20'}`}></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-zinc-950/50 border border-emerald-500/5 p-4 rounded-xl min-h-[100px] flex items-center justify-center">
                    <p className="text-zinc-300 text-[13px] font-medium leading-relaxed text-center animate-in slide-in-from-right-4 duration-500">
                      {tips[currentTipIndex]}
                    </p>
                  </div>
                  <p className="text-[8px] text-center font-black text-zinc-600 uppercase tracking-widest">Nova dica a cada 5 minutos</p>
                </div>
              )}
              
              {/* Cronômetro */}
              <div className={`p-6 rounded-3xl border ${timerStatus === 'reading' ? 'bg-amber-500/5 border-amber-500/30' : timerStatus === 'writing' ? 'bg-blue-600/5 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-rose-600/5 border-rose-500/30'}`}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-zinc-500">
                  {timerStatus === 'reading' ? 'TEMPO DE LEITURA' : timerStatus === 'writing' ? 'TEMPO DE ESCRITA' : 'TEMPO ENCERRADO'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-mono font-black ${timerStatus === 'reading' ? 'text-amber-500' : timerStatus === 'writing' ? 'text-white' : 'text-rose-500'}`}>
                    {formatTime(timeLeft)}
                  </span>
                  {timerStatus === 'reading' && <span className="text-[10px] font-bold text-amber-500/60 animate-pulse uppercase">LEITURA ATIVA</span>}
                </div>
              </div>

              <div className="pt-4 space-y-4">
                {timerStatus !== 'expired' ? (
                  <>
                    <input type="file" id="essay-upload" hidden onChange={handleImageUpload} accept="image/*" />
                    <label 
                      htmlFor="essay-upload" 
                      className={`block w-full text-center border-2 border-dashed p-10 rounded-[2rem] cursor-pointer transition-all ${
                        selectedImage ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
                      }`}
                    >
                      <div className="text-4xl mb-4">{selectedImage ? '✅' : '📷'}</div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                        {selectedImage ? 'IMAGEM CARREGADA' : 'ENVIE FOTO SUA REDAÇÃO'}
                      </span>
                    </label>
                    
                    {selectedImage && (
                      <button 
                        onClick={handleEvaluate}
                        disabled={isEvaluating}
                        className="w-full neon-button-solid text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 btn-click-effect shadow-lg shadow-blue-900/20"
                      >
                        {isEvaluating ? 'ANALISANDO...' : 'AVALIAR AGORA'}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="p-10 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 text-center">
                    <div className="text-5xl mb-4">🚫</div>
                    <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest">TEMPO ESGOTADO</p>
                    <p className="text-[9px] text-zinc-600 mt-2 uppercase">O upload foi bloqueado para simular condições reais de prova.</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-8 space-y-8">
          {feedback && (
            <div className="glass-card p-12 md:p-16 rounded-[3.5rem] border-blue-500/10 space-y-12 animate-in zoom-in duration-700 shadow-2xl">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-10">
                <div>
                  <h3 className="text-7xl font-black text-blue-500 tracking-tighter drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">{feedback.grade}</h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-3">SCORE FINAL</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-2xl text-[10px] font-black text-zinc-400 uppercase tracking-widest">VALIDADO PELO SISTEMA</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase mb-6 tracking-widest">PONTOS FORTES</h4>
                  <ul className="space-y-4">
                    {feedback.pros.map((p, i) => (
                      <li key={i} className="text-[13px] text-zinc-400 flex items-start gap-4">
                        <span className="text-emerald-500 font-black">+</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl">
                  <h4 className="text-[10px] font-black text-rose-500 uppercase mb-6 tracking-widest">A MELHORAR</h4>
                  <ul className="space-y-4">
                    {feedback.cons.map((c, i) => (
                      <li key={i} className="text-[13px] text-zinc-400 flex items-start gap-4">
                        <span className="text-rose-500 font-black">-</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-10 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] shadow-inner">
                <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-6">PARECER TÉCNICO</h4>
                <p className="text-zinc-300 text-base leading-relaxed border-l-2 border-blue-900/50 pl-10 italic">
                  {feedback.fullAnalysis}
                </p>
              </div>

              <div className="bg-blue-600/10 border border-blue-500/30 p-8 rounded-3xl">
                <h4 className="text-[10px] font-black uppercase text-blue-500 mb-3 tracking-widest">ESTRATÉGIA DE EVOLUÇÃO</h4>
                <p className="text-base font-black tracking-tight text-white uppercase">{feedback.tips}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EssaySimulator;
