
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { UserPerformance } from '../types';

interface DashboardProps { performance: UserPerformance; }

const Dashboard: React.FC<DashboardProps> = ({ performance }) => {
  const correct = performance.correctAnswers || 0;
  const total = performance.totalAnswered || 0;
  const stats: Record<string, { total: number; correct: number }> = performance.subjectStats || {};
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const chartData = [
    { name: 'Corretas', value: correct, color: '#3b82f6' },
    { name: 'Restante', value: Math.max(0, total - correct), color: '#18181b' },
  ];

  const subjectData = Object.entries(stats).map(([name, stat]) => ({
    name: name.split(' ').map(w => w[0]).join(''),
    fullName: name,
    accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
  })).slice(0, 6);

  return (
    <div className="page-transition space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
             <h2 className="text-4xl font-black text-white uppercase tracking-tighter">CENTRAL DE <span className="text-blue-500">COMANDO</span></h2>
          </div>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">Painel de Controle de Alta Performance</p>
        </div>
        
        <div className="flex items-center gap-6 bg-zinc-900/40 p-4 rounded-3xl border border-white/5">
           <div className="text-right">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">SISTEMA ATIVO</p>
              <p className="text-xs font-black text-emerald-500">ESTABILIDADE 99.9%</p>
           </div>
           <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]"></div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Score Card */}
        <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] border-blue-500/10 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="flex justify-between items-start">
             <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">SCORE COGNITIVO</p>
                <h3 className="text-7xl font-black text-white tracking-tighter">{accuracy}<span className="text-blue-500 text-4xl">%</span></h3>
             </div>
             <div className="w-32 h-32 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
          
          <div className="mt-10 space-y-4">
             <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                <span>ESTÁGIO ATUAL</span>
                <span className="text-blue-500">PROCESSO AVANÇADO</span>
             </div>
             <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: `${accuracy}%` }}></div>
             </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="glass-card p-8 rounded-[2.5rem] border-zinc-900 flex flex-col justify-center gap-2 group hover:border-blue-500/30 transition-colors">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">QUESTÕES RESOLVIDAS</p>
          <p className="text-5xl font-black text-white group-hover:text-blue-500 transition-colors">{total}</p>
          <p className="text-[10px] font-bold text-zinc-600 uppercase">Volume de Dados</p>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border-zinc-900 flex flex-col justify-center gap-2 group hover:border-emerald-500/30 transition-colors">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">TAXA DE ACERTO</p>
          <p className="text-5xl font-black text-white group-hover:text-emerald-500 transition-colors">{correct}</p>
          <p className="text-[10px] font-bold text-zinc-600 uppercase">Pontos de Impacto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Bar Chart */}
        <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] border-zinc-900 overflow-hidden relative">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">ANALÍTICO POR DISCIPLINA</h3>
            <div className="flex gap-2">
               <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
               <div className="w-2 h-2 bg-zinc-800 rounded-full"></div>
            </div>
          </div>
          <div className="w-full h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={subjectData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                 <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                 <YAxis hide />
                 <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                 />
                 <Bar dataKey="accuracy" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Streak/Achievement Section */}
        <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-[3rem] border border-blue-500/10 flex flex-col justify-center items-center text-center space-y-6">
           <div className="w-24 h-24 bg-blue-600/10 rounded-[2rem] flex items-center justify-center border border-blue-500/20 shadow-2xl relative">
              <span className="text-5xl">🔥</span>
              <div className="absolute -top-2 -right-2 bg-blue-600 w-8 h-8 rounded-full border-4 border-black flex items-center justify-center text-[10px] font-black">7</div>
           </div>
           <div>
              <h4 className="text-xl font-black text-white uppercase tracking-tighter">SEQUÊNCIA DE FOCO</h4>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-2">Você está no caminho certo!</p>
           </div>
           <div className="grid grid-cols-7 gap-2 w-full pt-4">
              {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className={`h-8 rounded-lg border flex items-center justify-center transition-all ${i <= 7 ? 'bg-blue-600/20 border-blue-500/50' : 'bg-zinc-950 border-zinc-900'}`}>
                   <span className="text-[8px] font-black text-blue-400">D{i}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Recommended Action */}
      <div className="glass-card p-6 rounded-3xl border-zinc-900 flex items-center justify-between group cursor-pointer hover:bg-blue-600/5 transition-all">
         <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎯</div>
            <div>
               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">PRÓXIMA META RECOMENDADA</p>
               <p className="text-sm font-black text-white uppercase tracking-tight">Simulado de Direito Constitucional - 15 Questões</p>
            </div>
         </div>
         <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">
            <svg className="w-4 h-4 text-zinc-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
            </svg>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
