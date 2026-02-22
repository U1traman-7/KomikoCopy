/* eslint-disable */
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Button } from '@nextui-org/react';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { aiTools, ToolItem } from '../../constants';
import { useTranslation } from 'react-i18next';
import { ToolCard } from 'pages';
import { FaCheck } from 'react-icons/fa';
import { InteractiveMenu } from './InteractiveMenu';
import Marquee from '../common/Marquee';

// Import separated components
import { partners, scrollAnimation } from './constants';
import { FAQSection } from './FAQSection';
import { TestimonialsSection } from './TestimonialsSection';
import { ProfessionalSection } from './ProfessionalSection';

export const Landing = ({ user }) => {
  const { theme } = useTheme();
  const { t } = useTranslation('landing');
  const { t: tCommon } = useTranslation('common');

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_mixpanel_api_key) {
      console.error('Mixpanel API key is missing');
      return;
    }

    mixpanel.init(process.env.NEXT_PUBLIC_mixpanel_api_key, {
      debug: true,
      track_pageview: true,
      persistence: 'localStorage',
      ignore_dnt: true,
    });

    // Track the page visit
    mixpanel.track('visit.landing.page');
  }, []); // Empty dependency array ensures this runs once when the component mounts

  return (
    <>
      <section
        id='home'
        className={`relative z-10 overflow-hidden bg-background pb-0 md:pb-16 pt-12 md:pt-24`}>
        {/* Product Hunt Badge */}
        <div className='fixed bottom-6 left-6 z-50'>
          <a
            href='https://www.producthunt.com/products/framepack-ai-video-generator?embed=true&utm_source=badge-top-post-badge&utm_medium=badge&utm_source=badge-komikoai&#0045;video&#0045;to&#0045;video' // TODO: change to this one
            // href="https://www.producthunt.com/products/framepack-ai-video-generator?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-komiko&#0045;2"
            target='_blank'
            rel='noopener noreferrer nofollow'>
            <img
              src='/api/proxyProducthunt'
              alt='KomikoAI&#0032;Video&#0032;to&#0032;Video - Make&#0032;your&#0032;videos&#0032;pop&#0032;with&#0032;anime&#0044;&#0032;arcade&#0044;&#0032;fire&#0032;styles&#0032;&#0038;&#0032;more&#0033; | Product Hunt'
              style={{ width: '375px', height: '72px' }}
              width='375'
              height='72'
            />
          </a>
        </div>

        <div className={`px-6 md:px-8 w-full`}>
          <div className='flex flex-wrap -mx-4'>
            <div className='w-full'>
              {/*
                //! LANDING HEADER
                */}
              <div className='mx-auto max-w-[100rem] item-center relative '>
                <div className='absolute top-[-50px] inset-0 -z-10 max-h-[10rem]'>
                  <div className='absolute inset-0 bg-[rgb(206,174,212)] bg-gradient-to-r [background:linear-gradient(83deg,#ceaed474_15%,#abd4e693_33%,#73edc097_79%,#8c91e86b_100%)] blur-[100px]'></div>
                </div>

                <div className='max-w-[60rem] mx-auto text-center'>
                  <h1
                    className={`text-${theme === 'dark' ? 'white' : 'black'} max-w-[60rem] font-sans mb-5 text-2xl font-bold !leading-[1.2] md:text-4xl lg:text-5xl xl:text-6xl`}>
                    {t('hero.title')}
                  </h1>
                  <h2
                    className={`text-${theme === 'dark' ? 'white' : 'black'} font-strong mb-6 md:mb-8 text-sm !leading-relaxed text-default-600 dark:text-body-color-dark md:text-lg lg:text-xl text-stroke-1`}>
                    {t('hero.subtitle')}
                  </h2>

                  {/* Stats */}
                  <div className='flex flex-wrap justify-center gap-4 md:gap-8 mb-6 md:mb-8 text-xs md:text-sm text-muted-foreground'>
                    <div className='flex items-center gap-1.5 md:gap-2'>
                      <FaCheck className='text-primary text-xs md:text-sm' />
                      <span>{t('stats.active_creators')}</span>
                    </div>
                    <div className='flex items-center gap-1.5 md:gap-2'>
                      <FaCheck className='text-primary text-xs md:text-sm' />
                      <span>{t('stats.creations_made')}</span>
                    </div>
                    <div className='flex items-center gap-1.5 md:gap-2'>
                      <FaCheck className='text-primary text-xs md:text-sm' />
                      <span>{t('stats.trusted_professionals')}</span>
                    </div>
                  </div>
                </div>
                <div className='flex flex-col justify-center items-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0'>
                  {user ? (
                    <Link
                      href='/'
                      className='rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground duration-300 ease-in-out hover:bg-primary/80 md:px-8 md:py-[0.6rem] md:text-base'
                      onClick={() =>
                        mixpanel.track('visit.landing.getStarted')
                      }>
                      {t('hero.create_now_button')}
                    </Link>
                  ) : (
                    <Link
                      href='/'
                      className='rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground duration-300 ease-in-out hover:bg-primary/80 md:px-8 md:py-[0.6rem] md:text-base'>
                      {t('hero.create_now_button')}
                    </Link>
                  )}
                  <Link
                    href='https://discord.gg/KJNSBVVkvN'
                    className={`inline-block rounded-full px-6 py-2.5 text-sm font-semibold duration-300 ease-in-out md:px-8 md:py-[0.6rem] md:text-base bg-muted text-foreground hover:bg-muted/80`}>
                    {t('hero.join_discord_button')}
                  </Link>
                </div>
              </div>

              {/* Interactive Menu */}
              <InteractiveMenu className='mb-8 md:mb-12' />

              {/* Our Partners - AI Models & Investors */}
              <div className='py-6 md:py-8 bg-muted/50 mb-8'>
                <div className='container mx-auto max-w-[100rem] px-4 md:px-6'>
                  <h2 className='text-center font-sans mb-4 text-xl md:text-2xl lg:text-3xl font-bold text-heading'>
                    {t('partners.title')}
                  </h2>
                  <p className='text-center text-sm md:text-base lg:text-lg text-muted-foreground mb-4 md:mb-8'>
                    {t('partners.subtitle')}
                  </p>

                  {/* Partners Carousel */}
                  <Marquee
                    pauseOnHover={true}
                    className='py-2 [--duration:45s] [--gap:1rem]'>
                    {partners.map((partner, index) => (
                      <div
                        key={`${partner.name}-${index}`}
                        className='flex-shrink-0 mx-2'>
                        {partner.type === 'investor' ? (
                          <a
                            href={partner.link}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center space-x-2 md:space-x-3 bg-card rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-all hover:scale-105'>
                            <img
                              src={partner.logo}
                              alt={partner.name}
                              className='w-5 h-5 md:w-6 md:h-6 object-contain dark:brightness-150'
                            />
                            <span className='text-xs md:text-sm font-medium text-foreground whitespace-nowrap'>
                              {partner.name}
                            </span>
                          </a>
                        ) : (
                          <div className='flex items-center space-x-2 md:space-x-3 bg-card rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm hover:shadow-md transition-shadow'>
                            {partner.name && partner.Component && (
                              <img
                                src={partner.Component}
                                alt={partner.name}
                                className='w-5 h-5 md:w-6 md:h-6 object-contain'
                                onError={e => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                            {!partner.name && partner.Component && (
                              <img
                                src={partner.Component}
                                alt={partner.name}
                                className='h-5 md:h-6 object-contain'
                                onError={e => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                            {partner.name && (
                              <span className='text-xs md:text-sm font-medium text-foreground whitespace-nowrap'>
                                {partner.name}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </Marquee>
                </div>
              </div>

              <div className='py-0 md:py-8 md:mt-6'>
                {/* Section 2 */}
                <div className='container flex flex-col gap-6 justify-between items-center px-8 mx-auto mt-0 md:flex-row md:px-16 md:mt-20'>
                  {/* Desktop Image - Hidden on mobile */}
                  <div className='hidden md:block md:order-2 md:w-1/2 px-4'>
                    <Link
                      href='/oc-maker'
                      title={t('section2.create_character_title')}>
                      <img
                        src='/images/character_design.webp'
                        alt={t('section2.image_alt')}
                        className='rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl'
                        loading='lazy'
                      />
                    </Link>
                  </div>

                  {/* Text Content */}
                  <div className='w-full md:order-1 md:w-1/2 md:mt-0 md:pr-8'>
                    <p className='my-4 md:my-6 text-sm md:text-base font-semibold uppercase text-primary-700 tracking-wider'>
                      {t('section2.tagline')}
                    </p>
                    <h3 className='text-xl md:text-2xl lg:text-3xl font-bold text-heading'>
                      {t('section2.title')}
                    </h3>
                    <p className='my-4 md:pb-8 md:my-6 text-sm md:text-base lg:text-lg text-muted-foreground'>
                      {t('section2.description.part1')} <br />
                      {t('section2.description.part2')}{' '}
                      <Link
                        className='text-primary'
                        href='/oc-maker'
                        title={t('section2.create_character_title')}>
                        {t('section2.create_character_link')}
                      </Link>{' '}
                      {t('section2.description.part3')}
                    </p>

                    {/* Mobile Image - Only shown on mobile, above button */}
                    <div className='block md:hidden mb-6'>
                      <Link
                        href='/oc-maker'
                        title={t('section2.create_character_title')}>
                        <img
                          src='/images/character_design.webp'
                          alt={t('section2.image_alt')}
                          className='rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl w-full'
                          loading='lazy'
                        />
                      </Link>
                    </div>

                    <Link href={'/'} title={t('section2.create_now_title')}>
                      <Button
                        className='px-6 py-3 text-sm font-semibold md:px-8 md:py-4 md:text-base'
                        color='primary'
                        radius='full'
                        size='md'>
                        {t('section2.create_now_button')}
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Section 3 */}
                <div className='container flex flex-col gap-6 justify-between items-center px-8 mx-auto mt-16 md:flex-row md:px-16 md:mt-20'>
                  {/* Desktop Image - Hidden on mobile */}
                  <div className='hidden md:block md:order-1 md:w-1/2'>
                    <Link
                      href='/create'
                      title={t('section3.create_comics_title')}>
                      <img
                        src='/images/screenshots/canvas.webp'
                        alt={t('section3.image_alt')}
                        className='rounded-xl border-border transition-all duration-300 border-1 hover:border-0 hover:scale-105 hover:shadow-xl'
                        loading='lazy'
                      />
                    </Link>
                  </div>

                  {/* Text Content */}
                  <div className='w-full md:order-2 md:w-1/2 md:mt-0 md:pl-8'>
                    <p className='my-4 md:my-6 text-sm md:text-base font-semibold uppercase text-primary-700 tracking-wider'>
                      {t('section3.tagline')}
                    </p>
                    <h3 className='text-xl md:text-2xl lg:text-3xl font-bold text-heading'>
                      {t('section3.title')}
                    </h3>
                    <p className='my-4 md:pb-8 md:my-6 text-sm md:text-base lg:text-lg text-muted-foreground'>
                      {t('section3.description.part1')} <br />
                      {t('section3.description.part2')}
                    </p>

                    {/* Mobile Image - Only shown on mobile, above button */}
                    <div className='block md:hidden mb-6'>
                      <Link
                        href='/create'
                        title={t('section3.create_comics_title')}>
                        <img
                          src='/images/screenshots/canvas.webp'
                          alt={t('section3.image_alt')}
                          className='rounded-xl border-border transition-all duration-300 border-1 hover:border-0 hover:scale-105 hover:shadow-xl dark:shadow-black/30 w-full'
                          loading='lazy'
                        />
                      </Link>
                    </div>

                    <Link href={'/'} title={t('section3.create_now_title')}>
                      <Button
                        className='px-6 py-3 text-sm font-semibold md:px-8 md:py-4 md:text-base'
                        color='primary'
                        radius='full'
                        size='md'>
                        {t('section3.create_now_button')}
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Section 4 - Animation Generator */}
                <div className='container flex flex-col gap-6 justify-between items-center px-8 mx-auto mt-16 md:flex-row md:px-16 md:mt-20'>
                  {/* Text Content */}
                  <div className='w-full md:order-1 md:w-1/2 md:mt-0 md:pr-8'>
                    <p className='my-4 md:my-6 text-sm md:text-base font-semibold uppercase text-primary-700 tracking-wider'>
                      {t('section5.tagline')}
                    </p>
                    <h3 className='text-xl md:text-2xl lg:text-3xl font-bold text-heading'>
                      {t('section5.title')}
                    </h3>
                    <p className='my-4 md:pb-8 md:my-6 text-sm md:text-base lg:text-lg text-muted-foreground'>
                      {t('section5.description.part1')}
                      <br />
                      {t('section5.description.part2')}
                    </p>

                    {/* Mobile Image - Only shown on mobile, above button */}
                    <div className='block md:hidden mb-6'>
                      <Link
                        href='/image-animation-generator'
                        title={t('section5.animation_title')}>
                        <img
                          src='/images/inbetween.webp'
                          alt={t('section5.image_alt')}
                          className='rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl w-full'
                          loading='lazy'
                        />
                      </Link>
                    </div>

                    <Link href={'/'} title={t('section5.create_now_title')}>
                      <Button
                        className='px-6 py-3 text-sm font-semibold md:px-8 md:py-4 md:text-base'
                        color='primary'
                        radius='full'
                        size='md'>
                        {t('section5.create_now_button')}
                      </Button>
                    </Link>
                  </div>
                  {/* Desktop Image - Hidden on mobile */}
                  <div className='hidden md:block md:order-2 md:w-1/2 px-8'>
                    <Link
                      href='/image-animation-generator'
                      title={t('section5.animation_title')}>
                      <img
                        src='/images/inbetween.webp'
                        alt={t('section5.image_alt')}
                        className='rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl'
                        loading='lazy'
                      />
                    </Link>
                  </div>
                </div>
              </div>

              <div className='py-16'>
                {/* Professional Section */}
                <ProfessionalSection theme={theme} />

                {/* Tools Section */}
                <div
                  className='px-4 md:px-12 pb-10 md:pb-20 mt-6 bg-muted/50'
                  id='features'>
                  <div className='pt-12 container mx-auto max-w-[100rem] item-center md:pt-16'>
                    <h2
                      className={`text-${theme === 'dark' ? 'white' : 'black'}  text-center font-sans mb-5 text-2xl font-bold leading-tight sm:text-3xl sm:leading-tight md:text-4xl md:leading-tight`}>
                      {t('features.title')}
                    </h2>
                    <p
                      className={`text-${theme === 'dark' ? 'white' : 'black'} text-center font-strong mb-8 md:mb-12 text-sm !leading-relaxed text-default-600 dark:text-body-color-dark md:text-lg lg:text-xl text-stroke-1`}>
                      {t('features.subtitle')}
                    </p>
                  </div>
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center md:px-5'>
                    {aiTools
                      .flatMap(toolSet => toolSet.entries)
                      .filter(tool => !tool.derivative)
                      .map((tool: ToolItem) => (
                        <ToolCard
                          key={`ai-tool-${tool.id + tool.path}`}
                          tool={tool}
                        />
                      ))}
                  </div>
                </div>

                <TestimonialsSection theme={theme} />

                <FAQSection />

                <div
                  className='mx-auto max-w-[90rem] item-center pt-12 pb-12 px-6 md:px-8 rounded-lg bg-muted'>
                  <div className='mx-auto text-center'>
                    <h2
                      className='text-foreground text-center font-sans mb-5 text-2xl font-bold leading-tight sm:leading-tight md:text-4xl lg:text-5xl xl:text-6xl md:leading-tight'>
                      {t('cta.title')}
                    </h2>
                    <p
                      className='text-muted-foreground font-strong mb-12 text-sm !leading-relaxed md:text-lg lg:text-xl'>
                      {t('cta.subtitle')}
                    </p>
                  </div>
                  <div className='flex flex-col justify-center items-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0'>
                    {user ? (
                      <Link
                        href='https://komiko.app'
                        className='rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground duration-300 ease-in-out hover:bg-primary/80 hover:shadow-lg hover:shadow-primary/30 shadow-md shadow-primary/20 md:px-8 md:py-[0.6rem] md:text-base'
                        onClick={() =>
                          mixpanel.track('visit.landing.getStarted')
                        }>
                        {t('cta.create_now_button')}
                      </Link>
                    ) : (
                      <Link
                        href='/'
                        className='rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground duration-300 ease-in-out hover:bg-primary/80 hover:shadow-lg hover:shadow-primary/30 shadow-md shadow-primary/20 md:px-8 md:py-[0.6rem] md:text-base'>
                        {t('cta.create_now_button')}
                      </Link>
                    )}
                    <Link
                      href='https://discord.gg/KJNSBVVkvN'
                      className={`inline-block rounded-full px-6 py-2.5 text-sm font-semibold duration-300 ease-in-out md:px-8 md:py-[0.6rem] md:text-base shadow-md hover:shadow-lg bg-muted text-foreground hover:bg-muted/80 shadow-foreground/10 hover:shadow-foreground/20`}>
                      {t('cta.join_discord_button')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
