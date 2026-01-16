
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Plus, Image as ImageIcon, ChevronDown, Play, Command, Mic, X, MicOff, Headphones, Settings2, Check, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { ChatMessage } from '../types';

const Screen1Consultant: React.FC = () => {
  const [input, setInput] = useState('');
  const [conversationStep, setConversationStep] = useState(0); 
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  
  // Voice Mode State
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'listening' | 'processing' | 'speaking'>('listening');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const teams = [
      { name: "Security & Assets", color: "bg-red-500" },
      { name: "Growth & Sales", color: "bg-purple-600" },
      { name: "Ops & Logistics", color: "bg-blue-500" },
      { name: "Finance", color: "bg-emerald-500" },
      { name: "People", color: "bg-pink-500" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, thinkingSteps]);

  // Mock Voice Interaction Loop
  useEffect(() => {
      if (!isVoiceMode) return;

      const interval = setInterval(() => {
          setVoiceStatus(prev => {
              if (prev === 'listening') return 'processing';
              if (prev === 'processing') return 'speaking';
              return 'listening';
          });
      }, 4000);

      return () => clearInterval(interval);
  }, [isVoiceMode]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setThinkingSteps([]);

    // --- Thinking Process Simulation ---
    let steps: string[] = [];
    let responseText = "";
    let nextStep = conversationStep;

    if (conversationStep === 0) {
        // STEP 1: MAPPING & CONFIRMATION (No Prioritization yet)
        steps = [
            "Deconstructing operation into 5 domains...",
            "Mapping: Security -> Premise & Fleet checks...",
            "Mapping: Inventory -> Spoilage monitoring...",
            "Mapping: Finance -> QuickBooks categorization...",
            "Mapping: Sales -> Proposal generation...",
            "Running Gap Analysis for 'Retail Owner-Operator'...",
            "Gap Detected: Vendor Communications & Returns..."
        ];
        responseText = "I've mapped out your entire operation based on that description. It's a heavy load for one person. Here is the operational map I've built:\n\n1. Security: Physical asset protection (Store & Vans).\n2. Inventory: Perishable stock monitoring & Reordering.\n3. Finance: Bookkeeping & Transaction tagging.\n4. Growth: Customer inquiries & Proposals.\n5. People: Task delegation & Staff tracking.\n\nI noticed you didn't mention Vendor Communications or Return Processing. Should I include those in your workflow map, or are they handled elsewhere?";
        nextStep = 1;
    } else if (conversationStep === 1) {
        // STEP 2: INCORPORATION & TRANSITION
        steps = [
            "Ingesting user feedback...",
            "Finalizing Operational Workflow Map...",
            "Cross-referencing with available Agent Architectures...",
            "Designing Digital Org Chart...",
            "Ready for Team Deployment..."
        ];
        responseText = "Understood. I have a complete picture of the workflow now.\n\nI've designed a team structure that covers all these bases—mixing Autonomous Agents for the repetitive high-volume tasks (like Inventory & Finance) and keeping Humans on the high-touch ones.\n\nHead over to the 'Your Team' tab to view and activate your new Digital Org Chart.";
        nextStep = 2;
    } else {
         // Fallback / Loop
         steps = ["Processing input...", "Updating context...", "Refining agent parameters..."];
         responseText = "I've updated the blueprints based on that. Check the 'Your Team' tab to see the changes.";
    }

    // Execute Thinking Simulation Loop
    // We add steps one by one with delays to simulate "thinking"
    for (const step of steps) {
        await new Promise(r => setTimeout(r, 800)); // Delay per step
        setThinkingSteps(prev => [...prev, step]);
    }
    
    // Final "Processing" delay
    await new Promise(r => setTimeout(r, 600));

    const systemMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: responseText,
        timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, systemMsg]);
    setIsTyping(false);
    setThinkingSteps([]);
    setConversationStep(nextStep);
  };

  const sampleWorkflows = [
      {
          id: 'security-check',
          title: "Nightly Security Check",
          desc: "Verify store locks and van security via connected sensors or staff logs.",
          prompt: "I want to automate the nightly lock-up verification for the store and delivery vans."
      },
      {
          id: 'spoilage',
          title: "Spoilage Detection",
          desc: "Identify potential spoilage via camera feed to reduce waste.",
          prompt: "Set up a workflow to monitor floral stock for spoilage using the cooler cameras."
      },
      {
          id: 'financial',
          title: "Financial Autopilot",
          desc: "Auto-categorize bank transactions (Rent, Travel) in QuickBooks.",
          prompt: "Connect my bank feed to QuickBooks and auto-categorize expenses like Rent and Supplies."
      },
      {
          id: 'sales',
          title: "Sales Response",
          desc: "Automatically provide quotes and proposals for customer inquiries.",
          prompt: "Create an agent that drafts price quotes and proposals for wedding inquiries."
      }
  ];

  // Render Custom Visuals for Cards
  const renderVisual = (id: string) => {
      switch(id) {
          case 'security-check':
              return (
                  <div className="w-14 h-10 bg-white border border-gray-200 rounded-md shadow-sm flex items-center justify-center relative overflow-hidden group-hover:border-purple-200 transition-colors">
                      <div className="w-8 h-5 border-2 border-gray-300 rounded-sm flex items-center justify-center">
                          <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
              );
          case 'spoilage':
              return (
                  <div className="relative w-14 h-10 bg-gray-50 border border-gray-200 rounded-md shadow-sm overflow-hidden group-hover:border-purple-200 transition-colors">
                       <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-4 h-6 bg-pink-200 rounded-t-full"></div>
                       <div className="absolute top-1 right-1 w-3 h-3 border border-red-200 rounded-full flex items-center justify-center">
                           <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                       </div>
                  </div>
              );
          case 'financial':
               return (
                  <div className="w-14 h-10 bg-white border border-gray-200 rounded-md p-1 flex flex-col gap-1 shadow-sm relative overflow-hidden group-hover:border-purple-200 transition-colors">
                      <div className="flex gap-1 items-end h-full px-1">
                          <div className="w-2 h-3 bg-green-100 rounded-t-[1px]"></div>
                          <div className="w-2 h-5 bg-green-200 rounded-t-[1px]"></div>
                          <div className="w-2 h-4 bg-green-100 rounded-t-[1px]"></div>
                      </div>
                      <div className="absolute top-1 right-1 text-[8px] font-bold text-green-600">$</div>
                  </div>
              );
          case 'sales':
               return (
                  <div className="relative w-14 h-10 bg-purple-50 border border-purple-100 rounded-md shadow-sm flex flex-col items-center justify-center p-1 group-hover:border-purple-300 transition-colors overflow-hidden">
                      <div className="absolute top-0 right-0 w-4 h-4 bg-purple-200 rounded-bl-lg"></div>
                      <div className="w-8 h-1 bg-purple-200 rounded-full mb-1"></div>
                      <div className="w-6 h-1 bg-purple-200 rounded-full mb-1"></div>
                      <div className="w-4 h-1 bg-purple-300 rounded-full mt-1"></div>
                      <div className="absolute bottom-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></div>
                  </div>
              );
          default: return null;
      }
  }

  return (
    <div className="flex h-full w-full bg-white text-gray-900 font-sans overflow-hidden relative">
      
      {/* VOICE MODE OVERLAY (UPDATED VISUALS) */}
      {isVoiceMode && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
              
              {/* Top Settings Icon */}
              <div className="absolute top-14 right-6 text-zinc-500">
                   <Settings2 size={24} />
              </div>

              {/* Visualizer */}
              <div className="flex-1 flex items-center justify-center w-full">
                  <div className="flex items-center gap-5 h-48">
                       {[0, 1, 2, 3].map(i => (
                          <div 
                            key={i}
                            className="w-14 bg-white rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            style={{
                                height: voiceStatus === 'listening' ? '40px' : undefined,
                                animation: voiceStatus === 'speaking' 
                                    ? `voice-wave-${i} 1.${i*2 + 5}s infinite ease-in-out alternate`
                                    : voiceStatus === 'processing'
                                        ? `voice-pulse 1.5s infinite ease-in-out ${i * 0.2}s`
                                        : undefined
                            }}
                          />
                       ))}
                  </div>
              </div>

              {/* Bottom Bar */}
              <div className="w-full px-8 pb-12 flex items-center justify-between relative max-w-md mx-auto md:max-w-none">
                   {/* Left: Mic */}
                   <button className="w-14 h-14 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors">
                       <Mic size={24} />
                   </button>

                   {/* Center: Status Text */}
                   <div className="text-zinc-400 text-sm font-medium text-center max-w-[200px] leading-relaxed">
                       {voiceStatus === 'listening' ? 'Listening...' : 
                        voiceStatus === 'processing' ? 'Thinking...' : 
                        'Speaking...'}
                   </div>

                   {/* Right: Close/Stop */}
                   <button 
                      onClick={() => setIsVoiceMode(false)}
                      className="w-14 h-14 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors"
                   >
                       <X size={24} />
                   </button>
              </div>

              {/* Animation Styles */}
              <style>{`
                  @keyframes voice-wave-0 { 0% { height: 40px; } 100% { height: 120px; } }
                  @keyframes voice-wave-1 { 0% { height: 40px; } 100% { height: 160px; } }
                  @keyframes voice-wave-2 { 0% { height: 40px; } 100% { height: 140px; } }
                  @keyframes voice-wave-3 { 0% { height: 40px; } 100% { height: 110px; } }
                  
                  @keyframes voice-pulse {
                      0% { height: 40px; opacity: 0.6; }
                      50% { height: 60px; opacity: 1; }
                      100% { height: 40px; opacity: 0.6; }
                  }
                  @keyframes spin-slow {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                  }
                  .animate-spin-slow {
                      animation: spin-slow 3s linear infinite;
                  }
              `}</style>
          </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-white/80 backdrop-blur-sm">
           <div className="flex items-center gap-2 text-gray-500">
              <span className="font-medium text-gray-900">Workflow Architect</span>
              <span className="text-gray-300">/</span>
              <span className="text-sm">New Session</span>
           </div>
           
           {/* Team Dropdown */}
           <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors">
                  {selectedTeam === 'All Teams' ? (
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  ) : (
                      <span className={`w-2 h-2 rounded-full ${teams.find(t => t.name === selectedTeam)?.color || 'bg-gray-400'}`}></span>
                  )}
                  {selectedTeam}
                  <ChevronDown size={14} className="text-gray-400"/>
              </button>
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase bg-gray-50 border-b border-gray-100">Select Team</div>
                  <button onClick={() => setSelectedTeam("All Teams")} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span> All Teams
                  </button>
                  {teams.map((team) => (
                      <button 
                        key={team.name}
                        onClick={() => setSelectedTeam(team.name)} 
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                          <span className={`w-2 h-2 rounded-full ${team.color}`}></span> 
                          {team.name}
                      </button>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1 pb-1">
                      <button className="w-full text-left px-4 py-2 text-xs font-medium text-gray-500 hover:text-purple-600 flex items-center gap-2">
                          <Plus size={12} /> Create New Team
                      </button>
                  </div>
              </div>
           </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Zero State / Hero */
            <div className="h-full flex flex-col items-center justify-center px-6">
              <div className="max-w-3xl w-full">
                  <div className="text-center mb-8">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">What can I do for you?</h1>
                      <p className="text-gray-500 text-sm">
                        Describe your daily routine, pain points, or the specific workflow you want to automate.
                      </p>
                  </div>

                  {/* Sample Workflow Cards - Compact Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-8">
                      {sampleWorkflows.map((flow) => (
                          <button 
                            key={flow.id}
                            onClick={() => setInput(flow.prompt)}
                            className="group relative bg-white border border-gray-200 rounded-xl p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all flex items-start justify-between overflow-hidden"
                          >
                              <div className="relative z-10 pr-3">
                                  <h3 className="font-semibold text-gray-900 text-[13px] mb-0.5">{flow.title}</h3>
                                  <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{flow.desc}</p>
                              </div>
                              <div className="relative z-10 shrink-0 pt-0.5">
                                  {renderVisual(flow.id)}
                              </div>
                          </button>
                      ))}
                  </div>
                  
                  {/* Demo Trigger Button */}
                  <div className="flex justify-center">
                    <button 
                        onClick={() => setInput("I am the owner-operator of a retail business with a physical footprint, responsible for bridging on-site logistics with back-office administration. My day-to-day operations involve securing physical assets (confirming premises and fleet vans are locked at night), managing perishable inventory by identifying spoilage via camera feeds, and using that data to automate weekly stock ordering. On the growth side, I need to instantly generate quotes, proposals, and marketing collateral to respond to customer inquiries automatically. Financially, I oversee the books, requiring automated categorization of transactions imported into QuickBooks (differentiating expenses like travel vs. rent). Finally, I act as a team lead, needing a collaborative workspace where I can assign and track specific operational tasks across my staff (e.g., 'Sally is handling XYZ'). My goal is to automate these specific workflows to streamline my daily management.")}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-gray-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 transition-all group"
                    >
                        <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Play size={10} fill="currentColor" />
                        </div>
                        <span className="text-xs font-medium">Play Demo: Dallas Flower Shop</span>
                    </button>
                  </div>
              </div>
            </div>
          ) : (
            /* Chat Stream */
            <div className="max-w-3xl mx-auto w-full pt-20 pb-40 px-6 space-y-8">
               {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                     {msg.sender === 'system' && (
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 shrink-0 mt-1">
                           <Sparkles size={16} />
                        </div>
                     )}
                     
                     <div className={`max-w-[80%] space-y-1 ${msg.sender === 'user' ? 'items-end flex flex-col' : ''}`}>
                        <div className={`p-4 rounded-2xl leading-relaxed text-[15px] whitespace-pre-wrap ${
                           msg.sender === 'user' 
                           ? 'bg-gray-100 text-gray-900 rounded-tr-sm' 
                           : 'bg-transparent text-gray-900 px-0'
                        }`}>
                           {msg.text}
                        </div>
                     </div>
                  </div>
               ))}
               
               {isTyping && (
                  <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                     <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 shrink-0 mt-1">
                        <Sparkles size={16} />
                     </div>
                     <div className="space-y-2 max-w-[80%]">
                        {/* Thinking Process UI */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm max-w-md space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <Sparkles size={12} className="text-purple-500 animate-spin-slow" />
                                AI Reasoning Trace
                            </div>
                            <div className="space-y-2">
                                {thinkingSteps.map((step, i) => (
                                     <div key={i} className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="mt-0.5 w-4 h-4 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                            <Check size={10} className="text-green-600" />
                                        </div>
                                        <span className="text-sm text-gray-600 leading-tight">{step}</span>
                                    </div>
                                ))}
                                <div className="flex items-center gap-3 animate-pulse opacity-60">
                                     <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-purple-500 animate-spin shrink-0"></div>
                                     <span className="text-sm text-gray-400">Processing...</span>
                                </div>
                            </div>
                        </div>
                     </div>
                  </div>
               )}
               <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area (Sticky Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 bg-white p-6 pb-8">
           <div className="max-w-3xl mx-auto w-full relative">
              
              {/* Contextual Shortcut Buttons based on step */}
              {messages.length > 0 && conversationStep === 1 && !isTyping && (
                  <div className="absolute -top-12 left-0 right-0 flex justify-center gap-2">
                      <button onClick={() => setInput("Include 'Returns' handling, but 'Vendor Comms' are fine manually.")} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-xs hover:bg-gray-50 shadow-sm animate-in slide-in-from-bottom-2 flex items-center gap-2 group">
                          <Command size={12} className="text-gray-400 group-hover:text-purple-500"/>
                          Shortcut: "Add Returns, Skip Vendors"
                      </button>
                  </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-purple-100 focus-within:border-purple-300 overflow-hidden">
                 <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                       }
                    }}
                    placeholder="Message Workflow.ai..."
                    className="w-full bg-transparent border-none text-gray-900 text-[15px] p-4 min-h-[60px] max-h-[200px] resize-none focus:ring-0 outline-none placeholder-gray-400"
                 />
                 
                 {/* Input Actions */}
                 <div className="px-3 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                       <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Upload File">
                          <Plus size={18} />
                       </button>
                       <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Gallery">
                          <ImageIcon size={18} />
                       </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Voice Mode Button */}
                        <button 
                          onClick={() => setIsVoiceMode(true)}
                          className="p-2 rounded-full bg-black text-white hover:bg-gray-800 transition-all flex items-center justify-center"
                          title="Start Voice Conversation"
                        >
                            <Mic size={18} />
                        </button>

                        <button 
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className={`p-2 rounded-lg transition-all ${
                            input.trim() 
                            ? 'bg-gray-900 text-white hover:bg-black shadow-md' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        >
                        <ArrowRight size={18} />
                        </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Screen1Consultant;
