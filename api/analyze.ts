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

PROVIDE A COMPREHENSIVE, STRUCTURED ANALYSIS.

Provide your response as valid JSON with this EXACT structure:
{
  "severity": "Healthy|Low|Moderate|High|Critical",
  "title": "Brief clinical summary (e.g., 'Severe Ulcerative Paw Lesion Requiring Urgent Assessment')",
  "observations": [
    "Specific visual detail 1",
    "Specific visual detail 2",
    "Specific visual detail 3",
    "Specific visual detail 4"
  ],
  "possibleCauses": [
    "**Cause 1 Name**: Brief explanation of this possibility",
    "**Cause 2 Name**: Brief explanation of this possibility",
    "**Cause 3 Name**: Brief explanation of this possibility"
  ],
  "vetWillExamine": [
    "Comprehensive physical examination focusing on...",
    "Diagnostic tests such as...",
    "Assessment of..."
  ],
  "questionsToAsk": [
    "What are the most probable causes based on your clinical assessment?",
    "What specific diagnostic tests do you recommend?",
    "What is the proposed treatment plan and timeline?",
    "What signs should I monitor that indicate improvement or worsening?"
  ],
  "urgency": "Clear timeline: 'Immediate (within 4 hours)' or 'Urgent (within 24-48 hours)' or 'Schedule soon (within 1 week)' or 'Routine checkup'",
  "nextSteps": "Brief guidance on immediate care at home before vet visit",
  "financialForecast": "Early treatment: $X-Y range. Delayed complications: $Z+ range. Include specific procedures.",
  "disclaimer": "This AI analysis is for informational purposes only and is not a veterinary diagnosis. Only a licensed veterinarian can diagnose your pet through in-person examination. Seek immediate veterinary care if you observe concerning symptoms."
}

CRITICAL LEGAL REQUIREMENTS:
- Use cautious language: "consistent with," "may indicate," "warrants examination for," "could suggest"
- List MULTIPLE possibilities in possibleCauses
- Never make definitive diagnoses
- Emphasize professional examination is required

Keep each array item concise (1-2 sentences max) for readability.`;

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