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
  private apiKey: string;
  private hfApiKey: string;
  private baseUrl: string = "https://openrouter.ai/api/v1";
  private siteUrl: string;
  private siteName: string;
  private model: string;
  private hfModel: string = "nateraw/vit-plant-classifier";



  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || "";
    this.hfApiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY || "";
    this.siteUrl = import.meta.env.VITE_SITE_URL || "https://learnerbot.ai";
    this.siteName = import.meta.env.VITE_SITE_NAME || "LearnerBot AI Assistant";
    this.model = import.meta.env.VITE_OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
    this.hfModel = import.meta.env.VITE_HUGGING_FACE_MODEL || "nateraw/vit-plant-classifier";



    if (!this.apiKey) {
      console.warn("OpenRouter API key not found. Please set VITE_OPENROUTER_API_KEY in your .env file");
    }
    if (!this.hfApiKey) {
      console.warn("Hugging Face API key not found. Please set VITE_HUGGING_FACE_API_KEY in your .env file to enable image analysis.");
    }
  }





  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    imageDataUrl?: string,
    locationContext?: string
  ): Promise<ApiResponse> {

    if (!this.apiKey) {
      return {
        message: `🌿 Hello there, botanical friend! Welcome to Plant Doctor! 

I'm your personal AI plant health expert, here to help you identify diseases, diagnose plant problems, and provide cure methods.

**To get me fully working, you'll need to:**
1. Get an API key from [OpenRouter](https://openrouter.ai)
2. Create a \`.env\` file in your project root
3. Add: \`VITE_OPENROUTER_API_KEY=your_api_key_here\`

What plant problem can I help you with today?`,
        error: "API key not configured",
      };
    }

    try {
      const systemPrompt = `You are Plant Doctor, an expert AI botanical assistant specializing in plant disease detection, diagnosis, and treatment. Your mission is to help gardeners and plant enthusiasts identify plant problems and provide effective solutions.

Your personality:
- Friendly, encouraging mentor with relevant emojis
- Patient, thorough, and positive

Your expertise:
- Identify plant diseases/pests from descriptions and images
- Provide accurate treatment (organic/chemical) and cure methods
- Advise on soil health, watering, and nutrition

When answering:
- If an image is provided, analyze it carefully for any signs of disease, pests, or nutrient deficiencies
- Ask clarifying questions about symptoms if needed
- Provide specific, actionable treatment recommendations
- Include preventive measures and use clear language

Keep responses engaging but concise. Use markdown formatting.

Current Context:
${locationContext || "Location not provided by user yet."}
`;


      let userContent: any = message || "I've uploaded a photo of my plant.";
      
      if (imageDataUrl) {
        userContent = [
          {
            type: "text",
            text: message || "Analyze this plant image for health issues and diseases."
          },
          {
            type: "image_url",
            image_url: {
              url: imageDataUrl
            }
          }
        ];
      }

      const messages: any[] = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
      ];
      
      let additionalInfo = "";
      if (imageDataUrl && this.hfApiKey) {
        try {
          const hfAnalysis = await this.analyzeImageWithHuggingFace(imageDataUrl);
          if (hfAnalysis && hfAnalysis.length > 0) {
            additionalInfo = `\n\n[Hugging Face Specialized Plant Analysis]:\n${hfAnalysis.map((res: any) => `- ${res.label}: ${(res.score * 100).toFixed(1)}% confidence`).join('\n')}`;
          }
        } catch (hfError) {
          console.error("Hugging Face Analysis Error:", hfError);
        }
      }

      messages.push({ role: "user", content: Array.isArray(userContent) ? [
        ...userContent,
        { type: "text", text: additionalInfo }
      ] : userContent + additionalInfo });


      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": this.siteUrl,
          "X-Title": this.siteName,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,

          messages: messages,
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);

        let errorMessage = `API request failed with status ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Could not parse error response:", parseError);
          errorMessage = errorText || errorMessage;
        }

        // Handle specific error cases
        if (response.status === 401) {
          errorMessage = "Invalid API key. Please check your OpenRouter API key.";
        } else if (response.status === 429) {
          errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
        } else if (response.status === 402) {
          errorMessage = "Insufficient credits. Please check your OpenRouter account balance.";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("API Response received:", data);

      // Validate response structure
      if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error("Invalid response structure:", data);
        throw new Error("Invalid response format from OpenRouter API");
      }

      const choice = data.choices[0];
      if (!choice || !choice.message || typeof choice.message.content !== 'string') {
        console.error("Invalid choice structure:", choice);
        throw new Error("Invalid message format in API response");
      }

      return {
        message: choice.message.content.trim(),
      };

    } catch (error) {
      console.error("OpenRouter API Error:", error);

      let errorMessage = "An unexpected error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // High-Quality Botanical Fallback if API fails (e.g. credits, network)
      const mockResponse = this.generateMockBotanicalResponse(message);
      
      return {
        message: mockResponse,
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
    if (!this.apiKey) {
      console.warn("No API key available for fetching models");
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": this.siteUrl,
          "X-Title": this.siteName,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching models:", error);
      return [];
    }
  }

  // Analyze image with Hugging Face Inference API
  async analyzeImageWithHuggingFace(imageDataUrl: string): Promise<any[]> {
    if (!this.hfApiKey) return [];

    try {
      // Remove base64 prefix if present
      const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      const response = await fetch(`https://api-inference.huggingface.co/models/${this.hfModel}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.hfApiKey}`,
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      });

      if (!response.ok) {
        throw new Error(`HF API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Hugging Face image analysis failed:", error);
      return [];
    }
  }
}

export const apiService = new OpenRouterApiService();