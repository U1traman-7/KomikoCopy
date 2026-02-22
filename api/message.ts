import { BROAD_TYPES, CONTENT_TYPES } from './_constants.js';
import {
  createSupabase,
  failed,
  getAuthUserId,
  success,
  unauthorized,
} from './_utils/index.js';
import { waitUntil } from '@vercel/functions';
import { omit } from 'lodash-es';

// TODO: 所有的类型消息可以统一查询用户信息和帖子数据，减少重复查询
interface UserInfo {
  id: string;
  user_name: string;
  image: string;
  user_uniqid: string;
}
interface PostInfo {
  id: number;
  title: string;
  media: string[];
  uniqid: string;
}
interface CharacterInfo {
  id: string;
  character_name: string;
  character_pfp: string;
}

interface CommentInfo {
  id: number;
  postId: number;
  authUserId: string;
  content: string;
  AppPosts?: PostInfo;
}

const CacheQuery = {
  user: {
    result: null as null | Promise<UserInfo[]>,
    data: [] as string[],
  },
  post: {
    result: null as null | Promise<PostInfo[]>,
    data: [] as number[],
  },
  character: {
    result: null as null | Promise<CharacterInfo[]>,
    data: [] as string[],
  },
  comment: {
    result: null as null | Promise<CommentInfo[]>,
    data: [] as number[],
  },
};

const supabase = createSupabase();

type Action = 'count' | 'all_read' | 'detail';
type MessageContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

interface IMessage {
  sort_id: number;
  user_id: string;
  host_content_id: number;
  content_type: MessageContentType;
  aggregate_id: string | null;
  top_message_ids: number[];
  top_content_ids: number[];
  other_count: number;
  is_aggregate: boolean;
  // payload?: Record<string, any> | null;
  payloads: (Record<string, any> | null)[];
}

interface MessageUser {
  users: {
    user_id: string;
    user_name: string;
    avatar_url: string;
    user_uniqid: string;
  }[];
}
interface MessageContent extends MessageUser {
  id: number;
  type: MessageContentType;
  content?: string;
  host_thumbnail?: string;
  other_count?: number;
  host_content_title?: string;
  host_content_uniqid?: string;
  is_comment?: boolean;
  payload?: Record<string, any> | null;
  isFollowedByMe?: boolean; // 我是否已关注了这个粉丝（用于 Follow back 按钮）
}

class Scheduler {
  resolvers: ((value: void | PromiseLike<void>) => void)[] = [];
  promises: Promise<void>[] = [];
  // 等人
  wait() {
    const promise = new Promise<void>(resolve => {
      this.resolvers.push(resolve);
    });
    this.promises.push(promise);
    return promise;
  }
  // 上车
  ready() {
    const resolve = this.resolvers.pop();
    if (resolve) {
      resolve();
    }
  }
  // 发车
  async start() {
    await Promise.resolve();
    return Promise.all(this.promises);
  }
}

const scheduler = new Scheduler();

const getUnreadMessageCount = async (authUserId: string) => {
  const { data: lastRead, error: lastReadError } = await supabase
    .from('messages_read_status')
    .select('last_read_message_id')
    .eq('user_id', authUserId)
    .single();
  let lastMessageId = lastRead?.last_read_message_id || 0;
  if (lastReadError) {
    if (lastReadError.code === 'PGRST116') {
      // 没有记录，视为从未读取
      lastMessageId = 0;
    } else {
      console.error('Error fetching last read message:', lastReadError);
      return 0;
    }
  }
  const { count, error: countError } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .or(`user_id.eq.${authUserId},broad_type.eq.${BROAD_TYPES.BROADCAST}`)
    .gt('id', lastMessageId);
  if (countError) {
    console.error('Error fetching unread messages:', countError);
    return 0;
  }
  return count ?? 0;
};

const markAllRead = async (authUserId: string) => {
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('id')
    .or(`user_id.eq.${authUserId},broad_type.eq.${BROAD_TYPES.BROADCAST}`)
    .order('id', { ascending: false })
    .limit(1);
  if (messagesError || !messages?.length) {
    console.error('Error fetching last message:', messagesError);
    return false;
  }
  const { error } = await supabase.from('messages_read_status').upsert(
    {
      last_read_message_id: messages[0].id,
      user_id: authUserId,
    },
    {
      onConflict: 'user_id',
    },
  );
  if (error) {
    console.error('Error marking all messages as read:', error);
    return false;
  }
  return true;
};

