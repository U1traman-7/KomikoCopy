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
    question: "What makes Studio Ghibli's animation style so unique?",
    answer: "Studio Ghibli films are renowned for their hand-painted watercolor aesthetics, intricate character designs, and breathtaking fantasy landscapes. Our AI captures these distinctive elements - from the soft pastel skies of Howl's Moving Castle to the rich textures of Spirited Away's spirit world - transforming your photos with authentic Ghibli magic."
  },
  {
    id: 3,
    question: "Can I convert group photos into Ghibli-style artwork?",
    answer: "Absolutely! Our AI excels at transforming group photos into Ghibli character ensembles. Whether it's family portraits, friend groups, or even pets, we'll recreate that signature Studio Ghibli charm where every character feels like they belong in a Miyazaki film."
  },
  {
    id: 4,
    question: "Which Studio Ghibli film styles can I choose from?",
    answer: "Select from various Ghibli-inspired aesthetics including the ethereal watercolors of Ponyo, the European-inspired architecture of Kiki's Delivery Service, the lush forests of Princess Mononoke, or the dreamlike floating islands of Castle in the Sky."
  },
  {
    id: 5,
    question: "How accurate are the Ghibli-style conversions?",
    answer: "Our AI was trained on thousands of frames from actual Studio Ghibli films, learning the precise brush strokes, color palettes, and lighting techniques used by Ghibli's master animators. The results capture the studio's signature blend of realism and fantasy."
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
            Studio Ghibli Filter
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            Step into the magical world of Studio Ghibli with our AI-powered
            photo converter. Transform your ordinary photos into breathtaking
            Ghibli-style artwork that captures the essence of Hayao Miyazaki's
            legendary animation studio. Perfect for creating profile pictures,
            wall art, or imagining yourself in the fantastical worlds of
            Spirited Away, My Neighbor Totoro, and other beloved Ghibli
            classics.
          </p>
        </div>
        <PhotoToAnimeConvert
          selectedStyle='ghibli-anime'
          exampleImageUrl='/images/pages/studio-ghibli-filter/girl_ghibli.webp'
        />
        {/* How It Works Section */}
        <div className='py-16 mt-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use Studio Ghibli Filter
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                step: 1,
                title: 'Upload Your Photo',
                content:
                  "Share any portrait, landscape, or pet photo you'd love to see reimagined in Studio Ghibli's iconic style. Our AI works best with clear, well-lit images that capture the magic you want to enhance.",
              },
              {
                step: 2,
                title: 'Automatic Ghibli Transformation',
                content:
                  "Our AI instantly applies the Studio Ghibli aesthetic - transforming your photo with the studio's signature watercolor textures, soft pastel colors, and intricate line work that captures the magic of films like Spirited Away and Howl's Moving Castle.",
              },
              {
                step: 3,
                title: 'Download Your Masterpiece',
                content:
                  'Receive high-resolution Ghibli artwork ready for sharing, printing, or using as unique profile pictures. No watermarks, no limits - just pure Studio Ghibli magic at your fingertips.',
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

        {/* Benefits Section */}
        <div className='py-16 bg-gradient-to-b from-white rounded-xl to-primary-100'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            Why Use the Studio Ghibli Filter
          </h2>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: '🎨 Studio-Quality Ghibli Art',
                content:
                  'Our AI replicates the exact watercolor techniques, character proportions, and background details that make Studio Ghibli films visually distinctive',
              },
              {
                title: '🌍 Authentic Ghibli Worlds',
                content:
                  'Photos get placed in beautifully rendered Ghibli-style environments - whether floating castles, spirit baths, or lush green valleys',
              },
              {
                title: '👥 Character Transformation',
                content:
                  "Human subjects are converted with Ghibli's signature wide-eyed, expressive character designs while maintaining your unique features",
              },
              {
                title: '🏆 Multiple Film Styles',
                content:
                  'Choose between different Ghibli era aesthetics - from the sketchier lines of Nausicaä to the polished look of The Wind Rises',
              },
              {
                title: '📸 Perfect For All Occasions',
                content:
                  'Create Ghibli-style wedding photos, fantasy family portraits, or imagine your pets in the world of Totoro',
              },
              {
                title: '🔐 Complete Privacy',
                content:
                  "All processing happens on your device - your photos never leave your computer, just like Ghibli's traditional animation process",
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

        {/* Examples Section */}
        <div className='py-16'>
          <h2 className='mb-6 text-3xl font-bold text-center text-heading'>
            Studio Ghibli Filter Examples
          </h2>
          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {[
              {
                input: '/images/examples/photo-to-anime/input2.jpg',
                input_alt: 'girl photo to studio ghibli filter',
                output: '/images/pages/studio-ghibli-filter/girl_ghibli.webp',
                output_alt: 'girl photo converted by studio ghibli filter',
                type: 'style: Studio Ghibli',
              },
              {
                input: '/images/examples/photo-to-anime/black_guy_photo.webp',
                input_alt: 'black guy photo to studio ghibli filter',
                output: '/images/pages/studio-ghibli-filter/boy_ghibli.webp',
                output_alt: 'boy photo converted by studio ghibli filter',
                type: 'style: Studio Ghibli',
              },
              {
                input: '/images/examples/photo-to-anime/cat_photo.webp',
                input_alt: 'cat photo to studio ghibli filter',
                output: '/images/pages/studio-ghibli-filter/cat_ghibli.webp',
                output_alt: 'cat photo converted by studio ghibli filter',
                type: 'style: Studio Ghibli',
              },
              {
                input: '/images/examples/photo-to-anime/dog_photo.webp',
                input_alt: 'dog photo to studio ghibli filter',
                output: '/images/pages/studio-ghibli-filter/dog_ghibli.webp',
                output_alt: 'dog photo converted by studio ghibli filter',
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

        {/* FAQ Section */}
        <div className='py-16'>
          <h2 className='mb-2 text-3xl font-bold text-center text-heading'>
            Studio Ghibli Filter FAQs
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Everything you need to know about transforming your world with the
            magic of Studio Ghibli's animation style.
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
