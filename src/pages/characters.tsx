import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { Button } from '@nextui-org/react';
import { FaPlus, FaFire, FaClock, FaUser, FaHeart } from 'react-icons/fa';
import { useAtom } from 'jotai';
import { Header } from '../Components/Header';
import { Sidebar } from '../Components/Sidebar';
import {
  CollectionNav,
  Collection,
} from '../Components/character/CollectionNav';
import { CharacterGrid } from '../Components/character/CharacterGrid';

import { CharacterCardItem } from '../Components/character/CharacterCardItem';
import { authAtom, Character, profileAtom } from '../state';
import { useCharacters } from '../hooks/useCharacters';
import { useCharacterCollections } from '../hooks/useCharacterCollections';
import { getCharacterImageUrl } from '../utils/characterNameUtils';

/**
 * Characters Gallery Page
 *
 * Main page for browsing and discovering characters.
 * Features:
 * - Collection navigation (Popular, Recently Used, My Characters, etc.)
 * - Grid layout for character cards
 * - Responsive design for mobile and desktop
 * - SEO optimized
 * - Create character button linking to OC Maker
 */
export default function CharactersPage() {
  const { t } = useTranslation(['create', 'common', 'character']);
  const router = useRouter();
  const [isAuth] = useAtom(authAtom);
  const [profile] = useAtom(profileAtom);

  // Get collection from URL query parameter
  const activeCollection = router.isReady
    ? (router.query.collection as string) || 'popular'
    : 'popular';
  const [isMobile, setIsMobile] = useState(false);

  // Fetch collections with counts
  const { collections: fetchedCollections } = useCharacterCollections(
    profile?.id,
  );

  // Fetch characters based on active collection
  // Only fetch when router is ready to avoid fetching wrong collection
  const { characters, loading, hasMore, loadMore } = useCharacters({
    collection: activeCollection,
    userId: profile?.id,
    limit: 50,
    enabled: router.isReady, // Only fetch when router is ready
  });

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCollectionChange = (collectionId: string) => {
    // Check if collection requires auth
    const collection = collections.find(c => c.id === collectionId);
    if (collection?.requireAuth && !isAuth) {
      // User needs to login - redirect to login page
      router.push('/login');
      return;
    }

    // Update URL with collection query parameter
    // The useEffect will automatically sync activeCollection state
    router.push(
      {
        pathname: '/characters',
        query: { collection: collectionId },
      },
      undefined,
      { shallow: true }, // Use shallow routing to avoid full page reload
    );
  };

  const handleCharacterClick = (character: Character) => {
    // Navigate to character detail page or open modal
    router.push(`/character/${character.character_uniqid}`);
  };

  const handleCreateCharacter = () => {
    router.push('/oc-maker');
  };

  // Use fetched collections or fallback to default
  const collections: Collection[] =
    fetchedCollections.length > 0
      ? fetchedCollections
      : [
          {
            id: 'popular',
            key: 'popular',
            icon: <FaFire className='w-4 h-4' />,
            type: 'system',
          },
          {
            id: 'recent',
            key: 'recently_used',
            icon: <FaClock className='w-4 h-4' />,
            requireAuth: true,
            type: 'system',
          },
          {
            id: 'my',
            key: 'my_characters',
            icon: <FaUser className='w-4 h-4' />,
            requireAuth: true,
            type: 'system',
          },
          {
            id: 'adopted',
            key: 'adopted_characters',
            icon: <FaHeart className='w-4 h-4' />,
            requireAuth: true,
            type: 'system',
          },
        ];

  return (
    <>
      <Head>
        <title>{`${t('character:gallery.title')} | KomikoAI`}</title>
        <meta name='description' content={t('character:gallery.description')} />
        <meta property='og:title' content={t('character:gallery.title')} />
        <meta
          property='og:description'
          content={t('character:gallery.description')}
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://komiko.app/characters' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={t('character:gallery.title')} />
        <meta
          name='twitter:description'
          content={t('character:gallery.description')}
        />
      </Head>

      <main className='flex flex-col min-h-screen caffelabs text-foreground bg-background'>
        <Header autoOpenLogin={false} />

        <div className='flex flex-1'>
          <Sidebar />

          <div className='w-full pt-12 lg:pl-52 min-h-screen'>
            <div className='max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8'>
              {/* Page Header */}
              <div className='mb-4 md:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6'>
                <div>
                  <h1 className='text-lg md:text-4xl font-bold text-heading mb-1 md:mb-2'>
                    {t('character:gallery.title')}
                  </h1>
                  <p className='text-xs md:text-lg font-medium text-muted-foreground'>
                    {t('character:gallery.description')}
                  </p>
                </div>

                {/* Desktop Create Button */}
                <div className='hidden lg:flex flex-shrink-0'>
                  <Button
                    variant='flat'
                    color='secondary'
                    size='lg'
                    onClick={handleCreateCharacter}
                    className='
                        shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-full
                        bg-blue-600/90 hover:bg-blue-600
                        backdrop-blur-sm
                        border border-white/40
                        hover:scale-105
                        text-white
                        px-5 text-sm
                      '
                    startContent={<FaPlus className='w-4 h-4' />}>
                    {t('common:create_character', 'Create Character')}
                  </Button>
                </div>
              </div>

              <div className='flex gap-2 md:gap-6'>
                {/* Sidebar - Mobile: Narrow without icons, Desktop: Full width with icons */}
                <div className='w-32 md:w-56 flex-shrink-0'>
                  <div className='sticky top-14 h-[calc(100vh-4rem)]'>
                    <div className='bg-card rounded-lg shadow-sm border-border p-2 md:p-4 h-full flex flex-col overflow-hidden'>
                      <h2 className='text-xs md:text-sm font-semibold text-foreground mb-2 md:mb-3 px-1 md:px-2 flex-shrink-0'>
                        {t('character:gallery.allCollections')}
                      </h2>
                      <div
                        className='overflow-y-auto flex-1 -mx-1 md:-mx-2 px-1 md:px-2 characters-collection-scroll'>
                        <CollectionNav
                          collections={collections}
                          activeCollection={activeCollection}
                          onCollectionChange={handleCollectionChange}
                          isAuthenticated={isAuth}
                          layout='vertical'
                          hideIcons={isMobile}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Character Grid */}
                <div className='flex-1 min-w-0'>
                  <CharacterGrid
                    characters={characters}
                    loading={loading}
                    onCharacterClick={handleCharacterClick}
                    showStats={false}
                    emptyMessage={
                      activeCollection === 'my'
                        ? t(
                            'character:gallery.emptyMyCharacters',
                            'You haven\'t created any characters yet. Click "Create Character" to get started!',
                          )
                        : activeCollection === 'adopted'
                          ? t(
                              'character:gallery.emptyAdoptedCharacters',
                              "You haven't adopted any characters yet. Browse popular characters to find your favorites!",
                            )
                          : activeCollection === 'recent'
                            ? t(
                                'character:gallery.emptyRecentlyUsed',
                                "You haven't used any characters yet. Start creating with characters from other collections!",
                              )
                            : t(
                                'character:gallery.emptyCharactersFound',
                                'No characters found. Try selecting a different collection or create your own character.',
                              )
                    }
                    renderCard={character => {
                      const charAny = character as any;

                      // Use utility function to get image URL
                      const imagePath = getCharacterImageUrl(character);

                      return (
                        <CharacterCardItem
                          character={
                            {
                              ...character, // Spread all character fields
                              name:
                                charAny.alt_prompt ||
                                character.character_name ||
                                '',
                              simple_name: character.character_name || '',
                              // Use imagePath for both fields (already computed above)
                              image: imagePath,
                              character_pfp: imagePath,
                            } as any
                          }
                          selected={false}
                          onClick={() => handleCharacterClick(character)}
                          compact={isMobile}
                          mode='gallery'
                        />
                      );
                    }}
                  />

                  {hasMore && !loading && characters.length > 0 && (
                    <div className='flex justify-center mt-6 md:mt-8'>
                      <Button
                        variant='light'
                        size={isMobile ? 'sm' : 'lg'}
                        onClick={loadMore}
                        className={`font-medium ${isMobile ? 'text-sm' : ''}`}>
                        {t('common:load_more', 'Load More')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Create Button - Mobile Only */}
        <div className='lg:hidden fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4'>
          <Button
            variant='flat'
            color='primary'
            size='md'
            onClick={handleCreateCharacter}
            className='
              shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-full
              bg-blue-600/90 hover:bg-blue-600
              backdrop-blur-sm
              border border-white/40
              hover:scale-105
              text-white
              px-5 text-sm
            '
            startContent={<FaPlus className='w-3.5 h-3.5' />}>
            {t('common:create_character', 'Create Character')}
          </Button>
        </div>
      </main>
    </>
  );
}