const filterUserInfo = (userIds: string[], userData: UserInfo[]) =>
  userData.filter(user => userIds.includes(user.id));

const getUserInfo = async (userIds: string[]) => {
  CacheQuery.user.data.push(...userIds);
  if (CacheQuery.user.result) {
    const result = await CacheQuery.user.result;
    return filterUserInfo(userIds, result);
  }

  const query = async () => {
    await scheduler.start();
    if (CacheQuery.user.data.length === 0) {
      return [];
    }
    const { data: usersData, error: usersError } = await supabase
      .from('User')
      .select('id, user_name, image, user_uniqid')
      .in('id', Array.from(new Set(CacheQuery.user.data)));
    CacheQuery.user.data = [];
    CacheQuery.user.result = null;
    if (usersError || !usersData) {
      console.error('Error fetching users:', usersError);
      return [];
    }
    return usersData;
  };

  CacheQuery.user.result = query();
  const result = await CacheQuery.user.result;
  return filterUserInfo(userIds, result);
};

const filterPostInfo = (postIds: number[], postData: PostInfo[]) =>
  postData.filter(post => postIds.includes(post.id));

const getPostInfo = async (postIds: number[]) => {
  CacheQuery.post.data.push(...postIds);
  if (CacheQuery.post.result) {
    const result = await CacheQuery.post.result;
    return filterPostInfo(postIds, result);
  }
  const query = async () => {
    await scheduler.start();
    if (CacheQuery.post.data.length <= 0) {
      return [];
    }
    const { data: postsData, error: postsError } = await supabase
      .from('AppPosts')
      .select('id, title, media, uniqid')
      .in('id', Array.from(new Set(CacheQuery.post.data)));
    CacheQuery.post.data = [];
    CacheQuery.post.result = null;
    if (postsError || !postsData?.length) {
      console.error('Error fetching posts:', postsError);
      return [];
    }
    return postsData;
  };

  CacheQuery.post.result = query();
  const result = await CacheQuery.post.result;
  return filterPostInfo(postIds, result);
};

const filterCommentInfo = (commentIds: number[], commentData: CommentInfo[]) =>
  commentData.filter(comment => commentIds.includes(comment.id));

const getCommentInfo = async (commentIds: number[]) => {
  CacheQuery.comment.data.push(...commentIds);
  if (CacheQuery.comment.result) {
    const result = await CacheQuery.comment.result;
    return filterCommentInfo(commentIds, result);
  }
  const query = async () => {
    await scheduler.start();
    if (CacheQuery.comment.data.length === 0) {
      return [];
    }
    const { data: commentsData, error: commentsError } = await supabase
      .from('AppComments')
      .select('id, postId, authUserId, content')
      .in('id', Array.from(new Set(CacheQuery.comment.data)));
    CacheQuery.comment.data = [];
    CacheQuery.comment.result = null;
    if (commentsError || !commentsData?.length) {
      console.error('Error fetching comments:', commentsError);
      return [];
    }
    let postInfo: PostInfo[] = [];
    const { data: postInfoData, error: postsError } = await supabase
      .from('AppPosts')
      .select('id, title, media, uniqid')
      .in(
        'id',
        commentsData.map(comment => comment.postId),
      );
    if (postInfoData) {
      postInfo = postInfoData;
    }
    if (postsError || !postInfo) {
      console.error('Error fetching posts:', postsError);
    }
    return commentsData.map(comment => {
      const postData = postInfo.find(post => post.id === comment.postId);
      return {
        ...comment,
        AppPosts: postData,
      };
    });
  };
  CacheQuery.comment.result = query();
  const result = await CacheQuery.comment.result;
  return filterCommentInfo(commentIds, result);
};

const convertToMessageUser = (
  usersData: {
    id: string;
    user_name: string;
    image: string;
    user_uniqid: string;
  }[],
): MessageUser => ({
  users: usersData.map(user => ({
    user_id: user.id,
    user_name: user.user_name,
    avatar_url: user.image,
    user_uniqid: user.user_uniqid,
  })),
});

const convertPostToContent = (postInfo: PostInfo) => ({
  host_content_title: postInfo?.title,
  host_thumbnail: postInfo?.media?.[0],
  host_content_uniqid: postInfo?.uniqid,
});

