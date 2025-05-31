#!/usr/bin/env node

import { program } from 'commander';
import { MCPSandbox } from '@mcp-sandbox/core';
import * as path from 'path';
import * as fs from 'fs/promises';

interface CLIOptions {
  port?: string;
  host?: string;
  timeout?: string;
  output?: string;
}

async function resolveModulePath(modulePath: string): Promise<string> {
  let resolvedPath = modulePath;

  if (!path.isAbsolute(modulePath) && !modulePath.startsWith('.')) {
    // Try to resolve as npm package
    try {
      resolvedPath = require.resolve(modulePath);
    } catch {
      resolvedPath = path.resolve(process.cwd(), modulePath);
    }
  } else {
    resolvedPath = path.resolve(process.cwd(), modulePath);
  }

  // Check if file exists
  try {
    await fs.access(resolvedPath);
    return resolvedPath;
  } catch {
    throw new Error(`Module not found: ${modulePath}`);
  }
}

async function startSandbox(modulePath: string, options: CLIOptions) {
  try {
    const resolvedPath = await resolveModulePath(modulePath);

    const sandboxOptions = {
      port: options.port ? parseInt(options.port) : undefined,
      host: options.host,
      timeout: options.timeout ? parseInt(options.timeout) : undefined,
    };

    console.log('🏗️  Initializing MCP Sandbox...');
    const sandbox = new MCPSandbox(sandboxOptions);

    const config = await sandbox.loadModule(resolvedPath);

    if (options.output) {
      await fs.writeFile(options.output, JSON.stringify(config, null, 2));
      console.log(`📄 Configuration written to: ${options.output}`);
    }

    await sandbox.start();

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down MCP Sandbox...');
      process.exit(0);
    });
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function inspectModule(modulePath: string, options: CLIOptions) {
  try {
    const resolvedPath = await resolveModulePath(modulePath);

    console.log('🔍 Inspecting module...');
    const sandbox = new MCPSandbox({ timeout: 10000 });

    await sandbox.loadModule(resolvedPath);
    const tools = sandbox.getTools();

    console.log('\n📊 Analysis Results:');
    console.log(`Module: ${resolvedPath}`);
    console.log(`Tools found: ${tools.length}\n`);

    tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}`);
      console.log(`   Description: ${tool.description}`);
      console.log(
        `   Parameters: ${tool.inputSchema.required.length} required, ${Object.keys(tool.inputSchema.properties).length} total`,
      );

      Object.entries(tool.inputSchema.properties).forEach(([name, schema]) => {
        const required = tool.inputSchema.required.includes(name);
        console.log(`     - ${name}: ${(schema as any).type}${required ? ' (required)' : ' (optional)'}`);
      });
      console.log('');
    });

    if (options.output) {
      const analysisReport = {
        module: resolvedPath,
        analyzedAt: new Date().toISOString(),
        toolCount: tools.length,
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          parameters: Object.keys(tool.inputSchema.properties),
          requiredParameters: tool.inputSchema.required,
        })),
      };

      await fs.writeFile(options.output, JSON.stringify(analysisReport, null, 2));
      console.log(`📄 Analysis report written to: ${options.output}`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

program.name('mcp-sandbox').description('Turn any JS module into a sandboxed MCP server').version('1.0.0');

program
  .command('start')
  .description('Start MCP sandbox server for a module')
  .argument('<module>', 'Path to JavaScript module or npm package name')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-h, --host <host>', 'Server host', 'localhost')
  .option('-t, --timeout <ms>', 'Execution timeout in milliseconds', '5000')
  .option('-o, --output <file>', 'Output MCP configuration to file')
  .action(startSandbox);

program
  .command('inspect')
  .description('Analyze a module without starting the server')
  .argument('<module>', 'Path to JavaScript module or npm package name')
  .option('-o, --output <file>', 'Output analysis report to file')
  .action(inspectModule);

program
  .command('generate')
  .description('Generate MCP configuration for a module')
  .argument('<module>', 'Path to JavaScript module or npm package name')
  .option('-o, --output <file>', 'Output file (defaults to mcp-config.json)', 'mcp-config.json')
  .action(async (modulePath: string, options: CLIOptions) => {
    try {
      const resolvedPath = await resolveModulePath(modulePath);

      console.log('⚙️  Generating MCP configuration...');
      const sandbox = new MCPSandbox();
      const config = await sandbox.loadModule(resolvedPath);

      const outputFile = options.output || 'mcp-config.json';
      await fs.writeFile(outputFile, JSON.stringify(config, null, 2));

      console.log(`✅ MCP configuration generated: ${outputFile}`);
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program.parse();
