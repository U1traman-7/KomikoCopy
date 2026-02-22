import React from "react";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import FAQ from "@/components/FAQ";
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import ImageOrTextToVideoConvert from './ImageOrTextToVideoConvert';
import { ImageToVideoModel } from "../../../api/tools/_zaps";

export default function ToolsMagiPage({ isMobile }: any) {
  const { t } = useTranslation(['image-animation-generator', 'toast']);

  const localizedFaqs = [
    {
      id: 1,
      question: "What is Magi-1 Video Generator?",
      answer: "Magi-1 is an advanced open-source autoregressive video generation model that creates high-quality videos by processing content chunk-by-chunk. It transforms text prompts or images into dynamic videos with exceptional temporal consistency and natural motion."
    },
    {
      id: 2,
      question: "How does Magi-1's autoregressive approach differ from other video generators?",
      answer: "Unlike traditional video generators that process entire videos at once, Magi-1 generates videos chunk-by-chunk in an autoregressive manner. This enables unlimited video extension, superior temporal consistency, and one-second precision control—features not commonly found in other generators."
    },
    {
      id: 3,
      question: "What types of video generation does Magi-1 support?",
      answer: "Magi-1 supports multiple generation workflows including image-to-video (I2V), text-to-video (T2V), and video-to-video (V2V) expansion. These versatile options allow for creative flexibility in how you produce and extend video content."
    },
    {
      id: 4,
      question: "Is Magi-1 suitable for animation and artistic content creation?",
      answer: "Absolutely. Magi-1 excels at creating visually consistent animations with natural motion, making it ideal for bringing artistic content to life. Its temporal consistency ensures characters and scenes maintain their integrity throughout the video."
    },
    {
      id: 5,
      question: "What are the primary use cases for Magi-1?",
      answer: "Magi-1 is perfect for content creation, storytelling, marketing videos, concept visualization, and extending existing video content. Its unlimited extension capability makes it particularly valuable for creating longer narrative sequences."
    },
    {
      id: 6,
      question: "What video quality can Magi-1 produce?",
      answer: "Magi-1 generates high-resolution videos with impressive temporal consistency. The output quality depends on the model variant used, with options available to balance between quality and computational requirements."
    },
    {
      id: 7,
      question: "How do I control the style and motion in Magi-1 generated videos?",
      answer: "You can influence style and motion through detailed prompts, reference images, and parameter adjustments. Magi-1's one-second precision control allows for fine-tuning of motion dynamics and scene transitions throughout your video."
    }
  ];

  return (
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-6 text-4xl font-bold text-center text-heading md:text-5xl'>
            Magi-1 Video Generator
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            Transform your creative vision with Magi-1, the revolutionary
            open-source autoregressive video generator. Convert images or text
            prompts into stunning high-resolution videos with unlimited
            extension capabilities and one-second precision control. Experience
            professional-quality video generation with seamless temporal
            consistency and natural motion—all accessible through an intuitive
            interface.
          </p>
        </div>

        <ImageOrTextToVideoConvert
          model={ImageToVideoModel.MAGI_1}
          exampleVideoUrl='/images/pages/magi/dancer.webm'
        />
        <h2 className='pt-16 mt-16 mb-4 text-3xl font-bold text-center text-heading'>
          What is Magi-1 Video Generator?
        </h2>
        <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
          Magi-1 is a cutting-edge open-source autoregressive video generation
          model that creates high-fidelity videos by processing content
          chunk-by-chunk rather than all at once. Leveraging advanced
          Transformer-based VAE technology and Diffusion Transformer
          architecture, Magi-1 delivers exceptional temporal consistency,
          natural motion, and the unique ability to extend videos indefinitely,
          making professional video creation accessible to everyone.
        </p>
        {/* Examples Section */}
        <div className='py-16'>
          <h2 className='mb-6 text-3xl font-bold text-center text-heading'>
            Magi-1 Video Generator Examples
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground'>
            Discover the impressive capabilities of Magi-1 through our showcase
            of autoregressive video generations. See how still images transform
            into flowing animations with remarkable temporal consistency and
            natural motion. Witness the power of chunk-by-chunk generation that
            brings characters and scenes to life with unparalleled quality and
            seamless transitions.
          </p>

          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {/* Example 1 */}
            {[
              {
                input: '/images/pages/magi/dancer.webp',
                output: '/images/pages/magi/dancer.webm',
                inputAlt: 'Anime dancer with a blue background',
                outputAlt:
                  'Silhouette against turquoise moon, city skyline. Camera zooms from wide shot to close-up as figure slowly dances with flowing movements. Dark silhouette contrasts with glowing blue moon.',
                description:
                  'Model: Magi-1 | Prompt: "Silhouette against turquoise moon, city skyline. Camera zooms from wide shot to close-up as figure slowly dances with flowing movements."',
              },
              {
                input: '/images/pages/magi/festival.webp',
                output: '/images/pages/magi/festival.webm',
                inputAlt: 'Holi festival crowd with raised arms.',
                outputAlt:
                  'Holi festival crowd with raised arms. Colorful confetti and streamers falling from above. Golden sunlight filtering through vibrant powder clouds.',
                description:
                  'Model: Magi-1 | Prompt: "Holi festival crowd with raised arms. Colorful confetti and streamers falling from above. Golden sunlight filtering through vibrant powder clouds."',
              },
              {
                input: '/images/pages/magi/crystal.webp',
                output: '/images/pages/magi/crystal.webm',
                inputAlt:
                  'Geometric crystal refracting light into rainbow prisms. Metallic surfaces catching and scattering colored light beams',
                outputAlt:
                  'Geometric crystal slowly rotating against black background, refracting light into rainbow prisms. Metallic surfaces catching and scattering colored light beams',
                description:
                  'Model: Magi-1 | Prompt: "Geometric crystal slowly rotating against black background, refracting light into rainbow prisms. Metallic surfaces catching and scattering colored light beams"',
              },
              {
                input: '/images/pages/magi/bird.webp',
                output: '/images/pages/magi/bird.webm',
                inputAlt: 'Majestic eagle in the sky',
                outputAlt:
                  'Majestic eagle soaring from right to left against bright white sky. Wingspan stretched wide, feathers subtly moving with air currents. Detailed silhouette with sunlight highlighting wing edges.',
                description:
                  'Model: Magi-1 | Prompt: "Majestic eagle soaring from right to left against bright white sky. Wingspan stretched wide, feathers subtly moving with air currents. Detailed silhouette with sunlight highlighting wing edges."',
              },
            ].map(item => (
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='grid grid-cols-2 gap-4 p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-video'>
                      <img
                        src={item.input}
                        alt={item.inputAlt}
                        className='object-cover w-full h-full'
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
                        className='object-cover w-full h-full'>
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
        <div className='py-16 bg-gradient-to-b from-background rounded-xl to-primary-100'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            Why use Magi-1 Video Generator?
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Magi-1 offers a revolutionary approach to AI video generation,
            utilizing autoregressive technology to create high-quality,
            temporally consistent videos with unlimited extension capabilities.
            Perfect for creators, developers, and enthusiasts looking to
            transform static images into dynamic video content.
          </p>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: 'Unlimited Video Extension',
                content:
                  "Magi-1's autoregressive architecture enables unlimited video extension, allowing for seamless continuation of scenes and comprehensive storytelling with consistent quality throughout.",
                icon: '🎬',
              },
              {
                title: 'One-Second Precision Control',
                content:
                  "Enjoy precise temporal control with Magi-1's one-second accuracy feature, enabling detailed management of scene transitions and narrative progression in your generated videos.",
                icon: '⏱️',
              },
              {
                title: 'High-Resolution Output',
                content:
                  "Generate professional-quality videos with Magi-1's impressive resolution capabilities, ensuring your content looks crisp and detailed across all viewing platforms.",
                icon: '✨',
              },
              {
                title: 'Temporal Consistency',
                content:
                  "Experience superior temporal consistency with Magi-1's chunk-by-chunk processing, eliminating jarring transitions and ensuring smooth, natural motion throughout your videos.",
                icon: '🔄',
              },
              {
                title: 'Multiple Generation Options',
                content:
                  'Magi-1 supports various generation workflows including image-to-video, text-to-video, and even video-to-video expansion, providing versatile creative possibilities.',
                icon: '🔀',
              },
              {
                title: 'Open-Source Accessibility',
                content:
                  "Benefit from Magi-1's open-source framework, allowing for community improvements, customizations, and transparent development of this powerful video generation technology.",
                icon: '🌐',
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

        {/* How It Works Section */}
        <div className='pt-16 pb-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use Magi-1 Video Generator
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4'>
            {[
              {
                step: 1,
                title: 'Upload Your Image',
                content:
                  "Start by uploading a high-quality reference image you want to transform into a dynamic video using the Magi-1 Video Generator's image-to-video capabilities.",
              },
              {
                step: 2,
                title: 'Select Your AI Model',
                content:
                  'Browse through the available autoregressive video generation models optimized for different visual styles and quality levels to best match your creative requirements.',
              },
              {
                step: 3,
                title: 'Choose Aspect Ratio',
                content:
                  'Specify your preferred aspect ratio, such as 16:9 or 9:16, to ensure your Magi-1 generated video is perfectly formatted for platforms like YouTube, Instagram, or TikTok.',
              },
              {
                step: 4,
                title: 'Generate and Download Video',
                content:
                  'Initiate the autoregressive generation process with a single click. Once the chunk-by-chunk processing completes, preview your high-resolution video with seamless temporal consistency before downloading it for immediate use.',
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

        {/* FAQ Section */}
        <div className='py-16'>
          <h2 className='mb-2 text-3xl font-bold text-center text-heading'>
            Magi-1 Video Generator FAQ
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Explore common questions about Magi-1 Video Generator, including its
            features, capabilities, and how it can revolutionize your video
            creation process with autoregressive generation technology.
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
