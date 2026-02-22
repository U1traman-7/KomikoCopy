import { ROLES } from '../_constants.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

class Roles {
  userId: string;
  roles: number[] = [];
  constructor(userId: string) {
    this.userId = userId;
  }

  async getRoles() {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', this.userId);
    if (error) {
      // throw error;
      console.error('Error getting roles:', error);
      return [];
    }
    this.roles = data?.map(item => item.role) || [];
    return this.roles;
  }

  isAdmin() {
    return this.roles.includes(ROLES.ADMIN);
  }
}

export default Roles;
