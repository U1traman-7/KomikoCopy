// @ts-check
import { fileURLToPath } from 'url';
import path from 'path';
import { LANGUAGES } from './language.mjs';
import analyzer from '@next/bundle-analyzer';
import { PLAYGROUND_TO_EFFECTS_MAP } from './src/config/playgroundToEffectsMapping.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'canvas',
      'sharp',
      'konva',
      'react-konva',
      'three',
    ],
    optimizePackageImports: ['lucide-react', 'date-fns'],

    // 正确的 outputFileTracing 配置
    outputFileTracingIncludes: {
      // 只包含必要的文件
      '/api/**/*': ['./node_modules/@supabase/**/*'],
    },
    outputFileTracingExcludes: {
      // 为每个有问题的页面单独配置
      '/ai-anime-generator/[variant]': [
        'node_modules/canvas/**/*',
        'node_modules/sharp/**/*',
        'node_modules/three/**/*',
        'node_modules/konva/**/*',
        'node_modules/react-konva/**/*',
      ],
      '/generate': [
        'node_modules/canvas/**/*',
        'node_modules/sharp/**/*',
        'node_modules/three/**/*',
        'node_modules/konva/**/*',
        'node_modules/react-konva/**/*',
      ],
      '/oc-maker/[variant]': [
        'node_modules/canvas/**/*',
        'node_modules/sharp/**/*',
        'node_modules/three/**/*',
        'node_modules/konva/**/*',
        'node_modules/react-konva/**/*',
      ],
      '/world/play': [
        'node_modules/canvas/**/*',
        'node_modules/sharp/**/*',
        'node_modules/three/**/*',
        'node_modules/konva/**/*',
        'node_modules/react-konva/**/*',
      ],
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dihulvhqvmoxyhkxovko.supabase.co',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'collov.ai',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'www.mathgptpro.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'www.altpage.ai',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'cdn.ezsite.ai',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'cdn.newoaks.ai',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'cdn.prod.website-files.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'www.vidau.ai',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'bika.ai',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'static.ghost.org',
        port: '',
      },
      {
        protocol: 'https',
        hostname: '*.ghost.io',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'komiko.app',
        port: '',
      },
    ],
  },

  // 保持你原有的 redirects 配置
  async redirects() {
    // 只在生产环境启用重定向
    const isProduction =
      process.env.NODE_ENV === 'production' &&
      process.env.VERCEL_ENV === 'production';

    // 动态生成 playground 重定向规则
    const playgroundRedirects = Object.entries(PLAYGROUND_TO_EFFECTS_MAP).map(
      ([variantKey, effectsSlug]) => ({
        source: `/playground/${variantKey}`,
        destination: `/effects/${effectsSlug}`,
        permanent: true,
      }),
    );

    if (!isProduction) {
      return [
        // 开发环境和预览环境只保留路径重定向，不做域名重定向
        // Redirect /create/generate to /ai-comic-generator
        {
          source: '/create/generate',
          destination: '/ai-comic-generator',
          permanent: true,
        },
        // Redirect any language version of character/create to oc-maker
        {
          source:
            '/:locale(en|ja|id|hi|zh-CN|zh-TW|ko|es|fr|de|pt|ru|th|vi)/character/create',
          destination: '/:locale/oc-maker',
          permanent: true,
        },
        // Redirect any language version of create/generate to ai-comic-generator
        {
          source:
            '/:locale(en|ja|id|hi|zh-CN|zh-TW|ko|es|fr|de|pt|ru|th|vi)/create/generate',
          destination: '/:locale/ai-comic-generator',
          permanent: true,
        },
        {
          source: '/photo-to-anime',
          destination: '/playground/photo-to-anime',
          permanent: true,
        },
        {
          source: '/text-to-video',
          destination: '/image-animation-generator/text-to-video',
          permanent: true,
        },
        // Redirect old templates page to /effects
        {
          source: '/templates',
          destination: '/effects',
          permanent: true,
        },
        // Redirect old filter pages to new effects pages
        {
          source: '/filter/ai-character-sheet-generator',
          destination: '/effects/character-sheet-image',
          permanent: true,
        },
        {
          source: '/filter/ai-action-figure-generator',
          destination: '/effects/action-figure-image',
          permanent: true,
        },
        {
          source: '/filter/ai-doll-generator',
          destination: '/effects/barbie-box-image',
          permanent: true,
        },
        {
          source: '/filter/anime-ai-filter',
          destination: '/ai-anime-generator',
          permanent: true,
        },
        {
          source: '/filter/studio-ghibli-ai-generator',
          destination: '/effects/ghibli-anime-image',
          permanent: true,
        },
        {
          source: '/filter/studio-ghibli-filter',
          destination: '/effects/ghibli-anime-image',
          permanent: true,
        },
        // Redirect playground pages to effects pages
        ...playgroundRedirects,
      ];
    }

    return [
      // 生产环境：包含所有重定向规则
      // Redirect app.komiko.app to komiko.app
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'app.komiko.app',
          },
        ],
        destination: 'https://komiko.app/:path*',
        permanent: true,
      },
      // Redirect www.komiko.app to komiko.app
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.komiko.app',
          },
        ],
        destination: 'https://komiko.app/:path*',
        permanent: true,
      },
      // HTTP to HTTPS redirect (仅生产环境的主域名)
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
          {
            type: 'host',
            value: 'komiko.app',
          },
        ],
        destination: 'https://komiko.app/:path*',
        permanent: true,
      },
      // Redirect /create/generate to /ai-comic-generator
      {
        source: '/create/generate',
        destination: '/ai-comic-generator',
        permanent: true,
      },
      // Redirect any language version of character/create to oc-maker
      {
        source:
          '/:locale(en|ja|id|hi|zh-CN|zh-TW|ko|es|fr|de|pt|ru|th|vi)/character/create',
        destination: '/:locale/oc-maker',
        permanent: true,
      },
      // Redirect any language version of create/generate to ai-comic-generator
      {
        source:
          '/:locale(en|ja|id|hi|zh-CN|zh-TW|ko|es|fr|de|pt|ru|th|vi)/create/generate',
        destination: '/:locale/ai-comic-generator',
        permanent: true,
      },
      {
        source: '/photo-to-anime',
        destination: '/playground/photo-to-anime',
        permanent: true,
      },
      // Redirect old video tool pages to variant pages
      {
        source: '/text-to-video',
        destination: '/image-animation-generator/text-to-video',
        permanent: true,
      },
      // Redirect old templates page to /effects
      {
        source: '/templates',
        destination: '/effects',
        permanent: true,
      },
      // Redirect old filter pages to new effects pages
      {
        source: '/filter/ai-character-sheet-generator',
        destination: '/effects/character-sheet-image',
        permanent: true,
      },
      {
        source: '/filter/ai-action-figure-generator',
        destination: '/effects/action-figure-image',
        permanent: true,
      },
      {
        source: '/filter/ai-doll-generator',
        destination: '/effects/barbie-box-image',
        permanent: true,
      },
      {
        source: '/filter/anime-ai-filter',
        destination: '/ai-anime-generator',
        permanent: true,
      },
      {
        source: '/filter/studio-ghibli-ai-generator',
        destination: '/effects/ghibli-anime-image',
        permanent: true,
      },
      {
        source: '/filter/studio-ghibli-filter',
        destination: '/effects/ghibli-anime-image',
        permanent: true,
      },
      // Redirect playground pages to effects pages
      ...playgroundRedirects,
    ];
  },

  // 保持你原有的 headers 配置
  async headers() {
    return [
      {
        // matching all API routes
        source: '/:path*', // Match all routes
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Replace "*" with your domain for security if needed
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, next-router-state-tree, next-router-prefetch, next-url, rsc',
          },
        ],
      },
      {
        source: '/:all*(jpg|jpeg|png|gif|webp|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'X-Robots-Tag',
            value: 'index,follow',
          },
        ],
      },
      {
        source: '/world/play',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index,follow,max-snippet:-1,max-image-preview:large',
          },
        ],
      },
      // PWA Security Headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.trackdesk.com https://www.googletagmanager.com https://accounts.google.com https://platform.twitter.com https://api.producthunt.com; connect-src 'self' https://cdn.trackdesk.com https://www.googletagmanager.com https://accounts.google.com https://platform.twitter.com https://api.producthunt.com https://komiko.app https://komikoai.com https://*.komiko.app https://*.komikoai.com;",
          },
        ],
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: true,

  // 保持你原有的 rewrites 配置
  async rewrites() {
    return [
      { source: '/v2/api/:path*', destination: '/api/:path*' },
      { source: '/robots.txt', destination: '/api/robots.txt' },
      { source: '/sitemap.xml', destination: '/api/sitemap.xml' },
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
      {
        source: '/ph-badge',
        has: [
          { type: 'query', key: 'post_id' },
          { type: 'query', key: 'theme', value: '(.*)' },
        ],
        destination:
          'https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=:post_id&theme=:theme',
      },
      // 兜底：没带参数就用默认
      {
        source: '/ph-badge',
        destination:
          'https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1001073&theme=light',
      },
    ];
  },

  skipTrailingSlashRedirect: true,

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      contentlayer: path.resolve(__dirname, '.contentlayer'),
    };

    if (isServer) {
      // 1. 更强力的 externals 配置
      const existingExternals = config.externals || [];
      config.externals = [
        ...existingExternals,
        // 函数形式更可靠
        function (context, request, callback) {
          // 排除大型依赖
          if (/^(canvas|sharp|konva|react-konva|three)$/.test(request)) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
        // 对象形式作为备用
        {
          canvas: 'commonjs canvas',
          sharp: 'commonjs sharp',
          konva: 'commonjs konva',
          'react-konva': 'commonjs react-konva',
          three: 'commonjs three',
        },
      ];

      // 2. 添加 resolve.fallback
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        sharp: false,
        konva: false,
        'react-konva': false,
        three: false,
      };

      // 3. 使用 IgnorePlugin 作为最后手段
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(canvas|sharp|konva|react-konva|three)$/,
        }),
      );
    }

    // 客户端优化
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // 大型依赖分离
            heavyLibs: {
              test: /[\\/]node_modules[\\/](canvas|konva|react-konva|three)[\\/]/,
              name: 'heavy-libs',
              chunks: 'all',
              priority: 100,
              enforce: true,
            },
            'pose-editor': {
              test: /[\\/]src[\\/]Components[\\/]PoseEditor[\\/]/,
              name: 'pose-editor',
              chunks: 'all',
              priority: 80,
              enforce: true,
            },
            'inf-canva': {
              test: /[\\/]src[\\/]Components[\\/]InfCanva[\\/]/,
              name: 'inf-canva',
              chunks: 'all',
              priority: 70,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },

  i18n: {
    defaultLocale: 'en',
    locales: LANGUAGES,
    localeDetection: false,
    ...(process.env.MODE === 'production'
      ? {
          domains: [
            {
              domain: 'komiko.app',
              defaultLocale: 'en',
            },
          ],
        }
      : {}),
  },
};

const withBundleAnalyzer = analyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
