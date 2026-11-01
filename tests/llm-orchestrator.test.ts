import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LLMOrchestrator } from '../app/services/llm/orchestrator';
import type { LLMResult } from '../app/services/llm/types';

// vi.mock calls below are hoisted above the imports, so the orchestrator gets the fakes.
// Fake providers stand in for Groq (fast model) and Azure OpenAI (strong model).
// Each test scripts what the fakes do; nothing touches a network or an API key.
type Behaviour = {
  available?: boolean | (() => Promise<boolean>);
  check: (expected: string, spoken: string) => Promise<LLMResult>;
};

const fakes = vi.hoisted(() => ({
  behaviour: {} as Record<'groq' | 'azure', Behaviour>,
  calls: [] as string[],
  ctorArgs: {} as Record<string, unknown[]>,
}));

function makeFake(name: 'groq' | 'azure') {
  return class {
    name = name;
    constructor(...args: unknown[]) {
      fakes.ctorArgs[name] = args;
    }
    async isAvailable() {
      fakes.calls.push(`${name}.isAvailable`);
      const a = fakes.behaviour[name].available ?? true;
      return typeof a === 'function' ? a() : a;
    }
    async checkAffirmationMatch(expected: string, spoken: string) {
      fakes.calls.push(`${name}.check`);
      return fakes.behaviour[name].check(expected, spoken);
    }
  };
}

vi.mock('../app/services/llm/groq-provider', () => ({ GroqProvider: makeFake('groq') }));
vi.mock('../app/services/llm/azure-provider', () => ({ AzureProvider: makeFake('azure') }));

const ok = (provider: string, matchScore: number): LLMResult => ({
  success: true,
  data: { matchScore, explanation: `${provider} says ${matchScore}` },
  provider,
  latency: 5,
});
const fail = (provider: string, error: string, details?: string): LLMResult => ({
  success: false,
  error,
  details,
  provider,
  latency: 5,
});

const bothConfigured = {
  groqEnabled: true,
  groqApiKey: 'fake-groq',
  azureEndpoint: 'https://azure.invalid',
  azureApiKey: 'fake-azure',
  timeoutMs: 100,
};

beforeEach(() => {
  fakes.calls.length = 0;
  fakes.ctorArgs = {};
  fakes.behaviour = {
    groq: { check: async () => ok('groq', 92) },
    azure: { check: async () => ok('azure', 88) },
  };
});

describe('LLMOrchestrator: fast model first, strong model as fallback', () => {
  it('returns the fast model answer and never calls the fallback when it succeeds', async () => {
    const result = await new LLMOrchestrator(bothConfigured).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result).toMatchObject({ success: true, provider: 'groq', data: { matchScore: 92 } });
    expect(fakes.calls).toEqual(['groq.isAvailable', 'groq.check']);
  });

  it('falls back to the strong model when the fast model times out', async () => {
    fakes.behaviour.groq.check = async () => fail('groq', 'Groq API request failed', 'Request timeout');

    const result = await new LLMOrchestrator(bothConfigured).checkAffirmationMatch('I am calm', 'um I am calm');

    expect(result).toMatchObject({ success: true, provider: 'azure', data: { matchScore: 88 } });
    expect(fakes.calls).toEqual(['groq.isAvailable', 'groq.check', 'azure.check']);
  });

  it('falls back when the fast model throws instead of returning an error', async () => {
    fakes.behaviour.groq.check = async () => {
      throw new Error('socket hang up');
    };

    const result = await new LLMOrchestrator(bothConfigured).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result).toMatchObject({ success: true, provider: 'azure' });
  });

  it('skips the fast model entirely when its health check fails', async () => {
    fakes.behaviour.groq.available = false;

    const result = await new LLMOrchestrator(bothConfigured).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result.provider).toBe('azure');
    expect(fakes.calls).toEqual(['groq.isAvailable', 'azure.check']);
  });

  it('does not health-check the last provider, to avoid a second round trip', async () => {
    fakes.behaviour.groq.check = async () => fail('groq', 'Groq API request failed');

    await new LLMOrchestrator(bothConfigured).checkAffirmationMatch('I am calm', 'I am calm');

    expect(fakes.calls).not.toContain('azure.isAvailable');
  });

  it('returns a clear failure carrying the last provider error when both fail', async () => {
    fakes.behaviour.groq.check = async () => fail('groq', 'Groq API request failed', 'Request timeout');
    fakes.behaviour.azure.check = async () => fail('azure', 'Azure API request failed', 'Azure OpenAI API error: 503');

    const result = await new LLMOrchestrator(bothConfigured).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.provider).toBe('azure');
    expect(result.error).toBe('Azure API request failed');
    expect(result.details).toContain('503');
  });

  it('reports an exception from the fallback as a failure, not a crash', async () => {
    fakes.behaviour.groq.available = false;
    fakes.behaviour.azure.check = async () => {
      throw new Error('boom');
    };

    const result = await new LLMOrchestrator(bothConfigured).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result).toMatchObject({ success: false, error: 'azure exception', provider: 'azure' });
    expect(result.details).toContain('boom');
  });

  it('calls a single configured provider directly, even if a health check would fail', async () => {
    fakes.behaviour.groq.available = false;
    const result = await new LLMOrchestrator({ ...bothConfigured, azureEndpoint: undefined }).checkAffirmationMatch(
      'I am calm',
      'I am calm',
    );

    expect(result).toMatchObject({ success: true, provider: 'groq' });
    expect(fakes.calls).toEqual(['groq.check']);
  });
});

describe('LLMOrchestrator: configuration', () => {
  it('uses only the fallback when the fast model is disabled', async () => {
    const result = await new LLMOrchestrator({ ...bothConfigured, groqEnabled: false }).checkAffirmationMatch(
      'I am calm',
      'I am calm',
    );

    expect(result.provider).toBe('azure');
    expect(fakes.ctorArgs.groq).toBeUndefined();
  });

  it('gives the fallback twice the fast model timeout', () => {
    new LLMOrchestrator({ ...bothConfigured, timeoutMs: 1500 });

    expect(fakes.ctorArgs.groq).toEqual(['fake-groq', 1500]);
    expect(fakes.ctorArgs.azure).toEqual(['https://azure.invalid', 'fake-azure', 3000]);
  });

  it('refuses to start with no provider configured', () => {
    expect(
      () => new LLMOrchestrator({ groqEnabled: false, timeoutMs: 100 }),
    ).toThrow('No LLM providers could be initialized');
  });

  it('reports per-provider health', async () => {
    fakes.behaviour.groq.available = false;
    const status = await new LLMOrchestrator(bothConfigured).getProviderStatus();
    expect(status).toEqual({ groq: false, azure: true });
  });
});
