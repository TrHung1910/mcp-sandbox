# @mcp-sandbox/core

Core library for MCP Sandbox - the engine that powers JavaScript to MCP conversion.

## Installation

```bash
npm install @mcp-sandbox/core
```

## Usage

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

## Core Components

### MCPSandbox

Main orchestrator class that coordinates module loading, reflection, and server startup.

### ModuleReflector

Analyzes JavaScript modules using VM contexts to extract function signatures, parameters, and JSDoc documentation.

### ToolExecutor

Executes tools in sandboxed VM contexts with timeout and memory protection.

### MCPServer

Express.js server that implements the MCP protocol with JSON-RPC 2.0 and SSE support.

## Security Features

- VM isolation for code execution
- Configurable timeouts and memory limits
- Controlled module require() access
- Input validation and type checking

## API Reference

See the [main documentation](https://github.com/danstarns/mcp-sandbox/blob/main/README.md) for complete API reference.
