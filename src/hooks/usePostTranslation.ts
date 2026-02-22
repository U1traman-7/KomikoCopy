import { useRouter } from 'next/router';
import { Post } from '../state';

/**
 * Hook to get translated title and content based on current locale
 */
export const usePostTranslation = (item: Post) => {
  const router = useRouter();
  const locale = router.locale || 'en';

  const displayTitle =
    (item as any)?.translation?.[locale]?.title || item.title;
  const displayContent =
    (item as any)?.translation?.[locale]?.content || item.content;

  return {
    displayTitle,
    displayContent,
    locale,
  };
};

