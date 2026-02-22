import { Toaster } from "react-hot-toast";
import FAQ from "@/components/FAQ";
import PhotoToAnimeConvert from "../PhotoToAnimeConvert";
import { AnimeStyle } from "../../../../api/tools/_constants";
import { MoreAITools } from '@/Components/SEO/MoreAITools';

const faqs = [
  {
    id: 1,
    question: "What makes your AI Doll Generator unique?",
    answer: "Our AI employs advanced generative algorithms to create unique, high-resolution doll designs. Unlike simple avatar creators, we focus on detailed customization, allowing you to specify facial features, clothing styles, and even doll personalities. This results in diverse and imaginative doll concepts suitable for artists, game developers, and collectors."
  },
  {
    id: 3,
    question: "What resolution are the generated AI doll images?",
    answer: "The AI Doll Generator outputs images in stunning 4K resolution (3840x2160 pixels). This high level of detail ensures that every aspect of the doll, from the texture of the clothing to the sparkle in the eyes, is rendered with clarity and precision. Perfect for digital art, 3D printing previews, and high-definition displays."
  },
  {
    id: 4,
    question: "How long does it take to generate an AI doll design?",
    answer: "The AI Doll Generator delivers your custom doll designs in under 60 seconds. Our efficient algorithms rapidly process your input parameters and create a detailed doll image, making it one of the fastest AI doll generators available. Complex designs with numerous accessories may take slightly longer, but the wait is always worth it."
  },
  {
    id: 5,
    question: "Can I use the AI dolls for commercial purposes?",
    answer: "Yes, you can! Our premium plans include a commercial license, allowing you to use the AI-generated dolls in your projects. Whether you're designing a game, creating digital art, or developing a marketing campaign, our AI dolls can be used without copyright concerns. Please review the terms of service for complete details."
  }
];

export default function ToolsPage({ isMobile }: any) {

  return (
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-6 text-4xl font-bold text-center text-heading md:text-5xl'>
            {/* AI Image to Animation Video */}
            AI Doll Generator
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            Transform your personal photos into stunning doll creations with our
            AI Doll Generator. Simply upload your photo, and our advanced AI
            technology will convert it into a beautiful, customizable doll
            design. Perfect for creating unique keepsakes, digital art, or
            personalized gifts. Whether it's a selfie, family photo, or pet
            picture, our AI will transform it into a charming doll with detailed
            features and artistic flair. Experience the magic of seeing yourself
            or your loved ones reimagined as exquisite dolls.
          </p>
        </div>
        <PhotoToAnimeConvert
          selectedStyle='barbie-box'
          exampleImageUrl='/images/pages/ai-doll-generator/barbie-doll.jpeg'
        />
        {/* How It Works Section */}
        <div className='py-16 mt-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use AI Doll Generator
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                step: 1,
                title: 'Upload Your Photo',
                content:
                  "Begin by uploading a clear photo you'd like to transform into a doll. Our AI works best with images that have a well-defined face and good lighting. You can upload photos of yourself, friends, family, or even your pets!",
              },
              {
                step: 2,
                title: 'Select Your Style',
                content:
                  'Choose from our exciting range of styles, including Barbie Doll, Action Figure, Figure Box, and more! Each style offers a unique artistic interpretation of your photo. Experiment and find your favorites!',
              },
              {
                step: 3,
                title: 'Generate and Share',
                content:
                  "Once you're satisfied with your design, generate the final doll image in stunning 4K resolution. Share your creation with friends, use it in your digital art projects, or even 3D print it to create a tangible doll. The possibilities are endless with the AI Doll Generator.",
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

        {/* FAQ Section */}
        <div className='py-16'>
          <h2 className='mb-2 text-3xl font-bold text-center text-heading'>
            AI Doll Generator FAQs
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Everything you need to know about creating custom AI dolls with our
            advanced generator.
          </p>

          <div className='flex justify-center'>
            <div className='max-w-[1000px] w-full'>
              <FAQ faqs={faqs} />
            </div>
          </div>
        </div>

        {/* Examples Section */}
        <div className='py-16'>
          <h2 className='mb-6 text-3xl font-bold text-center text-heading'>
            AI Doll Generator Examples
          </h2>
          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {[
              {
                input: '/images/pages/ai-doll-generator/woman.jpeg',
                output: '/images/pages/ai-doll-generator/barbie-doll.jpeg',
                input_alt: 'woman photo to barbie doll generator',
                output_alt: 'woman photo converted by barbie doll generator',
                type: 'style: Barbie Doll',
              },
              {
                input: '/images/pages/ai-doll-generator/girl.jpg',
                output: '/images/pages/ai-doll-generator/girl_doll_box.webp',
                input_alt: 'girl photo to doll generator',
                output_alt: 'girl photo converted by doll generator',
                type: 'style: Doll Box',
              },
              {
                input: '/images/pages/ai-doll-generator/black_guy.png',
                output: '/images/pages/ai-doll-generator/boy_doll_box.webp',
                input_alt: 'black guy photo to doll generator',
                output_alt: 'black guy photo converted by doll generator',
                type: 'style: Doll Box',
              },
              {
                input: '/images/pages/ai-doll-generator/little_girl.jpeg',
                output:
                  '/images/pages/ai-doll-generator/little_girl_doll_box.webp',
                input_alt: 'little girl photo to doll generator',
                output_alt: 'little girl photo converted by doll generator',
                type: 'style: Doll Box',
              },
            ].map(item => (
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='grid grid-cols-2 gap-4 p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-video'>
                      <img
                        src={item.input}
                        alt={item.input_alt}
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      Input Image
                    </p>
                  </div>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-video'>
                      <img
                        src={item.output}
                        alt={item.output_alt}
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      Conversion Result
                    </p>
                  </div>
                </div>
                <div className='p-4 bg-primary-50 h-[56px] border-box'>
                  <p className='h-full font-medium capitalize text-primary-600'>
                    {item.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className='py-16 bg-gradient-to-b from-white rounded-xl to-primary-100'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            Why Use the AI Doll Generator
          </h2>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: '✨ Endless Customization',
                content:
                  'Design dolls with unique facial features, hairstyles, clothing, and accessories. Create dolls that reflect your personal style and vision.',
              },
              {
                title: '🎨 High-Quality Art',
                content:
                  'Generate stunning, high-resolution doll images that are perfect for digital art, 3D printing previews, and sharing with friends.',
              },
              {
                title: '🚀 Fast and Efficient',
                content:
                  'Create your dream dolls in seconds with our AI-powered generator. Spend less time waiting and more time creating.',
              },
            ].map(feature => (
              <div
                key={feature.title}
                className='p-6 bg-card rounded-xl border border-primary-100 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                <div className='flex items-center mb-4'>
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
          <MoreAITools category='illustration' />
        </div>
      </div>
    </div>
  );
}
