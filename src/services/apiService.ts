// OpenRouter API service for LearnerBot
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ApiResponse {
  message: string;
  error?: string;
}

class OpenRouterApiService {
  private backendUrl: string;

  constructor() {
    let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005/api';
    // Ensure the URL ends with /api but doesn't double it
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    if (!baseUrl.endsWith('/api')) baseUrl += '/api';
    
    this.backendUrl = baseUrl;
    console.log(`[ApiService] Initialized with backend: ${this.backendUrl}`);
  }

  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    imageDataUrl?: string,
    locationContext?: string
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.backendUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, conversationHistory, imageDataUrl, locationContext }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('PLAN_CREDITS_EXHAUSTED');
        }
        throw new Error(data.error || 'OpenRouter proxy request failed.');
      }

      return {
        message: data.message,
      };
    } catch (error) {
      console.error('API proxy error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      let friendlyMessage = `🌿 Hello there, botanical friend! I couldn't reach the Plantiva backend right now. Please check your server configuration or try again later.`;
      
      if (errorMessage.includes('PLAN_CREDITS_EXHAUSTED')) {
        friendlyMessage = `💎 **AI Power Capacity Exceeded:** My botanical brain is currently resting because the AI energy (credits) for this project has run out. \n\nPlease add credits to your OpenRouter account or wait for a reset to continue our expert diagnosis! ✨`;
      } else if (errorMessage.includes('API key not configured')) {
        friendlyMessage = `🔑 **Configuration Needed:** I'm ready to help, but my API key haven't been set up yet. Please configure your environment variables to start the scan!`;
      }

      return {
        message: friendlyMessage,
        error: errorMessage,
      };
    }
  }

  // Test the API connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.sendMessage("Hello, are you working?");
      return !response.error;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }

  // Get available models
  async getAvailableModels(): Promise<any[]> {
    console.warn('Model listing is not available in the frontend proxy implementation.');
    return [];
  }

  // Analyze image with Hugging Face Inference API
  async analyzeImageWithHuggingFace(_imageDataUrl: string): Promise<any[]> {
    console.warn('Hugging Face image analysis is handled on the backend and not available in the frontend service.');
    return [];
  }
}

export const apiService = new OpenRouterApiService();