import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { LOGIN_SUCCESS, LOGIN_FAILED, checkEmail } from '../utilities';
import { isMobile } from 'react-device-detect';

const Page = () => {
  const [text, setText] = useState<string>('');

  useEffect(() => {
    let signal = LOGIN_SUCCESS;

    checkEmail()
      .then((result: boolean) => {
        if (!result) {
          setText('Login failed! You have reached the limit of devices.');
          signal = LOGIN_FAILED;
          sessionStorage.setItem('login_failed', 'true');
          return fetch('/api/logout').catch();
        }
        setText(
          'Login successful! Please return to the previous KomikoAI page… This page will close automatically.',
        );
      })
      .then(() => {
        if (isMobile) {
          const redirectUrl = localStorage.getItem('redirect_url') || '/';
          localStorage.removeItem('redirect_url');
          if (redirectUrl) {
            window.location.href = redirectUrl;
          }
          return;
        }
        if (!window?.opener) {
          const channel = new BroadcastChannel(signal);
          channel.postMessage(signal);
          const redirectUrl = localStorage.getItem('redirect_url');
          localStorage.removeItem('redirect_url');
          if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }
          setTimeout(() => {
            window.close();
          }, 0);
          return;
        }
        window?.opener?.postMessage(signal);
        setTimeout(() => {
          window.close();
        }, 1000);
      });
  }, []);

  return (
    <div>
      <Head>
        <meta name='robots' content='noindex,nofollow'></meta>
      </Head>
      <h1 className='text-lg text-center'>{text}</h1>
    </div>
  );
};

export default Page;
