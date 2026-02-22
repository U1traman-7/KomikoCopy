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
      question: "What is FramePack AI Video Generator?",
      answer: "FramePack is an innovative AI-driven video generation system that uses next-frame prediction neural networks to create high-quality videos progressively. It compresses input frame contexts into a fixed size, enabling efficient video generation on consumer-grade GPUs with as little as 6GB VRAM.",
    },
    {
      id: 2,
      question: "How does FramePack differ from traditional video AI models?",
      answer: "Unlike traditional video diffusion models that require processing all previous frames causing increasing memory and computation demands, FramePack uses constant-length context compression. This means the workload remains the same regardless of video length, allowing generation of long videos without additional GPU memory overhead.",
    },
    {
      id: 3,
      question: "What are the key features of FramePack AI Video Generator?",
      answer: [
        "Next-frame prediction architecture that generates videos frame-by-frame progressively.",
        "Fixed-length temporal context compression to keep GPU memory usage constant.",
        "Capability to run large 13-billion parameter models on laptops with 6GB VRAM.",
        "Progressive video generation with immediate visual feedback during rendering.",
        "Advanced techniques like bidirectional sampling to reduce video drifting and improve coherence.",
        "Compatibility with popular AI video frameworks like Gradio and ComfyUI for easy setup.",
      ],
    },
    {
      id: 7,
      question: "What models does FramePack support?",
      answer: "FramePack currently runs custom Hunyuan video models and supports fine-tuning of existing pre-trained models for video generation tasks.",
    },
    {
      id: 8,
      question: "Why choose FramePack for AI video generation?",
      answer: (
        <div>
          <p>FramePack revolutionizes AI video creation by combining efficiency, accessibility, and quality:</p>
          <li>Runs on modest hardware with low VRAM requirements.</li>
          <li>Generates videos progressively, allowing users to see results as they render.</li>
          <li>Maintains video clarity and coherence over long sequences using advanced sampling techniques.</li>
        </div>
      ),
    },
  ];

  return (
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-6 text-4xl font-bold text-center text-heading md:text-5xl'>
            FramePack AI Video Generator
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            Harness the power of next-frame prediction neural networks with
            FramePack, a cutting-edge AI video generator that enables you to
            create high-quality, long-duration videos locally on your laptop or
            desktop. Experience seamless video diffusion with constant memory
            usage and real-time progressive rendering, all without the need for
            expensive GPUs.
          </p>
        </div>

        <ImageOrTextToVideoConvert
          model={ImageToVideoModel.FRAME_PACK}
          exampleVideoUrl='/images/pages/frame-pack-ai-video-generator/woman.webm'
        />
        <h2 className='pt-16 mt-16 mb-4 text-3xl font-bold text-center text-heading'>
          What is FramePack AI Video Generator?
        </h2>
        <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
          FramePack is a revolutionary AI video generation framework that
          leverages next-frame prediction models to produce videos
          progressively. Its unique architecture compresses temporal context
          into a fixed-length representation, drastically reducing GPU memory
          requirements and enabling generation of long, coherent video clips on
          consumer-grade hardware with as little as 6GB of VRAM.
        </p>

        {/* How It Works Section */}
        <div className='pt-16 pb-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use FramePack AI Video Generator
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4'>
            {[
              {
                step: 1,
                title: 'Upload Your Image',
                content:
                  'Start by uploading a high-quality reference image that you want to transform into a dynamic video using FramePack AI Video Generator.',
              },
              {
                step: 2,
                title: 'Select Your AI Model',
                content:
                  'Choose from available AI video generation models optimized for different styles and video qualities to best suit your creative needs.',
              },
              {
                step: 3,
                title: 'Choose Aspect Ratio',
                content:
                  'Pick the desired aspect ratio such as 16:9, 9:16 to tailor your FramePack video for various platforms like YouTube, Instagram, or TikTok.',
              },
              {
                step: 4,
                title: 'Generate and Download Video',
                content:
                  "Click the generate button to start FramePack's AI-powered video creation. Once complete, preview and download your high-quality AI-generated video for immediate use.",
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

        {/* Examples Section */}
        <div className='py-16'>
          <h2 className='mb-6 text-3xl font-bold text-center text-heading'>
            FramePack AI Video Generator Examples
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground'>
            Explore a variety of AI-generated videos created with FramePack,
            showcasing its ability to animate still images into smooth, coherent
            video clips with rich detail and motion fidelity.
          </p>

          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {/* Example 1 */}
            {[
              {
                input: '/images/pages/frame-pack-ai-video-generator/woman.webp',
                output:
                  '/images/pages/frame-pack-ai-video-generator/woman.webm',
                inputAlt:
                  'The girl dances gracefully, with clear movements, full of charm.',
                outputAlt:
                  'The girl dances gracefully, with clear movements, full of charm.',
                description:
                  'Model: FramePack | Prompt: "The girl dances gracefully, with clear movements, full of charm."',
              },
              {
                input: '/images/pages/frame-pack-ai-video-generator/girl.webp',
                output: '/images/pages/frame-pack-ai-video-generator/girl.webm',
                inputAlt:
                  'The girl suddenly took out a sign that said “cute” using right hand',
                outputAlt:
                  'The girl suddenly took out a sign that said “cute” using right hand',
                description:
                  'Model: FramePack | Prompt: "The girl suddenly took out a sign that said “cute” using right hand"',
              },
              {
                input:
                  '/images/pages/frame-pack-ai-video-generator/woman_board.jpeg',
                output:
                  '/images/pages/frame-pack-ai-video-generator/woman_board.webm',
                inputAlt:
                  'The girl skateboarding, repeating the endless spinning and dancing and jumping on a skateboard, with clear movements, full of charm.',
                outputAlt:
                  'The girl skateboarding, repeating the endless spinning and dancing and jumping on a skateboard, with clear movements, full of charm.',
                description:
                  'Model: FramePack | Prompt: "The girl skateboarding, repeating the endless spinning and dancing and jumping on a skateboard, with clear movements, full of charm."',
              },
              {
                input: '/images/pages/frame-pack-ai-video-generator/fox.webp',
                output: '/images/pages/frame-pack-ai-video-generator/fox.webm',
                inputAlt:
                  'The girl dances gracefully, with clear movements, full of charm.',
                outputAlt:
                  'The girl dances gracefully, with clear movements, full of charm.',
                description:
                  'Model: FramePack | Prompt: "The girl dances gracefully, with clear movements, full of charm."',
              },
            ].map(item => (
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='grid grid-cols-2 gap-4 p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg'>
                      <img
                        src={item.input}
                        alt={item.inputAlt}
                        className='object-contain w-full h-[480px]'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      Input Image
                    </p>
                  </div>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg'>
                      <video
                        src={item.output}
                        controls
                        autoPlay
                        playsInline
                        loop
                        muted
                        className='object-contain w-full h-[480px]'>
                        Output Video
                      </video>
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      Output Video
                    </p>
                  </div>
                </div>
                <div className='p-4 bg-primary-50 min-h-[80px]'>
                  <p className='font-medium text-primary-600'>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className='py-16 bg-gradient-to-b from-background rounded-xl to-primary-100'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            Why use FramePack AI Video Generator?
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            FramePack offers a breakthrough in AI video generation technology,
            making it accessible, efficient, and powerful for creators,
            developers, and hobbyists alike.
          </p>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: 'Efficient GPU Memory Usage',
                content:
                  'Fixed-length context compression ensures constant GPU memory usage, allowing long video generation on modest hardware.',
                icon: '🧠',
              },
              {
                title: 'Progressive Video Rendering',
                content:
                  'Watch your video come to life frame-by-frame with real-time preview and control over the generation process.',
                icon: '🎥',
              },
              {
                title: 'High-Quality Video Output',
                content:
                  'Advanced sampling and prediction techniques maintain video coherence and reduce artifacts for stunning results.',
                icon: '✨',
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
            FramePack AI Video Generator FAQ
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Find answers to the most common questions about FramePack AI Video
            Generator, including setup, features, and usage tips.
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
