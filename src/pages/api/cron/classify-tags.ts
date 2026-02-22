import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // This is actually the service role key
);

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://komiko.app',
    'X-Title': 'KomikoAI',
  },
});

async function classifyTag(tagName: string): Promise<'ip' | 'descriptor' | 'other' | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'x-ai/grok-4.1-fast',
      messages: [
        {
          role: 'system',
          content: `Classify this tag into one category:
- "ip": Intellectual Property - anime, game, movie, TV show, comic, or character names
- "descriptor": Descriptive tags for appearance, style, or attributes
- "other": Tags that don't fit above

Reply with ONLY one word: ip, descriptor, or other`,
        },
        { role: 'user', content: tagName },
      ],
    });

    const result = completion.choices[0]?.message?.content?.toLowerCase().trim();
    if (result === 'ip' || result === 'descriptor') {
      return result;
    }
    return 'other';
  } catch (error) {
    console.error(`Error classifying ${tagName}:`, error);
    return null; // Return null on API error, so we don't update and can retry later
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Verify authorization (Vercel Cron sends CRON_SECRET in Authorization header)
  const authHeader = req.headers.authorization;
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Find tags with post_count > 100 and tag_type IS NULL
  const { data: tags, error } = await supabase
    .from('tags')
    .select('id, name, post_count')
    .gt('post_count', 100)
    .is('tag_type', null)
    .order('post_count', { ascending: false })
    .limit(50); // Process max 50 per run to avoid timeout

  if (error) {
    console.error('Error fetching tags:', error);
    return res.status(500).json({ error: 'Failed to fetch tags' });
  }

  if (!tags || tags.length === 0) {
    return res.status(200).json({ message: 'No new tags to classify' });
  }

  const results: { name: string; type: string }[] = [];

  for (const tag of tags) {
    const tagType = await classifyTag(tag.name);

    // Skip if API failed (null) - will retry next run
    if (tagType === null) {
      results.push({ name: tag.name, type: 'error' });
      continue;
    }

    results.push({ name: tag.name, type: tagType });

    // Update all types (ip, descriptor, other) to prevent re-classification
    await supabase
      .from('tags')
      .update({ tag_type: tagType })
      .eq('id', tag.id);
  }

  return res.status(200).json({
    message: `Classified ${tags.length} tags`,
    results,
  });
}
