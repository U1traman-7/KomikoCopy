import {
  createSupabase,
  failed,
  getAuthUserId,
  success,
} from './_utils/index.js';
import { uniqBy } from 'lodash-es';
import { awardLeaderboardBadge } from './badges/check.js';
import { trackServerEvent } from './_utils/posthog.js';

const supabase = createSupabase();

type Role = 'post' | 'creator' | 'character';
type Range = 'daily' | 'weekly' | 'monthly';

const CREATOR_REWARD_AMOUNTS: Record<'weekly' | 'monthly', number[]> = {
  weekly: [500, 300, 100],
  monthly: [1000, 800, 500],
};

const REWARD_TYPES = {
  CREATOR_WEEKLY: 1,
  CREATOR_MONTHLY: 2,
} as const;

type User = {
  id: string;
  user_uniqid: string;
  image: string;
  user_name: string;
};
type PostWithUser = {
  id: number;
  title: string;
  media: string[];
  media_type: string;
  created_at: string;
  uniqid: string;
  User: User | null;
};

type CharacterWithUser = {
  character_uniqid: string;
  character_name: string;
  character_pfp: string;
  User: User | null;
};

type UserPostCount = {
  user_id: string;
  posts: number;
};
type UserFans = {
  user_id: string;
  fans: number;
};

type GetRankingDataParams = {
  role: Role;
  range: Range;
  userId?: string;
};

type UserFansData = { user_id: string; fans_count: number }[];
const getFans = async (userData: { user_id: string }[]) => {
  const { data: userFollowData, error: userFollowError } = await supabase
    .rpc('get_user_fans_by_ids', {
      ids: userData.map(item => item.user_id),
    })
    .overrideTypes<UserFansData, { merge: false }>();
  if (userFollowError || !userFollowData) {
    console.error('get user fans data failed', userFollowError);
    return [] as UserFansData;
  }
  return userFollowData as UserFansData;
};

const getPosts = async (userData: { user_id: string }[]) => {
  const { data: userPostData, error: userPostError } = await supabase
    .rpc('get_user_posts_by_ids', {
      ids: userData.map(item => item.user_id),
    })
    .overrideTypes<{ user_id: string; posts: number }[], { merge: false }>();
  if (userPostError || !userPostData) {
    console.error('get user posts data failed', userPostError);
    return [] as { user_id: string; posts: number }[];
  }
  return userPostData as { user_id: string; posts: number }[];
};

const getFollowingStatus = async (
  userData: { user_id: string }[],
  userId: string,
) => {
  const ids = userData.map(item => item.user_id);
  if (!userId) {
    return ids.map(id => ({ id, status: false }));
  }
  const { data, error } = await supabase
    .from('AppFollows')
    .select('follower, following')
    .eq('follower', userId)
    .in('following', ids);
  if (error) {
    console.error('Error fetching following status:', error);
    return ids.map(id => ({ id, status: false }));
  }
  return ids.map(id => ({
    id,
    status: data?.some(item => item.following === id) || false,
  }));
};

const getStartDate = (range: Range) => {
  const startDate = new Date();
  if (range === 'daily') {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === 'weekly') {
    startDate.setDate(startDate.getDate() - startDate.getDay());
    startDate.setHours(0, 0, 0, 0);
  } else if (range === 'monthly') {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  }
  return startDate.toISOString();
};

const getPeriodDate = (range: Range) =>
  new Date(getStartDate(range)).toISOString().split('T')[0];

const isRewardableRange = (range: Range): range is 'weekly' | 'monthly' =>
  range === 'weekly' || range === 'monthly';

const incrementUserCredit = async (userId: string, amount: number) => {
  const { error } = await supabase.rpc('increment_user_credit', {
    user_id: userId,
    amount,
  });
  if (!error) {
    trackServerEvent('dispatch_credit', userId, {
      credit: amount,
      reason: 'creator_ranking_reward',
    });
    return true;
  }
  console.warn('increment_user_credit RPC failed, fallback to manual update', {
    userId,
    amount,
    error,
  });
  const { data, error: fetchError } = await supabase
    .from('User')
    .select('credit')
    .eq('id', userId)
    .single();
  if (fetchError || !data) {
    console.error('Error fetching credit for leaderboard reward:', fetchError);
    return false;
  }
  const { error: updateError } = await supabase
    .from('User')
    .update({ credit: (data.credit || 0) + amount })
    .eq('id', userId);
  if (updateError) {
    console.error('Error updating credit for leaderboard reward:', updateError);
    return false;
  }
  trackServerEvent('dispatch_credit', userId, {
    credit: amount,
    reason: 'creator_ranking_reward',
  });
  return true;
};

