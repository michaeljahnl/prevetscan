import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: "edge",
};

async function verifyTurnstile(token: string, ip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return { success: false, error: "TURNSTILE_SECRET_KEY not configured" };
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  const data = await resp.json();
  return data as {
    success: boolean;
    "error-codes"?: string[];
    challenge_ts?: string;
    hostname?: string;
    action?: string;
    cdata?: string;
  };
}

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { image, category, turnstileToken } = await req.json();

    // 1) Authentication check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseKey || !geminiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2) Check credits BEFORE running expensive AI
    const { data: credits, error: creditsError } = await supabase.rpc('get_user_credits', { 
      p_user_id: user.id 
    });

    if (creditsError) {
      console.error('Credits check error:', creditsError);
      throw creditsError;
    }

    if (!credits || credits <= 0) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits',
        credits: 0,
        needsPayment: true
      }), { 
        status: 402, // Payment Required
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3) Require captcha token
    if (!turnstileToken || typeof turnstileToken !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing human verification token" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4) Verify token with Cloudflare Turnstile
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null;

    const turnstile = await verifyTurnstile(turnstileToken, ip);

    if (!turnstile.success) {
      return new Response(
        JSON.stringify({
          error: "Human verification failed",
          codes: turnstile["error-codes"] || [],
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5) Basic payload sanity checks
    if (!image || typeof image !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing image data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!category || typeof category !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing category" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6) Run Gemini analysis
    const ai = new GoogleGenerativeAI(geminiKey);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

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
          mimeType: "image/jpeg",
          data: image,
        },
      },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;
    const analysisResult = JSON.parse(jsonText);

    // 7) Save scan to database
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        category,
        image_url: `data:image/jpeg;base64,${image.substring(0, 100)}...`, // Store truncated
        severity: analysisResult.severity,
        title: analysisResult.title,
        observations: analysisResult.observations,
        possible_causes: analysisResult.possibleCauses,
        vet_will_examine: analysisResult.vetWillExamine,
        questions_to_ask: analysisResult.questionsToAsk,
        urgency: analysisResult.urgency,
        next_steps: analysisResult.nextSteps,
        financial_forecast: analysisResult.financialForecast,
        disclaimer: analysisResult.disclaimer
      })
      .select()
      .single();

    if (scanError) {
      console.error('Scan save error:', scanError);
      throw scanError;
    }

    // 8) Deduct credit atomically (with rollback on failure)
    const { data: deducted, error: deductError } = await supabase.rpc('deduct_scan_credit', {
      p_user_id: user.id,
      p_scan_id: scan.id
    });

    if (deductError || !deducted) {
      // Rollback: delete the scan if credit deduction failed
      await supabase.from('scans').delete().eq('id', scan.id);
      throw new Error('Credit deduction failed - possible race condition');
    }

    // 9) Get updated credit balance
    const { data: remainingCredits } = await supabase.rpc('get_user_credits', { 
      p_user_id: user.id 
    });

    // 10) Return analysis with metadata
    return new Response(JSON.stringify({
      ...analysisResult,
      scanId: scan.id,
      remainingCredits: remainingCredits || 0
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Full error details:", error);

    return new Response(
      JSON.stringify({
        error: "Analysis failed",
        details: error?.message ?? String(error),
        errorType: error?.constructor?.name ?? "UnknownError",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}