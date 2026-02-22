import { compareDesc } from 'date-fns';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import { BlogPosts } from '@/components/blog/blog-post';
import { getGhostPosts, transformGhostPost } from '@/lib/ghost';
import MarketingLayout from 'Layout/MarketingLayout';
import Head from 'next/head';
import { SEOTags } from '@/components/common/SEOTags';

export const metadata = {
  title: 'Blog',
};

interface BlogPageProps {
  posts: any[];
}

export default function BlogPage({ posts }: BlogPageProps) {
  const { t } = useTranslation('blog');
  const router = useRouter();

  return (
    <MarketingLayout>
      <main>
        <Head>
          <SEOTags
            canonicalPath='/blog'
            title={t('meta.title')}
            description={t('meta.description')}
            keywords={t('meta.keywords.general') + 'KomikoAI'}
            ogImage='/images/social.webp'
            locale={router.locale || 'en'}
          />
        </Head>
        <BlogPosts posts={posts} />
      </main>
    </MarketingLayout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    // Get all posts from Ghost - 在服务器端安全调用
    const ghostPosts = await getGhostPosts(50);
    const transformedGhostPosts = ghostPosts.map(transformGhostPost);

    // Sort by date
    const allPosts = transformedGhostPosts.sort((a, b) => {
      return compareDesc(new Date(a.date), new Date(b.date));
    });

    return {
      props: {
        posts: allPosts,
      },
      revalidate: 60, // ISR: 60秒重新生成
    };
  } catch (error) {
    console.error('Error fetching Ghost posts:', error);

    return {
      props: {
        posts: [],
      },
      revalidate: 60,
    };
  }
};