const awardCreatorRankingRewards = async (
  range: Range,
  ranking: Array<{ id: string } | null>,
) => {
  if (!isRewardableRange(range)) {
    return;
  }
  const rewardConfig = CREATOR_REWARD_AMOUNTS[range];
  const validUsers = ranking.filter((item): item is { id: string } =>
    Boolean(item?.id),
  );
  if (!validUsers.length) {
    return;
  }
  const periodDate = getPeriodDate(range);
  const rewardType =
    range === 'weekly'
      ? REWARD_TYPES.CREATOR_WEEKLY
      : REWARD_TYPES.CREATOR_MONTHLY;
  await Promise.all(
    validUsers.slice(0, rewardConfig.length).map(async (user, index) => {
      const rewardAmount = rewardConfig[index];
      if (!rewardAmount) {
        return;
      }
      const dedupeKey = `${user.id}:${rewardType}:${periodDate}`;
      const { data, error } = await supabase
        .from('user_rewards')
        .upsert(
          [
            {
              user_id: user.id,
              reward_type: rewardType,
              reward: rewardAmount,
              period_start_date: periodDate,
              dedupe_key: dedupeKey,
              metadata: {
                reward_type: rewardType,
                role: 'creator',
                range,
                rank: index + 1,
                period_start_date: periodDate,
              },
            },
          ],
          {
            onConflict: 'dedupe_key',
            ignoreDuplicates: true,
          },
        )
        .select('id');
      if (error) {
        console.error('Error recording leaderboard reward:', error);
        return;
      }
      if (!data || data.length === 0) {
        return; // already rewarded this period
      }
      const insertedId = data[0].id;
      const credited = await incrementUserCredit(user.id, rewardAmount);
      if (!credited) {
        await supabase.from('user_rewards').delete().eq('id', insertedId);
      }
    }),
  );
};

const getTopLikedPosts = async (range: Range) => {
  const startDate = getStartDate(range);

  console.log(range, startDate);
  const { data, error } = await supabase
    .from('AppPosts')
    .select(
      'id, votes, title, content, media, media_type, uniqid, created_at, User(id, user_uniqid, image, user_name)',
    )
    .gte('created_at', startDate)
    .not('banned', 'eq', true)
    .not('is_private', 'eq', true)
    .order('votes', { ascending: false })
    .not('authUserId', 'eq', 'fcf52fda-bcd0-48ed-b89b-51b47731f280')
    .limit(100); // 直接选取100个post，移除重复作者的post

  if (error || !data) {
    console.error('get top liked posts failed', error);
    return [];
  }

  return uniqBy(
    data.map(item => ({
      ...item,
      user_image: (item.User as unknown as User)?.image,
      user_name: (item.User as unknown as User)?.user_name,
      user_uniqid: (item.User as unknown as User)?.user_uniqid,
      likes: item.votes,
    })),
    'user_uniqid',
  ).slice(0, 10);
};

const getTopHeatCharacters = async (range: Range) => {
  const startDate = getStartDate(range);
  const { data, error } = await supabase
    .rpc('get_custom_characters_by_heat', {
      start_time: startDate,
      offset_count: 0,
      limit_count: 10,
    })
    .overrideTypes<
      {
        id: number;
        character_uniqid: string;
        character_name: string;
        character_pfp: string;
        user_id: string;
        user_name: string;
        user_image: string;
        user_uniqid: string;
        num_collected: number;
        heat: number;
      }[],
      { merge: false }
    >();

  if (error || !data) {
    console.error('get top collected characters failed', error);
    return [];
  }

  if (!Array.isArray(data)) {
    console.error('get top collected characters data is not an array', data);
    return [];
  }

  return data.map(item => ({
    ...item,
    score: item.heat,
  }));
};

