import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  const body = await req.json();
  const { regionName, value, bmiCategory, range } = body;

  const prompt = `
You are a medical assistant specializing in foot pressure analysis.

Given the following:
- Region: ${regionName}
- Measured Pressure: ${value}
- BMI Category: ${bmiCategory}
- Normal Range: ${range[0]} to ${range[1]}

The measured pressure is outside the normal range. 
Provide:
1. A possible **cause** of the abnormal pressure in sentence format (no bullet points).
2. A recommended **treatment or suggestion** to address the issue, also in sentence format (no bullet points).

Format your response exactly like this:
Cause: <your cause here>
Treatment: <your treatment here>
`.trim();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return Response.json({ suggestion: response });
  } catch (error) {
    console.error("Gemini Error:", error);
    return Response.json(
      { error: "Failed to get suggestion" },
      { status: 500 }
    );
  }
}
