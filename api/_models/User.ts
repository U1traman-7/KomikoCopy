// import { createSupabase } from '../_utils/index.js';
import { createClient } from '@supabase/supabase-js';
import Roles from './roles.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface UserData {
  id: string;
  user_name: string;
  email: string;
}
class User {
  userId: string;
  user: UserData | null = null;
  roles: Roles | null = null;
  subscription:
    | { plan_code: number; expires: number; period_expires: number }[]
    | null = null;
  constructor(userId: string) {
    this.userId = userId;
  }

  async init() {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', this.userId)
      .limit(1)
      .single();
    if (error || !data) {
      console.error('Error getting user:', error);
      return false;
    }
    this.user = data;
    return true;
  }

  async isAdmin() {
    if (this.roles) {
      return this.roles.isAdmin();
    }
    this.roles = new Roles(this.userId);
    await this.roles.getRoles();
    return this.roles.isAdmin();
  }
  async isSubscribed() {
    if (this.subscription) {
      // return this.subscription.length > 0;
      return this.subscription.filter(item => item.plan_code < 1000).length > 0;
    }
    const SubscribeTableName =
      process.env.NODE_ENV === 'production'
        ? 'Subscriptions'
        : 'Subscriptions_test';
    const now = (Date.now() / 1000) | 0;
    const { data, error } = await supabase
      .from(SubscribeTableName)
      .select('user_id, expires, period_expires, plan_code')
      .eq('user_id', this.userId)
      .gt('expires', now)
      .gt('period_expires', now);
    if (error) {
      console.error('Error getting subscription:', error);
      return false;
    }
    this.subscription = data;
    return data.filter(item => item.plan_code < 1000).length > 0;
  }
}

export default User;
