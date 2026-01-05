import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { image, category } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response('API key not configured', { status: 500 });
    }

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert veterinary AI assistant analyzing a pet's ${category}.

PROVIDE A COMPREHENSIVE ANALYSIS INCLUDING:
1. Detailed visual observations (colors, textures, shapes, symmetry, abnormalities)
2. Multiple possible causes (list 2-3 differential considerations - what this COULD be)
3. What a veterinarian would examine further during an in-person visit
4. Specific questions the owner should ask their vet
5. Urgency level and timeline for veterinary consultation

CRITICAL LEGAL REQUIREMENTS:
- NEVER make definitive diagnoses
- ALWAYS use phrases like "consistent with," "may indicate," "warrants examination for," "could suggest"
- List MULTIPLE possibilities, never single conclusions
- Emphasize that ONLY in-person veterinary examination can diagnose
- Be thorough but cautious

FINANCIAL FORECASTING:
Compare early intervention costs vs delayed treatment costs with specific dollar ranges.
Example: "Addressing this now ($100-$500) prevents potential complications later ($800-$3000+)."

Provide your response as valid JSON:
{
  "severity": "Healthy|Low|Moderate|High|Critical",
  "title": "Brief clinical summary (e.g., 'Inflamed Lesion Requiring Veterinary Assessment')",
  "observations": [
    "Detailed observation 1 with specifics",
    "Detailed observation 2 with specifics",
    "Detailed observation 3 with specifics"
  ],
  "recommendation": "Comprehensive guidance including: urgency timeline, what vet will examine, questions to ask, and next steps. Use cautious language: 'may indicate', 'consistent with', 'warrants examination'. Include 2-3 possible causes.",
  "disclaimer": "This AI analysis is for informational purposes only and is not a veterinary diagnosis. Only a licensed veterinarian can diagnose your pet through in-person examination. Seek immediate veterinary care if you observe concerning symptoms.",
  "financialForecast": "Specific cost comparison with ranges (e.g., early treatment $X-Y vs delayed treatment $Z+)"
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: image
        }
      }
    ]);

    const text = result.response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;

    return new Response(jsonText, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Full error details:", error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed',
        details: error.message,
        errorType: error.constructor.name,
        stack: error.stack?.substring(0, 500)
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}