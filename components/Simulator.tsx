
import React, { useState } from 'react';
import { Banca, Materia, Question } from '../types';
import { generateQuestion } from '../services/geminiService';

interface SimulatorProps {
  onQuestionAnswered: (isCorrect: boolean, subject: string) => void;
}

const Simulator: React.FC<SimulatorProps> = ({ onQuestionAnswered }) => {
  const [banca, setBanca] = useState<Banca>('FGV');
  const [materia, setMateria] = useState<Materia>('Direito Constitucional');
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const startNewQuestion = async () => {
    setLoading(true);
    setShowExplanation(false);
    setSelectedOption(null);
    try {
      const q = await generateQuestion(banca, materia);
      setQuestion(q);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar questão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optionId: string) => {
    if (showExplanation) return;
    setSelectedOption(optionId);
    setShowExplanation(true);
    onQuestionAnswered(optionId === question?.correctAnswerId, materia);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Banca</label>
          <select 
            value={banca} 
            onChange={(e) => setBanca(e.target.value as Banca)}
            className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {['FGV', 'FCC', 'CESPE', 'Vunesp'].map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Matéria</label>
          <select 
            value={materia} 
            onChange={(e) => setMateria(e.target.value as Materia)}
            className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {['Direito Constitucional', 'Direito Administrativo', 'Português', 'Raciocínio Lógico', 'Informática'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <button 
          onClick={startNewQuestion}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
        >
          {loading ? 'Gerando...' : 'Iniciar Questão'}
        </button>
      </div>

      {question && (
        <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-start">
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">#{question.id}</span>
            <span className="text-gray-400 text-sm">{question.banca} • {question.materia}</span>
          </div>
          
          <p className="text-lg text-gray-800 leading-relaxed font-medium">
            {question.statement}
          </p>

          <div className="space-y-3">
            {question.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const isCorrect = opt.id === question.correctAnswerId;
              let bgColor = 'bg-gray-50 border-gray-200 hover:border-blue-400';
              
              if (showExplanation) {
                if (isCorrect) bgColor = 'bg-green-100 border-green-500 text-green-800';
                else if (isSelected) bgColor = 'bg-red-100 border-red-500 text-red-800';
                else bgColor = 'bg-gray-50 border-gray-200 opacity-50';
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(opt.id)}
                  disabled={showExplanation}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${bgColor}`}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-full border border-current font-bold text-xs">
                    {opt.id}
                  </span>
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
              <h4 className="font-bold text-blue-800 flex items-center gap-2">
                💡 Explicação do Especialista
              </h4>
              <p className="text-blue-900 text-sm leading-relaxed">
                {question.explanation}
              </p>
              <button 
                onClick={startNewQuestion}
                className="mt-4 text-sm font-bold text-blue-600 hover:underline"
              >
                Próxima Questão →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Simulator;
