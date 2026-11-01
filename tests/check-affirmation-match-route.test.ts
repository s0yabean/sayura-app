import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../app/check-affirmation-match+api';

// End to end through the server route, the real orchestrator and both real providers.
// Only the edges are faked: groq-sdk's client and global fetch (used by the Azure provider).
const groq = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('groq-sdk', () => ({
  Groq: class {
    chat = { completions: { create: groq.create } };
  },
}));

const isHealthCheck = (args: any) => args.max_completion_tokens === 1;
const answer = (content: string) => ({ choices: [{ message: { content } }] });

function post(body: unknown) {
  return POST(
    new Request('http://localhost/check-affirmation-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

const valid = { expectedAffirmation: 'I am worthy of love', spokenText: 'um I am worthy of love' };

beforeEach(() => {
  groq.create.mockReset();
  vi.stubEnv('GROQ_ENABLED', 'true');
  vi.stubEnv('GROQ_API_KEY', 'fake-groq-key');
  vi.stubEnv('AZURE_OPENAI_ENDPOINT', 'https://example-resource.invalid');
  vi.stubEnv('AZURE_OPENAI_API_KEY', 'fake-azure-key');
  vi.stubEnv('LLM_TIMEOUT_MS', '30');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('POST /check-affirmation-match', () => {
  it('answers from the fast model when it is healthy', async () => {
    groq.create.mockImplementation(async (args: any) =>
      isHealthCheck(args) ? answer('ok') : answer('{"matchScore": 90, "explanation": "Filler word only"}'),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = await post(valid);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, provider: 'groq', data: { matchScore: 90 } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to Azure when the fast model hangs past its timeout', async () => {
    groq.create.mockImplementation(async (args: any) =>
      isHealthCheck(args) ? answer('ok') : new Promise(() => {}),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => answer('{"matchScore": 86, "explanation": "Core meaning kept"}'),
      })),
    );

    const res = await post(valid);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, provider: 'azure', data: { matchScore: 86 } });
  });

  it('returns 502 with a clear error when both models fail', async () => {
    groq.create.mockRejectedValue(new Error('down'));
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, text: async () => 'error' })));

    const res = await post(valid);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Azure API request failed');
    expect(body.details).toContain('500');
  });

  it('returns 400 on a body that is not JSON', async () => {
    const res = await post('not json');

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: 'Invalid JSON' });
  });

  it('rejects missing fields without calling any model', async () => {
    const res = await post({ expectedAffirmation: 'I am calm' });

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ success: false, error: 'Missing required fields' });
    expect(groq.create).not.toHaveBeenCalled();
  });

  it('reports a configuration error when no provider key is set', async () => {
    vi.stubEnv('GROQ_API_KEY', '');
    vi.stubEnv('AZURE_OPENAI_API_KEY', '');

    const res = await post(valid);

    expect(await res.json()).toMatchObject({ success: false, error: 'No LLM providers configured' });
  });
});
