/* eslint-disable */
// Create icon URL from CDN
const createIconUrl = (iconName: string, variant: 'color' | 'mono' = 'color') =>
  `https://unpkg.com/@lobehub/icons-static-svg@latest/icons/${iconName}.svg`;

// Create icon objects with URL
const OpenAI = createIconUrl('openai');
const Claude = createIconUrl('claude');
const Google = createIconUrl('google');
const Minimax = createIconUrl('minimax');
const Vidu = createIconUrl('vidu');
const Luma = createIconUrl('luma');
const Pika = createIconUrl('pika');
const Flux = createIconUrl('flux');
const Hunyuan = createIconUrl('hunyuan');
const Ideogram = createIconUrl('ideogram');
const Hedra = createIconUrl('hedra');
const KusaPics = createIconUrl('kusa');

// Local icons
const Gemini = '/images/icons/gemini-color.svg';
const AniSora = '/images/icons/anisora.webp';
const Veo = '/images/icons/veo.svg';
const Magi1 = '/images/icons/magi.jpg';
const Kling = '/images/icons/kling.svg';
const HailuoAI = '/images/icons/hailuo.svg';
const Ray = '/images/icons/ray.svg';
const PixVerse = '/images/icons/pixverse.svg';
const ProductHunt = '/images/icons/producthunt.jpeg';

export const partners = [
  { name: 'GPT-4o', Component: OpenAI, type: 'ai' },
  { name: 'Flux', Component: Flux, type: 'ai' },
  { name: 'Gemini', Component: Gemini, type: 'ai' },
  { name: 'Kling', Component: Kling, type: 'ai' },
  { name: 'Hailuo AI', Component: HailuoAI, type: 'ai' },
  { name: 'Vidu', Component: Vidu, type: 'ai' },
  { name: 'Google Veo', Component: Veo, type: 'ai' },
  { name: 'Luma Ray', Component: Ray, type: 'ai' },
  { name: 'PixVerse AI', Component: PixVerse, type: 'ai' },
  { name: 'AniSora', Component: AniSora, type: 'ai' },
  { name: 'Magi-1', Component: Magi1, type: 'ai' },
  { name: 'Hedra', Component: Hedra, type: 'ai' },
  {
    name: 'KusaPics',
    Component: '/images/kusa.webp',
    type: 'ai',
  },
  { name: '', Component: ProductHunt, type: 'ai' },
  {
    name: 'A16Z Speedrun',
    Component: null,
    type: 'investor',
    logo: '/images/inventors/a16z.svg',
    link: 'https://speedrun.a16z.com/',
  },
  {
    name: 'Goodwater Capital',
    Component: null,
    type: 'investor',
    logo: '/images/inventors/goodwater.jpg',
    link: 'https://goodwatercap.com',
  },
  {
    name: 'Informed Ventures',
    Component: null,
    type: 'investor',
    logo: '/images/inventors/gsr.png',
    link: 'https://informedventures.com/',
  },
  {
    name: 'The VR Fund',
    Component: null,
    type: 'investor',
    logo: '/images/inventors/vr.png',
    link: 'https://thevrfund.com',
  },
  {
    name: 'Konghu Capital',
    Component: null,
    type: 'investor',
    logo: '/images/inventors/konghu.png',
    link: 'https://konghu.capital/',
  },
  {
    name: 'Taihill Venture',
    Component: null,
    type: 'investor',
    logo: '/images/inventors/taihill.png',
    link: 'https://taihill.vc/',
  },
];

// Duplicate for infinite scroll effect
export const duplicatedPartners = [...partners, ...partners];

// CSS for infinite scroll animation
export const scrollAnimation = `
  @keyframes scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-scroll {
    animation: scroll 30s linear infinite;
  }
`;
