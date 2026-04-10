// OpenRouter API service for LearnerBot
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string | any[];
}

export interface ApiResponse {
  message: string;
  error?: string;
}

class OpenRouterApiService {
  private apiKey: string;
  private model: string;

  constructor() {
    // Attempt to load from env, but default to the raw key for maximum absolute reliability
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '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';
    this.model = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
    console.log(`[ApiService] Initialized Client-Side Direct OpenRouter Connection.`);
  }

  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    imageDataUrl?: string,
    locationContext?: string
  ): Promise<ApiResponse> {
    try {
      let finalContent: any = message || "Please analyze this plant image for diseases and provide treatment recommendations.";
      
      if (imageDataUrl) {
         finalContent = [
            { type: "text", text: message || "Please analyze this plant image for diseases and provide treatment recommendations." },
            { type: "image_url", image_url: { url: imageDataUrl } }
         ];
      }

      const messages: ChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content: finalContent }
      ];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'Plantiva Direct Client'
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'OpenRouter direct request failed.');
      }

      if (data && data.choices && data.choices[0] && data.choices[0].message) {
         // Prefix diagnostic only if image was sent
         const diagnosticPrefix = imageDataUrl ? `[System: Client-side parsed ${Math.round(imageDataUrl.length / 1000)}KB image successfully] ` : '';
         return {
           message: diagnosticPrefix + data.choices[0].message.content,
         };
      }

      throw new Error("Invalid response from OpenRouter");

    } catch (error) {
      console.error('API proxy error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      let friendlyMessage = `🌿 Hello there, botanical friend! I couldn't reach the AI directly from your browser. Please check your internet connection or API key.`;
      
      if (errorMessage.includes('credits')) {
        friendlyMessage = `💎 **AI Power Capacity Exceeded:** My botanical brain is resting because the AI energy (credits) for this project has run out.`;
      }

      return {
        message: friendlyMessage,
        error: errorMessage,
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.sendMessage("Hello, are you working?");
      return !response.error;
    } catch (error) {
      return false;
    }
  }

  async getAvailableModels(): Promise<any[]> { return []; }
  async analyzeImageWithHuggingFace(_imageDataUrl: string): Promise<any[]> { return []; }
}

export const apiService = new OpenRouterApiService();