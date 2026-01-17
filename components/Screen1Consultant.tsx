
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Plus, Image as ImageIcon, Play, Mic, X, FileText } from 'lucide-react';
import { ChatMessage } from '../types';
import { consultWorkflow, generateOrgStructure, extractWorkflowFromConversation } from '../services/geminiService';

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

const Screen1Consultant: React.FC<Screen1ConsultantProps> = ({ onOrgChartUpdate, onNavigateToTeam, messages: propMessages, onMessagesChange, currentOrgChart }) => {
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
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true; // Enable interim results
          recognition.lang = 'en-US';
          
          recognition.onstart = () => {
            console.log('Speech recognition started');
            setIsListening(true);
          };
          
          recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
              } else {
                interimTranscript += transcript;
              }
            }
            
            // Update input with final transcript, or show interim
            if (finalTranscript) {
              setInput(prev => prev + finalTranscript.trim());
            } else if (interimTranscript) {
              // Show interim results (optional - you can remove this if you want)
              setInput(prev => {
                // Remove any previous interim text
                const base = prev.replace(/\s*\[listening\.\.\.\]$/, '');
                return base + (base ? ' ' : '') + interimTranscript;
              });
            }
          };
          
          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            
            // Show user-friendly error messages
            if (event.error === 'not-allowed') {
              alert('Microphone permission denied. Please allow microphone access in your browser settings.');
            } else if (event.error === 'no-speech') {
              console.log('No speech detected');
            } else {
              console.error('Speech recognition error:', event.error);
            }
          };
          
          recognition.onend = () => {
            console.log('Speech recognition ended');
            setIsListening(false);
          };
          
          recognitionRef.current = recognition;
          setSpeechRecognitionAvailable(true);
          console.log('Speech recognition initialized successfully');
        } catch (error) {
          console.error('Failed to initialize speech recognition:', error);
          setSpeechRecognitionAvailable(false);
        }
      } else {
        console.warn('Speech Recognition API not available in this browser');
        setSpeechRecognitionAvailable(false);
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);


  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const isPDF = file.name.endsWith('.pdf');
      return isExcel || isPDF;
    });

    if (validFiles.length !== files.length) {
      alert('Please upload only Excel (.xlsx, .xls) or PDF (.pdf) files.');
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Convert file to base64 for sending to LLM
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const userInput = input;
    const filesToSend = [...uploadedFiles];
    setInput('');
    setUploadedFiles([]);
    setIsTyping(true);

    // Build conversation history for Gemini
    const conversationHistory = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.text }]
    }));
    
    // Count how many questions the consultant has asked (assistant messages with ?)
    const questionCount = messages.filter(msg => 
      msg.sender === 'system' && msg.text.includes('?')
    ).length;

    try {
      // Convert files to base64 and prepare file attachments
      const fileAttachments = await Promise.all(
        filesToSend.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          content: await fileToBase64(file),
        }))
      );

      // Call Gemini API with question count and file attachments
      let responseText = await consultWorkflow(userInput, conversationHistory, questionCount, fileAttachments);
      
      // Strip markdown formatting (**, __, etc.) and question count displays
      responseText = responseText
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
        .replace(/\*(.*?)\*/g, '$1')      // Remove *italic*
        .replace(/__(.*?)__/g, '$1')     // Remove __bold__
        .replace(/_(.*?)_/g, '$1')       // Remove _italic_
        .replace(/`(.*?)`/g, '$1')       // Remove `code`
        .replace(/#{1,6}\s/g, '')        // Remove headers
        .replace(/\(Total questions asked:.*?\)/gi, '')  // Remove question count displays
        .replace(/Total questions asked:.*?(\n|$)/gi, '')  // Remove question count on new line
        .trim();

      const systemMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: responseText,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, systemMsg]);
      
      // Background: Extract and create workflows from conversation
      // NOTE: Org structure is no longer auto-populated - users build it manually in "Your Team" tab
      const extractWorkflowInBackground = async () => {
        try {
          const fullConversation = [...messages, userMsg, systemMsg]
            .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
            .join('\n\n');
          
            // Only extract if conversation has meaningful content (at least 100 chars and 2+ messages)
            // Also check that the conversation actually mentions workflow-related content
            const hasWorkflowContent = fullConversation.toLowerCase().match(/\b(workflow|automate|process|step|task|agent|email|excel|pdf|gmail|reply|send|update|generate|calculate|notify)\b/);
            if (fullConversation.length > 100 && (messages.length + 2) >= 2 && hasWorkflowContent) {
              // Get current workflows from localStorage
              const currentWorkflows = JSON.parse(localStorage.getItem('workflows') || '[]');

              // Extract workflow using Workflow Visualization Agent
              const extracted = await extractWorkflowFromConversation(fullConversation, currentWorkflows);
            
            if (extracted && extracted.workflowName && extracted.steps && extracted.steps.length > 0) {
              // Update workflows in localStorage
              const existingIndex = currentWorkflows.findIndex((w: any) => w.name === extracted.workflowName);
              
              let workflowId: string;
              
              if (existingIndex >= 0) {
                // Update existing workflow
                workflowId = currentWorkflows[existingIndex].id;
                currentWorkflows[existingIndex] = {
                  ...currentWorkflows[existingIndex],
                  steps: extracted.steps.map((step: any, index: number) => ({
                    ...step,
                    id: step.id || `step-${Date.now()}-${index}`,
                    order: step.order !== undefined ? step.order : index,
                  })),
                  description: extracted.description || currentWorkflows[existingIndex].description,
                };
              } else {
                // Create new workflow
                workflowId = `workflow-${Date.now()}`;
                const newWorkflow = {
                  id: workflowId,
                  name: extracted.workflowName,
                  description: extracted.description || '',
                  steps: extracted.steps.map((step: any, index: number) => ({
                    ...step,
                    id: step.id || `step-${Date.now()}-${index}`,
                    order: step.order !== undefined ? step.order : index,
                  })),
                };
                currentWorkflows.push(newWorkflow);
              }
              
              // Auto-create a digital worker to orchestrate this workflow (for both new and updated workflows)
              if (onOrgChartUpdate) {
                const coordinatorName = `${extracted.workflowName} Coordinator`;
                const currentOrgData = JSON.parse(JSON.stringify(currentOrgChart || { name: "You", type: 'human', role: "Owner", children: [] }));
                
                // Add digital worker as a child of "You"
                if (!currentOrgData.children) {
                  currentOrgData.children = [];
                }
                
                // Check if coordinator already exists
                const existingCoordinator = currentOrgData.children.find((child: any) => 
                  child.name === coordinatorName && child.type === 'ai'
                );
                
                if (!existingCoordinator) {
                  // Find if this workflow is already assigned to another coordinator
                  const workflowAssignedTo = currentOrgData.children.find((child: any) => 
                    child.assignedWorkflows && child.assignedWorkflows.includes(workflowId)
                  );
                  
                  if (!workflowAssignedTo) {
                    currentOrgData.children.push({
                      name: coordinatorName,
                      type: 'ai',
                      role: `Orchestrates ${extracted.workflowName}`,
                      status: 'inactive', // Start as inactive - user must activate manually
                      assignedWorkflows: [workflowId]
                    });
                    
                    // Update org chart
                    onOrgChartUpdate(currentOrgData);
                  }
                } else {
                  // Coordinator exists, make sure workflow is assigned to it
                  if (!existingCoordinator.assignedWorkflows || !existingCoordinator.assignedWorkflows.includes(workflowId)) {
                    existingCoordinator.assignedWorkflows = [
                      ...(existingCoordinator.assignedWorkflows || []),
                      workflowId
                    ];
                    // Update org chart
                    onOrgChartUpdate(currentOrgData);
                  }
                }
              }
              
              // Save to localStorage
              localStorage.setItem('workflows', JSON.stringify(currentWorkflows));
            }
          }
        } catch (error) {
          // Silently fail - don't interrupt the conversation
          console.error('Background workflow extraction failed:', error);
        }
      };
      
      // Debounce workflow extraction slightly to avoid too many calls
      setTimeout(extractWorkflowInBackground, 3000);
      
      // Note: Workflows are built automatically in the background from conversation
      // Org structure is NOT auto-populated - users build it manually in "Your Team" tab using the Team Architect chat
      
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
                 
                 {/* Uploaded Files Display */}
                 {uploadedFiles.length > 0 && (
                   <div className="px-4 pb-2 flex flex-wrap gap-2">
                     {uploadedFiles.map((file, index) => (
                       <div key={index} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-sm">
                         <FileText size={14} className="text-blue-600" />
                         <span className="text-blue-900 font-medium">{file.name}</span>
                         <button
                           onClick={() => removeFile(index)}
                           className="text-blue-600 hover:text-blue-800 transition-colors"
                         >
                           <X size={14} />
                         </button>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Input Actions */}
                 <div className="px-3 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                       <input
                         type="file"
                         ref={fileInputRef}
                         onChange={handleFileUpload}
                         accept=".xlsx,.xls,.pdf"
                         multiple
                         className="hidden"
                       />
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" 
                         title="Upload Excel or PDF"
                       >
                          <Plus size={18} />
                       </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Voice Input Button */}
                        <button 
                          onClick={() => {
                            if (!speechRecognitionAvailable) {
                              alert('Speech recognition is not available in this browser. Please use Chrome, Edge, or another browser that supports the Web Speech API.');
                              return;
                            }
                            
                            if (!isListening && recognitionRef.current) {
                              try {
                                console.log('Starting speech recognition...');
                                recognitionRef.current.start();
                              } catch (error: any) {
                                console.error('Failed to start speech recognition:', error);
                                setIsListening(false);
                                if (error.message?.includes('already started')) {
                                  // Recognition already running, just update state
                                  setIsListening(true);
                                } else {
                                  alert('Failed to start voice recording. Please check your microphone permissions.');
                                }
                              }
                            } else if (isListening && recognitionRef.current) {
                              console.log('Stopping speech recognition...');
                              recognitionRef.current.stop();
                              setIsListening(false);
                            } else if (!recognitionRef.current) {
                              alert('Speech recognition not initialized. Please refresh the page.');
                            }
                          }}
                          disabled={!speechRecognitionAvailable}
                          className={`p-2 rounded-full transition-all flex items-center justify-center ${
                            !speechRecognitionAvailable
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                              : isListening 
                              ? 'bg-red-600 text-white animate-pulse' 
                              : 'bg-black text-white hover:bg-gray-800'
                          }`}
                          title={
                            !speechRecognitionAvailable 
                              ? "Speech recognition not available" 
                              : isListening 
                              ? "Stop Recording" 
                              : "Start Voice Input"
                          }
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
