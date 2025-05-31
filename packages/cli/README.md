# @mcp-sandbox/cli

[![npm version](https://badge.fury.io/js/@mcp-sandbox%2Fcli.svg)](https://badge.fury.io/js/@mcp-sandbox%2Fcli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/danstarns/mcp-sandbox/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/danstarns/mcp-sandbox.svg)](https://github.com/danstarns/mcp-sandbox/issues)

Command-line interface for [MCP Sandbox](https://github.com/danstarns/mcp-sandbox) - turn any JavaScript module into a sandboxed MCP (Model Context Protocol) server.

## 🚀 Installation

```bash
# Global installation
npm install -g @mcp-sandbox/cli

# Local installation
npm install @mcp-sandbox/cli
```

## 📋 Commands

### `start`

Start an MCP server for a JavaScript module.

```bash
mcp-sandbox start <module> [options]

Options:
  -p, --port <port>      Server port (default: 3000)
  -h, --host <host>      Server host (default: localhost)
  -t, --timeout <ms>     Execution timeout (default: 5000ms)
  -o, --output <file>    Output MCP configuration to file
```

### `inspect`

Analyze a module without starting the server.

```bash
mcp-sandbox inspect <module> [options]

Options:
  -o, --output <file>    Output analysis report to file
```

### `generate`

Generate MCP configuration for a module.

```bash
mcp-sandbox generate <module> [options]

Options:
  -o, --output <file>    Output file (default: mcp-config.json)
```

## 💡 Examples

```bash
# Start server for local module
mcp-sandbox start ./utils.js --port 8080

# Analyze npm package
mcp-sandbox inspect lodash --output analysis.json

# Generate config for module
mcp-sandbox generate ./my-tools.js --output tools-config.json

# Start server with custom configuration
mcp-sandbox start ./math-utils.js --host 0.0.0.0 --timeout 10000
```

## 🏗️ Example Module

Create a simple utilities module:

```javascript
// my-utils.js

/**
 * Calculate the area of a circle
 * @param radius The radius of the circle
 */
function circleArea(radius = 1) {
  return Math.PI * radius * radius;
}

/**
 * Generate a random string
 * @param length Length of the string
 * @param includeNumbers Include numbers in the string
 */
function randomString(length = 10, includeNumbers = true) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const pool = includeNumbers ? chars + numbers : chars;

  let result = '';
  for (let i = 0; i < length; i++) {
    result += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  return result;
}

module.exports = { circleArea, randomString };
```

Then start the MCP server:

```bash
mcp-sandbox start my-utils.js
```

## 🎮 Testing Your Server

1. **Start the server**: `mcp-sandbox start my-utils.js`
2. **Test with curl**:

   ```bash
   # List available tools
   curl http://localhost:3000/tools

   # Execute a function
   curl -X POST http://localhost:3000/execute/circleArea \
     -H "Content-Type: application/json" \
     -d '{"args": {"radius": 5}}'
   ```

3. **Use with MCP Inspector**: Connect to `http://localhost:3000/mcp/jsonrpc`

## 🔗 Related Packages

- [`@mcp-sandbox/core`](https://www.npmjs.com/package/@mcp-sandbox/core) - Core library for programmatic usage
- [`@mcp-sandbox/utils`](https://www.npmjs.com/package/@mcp-sandbox/utils) - Shared utilities

## 📚 Documentation

For complete API reference and advanced usage, see the [main documentation](https://github.com/danstarns/mcp-sandbox/blob/main/README.md).

## 🐛 Issues & Support

- **Report bugs**: [GitHub Issues](https://github.com/danstarns/mcp-sandbox/issues)
- **Documentation**: [GitHub Repository](https://github.com/danstarns/mcp-sandbox)

## 📄 License

MIT License - see [LICENSE](https://github.com/danstarns/mcp-sandbox/blob/main/LICENSE) for details.

## 🔗 Links

- **Main Repository**: [https://github.com/danstarns/mcp-sandbox](https://github.com/danstarns/mcp-sandbox)
- **NPM Package**: [https://www.npmjs.com/package/@mcp-sandbox/cli](https://www.npmjs.com/package/@mcp-sandbox/cli)
- **Core Library**: [https://www.npmjs.com/package/@mcp-sandbox/core](https://www.npmjs.com/package/@mcp-sandbox/core)
