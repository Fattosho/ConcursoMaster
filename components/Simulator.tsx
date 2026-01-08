
import React, { useState, useEffect, useRef } from 'react';
import { Banca, Materia, Nivel, Question } from '../types';
import { generateQuestion } from '../services/geminiService';

interface SimulatorProps { onQuestionAnswered: (isCorrect: boolean, subject: string) => void; }

const Simulator: React.FC<SimulatorProps> = ({ onQuestionAnswered }) => {
  const [banca, setBanca] = useState<Banca>('FGV');
  const [materia, setMateria] = useState<Materia>('Língua Portuguesa');
  const [nivel, setNivel] = useState<Nivel>('Superior');
  
  // Selection States
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);

  // Question States
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [nextQuestion, setNextQuestion] = useState<Question | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  
  // Interaction States
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Timer & Session States
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [questionsAnsweredInSession, setQuestionsAnsweredInSession] = useState(0);
  const [correctInSession, setCorrectInSession] = useState(0);
  const [totalSessionTimeTaken, setTotalSessionTimeTaken] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number>(0);

  const bancas: Banca[] = [
    'FGV', 'Cebraspe', 'FCC', 'Vunesp', 'Cesgranrio', 'Instituto AOCP', 
    'IBFC', 'Idecan', 'Instituto Quadrix', 'IADES', 'Selecon', 'Fundatec'
  ];

  const materias: Materia[] = [
    'Língua Portuguesa', 'Matemática', 'Raciocínio Lógico', 'Informática', 
    'Direito Constitucional', 'Direito Administrativo', 'Direito Penal'
  ];

  // Global Countdown Timer
  useEffect(() => {
    if (isSessionActive && timeLeft > 0 && !isGameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isSessionActive, timeLeft, isGameOver]);

  const handleGameOver = () => {
    const finalTime = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
    setTotalSessionTimeTaken(finalTime);
    setIsGameOver(true);
    setIsSessionActive(false);
    setCurrentQuestion(null);
    setNextQuestion(null);
    setShowExplanation(false);
  };

  const startSession = async () => {
    setLoading(true);
    setIsGameOver(false);
    setQuestionsAnsweredInSession(0);
    setCorrectInSession(0);
    setTotalSessionTimeTaken(0);
    setTimeLeft(timeLimitMinutes * 60);
    sessionStartTimeRef.current = Date.now();

    try {
      const q = await generateQuestion(banca, materia, nivel);
      setCurrentQuestion(q);
      setIsSessionActive(true);
      // Generate next question while student starts solving the first one
      prefetchNext(banca, materia, nivel);
    } catch (e) {
      alert("ERRO AO GERAR QUESTÃO. TENTE NOVAMENTE.");
    } finally {
      setLoading(false);
    }
  };

  const prefetchNext = async (currentBanca: Banca, currentMateria: Materia, currentNivel: Nivel) => {
    if (questionsAnsweredInSession + 1 >= questionCount) return;
    setIsPrefetching(true);
    try {
      const q = await generateQuestion(currentBanca, currentMateria, currentNivel);
      setNextQuestion(q);
    } catch (e) {
      console.error("Erro no prefetch", e);
    } finally {
      setIsPrefetching(false);
    }
  };

  const handleAnswer = (opt: string) => {
    if (showExplanation || !currentQuestion) return;
    const isCorrect = opt === currentQuestion.correctAnswerId;
    
    setQuestionsAnsweredInSession(prev => prev + 1);
    if (isCorrect) setCorrectInSession(prev => prev + 1);

    setSelectedOption(opt);
    setShowExplanation(true);
    onQuestionAnswered(isCorrect, materia);
  };

  const nextOrFinish = async () => {
    if (questionsAnsweredInSession >= questionCount) {
      handleGameOver();
      return;
    }

    setShowExplanation(false);
    setSelectedOption(null);

    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setNextQuestion(null);
      prefetchNext(banca, materia, nivel);
    } else {
      setLoading(true);
      try {
        const q = await generateQuestion(banca, materia, nivel);
        setCurrentQuestion(q);
        prefetchNext(banca, materia, nivel);
      } catch (e) {
        alert("Erro ao carregar questão.");
      } finally {
        setLoading(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const avgTime = questionsAnsweredInSession > 0 
    ? (totalSessionTimeTaken || (timeLimitMinutes * 60 - timeLeft)) / questionsAnsweredInSession 
    : 0;

  return (
    <div className="page-transition max-w-5xl mx-auto space-y-10 pb-16">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-blue-600 pl-6">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">SIMULADOR <span className="text-blue-500">MASTER</span></h2>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-1">Treinamento de Questões com Tempo Real</p>
        </div>
        
        {isSessionActive && (
          <div className="flex gap-4">
             <div className="glass-card px-6 py-3 rounded-2xl border-blue-500/20 text-center">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">PROGRESSO</p>
                <p className="text-lg font-black text-white uppercase tracking-tighter">{questionsAnsweredInSession} / {questionCount}</p>
             </div>
             <div className={`glass-card px-6 py-3 rounded-2xl text-center border-zinc-800 ${timeLeft < 60 ? 'border-rose-500/40 animate-pulse' : ''}`}>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">TEMPO RESTANTE</p>
                <p className="text-lg font-black text-white uppercase tracking-tighter font-mono">{formatTime(timeLeft)}</p>
             </div>
          </div>
        )}
      </header>

      {loading && !isSessionActive && (
        <div className="flex flex-col items-center justify-center py-32 space-y-10 animate-in fade-in duration-500">
           <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-[50px] animate-pulse"></div>
              <svg viewBox="0 0 100 100" className="w-40 h-40 animate-pulse fill-none stroke-blue-500" strokeWidth="2.5">
                 <path d="M50 25 C 30 25, 20 40, 20 55 C 20 70, 30 80, 50 80 C 70 80, 80 70, 80 55 C 80 40, 70 25, 50 25 Z" className="opacity-40" />
                 <path d="M50 25 V 80 M20 55 H 80 M35 35 Q 50 50 65 35 M35 70 Q 50 55 65 70" className="opacity-60" />
                 <circle cx="50" cy="52" r="8" fill="#3b82f6" className="animate-ping" />
              </svg>
           </div>
           <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.6em] animate-pulse">Sintonizando Questões Inéditas...</p>
        </div>
      )}

      {!isSessionActive && !isGameOver && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 glass-card p-8 rounded-[2.5rem] border-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3">BANCA EXAMINADORA</label>
            <select value={banca} onChange={e => setBanca(e.target.value as Banca)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-black text-[11px] outline-none focus:border-blue-500 transition-all text-zinc-300 uppercase appearance-none">
              {bancas.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3">DISCIPLINA</label>
            <select value={materia} onChange={e => setMateria(e.target.value as Materia)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-black text-[11px] outline-none focus:border-blue-500 transition-all text-zinc-300 uppercase appearance-none">
              {materias.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3">NÍVEL</label>
            <select value={nivel} onChange={e => setNivel(e.target.value as Nivel)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-black text-[11px] outline-none focus:border-blue-500 transition-all text-zinc-300 uppercase appearance-none">
              <option value="Médio">MÉDIO</option>
              <option value="Superior">SUPERIOR</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3">QUESTÕES</label>
            <input 
              type="number" 
              value={questionCount} 
              min="1" 
              max="100"
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
              className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-black text-[11px] outline-none focus:border-blue-500 transition-all text-zinc-300 text-center" 
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3">TEMPO (MIN)</label>
            <input 
              type="number" 
              value={timeLimitMinutes} 
              min="1" 
              max="240"
              onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 1)}
              className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-black text-[11px] outline-none focus:border-blue-500 transition-all text-zinc-300 text-center" 
            />
          </div>
          <div className="md:col-span-1 flex items-end">
            <button onClick={startSession} disabled={loading} className="w-full h-[54px] neon-button-solid text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] btn-click-effect disabled:opacity-30">
              INICIAR
            </button>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="glass-card p-16 rounded-[3.5rem] text-center border-blue-500/20 animate-in zoom-in duration-700 shadow-2xl space-y-12">
           <div className="space-y-4">
              <div className="text-7xl mb-6">🎯</div>
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter">SIMULADO FINALIZADO</h3>
              <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em]">Análise Consolidada de Performance</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-zinc-900/40 p-10 rounded-[2rem] border border-zinc-800/50 shadow-inner">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">RESOLVIDAS</p>
                 <p className="text-5xl font-black text-white">{questionsAnsweredInSession}</p>
                 <p className="text-[9px] text-zinc-600 mt-2 uppercase font-bold">Questões de {questionCount}</p>
              </div>
              <div className="bg-emerald-500/5 p-10 rounded-[2rem] border border-emerald-500/20 shadow-inner">
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">ACERTOS</p>
                 <p className="text-5xl font-black text-emerald-400">{correctInSession}</p>
                 <p className="text-[9px] text-emerald-900 mt-2 uppercase font-bold">Sucesso Absoluto</p>
              </div>
              <div className="bg-blue-600/5 p-10 rounded-[2rem] border border-blue-600/20 shadow-inner">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">MÉDIA/QUESTÃO</p>
                 <p className="text-5xl font-black text-blue-400">{avgTime.toFixed(1)}s</p>
                 <p className="text-[9px] text-blue-900 mt-2 uppercase font-bold">Velocidade Cognitiva</p>
              </div>
           </div>

           <button 
             onClick={() => setIsGameOver(false)} 
             className="neon-button-blue px-16 py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] btn-click-effect"
           >
             REINICIAR TESTE
           </button>
        </div>
      )}

      {isSessionActive && currentQuestion && (
        <div className="glass-card p-10 md:p-16 rounded-[3rem] space-y-12 animate-in slide-in-from-bottom-8 duration-700 border-blue-500/5 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8">
              <div className="flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                 <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">SESSÃO ATIVA</span>
              </div>
           </div>

           <div className="flex flex-wrap gap-3 text-[9px] font-black uppercase tracking-[0.3em]">
              <span className="bg-zinc-900 border border-zinc-800 px-5 py-2 rounded-full text-zinc-400">{currentQuestion.banca}</span>
              <span className="bg-blue-600/10 border border-blue-500/20 px-5 py-2 rounded-full text-blue-500">{currentQuestion.materia}</span>
              <span className="bg-zinc-900 border border-zinc-800 px-5 py-2 rounded-full text-zinc-500">QUESTÃO {questionsAnsweredInSession + 1}</span>
           </div>

           <div className="space-y-10">
              <h2 className="text-2xl md:text-3xl font-bold leading-tight text-zinc-100 tracking-tight">{currentQuestion.statement}</h2>
              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map(opt => {
                  const isCorrect = opt.id === currentQuestion.correctAnswerId;
                  const isSelected = selectedOption === opt.id;
                  let styleClass = "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700";
                  if (showExplanation) {
                    if (isCorrect) styleClass = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-[0_0_25px_rgba(16,185,129,0.15)]";
                    else if (isSelected) styleClass = "bg-red-500/10 border-red-500 text-red-400 opacity-80";
                    else styleClass = "opacity-20 blur-[1px]";
                  }
                  return (
                    <button 
                      key={opt.id} 
                      onClick={() => handleAnswer(opt.id)} 
                      disabled={showExplanation} 
                      className={`w-full p-6 rounded-2xl border transition-all flex gap-6 text-left group btn-click-effect relative overflow-hidden ${styleClass}`}
                    >
                      <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border text-[11px] font-black transition-all ${
                        showExplanation && isCorrect 
                        ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                        : 'border-zinc-700 bg-zinc-950 text-zinc-500'
                      }`}>
                        {opt.id}
                      </span>
                      <span className="text-sm md:text-base font-medium flex-1 self-center">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
           </div>

           {showExplanation && (
             <div className="p-10 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-[2.5rem] space-y-6 animate-in fade-in zoom-in duration-500 shadow-inner">
               <div className="flex items-center gap-4">
                 <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                 <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">EXPLICAÇÃO TÉCNICA</h4>
               </div>
               <p className="text-zinc-400 text-base leading-relaxed italic border-l border-zinc-800 pl-6">{currentQuestion.explanation}</p>
               <div className="pt-8 flex justify-end">
                  <button 
                    onClick={nextOrFinish} 
                    className="neon-button-blue px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-4"
                  >
                    {isPrefetching && !nextQuestion ? 'SINTETIZANDO PRÓXIMA...' : questionsAnsweredInSession >= questionCount ? 'VER RESULTADOS' : 'PRÓXIMA QUESTÃO'} 
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
               </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default Simulator;