const convertCommentToContent = (commentInfo: CommentInfo) => ({
  host_content_title: commentInfo.content,
  host_thumbnail: commentInfo.AppPosts?.media?.[0],
  host_content_uniqid: commentInfo.AppPosts?.uniqid,
});

const getLikesMessage = async (
  message: IMessage,
): Promise<MessageContent | null> => {
  const messageIds = message.top_content_ids;
  const payloads = message.payloads
    ?.map(payload => parseMessagePayload(payload))
    .filter(payload => payload?.actor);
  let postLikes: { authUserId: string; postId: number; commentId: number }[] =
    [];

  if (!payloads?.length) {
    scheduler.wait();
    const { data: likesData, error: likesError } = await supabase
      .from('AppVotes')
      .select('authUserId, postId, commentId')
      .in('id', messageIds);

    scheduler.ready();

    if (likesError || !likesData) {
      console.error('Error fetching likes message:', likesError);
      return null;
    }
    postLikes = likesData.filter(like => like.postId && !like.commentId);
    if (!postLikes.length) {
      // Backward compatibility: older comment-like messages shared the LIKES type
      return getCommentLikesMessage(message);
    }
  }

  const userIds = postLikes?.length
    ? postLikes.map(like => like.authUserId)
    : payloads?.map(payload => payload?.actor);

  const [usersData, contentInfo] = await Promise.all([
    getUserInfo(userIds),
    getPostInfo([message.host_content_id]),
  ]);

  const messageUser = convertToMessageUser(usersData);

  const content = convertPostToContent(contentInfo?.[0] as PostInfo);

  return {
    id: message.sort_id,
    type: CONTENT_TYPES.LIKES,
    other_count: message.other_count,
    ...content,
    ...messageUser,
  };
};

const getCommentLikesMessage = async (
  message: IMessage,
): Promise<MessageContent | null> => {
  const payloads = message.payloads
    ?.map(payload => parseMessagePayload(payload))
    .filter(payload => payload?.actor);
  let commentLikes: {
    authUserId: string;
    postId: number;
    commentId: number;
  }[] = [];
  if (!payloads?.length) {
    scheduler.wait();
    const messageIds = message.top_content_ids;
    const { data: likesData, error: likesError } = await supabase
      .from('AppVotes')
      .select('authUserId, postId, commentId')
      .in('id', messageIds);

    scheduler.ready();

    if (likesError || !likesData) {
      console.error('Error fetching comment likes message:', likesError);
      return null;
    }
    commentLikes = likesData.filter(like => like.commentId);
    if (!commentLikes.length) {
      return null;
    }
  }
  const userIds = commentLikes.length
    ? commentLikes.map(like => like.authUserId)
    : payloads?.map(payload => payload?.actor);
  const [usersData, commentInfo] = await Promise.all([
    getUserInfo(userIds),
    getCommentInfo([message.host_content_id]),
  ]);
  const messageUser = convertToMessageUser(usersData);

  const content = convertCommentToContent(commentInfo?.[0] as CommentInfo);

  return {
    id: message.sort_id,
    type: CONTENT_TYPES.COMMENT_LIKES,
    other_count: message.other_count,
    ...content,
    ...messageUser,
  };
};

const getCommentsMessage = async (
  message: IMessage,
): Promise<MessageContent | null> => {
  scheduler.wait();
  const commentIds = message.top_content_ids;
  const { data: commentsData, error: commentsError } = await supabase
    .from('AppComments')
    .select('id, postId, authUserId, content, parentCommentId')
    .eq('id', commentIds[0]);
  scheduler.ready();
  if (commentsError || !commentsData) {
    console.error('Error fetching comments message:', commentsError);
    return null;
  }
  const userIds = commentsData.map(comment => comment.authUserId);
  const [usersData, postInfo] = await Promise.all([
    getUserInfo(userIds),
    getPostInfo([commentsData[0].postId]),
  ]);
  const messageUser = convertToMessageUser(usersData);
  const content = convertPostToContent(postInfo?.[0]);
  return {
    id: message.sort_id,
    type: CONTENT_TYPES.COMMENT,
    other_count: message.other_count,
    ...content,
    content: commentsData[0].content,
    is_comment: !!commentsData[0].parentCommentId,
    ...messageUser,
  };
};

