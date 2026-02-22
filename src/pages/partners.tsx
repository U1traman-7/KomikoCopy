import { NextUIProvider } from '@nextui-org/react';
import { Header } from '../Components/Header';
import { Sidebar } from '../Components/Sidebar';
import React, { useEffect } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import mixpanel from 'mixpanel-browser';
import { NavBar } from '@/Components/navbar';
import MarketingLayout from 'Layout/layout';
import { motion } from 'framer-motion';
import {
  FaBrain,
  FaImage,
  FaVideo,
  FaUserTie,
  FaBuilding,
} from 'react-icons/fa';

export default function Partners() {
  const { t } = useTranslation(['common', 'partners']);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.partners', {});
          console.log('tracking mixpanel');
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  // Partners data
  const partners = [
    {
      name: t('partners:technologyPartners.partners.mathosAI.name'),
      logo: 'https://www.mathgptpro.com/static/media/MathgptProFullLogo.36ee1f659c82af28d98cc81fee4f2b48.svg',
      description: t(
        'partners:technologyPartners.partners.mathosAI.description',
      ),
      url: 'https://mathgptpro.com',
    },
    {
      name: t('partners:technologyPartners.partners.collovAI.name'),
      logo: 'https://collov.ai/_nuxt/collov-light.Ci0hIHaK.png',
      description: t(
        'partners:technologyPartners.partners.collovAI.description',
      ),
      url: 'https://collov.ai',
    },
    // {
    //     name: t('partners:technologyPartners.partners.altpageAI.name'),
    //     logo: 'https://www.altpage.ai/images/alternatively-logo.png',
    //     description: t('partners:technologyPartners.partners.altpageAI.description'),
    //     url: 'https://altpage.ai'
    // },
    {
      name: t('partners:technologyPartners.partners.newoaksAI.name'),
      logo: 'https://cdn.newoaks.ai/newoaks/release/static/logo-957111ef.png',
      description: t(
        'partners:technologyPartners.partners.newoaksAI.description',
      ),
      url: 'https://www.newoaks.ai',
    },
    {
      name: t('partners:technologyPartners.partners.komiko.name'),
      logo: 'https://komiko.app/images/logo_new.webp',
      description: t('partners:technologyPartners.partners.komiko.description'),
      url: 'https://komiko.app/',
    },
    {
      name: t('partners:technologyPartners.partners.kuaAI.name'),
      logo: 'https://cdn.prod.website-files.com/64ba3c6ebf9c96852ac16cf6/659c981520fc21cf9c9d0a03_%E6%96%B0LOGO%EF%BC%88%E9%80%82%E7%94%A8%E4%BA%8E%E6%B5%85%E8%89%B2%E8%83%8C%E6%99%AF%EF%BC%89.png',
      description: t('partners:technologyPartners.partners.kuaAI.description'),
      url: 'https://www.kua.ai/',
    },
    {
      name: t('partners:technologyPartners.partners.vidAU.name'),
      logo: 'https://www.vidau.ai/wp-content/uploads/2024/07/cropped-logo-4-e1722051154746-300x100.png',
      description: t('partners:technologyPartners.partners.vidAU.description'),
      url: 'https://www.vidau.ai/',
    },
    {
      name: t('partners:technologyPartners.partners.bikaAI.name'),
      logo: 'https://bika.ai/assets/icons/logo/bika-logo-text.svg',
      description: t('partners:technologyPartners.partners.bikaAI.description'),
      url: 'https://bika.ai/',
    },
    {
      name: t('partners:technologyPartners.partners.easysiteAI.name'),
      logo: 'https://cdn.ezsite.ai/autodevweb/release/assets/logo-CGJxLHZJ.png',
      description: t(
        'partners:technologyPartners.partners.easysiteAI.description',
      ),
      url: 'https://www.easysite.ai',
    },
  ];

  // Product lines data
  const productLines = [
    {
      title: t('partners:productLines.aiComicGeneration.title'),
      description: t('partners:productLines.aiComicGeneration.description'),
      items: t('partners:productLines.aiComicGeneration.items', {
        returnObjects: true,
      }),
      icon: <FaBrain size={24} />,
      color: 'from-primary-500 to-primary-700',
    },
    {
      title: t('partners:productLines.imageProcessing.title'),
      description: t('partners:productLines.imageProcessing.description'),
      items: t('partners:productLines.imageProcessing.items', {
        returnObjects: true,
      }),
      icon: <FaImage size={24} />,
      color: 'from-primary-400 to-primary-600',
    },
    {
      title: t('partners:productLines.videoEnhancement.title'),
      description: t('partners:productLines.videoEnhancement.description'),
      items: t('partners:productLines.videoEnhancement.items', {
        returnObjects: true,
      }),
      icon: <FaVideo size={24} />,
      color: 'from-primary-600 to-primary-800',
    },
  ];

  // Solutions data
  const solutions = [
    {
      title: t('partners:solutions.professionals.title'),
      description: t('partners:solutions.professionals.description'),
      items: t('partners:solutions.professionals.items', {
        returnObjects: true,
      }),
      icon: <FaUserTie size={24} />,
      color: 'from-primary-500 to-primary-700',
    },
    {
      title: t('partners:solutions.enterprises.title'),
      description: t('partners:solutions.enterprises.description'),
      items: t('partners:solutions.enterprises.items', { returnObjects: true }),
      icon: <FaBuilding size={24} />,
      color: 'from-primary-400 to-primary-600',
    },
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <MarketingLayout>
      <Head>
        <title>{t('partners:meta.title')}</title>
        <meta property='og:type' content='website' />
        <meta property='og:title' content={t('partners:meta.title')} />
        <meta
          property='og:description'
          content={t('partners:meta.description')}
        />
        <meta property='og:image' content={'/images/social.webp'} />
        <meta property='og:url' content={'https://app.komiko.app/partners'} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={t('partners:meta.title')} />
        <meta
          name='twitter:description'
          content={t('partners:meta.description')}
        />
        <meta name='twitter:image' content={'/images/social.webp'} />
      </Head>
      <Script
        async
        src='https://www.googletagmanager.com/gtag/js?id=AW-16476793251'></Script>
      <Script
        dangerouslySetInnerHTML={{
          __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'AW-16476793251');
                        `,
        }}></Script>
      <Analytics />
      <main className='flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-white text-foreground'>
        <div className='flex'>
          <div className='w-full mt-[4rem] p-2 md:p-8 pt-24'>
            {/* Hero section */}
            <motion.div
              className='relative mb-20 text-center'
              initial='hidden'
              animate='visible'
              variants={fadeInUp}>
              <div className='absolute inset-0 -z-10 bg-[radial-gradient(45%_25%_at_50%_50%,rgba(56,189,248,0.1),rgba(255,255,255,0))]'></div>
              <h1 className='mb-8 text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r md:text-7xl from-primary-600 to-primary-800'>
                {t('partners:hero.title')}
              </h1>
              <p className='mx-auto max-w-3xl text-xl leading-relaxed text-foreground md:text-2xl'>
                {t('partners:hero.description')}
              </p>
            </motion.div>

            {/* Technology partners section */}
            <motion.div
              className='mb-24'
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeInUp}>
              <h2 className='mb-4 text-3xl font-bold text-center md:text-4xl'>
                {t('partners:technologyPartners.title')}
              </h2>
              <p className='mx-auto mb-12 max-w-3xl text-center text-muted-foreground'>
                {t('partners:technologyPartners.description')}
              </p>
              <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4'>
                {partners.map((partner, index) => (
                  <motion.a
                    key={index}
                    href={partner.url}
                    target='_blank'
                    rel='nofollow'
                    className='flex flex-col items-center p-8 bg-card rounded-2xl border border-border transition-all hover:shadow-xl group'
                    whileHover={{ y: -5, scale: 1.02 }}>
                    <div className='flex relative justify-center items-center mb-5 w-full h-20'>
                      <div className='absolute inset-0 bg-gradient-to-br rounded-xl opacity-0 transition-opacity group-hover:opacity-10 from-primary-500 to-primary-700'></div>
                      <Image
                        src={partner.logo}
                        alt={partner.name}
                        width={120}
                        height={60}
                        className='object-contain relative z-10'
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/logo_new.webp';
                        }}
                      />
                    </div>
                    <h3 className='mb-3 text-xl font-semibold transition-colors group-hover:text-primary-600'>
                      {partner.name}
                    </h3>
                    <p className='text-center text-muted-foreground'>
                      {partner.description}
                    </p>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Partnership CTA section */}
            <motion.div
              className='overflow-hidden relative mb-20 rounded-3xl'
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeInUp}>
              <div className='absolute inset-0 bg-gradient-to-br to-indigo-600 from-primary-600'></div>
              <div className="absolute inset-0 opacity-10 bg-[url('/images/grid-pattern.svg')]"></div>
              <div className='relative p-12 text-center'>
                <h2 className='mb-6 text-3xl font-bold text-white md:text-4xl'>
                  {t('partners:partnershipCTA.title')}
                </h2>
                <p className='mx-auto mb-10 max-w-3xl text-lg text-primary-100'>
                  {t('partners:partnershipCTA.description')}
                </p>
                <div className='flex flex-col gap-6 justify-center sm:flex-row'>
                  <motion.a
                    href='mailto:team@komiko.app'
                    className='inline-block px-8 py-4 font-semibold bg-white rounded-xl shadow-xl transition-colors transform text-primary-700 hover:bg-primary-50 hover:scale-105'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}>
                    {t('partners:partnershipCTA.button')}
                  </motion.a>
                </div>
              </div>
            </motion.div>

            {/* Product lines section */}
            <motion.div
              className='mb-24'
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeInUp}>
              <h2 className='mb-4 text-3xl font-bold text-center md:text-4xl'>
                {t('partners:productLines.title')}
              </h2>
              <p className='mx-auto mb-12 max-w-3xl text-center text-muted-foreground'>
                {t('partners:productLines.description')}
              </p>
              <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
                {productLines.map((product, index) => (
                  <motion.div
                    key={index}
                    className='overflow-hidden relative p-8 bg-card rounded-2xl border border-border shadow-lg transition-all hover:shadow-xl group'
                    whileHover={{ y: -5 }}>
                    <div
                      className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br rounded-bl-full opacity-10 transition-opacity group-hover:opacity-20'
                      style={{
                        background:
                          'linear-gradient(to bottom right, var(--tw-gradient-stops))',
                      }}></div>
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${product.color} flex items-center justify-center text-white text-xl font-bold mb-6`}>
                      {product.icon}
                    </div>
                    <h3 className='mb-3 text-2xl font-semibold'>
                      {product.title}
                    </h3>
                    <p className='mb-6 text-muted-foreground'>{product.description}</p>
                    <ul className='space-y-3'>
                      {product.items.map((item, idx) => (
                        <li key={idx} className='flex items-center'>
                          <span className='mr-3 w-2 h-2 bg-gradient-to-r rounded-full from-primary-500 to-primary-700'></span>
                          <span className='text-foreground'>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Solutions section */}
            <motion.div
              className='mb-24'
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeInUp}>
              <h2 className='mb-4 text-3xl font-bold text-center md:text-4xl'>
                {t('partners:solutions.title')}
              </h2>
              <p className='mx-auto mb-12 max-w-3xl text-center text-muted-foreground'>
                {t('partners:solutions.description')}
              </p>
              <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
                {solutions.map((solution, index) => (
                  <motion.div
                    key={index}
                    className='overflow-hidden relative p-8 bg-card rounded-2xl border border-border shadow-lg transition-all hover:shadow-xl group'
                    whileHover={{ y: -5 }}>
                    <div
                      className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br rounded-bl-full opacity-10 transition-opacity group-hover:opacity-20'
                      style={{
                        background:
                          'linear-gradient(to bottom right, var(--tw-gradient-stops))',
                      }}></div>
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${solution.color} flex items-center justify-center text-white text-xl font-bold mb-6`}>
                      {solution.icon}
                    </div>
                    <h3 className='mb-3 text-2xl font-semibold'>
                      {solution.title}
                    </h3>
                    <p className='mb-6 text-muted-foreground'>{solution.description}</p>
                    <ul className='grid grid-cols-2 gap-2 space-y-3'>
                      {solution.items.map((item, idx) => (
                        <li key={idx} className='flex items-center'>
                          <span className='mr-3 w-2 h-2 bg-gradient-to-r rounded-full from-primary-500 to-primary-700'></span>
                          <span className='text-foreground'>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </MarketingLayout>
  );
}
