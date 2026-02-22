import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import FAQ from '@/components/FAQ';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import ImageOrTextToVideoConvert from './ImageOrTextToVideoConvert';
import { ImageToVideoModel } from '../../../api/tools/_zaps';
import Sidebar from '../Sidebar/Sidebar';

export default function ToolsPage({ isMobile }: any) {
  const { t } = useTranslation(['image-animation-generator', 'toast']);

  const localizedFaqs = [
    {
      id: 1,
      question: 'What is AniSora AI Video Generator?',
      answer:
        "AniSora is an open-source animated video generation model developed by Bilibili, as part of its Project Index-AniSora. It's designed to create high-definition, anime-style videos from images or text prompts, focusing on expressive animation and motion consistency. Its development is supported by IJCAI'25-accepted research, aiming to explore the frontiers of animation video generation.",
    },
    {
      id: 2,
      question: 'How does AniSora differ from other AI video generators?',
      answer:
        "AniSora stands out due to its specific focus on anime and manga styles, leveraging Bilibili's expertise in this domain. As an open-source project, it encourages community collaboration. It aims to provide specialized tools for generating content like anime series episodes, Chinese animations, manga adaptations, and VTuber videos, which may not be the primary focus of more general AI video generators.",
    },
    {
      id: 3,
      question: 'Can AniSora generate both video and audio?',
      answer:
        "AniSora's primary focus is on video generation, particularly transforming images and text prompts into animated sequences. While the broader field of AI video generation often includes audio synthesis, specific audio capabilities for the current open-source AniSora model should be verified based on its latest release and documentation.",
    },
    {
      id: 4,
      question: 'Is AniSora suitable for anime and animation creators?',
      answer:
        "Absolutely. AniSora is specifically optimized for anime, manga, and various animation styles. It's built to support consistent character animation and expressive motion, making it an ideal tool for creators working on anime series, promotional videos (PVs), manga adaptations, VTuber content, and other animated storytelling formats.",
    },
    {
      id: 5,
      question: 'What are the main use cases for AniSora?',
      answer:
        'AniSora is designed for a range of applications within the anime and animation sphere. Key use cases include generating short animated clips for series or social media, creating promotional videos (PVs) for anime projects, animating manga panels, developing content for VTubers, and producing concept art or storyboards with an anime aesthetic.',
    },
    {
      id: 6,
      question: 'What video quality and duration can AniSora produce?',
      answer:
        "AniSora aims to produce high-definition (e.g., 1080p) video output suitable for professional use. While specific duration capabilities can evolve, it's generally focused on generating shorter clips ideal for social media, PVs, or segments within larger productions. For the most current specifications, referring to the official Project Index-AniSora documentation is recommended.",
    },
    {
      id: 7,
      question: 'How do I control the style and motion in my videos?',
      answer:
        'AniSora is designed with anime aesthetics at its core. Users can typically guide the visual style and motion through input images and descriptive text prompts. The model leverages its training on diverse anime content to interpret these inputs effectively. Advanced controls may allow for customization of motion type, character consistency, and adherence to specific anime sub-styles, though the exact level of control can vary based on the interface and version used.',
    },
  ];

  return (
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        {/* <Sidebar /> */}
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-6 text-4xl font-bold text-center text-heading md:text-5xl'>
            AniSora
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            The most powerful open-source animated video generation model
            presented by Bilibili. AniSora enables one-click video generation
            across diverse anime styles including series episodes, Chinese
            animations, manga adaptations, VTuber content, anime PVs, and more.
          </p>
        </div>

        <ImageOrTextToVideoConvert
          model={ImageToVideoModel.ANISORA}
          exampleVideoUrl='/images/pages/anisora/example1.webm'
        />
        {/* Examples Section */}
        <div className='py-16'>
          <h2 className='mb-6 text-3xl font-bold text-center text-heading'>
            AniSora AI Anime Video Generation Examples
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground'>
            Explore a variety of AI-generated videos created with Bilibili's
            AniSora. Witness its capability to animate still images into dynamic
            anime and manga scenes, bringing your favorite characters and
            stories to life with smooth, coherent animation and rich detail.
            Discover the power of open-source AI in anime video creation.
          </p>

          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {/* Example 1 */}
            {[
              {
                input: '/images/pages/anisora/example1.webp',
                output: '/images/pages/anisora/example1.webm',
                inputAlt:
                  'The figures in the picture are sitting in a forward moving car waving to the rear, their hair swaying from side to side in the wind',
                outputAlt:
                  'The figures in the picture are sitting in a forward moving car waving to the rear, their hair swaying from side to side in the wind',
                description:
                  'Model: AniSora | Prompt: "The figures in the picture are sitting in a forward moving car waving to the rear, their hair swaying from side to side in the wind"',
              },
              {
                input: '/images/pages/anisora/example2.webp',
                output: '/images/pages/anisora/example2.webm',
                inputAlt:
                  'In the video, five girls dance as the camera zooms in. They sing while raising their left hands overhead, then pulling them down to knee level.',
                outputAlt:
                  'In the video, five girls dance as the camera zooms in. They sing while raising their left hands overhead, then pulling them down to knee level.',
                description:
                  'Model: AniSora | Prompt: "In the video, five girls dance as the camera zooms in. They sing while raising their left hands overhead, then pulling them down to knee level."',
              },
              {
                input: '/images/pages/anisora/example3.webp',
                output: '/images/pages/anisora/example3.webm',
                inputAlt:
                  'In the frame, a person sprints forward at high speed, their motion appearing slightly blurred from the velocity.',
                outputAlt:
                  'In the frame, a person sprints forward at high speed, their motion appearing slightly blurred from the velocity.',
                description:
                  'Model: AniSora | Prompt: "In the frame, a person sprints forward at high speed, their motion appearing slightly blurred from the velocity."',
              },
              {
                input: '/images/pages/anisora/example4.webp',
                output: '/images/pages/anisora/example4.webm',
                inputAlt:
                  "The man on the left presses his lips tightly together, his face etched with fury and resolve. Every line of his expression radiates both profound frustration and unshakable conviction. Meanwhile, the other man's jaw hangs open—poised as if to erupt into a shout or impassioned declaration.",
                outputAlt:
                  "The man on the left presses his lips tightly together, his face etched with fury and resolve. Every line of his expression radiates both profound frustration and unshakable conviction. Meanwhile, the other man's jaw hangs open—poised as if to erupt into a shout or impassioned declaration.",
                description:
                  'Model: AniSora | Prompt: "The man on the left presses his lips tightly together, his face etched with fury and resolve. Every line of his expression radiates both profound frustration and unshakable conviction. Meanwhile, the other man\'s jaw hangs open—poised as if to erupt into a shout or impassioned declaration."',
              },
            ].map(item => (
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='grid grid-cols-2 gap-4 p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-video'>
                      <img
                        src={item.input}
                        alt={item.inputAlt}
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      Input Image
                    </p>
                  </div>
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
          What is AniSora?
        </h2>
        <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
          AniSora is the most powerful open-source animated video generation
          model developed by Bilibili. As part of Project Index-AniSora, it
          represents Bilibili's open-source gift to the anime world. AniSora
          enables one-click video creation across a wide range of anime styles,
          including series episodes, Chinese original animations, manga
          adaptations, VTuber content, anime PVs, and more. It is powered by
          IJCAI'25-accepted research: AniSora — Exploring the Frontiers of
          Animation Video Generation in the Sora Era.
        </p>
        <p className='mb-6 text-center text-muted-foreground'>
          🤗{' '}
          <a
            href='https://huggingface.co/IndexTeam/Index-anisora'
            target='_blank'
            rel='noopener noreferrer nofollow'
            className='text-primary-600 hover:underline'>
            Hugging Face
          </a>
          &nbsp;&nbsp; | &nbsp;&nbsp; 🤖{' '}
          <a
            href='https://www.modelscope.cn/organization/bilibili-index'
            target='_blank'
            rel='noopener noreferrer nofollow'
            className='text-primary-600 hover:underline'>
            Model Scope
          </a>
        </p>
        <div className='flex justify-center'>
          <video
            src='https://github.com/user-attachments/assets/0fe90036-7634-4d98-9a7e-6719d2acdb48'
            controls
            width='60%'
            poster=''></video>
        </div>

        <div className='flex justify-center'>
          <video
            src='https://github.com/user-attachments/assets/c932535b-2c12-4353-9a92-e5f5f6c21cbb'
            controls
            width='60%'
            poster=''></video>
        </div>

        {/* How It Works Section */}
        <div className='pt-16 pb-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use AniSora with KomikoAI
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                step: 1,
                title: 'Upload Your Image',
                content:
                  'Begin by uploading a high-quality reference image you wish to animate into a dynamic video using AniSora AI Video Generator.',
              },
              {
                step: 2,
                title: 'Select Your AI Model',
                content:
                  'Choose from available AI video generation models tailored for various visual styles and video qualities to match your creative vision.',
              },
              {
                step: 3,
                title: 'Generate and Download Video',
                content:
                  "Click the generate button to initiate AniSora's AI-powered video creation. Once processing is complete, preview and download your high-quality AI-generated video for instant use.",
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
                  <p className='text-muted-foreground text-md'>{step.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='my-12 md:my-16'>
          <MoreAITools category='animation' />
        </div>
        {/* Benefits Section */}
        <div className='py-16 bg-gradient-to-b from-background rounded-xl to-primary-100'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            Why use AniSora AI Video Generator?
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            AniSora by Bilibili offers a specialized, open-source approach to AI
            video generation, meticulously tailored for anime, manga and comics
            content. This makes it the ideal tool for creators aiming to
            materialize their artistic visions with AI-powered animation,
            particularly for Japanese anime, Chinese animation, and manga
            adaptations.
          </p>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: 'Specialized for Anime & Manga Styles',
                content:
                  "AniSora's AI models are expertly trained on vast datasets of anime and manga, ensuring high-quality animation that authentically captures the unique visual characteristics and artistic nuances of these beloved styles, including popular manga adaptations.",
                icon: '🌸',
              },
              {
                title: 'Intuitive Interface',
                content:
                  'AniSora provides an intuitive interface, making AI video generation accessible to everyone, regardless of technical expertise. Bring your anime, manga, and VTuber content to life effortlessly with our one-click generation.',
                icon: '🎨',
              },
              {
                title: 'High-Quality Animated Video',
                content:
                  'AniSora supports high-resolution video output, ensuring your AI-generated animated creations, from series episodes to promotional videos, look crisp and professional across all platforms. Share your AI-powered anime and manga videos with confidence.',
                icon: '🌟',
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
        {/* FAQ Section */}
        <div className='py-16'>
          <h2 className='mb-2 text-3xl font-bold text-center text-heading'>
            AniSora AI Video Generator FAQ
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Find answers to common questions about AniSora, the open-source AI
            anime video generator. Learn about its features for creating
            animations, usage tips, and how it can help you bring your stories
            to life, including for VTuber content and manga adaptations.
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
