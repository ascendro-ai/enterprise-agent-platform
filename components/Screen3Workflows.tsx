import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Bot, User, Settings, Zap, ArrowRight, GitBranch, X, AlertCircle, FileText, Mail } from 'lucide-react';
import { Workflow, WorkflowStep } from '../types';
import { buildAgent, extractAgentContext } from '../services/geminiService';
import GmailAuth from './GmailAuth';
import { isAuthenticated as isGmailAuthenticated } from '../services/gmailService';
// Workflow extraction happens in Screen1Consultant in the background

interface Screen3WorkflowsProps {
  orgChartData?: any;
  onWorkflowUpdate?: (workflows: Workflow[]) => void;
  consultantHistory?: Array<{ sender: string; text: string; timestamp?: Date }>;
  workflows?: Workflow[];
  onWorkflowsUpdate?: (workflows: Workflow[]) => void;
}

const Screen3Workflows: React.FC<Screen3WorkflowsProps> = ({ 
  orgChartData, 
  onWorkflowUpdate,
  consultantHistory = [],
  workflows: propWorkflows,
  onWorkflowsUpdate
}) => {
  // Use workflows from props if provided, otherwise load from localStorage
  const [workflows, setWorkflows] = useState<Workflow[]>(() => {
    if (propWorkflows && propWorkflows.length > 0) {
      return propWorkflows;
    }
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

  // Sync with propWorkflows if provided
  useEffect(() => {
    if (propWorkflows) {
      setWorkflows(propWorkflows);
    }
  }, [propWorkflows]);

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isEditingStep, setIsEditingStep] = useState<string | null>(null);
  const [selectedStepForBuilder, setSelectedStepForBuilder] = useState<{ workflowId: string; stepId: string; agentName: string } | null>(null);
  
  // Agent Builder State (similar to Screen2OrgChart)
  const [builderMessages, setBuilderMessages] = useState<Array<{ sender: 'system' | 'user'; text: string }>>([]);
  const [builderInput, setBuilderInput] = useState('');
  const [isBuilderTyping, setIsBuilderTyping] = useState(false);
  const [builderBlueprint, setBuilderBlueprint] = useState<{ greenList: string[]; redList: string[] }>({
    greenList: [],
    redList: []
  });
  
  // File upload state for agent builder
  const [builderUploadedFiles, setBuilderUploadedFiles] = useState<File[]>([]);
  const builderFileInputRef = useRef<HTMLInputElement>(null);
  const [showBuilderPlusMenu, setShowBuilderPlusMenu] = useState(false);
  
  // Gmail Auth State
  const [showGmailAuth, setShowGmailAuth] = useState(false);
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState(false);

  // Save workflows to localStorage and notify parent whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('workflows', JSON.stringify(workflows));
      if (onWorkflowUpdate) {
        onWorkflowUpdate(workflows);
      }
      if (onWorkflowsUpdate) {
        onWorkflowsUpdate(workflows);
      }
    } catch (e) {
      console.error('Error saving workflows:', e);
    }
  }, [workflows, onWorkflowUpdate, onWorkflowsUpdate]);

  // Sync workflows from localStorage (they're created in Screen1Consultant in the background)
  useEffect(() => {
    const syncWorkflows = () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const saved = localStorage.getItem('workflows');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              // Only update if workflows have changed
              const currentIds = workflows.map(w => w.id).sort().join(',');
              const newIds = parsed.map((w: any) => w.id).sort().join(',');
              if (currentIds !== newIds || workflows.length !== parsed.length) {
                setWorkflows(parsed);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error syncing workflows:', e);
      }
    };

    // Check for updates every 2 seconds
    const intervalId = setInterval(syncWorkflows, 2000);
    return () => clearInterval(intervalId);
  }, [workflows]);

  // Get all AI agents from org chart for assignment
  const getAllAgents = (node: any): Array<{ id: string; name: string }> => {
    if (!node) return [];
    const agents: Array<{ id: string; name: string }> = [];
    if (node.type === 'ai') {
      agents.push({ id: node.name, name: node.name });
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        agents.push(...getAllAgents(child));
      });
    }
    return agents;
  };

  const availableAgents = orgChartData ? getAllAgents(orgChartData) : [];

  // Workflows are ONLY created automatically from "Create a Task" conversations
  // Users can assign steps to AI agents or humans, but cannot manually create/edit workflows

  const handleUpdateStep = (workflowId: string, stepId: string, updates: Partial<WorkflowStep>) => {
    // Only allow updating assignment, not step labels or types (workflows are auto-generated)
    setWorkflows(workflows.map(w => {
      if (w.id === workflowId) {
        return {
          ...w,
          steps: w.steps.map(s => 
            s.id === stepId ? { ...s, ...updates } : s
          ),
        };
      }
      return w;
    }));
  };

  const handleAssignStep = (workflowId: string, stepId: string, assignment: { type: 'ai' | 'human'; agentId?: string; agentName?: string }) => {
    handleUpdateStep(workflowId, stepId, { assignedTo: assignment });
    
    // If assigning to AI agent, open agent builder
    if (assignment.type === 'ai') {
      const step = workflows.find(w => w.id === workflowId)?.steps.find(s => s.id === stepId);
      if (step) {
        setSelectedStepForBuilder({
          workflowId,
          stepId,
          agentName: assignment.agentName || step.label + ' Agent'
        });
        // Initialize agent builder with step label
        initializeAgentBuilder(step.label, consultantHistory);
      }
    }
  };

  // Check Gmail auth status on load and handle OAuth callback
  useEffect(() => {
    setIsGoogleLoggedIn(isGmailAuthenticated());
    
    // Check if we're returning from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && !showGmailAuth) {
      // We have an OAuth code, show the auth component to process it
      setShowGmailAuth(true);
    }
  }, [showGmailAuth]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleBuilderFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setBuilderUploadedFiles(prev => [...prev, ...files]);
    if (builderFileInputRef.current) {
      builderFileInputRef.current.value = ''; // Clear the input so same file can be selected again
    }
    setShowBuilderPlusMenu(false);
  };

  // Initialize agent builder when a step is selected
  const initializeAgentBuilder = async (stepLabel: string, history: Array<{ sender: string; text: string; timestamp?: Date }>) => {
    try {
      // First, try to extract blueprint from consultantHistory (Create a Task conversation)
      // Only populate from the main conversation, not from guesses
      let initialBlueprint = { greenList: [] as string[], redList: [] as string[] };
      
      if (history && history.length > 0) {
        try {
          const context = await extractAgentContext(stepLabel, history);
          if (context.blueprint) {
            initialBlueprint = {
              greenList: context.blueprint.greenList || [],
              redList: context.blueprint.redList || []
            };
          }
        } catch (error) {
          console.error('Error extracting context from consultant history:', error);
        }
      }
      
      // Set initial blueprint from conversation (not from LLM guess)
      setBuilderBlueprint(initialBlueprint);
      
      // Get proactive initial message from buildAgent (but don't use its blueprint)
      const result = await buildAgent(
        stepLabel,
        `I need to automate this step: "${stepLabel}". What do I need to set up to make this work?`,
        [],
        undefined,
        []
      );
      
      setBuilderMessages([{
        sender: 'system',
        text: result.response
      }]);
      
      // DO NOT auto-update blueprint from LLM response - only use what user confirms
    } catch (error) {
      console.error('Error initializing agent builder:', error);
      setBuilderMessages([{
        sender: 'system',
        text: `I'm here to help you automate: "${stepLabel}". To get started, I need to understand what's required. What integrations or tools does this step need? (e.g., Gmail access, Excel files, PDF generation, etc.)`
      }]);
    }
  };

  // Detect if user message contains confirmation language
  const detectConfirmation = (userText: string, lastAssistantMessage: string): { isConfirmation: boolean; confirmedItems?: { greenList?: string[]; redList?: string[] } } => {
    const confirmationPatterns = [
      /yes/i, /yeah/i, /yep/i, /yup/i, /sure/i, /correct/i, /right/i, /that's right/i,
      /add that/i, /add it/i, /include that/i, /put that/i, /add to/i,
      /confirm/i, /agreed/i, /exactly/i, /that's correct/i, /that works/i,
      /do that/i, /make it so/i, /proceed/i, /go ahead/i
    ];

    const isConfirmation = confirmationPatterns.some(pattern => pattern.test(userText));
    
    if (!isConfirmation) {
      return { isConfirmation: false };
    }

    // If user confirmed, try to extract what they're confirming from the assistant's last message
    // Look for suggested actions or limits in the assistant's message
    const suggestedActions: string[] = [];
    const suggestedLimits: string[] = [];

    // Look for patterns like "Should I add [action] to..." or "add [action] to the Actions list"
    const actionMatches = lastAssistantMessage.match(/(?:add|include|put)\s+["']?([^"']+)["']?\s+(?:to|in|on)\s+(?:the\s+)?(?:Actions|actions|green\s+list)/gi);
    if (actionMatches) {
      actionMatches.forEach(match => {
        const extracted = match.replace(/(?:add|include|put)\s+["']?/i, '').replace(/\s+(?:to|in|on)\s+(?:the\s+)?(?:Actions|actions|green\s+list).*/i, '').trim();
        if (extracted) suggestedActions.push(extracted);
      });
    }

    // Look for patterns like "Should I add [limit] to..." or "add [limit] to the Hard Limits"
    const limitMatches = lastAssistantMessage.match(/(?:add|include|put)\s+["']?([^"']+)["']?\s+(?:to|in|on)\s+(?:the\s+)?(?:Hard\s+Limits|hard\s+limits|red\s+list)/gi);
    if (limitMatches) {
      limitMatches.forEach(match => {
        const extracted = match.replace(/(?:add|include|put)\s+["']?/i, '').replace(/\s+(?:to|in|on)\s+(?:the\s+)?(?:Hard\s+Limits|hard\s+limits|red\s+list).*/i, '').trim();
        if (extracted) suggestedLimits.push(extracted);
      });
    }

    // Also check if user explicitly mentions what to add
    const userActionMatch = userText.match(/(?:add|include|put)\s+["']?([^"']+)["']?\s+(?:to|in|on)\s+(?:the\s+)?(?:Actions|actions|green\s+list)/i);
    if (userActionMatch) {
      suggestedActions.push(userActionMatch[1].trim());
    }

    const userLimitMatch = userText.match(/(?:add|include|put)\s+["']?([^"']+)["']?\s+(?:to|in|on)\s+(?:the\s+)?(?:Hard\s+Limits|hard\s+limits|red\s+list)/i);
    if (userLimitMatch) {
      suggestedLimits.push(userLimitMatch[1].trim());
    }

    return {
      isConfirmation: true,
      confirmedItems: {
        greenList: suggestedActions.length > 0 ? suggestedActions : undefined,
        redList: suggestedLimits.length > 0 ? suggestedLimits : undefined
      }
    };
  };

  // Handle agent builder send
  const handleBuilderSend = async (text: string) => {
    if (!text.trim() && builderUploadedFiles.length === 0) return;
    if (!selectedStepForBuilder) return;

    // Find the step to get its label
    const workflow = workflows.find(w => w.id === selectedStepForBuilder.workflowId);
    const step = workflow?.steps.find(s => s.id === selectedStepForBuilder.stepId);
    const stepLabel = step?.label || selectedStepForBuilder.agentName;

    const userMsg = { sender: 'user' as const, text: text.trim() || `Uploaded ${builderUploadedFiles.length} file(s)` };
    
    // Check if user is confirming something from the last assistant message
    const lastAssistantMsg = builderMessages.filter(m => m.sender === 'system').slice(-1)[0]?.text || '';
    const confirmation = detectConfirmation(text.trim(), lastAssistantMsg);
    
    // If user confirmed something, update blueprint
    if (confirmation.isConfirmation && confirmation.confirmedItems) {
      setBuilderBlueprint(prev => ({
        greenList: [
          ...prev.greenList,
          ...(confirmation.confirmedItems?.greenList || [])
        ].filter((item, index, self) => self.indexOf(item) === index), // Remove duplicates
        redList: [
          ...prev.redList,
          ...(confirmation.confirmedItems?.redList || [])
        ].filter((item, index, self) => self.indexOf(item) === index) // Remove duplicates
      }));
    }
    
    setBuilderMessages(prev => [...prev, userMsg]);
    const textToSend = text.trim();
    const filesToSend = [...builderUploadedFiles];
    setBuilderInput('');
    setBuilderUploadedFiles([]);
    setIsBuilderTyping(true);

    try {
      const conversationHistory = builderMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }]
      }));

      // Convert files to base64
      const fileAttachments = await Promise.all(
        filesToSend.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          content: await fileToBase64(file),
        }))
      );

      const result = await buildAgent(
        stepLabel,
        textToSend || `I've uploaded ${filesToSend.length} file(s) for this automation.`,
        conversationHistory,
        undefined, // consultantContext
        fileAttachments
      );

      // DO NOT auto-update blueprint from LLM response
      // Blueprint should only be updated when user explicitly confirms behavior
      // It should only be populated from consultantHistory (Create a Task) or explicit user confirmation

      setBuilderMessages(prev => [...prev, {
        sender: 'system',
        text: result.response
      }]);
    } catch (error) {
      console.error('Error in agent builder:', error);
      setBuilderMessages(prev => [...prev, {
        sender: 'system',
        text: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsBuilderTyping(false);
    }
  };

  const handleUpdateWorkflow = (workflowId: string, updates: Partial<Workflow>) => {
    setWorkflows(workflows.map(w => 
      w.id === workflowId ? { ...w, ...updates } : w
    ));
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow({ ...selectedWorkflow, ...updates });
    }
  };

  const renderWorkflowView = (workflow: Workflow) => {
    const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);
    const showAgentBuilder = selectedStepForBuilder?.workflowId === workflow.id;
    
    return (
      <div className="h-full flex flex-col">
        {/* Workflow Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{workflow.name}</h2>
              {workflow.description && (
                <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
              )}
            </div>
            {workflow.status && (
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  workflow.status === 'active' ? 'bg-green-100 text-green-700' :
                  workflow.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {workflow.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Workflow Canvas */}
        <div className="flex-1 overflow-hidden bg-gray-50 flex">
          {/* Main Workflow Flow */}
          <div className={`flex-1 overflow-auto p-8 transition-all ${showAgentBuilder ? 'w-2/3' : 'w-full'} relative`}>
            {/* Legend - Top Right */}
            <div className="absolute top-8 right-8 bg-white border border-gray-200 rounded-lg shadow-md p-4 z-10">
              <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border-2 border-indigo-200" style={{ backgroundColor: '#E8EAF6' }}></div>
                  <span className="text-xs text-gray-700">AI Automated</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-3xl border-2 border-orange-200" style={{ backgroundColor: '#FFE0B2' }}></div>
                  <span className="text-xs text-gray-700">Human Task</span>
                </div>
              </div>
            </div>
            
            <div className="relative" style={{ minWidth: '900px', minHeight: '600px' }}>
              {/* Logic Flow Title */}
              <div className="flex items-center gap-2 mb-6">
                <Zap className="text-gray-400" size={20} />
                <h2 className="text-lg font-semibold text-gray-700">Logic Flow</h2>
              </div>

            {/* Workflow Steps - Serpentine Layout (right → down → left → down → right) */}
            <div className="relative" style={{ minHeight: '400px' }}>
              {sortedSteps.map((step, index) => {
                // Calculate position for serpentine layout
                // Pattern: Row 0: left to right (0,1,2), Row 1: right to left (5,4,3), Row 2: left to right (6,7,8), etc.
                const stepsPerRow = 3;
                const row = Math.floor(index / stepsPerRow);
                const col = index % stepsPerRow;
                const isEvenRow = row % 2 === 0;
                
                // Calculate x position (serpentine: even rows left→right, odd rows right→left)
                const stepWidth = 240;
                const stepHeight = 140;
                const horizontalGap = 260;
                const verticalGap = 200;
                
                let x: number;
                if (isEvenRow) {
                  // Even rows: left to right (0, 1, 2...)
                  x = col * horizontalGap;
                } else {
                  // Odd rows: right to left (5, 4, 3...)
                  x = (stepsPerRow - 1 - col) * horizontalGap;
                }
                
                const y = row * verticalGap;
                
                // Determine connector direction
                const isLastInRow = col === stepsPerRow - 1;
                const isLastStep = index === sortedSteps.length - 1;
                const hasNextStep = index < sortedSteps.length - 1;
                const nextRow = Math.floor((index + 1) / stepsPerRow);
                const isNextRowEven = nextRow % 2 === 0;
                
                // Color gradient based on progress (cool blues → warm oranges/greens)
                const progress = index / (sortedSteps.length - 1);
                const hue = 200 + (progress * 120); // Blue (200) to Green (320)
                const saturation = 60 + (progress * 20);
                const lightness = 85 - (progress * 10);
                const stepColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                
                return (
                  <React.Fragment key={step.id}>
                    {/* Step Card */}
                    <div
                      className="absolute group"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        width: `${stepWidth}px`
                      }}
                    >
                      <div
                        className={`relative bg-white border-2 p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col ${
                          step.type === 'trigger'
                            ? 'border-gray-300 rounded-sm'
                            : step.type === 'decision'
                            ? step.assignedTo?.type === 'human'
                              ? 'border-orange-300 rounded-3xl border-dashed'
                              : 'border-indigo-300 rounded-sm border-dashed'
                            : step.type === 'end'
                            ? step.assignedTo?.type === 'human'
                              ? 'border-orange-400 rounded-3xl text-white shadow-lg'
                              : 'border-indigo-500 rounded-sm text-white shadow-lg'
                            : step.assignedTo?.type === 'ai'
                            ? 'border-indigo-200 rounded-sm'
                            : step.assignedTo?.type === 'human'
                            ? 'border-orange-200 rounded-3xl'
                            : 'border-gray-300 rounded-xl'
                        } ${isEditingStep === step.id ? 'ring-4 ring-indigo-500 ring-opacity-50' : ''}`}
                        style={{ 
                          height: `${stepHeight}px`, 
                          minHeight: `${stepHeight}px`,
                          backgroundColor: step.type === 'trigger'
                            ? '#F5F5F5'
                            : step.type === 'end'
                            ? step.assignedTo?.type === 'human'
                              ? '#FF8A65'  // Darker coral/peach for end
                              : '#7986CB'  // Darker slate blue for end
                            : step.assignedTo?.type === 'ai'
                            ? '#E8EAF6'  // Cool slate blue
                            : step.assignedTo?.type === 'human'
                            ? '#FFE0B2'  // Coral/peach
                            : '#F5F5F5'  // Light gray (default)
                        }}
                        onClick={() => {
                          if (step.assignedTo?.type === 'ai') {
                            // Open agent builder for this step
                            setSelectedStepForBuilder({
                              workflowId: workflow.id,
                              stepId: step.id,
                              agentName: step.assignedTo.agentName || step.label + ' Agent'
                            });
                            if (builderMessages.length === 0) {
                              initializeAgentBuilder(step.label, consultantHistory);
                            }
                          } else {
                            setIsEditingStep(isEditingStep === step.id ? null : step.id);
                          }
                        }}
                      >
                      {/* Step Number */}
                      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs font-bold shadow-lg">
                        {index + 1}
                      </div>

                      {/* Step Type Label */}
                      <div className={`text-[9px] uppercase font-bold tracking-wider mb-3 flex items-center gap-2 ${
                        step.type === 'trigger' 
                          ? 'text-gray-600'
                          : step.type === 'decision' 
                          ? step.assignedTo?.type === 'human' ? 'text-orange-700' : 'text-indigo-700'
                          : step.type === 'end' 
                          ? 'text-white'
                          : step.assignedTo?.type === 'human' ? 'text-orange-700' : 'text-indigo-700'
                      }`}>
                        {step.type === 'decision' && (
                          <div className="flex gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                              step.assignedTo?.type === 'human' ? 'bg-orange-500' : 'bg-indigo-500'
                            }`}></div>
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                              step.assignedTo?.type === 'human' ? 'bg-orange-500' : 'bg-indigo-500'
                            }`} style={{ animationDelay: '0.2s' }}></div>
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                              step.assignedTo?.type === 'human' ? 'bg-orange-500' : 'bg-indigo-500'
                            }`} style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        )}
                        <span>
                          {step.type === 'trigger' ? 'TRIGGER' :
                           step.type === 'decision' ? 'CHECK' :
                           step.type === 'end' ? 'END' : 'ACTION'}
                        </span>
                      </div>

                      {/* Step Label */}
                      <div className={`text-sm font-semibold mb-3 flex-1 flex items-start ${
                        (step.type === 'end' && (step.assignedTo?.type === 'ai' || step.assignedTo?.type === 'human'))
                          ? 'text-white' 
                          : 'text-gray-900'
                      }`}>
                        <span className="line-clamp-3 leading-relaxed">{step.label}</span>
                      </div>


                      {/* Needs Attention Indicator - Show on AI steps that need configuration */}
                      {step.assignedTo?.type === 'ai' && (() => {
                        // Check if this step needs attention
                        // Show indicator if step is assigned to AI but hasn't been fully configured
                        // We'll check if there's a configured flag or if it's not currently being worked on
                        const isCurrentlyBeingConfigured = selectedStepForBuilder?.stepId === step.id;
                        // For now, show indicator on all AI steps (they all need configuration)
                        // In the future, we could check a configured flag stored in the step data
                        const needsAttention = !isCurrentlyBeingConfigured;
                        
                        return needsAttention ? (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                            <AlertCircle size={14} className="text-white" />
                          </div>
                        ) : null;
                      })()}

                      {/* Edit Menu */}
                      {isEditingStep === step.id && (
                        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-[250px]">
                          <div className="mb-3">
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Assign To</label>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssignStep(workflow.id, step.id, { type: 'human' });
                                }}
                                className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${
                                  step.assignedTo?.type === 'human'
                                    ? 'bg-gray-100 border-gray-300 text-gray-900'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <User size={14} className="mx-auto mb-1" />
                                Human
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (availableAgents.length > 0) {
                                    // Open agent selection
                                    const agent = availableAgents[0]; // For now, assign to first agent
                                    handleAssignStep(workflow.id, step.id, { 
                                      type: 'ai', 
                                      agentId: agent.id,
                                      agentName: agent.name 
                                    });
                                  }
                                }}
                                className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${
                                  step.assignedTo?.type === 'ai'
                                    ? 'bg-purple-100 border-purple-300 text-purple-900'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <Bot size={14} className="mx-auto mb-1" />
                                AI Agent
                              </button>
                            </div>
                          </div>

                          {step.assignedTo?.type === 'ai' && availableAgents.length > 0 && (
                            <div className="mb-3">
                              <label className="text-xs font-medium text-gray-700 mb-1 block">Select Agent</label>
                              <select
                                value={step.assignedTo.agentId || ''}
                                onChange={(e) => {
                                  const agent = availableAgents.find(a => a.id === e.target.value);
                                  if (agent) {
                                    handleAssignStep(workflow.id, step.id, {
                                      type: 'ai',
                                      agentId: agent.id,
                                      agentName: agent.name,
                                    });
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
                              >
                                <option value="">Select agent...</option>
                                {availableAgents.map(agent => (
                                  <option key={agent.id} value={agent.id}>
                                    {agent.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {step.assignedTo?.type === 'ai' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStepForBuilder({
                                  workflowId: workflow.id,
                                  stepId: step.id,
                                  agentName: step.assignedTo?.agentName || step.label + ' Agent'
                                });
                                if (builderMessages.length === 0) {
                                  initializeAgentBuilder(step.label, consultantHistory);
                                }
                              }}
                              className="w-full px-3 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Settings size={14} />
                              Customize Agent
                            </button>
                          )}

                        </div>
                      )}
                      </div>
                    </div>

                    {/* Straight Connector Lines for Serpentine Layout */}
                    {hasNextStep && (
                      <>
                        {/* Horizontal straight connector (within row) */}
                        {!isLastInRow && (
                          <svg
                            className="absolute pointer-events-none"
                            style={{
                              left: isEvenRow ? `${x + stepWidth}px` : `${x - (horizontalGap - stepWidth)}px`,
                              top: `${y + stepHeight / 2}px`,
                              width: `${horizontalGap - stepWidth}px`,
                              height: '20px',
                              zIndex: 0,
                              overflow: 'visible'
                            }}
                          >
                            {isEvenRow ? (
                              // Even rows: left to right
                              <>
                                <line
                                  x1="0"
                                  y1="10"
                                  x2={horizontalGap - stepWidth}
                                  y2="10"
                                  stroke="#a855f7"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                {/* Arrow head pointing right */}
                                <polygon
                                  points={`${horizontalGap - stepWidth - 8},5 ${horizontalGap - stepWidth},10 ${horizontalGap - stepWidth - 8},15`}
                                  fill="#a855f7"
                                />
                              </>
                            ) : (
                              // Odd rows: right to left
                              <>
                                <line
                                  x1={horizontalGap - stepWidth}
                                  y1="10"
                                  x2="0"
                                  y2="10"
                                  stroke="#a855f7"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                {/* Arrow head pointing left */}
                                <polygon
                                  points={`8,5 0,10 8,15`}
                                  fill="#a855f7"
                                />
                              </>
                            )}
                          </svg>
                        )}
                        
                        {/* Vertical straight connector (between rows) */}
                        {isLastInRow && (
                          <svg
                            className="absolute pointer-events-none"
                            style={{
                              left: `${x + stepWidth / 2}px`,
                              top: `${y + stepHeight}px`,
                              width: '20px',
                              height: `${verticalGap - stepHeight}px`,
                              zIndex: 0,
                              overflow: 'visible'
                            }}
                          >
                            {/* Straight line */}
                            <line
                              x1="10"
                              y1="0"
                              x2="10"
                              y2={verticalGap - stepHeight}
                              stroke="#a855f7"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            {/* Arrow head pointing down */}
                            <polygon
                              points={`5,${verticalGap - stepHeight - 8} 10,${verticalGap - stepHeight} 15,${verticalGap - stepHeight - 8}`}
                              fill="#a855f7"
                            />
                          </svg>
                        )}
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          </div>

          {/* Agent Builder Panel (Right Side) */}
          {showAgentBuilder && selectedStepForBuilder && (
            <div className="w-1/3 border-l border-gray-200 bg-white flex flex-col">
              {/* Needs Attention Banner - Show when automation isn't fully configured */}
              {(() => {
                // Check if automation has all details needed
                // Consider it incomplete if:
                // - Blueprint is empty or minimal (no actions defined)
                // - Last system message indicates pending requirements
                const hasMinimalBlueprint = builderBlueprint.greenList.length === 0;
                
                // Check last system message for incomplete indicators
                const lastSystemMessage = builderMessages
                  .filter(msg => msg.sender === 'system')
                  .slice(-1)[0];
                
                const lastMessageIndicatesIncomplete = lastSystemMessage && (
                  lastSystemMessage.text.toLowerCase().includes('need') ||
                  lastSystemMessage.text.toLowerCase().includes('require') ||
                  lastSystemMessage.text.toLowerCase().includes('set up') ||
                  lastSystemMessage.text.toLowerCase().includes('authenticate') ||
                  lastSystemMessage.text.toLowerCase().includes('missing') ||
                  lastSystemMessage.text.toLowerCase().includes('connect') ||
                  lastSystemMessage.text.toLowerCase().includes('upload') ||
                  lastSystemMessage.text.toLowerCase().includes('provide')
                );
                
                // Check if last message indicates completion
                const lastMessageIndicatesComplete = lastSystemMessage && (
                  lastSystemMessage.text.toLowerCase().includes('ready') ||
                  lastSystemMessage.text.toLowerCase().includes('configured') ||
                  lastSystemMessage.text.toLowerCase().includes('complete') ||
                  lastSystemMessage.text.toLowerCase().includes('all set')
                );
                
                // Show banner if blueprint is minimal OR conversation indicates incomplete (and not complete)
                const needsAttention = hasMinimalBlueprint || (lastMessageIndicatesIncomplete && !lastMessageIndicatesComplete);
                
                return needsAttention ? (
                  <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-yellow-800 mb-1">Needs Attention</p>
                        <p className="text-xs text-yellow-700">
                          Complete the setup above to finish configuring this automation.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
              
              {/* Agent Builder Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-purple-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Agent Builder</h3>
                    <p className="text-xs text-gray-500">Configure automation for this step</p>
                  </div>
                </div>
                    <button
                      onClick={() => {
                        setSelectedStepForBuilder(null);
                        setBuilderMessages([]);
                        setBuilderBlueprint({ greenList: [], redList: [] });
                        setIsEditingStep(null);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
              </div>

              {/* Blueprint Display */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">Blueprint</h4>
                
                {/* Green List */}
                {builderBlueprint.greenList.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-green-700 mb-1.5">Actions</div>
                    <div className="space-y-1">
                      {builderBlueprint.greenList.map((action, idx) => (
                        <div key={idx} className="text-xs text-gray-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Red List */}
                {builderBlueprint.redList.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-red-700 mb-1.5">Hard Limits</div>
                    <div className="space-y-1">
                      {builderBlueprint.redList.map((limit, idx) => (
                        <div key={idx} className="text-xs text-gray-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                          {limit}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {builderBlueprint.greenList.length === 0 && builderBlueprint.redList.length === 0 && (
                  <p className="text-xs text-gray-500 italic">No blueprint yet. Start chatting to build the agent configuration.</p>
                )}
              </div>

              {/* Agent Builder Chat */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {builderMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.sender === 'system' && (
                        <div className="flex flex-col items-center mr-2 mt-1 shrink-0">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden bg-white border border-gray-200">
                            <img src="/Lumi.png" alt="Lumi" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[9px] text-gray-500 mt-0.5 font-medium">Lumi</span>
                        </div>
                      )}
                      <div className={`p-3 text-sm rounded-2xl max-w-[90%] shadow-sm whitespace-pre-wrap ${
                        msg.sender === 'user' 
                          ? 'bg-white text-gray-900 border border-gray-200' 
                          : 'bg-purple-600 text-white'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isBuilderTyping && (
                    <div className="flex justify-start">
                      <div className="flex flex-col items-center mr-2 mt-1 shrink-0">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden bg-white border border-gray-200">
                          <img src="/Lumi.png" alt="Lumi" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] text-gray-500 mt-0.5 font-medium">Lumi</span>
                      </div>
                      <div className="bg-purple-600 text-white p-3 rounded-2xl text-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agent Builder Input */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={builderInput}
                      onChange={(e) => setBuilderInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleBuilderSend(builderInput);
                        }
                      }}
                      placeholder="Instruct agent builder..."
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <button
                      onClick={() => handleBuilderSend(builderInput)}
                      disabled={!builderInput.trim() || isBuilderTyping}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        builderInput.trim() && !isBuilderTyping
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // If agent builder is open, show full-page builder view
  if (selectedStepForBuilder) {
    const workflow = workflows.find(w => w.id === selectedStepForBuilder.workflowId);
    const step = workflow?.steps.find(s => s.id === selectedStepForBuilder.stepId);
    const stepLabel = step?.label || 'Unknown Step';
    const workflowName = workflow?.name || 'Unknown Workflow';
    
    return (
      <div className="h-full w-full bg-gray-50 flex flex-col transition-opacity duration-300 ease-in-out">
        {/* Context Header - Shows where user is */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedStepForBuilder(null);
                setBuilderMessages([]);
                setBuilderBlueprint({ greenList: [], redList: [] });
                setIsEditingStep(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight size={18} className="text-gray-600 rotate-180" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <GitBranch size={14} />
                <span>{workflowName}</span>
                <span>•</span>
                <span>Step {step?.order !== undefined ? step.order + 1 : '?'}</span>
              </div>
              <h1 className="text-lg font-semibold text-gray-900">{stepLabel}</h1>
            </div>
          </div>
        </div>

        {/* Needs Attention Banner */}
        {(() => {
          const hasMinimalBlueprint = builderBlueprint.greenList.length === 0;
          const lastSystemMessage = builderMessages
            .filter(msg => msg.sender === 'system')
            .slice(-1)[0];
          
          const lastMessageIndicatesIncomplete = lastSystemMessage && (
            lastSystemMessage.text.toLowerCase().includes('need') ||
            lastSystemMessage.text.toLowerCase().includes('require') ||
            lastSystemMessage.text.toLowerCase().includes('set up') ||
            lastSystemMessage.text.toLowerCase().includes('authenticate') ||
            lastSystemMessage.text.toLowerCase().includes('missing') ||
            lastSystemMessage.text.toLowerCase().includes('connect') ||
            lastSystemMessage.text.toLowerCase().includes('upload') ||
            lastSystemMessage.text.toLowerCase().includes('provide')
          );
          
          const lastMessageIndicatesComplete = lastSystemMessage && (
            lastSystemMessage.text.toLowerCase().includes('ready') ||
            lastSystemMessage.text.toLowerCase().includes('configured') ||
            lastSystemMessage.text.toLowerCase().includes('complete') ||
            lastSystemMessage.text.toLowerCase().includes('all set')
          );
          
          const needsAttention = hasMinimalBlueprint || (lastMessageIndicatesIncomplete && !lastMessageIndicatesComplete);
          
          return needsAttention ? (
            <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">Needs Attention</p>
                  <p className="text-xs text-yellow-700">
                    Complete the setup below to finish configuring this automation.
                  </p>
                </div>
              </div>
            </div>
          ) : null;
        })()}

        {/* Main Two-Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Chat Interface */}
          <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {builderMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Bot size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">Start configuring your automation below</p>
              </div>
            ) : (
              builderMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'system' && (
                    <div className="flex flex-col items-center mr-3 mt-1 shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white border border-gray-200">
                        <img src="/Lumi.png" alt="Lumi" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1 font-medium">Lumi</span>
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl max-w-[80%] shadow-sm whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {isBuilderTyping && (
              <div className="flex justify-start">
                <div className="flex flex-col items-center mr-3 mt-1 shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white border border-gray-200">
                    <img src="/Lumi.png" alt="Lumi" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 font-medium">Lumi</span>
                </div>
                <div className="bg-gray-100 text-gray-900 border border-gray-200 p-4 rounded-2xl text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {/* Uploaded Files Display */}
              {builderUploadedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {builderUploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                      <FileText size={14} className="text-gray-500" />
                      <span className="text-gray-700">{file.name}</span>
                      <button
                        onClick={() => setBuilderUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-3 relative">
                {/* Plus Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowBuilderPlusMenu(!showBuilderPlusMenu)}
                    className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                  
                  {/* Plus Menu Dropdown */}
                  {showBuilderPlusMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                      <button
                        onClick={() => {
                          builderFileInputRef.current?.click();
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                      >
                        <FileText size={18} className="text-gray-500" />
                        <span>Upload File</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowGmailAuth(true);
                          setShowBuilderPlusMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Mail size={18} className="text-gray-500" />
                        <span>Connect Gmail</span>
                        {isGoogleLoggedIn && (
                          <span className="ml-auto text-xs text-green-600">Connected</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={builderFileInputRef}
                  onChange={handleBuilderFileChange}
                  className="hidden"
                  multiple
                />
                
                <input
                  type="text"
                  value={builderInput}
                  onChange={(e) => setBuilderInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleBuilderSend(builderInput);
                    }
                  }}
                  onClick={() => setShowBuilderPlusMenu(false)}
                  placeholder="Instruct agent builder..."
                  className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
                <button
                  onClick={() => handleBuilderSend(builderInput)}
                  disabled={(!builderInput.trim() && builderUploadedFiles.length === 0) || isBuilderTyping}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                    (builderInput.trim() || builderUploadedFiles.length > 0) && !isBuilderTyping
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Blueprint (Actions & Hard Limits) */}
          <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-white">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Blueprint</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Actions */}
              <div>
                <div className="text-xs font-medium text-green-700 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Actions
                </div>
                {builderBlueprint.greenList.length > 0 ? (
                  <div className="space-y-2">
                    {builderBlueprint.greenList.map((action, idx) => (
                      <div key={idx} className="text-sm text-gray-800 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                        {action}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic bg-gray-100 border border-gray-200 rounded-lg px-4 py-3">
                    No actions defined yet. Start chatting to build the blueprint.
                  </div>
                )}
              </div>

              {/* Hard Limits */}
              <div>
                <div className="text-xs font-medium text-red-700 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  Hard Limits
                </div>
                {builderBlueprint.redList.length > 0 ? (
                  <div className="space-y-2">
                    {builderBlueprint.redList.map((limit, idx) => (
                      <div key={idx} className="text-sm text-gray-800 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        {limit}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic bg-gray-100 border border-gray-200 rounded-lg px-4 py-3">
                    No hard limits defined yet. Start chatting to build the blueprint.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Gmail Authentication Modal */}
        {showGmailAuth && (
          <GmailAuth
            onAuthSuccess={() => {
              setShowGmailAuth(false);
              setIsGoogleLoggedIn(true);
              setBuilderMessages(prev => [...prev, {
                sender: 'system',
                text: 'Great! You\'re now authenticated with Gmail. I can now access your emails and send messages on your behalf.'
              }]);
            }}
            onClose={() => setShowGmailAuth(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white flex transition-opacity duration-300 ease-in-out">
      {/* Workflows Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col transition-all duration-300 ease-in-out">
        <div className="p-6 border-b border-gray-200">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Workflows</h2>
            <p className="text-xs text-gray-500 mt-1">
              Workflows are automatically created from your "Create a Task" conversations
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-2">
          {workflows.map(workflow => (
            <div
              key={workflow.id}
              onClick={() => setSelectedWorkflow(workflow)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedWorkflow?.id === workflow.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  workflow.status === 'active' ? 'bg-green-100 text-green-700' :
                  workflow.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {workflow.status || 'active'}
                </span>
              </div>
              {workflow.description && (
                <p className="text-xs text-gray-600 mb-2">{workflow.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{workflow.steps.length} steps</span>
                {workflow.coordinatorAgentName && (
                  <>
                    <span>•</span>
                    <span>Coordinated by {workflow.coordinatorAgentName}</span>
                  </>
                )}
              </div>
            </div>
          ))}

          {workflows.length === 0 && (
            <div className="text-center py-12 text-gray-500 px-4">
              <GitBranch size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-sm font-medium text-gray-900 mb-1">No workflows yet</p>
              <p className="text-xs text-gray-500">
                Start a conversation in "Create a Task" to automatically generate workflows
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Detail View */}
      <div className="flex-1 h-full overflow-hidden transition-all duration-300 ease-in-out">
        {selectedWorkflow ? (
          <div className="transition-opacity duration-300 ease-in-out">
            {renderWorkflowView(selectedWorkflow)}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50 transition-opacity duration-300 ease-in-out">
            <div className="text-center max-w-md px-6">
              <GitBranch size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Workflow Selected</h3>
              <p className="text-sm text-gray-600 mb-2">
                {workflows.length === 0 
                  ? 'Workflows are automatically created as you chat with the consultant in "Create a Task". Start a conversation there to see workflows appear here!'
                  : 'Choose a workflow from the sidebar to view its flowchart and assign steps to agents or humans'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Screen3Workflows;