const getReplyCommentMessage = async (
  message: IMessage,
): Promise<MessageContent | null> => {
  scheduler.wait();
  const commentIds = message.top_content_ids;
  const { data: commentsData, error: commentsError } = await supabase
    .from('AppComments')
    .select('id, postId, authUserId, content')
    .eq('id', commentIds[0]);
  scheduler.ready();

  if (commentsError || !commentsData) {
    console.error('Error fetching reply comment message:', commentsError);
    return null;
  }
  const userIds = commentsData.map(comment => comment.authUserId);
  const [usersData, postInfo] = await Promise.all([
    getUserInfo(userIds),
    getPostInfo([commentsData[0].postId]),
  ]);
  const messageUser = convertToMessageUser(usersData);
  const content = convertPostToContent(postInfo?.[0]);
  return {
    id: message.sort_id,
    type: CONTENT_TYPES.REPLY_COMMENT,
    other_count: message.other_count,
    ...content,
    content: commentsData[0].content,
    is_comment: true,
    ...messageUser,
  };
};

const getFollowsMessage = async (
  message: IMessage,
  authUserId?: string,
): Promise<MessageContent | null> => {
  const payloads = message.payloads
    ?.map(payload => parseMessagePayload(payload))
    .filter(payload => payload?.actor);
  let followsData: { id: number; follower: string; following: string }[] = [];
  if (!payloads?.length) {
    scheduler.wait();
    const followIds = message.top_content_ids;
    const { data: followsDataTemp, error: followsError } = await supabase
      .from('AppFollows')
      .select('id, follower, following')
      .in('id', followIds);
    scheduler.ready();
    if (followsError || !followsData) {
      console.error('Error fetching follows message:', followsError);
      return null;
    }
    followsData = followsDataTemp;
  }

  const followerIds = followsData?.length
    ? followsData.map(follow => follow.follower)
    : payloads?.map(payload => payload?.actor);
  const userData = await getUserInfo(followerIds);
  const messageUser = convertToMessageUser(userData);

  // 查询我是否已经关注了这些粉丝（用于 Follow back 按钮）
  let isFollowedByMe = false;
  const firstFollowerId = followerIds?.[0];
  if (authUserId && firstFollowerId) {
    // 只检查第一个用户（聚合消息中显示的主要用户）
    const { data: followBackData, error: followBackError } = await supabase
      .from('AppFollows')
      .select('id')
      .eq('follower', authUserId)
      .eq('following', firstFollowerId)
      .limit(1)
      .maybeSingle();
    if (followBackError) {
      console.error('Error checking follow back status:', followBackError);
    }
    isFollowedByMe = !!followBackData;
  }

  return {
    id: message.sort_id,
    type: CONTENT_TYPES.FOLLOW,
    other_count: message.other_count,
    isFollowedByMe,
    ...messageUser,
  };
};

const getCollectionMessage = async (
  message: IMessage,
): Promise<MessageContent | null> => {
  scheduler.wait();
  const collectionIds = message.top_content_ids;
  const { data: collectionsData, error: collectionsError } = await supabase
    .from('CollectedCharacters')
    .select(
      'id, user_id, character_uniqid, CustomCharacters (character_name, character_pfp)',
    )
    .in('id', collectionIds);
  scheduler.ready();
  if (collectionsError || !collectionsData) {
    console.error('Error fetching collections message:', collectionsError);
    return null;
  }
  const userIds = collectionsData.map(collection => collection.user_id);
  const userData = await getUserInfo(userIds);
  const messageUser = convertToMessageUser(userData);

  return {
    id: message.sort_id,
    type: CONTENT_TYPES.OC_COLLECTED,
    other_count: message.other_count,
    host_thumbnail: (collectionsData[0] as any).CustomCharacters?.character_pfp,
    host_content_title: (collectionsData[0] as any).CustomCharacters
      ?.character_name,
    host_content_uniqid:
      collectionsData[0]?.character_uniqid ||
      (collectionsData[0] as any).CustomCharacters?.character_uniqid,
    ...messageUser,
  };
};

