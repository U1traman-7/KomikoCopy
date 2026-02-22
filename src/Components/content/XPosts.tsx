import { useEffect } from 'react';
import Masonry from 'react-masonry-css';

interface XPost {
  id: string;
  content: string;
  author: string;
  handle: string;
  date: string;
  url: string;
}

interface XPostsProps {
  title: string;
  posts: XPost[];
  breakpointCols?: {
    default: number;
    [key: number]: number;
  };
}

export default function XPosts({
  title,
  posts,
  breakpointCols = {
    default: 4,
    2400: 3,
    1200: 2,
    640: 1,
  },
}: XPostsProps) {
  // Load Twitter SDK and add styles
  useEffect(() => {
    // Add Masonry styles
    const style = document.createElement('style');
    style.textContent = `
      .my-masonry-grid {
        display: flex;
        width: auto;
      }
      .my-masonry-grid_column {
        padding: 0 8px;
        background-clip: padding-box;
      }
      .my-masonry-grid_column > div {
        margin-bottom: 16px;
      }
      .twitter-tweet {
        margin: 0 !important;
        margin-bottom: 16px !important;
      }
    `;
    document.head.appendChild(style);

    // Load Twitter SDK
    if (typeof window !== 'undefined' && !(window as any).twttr) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).twttr && (window as any).twttr.widgets) {
          (window as any).twttr.widgets.load();
        }
      };
      document.head.appendChild(script);
    } else if ((window as any).twttr && (window as any).twttr.widgets) {
      (window as any).twttr.widgets.load();
    }

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [posts]);

  return (
    <div className='py-16 bg-card'>
      <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
        {title}
      </h2>
      <div className='px-4'>
        <Masonry
          breakpointCols={breakpointCols}
          className='flex gap-4 w-full'
          columnClassName='my-masonry-grid_column'>
          {posts.map(post => {
            // Check if content already has blockquote wrapper
            const hasBlockquote = post.content.includes('<blockquote');
            const content = hasBlockquote
              ? post.content
              : `<blockquote class="twitter-tweet">${post.content}</blockquote>`;

            return (
              <div
                key={post.id}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            );
          })}
        </Masonry>
      </div>
    </div>
  );
}
