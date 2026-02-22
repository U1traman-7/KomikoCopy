import { CharacterVariantPage } from '@/Components/character/CharacterVariantPage';
import { getCharacterVariantProps } from '@/lib/characterVariantSSR';
import { useTranslation } from 'react-i18next';

export default function Page({ initialCharData }: { initialCharData: any }) {
  const { t } = useTranslation('character');
  
  const variantConfig = {
    type: 'wallpaper' as const,
    mixpanelEvent: 'visit.page.character.wallpaper',
    seoTitleSuffix: 'Wallpaper',
    tabsAriaLabel: 'Character wallpaper tabs',
    allPostsLabel: t('allPosts', 'All Wallpapers'),
    myPostsLabel: t('myPosts', 'My Wallpapers'),
  };

  return (
    <CharacterVariantPage 
      initialCharData={initialCharData} 
      variant={variantConfig}
    />
  );
}

export async function getServerSideProps(context: any) {
  return getCharacterVariantProps(context);
}