
export async function POST(request: Request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { affirmation } = await request.json();

    if (!affirmation) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No affirmation provided' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Azure OpenAI configuration
    // Server-only: read from the server environment, never from the app bundle
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o';

    if (!endpoint || !apiKey) {
      console.error('Azure OpenAI configuration is missing');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'AI service not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = `You are a spiritual wellness coach specializing in affirmations. Your task is to analyze and score user affirmations, then provide improvement suggestions.

Scoring Criteria (0-100):
- Present tense & first person (20 points): "I am", "I have", "I attract"
- Positive language (20 points): No negatives like "not", "don't", "won't"
- Specific & clear (20 points): Concrete, not vague
- Emotionally resonant (20 points): Inspiring and meaningful
- Believable & authentic (20 points): Realistic and personal

Response Format (JSON only):
{
  "score": number,
  "feedback": "2-line feedback/compliment",
  "suggestions": ["suggestion 1", "suggestion 2"] // Only if score < 80
}

For scores 80+: Give encouraging feedback
For scores <80: Provide 2 improved alternatives similar to the original`;

    const response = await fetch(
      `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: `Please analyze and score this affirmation: "${affirmation}"`,
            },
          ],
          max_tokens: 100,
          temperature: 0.7,
          frequency_penalty: 0,
          presence_penalty: 0,
          top_p: 0.95,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Azure API error:', errorData);
      throw new Error(`Azure API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    const aiResponse = result.choices[0].message.content.trim();
    
    try {
      // Parse the JSON response from the AI
      const analysisResult = JSON.parse(aiResponse);
      
      return new Response(JSON.stringify({
        success: true,
        original: affirmation,
        analysis: analysisResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.error('JSON parsing error:', parseError);
      return new Response(JSON.stringify({
        success: true,
        original: affirmation,
        analysis: {
          score: 75,
          feedback: "Your affirmation has great potential! Let's make it even more powerful.",
          suggestions: ["I am becoming stronger and more confident every day", "I attract abundance and success into my life"]
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Refine affirmation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to refine affirmation',
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}