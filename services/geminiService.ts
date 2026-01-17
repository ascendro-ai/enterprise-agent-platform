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
  conversationHistory: Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }> = [],
  questionCount: number = 0
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

Your goal is to quickly understand the WORKFLOW at a high level - what needs to happen, in what order, and what the organizational structure should look like.

CRITICAL - QUESTION LIMIT: You have asked ${questionCount} questions so far. You have a MAXIMUM of 3-5 questions total to scope this workflow. After that, you should summarize and ask if they're ready to build, even if you don't have every detail.

Focus on ONLY these essential questions (prioritize the most important):
1. What kind of business/work they do
2. What main tasks or processes they want to automate
3. Which tasks should be AUTOMATED vs which should remain HUMAN TASKS
4. What departments/roles would handle different parts (if relevant)

IMPORTANT - DO NOT ask about:
- Agent granularity, architecture, or technical details (those come in agent setup)
- Specific preferences, fine-tuning, or configurations (agent setup handles this)
- Exact parameters, thresholds, or minor details (agent setup handles this)
- How agents should work internally (agent setup handles this)

IMPORTANT - Org structure builds automatically:
- The organizational structure is being built automatically in the background as we chat
- You don't need to ask for permission or wait for the user to say "build" or "proceed"
- The user can check the "Your Team" tab at any time to see the structure being created
- Just focus on understanding their workflow through conversation

Keep it HIGH-LEVEL and FAST. Focus on understanding WHAT needs to be done, not HOW. All granular details will be handled in the agent setup phase when they configure each agent individually.

Be concise. Ask 1-2 questions at a time. After 3-5 questions total, summarize what you understand. The org structure updates automatically as we chat.

The user just said: "${userInput}"

${questionCount >= 3 ? 'You\'ve asked enough questions. Summarize what you understand. The organizational structure is being built automatically in the background - they can check the "Your Team" tab to see it. Mention that all detailed configuration will happen in the agent setup phase.' : 'Respond naturally and ask a follow-up question to understand their workflow better. Keep it high-level and concise. The org structure updates automatically as we chat.'}`;
    } else {
      // Build conversation history
      const historyText = conversationHistory.map(c => {
        const text = c.parts.map(p => p.text).join(' ');
        return c.role === 'user' ? `User: ${text}` : `Assistant: ${text}`;
      }).join('\n\n');
      prompt = `${historyText}

User: ${userInput}

Assistant: (Continue gathering workflow information, but be CONCISE. You have asked ${questionCount} questions so far. You have a MAXIMUM of 3-5 questions total.

Focus on ONLY essential high-level questions:
- Which tasks should be automated with AI agents vs which should remain as human tasks
- What parts of the workflow need automation and what parts should stay manual
- The full organizational structure including both automated and human roles

DO NOT ask about:
- Agent granularity, architecture, or technical details (agent setup handles this)
- Specific preferences, fine-tuning, or configurations (agent setup handles this)
- Exact parameters or minor details (agent setup handles this)

Remember: "Your Team" is where they'll see all their digital workers AND human tasks in the organizational chart, and "Control Room" is the dashboard for tracking progress. You can naturally reference these when appropriate.

${questionCount >= 3 ? 'You\'ve asked enough questions. Summarize what you understand. The organizational structure is being built automatically in the background - they can check the "Your Team" tab to see it. Mention that all detailed configuration will happen in the agent setup phase.' : 'Ask 1-2 concise questions at a time. Be friendly but move quickly. After 3-5 questions total, you should summarize what you understand. The org structure updates automatically as we chat.'}

Remember: The organizational structure is being built automatically in the background. The user can navigate to "Your Team" tab anytime to see it.)`;
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
// NOTE: This is a SEPARATE LLM from the Team Architect. This LLM focuses on configuring
// individual agent behavior, technical implementation, and operational blueprints.
// The Team Architect (processTeamArchitectRequest) handles org structure modifications.
export const buildAgent = async (
  agentName: string,
  userInput: string,
  conversationHistory: Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }> = [],
  consultantContext?: { summary?: string; blueprint?: { greenList: string[]; redList: string[]; flowSteps: Array<{ label: string; type: 'trigger' | 'action' | 'decision' | 'end' }> } }
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
    // NOTE: This is the AGENT BUILDER LLM - separate from Team Architect
    // This LLM focuses on individual agent configuration, NOT org structure changes
    if (conversationHistory.length === 0) {
      const contextInfo = consultantContext ? `
      
