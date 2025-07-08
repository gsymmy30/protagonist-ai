import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: {
    id: string;
  };
};

export default async function StoryPage({ params }: Props) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: story, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !story) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white">
      <div className="mb-6 space-y-2">
        <br />
        <Link
          href="/playground"
          className="text-sm text-fuchsia-400 hover:underline inline-block"
        >
          🛝 Back to Playground
        </Link>
      </div>

      <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg border border-zinc-800">
        <p className="text-sm text-zinc-400 mb-1">
          {story.genre} — {new Date(story.created_at).toLocaleDateString()}
        </p>
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight">
          {story.title}
        </h1>

        <div className="prose prose-invert prose-zinc max-w-none whitespace-pre-wrap leading-relaxed">
          {story.full_story}
        </div>
      </div>
    </div>
  );
}
