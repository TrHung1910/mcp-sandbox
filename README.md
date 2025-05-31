# MCP Sandbox

[![npm version](https://badge.fury.io/js/@mcp-sandbox%2Fcli.svg)](https://badge.fury.io/js/@mcp-sandbox%2Fcli)
[![npm downloads](https://img.shields.io/npm/dm/@mcp-sandbox/cli.svg)](https://www.npmjs.com/package/@mcp-sandbox/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/danstarns/mcp-sandbox/blob/main/LICENSE)

<p align=center>
  <img width="80%" src="https://raw.githubusercontent.com/danstarns/mcp-sandbox/main/docs/banner.png#gh-dark-mode-only" alt="MCP Sandbox"/>
</p>

**Turn any JavaScript module into a sandboxed MCP (Model Context Protocol) server with automatic reflection and type inference.**

## 🎯 What is MCP Sandbox?

MCP Sandbox automatically converts JavaScript modules into MCP (Model Context Protocol) compatible servers, making any JavaScript function accessible to AI systems. It uses VM sandboxing for security, automatic type inference, and generates proper MCP configurations.

## ✨ Features

- 🔍 **Automatic Reflection** - Analyzes JS modules and extracts function signatures
- 🛡️ **Secure Sandboxing** - Executes code in isolated VM contexts with timeouts
- 🧠 **Smart Type Inference** - Detects parameter types from defaults and naming patterns
- 📚 **JSDoc Integration** - Extracts documentation from function comments
- 📡 **MCP Protocol** - Full JSON-RPC 2.0 and SSE support
- 🌐 **REST API** - Legacy REST endpoints for easy testing
- ⚙️ **TypeScript** - Full type safety and IntelliSense support

## 🚀 Quick Start

### Installation

```bash
# Install globally for CLI usage
npm install -g @mcp-sandbox/cli

# Or use in a project
npm install @mcp-sandbox/core @mcp-sandbox/cli
```

### Basic Usage

```bash
# Start MCP server for a JavaScript module
mcp-sandbox start ./my-utils.js

# Analyze a module without starting server
mcp-sandbox inspect ./helpers.js

# Generate MCP configuration
mcp-sandbox generate lodash --output config.json
```

### Example Module

```javascript
/**
 * Calculate the area of a circle
 * @param radius The radius of the circle
 */
function circleArea(radius = 1) {
  return Math.PI * radius * radius;
}

/**
 * Generate fibonacci sequence
 * @param count Number of fibonacci numbers to generate
 */
function fibonacci(count = 10) {
  const seq = [0, 1];
  for (let i = 2; i < count; i++) {
    seq[i] = seq[i - 1] + seq[i - 2];
  }
  return seq.slice(0, count);
}

module.exports = { circleArea, fibonacci };
```

Running `mcp-sandbox start math-utils.js` automatically:

1. 🔍 Reflects the module and discovers functions
2. 📊 Generates type schemas from parameters
3. 🚀 Starts MCP server at `http://localhost:3000`
4. 💾 Creates `mcp-config.json` for MCP clients

## 📡 API Endpoints

The server exposes both MCP and REST endpoints:

### MCP Protocol (JSON-RPC 2.0)

- `POST /mcp/jsonrpc` - Main MCP endpoint
- `GET /sse` - Server-Sent Events for real-time updates

### REST API (for testing)

- `GET /tools` - List available tools
- `POST /execute/:toolName` - Execute a specific tool
- `GET /mcp-config` - Get MCP server configuration
- `GET /health` - Health check

### Example Usage

```bash
# List tools
curl http://localhost:3000/tools

# Execute function via REST
curl -X POST http://localhost:3000/execute/circleArea \
  -H "Content-Type: application/json" \
  -d '{"args": {"radius": 5}}'

# MCP JSON-RPC call
curl -X POST http://localhost:3000/mcp/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "fibonacci", "arguments": {"count": 8}}}'
```

## 🏗️ Programmatic Usage

```typescript
import { MCPSandbox } from '@mcp-sandbox/core';

const sandbox = new MCPSandbox({
  port: 3000,
  timeout: 5000,
});

// Load and analyze module
await sandbox.loadModule('./my-module.js');

// Start MCP server
await sandbox.start();

// Execute tools directly
const result = await sandbox.executeTool('myFunction', {
  param1: 'value1',
});
```

## 📚 Example Modules Included

The repository includes several example modules demonstrating different use cases:

### Mathematical Operations ([`examples/math-utils.js`](https://github.com/danstarns/mcp-sandbox/blob/main/examples/math-utils.js))

- Circle area calculation
- Fibonacci sequence generation
- Compound interest calculation
- Prime number checking
- Degree/radian conversion
- Factorial calculation

### String Manipulation ([`examples/string-utils.js`](https://github.com/danstarns/mcp-sandbox/blob/main/examples/string-utils.js))

- Title case conversion
- Random string generation
- Word counting
- Palindrome detection
- String reversal
- Capitalization

### Array Operations ([`examples/array-utils.js`](https://github.com/danstarns/mcp-sandbox/blob/main/examples/array-utils.js))

- Array shuffling (Fisher-Yates)
- Unique value extraction
- Array chunking
- Set operations (intersection, difference)
- Array flattening

### Filesystem Operations ([`examples/filesystem-utils.js`](https://github.com/danstarns/mcp-sandbox/blob/main/examples/filesystem-utils.js))

- File reading/writing (async)
- Directory listing and creation
- File searching with patterns
- Disk usage calculation
- File copying and deletion
- Line-by-line file reading

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/danstarns/mcp-sandbox.git
cd mcp-sandbox

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run examples
pnpm example:math          # Math utilities
pnpm example:filesystem    # File operations
pnpm example:string        # String manipulation

# Lint and format
pnpm lint && pnpm format
```

## 🔧 Configuration Options

### CLI Options

```bash
mcp-sandbox start <module> [options]

Options:
  -p, --port <port>      Server port (default: 3000)
  -h, --host <host>      Server host (default: localhost)
  -t, --timeout <ms>     Execution timeout (default: 5000ms)
  -o, --output <file>    Output MCP configuration to file
```

### Programmatic Options

```typescript
interface SandboxOptions {
  port?: number; // Server port (default: 3000)
  host?: string; // Server host (default: 'localhost')
  timeout?: number; // Execution timeout (default: 5000ms)
  maxMemory?: number; // Memory limit (default: 64MB)
}
```

## 🔒 Security Features

- **VM Isolation** - Code runs in separate V8 contexts
- **Execution Timeouts** - Configurable time limits prevent infinite loops
- **Memory Limits** - Prevent memory exhaustion attacks
- **Controlled Requires** - Limited module access in sandbox
- **Input Validation** - Parameter type checking and validation

## 🎮 Testing with MCP Inspector

1. Start your MCP server: `mcp-sandbox start examples/math-utils.js`
2. Open [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
3. Set Transport Type to "Streamable HTTP"
4. Enter URL: `http://localhost:3000/mcp/jsonrpc`
5. Connect and test your tools!

## 📦 Packages

This is a monorepo containing multiple packages:

- [`@mcp-sandbox/cli`](https://www.npmjs.com/package/@mcp-sandbox/cli) - Command-line interface
- [`@mcp-sandbox/core`](https://www.npmjs.com/package/@mcp-sandbox/core) - Core library
- [`@mcp-sandbox/utils`](https://www.npmjs.com/package/@mcp-sandbox/utils) - Shared utilities

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/danstarns/mcp-sandbox/blob/main/CONTRIBUTING.md) and check out the [open issues](https://github.com/danstarns/mcp-sandbox/issues).

## 📄 License

MIT License - see [LICENSE](https://github.com/danstarns/mcp-sandbox/blob/main/LICENSE) for details.

## 🔗 Links

- **GitHub Repository**: [https://github.com/danstarns/mcp-sandbox](https://github.com/danstarns/mcp-sandbox)
- **Issues**: [https://github.com/danstarns/mcp-sandbox/issues](https://github.com/danstarns/mcp-sandbox/issues)
- **NPM CLI Package**: [https://www.npmjs.com/package/@mcp-sandbox/cli](https://www.npmjs.com/package/@mcp-sandbox/cli)
- **NPM Core Package**: [https://www.npmjs.com/package/@mcp-sandbox/core](https://www.npmjs.com/package/@mcp-sandbox/core)
