import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type MediaType = 'image' | 'video' | 'character';

export interface MediaData {
  url: string;
  type: MediaType;
  prompt?: string;
  source?: string;
  characterId?: string;
}

// 递归解码函数，处理多次编码的URL
const fullyDecodeUrl = (url: string): string => {
  try {
    if (url.includes('supabase.co') || url.includes('hedra-api-video')) {
      return url;
    }
    
    // 检测是否包含编码的URL特征
    if (!url.includes('%')) {
      return url;
    }

    const decoded = decodeURIComponent(url);
    
    // 如果解码后仍有编码字符，继续解码
    if (decoded !== url && decoded.includes('%')) {
      return fullyDecodeUrl(decoded);
    }
    
    return decoded;
  } catch (error) {
    console.error('URL解码失败:', error, url);
    return url; 
  }
};

export const useMediaFromNavigation = (): MediaData=> {
  const router = useRouter();
  const [mediaData, setMediaData] = useState<MediaData>({} as MediaData);

  useEffect(() => {
    if (!router.isReady) return;

    const { mediaUrl, mediaType, prompt, source, characterId } = router.query;

    if (mediaUrl && mediaType) {
      const url = fullyDecodeUrl(mediaUrl as string);
      setMediaData({
        url,
        type: mediaType as MediaType,
        prompt: prompt as string,
        source: source as string,
        characterId: characterId as string,
      });
    }
  }, [router.isReady, router.query]);

  return mediaData;
}; 