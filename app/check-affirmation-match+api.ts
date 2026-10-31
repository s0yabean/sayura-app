import { checkAffirmationMatch } from './api/check-affirmation-match';

// Server route for the voice-match check. The LLM orchestrator (Groq primary,
// Azure OpenAI fallback) runs here, so provider keys never reach the device.
export async function POST(request: Request) {
  let payload: { expectedAffirmation?: string; spokenText?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const result = await checkAffirmationMatch(payload.expectedAffirmation ?? '', payload.spokenText ?? '');
  return Response.json(result, { status: result.success ? 200 : 502 });
}
