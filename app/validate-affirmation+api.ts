
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

    const systemPrompt = `You are a content moderator for a positive affirmation community app. Your task is to validate affirmations to ensure they meet community standards.

ACCEPT affirmations that are:
- Positive, empowering, or neutral
- Self-affirming and constructive
- Inspirational or motivational
- Personal growth oriented
- Free of profanity and negative language

REJECT affirmations that contain:
- Profanity, curse words, or vulgar language
- Negative self-talk (e.g., "I hate myself", "I am worthless")
- Harmful content targeting others
- Violent or threatening language
- Inappropriate sexual content
- Discriminatory language

IMPORTANT: Respond ONLY with valid JSON. Do not include any markdown formatting, code blocks, or explanations. 
Response must be EXACTLY in this format:
{"valid": true, "reason": ""} or {"valid": false, "reason": "brief explanation"}

Examples:
- For valid affirmations: {"valid": true, "reason": ""}
- For invalid affirmations: {"valid": false, "reason": "Contains profanity"}`;

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
              content: `Please validate this affirmation: "${affirmation}"`,
            },
          ],
          max_tokens: 50,
          temperature: 0.1, // Low temperature for consistent validation
          frequency_penalty: 0,
          presence_penalty: 0,
          top_p: 0.9,
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
      // Handle potential markdown code blocks in the response
      let cleanedResponse = aiResponse;
      
      // Check if response contains markdown code blocks
      if (aiResponse.includes('```json')) {
        // Extract JSON content from markdown code block
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          cleanedResponse = jsonMatch[1].trim();
        }
      } else if (aiResponse.includes('```')) {
        // Handle generic code blocks
        const codeMatch = aiResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch && codeMatch[1]) {
          cleanedResponse = codeMatch[1].trim();
        }
      }
      
      // Parse the cleaned JSON response
      const validationResult = JSON.parse(cleanedResponse);
      
      return new Response(JSON.stringify({
        success: true,
        validation: validationResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (parseError) {
      // Fallback if JSON parsing fails - default to rejection for safety
      console.error('JSON parsing error:', parseError);
      return new Response(JSON.stringify({
        success: true,
        validation: {
          valid: false,
          reason: "Unable to validate content properly"
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Validate affirmation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to validate affirmation',
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}