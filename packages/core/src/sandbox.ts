import * as vm from 'vm';
import { MCPTool, ExecutionResult } from './types';

export class ToolExecutor {
  private timeout: number;
  private context: vm.Context;
  private tools: Map<string, MCPTool>;

  constructor(context: vm.Context, timeout: number = 5000) {
    this.context = context;
    this.timeout = timeout;
    this.tools = new Map();
  }

  addTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  addTools(tools: MCPTool[]): void {
    tools.forEach((tool) => this.addTool(tool));
  }

  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool in the sandbox
   */
  async executeTool(toolName: string, args: Record<string, any> = {}): Promise<ExecutionResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    const startTime = Date.now();

    try {
      // Create execution context with memory limits
      const executionContext = {
        ...this.context,
        args,
        result: null,
        error: null,
      };

      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Execution timeout'));
        }, this.timeout);

        try {
          const output = tool.handler.apply(executionContext, Object.values(args));
          clearTimeout(timeout);

          if (output instanceof Promise) {
            output.then(resolve).catch(reject);
          } else {
            resolve(output);
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });

      return {
        success: true,
        result,
        toolName,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        toolName,
        executionTime: Date.now() - startTime,
      };
    }
  }
}
