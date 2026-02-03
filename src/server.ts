import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { tools } from './tools.js';

export class SekaiMcpServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: 'sekai-mcp-server',
      version: '1.0.0',
    });

    this.registerTools();
  }

  private registerTools() {
    for (const tool of tools) {
      this.server.tool(tool.name, tool.description, tool.parameters.shape, tool.execute);
    }
  }

  public async connect(transport: Transport) {
    await this.server.connect(transport);
  }
}
