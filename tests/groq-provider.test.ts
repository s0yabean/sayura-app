import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GroqProvider } from '../app/services/llm/groq-provider';

// groq-sdk is replaced by a fake client; `create` is scripted per test.
const sdk = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('groq-sdk', () => ({
  Groq: class {
    chat = { completions: { create: sdk.create } };
  },
}));

const reply = (content: string) => ({ choices: [{ message: { content } }] });

beforeEach(() => {
  sdk.create.mockReset();
});

describe('GroqProvider: parsing the match score', () => {
  it('parses a plain JSON answer', async () => {
    sdk.create.mockResolvedValue(reply('{"matchScore": 93, "explanation": "Near-perfect"}'));

    const result = await new GroqProvider('fake', 200).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result).toMatchObject({
      success: true,
      provider: 'groq',
      data: { matchScore: 93, explanation: 'Near-perfect' },
    });
  });

  it('parses JSON wrapped in a markdown code fence', async () => {
    sdk.create.mockResolvedValue(reply('```json\n{"matchScore": 80, "explanation": "Filler words"}\n```'));

    const result = await new GroqProvider('fake', 200).checkAffirmationMatch('I am calm', 'erm I calm');

    expect(result.data).toEqual({ matchScore: 80, explanation: 'Filler words' });
  });

  it.each([
    [140, 100],
    [-12, 0],
  ])('clamps an out-of-range score %d to %d', async (raw, clamped) => {
    sdk.create.mockResolvedValue(reply(JSON.stringify({ matchScore: raw, explanation: 'x' })));

    const result = await new GroqProvider('fake', 200).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result.data?.matchScore).toBe(clamped);
  });

  it('pulls the first number out of a prose answer', async () => {
    sdk.create.mockResolvedValue(reply('I would rate this 85 out of 100.'));

    const result = await new GroqProvider('fake', 200).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result).toMatchObject({ success: true, data: { matchScore: 85 } });
  });

  it('treats JSON with the wrong shape as prose and extracts the number', async () => {
    sdk.create.mockResolvedValue(reply('{"score": "60"}'));

    const result = await new GroqProvider('fake', 200).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result.data?.matchScore).toBe(60);
  });

  it('defaults to 75 when the answer has no number at all', async () => {
    sdk.create.mockResolvedValue(reply('Sounds lovely.'));

    const result = await new GroqProvider('fake', 200).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result.data?.matchScore).toBe(75);
  });

  it('puts both texts in the prompt and uses the fast model', async () => {
    sdk.create.mockResolvedValue(reply('{"matchScore": 90, "explanation": "ok"}'));

    await new GroqProvider('fake', 200).checkAffirmationMatch('I am worthy', 'I am worthy');

    const args = sdk.create.mock.calls[0][0];
    expect(args.model).toBe('llama-3.1-8b-instant');
    expect(args.messages[0].content).toContain('Expected Affirmation As the Source of Truth: "I am worthy"');
    expect(args.messages[0].content).toContain('Spoken Text By User: "I am worthy"');
  });
});

describe('GroqProvider: failures the orchestrator falls back on', () => {
  it('fails fast on missing input without calling the model', async () => {
    const result = await new GroqProvider('fake', 200).checkAffirmationMatch('', 'I am calm');

    expect(result).toMatchObject({ success: false, error: 'Missing required fields' });
    expect(sdk.create).not.toHaveBeenCalled();
  });

  it('times out instead of waiting on a slow model', async () => {
    sdk.create.mockReturnValue(new Promise(() => {})); // never resolves

    const started = Date.now();
    const result = await new GroqProvider('fake', 30).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result).toMatchObject({ success: false, error: 'Groq API request failed', details: 'Request timeout' });
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('reports an API error as a failed result', async () => {
    sdk.create.mockRejectedValue(new Error('429 rate limited'));

    const result = await new GroqProvider('fake', 200).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result).toMatchObject({ success: false, details: '429 rate limited' });
  });

  it('reports an empty completion as a failed result', async () => {
    sdk.create.mockResolvedValue({ choices: [] });

    const result = await new GroqProvider('fake', 200).checkAffirmationMatch('I am calm', 'I am calm');

    expect(result).toMatchObject({ success: false, details: 'No response from Groq' });
  });

  it('health check is false when the API errors', async () => {
    sdk.create.mockRejectedValue(new Error('down'));

    expect(await new GroqProvider('fake', 200).isAvailable()).toBe(false);
  });
});
