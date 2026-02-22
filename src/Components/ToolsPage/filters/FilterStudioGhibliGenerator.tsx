import { Toaster } from "react-hot-toast";
import FAQ from "@/components/FAQ";
import PhotoToAnimeConvert from "../PhotoToAnimeConvert";
import { AnimeStyle } from "../../../../api/tools/_constants";

/**
 * ai 可以参考产品支持的styles数据
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
]
 */
const faqs = [
  {
    id: 1,
    question: "How does your AI capture Studio Ghibli's unique animation style?",
    answer: "Our AI was trained on thousands of frames from actual Ghibli films, analyzing the studio's distinctive watercolor backgrounds, character proportions, and lighting techniques. It replicates Hayao Miyazaki's signature aesthetic down to the brush strokes, creating artwork indistinguishable from authentic Ghibli production cels."
  },
  {
    id: 2,
    question: "Can I generate Ghibli-style backgrounds without characters?",
    answer: "Yes! Our AI excels at creating breathtaking Ghibli-style landscapes - from lush forests to flying castles. Simply describe your desired scene (like 'enchanted meadow at sunset' or 'steampunk city in clouds') and we'll generate original backgrounds with that magical Ghibli touch."
  },
  {
    id: 3,
    question: "What resolution are the AI-generated Ghibli images?",
    answer: "All outputs are generated in 4K resolution (3840×2160) suitable for high-quality prints and wallpapers. For professional use, we offer up to 8K resolution to match Studio Ghibli's production standards."
  },
  {
    id: 4,
    question: "Can I recreate specific Ghibli movie aesthetics?",
    answer: "Absolutely! Choose from our curated style options: the earthy tones of Princess Mononoke, the dreamy pastels of Howl's Moving Castle, the vibrant ocean colors of Ponyo, or the intricate linework of Spirited Away. Each option faithfully replicates the film's unique animation style."
  },
  {
    id: 5,
    question: "How long does it take to generate Ghibli-style artwork?",
    answer: "Standard generations take under 30 seconds. For complex scenes with multiple characters and detailed backgrounds, processing may take up to 2 minutes to ensure Studio Ghibli-quality results."
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
            Studio Ghibli AI Generator
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            Transform your photos into breathtaking Studio Ghibli masterpieces
            with our advanced AI technology. Experience the magic of Hayao
            Miyazaki's animation style - create Ghibli-fied portraits, generate
            original fantasy landscapes, or bring your imagination to life in
            authentic Ghibli aesthetics. Perfect for fans, artists, and dreamers
            who want to step into the worlds of Spirited Away, My Neighbor
            Totoro, and Howl's Moving Castle.
          </p>
        </div>
        <PhotoToAnimeConvert
          selectedStyle='ghibli-anime'
          exampleImageUrl='/images/pages/studio-ghibli-ai-generator/girl_ghibli.webp'
        />
        {/* How It Works Section */}
        <div className='py-16 mt-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use Studio Ghibli AI Generator
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                step: 1,
                title: 'Upload Your Image',
                content:
                  'Start with any photo - portraits, pets, landscapes, or even sketches. Our AI will analyze facial features, composition, and lighting to prepare for Ghibli-fication.',
              },
              {
                step: 2,
                title: 'Select Your Preferred Style',
                content:
                  'Choose from our specialized anime art styles including the whimsical Ghibli aesthetic, or explore other popular options like classic anime, manga, watercolor, or unique 3D styles such as Lego and clay art.',
              },
              {
                step: 3,
                title: 'Download & Share',
                content:
                  'Receive HD artwork ready for prints, wallpapers, or social media. Show off your Ghibli avatar, use it as profile picture, or create an entire series of you in different Ghibli worlds.',
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
            Studio Ghibli AI Generator Examples
          </h2>
          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {[
              {
                input:
                  '/images/pages/studio-ghibli-ai-generator/girl_photo.jpg',
                input_alt: 'girl photo to studio ghibli ai generator',
                output:
                  '/images/pages/studio-ghibli-ai-generator/girl_ghibli.webp',
                output_alt:
                  'girl photo converted by studio ghibli ai generator',
                type: 'style: Studio Ghibli',
              },
              {
                input:
                  '/images/pages/studio-ghibli-ai-generator/boy_photo.webp',
                input_alt: 'black guy photo to studio ghibli ai generator',
                output:
                  '/images/pages/studio-ghibli-ai-generator/boy_ghibli.webp',
                output_alt: 'boy photo converted by studio ghibli ai generator',
                type: 'style: Studio Ghibli',
              },
              {
                input:
                  '/images/pages/studio-ghibli-ai-generator/cat_photo.webp',
                input_alt: 'cat photo to studio ghibli ai generator',
                output:
                  '/images/pages/studio-ghibli-ai-generator/cat_ghibli.webp',
                output_alt: 'cat photo converted by studio ghibli ai generator',
                type: 'style: Studio Ghibli',
              },
              {
                input:
                  '/images/pages/studio-ghibli-ai-generator/dog_photo.webp',
                input_alt: 'dog photo to studio ghibli ai generator',
                output:
                  '/images/pages/studio-ghibli-ai-generator/dog_ghibli.webp',
                output_alt: 'dog photo converted by studio ghibli ai generator',
                type: 'style: Studio Ghibli',
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
            Why Use the Studio Ghibli AI Generator
          </h2>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: '🎨 Authentic Ghibli Aesthetics',
                content:
                  "Our AI replicates Studio Ghibli's signature style - from the watercolor backgrounds to the character designs - with unprecedented accuracy, making your creations indistinguishable from actual film frames.",
              },
              {
                title: '🌍 Complete Ghibli Worlds',
                content:
                  'Generate not just characters but entire environments - mystical forests, flying islands, bathhouse interiors - all in perfect Ghibli style with attention to architectural and natural details.',
              },
              {
                title: '👨‍🎨 Multiple Ghibli Styles',
                content:
                  "Choose between different Ghibli directors' approaches - Miyazaki's fantasy, Takahata's realism, or specific film aesthetics from Nausicaä to The Boy and the Heron.",
              },
              {
                title: '📚 Ghibli Art Book Quality',
                content:
                  'Outputs match the quality of official Studio Ghibli art books and production materials, suitable for professional artists and animators seeking reference material.',
              },
              {
                title: '🖼️ Print-Ready Resolution',
                content:
                  'All images generated in ultra HD (up to 8K) perfect for posters, wall art, or even animation cels - just like real Ghibli production artwork.',
              },
              {
                title: '🎭 Consistent Characters',
                content:
                  'Maintain character likeness across multiple images - create your Ghibli persona once, then place them in different Ghibli worlds with consistent styling.',
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

        {/* FAQ Section */}
        <div className='py-16'>
          <h2 className='mb-2 text-3xl font-bold text-center text-heading'>
            Studio Ghibli AI Generator FAQ
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Everything you need to know about creating authentic Studio Ghibli
            artwork with our AI technology
          </p>

          <div className='flex justify-center'>
            <div className='max-w-[1000px] w-full'>
              <FAQ faqs={faqs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
