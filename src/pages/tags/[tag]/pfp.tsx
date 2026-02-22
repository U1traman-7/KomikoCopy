import { TagVariantPage } from '@/Components/tag/TagVariantPage';
import { getTagVariantProps } from '@/lib/tagVariantSSR';
import { useTranslation } from 'react-i18next';

export default function Page({ ...initialTagData }: any) {
  const { t } = useTranslation('tags');
  
  const variantConfig = {
    type: 'pfp' as const,
    mixpanelEvent: 'visit.page.tag.pfp',
    seoTitleSuffix: 'PFP',
    tabsAriaLabel: 'Tag PFP tabs',
  };

  return (
    <TagVariantPage 
      initialTagData={initialTagData} 
      variant={variantConfig}
    />
  );
}

export async function getServerSideProps(context: any) {
  context.params = { ...context.params, variant: 'pfp' };
  return getTagVariantProps(context);
}