import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { CreditModel } from './_models/credit.js';
import { getUserBadges } from './badges/get.js';
import { Badge } from '@/state/index.js';
import { moderateText } from './_utils/moderation.js';
import { ERROR_CODES, ROLES, CONTENT_TYPES, BROAD_TYPES } from './_constants.js';
import { pushMessage } from './message.js';
import { waitUntil } from '@vercel/functions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type ProfileEditableField = 'user_name' | 'user_desc' | 'image';

function normalizeModerationReason(reason?: string): {
  reason: string;
  details?: string;
} {
  if (!reason) {
    return { reason: 'inappropriate_content' };
  }

  const prefix = 'moderation_error:';
  if (reason.startsWith(prefix)) {
    return { reason: 'moderation_error', details: reason.slice(prefix.length).trim() };
  }

  return { reason };
}

function profileModerationFailed(
  field: ProfileEditableField,
  moderationReason?: string,
) {
  const { reason, details } = normalizeModerationReason(moderationReason);

  return new Response(
    JSON.stringify({
      error_code: ERROR_CODES.PROFILE_MODERATION_FAILED,
      field,
      reason,
      ...(details ? { details } : {}),
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

interface Profile {
  id: string;
  authUserId: string;
  user_uniqid: string;
  created_at: string;
  user_name: string;
  image: string;
  user_desc: string;
  num_followers?: number;
  num_following?: number;
  num_posts?: number; // 添加posts数量字段
  credit: number;
  date_checkin: string;
  date_post: string;
  date_like: string;
  tour_completed: boolean;
  followed: boolean;
  isFollowingMe?: boolean; // 对方是否关注了我（用于显示 "Follows you" 标签）
  is_cpp: boolean;
  plan?: string; // 添加VIP计划字段
  email: string;
  is_official?: boolean; // 添加官方账号标识
  roles?: number[];
  badges?: Badge[]
}

interface VideoItem {
  id: number;
  url_path: string;
  thumbnail_path?: string;
  title?: string;
  description?: string;
  created_at: string;
  user_uniqid?: string;
}

async function updateRefCode(
  authUserId: string,
  newRefCode: string,
): Promise<void> {
  supabase
    .rpc('update_ref_code', {
      authuserid: authUserId,
      new_ref_code: newRefCode,
    })
    .then(({ error }) =>
      error
        ? console.error('Error updating ref_code:', error)
        : console.log('Ref_code update function called successfully'),
    );
}

const fetchNumFollowers = async (authUserId: string) => {
  const { data, error } = await supabase.rpc('update_follow_counts', {
    authuserid: authUserId,
  });
  if (error) {
    console.error('Error fetching follower count:', error);
    return null;
  }
  return data;
};

const fetchNumFollowersPublic = async (user_uniqid: string) => {
  const { data, error } = await supabase.rpc('update_follow_counts_by_uniqid', {
    user_uniqid,
  });
  if (error) {
    console.error('Error fetching follower count:', error);
    return null;
  }
  return data;
};

export async function POST(request: Request) {
  try {
    let {
      method,
      page,
      authUserId,
      new_username,
      new_bio,
      new_image,
      user_uniqid,
      // admin-reset-profile fields
      target_user_uniqid,
      reset_avatar,
      reset_username,
      reset_bio,
    } = await request.json();

    // ! FETCH COOKIE IF USER ID NOT PROVIDED
    if (!authUserId) {
      // Parse cookies from the request headers
      const cookies = parse(request.headers.get('cookie') || '');
      const sessionToken = cookies['next-auth.session-token'];
      if (!sessionToken) {
        if (method === 'profile' || method === 'edit-profile') {
          return new Response(JSON.stringify({ error: 'Log in to continue' }), {
            status: 401,
          });
        }
        authUserId = '';
      } else {
        let token: any = null;
        try {
          token = await decode({
            token: sessionToken,
            secret: process.env.NEXTAUTH_SECRET!,
          });
        } catch (error) {
          console.error('Error fetching user:', error);
        }
        if (!token) {
          if (method === 'profile' || method === 'edit-profile') {
            return new Response(
              JSON.stringify({ error: 'Invalid login status' }),
              { status: 401 },
            );
          }
          authUserId = '';
        } else {
          authUserId = token.id;
        }
      }

      // ! SAVE REF CODE
      const refCode = cookies['ref'];
      if (refCode) {
        console.log('found ref code:', refCode);
        updateRefCode(authUserId, refCode);
      }

      // ! UPDATE FOLLOWER FOUNT
      // fetchNumFollowers(authUserId);
    }

    // console.log('running profile request, auth user:', authUserId);

    const creditModel = new CreditModel(authUserId);

    // ! FETCH USER VIDEOS
    if (method === 'fetch-videos') {
      // Default to page 1 if not provided
      const pageNumber = page || 1;
      const pageSize = 12; // Number of videos per page
      const offset = (pageNumber - 1) * pageSize;

      // Get the user_uniqid from the database using authUserId
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('user_uniqid')
        .eq('id', authUserId)
        .single();

      if (userError) {
        return new Response(JSON.stringify({ error: userError.message }), {
          status: 400,
        });
      }

      const userUniqid = userData.user_uniqid;

      // Query videos from UserVideos table
      const { data: videos, error } = await supabase
        .from('UserVideos')
        .select(
          'id, url_path, thumbnail_path, title, description, created_at, user_uniqid',
        )
        .eq('user_uniqid', userUniqid)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
        });
      }

      return new Response(JSON.stringify(videos || []), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ! FETCH AUTHED USER INFO
    if (method === 'profile') {
      const { data, error } = await supabase
        .from('User')
        .select(
          'id, created_at, user_name, image, user_desc, num_followers, num_following, credit, date_checkin, date_post, date_like, tour_completed, user_uniqid, invite_code, is_cpp, email, user_roles(user_id, role)',
        )
        .eq('id', authUserId)
        .single(); // Since we expect only one user to match the ID

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
        });
      }
      const isOfficialAccount = Boolean(
        process.env.OFFICIAL_ACCOUNT_ID &&
          data.id &&
          data.id === process.env.OFFICIAL_ACCOUNT_ID,
      );

      // 创建profile对象并添加必要字段
      const profile: Profile = {
        id: data.id || '',
        authUserId: data.id || '', // 确保不是 undefined
        user_uniqid: data.user_uniqid || '',
        created_at: data.created_at || '',
        user_name: data.user_name || '',
        image: data.image || '',
        user_desc: data.user_desc || '',
        // num_followers: 0,
        // num_following: 0,
        credit: data.credit || 0,
        date_checkin: data.date_checkin || '',
        date_post: data.date_post || '',
        date_like: data.date_like || '',
        tour_completed: data.tour_completed || false,
        followed: false, // 自己的profile不需要这个字段
        is_cpp: data.is_cpp || false,
        email: data.email || '',
        num_posts: 0, // 初始值，下面会更新
        plan: 'Free', // 初始值，下面会更新
        is_official: isOfficialAccount || false, // 添加官方账号标识
        roles: data.user_roles?.map(r => r.role) || [],
        badges: []
      };

      if (profile.credit === null || profile.credit === undefined) {
        await supabase
          .from('User')
          .update({ credit: 500 }) // initial credits
          .eq('id', authUserId);
        profile.credit = 500;
        profile.plan = 'Free';
      } else {
        profile.credit = await creditModel.get();
        const freeCredit = await creditModel.getFreeCredit();

        // 检查CPP状态
        // if (profile.is_cpp) {
        //   profile.plan = 'CPP';
        // } else {
        // 获取Stripe订阅计划
        const allSubscriptions = creditModel.subscriptions || [];
        profile.plan =
          allSubscriptions.filter(s => s.plan !== 'CPP')[0]?.plan || 'Free';
        // }

        // 添加额外字段到data对象中，用于返回
        (profile as any).free_credit = freeCredit;
        (profile as any).plan_codes =
          creditModel.subscriptions.map(s => s.plan_code) || [];
        (profile as any).subscription_status =
          creditModel.subscriptions?.[0]?.status || 0;
        (profile as any).invite_code = data.invite_code;
      }

      // 获取用户的posts数量
      const { count: postsCount, error: postsError } = await supabase
        .from('AppPosts')
        .select('id', { count: 'exact', head: true })
        .eq('authUserId', authUserId);

      if (postsError) {
        console.error('Error fetching posts count:', postsError);
        profile.num_posts = 0;
      } else {
        profile.num_posts = postsCount || 0;
      }

      profile.badges = await getUserBadges(authUserId, profile.plan, profile.is_cpp);

      return new Response(JSON.stringify(profile), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ! FETCH PUBLIC USER PROFILE
    if (method == 'public-profile') {
      console.log('fetching public profile, user uniqid:', user_uniqid);

      fetchNumFollowersPublic(user_uniqid);

      const { data, error } = await supabase
        .from('User')
        .select(
          'id, created_at, user_name, image, user_desc, num_followers, num_following, user_uniqid, is_cpp',
        )
        .eq('user_uniqid', user_uniqid)
        .single(); // Since we expect only one user to match the ID

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
        });
      }

      // 并行查询关注状态和反向关注状态
      const followStatusPromise = supabase
        .rpc('check_follow_status', {
          authuserid: authUserId,
          following_user_uniqid: user_uniqid,
        })
        .returns<boolean>();

      const reverseFollowPromise = authUserId
        ? supabase
            .from('AppFollows')
            .select('id')
            .eq('follower', data.id)
            .eq('following', authUserId)
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null });

      const [followStatusResult, reverseFollowResult] = await Promise.all([
        followStatusPromise,
        reverseFollowPromise,
      ]);

      const { data: followStatus, error: followStatusError } = followStatusResult;

      if (followStatusError) {
        console.log('error', followStatusError);
        return new Response(
          JSON.stringify({
            error: followStatusError.message,
            trigger: 'count_votes',
          }),
          { status: 500 },
        );
      }

      // 查询对方是否关注了我（用于 "Follows you" 标签）
      const isFollowingMe = !!reverseFollowResult.data;

      // 创建公开profile对象
      const profile: Profile = {
        id: data.id || '',
        authUserId: data.id || '', // 确保不是 undefined
        user_uniqid: data.user_uniqid || '',
        created_at: data.created_at || '',
        user_name: data.user_name || '',
        image: data.image || '',
        user_desc: data.user_desc || '',
        // num_followers: data.num_followers || 0,
        // num_following: data.num_following || 0,
        followed: (followStatus as boolean) || false,
        isFollowingMe,

        credit: 0, // 不暴露用户积分
        date_checkin: '',
        date_post: '',
        date_like: '',
        tour_completed: false,
        is_cpp: data.is_cpp || false,
        num_posts: 0, // 初始值，下面会更新
        plan: 'Free', // 初始值，下面会更新
        email: '',
        badges: []
      };

      // 获取用户的posts数量
      const { count: postsCount, error: postsError } = await supabase
        .from('AppPosts')
        .select('id', { count: 'exact', head: true })
        .eq('authUserId', data.id);

      if (postsError) {
        console.error('Error fetching posts count:', postsError);
        profile.num_posts = 0;
      } else {
        profile.num_posts = postsCount || 0;
      }

      // 添加VIP计划信息 - 直接查询Subscriptions表
      // const tableName = process.env.MODE === 'development' ? 'Subscriptions_test' : 'Subscriptions';
      const now = Math.floor(Date.now() / 1000);

      const { data: subscriptionData, error: subError } = await supabase
        .from('Subscriptions')
        .select('plan, plan_code, status, expires, period_expires')
        .eq('user_id', data.id)
        .gt('expires', now)
        .order('expires', { ascending: false });
      if (subError) {
        console.error('Error fetching subscription:', subError);
        profile.plan = 'Free';
      } else if (subscriptionData && subscriptionData.length > 0) {
        // 检查订阅是否在有效期内（expires > now 已经在查询中过滤了）
        // 对于有 period_expires 的订阅，还需要检查 period_expires
        const activeSubscriptions = subscriptionData.filter(
          sub =>
            // 如果没有 period_expires 或者 period_expires > now，则认为有效
            !sub.period_expires || sub.period_expires > now,
        );
        // 优先显示非CPP的VIP计划，如果没有则显示CPP，最后才是Free
        const vipPlan = activeSubscriptions.find(s => s.plan !== 'CPP')?.plan;
        // const cppPlan = activeSubscriptions.find(s => s.plan === 'CPP')?.plan;
        // profile.plan = vipPlan || cppPlan || 'Free';
        profile.plan = vipPlan || 'Free';
      } else {
        profile.plan = 'Free';
      }

      // 为public profile也添加plan_codes字段
      (profile as any).plan_codes =
        subscriptionData?.map(s => s.plan_code) || [];
   
      // 获取所有徽章（包括用户成就徽章和VIP徽章）
      profile.badges = await getUserBadges(String(data.id), profile.plan, profile.is_cpp);
     
      return new Response(JSON.stringify(profile), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ! EDIT PROFILE
    if (method == 'edit-profile') {
      console.log('editing profile');
      console.log(authUserId, new_username, new_bio);

      // 审核用户名
      if (new_username && new_username.trim()) {
        const usernameModeration = await moderateText(new_username);
        if (!usernameModeration.approved) {
          return profileModerationFailed('user_name', usernameModeration.reason);
        }
      }

      // 审核个人简介
      if (new_bio && new_bio.trim()) {
        const bioModeration = await moderateText(new_bio);
        if (!bioModeration.approved) {
          return profileModerationFailed('user_desc', bioModeration.reason);
        }
      }

      // 审核通过，更新数据库
      const { data, error } = await supabase
        .from('User')
        .update({
          user_name: new_username,
          user_desc: new_bio,
          image: new_image,
        })
        .eq('id', authUserId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
        });
      }
      console.log('edit success');
      return new Response(
        JSON.stringify({ message: 'Profile updated successfully', data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ! ADMIN RESET PROFILE
    if (method === 'admin-reset-profile') {
      // Verify admin permissions
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUserId);

      if (roleError) {
        console.error('Error checking user roles:', roleError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify permissions' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const hasAdminRole = roleData?.some(r => r.role === ROLES.ADMIN);
      if (!hasAdminRole) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Admin access required' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Find target user
      const { data: targetUser, error: targetUserError } = await supabase
        .from('User')
        .select('id')
        .eq('user_uniqid', target_user_uniqid)
        .single();

      if (targetUserError || !targetUser) {
        return new Response(
          JSON.stringify({ error: 'Target user not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Build update object based on reset flags
      const updateData: Record<string, string> = {};
      const resetFields: string[] = [];

      if (reset_avatar) {
        updateData.image = '';
        resetFields.push('avatar');
      }
      if (reset_username) {
        updateData.user_name = '';
        resetFields.push('username');
      }
      if (reset_bio) {
        updateData.user_desc = '';
        resetFields.push('bio');
      }

      if (resetFields.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No fields to reset' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('User')
        .update(updateData)
        .eq('id', targetUser.id);

      if (updateError) {
        console.error('Error resetting profile:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to reset profile' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Send notification to the user
      waitUntil(
        pushMessage({
          content_type: CONTENT_TYPES.OFFICIAL,
          content_id: 0,
          host_content_id: 0,
          broad_type: BROAD_TYPES.MESSAGE,
          user_id: targetUser.id,
          payload: {
            type: 'profile_reset',
            message: `Your profile (${resetFields.join(', ')}) uploaded failed to pass the review, please upload it again.`,
            reset_fields: resetFields,
          },
        }),
      );

      console.log(`Admin ${authUserId} reset profile for user ${target_user_uniqid}: ${resetFields.join(', ')}`);

      return new Response(
        JSON.stringify({
          message: 'Profile reset successfully',
          reset_fields: resetFields,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ message: 'success' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
