import React from 'react';
import FAQ from '@/components/FAQ';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import ImageOrTextToVideoConvert from './ImageOrTextToVideoConvert';
import { ImageToVideoModel } from '../../../api/tools/_zaps';
export default function ToolsPage() {
  const localizedFaqs = [
    {
      id: 1,
      question: 'What is Sora 2 Video Generator?',
      answer:
        'Sora 2 Video Generator is an AI tool that transforms text prompts and images into high-quality videos using advanced artificial intelligence technology. Our Sora 2 Video Generator enables users to create professional video content quickly and easily for marketing, social media, education, and entertainment purposes.',
    },
    {
      id: 2,
      question: 'How to use Sora 2 Video Generator?',
      answer:
        'Using Sora 2 Video Generator is simple! First, upload your image or enter a detailed text prompt, then select your preferred AI video model, and finally click generate to create your video with Sora 2 Video Generator.',
    },
    {
      id: 3,
      question: 'How does Sora 2 Video Generator work?',
      answer:
        'Sora 2 Video Generator uses advanced AI technology to analyze your input text or images and generate high-quality videos. It works by processing your content through sophisticated neural networks trained on vast video datasets to create realistic and professional video output.',
    },
    {
      id: 4,
      question: 'What is the best Sora 2 Video Generator?',
      answer:
        "KomikoAI provides the best Sora 2 Video Generator tool. Our goal is to be the leading AI creation platform by delivering professional-quality results, powerful and fun customization, and an intuitive workflow—completely free to try. With KomikoAI's Sora 2 Video Generator, you can create stunning videos from text and images, making it perfect for users who need professional video content quickly.",
    },
    {
      id: 5,
      question: 'Is the KomikoAI Sora 2 Video Generator free online?',
      answer:
        'Yes, you can test out the Sora 2 Video Generator on KomikoAI for free, without having to sign up to any subscription. Try our Sora 2 Video Generator today!',
    },
    {
      id: 6,
      question: 'What can I do with Sora 2 Video Generator?',
      answer:
        'You can use Sora 2 Video Generator on KomikoAI to create marketing videos, social media content, educational videos, promotional materials, product demonstrations, and entertainment content from simple text descriptions or images.',
    },
    {
      id: 7,
      question: 'Can I use Sora 2 Video Generator on my phone?',
      answer:
        'Yes, you can use Sora 2 Video Generator as a web app on different devices, including smartphones and computers, making it convenient for everyone to create AI videos anywhere.',
    },
    {
      id: 8,
      question: 'Can I download my generation from Sora 2 Video Generator?',
      answer:
        "Yes, KomikoAI's Sora 2 Video Generator allows you to export your generation in various formats, such as MP4, WebM, and other popular video formats, for easy sharing and use across different platforms.",
    },
    {
      id: 9,
      question: 'Why should I use Sora 2 Video Generator?',
      answer:
        'Using Sora 2 Video Generator can save you time and money while creating professional-quality videos. Our Sora 2 Video Generator allows you to generate high-quality video content from simple text descriptions or images, making it perfect for content creators, marketers, and businesses who need professional videos quickly and efficiently.',
    },
  ];

  return (
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        {/* <Sidebar /> */}
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-6 text-4xl font-bold text-center text-heading md:text-5xl'>
            Sora 2 Video Generator - AI Video Creation Tool
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            The most advanced Sora 2 Video Generator for creating high-quality
            AI videos from text and images. Our Sora 2 Video Generator uses
            cutting-edge AI technology to transform your ideas into professional
            video content. Experience the power of Sora 2 Video Generator for
            free and create stunning videos in minutes with our AI-powered Sora
            2 Video Generator tool.
          </p>
        </div>

        <ImageOrTextToVideoConvert
          model={ImageToVideoModel.SORA}
          exampleVideoUrl='/images/pages/anisora/example1.webm'
        />
        {/* Examples Section */}
        <div className='py-16'>
          <h2 className='mb-6 text-3xl font-bold text-center text-heading'>
            Sora 2 Video Generator Examples
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground'>
            Explore stunning Sora 2 Video Generator examples showcasing the
            power of our AI video creation tool. These Sora 2 Video Generator
            examples demonstrate how our advanced AI technology transforms text
            prompts and images into high-quality videos. Discover the
            capabilities of Sora 2 Video Generator through these impressive
            video generation examples.
          </p>

          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {/* Example 1 */}
            {[
              {
                input: '/images/pages/sora-2-video-generator/man.webp',
                output: '/images/pages/sora-2-video-generator/man.webm',
                inputAlt: 'man',
                outputAlt: 'man',
                description:
                  'Model: Sora 2 | Prompt: "A man is fighting with others in a house"',
              },
              {
                input: '/images/pages/sora-2-video-generator/dog.webp',
                output: '/images/pages/sora-2-video-generator/dog.webm',
                inputAlt: 'dog',
                outputAlt: 'dog',
                description:
                  'Model: Sora 2 | Prompt: "An exhausted, human-sized dog working the register at a fast food joint, fur matted and greasy, eyes glazed over with the weariness of serving humans."',
              },
              {
                input: '/images/pages/sora-2-video-generator/cat.webp',
                output: '/images/pages/sora-2-video-generator/cat.webm',
                inputAlt: 'cat',
                outputAlt: 'cat',
                description:
                  'Model: Sora 2 | Prompt: "A cat is running to the camera"',
              },
              {
                input: '/images/pages/sora-2-video-generator/computer.webp',
                output: '/images/pages/sora-2-video-generator/computer.webm',
                inputAlt: 'computer',
                outputAlt: 'computer',
                description:
                  'Model: Sora 2 | Prompt: "A man is typing on a computer"',
              },
            ].map((item, index) => (
              <div
                key={index}
                className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl justify-between'>
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
          What is Sora 2 Video Generator?
        </h2>
        <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
          Sora 2 Video Generator is the most advanced AI video creation tool
          that transforms text prompts and images into high-quality videos. Our
          Sora 2 Video Generator uses cutting-edge artificial intelligence
          technology to generate professional video content from simple text
          descriptions. With Sora 2 Video Generator, you can create stunning
          videos for marketing, social media, education, and entertainment
          purposes. The Sora 2 Video Generator represents the next generation of
          AI video creation technology.
        </p>
        <p className='mb-6 text-center text-muted-foreground'>
          🚀 Experience the power of Sora 2 Video Generator with KomikoAI - the
          leading AI video creation platform
        </p>
        <div className='flex justify-center mb-8'>
          <p className='max-w-2xl text-center text-muted-foreground'>
            Watch how Sora 2 Video Generator transforms simple prompts into
            professional video content using advanced AI technology. Our Sora 2
            Video Generator delivers exceptional results for creators worldwide.
          </p>
        </div>

        {/* How It Works Section */}
        <div className='pt-16 pb-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use The Sora 2 Video Generator
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                step: 1,
                title: 'Upload Your Image or Enter Text',
                content:
                  'Begin by uploading a high-quality reference image or entering a detailed text prompt to create videos with Sora 2 Video Generator. Our AI video creation tool accepts both images and text descriptions.',
              },
              {
                step: 2,
                title: 'Select Your AI Video Model',
                content:
                  'Choose from our advanced Sora 2 Video Generator models optimized for different video styles and qualities. Each Sora 2 Video Generator model is designed to deliver professional results.',
              },
              {
                step: 3,
                title: 'Generate and Download Video',
                content:
                  "Click the generate button to activate Sora 2 Video Generator's AI-powered video creation process. Once your Sora 2 Video Generator completes processing, preview and download your high-quality AI-generated video instantly.",
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
        <div className='py-16 bg-gradient-to-b from-white rounded-xl to-primary-100'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            Why Use The Sora 2 Video Generator?
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Sora 2 Video Generator offers the most advanced AI video creation
            technology, specifically designed for generating high-quality videos
            from text and images. Our Sora 2 Video Generator makes it easy for
            creators, marketers, and businesses to produce professional video
            content quickly and efficiently with cutting-edge AI technology.
          </p>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: 'Advanced AI Video Technology',
                content:
                  'Sora 2 Video Generator uses state-of-the-art artificial intelligence models trained on vast video datasets, ensuring high-quality video generation that captures realistic movements, lighting, and visual effects for professional-grade results.',
                icon: '🤖',
              },
              {
                title: 'User-Friendly Interface',
                content:
                  'Sora 2 Video Generator provides an intuitive interface that makes AI video creation accessible to everyone, regardless of technical expertise. Create professional videos with our easy-to-use Sora 2 Video Generator in just a few clicks.',
                icon: '🎨',
              },
              {
                title: 'High-Quality Video Output',
                content:
                  'Sora 2 Video Generator supports high-resolution video output, ensuring your AI-generated videos look crisp and professional across all platforms. Share your Sora 2 Video Generator creations with confidence knowing they meet professional standards.',
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
            Sora 2 Video Generator FAQ
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Find answers to common questions about Sora 2 Video Generator, the
            advanced AI video creation tool. Learn about Sora 2 Video Generator
            features, usage tips, and how our AI technology can help you create
            professional videos from text and images.
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
