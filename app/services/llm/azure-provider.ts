import { LLMProvider, LLMResult } from './types';

export class AzureProvider implements LLMProvider {
  name = 'azure';
  private endpoint: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(endpoint: string, apiKey: string, timeoutMs: number = 5000) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple health check - just verify the endpoint is reachable
      const response = await Promise.race([
        fetch(this.endpoint, { method: 'HEAD' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 2000)
        )
      ]);
      return true;
    } catch (error) {
      console.warn('Azure health check failed:', error);
      return false;
    }
  }

  async checkAffirmationMatch(expectedAffirmation: string, spokenText: string): Promise<LLMResult> {
    const startTime = Date.now();
    
    try {
      if (!expectedAffirmation || !spokenText) {
        return {
          success: false,
          error: 'Missing required fields',
          provider: this.name,
          latency: Date.now() - startTime
        };
      }

      const systemPrompt = `You are an expert at comparing spoken affirmations to their intended text. Your job is to determine how closely a person's spoken words match the target affirmation.

IMPORTANT: You must respond with ONLY a valid JSON object in this exact format, no other comments or explanations:
{
  "matchScore": number,
  "explanation": "string"
}

Scoring Guidelines:
- 95-100: Perfect or near-perfect match (minor pronunciation differences OK)
- 85-94: Excellent match (small word variations, filler words OK)
- 70-84: Good match (some words different but core meaning preserved)
- 50-69: Partial match (significant differences but recognizable attempt)
- 0-49: Poor match (completely different, opposite meaning, or unintelligible)

Consider these factors:
- Core meaning and intent
- Key emotional words preserved
- Allow for: "um", "uh", pauses, slight mispronunciations
- Ignore: case differences, minor grammar variations, filler words
- Be generous with scoring - encourage positive reinforcement
- As long as the idea is there, sequence of words, even for poor english speakers

Expected Affirmation As the Source of Truth: "${expectedAffirmation}"
Spoken Text By User: "${spokenText}"

Analyze and respond with JSON only.

Example Responses:
Affirmation: "I am a good person"
Spoken Text: "I am a good person"
{
  "matchScore": 100,
  "explanation": "Perfect match"
}

Affirmation: "I am a good person"
Spoken Text: "Erm...I good person"
{
  "matchScore": 80,
  "explanation": "Some filler words some missed, but the core meaning is there"
}

Affirmation: "I am a good person"
Spoken Text: "No way I am a good person"
{
  "matchScore": 20,
  "explanation": "Opposite with negative connotation and tonality is very firm"
}

Affirmation: "I am worthy of love and abundance in all forms"
Spoken Text: "I am not worthy of love and abundance in all forms"
{
  "matchScore": 10,
  "explanation": "Opposite with negative connotation and obvious trying to be rebellious in bad way"
}

Affirmation: "I am worthy of love and abundance in all forms"
Spoken Text: "You are bad, this is screwed up"
{
  "matchScore": 0,
  "explanation": "Completely different meaning and opposite with negative connotation"
}

Affirmation: "I am worthy of love and abundance in all forms"
Spoken Text: "Does this really work?"
{
  "matchScore": 20,
  "explanation": "Skeptically asking a question, doubt, low vibration, low hope"
}`;

      const apiUrl = `${this.endpoint}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o'}/chat/completions?api-version=2024-08-01-preview`;
      
      const response = await Promise.race([
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: systemPrompt
              }
            ],
            max_tokens: 200,
            temperature: 0.1, // Low temperature for consistent responses
            top_p: 0.9,
          }),
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.timeoutMs)
        )
      ]);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from Azure OpenAI');
      }
      
      // Parse the JSON response with fallback handling
      try {
        // Handle markdown code blocks
        const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        const jsonText = (fenced ? fenced[1] : content).trim();
        
        const parsedResult = JSON.parse(jsonText);
        
        // Validate the response structure
        if (typeof parsedResult.matchScore !== 'number' || 
            typeof parsedResult.explanation !== 'string') {
          throw new Error('Invalid response format from Azure');
        }
        
        // Ensure score is within valid range
        parsedResult.matchScore = Math.max(0, Math.min(100, parsedResult.matchScore));
        
        console.log('Azure match analysis result:', parsedResult);
        
        return {
          success: true,
          data: parsedResult,
          provider: this.name,
          latency: Date.now() - startTime
        };
        
      } catch (parseError) {
        console.error('Failed to parse Azure response:', content);
        
        // Fallback: try to extract a number for score
        const scoreMatch = content.match(/(\d+)/);
        const fallbackScore = scoreMatch ? parseInt(scoreMatch[1]) : 75;
        
        return {
          success: true,
          data: {
            matchScore: Math.max(0, Math.min(100, fallbackScore)),
            explanation: "Score extracted from text analysis"
          },
          provider: this.name,
          latency: Date.now() - startTime
        };
      }

    } catch (error: any) {
      console.error('Azure provider error:', error);
      
      return {
        success: false,
        error: 'Azure API request failed',
        details: error?.message || String(error),
        provider: this.name,
        latency: Date.now() - startTime
      };
    }
  }
}