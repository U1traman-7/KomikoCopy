import { notFound } from 'next/navigation';
import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';

import {
  getGhostPostBySlug,
  getGhostPosts,
  transformGhostPost,
  processImageUrl,
} from '@/lib/ghost';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Balancer from 'react-wrap-balancer';
import { useTranslation } from 'react-i18next';

import cn from 'classnames';
import { buttonVariants } from '@/ui/button';
import * as Icons from '@/ui/icons';

import { absoluteUrl, formatDate, env } from '@/utils/index';
import { omit } from 'lodash-es';

interface PostPageProps {
  params: {
    slug: string[];
  };
  post?: any;
}

function generateMetadata({ params, post, t }: PostPageProps & { t: any }) {
  if (!post) {
    return {};
  }

  const url = env.NEXT_PUBLIC_APP_URL;

  const ogUrl = new URL(`${url}/api/og`);
  ogUrl.searchParams.set('heading', post.title);
  ogUrl.searchParams.set('type', t('meta.blog_post'));
  ogUrl.searchParams.set('mode', 'dark');

  // Generate keywords from tags and add some general ones
  let keywords = t('meta.keywords.base_tags', {
    returnObjects: true,
  }) as string[];
  if (post.tags && post.tags.length > 0) {
    keywords = [...keywords, ...post.tags];
  }

  // Create canonical URL
  const canonicalUrl = `${url}/blog/${post.slug}`;

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.description,
    keywords: keywords.join(', ') + 'KomikoAI',
    canonical: canonicalUrl,
    authors:
      post.authors?.map(author => ({
        name: typeof author === 'string' ? author : author.name || author,
      })) || [],
    og: {
      title: post.og_title || post.title,
      description: post.og_description || post.description,
      type: 'article',
      url: canonicalUrl,
      images: [
        {
          url: processImageUrl(post.og_image || post.image) || ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.twitter_title || post.title,
      description: post.twitter_description || post.description,
      image:
        processImageUrl(post.twitter_image || post.image) || ogUrl.toString(),
    },
  };
}

const traverseRender = (data: any, key?: string, nodes: any[] = []) => {
  if (!data) {
    return nodes;
  }

  if (typeof data === 'string' || typeof data === 'number') {
    nodes.push(<meta property={key} content={`${data}`}></meta>);
    return nodes;
  }
  const isArray = Array.isArray(data);
  if (isArray) {
    key = key?.endsWith('s') ? key.slice(0, key.length - 1) : key;
  }

  for (const k in data) {
    let newKey: undefined | string = k;
    if (isArray) {
      newKey = key;
    } else if (k === 'url' && key?.indexOf('image')) {
      newKey = key;
    } else if (key) {
      newKey = `${key}:${k}`;
    }
    traverseRender(data[k], newKey, nodes);
  }
  return nodes;
};

type MetaDataGenerate = ReturnType<typeof generateMetadata>;
const renderMeta = (metaData: MetaDataGenerate) => {
  return (
    <Head>
      <title>{metaData.title}</title>
      <meta name='description' content={metaData.description} />
      {metaData.keywords && (
        <meta name='keywords' content={metaData.keywords} />
      )}
      {metaData.canonical && <link rel='canonical' href={metaData.canonical} />}

      {/* Authors Meta Tags */}
      {metaData.authors?.map((author, index) => (
        <meta key={index} name='author' content={author.name} />
      ))}
      {traverseRender(
        omit(metaData, [
          'title',
          'description',
          'keywords',
          'canonical',
          'authors',
        ]),
      )}
    </Head>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // Get all posts from Ghost to generate paths
    const ghostPosts = await getGhostPosts(100);

    const paths = ghostPosts.map(post => ({
      params: { slug: [post.slug] },
    }));

    return {
      paths,
      fallback: 'blocking', // Support ISR for new posts
    };
  } catch (error) {
    console.error('Error fetching Ghost posts for static paths:', error);

    // 返回空的 paths，但保持 fallback: 'blocking' 来处理动态请求
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params?.slug) {
    return { notFound: true };
  }

  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  try {
    const ghostPost = await getGhostPostBySlug(slug);

    if (ghostPost) {
      const transformedPost = transformGhostPost(ghostPost);
      return {
        props: {
          params,
          post: transformedPost,
        },
        revalidate: 60,
      };
    }
  } catch (error) {
    console.error('Error fetching Ghost post:', error);
  }

  return { notFound: true };
};

export default function PostPage({ params, post }: PostPageProps) {
  const { t } = useTranslation('blog');

  if (!post) {
    notFound();
  }

  return (
    <>
      {renderMeta(generateMetadata({ params, post, t }))}
      <article className='container relative max-w-3xl py-6 lg:py-10'>
        <Link
          href='/blog'
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'absolute left-[-200px] top-14 hidden xl:inline-flex',
          )}>
          <Icons.ChevronLeft className='w-4 h-4 mr-2' />
          {t('navigation.see_all_posts')}
        </Link>
        <div>
          {post.date && (
            <time
              dateTime={post.date}
              className='block text-sm text-muted-foreground'>
              {t('article.published_on')} {formatDate(post.date)}
            </time>
          )}
          <h1 className='inline-block mt-2 text-4xl leading-tight font-heading lg:text-5xl'>
            <Balancer>{post.title}</Balancer>
          </h1>

          {/* Display reading time */}
          {post.reading_time && (
            <p className='mt-2 text-sm text-muted-foreground'>
              {post.reading_time} {t('article.min_read')}
            </p>
          )}

          {/* Display tags */}
          {post.tags && post.tags.length > 0 && (
            <div className='flex flex-wrap gap-2 mt-4'>
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className='px-2 py-1 text-xs bg-muted rounded-md text-muted-foreground'>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Featured image */}
        {post.image && (
          <div className='my-8'>
            <Image
              src={processImageUrl(post.image)}
              alt={post.title}
              width={800}
              height={400}
              className='rounded-lg object-cover w-full'
            />
          </div>
        )}

        <hr className='my-4' />
        <div className='mx-auto'>
          {/* Render Ghost post HTML content */}
          <div
            className='prose prose-lg max-w-none dark:prose-invert prose-headings:font-heading prose-pre:bg-muted'
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />
        </div>
        <hr className='mt-12' />
        <div className='flex justify-center py-6 lg:py-10'>
          <Link
            href='/blog'
            className={cn(buttonVariants({ variant: 'ghost' }))}>
            <Icons.ChevronLeft className='w-4 h-4 mr-2' />
            {t('navigation.see_all_posts')}
          </Link>
        </div>
      </article>
    </>
  );
}
