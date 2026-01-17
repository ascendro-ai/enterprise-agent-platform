
export enum Screen {
  CONSULTANT = 'CONSULTANT',
  ORG_CHART = 'ORG_CHART',
  CONTROL_ROOM = 'CONTROL_ROOM',
  TEST_SUITE = 'TEST_SUITE',
  ANALYTICS = 'ANALYTICS',
  DEMO_ENVIRONMENT = 'DEMO_ENVIRONMENT',
}

export interface ChatMessage {
  id: string;
  sender: 'system' | 'user';
  text: string;
  timestamp: Date;
}

export interface WorkflowStep {
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
