/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { Server } from 'http';
import { MCPConfig, MCPTool, SandboxOptions } from './types';
import { ToolExecutor } from './sandbox';

interface MCPMessage {
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

interface SSEClient {
  id: string;
  response: Response;
  lastPing: number;
}

export class MCPServer {
  private app: Express;
  private executor: ToolExecutor | null = null;
  private options: Required<SandboxOptions>;
  private sseClients: Map<string, SSEClient> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(options: SandboxOptions = {}) {
    this.options = {
      port: options.port || 3000,
      host: options.host || 'localhost',
      timeout: options.timeout || 5000,
      maxMemory: options.maxMemory || 64 * 1024 * 1024,
    };

    this.app = express();
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    // Add request logging
    this.app.use((req: Request, res: Response, next) => {
      console.log(`📨 ${req.method} ${req.url} - ${req.headers['user-agent']?.slice(0, 50)}...`);
      next();
    });

    // Handle preflight OPTIONS requests
    this.app.options('*', (req: Request, res: Response) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Accept, Authorization');
      res.status(200).send();
    });

    this.app.use(
      cors({
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Cache-Control', 'Accept', 'Authorization'],
      }),
    );
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  setExecutor(executor: ToolExecutor): void {
    this.executor = executor;
    this.setupRoutes();
    this.startPingInterval();
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      for (const [clientId, client] of this.sseClients.entries()) {
        if (now - client.lastPing > 60000) {
          // Remove stale clients after 1 minute
          try {
            client.response.end();
          } catch (e) {
            // Ignore error if already closed
          }
          this.sseClients.delete(clientId);
          console.log(`🗑️  Removed stale SSE client: ${clientId}`);
        }
      }
    }, 30000);
  }

  private sendSSEMessage(clientId: string, data: any): void {
    const client = this.sseClients.get(clientId);
    if (client && !client.response.destroyed) {
      try {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        client.response.write(message);
        client.lastPing = Date.now();
      } catch (error) {
        console.log(`❌ Error sending SSE message to client ${clientId}, removing client`);
        this.sseClients.delete(clientId);
      }
    }
  }

  private broadcastSSEMessage(data: any): void {
    for (const clientId of this.sseClients.keys()) {
      this.sendSSEMessage(clientId, data);
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate MCP server configuration
   */
  generateMCPConfig(tools: MCPTool[]): MCPConfig {
    return {
      name: 'mcp-sandbox',
      version: '1.0.0',
      description: 'Dynamically generated MCP server from JavaScript module',
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
      capabilities: {
        tools: true,
        sampling: false,
        logging: true,
      },
      endpoints: {
        tools: `http://${this.options.host}:${this.options.port}/mcp/tools`,
        execute: `http://${this.options.host}:${this.options.port}/mcp/execute`,
        sse: `http://${this.options.host}:${this.options.port}/sse`,
        jsonrpc: `http://${this.options.host}:${this.options.port}/mcp/jsonrpc`,
      },
    };
  }

  private async handleMCPRequest(message: MCPMessage): Promise<MCPMessage> {
    console.log(`🔧 Handling MCP request: ${message.method}`);

    try {
      switch (message.method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                logging: {},
              },
              serverInfo: {
                name: 'mcp-sandbox',
                version: '1.0.0',
              },
            },
          };

        case 'notifications/initialized':
          console.log('✅ Client initialized');
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: {},
          };

        case 'tools/list': {
          const tools = this.executor!.getTools().map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          }));
          console.log(`📋 Returning ${tools.length} tools`);
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: { tools },
          };
        }

        case 'tools/call': {
          if (!message.params?.name) {
            throw new Error('Tool name is required');
          }

          console.log(`⚡ Executing tool: ${message.params.name}`);
          const result = await this.executor!.executeTool(message.params.name, message.params.arguments || {});

          if (!result.success) {
            throw new Error(result.error || 'Tool execution failed');
          }

          return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result.result, null, 2),
                },
              ],
              isError: false,
            },
          };
        }

        case 'ping':
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: { pong: true },
          };

        default:
          console.log(`❓ Unknown method: ${message.method}`);
          throw new Error(`Unknown method: ${message.method}`);
      }
    } catch (error) {
      console.error(`❌ Error handling ${message.method}:`, error);
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      };
    }
  }

  /**
   * Setup API routes with MCP SSE support
   */
  private setupRoutes(): void {
    if (!this.executor) {
      throw new Error('Executor not set. Call setExecutor() first.');
    }

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        tools: this.executor!.getTools().map((t) => t.name),
        clients: this.sseClients.size,
      });
    });

    // Main SSE endpoint for MCP Inspector
    this.app.get('/sse', (req: Request, res: Response) => {
      const clientId = this.generateClientId();
      console.log(`🔗 New SSE client connected: ${clientId}`);

      // Set proper SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'X-Accel-Buffering': 'no',
      });

      // Send immediate connection confirmation
      res.write(': connected\n\n');
      res.flushHeaders();

      // Add client to tracking
      this.sseClients.set(clientId, {
        id: clientId,
        response: res,
        lastPing: Date.now(),
      });

      // Send initialization after short delay
      setTimeout(() => {
        if (this.sseClients.has(clientId)) {
          this.sendSSEMessage(clientId, {
            jsonrpc: '2.0',
            method: 'notifications/initialized',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                logging: {},
              },
              serverInfo: {
                name: 'mcp-sandbox',
                version: '1.0.0',
              },
            },
          });

          // Send available tools
          setTimeout(() => {
            if (this.sseClients.has(clientId)) {
              const tools = this.executor!.getTools().map((tool) => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
              }));

              this.sendSSEMessage(clientId, {
                jsonrpc: '2.0',
                method: 'notifications/tools_changed',
                params: { tools },
              });
            }
          }, 100);
        }
      }, 50);

      // Handle client disconnect
      req.on('close', () => {
        console.log(`🔌 SSE client disconnected: ${clientId}`);
        this.sseClients.delete(clientId);
      });

      req.on('error', (error) => {
        console.log(`❌ SSE client error: ${clientId}`, error);
        this.sseClients.delete(clientId);
      });

      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        if (this.sseClients.has(clientId) && !res.destroyed) {
          try {
            res.write(': heartbeat\n\n');
          } catch (e) {
            clearInterval(heartbeat);
            this.sseClients.delete(clientId);
          }
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);
    });

    // Alternative MCP SSE endpoint (for compatibility)
    this.app.get('/mcp/sse', (req: Request, res: Response) => {
      // Redirect to main SSE endpoint
      req.url = '/sse';
      this.app._router.handle(req, res, () => {});
    });

    // MCP JSON-RPC endpoint
    this.app.post('/mcp/jsonrpc', async (req: Request, res: Response) => {
      try {
        const message: MCPMessage = req.body;
        const response = await this.handleMCPRequest(message);

        // Broadcast tool execution to SSE clients
        if (message.method === 'tools/call') {
          this.broadcastSSEMessage({
            jsonrpc: '2.0',
            method: 'notifications/tool_result',
            params: {
              toolName: message.params?.name,
              arguments: message.params?.arguments,
              result: response.result,
              timestamp: Date.now(),
            },
          });
        }

        res.json(response);
      } catch (error) {
        console.error('❌ JSON-RPC error:', error);
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body?.id || null,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error',
          },
        });
      }
    });

    // Legacy REST endpoints for compatibility
    this.app.get('/tools', (req: Request, res: Response) => {
      const toolList = this.executor!.getTools().map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      res.json({ tools: toolList });
    });

    this.app.post('/execute/:toolName', async (req: Request, res: Response) => {
      const { toolName } = req.params;
      const args = req.body.args || {};

      try {
        const result = await this.executor!.executeTool(toolName, args);

        // Broadcast to SSE clients
        this.broadcastSSEMessage({
          jsonrpc: '2.0',
          method: 'notifications/tool_result',
          params: {
            toolName,
            arguments: args,
            result,
            timestamp: Date.now(),
          },
        });

        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          toolName,
        });
      }
    });

    // MCP-specific tool endpoints
    this.app.get('/mcp/tools', (req: Request, res: Response) => {
      const tools = this.executor!.getTools().map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      res.json({
        jsonrpc: '2.0',
        result: { tools },
      });
    });

    this.app.post('/mcp/execute', async (req: Request, res: Response) => {
      const { toolName, arguments: args } = req.body;

      try {
        const result = await this.executor!.executeTool(toolName, args || {});

        this.broadcastSSEMessage({
          jsonrpc: '2.0',
          method: 'notifications/tool_result',
          params: {
            toolName,
            arguments: args,
            result,
            timestamp: Date.now(),
          },
        });

        res.json({
          jsonrpc: '2.0',
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.result, null, 2),
              },
            ],
            isError: !result.success,
          },
        });
      } catch (error) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : String(error),
          },
        });
      }
    });

    // Get MCP configuration
    this.app.get('/mcp-config', (req: Request, res: Response) => {
      const tools = this.executor!.getTools();
      const config = this.generateMCPConfig(tools);
      res.json(config);
    });

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      if (req.headers.accept?.includes('text/event-stream')) {
        // Redirect SSE requests to /sse
        req.url = '/sse';
        this.app._router.handle(req, res, () => {});
      } else {
        // Return server info
        res.json({
          name: 'mcp-sandbox',
          version: '1.0.0',
          description: 'MCP Sandbox Server',
          endpoints: this.generateMCPConfig(this.executor!.getTools()).endpoints,
          activeClients: this.sseClients.size,
        });
      }
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<Server> {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.options.port, this.options.host, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`🚀 MCP Sandbox server running at http://${this.options.host}:${this.options.port}`);
          console.log(`📋 MCP Tools: http://${this.options.host}:${this.options.port}/mcp/tools`);
          console.log(`⚡ MCP Execute: http://${this.options.host}:${this.options.port}/mcp/execute`);
          console.log(`🔄 MCP SSE: http://${this.options.host}:${this.options.port}/sse`);
          console.log(`📡 MCP JSON-RPC: http://${this.options.host}:${this.options.port}/mcp/jsonrpc`);
          console.log(`⚙️  MCP Config: http://${this.options.host}:${this.options.port}/mcp-config`);
          console.log(`💡 For MCP Inspector, use: http://${this.options.host}:${this.options.port}/sse`);
          resolve(server);
        }
      });

      // Cleanup on server close
      server.on('close', () => {
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
        }
        for (const client of this.sseClients.values()) {
          try {
            client.response.end();
          } catch (e) {
            // Ignore if already closed
          }
        }
        this.sseClients.clear();
      });
    });
  }
}
