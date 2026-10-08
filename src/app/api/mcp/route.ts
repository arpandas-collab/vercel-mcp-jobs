import { NextRequest, NextResponse } from 'next/server';
import { MCP_TOOLS, handleMcpToolCall } from '@/lib/mcp';

// Model Context Protocol (MCP) JSON-RPC 2.0 Handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jsonrpc, id, method, params } = body;

    if (jsonrpc !== '2.0') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: id ?? null,
          error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
        },
        { status: 400 }
      );
    }

    switch (method) {
      case 'initialize': {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: 'vercel-mongodb-cron-mcp',
              version: '1.0.0',
              description: 'Vercel MCP Server for MongoDB Atlas database connectivity, scheduled-job management, and AI Gateway execution.',
            },
            capabilities: {
              tools: {
                listChanged: true,
              },
            },
          },
        });
      }

      case 'tools/list': {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS,
          },
        });
      }

      case 'tools/call': {
        const toolName = params?.name as string;
        const toolArgs = (params?.arguments as Record<string, unknown>) || {};

        if (!toolName) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Missing tool name in params' },
          });
        }

        try {
          const output = await handleMcpToolCall(toolName, toolArgs);
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof output === 'string' ? output : JSON.stringify(output, null, 2),
                },
              ],
              isError: false,
            },
          });
        } catch (toolError) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Error executing tool "${toolName}": ${toolError instanceof Error ? toolError.message : String(toolError)}`,
                },
              ],
              isError: true,
            },
          });
        }
      }

      case 'ping': {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {},
        });
      }

      default: {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        });
      }
    }
  } catch (err) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: `Parse error: ${err instanceof Error ? err.message : 'Invalid JSON'}`,
        },
      },
      { status: 400 }
    );
  }
}

// GET handler: MCP Discovery endpoint & documentation
export async function GET() {
  return NextResponse.json({
    status: 'online',
    server: 'vercel-mongodb-cron-mcp',
    version: '1.0.0',
    description: 'Vercel Model Context Protocol (MCP) server for MongoDB Atlas & AI Scheduled Jobs',
    endpoint: '/api/mcp',
    transport: 'HTTP JSON-RPC 2.0',
    availableTools: MCP_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      requiredParameters: t.inputSchema.required || [],
    })),
    documentation: {
      quickStart: 'Send JSON-RPC 2.0 POST requests with method "tools/call" or "tools/list".',
      sampleCall: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'query_mongodb',
          arguments: { collection: 'customer_feedback', limit: 5 },
        },
      },
    },
  });
}
