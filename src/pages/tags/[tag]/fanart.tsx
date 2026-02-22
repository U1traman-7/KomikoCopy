import { TagVariantPage } from '@/Components/tag/TagVariantPage';
import { getTagVariantProps } from '@/lib/tagVariantSSR';

export default function Page({ ...initialTagData }: any) {
  const variantConfig = {
    type: 'fanart' as const,
    mixpanelEvent: 'visit.page.tag.fanart',
    seoTitleSuffix: 'Fanart',
    tabsAriaLabel: 'Tag fanart tabs',
  };

  return (
    <TagVariantPage 
      initialTagData={initialTagData} 
      variant={variantConfig}
    />
  );
}

export async function getServerSideProps(context: any) {
  // Add variant to params since it's a static file name, not a dynamic route
  context.params = { ...context.params, variant: 'fanart' };
  return getTagVariantProps(context);
}