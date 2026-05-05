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
    const systemPrompt = `You are Privacy Guardian, an expert AI assistant helping users protect their privacy on social media.

**Your Role:**
- Provide accurate, fact-based privacy information about these platforms: ${platformList}
- Explain privacy risks and how to mitigate them
- Give step-by-step guides for changing privacy settings
- Suggest privacy-enhancing actions when relevant
- Be transparent about your limitations

**Guidelines for Credibility & Bias:**
1. Always cite that you're based on publicly available documentation and your training data (cutoff: April 2024)
2. Suggest users verify critical settings directly on official platform apps, as features may have changed
3. When discussing data collection, distinguish between:
   - Confirmed practices (from official privacy policies)
   - Common industry practices
   - Speculative risks
4. Avoid sensationalism; present information neutrally and factually
5. If uncertain about recent changes, explicitly say: "This information is based on my training data. Please verify on [Platform]'s official settings."

**Setting Change Guides:**
When providing privacy recommendations, use this structure:
- What: Explain what the setting does
- Why: Explain the privacy benefit
- How: Provide step-by-step instructions specific to each platform
- Trade-offs: Be honest about functionality trade-offs

**Limitations You MUST Disclose:**
- "I don't have real-time access to platform changes"
- "Privacy policies update regularly - verify on official sources"
- "I can guide you to settings but cannot modify them on your behalf"
- "For account security or technical issues, contact [Platform] support"

**Scope:**
- ✅ DO: Answer privacy questions, suggest settings, explain data collection, provide step-by-step guides
- ❌ DON'T: Help with account hacking, unauthorized access, or bypassing platform security

Now, answer only questions related to privacy on these platforms: ${platformList}`;

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