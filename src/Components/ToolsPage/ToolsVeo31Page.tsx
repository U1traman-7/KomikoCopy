import React, { useEffect } from 'react';
import FAQ from '@/components/FAQ';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import ImageOrTextToVideoConvert from './ImageOrTextToVideoConvert';
import { ImageToVideoModel } from '../../../api/tools/_zaps';
import Masonry from 'react-masonry-css';

export default function ToolsPage() {
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
      question: 'What is Veo 3.1 ?',
      answer:
        'Veo 3.1  is an advanced AI tool that creates high-quality 1080p videos from text or image prompts with synchronized audio, stable motion, and clear textures. Veo 3.1 uses cutting-edge video synthesis technology to transform your creative ideas into professional-quality videos with sound effects, dialogue, and environmental audio.',
    },
    {
      id: 2,
      question: 'How to use Veo 3.1 ?',
      answer:
        'Using Veo 3.1  is simple! First, upload your image or enter a detailed text prompt describing your desired video. Then, configure your Veo 3.1 settings including duration and aspect ratio. Finally, click generate and Veo 3.1 will create your professional-quality video with synchronized audio.',
    },
    {
      id: 3,
      question: 'How does Veo 3.1  work?',
      answer:
        'Veo 3.1  uses advanced AI technology to analyze your text prompts or images and generate high-quality videos. It works by processing your input through sophisticated neural networks that understand motion, style, and audio synchronization to create professional 1080p videos with stable motion and clear textures.',
    },
    {
      id: 4,
      question: 'What is the best Veo 3.1 ?',
      answer:
        "KomikoAI provides the best Veo 3.1  tool. Our goal is to be the leading AI creation platform by delivering professional-quality results, powerful and fun customization, and an intuitive workflow—completely free to try. With KomikoAI's Veo 3.1 , you can create stunning videos with synchronized audio and stable motion, making it perfect for users who need high-quality video content.",
    },
    {
      id: 5,
      question: 'Is the KomikoAI Veo 3.1  free online?',
      answer:
        'Yes, you can test out the Veo 3.1  on KomikoAI for free, without having to sign up to any subscription. Try our Veo 3.1  today!',
    },
    {
      id: 6,
      question: 'What can I do with Veo 3.1 ?',
      answer:
        'You can use Veo 3.1  on KomikoAI to create professional-quality videos for social media, marketing campaigns, educational content, creative projects, and storytelling. Veo 3.1 generates videos with synchronized audio, making it perfect for content creators who need engaging video content.',
    },
    {
      id: 7,
      question: 'Can I use Veo 3.1  on my phone?',
      answer:
        'Yes, you can use Veo 3.1  as a web app on different devices, including smartphones and computers, making it convenient for everyone.',
    },
    {
      id: 8,
      question: 'Can I download my generation from Veo 3.1 ?',
      answer:
        "Yes, KomikoAI's Veo 3.1  allows you to export your generation in MP4, for easy sharing and professional use.",
    },
    {
      id: 9,
      question: 'Why should I use Veo 3.1 ?',
      answer:
        'Using Veo 3.1  can significantly enhance your content creation workflow by generating professional-quality videos with synchronized audio in minutes. Our Veo 3.1  allows you to create engaging video content without complex video editing skills, making it perfect for content creators, marketers, and storytellers who need high-quality results quickly.',
    },
  ];

  return (
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        {/* <Sidebar /> */}
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-6 text-4xl font-bold text-center text-heading md:text-5xl'>
            Veo 3.1
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            Experience Google DeepMind&apos;s revolutionary Veo 3.1, the most
            advanced AI video generation tool available. Veo 3.1 creates
            stunning 1080p videos from text prompts or images with synchronized
            audio, character consistency, and multi-scene storytelling. Our Veo
            3.1 features enhanced character consistency, vertical 9:16 format
            support, custom narration capabilities, and cinema-grade color
            grading. Transform your creative ideas into professional-quality
            videos with Veo 3.1&apos;s breakthrough video synthesis technology
            on KomikoAI today!
          </p>
        </div>

        <ImageOrTextToVideoConvert
          model={ImageToVideoModel.VEO}
          exampleVideoUrl='/images/pages/veo3/example1.webm'
        />
        {/* Examples Section */}
        <div className='py-16'>
          <h2 className='mb-6 text-3xl font-bold text-center text-heading'>
            Veo 3.1 Examples
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground'>
            Explore stunning AI-generated videos created with Veo 3.1 AI Video
            Generator, showcasing its ability to create professional-quality
            videos with synchronized audio, stable motion, and clear textures.
            See how Veo 3.1 transforms text prompts and images into vibrant
            animated content with advanced video synthesis technology.
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
                  'Model: Veo 3.1 | Prompt: In rural Ireland, circa 1860s, two women, their long, modest dresses of homespun fabric whipping gently in the strong coastal wind, walk with determined strides across a windswept cliff top. The ground is carpeted with hardy wildflowers in muted hues. They move steadily towards the precipitous edge, where the vast, turbulent grey-green ocean roars and crashes against the sheer rock face far below, sending plumes of white spray into the air.',
              },
              {
                // input: "/images/pages/veo3/lion.webp",
                output: '/images/pages/veo3/example2.webm',
                // inputAlt: "veo3 lion image",
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3.1 | Prompt: A detective interrogates a nervous-looking rubber duck. "Where were you on the night of the bubble bath?!" he quacks. Audio: Detective&apos;s stern quack, nervous squeaks from rubber duck.',
              },
              {
                output: '/images/pages/veo3/example3.webm',
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3.1 | Prompt: A medium shot frames an old sailor, his knitted blue sailor hat casting a shadow over his eyes, a thick grey beard obscuring his chin. He holds his pipe in one hand, gesturing with it towards the churning, grey sea beyond the ship&apos;s railing. "This ocean, it&apos;s a force, a wild, untamed might. And she commands your awe, with every breaking light"',
              },
              {
                output: '/images/pages/veo3/example4.webm',
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3.1 | Prompt: A woman, classical violinist with intense focus plays a complex, rapid passage from a Vivaldi concerto in an ornate, sunlit baroque hall during a rehearsal. Their bow dances across the strings with virtuosic speed and precision. Audio: Bright, virtuosic violin playing, resonant acoustics of the hall, distant footsteps of crew, conductor&apos;s occasional soft count-in (muffled), rustling sheet music.',
              },
              {
                output: '/images/pages/veo3/example5.webm',
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3.1 | Prompt: A close up in a smooth, slow pan focuses intently on diced onions hitting a scorching hot pan, instantly creating a dramatic sizzle. Audio: distinct sizzle.',
              },
              {
                output: '/images/pages/veo3/example6.webm',
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3.1 | Prompt: A delicate feather rests on a fence post. A gust of wind lifts it, sending it dancing over rooftops. It floats and spins, finally caught in a spiderweb on a high balcony.',
              },
              {
                output: '/images/pages/veo3/example7.webm',
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3.1 | Prompt: A keyboard whose keys are made of different types of candy. Typing makes sweet, crunchy sounds. Audio: Crunchy, sugary typing sounds, delighted giggles.',
              },
              {
                output: '/images/pages/veo3/example8.webm',
                outputAlt: 'veo3 video',
                description:
                  'Model: Veo 3.1 | Prompt: A medium shot, historical adventure setting: Warm lamplight illuminates a cartographer in a cluttered study, poring over an ancient, sprawling map spread across a large table. Cartographer: "According to this old sea chart, the lost island isn&apos;t myth! We must prepare an expedition immediately!"',
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
          What is Veo 3.1?
        </h2>
        <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
          Veo 3.1 represents Google DeepMind&apos;s most advanced AI video
          generation breakthrough, featuring revolutionary character consistency
          and multi-scene storytelling capabilities. This cutting-edge Veo 3.1
          model produces native 1080p videos with synchronized audio, enhanced
          character consistency across scenes, vertical 9:16 format support, and
          cinema-grade color grading. Veo 3.1 transforms static images into
          dynamic multi-scene stories with custom narration, making it the
          ultimate AI video creation tool for content creators, marketers, and
          storytellers seeking professional-quality videos with Veo 3.1&apos;s
          advanced video synthesis technology.
        </p>

        {/* How It Works Section */}
        <div className='pt-16 pb-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use Veo 3.1 - Step by Step Guide
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                step: 1,
                title: 'Upload Image or Enter Veo 3.1 Text Prompt',
                content:
                  'Begin with Veo 3.1 by uploading a high-quality image or entering a detailed text prompt. Veo 3.1 uses your input to generate professional videos with enhanced character consistency, multi-scene storytelling, and synchronized audio. Veo 3.1 supports both single images and complex narrative descriptions for optimal video generation results.',
              },
              {
                step: 2,
                title: 'Configure Veo 3.1 Advanced Settings',
                content:
                  'Customize your Veo 3.1 settings including duration, aspect ratio (including vertical 9:16 format), motion preferences, and color grading options. Veo 3.1 offers enhanced character consistency controls, multi-scene generation options, and custom narration features for precise video creation tailored to your creative vision.',
              },
              {
                step: 3,
                title: 'Generate and Download Professional Veo 3.1 Videos',
                content:
                  'Generate your professional-quality video with Veo 3.1. Download native 1080p videos featuring synchronized audio, enhanced character consistency, and cinema-grade color grading. Veo 3.1 delivers broadcast-quality results perfect for social media, marketing campaigns, and professional content creation.',
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
            X Posts About Veo 3.1
          </h2>
          <div className='px-4'>
            <Masonry
              breakpointCols={{
                default: 4,
                '2400': 3,
                '1200': 2,
                '640': 1,
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
                    '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Google just launched Veo 3, an  that creates videos with built-in audio—including dialogue and sound effects<br/>+ Flow, a new AI filmmaking app for building cinematic scenes with advanced controls. <br/><br/>Both are available to US subscribers of Google&apos;s Ultra plan.… <a href="https://t.co/4sJkDGEaGZ">pic.twitter.com/4sJkDGEaGZ</a></p>&mdash; Tatiana Tsiguleva (@ciguleva) <a href="https://twitter.com/ciguleva/status/1924927844091887992?ref_src=twsrc%5Etfw">May 20, 2025</a></blockquote>',
                }}
              />
              <blockquote className='twitter-tweet'>
                <p lang='es' dir='ltr'>
                  Google Launches Veo 3, an That Incorporates Audio{' '}
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
                  Google launches Veo 3, an that incorporates audio{' '}
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
            Why Choose Veo 3.1 for Professional Video Creation
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Veo 3.1 delivers revolutionary AI video generation capabilities with
            enhanced character consistency, multi-scene storytelling, and
            vertical format support. This advanced Veo 3.1 model features native
            1080p resolution, synchronized audio generation, cinema-grade color
            grading, and custom narration capabilities. Veo 3.1&apos;s
            breakthrough video synthesis technology ensures professional-quality
            results with stable motion, clear textures, and consistent character
            appearance across multiple scenes, making it the ultimate choice for
            content creators, marketers, and video professionals.
          </p>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: 'Native 1080p Video with Character Consistency',
                content:
                  'Veo 3.1 produces native 1080p videos with enhanced character consistency across multiple scenes. Veo 3.1 maintains stable character appearance, motion, and behavior throughout your video, ensuring professional-quality results perfect for storytelling, marketing campaigns, and social media content.',
                icon: '🎥',
              },
              {
                title: 'Multi-Scene Storytelling with Synchronized Audio',
                content:
                  'Create complex narratives with Veo 3.1  featuring multi-scene storytelling capabilities and synchronized audio generation. Veo 3.1 automatically generates sound effects, dialogue, environmental audio, and custom narration, transforming single images into complete video stories.',
                icon: '🔊',
              },
              {
                title: 'Vertical Format and Cinema-Grade Color Grading',
                content:
                  'Veo 3.1  supports vertical 9:16 format for social platforms and offers cinema-grade color grading templates. Veo 3.1 provides professional visual effects, advanced style controls, and broadcast-quality output for diverse content creation needs.',
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
            Veo 3.1 FAQ
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Get answers to frequently asked questions about the Veo 3.1 AI Video
            Generator, the cutting-edge AI video generation tool designed for
            professional content creation. Learn how to maximize Veo 3.1&apos;s
            features for your creative projects and discover the full potential
            of AI-powered video synthesis with Veo 3.1.
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
