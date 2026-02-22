/**
 * Shared utilities for tag API handlers
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { ROLES } from '../../_constants.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

// ============ Types ============

export type TagMetaInfo = {
  originalName: string;
  normalizedName: string | null;
};

export type CharacterTagInfo = {
  logo_url: string | null;
  display_name: string | null;
};

// ============ Character Info Cache ============
const characterCache = new Map<string, { data: CharacterTagInfo; timestamp: number }>();
const CHARACTER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CHARACTER_CACHE_SIZE = 500;

function getCharacterFromCache(normalizedName: string): CharacterTagInfo | null {
  const cached = characterCache.get(normalizedName);
  if (cached && Date.now() - cached.timestamp < CHARACTER_CACHE_TTL) {
    return cached.data;
  }
  characterCache.delete(normalizedName);
  return null;
}

function setCharacterCache(normalizedName: string, data: CharacterTagInfo): void {
  if (characterCache.size >= MAX_CHARACTER_CACHE_SIZE) {
    const oldestKey = characterCache.keys().next().value;
    if (oldestKey) {
      characterCache.delete(oldestKey);
    }
  }
  characterCache.set(normalizedName, { data, timestamp: Date.now() });
}

// ============ Tag Name Utilities ============

/**
 * Check if a tag is a character tag (starts with @ or wrapped in <>)
 */
export function isCharacterTag(name?: string | null): boolean {
  if (!name) return false;
  return name.startsWith('@') || (name.startsWith('<') && name.endsWith('>'));
}

/**
 * Normalize tag name for database lookup (removes @ and <> markers)
 * Only processes character tags, returns null for regular tags
 */
export function normalizeTagNameForLookup(name?: string | null): string | null {
  if (!name) return null;
  if (!isCharacterTag(name)) return null;
  const cleaned = name
    .replace(/@/g, '')
    .replace(/^</, '')
    .replace(/>$/, '')
    .trim()
    .toLowerCase();
  return cleaned || null;
}

/**
 * Sanitize tag display name (removes # and @ prefixes)
 */
export function sanitizeTagDisplayName(name?: string | null): string | null {
  if (!name) return null;
  return name.replace(/^#/, '').replace(/@/g, '').trim();
}

// ============ Tag Database Services ============

/**
 * Fetch character info (logo, display name) for character tags
 */
export async function fetchCharacterInfoForTags(
  client: SupabaseClient,
  tagMetas: TagMetaInfo[],
): Promise<Record<string, CharacterTagInfo>> {
  if (!tagMetas.length) {
    return {};
  }

  const infoMap: Record<string, CharacterTagInfo> = {};

  // Deduplicate and filter normalized names
  const normalizedNames = Array.from(
    new Set(
      tagMetas
        .map(meta => meta.normalizedName)
        .filter((name): name is string => !!name),
    ),
  );

  // Check cache first and collect uncached names
  const uncachedNames: string[] = [];
  const cachedData = new Map<string, CharacterTagInfo>();

  for (const name of normalizedNames) {
    const cached = getCharacterFromCache(name);
    if (cached) {
      cachedData.set(name, cached);
    } else {
      uncachedNames.push(name);
    }
  }

  // Only query DB for uncached names
  if (uncachedNames.length > 0) {
    const { data, error } = await client
      .from('CustomCharacters')
      .select('character_uniqid, character_pfp, character_name')
      .in('character_uniqid', uncachedNames);

    if (error) {
      console.error('Error fetching character info:', error);
    } else if (data) {
      // Cache the results
      for (const row of data) {
        if (row.character_uniqid) {
          const charInfo: CharacterTagInfo = {
            logo_url: row.character_pfp || null,
            display_name: row.character_name || null,
          };
          setCharacterCache(row.character_uniqid.toLowerCase(), charInfo);
          cachedData.set(row.character_uniqid.toLowerCase(), charInfo);
        }
      }
      // Cache misses as empty to avoid repeated lookups
      for (const name of uncachedNames) {
        if (!cachedData.has(name)) {
          setCharacterCache(name, { logo_url: null, display_name: null });
        }
      }
    }
  }

  // Build result map
  for (const meta of tagMetas) {
    if (!meta.normalizedName || infoMap[meta.originalName]) continue;
    const charInfo = cachedData.get(meta.normalizedName);
    if (charInfo) {
      infoMap[meta.originalName] = charInfo;
    }
  }

  return infoMap;
}

/**
 * Get tag detail by ID
 */
export async function getTagDetail(
  client: SupabaseClient,
  tagId: number,
): Promise<{ id: number; name: string; is_nsfw: boolean } | null> {
  const { data } = await client
    .from('tags')
    .select('id, name, is_nsfw')
    .eq('id', tagId)
    .single();
  return data || null;
}

// ============ Authentication ============

/**
 * Authentication result
 */
export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  error?: Response;
}

/**
 * Authenticate user from request cookies
 */
export async function authenticateUser(request: Request, required = true): Promise<AuthResult> {
  const cookies = parse(request.headers.get('cookie') || '');
  const sessionToken = cookies['next-auth.session-token'];

  if (!sessionToken) {
    if (required) {
      return {
        authenticated: false,
        error: new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }
    return { authenticated: false };
  }

  try {
    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    if (!token?.id) {
      throw new Error('Invalid token');
    }
    return { authenticated: true, userId: token.id as string };
  } catch {
    if (required) {
      return {
        authenticated: false,
        error: new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }
    return { authenticated: false };
  }
}

/**
 * Check if user is a global admin
 */
export async function isGlobalAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('Error checking user roles:', error);
    return false;
  }

  const roles = data?.map((r) => r.role) || [];
  return roles.includes(ROLES.ADMIN);
}

/**
 * Check if user can manage tag posts (admin or tag moderator)
 */
export async function canManageTag(userId: string, tagId: number): Promise<boolean> {
  // Check if global admin
  if (await isGlobalAdmin(userId)) {
    return true;
  }

  // Check if tag moderator
  const { data: tagModerator, error } = await supabase
    .from('tag_moderators')
    .select('id')
    .eq('user_id', userId)
    .eq('tag_id', tagId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking tag moderator:', error);
    return false;
  }

  return !!tagModerator;
}

/**
 * Check if user is a tag moderator
 */
export async function isTagModerator(userId: string, tagId: number): Promise<boolean> {
  const { data } = await supabase
    .from('tag_moderators')
    .select('id')
    .eq('tag_id', tagId)
    .eq('user_id', userId)
    .single();

  return !!data;
}

/**
 * JSON response helper
 */
export function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Error response helper
 */
export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

