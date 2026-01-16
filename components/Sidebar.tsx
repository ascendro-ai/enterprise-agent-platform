
import React from 'react';
import { Users, FilePlus, MonitorPlay, FlaskConical, BarChart3 } from 'lucide-react';
import { Screen } from '../types';

interface SidebarProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onScreenChange }) => {
  const navItems = [
    { id: Screen.CONSULTANT, icon: FilePlus, label: 'Workspace' },
    { id: Screen.ORG_CHART, icon: Users, label: 'Your Team' },
  ];

  const operationsItems = [
    { id: Screen.CONTROL_ROOM, icon: MonitorPlay, label: 'Control Room' },
    // { id: Screen.TEST_SUITE, icon: FlaskConical, label: 'Test Suite' }, // Temporarily hidden
    { id: Screen.ANALYTICS, icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 rounded-md"></div>
            Workflow.ai
        </h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 mt-4">Development</p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${
              currentScreen === item.id
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-400'
            }`}
          >
            <item.icon size={18} className={currentScreen === item.id ? 'text-gray-900' : 'text-gray-400'} />
            {item.label}
          </button>
        ))}

        <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 mt-6">Operations</p>
        {operationsItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${
              currentScreen === item.id
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-400'
            }`}
          >
            <item.icon size={18} className={currentScreen === item.id ? 'text-gray-900' : 'text-gray-400'} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600">
                CM
            </div>
            <div>
                <p className="text-sm font-medium text-gray-900">Chitra M.</p>
                <p className="text-xs text-gray-500">CEO, Treasure Blossom</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
