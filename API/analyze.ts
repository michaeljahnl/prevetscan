import { GoogleGenAI, Type } from "@google/genai";

// This tells Vercel to run this as an edge function (fast, serverless)
export const config = {
  runtime: 'edge',
};

// Schema for structured health analysis (same as your current one)
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    severity: {
      type: Type.STRING,
      enum: ['Healthy', 'Low', 'Moderate', 'High', 'Critical'],
      description: "The estimated severity of the issue observed."
    },
    title: {
      type: Type.STRING,
      description: "A short, clinical summary of the visual finding."
    },
    observations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of specific visual indicators found in the image."
    },
    recommendation: {
      type: Type.STRING,
      description: "Actionable advice for the pet owner."
    },
    disclaimer: {
      type: Type.STRING,
      description: "A mandatory disclaimer stating this is AI advice."
    },
    financialForecast: {
      type: Type.STRING,
      description: "Cost savings estimate."
    }
  },
  required: ["severity", "title", "observations", "recommendation", "disclaimer", "financialForecast"]
};

export default async function handler(req: Request) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get the image and category from the request
    const { image, category } = await req.json();

    // Get API key from environment variable (secure, not exposed to browser)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response('API key not configured', { status: 500 });
    }

    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are an expert veterinary AI assistant. 
      Analyze this image of a pet's ${category}. 
      Identify any potential health issues, abnormalities, or signs of disease.
      
      CRITICAL: act as a financial forecaster for the pet owner. 
      Identify how catching this specific issue at this specific stage saves money compared to waiting until it gets worse.
      Example: "Cleaning teeth now ($0-$300) prevents extraction surgery later ($1200+)."
      
      Be precise, empathetic, but realistic. 
      If the image is unclear or not of a pet, state that in the observations and mark severity as Low or Healthy.
    `;

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    // Return the analysis result
    return new Response(jsonText, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Analysis failed:", error);
    return new Response(
      JSON.stringify({ error: 'Analysis failed' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}