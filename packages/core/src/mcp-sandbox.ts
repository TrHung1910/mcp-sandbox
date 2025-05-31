import * as fs from 'fs/promises';
import * as path from 'path';
import { ModuleReflector } from './reflection';
import { ToolExecutor } from './sandbox';
import { MCPServer } from './server';
import { SandboxOptions, MCPConfig } from './types';

export class MCPSandbox {
  private reflector: ModuleReflector;
  private executor: ToolExecutor | null = null;
  private server: MCPServer;

  constructor(options: SandboxOptions = {}) {
    this.reflector = new ModuleReflector(options.timeout);
    this.server = new MCPServer(options);
  }

  /**
   * Load and initialize a JavaScript module
   */
  async loadModule(modulePath: string): Promise<MCPConfig> {
    console.log(`🔍 Reflecting module: ${modulePath}`);

    const { tools, context } = await this.reflector.reflectModule(modulePath);

    console.log(`📊 Discovered ${tools.length} tools:`);
    tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    this.executor = new ToolExecutor(context);
    this.executor.addTools(tools);
    this.server.setExecutor(this.executor);

    const config = this.server.generateMCPConfig(tools);
    return config;
  }

  /**
   * Save MCP configuration to a file
   */
  async saveConfig(outputPath?: string): Promise<string> {
    if (!this.executor) {
      throw new Error('No module loaded. Call loadModule() first.');
    }

    const tools = this.executor.getTools();
    const config = this.server.generateMCPConfig(tools);
    const configPath = outputPath || path.join(process.cwd(), 'mcp-config.json');

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`📄 MCP configuration saved to: ${configPath}`);

    return configPath;
  }

  /**
   * Start the MCP server
   */
  async start() {
    if (!this.executor) {
      throw new Error('No module loaded. Call loadModule() first.');
    }
    return this.server.start();
  }

  /**
   * Execute a tool directly
   */
  async executeTool(toolName: string, args: Record<string, any> = {}) {
    if (!this.executor) {
      throw new Error('No module loaded. Call loadModule() first.');
    }
    return this.executor.executeTool(toolName, args);
  }

  /**
   * Get available tools
   */
  getTools() {
    if (!this.executor) {
      return [];
    }
    return this.executor.getTools();
  }
}
