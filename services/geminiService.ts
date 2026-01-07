import { AnalysisResult } from "../types";

export async function analyzePetImage(
  base64Image: string,
  category: string,
  turnstileToken: string
): Promise<AnalysisResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: base64Image,
      category,
      turnstileToken,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Pass through your nice backend errors
    const msg = data?.error || data?.details || "Analysis failed";
    throw new Error(msg);
  }

  // data is JSON already (your API returns JSON text with JSON content-type)
  return data as AnalysisResult;
}