const getFeaturedMessage = async (
  message: IMessage,
): Promise<MessageContent | null> => {
  const FEATURED_TAG_ID = 57349;
  const officialAccountId = process.env.OFFICIAL_ACCOUNT_ID;

  scheduler.wait();
  const { data: featuredData, error: featuredError } = await supabase
    .from('post_tags')
    .select('post_id, AppPosts (title, media, uniqid)')
    .eq('tag_id', FEATURED_TAG_ID)
    .in('id', message.top_content_ids);
  scheduler.ready();
  if (featuredError || !featuredData) {
    console.error('Error fetching featured message:', featuredError);
    return null;
  }
  const firstFeatured = featuredData[0] as any;
  if (!firstFeatured?.AppPosts) {
    console.error('Featured message missing post data', featuredData);
    return null;
  }
  const userData = await getUserInfo([officialAccountId!]);
  const messageUser = convertToMessageUser(userData);

  return {
    id: message.sort_id,
    type: CONTENT_TYPES.FEATURED,
    other_count: message.other_count,
    host_content_title: firstFeatured.AppPosts?.title,
    host_thumbnail: firstFeatured.AppPosts?.media?.[0],
    host_content_uniqid: firstFeatured.AppPosts?.uniqid,
    ...messageUser,
  };
};

const getOCUsedMessage = async (message: IMessage) => {
  const queryPostTags = async (postTagIds: number[]) => {
    const { data: postTagsData, error: postTagsError } = await supabase
      .from('post_tags')
      .select(
        'id, AppPosts (title, media, uniqid, User(user_name, image, user_uniqid))',
      )
      .in('id', postTagIds);
    if (postTagsError || !postTagsData) {
      console.error('Error fetching post tags:', postTagsError);
      return [];
    }
    return postTagsData;
  };
  const queryOC = async (ocId: number) => {
    const { data: ocData, error: ocError } = await supabase
      .from('CustomCharacters')
      .select('character_name, character_pfp, character_uniqid')
      .eq('id', ocId)
      .single();
    if (ocError || !ocData) {
      console.error('Error fetching OC:', ocError);
      return null;
    }
    return ocData;
  };
  scheduler.wait();
  const ocUsedIds = message.top_content_ids;
  const ocId = message.host_content_id;
  const [ocUsedData, ocData] = await Promise.all([
    queryPostTags(ocUsedIds),
    queryOC(ocId),
  ]);
  scheduler.ready();
  if (!ocUsedData.length || !ocData) {
    console.error('OC used message missing data', { ocUsedData, ocData });
    return null;
  }
  const firstPost = ocUsedData[0] as any;
  if (!firstPost?.AppPosts?.User) {
    console.error('OC used message missing post user data', ocUsedData);
    return null;
  }
  const userData = firstPost.AppPosts.User as UserInfo;
  const messageUser = convertToMessageUser([userData]);

  return {
    id: message.sort_id,
    type: CONTENT_TYPES.OC_USED,
    other_count: message.other_count,
    host_content_title: ocData.character_name,
    host_thumbnail: ocData.character_pfp,
    host_content_uniqid: firstPost.AppPosts?.uniqid,
    ...messageUser,
  };
};

const getCppActivatedMessage = async (
  message: IMessage,
): Promise<MessageContent | null> => {
  const officialAccountId = process.env.OFFICIAL_ACCOUNT_ID;
  // 统一走等待队列
  scheduler.wait();
  await Promise.resolve();
  scheduler.ready();
  const userData = officialAccountId
    ? await getUserInfo([officialAccountId])
    : [];
  const messageUser = convertToMessageUser(userData);

  return {
    id: message.sort_id,
    type: CONTENT_TYPES.CPP_ACTIVED,
    other_count: message.other_count,
    payload: parseMessagePayload(message.payloads[0]) ?? undefined,
    ...messageUser,
  };
};

const getShouldChargeMessage = async (
  message: IMessage,
): Promise<MessageContent | null> => {
  // 统一走等待队列
  scheduler.wait();
  await Promise.resolve();
  scheduler.ready();
  const officialAccountId = process.env.OFFICIAL_ACCOUNT_ID;
  const userData = officialAccountId
    ? await getUserInfo([officialAccountId])
    : [];
  const messageUser = convertToMessageUser(userData);
  const payload = parseMessagePayload(message.payloads[0]);

  return {
    id: message.sort_id,
    type: CONTENT_TYPES.SHOULD_CHARGE,
    other_count: message.other_count,
    payload: payload ?? undefined,
    ...messageUser,
  };
};

const getTagRequestMessage = async (
  message: IMessage,
): Promise<MessageContent | null> => {
  // 统一走等待队列
  scheduler.wait();
  await Promise.resolve();
  scheduler.ready();
  const officialAccountId = process.env.OFFICIAL_ACCOUNT_ID;
  const userData = officialAccountId
    ? await getUserInfo([officialAccountId])
    : [];
  const messageUser = convertToMessageUser(userData);
  const payload = parseMessagePayload(message.payloads[0]);

  return {
    id: message.sort_id,
    type: CONTENT_TYPES.TAG_REQUEST,
    other_count: message.other_count,
    payload: payload ?? undefined,
    ...messageUser,
  };
};

