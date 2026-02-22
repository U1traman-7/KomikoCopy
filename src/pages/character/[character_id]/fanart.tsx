import { CharacterVariantPage } from '@/Components/character/CharacterVariantPage';
import { getCharacterVariantProps } from '@/lib/characterVariantSSR';
import { useTranslation } from 'react-i18next';


export default function Page({ initialCharData }: { initialCharData: any }) {
  const { t } = useTranslation('character');
  
  const variantConfig = {
    type: 'fanart' as const,
    mixpanelEvent: 'visit.page.character.fanart',
    seoTitleSuffix: 'Fanart',
    tabsAriaLabel: 'Character fanart tabs',
    allPostsLabel: t('allPosts', 'All Fanart'),
    myPostsLabel: t('myPosts', 'My Fanart'),
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