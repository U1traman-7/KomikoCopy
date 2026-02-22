import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabase } from '../_utils/index.js';
import { PlanCode, SubscriptionStatus } from '../payment/_constant.js';
import { trackServerEvent } from '../_utils/posthog.js';

// plan_code 小于 1000 用于stripe的订阅
export class CreditModel {
  db: SupabaseClient;
  userId: string;
  subscriptions: {
    id: string;
    credit: number;
    period_expires: number;
    plan: string;
    plan_code: PlanCode;
    status: SubscriptionStatus;
  }[] = [];
  constructor(userId: string) {
    this.db = createSupabase();
    this.userId = userId;
  }
  async getFreeCredit() {
    const { data: freeCredit, error } = await this.db
      .from('User')
      .select('credit')
      .eq('id', this.userId)
      .single();
    if (error) {
      console.error('Error fetching credit:', error);
      return 0;
    }
    // console.log(freeCredit, '*****');
    return freeCredit.credit;
  }
  // TODO: 查询流程可以优化，更新效率比较慢
  async renewSubscriptionCreditMonthly() {
    interface Subscription {
      id: string;
      credit: number;
      expires: number;
      period_expires: number;
      plan: {
        credit: number;
        name?: string;
      };
    }
    const tableName =
      process.env.MODE === 'development'
        ? 'Subscriptions_test'
        : 'Subscriptions';
    const plansTableName =
      process.env.MODE === 'development' ? 'Plans_test' : 'Plans';
    const now = (Date.now() / 1000) | 0;
    const { data } = await this.db
      .from(tableName)
      .select(
        `id,credit,expires,period_expires,plan:${plansTableName}( credit )`,
      )
      .eq('user_id', this.userId)
      .gt('expires', now)
      .lte('period_expires', now)
      .lt('plan_code', 1000)
      .returns<Subscription[]>();

    if (data && data.length > 0) {
      // 使用 Promise.all 来并行处理所有更新
      const updatePromises = data.map(subscription =>
        this.db
          .from(tableName)
          .update({
            period_expires: Math.min(
              subscription.period_expires + 30 * 24 * 60 * 60,
              subscription.expires,
            ),
            credit: subscription.plan.credit,
          })
          .lt('plan_code', 1000)
          .eq('id', subscription.id),
      );

      try {
        await Promise.all(updatePromises);
      } catch (error) {
        console.error('Error renewing subscription credit:', error);
      }
    }
  }
  async getSubscriptionCredit() {
    const tableName =
      process.env.MODE === 'development'
        ? 'Subscriptions_test'
        : 'Subscriptions';
    const now = (Date.now() / 1000) | 0;
    await this.renewSubscriptionCreditMonthly().catch();
    const { data: subCredit, error } = await this.db
      .from(tableName)
      .select('id,credit,expires,period_expires,plan,plan_code,status')
      .eq('user_id', this.userId)
      .gt('expires', now)
      .gt('period_expires', now);
    // console.log(subCredit, '*****');
    if (error) {
      console.error('Error fetching subscription credit:', error);
      return 0;
    }
    this.subscriptions = subCredit;
    return subCredit
      .map(s => s.credit)
      .reduce((acc, credit) => acc + credit, 0);
  }

  /**
   * @deprecated
   */
  async consume(count: number) {
    const totalCredit = await this.get();
    if (totalCredit < count) {
      return false;
    }
    const { data: freeCredit, error } = await this.db
      .from('User')
      .select('credit')
      .eq('id', this.userId)
      .single();
    if (error || !freeCredit) {
      console.error('Error fetching credit:', error);
      return false;
    }
    const { data: subCredit, error: subError } = await this.db
      .from('Subscriptions')
      .select('id,credit, expires')
      .eq('user_id', this.userId)
      .gt('expires', (Date.now() / 1000) | 0);
    if (error || !subCredit) {
      console.error('Error fetching subscription credit:', subError);
      if (freeCredit.credit < count) {
        return false;
      }
      freeCredit.credit -= count;
      const { error } = await this.db
        .from('User')
        .update({ credit: freeCredit.credit })
        .eq('id', this.userId);
      if (!error) {
        return true;
      }
      return false;
    }
    const activeCredit = subCredit.filter(
      s => s.expires > ((Date.now() / 1000) | 0),
    );
    activeCredit.sort((a, b) => a.expires - b.expires);
    const updateSubIds: string[] = [];
    let remainingCount = count;
    activeCredit.forEach(sub => {
      if (remainingCount <= 0) {
        return;
      }
      if (sub.credit > 0) {
        updateSubIds.push(sub.id);
        const usedCredit = Math.min(sub.credit, remainingCount);
        sub.credit -= usedCredit;
        remainingCount -= usedCredit;
      }
    });

    const updateSubs = updateSubIds.map(id => {
      const found = activeCredit.find(c => c.id === id)!;
      return { id, credit: found.credit };
    });
    if (remainingCount > 0) {
      freeCredit.credit -= remainingCount;
    }
    const { error: updateError } = await this.db.rpc('update_credits', {
      subs_updates: updateSubs,
      user_credit: freeCredit.credit,
      user_id: this.userId,
    });

    if (updateError) {
      return false;
    }
    return true;
  }

  async deductCredit(count: number, toolName?: string) {
    const rpcName =
      process.env.MODE === 'development'
        ? 'deduct_credits_test_v2'
        : 'deduct_credits_v2';
    const { error } = await this.db.rpc(rpcName, {
      deduct_credit: count,
      p_user_id: this.userId,
    });
    // console.log(error, '*****');
    if (error) {
      console.error('Error deducting credit:', error);
      return false;
    }
    await trackServerEvent('credit_deducted', this.userId, {
      deducted_credit: count,
      tool_name: toolName,
    }).catch();
    return true;
  }

  async get() {
    const promises = [this.getFreeCredit(), this.getSubscriptionCredit()];
    return Promise.all(promises).then(
      ([freeCredit, subCredit]) => freeCredit + subCredit,
    );
  }

  async updateFreeCredit(count: number) {
    const { error } = await this.db
      .from('User')
      .update({ credit: count })
      .eq('id', this.userId);
    if (error) {
      console.error('Error updating credit:', error);
      return false;
    }
    return true;
  }

  async canConsume(count: number) {
    const totalCredit = await this.get();
    return totalCredit >= count;
  }
}
