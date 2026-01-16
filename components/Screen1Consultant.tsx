
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Plus, Image as ImageIcon, Play, Command, Mic } from 'lucide-react';
import { ChatMessage } from '../types';
import { consultWorkflow, generateOrgStructure } from '../services/geminiService';

// Type declaration for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare var SpeechRecognition: {
  new (): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  new (): SpeechRecognition;
};

interface Screen1ConsultantProps {
  onOrgChartUpdate?: (data: any) => void;
  onNavigateToTeam?: () => void;
  messages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

const Screen1Consultant: React.FC<Screen1ConsultantProps> = ({ onOrgChartUpdate, onNavigateToTeam, messages: propMessages, onMessagesChange }) => {
  const [input, setInput] = useState('');
  const [conversationStep, setConversationStep] = useState(0); 
  const [messages, setMessages] = useState<ChatMessage[]>(propMessages || []);
  
  // Sync with parent state
  useEffect(() => {
    if (propMessages) {
      setMessages(propMessages);
    }
  }, [propMessages]);
  
  // Update parent when messages change
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  

  const messagesEndRef = useRef<HTMLDivElement>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          // Set the transcribed text in the input field
          setInput(transcript);
          setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);


  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const userInput = input;
    setInput('');
    setIsTyping(true);

    // Build conversation history for Gemini
    const conversationHistory = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.text }]
    }));

    try {
      // Call Gemini API
      let responseText = await consultWorkflow(userInput, conversationHistory);
      
      // Strip markdown formatting (**, __, etc.)
      responseText = responseText
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
        .replace(/\*(.*?)\*/g, '$1')      // Remove *italic*
        .replace(/__(.*?)__/g, '$1')     // Remove __bold__
        .replace(/_(.*?)_/g, '$1')       // Remove _italic_
        .replace(/`(.*?)`/g, '$1')       // Remove `code`
        .replace(/#{1,6}\s/g, '')        // Remove headers
        .trim();

      const systemMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: responseText,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, systemMsg]);
      
      // Check if consultant is ready to build (mentions building, "your team", etc.)
      const readyToBuild = responseText.toLowerCase().includes('build') || 
                          responseText.toLowerCase().includes('your team') ||
                          responseText.toLowerCase().includes("head over") ||
                          (responseText.toLowerCase().includes("let me") && responseText.toLowerCase().includes('team')) ||
                          responseText.toLowerCase().includes('organizational chart') ||
                          responseText.toLowerCase().includes('digital worker');
      
      if (readyToBuild && onNavigateToTeam && onOrgChartUpdate) {
        // Generate org structure from conversation
        const fullConversation = [...messages, userMsg, systemMsg]
          .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
          .join('\n');
        
        try {
          const orgStructure = await generateOrgStructure(fullConversation);
          
          if (orgStructure && orgStructure.children && orgStructure.children.length > 0) {
            // Ensure name is "You" to match existing structure
            if (orgStructure.name !== "You") {
              orgStructure.name = "You";
            }
            // Update org chart with generated structure
            onOrgChartUpdate(orgStructure);
            
            // Navigate to Your Team after a short delay
            setTimeout(() => {
              if (onNavigateToTeam) {
                onNavigateToTeam();
              }
            }, 1500);
          } else {
            // If structure generation failed, create a simple structure based on conversation
            // Extract agent name from conversation (look for mentions of agents)
            const agentMatch = fullConversation.match(/(?:agent|worker|assistant).*?(?:for|that|to)\s+([^.!?\n]+)/i);
            const agentName = agentMatch ? agentMatch[1].trim() : 'Review Responder'; // Default fallback
            
            const simpleStructure: any = {
              name: "You",
              type: 'human',
              role: "Owner",
              children: [
                {
                  name: "Customer Service",
                  type: 'human',
                  role: "Department",
                  children: [
                    {
                      name: agentName,
                      type: 'ai',
                      role: "Review Management",
                      status: 'needs_attention'
                    }
                  ]
                }
              ]
            };
            
            onOrgChartUpdate(simpleStructure);
            
            setTimeout(() => {
              if (onNavigateToTeam) {
                onNavigateToTeam();
              }
            }, 1500);
          }
        } catch (error) {
          console.error("Error generating org structure:", error);
        }
      }
      
      // Advance conversation step if we get a comprehensive response
      if (conversationStep < 2 && responseText.length > 200) {
        setConversationStep(conversationStep + 1);
      }
    } catch (error) {
      console.error("Error calling Gemini:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: "I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
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
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-white/80 backdrop-blur-sm">
           <div className="flex items-center gap-2 text-gray-500">
              <span className="font-medium text-gray-900">Workflow Architect</span>
              <span className="text-gray-300">/</span>
              <span className="text-sm">New Session</span>
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
              </div>
            </div>
          ) : (
            /* Chat Stream */
            <div className="max-w-3xl mx-auto w-full pt-20 pb-40 px-6 space-y-8">
               {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                     {msg.sender === 'system' && (
                        <div className="flex flex-col items-center shrink-0 mt-1">
                           <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white border border-gray-200">
                              <img src="/Lumi.png" alt="Lumi" className="w-full h-full object-cover" />
                           </div>
                           <span className="text-[10px] text-gray-500 mt-1 font-medium">Lumi</span>
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
                     <div className="flex flex-col items-center shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white border border-gray-200">
                           <img src="/Lumi.png" alt="Lumi" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 font-medium">Lumi</span>
                     </div>
                     <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 animate-pulse">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm text-gray-500">Thinking...</span>
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
                        {/* Voice Input Button */}
                        <button 
                          onClick={() => {
                            if (!isListening && recognitionRef.current) {
                              try {
                                recognitionRef.current.start();
                                setIsListening(true);
                              } catch (error) {
                                console.error('Failed to start speech recognition:', error);
                                setIsListening(false);
                              }
                            } else if (isListening && recognitionRef.current) {
                              recognitionRef.current.stop();
                              setIsListening(false);
                            }
                          }}
                          className={`p-2 rounded-full transition-all flex items-center justify-center ${
                            isListening 
                              ? 'bg-red-600 text-white animate-pulse' 
                              : 'bg-black text-white hover:bg-gray-800'
                          }`}
                          title={isListening ? "Stop Recording" : "Start Voice Input"}
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
