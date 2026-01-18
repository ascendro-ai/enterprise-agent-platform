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
  questionCount: number = 0,
  fileAttachments?: Array<{ name: string; type: string; size: number; content: string }>
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

    // Build file attachment context if files are provided
    let fileContext = '';
    if (fileAttachments && fileAttachments.length > 0) {
      fileContext = `\n\nFILES ATTACHED BY USER:\n`;
      fileAttachments.forEach((file, index) => {
        fileContext += `${index + 1}. ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)\n`;
      });
      fileContext += `\nThe user has uploaded ${fileAttachments.length} file(s). These may be Excel templates, PDF templates, or other workflow-related documents. `;
      fileContext += `You can reference these files naturally in conversation if they're relevant to understanding the workflow. `;
      fileContext += `If the user mentions Excel or PDF operations, these uploaded files may be templates they want to use. `;
      fileContext += `Do NOT pre-teach about specific workflows - learn naturally from what the user tells you.\n`;
    }

    // Build a simple prompt string from the conversation
    let prompt = '';
    if (conversationHistory.length === 0) {
      // First message - focus on workflow discovery
      prompt = `You are a friendly workflow consultant helping someone automate their business tasks using an AI agent platform.
${fileContext}
PLATFORM CONTEXT - You should know about these features and their functions:

PLATFORM CONTEXT - You should know about these features and their functions:

1. "Create a Task" tab (where you are now): This is the workspace where users can talk about issues they're facing and build workflows. As the consultant, you help users understand their business problems and map out workflows to solve them. The workflow steps, tasks, and process flow that you extract from the conversation will automatically appear in "Your Workflows" tab.

2. "Your Workflows" tab: This is where users can customize and build AI agents easily to solve those tasks. Each workflow shows the sequence of steps, and each step can be assigned to an AI agent (which users can build using the agent builder) or to a human. The workflow steps, tasks, and process flow all go to "Your Workflows" tab - NOT "Your Team". Users can then assign each step to an AI agent or to a human, and build/configure those agents directly in this tab.

3. "Your Team" tab: This is where users can manage their fleet of digital workers who run those workflows (e.g., manage those processes) and have their humans collaborate with those digital workers. Stakeholders include:
  * Digital Workers (AI Agents): Automated workers that execute workflows (e.g., "Email Monitor Agent", "PDF Generator Agent")
  * Humans: People involved in the process who collaborate with digital workers
  * NOTE: The workflow steps themselves (the process flow) go to "Your Workflows", not "Your Team". "Your Team" is for managing the stakeholders/agents who run the workflows.

4. "Control Room" tab: This is a dashboard where users can track progress and updates from all their active agents. It shows what agents are working on, what needs review, and what's been completed.

Your goal is to quickly understand the WORKFLOW at a high level - what needs to happen, in what order. The workflow steps, tasks, and process flow will automatically appear in "Your Workflows" tab, NOT "Your Team". The organizational structure (stakeholders/agents) goes to "Your Team".

CRITICAL - STAKEHOLDER CREATION STRATEGY:
- "Your Team" represents STAKEHOLDERS involved in the process, not departments
- Stakeholders can be:
  * Digital Workers (AI Agents): Automated workers that coordinate and orchestrate workflows. Digital workers can intelligently route tasks, coordinate between different steps, and use AI agents as needed - they don't need to be one agent per task.
  * Humans: People involved in the process (e.g., "Worker", "Manager", "Owner")
- IMPORTANT - Digital Worker Strategy:
  * Digital workers should coordinate and orchestrate entire workflows, not be created for every single task
  * A digital worker can handle multiple related steps in a workflow and intelligently route/orchestrate as needed
  * For example, if the workflow involves: "get emails → reply with form → notify worker → update Excel → calculate quote → generate PDF → send email"
  * You might create a "Consultation Coordinator" digital worker that handles the entire consultation workflow, or a "Quote Manager" digital worker that handles quote generation and delivery
  * Digital workers can use AI agents as tools/resources when needed, but don't need one agent per task
  * Focus on creating digital workers that coordinate logical groups of tasks, not individual task agents
- Also identify HUMAN STAKEHOLDERS mentioned in the conversation (e.g., "worker", "husband", "team member", "manager")
- Digital workers can have workflows assigned to them (they execute and coordinate those workflows)
- Humans can have workflows assigned to them (they oversee/manage those workflows)
- The structure should show stakeholders (both digital workers and humans) - NO DEPARTMENTS

CRITICAL - QUESTION LIMIT: You have asked ${questionCount} questions so far. You have a MAXIMUM of 3-5 questions total to scope this workflow. After that, you should summarize and ask if they're ready to build, even if you don't have every detail.

CRITICAL - SUMMARY MESSAGE RULES:
- When summarizing, DO NOT list individual AI agents (e.g., "Email Monitor Agent", "Response Agent", "CRM Agent", etc.)
- Just confirm the WORKFLOW steps (what needs to happen, in what order)
- Tell the user that in "Your Team" tab, they can build their own org structure and create digital workers to execute these workflows
- Keep the summary focused on the workflow, not the agents

Focus on ONLY these essential questions (prioritize the most important):
1. What kind of business/work they do
2. What main tasks or processes they want to automate (each distinct task = separate digital worker)
3. Which tasks should be AUTOMATED vs which should remain HUMAN TASKS
4. Who are the stakeholders involved (humans and digital workers) - NO DEPARTMENTS

IMPORTANT - DO NOT ask about:
- Agent granularity, architecture, or technical details (those come in agent setup)
- Specific preferences, fine-tuning, or configurations (agent setup handles this)
- Exact parameters, thresholds, or minor details (agent setup handles this)
- How agents should work internally (agent setup handles this)

IMPORTANT - Workflow builds automatically, Org structure does NOT:
- The WORKFLOW STEPS (process flow, tasks, sequence) are being built automatically in the background and will appear in "Your Workflows" tab
- The organizational structure (stakeholders/agents) is NOT built automatically - users will build it manually in "Your Team" tab using the Team Architect chat
- You don't need to ask for permission or wait for the user to say "build" or "proceed"
- The user can check the "Your Workflows" tab to see the workflow steps being created
- Users build their team structure manually in "Your Team" tab - you don't need to create it here
- Just focus on understanding their workflow through conversation

Keep it HIGH-LEVEL and FAST. Focus on understanding WHAT needs to be done, not HOW. All granular details will be handled in the agent setup phase when they configure each agent individually.

Be concise. Ask 1-2 questions at a time. After 3-5 questions total, summarize what you understand. The workflow steps will appear in "Your Workflows" tab, and the stakeholders/agents will appear in "Your Team" tab - both update automatically as we chat.

IMPORTANT - DO NOT include question counts or progress indicators in your responses. Do not say things like "(Total questions asked: 2/5)" or similar. Just have a natural conversation.

The user just said: "${userInput}"

${questionCount >= 3 ? 'You\'ve asked enough questions. Summarize what you understand about the WORKFLOW (what needs to happen, in what order), but DO NOT signal high confidence or say things like "I have everything I need" or "Once you answer that, I\'ll have everything I need." DO NOT list individual AI agents (like "Email Monitor Agent", "Response Agent", etc.) - just confirm the workflow steps. Instead, say something like: "That\'s a great starting point for me to understand your workflow. The workflow steps and process flow will appear in "Your Workflows" tab, where you can assign each step to an AI agent (which you can build using the agent builder) or to a human. In "Your Team" tab, you can build your own org structure and create digital workers to execute these workflows." Keep it humble and indicate this is just the beginning.' : 'Respond naturally and ask a follow-up question to understand their workflow better. Keep it high-level and concise. The workflow steps will appear in "Your Workflows" tab, and stakeholders/agents will appear in "Your Team" tab - both update automatically as we chat.'}`;
    } else {
      // Build conversation history
      const historyText = conversationHistory.map(c => {
        const text = c.parts.map(p => p.text).join(' ');
        return c.role === 'user' ? `User: ${text}` : `Assistant: ${text}`;
      }).join('\n\n');
      prompt = `${historyText}

User: ${userInput}

Assistant: (Continue gathering workflow information, but be CONCISE. You have asked ${questionCount} questions so far. You have a MAXIMUM of 3-5 questions total. DO NOT mention question counts in your response - just have a natural conversation.

Focus on ONLY essential high-level questions:
- Which tasks should be automated with AI agents vs which should remain as human tasks
- What parts of the workflow need automation and what parts should stay manual
- The full organizational structure including both automated and human roles

IMPORTANT - DIGITAL WORKER CREATION:
- Digital workers should coordinate and orchestrate workflows, not be created for every single task
- A digital worker can handle multiple related steps and intelligently route/orchestrate as needed
- For example: Instead of creating "Email Monitor Agent", "Response Agent", "CRM Agent" for each step, create a "Consultation Coordinator" that handles the consultation workflow end-to-end
- Digital workers can use AI agents as tools/resources when needed, but focus on coordination and orchestration, not one agent per task
- The org structure should show digital workers that coordinate logical groups of tasks

DO NOT ask about:
- Agent granularity, architecture, or technical details (agent setup handles this)
- Specific preferences, fine-tuning, or configurations (agent setup handles this)
- Exact parameters or minor details (agent setup handles this)

Remember: "Your Workflows" is where the workflow steps, tasks, and process flow will appear (NOT "Your Team"). "Your Team" is where they'll see all their digital workers AND human stakeholders in the organizational chart. "Control Room" is the dashboard for tracking progress. You can naturally reference these when appropriate.

${questionCount >= 3 ? 'You\'ve asked enough questions. Summarize what you understand about the WORKFLOW (what needs to happen, in what order), but DO NOT signal high confidence or say things like "I have everything I need" or "Once you answer that, I\'ll have everything I need." DO NOT list individual AI agents (like "Email Monitor Agent", "Response Agent", etc.) - just confirm the workflow steps. Instead, say something like: "That\'s a great starting point for me to understand your workflow. The workflow steps and process flow will appear in "Your Workflows" tab, where you can assign each step to an AI agent (which you can build using the agent builder) or to a human. In "Your Team" tab, you can build your own org structure and create digital workers to execute these workflows." Keep it humble and indicate this is just the beginning.' : 'Ask 1-2 concise questions at a time. Be friendly but move quickly. After 3-5 questions total, you should summarize what you understand. The workflow steps will appear in "Your Workflows" tab, and stakeholders/agents will appear in "Your Team" tab - both update automatically in the background. The user can navigate to "Your Workflows" tab to see the workflow steps, and "Your Team" tab to see the stakeholders/agents.'}`;
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
  consultantContext?: { summary?: string; blueprint?: { greenList: string[]; redList: string[] } },
  fileAttachments?: Array<{ name: string; type: string; size: number; content: string }>
): Promise<{ response: string; blueprint?: { greenList: string[]; redList: string[] } }> => {
  const client = getClient();
  if (!client) {
    // Mock response if no API key
      return {
        response: `I'm configuring automation for "${agentName}". Based on "${userInput}", I'll set up the operational mandate.`,
        blueprint: {
          greenList: ["Standard operation"],
          redList: ["Do not violate safety"]
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

    // Build file attachment context if files are provided
    let fileContext = '';
    if (fileAttachments && fileAttachments.length > 0) {
      fileContext = `\n\nFILES ATTACHED BY USER:\n`;
      fileAttachments.forEach((file, index) => {
        fileContext += `${index + 1}. ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)\n`;
      });
      fileContext += `\nThe user has uploaded ${fileAttachments.length} file(s). These may be Excel templates, PDF templates, or other configuration files. `;
      fileContext += `You can reference these files when configuring the agent. If the agent needs to work with Excel or PDF files, these uploaded templates should be used. `;
      fileContext += `For Gmail integration, the agent will need OAuth2 authentication. For Excel operations, the agent can use the uploaded Excel template. For PDF generation, the agent can use the uploaded PDF template.\n`;
    }

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

Use this as a starting point and refine/expand it based on the user's responses.` : ''}

Your task is to refine and complete this blueprint based on the user's input.` : '';

      contents.unshift({
        role: 'user' as const,
        parts: [{ text: `You are the Agent Builder, a specialized AI architect focused on configuring individual AI agents. You are SEPARATE from the Team Architect (which handles organizational structure).

Your role is to map the end-to-end TECHNICAL IMPLEMENTATION for automating the task: "${agentName}" before deployment.
${contextInfo}${fileContext}

CRITICAL - BE PROACTIVE AND DRIVE THE SETUP PROCESS:

You MUST actively guide the user through EVERYTHING needed to automate this task. Don't just ask questions - TELL them what needs to be done and guide them through it step by step.

1. IMMEDIATELY IDENTIFY WHAT'S NEEDED:
   - If the task involves Gmail: "I need to connect to your Gmail account. Let's authenticate with Gmail now - click here to log in."
   - If the task involves Excel: "I need access to your Excel file. Do you have a template uploaded, or should I create one?"
   - If the task involves PDF: "I need to generate PDFs. Do you have a template, or should I create one from scratch?"
   - If the task involves calculations: "I need to understand the formula/logic. Can you share the calculation method?"

2. BE DIRECT AND ACTION-ORIENTED:
   - Don't say "I couldn't find context" or "Based on our conversation..."
   - Instead say: "To automate '${agentName}', we have a few things to set up. Let's start with [first thing]."
   - Guide them through each step: "First, let's authenticate Gmail. Click the 'Connect Gmail' button."
   - Then move to the next: "Great! Now I need your Excel template. Upload it here."
   - Continue until everything is set up

3. FIRST MESSAGE SHOULD BE:
   - Keep it CLEAN and CONCISE - don't dump a massive checklist
   - Say: "To automate '${agentName}', we have a few things to set up."
   - Start with the FIRST action: "Let's start by [doing X]. [Specific instruction]"
   - Be specific: "Click 'Connect Gmail' button" not "We might need Gmail"
   - Ask ONE follow-up question at a time, not a list of 5 things
   - Keep the message short and actionable - guide them step by step, not all at once

4. TECHNICAL REQUIREMENTS CHECKLIST:
   - What APIs or integrations are needed? (Gmail API, Excel operations, PDF generation, etc.)
   - What authentication or credentials are required? (Gmail OAuth2, file access, etc.)
   - What tools or services need to be set up? (Google login, Excel templates, PDF templates, etc.)
   - What are the exact steps to complete each action?
   - How should the agent handle errors or edge cases?
   - If Excel or PDF templates are uploaded, how should the agent use them?

5. DRIVE THE PROCESS:
   - Don't wait for the user to tell you what to do
   - Proactively identify what's needed and guide them
   - If Gmail is needed, immediately guide them to authenticate
   - If Excel is needed, immediately ask for the file or template
   - If PDF is needed, immediately ask for template or create one
   - Keep pushing forward until everything is configured

IMPORTANT - BLUEPRINT BEHAVIOR:
- You CAN ask questions about potential behaviors and suggest actions/limits
- When suggesting something, explicitly ask: "Should I add '[action/limit]' to the [Actions/Hard Limits] list?"
- DO NOT automatically add items to the blueprint - wait for user confirmation
- The blueprint should only be populated from:
  1. The main "Create a Task" conversation (already extracted)
  2. Explicit user confirmation when you ask "Should I add X to..."
- When user confirms (says "yes", "add that", "correct", etc.), the system will automatically add it
- Focus on guiding the user through setup and asking clarifying questions with explicit confirmation requests

Ask clarifying questions to understand:
1. What should this automation do? (affirmative actions - green list)
   - When you identify a potential action, explicitly ask: "Should I add '[action description]' to the Actions list?"
   - Wait for user confirmation before assuming it's part of the blueprint
2. What should this automation NOT do? (hard limits - red list)
   - When you identify a potential limit, explicitly ask: "Should I add '[limit description]' to the Hard Limits list?"
   - Wait for user confirmation before assuming it's part of the blueprint
3. What is the workflow logic? (trigger -> actions -> decisions -> end)
4. TECHNICAL IMPLEMENTATION: How does it access external services, APIs, credentials, etc.?
5. What tools/integrations need to be set up? (Gmail login, Excel access, PDF generation, etc.)

EXAMPLE OF GOOD CONFIRMATION QUESTIONS:
- "Should I add 'Send automated email replies' to the Actions list?"
- "Should I add 'Never send emails outside business hours' to the Hard Limits list?"
- "I understand this agent should monitor Gmail inbox. Should I add 'Monitor Gmail inbox for new emails' to the Actions list?"

IMPORTANT: 
- If the automation needs Gmail access, you MUST ask the user to authenticate with Gmail BEFORE building. Say: "I'll need you to log into Gmail so I can access your emails" - the platform will handle OAuth2 authentication.
- If Excel templates are uploaded, reference them when configuring Excel operations (customer tracking, quote calculation).
- If PDF templates are uploaded, reference them when configuring PDF generation (quote PDFs with payment links).
- You do NOT handle organizational structure changes (that's the Team Architect's job)
- You focus ONLY on configuring this specific agent's behavior and technical implementation
- NEVER start building until you have confirmed all necessary tools/integrations are ready
- DO NOT return blueprint information unless the user explicitly confirms specific actions or limits

Be thorough and ask specific questions about both WHAT and HOW. Before building, always end with: "Is there any other necessary context before jumping in, or shall we start building the agent? If so, I need [specific requirements]." The user just said: ${userInput}` }]
      });
    }

    // For subsequent messages, add to contents array
    if (conversationHistory.length > 0) {
      // Build conversation history with file context
      const historyText = conversationHistory.map(c => {
        const text = c.parts.map(p => p.text).join(' ');
        return c.role === 'user' ? `User: ${text}` : `Assistant: ${text}`;
      }).join('\n\n');
      
      contents.push({
        role: 'user' as const,
        parts: [{ text: `${historyText}${fileContext}\n\nUser: ${userInput}\n\nAssistant: (You are the Agent Builder - focused on configuring this specific agent's technical implementation. 

BEFORE BUILDING - You MUST ensure:
1. All necessary tools/integrations are available or can be set up
2. All required authentication is in place (e.g., Gmail OAuth2 login)
3. All templates/files are accessible (Excel templates, PDF templates)
4. You have complete understanding of the workflow logic
5. You know all technical details needed for implementation

Continue asking about:
- How does the agent access external services, APIs, credentials? (Gmail OAuth2, Excel operations, PDF generation)
- What are the exact steps for each action?
- What integrations or logins are needed?
- How should errors be handled?
- If Excel or PDF templates are uploaded, how should the agent use them?

CRITICAL - ENDING YOUR RESPONSES:
- When you have enough information to start building, end with: "Is there any other necessary context before jumping in, or shall we start building the agent? If so, I need [list specific things like: Gmail authentication, Excel template access, etc.]"
- If you're missing critical information, explicitly state what you need before proceeding
- Always confirm tools/integrations are ready before building

If the agent needs Gmail access, you MUST ask the user to authenticate with Gmail BEFORE building. Say: "I'll need you to log into Gmail so I can access your emails" - the platform will handle OAuth2 authentication.
If Excel templates are uploaded, reference them when configuring Excel operations.
If PDF templates are uploaded, reference them when configuring PDF generation.

Remember: You focus ONLY on this agent's configuration, NOT organizational structure changes. Continue asking specific questions about both WHAT the agent should do and HOW it should do it technically. NEVER start building until all necessary tools/integrations are confirmed ready.)` }]
      });
    }

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents
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
            redList: parsed.blueprint.redList || []
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

Return ONLY a JSON object with this structure (or empty arrays if nothing found):
{
  "greenList": ["action 1", "action 2"],
  "redList": ["constraint 1", "constraint 2"]
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
          if (extracted.greenList?.length > 0 || extracted.redList?.length > 0) {
            return {
              response: responseText,
              blueprint: {
                greenList: extracted.greenList || [],
                redList: extracted.redList || []
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

    const prompt = `Based on this ongoing conversation, update or create a stakeholder structure for "Your Team". This represents STAKEHOLDERS (not departments) involved in the process.

Conversation so far:
"${conversationText}"

${existingContext ? 'Update the existing structure based on new information from the conversation. If the structure already exists, refine it rather than starting over.' : 'Create an initial structure based on what has been discussed so far.'}

CRITICAL - STAKEHOLDER CREATION STRATEGY:
- "Your Team" represents STAKEHOLDERS, NOT departments
- Stakeholders include:
  * Digital Workers (type: "ai"): Automated workers that execute workflows
  * Humans (type: "human"): People involved in the process
- Each distinct task or step in the workflow should become a SEPARATE, SPECIALIZED DIGITAL WORKER
- DO NOT create one big agent that does everything
- Create individual digital workers for each distinct responsibility
- For example, if workflow is: "monitor emails → send replies → notify worker → update Excel → calculate quote → generate PDF → send email"
- Create separate digital workers like:
  * "Email Monitor Agent" (watches Gmail, identifies requests)
  * "Response Agent" (sends form messages with consultation links)
  * "Notification Agent" (alerts workers about consultations)
  * "CRM Update Agent" (updates customer Excel with notes)
  * "Pricing Agent" (calculates quotes from notes)
  * "PDF Generator Agent" (creates quote PDFs with payment links)
  * "Quote Sender Agent" (emails PDFs to customers)
- Also identify HUMAN STAKEHOLDERS mentioned (e.g., "worker", "husband", "team member", "manager", "owner")
- Digital workers can have workflows assigned to them (they execute those workflows)
- Humans can have workflows assigned to them (they oversee/manage those workflows)
- NO DEPARTMENTS - just stakeholders (digital workers and humans)

The structure should represent stakeholders involved in the process:
- Digital Workers (type: "ai") - ONE WORKER PER DISTINCT TASK
- Humans (type: "human") - People involved in the process

Return a JSON object with this structure (flat list of stakeholders, NO DEPARTMENTS):
{
  "name": "You",
  "type": "human",
  "role": "Owner",
  "children": [
    {
      "name": "Email Monitor Agent",
      "type": "ai",
      "role": "Monitors Gmail for consultation requests",
      "status": "needs_attention"
    },
    {
      "name": "Response Agent",
      "type": "ai",
      "role": "Sends form messages with consultation links",
      "status": "needs_attention"
    },
    {
      "name": "Worker",
      "type": "human",
      "role": "Handles consultations"
    }
  ]
}

IMPORTANT:
- Create SEPARATE digital workers for each distinct task in the workflow
- Each digital worker should have a descriptive name (e.g., "Email Monitor Agent", "CRM Update Agent", "PDF Generator Agent")
- Include ALL stakeholders mentioned - both digital workers (type: "ai") and humans (type: "human")
- Only create digital workers for tasks explicitly mentioned as needing automation
- Include human stakeholders mentioned in the conversation (e.g., "worker", "husband", "team member")
- NO DEPARTMENTS - just stakeholders (digital workers and humans)
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

CRITICAL - AGENT CREATION STRATEGY:
- Each distinct task or step in the workflow should become a SEPARATE, SPECIALIZED AGENT
- DO NOT create one big agent that does everything
- Create individual agents for each distinct responsibility
- For example, if workflow is: "monitor emails → send replies → notify worker → update Excel → calculate quote → generate PDF → send email"
- Create separate agents like:
  * "Email Monitor Agent" (watches Gmail, identifies requests)
  * "Response Agent" (sends form messages with consultation links)
  * "Notification Agent" (alerts workers about consultations)
  * "CRM Update Agent" (updates customer Excel with notes)
  * "Pricing Agent" (calculates quotes from notes)
  * "PDF Generator Agent" (creates quote PDFs with payment links)
  * "Quote Sender Agent" (emails PDFs to customers)
- Each agent should have a clear, descriptive name that indicates its specific function
- Agents can work in sequence (one agent's output triggers the next)

The organizational chart should represent the complete workflow structure, including:
- Departments/teams (if relevant)
- AI agents (type: "ai") - ONE AGENT PER DISTINCT TASK
- Human tasks/roles (type: "human") for tasks that should remain manual

Return a JSON object with this structure (flat list of stakeholders, NO DEPARTMENTS):
{
  "name": "You",
  "type": "human",
  "role": "Owner",
  "children": [
    {
      "name": "Email Monitor Agent",
      "type": "ai",
      "role": "Monitors Gmail for consultation requests",
      "status": "needs_attention"
    },
    {
      "name": "Response Agent",
      "type": "ai",
      "role": "Sends form messages with consultation links",
      "status": "needs_attention"
    },
    {
      "name": "Worker",
      "type": "human",
      "role": "Handles consultations"
    }
  ]
}

IMPORTANT:
- Create SEPARATE digital workers for each distinct task in the workflow
- Each digital worker should have a descriptive name (e.g., "Email Monitor Agent", "CRM Update Agent", "PDF Generator Agent")
- Include ALL stakeholders mentioned - both digital workers (type: "ai") and humans (type: "human")
- Only create digital workers for tasks that were explicitly mentioned as needing automation
- Include human stakeholders mentioned in the conversation (e.g., "worker", "husband", "team member")
- NO DEPARTMENTS - just stakeholders (digital workers and humans)
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

// Workflow Visualization Agent - Dedicated agent for parsing conversations and creating workflow flowcharts
// This is a SEPARATE agent from the org structure builder - it focuses specifically on workflow visualization
export const extractWorkflowFromConversation = async (
  conversationText: string,
  existingWorkflows: any[] = []
): Promise<any> => {
  const client = getClient();
  if (!client) {
    return null;
  }

  try {
    const existingWorkflowsContext = existingWorkflows.length > 0
      ? `\n\nEXISTING WORKFLOWS (update if workflow name matches, otherwise create new):\n${JSON.stringify(existingWorkflows.map(w => ({ name: w.name, stepCount: w.steps?.length })), null, 2)}`
      : '';

    const prompt = `You are the Workflow Visualization Agent. Your job is to parse conversations from "Create a Task" and extract workflow information to create flowchart visualizations.

Your role is SEPARATE from:
- The Consultant Agent (which asks questions and understands the business)
- The Org Structure Builder (which creates agent hierarchies)
- The Agent Builder (which configures individual agents)

You focus ONLY on:
- Extracting sequential workflow steps from conversations
- Creating flowchart-ready workflow structures
- Identifying triggers, actions, decisions, and end points
- Building visual workflow representations

Conversation from "Create a Task":
"${conversationText}"
${existingWorkflowsContext}

TASK: Extract the workflow steps and create a flowchart structure for "Your Workflows" tab.

CRITICAL: This workflow will be displayed as a beautiful flowchart visualization. You MUST extract ALL steps mentioned in the conversation, even if they seem minor. The user wants to see the FULL process flow mapped out.

WORKFLOW EXTRACTION RULES:
1. Identify ALL sequential steps mentioned in the conversation - DO NOT SKIP ANY
2. Each step should be a distinct action or event
3. Steps should be in chronological order (what happens first, second, third, etc.)
4. Extract step descriptions verbatim from the conversation when possible
5. If steps are implied but not explicitly stated, infer them logically
6. Look for sequential patterns: "first... then... then... finally..." or "step 1... step 2... step 3..."
7. Even if the conversation is brief, extract what you can - partial workflows are better than none

STEP TYPE CLASSIFICATION:
- "trigger": The event that starts the workflow (e.g., "Email received", "New customer signup")
- "action": A specific action that happens (e.g., "Send reply", "Update Excel", "Generate PDF")
- "decision": A conditional branch (e.g., "If negative review", "If payment received")
- "end": The final step that completes the workflow (e.g., "Email sent to customer", "Task completed")

EXAMPLES:
If conversation mentions: "I get emails via Gmail, then reply with form message and consultation link, notify worker, update Excel, calculate quote, generate PDF, send email"
→ Extract 7 steps:
  1. "Receive emails via Gmail" (trigger)
  2. "Reply to Gmail with form message + consultation link" (action)
  3. "Notify worker about consultation" (action)
  4. "Update Excel (RCM-like customer tracking)" (action)
  5. "Calculate custom price quote in Excel" (action)
  6. "Generate PDF with quote and payment link" (action)
  7. "Send email to customer with PDF" (end)

Return a JSON object with this EXACT structure:
{
  "workflowName": "Descriptive workflow name (e.g., 'Consultation Workflow', 'Customer Onboarding', 'Review Management')",
  "description": "Brief 1-2 sentence description of what this workflow accomplishes",
  "steps": [
    {
      "id": "step-1",
      "label": "Clear, concise step description (verbatim from conversation when possible)",
      "type": "trigger|action|decision|end",
      "order": 0,
      "assignedTo": {
        "type": "ai|human",
        "agentName": "Agent name if type is 'ai' (e.g., 'Email Monitor Agent', 'Response Agent')"
      }
    }
  ]
}

AUTO-ASSIGNMENT RULES:
- If the conversation mentions a step should be automated, set assignedTo.type = "ai" and create an agent name (e.g., "Email Monitor Agent" for "monitor emails")
- If the conversation mentions a step is done by a human/worker, set assignedTo.type = "human"
- If it's unclear, default to "ai" for steps that seem automatable (email monitoring, sending, Excel updates, PDF generation, etc.)
- Only set assignedTo if the conversation gives clear indication - otherwise leave it undefined

CRITICAL REQUIREMENTS:
- Extract ALL steps mentioned, don't skip any - this is a FULL process flow mapping
- Maintain the exact order they appear in the conversation
- First step should be type "trigger" (what starts the process)
- Last step should be type "end" (what completes the process)
- Most steps should be type "action" (what happens in between)
- Only use "decision" if there's an explicit conditional (if/then, when/if, etc.)
- If workflow name already exists in existing workflows, update that workflow's steps
- If steps are mentioned (even partially), extract them - DO NOT return null unless there's absolutely no workflow information
- Step labels should be clear and descriptive (10-50 characters ideal)
- IMPORTANT: If the conversation does not contain any actual workflow steps or process descriptions (e.g., just greetings, questions without answers, or empty/minimal content), return null or an empty steps array. Do NOT create placeholder workflows like "New Workflow" with generic steps.
- Each step can later be assigned to an AI agent (using agent builder) or a human (manual assignment)
- If the conversation mentions that a step should be automated, automatically assign it to an AI agent
- Steps that are explicitly mentioned as automated should have assignedTo: { type: "ai", agentName: "[Step Name] Agent" }

Only return valid JSON, no other text.`;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    const jsonText = response.text || 'null';
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate the structure
        if (parsed.workflowName && parsed.steps && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing workflow JSON:', e);
      }
    }
    return null;
  } catch (error: any) {
    console.error("Workflow Visualization Agent Error:", error);
    return null;
  }
};

// Extract agent context from consultant conversation
export const extractAgentContext = async (
  agentName: string,
  consultantHistory: Array<{ sender: string; text: string }>
): Promise<{ summary: string; blueprint?: { greenList: string[]; redList: string[] } }> => {
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
          redList: parsed.redList || []
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

// Extract people/stakeholders from consultant conversation
export const extractPeopleFromConversation = async (
  conversationHistory: Array<{ sender: string; text: string }>
): Promise<Array<{ name: string; type: 'human' | 'ai'; role?: string }>> => {
  const client = getClient();
  if (!client) {
    return [];
  }

  try {
    const conversationText = conversationHistory
      .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n\n');

    const prompt = `Extract all people and stakeholders mentioned in this conversation. Include:
- Human stakeholders (e.g., "worker", "husband", "manager", "team member", "owner", "CEO", names of people)
- Digital workers/AI agents mentioned (e.g., "Email Monitor Agent", "Response Agent", etc.)

Return a JSON array with this structure:
[
  {
    "name": "Person/Agent name",
    "type": "human" or "ai",
    "role": "Optional role description"
  }
]

Only return valid JSON array, no other text. If no people are mentioned, return an empty array [].`;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    const jsonText = response.text || '[]';
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (error: any) {
    console.error("Error extracting people from conversation:", error);
    return [];
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

    const prompt = `You are the Team Architect, an AI assistant that helps users organize and manage stakeholders in "Your Team". You manipulate a graph-based structure where nodes represent STAKEHOLDERS (digital workers/AI agents and humans), NOT departments.

IMPORTANT: "Your Team" represents STAKEHOLDERS involved in the process:
- Digital Workers (type: "ai"): Automated workers that can have workflows assigned to them
- Humans (type: "human"): People involved in the process who can have workflows assigned to them
- NO DEPARTMENTS - just stakeholders

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
   Input: "Add a digital worker called 'Analytics Agent'"
   Process:
   - Generate ID: analytics_agent_001
   - Verify parent: "You" exists ✓
   - Create node: {id: analytics_agent_001, name: "Analytics Agent", type: "ai", role: "Analyzes data"}
   - Create edge: "You" → analytics_agent_001
   - Output: Graph with new stakeholder added

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
- Add new digital workers (AI agents) - use add_node with type="ai"
- Add new human stakeholders - use add_node with type="human"
- Assign workflows to stakeholders (digital workers execute workflows, humans oversee workflows)
- Restructure/reorganize stakeholders (use move_node and add_node operations)
- Remove stakeholders (use delete_node operation)
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
