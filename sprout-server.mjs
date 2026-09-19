import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
const ROOT = path.dirname(new URL(import.meta.url).pathname);

if (!API_KEY) console.warn('OPENAI_API_KEY is not set. /chat will return an error until it is configured.');

const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOW_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Sprout-Version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Content-Type': 'application/json; charset=utf-8'
};

function send(res, status, body) {
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 2_000_000) {
        req.destroy();
        reject(new Error('Request too large'));
      }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function buildDeveloperInstructions(body) {
  const sprout = body.sprout || {};
  const deep = sprout.deepThinking !== false;
  const fact = sprout.factCheck !== false;
  return `You are the reasoning engine behind Sprout, a personal AI assistant.\n\n` +
    `Core behaviour:\n` +
    `- Understand intent before answering.\n` +
    `- Use the supplied memory only when relevant. Never invent memories.\n` +
    `- Separate established facts, web-sourced facts, inference and uncertainty.\n` +
    `- If information may have changed, use web search when available.\n` +
    `- If sources disagree, explain the disagreement rather than silently choosing.\n` +
    `- Correct yourself when the user provides evidence or says an answer is wrong.\n` +
    `- Do not expose private chain-of-thought. Provide concise reasoning summaries instead.\n` +
    `- Before finalising, check that the answer actually addresses the user's request.\n` +
    `- If a request is ambiguous but safely answerable, make the most reasonable interpretation and state it briefly.\n` +
    `- If essential information is missing, ask one focused question.\n` +
    `- Never claim to have changed software unless an actual software update occurred.\n\n` +
    `Deep thinking mode: ${deep ? 'enabled' : 'standard'}. Fact-check mode: ${fact ? 'enabled' : 'standard'}.`;
}

async function callOpenAI(body) {
  if (!API_KEY) throw new Error('Server is missing OPENAI_API_KEY');
  const useWeb = Boolean(body.sprout?.useWeb);
  const input = Array.isArray(body.messages) ? body.messages : [];
  const payload = {
    model: body.model || MODEL,
    instructions: buildDeveloperInstructions(body),
    input,
    temperature: 0.45,
    max_output_tokens: 2500
  };
  if (useWeb) payload.tools = [{ type: 'web_search' }];

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI HTTP ${response.status}`);

  const text = data.output_text || (data.output || [])
    .flatMap(item => item.content || [])
    .map(part => part.text || '')
    .join('')
    .trim();

  return {
    reply: text || 'I could not produce a response this time.',
    model: data.model || MODEL,
    responseId: data.id || null,
    webUsed: useWeb
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, headers); return res.end(); }

  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { ok: true, service: 'sprout-gateway', model: MODEL, apiConfigured: Boolean(API_KEY) });
  }

  if (req.method === 'POST' && req.url === '/chat') {
    try {
      const body = await readBody(req);
      const result = await callOpenAI(body);
      return send(res, 200, result);
    } catch (err) {
      console.error(err);
      return send(res, 502, { error: err.message || 'AI gateway error' });
    }
  }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/sprout_ai.html')) {
    const file = path.join(ROOT, 'sprout_ai.html');
    if (!fs.existsSync(file)) return send(res, 404, { error: 'sprout_ai.html not found' });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(file));
  }

  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => console.log(`Sprout gateway running on http://localhost:${PORT}`));