const parseMessagePayload = (payload: unknown) => {
  if (!payload) {
    return null;
  }
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch (error) {
      console.error('Failed to parse message payload:', error);
      return null;
    }
  }
  return payload as Record<string, any>;
};

const getBadgeEarnedMessage = async (
  message: IMessage,
): Promise<MessageContent | null> => {
  // 统一走等待队列
  scheduler.wait();
  await Promise.resolve();
  scheduler.ready();
  const officialAccountId = process.env.OFFICIAL_ACCOUNT_ID;
  if (!officialAccountId) {
    console.error('OFFICIAL_ACCOUNT_ID is not configured');
  }
  const payload = parseMessagePayload(message.payloads[0]);
  const userIds = officialAccountId ? [officialAccountId] : [];
  const userData = userIds.length ? await getUserInfo(userIds) : [];
  const messageUser = convertToMessageUser(userData);

  // console.log('getBadgeEarnedMessage', message, messageUser, payload);

  return {
    id: message.sort_id,
    type: CONTENT_TYPES.BADGE_EARNED,
    host_thumbnail: payload?.iconUrl ?? undefined,
    host_content_title: payload?.badgeName ?? payload?.badgeTitle ?? undefined,
    payload: payload ?? undefined,
    ...messageUser,
  };
};

const getOfficialMessage = async (
  message: IMessage,
): Promise<MessageContent | null> => {
  // 统一走等待队列
  scheduler.wait();
  await Promise.resolve();
  scheduler.ready();

  const officialAccountId = process.env.OFFICIAL_ACCOUNT_ID;
  if (!officialAccountId) {
    console.error('OFFICIAL_ACCOUNT_ID is not configured');
  }

  const payload = parseMessagePayload(message.payloads[0]);
  const userIds = officialAccountId ? [officialAccountId] : [];
  const userData = userIds.length ? await getUserInfo(userIds) : [];
  const messageUser = convertToMessageUser(userData);

  return {
    id: message.sort_id,
    type: CONTENT_TYPES.OFFICIAL,
    payload: payload ?? undefined,
    ...messageUser,
  };
};

const processMessage = async (
  messages: IMessage[],
  authUserId?: string,
): Promise<(MessageContent | null)[]> => {
  const promises = messages.map(message => {
    if (message.content_type === CONTENT_TYPES.LIKES) {
      return getLikesMessage(message);
    }
    if (message.content_type === CONTENT_TYPES.COMMENT_LIKES) {
      return getCommentLikesMessage(message);
    }
    if (message.content_type === CONTENT_TYPES.COMMENT) {
      return getCommentsMessage(message);
    }
    if (message.content_type === CONTENT_TYPES.REPLY_COMMENT) {
      return getReplyCommentMessage(message);
    }
    if (message.content_type === CONTENT_TYPES.FOLLOW) {
      return getFollowsMessage(message, authUserId);
    }
    if (message.content_type === CONTENT_TYPES.OC_COLLECTED) {
      return getCollectionMessage(message);
    }
    if (message.content_type === CONTENT_TYPES.FEATURED) {
      return getFeaturedMessage(message);
    }
    if (message.content_type === CONTENT_TYPES.BADGE_EARNED) {
      return getBadgeEarnedMessage(message);
    }
    if (message.content_type === CONTENT_TYPES.CPP_ACTIVED) {
      return getCppActivatedMessage(message);
    }
    if (message.content_type === CONTENT_TYPES.SHOULD_CHARGE) {
      return getShouldChargeMessage(message);
    }
    if (message.content_type === CONTENT_TYPES.TAG_REQUEST) {
      return getTagRequestMessage(message);
    }
    if (message.content_type === CONTENT_TYPES.OFFICIAL) {
      return getOfficialMessage(message);
    }
    return getOCUsedMessage(message);
  });

  return Promise.all(promises);
};

