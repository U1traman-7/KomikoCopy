import * as React from 'react';
import Image from 'next/image';

import cn from 'classnames';
import Link from 'next/link';
import {
  aiTools,
  ToolItem,
  getFooterToolsByCategory,
} from '../constants/index';
import { useTranslation } from 'react-i18next';
import { languages } from './LanguageToggle';

export function SiteFooter({ className }: { className?: string }) {
  const { t } = useTranslation('common');

  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn(className)}>
      <div className='container mx-auto px-4 md:px-8 py-10'>
        {/* 主要内容区域 */}
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-6 sm:gap-8 border-b border-border pb-6 md:pb-8'>
          {/* 第一列：公司信息 */}
          <div className='col-span-2 sm:col-span-1 flex flex-col gap-3 mb-6 sm:mb-0 md:border-none border-b border-border pb-6 sm:pb-0'>
            <div className='flex items-center'>
              <Link href='/'>
                <Image
                  src='/images/logo_new.webp'
                  width={72}
                  height={36}
                  alt={t('footer.logo_alt')}
                  className='dark:brightness-105'
                />
              </Link>
            </div>
            <p className='text-sm text-foreground/80'>
              {t('copyright', { currentYear })}
            </p>
            <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/80'>
              <Link href='/terms' className='hover:text-foreground/100'>
                {t('footer.terms')}
              </Link>
              <Link href='/privacy' className='hover:text-foreground/100'>
                {t('footer.privacy')}
              </Link>
            </div>
            <div className='flex space-x-4'>
              <a
                href='https://x.com/KomikoAI'
                target='_blank'
                rel='noopener noreferrer'
                aria-label={t('footer.twitter_aria')}>
                <Image
                  src='/images/icons/twitter-icon.svg'
                  alt={t('footer.twitter_alt')}
                  width={24}
                  height={24}
                  className='hover:opacity-75 dark:invert'
                />
              </a>
              <a
                href='https://www.tiktok.com/@komia.h74'
                target='_blank'
                rel='noopener noreferrer'
                aria-label={t('footer.tiktok_aria')}>
                <Image
                  src='/images/icons/tiktok-icon.svg'
                  alt={t('footer.tiktok_alt')}
                  width={24}
                  height={24}
                  className='hover:opacity-75 dark:invert'
                />
              </a>
            </div>
          </div>

          {/* 第二列：产品 */}
          <div>
            <h3 className='font-semibold mb-4'>{t('footer.ai_models')}</h3>
            <ul className='space-y-2'>
              <li className='flex gap-2 items-center'>
                <Link
                  href='/ai-anime-generator'
                  className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                  Gemini
                </Link>
              </li>
              <li className='flex gap-2 items-center'>
                <Link
                  href='/ai-anime-generator'
                  className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                  NoobAI XL
                </Link>
              </li>
              <li className='flex gap-2 items-center'>
                <Link
                  href='/ai-anime-generator'
                  className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                  GPT-4o
                </Link>
              </li>

              <li className='flex gap-2 items-center'>
                <Link
                  href='/image-animation-generator/kling-image-to-video'
                  className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                  Kling 2.1
                </Link>
              </li>
              <li className='flex gap-2 items-center'>
                <Link
                  href='/image-animation-generator/kling-image-to-video'
                  className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                  Kling 1.6
                </Link>
              </li>
              <li className='flex gap-2 items-center'>
                <Link
                  href='/image-animation-generator/hailuo-ai-video-generator'
                  className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                  Hailuo AI
                </Link>
              </li>
              <li className='flex gap-2 items-center'>
                <Link
                  href='/image-animation-generator/veo2-video-generator'
                  className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                  Google Veo 2
                </Link>
              </li>
              <li className='flex gap-2 items-center'>
                <Link
                  href='/image-animation-generator/wan-ai-video-generator'
                  className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                  Wan 2.1
                </Link>
              </li>
              <li className='flex gap-2 items-center'>
                <Link
                  href='/image-animation-generator/luma-video-generator'
                  className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                  Luma Ray
                </Link>
              </li>
              <li className='flex gap-2 items-center'>
                <Link
                  href='/image-animation-generator/pixverse-ai-video-generator'
                  className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                  PixVerse AI
                </Link>
              </li>
              {(Array.isArray(aiTools)
                ? aiTools.flatMap(toolSet => toolSet.entries)
                : []
              )
                .filter(tool => tool.model_name)
                .map((tool: ToolItem) => (
                  <li key={tool.id} className='flex gap-2 items-center'>
                    <Link
                      href={tool.path}
                      className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                      {tool.model_name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          {/* illustration tools */}
          <div>
            <h3 className='font-semibold mb-4'>
              {t('footer.illustration_tools')}
            </h3>
            <ul className='space-y-2'>
              {getFooterToolsByCategory('illustration').map(
                (tool: ToolItem, index) => (
                  <li key={index} className='flex gap-2 items-center'>
                    <Link
                      href={tool.path}
                      title={`${t(tool.title_key)} - ${tool.content_key ? t(tool.content_key) : ''} | KomikoAI`}
                      rel='dofollow'
                      className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                      {t(tool.title_key)}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* animation tools */}
          <div>
            <h3 className='font-semibold mb-4'>
              {t('footer.animation_tools')}
            </h3>
            <ul className='space-y-2'>
              {getFooterToolsByCategory('animation').map(
                (tool: ToolItem, index) => (
                  <li key={index} className='flex gap-2 items-center'>
                    <Link
                      href={tool.path}
                      title={`${t(tool.title_key)} - ${tool.content_key ? t(tool.content_key) : ''} | KomikoAI`}
                      rel='dofollow'
                      className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                      {t(tool.title_key)}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* comic tools */}
          <div>
            <h3 className='font-semibold mb-4'>{t('footer.comic_tools')}</h3>
            <ul className='space-y-2'>
              {getFooterToolsByCategory('comic').map(
                (tool: ToolItem, index) => (
                  <li key={index} className='flex gap-2 items-center'>
                    <Link
                      href={tool.path}
                      title={`${t(tool.title_key)} - ${tool.content_key ? t(tool.content_key) : ''} | KomikoAI`}
                      rel='dofollow'
                      className='text-sm text-foreground/80 hover:text-foreground/100 pb-1'>
                      {t(tool.title_key)}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* 第三列：资源 */}
          <div>
            <h3 className='font-semibold mb-4'>{t('footer.learn_more')}</h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/pricing'
                  className='text-sm text-foreground/80 hover:text-foreground/100'>
                  {t('footer.pricing')}
                </Link>
              </li>
              <li>
                <Link
                  href='/blog'
                  className='text-sm text-foreground/80 hover:text-foreground/100'>
                  {t('footer.blog')}
                </Link>
              </li>
              <li>
                <Link
                  href='/tools'
                  className='text-sm text-foreground/80 hover:text-foreground/100'>
                  {t('footer.all_tools')}
                </Link>
              </li>
              <a
                href='https://theresanaiforthat.com/ai/komiko/?ref=featured&v=2175637'
                target='_blank'
                rel='nofollow noreferrer'>
                <img
                  width='150'
                  src='https://media.theresanaiforthat.com/featured-on-taaft.png?width=600'
                  alt="Featured on There's an AI for That"
                />
              </a>
            </ul>
          </div>

          <div>
            <h3 className='font-semibold mb-4'>{t('footer.languages')}</h3>
            <ul className='space-y-2'>
              {languages.map(language => (
                <li key={language.code}>
                  <a
                    href={`/${language.code}`}
                    className='text-sm text-foreground/80 hover:text-foreground/100'>
                    {language.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 页脚描述 */}
        <div className='mt-6 text-sm text-foreground/70'>
          {t('footer.description')}
          <br />
          {t('footer.claim_site')}
        </div>
      </div>
    </footer>
  );
}
