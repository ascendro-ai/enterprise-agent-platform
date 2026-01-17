
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Bot, User, Layers, Box, Settings, ZoomIn, Play, X, Camera, Slack, Globe, ToggleRight, ToggleLeft, GripVertical, Send, AlertTriangle, CheckCircle, Edit2, Map, Truck, Plus, ImageIcon, Mic, ArrowRight, Shield, ShieldAlert, Zap, ArrowRightCircle, GitBranch, AlertCircle, ChevronDown } from 'lucide-react';
import { buildAgent, extractAgentContext, processTeamArchitectRequest } from '../services/geminiService';
import FakeGoogleLogin from './FakeGoogleLogin';
import FakeGoogleReviews from './FakeGoogleReviews';

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

interface NodeData {
  name: string;
  type: 'ai' | 'human';
  role?: string;
  img?: string;
  status?: 'active' | 'needs_attention';
  children?: NodeData[];
}

// Initial Data: Empty state - user starts with no team structure
const initialData: NodeData = {
  name: "You",
  type: 'human',
  role: "Owner",
  children: []
};

// Types for Agent Builder Chat
interface AgentBuilderMessage {
    sender: 'system' | 'user';
    text: string;
}

interface AgentBlueprint {
    greenList: string[];
    redList: string[];
    flowSteps: { label: string; type: 'trigger' | 'action' | 'decision' | 'end' }[];
}

interface Screen2OrgChartProps {
  orgChartData?: NodeData;
  onOrgChartUpdate?: (data: NodeData) => void;
  consultantHistory?: Array<{ sender: string; text: string; timestamp?: Date }>;
}

