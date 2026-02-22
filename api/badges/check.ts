import { createClient } from '@supabase/supabase-js';
import { BROAD_TYPES, CONTENT_TYPES } from '../_constants.js';
import { pushMessage } from '../message.js';

// NOTE: Using NEXT_PUBLIC_ environment variables for server-side operations.
// For production, consider using SUPABASE_SERVICE_ROLE_KEY for operations that may modify data,
// as it has elevated privileges and is kept secret on the server.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

enum CriteriaType {
  CONSECUTIVE_DAYS_POST = 'CONSECUTIVE_DAYS_POST',
  CONSECUTIVE_DAYS_LIKE = 'CONSECUTIVE_DAYS_LIKE',
  TOTAL_POSTS = 'TOTAL_POSTS',
  TOTAL_LIKES_RECEIVED = 'TOTAL_LIKES_RECEIVED',
  SINGLE_POST_LIKES = 'SINGLE_POST_LIKES',
  LEADERBOARD_RANK = 'LEADERBOARD_RANK',
}

enum BadgeType {
  USER_ACHIEVEMENT = 'USER_ACHIEVEMENT',
  LEADERBOARD_RANK = 'LEADERBOARD_RANK',
  VIP_PLAN = 'VIP_PLAN',
}

const officialAccountId = process.env.OFFICIAL_ACCOUNT_ID;

type BadgeRecord = {
  id: number;
  badge_code: string;
  badge_name?: string | null;
  title?: string | null;
  badge_type: string;
  icon_url?: string | null;
};

async function hasBadge(userId: string, badgeId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .maybeSingle();

  if (error) {
    console.error('Error checking badge:', error);
    return false;
  }

  return !!data;
}

async function awardBadge(userId: string, badgeId: number): Promise<boolean> {
  if (await hasBadge(userId, badgeId)) {
    return false;
  }

  const { error } = await supabase.from('user_badges').insert({
    user_id: userId,
    badge_id: badgeId,
    is_displayed: true,
  });

  if (error) {
    console.error('Error awarding badge:', error);
    return false;
  }

  return true;
}

const buildBadgePayload = (badge: BadgeRecord) => ({
  version: 1,
  badgeId: badge.id,
  badgeCode: badge.badge_code,
  badgeName: badge.title ?? badge.badge_name ?? null,
  badgeTitle: badge.title || null,
  badgeType: badge.badge_type,
  iconUrl: badge.icon_url || null,
});

const notifyBadgeEarned = (
  userId: string,
  badge: BadgeRecord,
  userBadgeId: number,
) => {
  pushMessage(
    {
      content_type: CONTENT_TYPES.BADGE_EARNED,
      content_id: userBadgeId,
      host_content_id: 0,
      need_aggregate: false,
      broad_type: BROAD_TYPES.MESSAGE,
      user_id: userId,
      payload: buildBadgePayload(badge),
    },
    officialAccountId,
  ).catch(error => {
    console.error('Error sending badge notification:', error);
  });
};

const awardBadgeWithNotification = async (
  userId: string,
  badge: BadgeRecord,
): Promise<boolean> => {
  if (await hasBadge(userId, badge.id)) {
    return false;
  }

  const { data, error } = await supabase
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_id: badge.id,
      is_displayed: true,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error awarding badge:', error);
    return false;
  }

  notifyBadgeEarned(userId, badge, data.id);
  return true;
};

async function awardLeaderboardBadge(
  userId: string,
  rank: number,
): Promise<boolean> {
  const badgeCodeMap: Record<number, string> = {
    '1': 'leaderboard_first',
    '2': 'leaderboard_second',
    '3': 'leaderboard_third',
  };

  const badgeCode = badgeCodeMap[rank];
  if (!badgeCode) {
    console.error('Invalid rank for leaderboard badge:', rank);
    return false;
  }

  const { data: badge, error: badgeError } = await supabase
    .from('badges')
    .select('id, badge_code, badge_name, badge_type, icon_url, title')
    .eq('badge_code', badgeCode)
    .eq('badge_type', BadgeType.LEADERBOARD_RANK)
    .eq('is_active', true)
    .single();

  if (badgeError || !badge) {
    console.error('Error fetching leaderboard badge:', badgeError);
    return false;
  }

  return awardBadgeWithNotification(userId, badge as BadgeRecord);
}

async function getConsecutivePostDays(userId: string): Promise<number> {
  const { data: posts, error } = await supabase
    .from('AppPosts')
    .select('created_at')
    .eq('authUserId', userId)
    .order('created_at', { ascending: false });

  if (error || !posts || posts.length === 0) {
    return 0;
  }

  // Use Set to handle unique dates (multiple posts on same day count as one)
  const uniqueDates = new Set<string>();
  posts.forEach(post => {
    const date = new Date(post.created_at).toISOString().split('T')[0];
    uniqueDates.add(date);
  });

  const sortedDates = Array.from(uniqueDates).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  let consecutiveDays = 0;
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const daysDiff =
      (new Date(today).getTime() - new Date(date).getTime()) /
      (1000 * 60 * 60 * 24);

    if (daysDiff === consecutiveDays) {
      consecutiveDays++;
    } else if (daysDiff > consecutiveDays) {
      break;
    }
  }

  return consecutiveDays;
}

