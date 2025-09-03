import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  defaultType: {
    maxMessagesPerDay: 10,
    availableChatModelIds: ['Llama-3.1-Math', 'Llama-3.3'],
  },

  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: ['Llama-3.1-Math', 'Qwen-2.5', 'Llama-3.3'],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['Llama-3.1-Math', 'Qwen-2.5', 'Llama-3.3', 'Gemini-1.5'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
