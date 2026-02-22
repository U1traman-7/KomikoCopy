import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import FAQ from '@/components/FAQ';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import ImageOrTextToVideoConvert from './ImageOrTextToVideoConvert';
import { ImageToVideoModel } from '../../../api/tools/_zaps';
import Sidebar from '../Sidebar/Sidebar';
import Masonry from 'react-masonry-css';

export default function ToolsPage({ isMobile }: any) {
  const { t } = useTranslation(['image-animation-generator', 'toast']);

  // Add Twitter SDK script loader
  const loadTwitterScript = () => {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);
  };

  useEffect(() => {
    loadTwitterScript();
  }, []);

  // Add Masonry styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .my-masonry-grid {
        display: flex;
        width: auto;
      }
      .my-masonry-grid_column {
        padding: 0 8px;
        background-clip: padding-box;
      }
      .my-masonry-grid_column > div {
        margin-bottom: 16px;
      }
      .twitter-tweet {
        margin: 0 !important;
        margin-bottom: 16px !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const localizedFaqs = [
    {
      id: 1,
      question: 'What is the Veo 3 Video Generator and how does it work?',
      answer:
        'The Veo 3 Video Generator is Google DeepMind&apos;s cutting-edge AI video generation system, designed to create high-quality, short videos from text or image prompts. This advanced video generator excels in producing consistent character animations, accurate style control, and native audio integration, making it the perfect tool for video content creation, especially in anime, animation, comics, manhwa, and manga video production.',
    },
    {
      id: 2,
      question:
        'How does the Veo 3 Video Generator compare to other AI video tools?',
      answer:
        'The Veo 3 Video Generator distinguishes itself with superior prompt understanding, built-in audio generation including synchronized lip-syncing, and advanced motion and camera controls. Its video synthesis capabilities support reference-based video generation, ensuring unmatched character consistency and style accuracy, particularly beneficial for professional video content creation and animation.',
    },
    {
      id: 3,
      question: 'What audio features does the Veo 3 Video Generator include?',
      answer:
        'The Veo 3 Video Generator creates and integrates comprehensive audio directly into generated videos, including sound effects, ambient sounds, and character dialogue with synchronized lip-syncing. This integrated approach to video and audio generation enhances the immersive quality of AI-generated content.',
    },
    {
      id: 4,
      question:
        'Is the Veo 3 Video Generator suitable for professional content creation?',
      answer:
        'Absolutely. The Veo 3 Video Generator&apos;s precise style control, character consistency, and customizable motion make it an essential tool for professional content creators, particularly those working with anime, manga, manhwa, and comics. The video generator&apos;s advanced features enable the production of broadcast-quality animated content.',
    },
    {
      id: 5,
      question: 'What are the main applications of the Veo 3 Video Generator?',
      answer:
        'The Veo 3 Video Generator excels in creating short-form video content, including anime-style clips, animated manga panels, promotional videos, VTuber content, and other animation projects. Its advanced video synthesis capabilities make it perfect for projects requiring detailed character motion, style consistency, and professional audio integration.',
    },
    {
      id: 6,
      question: 'What video quality can the Veo 3 Video Generator achieve?',
      answer:
        'The Veo 3 Video Generator produces cinema-grade videos with natural lighting and physics, supporting up to 4K resolution. The video generator is optimized for creating short, high-impact clips ideal for social media, promotional content, and professional storytelling segments.',
    },
    {
      id: 7,
      question:
        'How can I control video style and motion in the Veo 3 Video Generator?',
      answer:
        'The Veo 3 Video Generator allows precise control through detailed text prompts and reference images to specify artistic style, character appearance, and motion dynamics. The video generation system includes advanced camera movement controls for creating professional cinematic effects in your generated videos.',
    },
  ];

  return (
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        {/* <Sidebar /> */}
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-6 text-4xl font-bold text-center text-heading md:text-5xl'>
            Veo 3 Video Generator
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            Experience the power of Veo 3 Video Generator, Google
            DeepMind&apos;s state-of-the-art AI video generation model announced
            at Google I/O 2025. This revolutionary video generator creates
            stunning high-quality videos from text or image prompts, with
            significant advancements in video synthesis technology. Try the Veo
            3 Video Generator on KomikoAI AI and transform your ideas into
            cinematic videos today!
          </p>
        </div>

        <ImageOrTextToVideoConvert
          model={ImageToVideoModel.VEO}
          exampleVideoUrl='/images/pages/veo3/example1.webm'
        />
        {/* Examples Section */}
        <div className='py-16'>
          <h2 className='mb-6 text-3xl font-bold text-center text-heading'>
            Veo 3 AI Video Generation Examples
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground'>
            Explore stunning AI-generated videos created with Veo 3, showcasing
            its ability to bring anime, manga, manhwa, and comic characters to
            life with fluid motion, consistent style, and immersive audio. See
            how Veo 3 transforms static images and detailed prompts into vibrant
            animated stories.
          </p>

          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {/* Example 1 */}
            {[
              {
                // input: "/images/pages/veo3/sprite.webp",
                output: '/images/pages/veo3/example1.webm',
                // inputAlt: "veo3 sprite image",
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3 | Prompt: In rural Ireland, circa 1860s, two women, their long, modest dresses of homespun fabric whipping gently in the strong coastal wind, walk with determined strides across a windswept cliff top. The ground is carpeted with hardy wildflowers in muted hues. They move steadily towards the precipitous edge, where the vast, turbulent grey-green ocean roars and crashes against the sheer rock face far below, sending plumes of white spray into the air.',
              },
              {
                // input: "/images/pages/veo3/lion.webp",
                output: '/images/pages/veo3/example2.webm',
                // inputAlt: "veo3 lion image",
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3 | Prompt: A detective interrogates a nervous-looking rubber duck. "Where were you on the night of the bubble bath?!" he quacks. Audio: Detective&apos;s stern quack, nervous squeaks from rubber duck.',
              },
              {
                output: '/images/pages/veo3/example3.webm',
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3 | Prompt: A medium shot frames an old sailor, his knitted blue sailor hat casting a shadow over his eyes, a thick grey beard obscuring his chin. He holds his pipe in one hand, gesturing with it towards the churning, grey sea beyond the ship&apos;s railing. "This ocean, it&apos;s a force, a wild, untamed might. And she commands your awe, with every breaking light"',
              },
              {
                output: '/images/pages/veo3/example4.webm',
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3 | Prompt: A woman, classical violinist with intense focus plays a complex, rapid passage from a Vivaldi concerto in an ornate, sunlit baroque hall during a rehearsal. Their bow dances across the strings with virtuosic speed and precision. Audio: Bright, virtuosic violin playing, resonant acoustics of the hall, distant footsteps of crew, conductor&apos;s occasional soft count-in (muffled), rustling sheet music.',
              },
              {
                output: '/images/pages/veo3/example5.webm',
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3 | Prompt: A close up in a smooth, slow pan focuses intently on diced onions hitting a scorching hot pan, instantly creating a dramatic sizzle. Audio: distinct sizzle.',
              },
              {
                output: '/images/pages/veo3/example6.webm',
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3 | Prompt: A delicate feather rests on a fence post. A gust of wind lifts it, sending it dancing over rooftops. It floats and spins, finally caught in a spiderweb on a high balcony.',
              },
              {
                output: '/images/pages/veo3/example7.webm',
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3 | Prompt: A keyboard whose keys are made of different types of candy. Typing makes sweet, crunchy sounds. Audio: Crunchy, sugary typing sounds, delighted giggles.',
              },
              {
                output: '/images/pages/veo3/example8.webm',
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3 | Prompt: A medium shot, historical adventure setting: Warm lamplight illuminates a cartographer in a cluttered study, poring over an ancient, sprawling map spread across a large table. Cartographer: "According to this old sea chart, the lost island isn&apos;t myth! We must prepare an expedition immediately!"',
              },
            ].map(item => (
              <div
                className='flex overflow-hidden flex-col justify-between bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'
                key={item.output}>
                <div className='grid grid-cols-1 gap-4 p-6'>
                  {/* <div className="flex flex-col">
                  <div className="overflow-hidden mb-2 w-full rounded-lg aspect-video">
                    <img
                      src={item.input}
                      alt={item.inputAlt}
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Input Image
                  </p>
                </div> */}
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
          What is Veo 3 Video Generator?
        </h2>
        <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
          The Veo 3 Video Generator is Google DeepMind&apos;s latest
          breakthrough in AI video generation technology. This advanced video
          generator produces cinema-grade 4K videos with natural lighting,
          realistic physics, and integrated audio including synchronized
          dialogue and sound effects. The Veo 3 Video Generator&apos;s
          sophisticated style and motion controls make it the ultimate tool for
          content creators seeking professional-quality AI-generated videos,
          perfect for anime, manga, manhwa, comics, and animation production.
        </p>

        {/* How It Works Section */}
        <div className='pt-16 pb-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use Veo 3 Video Generator with KomikoAI
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                step: 1,
                title: 'Upload Your Image',
                content:
                  'Start by uploading a high-quality image that you want to animate. Veo 3 uses this as a reference for style and character consistency.',
              },
              {
                step: 2,
                title: 'Enter Detailed Text Prompts',
                content:
                  'Describe the scene, character actions, emotions, and style you want Veo 3 to generate. Use precise language to guide the AI in creating accurate and expressive animations.',
              },
              {
                step: 3,
                title: 'Generate and Download Your Video',
                content:
                  'Click generate to produce your AI video. Currently, you can download the generated video directly or use options like interpolation or upscaling to enhance your video.',
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

        <div className='py-16 bg-card'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            X Posts About Veo 3
          </h2>
          <div className='px-4'>
            <Masonry
              breakpointCols={{
                default: 4,
                2400: 3,
                1200: 2,
                640: 1,
              }}
              className='flex gap-4 w-full'
              columnClassName='my-masonry-grid_column'>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  1/ Veo 3 launched today! An extraordinary feat from the team
                  to put all the pieces together to create our SOTA audio-video
                  generation model. It&apos;s an incredible tool that unleashes
                  an unparalleled level of creativity and control in the hands
                  of our users. Veo 3 has an uncanny…{' '}
                  <a href='https://t.co/lZ810Sr93R'>
                    pic.twitter.com/lZ810Sr93R
                  </a>
                </p>
                &mdash; Dumitru Erhan (@doomie){' '}
                <a href='https://twitter.com/doomie/status/1924915076756340976?ref_src=twsrc%5Etfw'>
                  May 20, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  Veo 3 is from a different world{' '}
                  <a href='https://t.co/MVY0mZDBX3'>https://t.co/MVY0mZDBX3</a>
                </p>
                &mdash; Josh Woodward (@joshwoodward){' '}
                <a href='https://twitter.com/joshwoodward/status/1924971076003692701?ref_src=twsrc%5Etfw'>
                  May 20, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  2/ Also today we are launching Flow, our new tool for all AI
                  film-makers out there. In addition to accessing Veo 3, you can
                  use it to seamlessly create cinematic clips, scenes, stories.
                  You can do video extension, camera control, all sorts of
                  ingredients-to-video, upsampling and…
                </p>
                &mdash; Dumitru Erhan (@doomie){' '}
                <a href='https://twitter.com/doomie/status/1924915079583301921?ref_src=twsrc%5Etfw'>
                  May 20, 2025
                </a>
              </blockquote>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Google just launched Veo 3, an AI video generator that creates videos with built-in audio—including dialogue and sound effects<br/>+ Flow, a new AI filmmaking app for building cinematic scenes with advanced controls. <br/><br/>Both are available to US subscribers of Google&apos;s Ultra plan.… <a href="https://t.co/4sJkDGEaGZ">pic.twitter.com/4sJkDGEaGZ</a></p>&mdash; Tatiana Tsiguleva (@ciguleva) <a href="https://twitter.com/ciguleva/status/1924927844091887992?ref_src=twsrc%5Etfw">May 20, 2025</a></blockquote>',
                }}
              />
              <blockquote className='twitter-tweet'>
                <p lang='es' dir='ltr'>
                  Google Launches Veo 3, an AI Video Generator That Incorporates
                  Audio{' '}
                  <a href='https://t.co/C4XBb9gyDC'>https://t.co/C4XBb9gyDC</a>
                </p>
                &mdash; Slashdot (@slashdot){' '}
                <a href='https://twitter.com/slashdot/status/1924950159814729884?ref_src=twsrc%5Etfw'>
                  May 20, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  Veo 3 now has sound and Veo 2 comes with lots of incredible
                  new capabilities: Reference Powered Video, Camera Controls and
                  more! <br />
                  <br />
                  Try it on Flow!{' '}
                  <a href='https://t.co/W2e0gYEofT'>https://t.co/W2e0gYEofT</a>
                  <a href='https://t.co/o4lOUHct50'>https://t.co/o4lOUHct50</a>
                </p>
                &mdash; Thomas Kipf (@tkipf){' '}
                <a href='https://twitter.com/tkipf/status/1924900421111579120?ref_src=twsrc%5Etfw'>
                  May 20, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  Veo 3 is seriously mind blowing. The characters, the lighting,
                  the sound, the camera controls built-in...{' '}
                  <a href='https://t.co/zY3CQiRzWI'>https://t.co/zY3CQiRzWI</a>
                </p>
                &mdash; Steren (@steren){' '}
                <a href='https://twitter.com/steren/status/1924908768309236184?ref_src=twsrc%5Etfw'>
                  May 20, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  Veo 3 is here, and in addition to better visuals, it makes
                  noises and speaks! This was a massive effort made possible by
                  incredible passion from the whole Veo team and the many other
                  team enabling it to launch today. <br />
                  <br />
                  Looking forward to seeing what others do with it!
                  <a href='https://twitter.com/hashtag/veo3?src=hash&amp;ref_src=twsrc%5Etfw'>
                    #veo3
                  </a>{' '}
                  <a href='https://t.co/BylAi75ejq'>
                    pic.twitter.com/BylAi75ejq
                  </a>
                </p>
                &mdash; Jason Baldridge (@jasonbaldridge){' '}
                <a href='https://twitter.com/jasonbaldridge/status/1924925252603412575?ref_src=twsrc%5Etfw'>
                  May 20, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  Veo 3 can generate videos — and soundtracks to go along with
                  them | TechCrunch{' '}
                  <a href='https://t.co/1g8APq2Uhj'>https://t.co/1g8APq2Uhj</a>
                </p>
                &mdash; TechCrunch (@TechCrunch){' '}
                <a href='https://twitter.com/TechCrunch/status/1924885845493829881?ref_src=twsrc%5Etfw'>
                  May 20, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='es' dir='ltr'>
                  Google launches Veo 3, an AI video generator that incorporates
                  audio{' '}
                  <a href='https://t.co/pC20n1MC5P'>https://t.co/pC20n1MC5P</a>
                </p>
                &mdash; CNBC (@CNBC){' '}
                <a href='https://twitter.com/CNBC/status/1924887510930383066?ref_src=twsrc%5Etfw'>
                  May 20, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  By far the best Veo 3 video I&apos;ve seen so far 🤣{' '}
                  <a href='https://t.co/Ia4R3xtXdf'>https://t.co/Ia4R3xtXdf</a>
                </p>
                &mdash; Mat Velloso (@matvelloso){' '}
                <a href='https://twitter.com/matvelloso/status/1925045769918464320?ref_src=twsrc%5Etfw'>
                  May 21, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  VEO 3 initial impressions: Audio is goated, sounds great,
                  it&apos;s intelligent fits the video. So much fun to mess
                  with! Great motion and detail quality, follows prompts well
                  enough but not a massive leap over Veo 2 in that regard.
                  References work pretty well, about as good as other…{' '}
                  <a href='https://t.co/Tw9iNYXWTT'>
                    pic.twitter.com/Tw9iNYXWTT
                  </a>
                </p>
                &mdash; MattVidPro AI (@MattVidPro){' '}
                <a href='https://twitter.com/MattVidPro/status/1924941731021095037?ref_src=twsrc%5Etfw'>
                  May 20, 2025
                </a>
              </blockquote>
              <blockquote className='twitter-tweet'>
                <p lang='en' dir='ltr'>
                  With Veo 3 and Flow out in the world, here&apos;s a few
                  examples of videos I&apos;ve created with Veo 3.
                  <br />
                  <br />
                  The first video is an example of the incredible voice/audio
                  capabilities. The second one is a test of doing a longer form
                  video (edited in Premiere).
                  <br />
                  <br />
                  Generated with Veo.{' '}
                  <a href='https://t.co/ZfBX8p5SBI'>
                    pic.twitter.com/ZfBX8p5SBI
                  </a>
                </p>
                &mdash; Martin Nebelong (@MartinNebelong){' '}
                <a href='https://twitter.com/MartinNebelong/status/1924926779677905014?ref_src=twsrc%5Etfw'>
                  May 20, 2025
                </a>
              </blockquote>
            </Masonry>
          </div>
        </div>

        <div className='my-12 md:my-16'>
          <MoreAITools category='animation' />
        </div>

        {/* Benefits Section */}
        <div className='py-16 bg-gradient-to-b from-card rounded-xl to-primary-100'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            Why Choose Veo 3 Video Generator for Your Content Creation?
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            The Veo 3 Video Generator offers unparalleled AI video generation
            capabilities designed for professional content creators. Its
            advanced video synthesis technology ensures your generated videos
            are vivid, consistent, and immersive, with integrated audio and
            cinematic effects that elevate your storytelling to new heights.
          </p>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: 'Cinema-Grade Video Quality',
                content:
                  'Produce stunning 4K videos with realistic lighting, physics, and detailed animation that captures the essence of anime, manga, and manhwa styles.',
                icon: '🎥',
              },
              {
                title: 'Integrated Audio with Lip-Sync',
                content:
                  'Generate videos with synchronized dialogue, sound effects, and ambient audio, creating fully immersive animated experiences.',
                icon: '🔊',
              },
              {
                title: 'Precise Style and Motion Control',
                content:
                  'Use reference images and detailed prompts to control artistic style, character consistency, camera movements, and motion dynamics for professional-grade animation.',
                icon: '🎨',
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
            Veo 3 Video Generator FAQ - Everything You Need to Know
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Get answers to frequently asked questions about the Veo 3 Video
            Generator, the cutting-edge AI video generation tool designed for
            professional content creation. Learn how to maximize the video
            generator&apos;s features for your creative projects and discover
            the full potential of AI-powered video synthesis.
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
