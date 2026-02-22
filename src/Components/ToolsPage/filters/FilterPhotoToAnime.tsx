import { Toaster } from "react-hot-toast";
import FAQ from "@/components/FAQ";
import PhotoToAnimeConvert from "../PhotoToAnimeConvert";

/**
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
    question: "What image formats work with the AI anime art generator?",
    answer: "Our advanced anime AI filter processes JPG, PNG, and WEBP formats with perfect clarity. For best results converting to anime, manga, or cartoon styles, use high-resolution photos (minimum 512x512 pixels) with good lighting."
  },
  {
    id: 3,
    question: "Is my data secure when using the anime style converter?",
    answer: "We prioritize your privacy with military-grade encryption during transfer and automatic deletion of processed images within 24 hours. While we process images on our secure servers to enable advanced AI transformations, we never store your original photos long-term."
  },
  {
    id: 4,
    question: "What art styles does the AI support?",
    answer: "Choose from 18+ professional styles including authentic Anime, Studio Ghibli animation, Korean Manhwa webtoons, classic Manga, Cartoon, Watercolor, and unique transformations like Lego, Pixel Art, and Clay styles. Each preserves authentic characteristics of the selected art form."
  },
  {
    id: 5,
    question: "Can I convert group photos or pets?",
    answer: "Absolutely! Our AI handles multiple faces in one image perfectly, whether it's family photos, friend groups, or pets. Create matching anime avatars for everyone, or transform your cat into a Studio Ghibli character."
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
            Anime AI Filter
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            Transform any photo into professional artwork across 18+ styles
            using our AI image converter. Experience authentic: Japanese Anime &
            Manga conversions, Studio Ghibli-inspired character designs, Vibrant
            Korean Manhwa webtoon styles, Unique transformations like Lego,
            Pixel Art, and Clay, Artistic effects including Watercolor and Ink
            Wash painting, Artistic effects including Watercolor and Ink Wash
            painting
          </p>
        </div>
        <PhotoToAnimeConvert exampleImageUrl='/images/pages/anime-ai-filter/girl_anime.webp' />
        {/* How It Works Section */}
        <div className='py-16 mt-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use Anime AI Filter
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                step: 1,
                title: 'Upload Your Photo',
                content:
                  'Drag & drop any portrait, pet photo, or landscape. Our AI detects faces automatically and optimizes for perfect conversion to anime, manga, or other selected styles.',
              },
              {
                step: 2,
                title: 'Choose Art Style',
                content:
                  'Select from authentic Japanese Anime, Studio Ghibli aesthetics, Korean Manhwa, Cartoon styles, or unique transformations like Lego and Pixel Art.',
              },
              {
                step: 3,
                title: 'Download HD Artwork',
                content:
                  'Get high-resolution results (up to 4K) with transparent background options. Perfect for profile pictures, social media, or printing.',
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
            Anime AI Filter Examples
          </h2>
          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {[
              {
                input: '/images/pages/anime-ai-filter/girl_photo.jpg',
                output: '/images/pages/anime-ai-filter/girl_anime.webp',
                input_alt: 'girl photo to anime ai filter',
                output_alt: 'girl photo converted by anime ai filter',
                type: 'style: Anime',
              },
              {
                input: '/images/pages/anime-ai-filter/boy_photo.webp',
                output: '/images/pages/anime-ai-filter/boy_anime.webp',
                input_alt: 'boy photo to anime ai filter',
                output_alt: 'boy photo converted by anime ai filter',
                type: 'style: Anime',
              },
              {
                input: '/images/pages/anime-ai-filter/cat_photo.webp',
                output: '/images/pages/anime-ai-filter/cat_anime.webp',
                input_alt: 'cat photo to anime ai filter',
                output_alt: 'cat photo converted by anime ai filter',
                type: 'style: Anime',
              },
              {
                input: '/images/pages/anime-ai-filter/dog_photo.webp',
                output: '/images/pages/anime-ai-filter/dog_anime.webp',
                input_alt: 'dog photo to anime ai filter',
                output_alt: 'dog photo converted by anime ai filter',
                type: 'Style: Anime',
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
            Anime AI Filter FAQs
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Everything you need to know about transforming photos into anime,
            manga, and other art styles.
          </p>

          <div className='flex justify-center'>
            <div className='max-w-[1000px] w-full'>
              <FAQ faqs={faqs} />
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className='py-16 bg-gradient-to-b from-white rounded-xl to-primary-100'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            Why Use the Anime AI Filter
          </h2>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: '🎨 18+ Authentic Styles',
                content:
                  "From Japanese Anime to Lego and Pixel Art - true-to-style conversions that respect each art form's characteristics",
              },
              {
                title: '👁️ Professional Quality',
                content:
                  'Special algorithms for proper anime eyes, manga line work, and cartoon styling that follows industry standards',
              },
              {
                title: '📐 High Resolution Output',
                content:
                  'Generates crisp artwork up to 4K resolution for prints, posters, or digital use',
              },
              {
                title: '🖌️ Artistic Effects',
                content:
                  'Watercolor, Ink Wash, and other painterly styles with authentic brush stroke textures',
              },
              {
                title: '👥 Multi-Person Support',
                content:
                  'Handles group photos perfectly with consistent styling across all subjects',
              },
              {
                title: '🐾 Pet Transformations',
                content:
                  'Convert animals into anime characters or other styles while preserving their unique features',
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
