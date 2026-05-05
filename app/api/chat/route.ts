import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, platforms } = body;

    if (!message || !platforms) {
      console.error('[chat] Missing required fields:', { message: !!message, platforms: !!platforms });
      return NextResponse.json(
        { response: 'Missing message or platforms in request body.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[chat] GEMINI_API_KEY is not set');
      return NextResponse.json(
        { response: 'Server misconfiguration: GEMINI_API_KEY is not set.' },
        { status: 500 }
      );
    }

    const platformList = (platforms as string[]).join(', ');
    const systemPrompt = `You are a privacy assistant for a web app called Privacy Guardian. The user is monitoring these platforms: ${platformList}. Explain what data social media apps collect in a simple, neutral, factual way. Only answer privacy-related questions about these platforms. Politely decline anything unrelated.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: message }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('[chat] Gemini API error:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        { response: `Gemini error ${geminiResponse.status}: ${data?.error?.message ?? geminiResponse.statusText}` },
        { status: geminiResponse.status }
      );
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('[chat] Unexpected Gemini response shape:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        { response: 'Gemini returned an empty or unexpected response.' },
        { status: 500 }
      );
    }

    console.log('[chat] Success');
    return NextResponse.json({ response: text }, { status: 200 });

  } catch (error) {
    console.error('[chat] Unhandled exception:', error);
    return NextResponse.json(
      { response: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}