export interface CheckAffirmationMatchResult {
  matchScore: number;
  explanation: string;
}

export interface LLMResult {
  success: boolean;
  data?: CheckAffirmationMatchResult;
  error?: string;
  details?: string;
  provider: string;
  latency: number;
}

export interface LLMProvider {
  name: string;
  checkAffirmationMatch(expectedAffirmation: string, spokenText: string): Promise<LLMResult>;
  isAvailable(): Promise<boolean>;
}

export interface LLMConfig {
  groqEnabled: boolean;
  groqApiKey?: string;
  azureEndpoint?: string;
  azureApiKey?: string;
  timeoutMs: number;
}