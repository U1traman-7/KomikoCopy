import { Plans } from '../constants';
import { get, post } from './request';
import { APIResponse } from './type';

interface Profile {
  id: string;
  name: string;
  email: string;
  credit: number;
  plan: Plans;
  plan_codes: number[];
}

export const fetchProfile = () =>
  post<Profile & { error?: string }>('/api/fetchProfile', {
    method: 'profile',
  });

interface Invitation {
  user_name?: string;
  email: string;
}
export const fetchInvitations = () =>
  get<APIResponse<Invitation[]>>('/api/invitations', {});

export const fetchFollowerInfo = (uniqId?: string) =>
  get<APIResponse<{ follower_count: number; following_count: number }>>(
    '/api/followerInfo',
    { uniqId },
  );

export const dailyCheckInStatus = () =>
  get<APIResponse<{ date_checkin: string }>>('/api/dailyCheckIn');

export const getUnreadMessageCount = () =>
  get<APIResponse<{ count: number }>>('/api/message?action=count');
