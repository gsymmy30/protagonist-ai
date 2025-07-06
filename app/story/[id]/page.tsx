// app/story/[id]/page.tsx
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Props = {
  params: {
    id: string;
  };
};

export default async function StoryPage({ params }: Props) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side use only
  );

  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !story) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <p className="text-sm text-zinc-400 mb-2">{story.genre} — {new Date(story.created_at).toLocaleDateString()}</p>
      <h1 className="text-3xl font-bold mb-4">{story.title}</h1>
      <article className="prose prose-invert whitespace-pre-wrap">
        {story.full_story}
      </article>
    </div>
  );
}
