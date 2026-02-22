import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { useTranslation } from "react-i18next";

import { formatDate } from "@/utils/index";
import { processImageUrl } from "@/lib/ghost";

interface Post {
  _id: string;
  title: string;
  description?: string;
  date: string;
  published: boolean;
  image: string;
  authors: string[];
  slug: string;
  isGhostPost?: boolean;
  reading_time?: number;
  tags?: string[];
}

interface BlogPostsProps {
  posts: Post[];
}

export function BlogPosts({ posts }: BlogPostsProps) {
  const { t } = useTranslation('blog');

  return (
    <div className="container py-6 space-y-10 md:py-10">
      <section>
        <h2 className="mb-4 text-3xl font-heading">{t('sections.latest_post')}</h2>
        <article className="relative grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            {posts[0]?.image && (
              <Image
                alt={posts[0].title}
                className="object-cover object-center w-full border rounded-lg md:h-64 lg:h-72"
                height={452}
                src={posts[0].isGhostPost ? processImageUrl(posts[0].image) : posts[0].image}
                width={804}
              />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="mb-2 text-2xl font-heading md:text-4xl">
              <Balancer>{posts[0]?.title}</Balancer>
            </h3>
            {posts[0]?.description && (
              <p className="text-muted-foreground md:text-lg">
                <Balancer>{posts[0]?.description}</Balancer>
              </p>
            )}

            {/* 阅读时间和标签 */}
            <div className="flex items-center gap-4 mt-4">
              {posts[0]?.reading_time && (
                <span className="text-sm text-muted-foreground">
                  {posts[0].reading_time} {t('article.min_read')}
                </span>
              )}
              {posts[0]?.tags && posts[0].tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {posts[0].tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="px-1 py-0.5 text-xs bg-muted rounded text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Link href={posts[0]?.slug ?? "/#"} className="absolute inset-0">
              <span className="sr-only">{t('article.view_article')}</span>
            </Link>
          </div>
        </article>
      </section>

      <section>
        <h2 className="mb-4 text-3xl font-heading">{t('sections.all_posts')}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(1).map((post) => (
            <article
              key={post._id}
              className="relative flex flex-col space-y-2 group"
            >
              {post.image && (
                <Image
                  alt={post.title}
                  src={post.isGhostPost ? processImageUrl(post.image) : post.image}
                  width={804}
                  height={452}
                  className="transition-colors border rounded-md bg-muted"
                />
              )}
              <h2 className="text-2xl font-heading line-clamp-1">
                {post.title}
              </h2>
              {post.description && (
                <p className="line-clamp-2 text-muted-foreground">
                  {post.description}
                </p>
              )}

              {/* 日期、阅读时间和标签 */}
              <div className="space-y-2">
                {post.date && (
                  <p className="text-sm text-muted-foreground">
                    {formatDate(post.date)}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  {post.reading_time && (
                    <span className="text-xs text-muted-foreground">
                      {post.reading_time} {t('article.min_read')}
                    </span>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-1 py-0.5 text-xs bg-muted rounded text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Link href={post.slug} className="absolute inset-0">
                <span className="sr-only">{t('article.view_article')}</span>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
