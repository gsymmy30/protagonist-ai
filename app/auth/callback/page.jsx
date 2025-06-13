"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const setupProfile = async () => {
      // 1. Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/");
        return;
      }

      // 2. Upsert profile with stable avatar seed (use user.id as seed)
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${user.id}`;

      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          avatar_url: avatarUrl,
        },
        { onConflict: "id" }
      );

      // 3. Redirect to playground
      router.replace("/playground");
    };

    setupProfile();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white text-xl font-semibold">
      Setting up your universe...
    </div>
  );
}