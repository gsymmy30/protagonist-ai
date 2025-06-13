"use client";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/"; // Full reload, ensures state is reset everywhere
  };

  return (
    <button
      onClick={handleLogout}
      className="ml-4 px-4 py-2 rounded-md bg-slate-700 text-white hover:bg-fuchsia-600 font-semibold transition"
    >
      🚪 Log Out
    </button>
  );
}