"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import LogoutButton from "../logout";

type Profile = {
  id: string;
  email: string;
  avatar_url: string;
};

type Character = {
  id: string;
  name: string;
  photo_urls: string[];
  ai_analysis: string;
  tagline: string;
};

type Story = {
  id: string;
  title: string;
  genre: string;
  prompt_context: string;
  full_story: string;
  cover_image_url?: string;
  scene_image_urls?: string[];
  characters_used: string[];
  created_at: string;
};

export default function Playground() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const router = useRouter();

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

      const { data: characters, error } = await supabase
        .from("characters")
        .select("id, name, photo_urls, ai_analysis, tagline")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching characters:", error);
        setCharacters([]);
      } else {
        setCharacters((characters as Character[]) || []);
      }

      const { data: storiesData, error: storiesError } = await supabase
        .from("stories")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (storiesError) {
        console.error("Error fetching stories:", storiesError);
        setStories([]);
      } else {
        setStories(storiesData || []);
      }

      setLoading(false);
      setLoadingCharacters(false);
    };

    getUserAndProfile();
  }, [router]);

  const handleDeleteCharacter = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this character?");
    if (!confirmed) return;

    const { error } = await supabase.from("characters").delete().eq("id", id);
    if (error) {
      console.error("Error deleting character:", error);
      alert("Failed to delete. Please try again.");
      return;
    }

    setCharacters(prev => prev.filter(c => c.id !== id));
    setSelectedCharacter(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading your universe...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0B1120] to-[#1e293b] px-8 py-10 text-white font-display">
      {/* Header */}
      <header className="flex justify-end items-center space-x-3 mb-12">
        {profile?.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="w-10 h-10 rounded-md border-2 border-indigo-500 bg-slate-800"
          />
        )}
        <div className="bg-slate-800/80 px-4 py-2 rounded-full text-sm shadow font-medium">
          Logged in as <span className="font-bold">{user?.email}</span>
        </div>
        <LogoutButton />
      </header>

      {/* Main section */}
      <section className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter mb-4">
          🎭 Playground
        </h1>
        <p className="text-lg text-slate-200 mb-8">
          Welcome to your universe!{" "}
          {characters.length === 0
            ? "Get started by creating your first character below."
            : "View and manage your characters, or create a new one."}
        </p>

        {loadingCharacters ? (
          <div className="text-slate-400 mb-8">Loading your characters...</div>
        ) : characters.length === 0 ? (
          <div className="mb-12">
            <div className="mb-6 text-lg font-semibold text-slate-300">No characters yet.</div>
            <button
              className="mt-4 px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-90 text-white text-lg font-bold rounded-xl shadow-xl transition focus:outline-none focus:ring-4 focus:ring-fuchsia-500/40"
              onClick={() => router.push("/new-character")}
            >
              <span className="text-2xl mr-2">✨</span>
              Create your first character
            </button>
          </div>
        ) : (
          <>
            {/* Character grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-12">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="bg-slate-900/90 border border-slate-700 rounded-3xl p-6 shadow-lg flex flex-col items-center cursor-pointer 
                             hover:scale-[1.03] hover:shadow-[0_0_15px_rgba(192,38,211,0.6)] transition-transform duration-300"
                  onClick={() => setSelectedCharacter(char)}
                >
                  {char.photo_urls?.[0] ? (
                    <img
                      src={char.photo_urls[0]}
                      alt={char.name}
                      className="w-32 h-32 object-cover rounded-xl mb-4 border-4 border-fuchsia-500"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-slate-700 rounded-lg mb-4 flex items-center justify-center text-slate-400 font-semibold">
                      No Image
                    </div>
                  )}
                  <div className="font-extrabold text-xl mb-1 text-white">{char.name}</div>
                  <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-fuchsia-700 to-indigo-700 text-white">
                    {char.tagline || "No tagline"}
                  </span>
                </div>
              ))}
            </div>

            <button
              className="mt-4 px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-90 text-white text-lg font-bold rounded-xl shadow-xl"
              onClick={() => router.push("/new-character")}
            >
              <span className="text-2xl mr-2">✨</span>
              Create another character
            </button>
          </>
        )}
      </section>

      {/* Story Section */}
      {characters.length > 0 && (
        <section className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold mb-4 text-white">🎬 Your Stories</h2>
          {stories.length === 0 ? (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-slate-300">
              <p className="mb-4">You haven’t created any stories yet. Let’s change that.</p>
              <button
                className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-90"
                onClick={() => router.push("/story/new")}
              >
                ✨ Start a Story
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="bg-slate-900/80 border border-slate-700 rounded-xl overflow-hidden shadow-lg"
                >
                  {story.cover_image_url ? (
                    <img
                      src={story.cover_image_url}
                      className="w-full h-40 object-cover"
                      alt="Story Cover"
                    />
                  ) : (
                    <div className="h-40 flex items-center justify-center bg-slate-700 text-slate-300">
                      No Cover Image
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-1 text-white">
                      {story.title || "Untitled Story"}
                    </h3>
                    <p className="text-sm text-slate-400 mb-2 capitalize">
                      {story.genre || "Unknown Genre"} —{" "}
                      {new Date(story.created_at).toLocaleDateString()}
                    </p>
                    <button
                      className="mt-2 text-sm font-semibold text-fuchsia-400 hover:underline"
                      onClick={() => router.push(`/story/${story.id}`)}
                    >
                      📖 Read Story
                    </button>
                  </div>
                </div>
              ))}

              {/* Create New Story Card */}
              <div
                className="flex items-center justify-center bg-slate-800/70 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-fuchsia-500 transition"
                onClick={() => router.push("/story/new")}
              >
                <span className="text-lg text-fuchsia-400 font-bold">➕ Create New Story</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Character Modal */}
      {selectedCharacter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 text-white rounded-2xl p-6 max-w-md w-full shadow-xl relative">
            <button onClick={() => setSelectedCharacter(null)} className="absolute top-3 right-4 text-white text-xl hover:opacity-70">
              ✕
            </button>
            {selectedCharacter.photo_urls?.[0] && (
              <img
                src={selectedCharacter.photo_urls[0]}
                alt={selectedCharacter.name}
                className="w-32 h-32 mx-auto rounded-xl border-4 border-fuchsia-500 shadow mb-4 object-cover"
              />
            )}
            <h2 className="text-2xl font-bold text-center mb-1">{selectedCharacter.name}</h2>
            <p className="text-sm text-pink-300 font-semibold text-center mb-4">{selectedCharacter.tagline}</p>
            <p className="text-slate-300 text-sm whitespace-pre-wrap text-center">{selectedCharacter.ai_analysis}</p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => handleDeleteCharacter(selectedCharacter.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg"
              >
                🗑 Delete
              </button>
              <button
                onClick={() => setSelectedCharacter(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}