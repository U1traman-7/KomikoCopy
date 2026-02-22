import React from 'react';
import { useTranslation } from 'react-i18next';
import FAQ from '@/components/FAQ';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import VideoToVideoConvert from './VideoToVideoConvert';
import XPosts from '../content/XPosts';

// X Posts data
const runwayAlephTweets = [
  {
    id: '1',
    content:
      '<p lang="en" dir="ltr">Runway Aleph can do so many different video transformation tasks! These are only a few of them: <a href="https://t.co/jUfwaawmCp">https://t.co/jUfwaawmCp</a> <a href="https://t.co/NP6lYw5EDr">pic.twitter.com/NP6lYw5EDr</a></p>&mdash; Yining Shi (@yining_shi) <a href="https://twitter.com/yining_shi/status/1948871985880010771">July 25, 2025</a>',
    author: 'Yining Shi',
    handle: '@yining_shi',
    date: 'July 25, 2025',
    url: 'https://twitter.com/yining_shi/status/1948871985880010771',
  },
  {
    id: '2',
    content:
      '<p lang="ja" dir="ltr">【Runway(<a href="https://twitter.com/runwayml">@runwayml</a>)】Aleph🆕(早期アクセス)<br>これはただのGen4で使えるVideo to Video機能ではありません。<br>新時代のビデオ編集ツールとしてこれからAIツールが映像制作の中心になることを助長しています。<br><br>Alephでは次のような使用方法が例としてあげられます。… <a href="https://t.co/dVUWWfdODF">pic.twitter.com/dVUWWfdODF</a></p>&mdash; SEIIIRU😈動画生成AI×AfterEffects (@seiiiiiiiiiiru) <a href="https://twitter.com/seiiiiiiiiiiru/status/1949993035275915469">July 29, 2025</a>',
    author: 'SEIIIRU😈動画生成AI×AfterEffects',
    handle: '@seiiiiiiiiiiru',
    date: 'July 29, 2025',
    url: 'https://twitter.com/seiiiiiiiiiiru/status/1949993035275915469',
  },
  {
    id: '3',
    content:
      '<p lang="en" dir="ltr">Alright — that&#39;s it.<br><br>Best of Runway Aleph megathread (Day 1):<br><br>1. <a href="https://t.co/5xyl1KxjXU">pic.twitter.com/5xyl1KxjXU</a></p>&mdash; Proper (@ProperPrompter) <a href="https://twitter.com/ProperPrompter/status/1950311963768016912">July 29, 2025</a>',
    author: 'Proper',
    handle: '@ProperPrompter',
    date: 'July 29, 2025',
    url: 'https://twitter.com/ProperPrompter/status/1950311963768016912',
  },
  {
    id: '4',
    content:
      '<p lang="en" dir="ltr">We have completed rollout of access to Runway Aleph for 100% of all our paid plans. Aleph is a completely new way of creating, editing, transforming and generating video. To learn more about best practices for prompting, see the link below. <a href="https://t.co/Axtn9OJ0Jw">pic.twitter.com/Axtn9OJ0Jw</a></p>&mdash; Runway (@runwayml) <a href="https://twitter.com/runwayml/status/1950903868499337578">July 31, 2025</a><',
    author: 'Runway',
    handle: '@runwayml',
    date: 'July 31, 2025',
    url: 'https://twitter.com/runwayml/status/1950903868499337578',
  },
  {
    id: '5',
    content:
      '<p lang="en" dir="ltr">❤️ Runway Aleph <br><br>Currently battling the overwhelming urge to ignore every deadline and just experiment endlessly with Aleph 😍<br><br>&#39;leaving the first frame unchanged rapidly dissolve the person into [material] particles that completely clear before the last frame&#39;<br><br>Last video is… <a href="https://t.co/cKs6N4FALF">pic.twitter.com/cKs6N4FALF</a></p>&mdash; aroha AI (@arohaAIX) <a href="https://twitter.com/arohaAIX/status/1950524514531762624">July 30, 2025</a>',
    author: 'aroha AI',
    handle: '@arohaAIX',
    date: 'July 30, 2025',
    url: 'https://twitter.com/arohaAIX/status/1950524514531762624',
  },
  {
    id: '6',
    content:
      '<p lang="en" dir="ltr">Finally had a moment to sit down and try this <a href="https://twitter.com/Runway">@runway</a> <a href="https://twitter.com/hashtag/Aleph?src=hash&amp;ref_src=twsrc%5Etfw">#Aleph</a>. It’s absolutely insane. This was a simple, quick and basic test. One video, all text prompts to change the scene. I mean, come on! I can see So many use cases for this. So freakin cool. <a href="https://twitter.com/hashtag/ai?src=hash&amp;ref_src=twsrc%5Etfw">#ai</a> <a href="https://twitter.com/hashtag/aiart?src=hash&amp;ref_src=twsrc%5Etfw">#aiart</a> <a href="https://twitter.com/hashtag/aivideo?src=hash&amp;ref_src=twsrc%5Etfw">#aivideo</a> <a href="https://twitter.com/hashtag/runwayml?src=hash&amp;ref_src=twsrc%5Etfw">#runwayml</a> <a href="https://t.co/KgYMLtQBEZ">pic.twitter.com/KgYMLtQBEZ</a></p>&mdash; Kelly Boesch🏳️‍🌈 (@kellyeld) <a href="https://twitter.com/kellyeld/status/1950732096957473203">July 31, 2025</a>',
    author: 'Kelly Boesch',
    handle: '@kellyeld',
    date: 'July 31, 2025',
    url: 'https://twitter.com/kellyeld/status/1950732096957473203',
  },
  {
    id: '7',
    content:
      '<p lang="en" dir="ltr">My algorithm is off. <br><br>Playing with Runway Aleph. Lots of amazing usecases and happy terrifying accidents. <a href="https://t.co/eNT6JJ9x3V">pic.twitter.com/eNT6JJ9x3V</a></p>&mdash; The Artist&#39;s Journey (@wilfredlee) <a href="https://twitter.com/wilfredlee/status/1950302393666584586">July 29, 2025</a>',
    author: 'The Artist&#39;s Journey',
    handle: '@wilfredlee',
    date: 'July 29, 2025',
    url: 'https://twitter.com/wilfredlee/status/1950302393666584586',
  },
  {
    id: '8',
    content:
      '<p lang="ja" dir="ltr">Runwayの新モデルAlephなら天候も時間帯も自由自在 <a href="https://t.co/z8XJIeglxX">pic.twitter.com/z8XJIeglxX</a></p>&mdash; さとり (@satori_sz9) <a href="https://twitter.com/satori_sz9/status/1950120512283086968">July 29, 2025</a>',
    author: 'さとり',
    handle: '@satori_sz9',
    date: 'July 29, 2025',
    url: 'https://twitter.com/satori_sz9/status/1950120512283086968',
  },
  {
    id: '9',
    content:
      '<p lang="en" dir="ltr">From black hair to blond, from street to park, from day to night. Runway Aleph corrects production with natural language. Natural language editing is the future. <a href="https://twitter.com/runwayml">@runwayml</a> <a href="https://t.co/K7DpkjYgjA">pic.twitter.com/K7DpkjYgjA</a></p>&mdash; WuxIA Rocks (@WuxiaRocks) <a href="https://twitter.com/WuxiaRocks/status/1950332626122002873">July 29, 2025</a>',
    author: 'WuxIA Rocks',
    handle: '@WuxiaRocks',
    date: 'July 29, 2025',
    url: 'https://twitter.com/WuxiaRocks/status/1950332626122002873',
  },
  {
    id: '10',
    content:
      '<p lang="en" dir="ltr">Edited with Runway Aleph using Chat Mode.<br>Referenced a single image for each transformation.<br><br>→ Forest.<br>→ Snow mountain.<br>→ Red car.<br>→ Boar.<br><br>Guess which one is the original? <a href="https://t.co/DAs4VxWPnw">https://t.co/DAs4VxWPnw</a> <a href="https://t.co/jJaHv8eZMj">pic.twitter.com/jJaHv8eZMj</a></p>&mdash; ぽんず🐕 AIクリエイター (@ponzponz15) <a href="https://twitter.com/ponzponz15/status/1950061395380224093">July 29, 2025</a>',
    author: 'ぽんず🐕 AIクリエイター',
    handle: '@ponzponz15',
    date: 'July 29, 2025',
    url: 'https://twitter.com/ponzponz15/status/1950061395380224093',
  },
  {
    id: '11',
    content:
      '<p lang="en" dir="ltr">There’s no better way to start the week than exploring what Runway Aleph can do! 🤯 <a href="https://t.co/amnDfrZB4A">pic.twitter.com/amnDfrZB4A</a></p>&mdash; Yuval Alaluf (@yuvalalaluf) <a href="https://twitter.com/yuvalalaluf/status/1949501014496686234">July 27, 2025</a>',
    author: 'Yuval Alaluf',
    handle: '@yuvalalaluf',
    date: 'July 27, 2025',
    url: 'https://twitter.com/yuvalalaluf/status/1949501014496686234',
  },
  {
    id: '12',
    content:
      '<p lang="en" dir="ltr">Runway released their new model, Aleph.<br><br>You can modify any video by just typing simple prompts.<br><br>For this clip, I asked to see the opposing angle of this film scene.<br><br>Mind-blowing! <a href="https://t.co/SxNq3uuiZ9">pic.twitter.com/SxNq3uuiZ9</a></p>&mdash; Alex Patrascu (@maxescu) <a href="https://twitter.com/maxescu/status/1949972656012337340">July 28, 2025</a>',
    author: 'Alex Patrascu',
    handle: '@maxescu',
    date: 'July 28, 2025',
    url: 'https://twitter.com/maxescu/status/1949972656012337340',
  },
  {
    id: '13',
    content:
      '<p lang="en" dir="ltr">Alright, Runway just released Aleph. Now you can edit videos just by prompting what you want to change.<br><br>Really impressed by the first test, even the explosion transformed really accurately. <br><br>The motion is also extremely accurate. <a href="https://t.co/qTpv5PDgd7">pic.twitter.com/qTpv5PDgd7</a></p>&mdash; Halim Alrasihi (@HalimAlrasihi) <a href="https://twitter.com/HalimAlrasihi/status/1949969254775717893">July 28, 2025</a>',
    author: 'Halim Alrasihi',
    handle: '@HalimAlrasihi',
    date: 'July 28, 2025',
    url: 'https://twitter.com/HalimAlrasihi/status/1949969254775717893',
  },
];

