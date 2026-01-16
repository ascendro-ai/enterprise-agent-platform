import { GoogleGenAI } from "@google/genai";

// Initialize the API client safely
const getClient = () => {
  // Try both process.env (from vite.config define) and import.meta.env
  const apiKey = (process.env as any).GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found in environment variables. Mocking responses.");
    console.warn("process.env.GEMINI_API_KEY:", (process.env as any).GEMINI_API_KEY);
    console.warn("import.meta.env.VITE_GEMINI_API_KEY:", (import.meta as any).env?.VITE_GEMINI_API_KEY);
    return null;
  }
  console.log("Using Gemini API key (first 10 chars):", apiKey.substring(0, 10) + "...");
  return new GoogleGenAI({ apiKey });
};

// Consultant conversation - workflow discovery and mapping
export const consultWorkflow = async (
  userInput: string,
  conversationHistory: Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }> = []
): Promise<string> => {
  const client = getClient();
  if (!client) {
    // Mock response if no API key
    return `I understand you want to automate: "${userInput}". Let me help you map out this workflow. What specific tasks are you looking to automate?`;
  }

  try {
    // Build conversation context
    const contents = [
      ...conversationHistory,
      {
        role: 'user' as const,
        parts: [{ text: userInput }]
      }
    ];

    // Build a simple prompt string from the conversation
    let prompt = '';
    if (conversationHistory.length === 0) {
      // First message - focus on workflow discovery
      prompt = `You are a friendly workflow consultant helping someone automate their business tasks using an AI agent platform.

PLATFORM CONTEXT - You should know about these features:
- "Your Team" tab: This is where users can see all their digital workers (AI agents) that have been created. It shows the organizational structure with departments and agents.
- "Control Room" tab: This is a dashboard where users can track progress and updates from all their active agents. It shows what agents are working on, what needs review, and what's been completed.

Your goal is to understand the WORKFLOW - what needs to happen, in what order, and what the organizational structure should look like.

Focus on:
- What kind of business/work they do
- What tasks or processes they want to automate
- What steps are involved in those workflows
- What departments/roles would handle different parts
- What high-level AI agents would be needed (e.g., "Review Responder", "Inventory Manager", not detailed sub-agents)

IMPORTANT - DO NOT ask about:
- Agent granularity or architecture details (e.g., "do you want one agent or multiple agents?", "should we have a triage agent?", "routing agent", etc.)
- Specific preferences or fine-tuning details (those come later in agent setup)
- Exact parameters or configurations
- Minor details that can be adjusted later
- Technical implementation details about how agents are structured

CRITICAL - When to STOP asking questions and START building:
Once you understand:
- What the business does
- What workflow they want to automate
- The basic steps involved
- Where they want to see results (Control Room, etc.)
- Any key preferences (assisted vs autonomous, etc.)

STOP asking questions and say something like: "Perfect! I have everything I need. Let me build your digital worker team structure now. Head over to the 'Your Team' tab to see your new organizational chart!"

Keep it high-level. Focus on understanding WHAT needs to be done, not HOW it should be technically structured. The user doesn't need to understand agent architecture - just describe the workflow and we'll figure out the agent structure.

Ask questions naturally, one or two at a time. Be conversational and friendly. But remember: once you have the core workflow information, STOP and transition to building.

The user just said: "${userInput}"

Respond naturally and ask a follow-up question to understand their workflow better.`;
    } else {
      // Build conversation history
      const historyText = conversationHistory.map(c => {
        const text = c.parts.map(p => p.text).join(' ');
        return c.role === 'user' ? `User: ${text}` : `Assistant: ${text}`;
      }).join('\n\n');
      prompt = `${historyText}

User: ${userInput}

Assistant: (Continue gathering workflow information. Focus on understanding the process steps, departments, and what high-level agents are needed. DO NOT ask about agent granularity, architecture, or technical implementation details. Don't get into fine-tuning details - just understand the workflow structure. 

Remember: "Your Team" is where they'll see all their digital workers, and "Control Room" is the dashboard for tracking progress. You can naturally reference these when appropriate.

CRITICAL: If you already have enough information to build the workflow (you know: what they do, what they want to automate, basic steps, where results appear, key preferences), then STOP asking questions and say something like: "Perfect! I have everything I need. Let me build your digital worker team structure now. Head over to the 'Your Team' tab to see your new organizational chart!"

Otherwise, ask 1-2 questions at a time. Be friendly and conversational.)`;
    }

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    return response.text || "I couldn't generate a response right now.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    console.error("Error details:", error?.message, error?.response);
    return `Error connecting to AI consultant: ${error?.message || 'Unknown error'}. Please check the console for details.`;
  }
};

