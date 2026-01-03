import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, HealthCategory } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing. Please check your environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-build' });

// Schema for structured health analysis
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
      description: "A short, clinical summary of the visual finding (e.g., 'Mild Gingivitis', 'Corneal Clouding')."
    },
    observations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of specific visual indicators found in the image."
    },
    recommendation: {
      type: Type.STRING,
      description: "Actionable advice for the pet owner (e.g., 'Monitor for 2 days', 'See a vet immediately')."
    },
    disclaimer: {
      type: Type.STRING,
      description: "A mandatory disclaimer stating this is AI advice and not a medical diagnosis."
    },
    financialForecast: {
      type: Type.STRING,
      description: "Estimate the potential cost savings of addressing this issue now vs later. Format: 'Treating now: ~$X. Treating later: ~$Y.' Be realistic based on average US veterinary costs."
    }
  },
  required: ["severity", "title", "observations", "recommendation", "disclaimer", "financialForecast"]
};

export const analyzePetImage = async (
  base64Image: string,
  category: HealthCategory
): Promise<AnalysisResult> => {
  try {
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        // Using thinking budget for analysis to ensure deep checking of visual symptoms
        thinkingConfig: { thinkingBudget: 1024 } 
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    return JSON.parse(jsonText) as AnalysisResult;

  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const streamChatResponse = async function* (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string,
  image: string | null,
  useDeepThinking: boolean
) {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
      config: {
        systemInstruction: `You are 'Pre Vet Scan' AI. 
        
        CORE MISSION: You are an UNBIASED Second Opinion. 
        Unlike insurance companies (Trupanion, etc.), you have no financial incentive to deny claims or upsell treatments.
        
        CAPABILITIES:
        1. Symptom Triage: Analyze photos of pets to assess urgency.
        2. QUOTE AUDITING: If the user uploads a vet bill or estimate, analyze line items. Flag vague charges, compare costs to regional averages, and suggest questions to ask the vet.
        3. Prevention ROI: Always highlight the cost of inaction.

        If asked about treatment options, mention:
        1. The conservative/preventative path.
        2. The standard veterinary path.
        3. The rough estimated costs of both.
        
        ALWAYS clarify that you are an AI and not a replacement for a real doctor.
        In thinking mode, explore all possibilities thoroughly, including rare conditions or complex pricing structures.`,
        thinkingConfig: useDeepThinking ? { thinkingBudget: 32768 } : undefined,
      }
    });

    // Construct the message payload. If an image is present, send it as a part.
    const messagePayload = image 
      ? [
          { text: newMessage },
          { inlineData: { mimeType: 'image/jpeg', data: image } }
        ]
      : newMessage;

    const result = await chat.sendMessageStream({ message: messagePayload });

    for await (const chunk of result) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Chat stream failed:", error);
    throw error;
  }
};