import { LLMProvider, LLMResult, LLMConfig } from './types';
import { GroqProvider } from './groq-provider';
import { AzureProvider } from './azure-provider';

export class LLMOrchestrator {
  private providers: LLMProvider[] = [];
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.initializeProviders();
  }

  private initializeProviders() {
    // Primary: Groq (if enabled and configured)
    if (this.config.groqEnabled && this.config.groqApiKey) {
      try {
        const groqProvider = new GroqProvider(this.config.groqApiKey, this.config.timeoutMs);
        this.providers.push(groqProvider);
        console.log('✅ Groq provider initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Groq provider:', error);
      }
    } else {
      console.log('⏭️ Groq provider disabled or not configured');
    }

    // Fallback: Azure OpenAI (if configured)
    if (this.config.azureEndpoint && this.config.azureApiKey) {
      try {
        const azureProvider = new AzureProvider(
          this.config.azureEndpoint, 
          this.config.azureApiKey, 
          this.config.timeoutMs * 2 // Give Azure more time since it's fallback
        );
        this.providers.push(azureProvider);
        console.log('✅ Azure provider initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Azure provider:', error);
      }
    } else {
      console.log('⏭️ Azure provider not configured');
    }

    if (this.providers.length === 0) {
      throw new Error('No LLM providers could be initialized');
    }

    console.log(`🚀 LLM Orchestrator ready with ${this.providers.length} provider(s): ${this.providers.map(p => p.name).join(', ')}`);
  }

  async checkAffirmationMatch(expectedAffirmation: string, spokenText: string): Promise<LLMResult> {
    console.log(`🎯 Starting affirmation match check with ${this.providers.length} provider(s)`);
    
    let lastError: LLMResult | null = null;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const isPrimary = i === 0;
      const isLastProvider = i === this.providers.length - 1;
      
      console.log(`🔄 Trying ${provider.name} (${isPrimary ? 'primary' : 'fallback'})...`);
      
      try {
        // Quick availability check (skip for last provider to avoid double delay)
        if (!isLastProvider) {
          const isAvailable = await provider.isAvailable();
          if (!isAvailable) {
            console.log(`⚠️ ${provider.name} is not available, trying next provider`);
            continue;
          }
        }

        // Attempt the match check
        const result = await provider.checkAffirmationMatch(expectedAffirmation, spokenText);
        
        if (result.success) {
          console.log(`✅ ${provider.name} succeeded in ${result.latency}ms with score: ${result.data?.matchScore}`);
          
          // Log provider usage for monitoring
          this.logProviderUsage(provider.name, result.latency, true);
          
          return result;
        } else {
          console.log(`❌ ${provider.name} failed: ${result.error}`);
          lastError = result;
        }

      } catch (error) {
        console.error(`💥 ${provider.name} threw exception:`, error);
        lastError = {
          success: false,
          error: `${provider.name} exception`,
          details: String(error),
          provider: provider.name,
          latency: 0
        };
      }
    }

    // All providers failed
    console.error('💀 All LLM providers failed');
    this.logProviderUsage('all_failed', 0, false);
    
    // Return the last error or a generic failure
    return lastError || {
      success: false,
      error: 'All LLM providers failed',
      provider: 'orchestrator',
      latency: 0
    };
  }

  private logProviderUsage(providerName: string, latency: number, success: boolean) {
    // This could be enhanced to send to analytics/monitoring service
    console.log(`📊 LLM Usage - Provider: ${providerName}, Latency: ${latency}ms, Success: ${success}`);
    
    // Example: Send to analytics service
    // analytics.track('llm_usage', {
    //   provider: providerName,
    //   latency,
    //   success,
    //   timestamp: new Date().toISOString()
    // });
  }

  // Method to get current provider health status
  async getProviderStatus(): Promise<{ [providerName: string]: boolean }> {
    const status: { [providerName: string]: boolean } = {};
    
    await Promise.all(
      this.providers.map(async (provider) => {
        try {
          status[provider.name] = await provider.isAvailable();
        } catch (error) {
          status[provider.name] = false;
        }
      })
    );
    
    return status;
  }
}