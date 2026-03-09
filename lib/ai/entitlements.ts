import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  defaultType: {
    maxMessagesPerDay: Infinity,
    availableChatModelIds: ['Llama-3.1-Math'],
  },

  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: Infinity,
    availableChatModelIds: ['Llama-3.1-Math'],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: Infinity,
    availableChatModelIds: ['Llama-3.1-Math'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
