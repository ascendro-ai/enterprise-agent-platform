
import React, { useState } from 'react';
import { Users, FilePlus, MonitorPlay, GitBranch, ChevronLeft, ChevronRight } from 'lucide-react';
import { Screen } from '../types';

interface SidebarProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onScreenChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: Screen.CONSULTANT, icon: FilePlus, label: 'Create a Task' },
    { id: Screen.WORKFLOWS, icon: GitBranch, label: 'Your Workflows' },
    { id: Screen.ORG_CHART, icon: Users, label: 'Your Team' },
  ];

  const operationsItems = [
    { id: Screen.CONTROL_ROOM, icon: MonitorPlay, label: 'Control Room' },
    // { id: Screen.TEST_SUITE, icon: FlaskConical, label: 'Test Suite' }, // Temporarily hidden
  ];

  const allItems = [...navItems, ...operationsItems];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative`}>
      <div className={`p-6 ${isCollapsed ? 'px-4' : ''} relative`}>
        {/* Collapse/Expand Button - Full circle, closer to logo */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`${isCollapsed ? 'mx-auto' : 'absolute right-4 top-6'} z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow`}
        >
          {isCollapsed ? (
            <ChevronRight size={14} className="text-gray-600" />
          ) : (
            <ChevronLeft size={14} className="text-gray-600" />
          )}
        </button>

        {!isCollapsed && (
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 rounded-md"></div>
            Workflow.ai
          </h1>
        )}
      </div>

      <nav className={`flex-1 space-y-1 pt-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {allItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${
              currentScreen === item.id
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-400'
            }`}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon size={18} className={currentScreen === item.id ? 'text-gray-900' : 'text-gray-400'} />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className={`p-4 border-t border-gray-100 ${isCollapsed ? 'px-2' : ''}`}>
        {isCollapsed ? (
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600 mx-auto">
            CM
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600">
              CM
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Chitra M.</p>
              <p className="text-xs text-gray-500">CEO, Treasure Blossom</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
