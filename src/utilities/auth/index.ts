import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { KyselyAdapter } from '@auth/kysely-adapter';
import { getServerSession, type NextAuthOptions, type User } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { OAuth2Client } from 'google-auth-library';

import { resend, siteConfig } from '@/utils/auth/common';

import { db } from './db';
import { env } from '@/utils/env';
import { MagicLinkEmailStyle2 } from './common/emails/magic-link-email';
import { EmailWhiteList } from '../index';

type UserId = string;
type IsAdmin = boolean;

const RESEND_FROM_JP = process.env.RESEND_FROM_JP || env.RESEND_FROM;
const jpDomain = 'komikoai.com';
declare module 'next-auth' {
  interface Session {
    user: User & {
      id: UserId;
      isAdmin: IsAdmin;
    };
  }
}

declare module 'next-auth' {
  interface JWT {
    isAdmin: IsAdmin;
  }
}

const googlelient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/v2/api/auth/error',
  },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  adapter: KyselyAdapter(db),

  // ! SET COOKIES FOR PRODUCTION
  cookies: {
    sessionToken: {
      // Default name for the session token
      // name: "next-auth.session-token",
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  providers: [
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as unknown as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as unknown as string,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          display: 'popup',
        },
      },
      // Support for Google One Tap
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    EmailProvider({
      sendVerificationRequest: async params => {
        const { identifier, url } = params;

        // console.log('sendVerificationRequest', params);
        // console.log('sendVerificationRequest', identifier, url);
        const isJp = url?.includes(jpDomain);
        const userAccount = identifier.split('@')[0];
        const domain = identifier.split('@')[1]?.toLowerCase();
        const user = await db
          .selectFrom('User')
          .select(['name', 'emailVerified'])
          .where('email', '=', identifier)
          .executeTakeFirst();
        const userVerified = !!user?.emailVerified;
        if (
          !user &&
          domain === 'gmail.com' &&
          (userAccount.includes('+') || userAccount.includes('.'))
        ) {
          throw new Error('Invalid email');
        }

        // 检查邮箱域名是否在白名单中（仅对新注册用户）
        if (!userVerified) {
          const emailDomain = identifier.split('@')[1]?.toLowerCase();
          if (!emailDomain || !EmailWhiteList.includes(emailDomain as any)) {
            throw new Error('Email domain not allowed for registration');
          }
        }

        // const authSubject = userVerified
        //   ? `Sign-in link for ${(siteConfig as { name: string }).name}`
        //   : 'Activate your account';
        const authSubject = `${
          userVerified ? 'Sign in to KomikoAI' : 'Sign up to KomikoAI'
        } | Create Art, Anime & Comics with AI`;

        const fromEmail = isJp ? RESEND_FROM_JP : env.RESEND_FROM;
        // console.log(
        //   'fromEmail',
        //   fromEmail,
        //   isJp,
        //   RESEND_FROM_JP,
        //   env.RESEND_FROM,
        // );

        try {
          await resend.emails.send({
            // todo check
            from: `KomikoAI <${fromEmail}>`,
            to: identifier,
            subject: authSubject,
            react: MagicLinkEmailStyle2({
              firstName: user?.name ?? '',
              actionUrl: url,
              mailType: userVerified ? 'login' : 'register',
              siteName: (siteConfig as { name: string }).name,
              domain: isJp ? jpDomain : 'komiko.app',
            }),
            // Set this to prevent Gmail from threading emails.
            // More info: https://resend.com/changelog/custom-email-headers
            headers: {
              'X-Entity-Ref-ID': `${new Date().getTime()}`,
            },
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(error);
        }
      },
    }),
    CredentialsProvider({
      id: 'google-one-tap',
      name: 'Google One Tap',
      credentials: {
        credential: { label: 'Credential', type: 'text' },
      },
      async authorize(credentials) {
        const ticket = await googlelient.verifyIdToken({
          idToken: credentials?.credential ?? '',
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
          throw new Error('Invalid credential');
        }
        if (!payload.email) {
          throw new Error('Invalid credential');
        }
        const user = await db
          .selectFrom('User')
          .where('email', '=', payload.email)
          .selectAll()
          .executeTakeFirst();
        if (!user) {
          throw new Error('User not found');
        }
        return {
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          image: payload.picture,
        };
      },
    }),
  ],
  callbacks: {
    session({ token, session }) {
      if (token) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name;
          session.user.email = token.email;
          session.user.image = token.picture;
          session.user.isAdmin = token.isAdmin as boolean;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      const email = token?.email ?? '';
      const dbUser = await db
        .selectFrom('User')
        .where('email', '=', email)
        .selectAll()
        .executeTakeFirst();
      if (!dbUser) {
        if (user) {
          token.id = user?.id;
        }
        return token;
      }
      let isAdmin = false;
      if (env.ADMIN_EMAIL) {
        const adminEmails = env.ADMIN_EMAIL.split(',');
        if (email) {
          isAdmin = adminEmails.includes(email);
        }
      }
      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        isAdmin,
      };
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/login-success`;
    },
  },
  debug: env.IS_DEBUG === 'true',
};

// Use it in server contexts
export function auth(
  ...args:
    | [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, authOptions);
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}
