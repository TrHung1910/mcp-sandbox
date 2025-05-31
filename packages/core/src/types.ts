// packages/core/src/types.ts - Updated with MCP-specific types
export interface MCPToolParameter {
  name: string;
  hasDefault: boolean;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  handler: Function;
}

export interface MCPConfig {
  name: string;
  version: string;
  description: string;
  tools: Omit<MCPTool, 'handler'>[];
  capabilities: {
    tools: boolean;
    sampling: boolean;
    logging: boolean;
  };
  endpoints: {
    tools: string;
    execute: string;
    sse?: string;
    jsonrpc?: string;
  };
}

export interface SandboxOptions {
  port?: number;
  host?: string;
  timeout?: number;
  maxMemory?: number;
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  toolName: string;
  executionTime: number;
}

export interface ModuleExports {
  [key: string]: any;
}

// MCP-specific types
export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPCapabilities {
  tools?: {};
  logging?: {};
  prompts?: {};
  resources?: {};
}

export interface MCPServerInfo {
  name: string;
  version: string;
}