// Agent Builder conversation - configuring individual agents
export const buildAgent = async (
  agentName: string,
  userInput: string,
  conversationHistory: Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }> = []
): Promise<{ response: string; blueprint?: { greenList: string[]; redList: string[]; flowSteps: Array<{ label: string; type: 'trigger' | 'action' | 'decision' | 'end' }> } }> => {
  const client = getClient();
  if (!client) {
    // Mock response if no API key
    return {
      response: `I'm configuring ${agentName}. Based on "${userInput}", I'll set up the operational mandate.`,
      blueprint: {
        greenList: ["Standard operation"],
        redList: ["Do not violate safety"],
        flowSteps: [{ label: "Trigger", type: 'trigger' }, { label: "Process", type: 'action' }, { label: "Finish", type: 'end' }]
      }
    };
  }

  try {
    // Build conversation context for agent builder
    const contents = [
      ...conversationHistory,
      {
        role: 'user' as const,
        parts: [{ text: userInput }]
      }
    ];

    // If this is the first message, add system context for agent builder
    if (conversationHistory.length === 0) {
      contents.unshift({
        role: 'user' as const,
        parts: [{ text: `You are the architect for an AI agent named "${agentName}". You need to map the end-to-end process before deployment. Ask clarifying questions to understand:
1. What should this agent do? (affirmative actions - green list)
2. What should this agent NOT do? (hard limits - red list)
3. What is the workflow logic? (trigger -> actions -> decisions -> end)

Be thorough and ask specific questions. The user just said: ${userInput}` }]
      });
    }

    // Build a simple prompt string from the conversation
    let prompt = '';
    if (conversationHistory.length === 0) {
      prompt = `You are the architect for an AI agent named "${agentName}". You need to map the end-to-end process before deployment. Ask clarifying questions to understand:
1. What should this agent do? (affirmative actions - green list)
2. What should this agent NOT do? (hard limits - red list)
3. What is the workflow logic? (trigger -> actions -> decisions -> end)

Be thorough and ask specific questions. The user just said: ${userInput}`;
    } else {
      // Build conversation history
      const historyText = conversationHistory.map(c => {
        const text = c.parts.map(p => p.text).join(' ');
        return c.role === 'user' ? `User: ${text}` : `Assistant: ${text}`;
      }).join('\n\n');
      prompt = `${historyText}\n\nUser: ${userInput}\n\nAssistant:`;
    }

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    const responseText = response.text || "I couldn't generate a response right now.";

    // Try to extract blueprint information from response (basic parsing)
    // For now, return just the response - we can enhance this later with structured output
    return {
      response: responseText
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    console.error("Error details:", error?.message, error?.response);
    return {
      response: `Error connecting to AI agent builder: ${error?.message || 'Unknown error'}. Please check the console for details.`
    };
  }
};

// Generate organizational structure from consultant conversation
export const generateOrgStructure = async (
  workflowDescription: string
): Promise<any> => {
  const client = getClient();
  if (!client) {
    return null;
  }

  try {
    const prompt = `Based on this workflow description, generate a JSON structure for an organizational chart with departments and AI agents:

"${workflowDescription}"

Return a JSON object with this structure:
{
  "name": "You",
  "type": "human",
  "role": "Owner",
  "children": [
    {
      "name": "Department Name",
      "type": "human",
      "role": "Manager",
      "children": [
        {
          "name": "Agent Name",
          "type": "ai",
          "role": "Agent Role",
          "status": "needs_attention"
        }
      ]
    }
  ]
}

Only return valid JSON, no other text.`;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    const jsonText = response.text || '{}';
    // Try to extract JSON from response (might have markdown code blocks)
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    console.error("Error details:", error?.message, error?.response);
    return null;
  }
};

// Extract agent context from consultant conversation
export const extractAgentContext = async (
  agentName: string,
  consultantHistory: Array<{ sender: string; text: string }>
): Promise<{ summary: string; blueprint?: { greenList: string[]; redList: string[]; flowSteps: Array<{ label: string; type: 'trigger' | 'action' | 'decision' | 'end' }> } }> => {
  const client = getClient();
  if (!client) {
    return {
      summary: `I am the architect for ${agentName}. Based on our conversation, I understand you want to automate this workflow. Let me ask some clarifying questions to configure this agent properly.`
    };
  }

  try {
    const conversationText = consultantHistory
      .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n\n');

    const prompt = `Based on this consultant conversation, extract context specifically for the agent named "${agentName}".

Conversation:
${conversationText}

For this agent, provide:
1. A summary of what this agent should do based on the conversation (2-3 sentences)
2. Any affirmative actions (green list items) mentioned
3. Any hard limits or constraints (red list items) mentioned
4. Any workflow logic or flow steps mentioned

Return a JSON object with this structure:
{
  "summary": "Brief summary of what this agent should do...",
  "greenList": ["action 1", "action 2"],
  "redList": ["constraint 1", "constraint 2"],
  "flowSteps": [
    {"label": "Trigger", "type": "trigger"},
    {"label": "Action step", "type": "action"},
    {"label": "End", "type": "end"}
  ]
}

Only return valid JSON, no other text. If no specific information is found, return empty arrays.`;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    const jsonText = response.text || '{}';
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || `I am the architect for ${agentName}. Based on our conversation, I understand you want to automate this workflow. Let me ask some clarifying questions to configure this agent properly.`,
        blueprint: {
          greenList: parsed.greenList || [],
          redList: parsed.redList || [],
          flowSteps: parsed.flowSteps || []
        }
      };
    }
    
    return {
      summary: `I am the architect for ${agentName}. Based on our conversation, I understand you want to automate this workflow. Let me ask some clarifying questions to configure this agent properly.`
    };
  } catch (error: any) {
    console.error("Error extracting agent context:", error);
    return {
      summary: `I am the architect for ${agentName}. Based on our conversation, I understand you want to automate this workflow. Let me ask some clarifying questions to configure this agent properly.`
    };
  }
};

// Legacy function for backward compatibility
export const generateWorkflowSuggestions = async (userInput: string): Promise<string> => {
  return consultWorkflow(userInput);
};
