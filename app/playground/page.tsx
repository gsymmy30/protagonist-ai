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

export default function Playground() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
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

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profile);

      // Fetch characters
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

      setLoading(false);
      setLoadingCharacters(false);
    };

    getUserAndProfile();
  }, [router]);

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
                  onClick={() => router.push(`/character/${char.id}`)}
                >
                  {char.photo_urls && char.photo_urls.length > 0 ? (
                    <div className="relative mb-6 rounded-xl overflow-hidden w-32 h-32 ring-4 ring-gradient-to-r ring-fuchsia-600 ring-indigo-600 ring-purple-700 shadow-lg">
                      <img
                        src={char.photo_urls[0]}
                        alt={char.name}
                        className="w-full h-full object-cover border-gradient-to-tr from-fuchsia-500 via-indigo-500 to-purple-600 rounded-lg shadow-lg"
                      />
                      <div className="absolute inset-0 rounded-lg ring-2 ring-pink-500 ring-offset-2 ring-offset-transparent animate-pulse pointer-events-none" />
                    </div>
                  ) : (
                    <div className="w-28 h-28 bg-slate-700 rounded-lg mb-4 flex items-center justify-center text-slate-400 font-semibold">
                      No Image
                    </div>
                  )}

                  <div className="font-extrabold text-xl mb-1 text-white text-center truncate w-full">
                    {char.name}
                  </div>

                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-fuchsia-700 to-indigo-700 text-white select-none">
                      {char.tagline || "No tagline"}
                    </span>
                  </div>

                  <p className="text-slate-300 text-sm max-h-[4.5rem] overflow-hidden overflow-ellipsis text-center px-2 line-clamp-3">
                    {char.ai_analysis}
                  </p>
                </div>
              ))}
            </div>

            {/* Create another character button */}
            <button
              className="mt-4 px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-90 text-white text-lg font-bold rounded-xl shadow-xl transition focus:outline-none focus:ring-4 focus:ring-fuchsia-500/40"
              onClick={() => router.push("/new-character")}
            >
              <span className="text-2xl mr-2">✨</span>
              Create another character
            </button>
          </>
        )}
      </section>
    </main>
  );
}
