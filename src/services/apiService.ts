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
  private backendUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005/api';
  private siteUrl: string = import.meta.env.VITE_SITE_URL || 'https://plantiva-beta.vercel.app';
  private siteName: string = import.meta.env.VITE_SITE_NAME || 'Plantiva AI Assistant';
  private model: string = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
  private hfModel: string = import.meta.env.VITE_HUGGING_FACE_MODEL || 'nateraw/vit-plant-classifier';



  constructor() {
    if (!this.backendUrl) {
      console.warn('API base URL not configured. Using http://localhost:5005/api');
    }



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

  // Expert Simulation for botanical diagnosis when API is unavailable
  private generateMockBotanicalResponse(message: string): string {
    const input = message.toLowerCase();
    
    // Check for common symptoms
    if (input.includes('yellow') || input.includes('spots')) {
      return `🌿 **Expert Diagnosis from Plantiva:** \n\nBased on your description of **yellowing spots**, it's highly likely your plant is experiencing **Leaf Spot Disease** (often fungal or bacterial). \n\n**🔍 Identification:** \nSmall, dark circle or irregular shapes with a yellow halo. \n\n**📋 Immediate Actions:** \n1. **Isolate** the plant to prevent spreading. \n2. **Prune** the most affected leaves cautiously. \n3. **Improve Airflow:** Ensure your plant isn't too crowded. \n\n**🛡️ Organic Cure:** \nApply a homemade solution of 1 teaspoon of baking soda in 1 quart of water with a drop of liquid soap. Mist the leaves every 7-10 days. \n\nI'm still learning your specific plant's history! Upload more photos for a deeper scan! 🌱✨`;
    }

    if (input.includes('wilt') || input.includes('droop')) {
      return `🍂 **Expert Diagnosis from Plantiva:** \n\nIt sounds like your plant is **wilting**, which usually indicates a water movement issue—either **Under-watering** or severe **Root Rot**. \n\n**🔍 Tips:** \nCheck the soil moisture level 2 inches deep. If it's bone-dry, water thoroughly. If it's soaking wet, you might have root rot. \n\n**📋 Immediate Actions:** \n- Adjust your watering schedule based on soil moisture, not just calendar days. \n- Ensure the pot has drainage holes. \n\nI'm analyzing your plant's environment. Let me know if you see any discolored roots! 🌱`;
    }

    if (input.includes('pest') || input.includes('bugs') || input.includes('white')) {
      return `🪲 **Expert Diagnosis from Plantiva:** \n\nYou might be dealing with **Mealybugs** or **Powdery Mildew**. \n\n**🔍 Observation:** \nIf you see white, cottony clusters, it's mealybugs. If it looks like flour dusted on leaves, it's mildew. \n\n**📋 Treatment:** \n- For bugs: Use a cotton swab dipped in rubbing alcohol to remove them. \n- For mildew: Use a neem oil spray or horticultural soap. \n\nKeep your plant in a well-ventilated area! 🌿`;
    }

    // Default expert welcome
    return `🌿 **Welcome back to Plantiva!** \n\nI'm currently recalibrating my botanical brain to give you the most accurate results for that specific inquiry. \n\n**Here's what it looks like from my initial scan:** \nYour plant seems to be under some environmental stress. While I fetch the exact cure method from my vault, please ensure it's receiving **filtered light** and **well-draining soil**. \n\nWhat other symptoms are you noticing (spots, wilting, or odd bugs)? I'm ready to help! 🚀✨`;
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
  async analyzeImageWithHuggingFace(imageDataUrl: string): Promise<any[]> {
    console.warn('Hugging Face image analysis is handled on the backend and not available in the frontend service.');
    return [];
  }
}

export const apiService = new OpenRouterApiService();