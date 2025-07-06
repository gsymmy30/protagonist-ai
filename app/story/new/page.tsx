"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import LogoutButton from "../../logout";

const GENRES = [
  "Action", "Adventure", "Comedy", "Romance", "Sci-Fi", "Fantasy",
  "Drama", "Thriller", "Mystery", "Horror", "Coming-of-Age", "Heist"
];

const FLAVORS = [
  "Romantic arc", "Funny banter", "Big action scene", "Sad ending",
  "Emotional moments", "Plot twist", "Slow burn tension", "Uplifting finale",
  "Nostalgic tone", "Betrayal twist"
];

export default function NewStory() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [characters, setCharacters] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [genre, setGenre] = useState<string>("");
  const [flavorTags, setFlavorTags] = useState<string[]>([]);
  const [extraDetail, setExtraDetail] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace("/");
      setUser(user);

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(profile);

      const { data: chars } = await supabase.from("characters").select("*").eq("owner_id", user.id);
      setCharacters(chars || []);

      setLoading(false);
    };
    fetchUserData();
  }, [router]);

  const toggleChar = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleFlavor = (tag: string) => {
    setFlavorTags(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]);
  };

  const handleSubmit = async () => {
    if (selected.length === 0 || !genre) {
      setError("Select at least 1 character and choose a genre.");
      return;
    }

    setSubmitting(true);
    setError("");

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      console.error("❌ No access token found");
      setError("Could not authenticate user.");
      setSubmitting(false);
      return;
    }

    const prompt_context = prompt + (extraDetail ? `\nAdditional notes: ${extraDetail}` : "");

    try {
      const genRes = await fetch("/api/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          genre,
          prompt_context,
          characters_used: selected,
          owner_id: user.id
        })
      });

      const genData = await genRes.json();
      setSubmitting(false);

      if (!genRes.ok || !genData.success) {
        console.error("❌ Story generation failed:", genData);
        setError("Error generating story. Try again.");
        return;
      }

      router.push("/playground");
    } catch (err) {
      console.error("💥 Unexpected error calling generate-story:", err);
      setError("Unexpected error occurred.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading your universe...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0B1120] to-[#1e293b] px-8 py-10 text-white font-display relative">
      <button
        onClick={() => router.push("/playground")}
        className="fixed top-6 left-6 z-20 px-6 py-2 rounded-full bg-slate-800/90 text-white shadow font-semibold flex items-center gap-2 hover:bg-slate-700 border border-slate-700 transition"
      >
        <span className="text-xl">🏠</span> Back to Playground
      </button>

      <header className="absolute top-6 right-6 flex items-center gap-3 z-20">
        {profile?.avatar_url && (
          <img src={profile.avatar_url} className="w-10 h-10 rounded-md border-2 border-indigo-500 bg-slate-800" />
        )}
        <div className="bg-slate-800/80 px-4 py-2 rounded-full text-sm shadow font-medium">
          {user?.email}
        </div>
        <LogoutButton />
      </header>

      <div className="max-w-3xl mx-auto mt-32 bg-slate-900/80 p-10 rounded-3xl shadow-xl">
        <h1 className="text-3xl font-bold mb-6">Select Characters <span className="text-fuchsia-500">*</span></h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          {characters.map(c => (
            <div
              key={c.id}
              onClick={() => toggleChar(c.id)}
              className={`rounded-xl p-2 cursor-pointer border-2 transition duration-200 aspect-square flex flex-col justify-between
                ${selected.includes(c.id) ? "border-fuchsia-500 bg-slate-800/70" : "border-slate-700 bg-slate-800/40"}`}
            >
              <img src={c.photo_urls?.[0]} alt={c.name} className="w-full h-full object-cover object-center rounded-lg mb-1" />
              <div className="text-xs font-semibold text-center mt-2">{c.name}</div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-4">Story Setup</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="mb-6">
          <label className="font-bold mb-2 block">Genre <span className="text-fuchsia-500">*</span></label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(g => (
              <button
                key={g}
                type="button"
                className={`px-4 py-1 rounded-full border-2 transition text-sm font-medium
                  ${genre === g
                    ? "bg-fuchsia-700 border-fuchsia-400 text-white"
                    : "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"}`}
                onClick={() => setGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="font-bold mb-2 block">Quick Story Setup</label>
          <input
            className="w-full px-4 py-2 bg-slate-800 rounded-md"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Four friends get trapped in a video game world and must escape..."
          />
        </div>

        <div className="mb-6">
          <label className="font-bold mb-2 block">Add optional flavor tags</label>
          <div className="flex flex-wrap gap-2">
            {FLAVORS.map(tag => (
              <button
                key={tag}
                type="button"
                className={`px-4 py-1 rounded-full border-2 transition text-sm font-medium
                  ${flavorTags.includes(tag)
                    ? "bg-indigo-700 border-indigo-400 text-white"
                    : "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"}`}
                onClick={() => toggleFlavor(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="font-bold mb-2 block">Optional: Add any movie or note</label>
          <input
            className="w-full px-4 py-2 bg-slate-800 rounded-md"
            value={extraDetail}
            onChange={e => setExtraDetail(e.target.value)}
            placeholder="Mention a movie for inspiration or add any specific detail..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 mt-4 rounded-md text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-90 transition"
        >
          {submitting ? "Creating Story..." : "Generate Story"}
        </button>
      </div>
    </main>
  );
}
