import * as vm from 'vm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MCPTool, MCPToolParameter, ModuleExports } from './types';

export class ModuleReflector {
  private timeout: number;

  constructor(timeout: number = 5000) {
    this.timeout = timeout;
  }

  /**
   * Reflect a JavaScript/TypeScript module and extract its signature
   */
  async reflectModule(modulePath: string): Promise<{
    tools: MCPTool[];
    context: vm.Context;
  }> {
    try {
      const moduleContent = await fs.readFile(modulePath, 'utf8');
      const moduleDir = path.dirname(modulePath);

      // Create a sandboxed context
      const sandbox = {
        console,
        require: (id: string) => {
          // Resolve relative requires
          if (id.startsWith('.')) {
            return require(path.resolve(moduleDir, id));
          }
          return require(id);
        },
        module: { exports: {} },
        exports: {},
        __filename: modulePath,
        __dirname: moduleDir,
        Buffer,
        process: {
          env: process.env,
          version: process.version,
          platform: process.platform,
        },
      };

      // Execute module in sandbox
      const context = vm.createContext(sandbox);
      vm.runInContext(moduleContent, context, {
        filename: modulePath,
        timeout: this.timeout,
      });

      const moduleExports = context.module.exports;
      const tools = this.analyzeExports(moduleExports);

      return { tools, context };
    } catch (error) {
      throw new Error(`Failed to reflect module: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analyze module exports and generate tool signatures
   */
  private analyzeExports(exports: ModuleExports): MCPTool[] {
    const tools: MCPTool[] = [];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const analyzeFunction = (name: string, func: Function): MCPTool => {
      const funcStr = func.toString();
      const params = this.extractParameters(funcStr);
      const description = this.extractJSDoc(funcStr) || `Execute ${name} function`;

      return {
        name,
        description,
        inputSchema: {
          type: 'object',
          properties: this.generateParameterSchema(params),
          required: params.filter((p) => !p.hasDefault).map((p) => p.name),
        },
        handler: func,
      };
    };

    const traverse = (obj: any, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const toolName = prefix ? `${prefix}_${key}` : key;

        if (typeof value === 'function') {
          tools.push(analyzeFunction(toolName, value));
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          traverse(value, toolName);
        }
      }
    };

    if (typeof exports === 'function') {
      tools.push(analyzeFunction('default', exports));
    } else if (typeof exports === 'object' && exports !== null) {
      traverse(exports);
    }

    return tools;
  }

  /**
   * Extract function parameters using regex parsing
   */
  private extractParameters(funcStr: string): MCPToolParameter[] {
    const match = funcStr.match(/(?:function\s*\w*\s*|(?:\w+\s*=>|\([^)]*\)\s*=>))\s*\(([^)]*)\)/);
    if (!match || !match[1]) return [];

    return match[1]
      .split(',')
      .map((param) => param.trim())
      .filter((param) => param)
      .map((param) => {
        const hasDefault = param.includes('=');
        const [name] = param.split('=').map((p) => p.trim());
        const cleanName = name.replace(/[{}[\]]/g, ''); // Remove destructuring syntax

        return {
          name: cleanName,
          hasDefault,
          type: this.inferParameterType(param),
        };
      });
  }

  /**
   * Infer parameter type from default value or name
   */
  private inferParameterType(param: string): MCPToolParameter['type'] {
    if (param.includes('=')) {
      const defaultValue = param.split('=')[1].trim();
      if (defaultValue === 'true' || defaultValue === 'false') return 'boolean';
      if (!isNaN(Number(defaultValue))) return 'number';
      if (defaultValue.startsWith('"') || defaultValue.startsWith("'")) return 'string';
      if (defaultValue.startsWith('[')) return 'array';
      if (defaultValue.startsWith('{')) return 'object';
    }

    // Infer from parameter name patterns
    const name = param.split('=')[0].trim().toLowerCase();
    if (name.includes('count') || name.includes('num') || name.includes('size')) return 'number';
    if (name.includes('flag') || name.includes('enable') || name.includes('is')) return 'boolean';
    if (name.includes('list') || name.includes('array')) return 'array';
    if (name.includes('config') || name.includes('options')) return 'object';

    return 'string'; // Default to string
  }

  /**
   * Generate JSON Schema for parameters
   */
  private generateParameterSchema(params: MCPToolParameter[]): Record<string, any> {
    const schema: Record<string, any> = {};

    for (const param of params) {
      schema[param.name] = {
        type: param.type,
        description: `Parameter: ${param.name}`,
      };

      if (param.type === 'array') {
        schema[param.name].items = { type: 'string' };
      }
    }

    return schema;
  }

  /**
   * Extract JSDoc comments for function descriptions
   */
  private extractJSDoc(funcStr: string): string | null {
    const jsdocMatch = funcStr.match(/\/\*\*\s*(.*?)\s*\*\//s);
    if (jsdocMatch) {
      return jsdocMatch[1]
        .split('\n')
        .map((line) => line.replace(/^\s*\*\s?/, ''))
        .join(' ')
        .trim();
    }
    return null;
  }
}
