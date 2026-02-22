import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { Button, Card, Divider } from '@nextui-org/react';
import { SiteFooter } from '@/Components/site-footer';
import { NavBar } from '@/components/navbar';
import { useUser } from 'hooks/useUser';
import dynamic from 'next/dynamic';

// 动态导入Twitter嵌入组件
const TwitterEmbed = dynamic(() => import('@/components/twitter-embed'), {
  ssr: false,
});

// 动画配置
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

// 放大效果
const scaleUp = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// 评审组件
const Judge = ({ name, title, imageSrc }) => (
  <motion.div variants={fadeIn} className='flex flex-col items-center p-4'>
    <div className='overflow-hidden relative mb-4 w-32 h-32 rounded-full'>
      <Image
        src={imageSrc || '/images/avatar-placeholder.png'}
        alt={name}
        fill
        className='object-cover'
      />
    </div>
    <h3 className='mb-1 text-xl font-bold'>{name}</h3>
    <p className='text-sm text-center opacity-80'>{title}</p>
  </motion.div>
);

// 赞助商组件
const Sponsor = ({ name, logoSrc, description, url }) => (
  <motion.div variants={fadeIn} className='flex flex-col items-center p-4'>
    <a className='relative mb-4 h-24' href={url} target='_blank'>
      <Image
        src={logoSrc || '/images/logo-placeholder.png'}
        alt={name}
        height={36} // Corresponds to h-12
        width={0} // Set width to 0 initially
        style={{ width: 'auto', height: '100%' }} // Let width adjust based on aspect ratio and 100% height
        className='object-contain' // Keep object-contain
        unoptimized
      />
    </a>
    <h3 className='mb-1 text-lg font-bold'>{name}</h3>
    <p className='text-sm text-center opacity-80'>{description}</p>
  </motion.div>
);

// 时间线条目组件
const TimelineItem = ({ date, title }) => {
  const { theme } = useTheme(); // Get theme for dynamic colors
  const isDark = theme === 'dark';

  return (
    <motion.div
      variants={fadeIn}
      className='flex relative items-start pl-10 md:pl-0' // Adjust padding for mobile alignment
    >
      {/* 圆点 - Adjusted position and style */}
      <div
        className={`absolute left-0 md:left-1/2 top-1 w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full transform md:-translate-x-1/2 border-2 border-background`}></div>

      {/* 左侧日期 (Hidden on mobile, shown md up) */}
      <div className='hidden pr-8 w-1/2 text-right md:block'>
        <h3 className='text-lg font-bold'>{date}</h3>
      </div>

      {/* 右侧内容 (Takes full width on mobile) */}
      <div className='pb-8 w-full md:w-1/2 md:pl-8'>
        {' '}
        {/* Added padding bottom */}
        {/* Show date above title on mobile */}
        <h3 className='block mb-1 text-lg font-bold md:hidden'>{date}</h3>
        <p className='text-lg opacity-80'>{title}</p>
      </div>
    </motion.div>
  );
};

