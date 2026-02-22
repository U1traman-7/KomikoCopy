import { Toaster } from "react-hot-toast";
import FAQ from "@/components/FAQ";
import PhotoToAnimeConvert from "../PhotoToAnimeConvert";
import { AnimeStyle } from "../../../../api/tools/_constants";
import { MoreAITools } from '@/Components/SEO/MoreAITools';

/**
 *
 * styleData = [
  {
    id: AnimeStyle.ANIME,
    name: 'Anime',
    image: '/images/styles/anime.webp',
    description: 'Classic Japanese animation style with vibrant colors and expressive features'
  },
  {
    id: AnimeStyle.GHIBLI_ANIME,
    name: 'Ghibli Anime',
    image: '/images/styles/studio_ghibli_anime.webp',
    description: 'Whimsical and detailed animation style inspired by Studio Ghibli films'
  },
  {
    id: AnimeStyle.MANGA,
    name: 'Manga',
    image: '/images/styles/manga.webp',
    description: 'Black and white Japanese comic style with distinctive panel layouts and expressive line work'
  },
  {
    id: AnimeStyle.KOREAN_MANHWA,
    name: 'Korean Manhwa',
    image: '/images/styles/korean_manhwa.webp',
    description: 'Colorful webtoon style with flowing panels and detailed character designs'
  },
  {
    id: AnimeStyle.LINE_ART,
    name: 'Line Art',
    image: '/images/styles/lineart.webp',
    description: 'Clean, monochromatic outlines with minimal or no fill colors'
  },
  {
    id: AnimeStyle.CARTOON,
    name: 'Cartoon',
    image: '/images/styles/cartoon.webp',
    description: 'Simplified, exaggerated style with bold outlines and flat colors'
  },
  {
    id: AnimeStyle.WATERCOLOR,
    name: 'Watercolor',
    image: '/images/styles/watercolor.webp',
    description: 'Soft, translucent colors with gentle blending and artistic brush strokes'
  },
  {
    id: AnimeStyle.INK_WASH,
    name: 'Ink Wash Painting',
    image: '/images/styles/ink.webp',
    description: 'Traditional East Asian painting style with flowing ink gradients'
  },
  {
    id: AnimeStyle.RICK_AND_MORTY,
    name: 'Rick and Morty',
    image: '/images/styles/rick_and_morty.webp',
    description: 'Distinctive style from the popular adult animated sci-fi series'
  },
  {
    id: AnimeStyle.SOUTH_PARK,
    name: 'South Park',
    image: '/images/styles/south_park.webp',
    description: 'Simple, cut-out paper style animation with basic shapes and bold colors'
  },
  {
    id: AnimeStyle.ACTION_FIGURE,
    name: 'Action Figure',
    image: '/images/styles/action_figure.webp',
    description: 'Stylized 3D toy-like appearance with glossy finish and articulated features'
  },
  {
    id: AnimeStyle.FIGURE_IN_BOX,
    name: 'Figure in Box',
    image: '/images/styles/figure_in_box.webp',
    description: 'Collectible figure style presented in packaging display box'
  },
  {
    id: AnimeStyle.STICKER,
    name: 'Sticker',
    image: '/images/styles/sticker.webp',
    description: 'Flat, vibrant art style with bold outlines perfect for stickers and decals'
  },
  {
    id: AnimeStyle.ORIGAMI_PAPER_ART,
    name: 'Origami Paper Art',
    image: '/images/styles/origami_paper_art.webp',
    description: 'Folded paper aesthetic with geometric shapes and clean edges'
  },
  {
    id: AnimeStyle.LEGO,
    name: 'Lego',
    image: '/images/styles/lego.webp',
    description: 'Blocky, plastic brick aesthetic with signature Lego minifigure styling'
  },
  {
    id: AnimeStyle.CLAY,
    name: 'Clay',
    image: '/images/styles/clay.webp',
    description: 'Textured, handcrafted appearance similar to claymation or sculpted figures'
  },
  {
    id: AnimeStyle.PIXEL_ART,
    name: 'Pixel Art',
    image: '/images/styles/minecraft.webp',
    description: 'Retro digital art style with visible pixels and limited color palettes'
  },
  {
    id: AnimeStyle.SIMPSONS,
    name: 'Simpsons',
    image: '/images/styles/simpsons.webp',
    description: 'The Simpsons style with bold outlines and flat colors'
  },
  {
    id: AnimeStyle.BARBIE_DOLL,
    name: 'Barbie Doll',
    image: '/images/styles/barbie_doll.webp',
    description: 'Barbie doll style with bold outlines and flat colors'
  },
  {
    id: AnimeStyle.DOLL_BOX,
    name: 'Figure Box 2',
    image: '/images/styles/doll_box.webp',
    description: 'Doll box style with bold outlines and flat colors'
  },
  {
    id: AnimeStyle.CHARACTER_SHEET,
    name: 'Character Sheet',
    image: '/images/styles/character_sheet.webp',
    description: 'Character sheet style with bold outlines and flat colors'
  },

]
 */
