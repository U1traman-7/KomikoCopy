import React from "react";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import FAQ from "@/components/FAQ";
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import ImageOrTextToVideoConvert from './ImageOrTextToVideoConvert';
import { ImageToVideoModel } from "../../../api/tools/_zaps";

export default function ToolsPage({ isMobile }: any) {
  const { t } = useTranslation(['image-animation-generator', 'toast']);

  const localizedFaqs = [
    {
      id: 1,
      question: "What is Vidu Q1 Video Generator?",
      answer: "Vidu Q1 is a next-generation AI video generator that creates high-definition, cinematic videos from text prompts or images. It features advanced motion consistency, expressive animation, and integrated audio production."
    },
    {
      id: 2,
      question: "How does Vidu Q1 differ from other AI video generators?",
      answer: "Unlike traditional tools, Vidu Q1 combines ultra-realistic visual effects, seamless transitions, and studio-quality sound generation in a single workflow—delivering professional results without the need for external plugins or VFX teams."
    },
    {
      id: 3,
      question: "Can Vidu Q1 generate both video and audio?",
      answer: "Yes, Vidu Q1 synthesizes high-fidelity audio—including background music and sound effects—directly from text prompts, allowing precise control over timing and layering of audio tracks."
    },
    {
      id: 4,
      question: "Is Vidu Q1 suitable for anime and animation creators?",
      answer: "Absolutely. Vidu Q1 is optimized for consistent, on-model character animation and expressive motion, making it ideal for anime, manga, and animated storytelling."
    },
    {
      id: 5,
      question: "What are the main use cases for Vidu Q1?",
      answer: "Vidu Q1 is perfect for creating AI-generated short films, video ads, animated portraits, storyboards, and concept art—enabling creators to experiment with new storytelling formats and cinematic effects."
    },
    {
      id: 6,
      question: "What video quality and duration can Vidu Q1 produce?",
      answer: "Vidu Q1 generates up to 5-second video clips at 1080p resolution, delivering crisp, detailed visuals and smooth, cinematic motion."
    },
    {
      id: 7,
      question: "How do I control the style and motion in my videos?",
      answer: "You can customize visual style, motion type, video length, aspect ratio, and audio layers directly from the intuitive interface, ensuring each video matches your creative intent."
    }];

  return (
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-6 text-4xl font-bold text-center text-heading md:text-5xl'>
            Vidu Q1 Video Generator
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            Unlock cinematic video creation with Vidu Q1, the next-generation AI
            video generator. Transform text prompts or images into
            ultra-realistic, high-definition videos with seamless motion,
            expressive animation, and synchronized sound effects. Experience
            professional-grade video and audio production—no advanced hardware
            or technical expertise required
          </p>
        </div>

        <ImageOrTextToVideoConvert
          model={ImageToVideoModel.VIDU}
          exampleVideoUrl='/images/pages/vidu/flower.webm'
        />
        <h2 className='pt-16 mt-16 mb-4 text-3xl font-bold text-center text-heading'>
          What is Vidu Q1 Video Generator?
        </h2>
        <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
          Vidu Q1 is a state-of-the-art AI video generation tool that empowers
          creators to produce high-fidelity, 1080p videos with cinematic
          transitions, consistent characters, and immersive sound—all from
          simple text or image inputs. Leveraging advanced semantic
          understanding and “First-to-Last Frame” technology, Vidu Q1 delivers
          smooth, coherent motion and studio-quality audio, making full-scale
          video production accessible to everyone
        </p>

        {/* How It Works Section */}
        <div className='pt-16 pb-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use Vidu Q1 Video Generator
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4'>
            {[
              {
                step: 1,
                title: 'Upload Your Image',
                content:
                  'Begin by uploading a high-quality reference image you wish to animate into a dynamic video using Vidu Q1 Video Generator.',
              },
              {
                step: 2,
                title: 'Select Your AI Model',
                content:
                  'Choose from available AI video generation models tailored for various visual styles and video qualities to match your creative vision.',
              },
              {
                step: 3,
                title: 'Choose Aspect Ratio',
                content:
                  'Select the desired aspect ratio, such as 16:9 or 9:16, to optimize your Vidu Q1 video for platforms like YouTube, Instagram, or TikTok.',
              },
              {
                step: 4,
                title: 'Generate and Download Video',
                content:
                  'Click the generate button to initiate Vidu Q1’s AI-powered video creation. Once processing is complete, preview and download your high-quality AI-generated video for instant use.',
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
                  <p className='  text-muted-foreground text-md'>{step.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Examples Section */}
        <div className='py-16'>
          <h2 className='mb-6 text-3xl font-bold text-center text-heading'>
            Vidu Q1 Video Generator Examples
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground'>
            Explore a variety of AI-generated videos created with Vidu Q1,
            showcasing its ability to animate still images into dynamic anime
            and manga scenes. Witness the power of AI in bringing your favorite
            characters and stories to life with smooth, coherent animation and
            rich detail.
          </p>

          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {/* Example 1 */}
            {[
              {
                input: '/images/pages/vidu/flower.webp',
                output: '/images/pages/vidu/flower.webm',
                inputAlt: 'A fairy sits in the blossom as the petals open',
                outputAlt: 'A fairy sits in the blossom as the petals open',
                description:
                  'Model: Vidu Q1 | Prompt: "A fairy sits in the blossom as the petals open"',
              },
              {
                input: '/images/pages/vidu/cat.webp',
                output: '/images/pages/vidu/cat.webm',
                inputAlt: 'A cat turns into a tiger',
                outputAlt: 'A cat turns into a tiger',
                description:
                  'Model: Vidu Q1 | Prompt: "A cat turns into a tiger"',
              },
              {
                input: '/images/pages/vidu/man_sword.webp',
                output: '/images/pages/vidu/man_sword.webm',
                inputAlt: 'A man slowly draws his sword',
                outputAlt: 'A man slowly draws his sword',
                description:
                  'Model: Vidu Q1 | Prompt: "A man slowly draws his sword"',
              },
              {
                input: '/images/pages/vidu/man.webp',
                output: '/images/pages/vidu/man.webm',
                inputAlt:
                  'The camera quickly zooms in on the man from a distance',
                outputAlt:
                  'The camera quickly zooms in on the man from a distance',
                description:
                  'Model: Vidu Q1 | Prompt: "The camera quickly zooms in on the man from a distance"',
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

        <div className='my-12 md:my-16'>
          <MoreAITools category='animation' />
        </div>
        {/* Benefits Section */}
        <div className='py-16 bg-gradient-to-b from-white rounded-xl to-primary-100'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            Why use Vidu Q1 Video Generator?
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Vidu Q1 offers a specialized approach to AI video generation,
            tailored specifically for anime, manga, comics, and manhwa content.
            Making it the ideal tool for creators, developers, and hobbyists
            looking to bring their artistic visions to life with AI-powered
            animation.
          </p>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: 'Specialized for Anime & Manga',
                content:
                  "Vidu Q1's AI models are trained on vast datasets of anime and manga, ensuring high-quality animation that respects the unique characteristics of these styles.",
                icon: '🌸',
              },
              {
                title: 'Easy-to-Use Interface',
                content:
                  'Vidu Q1 offers an intuitive interface that makes AI video generation accessible to everyone, regardless of their technical expertise. Bring your anime and manga to life with ease.',
                icon: '🎨',
              },
              {
                title: 'High-Quality Video Output',
                content:
                  'Vidu Q1 supports high-resolution video output, ensuring your animated creations look crisp and professional across various platforms. Share your AI-powered anime and manga videos with confidence.',
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
            Vidu Q1 Video Generator FAQ
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Find answers to the most common questions about Vidu Q1, including
            its features, usage tips, and how it can help you bring your anime,
            manga, and comic creations to life with AI-powered animation.
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