// Examples data structure based on actual Runway Aleph features
const examplesData = [
  {
    id: 1,
    type: 'side-by-side',
    inputVideo:
      'https://d3phaj0sisr2ct.cloudfront.net/site/content/videos/StyleTransfer/StyleTransfer_1A.mp4',
    outputVideo:
      'https://d3phaj0sisr2ct.cloudfront.net/site/content/videos/StyleTransfer/StyleTransfer_1B.mp4',
    inputLabel: 'examples.originalVideo',
    outputLabel: 'examples.generatedOutput',
    description: 'examples.generateStyleTransfer',
    prompt: 'examples.promptStyleTransfer',
  },
  {
    id: 2,
    type: 'side-by-side',
    inputVideo:
      'https://d3phaj0sisr2ct.cloudfront.net/site/content/videos/CameraAngle/CameraAngle_1B-2.mp4',
    outputVideo:
      'https://d3phaj0sisr2ct.cloudfront.net/site/content/videos/CameraAngle/CameraAngle_3B-2.mp4',
    inputLabel: 'examples.originalVideo',
    outputLabel: 'examples.generatedOutput',
    description: 'examples.generateCameraAngles',
    prompt: 'examples.promptCameraAngle',
  },
  {
    id: 3,
    type: 'side-by-side',
    inputVideo:
      'https://d3phaj0sisr2ct.cloudfront.net/site/content/videos/ChangeObject/ChangeObjects_3A-2.mp4',
    outputVideo:
      'https://d3phaj0sisr2ct.cloudfront.net/site/content/videos/ChangeObject/ChangeObjects_3B-2.mp4',
    inputLabel: 'examples.originalVideo',
    outputLabel: 'examples.generatedOutput',
    description: 'examples.generateChangeObject',
    prompt: 'examples.promptChangeObject',
  },
  {
    id: 4,
    type: 'side-by-side',
    inputVideo:
      'https://d3phaj0sisr2ct.cloudfront.net/site/content/videos/VFX/VFX_1A-3.mp4',
    outputVideo:
      'https://d3phaj0sisr2ct.cloudfront.net/site/content/videos/VFX/VFX_1B-3.mp4',
    inputLabel: 'examples.originalVideo',
    outputLabel: 'examples.generatedOutput',
    description: 'examples.changeEnvironment',
    prompt: 'examples.promptAddRain',
  },
  {
    id: 5,
    type: 'side-by-side',
    inputVideo:
      'https://d3phaj0sisr2ct.cloudfront.net/site/content/videos/Add+things/Add-Things_1A-2.mp4',
    outputVideo:
      'https://d3phaj0sisr2ct.cloudfront.net/site/content/videos/Add+things/%3AAdd-Things_1B-2.mp4',
    inputLabel: 'examples.originalVideo',
    outputLabel: 'examples.generatedOutput',
    description: 'examples.addThings',
    prompt: 'examples.promptAddFireworks',
  },
  {
    id: 6,
    type: 'side-by-side',
    inputVideo:
      'https://d3phaj0sisr2ct.cloudfront.net/site/content/videos/RemoveObject/RemoveObject_2A-2.mp4',
    outputVideo:
      'https://d3phaj0sisr2ct.cloudfront.net/site/content/videos/RemoveObject/RemoveObject_2B-2.mp4',
    inputLabel: 'examples.originalVideo',
    outputLabel: 'examples.generatedOutput',
    description: 'examples.removeThings',
    prompt: 'examples.promptRemoveSmoke',
  },
];

