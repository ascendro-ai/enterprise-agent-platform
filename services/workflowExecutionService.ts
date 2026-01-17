import { Workflow, WorkflowExecution, WorkflowStep, ControlRoomUpdate } from '../types';
import { getWorkflowById, getAgentConfig } from './workflowReadinessService';

// Store active executions
const activeExecutions = new Map<string, WorkflowExecution>();

// Emit control room updates
const emitControlRoomUpdate = (update: ControlRoomUpdate) => {
  window.dispatchEvent(new CustomEvent('controlRoomUpdate', { detail: update }));
};


// Start workflow execution
export const startWorkflowExecution = async (
  workflowId: string,
  digitalWorkerName: string
): Promise<WorkflowExecution> => {
  const workflow = getWorkflowById(workflowId);
  if (!workflow) {
    throw new Error('Workflow not found');
  }
  
  const execution: WorkflowExecution = {
    id: `exec-${Date.now()}`,
    workflowId,
    digitalWorkerName,
    status: 'running',
    currentStepIndex: 0,
    stepExecutions: workflow.steps.map(step => ({
      stepId: step.id,
      agentName: step.assignedTo?.agentName || step.assignedTo?.type === 'human' ? 'Human' : 'Unknown',
      status: 'pending'
    })),
    startedAt: new Date()
  };
  
  activeExecutions.set(execution.id, execution);
  
  // Start executing steps sequentially
  executeWorkflowSteps(execution);
  
  return execution;
};

// Execute workflow steps sequentially
const executeWorkflowSteps = async (execution: WorkflowExecution) => {
  const workflow = getWorkflowById(execution.workflowId);
  if (!workflow) {
    execution.status = 'error';
    return;
  }
  
  for (let i = execution.currentStepIndex; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const stepExecution = execution.stepExecutions[i];
    
    // Update step status
    stepExecution.status = 'running';
    stepExecution.startedAt = new Date();
    execution.currentStepIndex = i;
    
    // Emit event to Control Room
    emitControlRoomUpdate({
      type: 'step_started',
      executionId: execution.id,
      workflowId: workflow.id,
      workflowName: workflow.name,
      stepId: step.id,
      stepLabel: step.label,
      stepNumber: i + 1,
      totalSteps: workflow.steps.length,
      agentName: stepExecution.agentName
    });
    
    try {
      // Execute the agent for this step
      const result = await executeAgentStep(step, execution);
      
      stepExecution.status = 'completed';
      stepExecution.completedAt = new Date();
      stepExecution.result = result;
      
      // Emit completion event
      emitControlRoomUpdate({
        type: 'step_completed',
        executionId: execution.id,
        workflowId: workflow.id,
        workflowName: workflow.name,
        stepId: step.id,
        stepLabel: step.label,
        stepNumber: i + 1,
        totalSteps: workflow.steps.length,
        agentName: stepExecution.agentName,
        result
      });
      
      // Small delay between steps for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      stepExecution.status = 'failed';
      stepExecution.error = error.message;
      execution.status = 'error';
      
      emitControlRoomUpdate({
        type: 'step_failed',
        executionId: execution.id,
        workflowId: workflow.id,
        workflowName: workflow.name,
        stepId: step.id,
        stepLabel: step.label,
        stepNumber: i + 1,
        totalSteps: workflow.steps.length,
        agentName: stepExecution.agentName,
        error: error.message
      });
      
      break; // Stop execution on error
    }
  }
  
  // Check if all steps completed
  if (execution.stepExecutions.every(se => se.status === 'completed')) {
    execution.status = 'completed';
    execution.completedAt = new Date();
    
    emitControlRoomUpdate({
      type: 'workflow_completed',
      executionId: execution.id,
      workflowId: workflow.id,
      workflowName: workflow.name
    });
  }
};

// Execute a single agent step
const executeAgentStep = async (step: WorkflowStep, execution: WorkflowExecution): Promise<any> => {
  // If assigned to human, just return a placeholder
  if (step.assignedTo?.type === 'human') {
    return { 
      message: `Human task: ${step.label}`,
      type: 'human',
      status: 'pending_human_action'
    };
  }
  
  // Get agent configuration
  const agentName = step.assignedTo?.agentName;
  if (!agentName) {
    throw new Error('Agent name not found');
  }
  
  const agentConfig = getAgentConfig(agentName);
  if (!agentConfig) {
    throw new Error(`Agent configuration not found for ${agentName}`);
  }
  
  // Based on agent blueprint, execute the appropriate actions
  const blueprint = agentConfig.blueprint;
  
  // Simulate execution based on blueprint actions
  // In a real implementation, this would call actual Gmail/Excel/PDF services
  const results: any[] = [];
  
  for (const action of blueprint.greenList) {
    if (action.toLowerCase().includes('email') || action.toLowerCase().includes('gmail') || action.toLowerCase().includes('send')) {
      results.push({
        type: 'gmail',
        action: action,
        status: 'completed',
        message: `Executed: ${action}`
      });
    } else if (action.toLowerCase().includes('excel') || action.toLowerCase().includes('update')) {
      results.push({
        type: 'excel',
        action: action,
        status: 'completed',
        message: `Executed: ${action}`
      });
    } else if (action.toLowerCase().includes('pdf') || action.toLowerCase().includes('generate')) {
      results.push({
        type: 'pdf',
        action: action,
        status: 'completed',
        message: `Executed: ${action}`
      });
    } else {
      results.push({
        type: 'general',
        action: action,
        status: 'completed',
        message: `Executed: ${action}`
      });
    }
  }
  
  return {
    stepLabel: step.label,
    agentName: agentName,
    actions: results,
    timestamp: new Date().toISOString()
  };
};

// Get active execution
export const getActiveExecution = (executionId: string): WorkflowExecution | undefined => {
  return activeExecutions.get(executionId);
};

// Get all active executions
export const getAllActiveExecutions = (): WorkflowExecution[] => {
  return Array.from(activeExecutions.values());
};

// Pause execution
export const pauseWorkflowExecution = (executionId: string): boolean => {
  const execution = activeExecutions.get(executionId);
  if (execution && execution.status === 'running') {
    execution.status = 'paused';
    return true;
  }
  return false;
};

// Resume execution
export const resumeWorkflowExecution = (executionId: string): boolean => {
  const execution = activeExecutions.get(executionId);
  if (execution && execution.status === 'paused') {
    execution.status = 'running';
    executeWorkflowSteps(execution);
    return true;
  }
  return false;
};
