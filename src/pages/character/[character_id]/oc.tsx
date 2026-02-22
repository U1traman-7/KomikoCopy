import { CharacterVariantPage } from '@/Components/character/CharacterVariantPage';
import { getCharacterVariantProps } from '@/lib/characterVariantSSR';
import { useTranslation } from 'react-i18next';

export default function Page({ initialCharData }: { initialCharData: any }) {
  const { t } = useTranslation('character');
  
  const variantConfig = {
    type: 'oc' as const,
    mixpanelEvent: 'visit.page.character.oc',
    seoTitleSuffix: 'OC',
    tabsAriaLabel: 'Character OC tabs',
    allPostsLabel: t('allPosts', 'All OCs'),
    myPostsLabel: t('myPosts', 'My OCs'),
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