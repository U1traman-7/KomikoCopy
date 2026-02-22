import { CharacterVariantPage } from '@/Components/character/CharacterVariantPage';
import { getCharacterVariantProps } from '@/lib/characterVariantSSR';
import { useTranslation } from 'react-i18next';

export default function Page({ initialCharData }: { initialCharData: any }) {
  const { t } = useTranslation('character');
  
  const variantConfig = {
    type: 'pfp' as const,
    mixpanelEvent: 'visit.page.character.pfp',
    seoTitleSuffix: 'PFP',
    tabsAriaLabel: 'Character PFP tabs',
    allPostsLabel: t('allPosts', 'All PFPs'),
    myPostsLabel: t('myPosts', 'My PFPs'),
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