/* eslint-disable */
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
  Link,
} from '@react-email/components';

import * as Icons from '@/ui/icons';

interface MagicLinkEmailProps {
  actionUrl: string;
  firstName: string;
  mailType: 'login' | 'register';
  siteName: string;
  domain?: string;
}

export const MagicLinkEmailStyle2 = ({
  firstName = '',
  actionUrl,
  mailType,
  siteName,
  domain = 'komiko.app',
}: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Click to {mailType === 'login' ? 'sign in' : 'activate'} your {siteName}{' '}
      account.
    </Preview>
    <Tailwind>
      <Body className='font-sans bg-white'>
        <Container className='py-5 pb-12 mx-auto'>
          {/* <Text className="text-base">{(mailType === 'login'?'Sign in to Komiko': 'Sign up to Komiko') + ' | Create Art, Anime & Comics with AI'}</Text> */}
          <Text className='text-base'>Hi {firstName || 'there'},</Text>
          <Text className='text-base'>
            Welcome to Komiko, your all-in-one AI platform for creating art,
            anime, and comics! Click the link below to sign in to your account.
          </Text>
          <Section className='my-5 text-center'>
            <Button
              className='inline-block px-4 py-2 text-base text-white no-underline rounded-md'
              style={{ backgroundColor: 'rgb(86,58,250)' }}
              href={actionUrl}>
              {mailType === 'login'
                ? '>>> Sign in <<<'
                : '>>> Activate Account <<<'}
            </Button>
          </Section>
          <Text className='text-base'>
            This link is valid for 24 hours and can only be used once.
          </Text>
          <Text className='text-base'>
            If you didn’t request this login, feel free to ignore this message.
          </Text>
          <Text className='text-base'>---</Text>
          <Text className='text-base'>{domain}</Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export const MagicLinkEmail = ({
  firstName = '',
  actionUrl,
  mailType,
  siteName,
}: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Click to {mailType === 'login' ? 'sign in' : 'activate'} your {siteName}{' '}
      account.
    </Preview>
    <Tailwind>
      <Body className='font-sans bg-white'>
        <Container className='py-5 pb-12 mx-auto'>
          <Icons.Logo className='block m-auto w-10 h-10' />
          <Text className='text-base'>Hi {firstName},</Text>
          <Text className='text-base'>
            Welcome to {siteName} ! Click the link below to{' '}
            {mailType === 'login' ? 'sign in to' : 'activate'} your account.
          </Text>
          <Section className='my-5 text-center'>
            <Button
              className='inline-block px-4 py-2 text-base text-white no-underline bg-purple-500 rounded-md bg-zinc-900'
              href={actionUrl}>
              {mailType === 'login' ? 'Sign in' : 'Activate Account'}
            </Button>
          </Section>
          <Text className='text-base'>
            This link expires in 24 hours and can only be used once.
          </Text>
          {mailType === 'login' ? (
            <Text className='text-base'>
              If you did not try to log into your account, you can safely ignore
              it.
            </Text>
          ) : null}
          <Hr className='my-4 border-t-2 border-gray-300' />
          <Text className='text-sm text-gray-600'>komiko.app</Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default MagicLinkEmail;

const EmailFooter = ({ email }: { email: string }) => {
  return (
    <>
      <Text className='text-base'>
        Earn <Text className='font-bold'>500 credits</Text> for every friend you
        refer — plus <Text className='font-bold'>30% revenue share</Text> when
        they subscribe.
      </Text>
      <Link href='https://komiko.app/profile'>
        Learn more on your profile page
      </Link>
      <Text className='text-base'>KomikoAI</Text>
      <Hr className='my-4 border-t-2 border-gray-300' />
      <Text className='text-base'>Don’t want to receive these updates?</Text>
      <Link href={`https://komiko.app/api/unsubscribe?email=${email}`}>
        Unsubscribe here
      </Link>
    </>
  );
};

export const generateEmailContent = (
  type: 'collect' | 'follow' | 'comment',
  payload: {
    character_name?: string;
    username?: string;
    character_uniqid?: string;
    email: string;
    post_title?: string;
    post_content?: string;
    comment_content?: string;
    post_id?: string;
    user_id?: string;
  },
) => {
  if (type === 'collect') {
    const { character_name, username, character_uniqid, email } = payload;
    return (
      <Html>
        <Head />
        <Preview>
          {username!} just collected your character {character_name!}!
        </Preview>
        <Tailwind>
          <Body className='font-sans bg-white'>
            <Container className='py-5 pb-12 mx-auto'>
              <Text className='text-base'>
                Your character ”
                <Text className='font-bold'>{character_name}</Text>” was just
                added to <Text className='font-bold'>{username}</Text> ’s
                collection!
              </Text>
              <Text className='text-base'>
                They loved {character_name} and become a fan — ready to create
                more characters?
              </Text>

              <Link
                href={`https://komiko.app/characters/${character_uniqid}`}
                className='mt-10'>
                🧡View {character_name}
              </Link>
              <Link href={`https://komiko.app/oc-maker`} className='mb-10'>
                🎨 Create more characters
              </Link>
              <Text className='text-lg font-bold'>💡 Did you know?</Text>
              <EmailFooter email={email}></EmailFooter>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  }
  if (type === 'comment') {
    const {
      post_title,
      email,
      post_content,
      username,
      comment_content,
      post_id,
    } = payload;
    return (
      <Html>
        <Head />
        <Preview>{username!} just commented on your KomikoAI post!</Preview>
        <Tailwind>
          <Body className='font-sans bg-white'>
            <Container className='py-5 pb-12 mx-auto'>
              <Text className='text-base'>
                You recently posted: ”
                <Text className='font-bold'>{post_title}</Text>”
              </Text>
              <Text className='text-base pl-4 border-l-2 border-gray-300 text-gray-400'>
                {post_content}
              </Text>
              <Text className='text-base font-bold'>{username} said:</Text>
              <Text className='text-base pl-4 border-l-2 border-gray-300 text-gray-400'>
                "{comment_content}"
              </Text>

              <Link
                href={`https://komiko.app/post/${post_id}`}
                className='mt-10'>
                💬 Check out the comment
              </Link>
              <Link href={`https://komiko.app`} className='mb-10'>
                🎨 Create more on KomikoAI
              </Link>
              <Text className='text-lg font-bold'>
                💰 Get rewarded for sharing KomikoAI!
              </Text>
              <EmailFooter email={email}></EmailFooter>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  }

  if (type === 'follow') {
    const { email, username, user_id } = payload;
    return (
      <Html>
        <Head />
        <Preview>{username!} just followed you on KomikoAI🎉</Preview>
        <Tailwind>
          <Body className='font-sans bg-white'>
            <Container className='py-5 pb-12 mx-auto'>
              <Text className='text-base'>
                You’re gaining fans —{' '}
                <Text className='font-bold'>{username}</Text> is now following
                you and your creations!
              </Text>
              <Text className='text-base'>
                Want to check out their profile or share something new?
              </Text>
              <Link href={`https://komiko.app/user/${user_id}`}>
                👤 View {username}’s profile
              </Link>
              <Link href={`https://komiko.app`}>
                🎨 Create more on KomikoAI
              </Link>
              <Text className='text-lg font-bold'>
                💰 Get rewarded for sharing KomikoAI!
              </Text>
              <EmailFooter email={email}></EmailFooter>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  }

  return null;
};