const getMessageDetail = async (
  authUserId: string,
  pageNo?: number,
  pageSize?: number,
): Promise<(MessageContent | null)[]> => {
  pageNo = pageNo ?? 1;
  pageSize = pageSize ?? 10;
  const offset = (pageNo - 1) * pageSize;
  const limit = pageSize;
  const { data, error } = await supabase
    .rpc('get_user_messages', {
      input_user_id: authUserId,
      offset_count: offset,
      limit_count: limit,
    })
    .overrideTypes<IMessage[], { merge: false }>();
  if (error || !data) {
    console.error('Error fetching message detail:', error);
    return [];
  }

  return processMessage(data as IMessage[], authUserId);
};

export async function GET(request: Request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return unauthorized();
    }
    const url = new URL(request.url);
    const action = url.searchParams.get('action') as Action;
    const withRead = url.searchParams.get('withRead') === '1';
    if (action === 'count') {
      const count = await getUnreadMessageCount(authUserId);
      return success({ count });
    }
    if (action === 'all_read') {
      const marked = await markAllRead(authUserId);
      if (marked) {
        return success(null);
      }
      return failed('ALL_READ_FAILED');
    }
    if (action === 'detail') {
      if (withRead) {
        await markAllRead(authUserId);
      }
      const pageNo = parseInt(url.searchParams.get('pageNo') ?? '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') ?? '10');
      const messages = await getMessageDetail(authUserId, pageNo, pageSize);
      return success({ messages });
    }
    return success({ message: 'Invalid action' });
  } catch (error) {
    console.error('Error in message:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

type PushMessage = {
  content_type: MessageContentType;
  content_id: number;
  host_content_id: number;
  need_aggregate?: boolean;
  aggregate_id?: number | null;
  user_id?: string;
  broad_type: (typeof BROAD_TYPES)[keyof typeof BROAD_TYPES];
  is_comment?: boolean;
  // payload is versioned; v1 includes { actor: string } for dedupe.
  payload?: Record<string, unknown> | null;
  reply_to_user_id?: string;
};

export const getToUserId = async (message: PushMessage) => {
  const {
    content_id: contentId,
    content_type: type,
    host_content_id,
    is_comment,
  } = message;
  if (type === CONTENT_TYPES.LIKES || type === CONTENT_TYPES.FEATURED) {
    const tableName = 'AppPosts';
    const { data, error } = await supabase
      .from(tableName)
      .select('authUserId')
      .eq('id', host_content_id)
      .single();
    if (error || !data) {
      console.error('Error fetching to user id:', error, host_content_id);
      throw error || new Error('Error fetching to user id');
    }
    return data?.authUserId;
  }

  if (type === CONTENT_TYPES.COMMENT) {
    const tableName = is_comment ? 'AppComments' : 'AppPosts';
    const { data, error } = await supabase
      .from(tableName)
      .select('authUserId')
      .eq('id', host_content_id)
      .single();
    if (error || !data) {
      console.error('Error fetching to user id:', error, host_content_id);
      throw error || new Error('Error fetching to user id');
    }
    return data?.authUserId;
  }

  if (type === CONTENT_TYPES.COMMENT_LIKES) {
    const { data, error } = await supabase
      .from('AppComments')
      .select('authUserId')
      .eq('id', host_content_id)
      .single();
    if (error || !data) {
      console.error('Error fetching to user id:', error, host_content_id);
      throw error || new Error('Error fetching to user id');
    }
    return data?.authUserId;
  }

  if (type === CONTENT_TYPES.SHOULD_CHARGE) {
    return message.user_id;
  }

  if (type === CONTENT_TYPES.REPLY_COMMENT) {
    if (message.user_id) {
      return message.user_id;
    }
    const { data, error } = await supabase
      .from('AppComments')
      .select('authUserId')
      .eq('id', host_content_id)
      .single();
    if (error || !data) {
      console.error('Error fetching to user id:', error, contentId);
      throw error || new Error('Error fetching to user id');
    }
    return data?.authUserId;
  }

  if (type === CONTENT_TYPES.OC_COLLECTED) {
    const { data, error } = await supabase
      .from('CollectedCharacters')
      .select('original_owner_id')
      .eq('id', contentId)
      .single();
    if (error || !data) {
      console.error('Error fetching to user id:', error, contentId);
      throw error || new Error('Error fetching to user id');
    }
    return data.original_owner_id;
  }
};

const needAggregate = (type: MessageContentType) =>
  type === CONTENT_TYPES.LIKES ||
  type === CONTENT_TYPES.COMMENT_LIKES ||
  type === CONTENT_TYPES.FOLLOW ||
  type === CONTENT_TYPES.OC_COLLECTED;

const shouldDedupe = (type: MessageContentType) =>
  type === CONTENT_TYPES.LIKES ||
  type === CONTENT_TYPES.COMMENT_LIKES ||
  type === CONTENT_TYPES.FOLLOW;

const getLatestReadMessageId = async (userId: string) => {
  const { data, error } = await supabase
    .from('messages_read_status')
    .select('last_read_message_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('Error fetching last_read_message_id:', error, userId);
    return null;
  }
  return data?.last_read_message_id ?? null;
};

const hasDuplicateMessage = async (
  userId: string,
  hostContentId: number,
  contentType: MessageContentType,
  actorId: string,
) => {
  let query = supabase
    .from('messages')
    .select('id')
    .eq('user_id', userId)
    .eq('content_type', contentType)
    .eq('payload->>actor', actorId)
    .limit(1);
  if (contentType !== CONTENT_TYPES.FOLLOW) {
    query = query.eq('host_content_id', hostContentId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('Error checking duplicate message:', error, {
      userId,
      hostContentId,
      contentType,
      actorId,
    });
    return false;
  }
  return !!data;
};

const getUnreadAggregateId = async (
  userId: string,
  hostContentId: number,
  contentType: MessageContentType,
) => {
  const lastReadId = await getLatestReadMessageId(userId);
  let query = supabase
    .from('messages')
    .select('aggregate_id')
    .eq('user_id', userId)
    .eq('host_content_id', hostContentId)
    .eq('content_type', contentType)
    .eq('need_aggregate', true)
    .order('id', { ascending: false })
    .limit(1);
  if (lastReadId) {
    query = query.gt('id', lastReadId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('Error fetching unread aggregate_id:', error, {
      userId,
      hostContentId,
      contentType,
    });
    return null;
  }
  return data?.aggregate_id ?? null;
};

export const pushMessage = async (
  message: PushMessage,
  fromUserId?: string,
) => {
  const query = async () => {
    const toUserId = await getToUserId(message);
    console.log('pushMessage', message, toUserId);
    if (
      (fromUserId && toUserId && fromUserId === toUserId) ||
      (!toUserId && fromUserId === message.user_id) ||
      (message.reply_to_user_id && message.reply_to_user_id === toUserId)
    ) {
      console.log(
        'fromUserId and toUserId are the same',
        fromUserId,
        toUserId,
        message.user_id,
      );
      return;
    }
    message = omit(message, ['is_comment', 'reply_to_user_id']);
    const payload = fromUserId?.length
      ? {
          ...(message.payload ?? {}),
          version: 1,
          actor: fromUserId,
        }
      : (message.payload ?? undefined);
    const realMessage = toUserId
      ? {
          ...message,
          payload,
          user_id: toUserId,
          need_aggregate: needAggregate(message.content_type),
        }
      : {
          ...message,
          payload,
          need_aggregate: needAggregate(message.content_type),
        };
    if (!realMessage.user_id) {
      console.error('Error pushing message: user_id is required');
      return null;
    }
    if (
      fromUserId &&
      shouldDedupe(realMessage.content_type) &&
      (realMessage.content_type === CONTENT_TYPES.FOLLOW ||
        realMessage.host_content_id)
    ) {
      const isDuplicate = await hasDuplicateMessage(
        realMessage.user_id,
        realMessage.host_content_id,
        realMessage.content_type,
        fromUserId,
      );
      if (isDuplicate) {
        return null;
      }
    }
    if (realMessage.need_aggregate && realMessage.aggregate_id === undefined) {
      realMessage.aggregate_id = await getUnreadAggregateId(
        realMessage.user_id,
        realMessage.host_content_id,
        realMessage.content_type,
      );
      realMessage.aggregate_id = realMessage.aggregate_id ?? undefined;
    }
    console.log('pushMessage realMessage', realMessage);
    const { data, error } = await supabase
      .from('messages')
      .insert(realMessage)
      .select('id');
    if (error || !data) {
      console.error('Error pushing message:', error);
      return null;
    }
    // console.log('pushed message', data);
    return data;
  };
  return waitUntil(query());
};

export const deleteMessage = async (
  contentId: number,
  type: MessageContentType,
) => {
  // console.log('deleteMessage', contentId, type);
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('content_id', contentId)
    .eq('content_type', type);
  if (error) {
    console.error('Error deleting message:', error);
    return false;
  }
  return true;
};
