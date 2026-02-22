import { useEffect } from 'react';

interface TwitterEmbedProps {
  tweetId: string;
}

export default function TwitterEmbed({ tweetId }: TwitterEmbedProps) {
  useEffect(() => {
    // 动态加载Twitter脚本
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // 清理脚本
      document.body.removeChild(script);
    };
  }, []);

  return (
    <blockquote className='twitter-tweet'>
      <a href={`https://twitter.com/KomikoAI/status/${tweetId}`}></a>
    </blockquote>
  );
}
