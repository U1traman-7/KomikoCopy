import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAtomValue } from 'jotai';
import toast from 'react-hot-toast';
import { Post, authAtom, profileAtom } from '../state';
import {
  hasOCCharacterId,
  isOCPost,
  getCharacterIdFromTags,
  isHiddenPrompt,
} from '../Components/Feed/postUtils';
import { buildCreateYoursParams, getToolPageRoute } from '../utilities/tools';

/**
 * Hook to manage OC (Original Character) related logic for posts
 */
export const usePostOCLogic = (item: Post) => {
  const router = useRouter();
  const isAuth = useAtomValue(authAtom);
  const profile = useAtomValue(profileAtom);
  const [isCollectingOC, setIsCollectingOC] = useState(false);

  const hasOCCharacter = hasOCCharacterId(item);
  const isOCPostItem = isOCPost(item);
  const characterId = getCharacterIdFromTags(item);

  // Check if it's user's own character
  const isOwnCharacter =
    profile.authUserId &&
    item.authUserId &&
    item.authUserId === profile.authUserId;

  // Determine if Create Yours button should be shown
  const hasGenerations =
    Array.isArray(item.generations) && item.generations.length > 0;
  const isOCImagePost = hasOCCharacter && item.media_type === 'image';
  const shouldShowCreateYourButton = hasGenerations || isOCImagePost;

  /**
   * Handle OC Create Yours button click
   */
  const handleOCCreateYours = async (ocPrompt?: string | null) => {
    try {
      if (item.generations && item.generations.length > 0) {
        const gen = item.generations[0];
        const route = getToolPageRoute(gen.tool, gen.meta_data);
        const params = buildCreateYoursParams(gen, item);
        await router.push(`${route}?${params.toString()}`);
        return;
      }

      // Use characterId from hook
      if (!characterId) return;

      // Determine target route based on media type
      const targetRoute =
        item.media_type === 'video'
          ? '/image-animation-generator'
          : '/oc-maker';

      // If prompt is hidden (empty), go to target route to try the tool
      if (!ocPrompt) {
        await router.push(
          `${targetRoute}?characterId=${characterId}&post_id=${item.id}`,
        );
        return;
      }

      // If prompt is available, go to target route with prompt
      const params = new URLSearchParams();
      params.append('prompt', ocPrompt);
      params.append('characterId', characterId);
      await router.push(`${targetRoute}?${params.toString()}`);
    } catch (e) {
      console.error('Error in handleOCCreateYours:', e);
    }
  };

  /**
   * Handle Collect OC button click
   */
  const handleCollectOC = async () => {
    setIsCollectingOC(true);

    if (!characterId) {
      toast.error('Character not found');
      setIsCollectingOC(false);
      return;
    }

    try {
      let shouldShowCollectedToast = false;

      // If user is logged in, try to collect first
      if (isAuth) {
        if (!isOwnCharacter) {
          try {
            const response = await fetch('/api/characters', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                character_uniqid: characterId,
                action: 'collect',
              }),
            });

            const result = await response.json();
            if (result.code === 1) {
              shouldShowCollectedToast = true;
            }
          } catch (error) {
            console.error('Failed to collect character:', error);
          }
        }
      }

      // Navigate to character page, with collected parameter if successful
      const targetUrl = shouldShowCollectedToast
        ? `/character/${characterId}?collected=true`
        : `/character/${characterId}`;
      await router.push(targetUrl);
    } catch (error) {
      console.error('Failed to navigate:', error);
      toast.error('Failed to navigate');
    } finally {
      setIsCollectingOC(false);
    }
  };

  /**
   * Handle Create Yours for OC (simplified version for PostContent)
   */
  const handleCreateYoursOC = () => {
    if (!characterId) {
      toast.error('Character not found');
      return;
    }

    if (item.media_type === 'image') {
      router.push(`/oc-maker?characterId=${characterId}&post_id=${item.id}`);
    } else if (item.media_type === 'video') {
      router.push(
        `/image-animation-generator`,
      );
    }
  };

  return {
    hasOCCharacter,
    isOCPostItem,
    characterId,
    isOwnCharacter,
    shouldShowCreateYourButton,
    isCollectingOC,
    handleOCCreateYours,
    handleCollectOC,
    handleCreateYoursOC,
  };
};

