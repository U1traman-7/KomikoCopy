import Head from 'next/head';
import { Landing } from '../Components/Landing';
import Layout from '../Layout/layout';
import { useUser } from '../hooks/useUser';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Index() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/home');
    }
  }, [user]);

  return (
    <Layout>
      <Head>
        <title>
          KomikoAI – AI Anime Generator | Create Comics, Manga and Anime with AI
        </title>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content={`KomikoAI – AI Anime Generator | Create Comics, Manga and Anime with AI`}
        />
        <meta
          property='og:description'
          content={'Create comics, manhwa, manga and animations with AI'}
        />
        <meta property='og:url' content={'https://komiko.app'} />
        <meta property='og:image' content={'/images/character_design.webp'} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content={`KomikoAI – AI Anime Generator | Create Comics, Manga and Anime with AI`}
        />
        <meta
          name='twitter:description'
          content={'Create comics, manhwa, manga and animations with AI.'}
        />
        <meta name='twitter:image' content={'/images/character_design.webp'} />
        <meta
          name='description'
          content={'Create comics, manhwa, manga and animations with AI'}
        />
      </Head>
      <section className='px-0 w-full'>
        <Landing user={user}></Landing>
      </section>
    </Layout>
  );
}
