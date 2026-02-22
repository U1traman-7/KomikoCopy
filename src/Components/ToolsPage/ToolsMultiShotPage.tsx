import React from 'react';
import { Toaster } from 'react-hot-toast';
import FAQ from '@/components/FAQ';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import ImageOrTextToVideoConvert from './ImageOrTextToVideoConvert';
import { ImageToVideoModel } from '../../../api/tools/_zaps';

export default function ToolsPage({ isMobile }: any) {
  const localizedFaqs = [
    {
      id: 1,
      question: 'What exactly is the Multi‑Shot Video Generator?',
      answer: (
        <span>
          It’s an AI-powered tool built on ByteDance’s <b>Seedance 1.0 Pro </b>{' '}
          model that allows you to generate <b>multi‑shot narrative videos</b>
          —meaning you can script different shots in sequence (e.g. using [cut]
          or &lt;SHOT 1&gt;, &lt;SHOT 2&gt;), and the model maintains
          consistency in character appearance, style, lighting, and mood across
          cuts .
        </span>
      ),
    },
    {
      id: 2,
      question: 'What resolutions and video lengths are available?',
      answer:
        'The tool supports 480p and 1080p outputs; typical durations are 5 or 10 seconds per clip. For a 5s 1080p video, generation takes ~41 seconds on an NVIDIA L20 GPU .',
    },
    {
      id: 3,
      question: 'Do I retain usage and commercial rights?',
      answer:
        'Yes—videos generated via Seedance 1.0 Pro can be used commercially, with rights retained by the creator. Just check the platform’s specific terms of service for details',
    },
    {
      id: 7,
      question: 'What makes Seedance Pro faster than alternatives like Veo 3?',
      answer: (
        <span>
          Seedance uses a multi-stage distillation pipeline, including a
          student-lite distilled model, frame-sparsity optimization, and
          INT8/CUDA fusion. This achieves about <b>10× faster inference</b>,
          with a 5s 1080p clip in ~41 s, versus several minutes on other
          platforms.
        </span>
      ),
    },
    {
      id: 8,
      question: 'Are there limitations or known issues?',
      answer:
        'Common limitations include credit consumption, absence of built-in audio, and occasional generation errors. If issues arise, try refreshing or reconnecting—support is typically provided through email or platform feedback channels.',
    },
  ];

  return (
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-6 text-4xl font-bold text-center text-heading md:text-5xl'>
            Multi-Shot Video Generator
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-md md:text-lg'>
            Starting from a static image or from pure text, Multi-Shot Video
            Generator can animate characters and camera movement over multiple
            shots, giving you cinematic-quality storytelling in a few seconds .
          </p>
        </div>

        <ImageOrTextToVideoConvert
          model={ImageToVideoModel.SEEDANCE}
          exampleVideoUrl='/images/pages/multi-shot-video-generator/boy.webm'
        />
        <h2 className='pt-16 mt-16 mb-4 text-3xl font-bold text-center text-heading'>
          What is Multi-Shot Video Generator?
        </h2>
        <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
          Multi‑Shot Video Generator is an AI-driven video tool built on
          ByteDance’s Seedance 1.0 Pro model. Unlike conventional models limited
          to single-shot outputs, its “multi‑shot” capability enables you to
          author a sequence of connected shots—using simple notation like [cut]
          to denote scene changes—while maintaining consistency in subject,
          styling, and narrative flow.
        </p>

        {/* How It Works Section */}
        <div className='pt-16 pb-16 bg-background'>
          <h2 className='mb-10 text-3xl font-bold text-center text-heading'>
            How to Use Multi-Shot Video Generator
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4'>
            {[
              {
                step: 1,
                title: 'Upload Your Image',
                content: (
                  <p>
                    Start with a reference image and write a descriptive
                    multi-shot prompt. Use cues like [cut] to structure
                    different shots in sequence. Example: Image: A boy sitting
                    under a tree. <br />
                    Prompt:
                    <br />
                    Shot1: The boy picks up a wallet from the ground, close-up,
                    handheld.
                    <br />
                    [cut]
                    <br />
                    Shot2: He returns it to a stranger, over-the-shoulder shot,
                    slow pan.
                    <br />
                    [cut]
                    <br />
                    Shot3: The boy walks away, wide shot, warm afternoon sun.
                    <br />
                  </p>
                ),
              },
              {
                step: 2,
                title: 'Pick Your AI Model',
                content: 'Select Seedance Pro as the video generation model.',
              },
              {
                step: 3,
                title: 'Select Resolution & Duration',
                content:
                  'Select resolution (480 p or 1080 p) and duration (5s or 10s).',
              },
              {
                step: 4,
                title: 'Generate & Export',
                content: (
                  <p>
                    Hit <b>Generate</b>, preview the video, and download once
                    completed.
                  </p>
                ),
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

        {/* Examples Section */}
        <div className='py-16'>
          <h2 className='mb-6 text-3xl font-bold text-center text-heading'>
            Multi-Shot Video Generator Examples
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground'>
            Discover an extensive gallery of AI-generated videos created using
            Multi-Shot Video Generator. Witness how static images effortlessly
            transform into fluid, richly detailed videos with exceptional motion
            continuity and visual coherence.
          </p>

          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {/* Example 1 */}
            {[
              {
                input: '/images/pages/multi-shot-video-generator/boy.webp',
                output: '/images/pages/multi-shot-video-generator/boy.webm',
                inputAlt: `A little boy looks at the wallet lying on the ground.
[cut] Close-up shot of the boy — he is hesitating.
[cut] The boy walks towards the wallet and picks it up.`,
                outputAlt:
                  'A little boy looks at the wallet lying on the ground. [cut] Close-up shot of the boy — he is hesitating. [cut] The boy walks towards the wallet and picks it up.',
                description:
                  'Model: Multi-Shot Video Generator | Prompt: "<br>A little boy looks at the wallet lying on the ground. <br>[cut] Close-up shot of the boy — he is hesitating. <br>[cut] The boy walks towards the wallet and picks it up."',
              },
              {
                input:
                  '/images/pages/multi-shot-video-generator/girl_in_library.webp',
                output:
                  '/images/pages/multi-shot-video-generator/girl_in_library.webm',
                inputAlt: `[Scene 1: 0 to 2 seconds]
Wide shot, a grand antique library filled with endless rows of wooden bookshelves. A schoolgirl stands in the middle, dressed in a neat Japanese uniform, bathed in warm afternoon light filtering through stained glass windows. Dust motes float in the air. She walks slowly with curiosity.

[Scene 2: 2 to 4 seconds]
Medium shot behind the girl. She notices one book slightly pulled out from the shelf. Her eyes narrow. She gently pulls the book with both hands. A soft mechanical click is heard.

[Scene 3: 4 to 6 seconds]
Close-up on the shelf as part of it creaks and slides open, revealing a hidden stone passage behind. Dim light glows faintly from below. Her hand hesitates mid-air, her breath visible in the cold draft.

[Scene 4: 6 to 8 seconds]
Low-angle shot from the staircase below. The girl stands at the top, a mix of fear and wonder on her face. She begins to step down slowly. Shadows stretch behind her.

[Scene 5: 8 to 10 seconds]
Tracking shot behind the girl as she walks deeper into the narrow stone passage. A soft blue light pulses at the end of the corridor. Her silhouette grows smaller as mystery deepens.`,
                outputAlt: `[Scene 1: 0 to 2 seconds]
Wide shot, a grand antique library filled with endless rows of wooden bookshelves. A schoolgirl stands in the middle, dressed in a neat Japanese uniform, bathed in warm afternoon light filtering through stained glass windows. Dust motes float in the air. She walks slowly with curiosity.

[Scene 2: 2 to 4 seconds]
Medium shot behind the girl. She notices one book slightly pulled out from the shelf. Her eyes narrow. She gently pulls the book with both hands. A soft mechanical click is heard.

[Scene 3: 4 to 6 seconds]
Close-up on the shelf as part of it creaks and slides open, revealing a hidden stone passage behind. Dim light glows faintly from below. Her hand hesitates mid-air, her breath visible in the cold draft.

[Scene 4: 6 to 8 seconds]
Low-angle shot from the staircase below. The girl stands at the top, a mix of fear and wonder on her face. She begins to step down slowly. Shadows stretch behind her.

[Scene 5: 8 to 10 seconds]
Tracking shot behind the girl as she walks deeper into the narrow stone passage. A soft blue light pulses at the end of the corridor. Her silhouette grows smaller as mystery deepens.`,
                description: `Model: Multi-Shot Video Generator | Prompt: "<br>[Scene 1: 0 to 2 seconds]
Wide shot, a grand antique library filled with endless rows of wooden bookshelves. A schoolgirl stands in the middle, dressed in a neat Japanese uniform, bathed in warm afternoon light filtering through stained glass windows. Dust motes float in the air. She walks slowly with curiosity.

<br>[Scene 2: 2 to 4 seconds]
Medium shot behind the girl. She notices one book slightly pulled out from the shelf. Her eyes narrow. She gently pulls the book with both hands. A soft mechanical click is heard.

<br>[Scene 3: 4 to 6 seconds]
Close-up on the shelf as part of it creaks and slides open, revealing a hidden stone passage behind. Dim light glows faintly from below. Her hand hesitates mid-air, her breath visible in the cold draft.

<br>[Scene 4: 6 to 8 seconds]
Low-angle shot from the staircase below. The girl stands at the top, a mix of fear and wonder on her face. She begins to step down slowly. Shadows stretch behind her.

<br>[Scene 5: 8 to 10 seconds]
Tracking shot behind the girl as she walks deeper into the narrow stone passage. A soft blue light pulses at the end of the corridor. Her silhouette grows smaller as mystery deepens."`,
              },
              {
                input:
                  '/images/pages/multi-shot-video-generator/girl_walking.webp',
                output:
                  '/images/pages/multi-shot-video-generator/girl_walking.webm',
                inputAlt: `A girl is walking and looking at her phone
[cut] Close-up shot of the girl — she is walking and looking down at her phone.
[cut] A young man in a sweater and jeans is walking in the opposite direction also looking down at his phone.
[cut] Both the girl and young man are looking down at their phones and accidentally walk into each other.
[cut] Close-up of the girl and the young man both look up at each other and smile.`,
                outputAlt: `A girl is walking and looking at her phone
[cut] Close-up shot of the girl — she is walking and looking down at her phone.
[cut] A young man in a sweater and jeans is walking in the opposite direction also looking down at his phone.
[cut] Both the girl and young man are looking down at their phones and accidentally walk into each other.
[cut] Close-up of the girl and the young man both look up at each other and smile.`,
                description: `Model: Multi-Shot Video Generator | Prompt: "<br>A girl is walking and looking at her phone
<br>[cut] Close-up shot of the girl — she is walking and looking down at her phone.
<br>[cut] A young man in a sweater and jeans is walking in the opposite direction also looking down at his phone.
<br>[cut] Both the girl and young man are looking down at their phones and accidentally walk into each other.
<br>[cut] Close-up of the girl and the young man both look up at each other and smile."`,
              },
              {
                input:
                  '/images/pages/multi-shot-video-generator/girl_in_rain.webp',
                output:
                  '/images/pages/multi-shot-video-generator/girl_in_rain.webm',
                inputAlt: `Scene 1 – Cut 1: "The Letter"
Camera slowly pushes in on the girl standing beneath the streetlight. The silence is heavy, the only sound is the distant hum of a power line. The glowing letter faintly illuminates her face.

Scene 1 – Cut 2: "Message Appears"
Close-up on the letter. As she opens it, the ink begins to move on its own, forming strange symbols. Her expression shifts from curiosity to alarm. Wind picks up. The streetlight flickers. A low rumble is heard in the distance.

Scene 2 – Cut 1: "Daylight Classroom"
Daytime. The same girl, now in a school uniform, sits alone at the back of a sunlit classroom. She gazes out the window blankly. The once-glowing letter lies dull and folded on her desk, beside a half-filled notebook. Birds chirp faintly outside.

Scene 2 – Cut 2: "Symbol Returns"
Suddenly, the corner of her notebook starts to shimmer. A drawing begins to animate, forming the same strange symbol from the letter. She freezes. The fluorescent lights above flicker once. Something is happening again.`,
                outputAlt: `Scene 1 – Cut 1: "The Letter"
Camera slowly pushes in on the girl standing beneath the streetlight. The silence is heavy, the only sound is the distant hum of a power line. The glowing letter faintly illuminates her face.

Scene 1 – Cut 2: "Message Appears"
Close-up on the letter. As she opens it, the ink begins to move on its own, forming strange symbols. Her expression shifts from curiosity to alarm. Wind picks up. The streetlight flickers. A low rumble is heard in the distance.

Scene 2 – Cut 1: "Daylight Classroom"
Daytime. The same girl, now in a school uniform, sits alone at the back of a sunlit classroom. She gazes out the window blankly. The once-glowing letter lies dull and folded on her desk, beside a half-filled notebook. Birds chirp faintly outside.

Scene 2 – Cut 2: "Symbol Returns"
Suddenly, the corner of her notebook starts to shimmer. A drawing begins to animate, forming the same strange symbol from the letter. She freezes. The fluorescent lights above flicker once. Something is happening again.`,
                description: `Model: Multi-Shot Video Generator | Prompt: "<br>Scene 1 – Cut 1: "The Letter"
Camera slowly pushes in on the girl standing beneath the streetlight. The silence is heavy, the only sound is the distant hum of a power line. The glowing letter faintly illuminates her face.

<br>Scene 1 – Cut 2: "Message Appears"
Close-up on the letter. As she opens it, the ink begins to move on its own, forming strange symbols. Her expression shifts from curiosity to alarm. Wind picks up. The streetlight flickers. A low rumble is heard in the distance.

<br>Scene 2 – Cut 1: "Daylight Classroom"
Daytime. The same girl, now in a school uniform, sits alone at the back of a sunlit classroom. She gazes out the window blankly. The once-glowing letter lies dull and folded on her desk, beside a half-filled notebook. Birds chirp faintly outside.

<br>Scene 2 – Cut 2: "Symbol Returns"
Suddenly, the corner of her notebook starts to shimmer. A drawing begins to animate, forming the same strange symbol from the letter. She freezes. The fluorescent lights above flicker once. Something is happening again."`,
              },
            ].map(item => (
              <div
                className='flex overflow-hidden flex-col justify-between bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'
                key={item.input}>
                <div className='grid grid-cols-2 gap-4 p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg'>
                      <img
                        src={item.input}
                        alt={item.inputAlt}
                        className='object-contain w-full h-[480px]'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      Input Image
                    </p>
                  </div>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg'>
                      <video
                        src={item.output}
                        controls
                        autoPlay
                        playsInline
                        loop
                        muted
                        className='object-contain w-full h-[480px]'>
                        Output Video
                      </video>
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      Output Video
                    </p>
                  </div>
                </div>
                <div className='p-4 bg-primary-50 min-h-[80px]'>
                  <p
                    className='font-medium text-primary-600'
                    dangerouslySetInnerHTML={{ __html: item.description }}></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className='py-16 bg-gradient-to-b from-white rounded-xl to-primary-100'>
          <h2 className='mb-4 text-3xl font-bold text-center text-heading'>
            Why use Multi-Shot Video Generator?
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Multi-Shot Video Generator stands out with its cutting-edge AI
            technology that empowers creators to produce seamless, high-quality
            videos with ease and efficiency. Key benefits include:
          </p>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: 'Native Multi‑Shot Support',
                content:
                  'Seamlessly transition between shots within one prompt—preserving character identity, lighting, and stylistic tone across cut-ins, reverse shots, pans, zooms, and more.',
                icon: '🧠',
              },
              {
                title: 'Superior Prompt Understanding',
                content:
                  'Handles complex, sequential prompts like “a girl walks across a plaza [cut] then looks up at a clock tower” with coherent transitions and accurate action adherence .',
                icon: '🎥',
              },
              {
                title: 'Smooth, Cinematic Motion',
                content:
                  'Delivers lifelike, smooth motion with high fidelity—even with active movements or emotional nuance. Achieves videos with minimal artifacts and stable physics rendering.',
                icon: '✨',
              },
              {
                title: 'Fast 1080p Output',
                content: (
                  <span>
                    Generates a <b>5‑second 1080p video in about 41 seconds</b>{' '}
                    on an NVIDIA L20 GPU—a significant speed boost over many
                    competitors. Lite mode supports 480p–720p outputs for quick
                    previews.
                  </span>
                ),
                icon: '👥',
              },
              {
                title: 'Stylish & Versatile',
                content:
                  'Supports wide stylistic flexibility—from photorealism and anime to illustration, pixel art, and beyond. Prompts can describe emotional tone, lighting, camera style, and visual themes—all preserved across scenes.',
                icon: '🌐',
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

        <div className='my-12 md:my-16'>
          <MoreAITools category='animation' />
        </div>

        {/* FAQ Section */}
        <div className='py-16'>
          <h2 className='mb-2 text-3xl font-bold text-center text-heading'>
            Multi-Shot Video Generator FAQ
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground'>
            Find answers to the most common questions about Multi-Shot Video
            Generator, including setup, features, and usage tips.
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
