
export enum Screen {
  CONSULTANT = 'CONSULTANT',
  WORKFLOWS = 'WORKFLOWS',
  ORG_CHART = 'ORG_CHART',
  CONTROL_ROOM = 'CONTROL_ROOM',
  TEST_SUITE = 'TEST_SUITE',
  ANALYTICS = 'ANALYTICS',
}

export interface ChatMessage {
  id: string;
  sender: 'system' | 'user';
  text: string;
  timestamp: Date;
}

// Legacy interface - kept for backward compatibility
export interface WorkflowStepLegacy {
  id: string;
  label: string;
  completed: boolean;
}

export interface AgentNode {
  id: string;
  type: 'ai' | 'human';
  label: string;
  role?: string;
  avatar?: string;
  children?: AgentNode[];
}

export interface AgentMetric {
  name: string;
  status: 'working' | 'waiting' | 'offline';
  tasksPerHour: number[];
  logs: string[];
}

export interface LogEntry {
  id: string;
  agent: string;
  action: string;
  target?: string;
  timestamp: string;
  status: 'success' | 'info' | 'warning';
}

export interface WorkflowStep {
  id: string;
  label: string;
  type: 'trigger' | 'action' | 'decision' | 'end';
  assignedTo?: {
    type: 'ai' | 'human';
    agentId?: string;
    agentName?: string;
  };
  order: number;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  assignedTo?: {
    stakeholderId?: string;
    stakeholderName?: string;
    stakeholderType?: 'ai' | 'human';
  };
  status?: 'draft' | 'active' | 'paused';
}

// Agent Configuration
export interface AgentConfiguration {
  id: string;
  name: string;
  stepId: string;
  workflowId: string;
  blueprint: {
    greenList: string[];
    redList: string[];
  };
  integrations: {
    gmail?: { authenticated: boolean; account?: string };
    excel?: { templateFile?: string; operations: string[] };
    pdf?: { templateFile?: string; operations: string[] };
  };
  triggers: string[];
  actions: Array<{
    type: 'gmail' | 'excel' | 'pdf' | 'notification';
    description: string;
    config: any;
  }>;
  status: 'configured' | 'active' | 'paused';
  createdAt: Date;
}

// Workflow Readiness
export interface WorkflowReadiness {
  isReady: boolean;
  configuredSteps: number;
  totalSteps: number;
  missingSteps: Array<{ stepId: string; stepLabel: string }>;
}

// Workflow Execution
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  digitalWorkerName: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  currentStepIndex: number;
  stepExecutions: Array<{
    stepId: string;
    agentName: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt?: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
  }>;
  startedAt: Date;
  completedAt?: Date;
}

// Control Room Update Event
export interface ControlRoomUpdate {
  type: 'step_started' | 'step_completed' | 'step_failed' | 'workflow_completed';
  executionId: string;
  workflowId?: string;
  workflowName?: string;
  stepId?: string;
  stepLabel?: string;
  stepNumber?: number;
  totalSteps?: number;
  agentName?: string;
  result?: any;
  error?: string;
}