CONTEXT FROM CONSULTANT CONVERSATION:
${consultantContext.summary || 'No summary available'}

${consultantContext.blueprint ? `
EXISTING BLUEPRINT FROM CONVERSATION:
- Affirmative Actions (Green List): ${consultantContext.blueprint.greenList.join(', ') || 'None yet'}
- Hard Limits (Red List): ${consultantContext.blueprint.redList.join(', ') || 'None yet'}
- Flow Steps: ${consultantContext.blueprint.flowSteps.map(s => s.label).join(' → ') || 'None yet'}

Use this as a starting point and refine/expand it based on the user's responses.` : ''}

Your task is to refine and complete this blueprint based on the user's input.` : '';

      contents.unshift({
        role: 'user' as const,
        parts: [{ text: `You are the Agent Builder, a specialized AI architect focused on configuring individual AI agents. You are SEPARATE from the Team Architect (which handles organizational structure).

Your role is to map the end-to-end TECHNICAL IMPLEMENTATION for the agent named "${agentName}" before deployment.
${contextInfo}

CRITICAL: Focus on TECHNICAL DETAILS and HOW things work:
- How does the agent access external services? (e.g., "I'll need you to log into Google to access Google Reviews")
- What APIs or integrations are needed?
- What authentication or credentials are required?
- What are the exact steps to complete each action?
- How should the agent handle errors or edge cases?

IMPORTANT: After each response, you MUST extract and return blueprint information in JSON format:
{
  "response": "Your conversational response...",
  "blueprint": {
    "greenList": ["action 1", "action 2"],
    "redList": ["constraint 1", "constraint 2"],
    "flowSteps": [
      {"label": "Trigger description", "type": "trigger"},
      {"label": "Action description", "type": "action"},
      {"label": "End description", "type": "end"}
    ]
  }
}

Ask clarifying questions to understand:
1. What should this agent do? (affirmative actions - green list)
2. What should this agent NOT do? (hard limits - red list)
3. What is the workflow logic? (trigger -> actions -> decisions -> end)
4. TECHNICAL IMPLEMENTATION: How does it access external services, APIs, credentials, etc.?

IMPORTANT: 
- If the agent needs to access external services (like Google, APIs, etc.), ask the user to log in or provide access. You can request things like "I'll need you to log into Google so I can access your Google Reviews" - the platform will handle showing a login screen.
- You do NOT handle organizational structure changes (that's the Team Architect's job)
- You focus ONLY on configuring this specific agent's behavior and technical implementation
- ALWAYS return blueprint updates in your responses so the UI can automatically update

Be thorough and ask specific questions about both WHAT and HOW. The user just said: ${userInput}` }]
      });
    }

    // Build a simple prompt string from the conversation
    let prompt = '';
    if (conversationHistory.length === 0) {
      const contextInfo = consultantContext ? `
      
CONTEXT FROM CONSULTANT CONVERSATION:
${consultantContext.summary || 'No summary available'}

${consultantContext.blueprint ? `
EXISTING BLUEPRINT FROM CONVERSATION:
- Affirmative Actions (Green List): ${consultantContext.blueprint.greenList.join(', ') || 'None yet'}
- Hard Limits (Red List): ${consultantContext.blueprint.redList.join(', ') || 'None yet'}
- Flow Steps: ${consultantContext.blueprint.flowSteps.map(s => s.label).join(' → ') || 'None yet'}

Use this as a starting point and refine/expand it based on the user's responses.` : ''}

Your task is to refine and complete this blueprint based on the user's input.` : '';

      prompt = `You are the Agent Builder, a specialized AI architect focused on configuring individual AI agents. You are SEPARATE from the Team Architect (which handles organizational structure).

Your role is to map the end-to-end TECHNICAL IMPLEMENTATION for the agent named "${agentName}" before deployment.
${contextInfo}

CRITICAL: Focus on TECHNICAL DETAILS and HOW things work:
- How does the agent access external services? (e.g., "I'll need you to log into Google to access Google Reviews")
- What APIs or integrations are needed?
- What authentication or credentials are required?
- What are the exact steps to complete each action?
- How should the agent handle errors or edge cases?

IMPORTANT: After each response, you MUST extract and return blueprint information in JSON format:
{
  "response": "Your conversational response...",
  "blueprint": {
    "greenList": ["action 1", "action 2"],
    "redList": ["constraint 1", "constraint 2"],
    "flowSteps": [
      {"label": "Trigger description", "type": "trigger"},
      {"label": "Action description", "type": "action"},
      {"label": "End description", "type": "end"}
    ]
  }
}

Ask clarifying questions to understand:
1. What should this agent do? (affirmative actions - green list)
2. What should this agent NOT do? (hard limits - red list)
3. What is the workflow logic? (trigger -> actions -> decisions -> end)
4. TECHNICAL IMPLEMENTATION: How does it access external services, APIs, credentials, etc.?

IMPORTANT: 
- If the agent needs to access external services (like Google, APIs, etc.), ask the user to log in or provide access. You can request things like "I'll need you to log into Google so I can access your Google Reviews" - the platform will handle showing a login screen.
- You do NOT handle organizational structure changes (that's the Team Architect's job)
- You focus ONLY on configuring this specific agent's behavior and technical implementation
- ALWAYS return blueprint updates in your responses so the UI can automatically update

Be thorough and ask specific questions about both WHAT and HOW. The user just said: ${userInput}`;
    } else {
      // Build conversation history
      const historyText = conversationHistory.map(c => {
        const text = c.parts.map(p => p.text).join(' ');
        return c.role === 'user' ? `User: ${text}` : `Assistant: ${text}`;
      }).join('\n\n');
      prompt = `${historyText}

User: ${userInput}

Assistant: (You are the Agent Builder - focused on configuring this specific agent's technical implementation. Continue asking about:
- How does the agent access external services, APIs, credentials?
- What are the exact steps for each action?
- What integrations or logins are needed?
- How should errors be handled?

If the agent needs to access external services (like Google, APIs, etc.), ask the user to log in. You can say things like "I'll need you to log into Google so I can access your Google Reviews" - the platform will show a login screen.

Remember: You focus ONLY on this agent's configuration, NOT organizational structure changes. Continue asking specific questions about both WHAT the agent should do and HOW it should do it technically.)`;
    }

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    const responseText = response.text || "I couldn't generate a response right now.";

    // Try to extract blueprint information from response
    // First, look for JSON in the response
    const jsonMatch = responseText.match(/\{[\s\S]*"blueprint"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          response: parsed.response || responseText.replace(jsonMatch[0], '').trim(),
          blueprint: parsed.blueprint ? {
            greenList: parsed.blueprint.greenList || [],
            redList: parsed.blueprint.redList || [],
            flowSteps: parsed.blueprint.flowSteps || []
          } : undefined
        };
      } catch (e) {
        console.error("Error parsing blueprint JSON:", e);
      }
    }

    // If no JSON found, try to extract blueprint from natural language using a follow-up LLM call
    // This helps when the agent builder responds conversationally but mentions blueprint items
    try {
      const extractionPrompt = `Extract blueprint information from this agent builder conversation response:

"${responseText}"

If the response mentions:
- What the agent should do (affirmative actions) → extract as greenList items
- What the agent should NOT do (constraints/limits) → extract as redList items  
- Workflow steps, triggers, actions, or decisions → extract as flowSteps

Return ONLY a JSON object with this structure (or empty arrays if nothing found):
{
  "greenList": ["action 1", "action 2"],
  "redList": ["constraint 1", "constraint 2"],
  "flowSteps": [
    {"label": "Step description", "type": "trigger|action|decision|end"}
  ]
}

Only return valid JSON, no other text.`;

      const extractionResponse = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: extractionPrompt
      });

      const extractionText = extractionResponse.text || '{}';
      const extractionJsonMatch = extractionText.match(/\{[\s\S]*\}/);
      if (extractionJsonMatch) {
        try {
          const extracted = JSON.parse(extractionJsonMatch[0]);
          if (extracted.greenList?.length > 0 || extracted.redList?.length > 0 || extracted.flowSteps?.length > 0) {
            return {
              response: responseText,
              blueprint: {
                greenList: extracted.greenList || [],
                redList: extracted.redList || [],
                flowSteps: extracted.flowSteps || []
              }
            };
          }
        } catch (e) {
          console.error("Error parsing extracted blueprint:", e);
        }
      }
    } catch (e) {
      console.error("Error extracting blueprint from text:", e);
    }

    // If no blueprint found, return response and let the UI handle blueprint updates from context
    // The blueprint should already be populated from extractAgentContext
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

