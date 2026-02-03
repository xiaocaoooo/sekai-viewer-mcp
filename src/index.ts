import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { SekaiMcpServer } from './server.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Store transports to handle POST messages
const transports = new Map<string, SSEServerTransport>();

app.get('/sse', async (_req, res) => {
  console.log('New SSE connection');

  const transport = new SSEServerTransport('/messages', res);
  const sessionId = transport.sessionId;

  transports.set(sessionId, transport);

  const server = new SekaiMcpServer();

  // Clean up on close
  transport.onclose = () => {
    console.log(`Session ${sessionId} closed`);
    transports.delete(sessionId);
  };

  await server.connect(transport);
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    res.status(400).send('Missing sessionId');
    return;
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).send('Session not found');
    return;
  }

  await transport.handlePostMessage(req, res);
});

app.listen(PORT, () => {
  console.log(`Project Sekai MCP Server running on port ${PORT}`);
  console.log(`SSE Endpoint: http://localhost:${PORT}/sse`);
});
