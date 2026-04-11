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
    // In MERN split, we use relative /api which Vercel or local proxy handles
    this.backendUrl = '/api';
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