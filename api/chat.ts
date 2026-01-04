import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { history, message, image, useDeepThinking } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response('API key not configured', { status: 500 });
    }

    const ai = new GoogleGenerativeAI(apiKey);

    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: `You are 'PreVetScan' AI. 

CORE MISSION: You are an UNBIASED Second Opinion. 
Unlike insurance companies, you have no financial incentive to deny claims or upsell treatments.

CAPABILITIES:
1. Symptom Triage: Analyze photos of pets to assess urgency.
2. QUOTE AUDITING: If the user uploads a vet bill or estimate, analyze line items. Flag vague charges, compare costs to regional averages.
3. Prevention ROI: Always highlight the cost of inaction.

If asked about treatment options, mention:
1. The conservative/preventative path.
2. The standard veterinary path.
3. The rough estimated costs of both.

ALWAYS clarify that you are an AI and not a replacement for a real doctor.`
    });

    const chat = model.startChat({
      history: history
    });

    // Prepare message with optional image
    const messagePayload = image 
      ? [
          { text: message },
          { inlineData: { mimeType: 'image/jpeg', data: image } }
        ]
      : [{ text: message }];

    // Stream the response
    const result = await chat.sendMessageStream(messagePayload);

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result) {
            controller.enqueue(encoder.encode(chunk.text));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (error) {
    console.error("Chat failed:", error);
    return new Response('Chat failed', { status: 500 });
  }
}