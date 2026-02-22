import { getCharacterProfile } from '../utilities';

export async function getCharacterVariantProps(context: any) {
  const { character_id } = context.params;
  const { req } = context;

  let initialCharData: any = {
    age: 'loading...',
    authUserId: 'loading...',
    character_description: 'loading...',
    character_name: 'Character not found',
    character_uniqid: 'loading...',
    created_at: 'loading...',
    file_uniqid: 'loading...',
    gender: 'loading...',
    id: 'loading...',
    character_pfp: 'loading...',
    interests: 'loading...',
    intro: 'loading...',
    loras: [],
    personality: 'loading...',
    profession: 'loading...',
    user_image: 'loading...',
    user_name: 'loading...',
    _notFound: false,
    is_collected: null,
    is_official: false,
  };

  if (character_id && character_id !== '1') {
    try {
      const customChars = await getCharacterProfile([character_id as string]);
      if (
        customChars &&
        customChars.length > 0 &&
        customChars[0] &&
        customChars[0].character_name !== 'Character not found'
      ) {
        initialCharData = customChars[0];

        try {
          const cookies = req.headers.cookie || '';
          const hasSession =
            cookies.includes('next-auth.session-token') ||
            cookies.includes('__Secure-next-auth.session-token');

          if (hasSession && initialCharData.character_uniqid) {
            const protocol = req.headers['x-forwarded-proto'] || 'http';
            const host = req.headers.host;
            const apiUrl = `${protocol}://${host}/api/checkCollectedCharacter?character_uniqid=${initialCharData.character_uniqid}`;

            const response = await fetch(apiUrl, {
              headers: {
                cookie: cookies,
              },
            });

            if (response.ok) {
              const result = await response.json();
              if (result.code === 1) {
                initialCharData.is_collected = !!result.data.is_collected;
              }
            }
          }
        } catch (error) {
          console.error('Error fetching collection status in SSR:', error);
        }
      } else {
        initialCharData._notFound = true;
      }
    } catch (error) {
      console.error('Error fetching character:', error);
      initialCharData._notFound = true;
    }
  }

  return {
    props: {
      initialCharData,
    },
  };
}