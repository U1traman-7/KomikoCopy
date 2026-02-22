/* eslint-disable */
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import dynamic from 'next/dynamic';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  RadioGroup,
  Radio,
} from '@nextui-org/react';
import { Header } from '../../Components/Header';
import { Sidebar } from '../../Components/Sidebar';

import mixpanel from 'mixpanel-browser';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { SEOTags } from '@/components/common/SEOTags';
import { usePostSEO } from '@/hooks/usePostSEO';
import { useReportPost } from '../../hooks/useReportPost';

import { Post, profileAtom, authAtom } from '../../state';
import { PostContent } from '../../Components/Feed/PostContent';

// Dynamically import Image component with no SSR
const DynamicImage = dynamic(
  () => import('@nextui-org/react').then(mod => mod.Image),
  { ssr: false },
);

export default function Home({ _post }: { _post: Post }) {
  const { t } = useTranslation('post');
  const router = useRouter();
  const { id } = router.query;
  const profile = useAtomValue(profileAtom);
  const isAuth = useAtomValue(authAtom);
  const postUrl = `https://komiko.app/post/${id}`;
  const {
    generatePageTitle,
    generatePageDescription,
    generatePageKeywords,
    generateStructuredData,
    getContentType,
  } = usePostSEO();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.post', {});
          console.log('tracking mixpanel');
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  //! FETCH PROFILE
  const [post, setPost] = useState<Post>(_post);
  const [bad, setBad] = useState<Boolean>(false);
  const [comment, setComment] = useState('');

  // 处理举报帖子
  const { reportPost } = useReportPost();
  const [reportConfirmPostId, setReportConfirmPostId] = useState<number | null>(
    null,
  );
  const [reportReason, setReportReason] = useState<string>('inappropriate');

  const handleReportPost = useCallback((postId: number) => {
    setReportConfirmPostId(postId);
  }, []);

  // 关闭举报 Modal 并重置选择
  const handleReportModalClose = useCallback(() => {
    setReportConfirmPostId(null);
    setReportReason('inappropriate');
  }, []);

  const confirmReportPost = useCallback(async () => {
    if (!reportConfirmPostId) return;

    const success = await reportPost(reportConfirmPostId, reportReason);
    if (success) {
      // 举报成功后返回主页
      router.push('/');
    }

    setReportConfirmPostId(null);
    setReportReason('inappropriate');
  }, [reportConfirmPostId, reportReason, reportPost, router]);

  // useEffect(() => {
  //     if (router.isReady) {
  //         const fetchPost = async () => {
  //             console.log(`/api/fetchFeed?&postonly=${id}`);
  //             const newData = await fetch(`/api/fetchFeed?&postonly=${id}`).then((res) => res.json());
  //             console.log(newData);

  //             if (newData.length === 0) {
  //                 setBad(true);
  //             } else {
  //                 setPost(newData[0]);
  //                 setList(newData);
  //             }
  //         };
  //         fetchPost();
  //     }
  // }, [router.isReady, router.query.id]);

  if (router.isFallback) {
    return <div>{t('loading')}</div>;
  }

  //! HANDLE LIKE
  const handleLike = async (id: number) => {
    if (post) {
      const updatedItem = {
        ...post,
        liked: !post.liked,
        votes: post.liked ? post.votes - 1 : post.votes + 1,
      };
      let voteValue = 0;
      if (post.liked) {
        voteValue = -1;
      } else {
        voteValue = 1;
      }

      console.log(
        JSON.stringify({
          postId: post.id,
          parentCommentId: null,
          authUserId: null,
          value: voteValue,
        }),
      );
      // Make API call to update like count on the server
      fetch(`/api/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          parentCommentId: null,
          authUserId: null,
          value: voteValue,
        }),
      });
      setPost(updatedItem);
    }
  };

  //! HANDLE FOLLOW
  const handleFollow = async (id: number) => {
    if (post) {
      const updatedItem = { ...post, followed: !post.followed };
      let followValue = 0;
      if (post.followed) {
        followValue = -1;
      } else {
        followValue = 1;
      }

      // Make API call to update follow
      fetch(`/api/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followingUserId: post.authUserId,
          value: followValue,
        }),
      });
      setPost(updatedItem);
    }
  };

  //! HANDLE COMMENT
  const handleCommentChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setComment(event.target.value);
  };

  let canCall = true;
  const handleComment = async (
    id: number,
    parentCommentId?: number,
    replyToUserId?: string,
    replyToCommentId?: number,
  ) => {
    if (!canCall) {
      return;
    }

    if (!comment.trim()) {
      return;
    }

    canCall = false;

    setTimeout(() => {
      canCall = true;
    }, 3000);

    if (post) {
      // Make API call to update like count on the server
      const response = await fetch(`/api/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          parentCommentId,
          content: comment,
          item: post,
          replyToUserId,
          replyToCommentId,
        }),
      });

      const new_comments = await response.json();
      if (!response.ok) {
        throw new Error(new_comments.error || 'Failed to post comment');
      }
      const updatedItem = {
        ...post,
        comments: new_comments,
      };
      setPost(updatedItem);
      setComment('');
      return updatedItem;
    }
  };

  // 生成SEO数据
  const pageTitle = generatePageTitle(_post);
  const pageDescription = generatePageDescription(_post);
  const pageKeywords = generatePageKeywords(_post);
  const structuredData = generateStructuredData(_post);

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
      <Head>
        <title>{pageTitle}</title>
        <meta name='title' content={pageTitle} />
        <SEOTags
          canonicalPath={`/post/${id}`}
          title={pageTitle}
          description={pageDescription}
          keywords={pageKeywords}
          ogImage={_post?.media[0]}
          structuredData={structuredData}
          locale={router.locale || 'en'}
        />
        {(!_post?.votes || _post.votes < 1) && (
          <meta name='robots' content='noindex,follow' />
        )}
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <div className='hidden md:block'>
          <Sidebar />
        </div>
        <div className='p-0 pt-0 pb-0 w-full h-full md:pl-4 md:pr-4 lg:pl-60 2xl:pl-80'>
          {post && (
            <div className='mt-[64px] h-full'>
              {/* 仅使用隐藏的标题标签用于SEO */}
              <h1 className='sr-only'>
                {getContentType(post).prefix}: {post.title}
              </h1>
              <h2 className='sr-only'>
                {t('createdBy')} {post.user_name}
              </h2>
              <h2 className='sr-only'>{t('contentDetails')}</h2>
              <h2 className='sr-only'>{t('mediaInformation')}</h2>
              <h2 className='sr-only'>{t('userInteraction')}</h2>
              <h3 className='sr-only'>{t('aboutThisArt')}</h3>
              <h4 className='sr-only'>{t('description')}</h4>
              <h4 className='sr-only'>{t('creationPrompt')}</h4>
              <h3 className='sr-only'>{t('engagement')}</h3>

              <PostContent
                item={post}
                handleFollow={handleFollow}
                comment={comment}
                handleCommentChange={handleCommentChange}
                handleComment={handleComment}
                handleLike={handleLike}
                showMore={!!isAuth}
                shouldShowDelete={post?.authUserId === profile?.id}
                isFullScreen={true}
                onReportPost={handleReportPost}
              />
            </div>
          )}
          {bad && (
            <div className='overflow-y-auto pt-0 pr-0 pb-0 pl-0 h-full md:overflow-y-none'>
              <div className='flex flex-col justify-center items-center pt-28 pr-0 pl-0 h-full sm:flex-row max-h-998 md:max-h-999'>
                <h2 className='sr-only'>{t('postNotFound')}</h2>
                <div>
                  <img
                    src={'/images/sad_cat.webp'}
                    alt={`sad cat`}
                    className='w-80'
                  />
                  <p>{t('awkwardMessage')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Post Confirmation Modal */}
      {reportConfirmPostId && (
        <Modal
          isOpen={!!reportConfirmPostId}
          onClose={handleReportModalClose}
          classNames={{
            wrapper: 'z-[110]',
            backdrop: 'z-[109]',
          }}>
          <ModalContent>
            <ModalHeader>{t('common:report.confirmTitle')}</ModalHeader>
            <ModalBody>
              <p className='text-sm text-default-600'>
                {t('common:report.selectReason')}
              </p>
              <RadioGroup
                value={reportReason}
                onValueChange={setReportReason}>
                <Radio
                  value='inappropriate'
                  description={t(
                    'common:report.reasons.inappropriate.description',
                  )}>
                  {t('common:report.reasons.inappropriate.label')}
                </Radio>
                <Radio
                  value='spam'
                  description={t(
                    'common:report.reasons.spam.description',
                  )}>
                  {t('common:report.reasons.spam.label')}
                </Radio>
                <Radio
                  value='hate_speech'
                  description={t(
                    'common:report.reasons.hate_speech.description',
                  )}>
                  {t('common:report.reasons.hate_speech.label')}
                </Radio>
                <Radio
                  value='violence'
                  description={t(
                    'common:report.reasons.violence.description',
                  )}>
                  {t('common:report.reasons.violence.label')}
                </Radio>
                <Radio
                  value='copyright'
                  description={t(
                    'common:report.reasons.copyright.description',
                  )}>
                  {t('common:report.reasons.copyright.label')}
                </Radio>
                <Radio
                  value='other'
                  description={t(
                    'common:report.reasons.other.description',
                  )}>
                  {t('common:report.reasons.other.label')}
                </Radio>
              </RadioGroup>
              <p className='text-xs text-default-400 mt-2'>
                {t('common:report.warning')}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant='light'
                onPress={handleReportModalClose}>
                {t('common:report.buttonCancel')}
              </Button>
              <Button color='danger' onPress={confirmReportPost}>
                {t('common:report.buttonReport')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </main>
  );
}

export async function getServerSideProps(context: {
  params: { id: any };
  req: any;
}) {
  const { id } = context.params;
  const { req } = context;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/fetchFeed?&postonly=${id}`,
      {
        headers: {
          Cookie: req.headers.cookie || '',
        },
      },
    );
    const data = await response.json();

    if (data.length > 0) {
      return {
        props: { _post: data[0] },
      };
    } else {
      return { props: { _post: null } };
    }
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return { props: { _post: null } };
  }
}
