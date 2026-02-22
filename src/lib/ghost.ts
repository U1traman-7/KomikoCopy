import GhostContentAPI from '@tryghost/content-api';

// Ghost类型定义
export interface GhostPost {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  html?: string;
  comment_id?: string;
  feature_image?: string;
  featured: boolean;
  visibility: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  custom_excerpt?: string;
  codeinjection_head?: string;
  codeinjection_foot?: string;
  custom_template?: string;
  canonical_url?: string;
  tags?: GhostTag[];
  authors?: GhostAuthor[];
  primary_author?: GhostAuthor;
  primary_tag?: GhostTag;
  url: string;
  excerpt: string;
  reading_time: number;
  access: boolean;
  og_image?: string;
  og_title?: string;
  og_description?: string;
  twitter_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  meta_title?: string;
  meta_description?: string;
}

export interface GhostAuthor {
  id: string;
  name: string;
  slug: string;
  profile_image?: string;
  cover_image?: string;
  bio?: string;
  website?: string;
  location?: string;
  facebook?: string;
  twitter?: string;
  meta_title?: string;
  meta_description?: string;
  url: string;
}

export interface GhostTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  feature_image?: string;
  visibility: string;
  og_image?: string;
  og_title?: string;
  og_description?: string;
  twitter_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  accent_color?: string;
  url: string;
}

// 延迟初始化Ghost Content API客户端
let api: GhostContentAPI | null = null;

function getGhostAPI(): GhostContentAPI | null {
  if (!api) {
    // 只在服务器端初始化
    if (typeof window !== 'undefined') {
      console.log('Ghost API should only be used on the server side');
      return null;
    }
    
    // 如果设置了 DISABLE_GHOST 环境变量，直接返回 null
    if (process.env.DISABLE_GHOST === 'true') {
      console.log('Ghost is disabled via DISABLE_GHOST environment variable');
      return null;
    }
    
    const url = process.env.GHOST_API_URL;
    const key = process.env.GHOST_CONTENT_API_KEY;
    
    if (!url || !key) {
      console.log('Ghost API configuration missing. Please set GHOST_API_URL and GHOST_CONTENT_API_KEY in your environment variables.');
      return null;
    }

    try {
      api = new GhostContentAPI({
        url,
        key,
        version: 'v5.0'
      });
    } catch (error) {
      console.error('Error initializing Ghost API:', error);
      return null;
    }
  }
  
  return api;
}

// 获取所有文章
export async function getGhostPosts(limit = 15): Promise<GhostPost[]> {
  try {
    const ghostAPI = getGhostAPI();
    if (!ghostAPI) {
      return [];
    }
    
    const posts = await ghostAPI.posts.browse({
      limit,
      include: ['tags', 'authors'],
      filter: 'visibility:public+status:published',
      order: 'published_at DESC'
    });
    return posts;
  } catch (error) {
    console.error('Error fetching Ghost posts:', error);
    return [];
  }
}

// 根据slug获取单篇文章
export async function getGhostPostBySlug(slug: string): Promise<GhostPost | null> {
  try {
    const ghostAPI = getGhostAPI();
    if (!ghostAPI) {
      return null;
    }
    
    const posts = await ghostAPI.posts.read(
      { slug },
      { include: ['tags', 'authors'] }
    );
    return posts;
  } catch (error) {
    console.error('Error fetching Ghost post by slug:', error);
    return null;
  }
}

// 转换Ghost文章为本地文章格式
export function transformGhostPost(ghostPost: GhostPost) {
  return {
    _id: ghostPost.id,
    title: ghostPost.title,
    description: ghostPost.custom_excerpt || ghostPost.excerpt,
    date: ghostPost.published_at,
    published: true,
    image: ghostPost.feature_image || '',
    authors: ghostPost.authors?.map(author => author.slug) || [],
    slug: `/blog/${ghostPost.slug}`,
    content: ghostPost.html || '',
    isGhostPost: true,
    original_url: ghostPost.url,
    reading_time: ghostPost.reading_time || 0,
    tags: ghostPost.tags?.map(tag => tag.name) || [],
    meta_title: ghostPost.meta_title,
    meta_description: ghostPost.meta_description,
    og_image: ghostPost.og_image,
    og_title: ghostPost.og_title,
    og_description: ghostPost.og_description,
    twitter_image: ghostPost.twitter_image,
    twitter_title: ghostPost.twitter_title,
    twitter_description: ghostPost.twitter_description,
  };
}

// 处理图片URL，确保使用正确的域名
export function processImageUrl(url?: string): string {
  if (!url) return '';
  
  // 如果是相对路径，添加Ghost实例的域名
  if (url.startsWith('/')) {
    const ghostUrl = process.env.GHOST_API_URL || process.env.NEXT_PUBLIC_GHOST_API_URL;
    return `${ghostUrl}${url}`;
  }
  
  return url;
} 