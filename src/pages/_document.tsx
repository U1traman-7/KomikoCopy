import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang='en'>
        <Head>
          {/* FOUC Prevention: Apply theme class before page renders */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('komiko-theme');
                  if (!theme) theme = 'light';
                  if (theme === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  // Apply theme class to html
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;

                  // Apply NextUI theme class to html (body not available yet in head)
                  var nextuiTheme = theme === 'dark' ? 'caffelabs-dark' : 'caffelabs';
                  document.documentElement.classList.add(nextuiTheme);
                  document.documentElement.setAttribute('data-theme', nextuiTheme);
                } catch (e) {}
              })();
            `,
            }}
          />
          {/* PWA meta tags */}
          <meta name='application-name' content='KomikoAI' />
          <meta name='apple-mobile-web-app-capable' content='yes' />
          <meta
            name='apple-mobile-web-app-status-bar-style'
            content='light-content'
          />
          <meta name='apple-mobile-web-app-title' content='KomikoAI' />
          <meta name='description' content='Create anime and comics with AI' />
          <meta name='format-detection' content='telephone=no' />
          <meta name='mobile-web-app-capable' content='yes' />
          <meta
            name='msapplication-config'
            content='/images/favicons/browserconfig.xml'
          />
          <meta name='msapplication-TileColor' content='#2B5797' />
          <meta name='msapplication-tap-highlight' content='no' />
          <meta name='theme-color' content='#ffffff' />

          {/* Apple touch icons */}
          <link
            rel='apple-touch-icon'
            href='/images/favicons/apple-icon-152x152.png'
          />
          <link
            rel='apple-touch-icon'
            sizes='57x57'
            href='/images/favicons/apple-icon-57x57.png'
          />
          <link
            rel='apple-touch-icon'
            sizes='60x60'
            href='/images/favicons/apple-icon-60x60.png'
          />
          <link
            rel='apple-touch-icon'
            sizes='72x72'
            href='/images/favicons/apple-icon-72x72.png'
          />
          <link
            rel='apple-touch-icon'
            sizes='76x76'
            href='/images/favicons/apple-icon-76x76.png'
          />
          <link
            rel='apple-touch-icon'
            sizes='114x114'
            href='/images/favicons/apple-icon-114x114.png'
          />
          <link
            rel='apple-touch-icon'
            sizes='120x120'
            href='/images/favicons/apple-icon-120x120.png'
          />
          <link
            rel='apple-touch-icon'
            sizes='144x144'
            href='/images/favicons/apple-icon-144x144.png'
          />
          <link
            rel='apple-touch-icon'
            sizes='152x152'
            href='/images/favicons/apple-icon-152x152.png'
          />
          <link
            rel='apple-touch-icon'
            sizes='180x180'
            href='/images/favicons/apple-icon-180x180.png'
          />

          {/* Favicon */}
          <link
            rel='icon'
            type='image/png'
            sizes='32x32'
            href='/images/favicons/favicon-32x32.png'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='16x16'
            href='/images/favicons/favicon-16x16.png'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='96x96'
            href='/images/favicons/favicon-96x96.png'
          />
          <link rel='manifest' href='/manifest.json' />
          <link rel='shortcut icon' href='/images/favicons/favicon.ico' />

          {/* PWA splash screens for iOS */}
          <meta name='apple-mobile-web-app-capable' content='yes' />
          <meta
            name='apple-mobile-web-app-status-bar-style'
            content='light-content'
          />

          {/* Register service worker - only in production */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
              if ('serviceWorker' in navigator && '${process.env.NODE_ENV}' === 'production') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              } else if ('serviceWorker' in navigator && '${process.env.NODE_ENV}' === 'development') {
                // In development, unregister any existing service workers
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                    console.log('SW unregistered in development:', registration);
                  }
                });
              }
            `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
