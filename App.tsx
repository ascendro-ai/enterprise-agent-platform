
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Screen1Consultant from './components/Screen1Consultant';
import Screen2OrgChart from './components/Screen2OrgChart';
import Screen4ControlRoom from './components/Screen4ControlRoom';
import Screen5TestSuite from './components/Screen5TestSuite';
import Screen6Analytics from './components/Screen6Analytics';
import { Screen } from './types';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  // Use a direct screen state instead of just a number index for more flexibility
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.CONSULTANT);

  // Helper to maintain the linear demo flow for the bottom buttons
  const demoOrder = [Screen.CONSULTANT, Screen.ORG_CHART, Screen.CONTROL_ROOM, Screen.TEST_SUITE, Screen.ANALYTICS];
  const currentStepIndex = demoOrder.indexOf(activeScreen);

  const handleNext = () => {
    if (currentStepIndex < demoOrder.length - 1) {
      setActiveScreen(demoOrder[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setActiveScreen(demoOrder[currentStepIndex - 1]);
    }
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case Screen.CONSULTANT:
        return <Screen1Consultant />;
      case Screen.ORG_CHART:
        return <Screen2OrgChart />;
      case Screen.CONTROL_ROOM:
        return <Screen4ControlRoom />;
      case Screen.TEST_SUITE:
        return <Screen5TestSuite />;
      case Screen.ANALYTICS:
        return <Screen6Analytics />;
      default:
        return <Screen1Consultant />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white relative">
      {/* Pass setActiveScreen to Sidebar to enable navigation */}
      <Sidebar currentScreen={activeScreen} onScreenChange={setActiveScreen} />
      
      <main className="flex-1 h-full overflow-hidden relative">
        {renderScreen()}
        
        {/* Demo Navigation Controls - Only show if we are in the main flow sequence */}
        {currentStepIndex !== -1 && (
          <div className="absolute bottom-36 right-8 flex gap-4 z-50 pointer-events-none">
            <button 
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className={`p-4 rounded-full shadow-lg border border-gray-200 transition-all pointer-events-auto ${
                currentStepIndex === 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft size={24} />
            </button>
            
            <button 
              onClick={handleNext}
              disabled={currentStepIndex === demoOrder.length - 1}
              className={`p-4 rounded-full shadow-lg transition-all flex items-center gap-2 pointer-events-auto ${
                currentStepIndex === demoOrder.length - 1
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                : 'bg-gray-900 text-white hover:bg-black hover:scale-105'
              }`}
            >
              {currentStepIndex === 0 ? 'Build Team' : 'Next'}
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