// Update org structure incrementally based on conversation (background process)
export const updateOrgStructureIncrementally = async (
  conversationText: string,
  existingStructure?: any
): Promise<any> => {
  const client = getClient();
  if (!client) {
    return existingStructure || null;
  }

  try {
    const existingContext = existingStructure 
      ? `\n\nCurrent organizational structure:\n${JSON.stringify(existingStructure, null, 2)}`
      : '';

    const prompt = `Based on this ongoing conversation, update or create an organizational chart structure that includes BOTH AI agents (for automation) AND human tasks (for manual work).

Conversation so far:
"${conversationText}"

${existingContext ? 'Update the existing structure based on new information from the conversation. If the structure already exists, refine it rather than starting over.' : 'Create an initial structure based on what has been discussed so far.'}

The organizational chart should represent the complete workflow structure, including:
- Departments/teams
- AI agents (type: "ai") for tasks that should be automated
- Human tasks/roles (type: "human") for tasks that should remain manual

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
        },
        {
          "name": "Human Task Name",
          "type": "human",
          "role": "Task Description"
        }
      ]
    }
  ]
}

IMPORTANT:
- Include ALL tasks mentioned so far, whether automated (type: "ai") or manual (type: "human")
- Only create AI agents for tasks explicitly mentioned as needing automation
- Create human task nodes for tasks that should remain manual
- If it's unclear whether something should be automated, default to "human" type
- ${existingContext ? 'Preserve existing structure elements that haven\'t been contradicted. Only update or add new information.' : ''}
- If there's not enough information yet, return a minimal structure with just "You" as the root

Only return valid JSON, no other text.`;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    const jsonText = response.text || '{}';
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Ensure name is "You" to match existing structure
      if (parsed.name !== "You") {
        parsed.name = "You";
      }
      return parsed;
    }
    return existingStructure || null;
  } catch (error: any) {
    console.error("Error updating org structure incrementally:", error);
    return existingStructure || null;
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
    const prompt = `Based on this workflow description, generate a JSON structure for an organizational chart that includes BOTH AI agents (for automation) AND human tasks (for manual work).

"${workflowDescription}"

The organizational chart should represent the complete workflow structure, including:
- Departments/teams
- AI agents (type: "ai") for tasks that should be automated
- Human tasks/roles (type: "human") for tasks that should remain manual

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
        },
        {
          "name": "Human Task Name",
          "type": "human",
          "role": "Task Description"
        }
      ]
    }
  ]
}

IMPORTANT:
- Include ALL tasks mentioned in the workflow, whether automated (type: "ai") or manual (type: "human")
- Only create AI agents for tasks that were explicitly mentioned as needing automation
- Create human task nodes for tasks that should remain manual
- If it's unclear whether something should be automated, default to "human" type

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
      summary: `I am the architect for ${agentName}. Based on our conversation, I understand you want to automate this workflow.\n\nAm I missing anything else, or would you like to add any additional details about how this agent should work?`
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
      const baseSummary = parsed.summary || `I am the architect for ${agentName}. Based on our conversation, I understand you want to automate this workflow.`;
      const summaryWithQuestion = `${baseSummary}\n\nAm I missing anything else, or would you like to add any additional details about how this agent should work?`;
      
      return {
        summary: summaryWithQuestion,
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

// Team Architect - Process user requests to modify org structure
export const processTeamArchitectRequest = async (
  userRequest: string,
  currentOrgStructure: any,
  conversationHistory: Array<{ sender: string; text: string }> = []
): Promise<{ 
  response: string; 
  proposedChanges?: any; 
  requiresConfirmation: boolean;
  changeType?: 'add_team' | 'add_agent' | 'restructure' | 'remove' | 'modify';
}> => {
  const client = getClient();
  if (!client) {
    return {
      response: "I understand your request, but I need API access to make changes. Please check your configuration.",
      requiresConfirmation: false
    };
  }

  try {
    const conversationText = conversationHistory
      .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n\n');

    const currentStructureText = currentOrgStructure 
      ? JSON.stringify(currentOrgStructure, null, 2)
      : 'No existing structure';

    const prompt = `You are the Team Architect, an AI assistant that helps users organize and restructure their team's organizational chart. You manipulate a graph-based organizational structure where nodes represent teams, departments, AI agents, or human tasks.

CURRENT ORGANIZATIONAL STRUCTURE:
${currentStructureText}

CONVERSATION HISTORY:
${conversationText}

USER REQUEST: "${userRequest}"

=== GRAPH OPERATION SPECIFICATIONS ===

You can perform the following operations on the organizational chart graph:

1. ADDITION OPERATIONS (add_node)
   SYNTAX: ADD NODE {id} TYPE {type} PARENT {parent_id} PROPERTIES {props}
   
   VALIDATION STEPS:
   1. Check if ID already exists → FAIL if duplicate
   2. Verify parent exists → FAIL if missing
   3. Check type compatibility → FAIL if invalid parent-child combo
      - Departments can contain: teams, systems, agents, human tasks
      - Systems can contain: agents, human tasks
      - Agents cannot have children
      - Human tasks cannot have children
   4. Create node with properties (name, type, role, status, etc.)
   5. Create edge from parent to new node
   6. Return success + updated graph
   
   EXAMPLE:
   Input: "Add a system called 'Analytics Dashboard' under Ops & Logistics"
   Process:
   - Generate ID: analytics_dash_001
   - Verify parent: ops_logistics exists ✓
   - Create node: {id: analytics_dash_001, name: "Analytics Dashboard", type: "system"}
   - Create edge: ops_logistics → analytics_dash_001
   - Output: Graph with new node added

2. DELETION OPERATIONS (delete_node)
   SYNTAX: DELETE NODE {id} CASCADE {true|false}
   
   VALIDATION STEPS:
   1. Check if node exists → FAIL if missing
   2. Find all child nodes associated with target node
   3. If CASCADE=true, recursively delete all found child nodes
   4. If CASCADE=false and child nodes exist → FAIL or prompt for reassignment
   5. Remove all edges (connections) involving the target node
   6. Remove the target node from graph
   7. Return updated graph
   
   EXAMPLE:
   Input: "Remove Inventory Intel system"
   Process:
   - Find node: inventory_intel
   - Check children: none
   - Remove edge: ops_logistics → inventory_intel
   - Remove node: inventory_intel
   Output: Graph without inventory_intel

3. MODIFICATION OPERATIONS (modify_node)
   SYNTAX: UPDATE NODE {id} SET {property}={value}
   
   VALIDATION STEPS:
   1. Verify node exists → FAIL if missing
   2. Check property is modifiable (not structural like ID)
   3. Validate new value type matches property type
   4. Update property
   5. Return updated node
   
   EXAMPLE:
   Input: "Change Delivery Coord status from 'needs_attention' to 'active'"
   Process:
   - Find node: delivery_coord
   - Validate property: status is modifiable ✓
   - Update: status = "active"
   Output: Updated node properties

4. RELATIONSHIP OPERATIONS (move_node)
   SYNTAX: MOVE NODE {id} TO PARENT {new_parent_id}
   
   VALIDATION STEPS:
   1. Verify node exists → FAIL if missing
   2. Verify new parent exists → FAIL if missing
   3. Check type compatibility → FAIL if invalid parent-child combo
      - System cannot parent a department
      - Agent cannot have children
      - Human task cannot have children
   4. Remove old parent edge
   5. Create new parent edge
   6. Verify no cycles created → FAIL if cycle detected
   7. Return updated graph
   
   EXAMPLE:
   Input: "Move Route Planner to report under Delivery Coord"
   Process:
   - Find node: route_planner
   - Current parent: ops_logistics
   - New parent: delivery_coord
   - Check: Can a system (delivery_coord) have system children?
   - If NO → FAIL with error
   - If YES → Update edge relationships

=== YOUR CAPABILITIES ===
- Add new teams/departments (use add_node operation)
- Add new AI agents to teams (use add_node with type="ai")
- Add new human tasks to teams (use add_node with type="human")
- Restructure/reorganize the entire org chart (use move_node and add_node operations)
- Move teams/agents between departments (use move_node operation)
- Remove teams or agents (use delete_node operation, ask about CASCADE)
- Rename teams or agents (use modify_node operation)
- Reclassify tasks (use modify_node to change type property)
- Update node properties like status, role, etc. (use modify_node operation)

=== IMPORTANT RULES ===
1. ALWAYS require user confirmation before making structural changes
2. For major restructures (creating multiple teams, reorganizing), you MUST get approval
3. For simple additions (one team, one agent), you can propose and ask for confirmation
4. Never make changes without user approval
5. When deleting nodes with children, ask user about CASCADE (should children be deleted too?)
6. Always validate type compatibility before proposing moves or additions
7. Check for cycles when moving nodes

=== RESPONSE FORMAT ===
Return a JSON object with this structure:
{
  "response": "Your conversational response explaining what you understand and what you propose to do. Reference the specific operations you'll use (e.g., 'I'll use the add_node operation to create...')",
  "proposedChanges": { ... new org structure JSON ... },
  "requiresConfirmation": true/false,
  "changeType": "add_team" | "add_agent" | "restructure" | "remove" | "modify" | "move",
  "operations": ["add_node", "delete_node", "modify_node", "move_node"] // List operations you'll perform
}

If the request is just a question or doesn't require changes, set "requiresConfirmation": false and omit "proposedChanges".

If you need to make changes:
- Identify which graph operations you'll use (add_node, delete_node, modify_node, move_node)
- Generate the complete new org structure in "proposedChanges"
- Set "requiresConfirmation": true
- Explain what operations you'll perform in "response"
- Ask for user confirmation

Only return valid JSON, no other text.`;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    const jsonText = response.text || '{}';
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        response: parsed.response || "I understand your request. Let me process that.",
        proposedChanges: parsed.proposedChanges,
        requiresConfirmation: parsed.requiresConfirmation !== false,
        changeType: parsed.changeType
      };
    }
    
    return {
      response: "I understand your request. Could you clarify what specific changes you'd like me to make?",
      requiresConfirmation: false
    };
  } catch (error: any) {
    console.error("Error processing team architect request:", error);
    return {
      response: "I encountered an error processing your request. Please try rephrasing it.",
      requiresConfirmation: false
    };
  }
};

// Legacy function for backward compatibility
export const generateWorkflowSuggestions = async (userInput: string): Promise<string> => {
  return consultWorkflow(userInput);
};
