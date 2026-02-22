import { createClient } from '@supabase/supabase-js';
import type { Badge } from '@/state/index.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getUserBadges(
  userId: string,
  plan?: string,
  isCpp?: boolean
): Promise<Badge[]> {
  const { data: userBadges, error: userBadgesError } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at, is_displayed')
    .eq('user_id', userId)
    .eq('is_displayed', true)
    .order('earned_at', { ascending: false });

  if (userBadgesError) {
    console.error('Error fetching user badges:', userBadgesError);
    return [];
  }

  let achievementBadges: Badge[] = [];
  
  if (userBadges && userBadges.length > 0) {
    const badgeIds = userBadges.map(ub => ub.badge_id);

    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('id, badge_code, badge_name, title, icon_url, priority, badge_type')
      .in('id', badgeIds)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
    } else if (badges) {
      const badgeMap = new Map(badges.map(b => [b.id, b]));

      achievementBadges = userBadges
        .map(ub => {
          const badge = badgeMap.get(ub.badge_id);
          if (!badge) {
            return null;
          }
          return {
            id: badge.id,
            badge_code: badge.badge_code,
            badge_name: badge.badge_name,
            title: badge.title,
            icon_url: badge.icon_url,
            earned_at: ub.earned_at,
            priority: badge.priority || 0,
            badge_type: badge.badge_type,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    }
  }

  const vipBadges = await getVipBadges(plan, isCpp);
  const allBadges = [...vipBadges, ...achievementBadges];
  
  return allBadges.sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

export async function getDisplayedBadge(userId: string) {
  const badges = await getUserBadges(userId);
  if (badges.length === 0) {
    return null;
  }

  return badges[0];
}

export async function getBadgesByCodes(badgeCodes: string[]) {
  const { data: badges, error } = await supabase
    .from('badges')
    .select('badge_code, icon_url, title')
    .in('badge_code', badgeCodes)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching badges by codes:', error);
    return [];
  }

  return badges || [];
}

export async function getBadgesByType(badgeType: string) {
  const { data: badges, error } = await supabase
    .from('badges')
    .select('badge_code, icon_url, title, criteria_value, priority')
    .eq('badge_type', badgeType)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching badges by type:', error);
    return [];
  }

  return badges || [];
}

export async function getVipBadges(plan?: string, isCpp?: boolean): Promise<Badge[]> {
  const badgeCodes: string[] = [];
  
  if (plan && plan !== 'Free') {
    badgeCodes.push(plan.toLowerCase());
  }
  
  if (isCpp) {
    badgeCodes.push('cpp');
  }

  if (badgeCodes.length === 0) {
    return [];
  }

  const { data: vipBadges, error: vipError } = await supabase
    .from('badges')
    .select('id, badge_code, badge_name, title, icon_url, priority, badge_type')
    .in('badge_code', badgeCodes)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (vipError) {
    console.error('Error fetching VIP badges:', vipError);
    return [];
  }

  if (!vipBadges || vipBadges.length === 0) {
    return [];
  }

  const now = new Date().toISOString();
  return vipBadges.map(badge => ({
    id: badge.id,
    badge_code: badge.badge_code,
    badge_name: badge.badge_name,
    title: badge.title,
    icon_url: badge.icon_url,
    earned_at: now,
    priority: badge.priority || 0,
    badge_type: badge.badge_type,
  }));
}

export async function POST(request: Request) {
  try {
    const { userId, displayedOnly, badgeCodes, badgeType } = await request.json();

    if (badgeType) {
      const badges = await getBadgesByType(badgeType);
      return new Response(JSON.stringify({ badges }), { status: 200 });
    }

    if (badgeCodes && Array.isArray(badgeCodes)) {
      const badges = await getBadgesByCodes(badgeCodes);
      return new Response(JSON.stringify({ badges }), { status: 200 });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
      });
    }

    if (displayedOnly) {
      const badge = await getDisplayedBadge(userId);
      return new Response(JSON.stringify({ badge }), { status: 200 });
    }

    const badges = await getUserBadges(userId);
    return new Response(JSON.stringify({ badges }), { status: 200 });
  } catch (error) {
    console.error('Error in badges/get API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
