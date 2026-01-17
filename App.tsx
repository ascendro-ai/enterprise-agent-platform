
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Screen1Consultant from './components/Screen1Consultant';
import Screen2OrgChart from './components/Screen2OrgChart';
import Screen4ControlRoom from './components/Screen4ControlRoom';
import Screen5TestSuite from './components/Screen5TestSuite';
import Screen6DemoEnvironment from './components/Screen6DemoEnvironment';
import { Screen, ChatMessage } from './types';

// Shared type for org chart node data
interface NodeData {
  name: string;
  type: 'ai' | 'human';
  role?: string;
  img?: string;
  status?: 'active' | 'needs_attention';
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
  
  // Shared state for tasks from Demo Environment to Control Room
  const [demoEnvironmentTasks, setDemoEnvironmentTasks] = useState<any[]>([]);

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
      case Screen.ORG_CHART:
        return <Screen2OrgChart 
          orgChartData={orgChartData} 
          onOrgChartUpdate={setOrgChartData}
          consultantHistory={consultantMessages}
        />;
      case Screen.CONTROL_ROOM:
        return <Screen4ControlRoom orgChartData={orgChartData} demoTasks={demoEnvironmentTasks} />;
      case Screen.TEST_SUITE:
        return <Screen5TestSuite />;
      case Screen.DEMO_ENVIRONMENT:
        return <Screen6DemoEnvironment 
          orgChartData={orgChartData} 
          onTaskCreated={(task) => {
            // Add task to shared state for Control Room
            setDemoEnvironmentTasks(prev => [...prev, task]);
            console.log('Demo Environment task created:', task);
          }} 
        />;
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
