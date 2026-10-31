import { LLMOrchestrator } from '../services/llm/orchestrator';
import { LLMConfig } from '../services/llm/types';

interface CheckAffirmationMatchResult {
  matchScore: number;
  explanation: string;
}

export async function checkAffirmationMatch(
  expectedAffirmation: string,
  spokenText: string
): Promise<{ success: boolean; data?: CheckAffirmationMatchResult; error?: string; details?: string }> {
  console.log('checkAffirmationMatch called');
  
  try {
    if (!expectedAffirmation || !spokenText) {
      console.error('Missing required fields');
      return {
        success: false,
        error: 'Missing required fields'
      };
    }

    // Get configuration from expo config
    // Server-only: called from app/check-affirmation-match+api.ts, keys come from the server env
    const groqApiKey = process.env.GROQ_API_KEY;
    const groqEnabled = (process.env.GROQ_ENABLED ?? 'true') === 'true';
    const timeoutMs = parseInt(process.env.LLM_TIMEOUT_MS || '2000');
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    
    console.log('LLM config check:', {
      hasGroqKey: !!groqApiKey,
      groqEnabled,
      hasAzureEndpoint: !!azureEndpoint,
      hasAzureApiKey: !!azureApiKey,
      timeoutMs
    });

    // Build LLM configuration
    const llmConfig: LLMConfig = {
      groqEnabled: groqEnabled && !!groqApiKey,
      groqApiKey,
      azureEndpoint,
      azureApiKey,
      timeoutMs
    };

    // Ensure at least one provider is available
    if (!llmConfig.groqEnabled && (!azureEndpoint || !azureApiKey)) {
      console.error('No LLM providers configured');
      return {
        success: false,
        error: 'No LLM providers configured'
      };
    }

    // Initialize orchestrator and perform match check
    const orchestrator = new LLMOrchestrator(llmConfig);
    const result = await orchestrator.checkAffirmationMatch(expectedAffirmation, spokenText);
    
    console.log('LLM orchestrator result:', result);
    
    return result;

  } catch (error: any) {
    console.error('Check affirmation match error:', error);
    
    return {
      success: false,
      error: 'Failed to check affirmation match',
      details: error?.message || String(error)
    };
  }
}