const getSubscriptionStatus = async (userData: { user_id: string }[]) => {
  const { data, error } = await supabase
    .from('Subscriptions')
    .select('user_id, plan')
    .in(
      'user_id',
      userData.map(item => item.user_id),
    )
    .gt('expires', Math.floor(Date.now() / 1000))
    .gt('period_expires', Math.floor(Date.now() / 1000))
    .order('expires', { ascending: false });

  // console.log('get subscription status data', data);
  // console.log('user data', userData);
  if (error) {
    console.error('get subscription status failed', error);
    return userData.map(item => ({ user_id: item.user_id, plan: 'Free' }));
  }
  return userData.map(item => ({
    user_id: item.user_id,
    plan:
      data.filter(d => d.user_id === item.user_id && d.plan !== 'CPP')[0]
        ?.plan || 'Free',
  }));
};

async function getRankingData({ role, range, userId }: GetRankingDataParams) {
  if (role === 'post') {
    return getTopLikedPosts(range);
  }
  if (role === 'character') {
    return getTopHeatCharacters(range);
  }

  const startDate = getStartDate(range);
  const { data: userPostLikesData, error: userPostLikesError } = await supabase
    .rpc('get_user_posts_likes', {
      start_time: startDate,
      offset_count: 0,
      limit_count: 10,
    })
    .overrideTypes<
      { user_id: string; user_posts_likes: number }[],
      { merge: false }
    >();
  if (userPostLikesError || !userPostLikesData) {
    console.error('get top users by post likes failed', userPostLikesError);
    return [];
  }
  const totalUserPostLikesData = userPostLikesData as {
    user_id: string;
    user_posts_likes: number;
  }[];

  console.log(totalUserPostLikesData);
  const { data: userProfileData, error: userUserError } = await supabase
    .from('User')
    .select('id, user_uniqid, image, user_name')
    .in(
      'id',
      totalUserPostLikesData.map(item => item.user_id),
    );

  const [
    userFollowData,
    userPostData,
    followingStatusData,
    subscriptionStatusData,
  ] = await Promise.all([
    getFans(totalUserPostLikesData),
    getPosts(totalUserPostLikesData),
    getFollowingStatus(totalUserPostLikesData, userId ?? ''),
    getSubscriptionStatus(totalUserPostLikesData),
  ]);

  if (userUserError || !userProfileData) {
    console.error('get user user data failed', userUserError);
    return [];
  }

  const result = totalUserPostLikesData.map(item => {
    const found = userProfileData.find(u => u.id === item.user_id);
    if (!found) {
      return null;
    }
    return {
      ...found,
      user_image: found.image,
      user_name: found.user_name,
      user_uniqid: found.user_uniqid,
      likes: item.user_posts_likes,
      fans:
        (userFollowData as unknown as UserFans[]).find(
          f => f.user_id === item.user_id,
        )?.fans || 0,
      posts:
        (userPostData as UserPostCount[]).find(p => p.user_id === item.user_id)
          ?.posts || 0,
      following:
        followingStatusData.find(f => f.id === item.user_id)?.status || false,
      vip:
        subscriptionStatusData.find(s => s.user_id === item.user_id)?.plan ||
        'Free',
    };
  });

  // TODO: 暂时注释掉排行榜徽章发放
  // // Award leaderboard badges to top 3 creators
  // const validResults = result.filter((item): item is NonNullable<typeof item> => item !== null);
  // if (validResults.length >= 3) {
  //   try {
  //     const topThree = validResults.slice(0, 3);
  //     await Promise.all(
  //       topThree.map((user, index) =>
  //         awardLeaderboardBadge(user.id, index + 1).catch(error => {
  //           console.error(`Error awarding badge to user ${user.id} (rank ${index + 1}):`, error);
  //         })
  //       )
  //     );
  //   } catch (error) {
  //     console.error('Error awarding leaderboard badges:', error);
  //   }
  // }

  if (role === 'creator') {
    await awardCreatorRankingRewards(
      range,
      result as Array<{ id: string } | null>,
    );
  }

  return result;
}
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    // range:  daily, weekly, monthly
    const range = params.get('range') as Range;
    // role: post, creator, character
    const role = params.get('role') as Role;
    if (!range || !role) {
      return failed('range and role are required');
    }
    const authUserId = await getAuthUserId(request);

    const data = await getRankingData({
      role,
      range,
      userId: authUserId || '',
    });

    return success(data);
  } catch (error) {
    console.error(error);
    return failed('fetch ranking data failed');
  }
}
