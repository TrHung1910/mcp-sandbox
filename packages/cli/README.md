# @mcp-sandbox/cli

Command-line interface for MCP Sandbox.

## Installation

```bash
# Global installation
npm install -g @mcp-sandbox/cli

# Local installation
npm install @mcp-sandbox/cli
```

## Commands

### `start`

Start an MCP server for a JavaScript module.

```bash
mcp-sandbox start  [options]

Options:
  -p, --port      Server port (default: 3000)
  -h, --host      Server host (default: localhost)
  -t, --timeout     Execution timeout (default: 5000ms)
  -o, --output    Output MCP configuration to file
```

### `inspect`

Analyze a module without starting the server.

```bash
mcp-sandbox inspect  [options]

Options:
  -o, --output    Output analysis report to file
```

### `generate`

Generate MCP configuration for a module.

```bash
mcp-sandbox generate  [options]

Options:
  -o, --output    Output file (default: mcp-config.json)
```

## Examples

```bash
# Start server for local module
mcp-sandbox start ./utils.js --port 8080

# Analyze npm package
mcp-sandbox inspect lodash --output analysis.json

# Generate config for module
mcp-sandbox generate ./my-tools.js --output tools-config.json
```
