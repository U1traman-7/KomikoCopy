import { handler as falHandler } from '@fal-ai/server-proxy/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';

async function getAuthUserIdFromNextAPI(req: NextApiRequest): Promise<string | null> {
  const cookies = parse(req.headers.cookie || '');
  const sessionToken = cookies['next-auth.session-token'];

  if (!sessionToken) {
    return null;
  }

  try {
    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET || (() => {
        throw new Error('NEXTAUTH_SECRET environment variable is required');
      })(),
    });
    if (!token || typeof token.id !== 'string') {
      return null;
    }
    return token.id as string;
  } catch (error) {
    console.error('Error decoding session token:', error);
    return null;
  }
}

export default async function authenticatedHandler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = `fal_proxy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] FAL proxy request started`);
    
    // Extract user ID from the request using NextAPI compatible function
    const userId = await getAuthUserIdFromNextAPI(req);

    if (!userId) {
      console.log(`[${requestId}] Unauthorized request`);
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to use this service'
      });
    }

    console.log(`[${requestId}] User authenticated: ${userId}`);
    
    // Call the original FAL handler
    return await falHandler(req, res);
  } catch (error: any) {
    console.error(`[${requestId}] Error in FAL proxy:`, {
      message: error?.message,
      stack: error?.stack,
      error,
    });
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process FAL request'
    });
  }
}
