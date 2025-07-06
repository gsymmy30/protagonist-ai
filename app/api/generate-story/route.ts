import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📨 Incoming request payload:", body);

    const { genre, prompt_context, characters_used, owner_id } = body;

    if (!characters_used || characters_used.length === 0) {
      console.error("❌ No characters provided.");
      return NextResponse.json({ error: "No characters provided." }, { status: 400 });
    }

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      console.error("❌ Missing or invalid token in request header");
      return NextResponse.json({ error: "Missing access token." }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const cleanCharacterIds = characters_used.map((id: string) => id.toString().trim());
    console.log("🔍 Fetching characters with IDs:", cleanCharacterIds);

    const { data: characters, error: charError } = await supabase
      .from("characters")
      .select("id, name, tagline, ai_analysis")
      .in("id", cleanCharacterIds);

    if (charError) {
      console.error("❌ Supabase error fetching characters:", charError);
      return NextResponse.json({ error: "Error fetching character data." }, { status: 500 });
    }

    if (!characters || characters.length === 0) {
      const { data: allCharacters } = await supabase.from("characters").select("id, name, owner_id");
      console.log("📦 All characters in DB:", allCharacters);
      console.error("❌ No character records returned from Supabase.");
      return NextResponse.json({ error: "No characters found with given IDs." }, { status: 404 });
    }

    console.log("✅ Characters fetched:", characters);

    const characterDescriptions = characters
      .map((c) => `Name: ${c.name}\nTagline: ${c.tagline}\nProfile: ${c.ai_analysis}`)
      .join("\n\n");

    const systemPrompt = `You're an elite Hollywood screenwriter with a knack for high-concept, emotionally resonant stories that are also wildly entertaining. Your job is to turn character bios, genre, and setup into an unforgettable movie plot that reads like a gripping cinematic experience.
    
    Requirements:
    - Story must feel like a full feature film in scope.
    - Include backstories and motivations that build toward meaningful transformation.
    - Use visual language that evokes scenes playing out on screen.
    - Don’t rely too heavily on bios. Show the characters' traits through action, dialogue, and choices—not just restating them.
    - Be unpredictable, dynamic, and clever.
    - Show external events and turning points. Keep readers hooked.
    - Use natural dialogue and avoid over-stylized language.
    - Surprise the reader with reveals, twists, and earned emotional beats.
    - Go longer than 6–8 paragraphs if needed. Prioritize a complete, satisfying arc.
    
    🎬 FORMAT:
    Return ONLY valid JSON:
    {
      "title": "A sharp, emotionally resonant movie-style title",
      "story": "A gripping, cinematic story with vivid scenes and escalating stakes."
    }`;

    const userPrompt = `Use the following character profiles and setup to create a deeply engaging, cinematic story.

CHARACTERS:
${characterDescriptions}

GENRE: ${genre}
USER PROMPT: ${prompt_context || "None provided"}`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.95,
      max_tokens: 2000
    });

    const content = aiRes.choices[0]?.message.content || "";
    console.log("🧠 Raw model output:", content);

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error("❌ Error parsing model JSON output:", e);
      parsed = null;
    }

    if (!parsed || !parsed.story || !parsed.title) {
      console.error("❌ Parsed result is invalid:", parsed);
      return NextResponse.json({ error: "Failed to generate story." }, { status: 500 });
    }

    const insertResult = await supabase.from("stories").insert([
      {
        title: parsed.title,
        full_story: parsed.story,
        owner_id,
        genre,
        prompt_context,
        characters_used,
        cover_image_url: "",
        scene_image_urls: [],
      },
    ]);

    if (insertResult.error) {
      console.error("❌ Error inserting story into Supabase:", insertResult.error);
      return NextResponse.json({ error: "Failed to save story." }, { status: 500 });
    }

    console.log("✅ Story saved successfully.");
    return NextResponse.json({ success: true, title: parsed.title });
  } catch (err) {
    console.error("💥 Unexpected server error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
