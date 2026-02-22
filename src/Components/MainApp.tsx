import { useRouter } from 'next/router';
import {
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Button,
  Divider,
  Image,
  Modal,
  ModalContent,
  useDisclosure,
} from '@nextui-org/react';
import { ChevronLeft, RefreshCw, MoreVertical } from 'lucide-react';
import mixpanel from 'mixpanel-browser';
import { FaArrowRightLong, FaCaretRight } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';

export function CreateStoryButton() {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { t } = useTranslation('common');
  return (
    <div>
      <Modal
        backdrop={'blur'}
        isOpen={isOpen}
        onClose={onClose}
        placement='center'
        size='lg'>
        <ModalContent
          style={{ backgroundColor: 'transparent', border: 'none' }}>
          {onClose => (
            <div className='flex flex-col gap-4 justify-between items-center max-w-full bg-transparent sm:flex-row'>
              <button
                className='flex-1'
                onClick={() => {
                  try {
                    mixpanel.track('click.home.generate');
                  } catch (error) {}
                  router.push('/create/generate');
                  onClose();
                }}>
                <Card className='bg-card flex flex-row items-center rounded-xl shadow-md sm:flex-col'>
                  <Image
                    src='/images/generate_prompt.webp'
                    className='object-cover object-scale-down rounded-none w-[258px] h-full sm:w-full '
                  />
                  <div className='p-5'>
                    <div className='w-full text-2xl font-semibold text-left'>
                      {t('home.create_story.generate.title')}
                    </div>
                    <div className='mt-2 w-full text-left text-foreground'>
                      {t('home.create_story.generate.description')}
                    </div>
                    <div className='flex justify-end w-full text-foreground'>
                      <FaArrowRightLong />
                    </div>
                  </div>
                </Card>
              </button>
              <button
                className='flex-1'
                onClick={() => {
                  try {
                    mixpanel.track('click.home.story');
                  } catch (error) {}
                  router.push('/create');
                  onClose();
                }}>
                <Card className='bg-card flex flex-row items-center rounded-xl shadow-md sm:flex-col'>
                  <Image
                    src='/images/create_canva.webp'
                    className='object-cover object-scale-down rounded-none w-[250px] min-h-full sm:w-full '
                  />
                  <div className='p-5'>
                    <div className='w-full text-2xl font-semibold text-left'>
                      {t('home.create_story.from_scratch.title')}
                    </div>
                    <div className='mt-2 w-full text-left text-foreground'>
                      {t('home.create_story.from_scratch.description')}
                    </div>
                    <div className='flex justify-end w-full text-foreground'>
                      <FaArrowRightLong />
                    </div>
                  </div>
                </Card>
              </button>
            </div>
          )}
        </ModalContent>
      </Modal>
      <div
        onClick={() => {
          try {
            mixpanel.track('click.home.create');
          } catch (error) {}
          onOpen();
        }}
        className='flex overflow-visible relative flex-col items-center font-bold rounded-lg cursor-pointer'
        style={{ marginBottom: '-7rem' }}>
        <div className='relative'>
          <Image
            src='/images/chibiteam.webp'
            alt='character'
            className='mb-2 object-cover max-w-[260px] max-h-[260px] w-full h-full'
          />
        </div>
        <Button
          onClick={() => {
            try {
              mixpanel.track('click.home.story');
            } catch (error) {}
            onOpen();
          }}
          className='relative -top-[9rem] flex flex-col gap-1 bg-primary-100 rounded-xl py-2 px-4 h-3/5 w-full pt-[9rem] break-words whitespace-normal pb-3'>
          <div className='text-2xl font-bold text-primary-700'>
            {t('home.create_story.title')}
          </div>
          <div className='text-lg leading-tight text-primary-700'>
            {t('home.create_story.subtitle')}
          </div>
        </Button>
      </div>
    </div>
  );
}

export function CreateCharacterButton() {
  const router = useRouter();
  const { t } = useTranslation('common');
  return (
    <div
      onClick={() => {
        router.push('/oc-maker');
      }}
      className='flex overflow-visible relative flex-col items-center font-bold rounded-lg cursor-pointer'
      style={{ marginBottom: '-7rem' }}>
      <div className='relative'>
        <Image
          src='/images/chibigirl.webp'
          alt='character'
          className='mb-2 object-cover max-w-[260px] max-h-[260px] w-full h-full'
        />
      </div>
      <Button
        onClick={() => {
          try {
            mixpanel.track('click.home.character');
          } catch (error) {}
          router.push('/oc-maker');
        }}
        className='relative -top-[9rem] bg-secondary-100 rounded-xl py-2 px-4 h-3/5 w-full flex flex-col gap-1 pt-[9rem] break-words whitespace-normal pb-3'>
        <div className='text-2xl font-bold text-secondary-700'>
          {t('home.create_character.title')}
        </div>
        <div className='text-lg leading-tight text-secondary-700'>
          {t('home.create_character.subtitle')}
        </div>
      </Button>
    </div>
  );
}

export function CreateAnimationButton() {
  const router = useRouter();
  const { t } = useTranslation('common');
  return (
    <div
      onClick={() => {
        router.push('/world?character_id=');
      }}
      className='flex overflow-visible relative flex-col items-center font-bold rounded-lg cursor-pointer'
      style={{ marginBottom: '-7rem' }}>
      <div className='relative'>
        <Image
          src='/images/chibiboy.webp'
          alt='character'
          width={260}
          height={260}
          className='mb-2'
        />
      </div>
      <Button
        onClick={() => {
          try {
            mixpanel.track('click.home.world');
          } catch (error) {}
          router.push('/world?character_id=');
        }}
        className='relative -top-[9rem] bg-orange-100 text-orange-700 text-xl font-bold rounded-xl py-2 px-4 h-3/5 w-full flex-column pt-[9rem] break-words whitespace-normal'>
        {t('home.create_animation.title')}
      </Button>
    </div>
  );
}
