"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import LogoutButton from "./logout";


type Profile = {
  id: string;
  email: string;
  avatar_url: string;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ?? null);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profile);
      } else {
        setProfile(null);
      }
    };
    getUserAndProfile();
  }, []);

  // Handle form submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the magic link!");
    }
    setLoading(false);
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#0B1120] to-[#1e293b] flex items-center justify-between px-6 lg:px-24 py-10 overflow-hidden text-white font-display">
      {/* Floating Orbs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-20 left-16 h-60 w-60 bg-fuchsia-600 opacity-20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-24 h-72 w-72 bg-indigo-400 opacity-30 rounded-full blur-2xl animate-float-reverse" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 bg-purple-600 opacity-10 rounded-full blur-2xl animate-float-mid -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] bg-[size:20px_20px] opacity-10" />
      </div>

      {/* Top right: User avatar and Go to Playground */}
      {user && (
        <div className="fixed top-4 right-4 flex items-center space-x-3 z-50">
          {profile?.avatar_url && (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-10 h-10 rounded-md border-2 border-indigo-500 bg-slate-800"
            />
          )}
          <span className="bg-slate-800/80 px-4 py-2 rounded-full text-sm shadow font-medium">
            Logged in as <span className="font-bold">{user.email}</span>
          </span>
          <button
            onClick={() => router.push("/playground")}
            className="ml-2 bg-indigo-700 text-white px-4 py-2 rounded-full font-bold shadow-lg"
          >
            🚀 Go to Playground
          </button>
          <LogoutButton />
        </div>
      )}

      {/* Branding Section */}
      <div className="max-w-xl space-y-6 z-10">
        <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tighter leading-tight font-display">
          🎬 Protagonist AI
        </h1>
        <p className="text-lg text-slate-200 leading-relaxed max-w-lg mt-4">
          <span className="text-white font-semibold">Main character energy 💅</span>
          <br />
          Cinematic stories. Wild plots. You and your friends in the spotlight.
        </p>
        <div className="inline-block mt-4 px-3 py-1 bg-indigo-700/20 text-indigo-200 text-xs font-semibold rounded-full shadow-sm tracking-wider uppercase">
          ⚡️ AI-powered immersive storytelling
        </div>
      </div>

      {/* Login Card */}
      {!user && (
        <div className="bg-slate-900/80 border border-slate-700 backdrop-blur p-8 rounded-3xl w-full max-w-md shadow-xl z-10">
          <h2 className="text-2xl font-bold mb-4">✨ Log in to your universe</h2>
          <form onSubmit={handleLogin}>
            <label className="text-sm text-slate-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 rounded-md mt-1 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-90 text-white font-semibold rounded-md transition"
            >
              {loading ? "Sending..." : "🎟 Send Magic Link"}
            </button>
          </form>
          {message && (
            <div className="mt-4 text-center text-sm text-indigo-300">{message}</div>
          )}
          <p className="text-xs text-slate-400 mt-4 text-center">
            Powered by Supabase 🚀
          </p>
        </div>
      )}
    </main>
  );
}