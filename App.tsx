
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Simulator from './components/Simulator';
import { UserPerformance } from './types';
import { chatWithTutor, findStudyPlaces, editStudyImage, getLatestNews } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [performance, setPerformance] = useState<UserPerformance>(() => {
    const saved = localStorage.getItem('user_performance');
    return saved ? JSON.parse(saved) : {
      totalAnswered: 0,
      correctAnswers: 0,
      subjectStats: {
        'Direito Constitucional': { total: 0, correct: 0 },
        'Direito Administrativo': { total: 0, correct: 0 },
        'Português': { total: 0, correct: 0 },
        'Raciocínio Lógico': { total: 0, correct: 0 },
        'Informática': { total: 0, correct: 0 }
      }
    };
  });

  // State for AI Tutor
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // State for News
  const [newsQuery, setNewsQuery] = useState('Edital Receita Federal');
  const [newsResult, setNewsResult] = useState<{text: string, sources: any[]} | null>(null);

  // State for Maps
  const [places, setPlaces] = useState<{text: string, places: any[]} | null>(null);
  
  // State for Image Editing
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);

  useEffect(() => {
    localStorage.setItem('user_performance', JSON.stringify(performance));
  }, [performance]);

  const handleQuestionAnswered = (isCorrect: boolean, subject: string) => {
    setPerformance(prev => ({
      ...prev,
      totalAnswered: prev.totalAnswered + 1,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      subjectStats: {
        ...prev.subjectStats,
        [subject]: {
          total: (prev.subjectStats[subject]?.total || 0) + 1,
          correct: (prev.subjectStats[subject]?.correct || 0) + (isCorrect ? 1 : 0)
        }
      }
    }));
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const response = await chatWithTutor([], userMsg);
      setChatMessages(prev => [...prev, { role: 'model', text: response || 'Sem resposta.' }]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSearchNews = async () => {
    setNewsResult(null);
    const result = await getLatestNews(newsQuery);
    setNewsResult(result);
  };

  const handleFindPlaces = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const result = await findStudyPlaces(pos.coords.latitude, pos.coords.longitude);
      setPlaces(result);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setSelectedImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditImage = async () => {
    if (!selectedImage || !imagePrompt) return;
    setIsEditingImage(true);
    const result = await editStudyImage(selectedImage, imagePrompt);
    if (result) setSelectedImage(result);
    setIsEditingImage(false);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard performance={performance} />}
        
        {activeTab === 'simulator' && <Simulator onQuestionAnswered={handleQuestionAnswered} />}
        
        {activeTab === 'tutor' && (
          <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 bg-blue-600 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-xl">🤖</div>
              <div>
                <h3 className="font-bold">Tutor IA - Especialista em Concursos</h3>
                <p className="text-xs opacity-80">Disponível 24/7 para tirar dúvidas</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-400 mt-20">
                  <p className="text-3xl mb-4">👋</p>
                  <p>Pergunte algo como: "O que é o princípio da legalidade no Direito Administrativo?"</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && <div className="text-sm text-gray-400 animate-pulse">Pensando na melhor explicação...</div>}
            </div>
            <form onSubmit={handleChatSubmit} className="p-4 border-t flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Digite sua dúvida aqui..."
                className="flex-1 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button type="submit" className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                Enviar
              </button>
            </form>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex gap-4">
              <input 
                value={newsQuery}
                onChange={(e) => setNewsQuery(e.target.value)}
                className="flex-1 p-4 rounded-xl border"
                placeholder="Qual edital você busca?"
              />
              <button onClick={handleSearchNews} className="bg-blue-600 text-white px-8 rounded-xl font-bold">Buscar Notícias</button>
            </div>
            {newsResult && (
              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">{newsResult.text}</div>
                <div className="pt-4 border-t">
                  <h4 className="font-bold text-sm text-gray-400 uppercase mb-2">Fontes Verificadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {newsResult.sources.map((src, i) => (
                      <a key={i} href={src.web?.uri} target="_blank" className="text-xs bg-gray-100 px-3 py-1 rounded-full text-blue-600 hover:bg-blue-50">
                        {src.web?.title || 'Link'}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'maps' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-blue-900 text-white p-8 rounded-3xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">Foco Total: Onde estudar?</h3>
                <p className="opacity-80 mb-6 max-w-md">Encontre bibliotecas, salas de estudo e cursinhos perto de sua localização atual.</p>
                <button onClick={handleFindPlaces} className="bg-white text-blue-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                  Localizar Agora
                </button>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            </div>

            {places && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {places.places.map((p, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                    <div>
                      <h4 className="font-bold text-gray-800">{p.title}</h4>
                      <p className="text-sm text-gray-400">Perto de você</p>
                    </div>
                    <a href={p.uri} target="_blank" className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100">
                      Ver no Mapa
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'image-tools' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Editor de Materiais</h2>
                <p className="text-gray-500">Aprimore seus mapas mentais e resumos com IA.</p>
              </div>
              <input type="file" id="upload" hidden onChange={handleImageUpload} />
              <label htmlFor="upload" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer hover:bg-blue-700 transition-colors">
                Subir Material
              </label>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white rounded-2xl border p-4 flex items-center justify-center min-h-[400px]">
                {selectedImage ? (
                  <img src={selectedImage} alt="Preview" className="max-w-full max-h-full rounded-lg shadow-lg" />
                ) : (
                  <div className="text-center text-gray-300">
                    <p className="text-5xl mb-4">🖼️</p>
                    <p>Faça upload de uma foto do seu resumo</p>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800">Magia da IA</h3>
                <textarea 
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Ex: 'Remova as cores de fundo', 'Destaque o texto', 'Transforme em um estilo retrô'..."
                  className="w-full p-3 h-32 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <button 
                  onClick={handleEditImage}
                  disabled={!selectedImage || isEditingImage}
                  className="w-full bg-gradient-study text-white py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  {isEditingImage ? 'Editando...' : 'Aplicar Edição'}
                </button>
                <div className="text-xs text-gray-400 italic">
                  Utiliza Gemini 2.5 Flash Image para processamento avançado de imagens de estudo.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
