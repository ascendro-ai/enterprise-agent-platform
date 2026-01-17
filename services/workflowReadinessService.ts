import { Workflow, WorkflowStep, AgentConfiguration, WorkflowReadiness } from '../types';

// Get agent configuration from localStorage
export const getAgentConfig = (agentName: string): AgentConfiguration | null => {
  try {
    const agents = JSON.parse(localStorage.getItem('agents') || '[]');
    return agents.find((agent: AgentConfiguration) => agent.name === agentName) || null;
  } catch (e) {
    console.error('Error loading agent config:', e);
    return null;
  }
};

// Check if agent is fully configured
const isAgentConfigured = (step: WorkflowStep): boolean => {
  // If step is assigned to human, it's considered "configured" (no agent needed)
  if (step.assignedTo?.type === 'human') {
    return true;
  }
  
  // If step is assigned to AI, check if agent is configured
  if (step.assignedTo?.type === 'ai' && step.assignedTo?.agentName) {
    const agentConfig = getAgentConfig(step.assignedTo.agentName);
    if (!agentConfig) return false;
    
    // Check if agent has blueprint with at least one action
    const hasBlueprint = agentConfig.blueprint?.greenList?.length > 0;
    
    // Check if required integrations are set up
    const hasRequiredIntegrations = checkIntegrations(agentConfig, step);
    
    return hasBlueprint && hasRequiredIntegrations;
  }
  
  return false;
};

// Check if required integrations are set up
const checkIntegrations = (agentConfig: AgentConfiguration, step: WorkflowStep): boolean => {
  const blueprint = agentConfig.blueprint;
  const integrations = agentConfig.integrations;
  
  // Check Gmail integration
  const needsGmail = blueprint.greenList.some(action => 
    action.toLowerCase().includes('gmail') || 
    action.toLowerCase().includes('email') ||
    action.toLowerCase().includes('send') ||
    action.toLowerCase().includes('reply')
  );
  
  if (needsGmail && (!integrations.gmail || !integrations.gmail.authenticated)) {
    return false;
  }
  
  // Check Excel integration
  const needsExcel = blueprint.greenList.some(action => 
    action.toLowerCase().includes('excel') || 
    action.toLowerCase().includes('update') ||
    action.toLowerCase().includes('calculate')
  );
  
  if (needsExcel && (!integrations.excel || !integrations.excel.templateFile)) {
    return false;
  }
  
  // Check PDF integration
  const needsPDF = blueprint.greenList.some(action => 
    action.toLowerCase().includes('pdf') || 
    action.toLowerCase().includes('generate')
  );
  
  if (needsPDF && (!integrations.pdf || !integrations.pdf.templateFile)) {
    return false;
  }
  
  return true;
};

// Check workflow readiness
export const checkWorkflowReadiness = (workflow: Workflow): WorkflowReadiness => {
  const configuredSteps = workflow.steps.filter(isAgentConfigured);
  const missingSteps = workflow.steps
    .filter(step => !isAgentConfigured(step))
    .map(step => ({ stepId: step.id, stepLabel: step.label }));
  
  return {
    isReady: configuredSteps.length === workflow.steps.length,
    configuredSteps: configuredSteps.length,
    totalSteps: workflow.steps.length,
    missingSteps
  };
};

// Get workflow by ID
export const getWorkflowById = (workflowId: string): Workflow | null => {
  try {
    const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    return workflows.find((w: Workflow) => w.id === workflowId) || null;
  } catch (e) {
    console.error('Error loading workflow:', e);
    return null;
  }
};
