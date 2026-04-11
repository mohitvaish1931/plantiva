// API service for Plantiva
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ApiResponse {
  message: string;
  error?: string;
}

class ApiService {
  private backendUrl: string;

  constructor() {
    // Use VITE_API_BASE_URL from env, which should be https://plantiva-2.onrender.com on Vercel
    // Fall back to '/api' for local development (which Vite proxies to localhost:5005)
    this.backendUrl = import.meta.env.VITE_API_BASE_URL || '/api';
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
        body: JSON.stringify({ 
          message, 
          conversationHistory, 
          imageDataUrl, 
          locationContext 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Cognitive link failed.');
      }

      return {
        message: data.message,
      };
    } catch (error) {
      console.error('[Plantiva] API Error:', error);
      return {
        message: `🌿 **System Notice:** I'm having a brief moment of reflection. Please try sending your plant query again!`,
        error: String(error),
      };
    }
  }

  async testConnection(): Promise<boolean> { return true; }
}

export const apiService = new ApiService();