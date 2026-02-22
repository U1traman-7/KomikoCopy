import { TagVariantPage } from '@/Components/tag/TagVariantPage';
import { getTagVariantProps } from '@/lib/tagVariantSSR';
import { useTranslation } from 'react-i18next';

export default function Page({ ...initialTagData }: any) {
  const { t } = useTranslation('tags');
  
  const variantConfig = {
    type: 'wallpaper' as const,
    mixpanelEvent: 'visit.page.tag.wallpaper',
    seoTitleSuffix: 'Wallpaper',
    tabsAriaLabel: 'Tag wallpaper tabs',
  };

  return (
    <TagVariantPage 
      initialTagData={initialTagData} 
      variant={variantConfig}
    />
  );
}

export async function getServerSideProps(context: any) {
  context.params = { ...context.params, variant: 'wallpaper' };
  return getTagVariantProps(context);
}