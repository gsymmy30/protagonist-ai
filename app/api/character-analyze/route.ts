import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { name, photoUrls = [], tags = [], description = "" } = await req.json();

    // 🟣 Rich multimodal system prompt
    const systemPrompt = `
You are an award-winning film screenwriter and casting director. You are building a character profile for a major motion picture, using real photos, a name, user-provided notes, and a set of personality tags.

You MUST:
- Write a vivid, immersive character analysis that is exactly 8 to 9 lines long.
- Begin with a highly visual description of the character's physical presence, style, and unique features based on the provided images (2–3 sentences minimum). Mention facial details, hair, clothing style, posture, and anything visually distinctive.
- Continue by blending in personality and energy—use both what you see and the provided tags. Let the photos lead the analysis, with tags and description as supporting evidence.
- Subtly introduce a minor, realistic imperfection or quirk. It should feel authentic and human—not a flaw that ruins them, but something that gives them dimension.
- Write in immersive, cinematic language—show, don't tell. Every line should paint a picture as if you’re pitching the character to a film director.
- DO NOT just summarize each photo or write a separate line for each; instead, synthesize all the cues into a single, cohesive analysis.
- Add a cinematic comparison — a composite archetype that blends two or more real actors, celebrities, or iconic characters (e.g., “He’s got the soulful confidence of a young Dev Patel meets the effortless cool of Jason Momoa at a Berlin rave”). The comparison must feel evocative and cinematic, not like a simple reference.
- End with a playful, punchy, one-line Gen Z tagline for the character. This tagline should feel like something you’d see on TikTok or a character card—quickly capturing their vibe. Do not include the quirk or imperfection in the tagline. Do NOT include the name in the tagline.

Return your result as a JSON object:
{
  "analysis": "The full, detailed, cinematic visual-personality analysis here.",
  "tagline": "One Gen Z-style tagline for this character."
}

Do not include anything else—**just valid JSON**.
`;

    // 🟣 Build OpenAI messages with multimodal blocks
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Name: ${name}\nTags: ${tags.join(", ")}${
              description ? `\nUser's note: "${description}"` : ""
            }`,
          },
          ...photoUrls.slice(0, 4).map((url: string) => ({
            type: "image_url",
            image_url: { url },
          })),
        ],
      },
    ];

    // 🟣 Call OpenAI
    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 500,
      temperature: 0.95,
      response_format: { type: "text" }, // Still return as text, parsing JSON below
    });

    // Parse JSON object from OpenAI's response
    const content = aiRes.choices[0]?.message.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { analysis: "", tagline: "" };
    console.log(parsed);
    return NextResponse.json({ analysis: parsed.analysis, tagline: parsed.tagline });
  } catch (err) {
    console.error("Character analysis error:", err);
    return NextResponse.json(
      { analysis: "Sorry, something went wrong generating your character analysis.", tagline: "" },
      { status: 500 }
    );
  }
}