const faqs = [
  {
    id: 1,
    question: "What makes your AI Action Figure Generator unique?",
    answer: "Our proprietary AI analyzes facial features, body proportions, and clothing details to create hyper-realistic 3D action figure renders with authentic textures, articulation points, and display options. Unlike basic filters, we generate professional-grade collectible designs ready for 3D printing or digital display."
  },
  {
    id: 3,
    question: "What resolution are the generated action figure images?",
    answer: "We output ultra-HD 4K renders (3840×2160) with 360° rotation capability, perfect for examining every detail. Professional collectors and 3D printing enthusiasts appreciate our attention to sculpted textures and material finishes."
  },
  {
    id: 4,
    question: "How long does it take to generate an action figure design?",
    answer: "Most conversions complete in under 30 seconds thanks to our optimized neural networks. Complex designs with multiple accessories may take up to 1 minute. You'll receive email notifications when premium renders are ready."
  },
  {
    id: 5,
    question: "Can I use these for commercial 3D printing?",
    answer: "Yes! Our Premium plans include commercial licenses for physical production."
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
            AI Action Figure Generator
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            Transform any photo into professional 3D action figure designs with
            our advanced AI generator. Transform any photo into custom 3D action
            figures and doll boxes with our advanced AI technology, inspired by
            the latest trends in AI image generation. Create your own
            collectible toys with realistic blister packaging and accessories.
          </p>
        </div>
        <PhotoToAnimeConvert
          selectedStyle='action-figure'
          exampleImageUrl='/images/styles/action_figure.webp'
        />
        {/* How It Works Section */}
        <div className='py-16 mt-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use AI Action Figure Generator
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                step: 1,
                title: 'Upload Your Photo',
                content:
                  'Submit any clear portrait (face/body shots work best). Our AI detects anatomical features to create perfect 3D proportions for your action figure, whether human, pet, or original character design.',
              },
              {
                step: 2,
                title: 'Choose Your Style',
                content:
                  'Choose from 20+ professional art styles including action figure, doll box, classic anime, Ghibli style, manga, cartoon, Lego blocks, pixel art and more - each offering unique visual effects for your photo.',
              },
              {
                step: 3,
                title: 'Download & Share',
                content:
                  'Receive ultra-HD 4K renders of your custom action figure from multiple angles. Perfect for sharing on social media or using as reference for physical collectible creation.',
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
            AI Action Figure Generator Examples
          </h2>
          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {[
              {
                input:
                  '/images/pages/ai-action-figure-generator/little_girl_comic.jpg',
                output: '/images/styles/action_figure.webp',
                input_alt: 'little girl photo to action figure generator',
                output_alt:
                  'little girl photo converted by action figure generator',
                type: 'style: Action Figure',
              },
              {
                input:
                  '/images/pages/ai-action-figure-generator/girl_photo.jpg',
                output:
                  '/images/pages/ai-action-figure-generator/girl_action_box.webp',
                input_alt: 'girl photo to action figure generator',
                output_alt: 'girl photo converted by action figure generator',
                type: 'style: Figure Box 2',
              },
              {
                input:
                  '/images/pages/ai-action-figure-generator/black_guy_photo.png',
                output:
                  '/images/pages/ai-action-figure-generator/boy_action_box.webp',
                input_alt: 'boy photo to action figure generator',
                output_alt: 'boy photo converted by action figure generator',
                type: 'style: Figure Box 2',
              },
              {
                input:
                  '/images/pages/ai-action-figure-generator/little_girl_photo.jpeg',
                output:
                  '/images/pages/ai-action-figure-generator/little_girl_action_box.webp',
                input_alt: 'little girl photo to action figure generator',
                output_alt:
                  'little girl photo converted by action figure generator',
                type: 'style: Figure Box 2',
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

        {/* FAQ Section */}
        <div className='py-16'>
          <h2 className='mb-2 text-3xl font-bold text-center text-heading'>
            AI Action Figure Generator FAQs
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Everything collectors and creators need to know about designing
            custom action figures with AI.
          </p>

          <div className='flex justify-center'>
            <div className='max-w-[1000px] w-full'>
              <FAQ faqs={faqs} />
            </div>
          </div>
        </div>

        <div className='my-12 md:my-16'>
          <MoreAITools category='illustration' />
        </div>

        {/* Benefits Section */}
        <div className='py-16 bg-gradient-to-b from-white rounded-xl to-primary-100'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            Why Use the AI Action Figure Generator
          </h2>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: '🦸 Professional Collectible Quality',
                content:
                  'Museum-grade 3D renders with authentic plastic/metal textures, realistic articulation, and display stands',
              },
              {
                title: '📦 Packaging Designs',
                content:
                  "Collector's edition boxes with window displays and authentic branding elements",
              },
              {
                title: '⚡ Lightning Fast Rendering',
                content:
                  'High-quality 3D conversions in under 1 minute thanks to our optimized neural networks',
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
