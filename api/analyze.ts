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

    const ai = new GoogleGenerativeAI( apiKey );
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert veterinary AI assistant. Analyze this image of a pet's ${category}. 
    
Provide your response as valid JSON with this structure:
{
  "severity": "Healthy|Low|Moderate|High|Critical",
  "title": "Brief clinical summary",
  "observations": ["observation 1", "observation 2"],
  "recommendation": "Actionable advice",
  "disclaimer": "This is AI advice, not professional diagnosis",
  "financialForecast": "Cost savings estimate"
}

CRITICAL: Act as a financial forecaster. Example: "Cleaning teeth now ($0-$300) prevents extraction surgery later ($1200+)."`;

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
  }# Force deploy
# Deploy fix