export default function AnigenCompetition() {
  const { theme } = useTheme();
  const { t } = useTranslation('anigen-competition');
  const user = useUser();

  // 动态颜色根据主题
  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-foreground';
  const bgColor = 'bg-background'; // Slightly adjusted background colors
  const accentColor = 'text-[#6366F1]'; // Using a vibrant accent
  const borderColor = 'border-border';
  const cardBg = 'bg-card/70 backdrop-blur-sm'; // Added backdrop blur to cards

  // 页面内容
  return (
    <div className={`min-h-screen ${bgColor}`}>
      <Head>
        <title>{t('meta.title')}</title>
        <meta name='description' content={t('meta.description')} />
        <script
          async
          src='https://platform.twitter.com/widgets.js'
          charSet='utf-8'></script>
      </Head>

      <NavBar user={user} />

      {/* 英雄区域 */}
      <main className={`${textColor}`}>
        {' '}
        {/* Keep overall text color for other sections */}
        <section className="relative overflow-hidden py-28 md:py-40 bg-[url('/images/sponsors/background.webp')] bg-cover bg-center bg-no-repeat">
          {' '}
          {/* Kept bg-cover */}
          {/* 背景渐变 */}
          <div className='absolute inset-0 -z-10'>
            <div className='absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-500/10 to-teal-500/10'></div>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(120,119,198,0.3),_rgba(255,255,255,0)_50%)] blur-[80px]'></div>
          </div>
          <div className='container px-4 mx-auto max-w-7xl'>
            <motion.div
              initial='hidden'
              animate='visible'
              variants={staggerContainer}
              className='text-center'>
              <motion.h1
                variants={fadeIn}
                className={`mb-24 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl text-white [text-shadow:0_4px_10px_rgba(0,0,0,1)]`} // Added text shadow
              >
                {t('hero.title')}
              </motion.h1>
              {/* Removed "Where AI Meets Animation" h2 */}
              <motion.p
                variants={fadeIn}
                className={` text-2xl md:text-3xl font-bold text-gray-100 opacity-90 [text-shadow:0_3px_7px_rgba(0,0,0,1)]`} // Added text shadow
              >
                {t('hero.subtitle')}
              </motion.p>
              {/* 新增：赞助商联名 Logo */}
              <motion.div
                variants={fadeIn}
                className='flex flex-wrap gap-3 justify-center items-center mt-4 mb-12' // Added flex-wrap for smaller screens
              >
                <span className='text-lg font-medium text-gray-200 opacity-70 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]'>
                  {t('hero.sponsors')}
                </span>{' '}
                {/* Added text shadow */}
                <div className='relative w-auto h-8'>
                  {' '}
                  {/* Keep h-8 and w-auto */}
                  <Image
                    src='/images/sponsors/hedra.png'
                    alt='Hedra Logo'
                    height={16} // Corresponds to h-8
                    width={0} // Set width to 0 initially
                    style={{ width: 'auto', height: '100%' }} // Let width adjust based on aspect ratio and 100% height
                    className='object-contain shadow-lg' // Keep object-contain
                    unoptimized // <-- 添加这个属性进行测试
                  />
                </div>
                <span className='text-lg font-medium text-gray-200 opacity-70 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]'>
                  ×
                </span>{' '}
                {/* Added text shadow */}
                <div className='relative w-auto h-8'>
                  {' '}
                  {/* Keep h-8 and w-auto */}
                  <Image
                    src='/images/sponsors/hailuo.jpg'
                    alt='Hailuo Logo'
                    height={16} // Corresponds to h-8
                    width={0} // Set width to 0 initially
                    style={{ width: 'auto', height: '100%' }} // Let width adjust based on aspect ratio and 100% height
                    className='object-contain shadow-lg' // Keep object-contain
                    unoptimized
                  />
                </div>
                <span className='text-lg font-medium text-gray-200 opacity-70 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]'>
                  ×
                </span>{' '}
                {/* Added text shadow */}
                <div className='relative w-auto h-10'>
                  {' '}
                  {/* Keep h-8 and w-auto */}
                  <Image
                    src='/images/logo_new.webp'
                    alt='KomikoAI Logo'
                    height={18} // Corresponds to h-8
                    width={0} // Set width to 0 initially
                    style={{ width: 'auto', height: '100%' }} // Let width adjust based on aspect ratio and 100% height
                    className='object-contain' // Keep object-contain
                    unoptimized
                  />
                </div>
                <span className='text-lg font-medium text-gray-200 opacity-70 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]'>
                  ×
                </span>{' '}
                {/* Added text shadow */}
                <div className='relative w-auto h-9'>
                  {' '}
                  {/* Keep h-8 and w-auto */}
                  <Image
                    src='/images/sponsors/anishort.webp'
                    alt='AniShort Logo'
                    height={18} // Corresponds to h-8
                    width={0} // Set width to 0 initially
                    style={{ width: 'auto', height: '100%' }} // Let width adjust based on aspect ratio and 100% height
                    className='object-contain shadow-lg' // Keep object-contain
                    unoptimized
                  />
                </div>
              </motion.div>
              {/* Removed longer description paragraph */}
              <motion.div
                variants={fadeIn}
                className='flex flex-wrap gap-4 justify-center mt-12' // Added margin top to space from logos
              >
                <Button
                  as={Link}
                  href='#rules' // Link to the new combined rules section
                  color='primary'
                  size='lg'
                  radius='full'
                  className='font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg' // Enhanced button style
                >
                  {t('hero.btnRules')}
                </Button>
                <Button
                  as={Link}
                  href='https://docs.google.com/forms/d/e/1FAIpQLSf1mivMBhyYyRuNM4IMun4VxDEt87LhLhqAoa9gheS1-TwonQ/viewform?usp=dialog'
                  target='_blank' // Open link in a new tab
                  color='default'
                  size='lg'
                  radius='full'
                  className='font-bold text-foreground border-card/100 bg-card/90 hover:bg-card/80' // Changed text to white, adjusted border and hover
                  variant='bordered'>
                  {t('hero.btnSubmit')}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
        {/* 关于竞赛 */}
        <section className='py-20 md:py-24'>
          {' '}
          {/* Adjusted padding */}
          <div className='container px-4 mx-auto max-w-7xl'>
            <motion.div
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, amount: 0.3 }} // Trigger animation sooner
              variants={staggerContainer}
              className='mx-auto max-w-4xl text-center' // Increased max-width
            >
              <motion.h2
                variants={fadeIn}
                className={`mb-4 text-xl font-bold ${accentColor}`}>
                {t('about.subtitle')}
              </motion.h2>
              <motion.h3
                variants={fadeIn}
                className='mb-6 text-3xl font-bold md:text-4xl'>
                {t('about.title')}
              </motion.h3>
              <motion.p
                variants={fadeIn}
                className='mb-6 text-lg opacity-80 md:text-xl'>
                {' '}
                {/* Merged text from hero */}
                {t('about.description1')}
              </motion.p>
              <motion.p
                variants={fadeIn}
                className='text-lg opacity-80 md:text-xl'>
                {' '}
                {/* Original about text */}
                {t('about.description2')}
              </motion.p>
            </motion.div>
          </div>
        </section>
        {/* 奖项设置 (Moved Up) */}
        <section id='prizes' className='py-20 md:py-24'>
          <div className='container px-4 mx-auto max-w-7xl'>
            <motion.div
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
              className='mb-16 text-center'>
              <motion.h2
                variants={fadeIn}
                className='mb-12 text-3xl font-bold md:text-4xl'>
                {t('prizes.title')}
              </motion.h2>

              <div className='grid gap-10 md:grid-cols-2'>
                {' '}
                {/* Increased gap */}
                {/* 动画赛道奖项 */}
                <motion.div variants={fadeIn}>
                  <h3 className='mb-6 text-2xl font-bold'>
                    {t('prizes.animation.title')}
                  </h3>
                  <div className='space-y-6'>
                    {' '}
                    {/* Added space between prize cards */}
                    <Card
                      className={`p-6 text-left border-l-4 border-yellow-400 shadow-lg ${cardBg}`}>
                      <h4 className='flex items-center mb-2 text-xl font-bold'>
                        <span className='mr-2 text-yellow-400'>🏆</span>{' '}
                        {t('prizes.animation.grandPrize')}
                      </h4>
                      <div className='space-y-2'>
                        <p className='font-semibold'>
                          Zandy Villagracia{' '}
                          <span className='text-sm opacity-70'>
                            @cmajorissues01
                          </span>
                        </p>
                        <ul className='ml-5 space-y-1 list-disc opacity-80'>
                          <li>{t('prizes.animation.grandPrizeDetails.0')}</li>
                          <li>{t('prizes.animation.grandPrizeDetails.1')}</li>
                          <li>{t('prizes.animation.grandPrizeDetails.2')}</li>
                        </ul>
                      </div>
                    </Card>
                    <Card
                      className={`p-6 text-left border-l-4 border-border shadow-lg ${cardBg}`}>
                      <h4 className='flex items-center mb-2 text-xl font-bold'>
                        <span className='mr-2 text-muted-foreground'>🥈</span>{' '}
                        {t('prizes.animation.secondPrize')}
                      </h4>
                      <div className='space-y-2'>
                        <p className='font-semibold'>
                          Sensei{' '}
                          <span className='text-sm opacity-70'>
                            @Undercoversen9
                          </span>
                        </p>
                        <p className='opacity-80'>
                          {t('prizes.animation.secondPrizeDetails')}
                        </p>
                      </div>
                    </Card>
                    <Card
                      className={`p-6 text-left border-l-4 border-amber-600 shadow-lg ${cardBg}`}>
                      <h4 className='flex items-center mb-2 text-xl font-bold'>
                        <span className='mr-2 text-amber-600'>🥉</span>{' '}
                        {t('prizes.animation.runnerUp')}
                      </h4>
                      <div className='space-y-2'>
                        <p className='font-semibold'>
                          Rockzheart{' '}
                          <span className='text-sm opacity-70'>
                            @RockzAiLab
                          </span>
                        </p>
                        <p className='font-semibold'>
                          Harsh Chaudhari{' '}
                          <span className='text-sm opacity-70'>
                            @HarshCh164
                          </span>
                        </p>
                        <p className='opacity-80'>
                          {t('prizes.animation.runnerUpDetails')}
                        </p>
                      </div>
                    </Card>
                    <Card className={`p-6 text-left shadow-lg ${cardBg}`}>
                      <h4 className='flex items-center mb-2 text-xl font-bold'>
                        <span className='mr-2'>✨</span>{' '}
                        {t('prizes.animation.excellence')}
                      </h4>
                      <div className='space-y-2'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                          <p className='font-semibold'>
                            Roman{' '}
                            <span className='text-sm opacity-70'>
                              @rama_rishi40237
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Ariel Benedick Narciso{' '}
                            <span className='text-sm opacity-70'>
                              @thevirtualark1
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Sank Sinha{' '}
                            <span className='text-sm opacity-70'>
                              @sank_sinha
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Ancient Dream{' '}
                            <span className='text-sm opacity-70'>
                              @AncientDreamsStudios
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Hieu Nguyen{' '}
                            <span className='text-sm opacity-70'>
                              @hieung173
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Klim Tukaev{' '}
                            <span className='text-sm opacity-70'>
                              @klimttukaev
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Erie{' '}
                            <span className='text-sm opacity-70'>
                              @eriethe1
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Pratik Sinha{' '}
                            <span className='text-sm opacity-70'>
                              @sank_sinha
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Kaoru Komatsu{' '}
                            <span className='text-sm opacity-70'>@PiNKICK</span>
                          </p>
                          <p className='font-semibold'>
                            Shim{' '}
                            <span className='text-sm opacity-70'>@os_shim</span>
                          </p>
                          <p className='font-semibold'>
                            Robo{' '}
                            <span className='text-sm opacity-70'>
                              @TheRobo42
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Eve{' '}
                            <span className='text-sm opacity-70'>
                              @eden_eve1
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Lyricalsoundscape{' '}
                            <span className='text-sm opacity-70'>
                              @lscape_ai
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Jieyi Lee{' '}
                            <span className='text-sm opacity-70'>
                              @jieyi.studio
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Jordan Daniels{' '}
                            <span className='text-sm opacity-70'>
                              @nuphantasy
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Camilo Ernesto Galvis guerra{' '}
                            <span className='text-sm opacity-70'>
                              @galvis_guerra_1
                            </span>
                          </p>
                          <p className='font-semibold'>
                            SHAINA NOSHIRO{' '}
                            <span className='text-sm opacity-70'>
                              @hibi_ai__
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Jason Lee Elliott{' '}
                            <span className='text-sm opacity-70'>
                              @jasonleeelliott
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Alex{' '}
                            <span className='text-sm opacity-70'>
                              @GxL_2612
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Nick / EvilAniki{' '}
                            <span className='text-sm opacity-70'>
                              @EvilAniki
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Hedrian Otieno{' '}
                            <span className='text-sm opacity-70'>
                              @edie_lik
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Andrea Bleau{' '}
                            <span className='text-sm opacity-70'>
                              @bleaubloomd
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Kawaiizice{' '}
                            <span className='text-sm opacity-70'>
                              @Kawaiizice
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Wei Huang{' '}
                            <span className='text-sm opacity-70'>
                              @minimichdesign
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Rohan Kumar{' '}
                            <span className='text-sm opacity-70'>
                              @Rohan7t5
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Vijayakumar Anbalagan{' '}
                            <span className='text-sm opacity-70'>
                              @the-overman-studio
                            </span>
                          </p>
                          <p className='font-semibold'>
                            neco{' '}
                            <span className='text-sm opacity-70'>
                              @neco1751662
                            </span>
                          </p>
                          <p className='font-semibold'>
                            WAKANA KANEHIRA{' '}
                            <span className='text-sm opacity-70'>
                              @wakawakkachan
                            </span>
                          </p>
                          <p className='font-semibold'>
                            Cam Murdoch{' '}
                            <span className='text-sm opacity-70'>
                              @camfromthecoast, @visitsurfnoir
                            </span>
                          </p>
                          <p className='font-semibold'>
                            David NKURUNZIZA{' '}
                            <span className='text-sm opacity-70'>
                              @david_nkur10170
                            </span>
                          </p>
                        </div>
                        <p className='mt-4 opacity-80'>
                          {t('prizes.animation.excellenceDetails')}
                        </p>
                      </div>
                    </Card>
                  </div>
                  <p className='mt-6 italic'>{t('prizes.animation.note')}</p>
                </motion.div>
                {/* 脚本赛道奖项 */}
                <motion.div variants={fadeIn}>
                  <h3 className='mb-6 text-2xl font-bold'>
                    {t('prizes.scriptwriting.title')}
                  </h3>
                  <div className='space-y-6'>
                    {' '}
                    {/* Added space between prize cards */}
                    <Card
                      className={`p-6 text-left border-l-4 border-yellow-400 shadow-lg ${cardBg}`}>
                      <h4 className='flex items-center mb-2 text-xl font-bold'>
                        <span className='mr-2 text-yellow-400'>🏆</span>{' '}
                        {t('prizes.scriptwriting.grandPrize')}
                      </h4>
                      <div className='space-y-2'>
                        <p className='font-semibold'>
                          WARKRADLE: CONFRONTATION by Lord Mo{' '}
                          <span className='text-sm opacity-70'>@godhand</span>
                        </p>
                        <p className='opacity-80'>
                          {t('prizes.scriptwriting.grandPrizeDetails')}
                        </p>
                      </div>
                    </Card>
                    <Card className={`p-6 text-left shadow-lg ${cardBg}`}>
                      <h4 className='flex items-center mb-2 text-xl font-bold'>
                        <span className='mr-2'>✨</span>{' '}
                        {t('prizes.scriptwriting.excellence')}
                      </h4>
                      <div className='space-y-2'>
                        <p className='font-semibold'>
                          The Wayfarer by James G. Maynard{' '}
                          <span className='text-sm opacity-70'>
                            @aicreatorhouse
                          </span>
                        </p>
                        <p className='font-semibold'>
                          Fall in Love with the Angel of Death by Jiarong Si{' '}
                          <span className='text-sm opacity-70'>@jiarongsi</span>
                        </p>
                        <p className='font-semibold'>
                          24-Hour Reign by Jordan Daniels{' '}
                          <span className='text-sm opacity-70'>
                            @nuphantasy
                          </span>
                        </p>
                        <p className='mt-4 opacity-80'>
                          {t('prizes.scriptwriting.excellenceDetails')}
                        </p>
                      </div>
                    </Card>
                  </div>
                  <p className='mt-6 italic'>
                    {t('prizes.scriptwriting.note')}
                  </p>

                  {/* 在剧本创作赛道下方添加Twitter嵌入 */}
                  <div className='mt-8'>
                    <TwitterEmbed tweetId='1929643485994611180' />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
        {/* 评委介绍 (Moved Up) */}
        <section
          id='judges'
          className='overflow-hidden relative py-20 bg-gradient-to-b md:py-24 from-purple-500/5 via-blue-500/10 to-purple-500/5'>
          {' '}
          {/* Enhanced background */}
          {/* Background elements */}
          <div className='absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 bg-purple-500/10 -z-10'></div>
          <div className='absolute right-0 bottom-0 w-72 h-72 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 bg-blue-500/10 -z-10'></div>
          <div className='container px-4 mx-auto max-w-7xl'>
            <motion.div
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
              className='text-center'>
              <span
                className={`block mb-2 text-sm font-semibold tracking-wider uppercase ${accentColor}`}>
                {t('judges.label')}
              </span>
              <motion.h2
                variants={fadeIn}
                className='mb-4 text-3xl font-bold md:text-4xl'>
                {t('judges.title')}
              </motion.h2>
              <div
                className={`mx-auto mb-10 w-20 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full`}></div>

              <motion.p
                variants={fadeIn}
                className='mx-auto mb-16 max-w-3xl text-lg opacity-80'>
                {t('judges.description')}
              </motion.p>

              <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
                {' '}
                {/* Changed lg:grid-cols-4 to lg:grid-cols-3 */}
                {/* Judge components remain the same */}
                <Judge
                  name={t('judges.judge1.name')}
                  title={t('judges.judge1.title')}
                  imageSrc='/images/avatars/ben.jpeg'
                />
                <Judge
                  name={t('judges.judge2.name')}
                  title={t('judges.judge2.title')}
                  imageSrc='/images/avatars/michael.jpg'
                />
                <Judge
                  name={t('judges.judge3.name')}
                  title={t('judges.judge3.title')}
                  imageSrc='/images/avatars/garrett.jpeg' // Assuming placeholder, update if needed
                />
                <Judge
                  name={t('judges.judge4.name')}
                  title={t('judges.judge4.title')}
                  imageSrc='/images/avatars/aiden.jpg' // Assuming placeholder, update if needed
                />
                {/* 添加新的评委 */}
                <Judge
                  name={t('judges.judge5.name')} // Placeholder - 请替换为实际姓名
                  title={t('judges.judge5.title')} // Placeholder - 请替换为实际头衔
                  imageSrc='/images/avatars/leannna.jpeg' // Placeholder - 请替换为实际图片路径
                />
                {/* <Judge
                                    name="Judge 6" // Placeholder - 请替换为实际姓名
                                    title="Title 6" // Placeholder - 请替换为实际头衔
                                    imageSrc="/images/avatar-placeholder.png" // Placeholder - 请替换为实际图片路径
                                /> */}
              </div>
            </motion.div>
          </div>
        </section>
        {/* 时间线 (Moved Up) */}
        <section id='timeline' className='py-20 md:py-24'>
          <div className='container px-4 mx-auto max-w-7xl'>
            <motion.div
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer}
              className='mx-auto max-w-3xl text-center'>
              <motion.h2
                variants={fadeIn}
                className='mb-12 text-3xl font-bold md:text-4xl'>
                {t('timeline.title')}
              </motion.h2>

              <div className='relative'>
                {/* 连接线 */}
                <div
                  className={`absolute left-1/2 top-2 bottom-2 w-1 bg-border rounded-full transform -translate-x-1/2`}></div>

                {/* 时间点 */}
                <motion.div variants={staggerContainer} className='space-y-16'>
                  {' '}
                  {/* Increased spacing */}
                  {/* TimelineItem component needs slight adjustment for better line connection */}
                  <TimelineItem
                    date={t('timeline.launch.date')}
                    title={t('timeline.launch.title')}
                  />
                  <TimelineItem
                    date={t('timeline.submission.date')}
                    title={t('timeline.submission.title')}
                  />
                  <TimelineItem
                    date={t('timeline.judging.date')}
                    title={t('timeline.judging.title')}
                  />
                  <TimelineItem
                    date={t('timeline.announcement.date')}
                    title={t('timeline.announcement.title')}
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
        {/* 要求与规则 (Merged Section) */}
        <section
          id='rules'
          className='py-20 bg-gradient-to-b from-transparent to-transparent md:py-24 via-purple-500/5'>
          <div className='container px-4 mx-auto max-w-7xl'>
            <motion.div
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
              className='mb-16 text-center'>
              <motion.h2
                variants={fadeIn}
                className='mb-12 text-3xl font-bold md:text-4xl'>
                {t('rules.title')}
              </motion.h2>

              <div className='grid gap-8 md:grid-cols-2'>
                {' '}
                {/* Changed to 2 columns */}
                {/* Animation Track Card (Merged Content) */}
                <motion.div variants={fadeIn}>
                  <Card
                    className={`p-6 h-full text-left border shadow-lg md:p-8 ${cardBg} ${borderColor}`}>
                    <h3 className='flex items-center mb-4 text-2xl font-bold'>
                      <span className='mr-3 text-3xl'>🎬</span>{' '}
                      {t('rules.animation.title')}
                    </h3>
                    <p className='mb-6 text-lg opacity-90'>
                      {t('rules.animation.description')}
                    </p>

                    <div className='space-y-4 text-sm opacity-80'>
                      <div>
                        <h4 className='mb-1 text-base font-semibold opacity-100'>
                          {t('rules.animation.format.label')}
                        </h4>
                        <p>{t('rules.animation.format.value')}</p>
                      </div>
                      <div>
                        <h4 className='mb-1 text-base font-semibold opacity-100'>
                          {t('rules.animation.duration.label')}
                        </h4>
                        <p>{t('rules.animation.duration.value')}</p>
                      </div>
                      <div>
                        <h4 className='mb-1 text-base font-semibold opacity-100'>
                          {t('rules.animation.content.label')}
                        </h4>
                        <p>{t('rules.animation.content.value')}</p>
                      </div>
                      <Divider className='my-4' /> {/* Separator */}
                      <div>
                        <h4 className='mb-2 text-base font-semibold opacity-100'>
                          {t('rules.animation.requirements.label')}
                        </h4>
                        <ul className='ml-5 space-y-2 list-disc'>
                          <li>
                            {t('rules.animation.requirements.list.0')}
                            <ul className='ml-5 space-y-1 list-circle'>
                              <li>
                                {t('rules.animation.requirements.list.1')}
                              </li>
                              <li>
                                {t('rules.animation.requirements.list.2')}
                              </li>
                              <li>
                                {t('rules.animation.requirements.list.3')}
                              </li>
                            </ul>
                          </li>
                          <li>{t('rules.animation.requirements.list.4')}</li>
                          <li>{t('rules.animation.requirements.list.5')}</li>
                          <li>{t('rules.animation.requirements.list.6')}</li>
                          <li>{t('rules.animation.requirements.list.7')}</li>
                          <li>{t('rules.animation.requirements.list.8')}</li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                </motion.div>
                {/* Scriptwriting Track Card (Merged Content) */}
                <motion.div variants={fadeIn}>
                  <Card
                    className={`p-6 h-full text-left border shadow-lg md:p-8 ${cardBg} ${borderColor}`}>
                    <h3 className='flex items-center mb-4 text-2xl font-bold'>
                      <span className='mr-3 text-3xl'>✍️</span>{' '}
                      {t('rules.scriptwriting.title')}
                    </h3>
                    <p className='mb-6 text-lg opacity-90'>
                      {t('rules.scriptwriting.description')}
                    </p>

                    <div className='space-y-4 text-sm opacity-80'>
                      <div>
                        <h4 className='mb-1 text-base font-semibold opacity-100'>
                          {t('rules.scriptwriting.format.label')}
                        </h4>
                        <p>{t('rules.scriptwriting.format.value')}</p>
                      </div>
                      <div>
                        <h4 className='mb-1 text-base font-semibold opacity-100'>
                          {t('rules.scriptwriting.duration.label')}
                        </h4>
                        <p>{t('rules.scriptwriting.duration.value')}</p>
                      </div>
                      <div>
                        <h4 className='mb-1 text-base font-semibold opacity-100'>
                          {t('rules.scriptwriting.genre.label')}
                        </h4>
                        <p>{t('rules.scriptwriting.genre.value')}</p>
                      </div>
                      <Divider className='my-4' /> {/* Separator */}
                      <div>
                        <h4 className='mb-2 text-base font-semibold opacity-100'>
                          {t('rules.scriptwriting.requirements.label')}
                        </h4>
                        <ul className='ml-5 space-y-2 list-disc'>
                          <li>
                            {t('rules.scriptwriting.requirements.list.0')}
                          </li>
                          <li>
                            {t('rules.scriptwriting.requirements.list.1')}
                          </li>
                          <li>
                            {t('rules.scriptwriting.requirements.list.2')}
                          </li>
                          <li>
                            {t('rules.scriptwriting.requirements.list.3')}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* 添加参赛说明 */}
              <motion.div
                variants={fadeIn}
                className='mt-8 p-4 mx-auto  text-center'>
                <p className='text-lg font-medium opacity-90'>
                  {t('rules.participation.note')}
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>
        {/* 赞助商 */}
        <section id='sponsors' className='py-20 md:py-24'>
          <div className='container px-4 mx-auto max-w-7xl'>
            <motion.div
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
              className='text-center'>
              <motion.h2
                variants={fadeIn}
                className='mb-12 text-3xl font-bold md:text-4xl'>
                {t('sponsors.title')}
              </motion.h2>

              <div className='grid grid-cols-2 gap-8 place-items-center md:grid-cols-4'>
                {' '}
                {/* Centered items */}
                {/* Sponsor components remain the same, but wrapped for animation */}
                <motion.div variants={scaleUp}>
                  <Sponsor
                    name={t('sponsors.hedra.name')}
                    logoSrc='/images/sponsors/hedra.png'
                    description={t('sponsors.hedra.description')} // Simplified description
                    url='#'
                  />
                </motion.div>
                <motion.div variants={scaleUp}>
                  <Sponsor
                    name={t('sponsors.hailuo.name')}
                    logoSrc='/images/sponsors/hailuo.jpg'
                    description={t('sponsors.hailuo.description')} // Simplified description
                    url='#'
                  />
                </motion.div>
                <motion.div variants={scaleUp}>
                  <Sponsor
                    name={t('sponsors.komiko.name')}
                    logoSrc='/images/logo_new.webp'
                    description={t('sponsors.komiko.description')} // Simplified description
                    url='#'
                  />
                </motion.div>
                <motion.div variants={scaleUp}>
                  <Sponsor
                    name={t('sponsors.anishort.name')}
                    logoSrc='/images/sponsors/anishort.webp'
                    description={t('sponsors.anishort.description')} // Simplified description
                    url='https://anishort.app'
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
        {/* 参赛提交 */}
        <section
          id='submit'
          className='py-20 bg-gradient-to-t to-transparent md:py-24 from-purple-500/10 via-blue-500/5'>
          {' '}
          {/* Added gradient */}
          <div className='container px-4 mx-auto max-w-7xl'>
            <motion.div
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer}
              className='mx-auto max-w-3xl text-center'>
              <motion.h2
                variants={fadeIn}
                className='mb-6 text-3xl font-bold md:text-4xl'>
                {t('submit.title')}
              </motion.h2>
              <motion.p variants={fadeIn} className='mb-10 text-lg opacity-80'>
                {t('submit.description')}
              </motion.p>

              <motion.div
                variants={fadeIn}
                className='flex flex-wrap gap-4 justify-center'>
                <Button
                  as={Link}
                  href='https://docs.google.com/forms/d/e/1FAIpQLSf1mivMBhyYyRuNM4IMun4VxDEt87LhLhqAoa9gheS1-TwonQ/viewform?usp=dialog' // Assuming a form exists or will be added
                  target='_blank' // Open link in a new tab
                  color='primary'
                  size='lg'
                  radius='full'
                  className='font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg' // Enhanced button style
                  endContent={<span className='ml-1'>→</span>} // Added arrow
                >
                  {t('submit.btnSubmit')}
                </Button>
                <Button
                  as={Link}
                  href='#rules'
                  color='default'
                  size='lg'
                  radius='full'
                  className='font-bold'
                  variant='bordered'>
                  {t('submit.btnRules')}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