async function getConsecutiveLikeDays(userId: string): Promise<number> {
  const { data: votes, error } = await supabase
    .from('AppVotes')
    .select('created_at')
    .eq('authUserId', userId)
    .eq('value', 1)
    .order('created_at', { ascending: false });

  if (error || !votes || votes.length === 0) {
    return 0;
  }

  const uniqueDates = new Set<string>();
  votes.forEach(vote => {
    const date = new Date(vote.created_at).toISOString().split('T')[0];
    uniqueDates.add(date);
  });

  const sortedDates = Array.from(uniqueDates).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  let consecutiveDays = 0;
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const daysDiff =
      (new Date(today).getTime() - new Date(date).getTime()) /
      (1000 * 60 * 60 * 24);

    if (daysDiff === consecutiveDays) {
      consecutiveDays++;
    } else if (daysDiff > consecutiveDays) {
      break;
    }
  }

  return consecutiveDays;
}

async function getTotalPosts(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('AppPosts')
    .select('id', { count: 'exact', head: true })
    .eq('authUserId', userId);

  if (error) {
    console.error('Error counting posts:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get total likes received by a user across all their posts.
 *
 * NOTE: This function performs two database queries which can be slow for users with many posts.
 * For better performance, consider creating a Supabase RPC function to calculate this on the database side.
 *
 * @param userId - The user ID to get likes for
 * @returns Total number of likes received
 */
async function getTotalLikesReceived(userId: string): Promise<number> {
  const { data: posts, error: postsError } = await supabase
    .from('AppPosts')
    .select('id')
    .eq('authUserId', userId);

  if (postsError || !posts || posts.length === 0) {
    return 0;
  }

  const postIds = posts.map(p => p.id);

  // If no posts, return 0
  if (postIds.length === 0) {
    return 0;
  }

  const { count, error } = await supabase
    .from('AppVotes')
    .select('id', { count: 'exact', head: true })
    .in('postId', postIds)
    .eq('value', 1);

  if (error) {
    console.error('Error counting likes:', error);
    return 0;
  }

  return count || 0;
}

async function getMaxPostLikes(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('AppPosts')
    .select('votes')
    .eq('authUserId', userId)
    .order('votes', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    if (error) {
      console.error('Error getting max post likes:', error);
    }
    return 0;
  }

  return data.votes || 0;
}

async function checkBadge(userId: string, badgeId: number): Promise<boolean> {
  const { data: badge, error: badgeError } = await supabase
    .from('badges')
    .select('*')
    .eq('id', badgeId)
    .eq('is_active', true)
    .single();

  if (badgeError || !badge) {
    return false;
  }

  if (await hasBadge(userId, badgeId)) {
    return false;
  }

  let meetsCriteria = false;

  switch (badge.criteria_type as CriteriaType) {
    case CriteriaType.CONSECUTIVE_DAYS_POST:
      const consecutivePostDays = await getConsecutivePostDays(userId);
      meetsCriteria = consecutivePostDays >= badge.criteria_value;
      break;

    case CriteriaType.CONSECUTIVE_DAYS_LIKE:
      const consecutiveLikeDays = await getConsecutiveLikeDays(userId);
      meetsCriteria = consecutiveLikeDays >= badge.criteria_value;
      break;

    case CriteriaType.TOTAL_POSTS:
      const totalPosts = await getTotalPosts(userId);
      meetsCriteria = totalPosts >= badge.criteria_value;
      break;

    case CriteriaType.TOTAL_LIKES_RECEIVED:
      const totalLikes = await getTotalLikesReceived(userId);
      meetsCriteria = totalLikes >= badge.criteria_value;
      break;

    case CriteriaType.SINGLE_POST_LIKES:
      const maxLikes = await getMaxPostLikes(userId);
      meetsCriteria = maxLikes >= badge.criteria_value;
      break;

    default:
      console.error('Unknown criteria type:', badge.criteria_type);
      return false;
  }

  if (meetsCriteria) {
    const awarded = await awardBadgeWithNotification(
      userId,
      badge as BadgeRecord,
    );
    if (awarded) {
      return true;
    }
  }

  return false;
}

export { awardLeaderboardBadge, BadgeType };

export async function checkBadgesByType(
  userId: string,
  triggerType: 'post' | 'like' | 'like_received' | 'all',
): Promise<void> {
  try {
    const { data: badges, error } = await supabase
      .from('badges')
      .select('id, criteria_type')
      .eq('is_active', true);

    if (error || !badges) {
      console.error('Error fetching badges:', error);
      return;
    }

    const badgesToCheck = badges.filter(badge => {
      if (triggerType === 'all') {
        return true;
      }

      const criteriaType = badge.criteria_type as CriteriaType;

      if (triggerType === 'post') {
        return (
          criteriaType === CriteriaType.CONSECUTIVE_DAYS_POST ||
          criteriaType === CriteriaType.TOTAL_POSTS
        );
      }

      if (triggerType === 'like') {
        return criteriaType === CriteriaType.CONSECUTIVE_DAYS_LIKE;
      }

      if (triggerType === 'like_received') {
        return (
          criteriaType === CriteriaType.TOTAL_LIKES_RECEIVED ||
          criteriaType === CriteriaType.SINGLE_POST_LIKES
        );
      }

      return false;
    });

    await Promise.all(badgesToCheck.map(badge => checkBadge(userId, badge.id)));
  } catch (error) {
    console.error('Error in checkBadgesByType:', error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId, badgeId, triggerType } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
      });
    }

    if (badgeId) {
      const awarded = await checkBadge(userId, badgeId);
      return new Response(
        JSON.stringify({
          awarded,
          message: awarded ? 'Badge awarded' : 'Not eligible',
        }),
        { status: 200 },
      );
    }

    if (triggerType) {
      await checkBadgesByType(userId, triggerType);
      return new Response(JSON.stringify({ message: 'Badges checked' }), {
        status: 200,
      });
    }

    await checkBadgesByType(userId, 'all');
    return new Response(JSON.stringify({ message: 'All badges checked' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error in badges/check API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
