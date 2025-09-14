import axios, { AxiosInstance } from 'axios';
import { logger } from '@takeone/utils';

export interface CerebrasResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface CerebrasMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class CerebrasClient {
  private client: AxiosInstance;
  private readonly model: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Cerebras API key is required');
    }

    this.model = process.env.CEREBRAS_MODEL || 'llama3.1-70b';
    
    logger.info('Initializing Cerebras client', { 
      model: this.model, 
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey.length 
    });
    
    this.client = axios.create({
      baseURL: 'https://api.cerebras.ai/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds timeout for AI requests
    });
  }

  async generateCompletion(
    messages: CerebrasMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    } = {}
  ): Promise<string> {
    try {
      const response = await this.client.post<CerebrasResponse>('/chat/completions', {
        model: this.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
        top_p: options.topP || 0.9,
        stream: false,
      });

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from Cerebras API');
      }

      logger.info('Cerebras completion generated', {
        model: this.model,
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens,
      });

      return content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Cerebras API error', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message,
          type: error.response?.data?.error?.type,
        });
        
        if (error.response?.status === 401) {
          throw new Error('Invalid Cerebras API key');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded for Cerebras API');
        } else if (error.response?.status === 503) {
          throw new Error('Cerebras API is temporarily unavailable');
        }
        
        throw new Error(`Cerebras API error: ${error.response?.data?.error?.message || error.message}`);
      }
      
      throw new Error(`Failed to generate completion: ${error}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; model: string }> {
    try {
      const testMessages: CerebrasMessage[] = [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with a simple "OK" to confirm the connection.'
        },
        {
          role: 'user',
          content: 'Test connection'
        }
      ];

      const response = await this.generateCompletion(testMessages, {
        temperature: 0,
        maxTokens: 10
      });

      return {
        success: true,
        model: this.model
      };
    } catch (error) {
      logger.error('Cerebras connection test failed', { error });
      throw error;
    }
  }

  async generateJSON<T = any>(
    messages: CerebrasMessage[],
    schema: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      retries?: number;
    } = {}
  ): Promise<T> {
    const { retries = 3, ...completionOptions } = options;
    
    // Add JSON formatting instruction to system message
    const enhancedMessages = [...messages];
    if (enhancedMessages[0]?.role === 'system') {
      enhancedMessages[0].content += `\n\nIMPORTANT: You must respond with valid JSON that matches this schema:\n${schema}\n\nRespond ONLY with the JSON object, no additional text or formatting.`;
    } else {
      enhancedMessages.unshift({
        role: 'system',
        content: `You must respond with valid JSON that matches this schema:\n${schema}\n\nRespond ONLY with the JSON object, no additional text or formatting.`
      });
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.generateCompletion(enhancedMessages, completionOptions);
        
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : response.trim();
        
        try {
          return JSON.parse(jsonText) as T;
        } catch (parseError) {
          logger.warn(`JSON parse failed on attempt ${attempt}`, { 
            response: response.substring(0, 500),
            parseError 
          });
          
          if (attempt === retries) {
            throw new Error(`Failed to parse JSON response after ${retries} attempts: ${parseError}`);
          }
          
          // Add a retry instruction
          enhancedMessages.push({
            role: 'assistant',
            content: response
          });
          enhancedMessages.push({
            role: 'user',
            content: 'That was not valid JSON. Please provide only a valid JSON object that matches the required schema.'
          });
        }
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        logger.warn(`Cerebras request failed on attempt ${attempt}`, { error });
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error('Max retries exceeded');
  }
}
