"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import LogoutButton from "../logout";

const TAGS = [
  "Charming", "Witty", "Bold", "Quiet", "Reckless", "Disciplined", "Loyal", "Cynical",
  "Sensitive", "Goofy", "Brooding", "Mysterious", "Magnetic", "Dreamer",
  "Stubborn", "Romantic", "Tragic", "Heroic", "Scheming", "Wild Card"
];

type Profile = {
  id: string;
  email: string;
  avatar_url: string;
};

export default function NewCharacter() {
  const router = useRouter();

  // Auth/Profile
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Step management
  const [step, setStep] = useState<1 | 2>(1);
  const [analyzing, setAnalyzing] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [tagline, setTagline] = useState(""); // <-- Add tagline state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Auth/profile fetch
  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/");
        return;
      }
      setUser(user);
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profile);
      setLoading(false);
    };
    getUserAndProfile();
  }, [router]);

  // Handle image uploads & previews
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 6) return setError("Max 6 images allowed.");
    setImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [
      ...prev,
      ...files.map(f => URL.createObjectURL(f)),
    ]);
    setError("");
  };
  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };
  const toggleTag = (tag: string) => {
    setTags(t =>
      t.includes(tag)
        ? t.filter(x => x !== tag)
        : t.length < 6
          ? [...t, tag]
          : t
    );
  };

  // --- Step 1: Validate and Upload Images, Then Move to Step 2 ---
  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Character name required.");
    if (images.length < 3) return setError("Upload at least 3 photos.");
    if (tags.length === 0) return setError("Select at least 1 tag.");
    setAnalyzing(true);
    setStep(2);

    // Upload images to Supabase
    const urls: string[] = [];
    for (const file of images) {
      const { data, error: uploadError } = await supabase.storage
        .from("characters")
        .upload(`${Date.now()}_${file.name}`, file);

      if (uploadError) {
        setAnalyzing(false);
        setStep(1);
        setError(`Photo upload failed. (${uploadError.message || "Unknown error"})`);
        return;
      }
      const publicUrl = supabase.storage.from("characters").getPublicUrl(data.path).data.publicUrl;
      urls.push(publicUrl);
    }
    setImageUrls(urls);

    // Multimodal AI analysis!
    try {
      const response = await fetch("/api/character-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          photoUrls: urls,
          tags,
          description,
        }),
      });
      const data = await response.json();
      setAiAnalysis(data.analysis);
      setTagline(data.tagline || ""); // <-- Save tagline from AI
      setAnalyzing(false);
    } catch (err) {
      setAnalyzing(false);
      setError("Could not generate character analysis. Please try again.");
      setStep(1);
    }
  };

  // --- Step 2: Save character to DB ---
  const handleSave = async () => {
    setSaving(true);
    setError("");
    const { error: dbError } = await supabase.from("characters").insert([{
      name,
      photo_urls: imageUrls,
      tags,
      description,
      ai_analysis: aiAnalysis,
      tagline, // <-- Save tagline to DB
      owner_id: user.id,
      created_at: new Date().toISOString()
    }]);
    setSaving(false);
    if (dbError) return setError("Could not save character. Try again.");
    router.replace("/playground");
  };

  // --- Step 2: Edit (returns to Step 1) ---
  const handleEdit = () => {
    setStep(1);
    setError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading your universe...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0B1120] to-[#1e293b] px-8 py-10 text-white font-display relative">
      {/* Sticky Back to Playground */}
      <button
        onClick={() => router.push("/playground")}
        className="fixed top-6 left-6 z-20 px-6 py-2 rounded-full bg-slate-800/90 text-white shadow font-semibold flex items-center gap-2 hover:bg-slate-700 border border-slate-700 transition"
      >
        <span className="text-xl">🏠</span> Back to Playground
      </button>

      {/* Header, right aligned */}
      <header className="absolute top-6 right-6 flex items-center gap-3 z-20">
        {profile?.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="w-10 h-10 rounded-md border-2 border-indigo-500 bg-slate-800"
          />
        )}
        <div className="bg-slate-800/80 px-4 py-2 rounded-full text-sm shadow font-medium">
          {user?.email}
        </div>
        <LogoutButton />
      </header>

      <div className="flex flex-col items-center justify-center mt-32">
        <div className="flex justify-center space-x-2 mb-8">
          <span className={`w-4 h-4 rounded-full ${step === 1 ? "bg-fuchsia-500" : "bg-slate-600"}`} />
          <span className={`w-4 h-4 rounded-full ${step === 2 ? "bg-fuchsia-500" : "bg-slate-600"}`} />
        </div>
        <div className="bg-slate-900/80 rounded-3xl p-10 shadow-xl w-full max-w-2xl">
          {step === 1 && (
            <>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tighter mb-6">
                Build Your Character
              </h1>
              {error && <div className="text-red-500 mb-4">{error}</div>}
              <form className="space-y-6" onSubmit={handleNext}>
                {/* Name */}
                <div>
                  <label className="font-bold text-lg mb-2 block">Character Name <span className="text-fuchsia-500">*</span></label>
                  <input
                    className="w-full px-4 py-2 rounded-md bg-slate-800 text-white mb-2"
                    placeholder="e.g., Arya"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                {/* Images */}
                <div>
                  <label className="font-bold text-lg mb-2 block">Photos <span className="text-fuchsia-500">*</span></label>
                  <p className="text-xs text-slate-400 mb-2">
                    Add 3–6 clear photos of the character. Solo pics work best. Limit group pics.
                  </p>
                  <div className="flex gap-3 mb-2 flex-wrap">
                    {imagePreviews.map((url, idx) => (
                      <div key={url} className="relative">
                        <img src={url} className="w-20 h-20 object-cover rounded-lg border-2 border-slate-700" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-slate-800/80 rounded-full p-1 text-xs hover:bg-red-500"
                          onClick={() => removeImage(idx)}
                        >✕</button>
                      </div>
                    ))}
                    {images.length < 6 && (
                      <label className="w-20 h-20 flex items-center justify-center bg-slate-800/60 rounded-lg cursor-pointer border-2 border-dashed border-slate-600 hover:border-fuchsia-500">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageChange}
                          disabled={images.length >= 6}
                        />
                        <span className="text-slate-400 text-2xl">+</span>
                      </label>
                    )}
                  </div>
                </div>
                {/* Tags */}
                <div>
                  <label className="font-bold text-lg mb-2 block">Personality Tags <span className="text-fuchsia-500">*</span></label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        className={`px-4 py-1 rounded-full border-2 transition text-sm font-medium
                          ${tags.includes(tag)
                            ? "bg-fuchsia-700 border-fuchsia-400 text-white"
                            : "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"}
                        `}
                        onClick={() => toggleTag(tag)}
                        disabled={!tags.includes(tag) && tags.length >= 6}
                      >
                        {tag}
                        {tags.includes(tag) && <span className="ml-2">✓</span>}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">Select at least 1, up to 6 tags.</p>
                </div>
                {/* Optional Description */}
                <div>
                  <label className="font-bold text-lg mb-2 block">Add a detail (optional)</label>
                  <textarea
                    className="w-full px-4 py-2 rounded-md bg-slate-800 text-white"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    maxLength={200}
                    placeholder="Add a specific detail or note"
                  />
                </div>
                <button
                  type="submit"
                  className={`w-full py-3 mt-2 rounded-md text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-90 transition
                    ${analyzing ? "opacity-60 cursor-not-allowed" : ""}
                  `}
                  disabled={
                    analyzing ||
                    !name.trim() ||
                    images.length < 3 ||
                    tags.length === 0
                  }
                >
                  {analyzing ? "Analyzing..." : "Next"}
                </button>
              </form>
            </>
          )}

          {/* Step 2: AI Analysis */}
          {step === 2 && (
            <>
              {analyzing ? (
                <div className="flex flex-col items-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-fuchsia-500 mb-8" />
                  <p className="text-xl text-slate-100 font-semibold mb-2">Analyzing your character...</p>
                  <p className="text-slate-400">Cooking up a backstory you'll love!</p>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Meet Your Character</h2>
                  <div className="bg-slate-800/90 rounded-lg p-4 mb-4 border-l-4 border-fuchsia-500">
                    <div className="text-lg font-semibold mb-2">AI’s Analysis</div>
                    <p className="text-slate-100 whitespace-pre-line">{aiAnalysis}</p>
                  </div>
                  {error && <div className="text-red-500 mb-4">{error}</div>}
                  <div className="flex gap-4 mt-6">
                    <button
                      className="px-6 py-3 rounded-md bg-slate-700 hover:bg-slate-600 text-white"
                      onClick={handleEdit}
                      disabled={saving}
                    >
                      Edit Info & Retry
                    </button>
                    <button
                      className="px-6 py-3 rounded-md bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-bold"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Accept & Save"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
