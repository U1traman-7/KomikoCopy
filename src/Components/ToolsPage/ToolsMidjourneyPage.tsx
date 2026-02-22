import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import FAQ from '@/components/FAQ';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import ImageOrTextToVideoConvert from './ImageOrTextToVideoConvert';

import { ImageToVideoModel } from '../../../api/tools/_zaps';
import Sidebar from '../Sidebar/Sidebar';
import Masonry from 'react-masonry-css';

export default function ToolsPage({ isMobile }: any) {
  const { t } = useTranslation(['image-animation-generator', 'toast']);

  // Add Twitter SDK script loader
  const loadTwitterScript = () => {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);
  };

  useEffect(() => {
    loadTwitterScript();
  }, []);

  // Add Masonry styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
        .my-masonry-grid {
          display: flex;
          width: auto;
        }
        .my-masonry-grid_column {
          padding: 0 8px;
          background-clip: padding-box;
        }
        .my-masonry-grid_column > div {
          margin-bottom: 16px;
        }
        .twitter-tweet {
          margin: 0 !important;
          margin-bottom: 16px !important;
        }
      `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const localizedFaqs = [
    {
      id: 1,
      question:
        'What is the Midjourney AI Video Generator and how does it work?',
      answer:
        'The Midjourney AI Video Generator transforms static images into short animated videos by analyzing image details and applying motion effects. Users can animate images created on Midjourney or upload their own, then guide the animation with text prompts and motion settings.',
    },
    {
      id: 2,
      question:
        "How does Midjourney's video generator differ from other AI video tools?",
      answer:
        'Unlike typical text-to-video models, Midjourney uses an image-first approach, ensuring consistent style and natural motion by starting with a high-quality image. It offers customizable motion modes and dynamic camera effects, setting it apart in animation quality and control.',
    },
    {
      id: 3,
      question: 'Can I control the style and motion of the videos?',
      answer:
        'Yes, you can select low or high motion modes and use manual animation prompts to specify how subjects and cameras move, allowing detailed customization of animation style and dynamics.',
    },
    {
      id: 4,
      question: 'What video length and quality does the tool support?',
      answer:
        'Videos start at 5 seconds and can be extended up to 20 seconds. The tool supports high-resolution outputs, including 4K, ensuring professional visual quality.',
    },
    {
      id: 5,
      question: 'Does the Midjourney AI Video Generator include audio?',
      answer:
        'Currently, the generator does not produce integrated audio or sound effects. Users need to add soundtracks or dialogue separately during post-production.',
    },
    {
      id: 6,
      question: 'Who can benefit from using this AI video generator?',
      answer:
        'This tool is ideal for content creators, marketers, animators, and anyone looking to convert static anime, manga, manhwa, or comic images into engaging animated videos with ease and high quality.',
    },
    {
      id: 7,
      question: "How much does it cost to use Midjourney's video generation?",
      answer:
        'Subscription plans start at $10 per month. Video generation consumes more GPU resources than image creation, making video tasks approximately eight times more costly than image tasks, but still affordable compared to competitors.',
    },
  ];

  return (
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-6 text-4xl font-bold text-center text-heading md:text-5xl'>
            Midjourney AI Video Generator
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            Discover the power of the Midjourney AI Video Generator,
            transforming still images into captivating 5 to 20-second animated
            videos. Perfect for anime, manga, manhwa, and comic creators, this
            AI tool delivers smooth motion, dynamic camera effects, and
            high-resolution video outputs to bring your characters and scenes
            vividly to life.
          </p>
        </div>

        <ImageOrTextToVideoConvert
          model={ImageToVideoModel.MJ_VIDEO}
          exampleVideoUrl='/images/pages/midjourney/example3.webm'
        />

        {/* Examples Section */}
        <div className='py-16'>
          <h2 className='mb-6 text-3xl font-bold text-center text-heading'>
            Midjourney AI Video Generation Examples
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground'>
            Experience the Midjourney AI Video Generator&apos;s ability to
            breathe life into anime, manga, manhwa, and comic images by
            producing smooth, high-resolution animated clips. Watch as static
            artwork transforms into vibrant stories with fluid character
            movements and dynamic camera angles, perfect for social media,
            marketing, and creative projects.
          </p>

          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {/* Example 1 */}
            {[
              {
                output: '/images/pages/midjourney/example3.webm',
                outputAlt: 'midjourney video example',
                description:
                  'Model: Midjourney | Prompt: Anime maid girl in frilly black and white uniform walking toward camera carrying tea tray, warm cafe lighting, soft focus background with customers, golden hour sunlight through windows, gentle approach movement',
              },
              {
                output: '/images/pages/midjourney/example4.webm',
                outputAlt: 'midjourney video example',
                description:
                  'Model: Midjourney | Prompt: Pixel art surfer riding massive blue wave with white foam, dynamic surfing action, retro 8-bit style animation, ocean spray and water movement, bright blue sky with clouds, smooth wave motion',
              },
              {
                output: '/images/pages/midjourney/example5.webm',
                outputAlt: 'midjourney video example',
                description:
                  'Model: Midjourney | Prompt: Silhouetted tribal warrior in orange robes walking with spotted hyena companion across misty savanna, minimalist art style, soft gradient sky transitioning from dawn to dusk, gentle walking animation, atmospheric African landscape',
              },
              {
                output: '/images/pages/midjourney/example6.webm',
                outputAlt: 'midjourney video example',
                description:
                  'Model: Midjourney | Prompt: Ethereal girl with flowing white hair walking gracefully through shallow water, sunlight creating dancing ripples, floating white lilies, gentle water movement with each step, serene forest pond, soft golden lighting',
              },
            ].map(item => (
              <div
                className='flex overflow-hidden flex-col justify-between bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'
                key={item.output}>
                <div className='grid grid-cols-1 gap-4 p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-video'>
                      <video
                        src={item.output}
                        controls
                        autoPlay
                        playsInline
                        loop
                        muted
                        className='object-contain w-full h-full'>
                        Output Video
                      </video>
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      Output Video
                    </p>
                  </div>
                </div>
                <div className='p-4 bg-primary-50'>
                  <p className='font-medium text-primary-600'>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 className='pt-16 mb-4 text-3xl font-bold text-center text-heading'>
          What is Midjourney AI Video Generator?
        </h2>
        <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
          The Midjourney AI Video Generator is an innovative AI-powered tool
          designed to convert static images into dynamic, high-quality videos.
          Leveraging advanced image-to-video technology, it produces visually
          stunning clips with fluid animations, customizable motion settings,
          and cinematic camera movements. This video generator is ideal for
          content creators seeking to animate anime, manga, manhwa, comics, and
          other illustrated characters with professional-grade results in up to
          4K resolution. Its user-friendly interface and flexible motion
          controls allow both beginners and professionals to craft immersive
          animated stories efficiently.
        </p>

        {/* How It Works Section */}
        <div className='pt-16 pb-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use Midjourney AI Video Generator with KomikoAI
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                step: 1,
                title: 'Upload Your Image',
                content:
                  'Begin by selecting a high-resolution image you want to animate. This image serves as the foundation for the video, ensuring style consistency and detailed motion.',
              },
              {
                step: 2,
                title: 'Add Text Prompts for Animation',
                content:
                  'Input descriptive text prompts to guide the AI on how the scene should move, including character actions, emotions, and camera dynamics. Choose between automatic motion for subtle effects or manual mode for precise animation control.',
              },
              {
                step: 3,
                title: 'Generate and Download Your Video',
                content:
                  'Click the generate button to create your AI video. You can extend your clip in 4-second increments up to 20 seconds, then download the final video. Options for low or high motion settings let you customize the animation intensity.',
              },
            ].map(step => (
              <div
                key={step.title}
                className='flex flex-col p-6 h-full bg-card rounded-xl border border-primary-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                <div className='flex justify-center items-center mb-4 w-14 h-14 text-2xl font-bold text-primary-foreground bg-gradient-to-r to-purple-600 rounded-full from-primary-600'>
                  {step.step}
                </div>
                <div className='flex-grow'>
                  <h3 className='mb-3 text-xl font-bold text-primary-600'>
                    {step.title}
                  </h3>
                  <p className=' text-muted-foreground text-md'>{step.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='py-16 bg-background'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            X Posts About Midjourney AI Video Generator
          </h2>
          <div className='px-4'>
            <Masonry
              breakpointCols={{
                default: 4,
                '2400': 3,
                '1200': 2,
                '640': 1,
              }}
              className='flex gap-4 w-full'
              columnClassName='my-masonry-grid_column'>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  The Midjourney video model is absolutely mind-blowing 🤯🎬{' '}
                  <a href='https://t.co/STXkBOBeBQ'>
                    pic.twitter.com/STXkBOBeBQ
                  </a>
                </p>
                &mdash; Pierrick Chevallier | IA (@CharaspowerAI){' '}
                <a href='https://twitter.com/CharaspowerAI/status/1936703250868117829?ref_src=twsrc%5Etfw'>
                  June 22, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  My favourite 10 video generations on Midjourney (so far)
                  <br />
                  <br />A thread 🧵
                  <br />
                  <br />
                  1.{' '}
                  <a href='https://t.co/kCX5SOTvYl'>
                    pic.twitter.com/kCX5SOTvYl
                  </a>
                </p>
                &mdash; James Yeung (@jamesyeung18){' '}
                <a href='https://twitter.com/jamesyeung18/status/1935704952812573157?ref_src=twsrc%5Etfw'>
                  June 19, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='ht' dir='ltr'>
                  midjourney / nijijourney video test{' '}
                  <a href='https://t.co/DRnF0uRUQz'>
                    pic.twitter.com/DRnF0uRUQz
                  </a>
                </p>
                &mdash; 852話(hakoniwa) (@8co28){' '}
                <a href='https://twitter.com/8co28/status/1935497195320655882?ref_src=twsrc%5Etfw'>
                  June 19, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  Just look at those water ripples, Midjourney has really
                  outdone themselves 😲{' '}
                  <a href='https://t.co/8A0e2wzbPe'>
                    pic.twitter.com/8A0e2wzbPe
                  </a>
                </p>
                &mdash; Timeless (@Timeless_aiart){' '}
                <a href='https://twitter.com/Timeless_aiart/status/1935565031816773645?ref_src=twsrc%5Etfw'>
                  June 19, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  Think you’d watch this?
                  <br />
                  <br />
                  Images: Midjourney
                  <br />
                  Videos: Midjourney🤍{' '}
                  <a href='https://t.co/WlDwXS0j7N'>
                    https://t.co/WlDwXS0j7N
                  </a>{' '}
                  <a href='https://t.co/rFGz8cQfQv'>
                    pic.twitter.com/rFGz8cQfQv
                  </a>
                </p>
                &mdash; Gizem Akdag (@gizakdag){' '}
                <a href='https://twitter.com/gizakdag/status/1935410611174674685?ref_src=twsrc%5Etfw'>
                  June 18, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='ja' dir='ltr'>
                  リアルと二次元の間くらい
                  <br />
                  Midjourney{' '}
                  <a href='https://t.co/9WgwUIb5X3'>
                    pic.twitter.com/9WgwUIb5X3
                  </a>
                </p>
                &mdash; NOBU 🎥 動画生成AIの人 (@nbykos){' '}
                <a href='https://twitter.com/nbykos/status/1936296567620706693?ref_src=twsrc%5Etfw'>
                  June 21, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  The new Midjourney video model is truly incredible. I’m
                  finding it so much more compelling than any of the other video
                  generation models so far. Just a way better aesthetic. Amazing
                  work{' '}
                  <a href='https://twitter.com/DavidSHolz?ref_src=twsrc%5Etfw'>
                    @DavidSHolz
                  </a>{' '}
                  and company!
                  <br />
                  <br />A sampling below of some of the cool things I generated
                  today:{' '}
                  <a href='https://t.co/yu401QDMEY'>
                    pic.twitter.com/yu401QDMEY
                  </a>
                </p>
                &mdash; Jeffrey Emanuel (@doodlestein){' '}
                <a href='https://twitter.com/doodlestein/status/1936663405311483998?ref_src=twsrc%5Etfw'>
                  June 22, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  consistent characters + mood in Google Veo 3... it’s possible
                  ✨<br />
                  <br />I used to spent hours refining text-to-image prompting
                  (mostly in midjourney) trying to keep character and tone
                  consistent – now I’m trying the same in T2V, seeing how far I
                  can push visual continuity using just…{' '}
                  <a href='https://t.co/lnvNnph0BY'>
                    pic.twitter.com/lnvNnph0BY
                  </a>
                </p>
                &mdash; Julie W. Design (@juliewdesign_){' '}
                <a href='https://twitter.com/juliewdesign_/status/1932434998088609805?ref_src=twsrc%5Etfw'>
                  June 10, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  I animated 15 Studio Ghibli scenes using Midjourney Video 🎬
                  <br />
                  <br />
                  Here’s a side-by-side comparison 🔊
                  <br />
                  <br />
                  What do you think?{' '}
                  <a href='https://t.co/LQUaHgLV0t'>
                    pic.twitter.com/LQUaHgLV0t
                  </a>
                </p>
                &mdash; Framer 🇱🇹 (@0xFramer){' '}
                <a href='https://twitter.com/0xFramer/status/1936033749004661093?ref_src=twsrc%5Etfw'>
                  June 20, 2025
                </a>
              </blockquote>
            </Masonry>
          </div>
        </div>

        {/* Benefits Section */}
        <div className='py-16 bg-gradient-to-b from-white rounded-xl to-primary-100'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            Why Choose Midjourney AI Video Generator for Your Content Creation?
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            The Midjourney AI Video Generator offers powerful features designed
            for creators who want to transform static images into captivating
            animated content with professional-quality results.
          </p>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: 'High-Resolution Video Output',
                content:
                  'Create visually stunning videos in up to 4K quality, featuring natural lighting and realistic motion that enhance anime and manga styles.',
                icon: '🎥',
              },
              {
                title: 'Customizable Motion Settings',
                content:
                  'Choose between low motion for subtle, ambient movements or high motion for dynamic subject and camera actions, tailoring animations to your creative vision.',
                icon: '🎬',
              },
              {
                title: 'User-Friendly Interface',
                content:
                  'Easily animate images with intuitive controls, suitable for both beginners and professional creators looking to streamline video production.',
                icon: '🖥️',
              },
              {
                title: 'Flexible Video Length',
                content:
                  'Generate short clips starting at 5 seconds, with the ability to extend up to 20 seconds, providing versatility for various content needs.',
                icon: '⏳',
              },
              {
                title: 'Dynamic Camera Effects',
                content:
                  'Incorporate cinematic camera movements and zooms that add depth and storytelling flair to your animations.',
                icon: '🎥',
              },
              {
                title: 'Affordable Subscription Plans',
                content:
                  'Access powerful AI video generation starting at $10/month, making it an accessible tool for creatives and businesses alike.',
                icon: '💰',
              },
            ].map(feature => (
              <div
                key={feature.title}
                className='p-6 bg-card rounded-xl border border-primary-100 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                <div className='flex items-center mb-4'>
                  <span className='mr-3 text-2xl'>{feature.icon}</span>
                  <h3 className='text-xl font-semibold text-primary-600'>
                    {feature.title}
                  </h3>
                </div>
                <p className='text-muted-foreground'>{feature.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className='my-12 md:my-16'>
          <MoreAITools category='animation' />
        </div>

        {/* FAQ Section */}
        <div className='py-16'>
          <h2 className='mb-2 text-3xl font-bold text-center text-heading'>
            Midjourney AI Video Generator FAQ - Everything You Need to Know
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Get answers to frequently asked questions about the Midjourney AI
            Video Generator, the innovative AI video creation tool designed for
            transforming static images into dynamic animated content. Learn how
            to maximize the video generator&apos;s features for your creative
            projects.
          </p>

          <div className='flex justify-center'>
            <div className='max-w-[1000px] w-full'>
              <FAQ faqs={localizedFaqs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
