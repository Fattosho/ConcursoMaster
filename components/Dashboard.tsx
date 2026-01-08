
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { UserPerformance } from '../types';

interface DashboardProps {
  performance: UserPerformance;
}

const Dashboard: React.FC<DashboardProps> = ({ performance }) => {
  const chartData = [
    { name: 'Acertos', value: performance.correctAnswers, color: '#10b981' },
    { name: 'Erros', value: performance.totalAnswered - performance.correctAnswers, color: '#ef4444' },
  ];

  // Fix: Cast stats to the known shape { total: number; correct: number } to resolve 'unknown' type errors
  const subjectData = Object.entries(performance.subjectStats).map(([name, stats]) => {
    const s = stats as { total: number; correct: number };
    return {
      name,
      acuracia: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
    };
  });

  const accuracy = performance.totalAnswered > 0 
    ? Math.round((performance.correctAnswers / performance.totalAnswered) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-gray-800">Seu Desempenho</h2>
        <p className="text-gray-500">Acompanhe sua evolução rumo à aprovação.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Aproveitamento Geral</h3>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-[-110px] pb-[80px]">
            <span className="text-3xl font-bold text-gray-800">{accuracy}%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Desempenho por Matéria (%)</h3>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData}>
                <XAxis dataKey="name" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="acuracia" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {subjectData.map((s) => (
              <div key={s.name} className="flex justify-between text-sm">
                <span className="text-gray-600">{s.name}</span>
                <span className="font-semibold text-blue-600">{s.acuracia}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-600 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold opacity-80 uppercase mb-1">Total de Questões</h3>
            <span className="text-4xl font-bold">{performance.totalAnswered}</span>
          </div>
          <div className="mt-8">
            <h3 className="text-sm font-semibold opacity-80 uppercase mb-1">Média de Acertos Diários</h3>
            <span className="text-2xl font-bold">12 q/dia</span>
          </div>
          <button className="mt-6 w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-colors">
            Gerar Relatório PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
