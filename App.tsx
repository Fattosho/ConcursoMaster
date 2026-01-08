
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Simulator from './components/Simulator';
import EssaySimulator from './components/EssaySimulator';
import MnemonicGenerator from './components/MnemonicGenerator';
import { UserPerformance } from './types';
import { getLatestNews, editStudyImage, generateMindMapFromDescription, transcribeAndSummarizeAudio } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [performance, setPerformance] = useState<UserPerformance>(() => {
    try {
      const saved = localStorage.getItem('user_performance');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          totalAnswered: parsed.totalAnswered || 0,
          correctAnswers: parsed.correctAnswers || 0,
          subjectStats: parsed.subjectStats || {}
        };
      }
    } catch (e) {
      console.error("Performance restore failed", e);
    }
    return {
      totalAnswered: 0,
      correctAnswers: 0,
      subjectStats: {}
    };
  });

  // News States
  const [newsQuery, setNewsQuery] = useState('Editais de Concursos 2024 2025');
  const [newsResult, setNewsResult] = useState<{text: string, sources: any[]} | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);

  // Mind Map States
  const [mindMapMode, setMindMapMode] = useState<'enhance' | 'text' | 'voice' | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isProcessingMindMap, setIsProcessingMindMap] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    localStorage.setItem('user_performance', JSON.stringify(performance));
  }, [performance]);

  const handleQuestionAnswered = (isCorrect: boolean, subject: string) => {
    setPerformance(prev => {
      const stats = { ...(prev.subjectStats || {}) };
      const current = stats[subject] || { total: 0, correct: 0 };
      
      return {
        ...prev,
        totalAnswered: (prev.totalAnswered || 0) + 1,
        correctAnswers: (prev.correctAnswers || 0) + (isCorrect ? 1 : 0),
        subjectStats: {
          ...stats,
          [subject]: {
            total: current.total + 1,
            correct: current.correct + (isCorrect ? 1 : 0)
          }
        }
      };
    });
  };

  const handleSearchNews = async () => {
    setNewsLoading(true);
    setNewsResult(null);
    try {
      const result = await getLatestNews(newsQuery);
      setNewsResult(result);
    } catch (err) {
      alert("Falha na busca de editais.");
    } finally {
      setNewsLoading(false);
    }
  };

  // Image Logic
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setSelectedImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleMindMapAction = async () => {
    if (!mindMapMode) return;
    setIsProcessingMindMap(true);
    try {
      if (mindMapMode === 'enhance') {
        if (!selectedImage) return;
        const result = await editStudyImage(selectedImage, imagePrompt || "Melhore a clareza e cores");
        if (result) setSelectedImage(result);
      } else if (mindMapMode === 'text') {
        const result = await generateMindMapFromDescription(imagePrompt);
        if (result) setSelectedImage(result);
      }
    } catch (err) {
      alert("Erro ao processar mapa mental.");
    } finally {
      setIsProcessingMindMap(false);
    }
  };

  // Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsProcessingMindMap(true);
          try {
            const summary = await transcribeAndSummarizeAudio(base64Audio);
            const mindMapResult = await generateMindMapFromDescription(summary);
            if (mindMapResult) setSelectedImage(mindMapResult);
          } catch (e) {
            alert("Erro ao processar áudio.");
          } finally {
            setIsProcessingMindMap(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      alert("Microfone não disponível.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-zinc-100 selection:bg-lime-400 selection:text-black">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-10 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto w-full">
          {activeTab === 'dashboard' && <Dashboard performance={performance} />}
          
          {activeTab === 'simulator' && <Simulator onQuestionAnswered={handleQuestionAnswered} />}

          {activeTab === 'essay' && <EssaySimulator />}

          {activeTab === 'mnemonics' && <MnemonicGenerator />}
          
          {activeTab === 'news' && (
            <div className="page-transition space-y-6 md:space-y-8">
              <header className="border-l-4 border-blue-600 pl-6">
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">CENTRAL DE <span className="text-blue-500">EDITAIS</span></h2>
                <p className="text-zinc-500 font-medium text-sm mt-1">Busca e filtragem avançada em tempo real.</p>
              </header>
              <div className="flex flex-col sm:flex-row gap-4 bg-zinc-900/40 p-3 rounded-[2rem] border border-zinc-800/50">
                <input 
                  value={newsQuery}
                  onChange={(e) => setNewsQuery(e.target.value)}
                  className="flex-1 bg-transparent p-4 md:px-6 md:py-4 rounded-2xl outline-none font-bold text-sm"
                  placeholder="Buscando editais..."
                />
                <button 
                  onClick={handleSearchNews} 
                  disabled={newsLoading}
                  className="bg-blue-600 text-white px-10 py-4 sm:py-0 rounded-2xl font-black text-[10px] md:text-xs uppercase hover:bg-blue-700 transition-all btn-click-effect shadow-lg shadow-blue-900/20"
                >
                  {newsLoading ? 'Buscando...' : 'Varrer Rede'}
                </button>
              </div>

              {newsLoading && (
                <div className="flex flex-col items-center justify-center p-20 space-y-8 animate-in fade-in duration-700">
                  <div className="relative w-48 h-48 rounded-full border border-blue-500/20 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 origin-center bg-gradient-to-r from-blue-500/40 to-transparent w-full h-full animate-[radar-rotate_3s_linear_infinite]" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}></div>
                  </div>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] animate-pulse">Radar Ativo...</p>
                </div>
              )}

              {newsResult && (
                <div className="glass-card p-6 md:p-12 rounded-[2.5rem] border-blue-500/10 shadow-2xl">
                  <div className="prose prose-invert prose-sm md:prose-base max-w-none text-zinc-400 whitespace-pre-wrap font-sans">
                    {newsResult.text}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3 pt-6 border-t border-zinc-800">
                    {newsResult.sources.map((src, i) => (
                      <a key={i} href={src.web?.uri || '#'} target="_blank" className="text-[9px] bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-zinc-400 hover:text-blue-500">
                        {src.web?.title || 'Fonte'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'image-tools' && (
            <div className="page-transition space-y-12">
              <header className="border-l-4 border-blue-600 pl-6">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">MAPAS <span className="text-blue-500">MENTAIS</span></h2>
                <p className="text-zinc-500 font-medium text-sm mt-1">Selecione a forma que iremos receber sua ideia de mapa mental</p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <button onClick={() => { setMindMapMode('enhance'); setSelectedImage(null); }} className={`group p-6 rounded-3xl border transition-all flex flex-col items-center gap-4 btn-click-effect ${mindMapMode === 'enhance' ? 'bg-blue-600 border-blue-500 shadow-xl' : 'bg-zinc-900/50 border-zinc-800'}`}>
                  <div className="text-4xl">📸</div>
                  <span className={`text-[11px] font-black uppercase tracking-widest ${mindMapMode === 'enhance' ? 'text-white' : 'text-zinc-400'}`}>Foto</span>
                </button>
                <button onClick={() => { setMindMapMode('text'); setSelectedImage(null); }} className={`group p-6 rounded-3xl border transition-all flex flex-col items-center gap-4 btn-click-effect ${mindMapMode === 'text' ? 'bg-blue-600 border-blue-500 shadow-xl' : 'bg-zinc-900/50 border-zinc-800'}`}>
                  <div className="text-4xl">✍️</div>
                  <span className={`text-[11px] font-black uppercase tracking-widest ${mindMapMode === 'text' ? 'text-white' : 'text-zinc-400'}`}>Texto</span>
                </button>
                <button onClick={() => { setMindMapMode('voice'); setSelectedImage(null); }} className={`group p-6 rounded-3xl border transition-all flex flex-col items-center gap-4 btn-click-effect ${mindMapMode === 'voice' ? 'bg-blue-600 border-blue-500 shadow-xl' : 'bg-zinc-900/50 border-zinc-800'}`}>
                  <div className="text-4xl">🎙️</div>
                  <span className={`text-[11px] font-black uppercase tracking-widest ${mindMapMode === 'voice' ? 'text-white' : 'text-zinc-400'}`}>Voz</span>
                </button>
              </div>

              {mindMapMode && (
                <div className="max-w-4xl mx-auto glass-card p-8 rounded-[2.5rem] border-zinc-800/50 space-y-8 animate-in slide-in-from-top-4">
                  {mindMapMode === 'enhance' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      <div className="space-y-4">
                        <input type="file" id="map-upload" hidden onChange={handleImageUpload} />
                        <label htmlFor="map-upload" className="block w-full text-center border-2 border-dashed border-zinc-800 p-10 rounded-3xl cursor-pointer hover:border-blue-500 transition-all bg-zinc-950/50">
                           {selectedImage ? <img src={selectedImage} className="h-20 mx-auto rounded-lg" /> : <span className="text-[10px] font-black text-zinc-500 uppercase">Upload do Mapa</span>}
                        </label>
                        <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Instruções de ajuste..." className="w-full bg-zinc-950 p-5 rounded-2xl border border-zinc-800 focus:border-blue-500 outline-none text-xs h-24 resize-none" />
                      </div>
                      <button onClick={handleMindMapAction} disabled={!selectedImage || isProcessingMindMap} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase hover:bg-blue-700 disabled:opacity-20 btn-click-effect shadow-xl">Aprimorar Agora</button>
                    </div>
                  )}

                  {mindMapMode === 'text' && (
                    <div className="space-y-6">
                      <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Digite o conteúdo..." className="w-full bg-zinc-950 p-6 rounded-3xl border border-zinc-800 focus:border-blue-500 outline-none text-sm h-48" />
                      <button onClick={handleMindMapAction} disabled={!imagePrompt || isProcessingMindMap} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl">Gerar Mapa Visual</button>
                    </div>
                  )}

                  {mindMapMode === 'voice' && (
                    <div className="flex flex-col items-center justify-center py-12 gap-10">
                      <button onClick={isRecording ? stopRecording : startRecording} className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {isRecording ? <div className="w-10 h-10 bg-white rounded-md"></div> : <span className="text-4xl text-white">🎙️</span>}
                      </button>
                      <p className="text-xs font-black uppercase text-zinc-500">{isRecording ? 'Capturando...' : 'Toque para Começar'}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedImage && !isProcessingMindMap && (
                <div className="animate-in zoom-in glass-card rounded-[2.5rem] border-blue-500/10 p-10 flex flex-col items-center gap-8">
                  <img src={selectedImage} className="max-w-full max-h-[600px] rounded-3xl" />
                  <a href={selectedImage} download="mapa-mental.png" className="bg-zinc-900 border border-zinc-800 px-10 py-4 rounded-2xl font-black text-[10px] uppercase">Baixar Esquema Visual</a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