const Screen2OrgChart: React.FC<Screen2OrgChartProps> = ({ orgChartData, onOrgChartUpdate, consultantHistory = [] }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphData, setGraphData] = useState<NodeData>(orgChartData || initialData);
  
  // Sync with parent state
  useEffect(() => {
    if (orgChartData) {
      setGraphData(orgChartData);
    }
  }, [orgChartData]);
  
  // Update parent when graphData changes
  useEffect(() => {
    if (onOrgChartUpdate) {
      onOrgChartUpdate(graphData);
    }
  }, [graphData, onOrgChartUpdate]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Teams');
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  
  // Team Architect Chat State
  const [teamChatInput, setTeamChatInput] = useState("");
  const [teamChatMessages, setTeamChatMessages] = useState<{sender: 'user' | 'system', text: string}[]>([
      {sender: 'system', text: 'I can help you organize your teams, delete agents, and more. Just tell me what you\'d like to do!'}
  ]);
  const [chatState, setChatState] = useState<'idle' | 'human_pending'>('idle');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ changes: any; changeType?: string } | null>(null);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Agent Builder Chat State
  const [builderMessages, setBuilderMessages] = useState<AgentBuilderMessage[]>([]);
  const [builderInput, setBuilderInput] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [builderStep, setBuilderStep] = useState(0);
  const [isBuilderTyping, setIsBuilderTyping] = useState(false);
  const [builderContext, setBuilderContext] = useState<{ summary?: string; blueprint?: { greenList: string[]; redList: string[]; flowSteps: Array<{ label: string; type: 'trigger' | 'action' | 'decision' | 'end' }> } } | null>(null);
  
  // Voice recognition state for agent builder
  const [isBuilderListening, setIsBuilderListening] = useState(false);
  const [builderSpeechRecognitionAvailable, setBuilderSpeechRecognitionAvailable] = useState(false);
  const builderRecognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Fake Google login/Reviews state
  const [showGoogleLogin, setShowGoogleLogin] = useState(false);
  const [showGoogleReviews, setShowGoogleReviews] = useState(false);
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState(false);

  // Agent Blueprint State (The Right Column Data)
  const [blueprint, setBlueprint] = useState<AgentBlueprint>({
      greenList: [],
      redList: [],
      flowSteps: []
  });

  useEffect(() => {
    if (wrapperRef.current) {
      const { clientWidth, clientHeight } = wrapperRef.current;
      setDimensions({ width: clientWidth, height: clientHeight });
    }
  }, []);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teamChatMessages, isChatExpanded]);

  // Initialize speech recognition for agent builder
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          
          recognition.onstart = () => {
            console.log('Builder speech recognition started');
            setIsBuilderListening(true);
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
            
            // Update input with final transcript
            if (finalTranscript) {
              setBuilderInput(prev => prev + finalTranscript.trim());
            } else if (interimTranscript) {
              // Show interim results
              setBuilderInput(prev => {
                const base = prev.replace(/\s*\[listening\.\.\.\]$/, '');
                return base + (base ? ' ' : '') + interimTranscript;
              });
            }
          };
          
          recognition.onerror = (event: any) => {
            console.error('Builder speech recognition error:', event.error);
            setIsBuilderListening(false);
            
            if (event.error === 'not-allowed') {
              alert('Microphone permission denied. Please allow microphone access in your browser settings.');
            }
          };
          
          recognition.onend = () => {
            console.log('Builder speech recognition ended');
            setIsBuilderListening(false);
          };
          
          builderRecognitionRef.current = recognition;
          setBuilderSpeechRecognitionAvailable(true);
          console.log('Builder speech recognition initialized successfully');
        } catch (error) {
          console.error('Failed to initialize builder speech recognition:', error);
          setBuilderSpeechRecognitionAvailable(false);
        }
      } else {
        console.warn('Speech Recognition API not available in this browser');
        setBuilderSpeechRecognitionAvailable(false);
      }
    }
    
    return () => {
      if (builderRecognitionRef.current) {
        try {
          builderRecognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.team-dropdown-container')) {
        setIsTeamDropdownOpen(false);
      }
    };
    if (isTeamDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isTeamDropdownOpen]);

  // Initialize Agent Builder Chat when an agent is selected
  useEffect(() => {
      if (selectedAgent) {
          // Check if this agent is already configured in the graph data
          const findAgentStatus = (node: NodeData): string | undefined => {
              if (node.name === selectedAgent) return node.status;
              if (node.children) {
                  for (const child of node.children) {
                      const res = findAgentStatus(child);
                      if (res) return res;
                  }
              }
              return undefined;
          };
          
          const currentStatus = findAgentStatus(graphData);
          const alreadyConfigured = currentStatus === 'active';
          setIsConfigured(alreadyConfigured);

          if (!alreadyConfigured) {
              setBuilderStep(0);
              // Reset Blueprint for new config session
              setBlueprint({ greenList: [], redList: [], flowSteps: [] });

              // Extract context from consultant conversation
              const loadAgentContext = async () => {
                try {
                  const context = await extractAgentContext(selectedAgent, consultantHistory);
                  
                  // Store context for use in buildAgent calls
                  setBuilderContext(context);
                  
                  // Set summary as first message
                  setBuilderMessages([{ sender: 'system', text: context.summary }]);
                  
                  // Populate blueprint if available
                  if (context.blueprint) {
                    setBlueprint({
                      greenList: context.blueprint.greenList || [],
                      redList: context.blueprint.redList || [],
                      flowSteps: context.blueprint.flowSteps || []
                    });
                  }
                } catch (error) {
                  console.error("Error loading agent context:", error);
                  // Fallback to default message
                  setBuilderMessages([{ 
                    sender: 'system', 
                    text: `I am the architect for ${selectedAgent}. Based on our conversation, I understand you want to automate this workflow.\n\nAm I missing anything else, or would you like to add any additional details about how this agent should work?` 
                  }]);
                }
              };
              
              loadAgentContext();
          }
      }
  }, [selectedAgent, consultantHistory]);

  // Extract departments from org chart
  const getDepartments = (): string[] => {
    const departments = new Set<string>();
    const traverse = (node: NodeData) => {
      if (node.type === 'human' && node.role && node.role.includes('Manager')) {
        departments.add(node.name);
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    if (graphData.children) {
      graphData.children.forEach(traverse);
    }
    return ['All Teams', ...Array.from(departments).sort()];
  };

  // Filter graph data by selected department and remove "You" root
  const getFilteredGraphData = (): NodeData | null => {
    // If graphData is "You", use its children instead
    const rootData = graphData.name === "You" && graphData.children 
      ? (graphData.children.length === 1 ? graphData.children[0] : {
          name: "Root",
          type: 'human' as const,
          children: graphData.children
        })
      : graphData;
    
    if (!rootData.children || rootData.children.length === 0) {
      return null;
    }
    
    if (selectedDepartment === 'All Teams') {
      // If single top-level item, return it directly
      if (rootData.children.length === 1) {
        return rootData.children[0];
      }
      // Multiple children - create a virtual root
      return {
        name: "All Teams",
        type: 'human' as const,
        children: rootData.children
      };
    }
    
    // Filter by department
    const filtered = rootData.children.find(
      child => child.name === selectedDepartment
    );
    
    return filtered || rootData.children[0] || null;
  };

  // Handle D3 Rendering & Zoom
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    const filteredData = getFilteredGraphData();
    if (!filteredData) {
      // No data to render
      return;
    }
    const root = d3.hierarchy<NodeData>(filteredData);
    const treeLayout = d3.tree<NodeData>().nodeSize([240, 160]);
    treeLayout(root);

    // Zoom Behavior
    const g = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 2])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);

    // Initial positioning (Centered)
    const initialTransform = d3.zoomIdentity.translate(dimensions.width / 2, 80).scale(0.75);
    svg.call(zoom.transform, initialTransform);


    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#E5E7EB")
      .attr("stroke-width", 2)
      .attr("d", d3.linkVertical()
        .x(d => d.x!)
        .y(d => d.y!) as any
      );

    // Nodes
    const nodes = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
          if(d.data.type === 'ai') {
              setSelectedAgent(d.data.name);
          }
      });

    // Helper function to get initials from name
    const getInitials = (name: string): string => {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    // Render Nodes based on Type
    nodes.each(function(d) {
      const node = d3.select(this);
      
      // Calculate dynamic height based on role text length
      const roleText = d.data.role || '';
      const maxTextWidth = (d.data.type === 'ai' ? 200 : 180) - 80; // Card width minus avatar and padding
      const estimatedLines = roleText ? Math.ceil((roleText.length * 6) / maxTextWidth) : 1; // Rough estimate: 6px per char
      const roleHeight = Math.max(1, Math.min(estimatedLines, 3)) * 14; // Max 3 lines, 14px per line
      
      // Unified style for both AI and Human nodes - rounded cards with avatar on left
      const cardWidth = d.data.type === 'ai' ? 200 : 180;
      const baseHeight = d.data.type === 'ai' ? 64 : 56;
      const cardHeight = d.data.type === 'ai' && d.data.role 
        ? Math.max(baseHeight, 48 + roleHeight) // Dynamic height for AI agents with role
        : baseHeight;
      const cardX = -cardWidth / 2;
      const cardY = -cardHeight / 2;
      
      // Card background
      node.append("rect")
        .attr("width", cardWidth)
        .attr("height", cardHeight)
        .attr("x", cardX)
        .attr("y", cardY)
        .attr("rx", 12)
        .attr("fill", "white")
        .attr("stroke", selectedAgent === d.data.name ? "#9333ea" : "#E5E7EB")
        .attr("stroke-width", selectedAgent === d.data.name ? 2 : 1)
        .style("filter", "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08))");
      
      // Avatar circle
      const avatarRadius = 20;
      const avatarX = cardX + 16;
      const avatarY = 0;
      
      // Different styling for AI agents vs human tasks
      if (d.data.type === 'ai') {
        // AI Agent - Use Agento.png image
        node.append("circle")
          .attr("r", avatarRadius)
          .attr("cx", avatarX)
          .attr("cy", avatarY)
          .attr("fill", "#E0E7FF"); // Light background circle
        
        // Agent image - use both xlink:href (for older browsers) and href (for newer)
        const image = node.append("image")
          .attr("href", "/Agento.png")
          .attr("xlink:href", "/Agento.png")
          .attr("x", avatarX - avatarRadius)
          .attr("y", avatarY - avatarRadius)
          .attr("width", avatarRadius * 2)
          .attr("height", avatarRadius * 2);
        
        // Create clip path for circular image (use a stable ID)
        const clipId = `clip-agent-${d.data.name.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
        let defs = svg.select("defs");
        if (defs.empty()) {
          defs = svg.append("defs");
        }
        
        // Only create clip path if it doesn't exist (reuse for same agent names)
        if (defs.select(`#${clipId}`).empty()) {
          defs.append("clipPath")
            .attr("id", clipId)
            .append("circle")
            .attr("cx", avatarRadius) // Center of the image (image is 2*radius wide)
            .attr("cy", avatarRadius) // Center of the image (image is 2*radius tall)
            .attr("r", avatarRadius);
        }
        
        // Apply clip path - coordinates in clip path are relative to the image element
        image.attr("clip-path", `url(#${clipId})`);
      } else {
        // Human task - Pink circle with initials
        node.append("circle")
          .attr("r", avatarRadius)
          .attr("cx", avatarX)
          .attr("cy", avatarY)
          .attr("fill", "#F9A8D4"); // Pink color matching image
        
        // Avatar initials or image
        if (d.data.img) {
          node.append("image")
            .attr("xlink:href", d.data.img)
            .attr("x", avatarX - avatarRadius)
            .attr("y", avatarY - avatarRadius)
            .attr("width", avatarRadius * 2)
            .attr("height", avatarRadius * 2)
            .attr("clip-path", `circle(${avatarRadius}px at ${avatarX}px ${avatarY}px)`);
        } else {
          // Show initials
          const initials = getInitials(d.data.name);
          node.append("text")
            .attr("x", avatarX)
            .attr("y", avatarY)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "11px")
            .style("font-weight", "600")
            .style("fill", "#BE185D") // Dark pink text
            .text(initials);
        }
      }
      
      // Name text (positioned to the right of avatar)
      const textX = avatarX + avatarRadius + 12;
      node.append("text")
        .attr("x", textX)
        .attr("y", d.data.type === 'ai' ? -6 : 0)
        .attr("text-anchor", "start")
        .attr("dy", "0.35em")
        .style("font-family", "Inter, sans-serif")
        .style("font-size", d.data.type === 'ai' ? "14px" : "13px")
        .style("font-weight", "500")
        .style("fill", "#111827")
        .text(d.data.name);
      
      // Role text for AI nodes - with text wrapping
      if (d.data.type === 'ai' && d.data.role) {
        const roleText = d.data.role;
        const maxWidth = cardWidth - textX - 16; // Available width for text
        
        // Split text into words and create lines
        const words = roleText.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          // Rough estimate: 6px per character
          const testWidth = testLine.length * 6;
          
          if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) lines.push(currentLine);
        
        // Limit to 3 lines max
        const displayLines = lines.slice(0, 3);
        
        // Render each line
        displayLines.forEach((line, idx) => {
          node.append("text")
            .attr("x", textX)
            .attr("y", 12 + (idx * 14)) // 14px line height
            .attr("text-anchor", "start")
            .attr("dy", "0.35em")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "11px")
            .style("fill", "#6B7280")
            .text(line);
        });
      }

      // STATUS BADGES for AI nodes
      if (d.data.type === 'ai') {
        const badgeWidth = 90;
        const badgeX = cardX + cardWidth - badgeWidth - 8;
        const badgeY = cardY + 8;
        
        // 1. Needs Attention (Yellow)
        if (d.data.status === 'needs_attention') {
            node.append("rect")
                .attr("x", badgeX) 
                .attr("y", badgeY)
                .attr("width", badgeWidth)
                .attr("height", 18)
                .attr("rx", 9)
                .attr("fill", "#FBBF24")
                .attr("stroke", "white")
                .attr("stroke-width", 1.5);
            
            node.append("text")
                .attr("x", badgeX + badgeWidth / 2)
                .attr("y", badgeY + 9)
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .style("font-family", "Inter, sans-serif")
                .style("font-size", "9px")
                .style("fill", "white")
                .style("font-weight", "600")
                .style("text-transform", "uppercase")
                .style("letter-spacing", "0.5px")
                .text("Needs Attention");
        }
        
        // 2. Active (Green)
        if (d.data.status === 'active') {
             node.append("rect")
                .attr("x", badgeX) 
                .attr("y", badgeY)
                .attr("width", badgeWidth)
                .attr("height", 18)
                .attr("rx", 9)
                .attr("fill", "#10B981")
                .attr("stroke", "white")
                .attr("stroke-width", 1.5);
            
            node.append("text")
                .attr("x", badgeX + badgeWidth / 2)
                .attr("y", badgeY + 9)
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .style("font-family", "Inter, sans-serif")
                .style("font-size", "9px")
                .style("fill", "white")
                .style("font-weight", "600")
                .style("text-transform", "uppercase")
                .style("letter-spacing", "0.5px")
                .text("Active");
        }
      }
    });

  }, [dimensions, selectedAgent, graphData, selectedDepartment]);

  // --- Helpers to Update Graph Data ---
  const addHumanMember = (taskName: string, ownerName: string, dept: string = "Ops & Logistics") => {
      setGraphData(prev => {
          const newData = JSON.parse(JSON.stringify(prev));
          
          const addToDept = (node: any) => {
              if (node.name === dept) {
                  if (!node.children) node.children = [];
                  node.children.push({
                      name: taskName, // Task name as the node label
                      type: 'human',
                      role: `Owned by ${ownerName}`, // Owner as role
                      img: `https://ui-avatars.com/api/?name=${taskName.replace(' ', '+')}&background=random`
                  });
              } else if (node.children) {
                  node.children.forEach(addToDept);
              }
          };
          
          addToDept(newData);
          return newData;
      });
  };

  const convertRoutePlannerToAI = () => {
      setGraphData(prev => {
          const newData = JSON.parse(JSON.stringify(prev));
          const opsNode = newData.children?.find((c: any) => c.name === "Ops & Logistics");
          if (opsNode && opsNode.children) {
              const routeNode = opsNode.children.find((c: any) => c.name === "Route Planner");
              if (routeNode) {
                  routeNode.type = 'ai';
                  routeNode.role = "Optimization Agent";
                  routeNode.status = 'needs_attention';
                  routeNode.img = undefined;
              }
          }
          return newData;
      });
  };

  const updateAgentStatus = (agentName: string, status: 'active' | 'needs_attention') => {
       setGraphData(prev => {
          const newData = JSON.parse(JSON.stringify(prev)); 
          const updateRecursive = (node: any) => {
              if (node.name === agentName) {
                  node.status = status;
              }
              if (node.children) {
                  node.children.forEach(updateRecursive);
              }
          };
          updateRecursive(newData);
          return newData;
      });
  };

  // --- Handlers ---

  const handleTeamChatSend = async (inputOverride?: string) => {
      const textToSend = inputOverride || teamChatInput;
      if(!textToSend.trim()) return;
      
      setTeamChatMessages(prev => [...prev, {sender: 'user', text: textToSend}]);
      setTeamChatInput("");
      setIsChatExpanded(true);
      setIsProcessingRequest(true);
      
      try {
        // Process request with Team Architect LLM
        const result = await processTeamArchitectRequest(
          textToSend,
          graphData,
          teamChatMessages
        );
        
        // Add response to chat
        setTeamChatMessages(prev => [...prev, {sender: 'system', text: result.response}]);
        
        // If changes are proposed, show confirmation UI
        if (result.requiresConfirmation && result.proposedChanges) {
          setPendingChanges({
            changes: result.proposedChanges,
            changeType: result.changeType
          });
        } else {
          // No changes needed, just conversation
          setPendingChanges(null);
        }
      } catch (error) {
        console.error("Error processing team architect request:", error);
        setTeamChatMessages(prev => [...prev, {sender: 'system', text: "I encountered an error. Please try rephrasing your request."}]);
      } finally {
        setIsProcessingRequest(false);
      }
  };

  const handleConfirmChanges = () => {
    if (pendingChanges && pendingChanges.changes) {
      // Ensure name is "You" if it's the root
      const updatedStructure = { ...pendingChanges.changes };
      if (updatedStructure.name !== "You" && !updatedStructure.children) {
        // If it's a new structure without "You", wrap it
        updatedStructure.name = "You";
        updatedStructure.type = "human";
        updatedStructure.role = "Owner";
      } else if (updatedStructure.name !== "You") {
        updatedStructure.name = "You";
      }
      
      setGraphData(updatedStructure);
      if (onOrgChartUpdate) {
        onOrgChartUpdate(updatedStructure);
      }
      
      setTeamChatMessages(prev => [...prev, {sender: 'system', text: "Changes applied successfully! Your organizational structure has been updated."}]);
      setPendingChanges(null);
    }
  };

  const handleRejectChanges = () => {
    setTeamChatMessages(prev => [...prev, {sender: 'system', text: "Understood. I've cancelled those changes. What would you like to do instead?"}]);
    setPendingChanges(null);
  };

  const handleBuilderSend = async (text: string) => {
      setBuilderMessages(prev => [...prev, {sender: 'user', text}]);
      setBuilderInput("");
      setIsBuilderTyping(true);

      // Build conversation history for Gemini
      const conversationHistory = builderMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }]
      }));

      try {
        // Check if user is asking to log into Google
        const textLower = text.toLowerCase();
        if (textLower.includes('log in') || textLower.includes('login') || textLower.includes('sign in') || textLower.includes('authenticate')) {
          setShowGoogleLogin(true);
          setIsBuilderTyping(false);
          setBuilderMessages(prev => [...prev, {sender: 'system', text: 'I\'ve opened the Google login screen for you. Please log in to continue.'}]);
          return;
        }

        // Call Gemini API for agent builder with consultant context
        const result = await buildAgent(selectedAgent || 'Agent', text, conversationHistory, builderContext || undefined);
        
        // Check if response mentions needing Google login
        const responseLower = result.response.toLowerCase();
        if (responseLower.includes('log into google') || responseLower.includes('google login') || responseLower.includes('need you to log') || responseLower.includes('access google')) {
          setShowGoogleLogin(true);
        }
        
        // Check if response mentions Google Reviews
        if (responseLower.includes('google reviews') || responseLower.includes('reviews page')) {
          if (isGoogleLoggedIn) {
            setShowGoogleReviews(true);
          }
        }
        
        // Use Gemini response and strip markdown
        let systemResponse = result.response;
        systemResponse = systemResponse
          .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
          .replace(/\*(.*?)\*/g, '$1')      // Remove *italic*
          .replace(/__(.*?)__/g, '$1')     // Remove __bold__
          .replace(/_(.*?)_/g, '$1')       // Remove _italic_
          .replace(/`(.*?)`/g, '$1')       // Remove `code`
          .replace(/#{1,6}\s/g, '')        // Remove headers
          .trim();
        
        // Update blueprint if provided in response, otherwise keep existing
        if (result.blueprint) {
          setBlueprint({
            greenList: result.blueprint.greenList || [],
            redList: result.blueprint.redList || [],
            flowSteps: result.blueprint.flowSteps || []
          });
        }
        // Otherwise, merge with existing blueprint to preserve context
        else if (builderContext?.blueprint) {
          // Keep existing blueprint but allow it to be refined through conversation
          setBlueprint(prev => ({
            greenList: prev.greenList.length > 0 ? prev.greenList : (builderContext.blueprint?.greenList || []),
            redList: prev.redList.length > 0 ? prev.redList : (builderContext.blueprint?.redList || []),
            flowSteps: prev.flowSteps.length > 0 ? prev.flowSteps : (builderContext.blueprint?.flowSteps || [])
          }));
        }

        // Update UI
        setIsBuilderTyping(false);
        setBuilderMessages(prev => [...prev, {sender: 'system', text: systemResponse}]);
        setBuilderStep(1); // Advance step

        // Final Deployment after a delay
        setTimeout(() => {
          if(selectedAgent) updateAgentStatus(selectedAgent, "active");
          setIsConfigured(true);
        }, 2000);
      } catch (error) {
        console.error("Error calling Gemini:", error);
        setIsBuilderTyping(false);
        setBuilderMessages(prev => [...prev, {sender: 'system', text: "I encountered an error processing your request. Please try again."}]);
      }
  };

  // Triggers the chat input population (doesn't send yet)
  const populateChat = (text: string) => {
      setTeamChatInput(text);
      setIsChatExpanded(true); // Optional: Expand to show intention
  };

  // Visual Helper for Cards
  const renderVisual = (type: 'route' | 'human') => {
      if (type === 'route') {
          return (
             <div className="w-12 h-9 bg-white border border-gray-200 rounded-md shadow-sm flex items-center justify-center relative overflow-hidden group-hover:border-purple-200 transition-colors">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:4px_4px]"></div>
                  <div className="w-8 h-px bg-blue-300 transform rotate-45 absolute"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full z-10"></div>
              </div>
          )
      }
      return (
          <div className="w-12 h-9 bg-purple-50 border border-purple-100 rounded-md shadow-sm flex items-center justify-center relative overflow-hidden group-hover:border-purple-300 transition-colors">
              <div className="absolute bottom-0 w-6 h-4 bg-purple-200 rounded-t-full"></div>
              <div className="absolute top-1.5 w-3 h-3 bg-purple-300 rounded-full"></div>
              <div className="absolute top-1 right-1 text-purple-600">
                  <Plus size={8} strokeWidth={3} />
              </div>
          </div>
      )
  }
  
  // Shortcuts Renderer
  const renderBuilderShortcuts = () => {
      if (builderStep !== 0) return null;

      const shortcuts = [];

      switch(selectedAgent) {
          case 'Store Sentinel':
             shortcuts.push({ label: "Verified Threat Only", prompt: "Adopt Verified Threat posture. Only alert on lingering.", color: "bg-blue-50 text-blue-700" });
             shortcuts.push({ label: "Hyper-Vigilant", prompt: "Adopt Hyper-Vigilant mode. I need to know about everything.", color: "bg-red-50 text-red-700" });
             break;
          case 'Route Planner':
             shortcuts.push({ label: "Efficiency (Cost)", prompt: "Prioritize Efficiency. Cost is the main constraint.", color: "bg-green-50 text-green-700" });
             shortcuts.push({ label: "Speed (Time)", prompt: "Prioritize Speed. We handle premium events.", color: "bg-orange-50 text-orange-700" });
             break;
          case 'Review Responder':
             shortcuts.push({ label: "Customer Retention", prompt: "Focus on Customer Retention. Be empathetic.", color: "bg-pink-50 text-pink-700" });
             shortcuts.push({ label: "Policy Defense", prompt: "Focus on Policy Defense. Be strict.", color: "bg-gray-100 text-gray-700" });
             break;
          case 'Staff Liaison':
             shortcuts.push({ label: "Auto-Approve Swaps", prompt: "Flexible Autonomy. Auto-approve valid swaps.", color: "bg-purple-50 text-purple-700" });
             shortcuts.push({ label: "Require Approval", prompt: "Manager Approval Required for everything.", color: "bg-gray-100 text-gray-700" });
             break;
          case 'Inventory Intel':
             shortcuts.push({ label: "Reduce Waste", prompt: "Aggressive Waste Reduction. Discount early.", color: "bg-green-50 text-green-700" });
             shortcuts.push({ label: "Premium Brand", prompt: "Premium Quality Only. Dispose imperfects.", color: "bg-purple-50 text-purple-700" });
             break;
          case 'Sales Associate':
             shortcuts.push({ label: "High Volume", prompt: "High Volume. Rapid standardized responses.", color: "bg-blue-50 text-blue-700" });
             shortcuts.push({ label: "Consultative", prompt: "High Touch Consultative. Qualify first.", color: "bg-indigo-50 text-indigo-700" });
             break;
          case 'QuickBooks Bot':
             shortcuts.push({ label: "Full Autonomy", prompt: "Full Auto-Categorization. Save me time.", color: "bg-green-50 text-green-700" });
             shortcuts.push({ label: "Review Mode", prompt: "Review Mode. I want to check large items.", color: "bg-yellow-50 text-yellow-700" });
             break;
          default:
             return null;
      }

      return (
          <div className="p-2 flex gap-2 overflow-x-auto">
              {shortcuts.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleBuilderSend(s.prompt)} 
                    className={`whitespace-nowrap px-3 py-1.5 border border-transparent rounded-full text-xs font-medium transition-all hover:border-gray-300 hover:shadow-sm ${s.color}`}
                  >
                      {s.label}
                  </button>
              ))}
          </div>
      );
  }

  return (
    <div className="flex h-full w-full bg-gray-50 text-gray-900 font-sans relative">

      {/* Main Canvas */}
      <div className="flex-1 relative overflow-hidden bg-dot-pattern" ref={wrapperRef}>
         {/* D3 SVG Container */}
         <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block cursor-grab active:cursor-grabbing w-full h-full" />

         {/* Legend / Tip */}
         <div className="absolute top-4 left-4 bg-white/80 backdrop-blur border border-gray-200 rounded-lg p-2 text-xs text-gray-500 shadow-sm pointer-events-none">
             Drag canvas to pan • Click nodes to configure
         </div>

         {/* Team Dropdown - Top Right */}
         <div className="absolute top-4 right-4 z-30 team-dropdown-container">
           <div className="relative">
             <button
               onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
             >
               <span className="text-sm font-medium text-gray-700">Team</span>
               <ChevronDown size={16} className={`text-gray-500 transition-transform ${isTeamDropdownOpen ? 'rotate-180' : ''}`} />
             </button>
             
             {isTeamDropdownOpen && (
               <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-40">
                 {getDepartments().map((dept) => (
                   <button
                     key={dept}
                     onClick={() => {
                       setSelectedDepartment(dept);
                       setIsTeamDropdownOpen(false);
                     }}
                     className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                       selectedDepartment === dept ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700'
                     } ${dept === 'All Teams' ? 'border-b border-gray-100' : ''}`}
                   >
                     {dept}
                   </button>
                 ))}
               </div>
             )}
           </div>
         </div>

         {/* REDESIGNED Team Architect Chat (Sticky Bottom Bar + Overlay History) */}
         <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 z-20 pointer-events-none">
           <div className="max-w-2xl mx-auto w-full relative pointer-events-auto">
              
              {/* EXPANDABLE CHAT HISTORY */}
              <div className={`absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-t-2xl shadow-xl overflow-hidden transition-all duration-300 ease-in-out origin-bottom ${isChatExpanded ? 'h-[300px] opacity-100 mb-[-1px] border-b-0' : 'h-0 opacity-0'}`}>
                   {/* Close Handle */}
                   <div 
                     onClick={() => setIsChatExpanded(false)}
                     className="w-full bg-gray-50 h-6 flex items-center justify-center cursor-pointer hover:bg-gray-100 border-b border-gray-100"
                   >
                       <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
                   </div>

                   <div className="p-4 h-[calc(100%-24px)] overflow-y-auto space-y-4">
                       {teamChatMessages.map((msg, idx) => (
                           <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'system' && (
                                    <div className="flex flex-col items-center shrink-0 mt-1">
                                       <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white border border-gray-200">
                                          <img src="/Lumi.png" alt="Lumi" className="w-full h-full object-cover" />
                                       </div>
                                       <span className="text-[10px] text-gray-500 mt-1 font-medium">Lumi</span>
                                    </div>
                                )}
                                <div className={`max-w-[80%] p-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                                    msg.sender === 'user' 
                                    ? 'bg-gray-100 text-gray-900 rounded-tr-sm' 
                                    : 'bg-white border border-gray-100 text-gray-800'
                                }`}>
                                    {msg.text}
                                </div>
                           </div>
                       ))}
                       <div ref={chatEndRef} />
                   </div>
              </div>

              {/* Contextual Shortcut Cards (Hide when expanded or chatting) */}
              {teamChatMessages.length < 3 && chatState === 'idle' && !isChatExpanded && (
                <div className="absolute bottom-full mb-4 left-0 right-0 flex justify-center">
                    <div className="w-full grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => populateChat("I want to convert the Route Planner role to an AI agent to save time on logistics.")}
                            className="group relative bg-white border border-gray-200 rounded-xl p-3 text-left shadow-sm hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all flex items-center justify-between overflow-hidden"
                        >
                            <div className="pr-3">
                                <h3 className="font-semibold text-gray-900 text-xs mb-0.5">Automate Logistics</h3>
                                <p className="text-[10px] text-gray-500 leading-tight">Convert Route Planner to AI.</p>
                            </div>
                            <div className="shrink-0">
                                {renderVisual('route')}
                            </div>
                        </button>
                        
                        <button 
                            onClick={() => populateChat("I need to assign a new manual task to the team.")}
                            className="group relative bg-white border border-gray-200 rounded-xl p-3 text-left shadow-sm hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all flex items-center justify-between overflow-hidden"
                        >
                            <div className="pr-3">
                                <h3 className="font-semibold text-gray-900 text-xs mb-0.5">Assign Manual Task</h3>
                                <p className="text-[10px] text-gray-500 leading-tight">Define a human responsibility.</p>
                            </div>
                            <div className="shrink-0">
                                {renderVisual('human')}
                            </div>
                        </button>
                    </div>
                </div>
              )}
              
               {/* Pending Changes Confirmation */}
               {pendingChanges && (
                  <div className="absolute bottom-[80px] left-0 right-0 z-30 mb-2">
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <AlertTriangle size={16} className="text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-purple-900 text-sm mb-1">Confirm Changes</h4>
                          <p className="text-xs text-purple-700 mb-3">
                            {pendingChanges.changeType === 'restructure' 
                              ? 'This will restructure your entire organizational chart. Please review and confirm.'
                              : pendingChanges.changeType === 'add_team'
                              ? 'A new team will be added to your organizational structure.'
                              : pendingChanges.changeType === 'add_agent'
                              ? 'A new AI agent will be added to your team.'
                              : 'Changes will be applied to your organizational structure.'}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={handleConfirmChanges}
                              className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
                            >
                              Confirm & Apply
                            </button>
                            <button
                              onClick={handleRejectChanges}
                              className="px-4 py-1.5 bg-white border border-purple-200 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              )}

              {/* Main Input Box (Matches Screen 1) */}
              <div 
                className={`bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition-all focus-within:ring-2 focus-within:ring-purple-100 focus-within:border-purple-300 overflow-hidden relative z-30 ${isChatExpanded ? 'rounded-b-2xl rounded-t-none border-t-0' : 'rounded-2xl'}`}
                onClick={() => setIsChatExpanded(true)}
              >
                 <textarea
                    value={teamChatInput}
                    onChange={(e) => setTeamChatInput(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleTeamChatSend();
                       }
                    }}
                    placeholder={chatState === 'human_pending' ? "Task Name and Owner?" : "Message Team Architect..."}
                    className="w-full bg-transparent border-none text-gray-900 text-[15px] p-4 min-h-[60px] max-h-[100px] resize-none focus:ring-0 outline-none placeholder-gray-400"
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
                         <button className="p-2 rounded-full bg-black text-white hover:bg-gray-800 transition-all flex items-center justify-center" title="Voice">
                            <Mic size={18} />
                         </button>
                        <button 
                        onClick={() => handleTeamChatSend()}
                        disabled={!teamChatInput.trim() || isProcessingRequest}
                        className={`p-2 rounded-lg transition-all ${
                            teamChatInput.trim() && !isProcessingRequest
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

         {/* NEW: Agent Configuration Slide-Over (Wide 2-Column Layout) */}
         {selectedAgent && (
             <div className="fixed inset-y-0 right-0 w-full max-w-[1000px] bg-white shadow-2xl border-l border-gray-200 z-[100] flex flex-col animate-in slide-in-from-right duration-300">
                 
                 {/* Header */}
                 <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                             {selectedAgent} 
                             {!isConfigured && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full uppercase tracking-wide">Drafting...</span>}
                             {isConfigured && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full uppercase tracking-wide">Active</span>}
                        </h2>
                    </div>
                    <button onClick={() => setSelectedAgent(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
                 </div>
                 
                 <div className="flex-1 flex min-h-0">
                     {/* LEFT COLUMN: Builder Chat */}
                     <div className="w-[35%] flex flex-col border-r border-gray-100 bg-gray-50">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Bot size={14} /> Agent Builder
                            </h3>
                        </div>

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
                                     <div className={`p-3 text-sm rounded-2xl max-w-[90%] shadow-sm whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-white text-gray-900 border border-gray-200' : 'bg-purple-600 text-white'}`}>
                                         {msg.text}
                                     </div>
                                 </div>
                             ))}
                             {isBuilderTyping && (
                                 <div className="flex justify-start">
                                     <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0 overflow-hidden bg-white border border-gray-200">
                                         <img src="/Lumi.png" alt="Lumi" className="w-full h-full object-cover" />
                                     </div>
                                     <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-sm w-12 flex items-center justify-center">
                                         <div className="flex space-x-1">
                                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                                         </div>
                                     </div>
                                 </div>
                             )}
                        </div>

                        {/* Builder Shortcuts (Dynamic) */}
                        {renderBuilderShortcuts()}

                        <div className="p-4 bg-white border-t border-gray-200">
                             <div className="relative flex items-center gap-2">
                                 <input 
                                    className="flex-1 bg-gray-100 rounded-xl pl-4 pr-20 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                                    placeholder="Instruct builder..."
                                    value={builderInput}
                                    onChange={(e) => setBuilderInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleBuilderSend(builderInput)}
                                 />
                                 
                                 {/* Voice Input Button */}
                                 <button
                                   onClick={() => {
                                     if (!builderSpeechRecognitionAvailable) {
                                       alert('Speech recognition is not available in this browser. Please use Chrome, Edge, or another browser that supports the Web Speech API.');
                                       return;
                                     }
                                     
                                     if (!isBuilderListening && builderRecognitionRef.current) {
                                       try {
                                         console.log('Starting builder speech recognition...');
                                         builderRecognitionRef.current.start();
                                       } catch (error: any) {
                                         console.error('Failed to start builder speech recognition:', error);
                                         setIsBuilderListening(false);
                                         if (error.message?.includes('already started')) {
                                           setIsBuilderListening(true);
                                         } else {
                                           alert('Failed to start voice recording. Please check your microphone permissions.');
                                         }
                                       }
                                     } else if (isBuilderListening && builderRecognitionRef.current) {
                                       console.log('Stopping builder speech recognition...');
                                       builderRecognitionRef.current.stop();
                                       setIsBuilderListening(false);
                                     } else if (!builderRecognitionRef.current) {
                                       alert('Speech recognition not initialized. Please refresh the page.');
                                     }
                                   }}
                                   disabled={!builderSpeechRecognitionAvailable}
                                   className={`p-2 rounded-full transition-all flex items-center justify-center ${
                                     !builderSpeechRecognitionAvailable
                                       ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                       : isBuilderListening 
                                       ? 'bg-red-600 text-white animate-pulse' 
                                       : 'bg-black text-white hover:bg-gray-800'
                                   }`}
                                   title={
                                     !builderSpeechRecognitionAvailable 
                                       ? "Speech recognition not available" 
                                       : isBuilderListening 
                                       ? "Stop Recording" 
                                       : "Start Voice Input"
                                   }
                                 >
                                     <Mic size={16} />
                                 </button>
                                 
                                 <button 
                                   onClick={() => handleBuilderSend(builderInput)} 
                                   disabled={!builderInput.trim()}
                                   className={`p-2 rounded-lg transition-all ${
                                     builderInput.trim()
                                       ? 'bg-gray-900 text-white hover:bg-black shadow-md' 
                                       : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                   }`}
                                 >
                                     <ArrowRight size={14} />
                                 </button>
                             </div>
                        </div>
                     </div>

                     {/* RIGHT COLUMN: The Blueprint */}
                     <div className="flex-1 bg-white flex flex-col min-h-0 overflow-y-auto">
                         
                         {/* TOP SECTION: The Mandate (Green vs Red) */}
                         <div className="p-8 pb-0">
                             <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                                 <Shield size={16} className="text-gray-400"/>
                                 Operational Mandate
                             </h3>
                             
                             <div className="grid grid-cols-2 gap-8">
                                 {/* Affirmative (Green) */}
                                 <div className="space-y-4">
                                     <div className="flex items-center gap-2 text-green-700 text-xs font-bold uppercase tracking-wider">
                                         <CheckCircle size={14} /> Affirmative Actions
                                     </div>
                                     <div className="bg-green-50 rounded-xl border border-green-100 p-6 shadow-sm min-h-[240px] relative overflow-hidden transition-all">
                                         {blueprint.greenList.length === 0 ? (
                                             <div className="space-y-6 opacity-60">
                                                  <div className="text-center pb-2">
                                                      <span className="text-xs font-semibold text-green-800/60 bg-white/50 px-2 py-1 rounded">Drafting...</span>
                                                  </div>
                                                  <div className="space-y-3 px-2">
                                                      <div className="h-2 bg-green-200/50 rounded-full w-3/4 animate-pulse"></div>
                                                      <div className="h-2 bg-green-200/50 rounded-full w-1/2 animate-pulse"></div>
                                                      <div className="h-2 bg-green-200/50 rounded-full w-5/6 animate-pulse"></div>
                                                      <div className="h-2 bg-green-200/50 rounded-full w-2/3 animate-pulse"></div>
                                                  </div>
                                                  <div className="absolute bottom-4 left-0 right-0 text-center">
                                                      <p className="text-[10px] text-green-800/40 font-medium">Chat with builder to define affirmative actions...</p>
                                                  </div>
                                             </div>
                                         ) : (
                                             <ul className="space-y-2">
                                                 {blueprint.greenList.map((item, i) => (
                                                     <li key={i} className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                                                         <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-600 shrink-0"></div>
                                                         <span className="text-sm text-gray-800 leading-relaxed font-medium">{item}</span>
                                                     </li>
                                                 ))}
                                             </ul>
                                         )}
                                     </div>
                                 </div>

                                 {/* Negative (Red) */}
                                 <div className="space-y-4">
                                     <div className="flex items-center gap-2 text-red-700 text-xs font-bold uppercase tracking-wider">
                                         <ShieldAlert size={14} /> Hard Limits
                                     </div>
                                     <div className="bg-red-50 rounded-xl border border-red-100 p-6 shadow-sm min-h-[240px] relative overflow-hidden transition-all">
                                          {blueprint.redList.length === 0 ? (
                                             <div className="space-y-6 opacity-60">
                                                  <div className="text-center pb-2">
                                                      <span className="text-xs font-semibold text-red-800/60 bg-white/50 px-2 py-1 rounded">Drafting...</span>
                                                  </div>
                                                  <div className="space-y-3 px-2">
                                                      <div className="h-2 bg-red-200/50 rounded-full w-2/3 animate-pulse"></div>
                                                      <div className="h-2 bg-red-200/50 rounded-full w-4/5 animate-pulse"></div>
                                                      <div className="h-2 bg-red-200/50 rounded-full w-1/2 animate-pulse"></div>
                                                  </div>
                                                  <div className="absolute bottom-4 left-0 right-0 text-center">
                                                      <p className="text-[10px] text-red-800/40 font-medium">Chat with builder to set safety constraints...</p>
                                                  </div>
                                             </div>
                                         ) : (
                                             <ul className="space-y-2">
                                                 {blueprint.redList.map((item, i) => (
                                                     <li key={i} className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                                                         <X size={14} className="text-red-500 mt-0.5 shrink-0" />
                                                         <span className="text-sm text-gray-800 leading-relaxed font-medium">{item}</span>
                                                     </li>
                                                 ))}
                                             </ul>
                                         )}
                                     </div>
                                 </div>
                             </div>
                         </div>

                         {/* MIDDLE SECTION: Logic Flow */}
                         <div className="p-8">
                             <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                                 <Zap size={16} className="text-gray-400"/>
                                 Logic Flow
                             </h3>
                             
                             <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 overflow-hidden relative min-h-[160px]">
                                 {blueprint.flowSteps.length === 0 ? (
                                      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none grayscale select-none">
                                           {/* Ghost Diagram - Watermark Style */}
                                           <div className="flex items-center gap-4">
                                              <div className="px-5 py-3 border-2 border-gray-400 border-dashed rounded-lg text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-gray-500">
                                                  <Zap size={16} /> Trigger
                                              </div>
                                              <ArrowRight size={24} className="text-gray-400"/>
                                              <div className="px-8 py-3 border-2 border-gray-400 border-dashed rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-gray-500">
                                                  <GitBranch size={16} /> Decision
                                              </div>
                                              <ArrowRight size={24} className="text-gray-400"/>
                                              <div className="px-5 py-3 border-2 border-gray-400 border-dashed rounded-lg text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-gray-500">
                                                  <Play size={16} /> Action
                                              </div>
                                           </div>
                                      </div>
                                 ) : (
                                     <div className="relative w-full min-h-[200px] overflow-x-auto overflow-y-auto" style={{ maxHeight: '400px' }}>
                                         {/* Candyland-style path container - centered with proper padding */}
                                         <div className="relative mx-auto" style={{ 
                                             minWidth: '600px', 
                                             minHeight: '300px',
                                             padding: '20px',
                                             width: 'fit-content'
                                         }}>
                                             {blueprint.flowSteps.map((step, i) => {
                                                 // Calculate position in zigzag pattern (Candyland style)
                                                 // Pattern: right (0-2), down, left (3-5), down, right (6-8), down, left...
                                                 const stepsPerRow = 3;
                                                 const row = Math.floor(i / stepsPerRow);
                                                 const col = i % stepsPerRow;
                                                 const isEvenRow = row % 2 === 0;
                                                 
                                                 // Calculate actual column (reverse for odd rows to create zigzag)
                                                 const actualCol = isEvenRow ? col : (stepsPerRow - 1 - col);
                                                 
                                                 // Spacing
                                                 const stepWidth = 140;
                                                 const stepHeight = 70;
                                                 const horizontalSpacing = stepWidth + 30;
                                                 const verticalSpacing = stepHeight + 30;
                                                 
                                                 const x = actualCol * horizontalSpacing;
                                                 const y = row * verticalSpacing;
                                                 
                                                 // Calculate previous step position for connector
                                                 const prevRow = i > 0 ? Math.floor((i - 1) / stepsPerRow) : -1;
                                                 const prevCol = i > 0 ? (i - 1) % stepsPerRow : -1;
                                                 const prevIsEvenRow = prevRow % 2 === 0;
                                                 const prevActualCol = prevIsEvenRow ? prevCol : (stepsPerRow - 1 - prevCol);
                                                 const prevX = prevActualCol * horizontalSpacing;
                                                 const prevY = prevRow * verticalSpacing;
                                                 
                                                 return (
                                                     <React.Fragment key={i}>
                                                         {/* Connector line */}
                                                         {i > 0 && (
                                                             <>
                                                                 {/* Horizontal connector */}
                                                                 {row === prevRow && (
                                                                     <div 
                                                                         className="absolute border-2 border-purple-300 bg-purple-200"
                                                                         style={{
                                                                             left: `${prevX + stepWidth}px`,
                                                                             top: `${prevY + stepHeight / 2 - 1}px`,
                                                                             width: `${x - prevX - stepWidth}px`,
                                                                             height: '2px',
                                                                             zIndex: 0
                                                                         }}
                                                                     />
                                                                 )}
                                                                 {/* Vertical connector (down) */}
                                                                 {row !== prevRow && (
                                                                     <div 
                                                                         className="absolute border-2 border-purple-300 bg-purple-200"
                                                                         style={{
                                                                             left: `${prevX + stepWidth / 2 - 1}px`,
                                                                             top: `${prevY + stepHeight}px`,
                                                                             width: '2px',
                                                                             height: `${y - prevY - stepHeight}px`,
                                                                             zIndex: 0
                                                                         }}
                                                                     />
                                                                 )}
                                                             </>
                                                         )}
                                                         
                                                         {/* Step Node */}
                                                         <div 
                                                             className={`absolute px-4 py-2.5 rounded-xl border shadow-sm font-medium text-xs flex flex-col items-center gap-1 justify-center animate-in zoom-in-95 duration-300 z-10
                                                                 ${step.type === 'trigger' ? 'bg-white border-blue-200 text-blue-800' : 
                                                                   step.type === 'decision' ? 'bg-white border-yellow-200 text-yellow-800 rounded-full px-6' :
                                                                   step.type === 'end' ? 'bg-gray-900 border-gray-900 text-white' :
                                                                   'bg-white border-gray-200 text-gray-800'}
                                                             `}
                                                             style={{
                                                                 left: `${x}px`,
                                                                 top: `${y}px`,
                                                                 width: `${stepWidth}px`,
                                                                 minHeight: `${stepHeight}px`
                                                             }}
                                                         >
                                                             {step.type === 'trigger' && <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Trigger</span>}
                                                             {step.type === 'decision' && <span className="text-[9px] uppercase font-bold text-yellow-500 tracking-wider">Check</span>}
                                                             {step.type === 'end' && <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">End</span>}
                                                             <span className="text-center text-[11px] leading-tight px-1">{step.label}</span>
                                                         </div>
                                                     </React.Fragment>
                                                 );
                                             })}
                                         </div>
                                     </div>
                                 )}
                                 
                                 {blueprint.flowSteps.length === 0 && (
                                     <div className="relative z-10 text-center">
                                         <p className="text-sm text-gray-400 italic font-medium">Logic flow will generate automatically...</p>
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
         )}
         
         <style>{`
           .bg-dot-pattern {
             background-image: radial-gradient(#E5E7EB 1px, transparent 1px);
             background-size: 24px 24px;
           }
         `}</style>
      </div>
      
      {/* Fake Google Login Modal */}
      {showGoogleLogin && (
        <FakeGoogleLogin
          onClose={() => setShowGoogleLogin(false)}
          onLogin={() => {
            setIsGoogleLoggedIn(true);
            setBuilderMessages(prev => [...prev, {
              sender: 'system',
              text: 'Great! You\'re now logged into Google. I can now access your Google Reviews. Would you like me to show you the reviews page?'
            }]);
          }}
        />
      )}
      
      {/* Fake Google Reviews Modal */}
      {showGoogleReviews && (
        <FakeGoogleReviews
          onClose={() => setShowGoogleReviews(false)}
          businessName={selectedAgent ? `${selectedAgent} - Reviews` : "Business Reviews"}
        />
      )}
    </div>
  );
};

const ArrowUpIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
    </svg>
)

export default Screen2OrgChart;
