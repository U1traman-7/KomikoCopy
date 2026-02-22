import NextAuth from 'next-auth';
import { authOptions } from '@/utils/auth/index';

export default NextAuth(authOptions);
