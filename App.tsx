
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Screen1Consultant from './components/Screen1Consultant';
import Screen2OrgChart from './components/Screen2OrgChart';
import Screen3Workflows from './components/Screen3Workflows';
import Screen4ControlRoom from './components/Screen4ControlRoom';
import Screen5TestSuite from './components/Screen5TestSuite';
import { Screen, ChatMessage } from './types';

// Shared type for stakeholder data (Your Team)
interface NodeData {
  name: string;
  type: 'ai' | 'human';
  role?: string;
  img?: string;
  status?: 'active' | 'needs_attention';
  assignedWorkflows?: string[]; // Array of workflow IDs assigned to this stakeholder
  children?: NodeData[];
}

const App: React.FC = () => {
  // Use a direct screen state instead of just a number index for more flexibility
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.CONSULTANT);
  
  // Shared state for org chart data - Control Room will read from this
  const [orgChartData, setOrgChartData] = useState<NodeData>({
    name: "You",
    type: 'human',
    role: "Owner",
    children: []
  });

  // Store consultant conversation history for session persistence
  const [consultantMessages, setConsultantMessages] = useState<ChatMessage[]>([]);
  
  // Store workflows - shared across components
  const [workflows, setWorkflows] = useState<any[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('workflows');
        if (saved) {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed : [];
        }
      }
    } catch (e) {
      console.error('Error loading workflows:', e);
    }
    return [];
  });

  // Save workflows to localStorage whenever they change
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('workflows', JSON.stringify(workflows));
      }
    } catch (e) {
      console.error('Error saving workflows:', e);
    }
  }, [workflows]);

  const renderScreen = () => {
    switch (activeScreen) {
      case Screen.CONSULTANT:
        return <Screen1Consultant 
          onOrgChartUpdate={setOrgChartData} 
          onNavigateToTeam={() => setActiveScreen(Screen.ORG_CHART)}
          messages={consultantMessages}
          onMessagesChange={setConsultantMessages}
          currentOrgChart={orgChartData}
        />;
      case Screen.WORKFLOWS:
        return <Screen3Workflows 
          orgChartData={orgChartData}
          consultantHistory={consultantMessages}
          workflows={workflows}
          onWorkflowsUpdate={setWorkflows}
        />;
      case Screen.ORG_CHART:
        return <Screen2OrgChart 
          orgChartData={orgChartData} 
          onOrgChartUpdate={setOrgChartData}
          consultantHistory={consultantMessages}
        />;
      case Screen.CONTROL_ROOM:
        return <Screen4ControlRoom orgChartData={orgChartData} demoTasks={[]} />;
      case Screen.TEST_SUITE:
        return <Screen5TestSuite />;
      default:
        return <Screen1Consultant onOrgChartUpdate={setOrgChartData} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white relative">
      {/* Pass setActiveScreen to Sidebar to enable navigation */}
      <Sidebar currentScreen={activeScreen} onScreenChange={setActiveScreen} />
      
      <main className="flex-1 h-full overflow-hidden relative">
        {renderScreen()}
      </main>
    </div>
  );
};

export default App;
