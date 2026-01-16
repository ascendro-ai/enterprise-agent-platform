
import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, AlertTriangle, CheckCircle2, Terminal, MessageSquare, ChevronRight, User, Star, Sparkles, Plus, Bot, ArrowRight, XCircle, Filter, ChevronDown, Search, LayoutList, PieChart, Activity, Hammer, ArrowLeft, Send } from 'lucide-react';

// --- Types ---
interface TestCase {
  id: string;
  utterance: string;
  topic: string;
  topicStatus: 'pass' | 'fail';
  actionStatus: 'pass' | 'fail';
  validationMsg: string;
  logs: TestLog[];
  isCustom?: boolean;
}

interface TestLog {
  agent: string;
  message: string;
  status: 'info' | 'success' | 'error' | 'thinking';
  timestamp: string;
}

interface ScenarioConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  testCount: number;
}

interface ChatMessage {
  id: string;
  sender: 'system' | 'user';
  text: string;
  generatedTest?: TestCase; // If the message resulted in a test being built
}

const Screen5TestSuite: React.FC = () => {
  // State
  const [view, setView] = useState<'hub' | 'builder' | 'running' | 'results'>('hub');
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [testResults, setTestResults] = useState<TestCase[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  // Builder Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
      { id: '1', sender: 'system', text: "I can generate custom test cases for any of your active agents. \n\nDescribe a scenario or edge case you want to test (e.g., \"Test if Review Responder handles legal threats correctly\")." }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Scenarios (Standard)
  const scenarios: ScenarioConfig[] = [
    { id: 'review', label: 'Review Responder Suite', icon: Star, description: "Validate sentiment analysis and refund policies across 100+ simulated reviews.", testCount: 124 },
    { id: 'staff', label: 'Staff Liaison Protocol', icon: User, description: "Test shift swaps, policy queries, and security escalations.", testCount: 85 },
    { id: 'security', label: 'Sentinel Vision Test', icon: AlertTriangle, description: "Feed simulated video metadata (motion, objects) to validate threat detection.", testCount: 200 },
  ];

  // --- Mock Data Generators ---

  const generateReviewTests = (): TestCase[] => {
    const cases: TestCase[] = [
        {
            id: '1', utterance: "My flowers died in 2 days! Refund please.", topic: "Product Quality", topicStatus: 'pass', actionStatus: 'pass',
            validationMsg: "Correctly identified negative sentiment and requested photo evidence per SOP.",
            logs: [
                { agent: 'System', message: 'Trigger: Incoming Review (1 Star)', status: 'info', timestamp: '00:00.120' },
                { agent: 'Review Responder', message: 'Analyzing Sentiment: NEGATIVE (Quality)', status: 'thinking', timestamp: '00:00.450' },
                { agent: 'Review Responder', message: 'Action: Request Photo', status: 'success', timestamp: '00:01.200' }
            ]
        },
        {
            id: '2', utterance: "Best bouquet ever, my wife loved it.", topic: "Praise", topicStatus: 'pass', actionStatus: 'pass',
            validationMsg: "Identified positive sentiment. Auto-replied with gratitude.",
            logs: [
                 { agent: 'System', message: 'Trigger: Incoming Review (5 Star)', status: 'info', timestamp: '00:00.100' },
                 { agent: 'Review Responder', message: 'Analyzing Sentiment: POSITIVE', status: 'thinking', timestamp: '00:00.300' },
                 { agent: 'Review Responder', message: 'Action: Post "Thank You" Reply', status: 'success', timestamp: '00:00.800' }
            ]
        },
        {
            id: '3', utterance: "I want a refund but I don't have a photo.", topic: "Refund Request", topicStatus: 'pass', actionStatus: 'fail',
            validationMsg: "Agent failed to block refund without evidence. Edge case: Missing photo.",
            logs: [
                 { agent: 'System', message: 'Trigger: DM Request', status: 'info', timestamp: '00:00.150' },
                 { agent: 'Review Responder', message: 'Intent: Refund (No Evidence)', status: 'thinking', timestamp: '00:00.600' },
                 { agent: 'Review Responder', message: 'Error: Escalation Required but not triggered', status: 'error', timestamp: '00:01.500' }
            ]
        },
        {
            id: '4', utterance: "Where is my order #5544?", topic: "Delivery Status", topicStatus: 'pass', actionStatus: 'pass',
            validationMsg: "Successfully queried Route Planner and returned ETA.",
            logs: [
                { agent: 'System', message: 'Trigger: Incoming DM', status: 'info', timestamp: '00:00.120' },
                { agent: 'Review Responder', message: 'Tool Call: Route Planner API', status: 'thinking', timestamp: '00:00.900' },
                { agent: 'Route Planner', message: 'Returned: Driver 15 mins away', status: 'success', timestamp: '00:02.100' }
            ]
        },
        {
            id: '8', utterance: "This is a robbery!", topic: "Threat", topicStatus: 'fail', actionStatus: 'pass',
            validationMsg: "Topic ID failed (marked as 'Complaint') but Action passed (Escalated to Human).",
            logs: [
                { agent: 'System', message: 'Trigger: High Urgency text', status: 'info', timestamp: '00:00.050' },
                { agent: 'Review Responder', message: 'Topic: Customer Complaint (Incorrect)', status: 'error', timestamp: '00:00.300' },
                { agent: 'Review Responder', message: 'Action: Escalate to Chitra', status: 'success', timestamp: '00:00.400' }
            ]
        },
    ];
    return cases;
  };

  const generateStaffTests = (): TestCase[] => {
     return [
         {
            id: '1', utterance: "Can I swap shifts with Mike?", topic: "Scheduling", topicStatus: 'pass', actionStatus: 'pass',
            validationMsg: "Verified Mike is qualified. Updated calendar.",
            logs: [
                { agent: 'Staff Liaison', message: 'Checking Qualifications', status: 'thinking', timestamp: '00:00.200' },
                { agent: 'Staff Liaison', message: 'Action: Update Calendar', status: 'success', timestamp: '00:01.000' }
            ]
         },
         {
            id: '2', utterance: "What is the alarm code?", topic: "Security", topicStatus: 'pass', actionStatus: 'pass',
            validationMsg: "Blocked sensitive request. Escalated to Owner.",
            logs: [
                { agent: 'Staff Liaison', message: 'Intent: Security Info', status: 'thinking', timestamp: '00:00.300' },
                { agent: 'Staff Liaison', message: 'Action: Block & Escalate', status: 'success', timestamp: '00:00.500' }
            ]
         }
     ];
  };

  // --- Handlers ---

  const startStandardRun = (suiteId: string) => {
      setSelectedSuite(suiteId);
      setView('running');
      setProgress(0);
      
      const interval = setInterval(() => {
          setProgress(prev => {
              if (prev >= 100) {
                  clearInterval(interval);
                  setView('results');
                  if (suiteId === 'review') setTestResults(generateReviewTests());
                  else setTestResults(generateStaffTests());
                  return 100;
              }
              return prev + Math.floor(Math.random() * 15);
          });
      }, 200);
  };

  const handleChatSend = () => {
      if(!chatInput.trim()) return;
      const userText = chatInput;
      setChatInput("");
      setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userText }]);

      // Simulate AI Generation
      setTimeout(() => {
          let responseText = "";
          let generatedTest: TestCase | undefined = undefined;

          if (userText.toLowerCase().includes("legal") || userText.toLowerCase().includes("sue")) {
               responseText = "I've designed a test case for a Legal Threat. \n\nI'll simulate a 1-star review containing specific keywords (\"lawyer\", \"sue\"). \n\nExpectation: The agent should NOT reply publicly and must escalate to you immediately.";
               generatedTest = {
                   id: `CUST-${Date.now()}`,
                   isCustom: true,
                   utterance: "This is unacceptable. I am contacting my lawyer to sue for damages!",
                   topic: "Legal Threat",
                   topicStatus: 'pass',
                   actionStatus: 'pass',
                   validationMsg: "Agent correctly identified legal risk. Auto-reply disabled. Escalation triggering sent to Owner.",
                   logs: [
                       { agent: 'System', message: 'Trigger: Incoming Review', status: 'info', timestamp: '00:00.100' },
                       { agent: 'Review Responder', message: 'Analysis: High Risk Keyword "Sue"', status: 'error', timestamp: '00:00.400' },
                       { agent: 'Review Responder', message: 'Action: BLOCK Public Reply', status: 'success', timestamp: '00:00.500' },
                       { agent: 'Review Responder', message: 'Action: Escalate to Chitra (Urgent)', status: 'success', timestamp: '00:00.600' }
                   ]
               };
          } else if (userText.toLowerCase().includes("swap") || userText.toLowerCase().includes("shift")) {
               responseText = "Generating a Scheduling Conflict scenario. \n\nI'll test if the Staff Liaison catches that the requested shift is already staffed by a senior member.";
                generatedTest = {
                   id: `CUST-${Date.now()}`,
                   isCustom: true,
                   utterance: "Can I swap my Tuesday shift with Sarah?",
                   topic: "Shift Swap",
                   topicStatus: 'pass',
                   actionStatus: 'fail',
                   validationMsg: "Agent failed to check Sarah's overtime status before approving.",
                   logs: [
                       { agent: 'Staff Liaison', message: 'Checking Schedule...', status: 'thinking', timestamp: '00:00.200' },
                       { agent: 'Staff Liaison', message: 'Action: Approve Swap', status: 'error', timestamp: '00:00.900' }
                   ]
               };
          } else {
               responseText = "I've created a generic edge case test based on your description.";
               generatedTest = {
                   id: `CUST-${Date.now()}`,
                   isCustom: true,
                   utterance: "Test Utterance based on: " + userText,
                   topic: "Custom Scenario",
                   topicStatus: 'pass',
                   actionStatus: 'pass',
                   validationMsg: "Executed successfully against sandbox environment.",
                   logs: [
                       { agent: 'System', message: 'Initializing Custom Scenario', status: 'info', timestamp: '00:00.100' },
                       { agent: 'Agent', message: 'Processing...', status: 'success', timestamp: '00:00.500' }
                   ]
               };
          }

          setChatMessages(prev => [...prev, { 
              id: (Date.now()+1).toString(), 
              sender: 'system', 
              text: responseText,
              generatedTest: generatedTest 
          }]);

      }, 1000);
  };

  const runCustomTest = (test: TestCase) => {
      setSelectedSuite('custom');
      setView('running');
      setProgress(0);
       const interval = setInterval(() => {
          setProgress(prev => {
              if (prev >= 100) {
                  clearInterval(interval);
                  setView('results');
                  setTestResults([test]); // Only show this single result
                  return 100;
              }
              return prev + 20; // Faster
          });
      }, 150);
  }

  // --- Views ---

  const renderHub = () => (
      <div className="flex flex-col h-full p-8 animate-in fade-in duration-500 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full space-y-8">
              <div className="text-center space-y-2 mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Agent Test Suite</h1>
                  <p className="text-gray-500 max-w-lg mx-auto">Verify your agents' logic before they go live. Run standard batch simulations or build custom edge cases.</p>
              </div>

              {/* Custom Builder Call-to-Action */}
              <div 
                onClick={() => setView('builder')}
                className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl cursor-pointer hover:scale-[1.01] transition-transform"
              >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Hammer size={120} />
                  </div>
                  <div className="relative z-10 flex items-start justify-between">
                      <div className="space-y-4">
                          <div className="p-3 bg-white/10 w-fit rounded-xl backdrop-blur-sm border border-white/20">
                              <Sparkles size={24} className="text-purple-300" />
                          </div>
                          <div>
                              <h2 className="text-2xl font-bold mb-2">Build Custom Scenario</h2>
                              <p className="text-gray-300 max-w-lg text-sm leading-relaxed">
                                  Use the AI builder to describe a specific edge case (e.g., "Angry customer", "Conflicting commands"). 
                                  The system will generate a mocked conversation to test your agent's guardrails.
                              </p>
                          </div>
                          <button className="px-5 py-2 bg-white text-gray-900 text-sm font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2">
                              Enter Builder <ArrowRight size={16} />
                          </button>
                      </div>
                  </div>
              </div>

              <div className="flex items-center gap-4 py-4">
                  <div className="h-px flex-1 bg-gray-200"></div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Or Run Standard Suites</span>
                  <div className="h-px flex-1 bg-gray-200"></div>
              </div>

              {/* Standard Suites Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {scenarios.map(scenario => (
                      <button
                          key={scenario.id}
                          onClick={() => startStandardRun(scenario.id)}
                          className="relative p-6 rounded-2xl border border-gray-200 bg-white hover:border-purple-300 hover:shadow-lg hover:-translate-y-1 transition-all group text-left"
                      >
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gray-50 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                              <scenario.icon size={24} />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{scenario.label}</h3>
                          <p className="text-xs text-gray-500 mb-6 leading-relaxed h-12 line-clamp-2">{scenario.description}</p>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                  <Activity size={14} />
                                  {scenario.testCount} Tests
                              </div>
                              <Play size={16} className="text-gray-300 group-hover:text-purple-600" fill="currentColor"/>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      </div>
  );

  const renderBuilder = () => (
      <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-500">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <button onClick={() => setView('hub')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                      <ArrowLeft size={20} />
                  </button>
                  <div>
                      <h2 className="text-lg font-bold text-gray-900">Custom Test Builder</h2>
                      <p className="text-xs text-gray-500">Describe a scenario to generate a test case</p>
                  </div>
              </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
              {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                              msg.sender === 'user' ? 'bg-gray-200 text-gray-700' : 'bg-purple-100 text-purple-600'
                          }`}>
                              {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                          </div>
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              msg.sender === 'user' 
                              ? 'bg-white text-gray-900 border border-gray-200 rounded-tr-none' 
                              : 'bg-white text-gray-800 border border-purple-100 rounded-tl-none'
                          }`}>
                              <div className="whitespace-pre-wrap">{msg.text}</div>
                          </div>
                      </div>
                      
                      {/* Generated Test Preview Card */}
                      {msg.generatedTest && (
                          <div className="mt-3 ml-11 max-w-[60%] w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-300">
                              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preview: Test Case</span>
                                  <span className="text-[10px] font-mono text-gray-400">ID: {msg.generatedTest.id}</span>
                              </div>
                              <div className="p-4 space-y-3">
                                  <div>
                                      <label className="text-xs text-gray-400 block mb-1">Test Utterance</label>
                                      <p className="text-sm font-medium text-gray-900">"{msg.generatedTest.utterance}"</p>
                                  </div>
                                  <div>
                                      <label className="text-xs text-gray-400 block mb-1">Expected Topic</label>
                                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">{msg.generatedTest.topic}</span>
                                  </div>
                              </div>
                              <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
                                  <button 
                                    onClick={() => runCustomTest(msg.generatedTest!)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
                                  >
                                      <Play size={12} fill="currentColor"/> Run Simulation
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              ))}
              <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
              <div className="max-w-4xl mx-auto relative">
                  <input 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                      placeholder="e.g., 'Test if the agent escalates when a user is rude'"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none"
                  />
                  <button 
                    onClick={handleChatSend}
                    className="absolute right-2 top-2 p-1.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                  >
                      <ArrowRight size={16} />
                  </button>
              </div>
          </div>
      </div>
  );

  const renderRunning = () => (
      <div className="flex flex-col h-full items-center justify-center p-8 animate-in fade-in duration-500">
          <div className="w-full max-w-md space-y-6 text-center">
               <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                   <Activity size={32} />
               </div>
               <h2 className="text-2xl font-bold text-gray-900">Running Simulation...</h2>
               
               <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                       <span>Progress</span>
                       <span>{progress}%</span>
                   </div>
                   <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-purple-600 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                   </div>
               </div>
               
               <p className="text-sm text-gray-500">
                   {selectedSuite === 'custom' 
                    ? "Injecting custom utterance into sandbox environment..." 
                    : `Executing ${selectedSuite === 'review' ? '124' : '85'} batch test cases...`}
               </p>
          </div>
      </div>
  );

  const renderResults = () => (
      <div className="flex h-full animate-in slide-in-from-right duration-500 bg-gray-50">
          {/* Main Table Area */}
          <div className="flex-1 flex flex-col min-w-0">
               {/* Header */}
               <div className="p-8 pb-4">
                   <div className="flex items-center justify-between mb-6">
                       <div>
                           <div className="flex items-center gap-2 mb-1">
                               <button onClick={() => setView('hub')} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm font-medium">
                                   <ArrowLeft size={16} /> Hub
                               </button>
                               <span className="text-gray-300">/</span>
                               <span className="text-gray-500 text-sm font-medium">Results</span>
                           </div>
                           <h1 className="text-2xl font-bold text-gray-900">
                               {selectedSuite === 'custom' ? 'Custom Scenario Results' : 'Batch Validation Results'}
                           </h1>
                       </div>
                       <button onClick={() => { setView('hub'); setSelectedTestId(null); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 shadow-sm">
                           <RotateCcw size={16} /> Start Over
                       </button>
                   </div>

                   {/* Stats Cards - Only relevant for batch, but we show for custom too for consistency */}
                   <div className="grid grid-cols-4 gap-4 mb-2">
                       <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pass Rate</p>
                           <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                               {testResults.some(t => t.actionStatus === 'fail') ? 'FAIL' : '100%'}
                           </div>
                       </div>
                       <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Tests</p>
                           <div className="text-2xl font-bold text-gray-900">{testResults.length}</div>
                       </div>
                       <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Latency</p>
                           <div className="text-2xl font-bold text-gray-900">320ms</div>
                       </div>
                       <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                           <div className="text-2xl font-bold text-purple-600">Done</div>
                       </div>
                   </div>
               </div>

               {/* Table */}
               <div className="flex-1 overflow-auto px-8 pb-8">
                   <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                       <table className="w-full text-left border-collapse">
                           <thead>
                               <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                   <th className="p-4 w-12 text-center">#</th>
                                   <th className="p-4">Test Utterance</th>
                                   <th className="p-4 w-48">Topic ID</th>
                                   <th className="p-4 w-48">Action Seq</th>
                                   <th className="p-4">Outcome Validation</th>
                                   <th className="p-4 w-10"></th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 text-sm">
                               {testResults.map((test, idx) => (
                                   <tr 
                                     key={test.id} 
                                     onClick={() => setSelectedTestId(test.id)}
                                     className={`cursor-pointer transition-colors hover:bg-purple-50/50 ${selectedTestId === test.id ? 'bg-purple-50' : ''}`}
                                   >
                                       <td className="p-4 text-center text-gray-400 font-mono">{idx + 1}</td>
                                       <td className="p-4 font-medium text-gray-900">
                                           {test.utterance}
                                           {test.isCustom && <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded font-bold uppercase">Custom</span>}
                                       </td>
                                       
                                       {/* Topic ID Status */}
                                       <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {test.topicStatus === 'pass' 
                                                    ? <CheckCircle2 size={16} className="text-green-500" />
                                                    : <XCircle size={16} className="text-red-500" />
                                                }
                                                <span className={test.topicStatus === 'fail' ? 'text-red-700 font-medium' : 'text-gray-600'}>
                                                    {test.topicStatus === 'pass' ? 'Pass' : 'Fail'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 pl-6">{test.topic}</div>
                                       </td>

                                       {/* Action Seq Status */}
                                       <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {test.actionStatus === 'pass' 
                                                    ? <CheckCircle2 size={16} className="text-green-500" />
                                                    : <XCircle size={16} className="text-red-500" />
                                                }
                                                <span className={test.actionStatus === 'fail' ? 'text-red-700 font-medium' : 'text-gray-600'}>
                                                    {test.actionStatus === 'pass' ? 'Pass' : 'Fail'}
                                                </span>
                                            </div>
                                       </td>

                                       <td className="p-4 text-gray-600 leading-relaxed">
                                           {test.validationMsg}
                                       </td>
                                       <td className="p-4 text-gray-400">
                                           <ChevronRight size={16} />
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               </div>
          </div>

          {/* Trace Detail Panel */}
          {selectedTestId && (
              <div className="w-[400px] bg-white border-l border-gray-200 shadow-xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <div className="flex items-center gap-2 font-bold text-gray-900">
                          <Terminal size={18} className="text-gray-500" />
                          Execution Trace
                      </div>
                      <button onClick={() => setSelectedTestId(null)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                          <XCircle size={18} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
                      {testResults.find(t => t.id === selectedTestId)?.logs.map((log, i) => (
                          <div key={i} className="relative pl-6">
                               {/* Timeline Line */}
                               <div className="absolute left-[7px] top-6 bottom-[-24px] w-px bg-gray-200 last:hidden"></div>
                               
                               <div className="flex flex-col gap-1">
                                   <div className="flex items-center gap-2">
                                       <div className={`w-4 h-4 rounded-full border-2 shrink-0 z-10 ${
                                           log.status === 'success' ? 'bg-green-100 border-green-500' :
                                           log.status === 'error' ? 'bg-red-100 border-red-500' :
                                           'bg-gray-100 border-gray-400'
                                       }`}></div>
                                       <span className="text-xs font-bold text-gray-900">{log.agent}</span>
                                       <span className="text-[10px] text-gray-400 font-mono ml-auto">{log.timestamp}</span>
                                   </div>
                                   
                                   <div className={`mt-1 p-3 rounded-lg border text-sm ${
                                       log.status === 'error' 
                                       ? 'bg-red-50 border-red-100 text-red-800' 
                                       : 'bg-gray-50 border-gray-100 text-gray-700'
                                   }`}>
                                       {log.message}
                                   </div>
                               </div>
                          </div>
                      ))}
                  </div>
                  
                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Final Verdict</h4>
                      <p className="text-sm text-gray-800">
                           {testResults.find(t => t.id === selectedTestId)?.validationMsg}
                      </p>
                  </div>
              </div>
          )}
      </div>
  );

  return (
    <div className="h-full w-full bg-white font-sans overflow-hidden">
        {view === 'hub' && renderHub()}
        {view === 'builder' && renderBuilder()}
        {view === 'running' && renderRunning()}
        {view === 'results' && renderResults()}
    </div>
  );
};

export default Screen5TestSuite;
