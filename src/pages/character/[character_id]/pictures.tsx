import { CharacterVariantPage } from '@/Components/character/CharacterVariantPage';
import { getCharacterVariantProps } from '@/lib/characterVariantSSR';
import { useTranslation } from 'react-i18next';

export default function Page({ initialCharData }: { initialCharData: any }) {
  const { t } = useTranslation('character');
  
  const variantConfig = {
    type: 'pictures' as const,
    mixpanelEvent: 'visit.page.character.pictures',
    seoTitleSuffix: 'Pictures',
    tabsAriaLabel: 'Character pictures tabs',
    allPostsLabel: t('allPosts', 'All Pictures'),
    myPostsLabel: t('myPosts', 'My Pictures'),
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