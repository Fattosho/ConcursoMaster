
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const Professor: React.FC = () => {
  const [mode, setMode] = useState<'none' | 'audio' | 'text'>('none');
  const [messages, setMessages] = useState<{ role: 'user' | 'system'; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, mode]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
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
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const createBlob = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startLiveSession = async () => {
    setMode('audio');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onclose: () => setMode('none'),
          onerror: (e) => console.error(e)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: 'Você é um Mentor Técnico para concursos. Suas respostas devem ser curtas, diretas e estritamente profissionais. Evite saudações longas.'
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      alert("Erro ao acessar microfone.");
      setMode('none');
    }
  };

  const stopLiveSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setMode('none');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const userMsg = inputText;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText('');
    setIsTyping(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: { 
          systemInstruction: 'Você é um Mentor Técnico para concursos. Forneça respostas curtas, diretas e objetivas. Use listas (bullets) para organizar conceitos. Evite formatações complexas de markdown, prefira texto limpo e parágrafos curtos.' 
        }
      });
      setMessages(prev => [...prev, { role: 'system', text: response.text || '' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', text: 'Erro de conexão com o sistema.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="page-transition max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh] space-y-16">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">TIRE AQUI SUAS DÚVIDAS</h2>
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em]">Consultoria Especializada Privada</p>
      </div>

      {mode === 'none' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl px-6">
          <button 
            onClick={startLiveSession}
            className="flex flex-col items-center justify-center gap-8 p-14 bg-zinc-900 border border-zinc-800 rounded-[3rem] hover:border-blue-500/50 hover:bg-zinc-800/30 transition-all group btn-click-effect shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ring-1 ring-blue-500/20">
              <svg className="w-10 h-10 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="font-black text-[12px] text-zinc-400 tracking-[0.3em] group-hover:text-white uppercase transition-colors">ÁUDIO</span>
          </button>

          <button 
            onClick={() => setMode('text')}
            className="flex flex-col items-center justify-center gap-8 p-14 bg-zinc-900 border border-zinc-800 rounded-[3rem] hover:border-emerald-500/50 hover:bg-zinc-800/30 transition-all group btn-click-effect shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-24 h-24 bg-zinc-950 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ring-1 ring-zinc-800 group-hover:ring-emerald-500/30">
              <svg className="w-10 h-10 text-zinc-500 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="font-black text-[12px] text-zinc-400 tracking-[0.3em] group-hover:text-white uppercase transition-colors">TEXTO</span>
          </button>
        </div>
      )}

      {mode === 'audio' && (
        <div className="w-full max-w-xl bg-zinc-950 border border-blue-500/20 rounded-[3.5rem] p-16 flex flex-col items-center space-y-12 animate-in zoom-in duration-500 shadow-[0_0_50px_rgba(59,130,246,0.05)]">
          <div className="flex gap-2 h-20 items-center">
            {[...Array(16)].map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 bg-blue-500 rounded-full animate-[pulse_1s_infinite]" 
                style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.05}s` }}
              ></div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-[11px] font-black text-blue-500 tracking-[0.5em] uppercase mb-2">MODULAÇÃO ATIVA</p>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Ouvindo sua frequência...</p>
          </div>
          <button 
            onClick={stopLiveSession}
            className="px-12 py-5 bg-zinc-900 border border-red-500/50 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all btn-click-effect shadow-[0_0_20px_rgba(244,63,94,0.1)]"
          >
            ENCERRAR SESSÃO
          </button>
        </div>
      )}

      {mode === 'text' && (
        <div className="w-full max-w-3xl flex flex-col h-[650px] bg-zinc-950 border border-zinc-900 rounded-[3.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-12 duration-700">
          <div className="px-8 py-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              <span className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">TERMINAL DE TEXTO</span>
            </div>
            <button onClick={() => setMode('none')} className="text-zinc-600 hover:text-white transition-colors p-2 uppercase font-black text-[9px] tracking-widest">
              FECHAR
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-1 p-10 overflow-y-auto space-y-6 bg-zinc-950/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-zinc-900 text-zinc-300 border border-zinc-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 bg-zinc-900/20 border-t border-zinc-900 flex gap-4">
            <input 
              autoFocus
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="DIGITE SUA DÚVIDA TÉCNICA..."
              className="flex-1 bg-zinc-950 border border-zinc-800 p-5 rounded-2xl outline-none text-sm text-zinc-100 placeholder:text-[9px] placeholder:font-black placeholder:tracking-[0.2em] focus:border-blue-600 transition-all"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="neon-button-solid text-white px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-20"
            >
              ENVIAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Professor;
