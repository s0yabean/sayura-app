import { afterEach, describe, expect, it, vi } from 'vitest';
import { AzureProvider } from '../app/services/llm/azure-provider';

// global fetch is stubbed, so no request leaves the process.
const ENDPOINT = 'https://example-resource.invalid';

function stubFetch(impl: (...args: any[]) => Promise<unknown>) {
  const fn = vi.fn(impl);
  vi.stubGlobal('fetch', fn);
  return fn;
}

const completion = (content: string) =>
  Promise.resolve({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('AzureProvider (strong-model fallback)', () => {
  it('calls the deployment URL with the key in a header and parses the score', async () => {
    vi.stubEnv('AZURE_OPENAI_DEPLOYMENT_NAME', 'test-deployment');
    const fetchMock = stubFetch(() => completion('{"matchScore": 88, "explanation": "Core meaning kept"}'));

    const result = await new AzureProvider(ENDPOINT, 'fake-key', 200).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result).toMatchObject({ success: true, provider: 'azure', data: { matchScore: 88 } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${ENDPOINT}/openai/deployments/test-deployment/chat/completions?api-version=2024-08-01-preview`);
    expect(init.headers['api-key']).toBe('fake-key');
  });

  it('parses a fenced answer and clamps the score', async () => {
    stubFetch(() => completion('```\n{"matchScore": 120, "explanation": "x"}\n```'));

    const result = await new AzureProvider(ENDPOINT, 'fake-key', 200).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result.data?.matchScore).toBe(100);
  });

  it('turns an HTTP error into a failed result with the status', async () => {
    stubFetch(() => Promise.resolve({ ok: false, status: 503, text: async () => 'overloaded' }));

    const result = await new AzureProvider(ENDPOINT, 'fake-key', 200).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result.success).toBe(false);
    expect(result.details).toContain('503');
  });

  it('times out on a hung request', async () => {
    stubFetch(() => new Promise(() => {}));

    const result = await new AzureProvider(ENDPOINT, 'fake-key', 30).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result).toMatchObject({ success: false, details: 'Request timeout' });
  });

  it('does not call the API with missing input', async () => {
    const fetchMock = stubFetch(() => completion('{}'));

    const result = await new AzureProvider(ENDPOINT, 'fake-key', 200).checkAffirmationMatch('I am calm', '');

    expect(result).toMatchObject({ success: false, error: 'Missing required fields' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
