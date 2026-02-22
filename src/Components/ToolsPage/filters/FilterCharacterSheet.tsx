import { Toaster } from "react-hot-toast";
import FAQ from "@/components/FAQ";
import PhotoToAnimeConvert from "../PhotoToAnimeConvert";
import { AnimeStyle } from "../../../../api/tools/_constants";
import { MoreAITools } from '@/Components/SEO/MoreAITools';

const faqs = [
  {
    id: 1,
    question: "What makes your AI Character Sheet Generator unique?",
    answer: "Our AI Character Sheet Generator is designed to streamline character creation by transforming a single image into multiple poses, enhancing visualization for storytelling and animation. It supports both cartoon and 3D character styles, providing a comprehensive visual representation crucial for game design and animation projects."
  },
  {
    id: 3,
    question: "What resolution are the generated character sheet images?",
    answer: "We output high-resolution images suitable for professional use, ensuring clarity and detail in every pose. This is ideal for animators, game developers, and comic artists who need precise visual references."
  },
  {
    id: 4,
    question: "How long does it take to generate a character sheet?",
    answer: "Most conversions complete in under 30 seconds thanks to our optimized AI algorithms. Complex designs with multiple poses may take up to 1 minute. You'll receive notifications when your character sheets are ready."
  },
  {
    id: 5,
    question: "Can I use these character sheets for commercial projects?",
    answer: "Yes! Our Premium plans include commercial licenses for use in animation, game development, and other professional applications."
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
            AI Character Sheet Generator
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            Effortlessly produce comprehensive character sheets from a single
            image using our cutting-edge AI technology. Ideal for game
            developers, animators, and illustrators looking to ensure
            consistency and depth in their character visuals. Dive in and
            explore the possibilities for bringing your characters to life!
          </p>
        </div>

        <PhotoToAnimeConvert
          selectedStyle='character-sheet'
          exampleImageUrl='/images/pages/ai-character-sheet-generator/character_sheet.jpeg'
        />

        {/* FAQ Section */}
        <div className='py-16'>
          <h2 className='mb-2 text-3xl font-bold text-center text-heading'>
            AI Character Sheet Generator FAQs
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Everything animators, game developers, and comic artists need to
            know about creating dynamic character sheets with AI.
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
            AI Character Sheet Generator Examples
          </h2>
          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {[
              {
                input: '/images/pages/ai-character-sheet-generator/man.jpeg',
                output:
                  '/images/pages/ai-character-sheet-generator/character_sheet.jpeg',
                input_alt: 'man image to character sheet generator',
                output_alt: 'man image converted by character sheet generator',
                type: 'style: Character Sheet',
              },
              {
                input:
                  '/images/pages/ai-character-sheet-generator/cat_girl.webp',
                output:
                  '/images/pages/ai-character-sheet-generator/cat_girl_character_sheet.jpeg',
                input_alt: 'cat girl image to character sheet generator',
                output_alt:
                  'cat girl image converted by character sheet generator',
                type: 'style: Character Sheet',
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

        {/* How It Works Section */}
        <div className='py-16 mt-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use AI Character Sheet Generator
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                step: 1,
                title: 'Upload Your Character Image',
                content:
                  "Simply upload a front-facing character image, whether it's a digital painting, a 3D render, or a sketch. Our AI analyzes the image to understand the character's key attributes and details, preparing it for transformation into a versatile character sheet.",
              },
              {
                step: 2,
                title: 'Choose Your Style',
                content:
                  "Select from various artistic styles, including cartoon, anime, and 3D, to match your project's aesthetic. Each style offers unique visual effects for your character sheet.",
              },
              {
                step: 3,
                title: 'Download & Share',
                content:
                  'Receive high-resolution character sheets with multiple poses. Perfect for sharing with your team or using as reference for animation and game development projects.',
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

        <div className='my-12 md:my-16'>
          <MoreAITools category='illustration' />
        </div>

        {/* Benefits Section */}
        <div className='py-16 bg-gradient-to-b from-white rounded-xl to-primary-100'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            Why Use the AI Character Sheet Generator
          </h2>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: '🎨 Streamlined Character Design',
                content:
                  'Quickly transform character images into professional character sheets that serve as a solid reference point for your creative projects.',
              },
              {
                title: '🕒 Time-Efficient Solution',
                content:
                  'Drastically cut down on the time and effort typically required to manually create character sheets, freeing you to focus on other critical aspects of your project.',
              },
              {
                title: '📈 Cross-Platform Compatibility',
                content:
                  'Whether your project involves 2D animation, 3D modeling, or game development, our AI adapts to a wide array of styles and formats, ensuring maximum usability.',
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
      </div>
    </div>
  );
}
