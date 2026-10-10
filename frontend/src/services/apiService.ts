// API service for Plantiva
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ScanAnalysis {
  plantName: string;
  species: string;
  healthScore: number | null;
  confidence: number | null;
  disease: string;
  status: string;
}

export interface ApiResponse {
  message: string;
  analysis?: ScanAnalysis | null;
  error?: string;
}

export interface SendOptions {
  imageDataUrl?: string;
  locationContext?: string;
  scanMode?: string;
}

const getBackendUrl = () => {
  // VITE_API_BASE_URL is https://plantiva-2.onrender.com/api on Vercel.
  // Falls back to '/api' for local development (Vite proxies it to localhost:5005).
  let base: string = import.meta.env.VITE_API_BASE_URL || '/api';
  if (base.endsWith('/')) base = base.slice(0, -1);
  if (base.startsWith('http') && !base.endsWith('/api')) base += '/api';
  return base;
};

// Older replies can still carry the trailing JSON block; never show it to the user.
export function stripAnalysisBlock(text: string): string {
  return text.replace(/```(?:json)?\s*\{[^`]*?"healthScore"[^`]*?```/gi, '').trim();
}

class ApiService {
  private backendUrl = getBackendUrl();

  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    options: SendOptions = {}
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
          imageDataUrl: options.imageDataUrl,
          locationContext: options.locationContext,
          scanMode: options.scanMode
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || typeof data.message !== 'string') {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      return {
        message: stripAnalysisBlock(data.message),
        analysis: data.analysis ?? null,
      };
    } catch (error) {
      console.error('[Plantiva] API Error:', error);
      const reason = error instanceof Error ? error.message : String(error);
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      return {
        message: offline
          ? "🌿 **You're offline.** Connect to the internet and try again."
          : `🌿 **I couldn't reach the Plantiva AI.**\n\n${reason}\n\nPlease try again in a moment.`,
        error: reason,
      };
    }
  }
}

export const apiService = new ApiService();
