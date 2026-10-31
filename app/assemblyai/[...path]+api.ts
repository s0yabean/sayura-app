// Server-side proxy for the three AssemblyAI calls the app makes.
// The device never holds the AssemblyAI key: it calls /assemblyai/v2/..., and this
// route adds the Authorization header from the server's environment.
const ASSEMBLYAI_BASE = 'https://api.assemblyai.com';

const ALLOWED: Array<{ method: string; pattern: RegExp }> = [
  { method: 'POST', pattern: /^v2\/upload$/ },
  { method: 'POST', pattern: /^v2\/transcript$/ },
  { method: 'GET', pattern: /^v2\/transcript\/[A-Za-z0-9-]+$/ },
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function proxy(request: Request): Promise<Response> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return json({ error: 'AssemblyAI is not configured on the server' }, 500);
  }

  const { pathname } = new URL(request.url);
  const subPath = pathname.replace(/^\/assemblyai\//, '');
  const allowed = ALLOWED.some((r) => r.method === request.method && r.pattern.test(subPath));
  if (!allowed) {
    return json({ error: 'Not found' }, 404);
  }

  const headers: Record<string, string> = { authorization: apiKey };
  let body: BodyInit | undefined;

  if (request.method === 'POST') {
    if (subPath === 'v2/upload') {
      headers['Content-Type'] = 'application/octet-stream';
      body = await request.arrayBuffer();
    } else {
      headers['Content-Type'] = 'application/json';
      // Only forward the fields the app uses
      const { audio_url, speech_model } = await request.json();
      body = JSON.stringify({ audio_url, speech_model });
    }
  }

  const upstream = await fetch(`${ASSEMBLYAI_BASE}/${subPath}`, {
    method: request.method,
    headers,
    body,
  });

  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET = proxy;
export const POST = proxy;
