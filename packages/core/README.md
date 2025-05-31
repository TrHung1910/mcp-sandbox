# @mcp-sandbox/core

[![npm version](https://badge.fury.io/js/@mcp-sandbox%2Fcore.svg)](https://badge.fury.io/js/@mcp-sandbox%2Fcore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/danstarns/mcp-sandbox/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/danstarns/mcp-sandbox.svg)](https://github.com/danstarns/mcp-sandbox/issues)

Core library for [MCP Sandbox](https://github.com/danstarns/mcp-sandbox) - the engine that powers JavaScript to MCP conversion with automatic reflection and sandboxing.

## 🚀 Installation

```bash
npm install @mcp-sandbox/core
```

## 📖 Usage

### Basic Example

```typescript
import { MCPSandbox } from '@mcp-sandbox/core';

const sandbox = new MCPSandbox({
  port: 3000,
  timeout: 5000,
});

// Load a JavaScript module
await sandbox.loadModule('./my-module.js');

// Start the MCP server
await sandbox.start();

// Execute tools directly
const result = await sandbox.executeTool('myFunction', { param: 'value' });
```

### Advanced Configuration

```typescript
import { MCPSandbox, SandboxOptions } from '@mcp-sandbox/core';

const options: SandboxOptions = {
  port: 8080,
  host: '0.0.0.0',
  timeout: 10000,
  maxMemory: 128 * 1024 * 1024, // 128MB
};

const sandbox = new MCPSandbox(options);

// Load module with error handling
try {
  const config = await sandbox.loadModule('./utils.js');
  console.log(
    'Loaded tools:',
    config.tools.map((t) => t.name),
  );

  // Save configuration
  await sandbox.saveConfig('./mcp-config.json');

  // Start server
  await sandbox.start();
  console.log('MCP server running!');
} catch (error) {
  console.error('Failed to start sandbox:', error);
}
```

## 🏗️ Core Components

### MCPSandbox

Main orchestrator class that coordinates module loading, reflection, and server startup.

```typescript
class MCPSandbox {
  constructor(options?: SandboxOptions);

  // Load and analyze a JavaScript module
  async loadModule(modulePath: string): Promise<MCPConfig>;

  // Save MCP configuration to file
  async saveConfig(outputPath?: string): Promise<string>;

  // Start the MCP server
  async start(): Promise<Server>;

  // Execute a tool directly
  async executeTool(toolName: string, args: Record<string, any>): Promise<any>;

  // Get available tools
  getTools(): MCPTool[];
}
```

### ModuleReflector

Analyzes JavaScript modules using VM contexts to extract function signatures, parameters, and JSDoc documentation.

```typescript
class ModuleReflector {
  constructor(timeout?: number);

  // Reflect a module and extract tools
  async reflectModule(modulePath: string): Promise<{
    tools: MCPTool[];
    context: vm.Context;
  }>;
}
```

### ToolExecutor

Executes tools in sandboxed VM contexts with timeout and memory protection.

```typescript
class ToolExecutor {
  constructor(context: vm.Context, timeout?: number);

  // Add tools to the executor
  addTool(tool: MCPTool): void;
  addTools(tools: MCPTool[]): void;

  // Execute a tool safely
  async executeTool(toolName: string, args: Record<string, any>): Promise<ExecutionResult>;

  // Get available tools
  getTools(): MCPTool[];
}
```

### MCPServer

Express.js server that implements the MCP protocol with JSON-RPC 2.0 and SSE support.

```typescript
class MCPServer {
  constructor(options?: SandboxOptions);

  // Set the tool executor
  setExecutor(executor: ToolExecutor): void;

  // Generate MCP configuration
  generateMCPConfig(tools: MCPTool[]): MCPConfig;

  // Start the server
  async start(): Promise<Server>;
}
```

## 🔧 Types & Interfaces

```typescript
interface SandboxOptions {
  port?: number; // Server port (default: 3000)
  host?: string; // Server host (default: 'localhost')
  timeout?: number; // Execution timeout (default: 5000ms)
  maxMemory?: number; // Memory limit (default: 64MB)
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  handler: Function;
}

interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  toolName: string;
  executionTime: number;
}

interface MCPConfig {
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
```

## 🛡️ Security Features

- **VM Isolation** - Code runs in separate V8 contexts
- **Configurable Timeouts** - Prevent infinite loops and long-running operations
- **Memory Limits** - Prevent memory exhaustion attacks
- **Controlled Requires** - Limited module access in sandbox environment
- **Input Validation** - Parameter type checking and validation

## 💡 Example: Creating a Math Utilities MCP Server

```javascript
// math-utils.js
/**
 * Calculate the area of a circle
 * @param radius The radius of the circle
 */
function circleArea(radius = 1) {
  if (radius < 0) throw new Error('Radius cannot be negative');
  return Math.PI * radius * radius;
}

/**
 * Generate fibonacci sequence
 * @param count Number of fibonacci numbers to generate
 */
function fibonacci(count = 10) {
  if (count < 1) return [];
  const seq = [0, 1];
  for (let i = 2; i < count; i++) {
    seq[i] = seq[i - 1] + seq[i - 2];
  }
  return seq.slice(0, count);
}

module.exports = { circleArea, fibonacci };
```

```typescript
// server.ts
import { MCPSandbox } from '@mcp-sandbox/core';

async function main() {
  const sandbox = new MCPSandbox({ port: 3000 });

  // Load the math utilities
  await sandbox.loadModule('./math-utils.js');

  // Start the server
  await sandbox.start();

  // Test the tools
  const area = await sandbox.executeTool('circleArea', { radius: 5 });
  console.log('Circle area:', area.result);

  const fib = await sandbox.executeTool('fibonacci', { count: 8 });
  console.log('Fibonacci:', fib.result);
}

main().catch(console.error);
```

## 🔗 Related Packages

- [`@mcp-sandbox/cli`](https://www.npmjs.com/package/@mcp-sandbox/cli) - Command-line interface
- [`@mcp-sandbox/utils`](https://www.npmjs.com/package/@mcp-sandbox/utils) - Shared utilities

## 📚 Documentation

For complete examples and advanced usage patterns, see the [main documentation](https://github.com/danstarns/mcp-sandbox/blob/main/README.md).

## 🐛 Issues & Support

- **Report bugs**: [GitHub Issues](https://github.com/danstarns/mcp-sandbox/issues)
- **Documentation**: [GitHub Repository](https://github.com/danstarns/mcp-sandbox)

## 📄 License

MIT License - see [LICENSE](https://github.com/danstarns/mcp-sandbox/blob/main/LICENSE) for details.

## 🔗 Links

- **Main Repository**: [https://github.com/danstarns/mcp-sandbox](https://github.com/danstarns/mcp-sandbox)
- **NPM Package**: [https://www.npmjs.com/package/@mcp-sandbox/core](https://www.npmjs.com/package/@mcp-sandbox/core)
- **CLI Package**: [https://www.npmjs.com/package/@mcp-sandbox/cli](https://www.npmjs.com/package/@mcp-sandbox/cli)