export default function ToolsRunwayAlephPage() {
  const { t } = useTranslation('runway-aleph');

  const renderExample = (example: any) => {
    if (example.type === 'side-by-side') {
      return (
        <div
          key={example.id}
          className={`flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl h-full ${example.specialLayout ? 'relative' : ''}`}>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 ${example.specialLayout ? 'pb-16' : ''}`}>
            <div className='flex flex-col'>
              <div className='overflow-hidden mb-3 w-full rounded-lg aspect-video'>
                <video
                  src={example.inputVideo}
                  controls
                  playsInline
                  muted
                  className='object-cover w-full h-full'>
                  {t(example.inputLabel)}
                </video>
              </div>
              <p className='text-xs text-center text-muted-foreground md:text-sm'>
                  {t(example.inputLabel)}
                </p>
            </div>
            <div className='flex flex-col'>
              <div className='overflow-hidden mb-3 w-full rounded-lg aspect-video'>
                <video
                  src={example.outputVideo}
                  controls
                  playsInline
                  muted
                  className='object-cover w-full h-full'>
                  {t(example.outputLabel)}
                </video>
              </div>
              <p className='text-xs text-center text-muted-foreground md:text-sm'>
                  {t(example.outputLabel)}
                </p>
            </div>
          </div>
          <div
            className={`p-4 bg-primary-50 rounded-b-xl flex-grow flex items-center ${example.specialLayout ? 'absolute bottom-0 left-0 right-0' : ''}`}>
            <p className='font-medium text-primary-600 text-xs md:text-sm'>
              {t(example.description)}
            </p>
          </div>
        </div>
      );
    } else if (example.type === 'single') {
      return (
        <div
          key={example.id}
          className='flex flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl overflow-hidden'>
          <div className='p-6 flex-grow'>
            <div className='mb-2 w-full rounded-lg'>
              <video
                src={example.video}
                controls
                playsInline
                muted
                className='w-full h-auto rounded-lg'>
                {t(example.label)}
              </video>
            </div>
            <p className='text-xs text-center text-muted-foreground md:text-sm'>
              {t(example.label)}
            </p>
          </div>
          <div className='p-4 bg-primary-50'>
            <p className='font-medium text-primary-600 text-xs md:text-sm'>
              {t(example.description)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='overflow-y-auto pb-4 md:pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-4 md:mb-6 text-2xl font-bold text-center text-heading md:text-4xl lg:text-5xl'>
            {t('title')}
          </h1>
          <p className='px-2 mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-xs md:text-lg lg:text-xl'>
            {t('description')}
          </p>
        </div>

        {/* Main Convert Component */}
        <VideoToVideoConvert
          exampleVideo='https://www.youtube.com/embed/KUHx-2uz_qI'
          defaultModel='aleph'
        />

        {/* Examples Section */}
        <div className='pt-14 pb-10 md:py-16'>
          <h2 className='mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('examples.title')}
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
            {t('examples.description')}
          </p>

          <div className='grid grid-cols-1 gap-6 px-2 sm:px-4 md:grid-cols-2 xl:grid-cols-2'>
            {examplesData.map(renderExample)}
          </div>
        </div>

        {/* How to Use Section */}
        <div className='pt-10 md:pt-16 pb-4 md:pb-16 bg-background'>
          <h2 className='mb-10 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('howTo.title')}
          </h2>
          <div className='grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4'>
            {[
              {
                step: 1,
                title: t('steps.step1.title'),
                content: t('steps.step1.content'),
              },
              {
                step: 2,
                title: t('steps.step2.title'),
                content: t('steps.step2.content'),
              },
              {
                step: 3,
                title: t('steps.step3.title'),
                content: t('steps.step3.content'),
              },
              {
                step: 4,
                title: t('steps.step4.title'),
                content: t('steps.step4.content'),
              },
            ].map(step => (
              <div
                key={step.title}
                className='flex flex-col p-6 h-full bg-card rounded-xl border border-primary-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                <div className='flex justify-center items-center mb-4 w-8 h-8 md:w-14 md:h-14 text-xl font-bold text-primary-foreground bg-gradient-to-r to-purple-600 rounded-full from-primary-600 md:text-2xl'>
                  {step.step}
                </div>
                <div className='flex-grow'>
                  <h3 className='mb-3 text-lg font-bold text-primary-600 md:text-xl'>
                    {step.title}
                  </h3>
                  <p className='text-muted-foreground text-sm md:text-base'>
                    {step.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What is Video to Video Style Transfer Section */}
        <div className='pt-10 md:pt-16 mb-4'>
          <h2 className='mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('whatIs.title')}
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
            {t('whatIs.description')}
          </p>
        </div>

        {/* Benefits Section */}
        <div className='py-16 bg-gradient-to-b from-white rounded-xl to-primary-100'>
          <h2 className='mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('benefits.title')}
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
            {t('benefits.description')}
          </p>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: t('features.feature1.title'),
                content: t('features.feature1.content'),
                icon: '🎬',
              },
              {
                title: t('features.feature2.title'),
                content: t('features.feature2.content'),
                icon: '🎨',
              },
              {
                title: t('features.feature3.title'),
                content: t('features.feature3.content'),
                icon: '✨',
              },
              {
                title: t('features.feature4.title'),
                content: t('features.feature4.content'),
                icon: '⚡',
              },
              {
                title: t('features.feature5.title'),
                content: t('features.feature5.content'),
                icon: '👌',
              },
              {
                title: t('features.feature6.title'),
                content: t('features.feature6.content'),
                icon: '📹',
              },
            ].map(feature => (
              <div
                key={feature.title}
                className='p-6 bg-card rounded-xl border border-primary-100 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                <div className='flex items-center mb-4'>
                  <span className='mr-3 text-xl md:text-2xl'>
                    {feature.icon}
                  </span>
                  <h3 className='text-lg font-semibold text-primary-600 md:text-xl'>
                    {feature.title}
                  </h3>
                </div>
                <p className='text-muted-foreground text-sm md:text-base'>
                  {feature.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        <XPosts title='X Posts About Runway Aleph' posts={runwayAlephTweets} />

        {/* More AI Tools */}
        <div className='my-12 md:my-16'>
          <MoreAITools category='animation' />
        </div>

        {/* FAQ Section */}
        <div className='py-16'>
          <h2 className='mb-2 text-xl font-bold text-center text-heading md:text-3xl'>
            {t('faq.title')}
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
            {t('faq.description')}
          </p>

          <div className='flex justify-center'>
            <div className='max-w-[1000px] w-full'>
              <FAQ
                faqs={[
                  {
                    id: 1,
                    question: t('faq.q1'),
                    answer: t('faq.a1'),
                  },
                  {
                    id: 2,
                    question: t('faq.q2'),
                    answer: t('faq.a2'),
                  },
                  {
                    id: 3,
                    question: t('faq.q3'),
                    answer: t('faq.a3'),
                  },
                  {
                    id: 4,
                    question: t('faq.q4'),
                    answer: t('faq.a4'),
                  },
                  {
                    id: 5,
                    question: t('faq.q5'),
                    answer: t('faq.a5'),
                  },
                  {
                    id: 6,
                    question: t('faq.q6'),
                    answer: t('faq.a6'),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
