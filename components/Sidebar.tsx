
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: '📊' },
    { id: 'simulator', label: 'Simulador', icon: '📝' },
    { id: 'tutor', label: 'Tutor IA', icon: '🤖' },
    { id: 'maps', label: 'Onde Estudar', icon: '📍' },
    { id: 'news', label: 'Notícias & Editais', icon: '📰' },
    { id: 'image-tools', label: 'Editor de Materiais', icon: '🎨' },
  ];

  return (
    <aside className="w-64 bg-white border-r h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
        <h1 className="font-bold text-xl text-blue-900">ConcursoMaster</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
              activeTab === item.id 
                ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t">
        <div className="bg-gradient-study p-4 rounded-xl text-white">
          <p className="text-xs font-medium opacity-80 uppercase">Plano Pro Ativo</p>
          <p className="text-sm font-bold mt-1">Sua jornada até a posse!</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
