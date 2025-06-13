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

export default function Playground() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/");
        return;
      }
      setUser(user);
      // Fetch profile for avatar
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading your universe...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0B1120] to-[#1e293b] px-8 py-10 text-white font-display">
      <header className="flex justify-end items-center space-x-3">
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
      <section className="max-w-2xl mx-auto mt-20 text-center">
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter mb-4">
          🎭 Playground
        </h1>
        <p className="text-lg text-slate-200">
          Welcome to your universe! Soon, you’ll be able to create characters, stories, and more.
        </p>
        {/* Next: Add character listing/creation UI here */}
      </section>
    </main>
  );
}